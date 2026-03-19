import { useState } from "react";
import AdminNav from '../components/AdminNav';

const stats = [
  { label: "Views",        value: "8,000", change: "+11.01%", up: true,  bg: "bg-blue-50",   accent: "text-blue-600"   },
  { label: "Visits",       value: "3,000", change: "-0.03%",  up: false, bg: "bg-amber-50",  accent: "text-amber-600"  },
  { label: "New Users",    value: "600",   change: "+15.03%", up: true,  bg: "bg-emerald-50",accent: "text-emerald-600"},
  { label: "Active Users", value: "2,600", change: "+6.08%",  up: true,  bg: "bg-violet-50", accent: "text-violet-700" },
];

const recentOrders = [
  { name: "Notebooks", date: "12 Sept 2026", price: "730,000.00 x 1", status: "Pending",   emoji: "📓" },
  { name: "Chair",     date: "12 Sept 2026", price: "730,000.00 x 1", status: "Completed", emoji: "🪑" },
  { name: "Tables",    date: "12 Sept 2026", price: "730,000.00 x 1", status: "Pending",   emoji: "🪞" },
  { name: "iPhone 13", date: "12 Sept 2026", price: "730,000.00 x 1", status: "Completed", emoji: "📱" },
  { name: "Monitor",   date: "12 Sept 2026", price: "730,000.00 x 1", status: "Completed", emoji: "🖥️" },
  { name: "Keyboard",  date: "12 Sept 2026", price: "730,000.00 x 1", status: "Pending",   emoji: "⌨️" },
];

const notifications = [
  { icon: "🐛", title: "You fixed a bug.",           time: "Just now"         },
  { icon: "👤", title: "New user registered.",       time: "59 minutes ago"   },
  { icon: "🐛", title: "You fixed a bug.",           time: "12 hours ago"     },
  { icon: "📡", title: "Miguel subscribed to you.", time: "Today, 11:59 AM"  },
];

const salesData  = [
  { label: "Jan",   value: 20, color: "#06B6D4" },
  { label: "Feb",   value: 50, color: "#10B981" },
  { label: "Mar",   value: 30, color: "#3B82F6" },
  { label: "Apr",   value: 60, color: "#8B5CF6" },
  { label: "May",   value: 10, color: "#EC4899" },
  { label: "Other", value: 40, color: "#F59E0B" },
];

const deviceData = [
  { label: "Linux",   value: 20, color: "#06B6D4" },
  { label: "Mac",     value: 50, color: "#10B981" },
  { label: "iOS",     value: 30, color: "#3B82F6" },
  { label: "Windows", value: 60, color: "#8B5CF6" },
  { label: "Android", value: 10, color: "#EC4899" },
  { label: "Other",   value: 40, color: "#F59E0B" },
];

const marketing = [
  { city: "Makati City", pct: 52.1, color: "#3B82F6" },
  { city: "Taguig City", pct: 22.8, color: "#10B981" },
  { city: "Manila",      pct: 13.9, color: "#F59E0B" },
  { city: "Other",       pct: 11.2, color: "#8B5CF6" },
];

