import { useState, useEffect, useCallback } from "react";
import AdminNav from "../components/AdminNav";
import api from "../api/axios";

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS = ["All", "Orders", "Stock", "Account", "Blogs", "Payments", "Backups"];

const TAB_TO_CATEGORY = {
  All:      "all",
  Orders:   "orders",
  Stock:    "stock",
  Account:  "account",
  Blogs:    "blogs",
  Payments: "payments",
  Backups:  "backups",
};

const BADGE_STYLES = {
  orders:   "bg-blue-50 text-blue-600 border-blue-200",
  stock:    "bg-green-50 text-green-700 border-green-200",
  blogs:    "bg-orange-50 text-orange-700 border-orange-200",
  backups:  "bg-violet-50 text-violet-700 border-violet-200",
  payments: "bg-emerald-50 text-emerald-600 border-emerald-200",
  account:  "bg-rose-50 text-rose-600 border-rose-200",
  other:    "bg-gray-50 text-gray-600 border-gray-200",
};

const CATEGORY_ICONS = {
  orders:   "🛒",
  stock:    "📦",
  blogs:    "📝",
  backups:  "💾",
  payments: "💳",
  account:  "👤",
  other:    "📋",
};

// ── Timezone for display (Asia/Manila = UTC+8) ────────────────────────────────
const DISPLAY_TZ = "Asia/Manila";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Convert an ISO 8601 string (with +08:00 offset supplied by the API) into a
 * human-readable date-group label in Asia/Manila timezone.
 *
 * Falls back to the raw `logged_at` string (e.g. "Jul 15 at 2:30 PM") from the
 * API if the ISO string is missing or unparseable.
 */
function groupLabel(log) {
  // Prefer logged_at_iso (ISO 8601 with +08:00 offset) for reliable parsing
  const iso = log.logged_at_iso;
  if (iso) {
    try {
      return new Intl.DateTimeFormat("en-PH", {
        timeZone: DISPLAY_TZ,
        weekday: "long",
        year:    "numeric",
        month:   "long",
        day:     "numeric",
      }).format(new Date(iso));
    } catch {
      // fall through
    }
  }

  // Fallback: derive from logged_at_date (YYYY-MM-DD) if available
  if (log.logged_at_date) {
    try {
      // Append T00:00:00+08:00 so the parser treats it as Manila midnight
      const d = new Date(`${log.logged_at_date}T00:00:00+08:00`);
      return new Intl.DateTimeFormat("en-PH", {
        timeZone: DISPLAY_TZ,
        weekday: "long",
        year:    "numeric",
        month:   "long",
        day:     "numeric",
      }).format(d);
    } catch {
      return log.logged_at_date;
    }
  }

  // Last resort: server-formatted string (e.g. "Jul 15 at 2:30 PM")
  return log.logged_at ?? "Unknown date";
}

/**
 * Format a time string for the right-side column.
 * Uses logged_at_time from the API (already Manila-formatted, e.g. "2:30 PM").
 * If that's absent, derives from the ISO string.
 */
function displayTime(log) {
  if (log.logged_at_time) return log.logged_at_time;

  if (log.logged_at_iso) {
    try {
      return new Intl.DateTimeFormat("en-PH", {
        timeZone: DISPLAY_TZ,
        hour:     "numeric",
        minute:   "2-digit",
        hour12:   true,
      }).format(new Date(log.logged_at_iso));
    } catch {
      // fall through
    }
  }

  return "";
}

/**
 * Format the inline timestamp ("Jul 15 at 2:30 PM") for the log item body.
 */
function displayInline(log) {
  // API already returns this formatted: "Jul 15 at 2:30 PM"
  if (log.logged_at) return log.logged_at;

  if (log.logged_at_iso) {
    try {
      const date = new Intl.DateTimeFormat("en-PH", {
        timeZone: DISPLAY_TZ,
        month:    "short",
        day:      "numeric",
      }).format(new Date(log.logged_at_iso));

      const time = new Intl.DateTimeFormat("en-PH", {
        timeZone: DISPLAY_TZ,
        hour:     "numeric",
        minute:   "2-digit",
        hour12:   true,
      }).format(new Date(log.logged_at_iso));

      return `${date} at ${time}`;
    } catch {
      // fall through
    }
  }

  return "—";
}

function buildBadge(log) {
  if (log.product_unique_code) return log.product_unique_code.toUpperCase();
  if (log.reference_table && log.reference_id)
    return `${log.reference_table.toUpperCase()} - ${String(log.reference_id).padStart(3, "0")}`;
  return log.category?.toUpperCase() ?? "LOG";
}

/**
 * Group a flat array of log items by their Manila-localised date label.
 * We do the grouping on the frontend using logged_at_iso so we're not dependent
 * on the server-side grouping (which can lag if the server clock is misconfigured).
 */
