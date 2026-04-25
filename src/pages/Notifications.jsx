import { useState } from 'react';
import { Check, Bell, Trash2 } from 'lucide-react';

const initialNotifications = [
  { id: 1, icon: '🔥', title: 'Nueva licitación con 95% de match', text: 'Remodelación Oficinas Corporativas 500m2 en Las Condes — $85.000.000. ¡Encaja perfecto con tu perfil!', time: 'Hace 5 min', read: false, type: 'match' },
  { id: 2, icon: '⚡', title: 'Compra ágil disponible', text: 'Arriendo Retroexcavadora 3 meses en Viña del Mar — $12.000.000. Respuesta rápida requerida.', time: 'Hace 20 min', read: false, type: 'urgent' },
  { id: 3, icon: '💡', title: 'Oportunidad fuera de rubro', text: 'Servicio de Mantención de Jardines — $8.000.000. Sin requisitos técnicos, solo patente municipal.', time: 'Hace 1 hora', read: false, type: 'suggestion' },
  { id: 4, icon: '🤖', title: 'Búsqueda automática completada', text: 'Se encontraron 6 nuevas oportunidades en MercadoPublico, ComprasÁgiles y LinkedIn.', time: 'Hace 2 horas', read: true, type: 'system' },
  { id: 5, icon: '⏰', title: 'Licitación por vencer', text: 'Arriendo Retroexcavadora vence en 6 días. ¿Ya preparaste tu oferta?', time: 'Hace 3 horas', read: true, type: 'warning' },
  { id: 6, icon: '📄', title: 'Documento por vencer', text: 'Tu Patente Municipal vence en 15 días. Renuévala para no perder oportunidades.', time: 'Ayer', read: true, type: 'warning' },
];

function Notifications() {
  const [notifs, setNotifs] = useState(initialNotifications);
  const [filter, setFilter] = useState('all');

  const markAllRead = () => setNotifs(n => n.map(x => ({ ...x, read: true })));
  const deleteNotif = (id) => setNotifs(n => n.filter(x => x.id !== id));
  const markRead = (id) => setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x));

  const unread = notifs.filter(n => !n.read).length;
  const filtered = filter === 'all' ? notifs : notifs.filter(n => !n.read);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Notificaciones</h1>
          <p className="page-subtitle">{unread} sin leer</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn btn--sm ${filter === 'all' ? 'btn--primary' : 'btn--secondary'}`} onClick={() => setFilter('all')}>Todas</button>
          <button className={`btn btn--sm ${filter === 'unread' ? 'btn--primary' : 'btn--secondary'}`} onClick={() => setFilter('unread')}>Sin leer</button>
          <button className="btn btn--sm btn--secondary" onClick={markAllRead}><Check size={14} /> Marcar leídas</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(n => (
          <div key={n.id} className={`notif-item ${!n.read ? 'notif-item--unread' : ''}`} onClick={() => markRead(n.id)} style={{ cursor: 'pointer' }}>
            <div className="notif-item__icon">{n.icon}</div>
            <div className="notif-item__content">
              <div className="notif-item__title">{n.title}</div>
              <div className="notif-item__text">{n.text}</div>
              <div className="notif-item__time">{n.time}</div>
            </div>
            <button className="btn btn--sm btn--secondary" onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }} style={{ padding: 6 }}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <Bell size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
            <div style={{ color: 'var(--text-muted)' }}>No hay notificaciones</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
