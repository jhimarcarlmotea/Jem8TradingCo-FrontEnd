import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import AdminNav from "../components/AdminNav";
import { Link } from "react-router-dom";

// ── Design tokens ────────────────────────────────────────────────────────────
const T = {
  blue50: "#EFF6FF", blue100: "#DBEAFE", blue500: "#3B82F6", blue600: "#2563EB", blue700: "#1D4ED8",
  green50: "#ECFDF5", green100: "#D1FAE5", green500: "#10B981", green600: "#059669",
  amber50: "#FFFBEB", amber100: "#FEF3C7", amber500: "#F59E0B", amber600: "#D97706",
  red50: "#FEF2F2", red100: "#FEE2E2", red500: "#EF4444", red600: "#DC2626",
  slate50: "#F8FAFC", slate100: "#F1F5F9", slate200: "#E2E8F0", slate300: "#CBD5E1",
  slate400: "#94A3B8", slate500: "#64748B", slate600: "#475569",
  slate700: "#374151", slate800: "#1E293B", slate900: "#0F172A",
  radius: { sm: 8, md: 12, lg: 16, xl: 20 },
  shadow: { sm: "0 1px 2px rgba(15,23,42,0.05)", md: "0 4px 12px rgba(15,23,42,0.08)", hover: "0 8px 24px rgba(15,23,42,0.12)" },
  font: "'DM Sans','Nunito',system-ui,sans-serif",
};

// ─── Axios instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StarRating({ rating, max = 5 }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{
          fontSize: 14,
          color: i < rating ? T.amber500 : T.slate300,
        }}>
          ★
        </span>
      ))}
    </div>
  );
}

const statusConfig = {
  published: { 
    bg: T.green50, 
    color: T.green600, 
    border: T.green100,
    label: "Published" 
  },
  approved: { 
    bg: T.green50, 
    color: T.green600, 
    border: T.green100,
    label: "Published" 
  },
  pending: { 
    bg: T.slate100, 
    color: T.slate600, 
    border: T.slate200,
    label: "Pending" 
  },
  rejected: { 
    bg: T.red100, 
    color: T.red600, 
    border: T.red100,
    label: "Rejected" 
  },
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
      position: "fixed", bottom: 24, right: 24,
      display: "flex", flexDirection: "column", gap: 8,
      zIndex: 9999,
    }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            padding: "10px 16px",
            borderRadius: T.radius.md,
            fontSize: 13,
            fontWeight: 500,
            boxShadow: T.shadow.md,
            border: `1px solid ${t.type === "error" ? T.red100 : T.green100}`,
            background: t.type === "error" ? T.red50 : T.green50,
            color: t.type === "error" ? T.red600 : T.green600,
            fontFamily: T.font,
          }}
        >
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
      position: "fixed", inset: 0,
      background: "rgba(15, 23, 42, 0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000,
    }}>
      <div style={{
        background: "#fff",
        borderRadius: T.radius.xl,
        padding: 28,
        maxWidth: "90vw",
        width: 320,
        boxShadow: "0 24px 60px rgba(15,23,42,0.18)",
        fontFamily: T.font,
      }}>
        <div style={{ fontSize: 20, marginBottom: 10 }}>🗑️</div>
        <p style={{ 
          margin: "0 0 20px 0",
          fontSize: 14,
          lineHeight: 1.5,
          color: T.slate700,
        }}>
          {message}
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            onClick={onCancel}
            style={{
              padding: "6px 16px",
              borderRadius: T.radius.md,
              border: `1px solid ${T.slate300}`,
              background: "#fff",
              color: T.slate700,
              fontSize: 14,
              cursor: "pointer",
              transition: "background 0.12s",
              fontFamily: T.font,
              fontWeight: 500,
            }}
            onMouseEnter={e => e.currentTarget.style.background = T.slate50}
            onMouseLeave={e => e.currentTarget.style.background = "#fff"}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "6px 16px",
              borderRadius: T.radius.md,
              border: "none",
              background: T.red600,
              color: "#fff",
              fontSize: 14,
              cursor: "pointer",
              fontWeight: 600,
              transition: "background 0.12s",
              fontFamily: T.font,
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#c41c1c"}
            onMouseLeave={e => e.currentTarget.style.background = T.red600}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminReviews() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab]     = useState("All");
  const [reviews, setReviews]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [replyingTo, setReplyingTo]   = useState(null);
  const [replyText, setReplyText]     = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [deletingId, setDeletingId]   = useState(null);
  const [toasts, setToasts]           = useState([]);

  // ── toast helper ──────────────────────────────────────────────────────────────
  const toast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);

  // ── fetch all reviews ─────────────────────────────────────────────────────────
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/reviews");
      const list = data.data ?? data ?? [];
      // Debug: log first review shape to help diagnose missing name issues
      try { console.debug('adminReviews: first review sample:', list && list.length ? list[0] : null); } catch (e) {}

      // Hydrate reviews with `user` object when only `user_id` is present
      const hydrated = await Promise.all(
        (Array.isArray(list) ? list : []).map(async (r) => {
          if (r.user) return r;
          const uid = r.user_id ?? r.userId ?? r.userID ?? r.user?.id;
          if (!uid && uid !== 0) return r;
          try {
            const acc = await api.get(`/findaccount/${uid}`);
            const u = acc.data?.data ?? acc.data?.user ?? acc.data;
            return { ...r, user: u };
          } catch (err) {
            return r;
          }
        })
      );

      setReviews(hydrated);
    } catch (err) {
      toast(err.response?.data?.message ?? "Failed to load reviews.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  // ── derived stats ─────────────────────────────────────────────────────────────
  const total     = reviews.length;
  const published = reviews.filter((r) => ["published", "approved"].includes(r.status?.toLowerCase())).length;
  const pending   = reviews.filter((r) => r.status?.toLowerCase() === "pending").length;
  const avgRating = total
    ? (reviews.reduce((s, r) => s + Number(r.rating), 0) / total).toFixed(1)
    : "—";

  const statCards = [
    { label: "Total Reviews",  value: total,     sub: null,       bg: T.blue50,    accent: T.blue600,    icon: "⭐" },
    { label: "Average Rating", value: avgRating, sub: "out of 5", bg: T.amber50,   accent: T.amber600,   icon: "📊" },
    { label: "Published",      value: published, sub: null,       bg: T.green50,   accent: T.green600,   icon: "✅" },
    { label: "Pending",        value: pending,   sub: null,       bg: T.red50,     accent: T.red600,     icon: "⏳" },
  ];

  // ── tab filtering ─────────────────────────────────────────────────────────────
  const tabs = ["All", "Pending", "Published"];
  const filtered = activeTab === "All"
    ? reviews
    : reviews.filter((r) => {
        const s = r.status?.toLowerCase();
        if (activeTab === "Published") return s === "published" || s === "approved";
        return s === activeTab.toLowerCase();
      });

  // ── open reply box ────────────────────────────────────────────────────────────
  const openReply = (review) => {
    setReplyingTo(review.review_id ?? review.id);
    setReplyText(review.admin_reply ?? "");
  };

  // ── submit reply ──────────────────────────────────────────────────────────────
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

  // ── delete reply ──────────────────────────────────────────────────────────────
  const deleteReply = async (reviewId) => {
    try {
      await api.delete(`/reviews/${reviewId}/reply`);
      toast("Reply removed.");
      fetchReviews();
    } catch (err) {
      toast(err.response?.data?.message ?? "Failed to delete reply.", "error");
    }
  };

  // ── update status (approve / unpublish) ───────────────────────────────────────
  const updateStatus = async (reviewId, status) => {
    try {
      await api.patch(`/reviews/${reviewId}`, { status });
      toast(
        status === "approved"
          ? "Review approved and published."
          : "Review unpublished."
      );
      setReviews((p) =>
        p.map((r) => (r.review_id ?? r.id) === reviewId ? { ...r, status } : r)
      );
    } catch (err) {
      toast(err.response?.data?.message ?? "Failed to update status.", "error");
    }
  };

  // ── delete review ─────────────────────────────────────────────────────────────
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
    <div style={{
      display: "flex", minHeight: "100vh",
     background: "#F0F4F8", fontFamily: T.font,
    }}>

      <style>{`
        .ap-hamburger { display: flex; }
        @media (min-width: 1024px) { .ap-hamburger { display: none !important; } }
      `}</style>
      <Toast toasts={toasts} />

      {deletingId && (
        <ConfirmModal
          message="Are you sure you want to delete this review? This action cannot be undone."
          onConfirm={() => deleteReview(deletingId)}
          onCancel={() => setDeletingId(null)}
        />
      )}

      <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main style={{
  flex: 1, minWidth: 0, padding: "20px 20px",
  overflowX: "hidden",
}}>

        {/* Top bar */}
        <div style={{
  display: "flex", alignItems: "center", justifyContent: "space-between",
  gap: 12, marginBottom: 20, background: "#fff", borderRadius: T.radius.lg,
  padding: "12px 16px", border: `1px solid ${T.slate200}`,
  boxShadow: T.shadow.sm, flexWrap: "wrap",
}}>
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <button
      onClick={() => setSidebarOpen(true)}
      className="ap-hamburger"
      style={{
        background: "none", border: `1px solid ${T.slate200}`,
        borderRadius: T.radius.sm, width: 36, height: 36,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", fontSize: 18, color: T.slate700,
      }}
    >
      ☰
    </button>
    <div>
      <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.slate900, letterSpacing: "-0.3px" }}>Reviews</h1>
      <p style={{ margin: "1px 0 0", fontSize: 11, color: T.slate400 }}>Manage customer reviews</p>
    </div>
  </div>
  <button
    onClick={fetchReviews}
    style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "8px 14px", borderRadius: T.radius.sm,
      border: `1px solid ${T.slate200}`, background: "#fff",
      color: T.slate700, fontSize: 12, fontWeight: 600,
      cursor: "pointer", transition: "background 0.12s", fontFamily: T.font,
    }}
    onMouseEnter={e => e.currentTarget.style.background = T.slate50}
    onMouseLeave={e => e.currentTarget.style.background = "#fff"}
  >
    {loading ? "⟳ Loading…" : "⟳ Refresh"}
  </button>
