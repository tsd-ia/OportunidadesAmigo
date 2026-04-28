// Servicio API - conecta frontend con backend Express
const API_BASE = 'http://localhost:3001/api';

// Verificar si el backend está disponible
async function checkBackend() {
  try {
    const res = await fetch(`${API_BASE}/status`);
    if (res.ok) return await res.json();
    return null;
  } catch {
    return null;
  }
}

// --- PERFIL ---
export async function loadProfile() {
  try {
    const res = await fetch(`${API_BASE}/profile`);
    const data = await res.json();
    if (data.exists) return data.data;
    return null;
  } catch {
    // Sin backend, usar localStorage
    const stored = localStorage.getItem('oportunidades_profile');
    return stored ? JSON.parse(stored) : null;
  }
}

export async function saveProfile(profile) {
  // Guardar en localStorage siempre
  localStorage.setItem('oportunidades_profile', JSON.stringify(profile));

  try {
    await fetch(`${API_BASE}/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    return { success: true, backend: true };
  } catch {
    return { success: true, backend: false };
  }
}

// --- BÚSQUEDA ---
export async function searchMercadoPublico(keyword) {
  try {
    const res = await fetch(`${API_BASE}/mercadopublico/search?keyword=${encodeURIComponent(keyword)}`);
    return await res.json();
  } catch {
    return { results: [], total: 0, error: 'Backend no disponible' };
  }
}

export async function searchAll() {
  try {
    const res = await fetch(`${API_BASE}/search/all`);
    return await res.json();
  } catch {
    return { results: [], total: 0, error: 'Backend no disponible' };
  }
}

export async function searchComprasAgiles() {
  try {
    const res = await fetch(`${API_BASE}/mercadopublico/search-agiles`);
    return await res.json();
  } catch {
    return { results: [], total: 0, error: 'Backend no disponible' };
  }
}


export async function getMercadoPublicoDetail(codigo) {
  try {
    const res = await fetch(`${API_BASE}/mercadopublico/detail/${codigo}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// --- OPORTUNIDADES ---
export async function getOpportunities() {
  try {
    const res = await fetch(`${API_BASE}/opportunities`);
    return await res.json();
  } catch {
    return { results: [], total: 0 };
  }
}

// --- FUENTES ---
export async function getSources() {
  try {
    const res = await fetch(`${API_BASE}/sources`);
    return await res.json();
  } catch {
    return null;
  }
}

export async function saveSources(sources) {
  try {
    await fetch(`${API_BASE}/sources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sources),
    });
    return true;
  } catch {
    return false;
  }
}

// --- NOTIFICACIONES ---
export async function getNotifications() {
  try {
    const res = await fetch(`${API_BASE}/notifications`);
    return await res.json();
  } catch {
    return [];
  }
}

// --- STATUS ---
export async function getStatus() {
  return checkBackend();
}

export async function sendChatMessage(message, context) {
  try {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context }),
    });
    return response.json();
  } catch (error) {
    console.error('Error in chat:', error);
    return { text: 'Hubo un error de red al contactar al asistente.' };
  }
}

export default {
  loadProfile, saveProfile,
  searchMercadoPublico, searchAll, getMercadoPublicoDetail,
  getOpportunities, getSources, saveSources,
  getNotifications, getStatus, sendChatMessage,
};
