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
      {
        id: 1, from: "them",
        text: "Hello, Ma'am. Is this product available po? Thanks in advanced",
        time: "8:14 am", status: "Delivered",
      },
      {
        id: 2, from: "me",
        text: "Good morning po, Yes po sir, the product is available po",
        time: "8:14 am", status: "Delivered",
      },
    ],
    orderRef: { label: "SAMPLE PRODUCT x2", price: "₱1,000", orderId: "Order - 001 - 5166", date: "February 20, 2026", qty: "0 cash", location: "Makati City" },
  },
  {
    id: 3,
    name: "Ms. Sheila R. Acibar",
    avatar: "SA",
    avatarBg: "linear-gradient(135deg, #10B981, #3B82F6)",
    preview: "Testing Message Goes Here.",
    date: "February 20, 2026",
    unread: false,
    messages: [
      { id: 1, from: "them", text: "Testing Message Goes Here.", time: "9:00 am", status: "Delivered" },
    ],
    orderRef: null,
  },
  {
    id: 4,
    name: "Ms. Sheila R. Acibar",
    avatar: "SA",
    avatarBg: "linear-gradient(135deg, #10B981, #3B82F6)",
    preview: "Testing Message Goes Here.",
    date: "February 20, 2026",
    unread: false,
    messages: [
      { id: 1, from: "them", text: "Testing Message Goes Here.", time: "9:00 am", status: "Delivered" },
    ],
    orderRef: null,
  },
  {
    id: 5,
    name: "Ms. Sheila R. Acibar",
    avatar: "SA",
    avatarBg: "linear-gradient(135deg, #10B981, #3B82F6)",
    preview: "Testing Message Goes Here.",
    date: "February 20, 2026",
    unread: false,
    messages: [
      { id: 1, from: "them", text: "Testing Message Goes Here.", time: "9:00 am", status: "Delivered" },
    ],
    orderRef: null,
  },
  {
    id: 6,
    name: "Ms. Sheila R. Acibar",
    avatar: "SA",
    avatarBg: "linear-gradient(135deg, #10B981, #3B82F6)",
    preview: "Testing Message Goes Here.",
    date: "February 20, 2026",
    unread: false,
    messages: [
      { id: 1, from: "them", text: "Testing Message Goes Here.", time: "9:00 am", status: "Delivered" },
    ],
    orderRef: null,
  },
];

