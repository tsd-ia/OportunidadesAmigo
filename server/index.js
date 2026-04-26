// Servidor Express - Backend OportunidadesAmigo
// Integra la API real de MercadoPublico.cl y gestiona datos locales
import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, 'data');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const MP_TICKET = process.env.MERCADOPUBLICO_TICKET || '';
const MP_BASE = 'https://api.mercadopublico.cl/servicios/v1/publico';

// ============================================================
// UTILIDADES
// ============================================================

// Leer/escribir JSON local
function readJSON(filename) {
  const path = join(DATA_DIR, filename);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function writeJSON(filename, data) {
  const path = join(DATA_DIR, filename);
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
}

// Fetch con timeout
async function fetchWithTimeout(url, timeout = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// Mapear regiones de MercadoPublico a nombres legibles
const regionMap = {
  1: 'Tarapacá', 2: 'Antofagasta', 3: 'Atacama', 4: 'Coquimbo',
  5: 'Valparaíso', 6: "O'Higgins", 7: 'Maule', 8: 'Biobío',
  9: 'Araucanía', 10: 'Los Lagos', 11: 'Aysén', 12: 'Magallanes',
  13: 'Metropolitana', 14: 'Los Ríos', 15: 'Arica y Parinacota', 16: 'Ñuble',
};

// Categorizar licitación por palabras clave
function categorizeOpportunity(name, desc) {
  const text = `${name} ${desc}`.toLowerCase();
  // Construcción
  const constructionKeys = ['construcci', 'remodelaci', 'ampliaci', 'obra', 'edifici', 'paviment',
    'camino', 'vial', 'puente', 'techado', 'techo', 'muro', 'demolici', 'hormig',
    'instalaci', 'sanitari', 'electri', 'pintura', 'carpinter', 'albañil', 'excavaci'];
  // Programación
  const progKeys = ['software', 'aplicaci', 'sistema', 'web', 'plataforma', 'desarrollo',
    'programaci', 'digital', 'app ', 'tecnolog', 'informát', 'computaci', 'bot ', 'automat'];
  // Maquinaria
  const machKeys = ['arriendo', 'maquinaria', 'excavadora', 'retroexcavadora', 'grúa', 'camión',
    'equipo', 'herramienta', 'andamio', 'generador', 'compresor'];

  if (constructionKeys.some(k => text.includes(k))) return { category: 'construction', sub: 'general' };
  if (progKeys.some(k => text.includes(k))) return { category: 'programming', sub: 'general' };
  if (machKeys.some(k => text.includes(k))) return { category: 'machinery', sub: 'general' };
  return { category: 'other', sub: 'general' };
}

// Formatear fecha como ddmmaaaa para la API
function formatDateForAPI(date) {
  const d = date || new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}${mm}${yyyy}`;
}

// Obtener detalle de una licitación específica
async function fetchLicitacionDetail(codigo) {
  try {
    const url = `${MP_BASE}/licitaciones.json?ticket=${MP_TICKET}&codigo=${codigo}`;
    const response = await fetchWithTimeout(url, 10000);
    const data = await response.json();
    if (data.Listado && data.Listado.length > 0) return data.Listado[0];
    return null;
  } catch {
    return null;
  }
}

// Transformar licitación de MercadoPublico al formato de nuestra app
function transformLicitacion(lic) {
  const cat = categorizeOpportunity(lic.Nombre || '', lic.Descripcion || '');
  const budget = lic.MontoEstimado || 0;

  return {
    id: lic.CodigoExterno || lic.Codigo || `mp-${Date.now()}`,
    title: lic.Nombre || 'Sin título',
    source: 'MercadoPublico',
    type: lic.Tipo === 'SE' ? 'compra_agil' : 'licitacion_publica',
    category: cat.category,
    subCategory: cat.sub,
    region: regionMap[lic.RegionUnidad] || 'Desconocida',
    comuna: lic.ComunaUnidad || '',
    budget: budget,
    currency: 'CLP',
    deadline: lic.FechaCierre || '',
    publishDate: lic.FechaPublicacion || '',
    status: mapStatus(lic.CodigoEstado),
    requiresRegistro: true,
    requiresGarantia: budget > 10000000,
    garantiaAmount: budget > 10000000 ? Math.round(budget * 0.05) : 0,
    requirements: extractRequirements(lic),
    description: lic.Descripcion || '',
    url: `https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?idlicitacion=${lic.CodigoExterno}`,
    entity: lic.NombreOrganismo || lic.Organismo || '',
    matchScore: 0,
    matchReasons: [],
    isOutsideRubro: false,
  };
}

function mapStatus(code) {
  const map = { 5: 'open', 6: 'open', 7: 'closed', 8: 'awarded', 18: 'revoked' };
  return map[code] || 'open';
}

function extractRequirements(lic) {
  const reqs = [];
  if (lic.MontoEstimado > 50000000) reqs.push('Estados financieros');
  if (lic.MontoEstimado > 10000000) reqs.push('Garantía de seriedad');
  reqs.push('Inscripción ChileProveedores');
  return reqs;
}

// Calcular match score entre oportunidad y perfil
function calculateMatch(opp, profile) {
  let score = 50; // base
  const reasons = [];

  // Match por categoría
  if (profile.areas && profile.areas[opp.category] && profile.areas[opp.category].enabled) {
    score += 25;
    reasons.push(`Área de ${opp.category === 'construction' ? 'construcción' : opp.category === 'programming' ? 'programación' : 'maquinaria'} habilitada`);
  } else if (opp.category === 'other') {
    score -= 10;
    reasons.push('Fuera de tu rubro principal');
    opp.isOutsideRubro = true;
  }

  // Match por región
  if (profile.restrictions && profile.restrictions.workingRegions) {
    if (profile.restrictions.workingRegions.includes(opp.region)) {
      score += 15;
      reasons.push('Región configurada');
    } else {
      score -= 10;
    }
  }

  // Match por presupuesto
  if (profile.restrictions && profile.restrictions.maxBudget > 0) {
    if (opp.budget <= profile.restrictions.maxBudget) {
      score += 10;
      reasons.push('Presupuesto dentro del rango');
    }
  }

  // Sin requisitos de garantía
  if (!opp.requiresGarantia) {
    reasons.push('Sin requisitos de garantía');
  }

  opp.matchScore = Math.min(100, Math.max(0, score));
  opp.matchReasons = reasons;
  return opp;
}

// ============================================================
// RUTAS API
// ============================================================

// --- Estado del servidor ---
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    version: '1.0.0',
    mercadopublico: MP_TICKET ? 'configured' : 'needs_key',
    n8n: process.env.N8N_URL || 'not_configured',
    timestamp: new Date().toISOString(),
  });
});

// --- PERFIL ---
app.get('/api/profile', (req, res) => {
  const profile = readJSON('profile.json');
  if (!profile) return res.json({ exists: false, data: null });
  res.json({ exists: true, data: profile });
});

app.post('/api/profile', (req, res) => {
  writeJSON('profile.json', req.body);
  res.json({ success: true, message: 'Perfil guardado' });
});

// --- BUSCAR EN MERCADOPUBLICO (API REAL) ---
app.get('/api/mercadopublico/search', async (req, res) => {
  if (!MP_TICKET) {
    return res.status(400).json({
      error: 'API key no configurada',
      message: 'Necesitas obtener un ticket en https://api.mercadopublico.cl y configurarlo en .env como MERCADOPUBLICO_TICKET',
    });
  }

  try {
    const { keyword, estado, fecha, region } = req.query;
    let url = `${MP_BASE}/licitaciones.json?ticket=${MP_TICKET}`;

    if (keyword) url += `&palabra_clave=${encodeURIComponent(keyword)}`;
    if (estado) url += `&estado=${estado}`;
    // Si no se pasa fecha ni keyword, buscar por fecha de hoy para obtener resultados
    if (fecha) {
      url += `&fecha=${fecha}`;
    } else if (!keyword) {
      url += `&fecha=${formatDateForAPI()}`;
    }

    console.log(`[MercadoPublico] Buscando: ${keyword || 'por fecha'} | URL: ${url.replace(MP_TICKET, '***')}`);
    const response = await fetchWithTimeout(url);
    const data = await response.json();

    if (!data.Listado) {
      return res.json({ results: [], total: 0, source: 'mercadopublico', apiResponse: data });
    }

    console.log(`[MercadoPublico] ${data.Cantidad} resultados encontrados`);

    const profile = readJSON('profile.json');
    let results = data.Listado.map(transformLicitacion);

    // Filtrar por región si se especifica
    if (region) {
      results = results.filter(r => r.region.toLowerCase().includes(region.toLowerCase()));
    }

    // Calcular match con perfil
    if (profile) {
      results = results.map(r => calculateMatch(r, profile));
    }

    // Ordenar por match
    results.sort((a, b) => b.matchScore - a.matchScore);

    res.json({ results, total: results.length, source: 'mercadopublico', realData: true });
  } catch (err) {
    console.error('[MercadoPublico] Error:', err.message);
    res.status(500).json({ error: 'Error al consultar MercadoPublico', details: err.message });
  }
});

// --- DETALLE DE LICITACIÓN ---
app.get('/api/mercadopublico/detail/:codigo', async (req, res) => {
  if (!MP_TICKET) return res.status(400).json({ error: 'API key no configurada' });
  try {
    const detail = await fetchLicitacionDetail(req.params.codigo);
    if (!detail) return res.status(404).json({ error: 'Licitación no encontrada' });
    res.json({ result: transformLicitacion(detail), raw: detail });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- BÚSQUEDA MULTI-FUENTE ---
// Busca en todas las keywords relevantes según el perfil
app.get('/api/search/all', async (req, res) => {
  const profile = readJSON('profile.json');

  // Keywords por área
  const keywords = [];
  if (!profile || !profile.areas || profile.areas.construction?.enabled) {
    keywords.push('construccion', 'remodelacion', 'obra civil', 'ampliacion', 'camino');
  }
  if (!profile || !profile.areas || profile.areas.programming?.enabled) {
    keywords.push('software', 'desarrollo web', 'aplicacion', 'sistema informatico', 'automatizacion');
  }
  if (!profile || !profile.areas || profile.areas.machinery?.enabled) {
    keywords.push('arriendo maquinaria', 'excavadora', 'herramientas', 'equipo construccion');
  }

  if (!MP_TICKET) {
    // Sin API key, devolver datos demo
    const demoPath = join(__dirname, '..', 'src', 'data', 'opportunities.js');
    return res.json({
      results: [],
      total: 0,
      source: 'demo',
      message: 'API key no configurada. Configura MERCADOPUBLICO_TICKET en .env',
      keywords_searched: keywords,
    });
  }

  try {
    const allResults = [];
    const seen = new Set();

    // Primero buscar por fecha de hoy (devuelve más resultados)
    const todayUrl = `${MP_BASE}/licitaciones.json?ticket=${MP_TICKET}&fecha=${formatDateForAPI()}`;
    console.log(`[Search] Buscando por fecha de hoy...`);
    try {
      const response = await fetchWithTimeout(todayUrl);
      const data = await response.json();
      if (data.Listado) {
        for (const lic of data.Listado) {
          const id = lic.CodigoExterno || lic.Codigo;
          if (!seen.has(id)) {
            seen.add(id);
            let opp = transformLicitacion(lic);
            if (profile) opp = calculateMatch(opp, profile);
            allResults.push(opp);
          }
        }
        console.log(`[Search] ${data.Cantidad} resultados por fecha`);
      }
    } catch (e) {
      console.error(`[Search] Error en búsqueda por fecha:`, e.message);
    }

    // También buscar por fecha de ayer para más resultados
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayUrl = `${MP_BASE}/licitaciones.json?ticket=${MP_TICKET}&fecha=${formatDateForAPI(yesterday)}`;
    console.log(`[Search] Buscando por fecha de ayer...`);
    try {
      const response = await fetchWithTimeout(yesterdayUrl);
      const data = await response.json();
      if (data.Listado) {
        for (const lic of data.Listado) {
          const id = lic.CodigoExterno || lic.Codigo;
          if (!seen.has(id)) {
            seen.add(id);
            let opp = transformLicitacion(lic);
            if (profile) opp = calculateMatch(opp, profile);
            allResults.push(opp);
          }
        }
        console.log(`[Search] ${data.Cantidad} resultados por ayer`);
      }
    } catch (e) {
      console.error(`[Search] Error en búsqueda ayer:`, e.message);
    }

    await new Promise(r => setTimeout(r, 300));

    // Luego buscar por keywords relevantes
    for (const kw of keywords.slice(0, 3)) {
      const url = `${MP_BASE}/licitaciones.json?ticket=${MP_TICKET}&palabra_clave=${encodeURIComponent(kw)}`;
      console.log(`[Search] Buscando keyword: ${kw}`);

      try {
        const response = await fetchWithTimeout(url);
        const data = await response.json();

        if (data.Listado) {
          for (const lic of data.Listado) {
            const id = lic.CodigoExterno || lic.Codigo;
            if (!seen.has(id)) {
              seen.add(id);
              let opp = transformLicitacion(lic);
              if (profile) opp = calculateMatch(opp, profile);
              allResults.push(opp);
            }
          }
          console.log(`[Search] ${data.Cantidad} resultados para "${kw}"`);
        }
      } catch (e) {
        console.error(`[Search] Error en keyword "${kw}":`, e.message);
      }

      await new Promise(r => setTimeout(r, 300));
    }

    // Ordenar por match
    allResults.sort((a, b) => b.matchScore - a.matchScore);

    // Guardar resultados
    writeJSON('last_search.json', {
      timestamp: new Date().toISOString(),
      total: allResults.length,
      results: allResults,
    });

    console.log(`[Search] Total final: ${allResults.length} oportunidades únicas`);

    res.json({
      results: allResults,
      total: allResults.length,
      source: 'mercadopublico',
      realData: true,
      keywords_searched: keywords.slice(0, 3),
    });
  } catch (err) {
    res.status(500).json({ error: 'Error en búsqueda', details: err.message });
  }
});

// --- OPORTUNIDADES GUARDADAS ---
app.get('/api/opportunities', (req, res) => {
  const data = readJSON('last_search.json');
  if (!data) return res.json({ results: [], total: 0 });
  res.json(data);
});

// --- WEBHOOK PARA N8N ---
// n8n envía oportunidades encontradas a este endpoint
app.post('/api/webhook/opportunities', (req, res) => {
  const existing = readJSON('last_search.json') || { results: [], total: 0 };
  const newOpps = Array.isArray(req.body) ? req.body : [req.body];

  const profile = readJSON('profile.json');
  const processed = newOpps.map(opp => {
    if (profile) return calculateMatch(opp, profile);
    return opp;
  });

  existing.results = [...processed, ...existing.results];
  existing.total = existing.results.length;
  existing.timestamp = new Date().toISOString();

  writeJSON('last_search.json', existing);
  console.log(`[Webhook] Recibidas ${newOpps.length} nuevas oportunidades`);
  res.json({ success: true, received: newOpps.length });
});

// --- CONFIGURACIÓN DE FUENTES ---
app.get('/api/sources', (req, res) => {
  const sources = readJSON('sources.json');
  if (!sources) {
    // Devolver config por defecto
    const defaults = [
      { id: 'mercadopublico', name: 'MercadoPublico', enabled: true, interval: 30 },
      { id: 'comprasagiles', name: 'Compras Ágiles', enabled: true, interval: 30 },
      { id: 'linkedin', name: 'LinkedIn Jobs', enabled: true, interval: 60 },
      { id: 'licitacionprivada', name: 'Licitaciones Privadas', enabled: false, interval: 120 },
      { id: 'indeed', name: 'Indeed', enabled: false, interval: 60 },
      { id: 'computrabajo', name: 'Computrabajo', enabled: false, interval: 60 },
      { id: 'chilecompra', name: 'ChileCompra', enabled: true, interval: 30 },
    ];
    return res.json(defaults);
  }
  res.json(sources);
});

app.post('/api/sources', (req, res) => {
  writeJSON('sources.json', req.body);
  res.json({ success: true });
});

// --- NOTIFICACIONES ---
app.get('/api/notifications', (req, res) => {
  const notifs = readJSON('notifications.json');
  res.json(notifs || []);
});

app.post('/api/notifications', (req, res) => {
  writeJSON('notifications.json', req.body);
  res.json({ success: true });
});

// ============================================================
// INICIAR
// ============================================================
app.listen(PORT, () => {
  console.log(`\n🎯 OportunidadesAmigo Backend corriendo en http://localhost:${PORT}`);
  console.log(`📡 MercadoPublico API: ${MP_TICKET ? '✅ Configurada' : '❌ Necesita ticket en .env'}`);
  console.log(`🔌 n8n URL: ${process.env.N8N_URL || 'No configurada'}`);
  console.log(`\nEndpoints disponibles:`);
  console.log(`  GET  /api/status`);
  console.log(`  GET  /api/mercadopublico/search?keyword=construccion`);
  console.log(`  GET  /api/search/all`);
  console.log(`  GET  /api/opportunities`);
  console.log(`  GET  /api/profile`);
  console.log(`  POST /api/profile`);
  console.log(`  POST /api/webhook/opportunities (para n8n)\n`);
});
