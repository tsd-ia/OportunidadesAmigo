# 🎯 OportunidadesAmigo

Bot inteligente de búsqueda de oportunidades laborales, licitaciones públicas y privadas en Chile.

## Áreas de búsqueda

- 🏗️ **Construcción**: Casas, caminos, remodelaciones, ampliaciones, industrial
- 💻 **Programación**: Páginas web, bots, automatización, apps Android
- 🚜 **Maquinaria**: Arriendo de excavadoras, grúas, camiones, herramientas

## Fuentes de datos

| Fuente | Tipo | Método |
|--------|------|--------|
| MercadoPublico.cl | API REST oficial | Ticket gratuito |
| ComprasÁgiles | API REST (misma plataforma) | Mismo ticket |
| ChileCompra | API REST | Mismo ticket |
| LinkedIn Jobs | Scraping vía n8n | Workflow automático |
| Indeed | Scraping vía n8n | Workflow automático |
| Licitaciones Privadas | Scraping configurable | Workflow n8n |

## Instalación

```bash
# Instalar dependencias
npm install

# Configurar API key de MercadoPublico
# 1. Ir a https://api.mercadopublico.cl y registrarse
# 2. Copiar .env.example a .env
# 3. Pegar tu ticket en MERCADOPUBLICO_TICKET

# Iniciar frontend (puerto 5173)
npm run dev

# Iniciar backend (puerto 3001) - en otra terminal
npm run server
```

## Estructura

```
├── src/                    # Frontend React
│   ├── pages/              # Páginas: Dashboard, Perfil, Explorador, etc.
│   ├── data/               # Datos demo y configuración
│   └── services/           # Conexión con backend API
├── server/                 # Backend Express
│   ├── index.js            # Servidor con integración MercadoPublico
│   └── data/               # Datos locales (perfil, búsquedas)
├── n8n-workflows/          # Templates importables para n8n
│   ├── scraper-mercadopublico.json
│   ├── scraper-linkedin.json
│   └── notificador-email.json
└── .env                    # Variables de entorno (no se sube a git)
```

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/status | Estado del servidor |
| GET | /api/mercadopublico/search?keyword=X | Buscar en MercadoPublico |
| GET | /api/search/all | Búsqueda multi-keyword según perfil |
| GET | /api/opportunities | Oportunidades guardadas |
| GET | /api/profile | Obtener perfil |
| POST | /api/profile | Guardar perfil |
| POST | /api/webhook/opportunities | Recibir datos desde n8n |

## Configuración n8n

1. Importar los workflows desde `n8n-workflows/` en tu instancia n8n
2. Configurar la variable `MERCADOPUBLICO_TICKET` en n8n
3. Los workflows envían datos al webhook del backend automáticamente
