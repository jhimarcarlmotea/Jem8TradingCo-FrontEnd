// ─── PasswordSecurity.jsx ────────────────────────────────────────────────────
import { useState } from "react";
import '../style/PasswordSecurity.css';

const EyeIcon = ({ open }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
);

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
  </svg>
);

const LockHeaderIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

export default function PasswordSecurity() {
  const [showCurrent, setShowCurrent]   = useState(false);
  const [showNew, setShowNew]           = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [current, setCurrent]           = useState("");
  const [newPass, setNewPass]           = useState("");
  const [confirm, setConfirm]           = useState("");

  const checks = {
    length:  newPass.length >= 8,
    number:  /\d/.test(newPass),
    upper:   /[A-Z]/.test(newPass),
    special: /[^A-Za-z0-9]/.test(newPass),
  };

  return (
    <div className="profile-main">

      {/* Breadcrumb */}
      <div className="profile-breadcrumb">
        <span className="profile-breadcrumb__dot" />
        Password &amp; Security &nbsp;·&nbsp; Manage your password and account security settings
      </div>

      <div className="profile-card">
        <div className="profile-card__header">
          <div className="profile-card__header-left">
            <div className="profile-card__icon-box">
              <LockHeaderIcon />
            </div>
            <div>
              <div className="profile-card__title">Change Password</div>
              <div className="profile-card__subtitle">Use a strong password you don't use elsewhere</div>
            </div>
          </div>
        </div>

        <div className="password-form">

          {/* Current Password */}
          <div className="password-form__group">
            <label className="password-form__label">Current Password</label>
            <div className="password-form__input-wrap">
              <input
                type={showCurrent ? "text" : "password"}
                className="password-form__input"
                placeholder="Enter your current password"
                value={current}
                onChange={e => setCurrent(e.target.value)}
              />
              <button
                className="password-form__eye"
                onClick={() => setShowCurrent(p => !p)}
                type="button"
              >
                <EyeIcon open={showCurrent} />
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="password-form__group">
            <label className="password-form__label">New Password</label>
            <div className="password-form__input-wrap">
              <input
                type={showNew ? "text" : "password"}
                className="password-form__input"
                placeholder="Enter a new password"
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
              />
              <button
                className="password-form__eye"
                onClick={() => setShowNew(p => !p)}
                type="button"
              >
                <EyeIcon open={showNew} />
              </button>
            </div>

            {/* Password rules */}
            <div className="password-rules">
              <div className={`password-rule${checks.length ? " pass" : ""}`}>
                <CheckIcon /> At least 8 characters
              </div>
              <div className={`password-rule${checks.number ? " pass" : ""}`}>
                <CheckIcon /> One number
              </div>
              <div className={`password-rule${checks.upper ? " pass" : ""}`}>
                <CheckIcon /> One uppercase letter
              </div>
              <div className={`password-rule${checks.special ? " pass" : ""}`}>
                <CheckIcon /> One special character
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="password-form__group">
            <label className="password-form__label">Confirm New Password</label>
            <div className="password-form__input-wrap">
              <input
                type={showConfirm ? "text" : "password"}
                className="password-form__input"
                placeholder="Re-enter your new password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
              />
              <button
                className="password-form__eye"
                onClick={() => setShowConfirm(p => !p)}
                type="button"
              >
                <EyeIcon open={showConfirm} />
              </button>
            </div>
            {confirm && newPass && confirm !== newPass && (
              <span className="password-form__mismatch">Passwords do not match</span>
            )}
          </div>

          {/* Actions */}
          <div className="password-form__actions">
            <button
              className="btn-profile-outline"
              onClick={() => { setCurrent(""); setNewPass(""); setConfirm(""); }}
            >
              <RefreshIcon /> Reset
            </button>
            <button className="btn-profile-primary">
              <CheckIcon /> Update Password
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}