import { useState } from 'react';
import { Play, Pause, RefreshCw, ExternalLink } from 'lucide-react';

const workflows = [
  { id: 'wf-mercadopublico', name: 'Scraper MercadoPublico', desc: 'Busca licitaciones públicas cada 30 min', icon: '🏛️', status: 'active', lastRun: '2026-04-25 10:30', executions: 142, color: '#3b82f6' },
  { id: 'wf-comprasagiles', name: 'Scraper ComprasÁgiles', desc: 'Monitorea compras directas del Estado', icon: '⚡', status: 'active', lastRun: '2026-04-25 10:25', executions: 98, color: '#f59e0b' },
  { id: 'wf-linkedin', name: 'LinkedIn Jobs Crawler', desc: 'Busca ofertas laborales por keywords', icon: '💼', status: 'active', lastRun: '2026-04-25 09:00', executions: 56, color: '#0077b5' },
  { id: 'wf-licitaciones', name: 'Licitaciones Privadas', desc: 'Scraping de portales de licitaciones privadas', icon: '🔒', status: 'paused', lastRun: '2026-04-24 18:00', executions: 34, color: '#8b5cf6' },
  { id: 'wf-notifier', name: 'Notificador Email/Telegram', desc: 'Envía alertas cuando hay match alto', icon: '🔔', status: 'active', lastRun: '2026-04-25 10:31', executions: 210, color: '#22c55e' },
  { id: 'wf-chilecompra', name: 'ChileCompra Monitor', desc: 'Monitorea el portal de compras públicas', icon: '🇨🇱', status: 'active', lastRun: '2026-04-25 10:15', executions: 78, color: '#dc2626' },
  { id: 'wf-analyzer', name: 'Analizador de Match', desc: 'Calcula compatibilidad con tu perfil', icon: '🧠', status: 'active', lastRun: '2026-04-25 10:32', executions: 310, color: '#6366f1' },
];

function N8nPanel() {
  const [wfs, setWfs] = useState(workflows);

  const toggleWorkflow = (id) => {
    setWfs(w => w.map(x => x.id === id ? { ...x, status: x.status === 'active' ? 'paused' : 'active' } : x));
  };

  const activeCount = wfs.filter(w => w.status === 'active').length;
  const totalExecs = wfs.reduce((s, w) => s + w.executions, 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Panel n8n</h1>
          <p className="page-subtitle">Controla tus workflows de automatización</p>
        </div>
        <a href="http://localhost:5678" target="_blank" rel="noopener noreferrer" className="btn btn--secondary">
          Abrir n8n <ExternalLink size={14} />
        </a>
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-card__icon" style={{ background: 'rgba(34,197,94,0.15)' }}>
            <Play color="#22c55e" size={24} />
          </div>
          <div className="stat-card__info">
            <div className="stat-card__label">Workflows Activos</div>
            <div className="stat-card__value">{activeCount}/{wfs.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon" style={{ background: 'rgba(99,102,241,0.15)' }}>
            <RefreshCw color="#6366f1" size={24} />
          </div>
          <div className="stat-card__info">
            <div className="stat-card__label">Ejecuciones Totales</div>
            <div className="stat-card__value">{totalExecs}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon" style={{ background: 'rgba(59,130,246,0.15)' }}>
            <span style={{ fontSize: 20 }}>🔌</span>
          </div>
          <div className="stat-card__info">
            <div className="stat-card__label">Estado Servidor</div>
            <div className="stat-card__value" style={{ fontSize: 18, color: 'var(--success)' }}>Conectado</div>
          </div>
        </div>
      </div>

      {/* Workflows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {wfs.map(wf => (
          <div key={wf.id} className="n8n-workflow">
            <div className="n8n-workflow__icon" style={{ background: wf.color + '20' }}>
              {wf.icon}
            </div>
            <div className="n8n-workflow__info">
              <div className="n8n-workflow__name">{wf.name}</div>
              <div className="n8n-workflow__desc">{wf.desc}</div>
              <div className="n8n-workflow__status">
                <span className={`tag ${wf.status === 'active' ? 'tag--success' : 'tag--warning'}`}>
                  {wf.status === 'active' ? '● Activo' : '● Pausado'}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>Último: {wf.lastRun}</span>
                <span style={{ color: 'var(--text-muted)' }}>{wf.executions} ejecuciones</span>
              </div>
            </div>
            <button
              className={`btn btn--sm ${wf.status === 'active' ? 'btn--danger' : 'btn--success'}`}
              onClick={() => toggleWorkflow(wf.id)}
            >
              {wf.status === 'active' ? <><Pause size={14} /> Pausar</> : <><Play size={14} /> Activar</>}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default N8nPanel;
