// Perfil del usuario - datos personales, documentos, restricciones
export const defaultProfile = {
  personal: {
    name: '',
    rut: '',
    email: '',
    phone: '',
    region: 'Metropolitana',
    comuna: '',
    website: '',
    linkedin: '',
  },
  company: {
    name: '',
    rut: '',
    type: 'Persona Natural', // Persona Natural, EIRL, SPA, Ltda, SA
    giro: '',
    registroMercadoPublico: false,
    registroChileProveedores: false,
  },
  areas: {
    construction: {
      enabled: true,
      subAreas: {
        houses: { enabled: true, label: 'Casas habitacionales' },
        roads: { enabled: true, label: 'Caminos y vialidad' },
        remodeling: { enabled: true, label: 'Remodelaciones' },
        extensions: { enabled: true, label: 'Ampliaciones' },
        industrial: { enabled: true, label: 'Construcción industrial' },
        electrical: { enabled: false, label: 'Instalaciones eléctricas' },
        plumbing: { enabled: false, label: 'Gasfitería y sanitario' },
        painting: { enabled: false, label: 'Pintura y terminaciones' },
      }
    },
    programming: {
      enabled: true,
      subAreas: {
        websites: { enabled: true, label: 'Páginas web' },
        bots: { enabled: true, label: 'Bots y chatbots' },
        automation: { enabled: true, label: 'Automatización' },
        androidApps: { enabled: true, label: 'Aplicaciones Android' },
        iosApps: { enabled: false, label: 'Aplicaciones iOS' },
        desktop: { enabled: false, label: 'Aplicaciones de escritorio' },
        ai: { enabled: false, label: 'Inteligencia Artificial' },
      }
    },
    machinery: {
      enabled: true,
      subAreas: {
        excavators: { enabled: true, label: 'Excavadoras' },
        cranes: { enabled: true, label: 'Grúas' },
        trucks: { enabled: true, label: 'Camiones' },
        tools: { enabled: true, label: 'Herramientas menores' },
        scaffolding: { enabled: false, label: 'Andamios' },
        concrete: { enabled: false, label: 'Equipos de hormigón' },
      }
    }
  },
  documents: {
    patenteMunicipal: { has: false, expires: '' },
    inicioActividades: { has: false, date: '' },
    certificadoAntecedentes: { has: false, expires: '' },
    seguroRC: { has: false, expires: '' },
    garantiaSeriedad: { has: false, amount: 0 },
    garantiaFielCumplimiento: { has: false, amount: 0 },
    inscripcionRegistroCivil: { has: false },
    boletaGarantia: { has: false, maxAmount: 0 },
  },
  restrictions: {
    maxBudget: 0, // Presupuesto máximo que puede asumir
    maxDistance: 100, // km desde su ubicación
    requiresTeam: false,
    teamSize: 0,
    availableFrom: '',
    workingRegions: ['Metropolitana'],
    canTravelNational: false,
    hasVehicle: false,
  }
};

export const regionsChile = [
  'Arica y Parinacota',
  'Tarapacá',
  'Antofagasta',
  'Atacama',
  'Coquimbo',
  'Valparaíso',
  'Metropolitana',
  "O'Higgins",
  'Maule',
  'Ñuble',
  'Biobío',
  'Araucanía',
  'Los Ríos',
  'Los Lagos',
  'Aysén',
  'Magallanes',
];