// ── Charts ────────────────────────────────────────────────────────────────────
function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.pct, 0);
  let cumulative = 0;
  const r = 45, cx = 55, cy = 55, stroke = 18;
  const circ = 2 * Math.PI * r;
  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      {data.map((d, i) => {
        const pct    = d.pct / total;
        const dash   = pct * circ;
        const gap    = circ - dash;
        const offset = circ * (1 - cumulative / total);
        cumulative  += d.pct;
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color}
            strokeWidth={stroke} strokeDasharray={`${dash} ${gap}`} strokeDashoffset={offset}
            style={{ transform: "rotate(-90deg)", transformOrigin: "55px 55px" }} />
        );
      })}
      <text x="55" y="59" textAnchor="middle" fontSize="12" fontWeight="700" fill="#111827">100%</text>
    </svg>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div className="flex items-end h-[120px] gap-2 px-1">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full">
          <div className="flex-1 w-full flex items-end">
            <div
              className="w-full rounded-t-sm"
              style={{ height: `${(d.value / max) * 100}%`, background: d.color, minHeight: "4px" }}
            />
          </div>
          <span className="text-[10px] text-gray-400 whitespace-nowrap">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function LineChart() {
  const pts    = [8, 15, 10, 22, 18, 25, 20];
  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
  const w = 300, h = 80, max = Math.max(...pts);
  const coords = pts.map((v, i) => ({
    x: (i / (pts.length - 1)) * (w - 20) + 10,
    y: h - (v / max) * (h - 10) - 5,
  }));
  const d = coords.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h + 20}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#3B82F6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0"   />
        </linearGradient>
      </defs>
      <path d={`${d} L ${coords[coords.length-1].x} ${h} L ${coords[0].x} ${h} Z`} fill="url(#lineGrad)" />
      <path d={d} fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill="#3B82F6" />)}
      {labels.map((l, i) => (
        <text key={i} x={coords[i].x} y={h + 16} textAnchor="middle" fontSize="9" fill="#9CA3AF">{l}</text>
      ))}
    </svg>
  );
}

// ── Shared helpers ─────────────────────────────────────────────────────────────
const cardCls    = "bg-white rounded-2xl shadow-sm p-5";
const titleCls   = "text-sm font-semibold text-gray-700 mb-4";
const badgeCls   = (status) =>
  `px-2.5 py-0.5 rounded-full text-[11px] font-semibold inline-block
   ${status === "Completed" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`;

