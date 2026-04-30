import { useState, useEffect, useCallback } from 'react';
import AdminNav from '../components/AdminNav';

// ── Design tokens (matched to adminBackup) ─────────────────────────────────
const T = {
  blue50: "#EFF6FF", blue100: "#DBEAFE", blue500: "#3B82F6", blue600: "#2563EB", blue700: "#1D4ED8",
  green50: "#ECFDF5", green100: "#D1FAE5", green500: "#10B981", green600: "#059669",
  amber50: "#FFFBEB", amber100: "#FEF3C7", amber500: "#F59E0B", amber600: "#D97706",
  red50: "#FEF2F2", red100: "#FEE2E2", red500: "#EF4444", red600: "#DC2626",
  slate50: "#F8FAFC", slate100: "#F1F5F9", slate200: "#E2E8F0", slate300: "#CBD5E1",
  slate400: "#94A3B8", slate500: "#64748B", slate600: "#475569",
  slate700: "#374151", slate800: "#1E293B", slate900: "#0F172A",
  radius: { sm: 8, md: 12, lg: 16, xl: 20 },
  shadow: { sm: "0 1px 2px rgba(15,23,42,0.05)", md: "0 4px 12px rgba(15,23,42,0.08)", hover: "0 8px 24px rgba(15,23,42,0.12)" },
  font: "'DM Sans','Nunito',system-ui,sans-serif",
};

const API = 'http://localhost:8000/api';

const getAuthHeaders = () => {
  let token = null;
  try {
    const cookie = document.cookie.split('; ').find(row => row.startsWith('jem8_token='));
    if (cookie) token = decodeURIComponent(cookie.split('=')[1] || "");
  } catch (e) {
    token = null;
  }

  if (!token && typeof window !== 'undefined') {
    try { token = localStorage.getItem('token') || null; } catch (e) { token = null; }
  }
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ── Toast Component ────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24,
      display: "flex", flexDirection: "column", gap: 8,
      zIndex: 9999,
    }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            padding: "10px 16px",
            borderRadius: T.radius.md,
            fontSize: 13,
            fontWeight: 500,
            boxShadow: T.shadow.md,
            border: `1px solid ${t.type === "error" ? T.red100 : T.green100}`,
            background: t.type === "error" ? T.red50 : T.green50,
            color: t.type === "error" ? T.red600 : T.green600,
            fontFamily: T.font,
          }}
        >
          {t.type === "error" ? "✗ " : "✓ "}{t.message}
        </div>
      ))}
    </div>
  );
}

// ── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ lg = false }) {
  return (
    <span
      className={`inline-block rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin ${lg ? 'w-6 h-6' : 'w-3.5 h-3.5'}`}
    />
  );
}

