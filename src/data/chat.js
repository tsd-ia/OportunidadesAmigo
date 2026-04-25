// Mensajes del asistente inteligente
export const chatMessages = [
  {
    id: 1,
    type: 'bot',
    text: '¡Hola! Soy tu Asistente de Oportunidades. Estoy monitoreando **7 fuentes** en busca de trabajos para ti. ¿En qué te puedo ayudar?',
    timestamp: new Date().toISOString(),
  },
  {
    id: 2,
    type: 'bot',
    text: '🔔 Encontré una oportunidad interesante fuera de tu rubro: **Servicio de Mantención de Jardines** en Providencia. No piden requisitos técnicos especiales y puedes ganar $8.000.000. ¿Te interesa ver los detalles?',
    timestamp: new Date().toISOString(),
  }
];

export const quickActions = [
  { id: 'search_now', label: '🔍 Buscar ahora', description: 'Ejecutar búsqueda manual en todas las fuentes' },
  { id: 'change_region', label: '📍 Cambiar región', description: 'Modificar las regiones de búsqueda' },
  { id: 'add_rubro', label: '➕ Agregar rubro', description: 'Añadir una nueva área de trabajo' },
  { id: 'show_easy', label: '💡 Oportunidades fáciles', description: 'Ver oportunidades sin requisitos especiales' },
  { id: 'my_profile', label: '👤 Mi perfil', description: 'Ver y editar mi información' },
  { id: 'stats', label: '📊 Estadísticas', description: 'Ver resumen de oportunidades encontradas' },
];

export const botResponses = {
  search_now: 'Ejecutando búsqueda en todas las fuentes activas... ⏳\n\nResultados:\n- MercadoPublico: 3 nuevas licitaciones\n- ComprasÁgiles: 1 compra directa\n- LinkedIn: 2 ofertas de trabajo\n\nTotal: **6 nuevas oportunidades** encontradas. Ve al Explorador para verlas todas.',
  change_region: '¿En qué regiones quieres buscar? Actualmente tienes configurada: **Metropolitana**.\n\nOpciones disponibles:\n1. Agregar Valparaíso\n2. Agregar O\'Higgins\n3. Buscar a nivel nacional\n4. Solo Metropolitana\n\nEscribe el número de tu preferencia.',
  add_rubro: 'Estos son rubros adicionales que puedes agregar:\n\n1. 🔧 Gasfitería y sanitario\n2. ⚡ Instalaciones eléctricas\n3. 🎨 Pintura y terminaciones\n4. 🏗️ Andamios\n5. 🖥️ Aplicaciones de escritorio\n6. 🤖 Inteligencia Artificial\n\n¿Cuál te interesa? Puedes activarlos desde el Configurador también.',
  show_easy: 'Aquí van oportunidades que **no requieren experiencia específica** en tu rubro:\n\n1. 🌿 Mantención de Jardines - $8M - Solo patente municipal\n2. 🚛 Transporte de Materiales - $6M - Solo vehículo de carga\n\nEstas son oportunidades de ingreso extra que complementan tu actividad principal. ¿Quieres postular a alguna?',
  my_profile: 'Tu perfil actual:\n- Áreas activas: Construcción, Programación, Maquinaria\n- Región: Metropolitana\n- Documentos: 2/8 cargados\n\n👉 Ve a la sección "Mi Perfil" para completar tu información y mejorar el matching.',
  stats: '📊 Resumen de esta semana:\n- Oportunidades encontradas: **10**\n- Match alto (>80%): **5**\n- Nuevas hoy: **3**\n- Por vencer pronto: **2**\n\nTu área más activa: **Construcción** con 4 oportunidades.',
};
