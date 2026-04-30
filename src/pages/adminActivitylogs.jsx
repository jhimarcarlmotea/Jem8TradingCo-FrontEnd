import { useState, useEffect, useCallback } from "react";
import AdminNav from "../components/AdminNav";
import api from "../api/axios";

// ── Design tokens (matching adminReview.jsx) ─────────────────────────────────
const T = {
  blue50: "#EFF6FF", blue100: "#DBEAFE", blue500: "#3B82F6", blue600: "#2563EB", blue700: "#1D4ED8",
  green50: "#ECFDF5", green100: "#D1FAE5", green500: "#10B981", green600: "#059669",
  amber50: "#FFFBEB", amber100: "#FEF3C7", amber500: "#F59E0B", amber600: "#D97706",
  red50: "#FEF2F2", red100: "#FEE2E2", red500: "#EF4444", red600: "#DC2626",
  violet50: "#F5F3FF", violet100: "#EDE9FE", violet500: "#8B5CF6", violet600: "#7C3AED",
  orange50: "#FFF7ED", orange100: "#FFEDD5", orange500: "#F97316", orange600: "#EA580C",
  rose50: "#FFF1F2", rose100: "#FFE4E6", rose500: "#F43F5E", rose600: "#E11D48",
  emerald50: "#ECFDF5", emerald100: "#D1FAE5", emerald500: "#10B981", emerald600: "#059669",
  slate50: "#F8FAFC", slate100: "#F1F5F9", slate200: "#E2E8F0", slate300: "#CBD5E1",
  slate400: "#94A3B8", slate500: "#64748B", slate600: "#475569",
  slate700: "#374151", slate800: "#1E293B", slate900: "#0F172A",
  radius: { sm: 8, md: 12, lg: 16, xl: 20 },
  shadow: { sm: "0 1px 2px rgba(15,23,42,0.05)", md: "0 4px 12px rgba(15,23,42,0.08)", hover: "0 8px 24px rgba(15,23,42,0.12)" },
  font: "'DM Sans','Nunito',system-ui,sans-serif",
};

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS = ["All", "Orders", "Stock", "Account", "Blogs", "Payments", "Backups"];

const TAB_TO_CATEGORY = {
  All: "all",
  Orders: "orders",
  Stock: "stock",
  Account: "account",
  Blogs: "blogs",
  Payments: "payments",
  Backups: "backups",
};

const BADGE_STYLES = {
  orders: { bg: T.blue50, color: T.blue600, border: T.blue100 },
  stock: { bg: T.green50, color: T.green600, border: T.green100 },
  blogs: { bg: T.orange50, color: T.orange600, border: T.orange100 },
  backups: { bg: T.violet50, color: T.violet600, border: T.violet100 },
  payments: { bg: T.emerald50, color: T.emerald600, border: T.emerald100 },
  account: { bg: T.rose50, color: T.rose600, border: T.rose100 },
  other: { bg: T.slate50, color: T.slate600, border: T.slate200 },
};

const CATEGORY_ICONS = {
  orders: "🛒",
  stock: "📦",
  blogs: "📝",
  backups: "💾",
  payments: "💳",
  account: "👤",
  other: "📋",
};

const CATEGORY_GRADIENTS = {
  orders: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
  stock: "linear-gradient(135deg, #10B981, #34D399)",
  blogs: "linear-gradient(135deg, #F97316, #FBBF24)",
  backups: "linear-gradient(135deg, #8B5CF6, #C084FC)",
  payments: "linear-gradient(135deg, #059669, #10B981)",
  account: "linear-gradient(135deg, #F43F5E, #FB7185)",
  other: "linear-gradient(135deg, #64748B, #94A3B8)",
};

// ── Timezone for display (Asia/Manila = UTC+8) ────────────────────────────────
const DISPLAY_TZ = "Asia/Manila";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

