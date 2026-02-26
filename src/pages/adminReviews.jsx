import { useState } from "react";
import AdminNav from '../components/AdminNav'; 

const reviewsData = [
  {
    id: 1,
    name: "Juan Dela Cruz",
    email: "juan@gmail.com",
    date: "February 20, 2026",
    rating: 5,
    review: "Sobrang ganda ng product na ito!",
    status: "Published",
    product: "Organic Barley",
    adminReply: "Salamat po sa inyong feedback, juan! Natutuwa kaming maranasan ninyo ang benepisyo ng aming Organic Barley. Hanggang sa susunod!",
  },
  {
    id: 2,
    name: "Juan Dela Cruz",
    email: "juan@gmail.com",
    date: "February 20, 2026",
    rating: 2,
    review: "Disappointed with this order. Some items were missing from the bundle and the folder quality was not as pictured.",
    status: "Pending",
    product: "Office Bundle",
    adminReply: null,
  },
  {
    id: 3,
    name: "Maria Santos",
    email: "maria@gmail.com",
    date: "February 18, 2026",
    rating: 4,
    review: "Maganda ang quality ng product. Mabilis din ang delivery. Highly recommended!",
    status: "Published",
    product: "A4 Bondpaper",
    adminReply: "Maraming salamat po, Maria! Masaya kaming nagustuhan ninyo ang aming produkto.",
  },
];

const statCards = [
  { label: "Total Reviews", value: 12, color: "#EFF6FF", accent: "#2563EB", icon: "⭐" },
  { label: "Average Rating", value: "3.8", sub: "out of 5", color: "#FEF3C7", accent: "#D97706", icon: "📊" },
  { label: "Published", value: 1, color: "#ECFDF5", accent: "#059669", icon: "✅" },
  { label: "Pending", value: 1, color: "#FEF2F2", accent: "#DC2626", icon: "⏳" },
];

function StarRating({ rating, max = 5 }) {
  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{ fontSize: "14px", color: i < rating ? "#F59E0B" : "#D1D5DB" }}>★</span>
      ))}
    </div>
  );
}

const statusConfig = {
  Published: { bg: "#C6FFC9", border: "#76CD8C", color: "#247132" },
  Pending: { bg: "#E5E7EB", border: "#DFDFDF", color: "#374151" },
};

