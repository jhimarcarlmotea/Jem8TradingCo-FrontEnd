// ─── ProfilePersonal.jsx (Full Tailwind — no CSS imports) ────────────────────
import { useEffect, useState, useRef } from "react";
import React from "react";
import { useNavigate, useLocation, useBlocker } from "react-router-dom";
import { logout, me, updateProfile } from "../api/auth";
import OrdersOverview from './OrdersOverview';
import PasswordSecurity from './PasswordSecurity';
import Notification from './Notification';
import { toast } from "react-toastify";
import { getUserAddresses, addAddress as apiAddAddress, updateAddress as apiUpdateAddress, deleteAddress as apiDeleteAddress } from "../api/address";
import axios from "axios";


// ─── Axios instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api",
  withCredentials: true,
  headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
});

// ─── Icons ────────────────────────────────────────────────────────────────────
const PersonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const OrderIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1" />
    <line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="13" y2="16" />
  </svg>
);
const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);
const BellIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
  </svg>
);
const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
    <line x1="7" y1="1" x2="7" y2="13" /><line x1="1" y1="7" x2="13" y2="7" />
  </svg>
);
const EditSmallIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const InfoIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const MapPinIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const MapPinSmIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
  </svg>
);
const BuildingIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
  </svg>
);
const PersonIcon2 = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const CameraIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

// ─── Keyframe animations ──────────────────────────────────────────────────────
const KEYFRAMES = `
  @keyframes modalBackdropIn { from{opacity:0} to{opacity:1} }
  @keyframes modalSlideUp {
    from{opacity:0;transform:translateY(24px) scale(0.97)}
    to{opacity:1;transform:translateY(0) scale(1)}
  }
  @keyframes completeModalIn {
    from{opacity:0;transform:translateY(20px) scale(0.96)}
    to{opacity:1;transform:translateY(0) scale(1)}
  }
  @keyframes spin { to{transform:rotate(360deg)} }
  .modal-backdrop-in { animation: modalBackdropIn 0.2s ease; }
  .modal-slide-up    { animation: modalSlideUp 0.26s cubic-bezier(0.34,1.26,0.64,1); }
  .complete-modal-in { animation: completeModalIn 0.3s cubic-bezier(0.34,1.26,0.64,1); }
  .spin-anim         { animation: spin 0.7s linear infinite; }
`;

