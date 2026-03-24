import { useState, useRef, useEffect } from "react";
import { postChatMessage, getChatRooms, getChatMessages } from "../api/chat";
import api from "../api/axios";

/* ── Seed conversations ── */
const INITIAL_THREADS = [
  {
    id: 1,
    name: "JEM 8 Circle Admin",
    avatar: "J",
    avatarBg: "#4d7b65",
    isAdmin: true,
    unread: 2,
    lastTime: "Just now",
    messages: [
      { id: 1, from: "admin", text: "Good morning! Thanks for contacting us. How can we help you today?",              time: "9:01 AM" },
      { id: 2, from: "me",    text: "Hi! I'd like to request a price list for office supplies.",                       time: "9:03 AM" },
      { id: 3, from: "admin", text: "Of course! Please send us your company name and the items you need a quotation for and we'll prepare one right away.", time: "9:04 AM" },
      { id: 4, from: "admin", text: "Also, is this for regular or bulk ordering?",                                     time: "9:04 AM" },
      { id: 5, from: "me",    text: "It's for bulk ordering. Around 50 units of various stationery items.",            time: "9:06 AM" },
      { id: 6, from: "admin", text: "Perfect! We have great bulk pricing. I'll prepare the quotation and send it to your email within the day. 😊", time: "9:07 AM" },
      { id: 7, from: "admin", img: "/img/image-dollar-executive-diary-2024-2.png", text: "Here's a preview of our best-selling Executive Diary — ₱450 for single, discounted for bulk.", time: "9:08 AM" },
    ],
  },
  {
    id: 2,
    name: "Sales Team",
    avatar: "S",
    avatarBg: "#6366f1",
    isAdmin: false,
    unread: 0,
    lastTime: "Yesterday",
    messages: [
      { id: 1, from: "admin", text: "Hello! Your order #JEM-001 has been confirmed and is being processed. Expected delivery: 2–3 business days.", time: "Yesterday" },
      { id: 2, from: "me",    text: "Thank you! Can I track my order?", time: "Yesterday" },
      { id: 3, from: "admin", text: "Sure! Head to My Orders in your profile to see live status updates.", time: "Yesterday" },
    ],
  },
  {
    id: 3,
    name: "Delivery Support",
    avatar: "D",
    avatarBg: "#f59e0b",
    isAdmin: false,
    unread: 1,
    lastTime: "Mon",
    messages: [
      { id: 1, from: "admin", text: "Your delivery is scheduled for tomorrow between 10am–2pm. Please ensure someone is available to receive it.", time: "Mon" },
    ],
  },
];

const FILTER_TABS = ["Inbox", "Unread", "Done"];

