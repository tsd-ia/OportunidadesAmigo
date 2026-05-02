import { TrendingUp, Clock, Star, AlertTriangle, ArrowRight, Zap, DollarSign, Activity } from 'lucide-react';
import { demoOpportunities } from '../data/opportunities';
import { Link } from 'react-router-dom';

function Dashboard() {
  const totalOpp = demoOpportunities.length;
  const highMatch = demoOpportunities.filter(o => o.matchScore >= 80).length;
  const expiringSoon = demoOpportunities.filter(o => {
    const days = Math.ceil((new Date(o.deadline) - new Date()) / (1000*60*60*24));
    return days <= 7 && days > 0;
  }).length;
  const totalBudget = demoOpportunities.reduce((sum, o) => sum + o.budget, 0);

  const topOpps = [...demoOpportunities].sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);

  const formatMoney = (n) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    return `$${(n / 1000).toFixed(0)}K`;
  };

  return (
    <div className="dashboard-premium">
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: 0, background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Centro de Operaciones
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>Año 2026 — Inteligencia de Mercado Activa</p>
      </div>

      <div className="grid-4" style={{ marginBottom: 40, gap: 24 }}>
        {[
          { label: 'Oportunidades', value: totalOpp, icon: Zap, color: '#6366f1' },
          { label: 'Match Crítico', value: highMatch, icon: Star, color: '#22c55e' },
          { label: 'Por Vencer', value: expiringSoon, icon: Clock, color: '#f59e0b' },
          { label: 'Volumen Total', value: formatMoney(totalBudget), icon: TrendingUp, color: '#8b5cf6' },
        ].map((stat, i) => (
          <div key={i} className="stat-card-premium" style={{ background: 'rgba(30, 41, 59, 0.7)', padding: 24, borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ padding: 12, borderRadius: 12, background: `${stat.color}20` }}>
                <stat.icon color={stat.color} size={24} />
              </div>
              <Activity size={16} color="#94a3b8" />
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>{stat.label}</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: 4 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 32 }}>
        <div className="card" style={{ background: 'rgba(30, 41, 59, 0.7)', borderRadius: 24, padding: 32, border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>🔥 Objetivos Prioritarios</h2>
            <Link to="/explorer" className="btn-premium" style={{ padding: '6px 16px', fontSize: '0.8rem' }}>Ver Explorador</Link>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {topOpps.map((opp, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem' }}>
                  {opp.matchScore}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{opp.title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{opp.entity}</div>
                </div>
                <div style={{ fontWeight: 800, color: '#10b981' }}>{formatMoney(opp.budget)}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))', borderRadius: 24, padding: 32, border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={20} color="#f59e0b" /> Inteligencia de Rubro
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Hemos detectado un incremento del 24% en licitaciones de <strong>Obras Civiles</strong> en la Región Metropolitana. 
              Se recomienda actualizar el registro de proveedores.
            </p>
          </div>
          
          <div className="card" style={{ background: 'rgba(30, 41, 59, 0.7)', borderRadius: 24, padding: 32, border: '1px solid rgba(255,255,255,0.1)', flex: 1 }}>
            <h3 style={{ margin: '0 0 20px 0' }}>📊 Distribución de Capital</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { label: 'Construcción', p: 65, color: '#6366f1' },
                { label: 'Servicios', p: 20, color: '#f59e0b' },
                { label: 'Tecnología', p: 15, color: '#10b981' },
              ].map((bar, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 8 }}>
                    <span style={{ fontWeight: 600 }}>{bar.label}</span>
                    <span style={{ color: '#94a3b8' }}>{bar.p}%</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${bar.p}%`, background: bar.color, boxShadow: `0 0 10px ${bar.color}40` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
