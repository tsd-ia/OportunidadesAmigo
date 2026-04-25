import { useState } from 'react';
import { Save, Upload, Shield, FileText, MapPin } from 'lucide-react';
import { defaultProfile, regionsChile } from '../data/profile';

function Profile() {
  const [profile, setProfile] = useState(defaultProfile);
  const [activeTab, setActiveTab] = useState('personal');

  const updatePersonal = (field, value) => {
    setProfile(p => ({ ...p, personal: { ...p.personal, [field]: value } }));
  };

  const updateCompany = (field, value) => {
    setProfile(p => ({ ...p, company: { ...p.company, [field]: value } }));
  };

  const updateDoc = (doc, field, value) => {
    setProfile(p => ({
      ...p,
      documents: { ...p.documents, [doc]: { ...p.documents[doc], [field]: value } }
    }));
  };

  const updateRestriction = (field, value) => {
    setProfile(p => ({ ...p, restrictions: { ...p.restrictions, [field]: value } }));
  };

  const tabs = [
    { id: 'personal', label: '👤 Personal', icon: null },
    { id: 'company', label: '🏢 Empresa', icon: null },
    { id: 'documents', label: '📄 Documentos', icon: null },
    { id: 'restrictions', label: '⚠️ Restricciones', icon: null },
  ];

  const docLabels = {
    patenteMunicipal: 'Patente Municipal',
    inicioActividades: 'Inicio de Actividades',
    certificadoAntecedentes: 'Certificado de Antecedentes',
    seguroRC: 'Seguro de Responsabilidad Civil',
    garantiaSeriedad: 'Garantía de Seriedad',
    garantiaFielCumplimiento: 'Garantía de Fiel Cumplimiento',
    inscripcionRegistroCivil: 'Inscripción Registro Civil',
    boletaGarantia: 'Boleta de Garantía',
  };

  const docsReady = Object.values(profile.documents).filter(d => d.has).length;
  const docsTotal = Object.keys(profile.documents).length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Mi Perfil</h1>
          <p className="page-subtitle">Configura tu información para mejorar el matching de oportunidades</p>
        </div>
        <button className="btn btn--primary"><Save size={16} /> Guardar</button>
      </div>

      {/* Progreso */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Perfil completado</span>
          <span style={{ fontSize: 14, color: 'var(--accent)' }}>{docsReady}/{docsTotal} documentos</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar__fill" style={{ width: `${(docsReady / docsTotal) * 100}%` }} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            className={`btn ${activeTab === t.id ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Personal */}
      {activeTab === 'personal' && (
        <div className="card">
          <h2 className="section-title" style={{ marginBottom: 20 }}><span style={{ marginRight: 8 }}>👤</span>Datos Personales</h2>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Nombre completo</label>
              <input className="form-input" value={profile.personal.name} onChange={e => updatePersonal('name', e.target.value)} placeholder="Tu nombre" />
            </div>
            <div className="form-group">
              <label className="form-label">RUT</label>
              <input className="form-input" value={profile.personal.rut} onChange={e => updatePersonal('rut', e.target.value)} placeholder="12.345.678-9" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={profile.personal.email} onChange={e => updatePersonal('email', e.target.value)} placeholder="tu@email.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input className="form-input" value={profile.personal.phone} onChange={e => updatePersonal('phone', e.target.value)} placeholder="+56 9 1234 5678" />
            </div>
            <div className="form-group">
              <label className="form-label">Región</label>
              <select className="form-select" value={profile.personal.region} onChange={e => updatePersonal('region', e.target.value)}>
                {regionsChile.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Comuna</label>
              <input className="form-input" value={profile.personal.comuna} onChange={e => updatePersonal('comuna', e.target.value)} placeholder="Tu comuna" />
            </div>
            <div className="form-group">
              <label className="form-label">Sitio Web</label>
              <input className="form-input" value={profile.personal.website} onChange={e => updatePersonal('website', e.target.value)} placeholder="https://..." />
            </div>
            <div className="form-group">
              <label className="form-label">LinkedIn</label>
              <input className="form-input" value={profile.personal.linkedin} onChange={e => updatePersonal('linkedin', e.target.value)} placeholder="linkedin.com/in/..." />
            </div>
          </div>
        </div>
      )}

      {/* Empresa */}
      {activeTab === 'company' && (
        <div className="card">
          <h2 className="section-title" style={{ marginBottom: 20 }}><span style={{ marginRight: 8 }}>🏢</span>Datos Empresa</h2>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Razón Social</label>
              <input className="form-input" value={profile.company.name} onChange={e => updateCompany('name', e.target.value)} placeholder="Nombre empresa" />
            </div>
            <div className="form-group">
              <label className="form-label">RUT Empresa</label>
              <input className="form-input" value={profile.company.rut} onChange={e => updateCompany('rut', e.target.value)} placeholder="76.123.456-7" />
            </div>
            <div className="form-group">
              <label className="form-label">Tipo de Sociedad</label>
              <select className="form-select" value={profile.company.type} onChange={e => updateCompany('type', e.target.value)}>
                {['Persona Natural', 'EIRL', 'SPA', 'Ltda', 'SA'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Giro Comercial</label>
              <input className="form-input" value={profile.company.giro} onChange={e => updateCompany('giro', e.target.value)} placeholder="Ej: Construcción general" />
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <div className="toggle">
                <input type="checkbox" checked={profile.company.registroMercadoPublico} onChange={e => updateCompany('registroMercadoPublico', e.target.checked)} />
                <span className="toggle__slider"></span>
              </div>
              <span style={{ fontSize: 13 }}>Registro MercadoPúblico</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <div className="toggle">
                <input type="checkbox" checked={profile.company.registroChileProveedores} onChange={e => updateCompany('registroChileProveedores', e.target.checked)} />
                <span className="toggle__slider"></span>
              </div>
              <span style={{ fontSize: 13 }}>ChileProveedores</span>
            </label>
          </div>
        </div>
      )}

      {/* Documentos */}
      {activeTab === 'documents' && (
        <div className="card">
          <h2 className="section-title" style={{ marginBottom: 20 }}><span style={{ marginRight: 8 }}>📄</span>Documentos</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(profile.documents).map(([key, doc]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: doc.has ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)' }}>
                  {doc.has ? <Shield size={16} color="#22c55e" /> : <FileText size={16} color="#ef4444" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{docLabels[key]}</div>
                  <div style={{ fontSize: 12, color: doc.has ? 'var(--success)' : 'var(--text-muted)' }}>
                    {doc.has ? (doc.expires ? `Vence: ${doc.expires}` : 'Vigente') : 'No cargado'}
                  </div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={doc.has} onChange={e => updateDoc(key, 'has', e.target.checked)} />
                  <span className="toggle__slider"></span>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Restricciones */}
      {activeTab === 'restrictions' && (
        <div className="card">
          <h2 className="section-title" style={{ marginBottom: 20 }}><span style={{ marginRight: 8 }}>⚠️</span>Restricciones y Capacidades</h2>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Presupuesto máximo que puedes asumir (CLP)</label>
              <input className="form-input" type="number" value={profile.restrictions.maxBudget} onChange={e => updateRestriction('maxBudget', Number(e.target.value))} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Distancia máxima de trabajo (km)</label>
              <input className="form-input" type="number" value={profile.restrictions.maxDistance} onChange={e => updateRestriction('maxDistance', Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="form-label">Tamaño de equipo</label>
              <input className="form-input" type="number" value={profile.restrictions.teamSize} onChange={e => updateRestriction('teamSize', Number(e.target.value))} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Disponible desde</label>
              <input className="form-input" type="date" value={profile.restrictions.availableFrom} onChange={e => updateRestriction('availableFrom', e.target.value)} />
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <label className="form-label" style={{ marginBottom: 10 }}>
              <MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Regiones de trabajo
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {regionsChile.map(r => {
                const active = profile.restrictions.workingRegions.includes(r);
                return (
                  <button
                    key={r}
                    className={`tag ${active ? 'tag--accent' : ''}`}
                    style={{ cursor: 'pointer', border: active ? 'none' : '1px solid var(--border)', background: active ? undefined : 'var(--bg-secondary)', color: active ? undefined : 'var(--text-muted)' }}
                    onClick={() => {
                      setProfile(p => ({
                        ...p,
                        restrictions: {
                          ...p.restrictions,
                          workingRegions: active
                            ? p.restrictions.workingRegions.filter(x => x !== r)
                            : [...p.restrictions.workingRegions, r]
                        }
                      }));
                    }}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ marginTop: 20, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <div className="toggle">
                <input type="checkbox" checked={profile.restrictions.canTravelNational} onChange={e => updateRestriction('canTravelNational', e.target.checked)} />
                <span className="toggle__slider"></span>
              </div>
              <span style={{ fontSize: 13 }}>Puede viajar a nivel nacional</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <div className="toggle">
                <input type="checkbox" checked={profile.restrictions.hasVehicle} onChange={e => updateRestriction('hasVehicle', e.target.checked)} />
                <span className="toggle__slider"></span>
              </div>
              <span style={{ fontSize: 13 }}>Tiene vehículo propio</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
