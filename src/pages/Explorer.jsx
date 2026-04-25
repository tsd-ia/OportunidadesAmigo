import { useState } from 'react';
import { Filter, SortDesc, ExternalLink } from 'lucide-react';
import { demoOpportunities } from '../data/opportunities';

function Explorer() {
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('matchScore');
  const [showOutside, setShowOutside] = useState(true);

  const formatMoney = (n) => `$${n.toLocaleString('es-CL')}`;
  const getScoreClass = (s) => s >= 80 ? 'high' : s >= 50 ? 'medium' : 'low';

  const daysLeft = (d) => Math.ceil((new Date(d) - new Date()) / (1000*60*60*24));

  const sourceColors = {
    MercadoPublico: '#3b82f6',
    ComprasAgiles: '#f59e0b',
    LinkedIn: '#0077b5',
    'Licitación Privada': '#8b5cf6',
  };

  const typeLabels = {
    licitacion_publica: 'Licitación Pública',
    compra_agil: 'Compra Ágil',
    oferta_privada: 'Oferta Privada',
    licitacion_privada: 'Licitación Privada',
  };

  let filtered = demoOpportunities.filter(o => {
    if (!showOutside && o.isOutsideRubro) return false;
    if (filter === 'all') return true;
    return o.category === filter;
  });

  filtered.sort((a, b) => {
    if (sort === 'matchScore') return b.matchScore - a.matchScore;
    if (sort === 'budget') return b.budget - a.budget;
    if (sort === 'deadline') return new Date(a.deadline) - new Date(b.deadline);
    return 0;
  });

  return (
    <div>
      <h1 className="page-title">Explorador de Oportunidades</h1>
      <p className="page-subtitle">{filtered.length} oportunidades encontradas</p>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Filter size={16} color="var(--text-muted)" />
        {[
          { value: 'all', label: 'Todas' },
          { value: 'construction', label: '🏗️ Construcción' },
          { value: 'programming', label: '💻 Programación' },
          { value: 'machinery', label: '🚜 Maquinaria' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`btn btn--sm ${filter === f.value ? 'btn--primary' : 'btn--secondary'}`}
          >
            {f.label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
            <div className="toggle">
              <input type="checkbox" checked={showOutside} onChange={e => setShowOutside(e.target.checked)} />
              <span className="toggle__slider"></span>
            </div>
            Fuera de rubro
          </label>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '6px 10px', fontSize: 12 }}
            value={sort}
            onChange={e => setSort(e.target.value)}
          >
            <option value="matchScore">Match ↓</option>
            <option value="budget">Presupuesto ↓</option>
            <option value="deadline">Fecha límite ↑</option>
          </select>
        </div>
      </div>

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filtered.map(opp => {
          const days = daysLeft(opp.deadline);
          return (
            <div key={opp.id} className={`opp-card ${opp.isOutsideRubro ? 'opp-card--outside' : ''}`}>
              <div className="opp-card__header">
                <div className={`score-badge score-badge--${getScoreClass(opp.matchScore)}`}>
                  {opp.matchScore}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="opp-card__title">{opp.title}</div>
                  <div className="opp-card__meta">
                    <span className="tag tag--info" style={{ background: sourceColors[opp.source] + '20', color: sourceColors[opp.source] }}>{opp.source}</span>
                    <span className="tag tag--accent">{typeLabels[opp.type]}</span>
                    <span className="tag" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>📍 {opp.region}</span>
                    <span className={`tag ${days <= 7 ? 'tag--danger' : 'tag--success'}`}>
                      {days > 0 ? `${days} días restantes` : 'Vencida'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="opp-card__desc">{opp.description}</div>

              {opp.requirements.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {opp.requirements.map(r => (
                    <span key={r} className="tag" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', fontSize: 11 }}>📋 {r}</span>
                  ))}
                </div>
              )}

              <div className="opp-card__reasons">
                {opp.matchReasons.map((r, i) => (
                  <span key={i} className="opp-card__reason">{r}</span>
                ))}
              </div>

              <div className="opp-card__footer">
                <div>
                  <div className="opp-card__budget">{formatMoney(opp.budget)}</div>
                  <div className="opp-card__entity">{opp.entity}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {opp.requiresGarantia && (
                    <span className="tag tag--warning">Garantía: {formatMoney(opp.garantiaAmount)}</span>
                  )}
                  <a href={opp.url} target="_blank" rel="noopener noreferrer" className="btn btn--sm btn--primary" onClick={e => e.stopPropagation()}>
                    Ver detalle <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Explorer;