export default function AdminMessages() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(2);
  const [inboxTab, setInboxTab] = useState("All");
  const [inputText, setInputText] = useState("");

  const selected = contacts.find((c) => c.id === selectedId);

  const filteredContacts =
    inboxTab === "All"
      ? contacts
      : inboxTab === "Unread"
      ? contacts.filter((c) => c.unread)
      : contacts.filter((c) => !c.unread);

  const handleSend = () => {
    if (inputText.trim()) setInputText("");
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        @media (min-width: 768px) { .am-burger { display: none !important; } }
        @media (max-width: 767px) {
          .am-burger { display: inline !important; }
          .am-chat-panel { display: none !important; }
          .am-inbox-panel { width: 100% !important; }
        }
        .am-contact-item:hover { background: #F3F4F6 !important; }
        .am-send-btn:hover { background: #1248D4 !important; }
        textarea:focus { outline: none; }
        .am-msg-menu:hover { opacity: 1 !important; }
        .am-contact-item:hover .am-hover-time { display: none; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#F0F7F2", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

        <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main style={{ flex: 1, padding: "24px 20px", overflowX: "hidden", minWidth: 0, display: "flex", flexDirection: "column" }}>

          {/* Top bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <button
              className="am-burger"
              onClick={() => setSidebarOpen(true)}
              style={{ display: "none", background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#374151" }}
            >☰</button>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", margin: 0 }}>Messages</h1>
          </div>

          {/* Messaging layout */}
          <div style={{
            display: "flex", flex: 1,
            background: "#fff", borderRadius: "16px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            overflow: "hidden",
            minHeight: "600px",
          }}>

            {/* LEFT: Inbox */}
            <div className="am-inbox-panel" style={{
              width: "320px", minWidth: "280px",
              borderRight: "1px solid #F3F4F6",
              display: "flex", flexDirection: "column",
            }}>
              {/* Inbox header */}
              <div style={{ padding: "16px 16px 0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ fontWeight: 700, fontSize: "16px", color: "#111827" }}>Inbox</span>
                  <button style={{
                    width: "28px", height: "28px", borderRadius: "50%",
                    border: "1px solid #E5E7EB", background: "#F9FAFB",
                    cursor: "pointer", fontSize: "16px", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    color: "#374151",
                  }}>+</button>
                </div>
                {/* Tabs */}
                <div style={{ display: "flex", gap: "6px", marginBottom: "4px" }}>
                  {["All", "Unread", "Replied"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setInboxTab(tab)}
                      style={{
                        padding: "4px 12px", borderRadius: "20px",
                        border: "1px solid #E5E7EB",
                        background: inboxTab === tab ? "#111827" : "#F9FAFB",
                        color: inboxTab === tab ? "#fff" : "#374151",
                        fontSize: "12px", fontWeight: 500, cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >{tab}</button>
                  ))}
                </div>
              </div>

              {/* Contact list */}
              <div style={{ flex: 1, overflowY: "auto" }}>
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="am-contact-item"
                    onClick={() => setSelectedId(contact.id)}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: "10px",
                      padding: "12px 16px",
                      cursor: "pointer",
                      background: selectedId === contact.id ? "#EFF6FF" : "transparent",
                      borderLeft: selectedId === contact.id ? "3px solid #155DFC" : "3px solid transparent",
                      transition: "all 0.1s",
                      position: "relative",
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: "42px", height: "42px", borderRadius: "50%", flexShrink: 0,
                      background: contact.avatarBg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontWeight: 700, fontSize: "13px",
                    }}>{contact.avatar}</div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <span style={{
                          fontWeight: contact.unread ? 700 : 500,
                          fontSize: "13px", color: "#111827",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          maxWidth: "140px",
                        }}>{contact.name}</span>
                        <span style={{ fontSize: "10px", color: "#9CA3AF", flexShrink: 0, marginLeft: "4px" }}>
                          {contact.date.replace("February ", "Feb ")}
                        </span>
                      </div>
                      <p style={{
                        fontSize: "12px", color: contact.unread ? "#374151" : "#9CA3AF",
                        margin: "2px 0 0",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        fontWeight: contact.unread ? 600 : 400,
                      }}>{contact.preview}</p>
                    </div>

                    {/* Unread dot */}
                    {contact.unread && (
                      <div style={{
                        width: "8px", height: "8px", borderRadius: "50%",
                        background: "#155DFC", flexShrink: 0, marginTop: "6px",
                      }} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: Chat panel */}
            <div className="am-chat-panel" style={{
              flex: 1, minWidth: 0, display: "flex", flexDirection: "column",
              background: "#FAFAFA",
            }}>
              {selected ? (
                <>
                  {/* Chat header */}
                  <div style={{
                    padding: "14px 20px",
                    borderBottom: "1px solid #F3F4F6",
                    background: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "40px", height: "40px", borderRadius: "50%",
                        background: selected.avatarBg,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontWeight: 700, fontSize: "13px",
                      }}>{selected.avatar}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "14px", color: "#111827" }}>{selected.name}</div>
                        <div style={{ fontSize: "11px", color: "#9CA3AF" }}>
                          {selected.name.toLowerCase().replace(/\s+/g, "") + "@gmail.com"}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "12px", color: "#9CA3AF" }}>February 21, 2026</span>
                      <button style={{
                        padding: "5px 14px", borderRadius: "6px",
                        border: "1px solid #FCA5A5", background: "#FEF2F2",
                        color: "#DC2626", fontSize: "12px", cursor: "pointer", fontWeight: 500,
                      }}>Delete</button>
                    </div>
                  </div>

                  {/* Order ref card */}
                  {selected.orderRef && (
                    <div style={{
                      margin: "12px 16px 0",
                      background: "#fff", borderRadius: "10px",
                      border: "1px solid #E5E7EB",
                      padding: "12px 14px",
                      display: "flex", alignItems: "center", gap: "12px",
                    }}>
                      {/* Product image placeholder */}
                      <div style={{
                        width: "60px", height: "48px", borderRadius: "6px",
                        background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "22px", flexShrink: 0,
                      }}>📦</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>{selected.orderRef.label}</div>
                        <div style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>{selected.orderRef.price}</div>
                        <div style={{ fontSize: "11px", color: "#9CA3AF" }}>
                          Ordered: {selected.orderRef.date} · {selected.orderRef.qty} · {selected.orderRef.location}
                        </div>
                      </div>
                      <span style={{
                        fontSize: "11px", color: "#155DFC", fontWeight: 600,
                        background: "#EFF6FF", padding: "4px 10px", borderRadius: "6px",
                        whiteSpace: "nowrap",
                      }}>{selected.orderRef.orderId}</span>
                    </div>
                  )}

                  {/* Messages */}
                  <div style={{
                    flex: 1, overflowY: "auto",
                    padding: "16px",
                    display: "flex", flexDirection: "column", gap: "12px",
                  }}>
                    {selected.messages.map((msg) => (
                      <div key={msg.id} style={{
                        display: "flex",
                        justifyContent: msg.from === "me" ? "flex-end" : "flex-start",
                        alignItems: "flex-end", gap: "8px",
                      }}>
                        {msg.from === "them" && (
                          <div style={{
                            width: "32px", height: "32px", borderRadius: "50%",
                            background: selected.avatarBg, flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#fff", fontSize: "11px", fontWeight: 700,
                          }}>{selected.avatar}</div>
                        )}

                        <div style={{ maxWidth: "65%" }}>
                          <div style={{
                            padding: "10px 14px",
                            borderRadius: msg.from === "me"
                              ? "16px 16px 4px 16px"
                              : "16px 16px 16px 4px",
                            background: msg.from === "me" ? "#155DFC" : "#fff",
                            color: msg.from === "me" ? "#fff" : "#374151",
                            fontSize: "13px", lineHeight: "1.5",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                            border: msg.from === "them" ? "1px solid #F3F4F6" : "none",
                          }}>
                            {msg.time && (
                              <div style={{
                                fontSize: "10px",
                                color: msg.from === "me" ? "rgba(255,255,255,0.7)" : "#9CA3AF",
                                marginBottom: "4px",
                              }}>
                                {selected.name.split(" ")[0]} {msg.time}
                              </div>
                            )}
                            {msg.text}
                          </div>
                          <div style={{
                            fontSize: "10px", color: "#9CA3AF", marginTop: "4px",
                            textAlign: msg.from === "me" ? "right" : "left",
                          }}>
                            {msg.status}
                          </div>
                        </div>

                        {msg.from === "me" && (
                          <div style={{
                            width: "32px", height: "32px", borderRadius: "50%",
                            background: "linear-gradient(135deg, #2B7FFF, #9810FA)", flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#fff", fontSize: "11px", fontWeight: 700,
                          }}>AD</div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Input bar */}
                  <div style={{
                    padding: "12px 16px",
                    borderTop: "1px solid #F3F4F6",
                    background: "#fff",
                    display: "flex", alignItems: "flex-end", gap: "10px",
                  }}>
                    <button style={{
                      width: "34px", height: "34px", borderRadius: "50%",
                      border: "1px solid #E5E7EB", background: "#F9FAFB",
                      cursor: "pointer", fontSize: "16px", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>+</button>
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                      placeholder="Is there anything else I can help for you?"
                      rows={2}
                      style={{
                        flex: 1, padding: "10px 14px",
                        border: "1px solid #E5E7EB", borderRadius: "12px",
                        fontSize: "13px", color: "#374151",
                        resize: "none", fontFamily: "inherit",
                        background: "#F9FAFB", lineHeight: "1.5",
                      }}
                    />
                    <button
                      className="am-send-btn"
                      onClick={handleSend}
                      style={{
                        width: "38px", height: "38px", borderRadius: "50%",
                        border: "none", background: "#155DFC",
                        cursor: "pointer", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "background 0.15s",
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", fontSize: "14px" }}>
                  Select a conversation to start messaging
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}