// Servidor Express - Backend OportunidadesAmigo
// Integra la API real de MercadoPublico.cl y gestiona datos locales
import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';
import multer from 'multer';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());

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

// --- UTILIDADES DE MEMORIA (CEREBRO) ---
const DB_PATH = join(__dirname, '..', 'opportunities_db.json');

function readDB() {
  try {
    if (!existsSync(DB_PATH)) return {};
    return JSON.parse(readFileSync(DB_PATH, 'utf8'));
  } catch (e) {
    console.error('[Cerebro] Error leyendo memoria:', e.message);
    return {};
  }
}

function writeDB(data) {
  try {
    writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('[Cerebro] Error guardando memoria:', e.message);
  }
}

function saveToMemory(opp) {
  const db = readDB();
  const id = opp.id;
  
  // Lógica de preservación: Si el nuevo monto es 0 pero ya teníamos uno > 0, mantener el viejo
  const existingBudget = db[id]?.budget || 0;
  const finalBudget = (opp.budget && opp.budget > 0) ? opp.budget : existingBudget;

  // Solo guardamos si el presupuesto es > 0 o si no teníamos ese ID antes con datos completos
  if (!db[id] || finalBudget > existingBudget || (opp.isFullyAnalyzed && !db[id].isFullyAnalyzed)) {
    db[id] = { 
      ...db[id], 
      ...opp, 
      budget: finalBudget, // Preservar monto
      updatedAt: new Date().toISOString() 
    };
    writeDB(db);
    console.log(`[Cerebro] Memoria actualizada para ${id} (Monto Final: $${finalBudget})`);
  }
}

function getFromMemory(id) {
  const db = readDB();
  return db[id] || null;
}

// ============================================================
// COLA DE AUDITORÍA AUTOMÁTICA (Background Scanner)
// ============================================================
let auditQueue = [];
let isProcessingQueue = false;

async function executeAudit(codigo) {
  let browser;
  try {
    console.log(`[Auditoría] Iniciando extracción para ${codigo}...`);
    browser = await puppeteer.launch({ 
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // 1. Ir a la ficha
    const url = `https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?idlicitacion=${codigo}`;
    await page.goto(url, { waitUntil: 'networkidle2' });

    // 2. Click en anexos
    const attachmentsBtn = await page.$('#imgAdjuntos');
    if (!attachmentsBtn) throw new Error('No se encontró el botón de anexos');
    await attachmentsBtn.click();
    await new Promise(r => setTimeout(r, 3000));
    
    const targets = await browser.targets();
    const popupTarget = targets.find(t => t.url().includes('ViewAttachment.aspx'));
    const attachmentsPage = popupTarget ? await popupTarget.page() : page;
    await attachmentsPage.waitForSelector('body');
    const html = await attachmentsPage.content();
    
    // 3. Captcha
    if (html.includes('Captcha.aspx')) {
      const captchaImg = await attachmentsPage.$('img[src*="Captcha.aspx"]');
      if (captchaImg) {
        const screenshotB64 = await captchaImg.screenshot({ encoding: 'base64' });
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: "Dime el código de 5 o 6 letras/números que aparece en esta imagen de captcha de Mercado Público. Responde SOLO el código, nada más." },
                { inline_data: { mime_type: "image/png", data: screenshotB64 } }
              ]
            }]
          })
        });
        const geminiData = await geminiResponse.json();
        const solvedCaptcha = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        if (solvedCaptcha) await attachmentsPage.type('input[name*="ctl10"]', solvedCaptcha);
      }
    }

    // 4. Gemini Auditoría
    const tableText = await attachmentsPage.evaluate(() => document.body.innerText);
    const detailText = await page.evaluate(() => document.body.innerText);
    const auditPrompt = `Actúa como un auditor experto en licitaciones de Mercado Público Chile. Analiza este contenido extraído de la ficha y anexos de la licitación ${codigo}. Extrae: budget (solo número), guarantees (lista), experience (texto), certifications (lista), siteVisit (texto), keyDates (lista). Responde SOLO un objeto JSON. TEXTO FICHA: ${detailText.substring(0, 3000)} TEXTO ANEXOS: ${tableText.substring(0, 5000)}`;

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: auditPrompt }] }] })
    });

    const geminiData = await geminiRes.json();
    let auditResults = { budget: 0, guarantees: [], experience: "", certifications: [], siteVisit: "", keyDates: [] };
    try {
      const jsonText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.replace(/```json|```/g, '').trim();
      auditResults = JSON.parse(jsonText);
    } catch (e) {
      const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      auditResults.budget = parseInt(text.replace(/\D/g, ''), 10) || 0;
    }

    await browser.close();

    const finalResult = {
      id: codigo,
      budget: auditResults.budget || 0,
      guarantees: auditResults.guarantees || [],
      experience: auditResults.experience || "",
      certifications: auditResults.certifications || [],
      siteVisit: auditResults.siteVisit || "",
      keyDates: auditResults.keyDates || [],
      items: tableText.includes('Producto') ? [{ Nombre: 'Auditado Automáticamente' }] : [],
      updatedAt: new Date().toISOString(),
      isFullyAnalyzed: true
    };
    saveToMemory(finalResult);
    return finalResult;

  } catch (err) {
    if (browser) await browser.close();
    throw err;
  }
}