export default function Messages() {
  const [threads, setThreads]           = useState(INITIAL_THREADS);
  const [activeThread, setActiveThread] = useState(1);
  const [activeTab, setActiveTab]       = useState("Inbox");
  const [input, setInput]               = useState("");
  const [searchQuery, setSearchQuery]   = useState("");
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [currentUser, setCurrentUser]   = useState(null);
  const bottomRef                       = useRef(null);

  const thread = threads.find((t) => t.id === activeThread);

  // Helper: robustly extract user id and admin flag from API responses
  const getUserId = (u) => u?.id ?? u?.user_id ?? u?.data?.id ?? u?.data?.user_id ?? null;
  const isAdminUser = (u) => !!(
    (u && (u.is_admin || u.isAdmin || u.role === "admin")) ||
    (u && u.data && (u.data.is_admin || u.data.isAdmin || u.data.role === "admin"))
  );

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread, thread?.messages?.length]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    const optimisticMsg = {
      id: Date.now(),
      from: "me",
      text,
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    };

    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread
          ? { ...t, unread: 0, lastTime: "Just now", messages: [...t.messages, optimisticMsg] }
          : t
      )
    );
    setInput("");

    try {
      await postChatMessage({ chatroom_id: activeThread, text });
      try {
        const msgsResp = await getChatMessages(activeThread);
        const serverMessages = Array.isArray(msgsResp) ? msgsResp : msgsResp.messages || [];
        setThreads((prev) =>
          prev.map((t) => (t.id === activeThread ? { ...t, messages: serverMessages.length > 0 ? serverMessages : t.messages } : t))
        );
      } catch (err2) {
        console.warn("Failed to refresh messages after send:", err2);
      }
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      if (msg === "Unauthenticated.") {
        setUnauthenticated(true);
        try {
          await api.post("/chat/messages/token", { chatroom_id: activeThread, text });
          try {
            const msgsResp2 = await getChatMessages(activeThread);
            const serverMessages2 = Array.isArray(msgsResp2) ? msgsResp2 : msgsResp2.messages || [];
            setThreads((prev) => prev.map((t) => (t.id === activeThread ? { ...t, messages: serverMessages2 } : t)));
          } catch (e2) { /* ignore */ }
        } catch (e) {
          console.error("Token-send failed:", e);
        }
      } else {
        console.error("Failed to send chat message:", err);
      }
    }
  };

  // Load chat rooms on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        try {
          const meResp = await api.get("/me");
          if (meResp && meResp.data) setCurrentUser(meResp.data);
        } catch (mErr) { /* ignore */ }

        const roomsResp = await getChatRooms();
        const rooms = Array.isArray(roomsResp) ? roomsResp : roomsResp.rooms || roomsResp.chatrooms || [];
        if (!mounted) return;

        if (rooms.length > 0) {
          const mapped = rooms.map((r) => ({
            id: r.id || r.chatroom_id || r.room_id,
            name: r.name || r.title || (r.participants ? r.participants.join(", ") : "Chat"),
            avatar: (r.name || "").charAt(0).toUpperCase() || "J",
            avatarBg: r.avatarBg || "#4d7b65",
            isAdmin: !!r.is_admin,
            unread: r.unread || 0,
            lastTime: r.last_time || "",
            messages: Array.isArray(r.messages) ? r.messages : [],
          }));
          setThreads((prev) =>
            mapped.map((m) => ({
              ...m,
              messages: Array.isArray(m.messages) && m.messages.length > 0 ? m.messages : (prev.find((p) => p.id === m.id)?.messages || []),
            }))
          );
          setActiveThread(mapped[0]?.id ?? 1);
        }
      } catch (err) {
        const msg = err && err.message ? err.message : String(err);
        if (msg === "Unauthenticated.") {
          try {
            await api.get("http://127.0.0.1:8000/sanctum/csrf-cookie", { withCredentials: true });
            const roomsResp2 = await getChatRooms();
            const rooms2 = Array.isArray(roomsResp2) ? roomsResp2 : roomsResp2.rooms || roomsResp2.chatrooms || [];
            if (!mounted) return;
            if (rooms2.length > 0) {
              const mapped = rooms2.map((r) => ({
                id: r.id || r.chatroom_id || r.room_id,
                name: r.name || r.title || (r.participants ? r.participants.join(", ") : "Chat"),
                avatar: (r.name || "").charAt(0).toUpperCase() || "J",
                avatarBg: r.avatarBg || "#4d7b65",
                isAdmin: !!r.is_admin,
                unread: r.unread || 0,
                lastTime: r.last_time || "",
                messages: Array.isArray(r.messages) ? r.messages : [],
              }));
              setThreads((prev) =>
                mapped.map((m) => ({
                  ...m,
                  messages: Array.isArray(m.messages) && m.messages.length > 0 ? m.messages : (prev.find((p) => p.id === m.id)?.messages || []),
                }))
              );
              setActiveThread(mapped[0]?.id ?? 1);
              return;
            }
          } catch (e) { /* fall through */ }
          setUnauthenticated(true);
          console.warn("Unauthenticated while loading chat rooms — using local mock threads");
        } else {
          console.warn("Failed to load chat rooms:", msg);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Fetch messages when active thread changes
  useEffect(() => {
    if (!activeThread) return;
    let mounted = true;
    (async () => {
      try {
        const msgsResp = await getChatMessages(activeThread);
        const serverMessages = Array.isArray(msgsResp) ? msgsResp : msgsResp.messages || [];
        if (!mounted) return;
        setThreads((prev) => prev.map((t) => (t.id === activeThread ? { ...t, messages: serverMessages.length > 0 ? serverMessages : t.messages } : t)));
      } catch (err) { /* keep local mock */ }
    })();
    return () => { mounted = false; };
  }, [activeThread]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const openThread = (id) => {
    setActiveThread(id);
    setThreads((prev) => prev.map((t) => t.id === id ? { ...t, unread: 0 } : t));
  };

  const filteredThreads = threads.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === "Unread") return matchSearch && t.unread > 0;
    if (activeTab === "Done")   return matchSearch && t.unread === 0 && !t.isAdmin;
    return matchSearch;
  });

  const totalUnread = threads.reduce((s, t) => s + t.unread, 0);

  const formatMsgTime = (msg) => {
    const t = msg?.time || msg?.created_at || msg?.createdAt;
    if (!t) return "";
    try {
      return new Date(t).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return String(t);
    }
  };

  const getMsgText = (msg) => msg?.text || msg?.messages || msg?.message || "";

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafb]" style={{ paddingTop: "var(--header-h)" }}>

      {/* ── MAIN ── */}
      <section className="flex-1 flex overflow-hidden">
        <div className="max-w-[1200px] w-full mx-auto flex shadow-[0_4px_32px_rgba(0,0,0,0.08)] rounded-[16px] overflow-hidden my-[24px] border border-[#e2e8f0] bg-white" style={{ height: "calc(100vh - var(--header-h) - 48px)" }}>

          {/* ── SIDEBAR ── */}
          <div className="w-[320px] flex-shrink-0 flex flex-col border-r border-[#e2e8f0] bg-white">

            {/* Sidebar header */}
            <div className="flex items-center justify-between px-[20px] py-[18px] border-b border-[#e2e8f0]">
              <h2 className="flex items-center gap-[10px] text-[18px] font-bold text-[#1e293b]" style={{ fontFamily: "var(--font-heading)" }}>
                Messages
                {totalUnread > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-[6px] rounded-full bg-[#4d7b65] text-white text-[11px] font-bold">
                    {totalUnread}
                  </span>
                )}
              </h2>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-[4px] px-[16px] pt-[14px] pb-[10px]">
              {FILTER_TABS.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-[6px] px-[14px] py-[7px] rounded-full text-[13px] font-medium transition-all duration-200 cursor-pointer border-none ${
                      isActive
                        ? "bg-[#4d7b65] text-white shadow-[0_2px_8px_rgba(77,123,101,0.3)]"
                        : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#edf4f0] hover:text-[#4d7b65]"
                    }`}
                  >
                    {tab}
                    {tab === "Unread" && totalUnread > 0 && (
                      <span className={`inline-flex items-center justify-center min-w-[16px] h-[16px] px-[4px] rounded-full text-[10px] font-bold ${isActive ? "bg-white/30 text-white" : "bg-[#4d7b65] text-white"}`}>
                        {totalUnread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative px-[16px] pb-[12px]">
              <span className="absolute left-[28px] top-1/2 -translate-y-1/2 text-[13px] text-[#94a3b8] pointer-events-none">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search messages…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[38px] pl-[34px] pr-[12px] bg-[#f1f5f9] border-[1.5px] border-transparent rounded-[10px] text-[13px] text-[#1e293b] outline-none transition-all duration-200 focus:border-[#4d7b65] focus:bg-white focus:shadow-[0_0_0_3px_rgba(77,123,101,0.12)] placeholder:text-[#94a3b8]"
              />
            </div>

            {/* Thread list */}
            <div className="flex-1 overflow-y-auto">
              {filteredThreads.length === 0 ? (
                <div className="text-center py-[40px] text-[13px] text-[#94a3b8]">
                  No conversations found.
                </div>
              ) : (
                filteredThreads.map((t, threadIdx) => {
                  const lastMsg = t.messages[t.messages.length - 1];
                  const isActive = activeThread === t.id;
                  return (
                    <div
                      key={t.id ?? `thread-${threadIdx}-${t.name}`}
                      onClick={() => openThread(t.id)}
                      className={`flex items-center gap-[12px] px-[16px] py-[13px] cursor-pointer transition-all duration-200 border-b border-[#f1f5f9] relative ${
                        isActive
                          ? "bg-[#edf4f0] border-l-[3px] border-l-[#4d7b65]"
                          : "hover:bg-[#f8fafb]"
                      } ${t.unread > 0 ? "bg-[#f9fdf9]" : ""}`}
                    >
                      {/* Avatar */}
                      <div
                        className="relative w-[44px] h-[44px] rounded-full flex items-center justify-center text-white font-bold text-[16px] flex-shrink-0"
                        style={{ background: t.avatarBg }}
                      >
                        {t.avatar}
                        {t.isAdmin && (
                          <span className="absolute bottom-[1px] right-[1px] w-[10px] h-[10px] bg-[#22c55e] border-[2px] border-white rounded-full" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-[3px]">
                          <span className={`text-[13.5px] truncate ${t.unread > 0 ? "font-bold text-[#1e293b]" : "font-semibold text-[#1e293b]"}`}>
                            {t.name}
                          </span>
                          <span className="text-[11px] text-[#94a3b8] flex-shrink-0 ml-[8px]">
                            {t.lastTime}
                          </span>
                        </div>
                        <div className={`text-[12.5px] truncate ${t.unread > 0 ? "text-[#374151] font-medium" : "text-[#94a3b8]"}`}>
                          {lastMsg?.img ? "📷 Photo" : (lastMsg?.text || lastMsg?.messages || lastMsg?.message || "")}
                        </div>
                      </div>

                      {/* Unread badge */}
                      {t.unread > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-[5px] rounded-full bg-[#4d7b65] text-white text-[11px] font-bold flex-shrink-0">
                          {t.unread}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── CHAT WINDOW ── */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafb]">

            {/* Chat header */}
            <div className="flex items-center gap-[14px] px-[24px] py-[16px] bg-white border-b border-[#e2e8f0] shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <div
                className="relative w-[44px] h-[44px] rounded-full flex items-center justify-center text-white font-bold text-[16px] flex-shrink-0"
                style={{ background: thread?.avatarBg || "#4d7b65" }}
              >
                {thread?.avatar}
                {thread?.isAdmin && (
                  <span className="absolute bottom-[1px] right-[1px] w-[10px] h-[10px] bg-[#22c55e] border-[2px] border-white rounded-full" />
                )}
              </div>
              <div className="flex flex-col">
                <div className="text-[15px] font-bold text-[#1e293b]">
                  {thread?.name}
                </div>
                <div className="text-[12px] text-[#64748b]">
                  {thread?.isAdmin ? "🟢 Online · JEM 8 Support Team" : "JEM 8 Circle Trading Co."}
                </div>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-[24px] py-[20px] flex flex-col gap-[14px]">
              {thread?.messages.map((msg, msgIdx) => {
                const currentUserId = getUserId(currentUser);
                const currentIsAdmin = isAdminUser(currentUser);

                let isFromMe = false;
                if (currentUserId) {
                  if (currentIsAdmin) {
                    isFromMe = !!(msg.is_admin || msg.sender === "admin" || msg.from === "admin" || msg.from === "me");
                  } else {
                    isFromMe = !!(
                      msg?.from === "me" ||
                      msg.user_id === currentUserId ||
                      msg.account_id === currentUserId ||
                      msg.sender_id === currentUserId ||
                      (msg.account && msg.account.id === currentUserId)
                    );
                  }
                } else {
                  isFromMe = msg?.from === "me" || msg.sender === "admin" || msg.is_admin;
                }

                // flip display: treat the computed `isFromMe` as opposite for layout (left/right)
                const displayIsFromMe = !isFromMe;

                return (
                  <div
                    key={msg.id ?? `msg-${msgIdx}-${msg.time || msg.from || ""}`}
                    className={`flex items-end gap-[10px] ${displayIsFromMe ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {/* Sender avatar (only for received) */}
                    {!displayIsFromMe && (
                      <div
                        className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0 mb-[4px]"
                        style={{ background: thread.avatarBg }}
                      >
                        {thread.avatar}
                      </div>
                    )}

                    {/* Bubble */}
                    <div
                      className={`flex flex-col max-w-[68%] ${displayIsFromMe ? "items-end" : "items-start"}`}
                    >
                      {msg.img && (
                        <img
                          src={msg.img}
                          alt="attachment"
                          className="max-w-full rounded-[12px] mb-[6px] border border-[#e2e8f0] shadow-sm"
                          style={{ maxHeight: "220px", objectFit: "cover" }}
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                      )}
                      {getMsgText(msg) && (
                        <div
                          className={`px-[14px] py-[10px] rounded-[18px] text-[14px] leading-[1.55] shadow-sm ${
                            isFromMe
                              ? "bg-[#4d7b65] text-white rounded-br-[4px]"
                              : "bg-white text-[#1e293b] border border-[#e2e8f0] rounded-bl-[4px]"
                          }`}
                        >
                          {getMsgText(msg)}
                        </div>
                      )}
                      <span className="text-[11px] text-[#94a3b8] mt-[4px] px-[4px]">
                        {formatMsgTime(msg)}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input row */}
            <div className="flex items-center gap-[10px] px-[20px] py-[14px] bg-white border-t border-[#e2e8f0]">
              {/* Attach */}
              <button
                aria-label="Attach file"
                className="w-[38px] h-[38px] flex items-center justify-center rounded-full bg-[#f1f5f9] text-[18px] text-[#64748b] border-none cursor-pointer transition-all duration-200 hover:bg-[#edf4f0] hover:text-[#4d7b65] flex-shrink-0"
              >
                📎
              </button>

              {/* Textarea wrap */}
              <div className="flex-1 relative">
                <textarea
                  className="w-full resize-none px-[14px] py-[10px] bg-[#f1f5f9] border-[1.5px] border-transparent rounded-[12px] text-[14px] text-[#1e293b] outline-none transition-all duration-200 focus:border-[#4d7b65] focus:bg-white focus:shadow-[0_0_0_3px_rgba(77,123,101,0.12)] placeholder:text-[#94a3b8] leading-[1.5]"
                  placeholder="Type your message…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  style={{ maxHeight: "120px", overflowY: "auto" }}
                />
              </div>

              {/* Send button */}
              <button
                aria-label="Send"
                onClick={handleSend}
                disabled={!input.trim()}
                className={`w-[40px] h-[40px] rounded-full flex items-center justify-center text-[18px] border-none flex-shrink-0 transition-all duration-200 ${
                  input.trim()
                    ? "bg-[#4d7b65] text-white cursor-pointer shadow-[0_2px_8px_rgba(77,123,101,0.35)] hover:bg-[#3a5e4e] hover:scale-[1.06]"
                    : "bg-[#e2e8f0] text-[#94a3b8] cursor-not-allowed"
                }`}
              >
                ➤
              </button>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}