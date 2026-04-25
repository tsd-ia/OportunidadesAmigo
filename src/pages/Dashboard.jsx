import { TrendingUp, Clock, Star, AlertTriangle, ArrowRight, Zap } from 'lucide-react';
import { demoOpportunities } from '../data/opportunities';
import { Link } from 'react-router-dom';

function Dashboard() {
  const totalOpp = demoOpportunities.length;
  const highMatch = demoOpportunities.filter(o => o.matchScore >= 80).length;
  const expiringSoon = demoOpportunities.filter(o => {
    const days = Math.ceil((new Date(o.deadline) - new Date()) / (1000*60*60*24));
    return days <= 7 && days > 0;
  }).length;
  const outsideRubro = demoOpportunities.filter(o => o.isOutsideRubro).length;
  const totalBudget = demoOpportunities.reduce((sum, o) => sum + o.budget, 0);

  const topOpps = [...demoOpportunities].sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);

  const formatMoney = (n) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(0)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n}`;
  };

  const getScoreClass = (s) => s >= 80 ? 'high' : s >= 50 ? 'medium' : 'low';

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">Resumen de oportunidades activas — {new Date().toLocaleDateString('es-CL')}</p>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-card__icon" style={{ background: 'rgba(99,102,241,0.15)' }}>
            <Zap color="#6366f1" size={24} />
          </div>
          <div className="stat-card__info">
            <div className="stat-card__label">Oportunidades Activas</div>
            <div className="stat-card__value">{totalOpp}</div>
            <div className="stat-card__change stat-card__change--up">+3 hoy</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon" style={{ background: 'rgba(34,197,94,0.15)' }}>
            <Star color="#22c55e" size={24} />
          </div>
          <div className="stat-card__info">
            <div className="stat-card__label">Match Alto (&gt;80%)</div>
            <div className="stat-card__value">{highMatch}</div>
            <div className="stat-card__change stat-card__change--up">Recomendadas</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon" style={{ background: 'rgba(245,158,11,0.15)' }}>
            <Clock color="#f59e0b" size={24} />
          </div>
          <div className="stat-card__info">
            <div className="stat-card__label">Por Vencer (7 días)</div>
            <div className="stat-card__value">{expiringSoon}</div>
            <div className="stat-card__change stat-card__change--down">¡Apúrate!</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon" style={{ background: 'rgba(139,92,246,0.15)' }}>
            <TrendingUp color="#8b5cf6" size={24} />
          </div>
          <div className="stat-card__info">
            <div className="stat-card__label">Valor Total</div>
            <div className="stat-card__value">{formatMoney(totalBudget)}</div>
            <div className="stat-card__change stat-card__change--up">En juego</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Top oportunidades */}
        <div className="card">
          <div className="section-header">
            <h2 className="section-title">🔥 Top Oportunidades</h2>
            <Link to="/explorer" className="btn btn--sm btn--secondary">
              Ver todas <ArrowRight size={14} />
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {topOpps.map(opp => (
              <div key={opp.id} className="opp-card" style={{ padding: 14 }}>
                <div className="opp-card__header" style={{ marginBottom: 8 }}>
                  <div className={`score-badge score-badge--${getScoreClass(opp.matchScore)}`}>
                    {opp.matchScore}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="opp-card__title" style={{ fontSize: 13 }}>{opp.title}</div>
                    <div className="opp-card__entity">{opp.entity}</div>
                  </div>
                  <span className="opp-card__budget" style={{ fontSize: 14 }}>{formatMoney(opp.budget)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumen por área */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h2 className="section-title" style={{ marginBottom: 16 }}>📊 Por Área</h2>
            {[
              { label: 'Construcción', count: demoOpportunities.filter(o => o.category === 'construction').length, color: '#3b82f6', emoji: '🏗️' },
              { label: 'Programación', count: demoOpportunities.filter(o => o.category === 'programming').length, color: '#8b5cf6', emoji: '💻' },
              { label: 'Maquinaria', count: demoOpportunities.filter(o => o.category === 'machinery').length, color: '#f59e0b', emoji: '🚜' },
              { label: 'Fuera de rubro', count: outsideRubro, color: '#ef4444', emoji: '💡' },
            ].map(area => (
              <div key={area.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <span style={{ fontSize: 22 }}>{area.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{area.label}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{area.count}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar__fill" style={{ width: `${(area.count / totalOpp) * 100}%`, background: area.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(239,68,68,0.1))', borderColor: 'rgba(245,158,11,0.3)' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <AlertTriangle color="#f59e0b" size={22} />
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>💡 Sugerencia del Asistente</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Hay {outsideRubro} oportunidades fuera de tu rubro que no requieren experiencia específica. 
                  ¡Podrían ser un ingreso extra sin complicaciones!
                </p>
                <Link to="/assistant" className="btn btn--sm btn--primary" style={{ marginTop: 10 }}>
                  Ver sugerencias
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