export default function AdminReviews() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  const tabs = ["All", "Pending", "Published"];

  const filtered =
    activeTab === "All"
      ? reviewsData
      : reviewsData.filter((r) => r.status === activeTab);

  return (
    <>
      <style>{`
        @media (min-width: 768px) { .ar-burger { display: none !important; } }
        @media (max-width: 767px) { .ar-burger { display: inline !important; } }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#F0F7F2", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

        <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main style={{ flex: 1, padding: "28px 24px", overflowX: "hidden", minWidth: 0 }}>

          {/* Top bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                className="ar-burger"
                onClick={() => setSidebarOpen(true)}
                style={{ display: "none", background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#374151", padding: "4px 8px", borderRadius: "6px" }}
              >☰</button>
              <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", margin: 0 }}>Reviews</h1>
            </div>
          </div>

          {/* Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px", marginBottom: "20px" }}>
            {statCards.map((s) => (
              <div key={s.label} style={{
                background: "#fff", borderRadius: "12px", padding: "16px 18px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}>
                <div>
                  <div style={{ fontSize: "11px", color: "#9CA3AF", marginBottom: "4px" }}>{s.label}</div>
                  <div style={{ fontSize: "22px", fontWeight: 700, color: s.accent }}>{s.value}</div>
                  {s.sub && <div style={{ fontSize: "11px", color: "#9CA3AF" }}>{s.sub}</div>}
                </div>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: s.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                  {s.icon}
                </div>
              </div>
            ))}
          </div>

          {/* Filter Tabs */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "6px 18px", borderRadius: "8px",
                    border: "none",
                    background: isActive ? "#111827" : "#fff",
                    color: isActive ? "#fff" : "#374151",
                    fontSize: "13px", fontWeight: 500,
                    cursor: "pointer",
                    boxShadow: isActive ? "none" : "0 1px 3px rgba(0,0,0,0.08)",
                    transition: "all 0.15s ease",
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Date separator */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#6B7280" }}>Friday, February 20, 2025</span>
            <div style={{ flex: 1, height: "1px", background: "#E5E7EB" }} />
          </div>

          {/* Review Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filtered.map((review) => {
              const cfg = statusConfig[review.status];
              return (
                <div key={review.id} style={{
                  background: "rgba(255,255,255,0.9)",
                  borderRadius: "12px",
                  border: "1px solid #E5E7EB",
                  padding: "18px 20px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}>
                  {/* Header row */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                      <div style={{
                        width: "40px", height: "40px", borderRadius: "50%", flexShrink: 0,
                        background: "linear-gradient(135deg, #2B7FFF, #9810FA)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontWeight: 700, fontSize: "14px",
                      }}>
                        {review.name[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "14px", color: "#111827" }}>{review.name}</div>
                        <div style={{ fontSize: "11px", color: "#9CA3AF" }}>
                          {review.email} · {review.date}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <StarRating rating={review.rating} />
                      <span style={{
                        padding: "3px 10px", borderRadius: "5px",
                        fontSize: "11px", fontWeight: 600,
                        background: cfg.bg,
                        border: `1px solid ${cfg.border}`,
                        color: cfg.color,
                      }}>
                        {review.status}
                      </span>
                    </div>
                  </div>

                  {/* Product tag */}
                  <div style={{
                    display: "inline-block", padding: "2px 10px",
                    borderRadius: "5px", fontSize: "11px", fontWeight: 500,
                    background: "rgba(77,123,101,0.12)", border: "1px solid rgba(77,123,101,0.3)",
                    color: "#374151", marginBottom: "8px",
                  }}>
                    📦 {review.product}
                  </div>

                  {/* Review text */}
                  <p style={{ fontSize: "13px", color: "#374151", fontWeight: 500, margin: "0 0 12px", lineHeight: "1.6" }}>
                    {review.review}
                  </p>

                  {/* Admin reply */}
                  {review.adminReply && (
                    <div style={{
                      background: "#F9FAFB", borderRadius: "8px",
                      padding: "12px 14px", marginBottom: "12px",
                      borderLeft: "3px solid #155DFC",
                    }}>
                      <div style={{ fontSize: "11px", fontWeight: 600, color: "#155DFC", marginBottom: "4px" }}>Admin Reply</div>
                      <p style={{ fontSize: "12px", color: "#4B5563", margin: 0, lineHeight: "1.6" }}>
                        {review.adminReply}
                      </p>
                    </div>
                  )}

                  {/* Reply input (when replying) */}
                  {replyingTo === review.id && (
                    <div style={{ marginBottom: "12px" }}>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply..."
                        rows={3}
                        style={{
                          width: "100%", padding: "10px 12px",
                          border: "1px solid #D1D5DB", borderRadius: "8px",
                          fontSize: "13px", color: "#374151",
                          resize: "vertical", outline: "none",
                          fontFamily: "inherit",
                        }}
                      />
                      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                        <button
                          onClick={() => { setReplyingTo(null); setReplyText(""); }}
                          style={{
                            padding: "6px 16px", borderRadius: "6px",
                            border: "1px solid #D1D5DB", background: "#155DFC",
                            color: "#fff", fontSize: "12px", cursor: "pointer", fontWeight: 500,
                          }}
                        >Submit Reply</button>
                        <button
                          onClick={() => { setReplyingTo(null); setReplyText(""); }}
                          style={{
                            padding: "6px 16px", borderRadius: "6px",
                            border: "1px solid #D1D5DB", background: "#fff",
                            color: "#374151", fontSize: "12px", cursor: "pointer",
                          }}
                        >Cancel</button>
                      </div>
                    </div>
                  )}

                  {/* Action row */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    {review.adminReply ? (
                      <button
                        onClick={() => { setReplyingTo(review.id); setReplyText(review.adminReply); }}
                        style={{
                          padding: "5px 14px", borderRadius: "5px",
                          border: "1px solid #D1D5DB", background: "#fff",
                          color: "#374151", fontSize: "12px", cursor: "pointer", fontWeight: 400,
                        }}
                      >Edit Reply</button>
                    ) : (
                      <button
                        onClick={() => setReplyingTo(review.id)}
                        style={{
                          padding: "5px 14px", borderRadius: "5px",
                          border: "1px solid #D1D5DB", background: "#fff",
                          color: "#374151", fontSize: "12px", cursor: "pointer", fontWeight: 400,
                        }}
                      >Reply</button>
                    )}
                    <button style={{
                      padding: "5px 14px", borderRadius: "5px",
                      border: "1px solid #C90000", background: "#fff",
                      color: "#9F0712", fontSize: "12px", cursor: "pointer", fontWeight: 400,
                    }}>Delete</button>
                    <span style={{ marginLeft: "auto", fontSize: "12px", color: "#9CA3AF", fontWeight: 500 }}>
                      Rating: <span style={{ color: review.rating >= 4 ? "#E4A107" : "#C90000", fontWeight: 600 }}>
                        {review.rating}/5
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div style={{
                background: "#fff", borderRadius: "12px", padding: "40px",
                textAlign: "center", color: "#9CA3AF", fontSize: "14px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}>
                No reviews found.
              </div>
            )}
          </div>

          {/* Pagination */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", fontSize: "12px", color: "#9CA3AF" }}>
            <span>Showing {filtered.length} review{filtered.length !== 1 ? "s" : ""}</span>
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
        </main>
      </div>
    </>
  );
}