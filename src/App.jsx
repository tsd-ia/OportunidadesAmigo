import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, User, Search, Compass, MessageSquare, 
  Settings, Bell, Menu, X, Zap 
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import SearchConfig from './pages/SearchConfig';
import IntelExplorer from './pages/IntelExplorer';
import Assistant from './pages/Assistant';
import N8nPanel from './pages/N8nPanel';
import Notifications from './pages/Notifications';
import './App.css';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/profile', icon: User, label: 'Mi Perfil' },
  { path: '/search', icon: Search, label: 'Configurador' },
  { path: '/explorer', icon: Compass, label: 'Explorador' },
  { path: '/assistant', icon: MessageSquare, label: 'Asistente' },
  { path: '/n8n', icon: Zap, label: 'Panel n8n' },
  { path: '/notifications', icon: Bell, label: 'Alertas' },
];

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications] = useState(3);

  return (
    <Router>
      <div className="app-container">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
          <div className="sidebar__header">
            <div className="sidebar__logo">
              <div className="sidebar__logo-icon">🎯</div>
              <div className="sidebar__logo-text">
                <span className="sidebar__logo-title">Oportunidades</span>
                <span className="sidebar__logo-subtitle">Amigo</span>
              </div>
            </div>
            <button className="sidebar__close" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <nav className="sidebar__nav">
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
                {item.path === '/notifications' && notifications > 0 && (
                  <span className="sidebar__badge">{notifications}</span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="sidebar__footer">
            <div className="sidebar__status">
              <div className="sidebar__status-dot"></div>
              <span>n8n Conectado</span>
            </div>
            <div className="sidebar__version">v1.0.0 — Bot Activo</div>
          </div>
        </aside>

        {/* Overlay para mobile */}
        {sidebarOpen && <div className="sidebar__overlay" onClick={() => setSidebarOpen(false)} />}

        {/* Main content */}
        <main className="main-content">
          <header className="topbar">
            <button className="topbar__menu" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="topbar__search">
              <Search size={18} />
              <input type="text" placeholder="Buscar oportunidades..." />
            </div>
            <div className="topbar__actions">
              <button className="topbar__notification">
                <Bell size={20} />
                {notifications > 0 && <span className="topbar__notification-badge">{notifications}</span>}
              </button>
              <div className="topbar__avatar">
                <Settings size={18} />
              </div>
            </div>
          </header>

          <div className="page-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/search" element={<SearchConfig />} />
              <Route path="/explorer" element={<IntelExplorer />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/n8n" element={<N8nPanel />} />
              <Route path="/notifications" element={<Notifications />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
