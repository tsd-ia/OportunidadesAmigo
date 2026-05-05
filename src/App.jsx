import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Search, 
  Bell, 
  User, 
  Settings, 
  Database,
  BrainCircuit,
  LogOut,
  Menu,
  Zap
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import EliteExplorer from './pages/EliteExplorer';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import SearchConfig from './pages/SearchConfig';
import N8nPanel from './pages/N8nPanel';

import './App.css';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/explorer', icon: Zap, label: 'Explorador Intel' },
  { path: '/notifications', icon: Bell, label: 'Alertas' },
  { path: '/config', icon: Settings, label: 'Configuración' },
  { path: '/profile', icon: User, label: 'Perfil Empresa' },
  { path: '/n8n', icon: Database, label: 'N8n Automator' },
];

function App() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="app-container">
      {/* Sidebar de Alta Densidad */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar__logo" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0', marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)' }}>
            <BrainCircuit color="white" size={24} />
          </div>
          <div style={{ fontWeight: 900, fontSize: '1.2rem', letterSpacing: '-0.05em' }}>
            TITAN <span style={{ color: '#6366f1' }}>AMIGO</span>
          </div>
        </div>

        <nav className="sidebar__nav" style={{ flex: 1 }}>
          {navItems.map((item, idx) => (
            <NavLink 
              key={`nav-${item.path}-${idx}`}
              to={item.path} 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12, 
                padding: '14px 20px', 
                borderRadius: 12, 
                color: location.pathname === item.path ? 'white' : '#94a3b8',
                background: location.pathname === item.path ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                marginBottom: 4,
                textDecoration: 'none',
                transition: 'all 0.2s',
                fontWeight: location.pathname === item.path ? 700 : 500
              }}
            >
              <item.icon size={20} color={location.pathname === item.path ? '#6366f1' : '#64748b'} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>DF</div>
            <div style={{ flex: 1, fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 700 }}>Diego F.</div>
              <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Admin Premium</div>
            </div>
            <LogOut size={16} color="#64748b" style={{ cursor: 'pointer' }} />
          </div>
        </div>
      </aside>

      {/* Area de Contenido */}
      <main className="main-content" style={{ flex: 1, background: '#0f172a', height: '100vh', overflowY: 'auto' }}>
        <header className="topbar" style={{ padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Menu size={24} style={{ cursor: 'pointer', color: '#64748b' }} onClick={() => setSidebarOpen(!sidebarOpen)} />
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Explorador / <span style={{ color: 'white', fontWeight: 600 }}>Vista Inteligente</span></div>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
             <div style={{ padding: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 8, color: '#f59e0b', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
               <Zap size={14} /> MODO HFT ACTIVO
             </div>
          </div>
        </header>

        <div style={{ padding: 32 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/explorer" element={<EliteExplorer />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/config" element={<SearchConfig />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/n8n" element={<N8nPanel />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
