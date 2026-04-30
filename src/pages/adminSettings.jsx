import { useState, useEffect } from 'react';
import AdminNav from '../components/AdminNav';
import '../style/adminSettings.css';

const API = 'http://localhost:8000/api';

const getAuthHeaders = () => {
  let token = null;
  try {
    const cookie = document.cookie.split('; ').find(row => row.startsWith('jem8_token='));
    if (cookie) token = decodeURIComponent(cookie.split('=')[1] || '');
  } catch (e) { token = null; }
  if (!token && typeof window !== 'undefined') {
    try { token = localStorage.getItem('token') || null; } catch (e) { token = null; }
  }
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/* ─────────────────────────────────────────────────────────────────
   Skeleton primitives — pulse shimmer, matches the card layout
───────────────────────────────────────────────────────────────── */
function SkeletonLine({ width = '100%', height = 14, style = {} }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 6,
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'as-shimmer 1.5s infinite',
        ...style,
      }}
    />
  );
}

function SkeletonInput() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <SkeletonLine width={100} height={11} />
      <div
        style={{
          height: 40,
          borderRadius: 8,
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%',
          animation: 'as-shimmer 1.5s infinite',
        }}
      />
    </div>
  );
}

function SkeletonCard({ rows = 2, children }) {
  return (
    <section
      className="as-card"
      style={{
        opacity: 1,
        animation: 'as-card-fade-in 0.4s ease forwards',
      }}
    >
      {/* Card header skeleton */}
      <div className="as-card__header">
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'as-shimmer 1.5s infinite',
            flexShrink: 0,
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <SkeletonLine width={160} height={16} />
          <SkeletonLine width={240} height={11} />
        </div>
      </div>
      <hr className="as-divider" />

      {/* Rows of fake inputs */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="as-form-row" style={{ marginBottom: 16 }}>
          <SkeletonInput />
          <SkeletonInput />
        </div>
      ))}
    </section>
  );
}

