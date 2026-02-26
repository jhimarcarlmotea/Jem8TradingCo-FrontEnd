import { useState } from "react";
import AdminNav from '../components/AdminNav'; 
const stats = [
  { label: "Views", value: "8,000", change: "+11.01%", up: true, color: "#EFF6FF", accent: "#2563EB" },
  { label: "Visits", value: "3,000", change: "-0.03%", up: false, color: "#FEF3C7", accent: "#D97706" },
  { label: "New Users", value: "600", change: "+15.03%", up: true, color: "#ECFDF5", accent: "#059669" },
  { label: "Active Users", value: "2,600", change: "+6.08%", up: true, color: "#F5F3FF", accent: "#7C3AED" },
];

const recentOrders = [
  { name: "Notebooks", date: "12 Sept 2026", price: "730,000.00 x 1", status: "Pending", emoji: "📓" },
  { name: "Chair", date: "12 Sept 2026", price: "730,000.00 x 1", status: "Completed", emoji: "🪑" },
  { name: "Tables", date: "12 Sept 2026", price: "730,000.00 x 1", status: "Pending", emoji: "🪞" },
  { name: "iPhone 13", date: "12 Sept 2026", price: "730,000.00 x 1", status: "Completed", emoji: "📱" },
  { name: "Monitor", date: "12 Sept 2026", price: "730,000.00 x 1", status: "Completed", emoji: "🖥️" },
  { name: "Keyboard", date: "12 Sept 2026", price: "730,000.00 x 1", status: "Pending", emoji: "⌨️" },
];

const notifications = [
  { icon: "🐛", title: "You fixed a bug.", time: "Just now" },
  { icon: "👤", title: "New user registered.", time: "59 minutes ago" },
  { icon: "🐛", title: "You fixed a bug.", time: "12 hours ago" },
  { icon: "📡", title: "Miguel subscribed to you.", time: "Today, 11:59 AM" },
];

const salesData = [
  { label: "Jan", value: 20, color: "#06B6D4" },
  { label: "Feb", value: 50, color: "#10B981" },
  { label: "Mar", value: 30, color: "#3B82F6" },
  { label: "Apr", value: 60, color: "#8B5CF6" },
  { label: "May", value: 10, color: "#EC4899" },
  { label: "Other", value: 40, color: "#F59E0B" },
];

const deviceData = [
  { label: "Linux", value: 20, color: "#06B6D4" },
  { label: "Mac", value: 50, color: "#10B981" },
  { label: "iOS", value: 30, color: "#3B82F6" },
  { label: "Windows", value: 60, color: "#8B5CF6" },
  { label: "Android", value: 10, color: "#EC4899" },
  { label: "Other", value: 40, color: "#F59E0B" },
];

const marketing = [
  { city: "Makati City", pct: 52.1, color: "#3B82F6" },
  { city: "Taguig City", pct: 22.8, color: "#10B981" },
  { city: "Manila", pct: 13.9, color: "#F59E0B" },
  { city: "Other", pct: 11.2, color: "#8B5CF6" },
];

