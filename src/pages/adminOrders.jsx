import { useState } from "react";
import AdminNav from '../components/AdminNav'; 

const ordersData = Array.from({ length: 10 }, (_, i) => ({
  id: `AYUO-2026-00${i + 1}`,
  client: "Maria Clara\nCorp Corporation",
  contact: "maria@gmail.com\n09123312341",
  location: "Makati City,\nMetro Manila",
  item: "A4 Bondpaper",
  price: 250.0,
  qty: 1,
  total: 3200.0,
  status: i % 3 === 0 ? "Completed" : i % 3 === 1 ? "Processing" : "Pending",
  date: "Feb 19, 2026",
}));

const summaryStats = [
  { label: "Orders", value: 100, icon: "🛒", color: "#EFF6FF", accent: "#2563EB" },
  { label: "Pending", value: 100, icon: "⏳", color: "#FEF3C7", accent: "#D97706" },
  { label: "Processing", value: 100, icon: "⚙️", color: "#F5F3FF", accent: "#7C3AED" },
  { label: "Delivered", value: 100, icon: "✅", color: "#ECFDF5", accent: "#059669" },
  { label: "Revenue", value: "₱100.00", icon: "💰", color: "#FFF7ED", accent: "#EA580C" },
];

const getStatusStyle = (status) =>
  ({
    Pending: { background: "#FEF3C7", color: "#D97706", border: "1px solid #FCD34D" },
    Processing: { background: "#EDE9FE", color: "#7C3AED", border: "1px solid #C4B5FD" },
    Completed: { background: "#D1FAE5", color: "#059669", border: "1px solid #6EE7B7" },
  }[status] || { background: "#F3F4F6", color: "#6B7280", border: "1px solid #E5E7EB" });

