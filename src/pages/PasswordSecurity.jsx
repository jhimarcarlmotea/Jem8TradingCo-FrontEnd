// ─── PasswordSecurity.jsx ────────────────────────────────────────────────────
import { useState } from "react";
import { toast } from "react-toastify";
import api from "../api/axios";

// ─── Icons ────────────────────────────────────────────────────────────────────
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

const SpinnerIcon = () => (
  <div
    className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white"
    style={{ animation: "spin 0.7s linear infinite" }}
  />
);

// ─── Keyframes ────────────────────────────────────────────────────────────────
const KEYFRAMES = `@keyframes spin { to { transform: rotate(360deg); } }`;

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PasswordSecurity() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");

  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // ─── Password strength checks ──────────────────────────────────────────────
  const checks = {
    length:  newPass.length >= 8,
    number:  /\d/.test(newPass),
    upper:   /[A-Z]/.test(newPass),
    special: /[^A-Za-z0-9]/.test(newPass),
  };
  const allChecksPassed = Object.values(checks).every(Boolean);
  const strengthScore   = Object.values(checks).filter(Boolean).length;
  const strengthMeta    = [
    { label: "Very Weak", color: "#ef4444" },
    { label: "Weak",      color: "#f97316" },
    { label: "Fair",      color: "#eab308" },
    { label: "Good",      color: "#22c55e" },
    { label: "Strong",    color: "#10b981" },
  ][strengthScore] ?? { label: "", color: "#e5e7eb" };

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const inputClass = (hasError) =>
    `w-full h-[46px] border rounded-lg pl-4 pr-11 text-sm text-gray-800 bg-[#f0f7f2] outline-none transition-all duration-200
     placeholder:text-gray-300 placeholder:italic
     focus:border-[#4d7b65] focus:bg-white focus:shadow-[0_0_0_3px_rgba(77,123,101,0.12)]
     ${hasError
       ? "border-red-400 bg-red-50 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.10)]"
       : "border-gray-200"}`;

  const ruleClass = (pass) =>
    `inline-flex items-center gap-1.5 text-xs transition-colors duration-200
     ${pass ? "text-[#4d7b65] [&_svg]:stroke-[#4d7b65]" : "text-gray-400 [&_svg]:stroke-gray-300"}`;

  const clearError = (key) => setErrors((p) => ({ ...p, [key]: "" }));

  // ─── Client-side validation ────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!current) {
      e.current_password = "Please enter your current password.";
    }
    if (!newPass) {
      e.new_password = "Please enter a new password.";
    } else if (!allChecksPassed) {
      e.new_password = "Password doesn't meet all requirements above.";
    } else if (newPass === current) {
      e.new_password = "New password must differ from your current password.";
    }
    if (!confirm) {
      e.new_password_confirmation = "Please confirm your new password.";
    } else if (newPass && confirm !== newPass) {
      e.new_password_confirmation = "Passwords do not match.";
    }
    return e;
  };

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSuccess(false);
    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      await api.post("/profile/change-password", {
        current_password:          current,
        new_password:              newPass,
        new_password_confirmation: confirm,
      });

      setSuccess(true);
      setCurrent(""); setNewPass(""); setConfirm("");
      toast.success("Password changed successfully! 🔒");

    } catch (err) {
      const data   = err?.response?.data;
      const status = err?.response?.status;

      if (status === 422 && data?.errors) {
        // Laravel validation bag  { errors: { field: ["message", ...] } }
        const mapped = {};
        Object.entries(data.errors).forEach(([key, msgs]) => {
          mapped[key] = Array.isArray(msgs) ? msgs[0] : msgs;
        });
        setErrors(mapped);
        toast.error("Please fix the errors below.");

      } else if ((status === 422 || status === 401) && data?.message) {
        // Single message e.g. "The current password is incorrect."
        setErrors({ current_password: data.message });
        toast.error(data.message);

      } else {
        toast.error(data?.message ?? "Failed to change password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Reset form ────────────────────────────────────────────────────────────
  const handleReset = () => {
    setCurrent(""); setNewPass(""); setConfirm("");
    setErrors({}); setSuccess(false);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{KEYFRAMES}</style>

      <div className="p-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
          <span className="w-2 h-2 rounded-full bg-[#4d7b65] inline-block" />
          <span>Password &amp; Security &nbsp;·&nbsp; Manage your password and account security settings</span>
        </div>

        {/* Card */}
        <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">

          {/* Card Header */}
          <div className="flex items-center gap-4 py-5 border-b border-gray-100 px-7">
            <div className="w-11 h-11 rounded-xl bg-[#f0f7f2] flex items-center justify-center text-[#4d7b65] flex-shrink-0">
              <LockHeaderIcon />
            </div>
            <div>
              <div className="text-[15px] font-semibold text-gray-900">Change Password</div>
              <div className="text-[13px] text-gray-400 mt-0.5">Use a strong password you don't use elsewhere</div>
            </div>
          </div>

          {/* Form body */}
          <div className="flex flex-col px-7 py-7 gap-7">

            {/* Success banner */}
            {success && (
              <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-[13px] font-medium">
                <span className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckIcon />
                </span>
                Your password has been changed successfully.
              </div>
            )}

            {/* ── Current Password ──────────────────────────────────────── */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-gray-800">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  className={inputClass(!!errors.current_password)}
                  placeholder="Enter your current password"
                  value={current}
                  autoComplete="current-password"
                  onChange={(e) => { setCurrent(e.target.value); clearError("current_password"); setSuccess(false); }}
                />
                <button type="button" onClick={() => setShowCurrent((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-gray-400 flex items-center p-0 hover:text-[#4d7b65] transition-colors">
                  <EyeIcon open={showCurrent} />
                </button>
              </div>
              {errors.current_password && (
                <span className="text-xs text-red-500">{errors.current_password}</span>
              )}
            </div>

            {/* ── New Password ──────────────────────────────────────────── */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-gray-800">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  className={inputClass(!!errors.new_password)}
                  placeholder="Enter a new password"
                  value={newPass}
                  autoComplete="new-password"
                  onChange={(e) => { setNewPass(e.target.value); clearError("new_password"); setSuccess(false); }}
                />
                <button type="button" onClick={() => setShowNew((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-gray-400 flex items-center p-0 hover:text-[#4d7b65] transition-colors">
                  <EyeIcon open={showNew} />
                </button>
              </div>

              {/* Strength bar */}
              {newPass && (
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                      style={{ background: i <= strengthScore ? strengthMeta.color : "#e5e7eb" }} />
                  ))}
                  <span className="ml-2 text-[11px] font-semibold whitespace-nowrap" style={{ color: strengthMeta.color }}>
                    {strengthMeta.label}
                  </span>
                </div>
              )}

              {errors.new_password && (
                <span className="text-xs text-red-500">{errors.new_password}</span>
              )}

              {/* Requirement checklist */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-1">
                {[
                  { key: "length",  label: "At least 8 characters" },
                  { key: "number",  label: "One number"             },
                  { key: "upper",   label: "One uppercase letter"   },
                  { key: "special", label: "One special character"  },
                ].map(({ key, label }) => (
                  <div key={key} className={ruleClass(checks[key])}>
                    <CheckIcon />{label}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Confirm Password ──────────────────────────────────────── */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-gray-800">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  className={inputClass(!!errors.new_password_confirmation)}
                  placeholder="Re-enter your new password"
                  value={confirm}
                  autoComplete="new-password"
                  onChange={(e) => { setConfirm(e.target.value); clearError("new_password_confirmation"); setSuccess(false); }}
                />
                <button type="button" onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-gray-400 flex items-center p-0 hover:text-[#4d7b65] transition-colors">
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
              {errors.new_password_confirmation && (
                <span className="text-xs text-red-500">{errors.new_password_confirmation}</span>
              )}
            </div>

            {/* ── Actions ───────────────────────────────────────────────── */}
            <div className="flex flex-col-reverse gap-3 pt-2 border-t border-gray-100 md:flex-row md:justify-end">
              <button type="button" onClick={handleReset} disabled={loading}
                className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 text-[13px] font-semibold cursor-pointer hover:bg-gray-50 disabled:opacity-50 transition-colors md:w-auto w-full">
                <RefreshIcon /> Reset
              </button>
              <button type="button" onClick={handleSubmit} disabled={loading}
                className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg border-none bg-[#2e6b45] text-white text-[13px] font-semibold cursor-pointer hover:bg-[#245537] disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm md:w-auto w-full">
                {loading ? <><SpinnerIcon /> Updating...</> : <><CheckIcon /> Update Password</>}
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}