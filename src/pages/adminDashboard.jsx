import { useState, useEffect, useRef } from "react";
import AdminNav from "../components/AdminNav";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

// ── Fetch ────────────────────────────────────────────────────────────────────
async function fetchDashboard() {
  const { data } = await api.get("/dashboard");
  return data;
}
async function markNotificationRead(id) {
  await api.patch(`/notifications/${id}/read`);
}

// ── Formatters ───────────────────────────────────────────────────────────────
const peso = (v) =>
  "₱" +
  Number(v ?? 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const num = (v) => Number(v ?? 0).toLocaleString();

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(
    dateStr.includes("Z") || dateStr.includes("+") || dateStr.includes("-", 10)
      ? dateStr
      : dateStr + "Z"
  );
  const diff = Date.now() - date.getTime();
  if (diff < 0) return "Just now";
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return date.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
};

const CHART_COLORS = [
  "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B",
  "#EC4899", "#06B6D4", "#EF4444", "#14B8A6",
  "#F97316", "#6366F1",
];

const AVATAR_COLORS = [
  "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B",
  "#EC4899", "#06B6D4", "#EF4444",
];

// ── Design tokens (inline style objects) ─────────────────────────────────────
const T = {
  // Colors
  blue50:    "#EFF6FF", blue100: "#DBEAFE", blue500: "#3B82F6", blue600: "#2563EB",
  green50:   "#ECFDF5", green500: "#10B981", green600: "#059669",
  amber50:   "#FFFBEB", amber500: "#F59E0B", amber600: "#D97706",
  purple50:  "#F5F3FF", purple500: "#8B5CF6", purple600: "#7C3AED",
  red50:     "#FEF2F2", red100:   "#FEE2E2", red500: "#EF4444", red600: "#DC2626",
  slate50:   "#F8FAFC", slate100: "#F1F5F9", slate200: "#E2E8F0", slate300: "#CBD5E1",
  slate400:  "#94A3B8", slate500: "#64748B", slate600: "#475569",
  slate700:  "#374151", slate800: "#1E293B", slate900: "#0F172A",
  // Radii
  sm: 8, md: 12, lg: 16,
  // Shadows
  shadowSm: "0 1px 2px rgba(15,23,42,0.05)",
  shadowMd: "0 4px 12px rgba(15,23,42,0.08)",
  shadowHover: "0 8px 24px rgba(15,23,42,0.12)",
};

// ── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ style = {} }) {
  return (
    <div style={{
      background: "linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)",
      backgroundSize: "200% 100%",
      borderRadius: 10,
      animation: "skeletonPulse 1.5s ease-in-out infinite",
      ...style,
    }} />
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
const Avatar = ({ name, index, size = 30 }) => {
  const bg = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "white", fontSize: Math.round(size * 0.36), fontWeight: 700, flexShrink: 0,
    }}>
      {(name?.[0] ?? "?").toUpperCase()}
    </div>
  );
};

// ── Status Badge ──────────────────────────────────────────────────────────────
const STATUS_MAP = {
  Completed:  { bg: "#ECFDF5", color: "#059669", label: "Completed" },
  delivered:  { bg: "#ECFDF5", color: "#059669", label: "Delivered" },
  on_the_way: { bg: "#EFF6FF", color: "#2563EB", label: "On the way" },
  ready:      { bg: "#F5F3FF", color: "#7C3AED", label: "Ready" },
  Pending:    { bg: "#FFFBEB", color: "#D97706", label: "Pending" },
  Unpaid:     { bg: "#FEF2F2", color: "#DC2626", label: "Unpaid" },
  Paid:       { bg: "#ECFDF5", color: "#059669", label: "Paid" },
  replied:    { bg: "#ECFDF5", color: "#059669", label: "Replied" },
  read:       { bg: "#EFF6FF", color: "#2563EB", label: "Read" },
  unread:     { bg: "#FFFBEB", color: "#D97706", label: "Unread" },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] ?? { bg: "#F8FAFC", color: "#64748B", label: status };
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
      whiteSpace: "nowrap", letterSpacing: "0.2px", flexShrink: 0,
    }}>
      {s.label}
    </span>
  );
};

// ── Card ──────────────────────────────────────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <div style={{
    background: "#FFFFFF", borderRadius: T.lg, overflow: "hidden",
    border: `1px solid ${T.slate200}`, boxShadow: T.shadowSm, ...style,
  }}>
    {children}
  </div>
);