// ── Main component ─────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        </div>

        {/* Stats */}
        <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl px-4 py-4 flex items-center justify-between shadow-sm">
              <div>
                <div className="text-[11px] text-gray-400 mb-1">{stat.label}</div>
                <div className={`text-[22px] font-bold ${stat.accent}`}>{stat.value}</div>
                <div className={`text-[11px] font-semibold mt-1 ${stat.up ? "text-emerald-600" : "text-red-600"}`}>
                  {stat.up ? "▲" : "▼"} {stat.change}
                </div>
              </div>
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center text-lg`}>
                {stat.up ? "📈" : "📉"}
              </div>
            </div>
          ))}
        </div>

        {/* Main columns */}
        <div className="flex flex-col lg:flex-row gap-4 items-start">

          {/* Left content */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">

            {/* Line Chart */}
            <div className={cardCls}>
              <div className="flex justify-between items-center mb-2">
                <div className={titleCls}>Total Users Overview</div>
                <div className="flex gap-3 text-[11px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> This year
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" /> Last year
                  </span>
                </div>
              </div>
              <div className="flex gap-2 text-[10px] text-gray-400 mb-1">
                <span className="text-blue-600 font-semibold text-xs">Total Users</span>
                <span>Total Projects</span>
                <span>Operating Status</span>
              </div>
              <div className="flex gap-2">
                <div className="flex flex-col justify-between text-[10px] text-gray-400 pb-4">
                  <span>30K</span><span>20K</span><span>10K</span><span>0</span>
                </div>
                <div className="flex-1"><LineChart /></div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className={cardCls}>
              <div className={titleCls}>Recent Orders</div>
              <div className="flex flex-col gap-2.5">
                {recentOrders.map((order, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 pb-2.5 ${i < recentOrders.length - 1 ? "border-b border-gray-100" : ""}`}
                  >
                    <div className="w-11 h-11 rounded-lg shrink-0 bg-gray-100 flex items-center justify-center text-[22px]">
                      {order.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-xs text-gray-900">{order.name}</span>
                        <span className="text-[11px] text-gray-400 shrink-0">{order.date}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">₱{order.price}</span>
                        <span className={badgeCls(order.status)}>{order.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Charts grid */}
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>

              {/* Products */}
              <div className={cardCls}>
                <div className={titleCls}>📦 All Products · This Week</div>
                <div className="flex gap-6">
                  <div>
                    <div className="text-[11px] text-gray-400">All Products</div>
                    <div className="text-2xl font-bold text-gray-900">45</div>
                    <div className="text-[11px] text-gray-400">+0.00%</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-400">Active</div>
                    <div className="text-2xl font-bold text-emerald-600">32</div>
                    <div className="text-[11px] text-emerald-600">+24%</div>
                  </div>
                </div>
              </div>

              {/* Orders */}
              <div className={cardCls}>
                <div className={titleCls}>🛒 All Orders · This Week</div>
                <div className="flex gap-4">
                  {[{ l: "All Orders", v: 450 }, { l: "Pending", v: 5 }, { l: "Completed", v: 445 }].map((o) => (
                    <div key={o.l}>
                      <div className="text-[11px] text-gray-400">{o.l}</div>
                      <div className="text-xl font-bold text-gray-900">{o.v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sales bar */}
              <div className={cardCls}>
                <div className={titleCls}>Sales</div>
                <BarChart data={salesData} />
              </div>

              {/* Device bar */}
              <div className={cardCls}>
                <div className={titleCls}>Traffic by Device</div>
                <BarChart data={deviceData} />
              </div>

              {/* Marketing donut — spans 2 cols */}
              <div className={`${cardCls} col-span-2`}>
                <div className={titleCls}>Marketing</div>
                <div className="flex items-center gap-6">
                  <DonutChart data={marketing} />
                  <div className="flex-1">
                    {marketing.map((m) => (
                      <div key={m.city} className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: m.color }} />
                          <span className="text-xs text-gray-700">{m.city}</span>
                        </div>
                        <span className="text-xs font-semibold text-gray-900">{m.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Right column */}
          <div className="hidden lg:flex w-[260px] min-w-[260px] flex-col gap-4">

            {/* Notifications */}
            <div className={cardCls}>
              <div className={titleCls}>Notifications</div>
              {notifications.map((n, i) => (
                <div key={i} className="flex gap-2.5 items-start p-2 rounded-lg">
                  <div className="w-[30px] h-[30px] rounded-lg bg-gray-100 flex items-center justify-center text-sm shrink-0">
                    {n.icon}
                  </div>
                  <div>
                    <div className="text-xs text-gray-900">{n.title}</div>
                    <div className="text-[11px] text-gray-400">{n.time}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Activities */}
            <div className={cardCls}>
              <div className={titleCls}>Activities</div>
              <div className="flex gap-2.5 items-start p-2">
                <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  A
                </div>
                <div>
                  <div className="text-xs text-gray-900">Changed the style.</div>
                  <div className="text-[11px] text-gray-400">Just now</div>
                </div>
              </div>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-10 my-1 bg-gray-50 rounded-lg" />
              ))}
            </div>

            {/* Latest Customers */}
            <div className={cardCls}>
              <div className={titleCls}>Latest Customers</div>
              {["Natali Craig", "Drew Cano", "Andi Lane"].map((name, i) => (
                <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: `hsl(${i * 60 + 200}, 70%, 60%)` }}
                  >
                    {name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-gray-900">{name}</div>
                    <div className="text-[11px] text-gray-400">12 Aug 2022 · Home Delivery</div>
                  </div>
                  <span className={badgeCls("Completed") + " text-[10px]"}>Completed</span>
                </div>
              ))}
            </div>

            {/* Contacts */}
            <div className={cardCls}>
              <div className={titleCls}>Contacts</div>
              {["Natali Craig", "Drew Cano", "Andi Lane"].map((name, i) => (
                <div key={i} className="flex items-center gap-2.5 px-1 py-2">
                  <div
                    className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: `hsl(${i * 80 + 150}, 60%, 65%)` }}
                  >
                    {name[0]}
                  </div>
                  <span className="text-xs text-gray-700">{name}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}