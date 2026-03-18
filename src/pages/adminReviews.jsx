import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import AdminNav from "../components/AdminNav";

// ─── Axios instance ──────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function StarRating({ rating, max = 5 }) {
  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          style={{ fontSize: "14px", color: i < rating ? "#F59E0B" : "#D1D5DB" }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

const statusConfig = {
  published: { bg: "#C6FFC9", border: "#76CD8C", color: "#247132", label: "Published" },
  pending:   { bg: "#E5E7EB", border: "#DFDFDF", color: "#374151", label: "Pending"   },
  approved:  { bg: "#C6FFC9", border: "#76CD8C", color: "#247132", label: "Approved"  },
  rejected:  { bg: "#FEE2E2", border: "#FCA5A5", color: "#991B1B", label: "Rejected"  },
};

function getStatusCfg(status) {
  return statusConfig[status?.toLowerCase()] ?? statusConfig.pending;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div style={{
      position: "fixed", bottom: "24px", right: "24px",
      display: "flex", flexDirection: "column", gap: "8px", zIndex: 9999,
    }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          background: t.type === "error" ? "#FEF2F2" : "#ECFDF5",
          border: `1px solid ${t.type === "error" ? "#FCA5A5" : "#6EE7B7"}`,
          color: t.type === "error" ? "#991B1B" : "#065F46",
          padding: "10px 16px", borderRadius: "8px", fontSize: "13px",
          fontWeight: 500, boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          animation: "fadeInUp 0.2s ease",
        }}>
          {t.type === "error" ? "✗ " : "✓ "}{t.message}
        </div>
      ))}
    </div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }}>
      <div style={{
        background: "#fff", borderRadius: "14px", padding: "28px 28px 24px",
        maxWidth: "380px", width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      }}>
        <div style={{ fontSize: "20px", marginBottom: "10px" }}>🗑️</div>
        <p style={{ fontSize: "14px", color: "#374151", margin: "0 0 20px", lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{
            padding: "7px 18px", borderRadius: "7px", border: "1px solid #D1D5DB",
            background: "#fff", color: "#374151", fontSize: "13px", cursor: "pointer",
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            padding: "7px 18px", borderRadius: "7px", border: "none",
            background: "#DC2626", color: "#fff", fontSize: "13px", cursor: "pointer", fontWeight: 600,
          }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminReviews() {
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [activeTab, setActiveTab]       = useState("All");
  const [reviews, setReviews]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [replyingTo, setReplyingTo]     = useState(null);   // review_id
  const [replyText, setReplyText]       = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [deletingId, setDeletingId]     = useState(null);   // confirm modal
  const [toasts, setToasts]             = useState([]);

  // ── toast helper ────────────────────────────────────────────────────────────
  const toast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);

  // ── fetch all reviews ────────────────────────────────────────────────────────
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/reviews");
      setReviews(data.data ?? []);
    } catch (err) {
      toast(err.response?.data?.message ?? "Failed to load reviews.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  // ── derived stats ────────────────────────────────────────────────────────────
  const total     = reviews.length;
  const published = reviews.filter((r) => r.status === "published" || r.status === "approved").length;
  const pending   = reviews.filter((r) => r.status === "pending").length;
  const avgRating = total
    ? (reviews.reduce((s, r) => s + Number(r.rating), 0) / total).toFixed(1)
    : "—";

  const statCards = [
    { label: "Total Reviews",  value: total,     color: "#EFF6FF", accent: "#2563EB", icon: "⭐" },
    { label: "Average Rating", value: avgRating, sub: "out of 5", color: "#FEF3C7", accent: "#D97706", icon: "📊" },
    { label: "Published",      value: published, color: "#ECFDF5", accent: "#059669", icon: "✅" },
    { label: "Pending",        value: pending,   color: "#FEF2F2", accent: "#DC2626", icon: "⏳" },
  ];

  // ── tab filtering ────────────────────────────────────────────────────────────
  const tabs = ["All", "Pending", "Published"];
  const filtered = activeTab === "All"
    ? reviews
    : reviews.filter((r) => {
        const s = r.status?.toLowerCase();
        if (activeTab === "Published") return s === "published" || s === "approved";
        return s === activeTab.toLowerCase();
      });

  // ── open reply box ───────────────────────────────────────────────────────────
  const openReply = (review) => {
    setReplyingTo(review.review_id ?? review.id);
    setReplyText(review.admin_reply ?? "");
  };

  // ── submit reply ─────────────────────────────────────────────────────────────
  const submitReply = async (reviewId) => {
    if (!replyText.trim()) { toast("Reply cannot be empty.", "error"); return; }
    setSubmitting(true);
    try {
      await api.post(`/reviews/${reviewId}/reply`, { admin_reply: replyText });
      toast("Reply submitted successfully.");
      setReplyingTo(null);
      setReplyText("");
      fetchReviews();
    } catch (err) {
      toast(err.response?.data?.message ?? "Failed to submit reply.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── delete reply ─────────────────────────────────────────────────────────────
  const deleteReply = async (reviewId) => {
    try {
      await api.delete(`/reviews/${reviewId}/reply`);
      toast("Reply removed.");
      fetchReviews();
    } catch (err) {
      toast(err.response?.data?.message ?? "Failed to delete reply.", "error");
    }
  };

  // ── delete review ────────────────────────────────────────────────────────────
  const deleteReview = async (reviewId) => {
    setDeletingId(null);
    try {
      await api.delete(`/reviews/${reviewId}`);
      toast("Review deleted.");
      setReviews((p) => p.filter((r) => (r.review_id ?? r.id) !== reviewId));
    } catch (err) {
      toast(err.response?.data?.message ?? "Failed to delete review.", "error");
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (min-width: 768px) { .ar-burger { display: none !important; } }
        @media (max-width: 767px)  { .ar-burger { display: inline !important; } }
        textarea:focus { border-color: #155DFC !important; box-shadow: 0 0 0 3px rgba(21,93,252,0.12); }
      `}</style>

      <Toast toasts={toasts} />

      {deletingId && (
        <ConfirmModal
          message="Are you sure you want to delete this review? This action cannot be undone."
          onConfirm={() => deleteReview(deletingId)}
          onCancel={() => setDeletingId(null)}
        />
      )}

      <div style={{
        display: "flex", minHeight: "100vh",
        background: "#F0F7F2",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}>
        <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main style={{ flex: 1, padding: "28px 24px", overflowX: "hidden", minWidth: 0 }}>

          {/* ── Top bar ── */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: "24px", flexWrap: "wrap", gap: "12px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                className="ar-burger"
                onClick={() => setSidebarOpen(true)}
                style={{
                  display: "none", background: "none", border: "none",
                  fontSize: "22px", cursor: "pointer", color: "#374151",
                  padding: "4px 8px", borderRadius: "6px",
                }}
              >☰</button>
              <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", margin: 0 }}>
                Reviews
              </h1>
            </div>
            <button
              onClick={fetchReviews}
              style={{
                padding: "7px 16px", borderRadius: "8px", border: "1px solid #D1D5DB",
                background: "#fff", color: "#374151", fontSize: "12px",
                cursor: "pointer", fontWeight: 500,
                display: "flex", alignItems: "center", gap: "6px",
              }}
            >
              {loading ? "⟳ Loading…" : "⟳ Refresh"}
            </button>
          </div>

          {/* ── Stat Cards ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "14px", marginBottom: "20px",
          }}>
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
                <div style={{
                  width: "40px", height: "40px", borderRadius: "10px", background: s.color,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px",
                }}>
                  {s.icon}
                </div>
              </div>
            ))}
          </div>

          {/* ── Filter Tabs ── */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "6px 18px", borderRadius: "8px", border: "none",
                    background: isActive ? "#111827" : "#fff",
                    color: isActive ? "#fff" : "#374151",
                    fontSize: "13px", fontWeight: 500, cursor: "pointer",
                    boxShadow: isActive ? "none" : "0 1px 3px rgba(0,0,0,0.08)",
                    transition: "all 0.15s ease",
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* ── Loading skeleton ── */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[1, 2, 3].map((n) => (
                <div key={n} style={{
                  background: "#fff", borderRadius: "12px", padding: "18px 20px",
                  height: "120px", animation: "pulse 1.4s infinite",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  opacity: 0.6,
                }} />
              ))}
            </div>
          )}

          {/* ── Review Cards ── */}
          {!loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {filtered.map((review) => {
                const rid = review.review_id ?? review.id;
                const cfg = getStatusCfg(review.status);
                const isReplying = replyingTo === rid;
                const userName = review.user?.name ?? review.name ?? "Unknown";
                const userEmail = review.user?.email ?? review.email ?? "";

                return (
                  <div
                    key={rid}
                    style={{
                      background: "rgba(255,255,255,0.95)",
                      borderRadius: "12px", border: "1px solid #E5E7EB",
                      padding: "18px 20px",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                      animation: "fadeInUp 0.2s ease",
                    }}
                  >
                    {/* Header row */}
                    <div style={{
                      display: "flex", alignItems: "flex-start",
                      justifyContent: "space-between",
                      flexWrap: "wrap", gap: "10px", marginBottom: "10px",
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                        <div style={{
                          width: "40px", height: "40px", borderRadius: "50%", flexShrink: 0,
                          background: "linear-gradient(135deg, #2B7FFF, #9810FA)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontWeight: 700, fontSize: "14px",
                        }}>
                          {userName[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "14px", color: "#111827" }}>{userName}</div>
                          <div style={{ fontSize: "11px", color: "#9CA3AF" }}>
                            {userEmail}{userEmail && " · "}{formatDate(review.created_at ?? review.date)}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <StarRating rating={Number(review.rating)} />
                        <span style={{
                          padding: "3px 10px", borderRadius: "5px",
                          fontSize: "11px", fontWeight: 600,
                          background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
                        }}>
                          {cfg.label}
                        </span>
                      </div>
                    </div>

                    {/* Product tag */}
                    {(() => {
                      const productName =
                        typeof review.product === "object"
                          ? (review.product?.product_name ?? review.product?.name ?? null)
                          : review.product ?? null;
                      return productName ? (
                        <div style={{
                          display: "inline-block", padding: "2px 10px",
                          borderRadius: "5px", fontSize: "11px", fontWeight: 500,
                          background: "rgba(77,123,101,0.12)", border: "1px solid rgba(77,123,101,0.3)",
                          color: "#374151", marginBottom: "8px",
                        }}>
                          📦 {productName}
                        </div>
                      ) : null;
                    })()}

                    {/* Review text */}
                    <p style={{
                      fontSize: "13px", color: "#374151", fontWeight: 500,
                      margin: "0 0 12px", lineHeight: "1.6",
                    }}>
                      {review.review_text ?? review.review}
                    </p>

                    {/* Existing admin reply */}
                    {review.admin_reply && !isReplying && (
                      <div style={{
                        background: "#F9FAFB", borderRadius: "8px",
                        padding: "12px 14px", marginBottom: "12px",
                        borderLeft: "3px solid #155DFC",
                      }}>
                        <div style={{
                          display: "flex", alignItems: "center",
                          justifyContent: "space-between", marginBottom: "4px",
                        }}>
                          <span style={{ fontSize: "11px", fontWeight: 600, color: "#155DFC" }}>
                            Admin Reply
                          </span>
                          {review.replied_at && (
                            <span style={{ fontSize: "10px", color: "#9CA3AF" }}>
                              {formatDate(review.replied_at)}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: "12px", color: "#4B5563", margin: 0, lineHeight: "1.6" }}>
                          {review.admin_reply}
                        </p>
                      </div>
                    )}

                    {/* Reply textarea */}
                    {isReplying && (
                      <div style={{ marginBottom: "12px" }}>
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type your reply…"
                          rows={3}
                          style={{
                            width: "100%", padding: "10px 12px",
                            border: "1px solid #D1D5DB", borderRadius: "8px",
                            fontSize: "13px", color: "#374151",
                            resize: "vertical", outline: "none",
                            fontFamily: "inherit", boxSizing: "border-box",
                            transition: "border-color 0.15s, box-shadow 0.15s",
                          }}
                        />
                        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                          <button
                            onClick={() => submitReply(rid)}
                            disabled={submitting}
                            style={{
                              padding: "6px 16px", borderRadius: "6px",
                              border: "none", background: submitting ? "#93C5FD" : "#155DFC",
                              color: "#fff", fontSize: "12px", cursor: submitting ? "not-allowed" : "pointer",
                              fontWeight: 500,
                            }}
                          >
                            {submitting ? "Submitting…" : "Submit Reply"}
                          </button>
                          <button
                            onClick={() => { setReplyingTo(null); setReplyText(""); }}
                            style={{
                              padding: "6px 16px", borderRadius: "6px",
                              border: "1px solid #D1D5DB", background: "#fff",
                              color: "#374151", fontSize: "12px", cursor: "pointer",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Action row */}
                    <div style={{
                      display: "flex", alignItems: "center",
                      gap: "8px", flexWrap: "wrap",
                    }}>
                      {/* Reply / Edit Reply */}
                      {!isReplying && (
                        <button
                          onClick={() => openReply(review)}
                          style={{
                            padding: "5px 14px", borderRadius: "5px",
                            border: "1px solid #D1D5DB", background: "#fff",
                            color: "#374151", fontSize: "12px", cursor: "pointer", fontWeight: 400,
                          }}
                        >
                          {review.admin_reply ? "Edit Reply" : "Reply"}
                        </button>
                      )}

                      {/* Delete Reply (only if a reply exists and not currently editing) */}
                      {review.admin_reply && !isReplying && (
                        <button
                          onClick={() => deleteReply(rid)}
                          style={{
                            padding: "5px 14px", borderRadius: "5px",
                            border: "1px solid #FCA5A5", background: "#fff",
                            color: "#B91C1C", fontSize: "12px", cursor: "pointer", fontWeight: 400,
                          }}
                        >
                          Delete Reply
                        </button>
                      )}

                      {/* Delete Review */}
                      <button
                        onClick={() => setDeletingId(rid)}
                        style={{
                          padding: "5px 14px", borderRadius: "5px",
                          border: "1px solid #C90000", background: "#fff",
                          color: "#9F0712", fontSize: "12px", cursor: "pointer", fontWeight: 400,
                        }}
                      >
                        Delete
                      </button>

                      {/* Rating label */}
                      <span style={{
                        marginLeft: "auto", fontSize: "12px",
                        color: "#9CA3AF", fontWeight: 500,
                      }}>
                        Rating:{" "}
                        <span style={{
                          color: Number(review.rating) >= 4 ? "#E4A107" : "#C90000",
                          fontWeight: 600,
                        }}>
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
          )}

          {/* ── Pagination (count only — extend if backend supports pages) ── */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginTop: "20px", fontSize: "12px", color: "#9CA3AF",
          }}>
            <span>
              Showing {filtered.length} review{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </main>
      </div>
    </>
  );
}