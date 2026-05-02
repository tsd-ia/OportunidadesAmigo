import { Bell, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';

const initialNotifications = [
  { id: 1, title: 'Nueva Compra Ágil', message: 'Se detectó una oportunidad en tu rubro: 4828-28-COT26', time: 'hace 5 min', type: 'new' },
  { id: 2, title: 'Cierre Próximo', message: 'La licitación 3250-283-COT26 cierra en 2 horas', time: 'hace 10 min', type: 'warning' },
  { id: 3, title: 'Adjudicación Detectada', message: 'Se ha publicado el resultado de la licitación 4567-12-LP25', time: 'hace 1 hora', type: 'success' },
];

function Notifications() {
  const [notifications, setNotifications] = useState(initialNotifications);

  const getIcon = (type) => {
    switch (type) {
      case 'new': return <Bell className="text-blue-500" />;
      case 'warning': return <AlertCircle className="text-amber-500" />;
      case 'success': return <CheckCircle className="text-emerald-500" />;
      default: return <Bell />;
    }
  };

  return (
    <div className="notifications-view" style={{ padding: 32 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Centro de Alertas</h1>
        <p style={{ color: '#94a3b8' }}>Gestión de notificaciones en tiempo real</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {notifications.length > 0 ? (
          notifications.map((n, idx) => (
            <div 
              key={`notif-${n.id}-${idx}`} 
              style={{ 
                background: 'rgba(30, 41, 59, 0.7)', 
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: 24, 
                borderRadius: 16,
                display: 'flex',
                gap: 20,
                alignItems: 'center'
              }}
            >
              <div style={{ padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.05)' }}>
                {getIcon(n.type)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>{n.title}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.95rem' }}>{n.message}</div>
                <div style={{ color: '#6366f1', fontSize: '0.8rem', marginTop: 8, fontWeight: 600 }}>{n.time}</div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: 100 }}>
            <Bell size={48} color="#94a3b8" style={{ marginBottom: 16, opacity: 0.3 }} />
            <div style={{ color: '#94a3b8' }}>No hay notificaciones activas</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
