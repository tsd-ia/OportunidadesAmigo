import { Bell, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';

const initialNotifications = [
  { id: 101, title: 'Sistema Operativo', message: 'Bienvenido al Centro de Inteligencia 2026', time: 'ahora', type: 'new' },
  { id: 102, title: 'Filtros Activos', message: 'Monitoreando Mercado Público y Compra Ágil', time: 'hace 1 min', type: 'success' },
];

function Notifications() {
  const [notifications] = useState(initialNotifications);

  const getIcon = (type) => {
    switch (type) {
      case 'new': return <Bell color="#3b82f6" />;
      case 'warning': return <AlertCircle color="#f59e0b" />;
      case 'success': return <CheckCircle color="#10b981" />;
      default: return <Bell />;
    }
  };

  return (
    <div className="notifications-view" style={{ padding: 40 }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: 0 }}>Alertas Críticas</h1>
        <p style={{ color: '#94a3b8', fontSize: '1.2rem' }}>Centro de Notificaciones en Tiempo Real</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {notifications.length > 0 ? (
          notifications.map((n, idx) => (
            <div 
              key={`notif-global-${n.id}-${idx}-${Math.random()}`} 
              style={{ 
                background: 'rgba(30, 41, 59, 0.7)', 
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: 30, 
                borderRadius: 20,
                display: 'flex',
                gap: 24,
                alignItems: 'center',
                transition: 'transform 0.2s'
              }}
            >
              <div style={{ padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.05)' }}>
                {getIcon(n.type)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: 4 }}>{n.title}</div>
                <div style={{ color: '#cbd5e1', fontSize: '1.1rem' }}>{n.message}</div>
                <div style={{ color: '#6366f1', fontSize: '0.9rem', marginTop: 12, fontWeight: 700, textTransform: 'uppercase' }}>{n.time}</div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: 100, opacity: 0.5 }}>
            <Bell size={64} color="#94a3b8" style={{ marginBottom: 20 }} />
            <div style={{ fontSize: '1.5rem' }}>No hay alertas pendientes</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
