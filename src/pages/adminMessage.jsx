import { useState, useEffect, useRef } from "react";
import AdminNav from '../components/AdminNav';
import { getChatRooms, getChatMessages, postChatMessage } from "../api/chat";
import api from "../api/axios";

export default function AdminMessages() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedId, setSelectedId]   = useState(null);
  const [inboxTab, setInboxTab]       = useState("All");
  const [inputText, setInputText]     = useState("");
  const [contacts, setContacts]       = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const selected = contacts.find((c) => c.id === selectedId);

  // Helper: robustly extract user id and admin flag from API responses
  const getUserId = (u) => u?.id ?? u?.user_id ?? u?.data?.id ?? u?.data?.user_id ?? null;
  const isAdminUser = (u) => !!(
    (u && (u.is_admin || u.isAdmin || u.role === "admin")) ||
    (u && u.data && (u.data.is_admin || u.data.isAdmin || u.data.role === "admin"))
  );

  const getMsgText = (msg) => {
    if (!msg) return "";
    return msg.text || msg.message || msg.messages || msg.msg || "";
  };

  const formatMsgTime = (msg) => {
    const t = msg?.time || msg?.created_at || msg?.createdAt || msg?.timestamp;
    if (!t) return "";
    try {
      return new Date(t).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return String(t);
    }
  };

  // Format a chat list date (left menu). Shows time for today, weekday for this week,
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

  const getContactEmail = (room) => {
    if (!room) return "";
    return room.email || room.user?.email || room.participants?.[0]?.email || room.contact_email || (room.name ? room.name.toLowerCase().replace(/\s+/g, "") + "@gmail.com" : "");
  };

  // Normalize avatar URLs returned by the API. If backend returns a relative
  // storage path (e.g. "profile_images/..png"), convert to an absolute URL.
  const normalizeAvatar = (url) => {
    if (!url) return null;
    // pass-through for data URLs and absolute URLs
    if (/^data:|^https?:\/\//i.test(url)) return url;
    const orig = String(url);
    // If backend returned a site-root-relative path (e.g. "/images/default-avatar.svg"),
    // keep it as-is so frontend/public assets load correctly.
    if (orig.startsWith('/')) return orig;
    let base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || process.env.REACT_APP_API_URL || '';
    // Fallback: if axios api baseURL is available, derive backend base (strip /api)
    try {
      if (!base && api && api.defaults && api.defaults.baseURL) {
        base = String(api.defaults.baseURL).replace(/\/api\/?$/, '');
      }
    } catch (e) { /* ignore */ }
    const path = String(url).replace(/^\/+/, '');
    // If backend returned a frontend public image path like 'images/default-avatar.svg',
    // treat it as root-relative so we don't prefix with /storage/.
    if (path.toLowerCase().startsWith('images/') || path.toLowerCase().startsWith('img/')) {
      return '/' + path;
    }

    // If path already begins with storage/, don't prepend another storage/
    if (path.toLowerCase().startsWith('storage/')) {
      return base ? base.replace(/\/+$/, '') + '/' + path : '/' + path;
    }

    // If the path already contains '/storage/' somewhere, prefer the existing path
    if (/\/storage\//i.test(path)) {
      // ensure leading slash when no base provided
      return base ? base.replace(/\/+$/, '') + '/' + path.replace(/^\/+/, '') : (path.startsWith('/') ? path : '/' + path);
    }

    // Fallback: assume the backend stores files under '/storage/' and prefix accordingly
    return base ? base.replace(/\/+$/, '') + '/storage/' + path : '/storage/' + path;
  };

  // Small SVG data-URI fallback that renders the avatar letter on a colored background
  const svgFallback = (letter = 'A', bg = '#4d7b65') => {
    const txt = String(letter).charAt(0).toUpperCase() || 'A';
    const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><rect width='100%' height='100%' fill='${bg}' rx='12' ry='12'/><text x='50%' y='50%' dy='.35em' text-anchor='middle' font-family='Helvetica, Arial, sans-serif' font-size='34' fill='#fff'>${txt}</text></svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  };

  // Ensure messages are sorted oldest -> newest so bottom is newest
  const sortMessagesAsc = (messages) => {
    if (!Array.isArray(messages)) return [];
    try {
      return [...messages].sort((a, b) => {
        const ta = Date.parse(a.created_at || a.createdAt || a.time || a.timestamp || a.date || 0) || 0;
        const tb = Date.parse(b.created_at || b.createdAt || b.time || b.timestamp || b.date || 0) || 0;
        return ta - tb;
      });
    } catch (e) {
      return messages;
    }
  };

  const bottomRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        try {
          const meResp = await api.get("/me");
          if (meResp && meResp.data) setCurrentUser(meResp.data);
        } catch (mErr) { /* ignore if unauthenticated */ }

        const resp = await getChatRooms();
        const rooms = Array.isArray(resp) ? resp : resp.rooms || resp.chatrooms || [];
        if (!mounted) return;
        const meId = (typeof meResp !== 'undefined' && meResp && meResp.data) ? (meResp.data.id || meResp.data.user_id || null) : null;
        const mapped = rooms.map((r) => {
          // If there are participants, prefer the other participant (not current user) for name/email/avatar
          let other = null;
          if (Array.isArray(r.participants) && r.participants.length > 0) {
            other = r.participants.find((p) => {
              const pid = p && (p.id || p.user_id || p) ;
              return meId ? String(pid) !== String(meId) : true;
            }) || r.participants[0];
          }
          const inferredName = r.name || r.title || (other && (other.name || other.full_name || other.first_name)) || r.user?.name || "Chat";
          const inferredEmail = r.email || (other && (other.email || other.contact_email)) || r.user?.email || r.contact_email || "";
          const inferredAvatarUrl = (other && (other.profile_picture || other.avatar_url || other.picture || other.photo)) || r.user?.profile_picture || r.profile_picture || r.avatar_url || r.avatarUrl || r.picture || r.photo || null;
          const inferredProductName = (r.product && (r.product.name || r.product.title)) || (r.orderRef && r.orderRef.label) || r.product_name || r.item?.name || null;
          const inferredProductImage = r.product?.image || r.orderRef?.image || r.product_image || null;
          return {
            id: r.id || r.chatroom_id || r.room_id,
            userId: r.user_id || r.userId || r.owner_id || (Array.isArray(r.participant_ids) ? r.participant_ids[0] : null) || (Array.isArray(r.participants) ? (r.participants[0]?.id || r.participants[0]) : null),
            name: inferredName,
            email: inferredEmail,
            avatar: (inferredName || "").charAt(0).toUpperCase() || "A",
            avatarUrl: normalizeAvatar(inferredAvatarUrl),
            avatarBg: r.avatarBg || "linear-gradient(135deg, #4d7b65, #3b82f6)",
            preview: r.last_message?.text || r.preview || "",
            date: r.last_time || r.date || "",
            unread: !!r.unread,
            messages: Array.isArray(r.messages) ? sortMessagesAsc(r.messages) : [],
            orderRef: r.orderRef || null,
            productName: inferredProductName,
            productImage: inferredProductImage,
          };
        });
        // Sort contacts: unread first, then most-recent `date` (descending)
        mapped.sort((a, b) => {
          if ((a.unread ? 1 : 0) !== (b.unread ? 1 : 0)) return (b.unread ? 1 : 0) - (a.unread ? 1 : 0);
          const ta = Date.parse(a.date) || 0;
          const tb = Date.parse(b.date) || 0;
          return tb - ta;
        });
        // Debug: log resolved avatar URLs to help diagnose broken images
        try {
          mapped.forEach((m) => console.debug('adminMessage: avatar resolved', m.id, m.avatarUrl, m.avatar));
        } catch (e) { /* ignore */ }
        setContacts(mapped);
        if (mapped.length > 0) setSelectedId((id) => id ?? mapped[0].id);
      } catch (err) {
        console.warn("Failed to load admin chat rooms:", err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filteredContacts =
    inboxTab === "All"     ? contacts
    : inboxTab === "Unread" ? contacts.filter((c) => c.unread)
    : contacts.filter((c) => !c.unread);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !selectedId) return;
    try {
      const currentIsAdmin = isAdminUser(currentUser);
      const payload = { chatroom_id: selectedId, text };
      if (currentIsAdmin && selected && (selected.userId || selected.user_id)) {
        payload.target_user_id = selected.userId || selected.user_id;
      }
      await postChatMessage(payload);
      setInputText("");
      try {
        const msgsResp = await getChatMessages(selectedId);
        const serverMessages = Array.isArray(msgsResp) ? msgsResp : msgsResp.messages || [];
        setContacts((prev) => prev.map((c) => c.id === selectedId ? { ...c, messages: serverMessages } : c));
      } catch (e) { /* ignore refresh error */ }
    } catch (err) {
      console.error("Failed to send admin message:", err);
    }
  };

  useEffect(() => {
    if (!selectedId) return;
    let mounted = true;
    (async () => {
      try {
        const msgsResp = await getChatMessages(selectedId);
        const serverMessages = Array.isArray(msgsResp) ? msgsResp : msgsResp.messages || [];
        if (!mounted) return;
        setContacts((prev) => prev.map((c) => c.id === selectedId ? { ...c, messages: sortMessagesAsc(serverMessages) } : c));
        // scroll to bottom after messages load (slight delay to allow render)
        setTimeout(() => { try { bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); } catch (e) {} }, 60);
      } catch (err) { /* keep existing */ }
    })();
    return () => { mounted = false; };
  }, [selectedId]);

  // scroll whenever the selected messages change length
  useEffect(() => {
    try {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    } catch (e) { /* ignore */ }
  }, [selected?.messages?.length, selectedId]);

  return (
    <div className="flex h-screen bg-[#F0F7F2] font-sans">
      <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="flex-1 px-5 py-6 overflow-x-hidden min-w-0 flex flex-col h-full">

        {/* Top bar */}
        <div className="flex items-center gap-3 mb-5">
          <button
            className="lg:hidden bg-transparent border-none text-[22px] cursor-pointer text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >☰</button>
          <h1 className="text-xl font-bold text-gray-900 m-0">Messages</h1>
        </div>

        {/* Messaging layout */}
        <div className="flex flex-1 bg-white rounded-2xl shadow-sm overflow-hidden h-full">

          {/* LEFT: Inbox */}
          <div className="w-[320px] min-w-[280px] border-r border-gray-100 flex flex-col max-md:w-full">

            {/* Inbox header */}
            <div className="px-4 pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-base text-gray-900">Inbox</span>
                <button className="w-7 h-7 rounded-full border border-gray-200 bg-gray-50 cursor-pointer text-base flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors">
                  +
                </button>
              </div>
              {/* Tabs */}
              <div className="flex gap-1.5 mb-1">
                {["All", "Unread", "Read"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setInboxTab(tab)}
                    className={`px-3 py-1 rounded-full border text-xs font-medium cursor-pointer transition-all
                      ${inboxTab === tab
                        ? "bg-gray-900 border-gray-900 text-white"
                        : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Contact list */}
            <div className="flex-1 overflow-y-auto">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => { setSelectedId(contact.id); setContacts((prev) => prev.map((c) => c.id === contact.id ? { ...c, unread: false } : c)); }}
                  className={`flex items-start gap-2.5 px-4 py-3 cursor-pointer transition-all relative
                      ${selectedId === contact.id
                        ? "bg-blue-50 border-l-[3px] border-blue-600"
                        : (contact.unread ? "bg-[#f9fdf9] border-l-[3px] border-l-[#4d7b65]" : "bg-transparent border-l-[3px] border-transparent hover:bg-gray-100")
                      }`}
                >
                  {/* Avatar */}
                  <div className="shrink-0">
                    {contact.avatarUrl ? (
                      <img
                        src={contact.avatarUrl}
                        alt={contact.name}
                        className="w-[42px] h-[42px] rounded-full object-cover"
                        onError={(e) => {
                          try {
                            e.target.onerror = null;
                            e.target.src = svgFallback(contact.avatar, '#4d7b65');
                          } catch (err) { e.target.style.display = 'none'; }
                        }}
                      />
                    ) : (
                      <div
                        className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-white font-bold text-[13px]"
                        style={{ background: contact.avatarBg }}
                      >
                        {contact.avatar}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <span className={`text-[13px] text-gray-900 truncate max-w-[140px] ${contact.unread ? "font-bold" : "font-medium"}`}>
                        {contact.name}
                      </span>
                      <span className="text-[10px] text-gray-400 shrink-0 ml-1">
                        {formatChatDate(contact.date)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      {contact.email && (
                        <span className={`text-xs text-gray-400 truncate ${contact.unread ? "font-semibold" : "font-normal"}`}>{contact.email}</span>
                      )}
                      {contact.productName && (
                        <div className="text-xs text-gray-500 mt-1 truncate">Product: {contact.productName}</div>
                      )}
                      {contact.preview && (
                        <p className={`text-xs mt-1 mb-0 truncate ${contact.unread ? "text-gray-700 font-semibold" : "text-gray-400 font-normal"}`}>
                          {contact.preview}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Unread dot */}
                  {contact.unread && (
                    <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Chat panel */}
          <div className="flex-1 min-w-0 flex flex-col bg-gray-50 max-md:hidden">
            {selected ? (
              <>
                {/* Chat header */}
                <div className="px-5 py-3.5 border-b border-gray-100 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                    {selected.avatarUrl ? (
                      <img
                        src={selected.avatarUrl}
                        alt={selected.name}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          try {
                            e.target.onerror = null;
                            e.target.src = svgFallback(selected.avatar, selected.avatarBg || '#4d7b65');
                          } catch (err) { e.target.style.display = 'none'; }
                        }}
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-[13px]"
                        style={{ background: selected.avatarBg }}
                      >
                        {selected.avatar}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-sm text-gray-900">{selected.name || selected.fullName || "Chat"}</div>
                      <div className="text-[11px] text-gray-400">{selected.email || getContactEmail(selected)}</div>
                      {selected.productName && (
                        <div className="text-[12px] text-gray-500 mt-1">Product: {selected.productName}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">February 21, 2026</span>
                    <button className="px-3.5 py-1 rounded-md border border-red-300 bg-red-50 text-red-600 text-xs cursor-pointer font-medium hover:bg-red-100 transition-colors">
                      Delete
                    </button>
                  </div>
                </div>

                {/* Order ref card */}
                {selected.orderRef && (
                  <div className="mx-4 mt-3 bg-white rounded-xl border border-gray-200 px-3.5 py-3 flex items-center gap-3">
                    <div className="w-[60px] h-12 rounded-md bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-[22px] shrink-0">
                      📦
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-gray-700">{selected.orderRef.label}</div>
                      <div className="text-base font-bold text-gray-900">{selected.orderRef.price}</div>
                      <div className="text-[11px] text-gray-400">
                        Ordered: {selected.orderRef.date} · {selected.orderRef.qty} · {selected.orderRef.location}
                      </div>
                    </div>
                    <span className="text-[11px] text-blue-600 font-semibold bg-blue-50 px-2.5 py-1 rounded-md whitespace-nowrap">
                      {selected.orderRef.orderId}
                    </span>
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 pb-24">
                  {Array.isArray(selected.messages) && selected.messages.map((msg) => {
                    const currentUserId = getUserId(currentUser);
                    const currentIsAdmin = isAdminUser(currentUser);

                    let fromMe = false;
                    if (currentUserId) {
                      if (currentIsAdmin) {
                        fromMe = !!(msg.is_admin || msg.sender === "admin" || msg.from === "admin" || msg.from === "me");
                      } else {
                        fromMe = !!(
                          msg?.from === "me" ||
                          msg.user_id === currentUserId ||
                          msg.account_id === currentUserId ||
                          msg.sender_id === currentUserId ||
                          (msg.account && msg.account.id === currentUserId)
                        );
                      }
                    } else {
                      fromMe = msg?.from === "me" || msg.sender === "admin" || msg.is_admin;
                    }

                    // displayFromMe: true = align to right (messages from current user)
                    const displayFromMe = fromMe;
                    const senderName = msg.sender_name || msg.sender?.name || (fromMe ? (currentUser?.name || currentUser?.data?.first_name || "Admin") : selected.name?.split(" ")[0]);
                    return (
                      <div key={msg.id || msg.created_at || Math.random()} className={`flex items-end gap-2 ${displayFromMe ? "justify-end" : "justify-start"}`}>
                        {!displayFromMe && (
                          (() => {
                            const senderAvatarRaw = msg.avatarUrl || msg.avatar_url || msg.user?.profile_picture || msg.user?.avatarUrl || selected.avatarUrl || null;
                            const senderAvatar = normalizeAvatar(senderAvatarRaw);
                            if (senderAvatar) {
                              return (
                                <img
                                  src={senderAvatar}
                                  alt={msg.sender_name || selected.name}
                                  className="w-8 h-8 rounded-full shrink-0 object-cover"
                                  onError={(e) => {
                                    try {
                                      e.target.onerror = null;
                                      const letter = (msg.sender_name || msg.sender?.name || selected.name || selected.avatar || 'A')[0];
                                      e.target.src = svgFallback(letter, selected.avatarBg || '#4d7b65');
                                    } catch (err) { e.target.style.display = 'none'; }
                                  }}
                                />
                              );
                            }
                            return (
                              <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-[11px] font-bold" style={{ background: selected.avatarBg }}>
                                {selected.avatar}
                              </div>
                            );
                          })()
                        )}

                        <div className="max-w-[65%]">
                          <div className={`px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${fromMe ? "bg-blue-600 text-white rounded-2xl rounded-br-sm border-none" : "bg-white text-gray-700 rounded-2xl rounded-bl-sm border border-gray-100"}`}>
                            {formatMsgTime(msg) && (
                              <div className={`text-[10px] mb-1 ${fromMe ? "text-white/70" : "text-gray-400"}`}>
                                {senderName} {formatMsgTime(msg)}
                              </div>
                            )}
                            {getMsgText(msg)}
                          </div>
                          <div className={`text-[10px] text-gray-400 mt-1 ${fromMe ? "text-right" : "text-left"}`}>
                            {msg.status}
                          </div>
                        </div>

                        {fromMe && (
                          <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-[11px] font-bold bg-gradient-to-br from-blue-500 to-purple-600">AD</div>
                        )}
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Input bar */}
                <div className="px-4 py-3 border-t border-gray-100 bg-white flex items-end gap-2.5 sticky bottom-0 z-20">
                  <button className="w-[34px] h-[34px] rounded-full border border-gray-200 bg-gray-50 cursor-pointer text-base shrink-0 flex items-center justify-center hover:bg-gray-100 transition-colors">
                    +
                  </button>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Is there anything else I can help for you?"
                    rows={2}
                    className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 resize-none font-[inherit] bg-gray-50 leading-relaxed outline-none focus:border-blue-400 transition-colors"
                  />
                  <button
                    onClick={handleSend}
                    className="w-[38px] h-[38px] rounded-full border-none bg-blue-600 cursor-pointer shrink-0 flex items-center justify-center hover:bg-blue-700 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                Select a conversation to start messaging
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}