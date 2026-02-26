import { useState } from 'react';
import '../style/adminSettings.css';


const AdminPanelSettings = () => {
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
    colorHex: '#d97706',
  });

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

  const handleToggle2FA = () => {
    setSecurity(prev => ({ ...prev, require2FA: !prev.require2FA }));
  };

  const handleSaveAll = () => {
    console.log('Saving all settings:', { settings, security, appearance });
  };

  const handleClearAll = () => {
    setSettings({
      siteName: '',
      siteURL: '',
      adminEmail: '',
      contactNumber: '',
      companyAddress: '',
      timezone: 'Asia/Manila',
      language: 'en-PH',
    });
    setSecurity({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      passwordLockout: 10,
      sessionTimeout: 10,
      require2FA: false,
    });
  };

  return (
    <div className="admin-settings" data-color-mode="SDS-light">
      {/* Background */}
      <div className="background"></div>

      {/* Sidebar */}
      <aside className="sidebar" role="navigation" aria-label="Main navigation">
        <img className="img-jem-circle" src="img/img-jem-8-circle-logo.png" alt="Jem 8 Circle Trading Co. Logo" />
        <header className="container">
          <div className="heading">
            <h1 className="txt-admin-panel">Admin Panel</h1>
          </div>
          <div className="paragraph">
            <p className="txt-admin-panel-desc">Account Management System</p>
          </div>
        </header>
        <nav className="navigation">
          <a href="#dashboard" className="btn-dashboard">
            <div className="icon-3" aria-hidden="true">
              <img className="vector-3" src="img/vector-28.svg" alt="" />
              <img className="vector-4" src="img/vector-14.svg" alt="" />
              <img className="vector-5" src="img/vector-25.svg" alt="" />
              <img className="vector-6" src="img/vector-3.svg" alt="" />
            </div>
            <div className="text"><span className="text-wrapper-34">Dashboard</span></div>
          </a>
          <a href="#products" className="div-2">
            <div className="icon-3" aria-hidden="true">
              <img className="vector-7" src="img/vector-12.svg" alt="" />
              <img className="vector-8" src="img/vector-24.svg" alt="" />
              <img className="vector-9" src="img/vector-21.svg" alt="" />
              <img className="vector-10" src="img/vector-15.svg" alt="" />
            </div>
            <div className="div-wrapper"><span className="text-wrapper-35">Products</span></div>
          </a>
          <a href="#orders" className="div-2">
            <div className="icon-3" aria-hidden="true">
              <img className="vector-11" src="img/vector-13.svg" alt="" />
              <img className="vector-12" src="img/vector.svg" alt="" />
              <img className="vector-13" src="img/vector-5.svg" alt="" />
            </div>
            <div className="text-2"><span className="text-wrapper-36">Orders</span></div>
          </a>
          <a href="#blog-post" className="btn-blog-post">
            <img className="image-2" src="img/image-71.png" alt="" />
            <div className="text"><span className="text-wrapper-37">Blog Post</span></div>
          </a>
          <a href="#account-management" className="div-2">
            <div className="icon-4" aria-hidden="true">
              <img className="vector-14" src="img/vector-16.svg" alt="" />
              <img className="account-circle" src="img/account-circle.svg" alt="" />
            </div>
            <div className="text-3"><span className="text-wrapper-38">Account Management</span></div>
          </a>
          <a href="#customer-reports" className="div-2">
            <div className="icon-3" aria-hidden="true">
              <img className="vector-15" src="img/vector-8.svg" alt="" />
              <img className="vector-16" src="img/vector-27.svg" alt="" />
            </div>
            <div className="text-4"><span className="text-wrapper-39">Customer Reports</span></div>
          </a>
          <a href="#leadership-management" className="div-3">
            <div className="icon-3" aria-hidden="true">
              <img className="vector-3" src="img/vector-19.svg" alt="" />
            </div>
            <div className="text-5"><span className="text-wrapper-40">Leadership Management</span></div>
          </a>
          <a href="#backup-recovery" className="div-3">
            <div className="icon-3" aria-hidden="true">
              <img className="vector-17" src="img/vector-7.svg" alt="" />
              <img className="vector-18" src="img/vector-30.svg" alt="" />
              <img className="vector-19" src="img/vector-20.svg" alt="" />
              <img className="vector-20" src="img/vector-22.svg" alt="" />
              <img className="vector-21" src="img/vector-17.svg" alt="" />
            </div>
            <div className="text-6"><span className="backup-recovery">Backup &amp; Recovery</span></div>
          </a>
          <a href="#activity-logs" className="div-3">
            <div className="icon-3" aria-hidden="true">
              <img className="vector-3" src="img/vector-4.svg" alt="" />
              <img className="vector-22" src="img/vector-6.svg" alt="" />
              <img className="vector-23" src="img/vector-2.svg" alt="" />
              <img className="vector-24" src="img/vector-26.svg" alt="" />
            </div>
            <div className="text-6"><span className="text-wrapper-41">Activity Logs</span></div>
          </a>
          <a href="#settings" className="btn-settings" aria-current="page">
            <div className="icon-3" aria-hidden="true">
              <img className="vector-25" src="img/vector-18.svg" alt="" />
              <img className="vector-26" src="img/vector-23.svg" alt="" />
            </div>
            <div className="text-7"><span className="text-wrapper-42">Settings</span></div>
          </a>
        </nav>
        <div className="pnl-profile">
          <div className="container-2">
            <div className="img-admin-profile" aria-hidden="true">
              <div className="txt-admin-profile-wrapper">
                <span className="txt-admin-profile">AD</span>
              </div>
            </div>
            <div className="container-3">
              <div className="txt-admin-user-name">Admin User</div>
              <div className="paragraph-wrapper">
                <div className="txt-admin-email-wrapper">
                  <span className="txt-admin-email">admin@company.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Page Header */}
        <header className="frame-9">
          <div className="img-admin-settings" aria-hidden="true">
            <img className="vector" src="img/vector-29.svg" alt="" />
            <img className="vector-2" src="img/vector-10.svg" alt="" />
          </div>
          <div className="text-content-title">
            <h2 className="txt-admin-settings">Admin Settings</h2>
            <p className="txt-admin-settings-2">Settings for admin</p>
          </div>
        </header>

        {/* General Settings */}
        <section className="rectangle-4" aria-labelledby="general-settings-heading">
          <img className="image-5" src="img/image-114.png" alt="" aria-hidden="true" />
          <h3 id="general-settings-heading" className="text-wrapper-18">General Settings</h3>
          <p className="text-wrapper-22">Configure basic site information</p>
          <img className="line" src="img/line-87.svg" alt="" aria-hidden="true" />
          <form className="general-settings-form" onSubmit={(e) => e.preventDefault()}>
            <div className="form-group">
              <label htmlFor="siteName" className="text-wrapper-6">Site Name</label>
              <div className="rectangle-17"></div>
              <input type="text" id="siteName" className="input-site-name" value={settings.siteName} onChange={handleSettingsChange} />
            </div>
            <div className="form-group">
              <label htmlFor="siteURL" className="text-wrapper-10">Site URL</label>
              <div className="rectangle-11"></div>
              <input type="url" id="siteURL" className="input-site-URL" value={settings.siteURL} onChange={handleSettingsChange} />
            </div>
            <div className="form-group">
              <label htmlFor="adminEmail" className="text-wrapper-8">Admin Email</label>
              <div className="rectangle-19"></div>
              <input type="email" id="adminEmail" className="input-site-email" value={settings.adminEmail} onChange={handleSettingsChange} />
            </div>
            <div className="form-group">
              <label htmlFor="contactNumber" className="text-wrapper-15">Contact Number</label>
              <div className="rectangle-10"></div>
              <input type="tel" id="contactNumber" className="input-site-number" value={settings.contactNumber} onChange={handleSettingsChange} />
            </div>
            <div className="form-group">
              <label htmlFor="companyAddress" className="text-wrapper-9">Company Address</label>
              <div className="rectangle-9"></div>
              <input type="text" id="companyAddress" className="input-site-address" value={settings.companyAddress} onChange={handleSettingsChange} />
            </div>
            <div className="form-group">
              <label htmlFor="timezone" className="text-wrapper-16">Timezone</label>
              <div className="rectangle-7"></div>
              <select id="timezone" className="cmb-site-time-zone" value={settings.timezone} onChange={handleSettingsChange}>
                <option value="Asia/Manila">Asia/Manila (UTC+8)</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="language" className="text-wrapper-17">Language</label>
              <div className="rectangle-8"></div>
              <select id="language" className="cmb-site-language" value={settings.language} onChange={handleSettingsChange}>
                <option value="en-PH">English(Philippines)</option>
              </select>
            </div>
          </form>
        </section>

        {/* Security Settings */}
        <section className="rectangle-5" aria-labelledby="security-settings-heading">
          <img className="image-4" src="img/image-113.png" alt="" aria-hidden="true" />
          <h3 id="security-settings-heading" className="text-wrapper-19">Security Settings</h3>
          <p className="p">Configure authentication and access controls</p>
          <img className="line-2" src="img/line-88.svg" alt="" aria-hidden="true" />
          <form className="security-settings-form" onSubmit={(e) => e.preventDefault()}>
            <div className="form-group">
              <label htmlFor="currentPassword" className="text-wrapper-7">Current Password</label>
              <div className="rectangle-18"></div>
              <input type="password" id="currentPassword" className="input-current" placeholder="Enter Current Password" value={security.currentPassword} onChange={handleSecurityChange} />
            </div>
            <div className="form-group">
              <label htmlFor="newPassword" className="text-wrapper-11">New Password</label>
              <div className="rectangle-12"></div>
              <input type="password" id="newPassword" className="input-new-password" placeholder="Enter New Password" value={security.newPassword} onChange={handleSecurityChange} />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword" className="text-wrapper-14">Confirm New Password</label>
              <div className="rectangle-16"></div>
              <input type="password" id="confirmPassword" className="input-confirm-new" placeholder="Confirm New Password" value={security.confirmPassword} onChange={handleSecurityChange} />
            </div>
            <button type="button" className="group-12">
              <div className="rectangle-20"></div>
              <span className="text-wrapper-32">Update Password</span>
            </button>
            <img className="line-5" src="img/line-89.svg" alt="" aria-hidden="true" />
            <fieldset className="login-controls">
              <legend className="text-wrapper-27">Login Controls</legend>
              <div className="form-group">
                <label htmlFor="passwordLockout" className="text-wrapper-12">Password Lockout (Attempts)</label>
                <div className="cmb-password-lockout"></div>
                <input type="number" id="passwordLockout" className="text-wrapper-26" value={security.passwordLockout} min="1" max="99" onChange={handleSecurityChange} />
              </div>
              <div className="form-group">
                <label htmlFor="sessionTimeout" className="text-wrapper-13">Session Timeout (Minutes)</label>
                <div className="rectangle-15"></div>
                <input type="number" id="sessionTimeout" className="cmb-session-timeout" value={security.sessionTimeout} min="1" max="999" onChange={handleSecurityChange} />
              </div>
            </fieldset>
            <img className="line-6" src="img/line-90.svg" alt="" aria-hidden="true" />
            <fieldset className="two-factor-auth">
              <legend className="text-wrapper-28">Two-Factor Authentication</legend>
              <div className="form-group">
                <label htmlFor="require-2fa" className="require-for-all">Require 2FA for All Admins</label>
                <button
                  type="button"
                  id="require-2fa"
                  className="tgl-admins"
                  role="switch"
                  aria-checked={security.require2FA}
                  onClick={handleToggle2FA}
                >
                  <span className="knob-toggle"></span>
                </button>
              </div>
            </fieldset>
            <fieldset className="security-logs">
              <legend className="text-wrapper-29">Security Logs</legend>
              <p className="text-wrapper-30">Check security activities happening in website</p>
              <div className="rectangle-13"></div>
              <div className="text-wrapper-31">Security Activity Log</div>
              <div className="rectangle-14"></div>
              <button type="button" className="btn-export-log">
                <div className="rectangle-21"></div>
                <span className="text-wrapper-33">Export Log</span>
              </button>
            </fieldset>
          </form>
        </section>

        {/* Appearance Settings */}
        <section className="rectangle-6" aria-labelledby="appearance-settings-heading">
          <img className="image-3" src="img/image-112.png" alt="" aria-hidden="true" />
          <h3 id="appearance-settings-heading" className="text-wrapper-20">Appearance Settings</h3>
          <p className="text-wrapper-23">Customize the look and feel of the site</p>
          <img className="line-3" src="img/line-91.svg" alt="" aria-hidden="true" />
          <form className="appearance-settings-form" onSubmit={(e) => e.preventDefault()}>
            <fieldset className="theme-selection">
              <legend className="text-wrapper-24">THEME</legend>
              <div className="theme-options">
                <div className="btn-light">
                  <input type="radio" id="theme-light" name="theme" value="light" className="visually-hidden" checked={appearance.theme === 'light'} onChange={handleThemeChange} />
                  <label htmlFor="theme-light">
                    <div className="rectangle-24"></div>
                    <div className="rectangle-25"></div>
                    <div className="rectangle-26"></div>
                    <div className="rectangle-27"></div>
                    <div className="rectangle-28"></div>
                    <span className="text-wrapper-43">Light</span>
                  </label>
                </div>
                <div className="btn-dark">
                  <input type="radio" id="theme-dark" name="theme" value="dark" className="visually-hidden" checked={appearance.theme === 'dark'} onChange={handleThemeChange} />
                  <label htmlFor="theme-dark">
                    <div className="rectangle-29"></div>
                    <div className="rectangle-30"></div>
                    <div className="rectangle-31"></div>
                    <div className="rectangle-32"></div>
                    <div className="rectangle-33"></div>
                    <span className="text-wrapper-44">Dark</span>
                  </label>
                </div>
                <div className="btn-auto">
                  <input type="radio" id="theme-auto" name="theme" value="auto" className="visually-hidden" checked={appearance.theme === 'auto'} onChange={handleThemeChange} />
                  <label htmlFor="theme-auto">
                    <div className="rectangle-34"></div>
                    <div className="rectangle-35"></div>
                    <div className="rectangle-36"></div>
                    <div className="rectangle-37"></div>
                    <div className="rectangle-38"></div>
                    <div className="rectangle-39"></div>
                    <div className="rectangle-33"></div>
                    <span className="text-wrapper-21">Auto</span>
                  </label>
                </div>
              </div>
              <div className="rectangle-22"></div>
              <div className="rectangle-23"></div>
            </fieldset>
            <img className="line-4" src="img/line-92.svg" alt="" aria-hidden="true" />
            <fieldset className="color-selection">
              <legend className="text-wrapper-25">Primary Color</legend>
              <div className="color-picker-wrapper">
                <div className="rectangle-40"></div>
                <label htmlFor="color-picker" className="visually-hidden">Select primary color</label>
                <input type="color" id="color-picker" className="clr-admin-color" value={appearance.primaryColor} onChange={handleColorChange} />
                <div className="rectangle-41"></div>
                <input
                  type="text"
                  id="color-hex"
                  className="inp-admin-color"
                  value={appearance.colorHex}
                  pattern="^#[0-9A-Fa-f]{6}$"
                  onChange={(e) => setAppearance(prev => ({ ...prev, colorHex: e.target.value }))}
                />
              </div>
              <div className="group-13" role="group" aria-label="Preset colors">
                <button type="button" className="color-preset" aria-label="Select orange color" onClick={() => setAppearance(prev => ({ ...prev, primaryColor: '#f97316', colorHex: '#f97316' }))}>
                  <img className="clr-admin-color-2" src="img/clr-admin-color-select.svg" alt="" />
                </button>
                <button type="button" className="color-preset" aria-label="Select green color" onClick={() => setAppearance(prev => ({ ...prev, primaryColor: '#22c55e', colorHex: '#22c55e' }))}>
                  <img className="clr-admin-color-3" src="img/clr-admin-color-select-4.svg" alt="" />
                </button>
                <button type="button" className="color-preset" aria-label="Select blue color" onClick={() => setAppearance(prev => ({ ...prev, primaryColor: '#3b82f6', colorHex: '#3b82f6' }))}>
                  <img className="clr-admin-color-4" src="img/clr-admin-color-select-3.svg" alt="" />
                </button>
                <button type="button" className="color-preset" aria-label="Select purple color" onClick={() => setAppearance(prev => ({ ...prev, primaryColor: '#a855f7', colorHex: '#a855f7' }))}>
                  <img className="clr-admin-color-3" src="img/clr-admin-color-select-2.svg" alt="" />
                </button>
                <button type="button" className="color-preset" aria-label="Select cyan color" onClick={() => setAppearance(prev => ({ ...prev, primaryColor: '#06b6d4', colorHex: '#06b6d4' }))}>
                  <img className="clr-admin-color-5" src="img/clr-admin-color-select-5.svg" alt="" />
                </button>
              </div>
            </fieldset>
          </form>
        </section>

        {/* Action Buttons */}
        <div className="group-11">
          <button type="button" className="btn-clear-all" onClick={handleClearAll}>
            <img className="rectangle-3" src="img/rectangle-262.svg" alt="" aria-hidden="true" />
            <span className="text-wrapper-5">Clear All</span>
          </button>
          <button type="button" className="btn-save-all" onClick={handleSaveAll}>
            <img className="rectangle-2" src="img/rectangle-261.svg" alt="" aria-hidden="true" />
            <span className="text-wrapper-4">Save All Changes</span>
          </button>
        </div>
      </main>
    </div>
  );
};

export default AdminPanelSettings;