function groupLabel(log) {
  const iso = log.logged_at_iso;
  if (iso) {
    try {
      return new Intl.DateTimeFormat("en-PH", {
        timeZone: DISPLAY_TZ,
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(iso));
    } catch {
      // fall through
    }
  }

  if (log.logged_at_date) {
    try {
      const d = new Date(`${log.logged_at_date}T00:00:00+08:00`);
      return new Intl.DateTimeFormat("en-PH", {
        timeZone: DISPLAY_TZ,
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(d);
    } catch {
      return log.logged_at_date;
    }
  }

  return log.logged_at ?? "Unknown date";
}

function displayTime(log) {
  if (log.logged_at_time) return log.logged_at_time;

  if (log.logged_at_iso) {
    try {
      return new Intl.DateTimeFormat("en-PH", {
        timeZone: DISPLAY_TZ,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(log.logged_at_iso));
    } catch {
      // fall through
    }
  }

  return "";
}

function displayInline(log) {
  if (log.logged_at) return log.logged_at;

  if (log.logged_at_iso) {
    try {
      const date = new Intl.DateTimeFormat("en-PH", {
        timeZone: DISPLAY_TZ,
        month: "short",
        day: "numeric",
      }).format(new Date(log.logged_at_iso));

      const time = new Intl.DateTimeFormat("en-PH", {
        timeZone: DISPLAY_TZ,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
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

function groupLogsByDate(logs) {
  const map = {};
  for (const log of logs) {
    const label = groupLabel(log);
    if (!map[label]) map[label] = [];
    map[label].push(log);
  }
  return map;
}

// ── Toast ────────────────────────────────────────────────────────────────────
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

// ── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel, loading }) {
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
        width: 380,
        boxShadow: "0 24px 60px rgba(15,23,42,0.18)",
        fontFamily: T.font,
        textAlign: "center",
      }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>⚠️</div>
        <h3 style={{ 
          margin: "0 0 8px 0", fontSize: 16, fontWeight: 700, 
          color: T.slate900, letterSpacing: "-0.3px",
        }}>
          {message.title}
        </h3>
        <p style={{ 
          margin: "0 0 24px 0", fontSize: 13, 
          color: T.slate500, lineHeight: 1.5,
        }}>
          {message.body}
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: "8px 20px",
              borderRadius: T.radius.md,
              border: `1px solid ${T.slate300}`,
              background: "#fff",
              color: T.slate700,
              fontSize: 13,
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.12s",
              fontFamily: T.font,
            }}
            onMouseEnter={e => !loading && (e.currentTarget.style.background = T.slate50)}
            onMouseLeave={e => !loading && (e.currentTarget.style.background = "#fff")}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: "8px 20px",
              borderRadius: T.radius.md,
              border: "none",
              background: T.red600,
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.12s",
              fontFamily: T.font,
            }}
            onMouseEnter={e => !loading && (e.currentTarget.style.background = "#c41c1c")}
            onMouseLeave={e => !loading && (e.currentTarget.style.background = T.red600)}
          >
            {loading ? "Processing..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Stat Card Component ──────────────────────────────────────────────────────
function StatCard({ label, value, icon, bg, accent }) {
  return (
    <div
      style={{
        background: "#fff", borderRadius: T.radius.lg, padding: "16px",
        border: `1px solid ${T.slate200}`, boxShadow: T.shadow.sm,
        position: "relative", overflow: "hidden", transition: "all 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = T.shadow.hover; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = T.shadow.sm; }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: accent, borderRadius: `${T.radius.lg}px ${T.radius.lg}px 0 0`,
      }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{
            fontSize: 10, fontWeight: 600, color: T.slate400,
            textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6,
          }}>
            {label}
          </div>
          <div style={{
            fontSize: 28, fontWeight: 800, color: T.slate900,
            letterSpacing: "-0.5px", lineHeight: 1,
          }}>
            {value}
          </div>
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: T.radius.sm,
          background: bg, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 16, flexShrink: 0,
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ── Tab Bar Component ────────────────────────────────────────────────────────
function TabBar({ activeTab, onSelect, counts }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => onSelect(tab)}
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
            {tab}{counts[tab] !== undefined ? ` (${counts[tab]})` : ""}
          </button>
        );
      })}
    </div>
  );
}

// ── Log Item Component ───────────────────────────────────────────────────────
function LogItem({ log, onDelete }) {
  const cat = log.category ?? "other";
  const badgeStyle = BADGE_STYLES[cat] ?? BADGE_STYLES.other;
  const icon = CATEGORY_ICONS[cat] ?? "📋";
  const gradient = CATEGORY_GRADIENTS[cat] ?? CATEGORY_GRADIENTS.other;
  const badge = buildBadge(log);
  const amountStr = log.amount ? ` · ₱${Number(log.amount).toFixed(2)}` : "";

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      padding: "20px", borderBottom: `1px solid ${T.slate100}`,
      transition: "background 0.12s", gap: 16,
    }}
    onMouseEnter={e => e.currentTarget.style.background = T.slate50}
    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      
      {/* Left side */}
      <div style={{ display: "flex", gap: 14, flex: 1, minWidth: 0 }}>
        {/* Icon with gradient background */}
        <div style={{
          width: 40, height: 40, borderRadius: T.radius.md,
          background: gradient, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 18, flexShrink: 0,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}>
          {icon}
        </div>

        {/* Details */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: T.slate900 }}>
              {log.user_name}
            </span>
            <span style={{ fontSize: 11, color: T.slate400, fontWeight: 500 }}>
              ({log.role ?? "user"})
            </span>
            <span style={{ fontSize: 13, color: T.slate600 }}>
              {log.action}
            </span>
            <span style={{
              display: "inline-flex", alignItems: "center", padding: "2px 8px",
              borderRadius: T.radius.sm, fontSize: 10, fontWeight: 600,
              fontFamily: "monospace", background: badgeStyle.bg,
              color: badgeStyle.color, border: `1px solid ${badgeStyle.border}`,
            }}>
              {badge}{amountStr}
            </span>
            {log.mode_of_payment && (
              <span style={{
                display: "inline-flex", alignItems: "center", padding: "2px 8px",
                borderRadius: T.radius.sm, fontSize: 10, fontWeight: 500,
                background: T.slate50, color: T.slate500, border: `1px solid ${T.slate200}`,
              }}>
                via {log.mode_of_payment}
              </span>
            )}
          </div>

          {log.description && (
            <p style={{ margin: "0 0 6px 0", fontSize: 12, color: T.slate500, lineHeight: 1.5 }}>
              {log.description}
            </p>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, color: T.slate400, fontFamily: "monospace" }}>
              {displayInline(log)}
            </span>
            <span style={{
              display: "inline-flex", alignItems: "center", padding: "2px 8px",
              borderRadius: T.radius.sm, fontSize: 9, fontWeight: 700,
              background: T.slate50, color: T.slate400, border: `1px solid ${T.slate200}`,
              textTransform: "uppercase", letterSpacing: "0.3px",
            }}>
              {cat}
            </span>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: T.slate400, fontFamily: "monospace", fontWeight: 500 }}>
          {displayTime(log)}
        </span>
        <button
          onClick={() => onDelete(log)}
          style={{
            padding: "4px 12px", borderRadius: T.radius.sm,
            border: `1px solid ${T.red200}`, background: T.red50,
            fontSize: 11, fontWeight: 600, color: T.red600,
            cursor: "pointer", transition: "all 0.12s", fontFamily: T.font,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = T.red600;
            e.currentTarget.style.color = "#fff";
            e.currentTarget.style.borderColor = T.red600;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = T.red50;
            e.currentTarget.style.color = T.red600;
            e.currentTarget.style.borderColor = T.red200;
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// ── Log Group Component ──────────────────────────────────────────────────────
function LogGroup({ date, items, onDelete }) {
  return (
    <div>
      {/* Date divider */}
      <div style={{
        display: "flex", alignItems: "center", gap: 14, marginBottom: 12,
      }}>
        <span style={{
          fontSize: 13, fontWeight: 600, color: T.slate500,
          letterSpacing: "-0.2px", whiteSpace: "nowrap",
        }}>
          {date}
        </span>
        <div style={{ flex: 1, height: 1, background: T.slate200 }} />
      </div>

      {/* Log card */}
      <div style={{
        background: "#fff", borderRadius: T.radius.lg,
        border: `1px solid ${T.slate200}`, boxShadow: T.shadow.sm,
        overflow: "hidden",
      }}>
        {items.map((log) => (
          <LogItem key={log.id} log={log} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

// ── Pagination Component ──────────────────────────────────────────────────────
function Pagination({ pagination, page, onPrev, onNext }) {
  if (!pagination || pagination.last_page <= 1) return null;

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: 12, marginTop: 24,
    }}>
      <button
        disabled={page <= 1}
        onClick={onPrev}
        style={{
          padding: "6px 16px", borderRadius: T.radius.sm,
          border: `1px solid ${T.slate200}`, background: "#fff",
          fontSize: 12, fontWeight: 500, color: T.slate600,
          cursor: page <= 1 ? "not-allowed" : "pointer",
          opacity: page <= 1 ? 0.5 : 1,
          transition: "background 0.12s", fontFamily: T.font,
        }}
        onMouseEnter={e => page > 1 && (e.currentTarget.style.background = T.slate50)}
        onMouseLeave={e => page > 1 && (e.currentTarget.style.background = "#fff")}
      >
        ← Prev
      </button>
      <span style={{ fontSize: 12, color: T.slate400, fontFamily: "monospace" }}>
        {pagination.current_page} / {pagination.last_page}
      </span>
      <button
        disabled={page >= pagination.last_page}
        onClick={onNext}
        style={{
          padding: "6px 16px", borderRadius: T.radius.sm,
          border: `1px solid ${T.slate200}`, background: "#fff",
          fontSize: 12, fontWeight: 500, color: T.slate600,
          cursor: page >= pagination.last_page ? "not-allowed" : "pointer",
          opacity: page >= pagination.last_page ? 0.5 : 1,
          transition: "background 0.12s", fontFamily: T.font,
        }}
        onMouseEnter={e => page < pagination.last_page && (e.currentTarget.style.background = T.slate50)}
        onMouseLeave={e => page < pagination.last_page && (e.currentTarget.style.background = "#fff")}
      >
        Next →
      </button>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function AdminActivityLog() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [logs, setLogs] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Toast helper
  const toast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);

  // Category counts
  const categoryCounts = TABS.reduce((acc, tab) => {
    if (tab === "All") {
      acc[tab] = logs.length;
    } else {
      const category = TAB_TO_CATEGORY[tab];
      acc[tab] = logs.filter(log => log.category === category).length;
    }
    return acc;
  }, {});

  const totalLogs = logs.length;

  // Stats for stat cards
  const uniqueUsers = new Set(logs.map(log => log.user_name)).size;
  const statCards = [
    { label: "Total Activities", value: totalLogs, icon: "📊", bg: T.blue50, accent: T.blue600 },
    { label: "Unique Users", value: uniqueUsers, icon: "👥", bg: T.violet50, accent: T.violet600 },
    { label: "Categories", value: Object.keys(grouped).length, icon: "🏷️", bg: T.amber50, accent: T.amber600 },
    { label: "Pages", value: pagination?.last_page || 1, icon: "📄", bg: T.green50, accent: T.green600 },
  ];

  // Fetch logs
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
        const serverGrouped = res.data.data.grouped ?? {};
        const flat = Object.values(serverGrouped).flat();
        setLogs(flat);
        setGrouped(groupLogsByDate(flat));
        setPagination(res.data.data.pagination ?? null);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message ?? err.message;
      setError(errorMsg);
      toast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, page, toast]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { setPage(1); }, [activeTab, search]);

  // Delete single log
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await api.delete(`/admin/activity-logs/${deleteTarget.id}`);
      toast("Activity log deleted successfully.");
      setDeleteTarget(null);
      fetchLogs();
    } catch (err) {
      toast(err.response?.data?.message ?? "Delete failed.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete all logs in current category
  const handleDeleteAll = async () => {
    setActionLoading(true);
    try {
      await api.delete(`/admin/activity-logs`, {
        params: { category: TAB_TO_CATEGORY[activeTab] ?? "all" },
      });
      toast(`All ${activeTab !== "All" ? activeTab : ""} logs cleared successfully.`);
      setDeleteAllConfirm(false);
      fetchLogs();
    } catch (err) {
      toast(err.response?.data?.message ?? "Clear failed.", "error");
    } finally {
      setActionLoading(false);
    }
  };

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

      {/* Delete single confirmation modal */}
      {deleteTarget && (
        <ConfirmModal
          message={{
            title: "Delete this activity?",
            body: "This action is permanent and cannot be undone.",
          }}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={actionLoading}
        />
      )}

      {/* Delete all confirmation modal */}
      {deleteAllConfirm && (
        <ConfirmModal
          message={{
            title: `Clear ${activeTab !== "All" ? activeTab : "all"} logs?`,
            body: `This will permanently delete ${activeTab === "All" ? "every activity log" : `all ${activeTab} logs`}. This cannot be undone.`,
          }}
          onConfirm={handleDeleteAll}
          onCancel={() => setDeleteAllConfirm(false)}
          loading={actionLoading}
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
              <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.slate900, letterSpacing: "-0.3px" }}>Activity Log</h1>
              <p style={{ margin: "1px 0 0", fontSize: 11, color: T.slate400 }}>Track all system activities and user actions</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {/* Search */}
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: 10, top: "50%",
                transform: "translateY(-50%)", fontSize: 12, color: T.slate400,
              }}>
                🔍
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search activity..."
                style={{
                  padding: "6px 10px 6px 30px", borderRadius: T.radius.sm,
                  border: `1px solid ${T.slate200}`, fontSize: 12,
                  fontFamily: T.font, outline: "none", width: 200,
                  transition: "border-color 0.12s",
                }}
                onFocus={e => e.currentTarget.style.borderColor = T.blue500}
                onBlur={e => e.currentTarget.style.borderColor = T.slate200}
              />
            </div>

            {/* Clear button */}
            <button
              onClick={() => setDeleteAllConfirm(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: T.radius.sm,
                border: `1px solid ${T.red200}`, background: T.red50,
                color: T.red600, fontSize: 12, fontWeight: 600,
                cursor: "pointer", transition: "all 0.12s", fontFamily: T.font,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = T.red600;
                e.currentTarget.style.color = "#fff";
                e.currentTarget.style.borderColor = T.red600;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = T.red50;
                e.currentTarget.style.color = T.red600;
                e.currentTarget.style.borderColor = T.red200;
              }}
            >
              🗑️ Clear {activeTab !== "All" ? activeTab : "All"}
            </button>

            {/* Refresh button */}
            <button
              onClick={fetchLogs}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: T.radius.sm,
                border: `1px solid ${T.slate200}`, background: "#fff",
                color: T.slate700, fontSize: 12, fontWeight: 500,
                cursor: "pointer", transition: "background 0.12s", fontFamily: T.font,
              }}
              onMouseEnter={e => e.currentTarget.style.background = T.slate50}
              onMouseLeave={e => e.currentTarget.style.background = "#fff"}
            >
              {loading ? "⟳ Loading..." : "⟳ Refresh"}
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div style={{
          display: "grid", gap: 10, marginBottom: 20,
          gridTemplateColumns: "repeat(4, 1fr)",
        }}>
          {statCards.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        {/* Tabs */}
        <TabBar activeTab={activeTab} onSelect={setActiveTab} counts={categoryCounts} />

        {/* Loading state */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                style={{
                  padding: 20, background: "#fff", boxShadow: T.shadow.sm,
                  borderRadius: T.radius.lg, height: 120, opacity: 0.6,
                  animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                }}
              />
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div style={{
            background: T.red50, border: `1px solid ${T.red200}`,
            borderRadius: T.radius.lg, padding: "14px 18px",
            marginBottom: 16, display: "flex", alignItems: "center",
            justifyContent: "space-between", flexWrap: "wrap", gap: 12,
          }}>
            <span style={{ fontSize: 13, color: T.red700 }}>⚠️ {error}</span>
            <button
              onClick={fetchLogs}
              style={{
                padding: "4px 12px", borderRadius: T.radius.sm,
                border: `1px solid ${T.red300}`, background: "#fff",
                color: T.red600, fontSize: 12, cursor: "pointer",
                transition: "background 0.12s", fontFamily: T.font,
              }}
              onMouseEnter={e => e.currentTarget.style.background = T.red50}
              onMouseLeave={e => e.currentTarget.style.background = "#fff"}
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && totalLogs === 0 && (
          <div style={{
            padding: 60, fontSize: 14, textAlign: "center",
            color: T.slate400, background: "#fff",
            boxShadow: T.shadow.sm, borderRadius: T.radius.lg,
            fontFamily: T.font,
          }}>
            No activity logs found.
          </div>
        )}

        {/* Log groups */}
        {!loading && !error && totalLogs > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {Object.entries(grouped).map(([date, items]) => (
              <LogGroup key={date} date={date} items={items} onDelete={setDeleteTarget} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalLogs > 0 && (
          <Pagination
            pagination={pagination}
            page={page}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(pagination?.last_page || 1, p + 1))}
          />
        )}
      </main>
    </div>
  );
}