function groupLogsByDate(logs) {
  const map = {};
  for (const log of logs) {
    const label = groupLabel(log);
    if (!map[label]) map[label] = [];
    map[label].push(log);
  }
  return map;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TabBar({ activeTab, onSelect }) {
  return (
    <div className="flex gap-2 flex-wrap mb-7">
      {TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => onSelect(tab)}
          className={`px-5 py-2 rounded-lg border text-sm font-[inherit] cursor-pointer shadow-sm transition-all
            ${activeTab === tab
              ? "bg-slate-900 text-white border-slate-900 font-semibold"
              : "bg-white text-slate-500 border-gray-200 font-medium hover:bg-gray-50 hover:text-slate-900 hover:border-slate-300"
            }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

function LogItem({ log, onDelete }) {
  const cat        = log.category ?? "other";
  const badgeStyle = BADGE_STYLES[cat] ?? BADGE_STYLES.other;
  const icon       = CATEGORY_ICONS[cat] ?? "📋";
  const badge      = buildBadge(log);
  const amountStr  = log.amount ? ` · ₱${Number(log.amount).toFixed(2)}` : "";

  return (
    <div className="flex items-start justify-between px-5 py-4 border-b border-slate-50 last:border-b-0 hover:bg-[#F8FBFF] transition-colors gap-4 max-md:flex-col max-md:gap-3">
      {/* Left */}
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        {/* Category icon */}
        <div className="w-[38px] h-[38px] rounded-lg bg-gray-50 border border-slate-100 flex items-center justify-center text-lg shrink-0">
          {icon}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-1 min-w-0">
          {/* Actor + action badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-900">{log.user_name}</span>
            <span className="text-xs text-slate-400 font-medium capitalize">({log.role ?? "user"})</span>
            <span className="text-sm text-slate-500">{log.action}</span>

            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-mono border ${badgeStyle}`}>
              {badge}{amountStr}
            </span>

            {log.mode_of_payment && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border bg-slate-50 text-slate-500 border-slate-200">
                via {log.mode_of_payment}
              </span>
            )}
          </div>

          {/* Auto-generated description */}
          {log.description && (
            <p className="text-xs text-slate-500 m-0">{log.description}</p>
          )}

          {/* Timestamp + category pill */}
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-slate-400 font-mono">{displayInline(log)}</span>
            <span className="inline-flex items-center px-2 py-px rounded bg-gray-50 border border-gray-200 text-[10px] font-bold text-slate-400 tracking-wide uppercase">
              {cat}
            </span>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex flex-col items-end gap-2.5 shrink-0 max-md:flex-row max-md:items-center max-md:w-full max-md:justify-between">
        <span className="text-xs font-medium text-slate-400 font-mono whitespace-nowrap">
          {displayTime(log)}
        </span>
        <button
          onClick={() => onDelete(log.id)}
          className="px-3.5 py-1 rounded-md border border-red-200 bg-red-50 text-xs font-semibold text-red-500 cursor-pointer whitespace-nowrap hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function LogGroup({ date, items, onDelete }) {
  return (
    <div>
      {/* Date divider */}
      <div className="flex items-center gap-3.5 mb-3.5">
        <span className="text-sm font-semibold text-slate-500 whitespace-nowrap tracking-tight">{date}</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Log card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {items.map((log) => (
          <LogItem key={log.id} log={log} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

function Pagination({ pagination, page, onPrev, onNext }) {
  if (!pagination || pagination.last_page <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 pt-2">
      <button
        disabled={page <= 1}
        onClick={onPrev}
        className="px-4 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-slate-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
      >
        ← Prev
      </button>
      <span className="text-sm text-slate-400 font-mono">
        {pagination.current_page} / {pagination.last_page}
      </span>
      <button
        disabled={page >= pagination.last_page}
        onClick={onNext}
        className="px-4 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-slate-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
      >
        Next →
      </button>
    </div>
  );
}

function ConfirmModal({ onClose, onConfirm, loading, icon, title, body, confirmLabel }) {
  return (
    <div
      onClick={() => !loading && onClose()}
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-5"
      style={{ animation: "overlayIn 0.2s ease" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[18px] p-8 w-full max-w-[380px] text-center shadow-[0_16px_48px_rgba(15,23,42,0.14),0_4px_16px_rgba(15,23,42,0.06)] border border-slate-100"
        style={{ animation: "modalIn 0.2s ease" }}
      >
        <span className="text-[40px] block mb-3.5">{icon}</span>
        <h3 className="text-base font-bold text-slate-900 m-0 mb-2 tracking-tight">{title}</h3>
        <p className="text-sm text-slate-400 m-0 mb-6 leading-relaxed">{body}</p>
        <div className="flex gap-2.5 justify-center">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-slate-500 cursor-pointer hover:bg-gray-50 hover:text-slate-900 transition-colors font-[inherit] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2 rounded-lg border-none bg-red-500 text-sm font-semibold text-white cursor-pointer shadow-[0_2px_8px_rgba(239,68,68,0.3)] hover:bg-red-600 hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(239,68,68,0.4)] transition-all font-[inherit] disabled:opacity-50"
          >
            {loading ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminActivityLog() {
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [activeTab,     setActiveTab]     = useState("All");
  const [search,        setSearch]        = useState("");

  // Raw flat list from API — we do client-side grouping for reliable TZ display
  const [logs,          setLogs]          = useState([]);
  // Grouped map derived from logs
  const [grouped,       setGrouped]       = useState({});

  const [pagination,    setPagination]    = useState(null);
  const [page,          setPage]          = useState(1);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState(null);
  const [deleteId,      setDeleteId]      = useState(null);
  const [deletingAll,   setDeletingAll]   = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // ── Fetch ───────────────────────────────────────────────────────────────────

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/admin/activity-logs", {
        params: {
          page,
          category: TAB_TO_CATEGORY[activeTab] ?? "all",
          ...(search.trim() ? { search: search.trim() } : {}),
        },
      });

      if (res.data.status === "success") {
        // The server returns grouped logs — flatten them so we can re-group
        // on the frontend using the ISO timestamp for correct TZ handling.
        const serverGrouped = res.data.data.grouped ?? {};
        const flat = Object.values(serverGrouped).flat();

        // Re-group using client-side Manila TZ conversion
        setLogs(flat);
        setGrouped(groupLogsByDate(flat));
        setPagination(res.data.data.pagination ?? null);
      }
    } catch (err) {
      setError(err.response?.data?.message ?? err.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Reset page when filter changes
  useEffect(() => { setPage(1); }, [activeTab, search]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteId) return;
    setActionLoading(true);
    try {
      await api.delete(`/admin/activity-logs/${deleteId}`);
      setDeleteId(null);
      fetchLogs();
    } catch (err) {
      alert(`Delete failed: ${err.response?.data?.message ?? err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    setActionLoading(true);
    try {
      await api.delete(`/admin/activity-logs`, {
        params: { category: TAB_TO_CATEGORY[activeTab] ?? "all" },
      });
      setDeletingAll(false);
      fetchLogs();
    } catch (err) {
      alert(`Clear failed: ${err.response?.data?.message ?? err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const totalLogs = logs.length;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalIn   { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>

      <div className="flex min-h-screen bg-[#F0F7F2] font-sans text-slate-900">
        <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 min-w-0 px-7 py-7 pb-12 overflow-x-hidden max-md:px-4 max-md:py-5">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3.5">
            <div className="flex items-center gap-3.5">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden bg-white border border-gray-200 text-base cursor-pointer text-slate-500 px-2.5 py-1.5 rounded-md shadow-sm hover:bg-gray-50 hover:text-slate-900 transition-all"
              >
                ☰
              </button>
              <h1 className="text-xl font-bold text-slate-900 m-0 tracking-tight">Activity Log</h1>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Search */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">🔍</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search Activity..."
                  className="py-2 pl-8 pr-4 rounded-lg border border-gray-200 text-sm font-[inherit] text-slate-900 outline-none bg-white w-60 shadow-sm placeholder-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/8 transition-all max-md:w-40"
                />
              </div>

              {/* Clear */}
              <button
                onClick={() => setDeletingAll(true)}
                className="px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-sm font-semibold text-red-500 cursor-pointer whitespace-nowrap hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
              >
                🗑 Clear {activeTab !== "All" ? activeTab : "All"}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <TabBar activeTab={activeTab} onSelect={setActiveTab} />

          {/* States */}
          {loading && (
            <div className="text-center text-slate-400 text-sm py-16 animate-pulse">
              Loading activity logs…
            </div>
          )}

          {!loading && error && (
            <div className="text-center text-red-400 text-sm py-16">
              ⚠️ {error}
              <button onClick={fetchLogs} className="ml-3 underline text-blue-500 hover:text-blue-700">
                Retry
              </button>
            </div>
          )}

          {!loading && !error && totalLogs === 0 && (
            <div className="text-center text-slate-400 text-sm py-16">No activity found.</div>
          )}

          {/* Log groups */}
          {!loading && !error && totalLogs > 0 && (
            <div className="flex flex-col gap-6">
              {Object.entries(grouped).map(([date, items]) => (
                <LogGroup key={date} date={date} items={items} onDelete={setDeleteId} />
              ))}

              <Pagination
                pagination={pagination}
                page={page}
                onPrev={() => setPage((p) => Math.max(1, p - 1))}
                onNext={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
              />
            </div>
          )}
        </main>
      </div>

      {/* Delete single modal */}
      {deleteId && (
        <ConfirmModal
          icon="🗑️"
          title="Delete this activity?"
          body="This action is permanent and cannot be undone."
          confirmLabel="Delete"
          loading={actionLoading}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
        />
      )}

      {/* Clear all modal */}
      {deletingAll && (
        <ConfirmModal
          icon="⚠️"
          title={`Clear ${activeTab !== "All" ? activeTab : "all"} logs?`}
          body={
            <>
              This will permanently delete{" "}
              <strong className="text-slate-600">
                {activeTab === "All" ? "every activity log" : `all ${activeTab} logs`}
              </strong>
              . This cannot be undone.
            </>
          }
          confirmLabel="Yes, Clear"
          loading={actionLoading}
          onClose={() => setDeletingAll(false)}
          onConfirm={handleDeleteAll}
        />
      )}
    </>
  );
}