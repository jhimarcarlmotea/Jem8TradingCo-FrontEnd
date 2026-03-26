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
  if (m < 60) return `${m} minutes ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hours ago`;
  return new Date(dateStr).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
};

// ── Charts ─────────────────────────────────────────────────────────────────────
function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.pct, 0) || 1;
  let cumulative = 0;
  const r = 45, cx = 55, cy = 55, stroke = 18, circ = 2 * Math.PI * r;
  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      {data.map((d, i) => {
        const pct = d.pct / total;
        const dash = pct * circ;
        const gap = circ - dash;
        const offset = circ * (1 - cumulative / total);
        cumulative += d.pct;
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color}
            strokeWidth={stroke} strokeDasharray={`${dash} ${gap}`} strokeDashoffset={offset}
            style={{ transform: "rotate(-90deg)", transformOrigin: "55px 55px" }} />
        );
      })}
      <text x="55" y="59" textAnchor="middle" fontSize="11" fontWeight="700" fill="#111827">100%</text>
    </svg>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end h-[120px] gap-2 px-1">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full">
          <div className="flex-1 w-full flex items-end">
            <div className="w-full rounded-t-sm transition-all duration-500"
              style={{ height: `${(d.value / max) * 100}%`, background: d.color, minHeight: "4px" }} />
          </div>
          <span className="text-[10px] text-gray-400 whitespace-nowrap">{d.label}</span>
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

  const path = (pts) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const thisPts = coords(thisVals);
  const lastPts = coords(lastVals);
  const d1 = path(thisPts);
  const d2 = path(lastPts);

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h + 20}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Area fill for this year */}
      <path d={`${d1} L ${thisPts[thisPts.length-1].x} ${h} L ${thisPts[0].x} ${h} Z`}
        fill="url(#lineGrad)" />
      {/* Last year line */}
      <path d={d2} fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeDasharray="4 3"
        strokeLinecap="round" strokeLinejoin="round" />
      {/* This year line */}
      <path d={d1} fill="none" stroke="#3B82F6" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" />
      {thisPts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#3B82F6" />
      ))}
      {labels.map((l, i) => (
        <text key={i} x={thisPts[i].x} y={h + 16} textAnchor="middle" fontSize="9" fill="#9CA3AF">{l}</text>
      ))}
    </svg>
  );
}

// ── Shared helpers ─────────────────────────────────────────────────────────────
const cardCls  = "bg-white rounded-2xl shadow-sm p-5";
const titleCls = "text-sm font-semibold text-gray-700 mb-4";
const badgeCls = (status) =>
  `px-2.5 py-0.5 rounded-full text-[11px] font-semibold inline-block
   ${status === "Completed" || status === "delivered"
     ? "bg-emerald-100 text-emerald-600"
     : status === "on_the_way"
     ? "bg-blue-100 text-blue-600"
     : status === "ready"
     ? "bg-violet-100 text-violet-600"
     : "bg-red-100 text-red-600"}`;

const CHART_COLORS = ["#06B6D4","#10B981","#3B82F6","#8B5CF6","#EC4899","#F59E0B","#EF4444","#14B8A6","#F97316","#6366F1"];