export default function AdminOrders() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");

  const filteredOrders = ordersData.filter((o) => {
    const matchSearch =
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "All" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <>
      <style>{`
        @media (min-width: 768px) {
          .ao-burger { display: none !important; }
          .ao-stats { grid-template-columns: repeat(5, 1fr) !important; }
        }
        @media (max-width: 767px) {
          .ao-burger { display: inline !important; }
          .ao-stats { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#F0F7F2", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

        <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main style={{ flex: 1, padding: "24px 20px", overflowX: "hidden", minWidth: 0 }}>

          {/* Top bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                className="ao-burger"
                onClick={() => setSidebarOpen(true)}
                style={{ display: "none", background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#374151", padding: "4px 8px", borderRadius: "6px" }}
              >☰</button>
              <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", margin: 0 }}>Orders</h1>
            </div>
            <button style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "9px 18px", border: "1px solid #D1D5DB", borderRadius: "8px",
              background: "#fff", color: "#374151", fontSize: "13px", fontWeight: 500, cursor: "pointer",
            }}>↑ Export</button>
          </div>

          {/* Summary Stats */}
          <div className="ao-stats" style={{ display: "grid", gap: "12px", marginBottom: "20px" }}>
            {summaryStats.map((s) => (
              <div key={s.label} style={{
                background: "#fff", borderRadius: "12px", padding: "16px 18px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 700, color: s.accent }}>{s.value}</div>
                  <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "2px" }}>{s.label}</div>
                </div>
                <div style={{
                  width: "40px", height: "40px", borderRadius: "10px",
                  background: s.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px",
                }}>{s.icon}</div>
              </div>
            ))}
          </div>

          {/* Orders Table Card */}
          <div style={{ background: "#fff", borderRadius: "14px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden" }}>

            {/* Search & Filter Bar */}
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #F3F4F6", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                border: "1px solid #E5E7EB", borderRadius: "7px",
                padding: "7px 12px", background: "#F9FAFB",
                flex: "1", minWidth: "160px", maxWidth: "320px",
              }}>
                <span style={{ color: "#9CA3AF" }}>🔍</span>
                <input
                  type="text"
                  placeholder="Search by name, order ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ border: "none", background: "transparent", outline: "none", fontSize: "12px", width: "100%", color: "#374151" }}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ border: "1px solid #E5E7EB", borderRadius: "7px", padding: "7px 12px", background: "#F9FAFB", fontSize: "12px", color: "#374151", cursor: "pointer", outline: "none" }}
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Completed">Completed</option>
              </select>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{ border: "1px solid #E5E7EB", borderRadius: "7px", padding: "7px 12px", background: "#F9FAFB", fontSize: "12px", color: "#374151", cursor: "pointer", outline: "none" }}
              >
                <option value="All">All Dates</option>
                <option value="Today">Today</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
              </select>
              <button
                onClick={() => { setSearchTerm(""); setStatusFilter("All"); setDateFilter("All"); }}
                style={{ display: "flex", alignItems: "center", gap: "5px", border: "1px solid #E5E7EB", borderRadius: "7px", padding: "7px 12px", background: "#fff", fontSize: "12px", color: "#374151", cursor: "pointer" }}
              >✕ Clear</button>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                    {["Order ID", "Client", "Contact", "Location", "Items Ordered", "Price", "Qty", "Total", "Status", "Date", "Action"].map((h) => (
                      <th key={h} style={{
                        padding: "12px 14px", textAlign: "left", fontWeight: 600,
                        color: "#374151", whiteSpace: "nowrap", fontSize: "11px",
                        textTransform: "uppercase", letterSpacing: "0.04em",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, index) => (
                    <tr key={order.id} style={{
                      borderBottom: "1px solid #F3F4F6",
                      background: index % 2 === 0 ? "#fff" : "#FAFAFA",
                    }}>
                      <td style={{ padding: "14px 14px", color: "#155DFC", fontWeight: 600, whiteSpace: "nowrap" }}>
                        {order.id}
                      </td>
                      <td style={{ padding: "14px 14px", color: "#111827", whiteSpace: "pre-line", lineHeight: "1.5" }}>
                        {order.client}
                      </td>
                      <td style={{ padding: "14px 14px", color: "#6B7280", whiteSpace: "pre-line", lineHeight: "1.5" }}>
                        {order.contact}
                      </td>
                      <td style={{ padding: "14px 14px", color: "#6B7280", whiteSpace: "pre-line", lineHeight: "1.5" }}>
                        {order.location}
                      </td>
                      <td style={{ padding: "14px 14px", color: "#374151", whiteSpace: "nowrap" }}>
                        {order.item}
                      </td>
                      <td style={{ padding: "14px 14px", color: "#374151", whiteSpace: "nowrap", fontWeight: 500 }}>
                        ₱{order.price.toFixed(2)}
                      </td>
                      <td style={{ padding: "14px 14px", color: "#374151", textAlign: "center" }}>
                        {order.qty}
                      </td>
                      <td style={{ padding: "14px 14px", color: "#111827", whiteSpace: "nowrap", fontWeight: 600 }}>
                        ₱{order.total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: "14px 14px" }}>
                        <span style={{
                          ...getStatusStyle(order.status),
                          padding: "4px 10px", borderRadius: "20px",
                          fontSize: "11px", fontWeight: 600,
                          display: "inline-block", whiteSpace: "nowrap",
                        }}>
                          {order.status}
                        </span>
                      </td>
                      <td style={{ padding: "14px 14px", color: "#6B7280", whiteSpace: "nowrap" }}>
                        {order.date}
                      </td>
                      <td style={{ padding: "14px 14px" }}>
                        <button style={{
                          display: "flex", alignItems: "center", gap: "5px",
                          padding: "6px 14px", borderRadius: "6px",
                          border: "1px solid #D1D5DB", background: "#fff",
                          color: "#374151", fontSize: "12px", fontWeight: 500,
                          cursor: "pointer", whiteSpace: "nowrap",
                        }}>
                          👁 View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div style={{ padding: "14px 20px", borderTop: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", color: "#9CA3AF" }}>
              <span>Showing {filteredOrders.length} of {ordersData.length} orders</span>
              <div style={{ display: "flex", gap: "6px" }}>
                {[1, 2, 3].map((p) => (
                  <button key={p} style={{
                    width: "28px", height: "28px", borderRadius: "6px",
                    border: p === 1 ? "none" : "1px solid #E5E7EB",
                    background: p === 1 ? "#155DFC" : "#fff",
                    color: p === 1 ? "#fff" : "#374151",
                    fontSize: "12px", cursor: "pointer", fontWeight: 500,
                  }}>{p}</button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}