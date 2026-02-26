import { useState } from "react";
import '../style/Profilepersonal.css';
import "../style/OrdersOverview.css";
import '../style/PasswordSecurity.css';
import '../style/Notification.css';

import OrdersOverview from './OrdersOverview';
import PasswordSecurity from './PasswordSecurity';
import Notification     from './Notification';

// ─── Icons ───────────────────────────────────────────────────────────────────
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

// ─── Field ────────────────────────────────────────────────────────────────────
const FieldGroup = ({ label }) => (
  <div className="profile-field">
    <span className="profile-field__label">{label}</span>
    <div className="profile-field__input" />
  </div>
);

// ─── Personal Information tab ─────────────────────────────────────────────────
function PersonalInformation() {
  return (
    <div className="profile-main">
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
          <button className="btn-profile-outline"><EditSmallIcon /> Edit</button>
        </div>

        <div className="profile-card__user-strip">
          <div className="profile-card__user-avatar"><UserIcon /></div>
          <div>
            <div className="profile-card__user-name">— —</div>
            <div className="profile-card__user-meta">—</div>
            <div className="profile-card__user-meta">—</div>
          </div>
        </div>

        <div className="profile-card__fields">
          <FieldGroup label="First Name" />
          <FieldGroup label="Last Name" />
          <FieldGroup label="Email Address" />
          <FieldGroup label="Phone / Mobile Number" />
          <FieldGroup label="Company Name (Optional)" />
          <FieldGroup label="Position / Title (Optional)" />
          <div className="profile-field--full">
            <FieldGroup label="Business Type (Optional)" />
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
          <button className="btn-profile-primary"><PlusIcon /> Add New</button>
        </div>

        <div className="profile-addresses__grid">
          <div className="profile-address-empty">
            <div className="profile-address-empty__icon"><PlusIcon /></div>
            <span>No address saved yet</span>
            <button className="btn-profile-ghost"><PlusIcon /> Add Address</button>
          </div>
          <div className="profile-address-empty">
            <div className="profile-address-empty__icon"><PlusIcon /></div>
            <span>No address saved yet</span>
            <button className="btn-profile-ghost"><PlusIcon /> Add Address</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const MENU_ITEMS = [
  { key: "personal", label: "Personal Information", Icon: PersonIcon },
  { key: "orders",   label: "My Orders",            Icon: OrderIcon,  badge: 12 },
  { key: "password", label: "Password & Security",  Icon: LockIcon },
  { key: "notif",    label: "Notification",         Icon: BellIcon },
];

export default function ProfilePersonal() {
  const [activeMenu, setActiveMenu] = useState("personal");

  const renderContent = () => {
    switch (activeMenu) {
      case "orders":   return <OrdersOverview />;
      case "password": return <PasswordSecurity />;
      case "notif":    return <Notification />;
      default:         return <PersonalInformation />;
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-page__inner">

        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <aside className="profile-sidebar">

          <div className="profile-sidebar__avatar-wrap">
            <div className="profile-sidebar__avatar">
              <UserIcon />
            </div>
            <span className="profile-sidebar__name">— —</span>
            <span className="profile-sidebar__email">—</span>
            <span className="profile-sidebar__phone">—</span>
          </div>

          <nav className="profile-sidebar__nav">
            <span className="profile-sidebar__nav-label">Overview</span>
            {MENU_ITEMS.map(({ key, label, Icon, badge }) => (
              <button
                key={key}
                className={`profile-sidebar__item${activeMenu === key ? " active" : ""}`}
                onClick={() => setActiveMenu(key)}
              >
                <Icon />
                {label}
                {badge && <span className="profile-sidebar__badge">{badge}</span>}
              </button>
            ))}
          </nav>

          <div className="profile-sidebar__divider" />

          <div className="profile-sidebar__logout-wrap">
            <button className="profile-sidebar__item danger">
              <LogoutIcon />
              Logout
            </button>
          </div>
        </aside>

        {/* ── Tab Content ──────────────────────────────────────────────── */}
        {renderContent()}

      </div>
    </div>
  );
}