function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.pct, 0);
  let cumulative = 0;
  const r = 45, cx = 55, cy = 55, stroke = 18;
  const circ = 2 * Math.PI * r;
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
      <text x="55" y="59" textAnchor="middle" fontSize="12" fontWeight="700" fill="#111827">100%</text>
    </svg>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", height: "120px", gap: "8px", padding: "0 4px" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", height: "100%" }}>
          <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
            <div style={{
              width: "100%", height: `${(d.value / max) * 100}%`,
              background: d.color, borderRadius: "4px 4px 0 0", minHeight: "4px",
            }} />
          </div>
          <span style={{ fontSize: "10px", color: "#9CA3AF", whiteSpace: "nowrap" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function LineChart() {
  const pts = [8, 15, 10, 22, 18, 25, 20];
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
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L ${coords[coords.length - 1].x} ${h} L ${coords[0].x} ${h} Z`} fill="url(#lineGrad)" />
      <path d={d} fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill="#3B82F6" />)}
      {labels.map((l, i) => (
        <text key={i} x={coords[i].x} y={h + 16} textAnchor="middle" fontSize="9" fill="#9CA3AF">{l}</text>
      ))}
    </svg>
  );
}

const card = {
  background: "#fff", borderRadius: "14px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)", padding: "20px",
};

const cardTitle = { fontSize: "14px", fontWeight: 600, color: "#374151", marginBottom: "16px" };

const badge = (status) => ({
  padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
  background: status === "Completed" ? "#D1FAE5" : "#FEE2E2",
  color: status === "Completed" ? "#059669" : "#DC2626",
  display: "inline-block",
});

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <style>{`
        @media (min-width: 768px) {
          .dash-burger { display: none !important; }
          .dash-right-col { display: flex !important; }
          .dash-main-cols { flex-direction: row !important; }
        }
        @media (max-width: 767px) {
          .dash-right-col { display: none !important; }
          .dash-main-cols { flex-direction: column !important; }
        }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#F0F7F2", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

        {/* Shared sidebar nav */}
        <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Main content */}
        <main style={{ flex: 1, minWidth: 0, padding: "24px 20px", overflowX: "hidden" }}>

          {/* Top bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <button
              className="dash-burger"
              onClick={() => setSidebarOpen(true)}
              style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#374151", padding: "4px 8px", borderRadius: "6px" }}
            >☰</button>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", margin: 0 }}>Dashboard</h1>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "16px" }}>
            {stats.map((stat) => (
              <div key={stat.label} style={{ background: "#fff", borderRadius: "12px", padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "#9CA3AF", marginBottom: "4px" }}>{stat.label}</div>
                  <div style={{ fontSize: "22px", fontWeight: 700, color: stat.accent }}>{stat.value}</div>
                  <div style={{ fontSize: "11px", fontWeight: 600, marginTop: "4px", color: stat.up ? "#059669" : "#DC2626" }}>
                    {stat.up ? "▲" : "▼"} {stat.change}
                  </div>
                </div>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: stat.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                  {stat.up ? "📈" : "📉"}
                </div>
              </div>
            ))}
          </div>

          {/* Main columns */}
          <div className="dash-main-cols" style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>

            {/* Left content */}
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Line Chart */}
              <div style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={cardTitle}>Total Users Overview</div>
                  <div style={{ display: "flex", gap: "12px", fontSize: "11px", color: "#9CA3AF" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#3B82F6", display: "inline-block" }} /> This year
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#D1D5DB", display: "inline-block" }} /> Last year
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", fontSize: "10px", color: "#9CA3AF", marginBottom: "4px" }}>
                  <span style={{ color: "#155DFC", fontWeight: 600, fontSize: "12px" }}>Total Users</span>
                  <span>Total Projects</span>
                  <span>Operating Status</span>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", fontSize: "10px", color: "#9CA3AF", paddingBottom: "16px" }}>
                    <span>30K</span><span>20K</span><span>10K</span><span>0</span>
                  </div>
                  <div style={{ flex: 1 }}><LineChart /></div>
                </div>
              </div>

              {/* Recent Orders */}
              <div style={card}>
                <div style={cardTitle}>Recent Orders</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {recentOrders.map((order, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "10px", borderBottom: i < recentOrders.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                      <div style={{ width: "44px", height: "44px", borderRadius: "8px", flexShrink: 0, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>{order.emoji}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <span style={{ fontWeight: 500, fontSize: "13px", color: "#111827" }}>{order.name}</span>
                          <span style={{ fontSize: "11px", color: "#9CA3AF", flexShrink: 0 }}>{order.date}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                          <span style={{ fontSize: "12px", color: "#6B7280" }}>₱{order.price}</span>
                          <span style={badge(order.status)}>{order.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Charts grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                <div style={card}>
                  <div style={cardTitle}>📦 All Products · This Week</div>
                  <div style={{ display: "flex", gap: "24px" }}>
                    <div><div style={{ fontSize: "11px", color: "#9CA3AF" }}>All Products</div><div style={{ fontSize: "24px", fontWeight: 700, color: "#111827" }}>45</div><div style={{ fontSize: "11px", color: "#9CA3AF" }}>+0.00%</div></div>
                    <div><div style={{ fontSize: "11px", color: "#9CA3AF" }}>Active</div><div style={{ fontSize: "24px", fontWeight: 700, color: "#059669" }}>32</div><div style={{ fontSize: "11px", color: "#059669" }}>+24%</div></div>
                  </div>
                </div>
                <div style={card}>
                  <div style={cardTitle}>🛒 All Orders · This Week</div>
                  <div style={{ display: "flex", gap: "16px" }}>
                    {[{ l: "All Orders", v: 450 }, { l: "Pending", v: 5 }, { l: "Completed", v: 445 }].map((o) => (
                      <div key={o.l}><div style={{ fontSize: "11px", color: "#9CA3AF" }}>{o.l}</div><div style={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>{o.v}</div></div>
                    ))}
                  </div>
                </div>
                <div style={card}><div style={cardTitle}>Sales</div><BarChart data={salesData} /></div>
                <div style={card}><div style={cardTitle}>Traffic by Device</div><BarChart data={deviceData} /></div>
                <div style={{ ...card, gridColumn: "span 2" }}>
                  <div style={cardTitle}>Marketing</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                    <DonutChart data={marketing} />
                    <div style={{ flex: 1 }}>
                      {marketing.map((m) => (
                        <div key={m.city} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: m.color, display: "inline-block" }} />
                            <span style={{ fontSize: "12px", color: "#374151" }}>{m.city}</span>
                          </div>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "#111827" }}>{m.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="dash-right-col" style={{ width: "260px", minWidth: "260px", flexDirection: "column", gap: "16px" }}>
              <div style={card}>
                <div style={cardTitle}>Notifications</div>
                {notifications.map((n, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "8px", borderRadius: "8px" }}>
                    <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>{n.icon}</div>
                    <div>
                      <div style={{ fontSize: "13px", color: "#111827" }}>{n.title}</div>
                      <div style={{ fontSize: "11px", color: "#9CA3AF" }}>{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={card}>
                <div style={cardTitle}>Activities</div>
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "8px" }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>A</div>
                  <div><div style={{ fontSize: "13px", color: "#111827" }}>Changed the style.</div><div style={{ fontSize: "11px", color: "#9CA3AF" }}>Just now</div></div>
                </div>
                {[1, 2, 3, 4].map(i => <div key={i} style={{ height: "40px", margin: "4px 0", background: "#F9FAFB", borderRadius: "8px" }} />)}
              </div>

              <div style={card}>
                <div style={cardTitle}>Latest Customers</div>
                {["Natali Craig", "Drew Cano", "Andi Lane"].map((name, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px", borderRadius: "8px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: `hsl(${i * 60 + 200}, 70%, 60%)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "12px", fontWeight: 700 }}>{name[0]}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: 500, color: "#111827" }}>{name}</div>
                      <div style={{ fontSize: "11px", color: "#9CA3AF" }}>12 Aug 2022 · Home Delivery</div>
                    </div>
                    <span style={{ ...badge("Completed"), fontSize: "10px" }}>Completed</span>
                  </div>
                ))}
              </div>

              <div style={card}>
                <div style={cardTitle}>Contacts</div>
                {["Natali Craig", "Drew Cano", "Andi Lane"].map((name, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 4px" }}>
                    <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: `hsl(${i * 80 + 150}, 60%, 65%)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "12px", fontWeight: 700 }}>{name[0]}</div>
                    <span style={{ fontSize: "13px", color: "#374151" }}>{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}