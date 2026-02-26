// ─── Notification.jsx ────────────────────────────────────────────────────────
import { useState } from "react";
import '../style/Notification.css';

const BellHeaderIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 01-3.46 0" />
  </svg>
);

const SaveIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const NOTIFICATIONS = [
  {
    key: "orderUpdates",
    title: "Order Updates",
    desc: "Get notified when your order status changes",
    default: true,
  },
  {
    key: "paymentConfirmation",
    title: "Payment Confirmation",
    desc: "Get notified when your order is out of delivery",
    default: true,
  },
  {
    key: "deliveryNotification",
    title: "Delivery Notification",
    desc: "Get notified when your order is out of delivery",
    default: true,
  },
  {
    key: "promos",
    title: "Promos & Special Offers",
    desc: "Be the first to know about exclusive deals",
    default: false,
  },
  {
    key: "newArrivals",
    title: "New Product Arrivals",
    desc: "Get notified when new products are added",
    default: false,
  },
  {
    key: "blog",
    title: "Blog & Newsletter",
    desc: "Receives JEM8's latest article & updates",
    default: false,
  },
];

function Toggle({ on, onChange }) {
  return (
    <button
      className={`notif-toggle${on ? " on" : ""}`}
      onClick={() => onChange(!on)}
      type="button"
      aria-pressed={on}
    >
      <span className="notif-toggle__knob" />
    </button>
  );
}

export default function Notification() {
  const [prefs, setPrefs] = useState(
    Object.fromEntries(NOTIFICATIONS.map(n => [n.key, n.default]))
  );

  const toggle = (key, val) => setPrefs(p => ({ ...p, [key]: val }));

  return (
    <div className="profile-main">

      {/* Breadcrumb */}
      <div className="profile-breadcrumb">
        <span className="profile-breadcrumb__dot" />
        Notification &nbsp;·&nbsp; Manage your alerts, updates, and communication preferences
      </div>

      {/* Header card */}
      <div className="profile-card">
        <div className="profile-card__header">
          <div className="profile-card__header-left">
            <div className="profile-card__icon-box">
              <BellHeaderIcon />
            </div>
            <div>
              <div className="profile-card__title">Notification Preference</div>
              <div className="profile-card__subtitle">Manage your alerts, updates, and communication preferences</div>
            </div>
          </div>
        </div>

        {/* Notification rows */}
        <div className="notif-list">
          {NOTIFICATIONS.map(({ key, title, desc }) => (
            <div key={key} className="notif-row">
              <div>
                <div className="notif-row__title">{title}</div>
                <div className="notif-row__desc">{desc}</div>
              </div>
              <Toggle on={prefs[key]} onChange={val => toggle(key, val)} />
            </div>
          ))}
        </div>

        {/* Save button */}
        <div className="notif-footer">
          <button className="btn-profile-primary">
            <SaveIcon /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}