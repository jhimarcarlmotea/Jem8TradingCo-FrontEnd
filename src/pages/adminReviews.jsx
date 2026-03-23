import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import AdminNav from "../components/AdminNav";

// ─── Axios instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StarRating({ rating, max = 5 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={`text-sm ${i < rating ? "text-amber-400" : "text-gray-300"}`}>
          ★
        </span>
      ))}
    </div>
  );
}

const statusConfig = {
  published: { className: "bg-[#C6FFC9] border border-[#76CD8C] text-[#247132]", label: "Published" },
  approved:  { className: "bg-[#C6FFC9] border border-[#76CD8C] text-[#247132]", label: "Published" },
  pending:   { className: "bg-gray-200 border border-[#DFDFDF] text-gray-700",    label: "Pending"   },
  rejected:  { className: "bg-red-100 border border-red-300 text-red-800",        label: "Rejected"  },
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
    <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-[9999]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-2.5 rounded-lg text-[13px] font-medium shadow-md border ${
            t.type === "error"
              ? "bg-red-50 border-red-300 text-red-800"
              : "bg-emerald-50 border-emerald-300 text-emerald-800"
          }`}
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
    <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-[1000]">
      <div className="bg-white rounded-2xl p-7 max-w-sm w-[90%] shadow-2xl">
        <div className="text-xl mb-2.5">🗑️</div>
        <p className="text-sm text-gray-700 mb-5 leading-relaxed">{message}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm cursor-pointer hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-1.5 rounded-lg border-none bg-red-600 text-white text-sm cursor-pointer font-semibold hover:bg-red-700 transition-colors"
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

  // ── toast helper ─────────────────────────────────────────────────────────────
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
      setReviews(data.data ?? []);
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
    { label: "Total Reviews",  value: total,     sub: null,       color: "bg-blue-50",    accent: "text-blue-600",   icon: "⭐" },
    { label: "Average Rating", value: avgRating, sub: "out of 5", color: "bg-amber-50",   accent: "text-amber-600",  icon: "📊" },
    { label: "Published",      value: published, sub: null,       color: "bg-emerald-50", accent: "text-emerald-600",icon: "✅" },
    { label: "Pending",        value: pending,   sub: null,       color: "bg-red-50",     accent: "text-red-600",    icon: "⏳" },
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
    <div className="flex min-h-screen bg-[#F0F7F2] font-sans">
      <Toast toasts={toasts} />

      {deletingId && (
        <ConfirmModal
          message="Are you sure you want to delete this review? This action cannot be undone."
          onConfirm={() => deleteReview(deletingId)}
          onCancel={() => setDeletingId(null)}
        />
      )}

      <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="flex-1 px-6 py-7 overflow-x-hidden min-w-0">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden bg-transparent border-none text-[22px] cursor-pointer text-gray-700 px-2 py-1 rounded-md hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
            <h1 className="text-xl font-bold text-gray-900 m-0">Reviews</h1>
          </div>
          <button
            onClick={fetchReviews}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs font-medium cursor-pointer hover:bg-gray-50 transition-colors"
          >
            {loading ? "⟳ Loading…" : "⟳ Refresh"}
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid gap-3.5 mb-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
          {statCards.map((s) => (
            <div key={s.label} className="bg-white rounded-xl px-4 py-4 flex items-center justify-between shadow-sm">
              <div>
                <div className="text-[11px] text-gray-400 mb-1">{s.label}</div>
                <div className={`text-[22px] font-bold ${s.accent}`}>{s.value}</div>
                {s.sub && <div className="text-[11px] text-gray-400">{s.sub}</div>}
              </div>
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center text-lg`}>
                {s.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg border-none text-xs font-medium cursor-pointer transition-all
                  ${isActive
                    ? "bg-gray-900 text-white shadow-none"
                    : "bg-white text-gray-700 shadow-sm hover:bg-gray-50"
                  }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-xl p-5 h-28 animate-pulse shadow-sm opacity-60" />
            ))}
          </div>
        )}

        {/* Review Cards */}
        {!loading && (
          <div className="flex flex-col gap-4">
            {filtered.map((review) => {
              const rid       = review.review_id ?? review.id;
              const cfg       = getStatusCfg(review.status);
              const isReplying = replyingTo === rid;
              const userName  = review.user?.name  ?? review.name  ?? "Unknown";
              const userEmail = review.user?.email ?? review.email ?? "";
              const productName =
                typeof review.product === "object"
                  ? (review.product?.product_name ?? review.product?.name ?? null)
                  : review.product ?? null;

              return (
                <div
                  key={rid}
                  className="bg-white/90 rounded-xl border border-gray-200 px-5 py-4 shadow-sm"
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between flex-wrap gap-2.5 mb-2.5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                        {userName[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-gray-900">{userName}</div>
                        <div className="text-[11px] text-gray-400">
                          {userEmail}{userEmail && " · "}{formatDate(review.created_at ?? review.date)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <StarRating rating={Number(review.rating)} />
                      <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Product tag */}
                  {productName && (
                    <div className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-[rgba(77,123,101,0.12)] border border-[rgba(77,123,101,0.3)] text-gray-700 mb-2">
                      📦 {productName}
                    </div>
                  )}

                  {/* Review text */}
                  <p className="text-xs text-gray-700 font-medium m-0 mb-3 leading-relaxed">
                    {review.review_text ?? review.review}
                  </p>

                  {/* Admin reply */}
                  {review.admin_reply && !isReplying && (
                    <div className="bg-gray-50 rounded-lg px-3.5 py-3 mb-3 border-l-[3px] border-blue-600">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-blue-600">Admin Reply</span>
                        {review.replied_at && (
                          <span className="text-[10px] text-gray-400">{formatDate(review.replied_at)}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 m-0 leading-relaxed">{review.admin_reply}</p>
                    </div>
                  )}

                  {/* Reply textarea */}
                  {isReplying && (
                    <div className="mb-3">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply..."
                        rows={3}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-xs text-gray-700 resize-y outline-none font-[inherit] focus:border-blue-400 transition-colors"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => submitReply(rid)}
                          disabled={submitting}
                          className={`px-4 py-1.5 rounded-md border-none text-white text-xs font-medium transition-colors ${
                            submitting
                              ? "bg-blue-300 cursor-not-allowed"
                              : "bg-blue-600 cursor-pointer hover:bg-blue-700"
                          }`}
                        >
                          {submitting ? "Submitting…" : "Submit Reply"}
                        </button>
                        <button
                          onClick={() => { setReplyingTo(null); setReplyText(""); }}
                          className="px-4 py-1.5 rounded-md border border-gray-300 bg-white text-gray-700 text-xs cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {!isReplying && (
                      <button
                        onClick={() => openReply(review)}
                        className="px-3.5 py-1 rounded-md border border-gray-300 bg-white text-gray-700 text-xs cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        {review.admin_reply ? "Edit Reply" : "Reply"}
                      </button>
                    )}

                    {review.admin_reply && !isReplying && (
                      <button
                        onClick={() => deleteReply(rid)}
                        className="px-3.5 py-1 rounded-md border border-red-300 bg-white text-red-700 text-xs cursor-pointer hover:bg-red-50 transition-colors"
                      >
                        Delete Reply
                      </button>
                    )}

                    <button
                      onClick={() => setDeletingId(rid)}
                      className="px-3.5 py-1 rounded-md border border-[#C90000] bg-white text-[#9F0712] text-xs cursor-pointer hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>

                    <span className="ml-auto text-xs text-gray-400 font-medium">
                      Rating:{" "}
                      <span className={`font-semibold ${Number(review.rating) >= 4 ? "text-amber-500" : "text-red-700"}`}>
                        {review.rating}/5
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="bg-white rounded-xl p-10 text-center text-gray-400 text-sm shadow-sm">
                No reviews found.
              </div>
            )}
          </div>
        )}

        {/* Pagination count */}
        <div className="flex justify-between items-center mt-5 text-xs text-gray-400">
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