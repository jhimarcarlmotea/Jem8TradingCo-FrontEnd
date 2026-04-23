import { useState, useEffect } from 'react';
import AdminNav from '../components/AdminNav';
import '../style/adminSettings.css';

const API = 'http://localhost:8000/api'; // change to your base URL

const getAuthHeaders = () => {
  // Try cookie named jem8_token first (if project uses a cookie-based token)
  let token = null;
  try {
    const cookie = document.cookie.split('; ').find(row => row.startsWith('jem8_token='));
    if (cookie) token = decodeURIComponent(cookie.split('=')[1] || "");
  } catch (e) {
    token = null;
  }

  // Fallback to localStorage token (used by the API axios instance)
  if (!token && typeof window !== 'undefined') {
    try { token = localStorage.getItem('token') || null; } catch (e) { token = null; }
  }

  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};


const AdminPanelSettings = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  const [settings, setSettings] = useState({
    siteName: 'Jem 8 Circle Trading Co.',
    siteURL: 'https://www.jem8circle.com/',
    adminEmail: 'admin@jem8circle.com',
    contactNumber: '(02) 8805-1432',
    companyAddress: 'Salcedo Village, Makati City, Metro Manila',
    timezone: 'Asia/Manila',
    language: 'en-PH',
  });

  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    passwordLockout: 10,
    sessionTimeout: 10,
    require2FA: false,
  });

  const [appearance, setAppearance] = useState({
    theme: 'auto',
    primaryColor: '#f9960c',
    colorHex: '#f9960c',
  });

  // ==============================
  // LOAD SETTINGS ON MOUNT
  // ==============================
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API}/admin/settings`, {
          credentials: 'include', // sends the jem8_token cookie
          headers: getAuthHeaders(),
        });
        const json = await res.json();

        if (res.ok && json.data) {
          const d = json.data;

          setSettings(prev => ({
            ...prev,
            siteName:       d.siteName       ?? prev.siteName,
            siteURL:        d.siteURL        ?? prev.siteURL,
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

  // ==============================
  // SAVE ALL SETTINGS
  // ==============================
  const handleSaveAll = async () => {
    setSaveMsg('');
    try {
      const res = await fetch(`${API}/admin/settings`, {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
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
        try { if (typeof window !== 'undefined') {
          // persist appearance immediately so other pages pick it up
          localStorage.setItem('appearance', JSON.stringify(appearance));
          console.info('appearance persisted', appearance);
        }} catch (e) {}
      } else {
        setSaveMsg(`❌ ${json.message || 'Failed to save settings.'}`);
      }
    } catch (err) {
      setSaveMsg('❌ Network error. Please try again.');
    }

    setTimeout(() => setSaveMsg(''), 4000);
  };

  // ==============================
  // UPDATE PASSWORD
  // ==============================
  const handleUpdatePassword = async () => {
    setPasswordMsg('');

    if (security.newPassword !== security.confirmPassword) {
      setPasswordMsg('❌ Passwords do not match.');
      return;
    }

    try {
      const res = await fetch(`${API}/admin/change-password`, {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          currentPassword: security.currentPassword,
          newPassword:     security.newPassword,
          confirmPassword: security.confirmPassword,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        setPasswordMsg('✅ Password updated successfully!');
        setSecurity(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
      } else {
        setPasswordMsg(`❌ ${json.message || 'Failed to update password.'}`);
      }
    } catch (err) {
      setPasswordMsg('❌ Network error. Please try again.');
    }

    setTimeout(() => setPasswordMsg(''), 4000);
  };

  // ==============================
  // TOGGLE 2FA (saves immediately)
  // ==============================
  const handleToggle2FA = async () => {
    const newValue = !security.require2FA;
    setSecurity(prev => ({ ...prev, require2FA: newValue }));

    try {
      await fetch(`${API}/admin/settings`, {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({ require2FA: newValue }),
      });
    } catch (err) {
      console.error('Failed to update 2FA:', err);
    }
  };

  const handleSettingsChange = (e) => {
    const { id, value } = e.target;
    setSettings(prev => ({ ...prev, [id]: value }));
  };

  const handleSecurityChange = (e) => {
    const { id, value, type, checked } = e.target;
    setSecurity(prev => ({ ...prev, [id]: type === 'checkbox' ? checked : value }));
  };

  const handleThemeChange = (e) => {
    setAppearance(prev => ({ ...prev, theme: e.target.value }));
  };

  const handleColorChange = (e) => {
    setAppearance(prev => ({ ...prev, primaryColor: e.target.value, colorHex: e.target.value }));
  };

  // Apply appearance settings to the document (CSS variable + theme class)
  useEffect(() => {
    try {
      if (appearance && appearance.primaryColor) {
        document.documentElement.style.setProperty('--brand-green', appearance.primaryColor);
        // also update derived variable if desired
        document.documentElement.style.setProperty('--brand-green-dark', appearance.primaryColor);
      }

      const applyDark = (isDark) => {
        try {
          if (isDark) document.documentElement.classList.add('dark');
          else document.documentElement.classList.remove('dark');
        } catch (e) {}
      };

      if (appearance.theme === 'dark') {
        applyDark(true);
      } else if (appearance.theme === 'light') {
        applyDark(false);
      } else {
        // auto: follow system preference
        const mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
        applyDark(mq ? mq.matches : false);
        const handler = (ev) => applyDark(ev.matches);
        if (mq && mq.addEventListener) mq.addEventListener('change', handler);
        else if (mq && mq.addListener) mq.addListener(handler);
        // cleanup listener on unmount or when theme changes
        return () => {
          try {
            if (mq && mq.removeEventListener) mq.removeEventListener('change', handler);
            else if (mq && mq.removeListener) mq.removeListener(handler);
          } catch (e) {}
        };
      }
    } catch (e) {
      // ignore
    }
    // Persist appearance for global initialization
    try { if (typeof window !== 'undefined') localStorage.setItem('appearance', JSON.stringify(appearance)); } catch (e) {}
  }, [appearance.theme, appearance.primaryColor]);

  const handleClearAll = () => {
    setSettings({ siteName: '', siteURL: '', adminEmail: '', contactNumber: '', companyAddress: '', timezone: 'Asia/Manila', language: 'en-PH' });
    setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '', passwordLockout: 10, sessionTimeout: 10, require2FA: false });
  };

  if (loading) return <div className="as-layout"><p style={{ padding: '2rem' }}>Loading settings...</p></div>;

  return (
    <div className="as-layout">
      <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="as-body">
        <button className="as-hamburger" onClick={() => setSidebarOpen(true)} aria-label="Open menu">☰</button>

        <div className="as-page">

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
                  <label htmlFor="siteName" className="as-label">Site Name</label>
                  <input type="text" id="siteName" className="as-input" value={settings.siteName} onChange={handleSettingsChange} />
                </div>
                <div className="as-field">
                  <label htmlFor="siteURL" className="as-label">Site URL</label>
                  <input type="url" id="siteURL" className="as-input" value={settings.siteURL} onChange={handleSettingsChange} />
                </div>
              </div>
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

              {/* Password feedback message */}
              {passwordMsg && (
                <p style={{ marginBottom: '12px', fontSize: '14px' }}>{passwordMsg}</p>
              )}

              <div style={{ marginBottom: '16px' }}>
                <button type="button" className="as-btn as-btn--dark" onClick={handleUpdatePassword}>
                  Update Password
                </button>
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
              <p className="as-label" style={{ marginBottom: '8px' }}>Check security activities happening in website</p>
              <div className="as-log-box">
                <span className="as-log-box__title">Security Activity Log</span>
                <div className="as-log-box__body" />
              </div>
              <div style={{ marginTop: '8px' }}>
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

          {/* Save feedback message */}
          {saveMsg && (
            <p style={{ textAlign: 'right', fontSize: '14px', marginBottom: '8px' }}>{saveMsg}</p>
          )}

          {/* Action Buttons */}
          <div className="as-actions">
            <button type="button" className="as-btn as-btn--outline" onClick={handleClearAll}>Clear All</button>
            <button type="button" className="as-btn as-btn--primary" onClick={handleSaveAll}>Save All Changes</button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminPanelSettings;