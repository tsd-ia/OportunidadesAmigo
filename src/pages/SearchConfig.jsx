import { useState } from 'react';
import { sourceConfig } from '../data/opportunities';
import { defaultProfile, regionsChile } from '../data/profile';

function SearchConfig() {
  const [sources, setSources] = useState(sourceConfig);
  const [areas, setAreas] = useState(defaultProfile.areas);

  const toggleSource = (id) => {
    setSources(s => s.map(x => x.id === id ? { ...x, enabled: !x.enabled } : x));
  };

  const toggleArea = (area) => {
    setAreas(a => ({ ...a, [area]: { ...a[area], enabled: !a[area].enabled } }));
  };

  const toggleSubArea = (area, sub) => {
    setAreas(a => ({
      ...a,
      [area]: {
        ...a[area],
        subAreas: {
          ...a[area].subAreas,
          [sub]: { ...a[area].subAreas[sub], enabled: !a[area].subAreas[sub].enabled }
        }
      }
    }));
  };

  const areaLabels = {
    construction: { label: 'Construcción', emoji: '🏗️' },
    programming: { label: 'Programación', emoji: '💻' },
    machinery: { label: 'Maquinaria', emoji: '🚜' },
  };

  return (
    <div>
      <h1 className="page-title">Configurador de Búsqueda</h1>
      <p className="page-subtitle">Activa o desactiva fuentes, rubros y sub-áreas de trabajo</p>

      {/* Fuentes */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="section-title" style={{ marginBottom: 16 }}>🔌 Fuentes de Búsqueda</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sources.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: `1px solid ${s.enabled ? s.color + '40' : 'var(--border)'}`, transition: 'all 0.3s' }}>
              <span style={{ fontSize: 24, width: 40, textAlign: 'center' }}>{s.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.description}</div>
              </div>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.enabled ? s.color : 'var(--text-muted)' }} />
              <label className="toggle">
                <input type="checkbox" checked={s.enabled} onChange={() => toggleSource(s.id)} />
                <span className="toggle__slider"></span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Áreas y sub-áreas */}
      <div className="card">
        <h2 className="section-title" style={{ marginBottom: 16 }}>🎯 Áreas de Trabajo</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Object.entries(areas).map(([key, area]) => (
            <div key={key} style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderBottom: area.enabled ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: 24 }}>{areaLabels[key].emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{areaLabels[key].label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {Object.values(area.subAreas).filter(s => s.enabled).length}/{Object.keys(area.subAreas).length} sub-áreas activas
                  </div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={area.enabled} onChange={() => toggleArea(key)} />
                  <span className="toggle__slider"></span>
                </label>
              </div>
              {area.enabled && (
                <div style={{ padding: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {Object.entries(area.subAreas).map(([subKey, sub]) => (
                    <button
                      key={subKey}
                      onClick={() => toggleSubArea(key, subKey)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 20,
                        border: sub.enabled ? '1px solid var(--accent)' : '1px solid var(--border)',
                        background: sub.enabled ? 'var(--accent-glow)' : 'var(--bg-input)',
                        color: sub.enabled ? 'var(--accent-hover)' : 'var(--text-muted)',
                        fontSize: 13,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontWeight: sub.enabled ? 600 : 400,
                        transition: 'all 0.2s',
                      }}
                    >
                      {sub.enabled ? '✓ ' : ''}{sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SearchConfig;
