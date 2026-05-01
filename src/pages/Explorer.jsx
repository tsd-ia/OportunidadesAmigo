import { useState, useEffect, useMemo } from 'react';
import { Filter, SortDesc, ExternalLink, RefreshCw, Calendar, MapPin, Building, Clock, UploadCloud, ShieldCheck, Zap } from 'lucide-react';
import api from '../services/api';

function Explorer() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('matchScore');
  const [showOutside, setShowOutside] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSources, setActiveSources] = useState({
    mercadopublico: true,
    compraagil: true,
    linkedin: true,
    privadas: true
  });

  const [expandedId, setExpandedId] = useState(null);
  const [details, setDetails] = useState({});
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [analyzingPdf, setAnalyzingPdf] = useState(null);
  const [autoAnalyzing, setAutoAnalyzing] = useState(null);

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

  const handleExpand = async (id, source) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (details[id]?.isFullyAnalyzed) return;

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

    setLoadingDetail(true);
    const detailData = await api.getMercadoPublicoDetail(id);
    if (detailData && detailData.result) {
      const currentDetail = detailData.result;
      setDetails(prev => ({ ...prev, [id]: currentDetail }));
      if (!currentDetail.isFullyAnalyzed) {
        handleAutoAnalyze(id, true);
      }
    }
    setLoadingDetail(false);
  };

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

  const handleAutoAnalyze = async (id, isSilent = false) => {
    setAutoAnalyzing(id);
    try {
      const res = await fetch(`http://127.0.0.1:3001/api/auto-analyze/${id}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setDetails(prev => ({
          ...prev,
          [id]: { ...prev[id], ...data }
        }));
        if (!isSilent) alert("¡Auditoría completa finalizada!");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAutoAnalyzing(null);
    }
  };

  const formatMoney = (n) => {
    if (!n) return 'Revisar Bases';
    return `$${n.toLocaleString('es-CL')}`;
  };

  const formatDate = (d) => {
    if (!d) return 'No definida';
    return new Date(d).toLocaleDateString('es-CL');
  };

  const getScoreClass = (s) => s >= 80 ? 'high' : s >= 50 ? 'medium' : 'low';

  const daysLeft = (d) => {
    if (!d) return null;
    const diff = (new Date(d) - new Date());
    return Math.ceil(diff / (1000*60*60*24));
  };

  const sourceColors = {
    MercadoPublico: '#3b82f6',
    ComprasAgiles: '#f59e0b',
    LinkedIn: '#0077b5',
    'Licitación Privada': '#8b5cf6',
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
      const dl = daysLeft(o.deadline);
      if (dl !== null && dl < -1) return false;
      if (!showOutside && (o.matchScore || 0) < 60) return false;
      
      const source = o.source || '';
      if (source === 'ComprasAgiles' && !activeSources.compraagil) return false;
      if (source === 'MercadoPublico' && !activeSources.mercadopublico) return false;
      
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (!o.title?.toLowerCase().includes(search) && !o.id?.toLowerCase().includes(search)) return false;
      }
      return true;
    }).sort((a, b) => (b[sort] || 0) - (a[sort] || 0));
  }, [uniqueOpps, showOutside, activeSources, searchTerm, sort]);

  return (
    <div className="explorer-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1>Explorador de Oportunidades</h1>
        <button onClick={handleScan} disabled={searching} className="btn btn--primary">
          {searching ? <RefreshCw className="spinner" /> : 'Escanear Ahora'}
        </button>
      </div>

      <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="Buscar..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)}
          className="form-control"
          style={{ flex: 1 }}
        />
        <select value={sort} onChange={e => setSort(e.target.value)} className="form-select">
          <option value="matchScore">Match</option>
          <option value="budget">Presupuesto</option>
        </select>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <label><input type="checkbox" checked={activeSources.mercadopublico} onChange={e => setActiveSources(p=>({...p, mercadopublico: e.target.checked}))} /> MP</label>
          <label><input type="checkbox" checked={activeSources.compraagil} onChange={e => setActiveSources(p=>({...p, compraagil: e.target.checked}))} /> CA</label>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 50 }}><RefreshCw className="spinner" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((opp, idx) => (
            <div key={`${opp.id}-${idx}`} className="opp-card" onClick={() => handleExpand(opp.id, opp.source)}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div className={`score-badge score-badge--${getScoreClass(opp.matchScore)}`}>{opp.matchScore}</div>
                <div style={{ flex: 1, marginLeft: 15 }}>
                  <h3 style={{ margin: 0, fontSize: 16 }}>{opp.title}</h3>
                  <div style={{ fontSize: 12, color: '#666' }}>{opp.id} | {opp.source} | {opp.region}</div>
                </div>
                <div style={{ fontWeight: 'bold' }}>{formatMoney(opp.budget)}</div>
              </div>
              {expandedId === opp.id && (
                <div style={{ marginTop: 15, padding: 15, background: '#f9f9f9', borderRadius: 8 }}>
                  <p>{opp.description || 'Sin descripción'}</p>
                  <div style={{ display: 'flex', gap: 10 }}>
                     <button onClick={() => handleAutoAnalyze(opp.id)} className="btn btn--secondary">
                       {autoAnalyzing === opp.id ? 'Analizando...' : 'Auto-Analizar'}
                     </button>
                     <a href={opp.url} target="_blank" className="btn btn--primary">Ver en Portal</a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Explorer;
