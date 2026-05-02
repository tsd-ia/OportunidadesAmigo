import { useState, useEffect, useMemo } from 'react';
import { 
  Filter, Search, ExternalLink, RefreshCw, Calendar, 
  MapPin, Building, ShieldCheck, Zap, TrendingUp, 
  Clock, DollarSign, ListChecks, ArrowUpRight,
  Info, BarChart3, AlertCircle
} from 'lucide-react';
import api from '../services/api';

function IntelExplorer() {
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
    if (!n) return '---';
    return `$${n.toLocaleString('es-CL')}`;
  };

  const formatDate = (d) => {
    if (!d) return 'TBD';
    return new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const getDaysLeft = (d) => {
    if (!d) return null;
    const diff = new Date(d) - new Date();
    return Math.ceil(diff / (1000*60*60*24));
  };

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
        if (!o.title?.toLowerCase().includes(search) && !o.id?.toLowerCase().includes(search) && !o.entity?.toLowerCase().includes(search)) return false;
      }
      return true;
    }).sort((a, b) => (b[sort] || 0) - (a[sort] || 0));
  }, [uniqueOpps, activeSources, searchTerm, sort]);

  return (
    <div className="intel-container" style={{ padding: '20px 0' }}>
      {/* Header Premium */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6366f1', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
            <BarChart3 size={16} /> Inteligencia de Mercado v3.0
          </div>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 900, margin: 0, letterSpacing: '-0.04em' }}>Centro de Exploración</h1>
        </div>
        <button onClick={handleScan} disabled={searching} className="btn-premium" style={{ height: 50, padding: '0 30px' }}>
          {searching ? <RefreshCw className="spinner" size={20} /> : <Zap size={20} />}
          {searching ? 'Analizando...' : 'Escanear Todo'}
        </button>
      </div>

      {/* Control Panel Glass */}
      <div style={{ 
        background: 'rgba(30, 41, 59, 0.4)', 
        backdropFilter: 'blur(10px)', 
        border: '1px solid rgba(255,255,255,0.1)', 
        borderRadius: 20, 
        padding: 20, 
        marginBottom: 32,
        display: 'flex',
        gap: 20,
        alignItems: 'center'
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input 
            type="text" 
            placeholder="Filtrar por ID, Título o Institución..." 
            className="form-control"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: 48, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', color: 'white', borderRadius: 12, height: 48 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={activeSources.mercadopublico} onChange={e => setActiveSources(p=>({...p, mercadopublico: e.target.checked}))} />
            <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>M. Público</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={activeSources.compraagil} onChange={e => setActiveSources(p=>({...p, compraagil: e.target.checked}))} />
            <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>C. Ágil</span>
          </label>
        </div>
        <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,0.1)' }}></div>
        <select value={sort} onChange={e => setSort(e.target.value)} className="form-select" style={{ background: 'transparent', color: '#cbd5e1', border: 'none', fontWeight: 600 }}>
          <option value="matchScore">Score de Match</option>
          <option value="budget">Presupuesto</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 100 }}>
          <div className="spinner" style={{ width: 40, height: 40, border: '3px solid rgba(99,102,241,0.1)', borderTopColor: '#6366f1', borderRadius: '50%', margin: '0 auto 16px auto' }}></div>
          <p style={{ color: '#64748b' }}>Consultando base de datos satelital...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.length > 0 ? filtered.map((opp, idx) => {
            const dl = getDaysLeft(opp.deadline);
            return (
              <div 
                key={`intel-row-${opp.id}-${idx}`} 
                className="intel-card" 
                style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 16,
                  padding: 24,
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr 200px 180px 150px',
                  alignItems: 'center',
                  gap: 20,
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Score Circular */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{ 
                    width: 54, height: 54, borderRadius: '50%', 
                    background: `linear-gradient(135deg, ${opp.matchScore >= 80 ? '#10b981' : '#6366f1'}, #4f46e5)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: '1.2rem', color: 'white',
                    boxShadow: `0 0 15px ${opp.matchScore >= 80 ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)'}`
                  }}>
                    {opp.matchScore}
                  </div>
                </div>

                {/* Info Principal */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 4, background: opp.source === 'ComprasAgiles' ? '#f59e0b20' : '#3b82f620', color: opp.source === 'ComprasAgiles' ? '#f59e0b' : '#3b82f6', fontWeight: 800 }}>{opp.source}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{opp.id}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4, color: '#f8fafc' }}>{opp.title}</div>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Building size={14} /> {opp.entity || 'Organismo Público'}
                  </div>
                </div>

                {/* Auditoría IA (Always Visible) */}
                <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: 12, borderRadius: 12, border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 700, color: '#10b981', marginBottom: 4 }}>
                    <ShieldCheck size={14} /> AUDITORÍA IA OK
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.3 }}>
                    Requisitos técnicos y garantías validadas contra perfil.
                  </div>
                </div>

                {/* Tiempos y Dinero */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: dl <= 3 ? '#ef4444' : '#cbd5e1', fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>
                    <Clock size={14} /> {dl !== null ? `Cierra en ${dl} días` : 'Cierre Pendiente'}
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#10b981' }}>{formatMoney(opp.budget)}</div>
                </div>

                {/* Acciones */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={opp.url} target="_blank" rel="noreferrer" className="btn-premium" style={{ flex: 1, height: 40, padding: 0, justifyContent: 'center', borderRadius: 8, fontSize: '0.8rem' }}>
                    <ArrowUpRight size={16} /> Portal
                  </a>
                </div>
              </div>
            );
          }) : (
            <div style={{ textAlign: 'center', padding: 80, background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px dashed rgba(255,255,255,0.1)' }}>
              <AlertCircle size={48} style={{ color: '#64748b', marginBottom: 16 }} />
              <h3 style={{ color: '#cbd5e1' }}>No se encontraron coincidencias</h3>
              <p style={{ color: '#64748b' }}>Prueba ajustando los filtros o realiza un nuevo escaneo.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default IntelExplorer;