const CardHeader = ({ title, action, subtitle }) => (
  <div style={{ padding: "14px 16px 0", marginBottom: 12 }}>
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.slate700, letterSpacing: "-0.1px" }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 10, color: T.slate400, marginTop: 2 }}>{subtitle}</div>
        )}
      </div>
      {action}
    </div>
  </div>
);

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, accentColor, bgColor, trend, trendUp, sparkline, loading }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff", borderRadius: T.lg, padding: "16px",
        border: `1px solid ${T.slate200}`,
        boxShadow: hovered ? T.shadowHover : T.shadowSm,
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition: "all 0.15s ease",
        position: "relative", overflow: "hidden",
      }}
    >
      {/* Top accent bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)`,
        borderRadius: `${T.lg}px ${T.lg}px 0 0`,
      }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: T.slate400, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {label}
        </div>
        <div style={{
          width: 34, height: 34, borderRadius: T.sm, background: bgColor,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
        }}>
          {icon}
        </div>
      </div>
      {loading ? (
        <Skeleton style={{ height: 26, width: 80, marginBottom: 8 }} />
      ) : (
        <div style={{ fontSize: 22, fontWeight: 700, color: T.slate900, letterSpacing: "-0.5px", lineHeight: 1, marginBottom: 4 }}>
          {value}
        </div>
      )}
      {/* Sparkline */}
      {sparkline && !loading && (
        <div style={{ height: 28, margin: "8px 0 4px" }}>
          <svg width="100%" height="28" viewBox="0 0 120 28" preserveAspectRatio="none">
            <polyline
              points={sparkline.points}
              fill="none"
              stroke={accentColor}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points={sparkline.area}
              fill={accentColor}
              fillOpacity="0.08"
            />
          </svg>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 10, color: T.slate400 }}>{sub}</div>
        {trend && (
          <div style={{
            display: "flex", alignItems: "center", gap: 3,
            fontSize: 10, fontWeight: 600,
            color: trendUp ? T.green600 : T.red600,
          }}>
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d={trendUp ? "M5 2L9 7H1L5 2Z" : "M5 8L9 3H1L5 8Z"} fill="currentColor" />
            </svg>
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sparkline Line Chart ──────────────────────────────────────────────────────
function LineChart({ thisYear = {}, lastYear = {} }) {
  const currentMonth = new Date().getMonth() + 1;
  const months = [1,2,3,4,5,6,7,8,9,10,11,12];
  const labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const activeMonths = months.filter((m) => m <= currentMonth);
  const thisVals = activeMonths.map((m) => Number(thisYear[m] ?? 0));
  const lastVals = activeMonths.map((m) => Number(lastYear[m] ?? 0));
  const max = Math.max(...thisVals, ...lastVals, 1);
  const hasLastYear = lastVals.some((v) => v > 0);
  const vw = 500, vh = 140, padL = 10, padR = 10, padT = 12, padB = 26;
  const chartW = vw - padL - padR;
  const chartH = vh - padT - padB;

  const coords = (vals) =>
    vals.map((v, i) => ({
      x: padL + (i / Math.max(activeMonths.length - 1, 1)) * chartW,
      y: padT + chartH - (v / max) * chartH,
    }));

  const smoothPath = (pts) => {
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const cp1x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) / 3;
      const cp2x = pts[i].x - (pts[i].x - pts[i - 1].x) / 3;
      d += ` C ${cp1x} ${pts[i - 1].y} ${cp2x} ${pts[i].y} ${pts[i].x} ${pts[i].y}`;
    }
    return d;
  };

  const thisPts = coords(thisVals);
  const lastPts = coords(lastVals);
  const d1 = smoothPath(thisPts);
  const d2 = smoothPath(lastPts);
  const areaBottom = padT + chartH;

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${vw} ${vh}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
      <defs>
        <linearGradient id="areaGrad3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </linearGradient>
        <clipPath id="chartClip3">
          <rect x={padL} y={padT} width={chartW} height={chartH} />
        </clipPath>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
        <line key={i} x1={padL} x2={padL + chartW}
          y1={padT + chartH * (1 - pct)} y2={padT + chartH * (1 - pct)}
          stroke="#F1F5F9" strokeWidth="1" />
      ))}
      <path
        d={`${d1} L ${thisPts[thisPts.length - 1].x} ${areaBottom} L ${thisPts[0].x} ${areaBottom} Z`}
        fill="url(#areaGrad3)" clipPath="url(#chartClip3)"
      />
      {hasLastYear && (
        <path d={d2} fill="none" stroke="#CBD5E1" strokeWidth="1.2"
          strokeDasharray="3 2" strokeLinecap="round" />
      )}
      <path d={d1} fill="none" stroke="#3B82F6" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
      {thisPts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i === thisPts.length - 1 ? 4 : 3}
          fill={i === thisPts.length - 1 ? "#3B82F6" : "#fff"}
          stroke="#3B82F6" strokeWidth="1.8" />
      ))}
      {activeMonths.map((m, i) => (
        <text key={i} x={thisPts[i].x} y={vh - 6} textAnchor="middle"
          fontSize="9" fill="#94A3B8" fontFamily="'DM Sans',system-ui">
          {labels[m - 1]}
        </text>
      ))}
    </svg>
  );
}

// ── Bar Chart ─────────────────────────────────────────────────────────────────
function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{
      display: "flex", alignItems: "flex-end", gap: 5,
      padding: "0 4px", height: 110, overflow: "hidden",
    }}>
      {data.map((d, i) => (
        <div key={i} style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", gap: 4, height: "100%", minWidth: 0,
        }}>
          <div style={{ flex: 1 }} />
          <div style={{
            width: "100%", borderRadius: "4px 4px 0 0",
            background: d.color, opacity: 0.85,
            transition: "height 0.7s ease",
            height: `${Math.max(4, (d.value / max) * 92)}px`, flexShrink: 0,
          }} />
          <span style={{
            fontSize: 9, color: "#94A3B8", whiteSpace: "nowrap",
            overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%",
            height: 14, lineHeight: "14px",
          }}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Donut Chart ───────────────────────────────────────────────────────────────
function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.pct, 0) || 1;
  let cumulative = 0;
  const r = 44, cx = 56, cy = 56, stroke = 16;
  const circ = 2 * Math.PI * r;
  return (
    <svg width="112" height="112" viewBox="0 0 112 112" style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth={stroke} />
      {data.map((d, i) => {
        const pct = d.pct / total;
        const dash = pct * circ;
        const gap = circ - dash;
        const offset = circ * (1 - cumulative / total);
        cumulative += d.pct;
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color}
            strokeWidth={stroke} strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={offset} strokeLinecap="round"
            style={{ transform: "rotate(-90deg)", transformOrigin: "56px 56px" }} />
        );
      })}
      <text x="56" y="60" textAnchor="middle" fontSize="12" fontWeight="700"
        fill="#0F172A" fontFamily="'DM Sans',system-ui">
        100%
      </text>
    </svg>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const HamburgerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="2" y="4" width="16" height="2" rx="1" fill="#374151" />
    <rect x="2" y="9" width="16" height="2" rx="1" fill="#374151" />
    <rect x="2" y="14" width="16" height="2" rx="1" fill="#374151" />
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M2 2L16 16M16 2L2 16" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const BellIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
  </svg>
);

// ── Mobile Drawer ─────────────────────────────────────────────────────────────
function MobileDrawer({ open, onClose }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 998,
        opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none",
        transition: "opacity 0.25s ease",
      }} />
      <div style={{
        position: "fixed", top: 0, left: 0, bottom: 0, width: 270, zIndex: 999,
        background: "#fff", boxShadow: "4px 0 24px rgba(15,23,42,0.12)",
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 18px", borderBottom: `1px solid ${T.slate200}`, flexShrink: 0,
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: T.slate900, letterSpacing: "-0.3px" }}>
            Admin Panel
          </span>
          <button onClick={onClose} aria-label="Close menu" style={{
            background: T.slate100, border: "none", borderRadius: 8,
            width: 32, height: 32, display: "flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer",
          }}>
            <CloseIcon />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <AdminNav sidebarOpen={true} setSidebarOpen={() => {}} inDrawer={true} onClose={onClose} />
        </div>
      </div>
    </>
  );
}

// ── Notification Panel (collapsible dropdown) ─────────────────────────────────
function NotificationPanel({ notifs, readIds, setReadIds, navigate, loading }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  const notifIconMap = {
    order:   { icon: "🛒", bg: T.blue50, dot: T.blue500 },
    user:    { icon: "👤", bg: T.green50, dot: T.green500 },
    product: { icon: "📦", bg: T.purple50, dot: T.purple500 },
    contact: { icon: "✉️", bg: T.amber50, dot: T.amber500 },
  };

  const unreadCount = (notifs.recent ?? []).filter(
    (n) => !n.is_read && !readIds.has(n.notification_id)
  ).length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const routes = {
    order: "/adminOrders", user: "/adminAccountmanagement",
    product: "/adminProducts", contact: "/adminContact",
  };

  const handleNotifClick = async (n, isUnread) => {
    if (isUnread) {
      setReadIds((prev) => new Set([...prev, n.notification_id]));
      try { await markNotificationRead(n.notification_id); } catch (e) {}
    }
    const path = routes[n.type];
    if (path) { navigate(path); setOpen(false); }
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle notifications"
        style={{
          width: 36, height: 36, borderRadius: T.sm,
          border: `1px solid ${T.slate200}`,
          background: open ? T.slate50 : "none",
          cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", color: T.slate500,
          transition: "all 0.12s", position: "relative",
        }}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: 6, right: 6, width: 7, height: 7,
            borderRadius: "50%", background: T.red500, border: "1.5px solid #fff",
          }} />
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0,
            width: 300, background: "#fff", borderRadius: T.lg,
            border: `1px solid ${T.slate200}`, boxShadow: T.shadowHover,
            zIndex: 100, overflow: "hidden",
          }}
        >
          {/* Panel header */}
          <div style={{
            padding: "12px 14px", borderBottom: `1px solid ${T.slate100}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.slate700 }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <span style={{
                fontSize: 9, background: T.red100, color: T.red600,
                fontWeight: 700, padding: "2px 7px", borderRadius: 10,
              }}>
                {unreadCount} new
              </span>
            )}
          </div>

          {/* Items */}
          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} style={{ padding: "10px 14px" }}>
                  <Skeleton style={{ height: 50, width: "100%" }} />
                </div>
              ))
            ) : (notifs.recent ?? []).length === 0 ? (
              <div style={{ padding: "20px 14px", textAlign: "center", fontSize: 11, color: T.slate400 }}>
                No notifications yet.
              </div>
            ) : (
              (notifs.recent ?? []).map((n, i) => {
                const s = notifIconMap[n.type] ?? { icon: "🔔", bg: T.slate100, dot: T.slate400 };
                const isUnread = !n.is_read && !readIds.has(n.notification_id);
                return (
                  <div
                    key={n.notification_id ?? i}
                    onClick={() => handleNotifClick(n, isUnread)}
                    style={{
                      display: "flex", gap: 10, padding: "10px 14px",
                      background: isUnread ? "#F0F7FF" : "transparent",
                      borderBottom: `1px solid ${T.slate50}`,
                      cursor: "pointer", transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => { if (!isUnread) e.currentTarget.style.background = T.slate50; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = isUnread ? "#F0F7FF" : "transparent"; }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: T.sm, flexShrink: 0,
                      background: isUnread ? s.bg : T.slate100,
                      border: `1.5px solid ${isUnread ? s.dot + "33" : T.slate200}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, marginTop: 1,
                    }}>
                      {s.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 4 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: T.slate800, lineHeight: 1.3 }}>
                          {n.title}
                        </div>
                        {isUnread && (
                          <span style={{
                            width: 6, height: 6, borderRadius: "50%",
                            background: s.dot, flexShrink: 0, marginTop: 4,
                          }} />
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: T.slate500, marginTop: 2, lineHeight: 1.4, wordBreak: "break-word" }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize: 9, color: T.slate300, marginTop: 3 }}>
                        {timeAgo(n.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: "10px 14px", borderTop: `1px solid ${T.slate100}`, textAlign: "center" }}>
            <button
              onClick={() => { navigate("/adminNotifications"); setOpen(false); }}
              style={{
                fontSize: 11, color: T.blue600, fontWeight: 600, background: "none",
                border: "none", cursor: "pointer",
              }}
            >
             
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Section header with optional action ───────────────────────────────────────
function SectionHeader({ children, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, color: T.slate800, letterSpacing: "-0.2px", margin: 0 }}>
        {children}
      </h2>
      {action && (
        <span style={{ fontSize: 11, color: T.blue600, fontWeight: 600, cursor: "pointer" }}>
          {action}
        </span>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [readIds, setReadIds]       = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchDashboard()
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch((e) => {
        if (!cancelled) {
          const msg = e.response?.status === 401
            ? "Unauthorized — please log in again."
            : e.response?.data?.message ?? e.message ?? "Failed to load dashboard.";
          setError(msg);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  // ── Derived data ────────────────────────────────────────────────────────────
  const views    = data?.views    ?? {};
  const accounts = data?.accounts ?? {};
  const orders   = data?.orders   ?? {};
  const sales    = data?.sales    ?? {};
  const traffic  = data?.traffic  ?? {};
  const contacts = data?.contacts ?? {};
  const products = data?.products ?? {};
  const notifs   = data?.notifications ?? {};

  const salesChartData = Object.entries(sales.monthly_chart ?? {})
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([m, v], i) => ({
      label: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][Number(m) - 1] ?? m,
      value: Number(v),
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));

  const marketingRaw = Object.entries(traffic.revenue_by_address ?? {})
    .slice(0, 5)
    .map(([city, v], i) => ({ city, pct: Number(v), color: CHART_COLORS[i] }));
  const marketingTotal = marketingRaw.reduce((s, d) => s + d.pct, 0) || 1;
  const marketingData = marketingRaw.map((d) => ({
    ...d, pct: parseFloat(((d.pct / marketingTotal) * 100).toFixed(1)),
  }));

  const kpiCards = [
    {
      label: "Total Views", icon: "👁",
      value: loading ? "—" : num(views.total_views),
      sub: `Today: ${num(views.today_views)}`,
      accentColor: "#3B82F6", bgColor: T.blue50,
      trend: "+12.4%", trendUp: true,
      sparkline: {
        points: "0,22 20,18 40,20 60,12 80,8 100,10 120,5",
        area: "0,22 20,18 40,20 60,12 80,8 100,10 120,5 120,28 0,28",
      },
    },
    {
      label: "Revenue", icon: "💰",
      value: loading ? "—" : peso(sales.total),
      sub: `This month: ${peso(sales.this_month)}`,
      accentColor: "#10B981", bgColor: T.green50,
      trend: "+8.2%", trendUp: true,
      sparkline: {
        points: "0,20 20,16 40,19 60,10 80,14 100,6 120,8",
        area: "0,20 20,16 40,19 60,10 80,14 100,6 120,8 120,28 0,28",
      },
    },
    {
      label: "Total Orders", icon: "🛒",
      value: loading ? "—" : num(orders.total),
      sub: `This week: ${num(orders.weekly_total)}`,
      accentColor: "#F59E0B", bgColor: T.amber50,
      trend: "+5.1%", trendUp: true,
      sparkline: {
        points: "0,15 20,18 40,12 60,10 80,14 100,8 120,6",
        area: "0,15 20,18 40,12 60,10 80,14 100,8 120,6 120,28 0,28",
      },
    },
    {
      label: "Accounts", icon: "👤",
      value: loading ? "—" : num(accounts.total),
      sub: `New today: ${num(accounts.new_today)}`,
      accentColor: "#8B5CF6", bgColor: T.purple50,
      trend: "-2.1%", trendUp: false,
      sparkline: {
        points: "0,24 20,20 40,22 60,16 80,12 100,9 120,7",
        area: "0,24 20,20 40,22 60,16 80,12 100,9 120,7 120,28 0,28",
      },
    },
  ];

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: "flex", minHeight: "100vh", background: "#F0F4F8",
      fontFamily: "'DM Sans','Nunito',system-ui,sans-serif",
    }}>
      <style>{`
        @keyframes skeletonPulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .admin-sidebar { display: none; }
        @media (min-width: 1024px) { .admin-sidebar { display: block; } }
        .admin-hamburger { display: flex; }
        @media (min-width: 1024px) { .admin-hamburger { display: none !important; } }
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px; margin-bottom: 16px;
        }
        @media (min-width: 640px) { .kpi-grid { grid-template-columns: repeat(4, 1fr); } }
        .mid-row {
          display: grid; grid-template-columns: 1fr;
          gap: 14px; margin-bottom: 16px;
        }
        @media (min-width: 900px) {
          .mid-row { grid-template-columns: 1.6fr 1fr; }
        }
        .bottom-row {
          display: grid; grid-template-columns: 1fr;
          gap: 14px; margin-bottom: 16px;
        }
        @media (min-width: 700px) {
          .bottom-row { grid-template-columns: 1fr 1fr; }
        }
        @media (min-width: 1100px) {
          .bottom-row { grid-template-columns: 1.5fr 1fr 1fr; }
        }
        .metrics-trio {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 12px; margin-bottom: 16px;
        }
        @media (min-width: 640px) { .metrics-trio { grid-template-columns: repeat(4, 1fr); } }
        .dash-main { padding: 16px 14px; }
        @media (min-width: 640px) { .dash-main { padding: 20px 24px; } }
        .tbl-row:hover td { background: #F8FAFC; }
        a { color: inherit; text-decoration: none; }
        button { font-family: inherit; }
      `}</style>

      {/* Desktop sidebar */}
      <div className="admin-sidebar">
        <AdminNav sidebarOpen={true} setSidebarOpen={() => {}} />
      </div>

      {/* Mobile drawer */}
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Main content */}
      <main className="dash-main" style={{ flex: 1, minWidth: 0, overflowX: "hidden" }}>

        {/* ── Top bar ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
          background: "#fff", borderRadius: T.lg, padding: "12px 16px",
          border: `1px solid ${T.slate200}`, boxShadow: T.shadowSm,
        }}>
          <button
            onClick={() => setDrawerOpen(true)}
            className="admin-hamburger"
            aria-label="Open navigation menu"
            style={{
              background: "none", border: `1px solid ${T.slate200}`,
              borderRadius: T.sm, width: 36, height: 36,
              alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0,
            }}
          >
            <HamburgerIcon />
          </button>

          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: T.slate900, margin: 0, letterSpacing: "-0.3px" }}>
              Dashboard
            </h1>
            <p style={{ fontSize: 11, color: T.slate400, margin: 0, marginTop: 1 }}>
              Welcome back — here's what's happening today.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontSize: 11, color: T.slate500, background: T.slate100,
              padding: "5px 12px", borderRadius: 20, fontWeight: 500,
            }}>
              {today}
            </span>

            {/* Notification dropdown */}
            <NotificationPanel
              notifs={notifs} readIds={readIds}
              setReadIds={setReadIds} navigate={navigate} loading={loading}
            />
          </div>

          {error && (
            <span style={{
              fontSize: 11, color: T.red600, background: T.red50,
              padding: "4px 10px", borderRadius: 20,
            }}>
              ⚠ {error}
            </span>
          )}
        </div>

        {/* ── KPI Cards ── */}
        <div className="kpi-grid">
          {kpiCards.map((card) => (
            <KpiCard key={card.label} {...card} loading={loading} />
          ))}
        </div>

        {/* ── Mid row: User chart + Revenue by location ── */}
        <div className="mid-row">
          {/* Line chart */}
          <Card>
            <CardHeader
              title="New Accounts / Month"
              subtitle="User growth — this year vs. last year"
              action={
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: T.slate400 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3B82F6", display: "inline-block" }} />
                    This year
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: T.slate400 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.slate300, display: "inline-block" }} />
                    Last year
                    {!Object.values(accounts.new_per_month_prev ?? {}).some((v) => Number(v) > 0) && (
                      <span style={{ fontSize: 9, color: T.slate400, background: T.slate100, padding: "1px 6px", borderRadius: 10, fontStyle: "italic" }}>
                        No data
                      </span>
                    )}
                  </div>
                </div>
              }
            />
            <div style={{ padding: "0 16px 14px" }}>
              {loading ? (
                <Skeleton style={{ height: 130, width: "100%" }} />
              ) : (
                <div style={{ height: 130 }}>
                  <LineChart
                    thisYear={accounts.new_per_month ?? {}}
                    lastYear={accounts.new_per_month_prev ?? {}}
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Revenue by Location */}
          <Card>
            <CardHeader
              title="Revenue by Location"
              action={<span style={{ fontSize: 10, color: T.blue600, fontWeight: 600, cursor: "pointer" }}>View all</span>}
            />
            <div style={{ padding: "0 16px 14px" }}>
              {loading ? (
                <Skeleton style={{ height: 120, width: "100%" }} />
              ) : marketingData.length > 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <DonutChart data={marketingData} />
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                    {marketingData.map((m, i) => (
                      <div key={m.city} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: T.slate600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {m.city}
                        </span>
                        <div style={{ width: 80, height: 4, background: T.slate100, borderRadius: 4, overflow: "hidden", flexShrink: 0 }}>
                          <div style={{ width: `${m.pct}%`, height: "100%", background: m.color, borderRadius: 4 }} />
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: T.slate700, minWidth: 32, textAlign: "right" }}>
                          {m.pct}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: 11, color: T.slate400, margin: 0 }}>No location data yet.</p>
              )}
            </div>
          </Card>
        </div>

        {/* ── Quick metrics row ── */}
        <div className="metrics-trio">
          {/* Orders this week */}
          <Card>
            <CardHeader title="🛒 Orders This Week" />
            <div style={{ padding: "0 16px 14px" }}>
              {loading ? <Skeleton style={{ height: 56, width: "100%" }} /> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { l: "Total",  v: num(orders.weekly_total),  c: T.slate800 },
                    { l: "Paid",   v: num(orders.weekly_paid),   c: T.green600 },
                    { l: "Unpaid", v: num(orders.weekly_unpaid), c: T.red600 },
                  ].map((o) => (
                    <div key={o.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: T.slate500 }}>{o.l}</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: o.c }}>{o.v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Delivery status */}
          <Card>
            <CardHeader title="🚚 Delivery Status" />
            <div style={{ padding: "0 16px 14px" }}>
              {loading ? <Skeleton style={{ height: 56, width: "100%" }} /> : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 14px" }}>
                  {[
                    { l: "Processing", v: orders.processing, c: T.amber600 },
                    { l: "Ready",      v: orders.ready,      c: T.purple600 },
                    { l: "On the Way", v: orders.on_the_way, c: T.blue600 },
                    { l: "Delivered",  v: orders.delivered,  c: T.green600 },
                  ].map((s) => (
                    <div key={s.l}>
                      <div style={{ fontSize: 9, color: T.slate400, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 1 }}>
                        {s.l}
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: s.c }}>{num(s.v)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Products */}
          <Card>
            <CardHeader title="📦 Products" />
            <div style={{ padding: "0 16px 14px" }}>
              {loading ? <Skeleton style={{ height: 56, width: "100%" }} /> : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 14px" }}>
                  {[
                    { l: "Total",     v: products.total,     c: T.slate800 },
                    { l: "On Sale",   v: products.on_sale,   c: T.red600 },
                    { l: "In Stock",  v: products.in_stock,  c: T.green600 },
                    { l: "Pre-Order", v: products.pre_order, c: T.purple600 },
                  ].map((p) => (
                    <div key={p.l}>
                      <div style={{ fontSize: 9, color: T.slate400, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 1 }}>
                        {p.l}
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: p.c, letterSpacing: "-0.5px" }}>{num(p.v)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Revenue */}
          <Card>
            <CardHeader title="💰 Revenue" />
            <div style={{ padding: "0 16px 14px" }}>
              {loading ? <Skeleton style={{ height: 56, width: "100%" }} /> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { l: "Total",      v: peso(sales.total) },
                    { l: "This Month", v: peso(sales.this_month) },
                    { l: "Today",      v: peso(sales.today) },
                  ].map((s) => (
                    <div key={s.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: T.slate500 }}>{s.l}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: T.slate900 }}>{s.v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ── Charts row: Sales bar + Revenue by location ── */}
        <div className="mid-row" style={{ marginBottom: 16 }}>
          <Card>
            <CardHeader title="📊 Sales This Year" subtitle="Monthly revenue breakdown" />
            <div style={{ padding: "0 16px 14px" }}>
              {loading ? (
                <Skeleton style={{ height: 150, width: "100%" }} />
              ) : salesChartData.length > 0 ? (
                <div style={{ height: 150, paddingTop: 40 }}>
                  <BarChart data={salesChartData} />
                </div>
              ) : (
                <p style={{ fontSize: 11, color: T.slate400, margin: 0 }}>No sales data yet.</p>
              )}
            </div>
          </Card>

          {/* Recent Products */}
          <Card>
            <CardHeader title="📦 Recent Products" />
            <div style={{ padding: "0 16px 14px", display: "flex", flexDirection: "column" }}>
              {loading ? (
                [1, 2, 3].map((i) => (
                  <Skeleton key={i} style={{ height: 38, width: "100%", marginBottom: 4 }} />
                ))
              ) : (
                (products.recent ?? []).map((p, i, arr) => (
                  <div key={p.product_id ?? i} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "7px 0",
                    borderBottom: i < arr.length - 1 ? `1px solid ${T.slate50}` : "none",
                  }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: T.sm, flexShrink: 0,
                      background: T.green50, display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 14,
                    }}>
                      📦
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: T.slate800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.product_name}
                      </div>
                      <div style={{ fontSize: 10, color: T.slate400 }}>{peso(p.price)}</div>
                    </div>
                    {p.isSale && (
                      <span style={{ fontSize: 9, background: "#FEE2E2", color: T.red600, fontWeight: 700, padding: "2px 5px", borderRadius: 20 }}>
                        SALE
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* ── Bottom row: Orders table · Customers · Contacts ── */}
        <div className="bottom-row">
          {/* Recent Orders */}
          <Card>
            <CardHeader
              title="Recent Orders"
              subtitle={`Total: ${num(orders.total)} · Paid: ${num(orders.paid)} · Unpaid: ${num(orders.unpaid)}`}
              action={
                <span style={{ fontSize: 10, color: T.blue600, fontWeight: 600, cursor: "pointer" }}>
                  View all →
                </span>
              }
            />
            <div style={{ padding: "0 16px 14px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr>
                    {["Customer", "Amount", "Method", "Status"].map((h) => (
                      <th key={h} style={{
                        fontSize: 9, fontWeight: 600, color: T.slate400, textTransform: "uppercase",
                        letterSpacing: "0.5px", padding: "0 0 8px", textAlign: "left",
                        borderBottom: `1px solid ${T.slate100}`,
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [1,2,3,4].map((i) => (
                      <tr key={i}>
                        <td colSpan={4} style={{ padding: "8px 0" }}>
                          <Skeleton style={{ height: 36, width: "100%" }} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    (orders.recent ?? []).map((order, i, arr) => (
                      <tr key={order.checkout_id} className="tbl-row">
                        <td style={{ padding: "9px 0", borderBottom: i < arr.length - 1 ? `1px solid ${T.slate50}` : "none" }}>
                          <div style={{ fontWeight: 600, color: T.slate800, fontSize: 11 }}>
                            {order.first_name} {order.last_name}
                          </div>
                          <div style={{ fontSize: 9, color: T.slate400, marginTop: 1 }}>{timeAgo(order.created_at)}</div>
                        </td>
                        <td style={{ padding: "9px 8px 9px 0", borderBottom: i < arr.length - 1 ? `1px solid ${T.slate50}` : "none", fontWeight: 700, color: T.slate800, fontSize: 11 }}>
                          {order.paid_at ? peso(order.paid_amount) : "—"}
                        </td>
                        <td style={{ padding: "9px 8px 9px 0", borderBottom: i < arr.length - 1 ? `1px solid ${T.slate50}` : "none", fontSize: 10, color: T.slate400 }}>
                          {order.payment_method}
                        </td>
                        <td style={{ padding: "9px 0", borderBottom: i < arr.length - 1 ? `1px solid ${T.slate50}` : "none" }}>
                          <StatusBadge status={order.paid_at ? "Paid" : "Unpaid"} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Latest Customers */}
          <Card>
            <CardHeader
              title="Latest Customers"
              action={<span style={{ fontSize: 10, color: T.blue600, fontWeight: 600, cursor: "pointer" }}>View all →</span>}
            />
            <div style={{ padding: "0 16px 14px", display: "flex", flexDirection: "column", gap: 1 }}>
              {loading ? (
                [1,2,3].map((i) => <Skeleton key={i} style={{ height: 38, width: "100%", marginBottom: 4 }} />)
              ) : (
                (accounts.recent ?? []).map((acc, i) => (
                  <div key={acc.id} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "6px",
                    borderRadius: T.sm, cursor: "default", transition: "background 0.12s",
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.background = T.slate50}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <Avatar name={acc.first_name} index={i} size={30} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: T.slate800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {acc.first_name} {acc.last_name}
                      </div>
                      <div style={{ fontSize: 10, color: T.slate400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {acc.email}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 20, flexShrink: 0,
                      background: acc.email_verified_at ? T.green50 : T.slate100,
                      color: acc.email_verified_at ? T.green600 : T.slate400,
                    }}>
                      {acc.email_verified_at ? "Verified" : "Unverified"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Recent Contacts */}
          <Card>
            <CardHeader
              title="Contacts"
              action={
                <span style={{ fontSize: 10, color: T.slate400 }}>
                  Pending: <strong style={{ color: T.amber600 }}>{num(contacts.pending)}</strong>
                </span>
              }
            />
            <div style={{ padding: "0 16px 14px", display: "flex", flexDirection: "column" }}>
              {loading ? (
                [1,2,3].map((i) => <Skeleton key={i} style={{ height: 38, width: "100%", marginBottom: 4 }} />)
              ) : (
                (contacts.recent ?? []).map((c, i, arr) => (
                  <div key={c.message_id ?? i} style={{
                    display: "flex", alignItems: "flex-start", gap: 8, padding: "7px 0",
                    borderBottom: i < arr.length - 1 ? `1px solid ${T.slate50}` : "none",
                  }}>
                    <Avatar name={c.first_name} index={i + 3} size={28} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: T.slate800 }}>
                          {c.first_name} {c.last_name}
                        </span>
                        <StatusBadge status={c.status} />
                      </div>
                      <div style={{ fontSize: 10, color: T.slate400, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.message}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

      </main>
    </div>
  );
}