import { useState, useEffect } from "react";
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

  const getContactEmail = (room) => {
    if (!room) return "";
    return room.email || room.user?.email || room.participants?.[0]?.email || room.contact_email || (room.name ? room.name.toLowerCase().replace(/\s+/g, "") + "@gmail.com" : "");
  };

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
        const mapped = rooms.map((r) => ({
          id: r.id || r.chatroom_id || r.room_id,
          name: r.name || r.title || (r.participants ? r.participants.join(", ") : "Chat"),
          avatar: (r.name || "").charAt(0).toUpperCase() || "A",
          avatarBg: r.avatarBg || "linear-gradient(135deg, #4d7b65, #3b82f6)",
          preview: r.last_message?.text || r.preview || "",
          date: r.last_time || r.date || "",
          unread: !!r.unread,
          messages: Array.isArray(r.messages) ? r.messages : [],
          orderRef: r.orderRef || null,
        }));
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
      await postChatMessage({ chatroom_id: selectedId, text });
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
        setContacts((prev) => prev.map((c) => c.id === selectedId ? { ...c, messages: serverMessages } : c));
      } catch (err) { /* keep existing */ }
    })();
    return () => { mounted = false; };
  }, [selectedId]);

  return (
    <div className="flex min-h-screen bg-[#F0F7F2] font-sans">
      <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="flex-1 px-5 py-6 overflow-x-hidden min-w-0 flex flex-col">

        {/* Top bar */}
        <div className="flex items-center gap-3 mb-5">
          <button
            className="lg:hidden bg-transparent border-none text-[22px] cursor-pointer text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >☰</button>
          <h1 className="text-xl font-bold text-gray-900 m-0">Messages</h1>
        </div>

        {/* Messaging layout */}
        <div className="flex flex-1 bg-white rounded-2xl shadow-sm overflow-hidden min-h-[600px]">

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
                {["All", "Unread", "Replied"].map((tab) => (
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
                      : "bg-transparent border-l-[3px] border-transparent hover:bg-gray-100"
                    }`}
                >
                  {/* Avatar */}
                  <div
                    className="w-[42px] h-[42px] rounded-full shrink-0 flex items-center justify-center text-white font-bold text-[13px]"
                    style={{ background: contact.avatarBg }}
                  >
                    {contact.avatar}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <span className={`text-[13px] text-gray-900 truncate max-w-[140px] ${contact.unread ? "font-bold" : "font-medium"}`}>
                        {contact.name}
                      </span>
                      <span className="text-[10px] text-gray-400 shrink-0 ml-1">
                        {contact.date.replace("February ", "Feb ")}
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 mb-0 truncate ${contact.unread ? "text-gray-700 font-semibold" : "text-gray-400 font-normal"}`}>
                      {contact.preview}
                    </p>
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
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-[13px]"
                      style={{ background: selected.avatarBg }}
                    >
                      {selected.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-gray-900">{selected.name || selected.fullName || "Chat"}</div>
                      <div className="text-[11px] text-gray-400">{getContactEmail(selected)}</div>
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
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
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

                    // flip display: treat the computed `fromMe` as opposite for layout (left/right)
                    const displayFromMe = !fromMe;
                    const senderName = msg.sender_name || msg.sender?.name || (fromMe ? (currentUser?.name || currentUser?.data?.first_name || "Admin") : selected.name?.split(" ")[0]);
                    return (
                      <div key={msg.id || msg.created_at || Math.random()} className={`flex items-end gap-2 ${displayFromMe ? "justify-end" : "justify-start"}`}>
                        {!displayFromMe && (
                          <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-[11px] font-bold" style={{ background: selected.avatarBg }}>
                            {selected.avatar}
                          </div>
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
                </div>

                {/* Input bar */}
                <div className="px-4 py-3 border-t border-gray-100 bg-white flex items-end gap-2.5">
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