// ─── Complete Profile Modal ───────────────────────────────────────────────────
function CompleteProfileModal({ form, onChange, onSubmit, completing }) {
  const isValid = form.first_name.trim() && form.last_name.trim() && form.phone_number.trim();

  const fieldCls = (hasError) =>
    `w-full border rounded-[10px] px-3.5 py-[11px] text-sm text-gray-900 bg-gray-50 outline-none box-border
     placeholder:text-gray-300 transition-all duration-150
     focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-black/5
     ${hasError ? "border-red-400" : "border-gray-200"}`;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="complete-modal-in bg-white rounded-[20px] w-full max-w-[440px] overflow-hidden"
        style={{ boxShadow: "0 40px 100px rgba(0,0,0,0.25)" }}
      >
        {/* Header */}
        <div className="pb-5 border-b border-gray-100 px-7 pt-7">
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-[11px] font-bold px-2.5 py-1 rounded-full mb-3 tracking-wide">
            ✦ Edit Profile
          </div>
          <div className="text-xl font-bold text-gray-900 mb-1.5">Complete your profile</div>
          <div className="text-[13px] text-gray-400 leading-relaxed">
            You signed in with Google. Please fill in the missing details to continue using your account.
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4 py-5 px-7">
          {[
            { label: "First Name",   key: "first_name",   placeholder: "Juan" },
            { label: "Last Name",    key: "last_name",     placeholder: "Dela Cruz" },
            { label: "Phone Number", key: "phone_number",  placeholder: "+63 912 345 6789" },
          ].map(({ label, key, placeholder }) => {
            const extraProps = {};
            if (key === "first_name" || key === "last_name") {
              extraProps.maxLength = 50;
              extraProps.onKeyDown = (e) => {
                if (/\d/.test(e.key) && !["Backspace","Delete","Tab","ArrowLeft","ArrowRight"].includes(e.key))
                  e.preventDefault();
              };
              extraProps.onChange = (e) => {
                const val = e.target.value.replace(/\d/g, "");
                onChange({ ...form, [key]: val });
              };
            } else if (key === "phone_number") {
              extraProps.maxLength = 11;
              extraProps.onKeyDown = (e) => {
                if (!/[\d]/.test(e.key) && !["Backspace","Delete","Tab","ArrowLeft","ArrowRight"].includes(e.key))
                  e.preventDefault();
              };
              extraProps.onChange = (e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 11);
                onChange({ ...form, [key]: val });
              };
            } else {
              extraProps.onChange = (e) => onChange({ ...form, [key]: e.target.value });
            }

            return (
              <div key={key} className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.06em]">
                  {label} <span className="text-red-500">*</span>
                </label>
                <input
                  className={fieldCls(!form[key] && completing)}
                  value={form[key]}
                  placeholder={placeholder}
                  {...extraProps}
                />
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-end pb-6 px-7">
          <button
            onClick={onSubmit}
            disabled={completing || !isValid}
            className="bg-gray-900 text-white border-none rounded-[10px] px-7 py-3 text-sm font-bold cursor-pointer flex items-center gap-2 hover:bg-gray-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
          >
            {completing ? (
              <><div className="spin-anim w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" /> Saving...</>
            ) : (
              <><CheckIcon /> Save & Continue</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
    // ─── Block Navigation Modal ───────────────────────────────────────────────────
function BlockNavModal({ onStay }) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="complete-modal-in bg-white rounded-[20px] w-full max-w-[420px] overflow-hidden"
        style={{ boxShadow: "0 40px 100px rgba(0,0,0,0.25)" }}
      >
        <div className="px-7 pt-7 pb-5 border-b border-gray-100">
          <div className="inline-flex items-center gap-1.5 bg-red-50 text-red-500 text-[11px] font-bold px-2.5 py-1 rounded-full mb-3 tracking-wide">
            ⚠ Incomplete Profile
          </div>
          <div className="text-xl font-bold text-gray-900 mb-1.5">
            Please complete your profile first
          </div>
          <div className="text-[13px] text-gray-400 leading-relaxed">
            Please fill in all required fields before proceeding. Your profile is incomplete.
          </div>
        </div>
        <div className="flex justify-end px-7 py-5">
          <button
            onClick={onStay}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-gray-900 text-white border-none rounded-lg text-[13px] font-semibold cursor-pointer hover:bg-gray-700 transition-all duration-150"
          >
            <CheckIcon /> Complete Profile
          </button>
        </div>
      </div>
    </div>
  );
}
// ─── Address Modal ────────────────────────────────────────────────────────────
function AddressModal({ onClose, onSave, editingAddress }) {
  const [form, setForm] = useState(editingAddress || {
    type: "personal", company_name: "", company_role: "", company_number: "", company_email: "",
    street: "", barangay: "", city: "", province: "", postal_code: "", country: "Philippines", status: "active",
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const setType = (type) => setForm({ ...form, type });
  const handleSubmit = () => { if (!form.street || !form.city) return; onSave(form); onClose(); };

  const inp = `border border-gray-200 rounded-[9px] px-3 py-2 text-sm text-gray-900 bg-gray-50 outline-none w-full box-border
    placeholder:text-gray-300 focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-black/5 transition-all duration-150`;

  return (
    <div
      className="modal-backdrop-in fixed inset-0 z-[1000] flex items-center justify-center p-4"
      style={{ background: "rgba(10,10,10,0.55)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="modal-slide-up bg-white rounded-[18px] w-full max-w-[500px] max-h-[90vh] flex flex-col overflow-hidden"
        style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0 px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-100 rounded-[10px] flex items-center justify-center text-gray-800"><MapPinSmIcon /></div>
            <div>
              <div className="text-[15px] font-semibold text-gray-900 leading-tight">{editingAddress ? "Edit Address" : "Add New Address"}</div>
              <div className="text-xs text-gray-400 mt-0.5">{editingAddress ? "Update your saved location" : "Save a delivery location"}</div>
            </div>
          </div>
          <button onClick={onClose} className="flex items-center justify-center w-8 h-8 text-gray-500 transition-colors bg-gray-100 border-none rounded-lg cursor-pointer hover:bg-gray-200 hover:text-gray-900">
            <XIcon />
          </button>
        </div>

        {/* Type toggle */}
        <div className="flex flex-shrink-0 gap-2 px-6 pt-4 pb-1">
          {["personal", "company"].map((t) => (
            <button key={t} onClick={() => setType(t)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-[10px] border text-sm font-medium cursor-pointer transition-all duration-150
                ${form.type === t ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:text-gray-800"}`}>
              {t === "personal" ? <PersonIcon2 /> : <BuildingIcon />}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex flex-col flex-1 gap-3 px-6 py-4 overflow-y-auto">
          {form.type === "company" && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">Company Details</p>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-gray-500">Company Name</label>
                <input className={inp} name="company_name" value={form.company_name} onChange={handleChange} placeholder="ABC Corporation" />
              </div>
              <div className="flex gap-2.5">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-[11px] font-semibold text-gray-500">Role / Position</label>
                  <input className={inp} name="company_role" value={form.company_role} onChange={handleChange} placeholder="Manager" />
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-[11px] font-semibold text-gray-500">Company Phone</label>
                  <input className={inp} name="company_number" value={form.company_number} onChange={handleChange} placeholder="+63 912 345 6789" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-gray-500">Company Email</label>
                <input className={inp} name="company_email" value={form.company_email} onChange={handleChange} placeholder="company@email.com" />
              </div>
              <hr className="my-1 border-gray-100" />
            </>
          )}
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">Location</p>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-gray-500">Street Address <span className="text-red-500">*</span></label>
            <input className={inp} name="street" value={form.street} onChange={handleChange} placeholder="123 Rizal Street" />
          </div>
          <div className="flex gap-2.5">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-[11px] font-semibold text-gray-500">Barangay</label>
              <input className={inp} name="barangay" value={form.barangay} onChange={handleChange} placeholder="Barangay 1" />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-[11px] font-semibold text-gray-500">City <span className="text-red-500">*</span></label>
              <input className={inp} name="city" value={form.city} onChange={handleChange} placeholder="Manila" />
            </div>
          </div>
          <div className="flex gap-2.5">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-[11px] font-semibold text-gray-500">Province</label>
              <input className={inp} name="province" value={form.province} onChange={handleChange} placeholder="Metro Manila" />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-[11px] font-semibold text-gray-500">Postal Code</label>
              <input className={inp} name="postal_code" value={form.postal_code} onChange={handleChange} placeholder="1000" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-gray-500">Country</label>
            <input className={inp} name="country" value={form.country} onChange={handleChange} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <button onClick={onClose} className="bg-transparent border border-gray-200 rounded-[9px] px-[18px] py-2 text-sm font-medium cursor-pointer text-gray-500 hover:border-gray-400 hover:text-gray-800 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={!form.street || !form.city}
            className="bg-gray-900 text-white border-none rounded-[9px] px-5 py-2 text-sm font-semibold cursor-pointer flex items-center gap-1.5 hover:bg-gray-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150">
            <CheckIcon />{editingAddress ? "Save Changes" : "Add Address"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Photo ────────────────────────────────────────────────────────────
function ProfilePhoto({ user, onUploadSuccess }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const initials = [user?.first_name?.[0], user?.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "?";

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2 MB."); return; }
    if (!["image/jpeg","image/png","image/jpg"].includes(file.type)) { toast.error("Only JPG and PNG images are allowed."); return; }
    const formData = new FormData();
    formData.append("profile_image", file);
    setUploading(true);
    try {
      const res = await api.post("/profile/update-image", formData, { headers: { "Content-Type": "multipart/form-data" } });
      const newUrl = res.data?.profile_image_url ?? res.data?.data?.profile_image ?? null;
      toast.success("Profile photo updated!");
      if (onUploadSuccess) onUploadSuccess(newUrl);
      window.dispatchEvent(new CustomEvent("profile-photo-updated", { detail: { url: newUrl } }));
    } catch (err) { console.error(err); toast.error("Failed to upload photo. Please try again."); }
    finally { setUploading(false); e.target.value = ""; }
  };

  return (
    <div className="relative flex-shrink-0 w-20 h-20">
      <input ref={fileInputRef} type="file" accept="image/jpg,image/jpeg,image/png" className="hidden" onChange={handleFileChange} />
      {user?.profile_image ? (
        <img src={user.profile_image} alt="Profile" className="w-20 h-20 rounded-full object-cover border-[2.5px] border-gray-200 block" />
      ) : (
        <div className="w-20 h-20 rounded-full bg-gray-100 border-[2.5px] border-gray-200 flex items-center justify-center text-gray-400 text-2xl font-semibold select-none tracking-tight">{initials}</div>
      )}
      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45">
          <div className="spin-anim w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full" />
        </div>
      )}
      <button onClick={() => !uploading && fileInputRef.current?.click()} disabled={uploading} title="Change profile photo"
        className="absolute bottom-0 right-0 w-[26px] h-[26px] bg-gray-900 border-2 border-white rounded-full flex items-center justify-center cursor-pointer text-white z-10 hover:bg-gray-700 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 transition-all duration-150">
        <CameraIcon />
      </button>
    </div>
  );
}

// ─── Editable Field ───────────────────────────────────────────────────────────
function EditableField({ label, value, name, isEditing, onChange }) {
  const getInputProps = () => {
    if (name === "first_name" || name === "last_name") {
      return {
        maxLength: 50,
        onKeyDown: (e) => {
          if (
            /\d/.test(e.key) &&
            !["Backspace","Delete","Tab","ArrowLeft","ArrowRight"].includes(e.key)
          ) e.preventDefault();
        },
        onChange: (e) => {
          const val = e.target.value.replace(/\d/g, "");
          onChange({ target: { name, value: val } });
        },
      };
    }
    if (name === "phone_number") {
      return {
        maxLength: 11,
        onKeyDown: (e) => {
          if (
            !/[\d]/.test(e.key) &&
            !["Backspace","Delete","Tab","ArrowLeft","ArrowRight"].includes(e.key)
          ) e.preventDefault();
        },
        onChange: (e) => {
          const val = e.target.value.replace(/\D/g, "").slice(0, 11);
          onChange({ target: { name, value: val } });
        },
      };
    }
    if (["company_name", "position", "business_type"].includes(name)) {
      return {
        maxLength: 500,
        onChange,
      };
    }
    if (name === "tin_number") {
      return {
        maxLength: 12,
        onKeyDown: (e) => {
          if (
            !/[\d]/.test(e.key) &&
            !["Backspace","Delete","Tab","ArrowLeft","ArrowRight"].includes(e.key)
          ) e.preventDefault();
        },
        onChange,
      };
    }
    return { onChange };
  };

  const inputProps = getInputProps();

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em]">{label}</span>
      {isEditing ? (
        <input
          name={name}
          value={value || ""}
          placeholder={label}
          {...inputProps}
          className="border border-gray-900 rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none bg-gray-50 w-full box-border"
        />
      ) : (
        <div className="text-sm text-gray-900 py-2.5 border-b border-gray-100 min-h-[36px]">
          {value || <span className="text-gray-300">—</span>}
        </div>
      )}
    </div>
  );
}

// ─── Address Card ─────────────────────────────────────────────────────────────
function AddressCard({ addr, onEdit, onDelete }) {
  const isCompany = addr.type === "company";
  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex flex-col gap-1.5">
      <div className="flex items-center justify-between mb-1">
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${isCompany ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"}`}>
          {isCompany ? <BuildingIcon /> : <PersonIcon2 />}{isCompany ? "Company" : "Personal"}
        </span>
        <div className="flex gap-1.5">
          <button onClick={onEdit} className="w-[26px] h-[26px] bg-gray-100 border-none rounded-md flex items-center justify-center cursor-pointer text-gray-500 hover:bg-gray-200 transition-colors"><EditSmallIcon /></button>
          <button onClick={onDelete} className="w-[26px] h-[26px] bg-gray-100 border-none rounded-md flex items-center justify-center cursor-pointer text-red-400 hover:bg-red-50 transition-colors"><TrashIcon /></button>
        </div>
      </div>
      {isCompany && addr.company_name && <div className="text-[13px] font-semibold text-gray-900">{addr.company_name}</div>}
      <div className="flex flex-col gap-0.5">
        {addr.street && <div className="text-[13px] text-gray-600 leading-relaxed">{addr.street}</div>}
        {(addr.barangay || addr.city) && <div className="text-[13px] text-gray-600 leading-relaxed">{[addr.barangay,addr.city].filter(Boolean).join(", ")}</div>}
        {(addr.province || addr.postal_code) && <div className="text-[13px] text-gray-600 leading-relaxed">{[addr.province,addr.postal_code].filter(Boolean).join(" ")}</div>}
        {addr.country && <div className="text-[13px] text-gray-400 leading-relaxed">{addr.country}</div>}
      </div>
      {isCompany && (addr.company_number || addr.company_email) && (
        <div className="flex flex-col gap-0.5 pt-1.5 border-t border-gray-100 mt-1">
          {addr.company_number && <span className="text-xs text-gray-400">📞 {addr.company_number}</span>}
          {addr.company_email && <span className="text-xs text-gray-400">✉ {addr.company_email}</span>}
        </div>
      )}
    </div>
  );
}

// ─── Card Header ──────────────────────────────────────────────────────────────
function CardHeader({ icon, title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-3 px-7 py-[22px] border-b border-gray-100">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 border bg-emerald-50 border-emerald-100 rounded-xl text-emerald-600">{icon}</div>
        <div>
          <div className="font-bold text-[15px] text-gray-800">{title}</div>
          <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>
        </div>
      </div>
      {action}
    </div>
  );
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
function Breadcrumb({ label }) {
  return (
    <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-full px-[18px] py-[7px] text-[13px] font-medium text-emerald-600 mb-5 self-start">
      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse flex-shrink-0" />{label}
    </div>
  );
}

// ─── Personal Information Tab ─────────────────────────────────────────────────

function PersonalInformation({ user, onUserUpdate, onPhotoUpdate, addresses, setAddresses, autoEdit = false, onFormChange }) {

  const [isEditing, setIsEditing] = useState(autoEdit);
  const [form, setForm] = useState({
    first_name: user?.first_name || "", last_name: user?.last_name || "",
    email: user?.email || "", phone_number: user?.phone_number || "",
    company_name: user?.company_name || "", position: user?.position || "",
    business_type: user?.business_type || "", tin_number: user?.tin_number || "",
  });
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  
  useEffect(() => {
    if (autoEdit) setIsEditing(true);
  }, [autoEdit]);

  const navigate = useNavigate();
  const location = useLocation();

  const isProfileIncomplete = (f) =>
    !f.first_name || !f.last_name || !f.phone_number ||
    !f.company_name || !f.position || !f.business_type || !f.tin_number;

  const handleChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    setForm(updated);
    if (onFormChange) onFormChange(updated);
  };

  useEffect(() => {
    if (onFormChange) onFormChange(form);
  }, []);

  // Block browser back/forward/close when autoEdit and profile incomplete
  useEffect(() => {
    if (!autoEdit) return;

    const handleBeforeUnload = (e) => {
      if (isProfileIncomplete(form)) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [form, autoEdit]);

  

  const handleSave = () => { if (onUserUpdate) onUserUpdate(form); setIsEditing(false); };

  const handleCancel = () => {
    setForm({
      first_name: user?.first_name || "", last_name: user?.last_name || "",
      email: user?.email || "", phone_number: user?.phone_number || "",
      company_name: user?.company_name || "", position: user?.position || "",
      business_type: user?.business_type || "", tin_number: user?.tin_number || "",
    });
    setIsEditing(false);
  };

  const handleSaveAddress = async (addr) => {
    try {
      if (editingIndex !== null) {
        const res = await apiUpdateAddress(addresses[editingIndex].id, addr);
        const updated = [...addresses]; updated[editingIndex] = res.data; setAddresses(updated);
        toast.success("Address updated successfully");
      } else {
        const res = await apiAddAddress(addr);
        setAddresses([...addresses, res.data]);
        toast.success("Address added successfully");
      }
    } catch { toast.error("Failed to save address"); }
    finally { setEditingAddress(null); setEditingIndex(null); setShowModal(false); }
  };

  const handleEditAddress = (idx) => { setEditingAddress(addresses[idx]); setEditingIndex(idx); setShowModal(true); };
  const handleDeleteAddress = async (idx) => {
    try { await apiDeleteAddress(addresses[idx].id); setAddresses(addresses.filter((_,i)=>i!==idx)); toast.success("Address removed"); }
    catch { toast.error("Failed to delete address"); }
  };
  const openAddModal = () => { setEditingAddress(null); setEditingIndex(null); setShowModal(true); };

  const btnOutline = "inline-flex items-center gap-1.5 px-5 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg text-[13px] font-semibold cursor-pointer hover:border-emerald-200 hover:text-emerald-600 transition-all duration-150";
  const btnDark    = "inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white border-none rounded-lg text-[13px] font-semibold cursor-pointer hover:bg-gray-700 transition-colors duration-150";
  const btnPrimary = "inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-lg text-[13px] font-semibold cursor-pointer transition-colors duration-150 shadow-[0_4px_20px_rgba(16,185,129,0.25)]";
  const btnGhost   = "inline-flex items-center gap-1.5 px-4 py-1.5 bg-transparent text-emerald-600 border border-emerald-200 rounded-lg text-xs font-semibold cursor-pointer hover:bg-emerald-50 transition-colors duration-150";

  const EmptySlot = ({ label }) => (
    <div className="border-2 border-dashed border-emerald-100 rounded-xl min-h-[150px] flex flex-col items-center justify-center gap-2.5 text-gray-400 cursor-pointer px-6 py-6 text-center text-[13px] hover:border-emerald-400 hover:bg-emerald-50 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
      <div className="w-[42px] h-[42px] rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500"><PlusIcon /></div>
      <span>{label}</span>
      <button className={btnGhost} onClick={openAddModal}><PlusIcon /> Add Address</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {showModal && (
        <AddressModal
          onClose={() => { setShowModal(false); setEditingAddress(null); setEditingIndex(null); }}
          onSave={handleSaveAddress} editingAddress={editingAddress}
        />
      )}

      

      <Breadcrumb label="Personal Information · Manage your profile and contact details" />

      {/* Profile Details Card */}
      <div className="overflow-hidden transition-all duration-200 bg-white border border-gray-100 shadow-sm rounded-2xl hover:shadow-md hover:border-emerald-100">
        <CardHeader icon={<InfoIcon />} title="Profile Details" subtitle="Your personal and business information"
          action={
            <div className="flex gap-2">
              {isEditing ? (
                <><button className={btnOutline} onClick={handleCancel}><XIcon /> Cancel</button>
                  <button className={btnDark} onClick={handleSave}><CheckIcon /> Save</button></>
              ) : (
                <button className={btnOutline} onClick={() => setIsEditing(true)}><EditSmallIcon /> Edit</button>
              )}
            </div>
          }
        />
        <div className="flex items-center gap-4 py-5 border-b border-gray-100 px-7">
          <ProfilePhoto user={user} onUploadSuccess={onPhotoUpdate} />
          <div className="ml-3.5">
            <div className="text-sm font-bold text-gray-800">{user?.first_name} {user?.last_name}</div>
            <div className="text-xs text-gray-400 mt-0.5">{user?.email}</div>
            <div className="text-xs text-gray-400 mt-0.5">{user?.phone_number || "No phone number"}</div>
            <div className="text-[11px] text-gray-300 mt-1">Click the camera icon to change your photo</div>
          </div>
        </div>
        <div className="px-7 py-7 grid grid-cols-2 gap-x-7 gap-y-[22px] max-sm:grid-cols-1">
          <EditableField label="First Name"                  name="first_name"    value={form.first_name}    isEditing={isEditing} onChange={handleChange} />
          <EditableField label="Last Name"                   name="last_name"     value={form.last_name}     isEditing={isEditing} onChange={handleChange} />
          <EditableField label="Email Address"               name="email"         value={form.email}         isEditing={isEditing} onChange={handleChange} />
          <EditableField label="Phone / Mobile Number"       name="phone_number"  value={form.phone_number}  isEditing={isEditing} onChange={handleChange} />
          <EditableField label="Company Name"     name="company_name"  value={form.company_name}  isEditing={isEditing} onChange={handleChange} />
          <EditableField label="Position / Title" name="position"      value={form.position}      isEditing={isEditing} onChange={handleChange} />
          <div className="col-span-1">
            <EditableField label="Business Type"  name="business_type" value={form.business_type} isEditing={isEditing} onChange={handleChange} />
          </div>
          <div className="col-span-1">
            <EditableField label="Company TIN Number" name="tin_number" value={form.tin_number} isEditing={isEditing} onChange={handleChange} />
          </div>
        </div>
      </div>

      {/* Addresses Card */}
      <div className="overflow-hidden transition-all duration-200 bg-white border border-gray-100 shadow-sm rounded-2xl hover:shadow-md hover:border-emerald-100">
        <CardHeader icon={<MapPinIcon />} title="Addresses" subtitle="Manage your saved delivery addresses"
          action={<button className={btnPrimary} onClick={openAddModal}><PlusIcon /> Add New</button>}
        />
        <div className="grid grid-cols-2 gap-5 py-6 px-7 max-sm:grid-cols-1">
          {addresses.length === 0 ? (
            <><EmptySlot label="No address saved yet" /><EmptySlot label="No address saved yet" /></>
          ) : (
            <>
              {addresses.map((addr, idx) => (
                <AddressCard key={addr.id ?? idx} addr={addr} onEdit={() => handleEditAddress(idx)} onDelete={() => handleDeleteAddress(idx)} />
              ))}
              <EmptySlot label="Add another address" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Menu Items ───────────────────────────────────────────────────────────────
const MENU_ITEMS = [
  { key: "personal", label: "Personal Information", Icon: PersonIcon },
  { key: "orders",   label: "My Orders",            Icon: OrderIcon },
  { key: "password", label: "Password & Security",  Icon: LockIcon },
  { key: "notif",    label: "Notification",         Icon: BellIcon },
];

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function ProfilePersonal() {
  const [activeMenu, setActiveMenu]                   = useState("personal");
  const [user, setUser]                               = useState(null);
  const [loading, setLoading]                         = useState(true);
  const [addresses, setAddresses]                     = useState([]);
  const [ordersCount, setOrdersCount]                 = useState(0);
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [completeForm, setCompleteForm]               = useState({ first_name: "", last_name: "", phone_number: "" });
  const [completing, setCompleting]                   = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [autoEdit, setAutoEdit] = useState(location.state?.autoEdit ?? false);
  const isLoggingOut = useRef(false);

  // ─── Nav Guard State ───────────────────────────────────────────────────────
  const [pendingNav, setPendingNav]         = useState(null);
  const [showNavBlock, setShowNavBlock]     = useState(false);
  const [profileForm, setProfileForm]       = useState(null);
  const [profileComplete, setProfileComplete] = useState(false);

  const isIncomplete = (f) =>
    f && (!f.first_name || !f.last_name || !f.phone_number ||
    !f.company_name || !f.position || !f.business_type || !f.tin_number);

  const isIncompleteWithAddress = (f, addrs) =>
    isIncomplete(f) || !addrs || addrs.length === 0;

  const onFormChange = (f) => {
    setProfileForm(f);
    setProfileComplete(!isIncompleteWithAddress(f, addresses));
  };

  const guardedNavigate = (destination) => {
  // If destination is a function (tab switch within page), always allow it
  if (typeof destination === "function") {
    destination();
    return;
  }
  // Only block actual page navigation away
  if (autoEdit && isIncompleteWithAddress(profileForm, addresses)) {
    setPendingNav(destination);
    setShowNavBlock(true);
  } else {
    navigate(destination);
  }
};
  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await me();
        if (response.status === 200 && response.data.status === "success") {
          const userData = response.data.data;
          setUser(userData);

          const isGoogleUser = !!userData.google_id;
          const hasIncompleteProfile =
            !userData.first_name ||
            !userData.last_name ||
            !userData.phone_number ||
            !userData.company_name ||
            !userData.position ||
            !userData.business_type ||
            !userData.tin_number;

          // fetch addresses first so we can check completeness
          let fetchedAddresses = [];
          try {
            const addrRes = await getUserAddresses();
            if (addrRes.status === 200) {
              const addrData = addrRes.data?.data ?? addrRes.data ?? [];
              fetchedAddresses = Array.isArray(addrData) ? addrData : [];
              setAddresses(fetchedAddresses);
            }
          } catch (addrErr) { console.error("Failed to fetch addresses:", addrErr); }

          const hasNoAddress = fetchedAddresses.length === 0;

          if (isGoogleUser && (hasIncompleteProfile || hasNoAddress)) {
            setAutoEdit(true);
          } else if (!isGoogleUser && (hasIncompleteProfile || hasNoAddress)) {
            setAutoEdit(true);
          }
        }
      } catch (error) { console.error(error); }
      finally { setLoading(false); }
    };
    loadUser();
  }, []);

  useEffect(() => {
    const fetchOrdersCount = async () => {
      try {
        const res = await api.get("/checkout");
        if (res.status === 200) {
          let data = res.data;
          if (!Array.isArray(data)) data = [data];
          setOrdersCount(Array.isArray(data) ? data.length : 0);
        }
      } catch { setOrdersCount(0); }
    };
    if (user) fetchOrdersCount();
  }, [user]);

   // Listen for logout from the header navigation
useEffect(() => {
  const handleExternalLogout = () => {
    isLoggingOut.current = true;
  };
  window.addEventListener("auth-logout", handleExternalLogout);
  return () => window.removeEventListener("auth-logout", handleExternalLogout);
}, []);

const blocker = useBlocker(
  ({ currentLocation, nextLocation }) =>
    !isLoggingOut.current &&
    autoEdit &&
    isIncompleteWithAddress(profileForm, addresses) &&
    currentLocation.pathname !== nextLocation.pathname
);

useEffect(() => {
  if (blocker.state === "blocked") {
    setShowNavBlock(true);
    setPendingNav(() => () => blocker.proceed());
  }
}, [blocker.state]);
  const handleCompleteProfile = async () => {
    if (!completeForm.first_name.trim() || !completeForm.last_name.trim() || !completeForm.phone_number.trim()) {
      toast.error("Please fill in all required fields."); return;
    }
    setCompleting(true);
    try {
      await updateProfile(completeForm);
      setUser((prev) => ({ ...prev, ...completeForm }));
      setShowCompleteProfile(false);
      toast.success("Profile completed! Welcome to JEM 8 Circle 🎉");
    } catch (err) { console.error(err); toast.error("Failed to save profile. Please try again."); }
    finally { setCompleting(false); }
  };

  const handleUserUpdate = async (updatedFields) => {
    setUser((prev) => ({ ...prev, ...updatedFields }));
    try { const res = await updateProfile(updatedFields); if (res.user) setUser(res.user); }
    catch (error) { console.error("Update failed:", error); }
  };

  const handlePhotoUpdate = (newUrl) => {
    setUser((prev) => ({ ...prev, profile_image: newUrl }));
    window.dispatchEvent(new CustomEvent("profile-photo-updated", { detail: { url: newUrl } }));
  };

  const Logout = async () => {
    isLoggingOut.current = true; 
    const data = await logout();
    if (data) {
      setAutoEdit(false);
      sessionStorage.removeItem("profileModalDismissed");
      window.dispatchEvent(new CustomEvent("auth-logout"));
      navigate("/login", { replace: true });
    } else {
      isLoggingOut.current = false;
    }
  };

  if (loading) return <p className="p-8 text-gray-400">Loading...</p>;
  if (!user)   return <p className="p-8 text-gray-400">User not found or unauthenticated.</p>;

  const initials = [user?.first_name?.[0], user?.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "?";

  const renderContent = () => {
    switch (activeMenu) {
      case "orders":   return <OrdersOverview userId={user?.id} />;
      case "password": return <PasswordSecurity />;
      case "notif":    return <Notification />;
     default: return (
        <PersonalInformation
          user={user}
          onUserUpdate={handleUserUpdate}
          onPhotoUpdate={handlePhotoUpdate}
          addresses={addresses}
          setAddresses={setAddresses}
          autoEdit={autoEdit}
          onFormChange={onFormChange}   
        />
      );
    }
  };

  return (
    <>
      <style>{KEYFRAMES}</style>

      
    {showCompleteProfile && (
    <CompleteProfileModal form={completeForm} onChange={setCompleteForm}
      onSubmit={handleCompleteProfile} completing={completing} />
  )}

  {showNavBlock && (
    <BlockNavModal
      onStay={() => {
        setShowNavBlock(false);
        setPendingNav(null);
        if (blocker.state === "blocked") blocker.reset();
      }}
      onLeave={() => {
        setShowNavBlock(false);
        if (pendingNav) pendingNav();
        setPendingNav(null);
        if (blocker.state === "blocked") blocker.proceed();
      }}
    />
  )}

    

      {/* Page — pt-[108px] = 68px header + 40px breathing room */}
      <div className="relative min-h-screen pt-[108px] pb-20 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #f9fdf9 0%, #fff 50%, #f0faf4 100%)" }}>

        <div className="fixed top-[-160px] right-[-160px] w-[560px] h-[560px] pointer-events-none z-0"
          style={{ background: "radial-gradient(circle, rgba(77,123,101,0.09) 0%, transparent 70%)" }} />

        <div className="max-w-[1300px] mx-auto px-10 grid grid-cols-[280px_1fr] gap-7 items-start relative z-10
          max-[1024px]:grid-cols-[240px_1fr] max-[1024px]:gap-5 max-[1024px]:px-6
          max-[768px]:grid-cols-1 max-[768px]:px-4">

          {/* Sidebar */}
          <aside className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-[88px] hover:shadow-lg transition-shadow duration-200 max-[768px]:static">

            <div className="px-5 pt-8 pb-6 flex flex-col items-center gap-1.5 border-b border-gray-100"
              style={{ background: "linear-gradient(180deg, #f0faf4 0%, #fff 100%)" }}>
              {user.profile_image ? (
                <img src={user.profile_image} alt="Profile" className="w-[52px] h-[52px] rounded-full object-cover border-2 border-gray-200" />
              ) : (
                <div className="w-[52px] h-[52px] rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-lg font-semibold">{initials}</div>
              )}
              <span className="font-bold text-[15px] text-gray-800 mt-2">{user.first_name} {user.last_name}</span>
              <span className="text-xs text-gray-400">{user.email}</span>
              <span className="text-xs text-gray-400">{user.phone_number || "—"}</span>
            </div>

<nav className="px-3 pt-4 pb-2">
  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.08em] px-2 pb-2.5">Overview</span>
  {MENU_ITEMS.filter(({ key }) => !(key === "password" && user?.google_id)).map(({ key, label, Icon }) => {
    const badgeValue = key === "orders" ? ordersCount : 0;
    const isActive = activeMenu === key;
    return (
      <button key={key}
  onClick={() => guardedNavigate(() => setActiveMenu(key))}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-l-[3px] cursor-pointer text-[13px] text-left transition-all duration-150
          ${isActive
            ? "bg-emerald-50 border-l-emerald-500 text-emerald-700 font-semibold [&_svg]:stroke-emerald-500"
            : "bg-transparent border-l-transparent text-gray-500 font-normal hover:bg-gray-50 hover:text-gray-800 hover:translate-x-0.5"
          }`}>
        <Icon />{label}
        {badgeValue > 0 && <span className="ml-auto bg-gray-900 text-white rounded-full text-[10px] font-bold px-2 py-px">{badgeValue}</span>}
      </button>
    );
  })}
</nav>
            <hr className="mx-5 my-2 border-gray-100" />

            <div className="px-3 pb-4">
              <button onClick={() => Logout()}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-l-[3px] border-l-transparent cursor-pointer text-[13px] text-left text-red-500 font-normal hover:bg-red-50 hover:translate-x-0.5 transition-all duration-150 [&_svg]:stroke-red-500">
            <LogoutIcon /> Logout
          </button>
            </div>
          </aside>

          {/* Tab Content */}
          {renderContent()}
        </div>
      </div>
    </>
  );
}