</div>

        {/* Stat Cards */}
        <div style={{
  display: "grid", gap: 10, marginBottom: 16,
  gridTemplateColumns: "repeat(4, 1fr)",
}}>
  {statCards.map((s) => (
    <div
      key={s.label}
      style={{
        background: "#fff", borderRadius: T.radius.lg, padding: "16px",
        border: `1px solid ${T.slate200}`, boxShadow: T.shadow.sm,
        position: "relative", overflow: "hidden", transition: "all 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = T.shadow.hover; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = T.shadow.sm; }}
    >
      {/* Accent top bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: s.accent, borderRadius: `${T.radius.lg}px ${T.radius.lg}px 0 0`,
      }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{
            fontSize: 10, fontWeight: 600, color: T.slate400,
            textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6,
          }}>
            {s.label}
          </div>
          <div style={{
            fontSize: 28, fontWeight: 800, color: T.slate900,
            letterSpacing: "-0.5px", lineHeight: 1,
          }}>
            {s.value}
          </div>
          {s.sub && (
            <div style={{ fontSize: 10, color: T.slate400, marginTop: 4 }}>{s.sub}</div>
          )}
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: T.radius.sm,
          background: s.bg, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 16, flexShrink: 0,
        }}>
          {s.icon}
        </div>
      </div>
    </div>
  ))}
</div>

        {/* Filter Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "nowrap" }}>
  {tabs.map((tab) => {
    const isActive = activeTab === tab;
    return (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        style={{
          padding: "7px 16px", borderRadius: T.radius.sm,
          fontSize: 12, fontWeight: 600,
          cursor: "pointer", transition: "all 0.12s", whiteSpace: "nowrap",
          flexShrink: 0, fontFamily: T.font,
          background: isActive ? T.blue600 : "#fff",
          color: isActive ? "#fff" : T.slate600,
          border: isActive ? "none" : `1px solid ${T.slate200}`,
          boxShadow: isActive ? "0 2px 8px rgba(37,99,235,0.25)" : T.shadow.sm,
        }}
        onMouseEnter={e => !isActive && (e.currentTarget.style.background = T.slate50)}
        onMouseLeave={e => !isActive && (e.currentTarget.style.background = "#fff")}
      >
        {tab}
      </button>
    );
  })}
</div>

        {/* Loading Skeleton */}
        {loading && (
          <div style={{
            display: "flex", flexDirection: "column", gap: 16,
          }}>
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                style={{
                  padding: 20, background: "#fff", boxShadow: T.shadow.sm,
                  borderRadius: T.radius.lg, height: 112, opacity: 0.6,
                  animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                }}
              />
            ))}
          </div>
        )}

        {/* Review Cards */}
        {!loading && (
          <div style={{
            display: "flex", flexDirection: "column", gap: 16,
          }}>
            {filtered.map((review) => {
              const rid        = review.review_id ?? review.id;
              const cfg        = getStatusCfg(review.status);
              const isReplying = replyingTo === rid;
              const isPublished =
                review.status?.toLowerCase() === "approved" ||
                review.status?.toLowerCase() === "published";
              const userName = (() => {
                const safeStr = (v) => {
                  if (!v && v !== 0) return null;
                  try { v = String(v).trim(); } catch (e) { return null; }
                  if (!v) return null;
                  if (v.toLowerCase() === 'null' || v.toLowerCase() === 'undefined') return null;
                  return v;
                };

                // 1) review.user can be an object or a string
                const u = review.user;
                if (typeof u === 'string') {
                  const s = safeStr(u);
                  if (s) return s;
                }
                if (u && typeof u === 'object') {
                  const cand = u.name || u.full_name || u.display_name || u.username || u.user_name || u.first_name || u.last_name || (u.data && (u.data.name || u.data.full_name));
                  const joined = (u.first_name || u.fname) && (u.last_name || u.lname) ? `${u.first_name || u.fname} ${u.last_name || u.lname}` : null;
                  const s = safeStr(cand) || safeStr(joined);
                  if (s) return s;
                }

                // 2) common review-level fields
                const reviewLevel = [
                  review.name,
                  review.full_name,
                  review.author_name,
                  review.customer_name,
                  review.reviewer_name,
                  review.display_name,
                  review.first_name && review.last_name ? `${review.first_name} ${review.last_name}` : null,
                ].map(safeStr).find(Boolean);
                if (reviewLevel) return reviewLevel;

                // 3) nested alternatives (account, customer, author)
                const nested = (
                  review.account || review.customer || review.author || review.user_data || review.userInfo || {}
                );
                if (nested && typeof nested === 'object') {
                  const cand = nested.name || nested.full_name || nested.display_name || (nested.first_name && nested.last_name ? `${nested.first_name} ${nested.last_name}` : null);
                  const s = safeStr(cand);
                  if (s) return s;
                }

                // 4) fall back to email local part
                if (review.email) {
                  const s = safeStr(review.email);
                  if (s) return (s.split('@')[0] || s);
                }

                return "Unknown";
              })();
              const userEmail  = review.user?.email ?? review.email ?? "";
              const productName =
                typeof review.product === "object"
                  ? (review.product?.product_name ?? review.product?.name ?? null)
                  : review.product ?? null;

              return (
                <div
                  key={rid}
                  style={{
                    padding: "20px", border: `1px solid ${T.slate200}`,
                    boxShadow: T.shadow.sm, background: "#fff",
                    borderRadius: T.radius.lg, fontFamily: T.font,
                  }}
                >
                  {/* Header row */}
                  <div style={{
                    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                    flexWrap: "wrap", gap: 10, marginBottom: 10,
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        width: 40, height: 40, fontSize: 14, fontWeight: 700,
                        color: "#fff", borderRadius: "50%", flexShrink: 0,
                        background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
                      }}>
                        {((userName && userName[0]) ? userName[0].toUpperCase() : 'U')}
                      </div>
                      <div>
                        <div style={{
                          fontSize: 14, fontWeight: 600, color: T.slate900,
                        }}>
                          {userName}
                        </div>
                        <div style={{ fontSize: 11, color: T.slate400, marginTop: 2 }}>
                          {userEmail}{userEmail && " · "}{formatDate(review.created_at ?? review.date)}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <StarRating rating={Number(review.rating)} />
                      <span style={{
                        padding: "4px 10px", borderRadius: T.radius.sm,
                        fontSize: 11, fontWeight: 700,
                        background: cfg.bg, color: cfg.color,
                        border: `1px solid ${cfg.border}`,
                      }}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Product tag */}
                  {productName && (
                    <Link
                      to={`/products/${review.product?.id ?? review.product_id}`}
                      style={{
                        display: "inline-block", padding: "4px 10px",
                        borderRadius: T.radius.sm, fontSize: 11, fontWeight: 500,
                        background: "rgba(16,185,129,0.08)",
                        border: "1px solid rgba(16,185,129,0.3)",
                        color: T.slate700, marginBottom: 12,
                        textDecoration: "none", transition: "background 0.12s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(16,185,129,0.15)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(16,185,129,0.08)"}
                    >
                      📦 {productName}
                    </Link>
                  )}

                  {/* Review text */}
                  <p style={{
                    margin: "0 0 12px 0", fontSize: 12, fontWeight: 500,
                    lineHeight: 1.6, color: T.slate700,
                  }}>
                    {review.review_text ?? review.review}
                  </p>

                  {/* Admin reply */}
                  {review.admin_reply && !isReplying && (
                    <div style={{
                      background: T.slate50, borderRadius: T.radius.md,
                      padding: "12px 14px", marginBottom: 12,
                      borderLeft: `3px solid ${T.blue600}`,
                    }}>
                      <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        marginBottom: 4,
                      }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, color: T.blue600,
                        }}>
                          Admin Reply
                        </span>
                        {review.replied_at && (
                          <span style={{ fontSize: 10, color: T.slate400 }}>
                            {formatDate(review.replied_at)}
                          </span>
                        )}
                      </div>
                      <p style={{
                        margin: 0, fontSize: 12, lineHeight: 1.6,
                        color: T.slate600,
                      }}>
                        {review.admin_reply}
                      </p>
                    </div>
                  )}

                  {/* Reply textarea */}
                  {isReplying && (
                    <div style={{ marginBottom: 12 }}>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply..."
                        rows={3}
                        style={{
                          width: "100%", padding: "10px 12px",
                          border: `1px solid ${T.slate300}`, borderRadius: T.radius.md,
                          fontSize: 12, color: T.slate700, fontFamily: T.font,
                          outline: "none", boxSizing: "border-box", resize: "vertical",
                          transition: "border-color 0.12s",
                        }}
                        onFocus={e => e.currentTarget.style.borderColor = T.blue500}
                        onBlur={e => e.currentTarget.style.borderColor = T.slate300}
                      />
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <button
                          onClick={() => submitReply(rid)}
                          disabled={submitting}
                          style={{
                            padding: "6px 16px", borderRadius: T.radius.md,
                            border: "none", color: "#fff", fontSize: 12,
                            fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer",
                            transition: "background 0.12s", fontFamily: T.font,
                            background: submitting ? T.blue500 : T.blue600,
                          }}
                          onMouseEnter={e => !submitting && (e.currentTarget.style.background = "#1e40af")}
                          onMouseLeave={e => !submitting && (e.currentTarget.style.background = T.blue600)}
                        >
                          {submitting ? "Submitting…" : "Submit Reply"}
                        </button>
                        <button
                          onClick={() => { setReplyingTo(null); setReplyText(""); }}
                          style={{
                            padding: "6px 16px", borderRadius: T.radius.md,
                            border: `1px solid ${T.slate300}`, background: "#fff",
                            color: T.slate700, fontSize: 12, cursor: "pointer",
                            transition: "background 0.12s", fontFamily: T.font,
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = T.slate50}
                          onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action row */}
                  <div style={{
                    display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8,
                  }}>

                    {/* Approve button — shown only when NOT published */}
                    {!isPublished && (
                      <button
                        onClick={() => updateStatus(rid, "approved")}
                        style={{
                          padding: "4px 14px", borderRadius: T.radius.sm,
                          border: `1px solid ${T.green500}`, background: "#fff",
                          color: T.green600, fontSize: 12, fontWeight: 600,
                          cursor: "pointer", transition: "background 0.12s", fontFamily: T.font,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = T.green50}
                        onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                      >
                        ✓ Approve
                      </button>
                    )}

                    {/* Unpublish button — shown only when published */}
                    {isPublished && (
                      <button
                        onClick={() => updateStatus(rid, "pending")}
                        style={{
                          padding: "4px 14px", borderRadius: T.radius.sm,
                          border: `1px solid ${T.slate400}`, background: "#fff",
                          color: T.slate600, fontSize: 12, fontWeight: 600,
                          cursor: "pointer", transition: "background 0.12s", fontFamily: T.font,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = T.slate50}
                        onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                      >
                        Unpublish
                      </button>
                    )}

                    {/* Reply button */}
                    {!isReplying && (
                      <button
                        onClick={() => openReply(review)}
                        style={{
                          padding: "4px 14px", borderRadius: T.radius.sm,
                          border: `1px solid ${T.slate300}`, background: "#fff",
                          color: T.slate700, fontSize: 12, cursor: "pointer",
                          transition: "background 0.12s", fontFamily: T.font,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = T.slate50}
                        onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                      >
                        {review.admin_reply ? "Edit Reply" : "Reply"}
                      </button>
                    )}

                    {/* Delete Reply button */}
                    {review.admin_reply && !isReplying && (
                      <button
                        onClick={() => deleteReply(rid)}
                        style={{
                          padding: "4px 14px", borderRadius: T.radius.sm,
                          border: `1px solid ${T.red300}`, background: "#fff",
                          color: T.red600, fontSize: 12, cursor: "pointer",
                          transition: "background 0.12s", fontFamily: T.font,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = T.red50}
                        onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                      >
                        Delete Reply
                      </button>
                    )}

                    {/* Delete review button */}
                    <button
                      onClick={() => setDeletingId(rid)}
                      style={{
                        padding: "4px 14px", borderRadius: T.radius.sm,
                        border: `1px solid ${T.red600}`, background: "#fff",
                        color: T.red600, fontSize: 12, cursor: "pointer",
                        transition: "background 0.12s", fontFamily: T.font,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = T.red50}
                      onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                    >
                      Delete
                    </button>

                    <span style={{
                      marginLeft: "auto", fontSize: 12, fontWeight: 600,
                      color: T.slate400, fontFamily: T.font,
                    }}>
                      Rating:{" "}
                      <span style={{
                        fontWeight: 700,
                        color: Number(review.rating) >= 4 ? T.amber500 : T.red600,
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
                padding: 40, fontSize: 14, textAlign: "center",
                color: T.slate400, background: "#fff",
                boxShadow: T.shadow.sm, borderRadius: T.radius.lg,
                fontFamily: T.font,
              }}>
                No reviews found.
              </div>
            )}
          </div>
        )}

        {/* Pagination count */}
        <div className="flex items-center justify-between mt-5 text-xs text-gray-400">
          <span>Showing {filtered.length} review{filtered.length !== 1 ? "s" : ""}</span>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                className={`w-7 h-7 rounded-md text-xs font-medium cursor-pointer transition-colors
                  ${p === 1
                    ? "bg-blue-600 text-white border-none"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}