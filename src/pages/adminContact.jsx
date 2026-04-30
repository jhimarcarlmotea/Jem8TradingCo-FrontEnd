import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import AdminNav from "../components/AdminNav";

// ── Design tokens (matching adminReview.jsx) ─────────────────────────────────
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

// ── Status display config ──────────────────────────────────────────────────────
const statusConfig = {
  pending: { bg: T.blue50, color: T.blue600, border: T.blue100, label: "New" },
  read:    { bg: T.amber50, color: T.amber600, border: T.amber100, label: "Replied" },
  replied: { bg: T.green50, color: T.green600, border: T.green100, label: "Resolved" },
};

const TAB_MAP = {
  All:      null,
  New:      "pending",
  Replied:  "read",
  Resolved: "replied",
  Live:     null,
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

// ── Reply Modal ────────────────────────────────────────────────────────────────
function ReplyModal({ contact, onClose, onReplied }) {
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    if (!replyMessage.trim()) return;
    setSending(true);
    setError("");
    try {
      const cid = contact.id ?? contact.message_id;
      if (!cid) throw new Error("Missing contact id");

      const res = await api.post(`/admin/contacts/${cid}/reply`, { reply_message: replyMessage });
      onReplied(cid, res.data.data);
      setSuccess(true);
      setTimeout(() => onClose(), 1400);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to send reply.");
    } finally {
      setSending(false);
    }
  };

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
        width: 520,
        boxShadow: "0 24px 60px rgba(15,23,42,0.18)",
        fontFamily: T.font,
      }}>
        <h2 style={{ margin: "0 0 4px 0", fontSize: 18, fontWeight: 700, color: T.slate900 }}>
          Reply to {contact.first_name} {contact.last_name}
        </h2>
        <p style={{ margin: "0 0 20px 0", fontSize: 12, color: T.slate500 }}>{contact.email}</p>

        {/* Original message */}
        <div style={{
          background: T.slate50,
          border: `1px solid ${T.slate200}`,
          borderRadius: T.radius.md,
          padding: "12px 14px",
          marginBottom: 20,
          fontSize: 13,
          color: T.slate700,
        }}>
          <strong>Original:</strong> {contact.message}
        </div>

        {success ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 12, padding: "24px 0",
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 48, height: 48, fontSize: 24,
              borderRadius: "50%", background: T.green50, color: T.green600,
            }}>
              ✓
            </div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.green700 }}>Reply sent!</p>
            <p style={{ margin: 0, fontSize: 11, color: T.slate400 }}>Email queued for {contact.email}</p>
          </div>
        ) : (
          <>
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your reply here…"
              rows={5}
              style={{
                width: "100%",
                boxSizing: "border-box",
                borderRadius: T.radius.md,
                border: `1px solid ${T.slate300}`,
                padding: "10px 12px",
                fontSize: 13,
                resize: "vertical",
                outline: "none",
                fontFamily: T.font,
                transition: "border-color 0.12s",
              }}
              onFocus={e => e.currentTarget.style.borderColor = T.blue500}
              onBlur={e => e.currentTarget.style.borderColor = T.slate300}
            />

            {error && (
              <p style={{ marginTop: 12, fontSize: 11, color: T.red600 }}>
                ⚠️ {error}
              </p>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button
                onClick={onClose}
                style={{
                  padding: "6px 16px",
                  borderRadius: T.radius.md,
                  border: `1px solid ${T.slate300}`,
                  background: "#fff",
                  color: T.slate700,
                  fontSize: 12,
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
                onClick={handleSend}
                disabled={sending || !replyMessage.trim()}
                style={{
                  padding: "6px 16px",
                  borderRadius: T.radius.md,
                  border: "none",
                  background: (sending || !replyMessage.trim()) ? T.blue300 : T.blue600,
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: (sending || !replyMessage.trim()) ? "not-allowed" : "pointer",
                  transition: "background 0.12s",
                  fontFamily: T.font,
                }}
                onMouseEnter={e => !sending && replyMessage.trim() && (e.currentTarget.style.background = T.blue700)}
                onMouseLeave={e => !sending && replyMessage.trim() && (e.currentTarget.style.background = T.blue600)}
              >
                {sending ? "Sending…" : "✉ Send Reply"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AdminContactMessages() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [replyTarget, setReplyTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [resolvingId, setResolvingId] = useState(null);
  const [toasts, setToasts] = useState([]);

  // ── toast helper ──────────────────────────────────────────────────────────────
  const toast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/contacts");
      setMessages(res.data.data ?? []);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load messages.");
      toast(e.response?.data?.message || "Failed to load messages.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // ── derived stats ─────────────────────────────────────────────────────────────
  const total = messages.length;
  const newMessages = messages.filter((m) => m.status === "pending").length;
  const replied = messages.filter((m) => m.status === "read").length;
  const resolved = messages.filter((m) => m.status === "replied").length;

  const statCards = [
    { label: "Total Messages", value: total, bg: T.blue50, accent: T.blue600, icon: "✉️" },
    { label: "New", value: newMessages, bg: T.blue50, accent: T.blue600, icon: "🆕" },
    { label: "Replied", value: replied, bg: T.amber50, accent: T.amber600, icon: "↩️" },
    { label: "Resolved", value: resolved, bg: T.green50, accent: T.green600, icon: "✓" },
  ];

  const handleDelete = async (id) => {
    setDeletingId(null);
    try {
      await api.delete(`/admin/contacts/${id}`);
      toast("Message deleted successfully.");
      setMessages((prev) => prev.filter((m) => m.id !== id && m.message_id !== id));
    } catch (e) {
      toast(e.response?.data?.message || "Delete failed.", "error");
    }
  };

  const handleReplied = (id, updatedContact) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id || m.message_id === id
          ? { ...m, ...(updatedContact ?? {}), status: "read" }
          : m
      )
    );
    toast("Reply sent successfully.");
  };

  const handleResolve = async (id) => {
    setResolvingId(id);
    try {
      await api.patch(`/admin/contacts/${id}/resolve`);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id || m.message_id === id ? { ...m, status: "replied" } : m
        )
      );
      toast("Message marked as resolved.");
    } catch (e) {
      toast(e.response?.data?.message || "Failed to resolve message.", "error");
    } finally {
      setResolvingId(null);
    }
  };

  const countFor = (key) => {
    if (key === "All" || key === "Live") return messages.length;
    return messages.filter((m) => m.status === TAB_MAP[key]).length;
  };

  const tabs = ["All", "New", "Replied", "Resolved", "Live"].map((k) => ({
    key: k, label: k, count: k !== "Live" ? countFor(k) : null,
  }));

  const filtered =
    activeTab === "All" || activeTab === "Live"
      ? messages
      : messages.filter((m) => m.status === TAB_MAP[activeTab]);

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
          message="Are you sure you want to delete this message? This action cannot be undone."
          onConfirm={() => handleDelete(deletingId)}
          onCancel={() => setDeletingId(null)}
        />
      )}

      {replyTarget && (
        <ReplyModal
          contact={replyTarget}
          onClose={() => setReplyTarget(null)}
          onReplied={handleReplied}
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
              <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.slate900, letterSpacing: "-0.3px" }}>Contact Messages</h1>
              <p style={{ margin: "1px 0 0", fontSize: 11, color: T.slate400 }}>View and respond to customer messages</p>
            </div>
          </div>
          <button
            onClick={fetchMessages}
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
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
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
                {tab.label}{tab.count !== null ? ` (${tab.count})` : ""}
              </button>
            );
          })}
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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

        {/* Error */}
        {error && !loading && (
          <div style={{
            background: T.red50, border: `1px solid ${T.red200}`,
            borderRadius: T.radius.lg, padding: "14px 18px",
            marginBottom: 16, display: "flex", alignItems: "center",
            justifyContent: "space-between", flexWrap: "wrap", gap: 12,
          }}>
            <span style={{ fontSize: 13, color: T.red700 }}>⚠️ {error}</span>
            <button
              onClick={fetchMessages}
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

        {/* Message Cards */}
        {!loading && !error && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filtered.map((msg) => {
              const id = msg.id ?? msg.message_id;
              const cfg = getStatusCfg(msg.status);
              const isResolved = msg.status === "replied";

              return (
                <div
                  key={id}
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
                        {((msg.first_name?.[0] || msg.email?.[0] || 'U').toUpperCase())}
                      </div>
                      <div>
                        <div style={{
                          fontSize: 14, fontWeight: 600, color: T.slate900,
                        }}>
                          {msg.first_name} {msg.last_name}
                        </div>
                        <div style={{ fontSize: 11, color: T.slate400, marginTop: 2 }}>
                          {msg.email}{msg.phone_number ? ` · 📞 ${msg.phone_number}` : ""} · {formatDate(msg.created_at)}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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

                  {/* Message text */}
                  <p style={{
                    margin: "0 0 12px 0", fontSize: 13, fontWeight: 500,
                    lineHeight: 1.6, color: T.slate700,
                  }}>
                    {msg.message}
                  </p>

                  {/* Show previous reply if already replied */}
                  {msg.reply_message && (
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
                        {msg.replied_at && (
                          <span style={{ fontSize: 10, color: T.slate400 }}>
                            {formatDate(msg.replied_at)}
                          </span>
                        )}
                      </div>
                      <p style={{
                        margin: 0, fontSize: 12, lineHeight: 1.6,
                        color: T.slate600,
                      }}>
                        {msg.reply_message}
                      </p>
                    </div>
                  )}

                  {/* Action row */}
                  <div style={{
                    display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8,
                  }}>
                    <button
                      onClick={() => setReplyTarget(msg)}
                      style={{
                        padding: "4px 14px", borderRadius: T.radius.sm,
                        border: `1px solid ${T.slate300}`, background: "#fff",
                        color: T.slate700, fontSize: 12, cursor: "pointer",
                        transition: "background 0.12s", fontFamily: T.font,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = T.slate50}
                      onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                    >
                      {isResolved ? "↩ Re-reply" : "Reply"}
                    </button>

                    {/* Resolve — hidden once already resolved */}
                    {!isResolved && (
                      <button
                        onClick={() => handleResolve(id)}
                        disabled={resolvingId === id}
                        style={{
                          padding: "4px 14px", borderRadius: T.radius.sm,
                          border: `1px solid ${T.green500}`, background: "#fff",
                          color: T.green600, fontSize: 12, fontWeight: 500,
                          cursor: resolvingId === id ? "not-allowed" : "pointer",
                          opacity: resolvingId === id ? 0.6 : 1,
                          transition: "background 0.12s", fontFamily: T.font,
                        }}
                        onMouseEnter={e => !resolvingId && (e.currentTarget.style.background = T.green50)}
                        onMouseLeave={e => !resolvingId && (e.currentTarget.style.background = "#fff")}
                      >
                        {resolvingId === id ? "…" : "✓ Resolve"}
                      </button>
                    )}

                    <button
                      onClick={() => setDeletingId(id)}
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
                      ID: #{id}
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
                No messages found.
              </div>
            )}
          </div>
        )}

        {/* Pagination count */}
        {!loading && !error && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginTop: 20, fontSize: 11, color: T.slate400,
          }}>
            <span>Showing {filtered.length} message{filtered.length !== 1 ? "s" : ""}</span>
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 2, 3].map((p) => (
                <button
                  key={p}
                  style={{
                    width: 28, height: 28, borderRadius: T.radius.sm,
                    fontSize: 12, fontWeight: 500, cursor: "pointer",
                    transition: "all 0.12s", fontFamily: T.font,
                    background: p === 1 ? T.blue600 : "#fff",
                    color: p === 1 ? "#fff" : T.slate600,
                    border: p === 1 ? "none" : `1px solid ${T.slate200}`,
                  }}
                  onMouseEnter={e => p !== 1 && (e.currentTarget.style.background = T.slate50)}
                  onMouseLeave={e => p !== 1 && (e.currentTarget.style.background = "#fff")}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}