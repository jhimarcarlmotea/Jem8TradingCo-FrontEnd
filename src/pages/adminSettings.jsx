import { useState } from 'react';
import AdminNav from '../components/AdminNav';

// ── Shared classes ────────────────────────────────────────────────────────────
const inputCls = "h-[38px] px-3 border border-[#d0d0d0] rounded-lg text-sm text-[#1e1e1e] bg-[#fafafa] w-full box-border outline-none transition-all focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(21,93,252,0.1)] focus:bg-white font-[inherit]";
const labelCls = "text-[11px] font-medium text-[#555555]";
const sectionLabelCls = "text-[11px] font-semibold text-[#888888] uppercase tracking-[0.6px] m-0 mb-3";
const dividerCls = "border-none border-t border-[#eeeeee] my-4";
const cardCls = "bg-white border border-[#e0e0e0] rounded-xl px-7 py-6 mb-5 w-full box-border max-md:px-4 max-md:py-4";

const COLOR_PRESETS = [
  { color: '#f97316', label: 'Orange' },
  { color: '#22c55e', label: 'Green'  },
  { color: '#3b82f6', label: 'Blue'   },
  { color: '#a855f7', label: 'Purple' },
  { color: '#06b6d4', label: 'Cyan'   },
];

const AdminPanelSettings = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [settings, setSettings] = useState({
    siteName:       'Jem 8 Circle Trading Co.',
    siteURL:        'https://www.jem8circle.com/',
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
    theme:        'auto',
    primaryColor: '#f9960c',
    colorHex:     '#f9960c',
  });

  const handleSettingsChange = (e) => setSettings(p => ({ ...p, [e.target.id]: e.target.value }));
  const handleSecurityChange = (e) => {
    const { id, value, type, checked } = e.target;
    setSecurity(p => ({ ...p, [id]: type === 'checkbox' ? checked : value }));
  };
  const handleThemeChange  = (e) => setAppearance(p => ({ ...p, theme: e.target.value }));
  const handleColorChange  = (e) => setAppearance(p => ({ ...p, primaryColor: e.target.value, colorHex: e.target.value }));
  const handleToggle2FA    = () => setSecurity(p => ({ ...p, require2FA: !p.require2FA }));
  const handleSaveAll      = () => console.log('Saving:', { settings, security, appearance });
  const handleClearAll     = () => {
    setSettings({ siteName: '', siteURL: '', adminEmail: '', contactNumber: '', companyAddress: '', timezone: 'Asia/Manila', language: 'en-PH' });
    setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '', passwordLockout: 10, sessionTimeout: 10, require2FA: false });
  };

  return (
    <div className="flex min-h-screen w-full bg-[#f0f5f1]">
      <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 min-w-0 flex flex-col overflow-y-auto bg-[#f0f5f1]">

        {/* Mobile hamburger */}
        <button
          className="md:hidden self-start bg-transparent border-none text-[22px] cursor-pointer px-5 pt-4 text-[#333] hover:opacity-70"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >☰</button>

        {/* Page inner */}
        <div
          className="flex-1 px-10 py-8 pb-16 w-full max-w-full box-border text-[#1e1e1e] max-lg:px-7 max-md:px-4 max-md:py-3"
          style={{ fontFamily: "'Inter', Helvetica, sans-serif" }}
        >

          {/* Page Header */}
          <div className="flex items-center gap-4 mb-8 flex-wrap max-md:mb-5">
            <h2
              className="font-bold text-[26px] tracking-tight leading-tight m-0 text-[#111111] max-sm:text-xl"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Admin Settings
            </h2>
          </div>

          {/* ── General Settings ── */}
          <section className={cardCls}>
            <div className="flex items-start gap-3 mb-3">
              <span className="text-lg mt-0.5 shrink-0">🏢</span>
              <div>
                <h3 className="font-semibold text-sm text-[#111111] m-0 mb-0.5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  General Settings
                </h3>
                <p className="text-[11px] text-[#757575] m-0">Configure basic site information</p>
              </div>
            </div>
            <hr className={dividerCls} />
            <form onSubmit={e => e.preventDefault()}>
              <div className="grid grid-cols-2 gap-4 mb-4 max-md:grid-cols-1">
                <div className="flex flex-col gap-1 min-w-0">
                  <label htmlFor="siteName" className={labelCls}>Site Name</label>
                  <input type="text" id="siteName" className={inputCls} value={settings.siteName} onChange={handleSettingsChange} />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <label htmlFor="siteURL" className={labelCls}>Site URL</label>
                  <input type="url" id="siteURL" className={inputCls} value={settings.siteURL} onChange={handleSettingsChange} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4 max-md:grid-cols-1">
                <div className="flex flex-col gap-1 min-w-0">
                  <label htmlFor="adminEmail" className={labelCls}>Admin Email</label>
                  <input type="email" id="adminEmail" className={inputCls} value={settings.adminEmail} onChange={handleSettingsChange} />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <label htmlFor="contactNumber" className={labelCls}>Contact Number</label>
                  <input type="tel" id="contactNumber" className={inputCls} value={settings.contactNumber} onChange={handleSettingsChange} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div className="flex flex-col gap-1 min-w-0">
                  <label htmlFor="companyAddress" className={labelCls}>Company Address</label>
                  <input type="text" id="companyAddress" className={inputCls} value={settings.companyAddress} onChange={handleSettingsChange} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4 max-md:grid-cols-1">
                <div className="flex flex-col gap-1 min-w-0">
                  <label htmlFor="timezone" className={labelCls}>Timezone</label>
                  <select id="timezone" className={`${inputCls} cursor-pointer`} value={settings.timezone} onChange={handleSettingsChange}>
                    <option value="Asia/Manila">Asia/Manila (UTC+8)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <label htmlFor="language" className={labelCls}>Language</label>
                  <select id="language" className={`${inputCls} cursor-pointer`} value={settings.language} onChange={handleSettingsChange}>
                    <option value="en-PH">English (Philippines)</option>
                  </select>
                </div>
              </div>
            </form>
          </section>

          {/* ── Security Settings ── */}
          <section className={cardCls}>
            <div className="flex items-start gap-3 mb-3">
              <span className="text-lg mt-0.5 shrink-0">🔒</span>
              <div>
                <h3 className="font-semibold text-sm text-[#111111] m-0 mb-0.5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Security Settings
                </h3>
                <p className="text-[11px] text-[#757575] m-0">Configure authentication and access controls</p>
              </div>
            </div>
            <hr className={dividerCls} />
            <form onSubmit={e => e.preventDefault()}>
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div className="flex flex-col gap-1 min-w-0">
                  <label htmlFor="currentPassword" className={labelCls}>Current Password</label>
                  <input type="password" id="currentPassword" className={inputCls} placeholder="Enter Current Password" value={security.currentPassword} onChange={handleSecurityChange} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4 max-md:grid-cols-1">
                <div className="flex flex-col gap-1 min-w-0">
                  <label htmlFor="newPassword" className={labelCls}>New Password</label>
                  <input type="password" id="newPassword" className={inputCls} placeholder="Enter New Password" value={security.newPassword} onChange={handleSecurityChange} />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <label htmlFor="confirmPassword" className={labelCls}>Confirm New Password</label>
                  <input type="password" id="confirmPassword" className={inputCls} placeholder="Confirm New Password" value={security.confirmPassword} onChange={handleSecurityChange} />
                </div>
              </div>
              <div className="mb-4">
                <button type="button"
                  className="h-[38px] px-5 rounded-lg border-none bg-[#111111] text-white text-sm font-medium cursor-pointer hover:opacity-85 active:scale-98 transition-all inline-flex items-center"
                  style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Update Password
                </button>
              </div>

              <hr className={dividerCls} />
              <p className={sectionLabelCls}>Login Controls</p>
              <div className="grid grid-cols-2 gap-4 mb-4 max-md:grid-cols-1">
                <div className="flex flex-col gap-1 min-w-0">
                  <label htmlFor="passwordLockout" className={labelCls}>Password Lockout (Attempts)</label>
                  <input type="number" id="passwordLockout" className={inputCls} value={security.passwordLockout} min="1" max="99" onChange={handleSecurityChange} />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <label htmlFor="sessionTimeout" className={labelCls}>Session Timeout (Minutes)</label>
                  <input type="number" id="sessionTimeout" className={inputCls} value={security.sessionTimeout} min="1" max="999" onChange={handleSecurityChange} />
                </div>
              </div>

              <hr className={dividerCls} />
              <p className={sectionLabelCls}>Two-Factor Authentication</p>
              <div className="flex items-center justify-between gap-4 py-2 flex-wrap">
                <span className={labelCls}>Require 2FA for All Admins</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={security.require2FA}
                  onClick={handleToggle2FA}
                  className={`w-[46px] h-[26px] rounded-full border-none cursor-pointer flex items-center px-[3px] transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2
                    ${security.require2FA ? "bg-blue-600 justify-end" : "bg-[#d0d0d0] justify-start"}`}
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3)] block" />
                </button>
              </div>

              <hr className={dividerCls} />
              <p className={sectionLabelCls}>Security Logs</p>
              <p className={`${labelCls} mb-2`}>Check security activities happening in website</p>
              <div className="border border-[#e0e0e0] rounded-lg bg-[#f7f7f7] px-3.5 py-2.5 mb-1">
                <span className="text-xs font-medium text-[#333333] block" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Security Activity Log
                </span>
                <div className="min-h-9" />
              </div>
              <div className="mt-2">
                <button type="button"
                  className="h-[38px] px-5 rounded-lg bg-transparent border border-[#cccccc] text-[#333333] text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors inline-flex items-center"
                  style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Export Log
                </button>
              </div>
            </form>
          </section>

          {/* ── Appearance Settings ── */}
          <section className={cardCls}>
            <div className="flex items-start gap-3 mb-3">
              <span className="text-lg mt-0.5 shrink-0">🎨</span>
              <div>
                <h3 className="font-semibold text-sm text-[#111111] m-0 mb-0.5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Appearance Settings
                </h3>
                <p className="text-[11px] text-[#757575] m-0">Customize the look and feel of the site</p>
              </div>
            </div>
            <hr className={dividerCls} />
            <form onSubmit={e => e.preventDefault()}>
              <p className={sectionLabelCls}>THEME</p>
              <div className="flex gap-5 mb-4 flex-wrap max-md:gap-3">
                {['light', 'dark', 'auto'].map((t) => {
                  const isActive = appearance.theme === t;
                  return (
                    <label key={t} className="flex flex-col items-center gap-2 cursor-pointer">
                      <input type="radio" name="theme" value={t} checked={isActive} onChange={handleThemeChange} className="sr-only" />
                      <div className={`w-[88px] h-[58px] rounded-lg overflow-hidden flex border-2 transition-all max-md:w-[72px] max-md:h-12
                        ${isActive ? "border-blue-600 shadow-[0_0_0_3px_rgba(21,93,252,0.12)]" : "border-[#e0e0e0]"}`}>
                        {t === 'light' && (
                          <>
                            <div className="w-[22px] bg-[#f0f0f0] shrink-0" />
                            <div className="flex-1 p-2 flex flex-col gap-1">
                              <div className="h-2 bg-[#d9d9d9] rounded-sm" />
                              <div className="h-2 bg-[#d9d9d9] rounded-sm w-3/5" />
                            </div>
                          </>
                        )}
                        {t === 'dark' && (
                          <>
                            <div className="w-[22px] bg-[#222222] shrink-0" />
                            <div className="flex-1 p-2 flex flex-col gap-1 bg-[#111111]">
                              <div className="h-2 bg-[#444444] rounded-sm" />
                              <div className="h-2 bg-[#444444] rounded-sm w-3/5" />
                            </div>
                          </>
                        )}
                        {t === 'auto' && (
                          <div className="w-full h-full" style={{ background: "linear-gradient(to right, #ffffff 50%, #111111 50%)" }} />
                        )}
                      </div>
                      <span
                        className={`text-xs ${isActive ? "text-blue-600 font-semibold" : "text-[#555555]"}`}
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </span>
                    </label>
                  );
                })}
              </div>

              <hr className={dividerCls} />
              <p className={sectionLabelCls}>Primary Color</p>
              <div className="flex items-center gap-3 mb-3.5 flex-wrap">
                <div className="w-14 h-[38px] rounded-lg border border-[#d0d0d0] overflow-hidden shrink-0">
                  <input
                    type="color"
                    id="color-picker"
                    value={appearance.primaryColor}
                    onChange={handleColorChange}
                    className="w-[120%] h-[120%] -m-[10%] border-none cursor-pointer bg-transparent"
                  />
                </div>
                <input
                  type="text"
                  className={`${inputCls} w-[140px] font-mono tracking-[1px] max-md:w-full`}
                  value={appearance.colorHex}
                  pattern="^#[0-9A-Fa-f]{6}$"
                  onChange={(e) => setAppearance(p => ({ ...p, colorHex: e.target.value }))}
                />
              </div>
              <div className="flex gap-2.5 flex-wrap">
                {COLOR_PRESETS.map(({ color, label }) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Select ${label}`}
                    onClick={() => setAppearance(p => ({ ...p, primaryColor: color, colorHex: color }))}
                    className="w-8 h-8 rounded-full border-2 border-black/8 cursor-pointer shrink-0 hover:scale-110 hover:shadow-[0_3px_10px_rgba(0,0,0,0.2)] transition-all focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </form>
          </section>

          {/* ── Action Buttons ── */}
          <div className="flex justify-end gap-3 mt-2 flex-wrap max-md:flex-col max-md:[&>button]:w-full">
            <button
              type="button"
              onClick={handleClearAll}
              className="h-[38px] px-5 rounded-lg bg-transparent border border-[#cccccc] text-[#333333] text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors inline-flex items-center justify-center"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Clear All
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="h-[38px] px-5 rounded-lg border-none bg-blue-600 text-white text-sm font-medium cursor-pointer hover:opacity-85 active:scale-98 transition-all inline-flex items-center justify-center"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Save All Changes
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminPanelSettings;