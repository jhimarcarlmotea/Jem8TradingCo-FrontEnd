import { useState } from "react";
import AdminNav from '../components/AdminNav';

const contacts = [
  {
    id: 1,
    name: "Ms. Akiko Serrano",
    avatar: "AS",
    avatarBg: "linear-gradient(135deg, #F59E0B, #EF4444)",
    preview: "Testing Message Goes Here.",
    date: "February 21, 2026",
    unread: false,
    messages: [
      { id: 1, from: "them", text: "Testing Message Goes Here.", time: "8:14 am", status: "Delivered" },
    ],
    orderRef: null,
  },
  {
    id: 2,
    name: "Thomas Naguit",
    avatar: "TN",
    avatarBg: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
    preview: "Hello, Ma'am. Is this product available po? Thanks in advanced",
    date: "February 21, 2026",
    unread: true,
    messages: [
      { id: 1, from: "them", text: "Hello, Ma'am. Is this product available po? Thanks in advanced", time: "8:14 am", status: "Delivered" },
      { id: 2, from: "me", text: "Good morning po, Yes po sir, the product is available po", time: "8:14 am", status: "Delivered" },
    ],
    orderRef: { label: "SAMPLE PRODUCT x2", price: "₱1,000", orderId: "Order - 001 - 5166", date: "February 20, 2026", qty: "0 cash", location: "Makati City" },
  },
  {
    id: 3, name: "Ms. Sheila R. Acibar", avatar: "SA", avatarBg: "linear-gradient(135deg, #10B981, #3B82F6)",
    preview: "Testing Message Goes Here.", date: "February 20, 2026", unread: false,
    messages: [{ id: 1, from: "them", text: "Testing Message Goes Here.", time: "9:00 am", status: "Delivered" }], orderRef: null,
  },
  {
    id: 4, name: "Ms. Sheila R. Acibar", avatar: "SA", avatarBg: "linear-gradient(135deg, #10B981, #3B82F6)",
    preview: "Testing Message Goes Here.", date: "February 20, 2026", unread: false,
    messages: [{ id: 1, from: "them", text: "Testing Message Goes Here.", time: "9:00 am", status: "Delivered" }], orderRef: null,
  },
  {
    id: 5, name: "Ms. Sheila R. Acibar", avatar: "SA", avatarBg: "linear-gradient(135deg, #10B981, #3B82F6)",
    preview: "Testing Message Goes Here.", date: "February 20, 2026", unread: false,
    messages: [{ id: 1, from: "them", text: "Testing Message Goes Here.", time: "9:00 am", status: "Delivered" }], orderRef: null,
  },
  {
    id: 6, name: "Ms. Sheila R. Acibar", avatar: "SA", avatarBg: "linear-gradient(135deg, #10B981, #3B82F6)",
    preview: "Testing Message Goes Here.", date: "February 20, 2026", unread: false,
    messages: [{ id: 1, from: "them", text: "Testing Message Goes Here.", time: "9:00 am", status: "Delivered" }], orderRef: null,
  },
];

export default function AdminMessages() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedId, setSelectedId]   = useState(2);
  const [inboxTab, setInboxTab]       = useState("All");
  const [inputText, setInputText]     = useState("");

  const selected = contacts.find((c) => c.id === selectedId);

  const filteredContacts =
    inboxTab === "All"     ? contacts
    : inboxTab === "Unread" ? contacts.filter((c) => c.unread)
    : contacts.filter((c) => !c.unread);

  const handleSend = () => {
    if (inputText.trim()) setInputText("");
  };

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
                  onClick={() => setSelectedId(contact.id)}
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
                      <div className="font-semibold text-sm text-gray-900">{selected.name}</div>
                      <div className="text-[11px] text-gray-400">
                        {selected.name.toLowerCase().replace(/\s+/g, "") + "@gmail.com"}
                      </div>
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
                  {selected.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 ${msg.from === "me" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.from === "them" && (
                        <div
                          className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-[11px] font-bold"
                          style={{ background: selected.avatarBg }}
                        >
                          {selected.avatar}
                        </div>
                      )}

                      <div className="max-w-[65%]">
                        <div
                          className={`px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm
                            ${msg.from === "me"
                              ? "bg-blue-600 text-white rounded-2xl rounded-br-sm border-none"
                              : "bg-white text-gray-700 rounded-2xl rounded-bl-sm border border-gray-100"
                            }`}
                        >
                          {msg.time && (
                            <div className={`text-[10px] mb-1 ${msg.from === "me" ? "text-white/70" : "text-gray-400"}`}>
                              {selected.name.split(" ")[0]} {msg.time}
                            </div>
                          )}
                          {msg.text}
                        </div>
                        <div className={`text-[10px] text-gray-400 mt-1 ${msg.from === "me" ? "text-right" : "text-left"}`}>
                          {msg.status}
                        </div>
                      </div>

                      {msg.from === "me" && (
                        <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-[11px] font-bold bg-gradient-to-br from-blue-500 to-purple-600">
                          AD
                        </div>
                      )}
                    </div>
                  ))}
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