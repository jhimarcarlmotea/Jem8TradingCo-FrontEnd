import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { postChatMessage, getChatRooms, getChatMessages } from "../api/chat";
import api from "../api/axios";
import CompanyLogo from "../assets/Logo — Jem 8 Circle Trading Co (1).png";

// Normalize avatar URLs and provide SVG fallback
const normalizeAvatar = (url) => {
  if (!url) return null;
  if (/^data:|^https?:\/\//i.test(url)) return url;
  const orig = String(url);
  if (orig.startsWith('/')) return orig;
  let base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || process.env.REACT_APP_API_URL || '';
  try {
    if (!base && api && api.defaults && api.defaults.baseURL) {
      base = String(api.defaults.baseURL).replace(/\/api\/?$/, '');
    }
  } catch (e) { }
  const path = String(url).replace(/^\/+/, '');
  // Treat frontend public images (images/* or img/*) as root-relative so default avatars remain
  if (path.toLowerCase().startsWith('images/') || path.toLowerCase().startsWith('img/')) return '/' + path;
  if (path.toLowerCase().startsWith('storage/')) return base ? base.replace(/\/+$/, '') + '/' + path : '/' + path;
  if (/\/storage\//i.test(path)) return base ? base.replace(/\/+$/, '') + '/' + path.replace(/^\/+/, '') : (path.startsWith('/') ? path : '/' + path);
  return base ? base.replace(/\/+$/, '') + '/storage/' + path : '/storage/' + path;
};

const svgFallback = (letter = 'A', bg = '#4d7b65') => {
  const txt = String(letter).charAt(0).toUpperCase() || 'A';
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><rect width='100%' height='100%' fill='${bg}' rx='12' ry='12'/><text x='50%' y='50%' dy='.35em' text-anchor='middle' font-family='Helvetica, Arial, sans-serif' font-size='34' fill='#fff'>${txt}</text></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
};

/* ── Seed conversations ── */
// Start with no mock threads — require successful `/me` auth to load conversations

// const INITIAL_THREADS = [
//   {
//     id: 1,
//     name: "JEM 8 Circle Admin",
//     avatar: "J",
//     avatarBg: "#4d7b65",
//     isAdmin: true,
//     unread: 2,
//     lastTime: "Just now",
//     messages: [
//       { id: 1, from: "admin", text: "Good morning! Thanks for contacting us. How can we help you today?",              time: "9:01 AM" },
//       { id: 2, from: "me",    text: "Hi! I'd like to request a price list for office supplies.",                       time: "9:03 AM" },
//       { id: 3, from: "admin", text: "Of course! Please send us your company name and the items you need a quotation for and we'll prepare one right away.", time: "9:04 AM" },
//       { id: 4, from: "admin", text: "Also, is this for regular or bulk ordering?",                                     time: "9:04 AM" },
//       { id: 5, from: "me",    text: "It's for bulk ordering. Around 50 units of various stationery items.",            time: "9:06 AM" },
//       { id: 6, from: "admin", text: "Perfect! We have great bulk pricing. I'll prepare the quotation and send it to your email within the day. 😊", time: "9:07 AM" },
//       { id: 7, from: "admin", img: "/img/image-dollar-executive-diary-2024-2.png", text: "Here's a preview of our best-selling Executive Diary — ₱450 for single, discounted for bulk.", time: "9:08 AM" },
//     ],
//   },
//   {
//     id: 2,
//     name: "Sales Team",
//     avatar: "S",
//     avatarBg: "#6366f1",
//     isAdmin: false,
//     unread: 0,
//     lastTime: "Yesterday",
//     messages: [
//       { id: 1, from: "admin", text: "Hello! Your order #JEM-001 has been confirmed and is being processed. Expected delivery: 2–3 business days.", time: "Yesterday" },
//       { id: 2, from: "me",    text: "Thank you! Can I track my order?", time: "Yesterday" },
//       { id: 3, from: "admin", text: "Sure! Head to My Orders in your profile to see live status updates.", time: "Yesterday" },
//     ],
//   },
//   {
//     id: 3,
//     name: "Delivery Support",
//     avatar: "D",
//     avatarBg: "#f59e0b",
//     isAdmin: false,
//     unread: 1,
//     lastTime: "Mon",
//     messages: [
//       { id: 1, from: "admin", text: "Your delivery is scheduled for tomorrow between 10am–2pm. Please ensure someone is available to receive it.", time: "Mon" },
//     ],
//   },
// ];
const INITIAL_THREADS = [];

const FILTER_TABS = ["Inbox", "Unread", "Done"];

// Start a chat with admin by creating a message without chatroom_id so server
// creates/finds the admin LiveChat. Returns the created chatroom id and messages.
async function startChatWithAdmin(initialText = "Hello admin") {
  try {
    const created = await postChatMessage({ messages: initialText });
    // Normalize response shapes
    const msgObj = created?.data ?? created?.message ?? created ?? {};
    const chatroomId = msgObj?.chatroom_id || msgObj?.chatroom?.id || msgObj?.id || null;
    if (!chatroomId) return null;
    const msgsResp = await getChatMessages(chatroomId);
    const serverMessages = Array.isArray(msgsResp) ? msgsResp : msgsResp.messages || msgsResp.data || [];
    return { chatroomId, serverMessages };
  } catch (err) {
    throw err;
  }
}

export default function Messages() {
  const [threads, setThreads]           = useState(INITIAL_THREADS);
  const [activeThread, setActiveThread] = useState(null);
  const [activeTab, setActiveTab]       = useState("Inbox");
  const [input, setInput]               = useState("");
  const [searchQuery, setSearchQuery]   = useState("");
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [currentUser, setCurrentUser]   = useState(null);
  const bottomRef                       = useRef(null);
  const navigate = useNavigate();

  const thread = threads.find((t) => t.id === activeThread);

  // Helper: robustly extract user id and admin flag from API responses
  const getUserId = (u) => u?.id ?? u?.user_id ?? u?.data?.id ?? u?.data?.user_id ?? null;
  const isAdminUser = (u) => !!(
    (u && (u.is_admin || u.isAdmin || u.role === "admin")) ||
    (u && u.data && (u.data.is_admin || u.data.isAdmin || u.data.role === "admin"))
  );

  // Filter messages returned from server so we don't show another user's messages
  const filterMessagesForUser = (messages, currentUid) => {
    // Do not filter messages by user id here — when authenticated, show all
    // messages returned for the chatroom (both sender and receiver).
    // Server should return only the chatroom's messages.
    return Array.isArray(messages) ? messages : [];
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    try { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: 'end' }); } catch (e) {}
  }, [activeThread, thread?.messages?.length]);

  // If unauthenticated, hide messages and prompt to login
  if (unauthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8fafb]" style={{ paddingTop: "var(--header-h)" }}>
        <div style={{ width: 720, padding: 28, borderRadius: 12, background: "white", boxShadow: "0 8px 40px rgba(0,0,0,0.06)", textAlign: "center" }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Sign in to view your messages</h3>
          <p style={{ color: "#64748b", marginBottom: 18 }}>You must be signed in to the account that owns these conversations. Please log in to continue.</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
            <button onClick={() => navigate('/login')} style={{ background: '#1a1a1a', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Sign in</button>
          </div>
        </div>
      </div>
    );
  }

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
      const currentIsAdmin = isAdminUser(currentUser);
      const payload = { chatroom_id: activeThread, text };
      if (currentIsAdmin && thread && (thread.userId || thread.user_id)) {
        payload.target_user_id = thread.userId || thread.user_id;
      }
      await postChatMessage(payload);
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
          const currentIsAdmin = isAdminUser(currentUser);
          const payload = { chatroom_id: activeThread, text };
          if (currentIsAdmin && thread && (thread.userId || thread.user_id)) {
            payload.target_user_id = thread.userId || thread.user_id;
          }
          await api.post("/chat/messages/token", payload);
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
        let meResp = null;
        try {
          meResp = await api.get("/me");
          if (meResp && meResp.data) setCurrentUser(meResp.data);
        } catch (mErr) { /* ignore */ }

        const roomsResp = await getChatRooms();
        // Debug: inspect raw rooms response to help diagnose empty conversation list
        console.debug('getChatRooms response:', roomsResp);
        const rooms = Array.isArray(roomsResp) ? roomsResp : roomsResp.rooms || roomsResp.chatrooms || [];
        // Defensive filter: only include rooms that involve the current user
          const currentUid = getUserId(meResp?.data || currentUser);
          const currentUid2 = getUserId(meResp?.data || currentUser);
        const safeRooms = rooms.filter((r) => {
          if (!currentUid) return true; // unknown user -> don't filter here
          if (r.user_id == currentUid || r.userId == currentUid || r.owner_id == currentUid) return true;
          if (Array.isArray(r.participants)) {
            // participants may be ids or objects
            if (r.participants.includes && r.participants.includes(currentUid)) return true;
            if (r.participants.some && r.participants.some((p) => (p && (p.id || p.user_id) == currentUid))) return true;
          }
          if (Array.isArray(r.members)) return r.members.some((m) => (m.id || m.user_id) == currentUid);
          if (Array.isArray(r.participant_ids)) return r.participant_ids.includes(currentUid);
          return false;
        });
        if (!mounted) return;
        // (debug logs removed)

        // If the URL requested a specific chatroom (eg. /messages?chatroom_id=123),
        // try to open it even if getChatRooms didn't return it.
        let requestedId = null;
        try { requestedId = new URLSearchParams(window.location.search || "").get('chatroom_id'); } catch (e) { requestedId = null; }
          if (requestedId) {
          const found = safeRooms.find(r => String(r.id) === String(requestedId) || String(r.chatroom_id) === String(requestedId) || String(r.room_id) === String(requestedId));
          if (found) {
            // map and open as usual
                const currentIsAdmin = isAdminUser(meResp?.data || currentUser);
                const mapped = safeRooms.map((r) => {
                  const inferredAvatar = r.user?.profile_picture || r.profile_picture || r.avatar_url || r.avatarUrl || r.picture || r.photo || (r.participants && r.participants[0] && (r.participants[0].profile_picture || r.participants[0].avatar_url || r.participants[0].picture)) || null;
                  const inferredName = r.name || r.title || (r.participants ? r.participants.join(", ") : "Chat");
                  const isRoomAdmin = !!(r.is_admin || r.isAdmin || r.admin);
                  const displayName = (!currentIsAdmin && isRoomAdmin) ? "Jem 8 Trading Co." : inferredName;
                  const displayAvatarUrl = isRoomAdmin ? CompanyLogo : normalizeAvatar(inferredAvatar);
                  const rawMsgs = Array.isArray(r.messages) ? filterMessagesForUser(r.messages, currentUid2) : [];
                  return {
                    id: r.id || r.chatroom_id || r.room_id,
                    userId: r.user_id || r.userId || r.owner_id || (Array.isArray(r.participant_ids) ? r.participant_ids[0] : null) || (Array.isArray(r.participants) ? (r.participants[0]?.id || r.participants[0]) : null),
                    name: displayName,
                    avatar: (displayName || "").charAt(0).toUpperCase() || "J",
                    avatarBg: r.avatarBg || "#4d7b65",
                    avatarUrl: displayAvatarUrl,
                    isAdmin: isRoomAdmin,
                    unread: r.unread || 0,
                    lastTime: r.last_time || "",
                    messages: sortMessagesAsc(rawMsgs),
                  };
                });
            // Sort threads: unread first, then most-recent `lastTime` (descending)
            mapped.sort((a, b) => {
              if ((a.unread ? 1 : 0) !== (b.unread ? 1 : 0)) return (b.unread ? 1 : 0) - (a.unread ? 1 : 0);
              const ta = Date.parse(a.lastTime || a.last_time || a.date) || 0;
              const tb = Date.parse(b.lastTime || b.last_time || b.date) || 0;
              return tb - ta;
            });
            setThreads((prev) =>
              mapped.map((m) => ({
                ...m,
                messages: Array.isArray(m.messages) && m.messages.length > 0 ? m.messages : (prev.find((p) => p.id === m.id)?.messages || []),
              }))
            );
            setActiveThread(found.id || found.chatroom_id || found.room_id);
            // clear param so we don't re-run
            requestedId = null;
          } else {
            // room not returned — try loading messages directly for the requested id
            try {
              const msgsResp = await getChatMessages(requestedId);
              const serverMessages = Array.isArray(msgsResp) ? msgsResp : msgsResp.messages || [];
              const newThread = {
                id: requestedId,
                name: 'Admin',
                avatar: 'A',
                avatarBg: '#4d7b65',
                avatarUrl: CompanyLogo,
                isAdmin: true,
                unread: 0,
                lastTime: '',
                messages: sortMessagesAsc(serverMessages),
              };
              const mapped = safeRooms.map((r) => ({
                id: r.id || r.chatroom_id || r.room_id,
                userId: r.user_id || r.userId || r.owner_id || (Array.isArray(r.participant_ids) ? r.participant_ids[0] : null) || (Array.isArray(r.participants) ? (r.participants[0]?.id || r.participants[0]) : null),
                name: r.name || r.title || (r.participants ? r.participants.join(", ") : "Chat"),
                avatar: (r.name || "").charAt(0).toUpperCase() || "J",
                avatarBg: r.avatarBg || "#4d7b65",
                isAdmin: !!r.is_admin,
                unread: r.unread || 0,
                lastTime: r.last_time || "",
                messages: Array.isArray(r.messages) ? filterMessagesForUser(r.messages, currentUid) : [],
              }));
              setThreads([newThread, ...mapped]);
              setActiveThread(requestedId);
              requestedId = null;
            } catch (e) {
              // if fetch failed, fall back to normal mapping below
            }
          }
        }

        console.debug('filtered rooms after applying user filter:', safeRooms);
        if (safeRooms.length > 0) {
          const currentIsAdmin = isAdminUser(meResp?.data || currentUser);
                const mapped = safeRooms.map((r) => {
            const inferredAvatar = r.user?.profile_picture || r.profile_picture || r.avatar_url || r.avatarUrl || r.picture || r.photo || (r.participants && r.participants[0] && (r.participants[0].profile_picture || r.participants[0].avatar_url || r.participants[0].picture)) || null;
            const inferredName = r.name || r.title || (r.participants ? r.participants.join(", ") : "Chat");
            const isRoomAdmin = !!(r.is_admin || r.isAdmin || r.admin);
            const displayName = (!currentIsAdmin && isRoomAdmin) ? "Jem 8 Trading Co." : inferredName;
            const rawMsgs = Array.isArray(r.messages) ? filterMessagesForUser(r.messages, currentUid) : [];
            return {
              id: r.id || r.chatroom_id || r.room_id,
              userId: r.user_id || r.userId || r.owner_id || (Array.isArray(r.participant_ids) ? r.participant_ids[0] : null) || (Array.isArray(r.participants) ? (r.participants[0]?.id || r.participants[0]) : null),
              name: displayName,
              avatar: (displayName || "").charAt(0).toUpperCase() || "J",
              avatarBg: r.avatarBg || "#4d7b65",
              avatarUrl: isRoomAdmin ? CompanyLogo : normalizeAvatar(inferredAvatar),
              isAdmin: isRoomAdmin,
              unread: r.unread || 0,
              lastTime: r.last_time || "",
              messages: sortMessagesAsc(rawMsgs),
            };
          });
            setThreads((prev) =>
            mapped.map((m) => ({
              ...m,
              messages: Array.isArray(m.messages) && m.messages.length > 0 ? m.messages : (prev.find((p) => p.id === m.id)?.messages || []),
            }))
          );
          setActiveThread(mapped[0]?.id ?? null);
        }
      } catch (err) {
        const msg = err && err.message ? err.message : String(err);
        if (msg === "Unauthenticated.") {
          try {
            await api.get("http://127.0.0.1:8000/sanctum/csrf-cookie", { withCredentials: true });
            const roomsResp2 = await getChatRooms();
            const rooms2 = Array.isArray(roomsResp2) ? roomsResp2 : roomsResp2.rooms || roomsResp2.chatrooms || [];
            if (!mounted) return;
            // Defensive filter on retry as well
            const currentUid2 = getUserId(meResp?.data || currentUser);
            const safeRooms2 = rooms2.filter((r) => {
              if (!currentUid2) return true;
              if (r.user_id == currentUid2 || r.userId == currentUid2 || r.owner_id == currentUid2) return true;
              if (Array.isArray(r.participants)) {
                if (r.participants.includes && r.participants.includes(currentUid2)) return true;
                if (r.participants.some && r.participants.some((p) => (p && (p.id || p.user_id) == currentUid2))) return true;
              }
              if (Array.isArray(r.members)) return r.members.some((m) => (m.id || m.user_id) == currentUid2);
              if (Array.isArray(r.participant_ids)) return r.participant_ids.includes(currentUid2);
              return false;
            });
            // Debug: show retry raw rooms and filtered result
            // (debug logs removed)

            if (safeRooms2.length > 0) {
              const currentIsAdmin = isAdminUser(meResp?.data || currentUser);
              const mapped = safeRooms.map((r) => {
              const inferredAvatar = r.user?.profile_picture || r.profile_picture || r.avatar_url || r.avatarUrl || r.picture || r.photo || (r.participants && r.participants[0] && (r.participants[0].profile_picture || r.participants[0].avatar_url || r.participants[0].picture)) || null;
              const inferredName = r.name || r.title || (r.participants ? r.participants.join(", ") : "Chat");
              const isRoomAdmin = !!(r.is_admin || r.isAdmin || r.admin);
              const displayName = (!currentIsAdmin && isRoomAdmin) ? "Jem 8 Trading Co." : inferredName;
              const rawMsgs = Array.isArray(r.messages) ? filterMessagesForUser(r.messages, currentUid) : [];
              return {
                id: r.id || r.chatroom_id || r.room_id,
                userId: r.user_id || r.userId || r.owner_id || (Array.isArray(r.participant_ids) ? r.participant_ids[0] : null) || (Array.isArray(r.participants) ? (r.participants[0]?.id || r.participants[0]) : null),
                name: displayName,
                avatar: (displayName || "").charAt(0).toUpperCase() || "J",
                avatarBg: r.avatarBg || "#4d7b65",
                avatarUrl: isRoomAdmin ? CompanyLogo : normalizeAvatar(inferredAvatar),
                isAdmin: isRoomAdmin,
                unread: r.unread || 0,
                lastTime: r.last_time || "",
                messages: sortMessagesAsc(rawMsgs),
              };
            });
              // Sort threads: unread first, then most-recent `lastTime` (descending)
              mapped.sort((a, b) => {
                if ((a.unread ? 1 : 0) !== (b.unread ? 1 : 0)) return (b.unread ? 1 : 0) - (a.unread ? 1 : 0);
                const ta = Date.parse(a.lastTime || a.last_time || a.date) || 0;
                const tb = Date.parse(b.lastTime || b.last_time || b.date) || 0;
                return tb - ta;
              });
              // Sort mapped (retry mapping) so unread then recent threads come first
              mapped.sort((a, b) => {
                if ((a.unread ? 1 : 0) !== (b.unread ? 1 : 0)) return (b.unread ? 1 : 0) - (a.unread ? 1 : 0);
                const ta = Date.parse(a.lastTime || a.last_time || a.date) || 0;
                const tb = Date.parse(b.lastTime || b.last_time || b.date) || 0;
                return tb - ta;
              });
              setThreads((prev) =>
                mapped.map((m) => ({
                  ...m,
                  messages: Array.isArray(m.messages) && m.messages.length > 0 ? m.messages : (prev.find((p) => p.id === m.id)?.messages || []),
                }))
              );
              setActiveThread(mapped[0]?.id ?? null);
              return;
            }
          } catch (e) { /* fall through */ }
          // mark unauthenticated and keep threads empty so messages stay hidden
          setUnauthenticated(true);
          setThreads([]);
          console.warn("Unauthenticated while loading chat rooms — messages hidden until login");
        } else {
          console.warn("Failed to load chat rooms:", msg);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Fetch messages when active thread changes
  useEffect(() => {
    if (!activeThread || !currentUser) return;
    let mounted = true;
    (async () => {
        try {
          const msgsResp = await getChatMessages(activeThread);
          const serverMessages = Array.isArray(msgsResp) ? msgsResp : msgsResp.messages || [];
          const currentUidForFetch = getUserId(currentUser);
          const safeMsgs = filterMessagesForUser(serverMessages, currentUidForFetch);
          const sortedSafeMsgs = sortMessagesAsc(safeMsgs);
          if (!mounted) return;
          setThreads((prev) => prev.map((t) => (t.id === activeThread ? { ...t, messages: sortedSafeMsgs.length > 0 ? sortedSafeMsgs : t.messages } : t)));
        } catch (err) { /* keep local mock */ }
    })();
    return () => { mounted = false; };
  }, [activeThread]);

  // Auto-start helper: open existing room or create one once using a local lock
  const AUTO_START_KEY = "chat_auto_started_v1";

  async function openOrCreateUserChat() {
    // 1) try to read existing rooms
    try {
      const roomsResp = await getChatRooms();
      const rooms = Array.isArray(roomsResp) ? roomsResp : roomsResp?.rooms || roomsResp?.chatrooms || roomsResp?.data || [];
      if (rooms.length > 0) {
        const room = rooms[0];
        const chatroomId = room.id || room.chatroom_id || room.room_id || null;
        if (chatroomId) {
          const msgsResp = await getChatMessages(chatroomId);
          const messages = Array.isArray(msgsResp) ? msgsResp : msgsResp?.messages || msgsResp?.data || [];
          return { chatroomId, messages };
        }
      }
    } catch (e) {
      // ignore and continue to lock/check-create
    }

    // 2) check local lock to avoid duplicate creates
    try {
      const lock = localStorage.getItem(AUTO_START_KEY);
      if (lock) {
        const parsed = JSON.parse(lock);
        if (parsed?.chatroomId) {
          const chatroomId = parsed.chatroomId;
          try {
            const msgsResp = await getChatMessages(chatroomId);
            const messages = Array.isArray(msgsResp) ? msgsResp : msgsResp?.messages || msgsResp?.data || [];
            return { chatroomId, messages };
          } catch (e) {
            // fallthrough to create if fetching failed
          }
        }
      }
    } catch (e) { /* ignore malformed lock */ }

    // 3) create initial message ONCE
    try {
      const created = await postChatMessage({ messages: "Hello admin, I need help with an order." });
      const msgObj = created?.data ?? created?.message ?? created ?? {};
      const chatroomId = msgObj?.chatroom_id || msgObj?.chatroom?.id || msgObj?.id || null;
      if (!chatroomId) return null;
      // save lock
      try { localStorage.setItem(AUTO_START_KEY, JSON.stringify({ chatroomId, ts: Date.now() })); } catch (e) { /* ignore */ }
      const msgsResp = await getChatMessages(chatroomId);
      const messages = Array.isArray(msgsResp) ? msgsResp : msgsResp?.messages || msgsResp?.data || [];
      return { chatroomId, messages };
    } catch (err) {
      throw err;
    }
  }

  function subscribeEcho(chatroomId) {
    if (!window.Echo) return;
    try {
      // ensure we aren't double-listening
      try { window.Echo.leave('chat.' + chatroomId); } catch (e) { /* ignore */ }
      window.Echo.private('chat.' + chatroomId).listen('NewMessage', (ev) => {
        const raw = ev?.message || ev || {};
        const avatarCandidate = raw.avatarUrl || raw.avatar || raw.user?.profile_picture || raw.user?.profile_image || raw.user?.avatar || raw.user?.picture || null;
          let avatarUrl = normalizeAvatar(avatarCandidate);
          // Force admin messages to use company logo
          if (raw?.is_admin || raw?.sender === 'admin' || raw?.from === 'admin' || (raw.user && (raw.user.is_admin || raw.user.role === 'admin'))) {
            avatarUrl = CompanyLogo;
          }
          const payload = { ...raw, avatarUrl };
        setThreads((prev) => prev.map((t) => {
          if (t.id !== chatroomId) return t;
          const msgs = Array.isArray(t.messages) ? [...t.messages, payload] : [payload];
          return { ...t, messages: sortMessagesAsc(msgs) };
        }));
      });
    } catch (e) { console.warn('Echo subscribe failed', e); }
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (unauthenticated) return;
      if (threads.length > 0) return;
      // avoid auto-start if URL already requested a chatroom
      try { if (new URLSearchParams(window.location.search || "").get('chatroom_id')) return; } catch (e) { }

      try {
        const res = await openOrCreateUserChat();
        if (!mounted || !res) return;
        const { chatroomId, messages } = res;
        const newThread = {
            id: chatroomId,
            name: 'Admin',
            avatar: 'A',
            avatarBg: '#4d7b65',
            avatarUrl: CompanyLogo,
            isAdmin: true,
            unread: 0,
            lastTime: '',
            messages: Array.isArray(messages) ? messages : [],
          };
        setThreads((prev) => [newThread, ...prev]);
        setActiveThread(chatroomId);
        subscribeEcho(chatroomId);
      } catch (err) {
        const msg = err && err.message ? err.message : String(err);
        if (msg === 'Unauthenticated.') setUnauthenticated(true);
        else console.warn('auto-start failed', err);
      }
    })();
    return () => { mounted = false; };
  }, [threads.length, unauthenticated]);

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

  // Format a chat list date (sidebar). Shows time for today, weekday for this week,
  // and short date with year for older entries.
  const formatChatDate = (iso) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      if (isNaN(d)) return String(iso);
      const now = new Date();
      const diff = now - d;
      const oneDay = 24 * 60 * 60 * 1000;
      if (diff < oneDay) {
        return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      }
      if (diff < 7 * oneDay) {
        return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
      }
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return String(iso);
    }
  };

  const getMsgText = (msg) => msg?.text || msg?.messages || msg?.message || "";

  // Ensure messages are sorted oldest -> newest so bottom is newest
  const sortMessagesAsc = (messages) => {
    if (!Array.isArray(messages)) return [];
    try {
      return [...messages].sort((a, b) => {
        const ta = Date.parse(a.created_at || a.createdAt || a.time || a.timestamp || a.date || a.ts || 0) || 0;
        const tb = Date.parse(b.created_at || b.createdAt || b.time || b.timestamp || b.date || b.ts || 0) || 0;
        return ta - tb;
      });
    } catch (e) {
      return messages;
    }
  };

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
                        className="relative w-[44px] h-[44px] rounded-full flex items-center justify-center text-white font-bold text-[16px] flex-shrink-0 overflow-hidden"
                        style={{ background: t.avatarBg }}
                      >
                        {t.isAdmin ? (
                          <img
                            src={CompanyLogo}
                            alt="Jem 8 Trading Co."
                            className="w-full h-full object-cover"
                            onError={(e) => { try { e.target.onerror = null; e.target.src = svgFallback('J', t.avatarBg || '#4d7b65'); } catch (err) { e.target.style.display = 'none'; } }}
                          />
                        ) : t.avatarUrl ? (
                          <img
                            src={t.avatarUrl}
                            alt={t.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { try { e.target.onerror = null; e.target.src = svgFallback(t.avatar, t.avatarBg || '#4d7b65'); } catch (err) { e.target.style.display = 'none'; } }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">{t.avatar}</div>
                        )}
                        {t.isAdmin && (
                          <span className="absolute bottom-[1px] right-[1px] w-[10px] h-[10px] bg-[#22c55e] border-[2px] border-white rounded-full" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-[3px]">
                          <span className={`text-[13.5px] truncate ${t.unread > 0 ? "font-bold text-[#1e293b]" : "font-semibold text-[#1e293b]"}`}>
                            Jem 8 Trading Co.
                          </span>
                          <span className="text-[11px] text-[#94a3b8] flex-shrink-0 ml-[8px]">
                            {formatChatDate(t.lastTime)}
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
                {thread?.isAdmin ? (
                  <img
                    src={CompanyLogo}
                    alt="Jem 8 Trading Co."
                    className="w-full h-full object-cover"
                    onError={(e) => { try { e.target.onerror = null; e.target.src = svgFallback(thread?.avatar, thread?.avatarBg || '#4d7b65'); } catch (err) { e.target.style.display = 'none'; } }}
                  />
                ) : thread?.avatarUrl ? (
                  <img
                    src={thread.avatarUrl}
                    alt={thread?.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { try { e.target.onerror = null; e.target.src = svgFallback(thread?.avatar, thread?.avatarBg || '#4d7b65'); } catch (err) { e.target.style.display = 'none'; } }}
                  />
                ) : (
                  thread?.avatar
                )}
                {thread?.isAdmin && (
                  <span className="absolute bottom-[1px] right-[1px] w-[10px] h-[10px] bg-[#22c55e] border-[2px] border-white rounded-full" />
                )}
              </div>
              <div className="flex flex-col">
                <div className="text-[15px] font-bold text-[#1e293b]">
                    Jem 8 Trading Co.
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
                if (msg) {
                  if (currentUserId) {
                    if (currentIsAdmin) {
                      isFromMe = !!(msg.is_admin || msg.sender === "admin" || msg.from === "admin");
                    } else {
                      isFromMe = !!(
                        msg.from === "me" ||
                        msg.user_id === currentUserId ||
                        msg.account_id === currentUserId ||
                        msg.sender_id === currentUserId ||
                        (msg.account && msg.account.id === currentUserId)
                      );
                    }
                  } else {
                    isFromMe = !!(msg.from === "me");
                  }
                }

                // Use computed `isFromMe` directly for layout (left/right)
                const displayIsFromMe = isFromMe;

                return (
                  <div
                    key={msg.id ?? `msg-${msgIdx}-${msg.time || msg.from || ""}`}
                    className={`flex items-end gap-[10px] ${displayIsFromMe ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {/* Sender avatar (only for received) */}
                    {!displayIsFromMe && (
                      (() => {
                        const senderIsAdmin = !!(msg.is_admin || msg.sender === "admin" || msg.from === "admin");
                        const senderAvatarRaw = senderIsAdmin ? CompanyLogo : (msg.avatarUrl || msg.avatar_url || msg.user?.profile_picture || msg.user?.avatarUrl || thread?.avatarUrl || null);
                        const senderAvatar = normalizeAvatar(senderAvatarRaw);
                        if (senderAvatar) {
                          return (
                            <img
                              src={senderAvatar}
                              alt={msg.sender_name || thread?.name}
                              className="w-[32px] h-[32px] rounded-full flex-shrink-0 mb-[4px] object-cover"
                              onError={(e) => { try { e.target.onerror = null; const letter = (msg.sender_name || msg.user?.name || thread?.name || thread?.avatar || 'A')[0]; e.target.src = svgFallback(letter, thread?.avatarBg || '#4d7b65'); } catch (err) { e.target.style.display = 'none'; } }}
                            />
                          );
                        }
                        return (
                          <div className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0 mb-[4px]" style={{ background: thread.avatarBg }}>
                            {thread.avatar}
                          </div>
                        );
                      })()
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