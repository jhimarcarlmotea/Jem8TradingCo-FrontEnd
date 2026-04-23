import { useState, useEffect, useRef } from "react";
import AdminNav from "../components/AdminNav";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
// ── Fetch ───────────────────────────────────────────────────────────────────────
async function fetchDashboard() {
  const { data } = await api.get("/dashboard");
  return data;
}
  async function markNotificationRead(id) {
  await api.patch(`/notifications/${id}/read`);
}
// ── Formatters ──────────────────────────────────────────────────────────────────
const peso = (v) =>
  "₱" +
  Number(v ?? 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const num = (v) => Number(v ?? 0).toLocaleString();

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(dateStr).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
};

// ── Design tokens ───────────────────────────────────────────────────────────────
const CHART_COLORS = [
  "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B",
  "#EC4899", "#06B6D4", "#EF4444", "#14B8A6",
  "#F97316", "#6366F1",
];

// ── Skeleton ────────────────────────────────────────────────────────────────────
function Skeleton({ style = {} }) {
  return (
    <div
      style={{
        background: "linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)",
        backgroundSize: "200% 100%",
        borderRadius: 10,
        animation: "skeletonPulse 1.5s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

// ── Badge ───────────────────────────────────────────────────────────────────────
const STATUS_MAP = {
  Completed:  { bg: "#ECFDF5", color: "#059669", label: "Completed" },
  delivered:  { bg: "#ECFDF5", color: "#059669", label: "Delivered" },
  on_the_way: { bg: "#EFF6FF", color: "#2563EB", label: "On the way" },
  ready:      { bg: "#F5F3FF", color: "#7C3AED", label: "Ready" },
  Pending:    { bg: "#FFF7ED", color: "#D97706", label: "Pending" },
  Unpaid:     { bg: "#FEF2F2", color: "#DC2626", label: "Unpaid" },
  Paid:       { bg: "#ECFDF5", color: "#059669", label: "Paid" },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] ?? { bg: "#F8FAFC", color: "#64748B", label: status };
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        fontSize: 10,
        fontWeight: 600,
        padding: "3px 9px",
        borderRadius: 20,
        whiteSpace: "nowrap",
        letterSpacing: "0.2px",
        flexShrink: 0,
      }}
    >
      {s.label}
    </span>
  );
};

// ── Card ────────────────────────────────────────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <div
    style={{
      background: "#FFFFFF",
      borderRadius: 16,
      padding: "16px 18px",
      boxShadow:
        "0 1px 3px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.04)",
      border: "1px solid rgba(226,232,240,0.8)",
      overflow: "hidden",
      ...style,
    }}
  >
    {children}
  </div>
);

const CardTitle = ({ children, action }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
      flexWrap: "wrap",
      gap: 6,
    }}
  >
    <span
      style={{ fontSize: 12, fontWeight: 600, color: "#374151", letterSpacing: "0.1px" }}
    >
      {children}
    </span>
    {action}
  </div>
);

// ── Stat Card ───────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, gradient, loading }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#FFFFFF",
        borderRadius: 16,
        padding: "16px 18px",
        boxShadow: hovered
          ? "0 4px 12px rgba(15,23,42,0.10), 0 8px 24px rgba(15,23,42,0.06)"
          : "0 1px 3px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.04)",
        border: "1px solid rgba(226,232,240,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        cursor: "default",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 10,
            color: "#94A3B8",
            marginBottom: 3,
            fontWeight: 500,
            letterSpacing: "0.3px",
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>
        {loading ? (
          <Skeleton style={{ height: 24, width: 70, marginBottom: 3 }} />
        ) : (
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#0F172A",
              lineHeight: 1.1,
              letterSpacing: "-0.5px",
            }}
          >
            {value}
          </div>
        )}
        <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 3 }}>{sub}</div>
      </div>
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: gradient,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
    </div>
  );
}

// ── Avatar ──────────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B",
  "#EC4899", "#06B6D4", "#EF4444",
];

const Avatar = ({ name, index, size = 32 }) => {
  const bg = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: Math.round(size * 0.38),
        fontWeight: 700,
        flexShrink: 0,
        boxShadow: `0 0 0 2px white, 0 0 0 3px ${bg}30`,
      }}
    >
      {(name?.[0] ?? "?").toUpperCase()}
    </div>
  );
};

// ── Charts ──────────────────────────────────────────────────────────────────────
function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.pct, 0) || 1;
  let cumulative = 0;
  const r = 44, cx = 56, cy = 56, stroke = 16;
  const circ = 2 * Math.PI * r;
  return (
    <svg width="112" height="112" viewBox="0 0 112 112" style={{ flexShrink: 0 }}>
      <circle
        cx={cx} cy={cy} r={r}
        fill="none" stroke="#F1F5F9" strokeWidth={stroke}
      />
      {data.map((d, i) => {
        const pct = d.pct / total;
        const dash = pct * circ;
        const gap = circ - dash;
        const offset = circ * (1 - cumulative / total);
        cumulative += d.pct;
        return (
          <circle
            key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={d.color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "56px 56px",
              transition: "stroke-dasharray 0.6s ease",
            }}
          />
        );
      })}
      <text
        x="56" y="60"
        textAnchor="middle"
        fontSize="12"
        fontWeight="700"
        fill="#0F172A"
        fontFamily="'DM Sans', sans-serif"
      >
        100%
      </text>
    </svg>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 6,
        padding: "0 4px",
        height: 110,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {data.map((d, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            height: "100%",
            minWidth: 0,
          }}
        >
          <div style={{ flex: 1 }} />
          <div
            style={{
              width: "100%",
              borderRadius: "4px 4px 0 0",
              background: d.color,
              opacity: 0.85,
              transition: "height 0.7s ease",
              height: `${Math.max(4, (d.value / max) * 92)}px`,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 9,
              color: "#94A3B8",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "100%",
              height: 14,
              lineHeight: "14px",
              flexShrink: 0,
            }}
          >
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function LineChart({ thisYear = {}, lastYear = {} }) {
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const thisVals = months.map((m) => Number(thisYear[m] ?? 0));
  const lastVals = months.map((m) => Number(lastYear[m] ?? 0));
  const max = Math.max(...thisVals, ...lastVals, 1);

  const vw = 500, vh = 120;
  const padL = 10, padR = 10, padT = 10, padB = 22;
  const chartW = vw - padL - padR;
  const chartH = vh - padT - padB;

  const coords = (vals) =>
    vals.map((v, i) => ({
      x: padL + (i / (vals.length - 1)) * chartW,
      y: padT + chartH - (v / max) * chartH,
    }));

  const smoothPath = (pts) => {
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const cp1x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) / 3;
      const cp1y = pts[i - 1].y;
      const cp2x = pts[i].x - (pts[i].x - pts[i - 1].x) / 3;
      const cp2y = pts[i].y;
      d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${pts[i].x} ${pts[i].y}`;
    }
    return d;
  };

  const thisPts = coords(thisVals);
  const lastPts = coords(lastVals);
  const d1 = smoothPath(thisPts);
  const d2 = smoothPath(lastPts);
  const areaBottom = padT + chartH;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${vw} ${vh}`}
      style={{ display: "block" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="areaGrad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </linearGradient>
        <clipPath id="chartClip2">
          <rect x={padL} y={padT} width={chartW} height={chartH} />
        </clipPath>
      </defs>

      {[0, 0.5, 1].map((pct, i) => (
        <line
          key={i}
          x1={padL} x2={padL + chartW}
          y1={padT + chartH * (1 - pct)}
          y2={padT + chartH * (1 - pct)}
          stroke="#F1F5F9" strokeWidth="1"
        />
      ))}

      <path
        d={`${d1} L ${thisPts[thisPts.length - 1].x} ${areaBottom} L ${thisPts[0].x} ${areaBottom} Z`}
        fill="url(#areaGrad2)"
        clipPath="url(#chartClip2)"
      />
      <path
        d={d2}
        fill="none"
        stroke="#CBD5E1"
        strokeWidth="1.2"
        strokeDasharray="3 2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={d1}
        fill="none"
        stroke="#3B82F6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {thisPts.map((p, i) => (
        <circle
          key={i} cx={p.x} cy={p.y} r="3"
          fill="white" stroke="#3B82F6" strokeWidth="1.8"
        />
      ))}
      {labels.map((l, i) => (
        <text
          key={i}
          x={thisPts[i].x}
          y={vh - 5}
          textAnchor="middle"
          fontSize="9"
          fill="#94A3B8"
          fontFamily="'DM Sans', sans-serif"
        >
          {l}
        </text>
      ))}
    </svg>
  );
}

// ── Icons ───────────────────────────────────────────────────────────────────────
const HamburgerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="2" y="4"  width="16" height="2" rx="1" fill="#374151" />
    <rect x="2" y="9"  width="16" height="2" rx="1" fill="#374151" />
    <rect x="2" y="14" width="16" height="2" rx="1" fill="#374151" />
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M2 2L16 16M16 2L2 16" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// ── Mobile Drawer ───────────────────────────────────────────────────────────────
function MobileDrawer({ open, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15,23,42,0.45)",
          zIndex: 998,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      />
      {/* Drawer panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 270,
          zIndex: 999,
          background: "#FFFFFF",
          boxShadow: "4px 0 24px rgba(15,23,42,0.12)",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 18px",
            borderBottom: "1px solid rgba(226,232,240,0.8)",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.3px" }}>
            Admin Panel
          </span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            style={{
              background: "#F1F5F9",
              border: "none",
              borderRadius: 8,
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <CloseIcon />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <AdminNav
            sidebarOpen={true}
            setSidebarOpen={() => {}}
            inDrawer={true}
            onClose={onClose}
          />
        </div>
      </div>
    </>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [readIds, setReadIds] = useState(new Set());
  const navigate = useNavigate();
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchDashboard()
      .then((d) => {
        if (!cancelled) { setData(d); setLoading(false); }
      })
      .catch((e) => {
        if (!cancelled) {
          const msg =
            e.response?.status === 401
              ? "Unauthorized — please log in again."
              : e.response?.data?.message ?? e.message ?? "Failed to load dashboard.";
          setError(msg);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  // ── Derived data ──────────────────────────────────────────────────────────────
  const views    = data?.views    ?? {};
  const accounts = data?.accounts ?? {};
  const orders   = data?.orders   ?? {};
  const sales    = data?.sales    ?? {};
  const traffic  = data?.traffic  ?? {};
  const contacts = data?.contacts ?? {};
  const products = data?.products ?? {};
  const notifs   = data?.notifications ?? {};

  const stats = [
    {
      label: "Total Views",
      value: num(views.total_views),
      sub:   `Today: ${num(views.today_views)}`,
      icon:  "👁",
      gradient: "linear-gradient(135deg,#EFF6FF,#DBEAFE)",
    },
    {
      label: "Total Visits",
      value: num(views.total_visits),
      sub:   `Today: ${num(views.today_visits)}`,
      icon:  "🧭",
      gradient: "linear-gradient(135deg,#FFFBEB,#FEF3C7)",
    },
    {
      label: "New This Month",
      value: num(accounts.new_this_month),
      sub:   `Today: ${num(accounts.new_today)}`,
      icon:  "👤",
      gradient: "linear-gradient(135deg,#ECFDF5,#D1FAE5)",
    },
    {
      label: "Total Accounts",
      value: num(accounts.total),
      sub:   `Verified: ${num(accounts.verified)}`,
      icon:  "✅",
      gradient: "linear-gradient(135deg,#F5F3FF,#EDE9FE)",
    },
  ];

  const salesChartData = Object.entries(sales.monthly_chart ?? {}).map(
    ([m, v], i) => ({
      label: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][Number(m) - 1] ?? m,
      value: Number(v),
      color: CHART_COLORS[i % CHART_COLORS.length],
    })
  );

  const marketingRaw = Object.entries(traffic.revenue_by_address ?? {})
    .slice(0, 5)
    .map(([city, v], i) => ({ city, pct: Number(v), color: CHART_COLORS[i] }));
  const marketingTotal = marketingRaw.reduce((s, d) => s + d.pct, 0) || 1;
  const marketingData = marketingRaw.map((d) => ({
    ...d,
    pct: parseFloat(((d.pct / marketingTotal) * 100).toFixed(1)),
  }));

  // ── Notification icon map ─────────────────────────────────────────────────────
  const notifIconMap = {
    order:   { icon: "🛒", bg: "#EFF6FF", dot: "#3B82F6" },
    user:    { icon: "👤", bg: "#ECFDF5", dot: "#10B981" },
    product: { icon: "📦", bg: "#F5F3FF", dot: "#8B5CF6" },
    contact: { icon: "✉️", bg: "#FFFBEB", dot: "#F59E0B" },
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#F0F7F2",
        fontFamily: "'DM Sans','Nunito',system-ui,sans-serif",
      }}
    >
      <style>{`
        @keyframes skeletonPulse {
          0%,100% { opacity:1; }
          50%      { opacity:0.5; }
        }

        /* ── Sidebar: show only on lg+ ── */
        .admin-sidebar {
          display: none;
        }
        @media (min-width: 1024px) {
          .admin-sidebar {
            display: block;
          }
        }

        /* ── Hamburger: hide on lg+ ── */
        .admin-hamburger {
          display: flex;
        }
        @media (min-width: 1024px) {
          .admin-hamburger {
            display: none !important;
          }
        }

        /* ── Stats grid ── */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 16px;
        }
        @media (min-width: 640px) {
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
          }
        }

        /* ── Main columns ── */
        .dashboard-columns {
          display: flex;
          flex-direction: column;
          gap: 14px;
          align-items: flex-start;
          width: 100%;
        }
        @media (min-width: 1024px) {
          .dashboard-columns {
            flex-direction: row;
          }
        }

        /* ── Right column: always visible, full-width on mobile, fixed on desktop ── */
        .dashboard-right-col {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex-shrink: 0;
        }
        @media (min-width: 1024px) {
          .dashboard-right-col {
            width: 248px;
            min-width: 248px;
          }
        }

        /* ── Metrics grid ── */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (min-width: 768px) {
          .metrics-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        /* ── Sales + Revenue row ── */
        .sales-revenue-grid {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media (min-width: 640px) {
          .sales-revenue-grid {
            grid-template-columns: 1fr 1.6fr;
          }
        }

        /* ── Padding ── */
        .dashboard-main {
          padding: 16px 14px;
        }
        @media (min-width: 640px) {
          .dashboard-main {
            padding: 20px 24px;
          }
        }

        /* ── Hover rows ── */
        .hover-row:hover {
          background: #F8FAFC;
        }
      `}</style>

      {/* ── Desktop Sidebar ── */}
      <div className="admin-sidebar">
        <AdminNav sidebarOpen={true} setSidebarOpen={() => {}} />
      </div>

      {/* ── Mobile / Tablet Drawer ── */}
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* ── Main content ── */}
      <main className="dashboard-main" style={{ flex: 1, minWidth: 0, overflowX: "hidden" }}>

        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button
            onClick={() => setDrawerOpen(true)}
            className="admin-hamburger"
            aria-label="Open navigation menu"
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(226,232,240,0.8)",
              borderRadius: 10,
              width: 38,
              height: 38,
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              boxShadow: "0 1px 3px rgba(15,23,42,0.06)",
            }}
          >
            <HamburgerIcon />
          </button>

          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#0F172A",
                margin: 0,
                letterSpacing: "-0.4px",
              }}
            >
              Dashboard
            </h1>
            <p style={{ fontSize: 11, color: "#94A3B8", margin: 0, marginTop: 1 }}>
              Welcome back — here's what's happening today.
            </p>
          </div>

          {loading && (
            <span
              style={{
                fontSize: 11,
                color: "#94A3B8",
                background: "#F1F5F9",
                padding: "4px 10px",
                borderRadius: 20,
              }}
            >
              Loading…
            </span>
          )}
          {error && (
            <span
              style={{
                fontSize: 11,
                color: "#DC2626",
                background: "#FEF2F2",
                padding: "4px 10px",
                borderRadius: 20,
              }}
            >
              ⚠ {error}
            </span>
          )}
        </div>

        {/* Stats row */}
        <div className="stats-grid">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} loading={loading} />
          ))}
        </div>

        {/* Main columns */}
        <div className="dashboard-columns">

          {/* ── Left column ── */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Line chart */}
            <Card style={{ padding: "14px 16px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                  flexWrap: "wrap",
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                  Total Users Overview
                </span>
                <div style={{ display: "flex", gap: 12, fontSize: 10, color: "#94A3B8" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span
                      style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: "#3B82F6", display: "inline-block",
                      }}
                    />
                    This year
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span
                      style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: "#CBD5E1", display: "inline-block",
                      }}
                    />
                    Last year
                  </span>
                </div>
              </div>
              <div
                style={{ fontSize: 10, color: "#3B82F6", fontWeight: 600, marginBottom: 6 }}
              >
                New Accounts / Month
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "stretch" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    fontSize: 8,
                    color: "#CBD5E1",
                    paddingBottom: 16,
                    paddingTop: 4,
                    flexShrink: 0,
                    width: 18,
                  }}
                >
                  <span>Hi</span>
                  <span>Mid</span>
                  <span>Lo</span>
                </div>
                <div style={{ flex: 1, minWidth: 0, height: 130 }}>
                  {loading ? (
                    <Skeleton style={{ height: "100%", width: "100%" }} />
                  ) : (
                    <LineChart
                      thisYear={accounts.new_per_month ?? {}}
                      lastYear={{}}
                    />
                  )}
                </div>
              </div>
            </Card>

            {/* Recent Orders */}
            <Card>
              <CardTitle
                action={
                  <div style={{ fontSize: 10, color: "#94A3B8" }}>
                    Total:{" "}
                    <strong style={{ color: "#374151" }}>{num(orders.total)}</strong>
                    <span style={{ margin: "0 4px", color: "#E2E8F0" }}>·</span>
                    Paid:{" "}
                    <strong style={{ color: "#059669" }}>{num(orders.paid)}</strong>
                    <span style={{ margin: "0 4px", color: "#E2E8F0" }}>·</span>
                    Unpaid:{" "}
                    <strong style={{ color: "#DC2626" }}>{num(orders.unpaid)}</strong>
                  </div>
                }
              >
                Recent Orders
              </CardTitle>

              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {loading
                  ? [1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} style={{ height: 52, width: "100%", marginBottom: 6 }} />
                    ))
                  : (orders.recent ?? []).map((order, i, arr) => (
                      <div
                        key={order.checkout_id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 0",
                          borderBottom:
                            i < arr.length - 1 ? "1px solid #F1F5F9" : "none",
                        }}
                      >
                        <div
                          style={{
                            width: 36, height: 36,
                            borderRadius: 9, flexShrink: 0,
                            background: "linear-gradient(135deg,#EFF6FF,#DBEAFE)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 16,
                          }}
                        >
                          🛒
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                            }}
                          >
                            <span style={{ fontWeight: 600, fontSize: 11, color: "#0F172A" }}>
                              {order.first_name} {order.last_name}
                            </span>
                            <span
                              style={{ fontSize: 10, color: "#94A3B8", flexShrink: 0 }}
                            >
                              {timeAgo(order.created_at)}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginTop: 2,
                            }}
                          >
                            <span style={{ fontSize: 10, color: "#64748B" }}>
                              {order.paid_at
                                ? peso(order.paid_amount)
                                : "Unpaid"}{" "}
                              · {order.payment_method}
                            </span>
                            <StatusBadge status={order.paid_at ? "Paid" : "Unpaid"} />
                          </div>
                        </div>
                      </div>
                    ))}
              </div>
            </Card>

            {/* Metrics cards grid */}
            <div className="metrics-grid">

              {/* Products */}
              <Card>
                <CardTitle>📦 Products</CardTitle>
                {loading ? (
                  <Skeleton style={{ height: 56, width: "100%" }} />
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "8px 14px",
                    }}
                  >
                    {[
                      { l: "Total",     v: products.total,     color: "#0F172A" },
                      { l: "On Sale",   v: products.on_sale,   color: "#059669" },
                      { l: "In Stock",  v: products.in_stock,  color: "#16a34a" },
                      { l: "Pre-Order", v: products.pre_order, color: "#7C3AED" },
                    ].map((p) => (
                      <div key={p.l}>
                        <div
                          style={{
                            fontSize: 9,
                            color: "#94A3B8",
                            fontWeight: 500,
                            textTransform: "uppercase",
                            letterSpacing: "0.3px",
                            marginBottom: 1,
                          }}
                        >
                          {p.l}
                        </div>
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 700,
                            color: p.color,
                            letterSpacing: "-0.5px",
                          }}
                        >
                          {num(p.v)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Orders this week */}
              <Card>
                <CardTitle>🛒 Orders · This Week</CardTitle>
                {loading ? (
                  <Skeleton style={{ height: 56, width: "100%" }} />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {[
                      { l: "Total",  v: orders.weekly_total,  color: "#0F172A" },
                      { l: "Paid",   v: orders.weekly_paid,   color: "#059669" },
                      { l: "Unpaid", v: orders.weekly_unpaid, color: "#DC2626" },
                    ].map((o) => (
                      <div
                        key={o.l}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontSize: 10, color: "#64748B" }}>{o.l}</span>
                        <span
                          style={{ fontSize: 15, fontWeight: 700, color: o.color }}
                        >
                          {num(o.v)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Delivery status */}
              <Card>
                <CardTitle>🚚 Delivery Status</CardTitle>
                {loading ? (
                  <Skeleton style={{ height: 56, width: "100%" }} />
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "8px 14px",
                    }}
                  >
                    {[
                      { l: "Processing", v: orders.processing, color: "#D97706" },
                      { l: "Ready",      v: orders.ready,      color: "#7C3AED" },
                      { l: "On the Way", v: orders.on_the_way, color: "#2563EB" },
                      { l: "Delivered",  v: orders.delivered,  color: "#059669" },
                    ].map((s) => (
                      <div key={s.l}>
                        <div
                          style={{
                            fontSize: 9,
                            color: "#94A3B8",
                            fontWeight: 500,
                            textTransform: "uppercase",
                            letterSpacing: "0.3px",
                            marginBottom: 1,
                          }}
                        >
                          {s.l}
                        </div>
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 700,
                            color: s.color,
                          }}
                        >
                          {num(s.v)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Revenue */}
              <Card>
                <CardTitle>💰 Revenue</CardTitle>
                {loading ? (
                  <Skeleton style={{ height: 56, width: "100%" }} />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {[
                      { l: "Total",      v: peso(sales.total)      },
                      { l: "This Month", v: peso(sales.this_month) },
                      { l: "Today",      v: peso(sales.today)      },
                    ].map((s) => (
                      <div
                        key={s.l}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontSize: 10, color: "#64748B" }}>{s.l}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>
                          {s.v}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Sales chart + Revenue by Location — full-width row */}
              <div className="sales-revenue-grid">
                <Card style={{ margin: 0 }}>
                  <CardTitle>📊 Sales This Year</CardTitle>
                  {loading ? (
                    <Skeleton style={{ height: 180, width: "100%" }} />
                  ) : salesChartData.length > 0 ? (
                    <div style={{ height: 180, overflow: "hidden", paddingTop: 40 }}>
                      <BarChart data={salesChartData} />
                    </div>
                  ) : (
                    <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>
                      No sales data yet.
                    </p>
                  )}
                </Card>

                <Card style={{ margin: 0 }}>
                  <CardTitle>🗺 Revenue by Location</CardTitle>
                  {loading ? (
                    <div style={{ display: "flex", gap: 24 }}>
                      <Skeleton style={{ width: 112, height: 112, borderRadius: "50%" }} />
                      <Skeleton style={{ flex: 1, height: 80 }} />
                    </div>
                  ) : marketingData.length > 0 ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
                      <DonutChart data={marketingData} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {marketingData.map((m, i) => (
                          <div
                            key={m.city}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: i < marketingData.length - 1 ? 12 : 0,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                minWidth: 0,
                                flex: 1,
                              }}
                            >
                              <span
                                style={{
                                  width: 9, height: 9,
                                  borderRadius: "50%",
                                  background: m.color,
                                  display: "inline-block",
                                  flexShrink: 0,
                                }}
                              />
                              <span
                                style={{
                                  fontSize: 12,
                                  color: "#374151",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {m.city}
                              </span>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                flexShrink: 0,
                              }}
                            >
                              <div
                                style={{
                                  width: 120,
                                  height: 5,
                                  borderRadius: 4,
                                  background: "#F1F5F9",
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    width: `${m.pct}%`,
                                    height: "100%",
                                    background: m.color,
                                    borderRadius: 4,
                                  }}
                                />
                              </div>
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: "#0F172A",
                                  minWidth: 38,
                                  textAlign: "right",
                                }}
                              >
                                {m.pct}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>
                      No location data yet.
                    </p>
                  )}
                </Card>
              </div>
            </div>
            {/* end metrics-grid */}
          </div>
          {/* end left-col */}

          {/* ── Right column (desktop only) ── */}
          <div className="dashboard-right-col">

            {/* Notifications */}
<Card>
  <CardTitle
    action={
      (() => {
        const unreadCount = (notifs.recent ?? []).filter(
          (n) => !n.is_read && !readIds.has(n.notification_id)
        ).length;
        return unreadCount > 0 ? (
          <span
            style={{
              fontSize: 9,
              background: "#FEE2E2",
              color: "#DC2626",
              fontWeight: 600,
              padding: "2px 7px",
              borderRadius: 20,
            }}
          >
            {unreadCount} new
          </span>
        ) : null;
      })()
    }
  >
    Notifications
  </CardTitle>

  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    {loading ? (
      [1, 2, 3].map((i) => (
        <Skeleton key={i} style={{ height: 60, width: "100%", marginBottom: 3 }} />
      ))
    ) : (notifs.recent ?? []).length === 0 ? (
      <p style={{ fontSize: 11, color: "#94A3B8", margin: "8px 0" }}>
        No notifications yet.
      </p>
    ) : (
      (notifs.recent ?? []).map((n, i) => {
        const s =
          notifIconMap[n.type] ?? {
            icon: "🔔",
            bg: "#F1F5F9",
            dot: "#94A3B8",
          };
        const isUnread = !n.is_read && !readIds.has(n.notification_id);

        const handleNotifClick = async () => {
  // Mark as read locally immediately
  if (isUnread) {
    setReadIds((prev) => new Set([...prev, n.notification_id]));
    try {
      await markNotificationRead(n.notification_id);
    } catch (e) {
      console.error("Failed to mark notification as read", e);
    }
  }

 const routes = {
  order:   "/adminOrders",
  user:    "/adminAccountmanagement",
  product: "/adminProducts",
  contact: "/adminContact",
};

const path = routes[n.type];
if (path) navigate(path); 
};

        return (
          <div
            key={n.notification_id ?? i}
            onClick={handleNotifClick}
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
              padding: "8px",
              borderRadius: 10,
              background: isUnread ? s.bg : "transparent",
              transition: "background 0.15s",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 32, height: 32,
                borderRadius: 8, flexShrink: 0,
                background: isUnread ? s.bg : "#F1F5F9",
                border: `1.5px solid ${isUnread ? s.dot + "33" : "#E2E8F0"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 15,
                marginTop: 1,
              }}
            >
              {s.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 4,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#0F172A",
                    lineHeight: 1.3,
                  }}
                >
                  {n.title}
                </div>
                {isUnread && (
                  <span
                    style={{
                      width: 6, height: 6,
                      borderRadius: "50%",
                      background: s.dot,
                      flexShrink: 0,
                      marginTop: 4,
                    }}
                  />
                )}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "#64748B",
                  marginTop: 2,
                  lineHeight: 1.4,
                  wordBreak: "break-word",
                  whiteSpace: "normal",
                }}
              >
                {n.message}
              </div>
              <div style={{ fontSize: 9, color: "#CBD5E1", marginTop: 3 }}>
                {timeAgo(n.created_at)}
              </div>
            </div>
          </div>
        );
      })
    )}
  </div>
</Card>

            {/* Latest Customers */}
            <Card>
              <CardTitle>Latest Customers</CardTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {loading ? (
                  [1, 2, 3].map((i) => (
                    <Skeleton key={i} style={{ height: 38, width: "100%", marginBottom: 4 }} />
                  ))
                ) : (
                  (accounts.recent ?? []).map((acc, i) => (
                    <div
                      key={acc.id}
                      className="hover-row"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px",
                        borderRadius: 9,
                        cursor: "default",
                        transition: "background 0.12s",
                      }}
                    >
                      <Avatar name={acc.first_name} index={i} size={30} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#0F172A",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {acc.first_name} {acc.last_name}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: "#94A3B8",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {acc.email}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 600,
                          padding: "2px 6px",
                          borderRadius: 20,
                          flexShrink: 0,
                          background: acc.email_verified_at ? "#ECFDF5" : "#F1F5F9",
                          color: acc.email_verified_at ? "#059669" : "#94A3B8",
                        }}
                      >
                        {acc.email_verified_at ? "Verified" : "Unverified"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Recent Contacts */}
            <Card>
              <CardTitle
                action={
                  <span style={{ fontSize: 10, color: "#94A3B8" }}>
                    Pending:{" "}
                    <strong style={{ color: "#D97706" }}>{num(contacts.pending)}</strong>
                  </span>
                }
              >
                Contacts
              </CardTitle>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {loading ? (
                  [1, 2, 3].map((i) => (
                    <Skeleton key={i} style={{ height: 38, width: "100%", marginBottom: 4 }} />
                  ))
                ) : (
                  (contacts.recent ?? []).map((c, i, arr) => (
                    <div
                      key={c.message_id ?? i}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                        padding: "7px 0",
                        borderBottom:
                          i < arr.length - 1 ? "1px solid #F8FAFC" : "none",
                      }}
                    >
                      <Avatar name={c.first_name} index={i + 3} size={28} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#0F172A" }}>
                            {c.first_name} {c.last_name}
                          </span>
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 600,
                              padding: "2px 5px",
                              borderRadius: 20,
                              background:
                                c.status === "replied"
                                  ? "#ECFDF5"
                                  : c.status === "read"
                                  ? "#EFF6FF"
                                  : "#FFFBEB",
                              color:
                                c.status === "replied"
                                  ? "#059669"
                                  : c.status === "read"
                                  ? "#2563EB"
                                  : "#D97706",
                            }}
                          >
                            {c.status}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: "#94A3B8",
                            marginTop: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {c.message}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Recent Products */}
            <Card>
              <CardTitle>📦 Recent Products</CardTitle>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {loading ? (
                  [1, 2, 3].map((i) => (
                    <Skeleton key={i} style={{ height: 38, width: "100%", marginBottom: 4 }} />
                  ))
                ) : (
                  (products.recent ?? []).map((p, i, arr) => (
                    <div
                      key={p.product_id ?? i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "7px 0",
                        borderBottom:
                          i < arr.length - 1 ? "1px solid #F8FAFC" : "none",
                      }}
                    >
                      <div
                        style={{
                          width: 30, height: 30,
                          borderRadius: 7, flexShrink: 0,
                          background: "linear-gradient(135deg,#F0FDF4,#DCFCE7)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                        }}
                      >
                        📦
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#0F172A",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {p.product_name}
                        </div>
                        <div style={{ fontSize: 10, color: "#94A3B8" }}>{peso(p.price)}</div>
                      </div>
                      {p.isSale && (
                        <span
                          style={{
                            fontSize: 9,
                            background: "#FEE2E2",
                            color: "#DC2626",
                            fontWeight: 700,
                            padding: "2px 5px",
                            borderRadius: 20,
                            flexShrink: 0,
                          }}
                        >
                          SALE
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>

          </div>
          {/* end right-col */}

        </div>
        {/* end dashboard-columns */}

      </main>
    </div>
  );
}