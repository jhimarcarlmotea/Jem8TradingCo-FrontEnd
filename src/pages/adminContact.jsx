import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import AdminNav from "../components/AdminNav";

// ── Status display config ──────────────────────────────────────────────────────
const statusConfig = {
  pending: { badge: "bg-[#DAF5FF] border border-[#B9CFF8] text-blue-600",    label: "New"      },
  read:    { badge: "bg-[#FAF1E3] border border-[#F8E1BC] text-amber-600",   label: "Replied"  },
  replied: { badge: "bg-[#E4F6F0] border border-[#BAEADA] text-emerald-600", label: "Resolved" },
};

const TAB_MAP = {
  All:      null,
  New:      "pending",
  Replied:  "read",
  Resolved: "replied",
  Live:     null,
};

// ── Reply Modal ────────────────────────────────────────────────────────────────
function ReplyModal({ contact, onClose, onReplied }) {
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending]           = useState(false);
  const [error, setError]               = useState("");
  const [success, setSuccess]           = useState(false);

  const handleSend = async () => {
    if (!replyMessage.trim()) return;
    setSending(true);
    setError("");
    try {
      const cid = contact.id ?? contact.message_id;
      if (!cid) throw new Error("Missing contact id");

      const res = await api.post(`/admin/contacts/${cid}/reply`, { reply_message: replyMessage });

      // Backend sets status → "read" (Replied) after queueing email
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
    <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-[999]">
      <div className="bg-white rounded-2xl px-7 pt-7 pb-6 w-[min(520px,90vw)] shadow-2xl">
        <h2 className="m-0 mb-1 text-base font-bold text-gray-900">
          Reply to {contact.first_name} {contact.last_name}
        </h2>
        <p className="m-0 mb-4 text-xs text-gray-500">{contact.email}</p>

        {/* Original message */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-3 mb-3.5 text-sm text-gray-700">
          <strong>Original:</strong> {contact.message}
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center gap-2 py-6">
            <div className="flex items-center justify-center w-10 h-10 text-2xl rounded-full bg-emerald-100">✓</div>
            <p className="m-0 text-sm font-semibold text-emerald-700">Reply sent!</p>
            <p className="m-0 text-xs text-gray-400">Email queued for {contact.email}</p>
          </div>
        ) : (
          <>
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your reply here…"
              rows={5}
              className="w-full box-border rounded-lg border border-gray-300 px-3 py-2.5 text-sm resize-y outline-none font-[inherit]"
            />

            {error && <p className="mt-1.5 text-xs text-red-600">⚠️ {error}</p>}

            <div className="flex justify-end gap-2 mt-3.5">
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs cursor-pointer hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !replyMessage.trim()}
                className={`px-4 py-1.5 rounded-lg border-none text-white text-xs font-semibold transition-colors
                  ${sending || !replyMessage.trim()
                    ? "bg-blue-300 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 cursor-pointer"}`}
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
  const [activeTab, setActiveTab]     = useState("All");
  const [messages, setMessages]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [replyTarget, setReplyTarget] = useState(null);
  const [deletingId, setDeletingId]   = useState(null);
  const [resolvingId, setResolvingId] = useState(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/contacts");
      setMessages(res.data.data ?? []);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load messages.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this message?")) return;
    setDeletingId(id);
    try {
      await api.delete(`/admin/contacts/${id}`);
      setMessages((prev) => prev.filter((m) => m.id !== id && m.message_id !== id));
    } catch (e) {
      alert(e.response?.data?.message || "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  // After reply → status becomes "read" (Replied)
  const handleReplied = (id, updatedContact) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id || m.message_id === id
          ? { ...m, ...(updatedContact ?? {}), status: "read" }
          : m
      )
    );
  };

  // After resolve → status becomes "replied" (Resolved)
  const handleResolve = async (id) => {
    if (!window.confirm("Mark this message as resolved?")) return;
    setResolvingId(id);
    try {
      await api.patch(`/admin/contacts/${id}/resolve`);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id || m.message_id === id ? { ...m, status: "replied" } : m
        )
      );
    } catch (e) {
      alert(e.response?.data?.message || "Failed to resolve message.");
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
    <>
      {replyTarget && (
        <ReplyModal
          contact={replyTarget}
          onClose={() => setReplyTarget(null)}
          onReplied={handleReplied}
        />
      )}

      <div className="flex min-h-screen bg-[#EAF2ED] font-sans">
        <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 min-w-0 px-6 overflow-x-hidden py-7">

          {/* ── Top bar ── */}
          <div className="flex items-center gap-3 mb-6">
            <button
              className="lg:hidden bg-transparent border-none text-[22px] cursor-pointer text-gray-700 px-2 py-1 rounded-md hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
            <div>
              <h1 className="m-0 text-xl font-bold text-gray-900">Contact Messages</h1>
              <p className="text-xs text-[#6B6A6A] mt-1 mb-0">
                View and respond to messages from customers
              </p>
            </div>
            <button
              onClick={fetchMessages}
              className="ml-auto px-3.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs cursor-pointer hover:bg-gray-50 transition-colors"
            >
              ↻ Refresh
            </button>
          </div>

          {/* ── Filter Tabs ── */}
          <div className="flex flex-wrap gap-2 mb-5">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer whitespace-nowrap transition-colors
                    ${isActive
                      ? "bg-blue-600 border border-blue-600 text-white"
                      : "bg-black/5 border border-gray-300 text-gray-700 hover:bg-black/10"
                    }`}
                >
                  {tab.label}{tab.count !== null ? ` (${tab.count})` : ""}
                </button>
              );
            })}
          </div>

          {/* ── Loading ── */}
          {loading && (
            <div className="py-10 text-sm text-center text-gray-400">Loading messages…</div>
          )}

          {/* ── Error ── */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-300 rounded-xl px-4 py-3.5 text-red-600 text-xs mb-4 flex items-center gap-2">
              ⚠️ {error}
              <button
                onClick={fetchMessages}
                className="ml-3 px-2.5 py-0.5 rounded-md border border-red-300 bg-white text-red-600 text-xs cursor-pointer hover:bg-red-50"
              >
                Retry
              </button>
            </div>
          )}

          {/* ── Message Cards ── */}
          {!loading && !error && (
            <div className="flex flex-col gap-3">
              {filtered.map((msg) => {
                const id         = msg.id ?? msg.message_id;
                const cfg        = statusConfig[msg.status] ?? statusConfig.pending;
                const isResolved = msg.status === "replied";

                return (
                  <div
                    key={id}
                    className="flex items-start gap-4 px-5 py-4 bg-white shadow-sm rounded-2xl"
                  >
                    {/* Avatar */}
                    <div className="flex items-center justify-center w-12 h-12 text-xl bg-gray-200 rounded-full shrink-0">
                      ✉️
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">
                          {msg.first_name} {msg.last_name}
                        </span>
                        <span className="text-xs text-[#787878]">({msg.email})</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                      </div>

                      {msg.phone_number && (
                        <div className="text-xs text-gray-400 mb-0.5">
                          📞 {msg.phone_number}
                        </div>
                      )}

                      <div className="text-xs text-[#666565] truncate max-w-[600px]">
                        {msg.message}
                      </div>

                      {/* Show previous reply if already replied */}
                      {msg.reply_message && (
                        <div className="mt-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-2.5 py-1.5 max-w-[600px]">
                          <strong>Your reply:</strong> {msg.reply_message}
                        </div>
                      )}
                    </div>

                    {/* Date + Actions */}
                    <div className="flex flex-col items-end gap-2.5 shrink-0">
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(msg.created_at).toLocaleString()}
                      </span>
                      <div className="flex gap-2">
                        {/* Reply — always available */}
                        <button
                          onClick={() => setReplyTarget(msg)}
                          className="px-3.5 py-1 rounded-md border border-gray-300 bg-white text-gray-700 text-xs font-medium cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          {isResolved ? "↩ Re-reply" : "Reply"}
                        </button>

                        {/* Resolve — hidden once already resolved */}
                        {!isResolved && (
                          <button
                            onClick={() => handleResolve(id)}
                            disabled={resolvingId === id}
                            className={`px-3.5 py-1 rounded-md border border-emerald-300 bg-emerald-50 text-emerald-700 text-xs font-medium transition-opacity
                              ${resolvingId === id ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-emerald-100"}`}
                          >
                            {resolvingId === id ? "…" : "✓ Resolve"}
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(id)}
                          disabled={deletingId === id}
                          className={`px-2.5 py-1 rounded-md border border-red-300 bg-red-50 text-red-600 text-sm transition-opacity
                            ${deletingId === id ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-red-100"}`}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <div className="p-10 text-sm text-center text-gray-400 bg-white shadow-sm rounded-2xl">
                  No messages found.
                </div>
              )}
            </div>
          )}

          {/* ── Pagination ── */}
          {!loading && !error && (
            <div className="flex items-center justify-between mt-5 text-xs text-gray-400">
              <span>
                Showing {filtered.length} message{filtered.length !== 1 ? "s" : ""}
              </span>
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
          )}

        </main>
      </div>
    </>
  );
}  