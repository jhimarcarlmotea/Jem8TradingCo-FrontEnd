import { useState, useRef, useEffect } from "react";
import "../style/global.css";
import "../style/pages.css";
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
  const bottomRef                       = useRef(null);

  const thread = threads.find((t) => t.id === activeThread);

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
          ? {
              ...t,
              unread: 0,
              lastTime: "Just now",
              messages: [...t.messages, optimisticMsg],
            }
          : t
      )
    );
    setInput("");

    // Send to backend (optimistic UI). If backend expects a different payload, adjust accordingly.
    try {
      await postChatMessage({ chatroom_id: activeThread, text });

      // After successful send, fetch server messages for the active thread to sync
      try {
        const msgsResp = await getChatMessages(activeThread);
        const serverMessages = Array.isArray(msgsResp) ? msgsResp : msgsResp.messages || [];
        setThreads((prev) =>
          prev.map((t) => (t.id === activeThread ? { ...t, messages: serverMessages } : t))
        );
      } catch (err2) {
        console.warn("Failed to refresh messages after send:", err2);
      }
    } catch (err) {
      // If unauthenticated, try sending via token endpoint
      const msg = err && err.message ? err.message : String(err);
      if (msg === "Unauthenticated.") {
        setUnauthenticated(true);
        try {
          await api.post("/chat/messages/token", { chatroom_id: activeThread, text });
          // Attempt to refresh messages from server even when using token route
          try {
            const msgsResp2 = await getChatMessages(activeThread);
            const serverMessages2 = Array.isArray(msgsResp2) ? msgsResp2 : msgsResp2.messages || [];
            setThreads((prev) => prev.map((t) => (t.id === activeThread ? { ...t, messages: serverMessages2 } : t)));
          } catch (e2) {
            // ignore
          }
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
        // quick check to ensure session auth is valid
        try {
          await api.get("/me");
        } catch (mErr) {
          // ignore — will surface when requesting rooms
        }

        const roomsResp = await getChatRooms();
        // roomsResp may be an array or an object like { rooms: [...] }
        const rooms = Array.isArray(roomsResp) ? roomsResp : roomsResp.rooms || roomsResp.chatrooms || [];

        if (!mounted) return;

        if (rooms.length > 0) {
          // Map server rooms to local thread shape when possible
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
          setThreads(mapped);
          setActiveThread(mapped[0]?.id ?? 1);
        }
      } catch (err) {
        // Backend may require session auth (Sanctum). Try obtaining CSRF cookie and retry once.
        const msg = err && err.message ? err.message : String(err);
        if (msg === "Unauthenticated.") {
          try {
            await api.get("/sanctum/csrf-cookie");
            // retry once
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
              setThreads(mapped);
              setActiveThread(mapped[0]?.id ?? 1);
              return;
            }
          } catch (e) {
            // fall through to unauthenticated handling
          }

          setUnauthenticated(true);
          console.warn("Unauthenticated while loading chat rooms — using local mock threads");
        } else {
          console.warn("Failed to load chat rooms:", msg);
        }
      }
    })();
    return () => { mounted = false };
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
        setThreads((prev) => prev.map((t) => (t.id === activeThread ? { ...t, messages: serverMessages } : t)));
      } catch (err) {
        // if API not available, keep local mock
      }
    })();
    return () => { mounted = false };
  }, [activeThread]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Mark thread as read when opened
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

  return (
    <div className="msg-page">


      <section className="msg-main">
        <div className="container msg-layout">

          {/* ── SIDEBAR ── */}
          <div className="msg-sidebar">
            <div className="msg-sidebar__header">
              <h2 className="msg-sidebar__title">
                Messages
                {totalUnread > 0 && <span className="msg-sidebar__badge">{totalUnread}</span>}
              </h2>
            </div>

            {/* Filter tabs */}
            <div className="msg-tabs">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab}
                  className={`msg-tab${activeTab === tab ? " active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                  {tab === "Unread" && totalUnread > 0 && (
                    <span className="msg-tab__count">{totalUnread}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="msg-search">
              <span className="msg-search__icon">🔍</span>
              <input
                type="text"
                placeholder="Search messages…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="msg-search__input"
              />
            </div>

            {/* Thread list */}
            <div className="msg-thread-list">
              {filteredThreads.length === 0 ? (
                <div className="msg-thread-empty">No conversations found.</div>
              ) : (
                filteredThreads.map((t) => {
                  const lastMsg = t.messages[t.messages.length - 1];
                  return (
                    <div
                      key={t.id}
                      className={`msg-thread-item${activeThread === t.id ? " active" : ""}${t.unread > 0 ? " unread" : ""}`}
                      onClick={() => openThread(t.id)}
                    >
                      <div className="msg-thread-item__avatar" style={{ background: t.avatarBg }}>
                        {t.avatar}
                        {t.isAdmin && <span className="msg-thread-item__online" />}
                      </div>
                      <div className="msg-thread-item__content">
                        <div className="msg-thread-item__top">
                          <span className="msg-thread-item__name">{t.name}</span>
                          <span className="msg-thread-item__time">{t.lastTime}</span>
                        </div>
                        <div className="msg-thread-item__preview">
                          {lastMsg?.img ? "📷 Photo" : lastMsg?.text}
                        </div>
                      </div>
                      {t.unread > 0 && (
                        <span className="msg-thread-item__unread">{t.unread}</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── CHAT WINDOW ── */}
          <div className="msg-chat">

            {/* Chat header */}
            <div className="msg-chat__header">
              <div className="msg-chat__avatar" style={{ background: thread?.avatarBg || "#4d7b65" }}>
                {thread?.avatar}
                {thread?.isAdmin && <span className="msg-thread-item__online" />}
              </div>
              <div className="msg-chat__info">
                <div className="msg-chat__name">{thread?.name}</div>
                <div className="msg-chat__status">
                  {thread?.isAdmin ? "🟢 Online · JEM 8 Support Team" : "JEM 8 Circle Trading Co."}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="msg-chat__messages">
              {thread?.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`msg-bubble-row${msg.from === "me" ? " msg-bubble-row--me" : ""}`}
                >
                  {msg.from !== "me" && (
                    <div className="msg-bubble__avatar" style={{ background: thread.avatarBg }}>
                      {thread.avatar}
                    </div>
                  )}
                  <div className={`msg-bubble${msg.from === "me" ? " msg-bubble--me" : ""}`}>
                    {msg.img && (
                      <img
                        src={msg.img}
                        alt="attachment"
                        className="msg-bubble__img"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    )}
                    {msg.text && <p>{msg.text}</p>}
                    <span className="msg-bubble__time">{msg.time}</span>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="msg-chat__input-row">
              <button className="msg-chat__attach" aria-label="Attach file">📎</button>
              <div className="msg-chat__input-wrap">
                <textarea
                  className="msg-chat__input"
                  placeholder="Type your message…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                />
              </div>
              <button
                className={`msg-chat__send${input.trim() ? " active" : ""}`}
                onClick={handleSend}
                aria-label="Send"
                disabled={!input.trim()}
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