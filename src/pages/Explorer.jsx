import { useState, useEffect } from 'react';
import { Filter, SortDesc, ExternalLink, RefreshCw, Calendar, MapPin, Building, Clock, UploadCloud, ShieldCheck } from 'lucide-react';
import api from '../services/api';

function Explorer() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('matchScore');
  const [showOutside, setShowOutside] = useState(true);
  const [activeSources, setActiveSources] = useState({
    mercadopublico: true,
    compraagil: true,
    linkedin: true,
    privadas: true
  });

  // Expanded state for cards
  const [expandedId, setExpandedId] = useState(null);
  const [details, setDetails] = useState({});
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [analyzingPdf, setAnalyzingPdf] = useState(null);
  const [autoAnalyzing, setAutoAnalyzing] = useState(null);

  const loadSavedData = async () => {
    setLoading(true);
    const data = await api.getOpportunities();
    if (data && data.results) {
      setOpportunities(data.results);
    }
    setLoading(false);
  };

  useEffect(() => {
    console.log("[Explorer] Cargando datos iniciales...");
    loadSavedData();
  }, []);


  const handleExpand = async (id, source) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    
    // Si ya lo tenemos en caché con auditoría completa, no hacer nada
    if (details[id]?.isFullyAnalyzed) return;

    // Si no es MercadoPublico, solo cargar detalle básico si no existe
    if (source !== 'MercadoPublico') {
      if (!details[id]) {
        setLoadingDetail(true);
        const detailData = await api.getMercadoPublicoDetail(id);
        if (detailData && detailData.result) {
          setDetails(prev => ({ ...prev, [id]: detailData.result }));
        }
        setLoadingDetail(false);
      }
      return;
    }

    // --- LOGICA AUTO-AUDITORÍA PARA MERCADO PÚBLICO ---
    setLoadingDetail(true);
    const detailData = await api.getMercadoPublicoDetail(id);
    
    if (detailData && detailData.result) {
      const currentDetail = detailData.result;
      setDetails(prev => ({ ...prev, [id]: currentDetail }));

      // Si no tiene auditoría completa, lanzarla automáticamente en silencio
      if (!currentDetail.isFullyAnalyzed) {
        console.log(`[Auto] Iniciando auditoría automática para ${id}`);
        handleAutoAnalyze(id, true); // Pasar bandera de 'silent'
      }
    }
    setLoadingDetail(false);
  };


  const handleScan = async () => {
    setSearching(true);
    // Forzar activación de fuentes para que no parezca que no hay resultados
    setActiveSources({
      mercadopublico: true,
      compraagil: true,
      linkedin: true,
      privadas: true
    });

    try {
      const data = await api.searchAll();
      if (data && data.results) {
        console.log(`[Frontend] Recibidas ${data.results.length} oportunidades únicas`);
        setOpportunities(data.results);
      }
    } catch (err) {
      console.error("[Frontend] Error en escaneo:", err);
    } finally {
      setSearching(false);
    }
  };


  const handleScanAgiles = async () => {
    setSearching(true);
    const data = await api.searchComprasAgiles();
    if (data && data.results) {
      // Combinar con las existentes sin duplicar
      setOpportunities(prev => {
        const existingIds = new Set(prev.map(o => o.id));
        const news = data.results.filter(o => !existingIds.has(o.id));
        return [...news, ...prev];
      });
    }
    setSearching(false);
  };


  const handlePdfUpload = async (e, id) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzingPdf(id);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`http://localhost:3001/api/analyze-pdf/${id}`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.budget) {
        setDetails(prev => ({
          ...prev,
          [id]: { ...prev[id], budget: data.budget }
        }));
        
        // Actualizar oportunidad local
        setOpportunities(prev => prev.map(o => o.id === id ? { ...o, budget: data.budget } : o));
      } else {
        alert("Gemini no pudo encontrar un monto en el PDF. Revisa las bases manualmente.");
      }
    } catch (err) {
      console.error(err);
      alert("Error al analizar el PDF");
    } finally {
      setAnalyzingPdf(null);
    }
  };

  const handleAutoAnalyze = async (id, isSilent = false) => {
    setAutoAnalyzing(id);
    try {
      const res = await fetch(`http://localhost:3001/api/auto-analyze/${id}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setDetails(prev => ({
          ...prev,
          [id]: { 
            ...prev[id], 
            ...data,
            budget: (data.budget && data.budget > 0) ? data.budget : prev[id]?.budget
          }
        }));
        
        if (data.budget > 0) {
          setOpportunities(prev => prev.map(o => o.id === id ? { ...o, budget: data.budget } : o));
        }
        
        if (!isSilent) alert("¡Auditoría completa finalizada con éxito!");
      } else {
        if (!isSilent) alert(data.message || "No se pudo realizar la auditoría completa.");
      }
    } catch (err) {
      console.error(err);
      if (!isSilent) alert("Error en la automatización de Scrapfly");
    } finally {
      setAutoAnalyzing(null);
    }
  };

  const formatMoney = (n) => {
    if (n === null || n === undefined || n === 0) return 'Revisar Bases Técnicas';
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
    // Usar horas para mayor precisión y permitir mostrar las que cierran hoy mismo
    const diff = (new Date(d) - new Date());
    return Math.ceil(diff / (1000*60*60*24));
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
    // Relajar el filtro: solo ocultar si ya venció hace más de 12 horas (margen de error)
    if (dl !== null && dl < -0.5) return false;

    // Filtrar visitas a terreno expiradas
    if (o.fechaVisitaTerreno) {
      const visitDate = new Date(o.fechaVisitaTerreno);
      if (visitDate < new Date()) return false;
    }

    if (!showOutside && o.isOutsideRubro) return false;

    // Filtro por fuentes estricto
    const type = o.type || '';
    const source = o.source || '';
    if (type === 'compra_agil' && !activeSources.compraagil) return false;
    if (type !== 'compra_agil' && source === 'MercadoPublico' && !activeSources.mercadopublico) return false;
    if (source === 'LinkedIn' && !activeSources.linkedin) return false;
    if ((type === 'oferta_privada' || type === 'licitacion_privada' || source === 'Privada') && !activeSources.privadas) return false;

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
            onClick={handleScan} 
            disabled={searching}
            className="btn btn--primary btn--icon"
            style={{ padding: '8px 20px', borderRadius: '12px' }}
          >
            {searching ? <RefreshCw size={18} className="spinner" /> : <><RefreshCw size={18} /> Escanear Ahora</>}
          </button>
      </div>

      {/* Dashboard de Regiones */}
      <div style={{ 
        display: 'flex', 
        gap: 8, 
        flexWrap: 'wrap', // Evitar que se corra el contenido
        marginBottom: 20,
        width: '100%'
      }}>
        {Object.entries(
          filtered.reduce((acc, o) => {
            // Unificación Agresiva de Nombres
            let reg = o.region || 'Metropolitana';
            reg = reg.replace(/Región de |Región del |Región /g, '').trim();
            if (reg.includes('Metropolitana') || reg.includes('Santiago')) reg = 'Metropolitana';
            if (reg.includes('Valpara')) reg = 'Valparaíso';
            if (reg.includes('Biob')) reg = 'Biobío';
            if (reg.includes('Higgins')) reg = 'O\'Higgins';
            if (reg.includes('Arica')) reg = 'Arica y Parinacota';
            if (reg.includes('Magallanes')) reg = 'Magallanes';
            
            acc[reg] = (acc[reg] || 0) + 1;
            return acc;
          }, {})
        ).sort((a, b) => b[1] - a[1]).map(([reg, count]) => (
          <div key={reg} style={{ 
            background: 'var(--card-bg)', 
            padding: '6px 12px', 
            borderRadius: 16, 
            border: '1px solid var(--border)',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s ease'
          }}>
            <MapPin size={12} style={{ color: 'var(--accent)' }} />
            <strong>{reg}:</strong> 
            <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{count}</span>
          </div>
        ))}
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
          {/* Toggles de fuentes */}
          <div style={{ display: 'flex', gap: 12, marginRight: 12, borderRight: '1px solid var(--border-color)', paddingRight: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={activeSources.mercadopublico} onChange={e => setActiveSources(p => ({...p, mercadopublico: e.target.checked}))} />
              MercadoPúblico
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={activeSources.compraagil} onChange={e => setActiveSources(p => ({...p, compraagil: e.target.checked}))} />
              Compra Ágil
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={activeSources.linkedin} onChange={e => setActiveSources(p => ({...p, linkedin: e.target.checked}))} />
              LinkedIn
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={activeSources.privadas} onChange={e => setActiveSources(p => ({...p, privadas: e.target.checked}))} />
              Privadas
            </label>
          </div>

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
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
            {activeSources.compraagil && !activeSources.mercadopublico 
              ? "No hay Compras Ágiles cargadas en el sistema." 
              : "No hay oportunidades que coincidan con los filtros."}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <button onClick={handleScan} className="btn btn--primary">Realizar escaneo web</button>
            {activeSources.compraagil && (
              <button 
                onClick={handleScanAgiles} 
                className="btn btn--primary" 
                style={{ background: 'var(--accent-color)' }}
                disabled={searching}
              >
                {searching ? <RefreshCw size={16} className="spinner" /> : 'Buscar Compras Ágiles Ahora'}
              </button>
            )}
          </div>
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
                      {opp.fechaVisitaTerreno && (
                        <span className="tag tag--warning">📍 Visita Terreno: {formatDate(opp.fechaVisitaTerreno)}</span>
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
                        
                        {/* Sección de Auditoría de IA (Si existe) */}
                        {details[opp.id]?.isFullyAnalyzed && (
                          <div style={{ 
                            gridColumn: '1 / -1', 
                            background: '#e8f5e9', // Verde Pastel Suave
                            borderRadius: 12, 
                            padding: 16, 
                            marginTop: 16,
                            border: '1px dashed #4caf50'
                          }}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8, color: '#2e7d32' }}>
                              <ShieldCheck size={18} /> Auditoría de Requisitos (IA) - Cargado de Memoria
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 15, fontSize: '0.85rem' }}>
                              <div>
                                <strong style={{ display: 'block', marginBottom: 4 }}>🛡️ Garantías:</strong>
                                <ul style={{ margin: 0, paddingLeft: 18 }}>
                                  {details[opp.id].guarantees?.length > 0 ? details[opp.id].guarantees.map((g, i) => <li key={i}>{g}</li>) : <li>No especificadas</li>}
                                </ul>
                              </div>
                              <div>
                                <strong style={{ display: 'block', marginBottom: 4 }}>🏆 Experiencia:</strong>
                                <span>{details[opp.id].experience || 'No mencionada'}</span>
                              </div>
                              <div>
                                <strong style={{ display: 'block', marginBottom: 4 }}>📜 Certificaciones/Patentes:</strong>
                                <ul style={{ margin: 0, paddingLeft: 18 }}>
                                  {details[opp.id].certifications?.length > 0 ? details[opp.id].certifications.map((c, i) => <li key={i}>{c}</li>) : <li>No requeridas</li>}
                                </ul>
                              </div>
                              <div>
                                <strong style={{ display: 'block', marginBottom: 4 }}>📍 Visita a Terreno:</strong>
                                <span>{details[opp.id].siteVisit || 'No se menciona'}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Botón de acción si está expandido */}
                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, gap: 10 }}>
                          {(details[opp.id]?.budget === 0 || opp.budget === 0) ? (
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button 
                                className="btn btn--secondary" 
                                onClick={() => handleAutoAnalyze(opp.id)}
                                disabled={autoAnalyzing === opp.id}
                              >
                                {autoAnalyzing === opp.id ? (
                                  <><RefreshCw size={16} className="spinner" /> Saltando Captcha...</>
                                ) : (
                                  <><RefreshCw size={16} /> Auto-Extraer (IA Auditora)</>
                                )}
                              </button>

                              <div style={{ position: 'relative' }}>
                                <input 
                                  type="file" 
                                  accept="application/pdf,.doc,.docx" 
                                  onChange={(e) => handlePdfUpload(e, opp.id)}
                                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }}
                                  title="Arrastra el PDF aquí o haz clic para subirlo"
                                />
                                <button className="btn btn--secondary" disabled={analyzingPdf === opp.id} style={{ pointerEvents: 'none' }}>
                                  {analyzingPdf === opp.id ? (
                                    <><RefreshCw size={16} className="spinner" /> Analizando Bases...</>
                                  ) : (
                                    <><UploadCloud size={16} /> Drag & Drop PDF</>
                                  )}
                                </button>
                              </div>
                            </div>
                          ) : <div />}

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
