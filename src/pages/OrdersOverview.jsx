// ─── MyOrders.jsx ────────────────────────────────────────────────────────────
import { useState } from "react";
import "../style/OrdersOverview.css";

const EyeIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const MessageIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
  </svg>
);

const TABS = ["All", "Completed", "Pending", "Delivered", "Cancelled"];

const STAT_CARDS = [
  { label: "TOTAL ORDERS", value: 12 },
  { label: "COMPLETED",    value: 7  },
  { label: "DELIVERED",    value: 3  },
  { label: "PENDING",      value: 2  },
];

const ORDERS = [
  {
    id: "JEM-65723-343252",
    date: "Feb 24, 2026",
    status: "Completed",
    items: ["A4 Bondpaper x10", "Pens x10", "Gloves x10", "+1 More"],
    total: "₱4,092.25",
    payment: "Bank Transfer",
  },
  {
    id: "JEM-65723-343252",
    date: "Feb 24, 2026",
    status: "Pending",
    items: ["A4 Bondpaper x10", "Pens x10", "Gloves x10", "+1 More"],
    total: "₱4,092.25",
    payment: "Bank Transfer",
    showTracker: true,
  },
  {
    id: "JEM-65723-343252",
    date: "Feb 24, 2026",
    status: "Delivered",
    items: ["A4 Bondpaper x10", "Pens x10", "Gloves x10", "+1 More"],
    total: "₱4,092.25",
    payment: "Bank Transfer",
  },
  {
    id: "JEM-65723-343252",
    date: "Feb 24, 2026",
    status: "Cancelled",
    items: ["A4 Bondpaper x10", "Pens x10", "Gloves x10", "+1 More"],
    total: "₱4,092.25",
    payment: "Bank Transfer",
  },
];

const STATUS_STYLE = {
  Completed: { bg: "#e8f4fd", color: "#2196f3", dot: "#2196f3" },
  Pending:   { bg: "#fff8e1", color: "#f59e0b", dot: "#f59e0b" },
  Delivered: { bg: "#e8f4fd", color: "#2196f3", dot: "#2196f3" },
  Cancelled: { bg: "#fde8e8", color: "#ef4444", dot: "#ef4444" },
};

const TRACKER_STEPS = ["Ordered", "Confirmed", "Packed", "Delivered"];

function OrderTracker() {
  const activeStep = 1; // "Confirmed" is active in the screenshot
  return (
    <div className="order-tracker">
      {TRACKER_STEPS.map((step, i) => (
        <div key={step} className="order-tracker__step">
          <div className={`order-tracker__node${i <= activeStep ? " done" : ""}`} />
          {i < TRACKER_STEPS.length - 1 && (
            <div className={`order-tracker__line${i < activeStep ? " done" : ""}`} />
          )}
          <span className="order-tracker__label">{step}</span>
        </div>
      ))}
    </div>
  );
}

function OrderCard({ order }) {
  const s = STATUS_STYLE[order.status] || {};
  const canReorder = order.status === "Delivered" || order.status === "Cancelled";

  return (
    <div className="order-card">
      <div className="order-card__top">
        <div className="order-card__id-wrap">
          <span className="order-card__id">{order.id}</span>
          <span className="order-card__date">{order.date}</span>
        </div>
        <span
          className="order-card__status-badge"
          style={{ background: s.bg, color: s.color }}
        >
          <span className="order-card__status-dot" style={{ background: s.dot }} />
          {order.status}
        </span>
      </div>

      <div className="order-card__items">
        {order.items.map((item, i) => (
          <span key={i} className="order-card__item-tag">{item}</span>
        ))}
      </div>

      {order.showTracker && <OrderTracker />}

      <div className="order-card__bottom">
        <span className="order-card__total">
          TOTAL: <strong>{order.total}</strong>
          <span className="order-card__payment"> · {order.payment}</span>
        </span>
        <div className="order-card__actions">
          <button className="btn-order-outline">
            <EyeIcon /> View Details
          </button>
          {canReorder ? (
            <button className="btn-order-dark">
              <RefreshIcon /> Re Order
            </button>
          ) : (
            <button className="btn-order-outline">
              <MessageIcon /> Contact Us
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrdersOverview() {
  const [activeTab, setActiveTab] = useState("All");

  const filtered = activeTab === "All"
    ? ORDERS
    : ORDERS.filter(o => o.status === activeTab);

  return (
    <div className="profile-main">

      {/* Stat cards */}
      <div className="orders-stats">
        {STAT_CARDS.map(({ label, value }) => (
          <div key={label} className="orders-stat-card">
            <div className="orders-stat-card__value">{value}</div>
            <div className="orders-stat-card__label">{label}</div>
          </div>
        ))}
      </div>

      {/* Orders card */}
      <div className="profile-card">
        <div className="profile-card__header">
          <div className="profile-card__header-left">
            <div className="profile-card__icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
                <line x1="9" y1="12" x2="15" y2="12" />
                <line x1="9" y1="16" x2="13" y2="16" />
              </svg>
            </div>
            <div>
              <div className="profile-card__title">My Orders</div>
              <div className="profile-card__subtitle">Track and manage all your purchases</div>
            </div>
          </div>
          <span className="orders-total-badge">{ORDERS.length} Total Orders</span>
        </div>

        {/* Tabs */}
        <div className="orders-tabs">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`orders-tab${activeTab === tab ? " active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Order list */}
        <div className="orders-list">
          {filtered.map((order, i) => (
            <OrderCard key={i} order={order} />
          ))}
        </div>
      </div>
    </div>
  );
}