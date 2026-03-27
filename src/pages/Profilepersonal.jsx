import { useEffect, useState, useRef } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { logout, me, updateProfile } from "../api/auth";
import '../style/Profilepersonal.css';
import "../style/OrdersOverview.css";
import '../style/PasswordSecurity.css';
import '../style/Notification.css';
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
const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const PersonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const OrderIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1" />
    <line x1="9" y1="12" x2="15" y2="12" />
    <line x1="9" y1="16" x2="13" y2="16" />
  </svg>
);
const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);
const BellIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 01-3.46 0" />
  </svg>
);
const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
    <line x1="7" y1="1" x2="7" y2="13" />
    <line x1="1" y1="7" x2="13" y2="7" />
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
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const MapPinIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const MapPinSmIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);
const BuildingIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M9 21V9" />
  </svg>
);
const PersonIcon2 = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
// ── Camera icon for photo upload ───────────────────────────────────────────────
const CameraIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

// ─── Modal Styles ─────────────────────────────────────────────────────────────
const MODAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');

  @keyframes modalBackdropIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes modalSlideUp {
    from { opacity: 0; transform: translateY(24px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .addr-modal-overlay {
    position: fixed; inset: 0;
    background: rgba(10,10,10,0.55);
    backdrop-filter: blur(6px);
    z-index: 1000;
    display: flex; align-items: center; justify-content: center;
    animation: modalBackdropIn 0.2s ease;
    font-family: 'DM Sans', sans-serif;
    padding: 16px;
  }
  .addr-modal-box {
    background: #fff;
    border-radius: 18px;
    width: 100%; max-width: 500px;
    box-shadow: 0 32px 80px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06);
    overflow: hidden;
    animation: modalSlideUp 0.26s cubic-bezier(0.34,1.26,0.64,1);
    max-height: 90vh;
    display: flex; flex-direction: column;
  }
  .addr-modal-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 24px 16px;
    border-bottom: 1px solid #f0f0f0;
    flex-shrink: 0;
  }
  .addr-modal-icon-wrap {
    width: 36px; height: 36px; background: #f4f4f4;
    border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #1a1a1a;
  }
  .addr-modal-title { font-size: 15px; font-weight: 600; color: #111; line-height: 1.2; }
  .addr-modal-subtitle { font-size: 12px; color: #999; margin-top: 1px; }
  .addr-modal-close {
    width: 32px; height: 32px; background: #f5f5f5; border: none; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #666; transition: background 0.15s, color 0.15s;
  }
  .addr-modal-close:hover { background: #efefef; color: #111; }
  .addr-type-toggle { display: flex; gap: 8px; padding: 16px 24px 4px; flex-shrink: 0; }
  .addr-type-btn {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
    padding: 9px 14px; border-radius: 10px; border: 1.5px solid #e8e8e8;
    background: #fafafa; font-size: 13px; font-weight: 500; color: #666;
    cursor: pointer; transition: all 0.15s ease; font-family: 'DM Sans', sans-serif;
  }
  .addr-type-btn:hover { border-color: #ccc; color: #333; }
  .addr-type-btn.active { border-color: #1a1a1a; background: #1a1a1a; color: #fff; }
  .addr-modal-body {
    padding: 16px 24px; display: flex; flex-direction: column; gap: 12px;
    overflow-y: auto; flex: 1;
  }
  .addr-section-label {
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.08em; color: #aaa; margin-top: 4px; margin-bottom: -4px;
  }
  .addr-field-row { display: flex; gap: 10px; }
  .addr-field { display: flex; flex-direction: column; gap: 5px; flex: 1; }
  .addr-label { font-size: 11px; font-weight: 600; color: #555; letter-spacing: 0.04em; }
  .addr-input {
    border: 1.5px solid #e8e8e8; border-radius: 9px; padding: 9px 12px;
    font-size: 14px; color: #111; background: #fafafa; outline: none;
    width: 100%; box-sizing: border-box; font-family: 'DM Sans', sans-serif;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .addr-input:focus { border-color: #1a1a1a; background: #fff; box-shadow: 0 0 0 3px rgba(0,0,0,0.06); }
  .addr-input::placeholder { color: #bbb; }
  .addr-divider { height: 1px; background: #f0f0f0; margin: 4px 0; }
  .addr-modal-footer {
    display: flex; align-items: center; justify-content: flex-end; gap: 8px;
    padding: 14px 24px; border-top: 1px solid #f0f0f0; background: #fafafa; flex-shrink: 0;
  }
  .addr-btn-ghost {
    background: none; border: 1.5px solid #e0e0e0; border-radius: 9px;
    padding: 8px 18px; font-size: 13px; font-weight: 500; cursor: pointer; color: #666;
    font-family: 'DM Sans', sans-serif; transition: border-color 0.15s, color 0.15s;
  }
  .addr-btn-ghost:hover { border-color: #bbb; color: #333; }
  .addr-btn-primary {
    background: #1a1a1a; color: #fff; border: none; border-radius: 9px;
    padding: 9px 20px; font-size: 13px; font-weight: 600; cursor: pointer;
    display: flex; align-items: center; gap: 7px; font-family: 'DM Sans', sans-serif;
    transition: background 0.15s, transform 0.1s;
  }
  .addr-btn-primary:hover { background: #333; }
  .addr-btn-primary:active { transform: scale(0.98); }
  .addr-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

  /* ── Profile photo styles ── */
  .profile-photo-wrap {
    position: relative;
    width: 80px; height: 80px;
    flex-shrink: 0;
  }
  .profile-photo-img {
    width: 80px; height: 80px;
    border-radius: 50%;
    object-fit: cover;
    border: 2.5px solid #e8e8e8;
    display: block;
  }
  .profile-photo-placeholder {
    width: 80px; height: 80px;
    border-radius: 50%;
    background: #f0f0f0;
    border: 2.5px solid #e8e8e8;
    display: flex; align-items: center; justify-content: center;
    color: #aaa;
    font-size: 28px;
    font-weight: 600;
    letter-spacing: -1px;
    user-select: none;
  }
  .profile-photo-btn {
    position: absolute;
    bottom: 0; right: 0;
    width: 26px; height: 26px;
    background: #1a1a1a;
    border: 2px solid #fff;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    color: #fff;
    transition: background 0.15s, transform 0.15s;
    z-index: 2;
  }
  .profile-photo-btn:hover { background: #333; transform: scale(1.08); }
  .profile-photo-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .profile-photo-uploading {
    position: absolute; inset: 0;
    border-radius: 50%;
    background: rgba(0,0,0,0.45);
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-size: 11px; font-weight: 600;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .profile-photo-spinner {
    width: 18px; height: 18px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  /* sidebar avatar upgrade */
  .profile-sidebar__avatar-img {
    width: 52px; height: 52px;
    border-radius: 50%; object-fit: cover;
    border: 2px solid #e8e8e8;
  }
  .profile-sidebar__avatar-placeholder {
    width: 52px; height: 52px;
    border-radius: 50%;
    background: #f0f0f0;
    display: flex; align-items: center; justify-content: center;
    color: #888; font-size: 20px; font-weight: 600;
  }
`;

// ─── Address Modal ────────────────────────────────────────────────────────────
function AddressModal({ onClose, onSave, editingAddress }) {
  const [form, setForm] = useState(
    editingAddress || {
      type: "personal",
      company_name: "", company_role: "", company_number: "", company_email: "",
      street: "", barangay: "", city: "", province: "", postal_code: "",
      country: "Philippines", status: "active",
    }
  );

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const setType = (type) => setForm({ ...form, type });

  const handleSubmit = () => {
    if (!form.street || !form.city) return;
    onSave(form);
    onClose();
  };

  return (
    <>
      <style>{MODAL_STYLES}</style>
      <div className="addr-modal-overlay" onClick={onClose}>
        <div className="addr-modal-box" onClick={(e) => e.stopPropagation()}>
          <div className="addr-modal-header">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="addr-modal-icon-wrap"><MapPinSmIcon /></div>
              <div>
                <div className="addr-modal-title">{editingAddress ? "Edit Address" : "Add New Address"}</div>
                <div className="addr-modal-subtitle">{editingAddress ? "Update your saved location" : "Save a delivery location"}</div>
              </div>
            </div>
            <button className="addr-modal-close" onClick={onClose}><XIcon /></button>
          </div>
          <div className="addr-type-toggle">
            <button className={`addr-type-btn${form.type === "personal" ? " active" : ""}`} onClick={() => setType("personal")}>
              <PersonIcon2 /> Personal
            </button>
            <button className={`addr-type-btn${form.type === "company" ? " active" : ""}`} onClick={() => setType("company")}>
              <BuildingIcon /> Company
            </button>
          </div>
          <div className="addr-modal-body">
            {form.type === "company" && (
              <>
                <div className="addr-section-label">Company Details</div>
                <div className="addr-field">
                  <label className="addr-label">Company Name</label>
                  <input className="addr-input" name="company_name" value={form.company_name} onChange={handleChange} placeholder="ABC Corporation" />
                </div>
                <div className="addr-field-row">
                  <div className="addr-field">
                    <label className="addr-label">Role / Position</label>
                    <input className="addr-input" name="company_role" value={form.company_role} onChange={handleChange} placeholder="Manager" />
                  </div>
                  <div className="addr-field">
                    <label className="addr-label">Company Phone</label>
                    <input className="addr-input" name="company_number" value={form.company_number} onChange={handleChange} placeholder="+63 912 345 6789" />
                  </div>
                </div>
                <div className="addr-field">
                  <label className="addr-label">Company Email</label>
                  <input className="addr-input" name="company_email" value={form.company_email} onChange={handleChange} placeholder="company@email.com" />
                </div>
                <div className="addr-divider" />
              </>
            )}
            <div className="addr-section-label">Location</div>
            <div className="addr-field">
              <label className="addr-label">Street Address <span style={{ color: "#e05" }}>*</span></label>
              <input className="addr-input" name="street" value={form.street} onChange={handleChange} placeholder="123 Rizal Street" />
            </div>
            <div className="addr-field-row">
              <div className="addr-field">
                <label className="addr-label">Barangay</label>
                <input className="addr-input" name="barangay" value={form.barangay} onChange={handleChange} placeholder="Barangay 1" />
              </div>
              <div className="addr-field">
                <label className="addr-label">City <span style={{ color: "#e05" }}>*</span></label>
                <input className="addr-input" name="city" value={form.city} onChange={handleChange} placeholder="Manila" />
              </div>
            </div>
            <div className="addr-field-row">
              <div className="addr-field">
                <label className="addr-label">Province</label>
                <input className="addr-input" name="province" value={form.province} onChange={handleChange} placeholder="Metro Manila" />
              </div>
              <div className="addr-field">
                <label className="addr-label">Postal Code</label>
                <input className="addr-input" name="postal_code" value={form.postal_code} onChange={handleChange} placeholder="1000" />
              </div>
            </div>
            <div className="addr-field">
              <label className="addr-label">Country</label>
              <input className="addr-input" name="country" value={form.country} onChange={handleChange} />
            </div>
          </div>
          <div className="addr-modal-footer">
            <button className="addr-btn-ghost" onClick={onClose}>Cancel</button>
            <button className="addr-btn-primary" onClick={handleSubmit} disabled={!form.street || !form.city}>
              <CheckIcon />
              {editingAddress ? "Save Changes" : "Add Address"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Profile Photo Component ──────────────────────────────────────────────────
function ProfilePhoto({ user, onUploadSuccess }) {
  const fileInputRef  = useRef(null);
  const [uploading, setUploading] = useState(false);

  // Build initials fallback
  const initials = [user?.first_name?.[0], user?.last_name?.[0]]
    .filter(Boolean).join("").toUpperCase() || "?";

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    

    if (!file) return;

    // Client-side guard: max 2 MB, jpg/png only
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2 MB.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      toast.error("Only JPG and PNG images are allowed.");
      return;
    }

    const formData = new FormData();
    formData.append("profile_image", file);

    setUploading(true);
    try {
      const res = await api.post("/profile/update-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const newUrl = res.data?.profile_image_url ?? res.data?.data?.profile_image ?? null;
      toast.success("Profile photo updated!");
      if (onUploadSuccess) onUploadSuccess(newUrl);
      window.dispatchEvent(new CustomEvent("profile-photo-updated", { detail: { url: newUrl } }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload photo. Please try again.");
    } finally {
      setUploading(false);
      // Reset so same file can be re-selected
      e.target.value = "";
    }
  };

  return (
    <div className="profile-photo-wrap">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpg,image/jpeg,image/png"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* Avatar */}
      {user?.profile_image ? (
        <img
          src={user.profile_image}
          alt="Profile"
          className="profile-photo-img"
        />
      ) : (
        <div className="profile-photo-placeholder">{initials}</div>
      )}

      {/* Upload overlay while uploading */}
      {uploading && (
        <div className="profile-photo-uploading">
          <div className="profile-photo-spinner" />
        </div>
      )}

      {/* Camera button */}
      <button
        className="profile-photo-btn"
        onClick={() => !uploading && fileInputRef.current?.click()}
        disabled={uploading}
        title="Change profile photo"
      >
        <CameraIcon />
      </button>
    </div>
  );
}

// ─── Editable Field ───────────────────────────────────────────────────────────
function EditableField({ label, value, name, isEditing, onChange }) {
  return (
    <div className="profile-field">
      <span className="profile-field__label">{label}</span>
      {isEditing ? (
        <input style={editableStyles.input} name={name} value={value || ""} onChange={onChange} placeholder={label} />
      ) : (
        <div className="profile-field__input" style={editableStyles.display}>
          {value || <span style={{ color: "#bbb" }}>—</span>}
        </div>
      )}
    </div>
  );
}

// ─── Address Card ─────────────────────────────────────────────────────────────
function AddressCard({ addr, onEdit, onDelete }) {
  const isCompany = addr.type === "company";
  return (
    <div style={addressStyles.card}>
      <div style={addressStyles.cardHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            ...addressStyles.typeBadge,
            background: isCompany ? "#f0f4ff" : "#f0faf4",
            color: isCompany ? "#3b5bdb" : "#2f9e44",
          }}>
            {isCompany ? <BuildingIcon /> : <PersonIcon2 />}
            {isCompany ? "Company" : "Personal"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={addressStyles.actionBtn} onClick={onEdit} title="Edit"><EditSmallIcon /></button>
          <button style={{ ...addressStyles.actionBtn, color: "#e57373" }} onClick={onDelete} title="Delete"><TrashIcon /></button>
        </div>
      </div>
      {isCompany && addr.company_name && <div style={addressStyles.companyName}>{addr.company_name}</div>}
      <div style={addressStyles.addressBlock}>
        {addr.street && <div style={addressStyles.line}>{addr.street}</div>}
        {(addr.barangay || addr.city) && <div style={addressStyles.line}>{[addr.barangay, addr.city].filter(Boolean).join(", ")}</div>}
        {(addr.province || addr.postal_code) && <div style={addressStyles.line}>{[addr.province, addr.postal_code].filter(Boolean).join(" ")}</div>}
        {addr.country && <div style={{ ...addressStyles.line, color: "#999" }}>{addr.country}</div>}
      </div>
      {isCompany && (addr.company_number || addr.company_email) && (
        <div style={addressStyles.contactBlock}>
          {addr.company_number && <span style={addressStyles.contact}>📞 {addr.company_number}</span>}
          {addr.company_email && <span style={addressStyles.contact}>✉ {addr.company_email}</span>}
        </div>
      )}
    </div>
  );
}

// ─── Personal Information Tab ─────────────────────────────────────────────────
function PersonalInformation({ user, onUserUpdate, onPhotoUpdate, addresses, setAddresses }) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    first_name:    user?.first_name    || "",
    last_name:     user?.last_name     || "",
    email:         user?.email         || "",
    phone_number:  user?.phone_number  || "",
    company_name:  user?.company_name  || "",
    position:      user?.position      || "",
    business_type: user?.business_type || "",
  });

  const [showModal, setShowModal]           = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [editingIndex, setEditingIndex]     = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = () => {
    if (onUserUpdate) onUserUpdate(form);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setForm({
      first_name:    user?.first_name    || "",
      last_name:     user?.last_name     || "",
      email:         user?.email         || "",
      phone_number:  user?.phone_number  || "",
      company_name:  user?.company_name  || "",
      position:      user?.position      || "",
      business_type: user?.business_type || "",
    });
    setIsEditing(false);
  };

  const handleSaveAddress = async (addr) => {
    try {
      if (editingIndex !== null) {
        const addrId = addresses[editingIndex].id;
        const res = await apiUpdateAddress(addrId, addr);
        const updated = [...addresses];
        updated[editingIndex] = res.data;
        setAddresses(updated);
        toast.success("Address updated successfully");
      } else {
        const res = await apiAddAddress(addr);
        setAddresses([...addresses, res.data]);
        toast.success("Address added successfully");
      }
    } catch (error) {
      console.error("Address save failed:", error);
      toast.error("Failed to save address");
    } finally {
      setEditingAddress(null);
      setEditingIndex(null);
      setShowModal(false);
    }
  };

  const handleEditAddress   = (idx) => { setEditingAddress(addresses[idx]); setEditingIndex(idx); setShowModal(true); };
  const handleDeleteAddress = async (idx) => {
    try {
      await apiDeleteAddress(addresses[idx].id);
      setAddresses(addresses.filter((_, i) => i !== idx));
      toast.success("Address removed");
    } catch {
      toast.error("Failed to delete address");
    }
  };
  const openAddModal = () => { setEditingAddress(null); setEditingIndex(null); setShowModal(true); };

  return (
    <div className="profile-main">
      <style>{MODAL_STYLES}</style>

      {showModal && (
        <AddressModal
          onClose={() => { setShowModal(false); setEditingAddress(null); setEditingIndex(null); }}
          onSave={handleSaveAddress}
          editingAddress={editingAddress}
        />
      )}

      <div className="profile-breadcrumb">
        <span className="profile-breadcrumb__dot" />
        Personal Information &nbsp;·&nbsp; Manage your profile and contact details
      </div>

      {/* Profile Details Card */}
      <div className="profile-card">
        <div className="profile-card__header">
          <div className="profile-card__header-left">
            <div className="profile-card__icon-box"><InfoIcon /></div>
            <div>
              <div className="profile-card__title">Profile Details</div>
              <div className="profile-card__subtitle">Your personal and business information</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {isEditing ? (
              <>
                <button className="btn-profile-outline" onClick={handleCancel} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <XIcon /> Cancel
                </button>
                <button onClick={handleSave} style={{ display: "flex", alignItems: "center", gap: 5, background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  <CheckIcon /> Save
                </button>
              </>
            ) : (
              <button className="btn-profile-outline" onClick={() => setIsEditing(true)}>
                <EditSmallIcon /> Edit
              </button>
            )}
          </div>
        </div>

        {/* ── User strip with profile photo ── */}
        <div className="profile-card__user-strip">
          {/* Profile photo with upload */}
          <ProfilePhoto user={user} onUploadSuccess={onPhotoUpdate} />

          <div style={{ marginLeft: 14 }}>
            <div className="profile-card__user-name">{user?.first_name} {user?.last_name}</div>
            <div className="profile-card__user-meta">{user?.email}</div>
            <div className="profile-card__user-meta">{user?.phone_number || "No phone number"}</div>
            <div style={{ fontSize: 11, color: "#bbb", marginTop: 4 }}>
              Click the camera icon to change your photo
            </div>
          </div>
        </div>

        <div className="profile-card__fields">
          <EditableField label="First Name"                  name="first_name"    value={form.first_name}    isEditing={isEditing} onChange={handleChange} />
          <EditableField label="Last Name"                   name="last_name"     value={form.last_name}     isEditing={isEditing} onChange={handleChange} />
          <EditableField label="Email Address"               name="email"         value={form.email}         isEditing={isEditing} onChange={handleChange} />
          <EditableField label="Phone / Mobile Number"       name="phone_number"  value={form.phone_number}  isEditing={isEditing} onChange={handleChange} />
          <EditableField label="Company Name (Optional)"     name="company_name"  value={form.company_name}  isEditing={isEditing} onChange={handleChange} />
          <EditableField label="Position / Title (Optional)" name="position"      value={form.position}      isEditing={isEditing} onChange={handleChange} />
          <div className="profile-field--full">
            <EditableField label="Business Type (Optional)"  name="business_type" value={form.business_type} isEditing={isEditing} onChange={handleChange} />
          </div>
        </div>
      </div>

      {/* Addresses Card */}
      <div className="profile-card">
        <div className="profile-card__header">
          <div className="profile-card__header-left">
            <div className="profile-card__icon-box"><MapPinIcon /></div>
            <div>
              <div className="profile-card__title">Addresses</div>
              <div className="profile-card__subtitle">Manage your saved delivery addresses</div>
            </div>
          </div>
          <button className="btn-profile-primary" onClick={openAddModal}>
            <PlusIcon /> Add New
          </button>
        </div>
        <div className="profile-addresses__grid">
          {addresses.length === 0 ? (
            <>
              <div className="profile-address-empty">
                <div className="profile-address-empty__icon"><PlusIcon /></div>
                <span>No address saved yet</span>
                <button className="btn-profile-ghost" onClick={openAddModal}><PlusIcon /> Add Address</button>
              </div>
              <div className="profile-address-empty">
                <div className="profile-address-empty__icon"><PlusIcon /></div>
                <span>No address saved yet</span>
                <button className="btn-profile-ghost" onClick={openAddModal}><PlusIcon /> Add Address</button>
              </div>
            </>
          ) : (
            <>
              {addresses.map((addr, idx) => (
                <AddressCard
                  key={addr.id ?? idx}
                  addr={addr}
                  onEdit={() => handleEditAddress(idx)}
                  onDelete={() => handleDeleteAddress(idx)}
                />
              ))}
              <div className="profile-address-empty">
                <div className="profile-address-empty__icon"><PlusIcon /></div>
                <span>Add another address</span>
                <button className="btn-profile-ghost" onClick={openAddModal}><PlusIcon /> Add Address</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Style Objects ────────────────────────────────────────────────────────────
const editableStyles = {
  input: {
    border: "1.5px solid #1a1a1a", borderRadius: 8, padding: "9px 12px",
    fontSize: 14, color: "#1a1a1a", outline: "none", background: "#f9f9f9",
    width: "100%", boxSizing: "border-box",
  },
  display: {
    fontSize: 14, color: "#1a1a1a", padding: "9px 0",
    borderBottom: "1px solid #f0f0f0", minHeight: 36,
  },
};

const addressStyles = {
  card: {
    border: "1.5px solid #e8e8e8", borderRadius: 12, padding: "14px 16px",
    background: "#fafafa", display: "flex", flexDirection: "column", gap: 6,
  },
  cardHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  typeBadge: {
    display: "inline-flex", alignItems: "center", gap: 5,
    fontSize: 11, fontWeight: 700, padding: "3px 8px",
    borderRadius: 20, letterSpacing: "0.03em",
  },
  companyName: { fontSize: 13, fontWeight: 600, color: "#1a1a1a" },
  addressBlock: { display: "flex", flexDirection: "column", gap: 1 },
  line: { fontSize: 13, color: "#444", lineHeight: 1.7 },
  contactBlock: { display: "flex", flexDirection: "column", gap: 2, paddingTop: 6, borderTop: "1px solid #f0f0f0", marginTop: 4 },
  contact: { fontSize: 12, color: "#888" },
  actionBtn: {
    background: "#f0f0f0", border: "none", borderRadius: 6,
    width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", color: "#444",
  },
};

// ─── Menu Items ───────────────────────────────────────────────────────────────
const MENU_ITEMS = [
  { key: "personal", label: "Personal Information", Icon: PersonIcon },
  { key: "orders",   label: "My Orders",            Icon: OrderIcon, badge: 12 },
  { key: "password", label: "Password & Security",  Icon: LockIcon },
  { key: "notif",    label: "Notification",         Icon: BellIcon },
];

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function ProfilePersonal() {
  const [activeMenu, setActiveMenu] = useState("personal");
  const [user, setUser]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [addresses, setAddresses]   = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await me();
        if (response.status === 200 && response.data.status === "success") {
          setUser(response.data.data);
          try {
            const addrRes = await getUserAddresses();
            if (addrRes.status === 200) {
              const addrData = addrRes.data?.data ?? addrRes.data ?? [];
              setAddresses(Array.isArray(addrData) ? addrData : []);
            }
          } catch (addrErr) {
            console.error("Failed to fetch addresses:", addrErr);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleUserUpdate = async (updatedFields) => {
    setUser((prev) => ({ ...prev, ...updatedFields }));
    try {
      const res = await updateProfile(updatedFields);
      if (res.user) setUser(res.user);
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  // ── Called after a successful photo upload — updates the URL in state ──────
  const handlePhotoUpdate = (newUrl) => {
    setUser((prev) => ({ ...prev, profile_image: newUrl }));
  };

  if (loading) return <p>Loading...</p>;
  if (!user)   return <p>User not found or unauthenticated.</p>;

  // Initials for sidebar fallback
  const initials = [user?.first_name?.[0], user?.last_name?.[0]]
    .filter(Boolean).join("").toUpperCase() || "?";

  const renderContent = () => {
    switch (activeMenu) {
      case "orders":   return <OrdersOverview />;
      case "password": return <PasswordSecurity />;
      case "notif":    return <Notification />;
      default:
        return (
          <PersonalInformation
            user={user}
            onUserUpdate={handleUserUpdate}
            onPhotoUpdate={handlePhotoUpdate}
            addresses={addresses}
            setAddresses={setAddresses}
          />
        );
    }
  };

  const Logout = async () => {
    const data = await logout();
    if (data) navigate("/login");
  };

  return (
    <div className="profile-page">
      <style>{MODAL_STYLES}</style>
      <div className="profile-page__inner">

        {/* Sidebar */}
        <aside className="profile-sidebar">
          <div className="profile-sidebar__avatar-wrap">
            {/* ── Sidebar shows the real photo too ── */}
            {user.profile_image ? (
              <img src={user.profile_image} alt="Profile" className="profile-sidebar__avatar-img" />
            ) : (
              <div className="profile-sidebar__avatar-placeholder">{initials}</div>
            )}
            <span className="profile-sidebar__name">{user.first_name} {user.last_name}</span>
            <span className="profile-sidebar__email">{user.email}</span>
            <span className="profile-sidebar__phone">{user.phone_number || "—"}</span>
          </div>

          <nav className="profile-sidebar__nav">
            <span className="profile-sidebar__nav-label">Overview</span>
            {MENU_ITEMS.map(({ key, label, Icon, badge }) => (
              <button
                key={key}
                className={`profile-sidebar__item${activeMenu === key ? " active" : ""}`}
                onClick={() => setActiveMenu(key)}
              >
                <Icon />{label}
                {badge && <span className="profile-sidebar__badge">{badge}</span>}
              </button>
            ))}
          </nav>

          <div className="profile-sidebar__divider" />

          <div className="profile-sidebar__logout-wrap">
            <button className="profile-sidebar__item danger" onClick={Logout}>
              <LogoutIcon /> Logout
            </button>
          </div>
        </aside>

        {/* Tab Content */}
        {renderContent()}
      </div>
    </div>
  );
}