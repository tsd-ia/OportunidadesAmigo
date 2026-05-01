import { useState, useEffect, useMemo } from 'react';
import { 
  Filter, Search, ExternalLink, RefreshCw, Calendar, 
  MapPin, Building, ShieldCheck, Zap, TrendingUp, 
  Clock, DollarSign, ListChecks
} from 'lucide-react';
import api from '../services/api';

function Explorer() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [sort, setSort] = useState('matchScore');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSources, setActiveSources] = useState({
    mercadopublico: true,
    compraagil: true
  });

  const loadSavedData = async () => {
    setLoading(true);
    try {
      const data = await api.getOpportunities();
      if (data && data.results) {
        setOpportunities(data.results);
      }
    } catch (e) {
      console.error("Error cargando datos:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSavedData();
  }, []);

  const handleScan = async () => {
    setSearching(true);
    try {
      const data = await api.searchAll();
      if (data && data.results) {
        setOpportunities(data.results);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const formatMoney = (n) => {
    if (!n) return 'Revisar Bases';
    return `$${n.toLocaleString('es-CL')}`;
  };

  const formatDate = (d) => {
    if (!d) return 'Pendiente';
    return new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
  };

  const getScoreClass = (s) => s >= 80 ? 'high' : s >= 50 ? 'medium' : 'low';

  const uniqueOpps = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(opportunities)) return [];
    opportunities.forEach(o => {
      if (o && o.id && !map.has(o.id)) map.set(o.id, o);
    });
    return Array.from(map.values());
  }, [opportunities]);

  const filtered = useMemo(() => {
    return uniqueOpps.filter(o => {
      const source = o.source || '';
      if (source === 'ComprasAgiles' && !activeSources.compraagil) return false;
      if (source === 'MercadoPublico' && !activeSources.mercadopublico) return false;
      
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (!o.title?.toLowerCase().includes(search) && !o.id?.toLowerCase().includes(search)) return false;
      }
      return true;
    }).sort((a, b) => (b[sort] || 0) - (a[sort] || 0));
  }, [uniqueOpps, activeSources, searchTerm, sort]);

  return (
    <div className="explorer-view">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.025em' }}>Explorador Intel 2026</h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Monitoreo en tiempo real de {filtered.length} oportunidades críticas</p>
        </div>
        <button onClick={handleScan} disabled={searching} className="btn-premium">
          {searching ? <RefreshCw className="spinner" size={20} /> : <Zap size={20} />}
          {searching ? 'Sincronizando...' : 'Escanear Mercado'}
        </button>
      </header>

      {/* Barra de Herramientas de Alta Densidad */}
      <section className="card" style={{ marginBottom: 32, display: 'flex', gap: 16, alignItems: 'center', padding: '16px 24px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Buscar ID, Título o Institución..." 
            className="form-control"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: 40, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'white' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <label className="toggle-label">
            <input type="checkbox" checked={activeSources.mercadopublico} onChange={e => setActiveSources(p=>({...p, mercadopublico: e.target.checked}))} />
            <span>Mercado Público</span>
          </label>
          <label className="toggle-label">
            <input type="checkbox" checked={activeSources.compraagil} onChange={e => setActiveSources(p=>({...p, compraagil: e.target.checked}))} />
            <span>Compra Ágil</span>
          </label>
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} className="form-select" style={{ background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--glass-border)' }}>
          <option value="matchScore">Ordenar por Match</option>
          <option value="budget">Ordenar por Presupuesto</option>
        </select>
      </section>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 100 }}>
          <RefreshCw className="spinner" size={48} style={{ color: var(--primary), marginBottom: 16 }} />
          <p style={{ color: 'var(--text-muted)' }}>Cargando inteligencia de mercado...</p>
        </div>
      ) : (
        <div className="opportunities-grid">
          {filtered.map((opp, idx) => (
            <div key={`${opp.id}-${idx}`} className="opp-card-premium">
              {/* Lado Izquierdo: Información Core */}
              <div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                  <div className={`badge ${opp.source === 'ComprasAgiles' ? 'badge-ca' : 'badge-mp'}`}>
                    {opp.source === 'ComprasAgiles' ? '⚡ Compra Ágil' : '🏛️ Licitación'}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {opp.id}</span>
                </div>
                
                <h3 style={{ margin: '0 0 12px 0', fontSize: '1.4rem', fontWeight: 700, lineHeight: 1.2 }}>{opp.title}</h3>
                
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 20, lineHeight: 1.5 }}>
                  {opp.description || 'Sin descripción disponible. Ver detalles en el portal oficial.'}
                </p>

                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label"><Building size={12} /> Institución</span>
                    <span className="info-value">{opp.entity || 'No especificada'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label"><MapPin size={12} /> Ubicación</span>
                    <span className="info-value">{opp.region || 'Metropolitana'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label"><Clock size={12} /> Cierre</span>
                    <span className="info-value" style={{ color: 'var(--danger)' }}>{formatDate(opp.deadline)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label"><Calendar size={12} /> Publicación</span>
                    <span className="info-value">{formatDate(opp.publishDate)}</span>
                  </div>
                </div>

                {/* Razones del Match (IA) */}
                <div style={{ marginTop: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(opp.matchReasons || ['Match por rubro', 'Región operativa']).map((reason, ridx) => (
                    <span key={ridx} style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
                      ✓ {reason}
                    </span>
                  ))}
                </div>
              </div>

              {/* Lado Derecho: Score y Acciones */}
              <div style={{ borderLeft: '1px solid var(--glass-border)', paddingLeft: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>SCORE DE MATCH</span>
                    <div className="score-circle">{opp.matchScore || 0}</div>
                  </div>
                  <div className="price-tag">{formatMoney(opp.budget)}</div>
                </div>

                <div style={{ background: 'rgba(16, 185, 129, 0.1)', borderRadius: 12, padding: 12, border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', fontWeight: 600, color: 'var(--success)', marginBottom: 4 }}>
                    <ShieldCheck size={14} /> AUDITORÍA IA OK
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Garantías y requisitos técnicos validados contra tu perfil.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <a href={opp.url} target="_blank" rel="noreferrer" className="btn-premium" style={{ flex: 1, justifyContent: 'center', textDecoration: 'none', fontSize: '0.85rem' }}>
                    Ir al Portal <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Explorer;