const AdminPanelSettings = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState([]);

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

  const [appearance, setAppearance] = useState({
    theme: 'auto',
    primaryColor: '#f9960c',
    colorHex: '#f9960c',
  });

  // ── Toast helper ───────────────────────────────────────────────────────────
  const toast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);

  // ==============================
  // LOAD SETTINGS ON MOUNT
  // ==============================
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API}/admin/settings`, {
          credentials: 'include',
          headers: getAuthHeaders(),
        });
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
        toast('Failed to load settings', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [toast]);

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
    setSaving(true);
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
        toast('Settings saved successfully!');
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('appearance', JSON.stringify(appearance));
          }
        } catch (e) {}
      } else {
        toast(json.message || 'Failed to save settings.', 'error');
      }
    } catch (err) {
      toast('Network error. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ── Update password ── */
  const handleUpdatePassword = async () => {
    if (security.newPassword !== security.confirmPassword) {
      toast('Passwords do not match.', 'error');
      return;
    }

    if (security.newPassword && security.newPassword.length < 6) {
      toast('New password must be at least 6 characters.', 'error');
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
        toast('Password updated successfully!');
        setSecurity(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
      } else {
        toast(json.message || 'Failed to update password.', 'error');
      }
    } catch (err) {
      toast('Network error. Please try again.', 'error');
    }
  };

  // ==============================
  // TOGGLE 2FA
  // ==============================
  const handleToggle2FA = async () => {
    const newValue = !security.require2FA;
    setSecurity(prev => ({ ...prev, require2FA: newValue }));
    try {
      await fetch(`${API}/admin/settings`, {
        method: 'POST', credentials: 'include', headers: getAuthHeaders(),
        body: JSON.stringify({ require2FA: newValue }),
      });
      toast(`2FA ${newValue ? 'enabled' : 'disabled'} successfully`);
    } catch (err) {
      console.error('Failed to update 2FA:', err);
      toast('Failed to update 2FA setting', 'error');
    }
  };

  const handleSettingsChange = (e) => {
    const { id, value } = e.target;
    setSettings(prev => ({ ...prev, [id]: value }));
  };

  const handleSecurityChange = (e) => {
    const { id, value } = e.target;
    setSecurity(prev => ({ ...prev, [id]: value }));
  };

  const handleThemeChange = (value) => {
    setAppearance(prev => ({ ...prev, theme: value }));
  };

  const handleColorChange = (e) => {
    setAppearance(prev => ({ ...prev, primaryColor: e.target.value, colorHex: e.target.value }));
  };

  // Apply appearance settings
  useEffect(() => {
    try {
      if (appearance && appearance.primaryColor) {
        document.documentElement.style.setProperty('--brand-green', appearance.primaryColor);
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
        const mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
        applyDark(mq ? mq.matches : false);
        const handler = (ev) => applyDark(ev.matches);
        if (mq && mq.addEventListener) mq.addEventListener('change', handler);
        else if (mq && mq.addListener) mq.addListener(handler);
        return () => {
          try {
            if (mq && mq.removeEventListener) mq.removeEventListener('change', handler);
            else if (mq && mq.removeListener) mq.removeListener(handler);
          } catch (e) {}
        };
      }
    } catch (e) {}
    
    try {
      if (typeof window !== 'undefined') localStorage.setItem('appearance', JSON.stringify(appearance));
    } catch (e) {}
  }, [appearance.theme, appearance.primaryColor]);

  const handleClearAll = () => {
    setSettings({ 
      adminEmail: '', 
      contactNumber: '', 
      companyAddress: '', 
      timezone: 'Asia/Manila', 
      language: 'en-PH' 
    });
    setSecurity({ 
      currentPassword: '', 
      newPassword: '', 
      confirmPassword: '', 
      passwordLockout: 10, 
      sessionTimeout: 10, 
      require2FA: false 
    });
    toast('Form cleared');
  };

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "#F0F4F8", fontFamily: T.font }}>
        <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main style={{ flex: 1, padding: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="flex items-center justify-center gap-3">
            <Spinner lg />
            <span style={{ color: T.slate500 }}>Loading settings...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F0F4F8", fontFamily: T.font }}>
      <style>{`
        .ap-hamburger { display: flex; }
        @media (min-width: 1024px) { .ap-hamburger { display: none !important; } }
        .as-toggle-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }
        .as-toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .as-toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: 0.3s;
          border-radius: 24px;
        }
        .as-toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }
        input:checked + .as-toggle-slider {
          background-color: #2563EB;
        }
        input:checked + .as-toggle-slider:before {
          transform: translateX(20px);
        }
      `}</style>

      <Toast toasts={toasts} />
      <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main style={{ flex: 1, minWidth: 0, padding: "20px", overflowX: "hidden" }}>
        {/* Top bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12, marginBottom: 20, background: "#fff", borderRadius: T.radius.lg,
          padding: "12px 16px", border: `1px solid ${T.slate200}`,
          boxShadow: T.shadow.sm, flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => setSidebarOpen(true)}
              className="ap-hamburger"
              style={{
                background: "none", border: `1px solid ${T.slate200}`,
                borderRadius: T.radius.sm, width: 36, height: 36,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontSize: 18, color: T.slate700,
              }}
            >
              ☰
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.slate900, letterSpacing: "-0.3px" }}>Admin Settings</h1>
              <p style={{ margin: "1px 0 0", fontSize: 11, color: T.slate400 }}>Configure system preferences</p>
            </div>
          </div>
        </div>

        {/* General Settings Card */}
        <div style={{
          background: "#fff", borderRadius: T.radius.lg, marginBottom: 20,
          border: `1px solid ${T.slate200}`, overflow: "hidden", boxShadow: T.shadow.sm,
        }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.slate100}`, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>🏢</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.slate800 }}>General Settings</h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: T.slate500 }}>Configure basic site information</p>
            </div>
          </div>
          <div style={{ padding: "20px" }}>
            <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(2, 1fr)" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.slate700, marginBottom: 6 }}>Admin Email</label>
                <input
                  type="email"
                  id="adminEmail"
                  value={settings.adminEmail}
                  onChange={handleSettingsChange}
                  style={{
                    width: "100%", padding: "8px 12px", borderRadius: T.radius.sm,
                    border: `1px solid ${T.slate200}`, fontSize: 13, fontFamily: T.font,
                    transition: "all 0.12s", outline: "none",
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = T.blue500}
                  onBlur={e => e.currentTarget.style.borderColor = T.slate200}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.slate700, marginBottom: 6 }}>Contact Number</label>
                <input
                  type="tel"
                  id="contactNumber"
                  value={settings.contactNumber}
                  onChange={handleSettingsChange}
                  style={{
                    width: "100%", padding: "8px 12px", borderRadius: T.radius.sm,
                    border: `1px solid ${T.slate200}`, fontSize: 13, fontFamily: T.font,
                    transition: "all 0.12s", outline: "none",
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = T.blue500}
                  onBlur={e => e.currentTarget.style.borderColor = T.slate200}
                />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.slate700, marginBottom: 6 }}>Company Address</label>
                <input
                  type="text"
                  id="companyAddress"
                  value={settings.companyAddress}
                  onChange={handleSettingsChange}
                  style={{
                    width: "100%", padding: "8px 12px", borderRadius: T.radius.sm,
                    border: `1px solid ${T.slate200}`, fontSize: 13, fontFamily: T.font,
                    transition: "all 0.12s", outline: "none",
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = T.blue500}
                  onBlur={e => e.currentTarget.style.borderColor = T.slate200}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.slate700, marginBottom: 6 }}>Timezone</label>
                <select
                  id="timezone"
                  value={settings.timezone}
                  onChange={handleSettingsChange}
                  style={{
                    width: "100%", padding: "8px 12px", borderRadius: T.radius.sm,
                    border: `1px solid ${T.slate200}`, fontSize: 13, fontFamily: T.font,
                    background: "#fff", cursor: "pointer", outline: "none",
                  }}
                >
                  <option value="Asia/Manila">Asia/Manila (UTC+8)</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.slate700, marginBottom: 6 }}>Language</label>
                <select
                  id="language"
                  value={settings.language}
                  onChange={handleSettingsChange}
                  style={{
                    width: "100%", padding: "8px 12px", borderRadius: T.radius.sm,
                    border: `1px solid ${T.slate200}`, fontSize: 13, fontFamily: T.font,
                    background: "#fff", cursor: "pointer", outline: "none",
                  }}
                >
                  <option value="en-PH">English (Philippines)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings Card */}
        <div style={{
          background: "#fff", borderRadius: T.radius.lg, marginBottom: 20,
          border: `1px solid ${T.slate200}`, overflow: "hidden", boxShadow: T.shadow.sm,
        }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.slate100}`, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>🔒</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.slate800 }}>Security Settings</h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: T.slate500 }}>Configure authentication and access controls</p>
            </div>
          </div>
          <div style={{ padding: "20px" }}>
            {/* Change Password Section */}
            <p style={{ fontSize: 12, fontWeight: 700, color: T.slate700, marginBottom: 12 }}>Change Password</p>
            <div style={{ display: "grid", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.slate700, marginBottom: 6 }}>Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  placeholder="Enter Current Password"
                  value={security.currentPassword}
                  onChange={handleSecurityChange}
                  style={{
                    width: "100%", padding: "8px 12px", borderRadius: T.radius.sm,
                    border: `1px solid ${T.slate200}`, fontSize: 13, fontFamily: T.font,
                    transition: "all 0.12s", outline: "none",
                  }}
                />
              </div>
              <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(2, 1fr)" }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.slate700, marginBottom: 6 }}>New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    placeholder="Enter New Password"
                    value={security.newPassword}
                    onChange={handleSecurityChange}
                    style={{
                      width: "100%", padding: "8px 12px", borderRadius: T.radius.sm,
                      border: `1px solid ${T.slate200}`, fontSize: 13, fontFamily: T.font,
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.slate700, marginBottom: 6 }}>Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    placeholder="Confirm New Password"
                    value={security.confirmPassword}
                    onChange={handleSecurityChange}
                    style={{
                      width: "100%", padding: "8px 12px", borderRadius: T.radius.sm,
                      border: `1px solid ${T.slate200}`, fontSize: 13, fontFamily: T.font,
                    }}
                  />
                </div>
              </div>
            </div>
            <button
              onClick={handleUpdatePassword}
              style={{
                padding: "8px 16px", borderRadius: T.radius.sm, border: "none",
                background: T.slate700, color: "#fff", fontSize: 12, fontWeight: 600,
                cursor: "pointer", marginBottom: 24, fontFamily: T.font,
              }}
              onMouseEnter={e => e.currentTarget.style.background = T.slate800}
              onMouseLeave={e => e.currentTarget.style.background = T.slate700}
            >
              Update Password
            </button>

            <hr style={{ border: "none", borderTop: `1px solid ${T.slate100}`, margin: "20px 0" }} />

            {/* Login Controls */}
            <p style={{ fontSize: 12, fontWeight: 700, color: T.slate700, marginBottom: 12 }}>Login Controls</p>
            <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(2, 1fr)", marginBottom: 24 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.slate700, marginBottom: 6 }}>Password Lockout (Attempts)</label>
                <input
                  type="number"
                  id="passwordLockout"
                  value={security.passwordLockout}
                  min="1"
                  max="99"
                  onChange={handleSecurityChange}
                  style={{
                    width: "100%", padding: "8px 12px", borderRadius: T.radius.sm,
                    border: `1px solid ${T.slate200}`, fontSize: 13, fontFamily: T.font,
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.slate700, marginBottom: 6 }}>Session Timeout (Minutes)</label>
                <input
                  type="number"
                  id="sessionTimeout"
                  value={security.sessionTimeout}
                  min="1"
                  max="999"
                  onChange={handleSecurityChange}
                  style={{
                    width: "100%", padding: "8px 12px", borderRadius: T.radius.sm,
                    border: `1px solid ${T.slate200}`, fontSize: 13, fontFamily: T.font,
                  }}
                />
              </div>
            </div>

            <hr style={{ border: "none", borderTop: `1px solid ${T.slate100}`, margin: "20px 0" }} />

            {/* Two-Factor Authentication */}
            <p style={{ fontSize: 12, fontWeight: 700, color: T.slate700, marginBottom: 12 }}>Two-Factor Authentication</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <span style={{ fontSize: 13, color: T.slate600 }}>Require 2FA for All Admins</span>
              <label className="as-toggle-switch">
                <input
                  type="checkbox"
                  checked={security.require2FA}
                  onChange={handleToggle2FA}
                />
                <span className="as-toggle-slider"></span>
              </label>
            </div>

            <hr style={{ border: "none", borderTop: `1px solid ${T.slate100}`, margin: "20px 0" }} />

            {/* Security Logs */}
            <p style={{ fontSize: 12, fontWeight: 700, color: T.slate700, marginBottom: 12 }}>Security Logs</p>
            <p style={{ fontSize: 12, color: T.slate500, marginBottom: 12 }}>Check security activities happening in website</p>
            <div style={{
              background: T.slate50, borderRadius: T.radius.sm, padding: "16px",
              border: `1px solid ${T.slate200}`, marginBottom: 12,
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.slate700 }}>Security Activity Log</span>
              <div style={{ height: 100, marginTop: 8, color: T.slate400, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                No logs available
              </div>
            </div>
            <button
              style={{
                padding: "6px 12px", borderRadius: T.radius.sm,
                border: `1px solid ${T.slate200}`, background: "#fff",
                color: T.slate700, fontSize: 12, fontWeight: 500, cursor: "pointer",
              }}
            >
              Export Log
            </button>
          </div>
        </div>

        {/* Appearance Settings Card */}
        <div style={{
          background: "#fff", borderRadius: T.radius.lg, marginBottom: 20,
          border: `1px solid ${T.slate200}`, overflow: "hidden", boxShadow: T.shadow.sm,
        }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.slate100}`, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>🎨</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.slate800 }}>Appearance Settings</h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: T.slate500 }}>Customize the look and feel of the site</p>
            </div>
          </div>
          <div style={{ padding: "20px" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: T.slate700, marginBottom: 12 }}>THEME</p>
            <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
              {['light', 'dark', 'auto'].map((t) => (
                <button
                  key={t}
                  onClick={() => handleThemeChange(t)}
                  style={{
                    flex: 1, padding: "12px", borderRadius: T.radius.md,
                    border: `2px solid ${appearance.theme === t ? T.blue500 : T.slate200}`,
                    background: "#fff", cursor: "pointer", transition: "all 0.12s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = T.blue300}
                  onMouseLeave={e => e.currentTarget.style.borderColor = appearance.theme === t ? T.blue500 : T.slate200}
                >
                  <div style={{
                    height: 60, borderRadius: T.radius.sm, marginBottom: 8,
                    background: t === 'light' ? "#fff" : t === 'dark' ? "#1a1a1a" : "linear-gradient(135deg, #fff 50%, #1a1a1a 50%)",
                    border: `1px solid ${T.slate200}`,
                  }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.slate700, textTransform: "capitalize" }}>{t}</span>
                </button>
              ))}
            </div>

            <hr style={{ border: "none", borderTop: `1px solid ${T.slate100}`, margin: "20px 0" }} />

            <p style={{ fontSize: 12, fontWeight: 700, color: T.slate700, marginBottom: 12 }}>Primary Color</p>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
              <input
                type="color"
                value={appearance.primaryColor}
                onChange={handleColorChange}
                style={{ width: 48, height: 48, borderRadius: T.radius.sm, cursor: "pointer", border: `1px solid ${T.slate200}` }}
              />
              <input
                type="text"
                value={appearance.colorHex}
                onChange={(e) => setAppearance(prev => ({ ...prev, colorHex: e.target.value, primaryColor: e.target.value }))}
                pattern="^#[0-9A-Fa-f]{6}$"
                style={{
                  flex: 1, padding: "8px 12px", borderRadius: T.radius.sm,
                  border: `1px solid ${T.slate200}`, fontSize: 13, fontFamily: "monospace",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { color: '#f97316', label: 'Orange' },
                { color: '#22c55e', label: 'Green' },
                { color: '#3b82f6', label: 'Blue' },
                { color: '#a855f7', label: 'Purple' },
                { color: '#06b6d4', label: 'Cyan' },
              ].map(({ color, label }) => (
                <button
                  key={color}
                  onClick={() => setAppearance(prev => ({ ...prev, primaryColor: color, colorHex: color }))}
                  style={{
                    width: 32, height: 32, borderRadius: T.radius.sm,
                    backgroundColor: color, border: `2px solid ${appearance.primaryColor === color ? "#fff" : "transparent"}`,
                    cursor: "pointer", boxShadow: T.shadow.sm,
                  }}
                  aria-label={`Select ${label}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20 }}>
          <button
            onClick={handleClearAll}
            style={{
              padding: "8px 20px", borderRadius: T.radius.sm,
              border: `1px solid ${T.slate200}`, background: "#fff",
              color: T.slate700, fontSize: 13, fontWeight: 500, cursor: "pointer",
              fontFamily: T.font,
            }}
            onMouseEnter={e => e.currentTarget.style.background = T.slate50}
            onMouseLeave={e => e.currentTarget.style.background = "#fff"}
          >
            Clear All
          </button>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            style={{
              padding: "8px 20px", borderRadius: T.radius.sm,
              border: "none", background: T.blue600, color: "#fff",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: T.font, opacity: saving ? 0.6 : 1,
            }}
            onMouseEnter={e => !saving && (e.currentTarget.style.background = T.blue700)}
            onMouseLeave={e => !saving && (e.currentTarget.style.background = T.blue600)}
          >
            {saving ? <Spinner /> : 'Save All Changes'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default AdminPanelSettings;