// ── Skeleton loader ────────────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-gray-100 rounded-lg ${className}`} />;
}

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

  // ── Derived data ─────────────────────────────────────────────────────────────
  const views    = data?.views    ?? {};
  const accounts = data?.accounts ?? {};
  const orders   = data?.orders   ?? {};
  const sales    = data?.sales    ?? {};
  const traffic  = data?.traffic  ?? {};
  const contacts = data?.contacts ?? {};
  const products = data?.products ?? {};
  const notifs   = data?.notifications ?? {};

  // Stats cards
  const stats = [
    { label: "Total Views",    value: num(views.total_views),   sub: `Today: ${num(views.today_views)}`,   accent: "text-blue-600",    bg: "bg-blue-50"    },
    { label: "Total Visits",   value: num(views.total_visits),  sub: `Today: ${num(views.today_visits)}`,  accent: "text-amber-600",   bg: "bg-amber-50"   },
    { label: "New This Month", value: num(accounts.new_this_month), sub: `Today: ${num(accounts.new_today)}`, accent: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Total Accounts", value: num(accounts.total),      sub: `Verified: ${num(accounts.verified)}`, accent: "text-violet-700",  bg: "bg-violet-50"  },
  ];

  // Sales bar chart: monthly revenue this year
  const salesChartData = Object.entries(sales.monthly_chart ?? {}).map(([m, v], i) => ({
    label: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][Number(m)-1] ?? m,
    value: Number(v),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  // Traffic by address bar chart
  const trafficChartData = Object.entries(traffic.users_by_address ?? {}).slice(0,6).map(([addr, v], i) => ({
    label: addr.length > 8 ? addr.slice(0,8)+"…" : addr,
    value: Number(v),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  // Marketing donut
  const marketingData = Object.entries(traffic.revenue_by_address ?? {}).slice(0,5).map(([addr, v], i) => ({
    city: addr,
    pct:  Number(v),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));
  const marketingTotal = marketingData.reduce((s, d) => s + d.pct, 0) || 1;
  const marketingWithPct = marketingData.map(d => ({ ...d, pct: parseFloat(((d.pct / marketingTotal) * 100).toFixed(1)) }));

  return (
    <div className="flex min-h-screen bg-[#F0F7F2] font-sans">
      <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="flex-1 min-w-0 px-5 py-6 overflow-x-hidden">

        {/* Top bar */}
        <div className="flex items-center gap-3 mb-6">
          <button
            className="lg:hidden bg-transparent border-none text-[22px] cursor-pointer text-gray-700 px-2 py-1 rounded-md hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >☰</button>
          <h1 className="text-xl font-bold text-gray-900 m-0">Dashboard</h1>
          {loading && <span className="text-xs text-gray-400 animate-pulse">Loading…</span>}
          {error   && <span className="text-xs text-red-500">⚠ {error}</span>}
        </div>

        {/* ── Stats ── */}
        <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl px-4 py-4 flex items-center justify-between shadow-sm">
              <div>
                <div className="text-[11px] text-gray-400 mb-1">{stat.label}</div>
                {loading
                  ? <Skeleton className="h-7 w-20 mb-1" />
                  : <div className={`text-[22px] font-bold ${stat.accent}`}>{stat.value}</div>
                }
                <div className="text-[11px] text-gray-400 mt-1">{stat.sub}</div>
              </div>
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center text-lg`}>
                {stat.accent.includes("blue") ? "👁" : stat.accent.includes("amber") ? "🧭" : stat.accent.includes("emerald") ? "👤" : "✅"}
              </div>
            </div>
          ))}
        </div>

        {/* ── Main columns ── */}
        <div className="flex flex-col lg:flex-row gap-4 items-start">

          {/* Left */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">

            {/* Line chart: new accounts per month */}
            <div className={cardCls}>
              <div className="flex justify-between items-center mb-2">
                <div className={titleCls}>Total Users Overview</div>
                <div className="flex gap-3 text-[11px] text-gray-400">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> This year</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300 inline-block" /> Last year</span>
                </div>
              </div>
              <div className="flex gap-2 text-[10px] text-gray-400 mb-1">
                <span className="text-blue-600 font-semibold text-xs">New Accounts / Month</span>
              </div>
              <div className="flex gap-2">
                <div className="flex flex-col justify-between text-[10px] text-gray-400 pb-4">
                  <span>High</span><span></span><span>Low</span><span>0</span>
                </div>
                <div className="flex-1">
                  {loading
                    ? <Skeleton className="h-24 w-full" />
                    : <LineChart thisYear={accounts.new_per_month ?? {}} lastYear={{}} />
                  }
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className={cardCls}>
              <div className="flex justify-between items-center mb-3">
                <div className={titleCls}>Recent Orders</div>
                <div className="text-[11px] text-gray-400">
                  Total: <span className="font-semibold text-gray-700">{num(orders.total)}</span>
                  &nbsp;· Paid: <span className="font-semibold text-emerald-600">{num(orders.paid)}</span>
                  &nbsp;· Unpaid: <span className="font-semibold text-red-500">{num(orders.unpaid)}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                {loading
                  ? [1,2,3,4].map(i => <Skeleton key={i} className="h-14 w-full" />)
                  : (orders.recent ?? []).map((order, i, arr) => (
                  <div key={order.checkout_id}
                    className={`flex items-center gap-3 pb-2.5 ${i < arr.length - 1 ? "border-b border-gray-100" : ""}`}>
                    <div className="w-11 h-11 rounded-lg shrink-0 bg-gray-100 flex items-center justify-center text-[22px]">
                      🛒
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-xs text-gray-900">
                          {order.first_name} {order.last_name}
                        </span>
                        <span className="text-[11px] text-gray-400 shrink-0">{timeAgo(order.created_at)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">
                          {order.paid_at ? peso(order.paid_amount) : "Unpaid"} · {order.payment_method}
                        </span>
                        <span className={badgeCls(order.paid_at ? "Completed" : "Pending")}>
                          {order.paid_at ? "Paid" : "Unpaid"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Charts grid */}
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>

              {/* Products card */}
              <div className={cardCls}>
                <div className={titleCls}>📦 Products</div>
                {loading
                  ? <Skeleton className="h-16 w-full" />
                  : <div className="flex gap-6 flex-wrap">
                    {[
                      { l: "Total",     v: products.total,     color: "text-gray-900"   },
                      { l: "On Sale",   v: products.on_sale,   color: "text-emerald-600"},
                      { l: "Low Stock", v: products.low_stock, color: "text-amber-600"  },
                      { l: "Out Stock", v: products.out_stock, color: "text-red-600"    },
                    ].map(p => (
                      <div key={p.l}>
                        <div className="text-[11px] text-gray-400">{p.l}</div>
                        <div className={`text-2xl font-bold ${p.color}`}>{num(p.v)}</div>
                      </div>
                    ))}
                  </div>
                }
              </div>

              {/* Orders this week */}
              <div className={cardCls}>
                <div className={titleCls}>🛒 Orders · This Week</div>
                {loading
                  ? <Skeleton className="h-16 w-full" />
                  : <div className="flex gap-4 flex-wrap">
                    {[
                      { l: "Total",   v: orders.weekly_total  },
                      { l: "Paid",    v: orders.weekly_paid   },
                      { l: "Unpaid",  v: orders.weekly_unpaid },
                    ].map(o => (
                      <div key={o.l}>
                        <div className="text-[11px] text-gray-400">{o.l}</div>
                        <div className="text-xl font-bold text-gray-900">{num(o.v)}</div>
                      </div>
                    ))}
                  </div>
                }
              </div>

              {/* Delivery status */}
              <div className={cardCls}>
                <div className={titleCls}>🚚 Delivery Status</div>
                {loading
                  ? <Skeleton className="h-16 w-full" />
                  : <div className="flex gap-3 flex-wrap">
                    {[
                      { l: "Processing", v: orders.processing, color: "text-amber-600"  },
                      { l: "Ready",      v: orders.ready,      color: "text-violet-600" },
                      { l: "On the Way", v: orders.on_the_way, color: "text-blue-600"   },
                      { l: "Delivered",  v: orders.delivered,  color: "text-emerald-600"},
                    ].map(s => (
                      <div key={s.l}>
                        <div className="text-[10px] text-gray-400">{s.l}</div>
                        <div className={`text-xl font-bold ${s.color}`}>{num(s.v)}</div>
                      </div>
                    ))}
                  </div>
                }
              </div>

              {/* Sales revenue summary */}
              <div className={cardCls}>
                <div className={titleCls}>💰 Revenue</div>
                {loading
                  ? <Skeleton className="h-16 w-full" />
                  : <div className="flex gap-4 flex-wrap">
                    {[
                      { l: "Total",      v: peso(sales.total)      },
                      { l: "This Month", v: peso(sales.this_month) },
                      { l: "Today",      v: peso(sales.today)      },
                    ].map(s => (
                      <div key={s.l}>
                        <div className="text-[11px] text-gray-400">{s.l}</div>
                        <div className="text-sm font-bold text-gray-900">{s.v}</div>
                      </div>
                    ))}
                  </div>
                }
              </div>

              {/* Sales bar chart */}
              <div className={cardCls}>
                <div className={titleCls}>📊 Sales This Year</div>
                {loading
                  ? <Skeleton className="h-28 w-full" />
                  : salesChartData.length > 0
                    ? <BarChart data={salesChartData} />
                    : <p className="text-xs text-gray-400">No sales data yet.</p>
                }
              </div>

              {/* Traffic by address */}
              <div className={cardCls}>
                <div className={titleCls}>📍 Traffic by Address</div>
                {loading
                  ? <Skeleton className="h-28 w-full" />
                  : trafficChartData.length > 0
                    ? <BarChart data={trafficChartData} />
                    : <p className="text-xs text-gray-400">No traffic data yet.</p>
                }
              </div>

              {/* Marketing donut — spans 2 cols */}
              <div className={`${cardCls} col-span-2`}>
                <div className={titleCls}>🗺 Revenue by Location</div>
                {loading
                  ? <div className="flex gap-6"><Skeleton className="w-[110px] h-[110px] rounded-full" /><Skeleton className="flex-1 h-20" /></div>
                  : marketingWithPct.length > 0
                    ? <div className="flex items-center gap-6">
                        <DonutChart data={marketingWithPct} />
                        <div className="flex-1">
                          {marketingWithPct.map(m => (
                            <div key={m.city} className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: m.color }} />
                                <span className="text-xs text-gray-700 truncate max-w-[120px]">{m.city}</span>
                              </div>
                              <span className="text-xs font-semibold text-gray-900">{m.pct}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    : <p className="text-xs text-gray-400">No location data yet.</p>
                }
              </div>

            </div>
          </div>

          {/* ── Right column ── */}
          <div className="hidden lg:flex w-[260px] min-w-[260px] flex-col gap-4">

            {/* Notifications */}
            <div className={cardCls}>
              <div className="flex justify-between items-center mb-3">
                <div className={titleCls}>Notifications</div>
                {notifs.unread > 0 && (
                  <span className="text-[10px] bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">
                    {notifs.unread} unread
                  </span>
                )}
              </div>
              {loading
                ? [1,2,3].map(i => <Skeleton key={i} className="h-12 w-full mb-2" />)
                : (notifs.recent ?? []).map((n, i) => (
                <div key={n.notification_id ?? i}
                  className={`flex gap-2.5 items-start p-2 rounded-lg ${!n.is_read ? "bg-blue-50" : ""}`}>
                  <div className="w-[30px] h-[30px] rounded-lg bg-gray-100 flex items-center justify-center text-sm shrink-0">
                    {n.type === "order" ? "🛒" : n.type === "user" ? "👤" : n.type === "product" ? "📦" : "🔔"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-900 leading-tight">{n.title}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5 truncate">{n.message}</div>
                    <div className="text-[10px] text-gray-300">{timeAgo(n.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Latest Customers */}
            <div className={cardCls}>
              <div className={titleCls}>Latest Customers</div>
              {loading
                ? [1,2,3].map(i => <Skeleton key={i} className="h-10 w-full mb-2" />)
                : (accounts.recent ?? []).map((acc, i) => (
                <div key={acc.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: `hsl(${i * 60 + 200}, 70%, 60%)` }}>
                    {(acc.first_name?.[0] ?? "?").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-900 truncate">
                      {acc.first_name} {acc.last_name}
                    </div>
                    <div className="text-[10px] text-gray-400 truncate">{acc.email}</div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${acc.email_verified_at ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                    {acc.email_verified_at ? "Verified" : "Unverified"}
                  </span>
                </div>
              ))}
            </div>

            {/* Recent Contacts */}
            <div className={cardCls}>
              <div className="flex justify-between items-center mb-3">
                <div className={titleCls}>Contacts</div>
                <span className="text-[11px] text-gray-400">
                  Pending: <span className="font-semibold text-amber-600">{num(contacts.pending)}</span>
                </span>
              </div>
              {loading
                ? [1,2,3].map(i => <Skeleton key={i} className="h-10 w-full mb-2" />)
                : (contacts.recent ?? []).map((c, i) => (
                <div key={c.message_id ?? i} className="flex items-start gap-2.5 px-1 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: `hsl(${i * 80 + 150}, 60%, 65%)` }}>
                    {(c.first_name?.[0] ?? "?").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-800">{c.first_name} {c.last_name}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold
                        ${c.status === "replied" ? "bg-emerald-100 text-emerald-600"
                          : c.status === "read"  ? "bg-blue-100 text-blue-600"
                          : "bg-amber-100 text-amber-600"}`}>
                        {c.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 truncate">{c.message}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Products */}
            <div className={cardCls}>
              <div className={titleCls}>📦 Recent Products</div>
              {loading
                ? [1,2,3].map(i => <Skeleton key={i} className="h-10 w-full mb-2" />)
                : (products.recent ?? []).map((p, i) => (
                <div key={p.product_id ?? i} className="flex items-center gap-2.5 px-1 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm shrink-0">📦</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-800 truncate">{p.product_name}</div>
                    <div className="text-[10px] text-gray-400">{peso(p.price)} · Stock: {p.product_stocks}</div>
                  </div>
                  {p.isSale && (
                    <span className="text-[9px] bg-red-100 text-red-600 font-semibold px-1.5 py-0.5 rounded-full">SALE</span>
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}