/* Full-content skeleton — same structure as the real page but greyed out */
function SettingsSkeleton() {
  return (
    <>
      <style>{`
        @keyframes as-shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes as-card-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>

      {/* Page header skeleton */}
      <div className="as-page-header" style={{ marginBottom: 24 }}>
        <SkeletonLine width={200} height={28} />
      </div>

      {/* Card 1 — General (2 rows of 2 inputs) */}
      <SkeletonCard rows={2} />

      {/* Card 2 — Security (3 rows) */}
      <SkeletonCard rows={3} />

      {/* Card 3 — Appearance (1 row + theme previews) */}
      <section
        className="as-card"
        style={{ animation: 'as-card-fade-in 0.4s ease 0.15s both' }}
      >
        <div className="as-card__header">
          <div
            style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
              backgroundSize: '200% 100%',
              animation: 'as-shimmer 1.5s infinite',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
            <SkeletonLine width={180} height={16} />
            <SkeletonLine width={260} height={11} />
          </div>
        </div>
        <hr className="as-divider" />

        {/* Theme card previews */}
        <SkeletonLine width={80} height={11} style={{ marginBottom: 12 }} />
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: 100, height: 72, borderRadius: 10,
                background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
                backgroundSize: '200% 100%',
                animation: `as-shimmer 1.5s infinite ${i * 0.1}s`,
              }}
            />
          ))}
        </div>

        {/* Color picker row */}
        <hr className="as-divider" />
        <SkeletonLine width={100} height={11} style={{ marginBottom: 12 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f0f0f0' }} />
          <SkeletonLine width={120} height={40} style={{ borderRadius: 8 }} />
        </div>
      </section>

      {/* Action buttons skeleton */}
      <div className="as-actions">
        <SkeletonLine width={100} height={38} style={{ borderRadius: 8 }} />
        <SkeletonLine width={160} height={38} style={{ borderRadius: 8 }} />
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main component
═══════════════════════════════════════════════════════════════ */
const AdminPanelSettings = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [saveMsg,     setSaveMsg]     = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  const [settings, setSettings] = useState({
    adminEmail:     'admin@jem8circle.com',
    contactNumber:  '(02) 8805-1432',
    companyAddress: 'Salcedo Village, Makati City, Metro Manila',
    timezone:       'Asia/Manila',
    language:       'en-PH',
  });

  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword:     '',
    confirmPassword: '',
    passwordLockout: 10,
    sessionTimeout:  10,
    require2FA:      false,
  });

  const [appearance, setAppearance] = useState(() => {
  try {
    const saved = localStorage.getItem('appearance');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        theme:        parsed.theme        ?? 'auto',
        primaryColor: parsed.primaryColor ?? '#f9960c',
        colorHex:     parsed.colorHex     ?? '#f9960c',
      };
    }
  } catch (e) {}
  return { theme: 'auto', primaryColor: '#f9960c', colorHex: '#f9960c' };
});

  /* ── Load settings ── */
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res  = await fetch(`${API}/admin/settings`, { credentials: 'include', headers: getAuthHeaders() });
        const json = await res.json();
        if (res.ok && json.data) {
          const d = json.data;
          setSettings(prev => ({
            ...prev,
            adminEmail:     d.adminEmail     ?? prev.adminEmail,
            contactNumber:  d.contactNumber  ?? prev.contactNumber,
            companyAddress: d.companyAddress ?? prev.companyAddress,
            timezone:       d.timezone       ?? prev.timezone,
            language:       d.language       ?? prev.language,
          }));
          setSecurity(prev => ({
            ...prev,
            passwordLockout: d.passwordLockout ?? prev.passwordLockout,
            sessionTimeout:  d.sessionTimeout  ?? prev.sessionTimeout,
            require2FA:      d.require2FA === '1' || d.require2FA === true,
          }));
          setAppearance(prev => ({
            ...prev,
            theme:        d.theme        ?? prev.theme,
            primaryColor: d.primaryColor ?? prev.primaryColor,
            colorHex:     d.primaryColor ?? prev.colorHex,
          }));
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  /* ── Appearance side-effects ── */
  useEffect(() => {
    try {
      if (appearance?.primaryColor) {
        document.documentElement.style.setProperty('--brand-green',      appearance.primaryColor);
        document.documentElement.style.setProperty('--brand-green-dark', appearance.primaryColor);
      }
      const applyDark = (isDark) => {
        if (isDark) document.documentElement.classList.add('dark');
        else        document.documentElement.classList.remove('dark');
      };
      if (appearance.theme === 'dark') {
        applyDark(true);
      } else if (appearance.theme === 'light') {
        applyDark(false);
      } else {
        const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
        applyDark(mq?.matches ?? false);
        const handler = (ev) => applyDark(ev.matches);
        mq?.addEventListener?.('change', handler);
        return () => mq?.removeEventListener?.('change', handler);
      }
    } catch (e) { /* ignore */ }
    try { localStorage.setItem('appearance', JSON.stringify(appearance)); } catch (e) {}
  }, [appearance.theme, appearance.primaryColor]);

  /* ── Save all ── */
  const handleSaveAll = async () => {
    setSaveMsg('');
    try {
      const res  = await fetch(`${API}/admin/settings`, {
        method: 'POST', credentials: 'include', headers: getAuthHeaders(),
        body: JSON.stringify({
          ...settings,
          passwordLockout: security.passwordLockout,
          sessionTimeout:  security.sessionTimeout,
          require2FA:      security.require2FA,
          theme:           appearance.theme,
          primaryColor:    appearance.primaryColor,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setSaveMsg('✅ Settings saved successfully!');
        try { localStorage.setItem('appearance', JSON.stringify(appearance)); } catch (e) {}
      } else {
        setSaveMsg(`❌ ${json.message || 'Failed to save settings.'}`);
      }
    } catch (err) {
      setSaveMsg('❌ Network error. Please try again.');
    }
    setTimeout(() => setSaveMsg(''), 4000);
  };

  /* ── Update password ── */
  const handleUpdatePassword = async () => {
    setPasswordMsg('');
    if (security.newPassword !== security.confirmPassword) {
      setPasswordMsg('❌ Passwords do not match.');
      return;
    }
    try {
      const res  = await fetch(`${API}/admin/change-password`, {
        method: 'POST', credentials: 'include', headers: getAuthHeaders(),
        body: JSON.stringify({
          currentPassword: security.currentPassword,
          newPassword:     security.newPassword,
          confirmPassword: security.confirmPassword,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setPasswordMsg('✅ Password updated successfully!');
        setSecurity(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      } else {
        setPasswordMsg(`❌ ${json.message || 'Failed to update password.'}`);
      }
    } catch (err) {
      setPasswordMsg('❌ Network error. Please try again.');
    }
    setTimeout(() => setPasswordMsg(''), 4000);
  };

  /* ── Toggle 2FA ── */
  const handleToggle2FA = async () => {
    const newValue = !security.require2FA;
    setSecurity(prev => ({ ...prev, require2FA: newValue }));
    try {
      await fetch(`${API}/admin/settings`, {
        method: 'POST', credentials: 'include', headers: getAuthHeaders(),
        body: JSON.stringify({ require2FA: newValue }),
      });
    } catch (err) { console.error('Failed to update 2FA:', err); }
  };

  const handleSettingsChange = (e) => {
    const { id, value } = e.target;
    setSettings(prev => ({ ...prev, [id]: value }));
  };

  const handleSecurityChange = (e) => {
    const { id, value, type, checked } = e.target;
    setSecurity(prev => ({ ...prev, [id]: type === 'checkbox' ? checked : value }));
  };

  const handleThemeChange  = (e) => setAppearance(prev => ({ ...prev, theme: e.target.value }));
  const handleColorChange  = (e) => setAppearance(prev => ({ ...prev, primaryColor: e.target.value, colorHex: e.target.value }));
  const handleClearAll     = () => {
    setSettings({ adminEmail: '', contactNumber: '', companyAddress: '', timezone: 'Asia/Manila', language: 'en-PH' });
    setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '', passwordLockout: 10, sessionTimeout: 10, require2FA: false });
  };

  /* ────────────────────────────────────────────────────────────
     RENDER
     The layout wrapper (as-layout + AdminNav) is ALWAYS rendered.
     Only as-page content switches between skeleton and real UI.
  ──────────────────────────────────────────────────────────── */
  return (
    <div className="as-layout">
      {/* Shimmer keyframe lives here so it's present even during loading */}
      <style>{`
        @keyframes as-shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes as-card-fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes as-content-reveal {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        .as-settings-content {
          animation: as-content-reveal 0.35s ease forwards;
        }
      `}</style>

      {/* ★ AdminNav is OUTSIDE the loading condition — always visible */}
      <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="as-body">
        <button
          className="as-hamburger"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </button>

        <div className="as-page">
          {loading ? (
            /* ── SKELETON STATE ── */
            <SettingsSkeleton />
          ) : (
            /* ── REAL CONTENT ── */
            <div className="as-settings-content">

              <div className="as-page-header">
                <div>
                  <h2 className="as-page-header__title">Admin Settings</h2>
                </div>
              </div>

              {/* General Settings */}
              <section className="as-card">
                <div className="as-card__header">
                  <span className="as-card__icon">🏢</span>
                  <div>
                    <h3 className="as-card__title">General Settings</h3>
                    <p className="as-card__desc">Configure basic site information</p>
                  </div>
                </div>
                <hr className="as-divider" />
                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="as-form-row">
                    <div className="as-field">
                      <label htmlFor="adminEmail" className="as-label">Admin Email</label>
                      <input type="email" id="adminEmail" className="as-input" value={settings.adminEmail} onChange={handleSettingsChange} />
                    </div>
                    <div className="as-field">
                      <label htmlFor="contactNumber" className="as-label">Contact Number</label>
                      <input type="tel" id="contactNumber" className="as-input" value={settings.contactNumber} onChange={handleSettingsChange} />
                    </div>
                  </div>
                  <div className="as-form-row as-form-row--full">
                    <div className="as-field">
                      <label htmlFor="companyAddress" className="as-label">Company Address</label>
                      <input type="text" id="companyAddress" className="as-input" value={settings.companyAddress} onChange={handleSettingsChange} />
                    </div>
                  </div>
                  <div className="as-form-row">
                    <div className="as-field">
                      <label htmlFor="timezone" className="as-label">Timezone</label>
                      <select id="timezone" className="as-input" value={settings.timezone} onChange={handleSettingsChange}>
                        <option value="Asia/Manila">Asia/Manila (UTC+8)</option>
                      </select>
                    </div>
                    <div className="as-field">
                      <label htmlFor="language" className="as-label">Language</label>
                      <select id="language" className="as-input" value={settings.language} onChange={handleSettingsChange}>
                        <option value="en-PH">English (Philippines)</option>
                      </select>
                    </div>
                  </div>
                </form>
              </section>

              {/* Security Settings */}
              <section className="as-card">
                <div className="as-card__header">
                  <span className="as-card__icon">🔒</span>
                  <div>
                    <h3 className="as-card__title">Security Settings</h3>
                    <p className="as-card__desc">Configure authentication and access controls</p>
                  </div>
                </div>
                <hr className="as-divider" />
                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="as-form-row as-form-row--full">
                    <div className="as-field">
                      <label htmlFor="currentPassword" className="as-label">Current Password</label>
                      <input type="password" id="currentPassword" className="as-input" placeholder="Enter Current Password" value={security.currentPassword} onChange={handleSecurityChange} />
                    </div>
                  </div>
                  <div className="as-form-row">
                    <div className="as-field">
                      <label htmlFor="newPassword" className="as-label">New Password</label>
                      <input type="password" id="newPassword" className="as-input" placeholder="Enter New Password" value={security.newPassword} onChange={handleSecurityChange} />
                    </div>
                    <div className="as-field">
                      <label htmlFor="confirmPassword" className="as-label">Confirm New Password</label>
                      <input type="password" id="confirmPassword" className="as-input" placeholder="Confirm New Password" value={security.confirmPassword} onChange={handleSecurityChange} />
                    </div>
                  </div>
                  {passwordMsg && <p style={{ marginBottom: 12, fontSize: 14 }}>{passwordMsg}</p>}
                  <div style={{ marginBottom: 16 }}>
                    <button type="button" className="as-btn as-btn--dark" onClick={handleUpdatePassword}>Update Password</button>
                  </div>

                  <hr className="as-divider" />
                  <p className="as-section-label">Login Controls</p>
                  <div className="as-form-row">
                    <div className="as-field">
                      <label htmlFor="passwordLockout" className="as-label">Password Lockout (Attempts)</label>
                      <input type="number" id="passwordLockout" className="as-input" value={security.passwordLockout} min="1" max="99" onChange={handleSecurityChange} />
                    </div>
                    <div className="as-field">
                      <label htmlFor="sessionTimeout" className="as-label">Session Timeout (Minutes)</label>
                      <input type="number" id="sessionTimeout" className="as-input" value={security.sessionTimeout} min="1" max="999" onChange={handleSecurityChange} />
                    </div>
                  </div>

                  <hr className="as-divider" />
                  <p className="as-section-label">Two-Factor Authentication</p>
                  <div className="as-toggle-row">
                    <span className="as-label">Require 2FA for All Admins</span>
                    <button
                      type="button"
                      className={`as-toggle ${security.require2FA ? 'as-toggle--on' : ''}`}
                      role="switch"
                      aria-checked={security.require2FA}
                      onClick={handleToggle2FA}
                    >
                      <span className="as-toggle__knob" />
                    </button>
                  </div>

                  <hr className="as-divider" />
                  <p className="as-section-label">Security Logs</p>
                  <p className="as-label" style={{ marginBottom: 8 }}>Check security activities happening in website</p>
                  <div className="as-log-box">
                    <span className="as-log-box__title">Security Activity Log</span>
                    <div className="as-log-box__body" />
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <button type="button" className="as-btn as-btn--outline">Export Log</button>
                  </div>
                </form>
              </section>

              {/* Appearance Settings */}
              <section className="as-card">
                <div className="as-card__header">
                  <span className="as-card__icon">🎨</span>
                  <div>
                    <h3 className="as-card__title">Appearance Settings</h3>
                    <p className="as-card__desc">Customize the look and feel of the site</p>
                  </div>
                </div>
                <hr className="as-divider" />
                <form onSubmit={(e) => e.preventDefault()}>
                  <p className="as-section-label">THEME</p>
                  <div className="as-theme-options">
                    {['light', 'dark', 'auto'].map((t) => (
                      <label key={t} className={`as-theme-card ${appearance.theme === t ? 'as-theme-card--active' : ''}`}>
                        <input type="radio" name="theme" value={t} checked={appearance.theme === t} onChange={handleThemeChange} className="as-sr-only" />
                        <div className={`as-theme-preview as-theme-preview--${t}`}>
                          <div className="as-tp__sidebar" />
                          <div className="as-tp__content">
                            <div className="as-tp__bar" />
                            <div className="as-tp__bar as-tp__bar--short" />
                          </div>
                        </div>
                        <span className="as-theme-card__label">{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                      </label>
                    ))}
                  </div>

                  <hr className="as-divider" />
                  <p className="as-section-label">Primary Color</p>
                  <div className="as-color-row">
                    <div className="as-color-swatch">
                      <input type="color" id="color-picker" value={appearance.primaryColor} onChange={handleColorChange} />
                    </div>
                    <input
                      type="text"
                      className="as-input as-input--hex"
                      value={appearance.colorHex}
                      pattern="^#[0-9A-Fa-f]{6}$"
                      onChange={(e) => setAppearance(prev => ({ ...prev, colorHex: e.target.value }))}
                    />
                  </div>
                  <div className="as-color-presets">
                    {[
                      { color: '#f97316', label: 'Orange' },
                      { color: '#22c55e', label: 'Green' },
                      { color: '#3b82f6', label: 'Blue' },
                      { color: '#a855f7', label: 'Purple' },
                      { color: '#06b6d4', label: 'Cyan' },
                    ].map(({ color, label }) => (
                      <button
                        key={color}
                        type="button"
                        className="as-color-dot"
                        style={{ backgroundColor: color }}
                        aria-label={`Select ${label}`}
                        onClick={() => setAppearance(prev => ({ ...prev, primaryColor: color, colorHex: color }))}
                      />
                    ))}
                  </div>
                </form>
              </section>

              {saveMsg && (
                <p style={{ textAlign: 'right', fontSize: 14, marginBottom: 8 }}>{saveMsg}</p>
              )}

              <div className="as-actions">
                <button type="button" className="as-btn as-btn--outline" onClick={handleClearAll}>Clear All</button>
                <button type="button" className="as-btn as-btn--primary" onClick={handleSaveAll}>Save All Changes</button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanelSettings;