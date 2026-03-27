import { useState, useEffect } from "react";
import AdminNav from '../components/AdminNav';
import api from "../api/axios";

// ── Fetch ───────────────────────────────────────────────────────────────────────
async function fetchDashboard() {
  const { data } = await api.get("/dashboard");
  return data;
}

// ── Formatters ─────────────────────────────────────────────────────────────────
const peso = (v) =>
  "₱" + Number(v ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const num = (v) => Number(v ?? 0).toLocaleString();

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(dateStr).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
};

// ── Charts ─────────────────────────────────────────────────────────────────────
function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.pct, 0) || 1;
  let cumulative = 0;
  const r = 44, cx = 56, cy = 56, stroke = 16, circ = 2 * Math.PI * r;
  return (
    <svg width="112" height="112" viewBox="0 0 112 112">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth={stroke} />
      {data.map((d, i) => {
        const pct = d.pct / total;
        const dash = pct * circ;
        const gap = circ - dash;
        const offset = circ * (1 - cumulative / total);
        cumulative += d.pct;
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color}
            strokeWidth={stroke} strokeDasharray={`${dash} ${gap}`} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transform: "rotate(-90deg)", transformOrigin: "56px 56px", transition: "stroke-dasharray 0.6s ease" }} />
        );
      })}
      <text x="56" y="60" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0F172A" fontFamily="'DM Sans', sans-serif">100%</text>
    </svg>
  );
}

// ── FIX: BarChart — overflow hidden on wrapper, bars capped within container ──
function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 6,
        padding: "0 4px",
        height: 110,
        overflow: "hidden",       // prevent bars from spilling out
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
          {/* spacer pushes bar to bottom */}
          <div style={{ flex: 1 }} />
          <div
            style={{
              width: "100%",
              borderRadius: "4px 4px 0 0",
              background: d.color,
              opacity: 0.85,
              transition: "height 0.7s ease",
              // use percentage of the inner area (110px - 18px label = 92px usable)
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
  const months = [1,2,3,4,5,6,7,8,9,10,11,12];
  const labels  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const thisVals = months.map(m => Number(thisYear[m] ?? 0));
  const lastVals = months.map(m => Number(lastYear[m] ?? 0));
  const max = Math.max(...thisVals, ...lastVals, 1);
  const w = 300, h = 80;

  const coords = (vals) =>
    vals.map((v, i) => ({
      x: (i / (vals.length - 1)) * (w - 20) + 10,
      y: h - (v / max) * (h - 10) - 5,
    }));

  const smoothPath = (pts) => {
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const cp1x = pts[i-1].x + (pts[i].x - pts[i-1].x) / 3;
      const cp1y = pts[i-1].y;
      const cp2x = pts[i].x - (pts[i].x - pts[i-1].x) / 3;
      const cp2y = pts[i].y;
      d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${pts[i].x} ${pts[i].y}`;
    }
    return d;
  };

  const thisPts = coords(thisVals);
  const lastPts = coords(lastVals);
  const d1 = smoothPath(thisPts);
  const d2 = smoothPath(lastPts);

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h + 22}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d1} L ${thisPts[thisPts.length-1].x} ${h} L ${thisPts[0].x} ${h} Z`}
        fill="url(#areaGrad)" />
      <path d={d2} fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="4 3"
        strokeLinecap="round" strokeLinejoin="round" />
      <path d={d1} fill="none" stroke="#3B82F6" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" />
      {thisPts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="white" stroke="#3B82F6" strokeWidth="2" />
        </g>
      ))}
      {labels.map((l, i) => (
        <text key={i} x={thisPts[i].x} y={h + 17} textAnchor="middle" fontSize="9" fill="#94A3B8">{l}</text>
      ))}
    </svg>
  );
}

// ── Design tokens ──────────────────────────────────────────────────────────────
const CHART_COLORS = ["#3B82F6","#10B981","#8B5CF6","#F59E0B","#EC4899","#06B6D4","#EF4444","#14B8A6","#F97316","#6366F1"];