async function processAuditQueue() {
  if (isProcessingQueue || auditQueue.length === 0) return;
  isProcessingQueue = true;
  console.log(`[Escáner] Iniciando procesamiento de cola (${auditQueue.length} pendientes)...`);
  
  while (auditQueue.length > 0) {
    const id = auditQueue.shift();
    const cached = getFromMemory(id);
    if (!cached || !cached.isFullyAnalyzed) {
      console.log(`[Escáner] Procesando automáticamente: ${id}`);
      try {
        await executeAudit(id);
        await new Promise(r => setTimeout(r, 5000));
      } catch (err) {
        console.error(`[Escáner] Error en ${id}:`, err.message);
      }
    }
  }
  isProcessingQueue = false;
}

function addToAuditQueue(ids) {
  const newIds = ids.filter(id => !auditQueue.includes(id));
  auditQueue = [...auditQueue, ...newIds];
  processAuditQueue();
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
  // Primero consultar Memoria (Cerebro)
  const cached = getFromMemory(codigo);
  if (cached && cached.budget > 0) {
    console.log(`[Cerebro] Recuperando datos de memoria para ${codigo}`);
    return cached;
  }

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
  let budget = lic.MontoEstimado || 0;
  if (budget === 0 && lic.Items && Array.isArray(lic.Items.Listado)) {
    budget = lic.Items.Listado.reduce((acc, it) => acc + ((it.Cantidad || 0) * (it.MontoEstimado || it.PrecioNeto || 0)), 0);
  }
  const fechas = lic.Fechas || {};
  const comprador = lic.Comprador || {};

  return {
    id: lic.CodigoExterno || lic.Codigo || `mp-${Date.now()}`,
    title: lic.Nombre || 'Sin título',
    source: 'MercadoPublico',
    type: lic.Tipo === 'SE' ? 'compra_agil' : lic.Tipo === 'LE' ? 'licitacion_publica' : lic.Tipo === 'LP' ? 'licitacion_publica' : 'otro',
    typeName: lic.Tipo === 'SE' ? 'Compra Ágil' : lic.Tipo === 'LE' ? 'Licitación Pública' : lic.Tipo === 'LP' ? 'Licitación Pública' : lic.Tipo === 'CO' ? 'Contratación Directa' : lic.Tipo || 'Otro',
    category: cat.category,
    subCategory: cat.sub,
    region: comprador.RegionUnidad || (lic.RegionUnidad ? (regionMap[lic.RegionUnidad] || lic.RegionUnidad) : 'Metropolitana'), // Fallback a Metropolitana si no hay nada, es lo más común
    comuna: comprador.ComunaUnidad || lic.ComunaUnidad || '',
    budget: budget,
    currency: lic.Moneda || 'CLP',
    // Fechas importantes
    deadline: fechas.FechaCierre || lic.FechaCierre || '',
    publishDate: fechas.FechaPublicacion || lic.FechaPublicacion || '',
    fechaVisitaTerreno: fechas.FechaVisitaTerreno || null,
    fechaEntregaAntecedentes: fechas.FechaEntregaAntecedentes || null,
    fechaAdjudicacion: fechas.FechaEstimadaAdjudicacion || fechas.FechaAdjudicacion || null,
    fechaPubRespuestas: fechas.FechaPubRespuestas || null,
    fechaAperturaTecnica: fechas.FechaActoAperturaTecnica || null,
    fechaAperturaEconomica: fechas.FechaActoAperturaEconomica || null,
    // Info del organismo
    entity: comprador.NombreOrganismo || lic.NombreOrganismo || lic.Organismo || '',
    entityRut: comprador.RutUnidad || '',
    entityUnit: comprador.NombreUnidad || '',
    entityAddress: comprador.DireccionUnidad || '',
    contactName: comprador.NombreUsuario || '',
    contactRole: comprador.CargoUsuario || '',
    // Detalles
    description: lic.Descripcion || '',
    status: mapStatus(lic.CodigoEstado),
    statusName: lic.Estado || '',
    diasCierre: lic.DiasCierreLicitacion || null,
    direccionVisita: lic.DireccionVisita || '',
    direccionEntrega: lic.DireccionEntrega || '',
    fuenteFinanciamiento: lic.FuenteFinanciamiento || '',
    tieneVisitaTerreno: !!(fechas.FechaVisitaTerreno),
    // Requisitos
    requiresRegistro: true,
    requiresGarantia: budget > 10000000,
    garantiaAmount: budget > 10000000 ? Math.round(budget * 0.05) : 0,
    requirements: extractRequirements(lic),
    // Items/productos
    items: lic.Items ? lic.Items.Listado || [] : [],
    cantidadItems: lic.Items ? lic.Items.Cantidad || 0 : 0,
    // URL directa
    url: `https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?idlicitacion=${lic.CodigoExterno}`,
    // Match (se calcula después)
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
    
    const transformed = transformLicitacion(detail);
    
    // Si después del mapeo de items y campos el presupuesto sigue en 0, usamos a Gemini de inspector
    if (transformed.budget === 0 && process.env.GEMINI_API_KEY) {
      try {
        const textToAnalyze = `
          Nombre: ${detail.Nombre || ''}
          Descripción: ${detail.Descripcion || ''}
          Observaciones: ${detail.Observatoria || ''}
          Justificación: ${detail.JustificacionMontoEstimado || ''}
        `;
        const prompt = `Actúa como un extractor de datos técnicos. Revisa el siguiente texto extraído de una licitación chilena y dime cuál es el presupuesto estimado, monto referencial o monto total disponible. Responde SOLO CON EL NÚMERO entero final sin puntos ni comas ni símbolos (ej. 50000000). Si no encuentras ningún monto o dice que no está disponible, responde "0".\n\nTexto:\n${textToAnalyze}`;
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] })
        });
        
        if (response.ok) {
          const data = await response.json();
          const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '0';
          const extractedBudget = parseInt(textResponse.replace(/\D/g, ''), 10);
          if (!isNaN(extractedBudget) && extractedBudget > 0) {
            transformed.budget = extractedBudget;
            console.log(`[IA] Presupuesto extraído con Gemini para ${req.params.codigo}: $${extractedBudget}`);
          }
        }
      } catch (aiErr) {
        console.error('[IA] Error extrayendo presupuesto:', aiErr.message);
      }
    }
    
    res.json({ result: transformed, raw: detail });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ANÁLISIS DE PDF CON IA (DRAG & DROP) ---
const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/analyze-pdf/:codigo', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
  if (!process.env.GEMINI_API_KEY) return res.status(400).json({ error: 'API Key de Gemini no configurada' });

  try {
    console.log(`[PDF] Analizando archivo para ${req.params.codigo} (${req.file.size} bytes)...`);
    const pdfData = await pdfParse(req.file.buffer);
    const pdfText = pdfData.text.substring(0, 15000);
    
    const prompt = `Actúa como un extractor de datos de licitaciones públicas. A continuación te pasaré el texto extraído de las bases técnicas/administrativas de una licitación.
Tu tarea es encontrar el Presupuesto Estimado, Monto Disponible, o Monto Referencial total de la licitación.
Si encuentras el monto, devuelve SOLO EL NÚMERO entero final sin puntos ni símbolos (ej: 20000000). Si no hay absolutamente ningún monto en todo el texto, responde "0".

Texto del PDF:
${pdfText}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] })
    });

    if (!response.ok) throw new Error('Fallo al consultar a Gemini');
    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '0';
    const extractedBudget = parseInt(textResponse.replace(/\D/g, ''), 10);
    res.json({ budget: isNaN(extractedBudget) ? 0 : extractedBudget });
  } catch (err) {
    console.error('[PDF] Error analizando:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- ANÁLISIS AUTOMÁTICO CON PUPPETEER + IA (BYPASS CAPTCHA LOCAL) ---
app.post('/api/auto-analyze/:codigo', async (req, res) => {
  const { codigo } = req.params;
  let browser;

  try {
    console.log(`[Puppeteer] Iniciando extracción autónoma para ${codigo}...`);
    browser = await puppeteer.launch({ 
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Simular ser un usuario real
    await page.setViewport({ width: 1280, height: 800 });
    
    // 1. Ir a la ficha de la licitación
    const url = `https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?idlicitacion=${codigo}`;
    await page.goto(url, { waitUntil: 'networkidle2' });

    // 2. Click en el botón de anexos
    console.log('[Puppeteer] Buscando botón de anexos...');
    const attachmentsBtn = await page.$('#imgAdjuntos');
    if (!attachmentsBtn) throw new Error('No se encontró el botón de anexos');
    
    await attachmentsBtn.click();
    await new Promise(r => setTimeout(r, 3000)); // Esperar que cargue el popup o la nueva página
    
    // El popup suele ser una nueva ventana o la misma página. Si es popup, hay que cambiar de target.
    const targets = await browser.targets();
    const popupTarget = targets.find(t => t.url().includes('ViewAttachment.aspx'));
    const attachmentsPage = popupTarget ? await popupTarget.page() : page;

    await attachmentsPage.waitForSelector('body');
    const html = await attachmentsPage.content();
    
    // 3. ¿Hay Captcha de imagen?
    const hasCaptcha = html.includes('Captcha.aspx');
    let solvedCaptcha = "";

    if (hasCaptcha) {
      console.log('[Puppeteer] ¡Captcha de imagen detectado! Resolviendo con IA...');
      const captchaImg = await attachmentsPage.$('img[src*="Captcha.aspx"]');
      if (captchaImg) {
        const screenshotB64 = await captchaImg.screenshot({ encoding: 'base64' });
        
        // Pedir a Gemini que resuelva el captcha
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: "Dime el código de 5 o 6 letras/números que aparece en esta imagen de captcha de Mercado Público. Responde SOLO el código, nada más." },
                { inline_data: { mime_type: "image/png", data: screenshotB64 } }
              ]
            }]
          })
        });

        const geminiData = await geminiResponse.json();
        solvedCaptcha = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        console.log(`[Puppeteer] Gemini resolvió el captcha: ${solvedCaptcha}`);

        if (solvedCaptcha) {
          await attachmentsPage.type('input[name*="ctl10"]', solvedCaptcha);
          // Opcional: Si hay un botón de descargar todos, o descargar el primero. 
          // Intentaremos extraer el presupuesto directamente del texto de la tabla primero
        }
      }
    }

    // 4. Extracción Profunda de Requisitos con Gemini
    const tableText = await attachmentsPage.evaluate(() => document.body.innerText);
    const detailText = await page.evaluate(() => document.body.innerText); // Texto de la ficha principal
    
    const auditPrompt = `Actúa como un auditor experto en licitaciones de Mercado Público Chile.
    Analiza este contenido extraído de la ficha y anexos de la licitación ${codigo}.
    Extrae la siguiente información de forma estructurada en JSON:
    {
      "budget": 0, // Monto total estimado o referencial
      "guarantees": [], // Ej: ["Garantía Seriedad: $500.000", "Fiel cumplimiento: 5%"]
      "experience": "", // Ej: "3 años en obras civiles"
      "certifications": [], // Ej: ["ISO 9001", "Patente al día"]
      "siteVisit": "", // Ej: "Obligatoria 15/05", "No aplica"
      "keyDates": [] // Fechas críticas encontradas
    }
    Si no encuentras algo, pon "" o []. Responde SOLO el objeto JSON.
    
    TEXTO FICHA: ${detailText.substring(0, 3000)}
    TEXTO ANEXOS: ${tableText.substring(0, 5000)}`;

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: auditPrompt }] }] })
    });

    const geminiData = await geminiRes.json();
    let auditResults = { budget: 0, guarantees: [], experience: "", certifications: [], siteVisit: "", keyDates: [] };
    
    try {
      const jsonText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.replace(/```json|```/g, '').trim();
      auditResults = JSON.parse(jsonText);
    } catch (e) {
      console.error('[IA] Fallo al parsear JSON de auditoría, usando fallback');
      const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      auditResults.budget = parseInt(text.replace(/\D/g, ''), 10) || 0;
    }

    await browser.close();

    // Guardar en el Cerebro con la info enriquecida
    const finalResult = {
      id: codigo,
      budget: auditResults.budget || 0,
      guarantees: auditResults.guarantees || [],
      experience: auditResults.experience || "",
      certifications: auditResults.certifications || [],
      siteVisit: auditResults.siteVisit || "",
      keyDates: auditResults.keyDates || [],
      items: tableText.includes('Producto') ? [{ Nombre: 'Analizado por IA Auditora' }] : [],
      updatedAt: new Date().toISOString(),
      isFullyAnalyzed: true
    };
    saveToMemory(finalResult);

    res.json({ 
      success: true, 
      ...finalResult,
      message: finalResult.budget > 0 ? 'Auditoría completa finalizada con éxito' : 'Auditoría finalizada, presupuesto no encontrado.'
    });

  } catch (err) {
    if (browser) await browser.close();
    console.error('[Puppeteer] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- BÚSQUEDA MULTI-FUENTE ---

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

    // Filtrar expiradas
    const now = new Date();
    const validResults = allResults.filter(opp => {
      if (!opp.deadline) return true;
      return new Date(opp.deadline) >= now;
    });

    // Ordenar por match
    validResults.sort((a, b) => b.matchScore - a.matchScore);

    console.log(`[Search] Obteniendo detalles completos para mejorar montos y fechas...`);
    // Obtener detalles completos para asegurar que vengan con montos y fechas (top 50)
    const topResults = validResults.slice(0, 50);
    const restResults = validResults.slice(50);
    
    for (let i = 0; i < topResults.length; i++) {
      try {
        // Consultar memoria primero
        const id = topResults[i].id;
        const cached = getFromMemory(id);
        
        if (cached && cached.budget > 0) {
          topResults[i] = { ...topResults[i], ...cached };
          continue;
        }

        const detail = await fetchLicitacionDetail(id);
        if (detail) {
          // Si el detail vino de la API (no de memoria cacheada de arriba)
          const transformed = detail.budget !== undefined ? detail : transformLicitacion(detail);
          
          // Enriquecimiento con Gemini si el budget es 0
          if (transformed.budget === 0 && process.env.GEMINI_API_KEY) {
             // ... (esta lógica ya está dentro de transformLicitacion o el detail handler)
          }

          topResults[i] = { ...topResults[i], ...transformed, matchScore: topResults[i].matchScore, matchReasons: topResults[i].matchReasons };
          
          // Guardar descubrimiento en el Cerebro
          saveToMemory(topResults[i]);
        }
        await new Promise(r => setTimeout(r, 100));
      } catch (e) {
        console.error(`[Search] Error detalle ${topResults[i].id}`);
      }
    }

    const finalResults = [...topResults, ...restResults];

    // Guardar resultados
    writeJSON('last_search.json', {
      timestamp: new Date().toISOString(),
      total: finalResults.length,
      results: finalResults,
    });

    console.log(`[Search] Total final: ${finalResults.length} oportunidades únicas (filtradas activas)`);

    res.json({
      results: finalResults,
      total: finalResults.length,
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

// --- AI CHAT (GEMINI) ---
app.post('/api/chat', async (req, res) => {
  const { message, context } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.json({ text: "Lo siento jefe, la API Key de Gemini no está configurada en el .env." });
  }
  
  try {
    const prompt = `Actúa como "OportunidadesAmigo", un asesor experto y directo (en español) para un contratista en Chile. 
El usuario ha escaneado licitaciones. Aquí tienes un resumen de las mejores oportunidades actuales (JSON truncado):
${JSON.stringify((context || []).slice(0, 15).map(o => ({ titulo: o.title, monto: o.budget, region: o.region, cierre: o.deadline })))}

Pregunta del usuario: ${message}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction: { role: 'system', parts: [{ text: "Eres técnico, vas al grano, recomiendas oportunidades y respondes dudas sobre licitaciones de MercadoPúblico." }] }
      })
    });
    
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta del modelo.';
    res.json({ text });
  } catch (err) {
    console.error('Error Gemini:', err.message);
    res.json({ text: "Hubo un error al conectar con Gemini: " + err.message });
  }
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
