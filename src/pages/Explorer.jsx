import { useState, useEffect } from 'react';
import { Filter, SortDesc, ExternalLink, RefreshCw, Calendar, MapPin, Building, Clock } from 'lucide-react';
import api from '../services/api';

function Explorer() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('matchScore');
  const [showOutside, setShowOutside] = useState(true);

  // Expanded state for cards
  const [expandedId, setExpandedId] = useState(null);
  const [details, setDetails] = useState({});
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    loadSavedData();
  }, []);

  const handleExpand = async (id, source) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    
    // Si ya lo tenemos en caché o no es MercadoPublico, no hacer fetch
    if (details[id] || source !== 'MercadoPublico') return;

    setLoadingDetail(true);
    const detailData = await api.getMercadoPublicoDetail(id);
    if (detailData && detailData.result) {
      setDetails(prev => ({ ...prev, [id]: detailData.result }));
    }
    setLoadingDetail(false);
  };

  const loadSavedData = async () => {
    setLoading(true);
    const data = await api.getOpportunities();
    if (data && data.results) {
      setOpportunities(data.results);
    }
    setLoading(false);
  };

  const performSearch = async () => {
    setSearching(true);
    const data = await api.searchAll();
    if (data && data.results) {
      setOpportunities(data.results);
    }
    setSearching(false);
  };

  const formatMoney = (n) => {
    if (n === null || n === undefined || n === 0) return 'Monto no especificado';
    return `$${n.toLocaleString('es-CL')}`;
  };

  const formatDate = (d) => {
    if (!d) return 'No definida';
    const date = new Date(d);
    return date.toLocaleDateString('es-CL', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getScoreClass = (s) => s >= 80 ? 'high' : s >= 50 ? 'medium' : 'low';

  const daysLeft = (d) => {
    if (!d) return null;
    return Math.ceil((new Date(d) - new Date()) / (1000*60*60*24));
  };

  const sourceColors = {
    MercadoPublico: '#3b82f6',
    ComprasAgiles: '#f59e0b',
    LinkedIn: '#0077b5',
    'Licitación Privada': '#8b5cf6',
  };

  let filtered = opportunities.filter(o => {
    // Filtrar expiradas en el frontend también
    const dl = daysLeft(o.deadline);
    if (dl !== null && dl <= 0) return false;

    if (!showOutside && o.isOutsideRubro) return false;
    if (filter === 'all') return true;
    return o.category === filter;
  });

  filtered.sort((a, b) => {
    if (sort === 'matchScore') return b.matchScore - a.matchScore;
    if (sort === 'budget') return b.budget - a.budget;
    if (sort === 'deadline') {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    }
    return 0;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Explorador de Oportunidades</h1>
          <p className="page-subtitle">{filtered.length} oportunidades encontradas</p>
        </div>
        <button 
          onClick={performSearch} 
          disabled={searching}
          className="btn btn--primary"
          style={{ display: 'flex', gap: 8, alignItems: 'center' }}
        >
          <RefreshCw size={16} className={searching ? "spinner" : ""} />
          {searching ? 'Buscando datos reales...' : 'Escanear Ahora'}
        </button>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Filter size={16} color="var(--text-muted)" />
        {[
          { value: 'all', label: 'Todas' },
          { value: 'construction', label: '🏗️ Construcción' },
          { value: 'programming', label: '💻 Programación' },
          { value: 'machinery', label: '🚜 Maquinaria' },
          { value: 'other', label: '📦 Otros' },
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
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="spinner" style={{ marginBottom: 10 }} />
          <p>Cargando datos guardados...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>No hay oportunidades que coincidan con los filtros.</p>
          <button onClick={performSearch} className="btn btn--primary">Realizar escaneo web</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map(opp => {
            const days = daysLeft(opp.deadline);
            const isExpanded = expandedId === opp.id;
            
            return (
              <div 
                key={opp.id} 
                className={`opp-card ${opp.isOutsideRubro ? 'opp-card--outside' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => handleExpand(opp.id, opp.source)}
              >
                <div className="opp-card__header">
                  <div className={`score-badge score-badge--${getScoreClass(opp.matchScore)}`}>
                    {opp.matchScore}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="opp-card__title">{opp.title}</div>
                    <div className="opp-card__meta">
                      <span className="tag tag--info" style={{ background: sourceColors[opp.source] + '20', color: sourceColors[opp.source] || '#888' }}>{opp.source}</span>
                      <span className="tag tag--accent">{opp.typeName || opp.type}</span>
                      <span className="tag" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>📍 {opp.region}</span>
                      {days !== null && (
                        <span className={`tag ${days <= 7 ? 'tag--danger' : 'tag--success'}`}>
                          {days > 0 ? `${days} días restantes` : 'Vencida'}
                        </span>
                      )}
                      <span className="tag" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                        ID: {opp.id}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="opp-card__desc">{(isExpanded && details[opp.id]) ? details[opp.id].description : opp.description || 'Sin descripción detallada. Haz clic para cargar.'}</div>

                {isExpanded && (
                  <div style={{ 
                    marginTop: 16, 
                    padding: 16, 
                    background: 'rgba(0,0,0,0.2)', 
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16
                  }}>
                    {loadingDetail && !details[opp.id] ? (
                      <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
                        <RefreshCw size={20} className="spinner" style={{ marginBottom: 10 }} />
                        <p>Obteniendo bases completas de Mercado Público...</p>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {/* Fechas */}
                        <div>
                          <h4 style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Calendar size={14} /> Cronograma
                          </h4>
                          <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Publicación:</span> 
                              <span>{formatDate(details[opp.id]?.publishDate || opp.publishDate)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Cierre:</span> 
                              <span style={{ color: 'var(--text-danger)' }}>{formatDate(details[opp.id]?.deadline || opp.deadline)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Adjudicación:</span> 
                              <span>{formatDate(details[opp.id]?.fechaAdjudicacion || opp.fechaAdjudicacion)}</span>
                            </div>
                            {(details[opp.id]?.tieneVisitaTerreno || opp.tieneVisitaTerreno) && (
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--warning-color)' }}>Visita Terreno:</span> 
                                <span>{formatDate(details[opp.id]?.fechaVisitaTerreno || opp.fechaVisitaTerreno)}</span>
                              </div>
                            )}
                            {(details[opp.id]?.fechaEntregaAntecedentes || opp.fechaEntregaAntecedentes) && (
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Antecedentes:</span> 
                                <span>{formatDate(details[opp.id]?.fechaEntregaAntecedentes || opp.fechaEntregaAntecedentes)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Entidad y Ubicación */}
                        <div>
                          <h4 style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Building size={14} /> Entidad Compradora
                          </h4>
                          <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Organismo:</span> 
                              <span style={{ textAlign: 'right', maxWidth: '70%' }}>{details[opp.id]?.entity || opp.entity}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Comuna:</span> 
                              <span>{details[opp.id]?.comuna || opp.comuna || 'No especificada'}</span>
                            </div>
                            {(details[opp.id]?.direccionVisita || opp.direccionVisita) && (
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Dirección Visita:</span> 
                                <span style={{ textAlign: 'right', maxWidth: '70%' }}>{details[opp.id]?.direccionVisita || opp.direccionVisita}</span>
                              </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Contacto:</span> 
                              <span>{details[opp.id]?.contactName || opp.contactName || 'No especificado'}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Botón de acción si está expandido */}
                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                          <a 
                            href={opp.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn btn--primary" 
                            onClick={e => e.stopPropagation()}
                          >
                            Ir al Portal Oficial <ExternalLink size={16} style={{ marginLeft: 6 }} />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!isExpanded && (
                  <div className="opp-card__reasons">
                    {opp.matchReasons.map((r, i) => (
                      <span key={i} className="opp-card__reason">{r}</span>
                    ))}
                  </div>
                )}

                <div className="opp-card__footer" style={{ marginTop: isExpanded ? 16 : 0 }}>
                  <div>
                    <div className="opp-card__budget">{formatMoney(details[opp.id]?.budget || opp.budget)}</div>
                    {!isExpanded && <div className="opp-card__entity" style={{ maxWidth: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{opp.entity}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {opp.tieneVisitaTerreno && !isExpanded && (
                      <span className="tag tag--warning" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={10} /> Visita Terreno</span>
                    )}
                    {opp.requiresGarantia && (
                      <span className="tag tag--warning">Garantía: {formatMoney(opp.garantiaAmount)}</span>
                    )}
                    {!isExpanded && (
                      <span className="btn btn--sm btn--secondary" style={{ pointerEvents: 'none' }}>
                        Ver más detalles
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Explorer;