// ── Skeleton ───────────────────────────────────────────────────────────────────
function Skeleton({ className = "", style = {} }) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className}`}
      style={{ background: "linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)", backgroundSize: "200% 100%", ...style }}
    />
  );
}

// ── Badge ──────────────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    Completed: { bg: "#ECFDF5", color: "#059669", label: "Completed" },
    delivered: { bg: "#ECFDF5", color: "#059669", label: "Delivered" },
    on_the_way:{ bg: "#EFF6FF", color: "#2563EB", label: "On the way" },
    ready:     { bg: "#F5F3FF", color: "#7C3AED", label: "Ready" },
    Pending:   { bg: "#FFF7ED", color: "#D97706", label: "Pending" },
    Unpaid:    { bg: "#FEF2F2", color: "#DC2626", label: "Unpaid" },
    Paid:      { bg: "#ECFDF5", color: "#059669", label: "Paid" },
  };
  const s = map[status] ?? { bg: "#F8FAFC", color: "#64748B", label: status };
  return (
    <span style={{
      background: s.bg,
      color: s.color,
      fontSize: 10,
      fontWeight: 600,
      padding: "3px 9px",
      borderRadius: 20,
      whiteSpace: "nowrap",
      letterSpacing: "0.2px",
    }}>
      {s.label}
    </span>
  );
};

// ── Card ───────────────────────────────────────────────────────────────────────
const Card = ({ children, style = {}, className = "" }) => (
  <div
    className={className}
    style={{
      background: "#FFFFFF",
      borderRadius: 16,
      padding: "20px 22px",
      boxShadow: "0 1px 3px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.04)",
      border: "1px solid rgba(226,232,240,0.8)",
      overflow: "hidden",   // FIX: prevent chart content from leaking outside card
      ...style,
    }}
  >
    {children}
  </div>
);

const CardTitle = ({ children, action }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
    <span style={{ fontSize: 13, fontWeight: 600, color: "#374151", letterSpacing: "0.1px" }}>{children}</span>
    {action}
  </div>
);

// ── Stat Card ──────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon, gradient, loading }) => (
  <div style={{
    background: "#FFFFFF",
    borderRadius: 16,
    padding: "18px 20px",
    boxShadow: "0 1px 3px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.04)",
    border: "1px solid rgba(226,232,240,0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
    cursor: "default",
  }}
  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(15,23,42,0.10), 0 8px 24px rgba(15,23,42,0.06)"; }}
  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.04)"; }}
  >
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 4, fontWeight: 500, letterSpacing: "0.3px", textTransform: "uppercase" }}>{label}</div>
      {loading
        ? <Skeleton style={{ height: 28, width: 80, marginBottom: 4 }} />
        : <div style={{ fontSize: 24, fontWeight: 700, color: "#0F172A", lineHeight: 1.1, letterSpacing: "-0.5px" }}>{value}</div>
      }
      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>{sub}</div>
    </div>
    <div style={{
      width: 44, height: 44, borderRadius: 12,
      background: gradient,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 18, flexShrink: 0,
    }}>
      {icon}
    </div>
  </div>
);

// ── Avatar ─────────────────────────────────────────────────────────────────────
const Avatar = ({ name, index, size = 32 }) => {
  const colors = ["#3B82F6","#10B981","#8B5CF6","#F59E0B","#EC4899","#06B6D4","#EF4444"];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: colors[index % colors.length],
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "white", fontSize: size * 0.38, fontWeight: 700,
      flexShrink: 0,
      boxShadow: `0 0 0 2px white, 0 0 0 3px ${colors[index % colors.length]}30`,
    }}>
      {(name?.[0] ?? "?").toUpperCase()}
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchDashboard()
      .then(d => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(e => {
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

  // ── Derived ──────────────────────────────────────────────────────────────────
  const views    = data?.views    ?? {};
  const accounts = data?.accounts ?? {};
  const orders   = data?.orders   ?? {};
  const sales    = data?.sales    ?? {};
  const traffic  = data?.traffic  ?? {};
  const contacts = data?.contacts ?? {};
  const products = data?.products ?? {};
  const notifs   = data?.notifications ?? {};

  const stats = [
    { label: "Total Views",    value: num(views.total_views),        sub: `Today: ${num(views.today_views)}`,       icon: "👁",  gradient: "linear-gradient(135deg, #EFF6FF, #DBEAFE)" },
    { label: "Total Visits",   value: num(views.total_visits),       sub: `Today: ${num(views.today_visits)}`,      icon: "🧭",  gradient: "linear-gradient(135deg, #FFFBEB, #FEF3C7)" },
    { label: "New This Month", value: num(accounts.new_this_month),  sub: `Today: ${num(accounts.new_today)}`,      icon: "👤",  gradient: "linear-gradient(135deg, #ECFDF5, #D1FAE5)" },
    { label: "Total Accounts", value: num(accounts.total),           sub: `Verified: ${num(accounts.verified)}`,   icon: "✅",  gradient: "linear-gradient(135deg, #F5F3FF, #EDE9FE)" },
  ];

  const salesChartData = Object.entries(sales.monthly_chart ?? {}).map(([m, v], i) => ({
    label: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][Number(m)-1] ?? m,
    value: Number(v),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const trafficChartData = Object.entries(traffic.users_by_address ?? {}).slice(0,6).map(([addr, v], i) => ({
    label: addr.length > 8 ? addr.slice(0,8)+"…" : addr,
    value: Number(v),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const marketingData = Object.entries(traffic.revenue_by_address ?? {}).slice(0,5).map(([addr, v], i) => ({
    city: addr,
    pct: Number(v),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));
  const marketingTotal = marketingData.reduce((s, d) => s + d.pct, 0) || 1;
  const marketingWithPct = marketingData.map(d => ({ ...d, pct: parseFloat(((d.pct / marketingTotal) * 100).toFixed(1)) }));

  return (
    // FIX: background changed from #F8FAFC to #F0F7F2 to match AdminProducts
    <div style={{ display: "flex", minHeight: "100vh", background: "#F0F7F2", fontFamily: "'DM Sans', 'Nunito', system-ui, sans-serif" }}>
      <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main style={{ flex: 1, minWidth: 0, padding: "24px 28px", overflowX: "hidden" }}>

        {/* ── Top bar ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <button
            style={{ display: "none", background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#374151", padding: "6px 8px", borderRadius: 8 }}
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >☰</button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: 0, letterSpacing: "-0.4px" }}>Dashboard</h1>
            <p style={{ fontSize: 12, color: "#94A3B8", margin: 0, marginTop: 2 }}>Welcome back — here's what's happening today.</p>
          </div>
          {loading && (
            <span style={{ fontSize: 11, color: "#94A3B8", background: "#F1F5F9", padding: "4px 10px", borderRadius: 20, animation: "pulse 1.5s infinite" }}>
              Loading…
            </span>
          )}
          {error && (
            <span style={{ fontSize: 11, color: "#DC2626", background: "#FEF2F2", padding: "4px 10px", borderRadius: 20 }}>
              ⚠ {error}
            </span>
          )}
        </div>

        {/* ── Stats row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14, marginBottom: 20 }}>
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} loading={loading} />
          ))}
        </div>

        {/* ── Main columns ── */}
        <div style={{ display: "flex", flexDirection: "row", gap: 16, alignItems: "flex-start" }}>

          {/* ── Left column ── */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Line chart */}
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Total Users Overview</span>
                <div style={{ display: "flex", gap: 14, fontSize: 11, color: "#94A3B8" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3B82F6", display: "inline-block" }} />
                    This year
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#CBD5E1", display: "inline-block" }} />
                    Last year
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#3B82F6", fontWeight: 600, marginBottom: 10 }}>New Accounts / Month</div>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", fontSize: 9, color: "#CBD5E1", paddingBottom: 18, gap: 20, paddingTop: 2 }}>
                  <span>Hi</span><span>Mid</span><span>Lo</span>
                </div>
                <div style={{ flex: 1 }}>
                  {loading
                    ? <Skeleton style={{ height: 96, width: "100%" }} />
                    : <LineChart thisYear={accounts.new_per_month ?? {}} lastYear={{}} />
                  }
                </div>
              </div>
            </Card>

            {/* Recent Orders */}
            <Card>
              <CardTitle action={
                <div style={{ fontSize: 11, color: "#94A3B8" }}>
                  Total: <strong style={{ color: "#374151" }}>{num(orders.total)}</strong>
                  <span style={{ margin: "0 5px", color: "#E2E8F0" }}>·</span>
                  Paid: <strong style={{ color: "#059669" }}>{num(orders.paid)}</strong>
                  <span style={{ margin: "0 5px", color: "#E2E8F0" }}>·</span>
                  Unpaid: <strong style={{ color: "#DC2626" }}>{num(orders.unpaid)}</strong>
                </div>
              }>
                Recent Orders
              </CardTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {loading
                  ? [1,2,3,4].map(i => <Skeleton key={i} style={{ height: 56, width: "100%", marginBottom: 8 }} />)
                  : (orders.recent ?? []).map((order, i, arr) => (
                  <div key={order.checkout_id}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 0",
                      borderBottom: i < arr.length - 1 ? "1px solid #F1F5F9" : "none",
                    }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                    }}>🛒</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <span style={{ fontWeight: 600, fontSize: 12, color: "#0F172A" }}>
                          {order.first_name} {order.last_name}
                        </span>
                        <span style={{ fontSize: 10, color: "#94A3B8", flexShrink: 0 }}>{timeAgo(order.created_at)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 3 }}>
                        <span style={{ fontSize: 11, color: "#64748B" }}>
                          {order.paid_at ? peso(order.paid_amount) : "Unpaid"} · {order.payment_method}
                        </span>
                        <StatusBadge status={order.paid_at ? "Paid" : "Unpaid"} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* ── Metric cards grid ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>

              {/* Products */}
              <Card>
                <CardTitle>📦 Products</CardTitle>
                {loading
                  ? <Skeleton style={{ height: 60, width: "100%" }} />
                  : <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px" }}>
                    {[
                      { l: "Total",     v: products.total,     color: "#0F172A"   },
                      { l: "On Sale",   v: products.on_sale,   color: "#059669"   },
                      { l: "Low Stock", v: products.low_stock, color: "#D97706"   },
                      { l: "Out Stock", v: products.out_stock, color: "#DC2626"   },
                    ].map(p => (
                      <div key={p.l}>
                        <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 2 }}>{p.l}</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: p.color, letterSpacing: "-0.5px" }}>{num(p.v)}</div>
                      </div>
                    ))}
                  </div>
                }
              </Card>

              {/* Orders this week */}
              <Card>
                <CardTitle>🛒 Orders · This Week</CardTitle>
                {loading
                  ? <Skeleton style={{ height: 60, width: "100%" }} />
                  : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { l: "Total",  v: orders.weekly_total,  color: "#0F172A" },
                      { l: "Paid",   v: orders.weekly_paid,   color: "#059669" },
                      { l: "Unpaid", v: orders.weekly_unpaid, color: "#DC2626" },
                    ].map(o => (
                      <div key={o.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "#64748B" }}>{o.l}</span>
                        <span style={{ fontSize: 16, fontWeight: 700, color: o.color }}>{num(o.v)}</span>
                      </div>
                    ))}
                  </div>
                }
              </Card>

              {/* Delivery status */}
              <Card>
                <CardTitle>🚚 Delivery Status</CardTitle>
                {loading
                  ? <Skeleton style={{ height: 60, width: "100%" }} />
                  : <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px" }}>
                    {[
                      { l: "Processing", v: orders.processing, color: "#D97706"  },
                      { l: "Ready",      v: orders.ready,      color: "#7C3AED"  },
                      { l: "On the Way", v: orders.on_the_way, color: "#2563EB"  },
                      { l: "Delivered",  v: orders.delivered,  color: "#059669"  },
                    ].map(s => (
                      <div key={s.l}>
                        <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 2 }}>{s.l}</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{num(s.v)}</div>
                      </div>
                    ))}
                  </div>
                }
              </Card>

              {/* Revenue */}
              <Card>
                <CardTitle>💰 Revenue</CardTitle>
                {loading
                  ? <Skeleton style={{ height: 60, width: "100%" }} />
                  : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { l: "Total",      v: peso(sales.total)      },
                      { l: "This Month", v: peso(sales.this_month) },
                      { l: "Today",      v: peso(sales.today)      },
                    ].map(s => (
                      <div key={s.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "#64748B" }}>{s.l}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{s.v}</span>
                      </div>
                    ))}
                  </div>
                }
              </Card>

              {/* Sales bar chart — FIX: explicit height container */}
              <Card>
                <CardTitle>📊 Sales This Year</CardTitle>
                {loading
                  ? <Skeleton style={{ height: 110, width: "100%" }} />
                  : salesChartData.length > 0
                    ? (
                      <div style={{ height: 110, overflow: "hidden" }}>
                        <BarChart data={salesChartData} />
                      </div>
                    )
                    : <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>No sales data yet.</p>
                }
              </Card>

              {/* Traffic bar chart — FIX: explicit height container */}
              <Card>
                <CardTitle>📍 Traffic by Address</CardTitle>
                {loading
                  ? <Skeleton style={{ height: 110, width: "100%" }} />
                  : trafficChartData.length > 0
                    ? (
                      <div style={{ height: 110, overflow: "hidden" }}>
                        <BarChart data={trafficChartData} />
                      </div>
                    )
                    : <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>No traffic data yet.</p>
                }
              </Card>

              {/* Marketing donut — full width */}
              <Card style={{ gridColumn: "1 / -1" }}>
                <CardTitle>🗺 Revenue by Location</CardTitle>
                {loading
                  ? <div style={{ display: "flex", gap: 24 }}>
                      <Skeleton style={{ width: 112, height: 112, borderRadius: "50%" }} />
                      <Skeleton style={{ flex: 1, height: 80 }} />
                    </div>
                  : marketingWithPct.length > 0
                    ? <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
                        <DonutChart data={marketingWithPct} />
                        <div style={{ flex: 1 }}>
                          {marketingWithPct.map((m, i) => (
                            <div key={m.city} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: i < marketingWithPct.length - 1 ? 10 : 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ width: 10, height: 10, borderRadius: "50%", background: m.color, display: "inline-block", flexShrink: 0 }} />
                                <span style={{ fontSize: 12, color: "#374151", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.city}</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 80, height: 4, borderRadius: 4, background: "#F1F5F9", overflow: "hidden" }}>
                                  <div style={{ width: `${m.pct}%`, height: "100%", background: m.color, borderRadius: 4 }} />
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", minWidth: 36, textAlign: "right" }}>{m.pct}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    : <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>No location data yet.</p>
                }
              </Card>

            </div>
          </div>

          {/* ── Right column ── */}
          <div style={{ width: 260, minWidth: 260, display: "flex", flexDirection: "column", gap: 14 }} className="hidden lg:flex">

            {/* Notifications */}
            <Card>
              <CardTitle action={
                notifs.unread > 0 && (
                  <span style={{ fontSize: 10, background: "#FEE2E2", color: "#DC2626", fontWeight: 600, padding: "2px 8px", borderRadius: 20 }}>
                    {notifs.unread} new
                  </span>
                )
              }>
                Notifications
              </CardTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {loading
                  ? [1,2,3].map(i => <Skeleton key={i} style={{ height: 48, width: "100%", marginBottom: 4 }} />)
                  : (notifs.recent ?? []).map((n, i) => (
                  <div key={n.notification_id ?? i}
                    style={{
                      display: "flex", gap: 10, alignItems: "flex-start",
                      padding: "8px 10px",
                      borderRadius: 10,
                      background: !n.is_read ? "#EFF6FF" : "transparent",
                      transition: "background 0.15s",
                    }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                      background: !n.is_read ? "#DBEAFE" : "#F1F5F9",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                    }}>
                      {n.type === "order" ? "🛒" : n.type === "user" ? "👤" : n.type === "product" ? "📦" : "🔔"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#0F172A", lineHeight: 1.3 }}>{n.title}</div>
                      <div style={{ fontSize: 10, color: "#64748B", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.message}</div>
                      <div style={{ fontSize: 10, color: "#CBD5E1", marginTop: 1 }}>{timeAgo(n.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Latest Customers */}
            <Card>
              <CardTitle>Latest Customers</CardTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {loading
                  ? [1,2,3].map(i => <Skeleton key={i} style={{ height: 40, width: "100%", marginBottom: 6 }} />)
                  : (accounts.recent ?? []).map((acc, i) => (
                  <div key={acc.id}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 8px", borderRadius: 10, transition: "background 0.12s", cursor: "default" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <Avatar name={acc.first_name} index={i} size={32} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {acc.first_name} {acc.last_name}
                      </div>
                      <div style={{ fontSize: 10, color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{acc.email}</div>
                    </div>
                    <span style={{
                      fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 20, flexShrink: 0,
                      background: acc.email_verified_at ? "#ECFDF5" : "#F1F5F9",
                      color: acc.email_verified_at ? "#059669" : "#94A3B8",
                    }}>
                      {acc.email_verified_at ? "Verified" : "Unverified"}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Contacts */}
            <Card>
              <CardTitle action={
                <span style={{ fontSize: 11, color: "#94A3B8" }}>
                  Pending: <strong style={{ color: "#D97706" }}>{num(contacts.pending)}</strong>
                </span>
              }>
                Contacts
              </CardTitle>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {loading
                  ? [1,2,3].map(i => <Skeleton key={i} style={{ height: 40, width: "100%", marginBottom: 6 }} />)
                  : (contacts.recent ?? []).map((c, i, arr) => (
                  <div key={c.message_id ?? i}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      padding: "8px 0",
                      borderBottom: i < arr.length - 1 ? "1px solid #F8FAFC" : "none",
                    }}>
                    <Avatar name={c.first_name} index={i + 3} size={30} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#0F172A" }}>{c.first_name} {c.last_name}</span>
                        <span style={{
                          fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 20,
                          background: c.status === "replied" ? "#ECFDF5" : c.status === "read" ? "#EFF6FF" : "#FFFBEB",
                          color: c.status === "replied" ? "#059669" : c.status === "read" ? "#2563EB" : "#D97706",
                        }}>
                          {c.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Products */}
            <Card>
              <CardTitle>📦 Recent Products</CardTitle>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {loading
                  ? [1,2,3].map(i => <Skeleton key={i} style={{ height: 40, width: "100%", marginBottom: 6 }} />)
                  : (products.recent ?? []).map((p, i, arr) => (
                  <div key={p.product_id ?? i}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "8px 0",
                      borderBottom: i < arr.length - 1 ? "1px solid #F8FAFC" : "none",
                    }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                      background: "linear-gradient(135deg, #F0FDF4, #DCFCE7)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                    }}>📦</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.product_name}</div>
                      <div style={{ fontSize: 10, color: "#94A3B8" }}>{peso(p.price)} · Stock: {p.product_stocks}</div>
                    </div>
                    {p.isSale && (
                      <span style={{ fontSize: 9, background: "#FEE2E2", color: "#DC2626", fontWeight: 700, padding: "2px 6px", borderRadius: 20, flexShrink: 0 }}>SALE</span>
                    )}
                  </div>
                ))}
              </div>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
}