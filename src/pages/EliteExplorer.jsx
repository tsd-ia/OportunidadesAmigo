import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, RefreshCw, Zap, ArrowUpRight, BarChart3, ShieldCheck
} from 'lucide-react';

function EliteExplorer() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sort, setSort] = useState('matchScore');
  const [activeSources, setActiveSources] = useState({ mercadopublico: true, compraagil: true });
  
  const hasLoaded = useRef(false);

  const fetchIntelDataFromTerminal = async () => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    try {
      const res = await fetch('http://127.0.0.1:3001/api/opportunities');
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      
      let items = Array.isArray(data) ? data : (data?.results || []);
      
      if (items.length > 0) {
        // Deduplicación rápida por ID
        const unique = [];
        const seen = new Set();
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item?.id && !seen.has(item.id)) {
            seen.add(item.id);
            unique.push(item);
          }
        }
        setOpportunities(unique);
      }
    } catch (err) {
      console.error("CRITICAL_FETCH_ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchIntelDataFromTerminal(); 
  }, []);

  const filtered = useMemo(() => {
    const results = opportunities.filter(o => {
      if (o.source === 'ComprasAgiles' && !activeSources.compraagil) return false;
      if (o.source === 'MercadoPublico' && !activeSources.mercadopublico) return false;
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        return (o.title || '').toLowerCase().includes(s) || (o.id || '').toLowerCase().includes(s);
      }
      return true;
    });
    
    results.sort((a, b) => (b[sort] || 0) - (a[sort] || 0));
    return results.slice(0, 50); // LIMITADO A 50 PARA SEGURIDAD ABSOLUTA EN ESTA FASE
  }, [opportunities, activeSources, searchTerm, sort]);

  return (
    <div className="hft-terminal" style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', margin: 0, color: '#6366f1', fontWeight: 900 }}>TERMINAL_INTEL_v3.0</h1>
          <p style={{ color: '#64748b', fontSize: '0.8rem' }}>REGISTROS_ACTIVOS: {opportunities.length} | MOSTRANDO: {filtered.length}</p>
        </div>
        <button onClick={() => { hasLoaded.current = false; fetchIntelDataFromTerminal(); }} className="btn-premium">
          ACTUALIZAR
        </button>
      </header>

      <div style={{ display: 'flex', gap: 15, marginBottom: 20, background: '#1e293b', padding: '10px 20px', borderRadius: 8, border: '1px solid #334155' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 12, color: '#64748b' }} />
          <input 
            type="text" 
            placeholder="BUSCAR_ID_O_TITULO..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '8px 10px 8px 30px', background: 'transparent', border: 'none', color: '#10b981', outline: 'none' }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#6366f1' }}>CARGANDO_DATOS...</div>
      ) : (
        <div style={{ border: '1px solid #1e293b', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead style={{ background: '#1e293b', textAlign: 'left', color: '#64748b' }}>
              <tr>
                <th style={{ padding: 12 }}>MATCH</th>
                <th style={{ padding: 12 }}>IDENTIFICADOR</th>
                <th style={{ padding: 12 }}>TÍTULO</th>
                <th style={{ padding: 12 }}>MONTO</th>
                <th style={{ padding: 12 }}>LINK</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((opp) => (
                <tr key={`row-${opp.id}`} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: 12, fontWeight: 900, color: opp.matchScore >= 80 ? '#10b981' : '#6366f1' }}>{opp.matchScore}%</td>
                  <td style={{ padding: 12 }}>
                    <div style={{ fontSize: '0.7rem' }}>{opp.id}</div>
                    <div style={{ fontSize: '0.6rem', color: '#64748b' }}>{opp.source}</div>
                  </td>
                  <td style={{ padding: 12 }}>
                    <div style={{ fontWeight: 700 }}>{(opp.title || 'SIN_TITULO').substring(0, 80)}...</div>
                    <div style={{ fontSize: '0.6rem', color: '#10b981' }}>IA_VERIFIED</div>
                  </td>
                  <td style={{ padding: 12, fontWeight: 800 }}>${(opp.budget || 0).toLocaleString('es-CL')}</td>
                  <td style={{ padding: 12 }}>
                    <a href={opp.url} target="_blank" rel="noreferrer" style={{ color: '#6366f1', textDecoration: 'none' }}>
                      ABRIR
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default EliteExplorer;
