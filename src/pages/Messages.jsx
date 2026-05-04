import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { postChatMessage, getChatRooms, getChatMessages } from "../api/chat";
import api from "../api/axios";
import CompanyLogo from "../assets/Logo — Jem 8 Circle Trading Co (1).png";

const BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "http://127.0.0.1:8000";

/* ─────────────────────────────────────────────
   Avatar helpers
───────────────────────────────────────────── */
const normalizeAvatar = (url) => {
  if (!url) return null;
  if (/^data:|^https?:\/\//i.test(url)) return url;
  const orig = String(url);
  if (orig.startsWith("/")) return orig;
  let base =
    (typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env.VITE_API_URL) ||
    (typeof process !== "undefined" &&
      process.env &&
      process.env.REACT_APP_API_URL) ||
    "";
  try {
    if (!base && api && api.defaults && api.defaults.baseURL) {
      base = String(api.defaults.baseURL).replace(/\/api\/?$/, "");
    }
  } catch (e) {}
  const path = String(url).replace(/^\/+/, "");
  if (
    path.toLowerCase().startsWith("images/") ||
    path.toLowerCase().startsWith("img/")
  )
    return "/" + path;
  if (path.toLowerCase().startsWith("storage/"))
    return base ? base.replace(/\/+$/, "") + "/" + path : "/" + path;
  if (/\/storage\//i.test(path))
    return base
      ? base.replace(/\/+$/, "") + "/" + path.replace(/^\/+/, "")
      : path.startsWith("/")
      ? path
      : "/" + path;
  return base
    ? base.replace(/\/+$/, "") + "/storage/" + path
    : "/storage/" + path;
};

const svgFallback = (letter = "A", bg = "#4d7b65") => {
  const txt = String(letter).charAt(0).toUpperCase() || "A";
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><rect width='100%' height='100%' fill='${bg}' rx='12' ry='12'/><text x='50%' y='50%' dy='.35em' text-anchor='middle' font-family='Helvetica, Arial, sans-serif' font-size='34' fill='#fff'>${txt}</text></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
};

/* ─────────────────────────────────────────────
   File helpers
───────────────────────────────────────────── */
const normalizeFileUrl = (url) => {
  if (!url) return null;
  if (/^data:|^https?:\/\//i.test(url)) return url;
  const path = String(url).replace(/^\/+/, "");
  let base =
    (typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env.VITE_API_URL) ||
    (typeof process !== "undefined" &&
      process.env &&
      process.env.REACT_APP_API_URL) ||
    "";
  try {
    if (!base && api && api.defaults && api.defaults.baseURL)
      base = String(api.defaults.baseURL).replace(/\/api\/?$/, "");
  } catch (e) {}
  if (
    path.toLowerCase().startsWith("storage/") ||
    /\/storage\//i.test(path)
  )
    return base ? base.replace(/\/+$/, "") + "/" + path : "/" + path;
  return base
    ? base.replace(/\/+$/, "") + "/storage/" + path
    : "/storage/" + path;
};

const isFileLike = (obj) => {
  if (!obj) return false;
  if (typeof obj === "string") return false;
  return [
    "filename",
    "name",
    "stored_name",
    "storedName",
    "path",
    "url",
    "file_url",
    "mime",
    "type",
  ].some((k) => Object.prototype.hasOwnProperty.call(obj, k));
};

const extractAttachments = (msg) => {
  if (!msg) return [];
  let list = [];
  if (Array.isArray(msg.attachments) && msg.attachments.length)
    list = msg.attachments;
  else if (msg.attachment) list = [msg.attachment];
  else if (Array.isArray(msg.files) && msg.files.length) list = msg.files;
  else if (msg.file) list = [msg.file];
  else if (msg.img) list = [{ url: msg.img }];
  Object.keys(msg).forEach((k) => {
    const v = msg[k];
    if (!v) return;
    if (Array.isArray(v))
      v.forEach((el) => {
        if (isFileLike(el)) list.push(el);
      });
    else if (typeof v === "object") {
      if (isFileLike(v)) list.push(v);
    } else if (typeof v === "string") {
      if (
        /\.(pdf|docx?|png|jpe?g|gif|webp|mp4|mov)$/i.test(v) ||
        /(^chat\/|\/storage\/)/i.test(v)
      )
        list.push({ url: v, filename: v });
    }
  });

  const normalized = list
    .map((a) => {
      if (!a) return null;
      if (typeof a === "string")
        return { url: normalizeFileUrl(a), filename: a, mime: null };
      const url =
        a.url ||
        a.path ||
        a.file_url ||
        a.img ||
        a.stored_name ||
        a.storedName ||
        a.filename ||
        a.name ||
        null;
      const filename =
        a.filename ||
        a.name ||
        a.stored_name ||
        a.storedName ||
        (typeof a === "string" ? a : null) ||
        null;
      let mime = a.mime || a.type || a.mime_type || null;
      if (!mime) {
        const probe = String(filename || url || "")
          .split("?")[0]
          .split("#")[0];
        const ext = (probe.split(".").pop() || "").toLowerCase();
        const imgExts = [
          "jpg",
          "jpeg",
          "png",
          "gif",
          "webp",
          "svg",
          "bmp",
          "tiff",
          "tif",
        ];
        if (imgExts.includes(ext))
          mime = "image/" + (ext === "jpg" ? "jpeg" : ext);
      }
      return { url: normalizeFileUrl(url || filename), filename, mime };
    })
    .filter(Boolean);

  const seen = new Set();
  const dedup = [];
  for (const a of normalized) {
    try {
      const key = (a.url || a.filename || "").split("?")[0].split("#")[0];
      if (!key) continue;
      if (seen.has(key)) continue;
      seen.add(key);
      dedup.push(a);
    } catch (e) {
      if (!dedup.includes(a)) dedup.push(a);
    }
  }
  return dedup;
};

const FileIcon = ({ filename, mime, className }) => {
  const ext = (filename || "").split(".").pop()?.toLowerCase();
  if (mime && mime.startsWith("image"))
    return (
      <svg
        className={className}
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M3 7a2 2 0 0 1 2-2h2"
          stroke="#4b5563"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  if (ext === "pdf" || mime === "application/pdf")
    return (
      <svg
        className={className}
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M6 2h7l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
          stroke="#c8232c"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  if (["doc", "docx"].includes(ext) || /word/i.test(mime || ""))
    return (
      <svg
        className={className}
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
          stroke="#2563eb"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
        stroke="#4b5563"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/* ─────────────────────────────────────────────
   Product Card shown inside chat bubble
───────────────────────────────────────────── */
function ProductMsgCard({ text, isFromMe }) {
  const match = text?.match(/interested in (.+?) \(ID (\d+)\)/);
  if (!match) return null;
  const [, pname, pid] = match;
  const [imgSrc, setImgSrc] = useState(null);
  const [imgLoading, setImgLoading] = useState(true);

  useEffect(() => {
    if (!pid) return;
    fetch(`${BASE_URL}/api/products/${pid}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        const p = data?.product ?? data?.data ?? data;
        const img = p?.images?.[0]?.image_path;
        if (img) setImgSrc(`${BASE_URL}/storage/${img}`);
      })
      .catch(() => {})
      .finally(() => setImgLoading(false));
  }, [pid]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 8,
        background: isFromMe
          ? "rgba(255,255,255,0.15)"
          : "rgba(77,123,101,0.08)",
        borderRadius: 12,
        padding: "8px 10px",
        border: isFromMe
          ? "1px solid rgba(255,255,255,0.25)"
          : "1px solid rgba(77,123,101,0.2)",
      }}
    >
      {/* Product image or placeholder */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 10,
          overflow: "hidden",
          flexShrink: 0,
          border: isFromMe
            ? "2px solid rgba(255,255,255,0.4)"
            : "2px solid rgba(77,123,101,0.3)",
          background: isFromMe ? "rgba(255,255,255,0.2)" : "#edf4f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {imgLoading ? (
          <div
            style={{
              width: 20,
              height: 20,
              border: "2px solid rgba(255,255,255,0.3)",
              borderTopColor: isFromMe ? "#fff" : "#4d7b65",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
            }}
          />
        ) : imgSrc ? (
          <img
            src={imgSrc}
            alt={pname}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => {
              e.target.style.display = "none";
              e.target.parentNode.innerHTML = '<span style="font-size:24px">📦</span>';
            }}
          />
        ) : (
          <span style={{ fontSize: 24 }}>📦</span>
        )}
      </div>

      {/* Product info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            opacity: 0.7,
            marginBottom: 3,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Product Inquiry
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            lineHeight: 1.3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: 200,
          }}
        >
          {pname}
        </div>
        <div
          style={{
            fontSize: 11,
            opacity: 0.65,
            marginTop: 2,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span>🏷️</span>
          <span>ID #{pid}</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
const INITIAL_THREADS = [];
const FILTER_TABS = ["Inbox", "Unread", "Done"];

async function startChatWithAdmin(initialText = "Hello admin") {
  try {
    const created = await postChatMessage({ messages: initialText });
    const msgObj =
      created?.data ?? created?.message ?? created ?? {};
    const chatroomId =
      msgObj?.chatroom_id || msgObj?.chatroom?.id || msgObj?.id || null;
    if (!chatroomId) return null;
    const msgsResp = await getChatMessages(chatroomId);
    const serverMessages = Array.isArray(msgsResp)
      ? msgsResp
      : msgsResp.messages || msgsResp.data || [];
    return { chatroomId, serverMessages };
  } catch (err) {
    throw err;
  }
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export default function Messages() {
  const [threads, setThreads] = useState(INITIAL_THREADS);
  const [activeThread, setActiveThread] = useState(null);
  const [activeTab, setActiveTab] = useState("Inbox");
  const [input, setInput] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingPreview, setPendingPreview] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [product, setProduct] = useState(null);
  const bottomRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const pollRef = useRef(null);
  const fileInputRef = useRef(null);
  const textRef = useRef(null);
  const inputTextRef = useRef("");
  const inputDebounceRef = useRef(null);
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const thread = threads.find((t) => t.id === activeThread);

  /* ── Read product from router state / query params ── */
  useEffect(() => {
    try {
      const st = location && location.state;
      if (st) {
        const maybeProduct =
          st.product || st.product_name || st.productName || null;
        if (maybeProduct) {
          if (typeof maybeProduct === "string")
            setProduct({
              id: st.product_id || st.productId || null,
              name: maybeProduct,
              image: st.product_image || st.productImage || null,
            });
          else
            setProduct(
              typeof maybeProduct === "object"
                ? {
                    ...maybeProduct,
                    image: st.product_image || st.productImage || null,
                  }
                : {
                    id: st.product_id || st.productId || null,
                    name: String(maybeProduct),
                    image: st.product_image || st.productImage || null,
                  }
            );
          return;
        }
      }
      const params = new URLSearchParams(
        location?.search || window.location.search
      );
      const pid =
        params.get("product_id") ||
        params.get("productId") ||
        params.get("product");
      let pname =
        params.get("product_name") ||
        params.get("productName") ||
        params.get("product");
      if (pname) {
        try {
          pname = String(pname).replace(/\+/g, " ");
        } catch (e) {}
      }
      const pimage = params.get("product_image") || null;
      if (pid || pname) setProduct({ id: pid, name: pname, image: pimage });
    } catch (e) {}
  }, [location?.search, location?.state]);

  /* ── Deduplicated message list ── */
  const messagesToRender = useMemo(() => {
    const raw = Array.isArray(thread?.messages) ? thread.messages : [];
    const m = new Map();
    raw.forEach((item, idx) => {
      const key =
        item?.id ??
        item?.message_id ??
        `${item?.user_id ?? item?.sender_id ?? ""}-${
          item?.created_at ?? item?.time ?? idx
        }`;
      if (!m.has(key)) m.set(key, item);
    });
    return Array.from(m.values());
  }, [thread?.messages]);

  /* ── Helpers ── */
  const getUserId = (u) =>
    u?.id ?? u?.user_id ?? u?.data?.id ?? u?.data?.user_id ?? null;
  const isAdminUser = (u) =>
    !!(
      (u && (u.is_admin || u.isAdmin || u.role === "admin")) ||
      (u &&
        u.data &&
        (u.data.is_admin || u.data.isAdmin || u.data.role === "admin"))
    );

  const filterMessagesForUser = (messages) =>
    Array.isArray(messages) ? messages : [];

  const sortMessagesAsc = (messages) => {
    if (!Array.isArray(messages)) return [];
    try {
      return [...messages].sort((a, b) => {
        const ta =
          Date.parse(
            a.created_at ||
              a.createdAt ||
              a.time ||
              a.timestamp ||
              a.date ||
              a.ts ||
              0
          ) || 0;
        const tb =
          Date.parse(
            b.created_at ||
              b.createdAt ||
              b.time ||
              b.timestamp ||
              b.date ||
              b.ts ||
              0
          ) || 0;
        return ta - tb;
      });
    } catch (e) {
      return messages;
    }
  };

  /* ── File handling ── */
  const handleFileChange = (e) => {
    const f = e?.target?.files && e.target.files[0];
    if (!f) return;
    try {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    } catch (e) {}
    const url =
      f && f.type && f.type.startsWith("image/")
        ? URL.createObjectURL(f)
        : null;
    setPendingFile(f);
    setPendingPreview(url);
    try {
      e.target.value = "";
    } catch (er) {}
  };

  useEffect(() => {
    return () => {
      if (inputDebounceRef.current) clearTimeout(inputDebounceRef.current);
    };
  }, []);

  const removePendingFile = () => {
    try {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    } catch (e) {}
    setPendingFile(null);
    setPendingPreview(null);
  };

  /* ── Scroll to bottom ── */
  const scrollToBottom = (smooth = true) => {
    const el = messagesContainerRef.current;
    if (!el) return;
    try {
      const top = el.scrollHeight - el.clientHeight;
      el.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
    } catch (e) {
      try {
        el.scrollTop = el.scrollHeight;
      } catch (err) {}
    }
  };

  useEffect(() => {
    const t = setTimeout(() => scrollToBottom(true), 50);
    return () => clearTimeout(t);
  }, [activeThread, thread?.messages?.length]);

  /* ── Unauthenticated screen ── */
  if (unauthenticated) {
    return (
      <div
        className="flex items-center justify-center min-h-screen bg-[#f8fafb]"
        style={{ paddingTop: "var(--header-h)" }}
      >
        <div
          style={{
            width: 720,
            padding: 28,
            borderRadius: 12,
            background: "white",
            boxShadow: "0 8px 40px rgba(0,0,0,0.06)",
            textAlign: "center",
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>
            Sign in to view your messages
          </h3>
          <p style={{ color: "#64748b", marginBottom: 18 }}>
            You must be signed in to the account that owns these conversations.
            Please log in to continue.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
            <button
              onClick={() => navigate("/login")}
              style={{
                background: "#1a1a1a",
                color: "#fff",
                border: "none",
                padding: "10px 16px",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Send message ── */
  const handleSend = async () => {
    const text = input.trim();
    if (!text && !pendingFile) return;

    const currentUid = getUserId(currentUser);

    const optimisticMsg = {
      id: Date.now(),
      from: "me",
      user_id: currentUid,
      sender_id: currentUid,
      account_id: currentUid,
      text,
      time: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
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
    try {
      if (textRef.current) textRef.current.value = "";
    } catch (e) {}
    inputTextRef.current = "";
    if (inputDebounceRef.current) {
      clearTimeout(inputDebounceRef.current);
      inputDebounceRef.current = null;
    }
    isTypingRef.current = false;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    try {
      const currentIsAdmin = isAdminUser(currentUser);
      const payload = {
        chatroom_id: activeThread,
        messages: String(text || ""),
      };
      if (
        currentIsAdmin &&
        thread &&
        (thread.userId || thread.user_id)
      ) {
        payload.target_user_id = thread.userId || thread.user_id;
      }

      if (pendingFile) {
        const fd = new FormData();
        if (
          payload.chatroom_id !== undefined &&
          payload.chatroom_id !== null
        )
          fd.append("chatroom_id", payload.chatroom_id);
        fd.append("messages", String(payload.messages));
        if (payload.target_user_id)
          fd.append("target_user_id", payload.target_user_id);
        fd.append("file", pendingFile);
        await postChatMessage(fd);
      } else {
        await postChatMessage(payload);
      }

      try {
        const msgsResp = await getChatMessages(activeThread);
        const serverMessages = Array.isArray(msgsResp)
          ? msgsResp
          : msgsResp.messages || [];
        setThreads((prev) =>
          prev.map((t) =>
            t.id === activeThread
              ? {
                  ...t,
                  messages:
                    serverMessages.length > 0
                      ? serverMessages
                      : t.messages,
                }
              : t
          )
        );
        if (pendingFile) removePendingFile();
      } catch (err2) {
        console.warn("Failed to refresh messages after send:", err2);
      }
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      if (msg === "Unauthenticated.") {
        setUnauthenticated(true);
      } else {
        console.error("Failed to send chat message:", err);
      }
    }
  };

  /* ── Load chat rooms on mount ── */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        let meResp = null;
        try {
          meResp = await api.get("/me");
          if (meResp && meResp.data) setCurrentUser(meResp.data);
        } catch (mErr) {}

        const roomsResp = await getChatRooms();
        const rooms = Array.isArray(roomsResp)
          ? roomsResp
          : roomsResp.rooms || roomsResp.chatrooms || [];
        const currentUid = getUserId(meResp?.data || currentUser);

        const safeRooms = rooms.filter((r) => {
          if (!currentUid) return true;
          if (
            r.user_id == currentUid ||
            r.userId == currentUid ||
            r.owner_id == currentUid
          )
            return true;
          if (Array.isArray(r.participants)) {
            if (r.participants.includes && r.participants.includes(currentUid))
              return true;
            if (
              r.participants.some &&
              r.participants.some(
                (p) => p && (p.id || p.user_id) == currentUid
              )
            )
              return true;
          }
          if (Array.isArray(r.members))
            return r.members.some(
              (m) => (m.id || m.user_id) == currentUid
            );
          if (Array.isArray(r.participant_ids))
            return r.participant_ids.includes(currentUid);
          return false;
        });

        if (!mounted) return;

        let requestedId = null;
        try {
          requestedId = new URLSearchParams(
            window.location.search || ""
          ).get("chatroom_id");
        } catch (e) {
          requestedId = null;
        }

        const mapRoom = (r) => {
          const currentIsAdmin = isAdminUser(meResp?.data || currentUser);
          const inferredAvatar =
            r.user?.profile_picture ||
            r.profile_picture ||
            r.avatar_url ||
            r.avatarUrl ||
            r.picture ||
            r.photo ||
            (r.participants &&
              r.participants[0] &&
              (r.participants[0].profile_picture ||
                r.participants[0].avatar_url ||
                r.participants[0].picture)) ||
            null;
          const inferredName =
            r.name ||
            r.title ||
            (r.participants ? r.participants.join(", ") : "Chat");
          const isRoomAdmin = !!(r.is_admin || r.isAdmin || r.admin);
          const displayName =
            !currentIsAdmin && isRoomAdmin
              ? "Jem 8 Trading Co."
              : inferredName;
          const displayAvatarUrl = isRoomAdmin
            ? CompanyLogo
            : normalizeAvatar(inferredAvatar);
          const rawMsgs = Array.isArray(r.messages)
            ? filterMessagesForUser(r.messages)
            : [];
          return {
            id: r.id || r.chatroom_id || r.room_id,
            userId:
              r.user_id ||
              r.userId ||
              r.owner_id ||
              (Array.isArray(r.participant_ids)
                ? r.participant_ids[0]
                : null) ||
              (Array.isArray(r.participants)
                ? r.participants[0]?.id || r.participants[0]
                : null),
            name: displayName,
            avatar: (displayName || "").charAt(0).toUpperCase() || "J",
            avatarBg: r.avatarBg || "#4d7b65",
            avatarUrl: displayAvatarUrl,
            isAdmin: isRoomAdmin,
            unread: r.unread || 0,
            lastTime: r.last_time || "",
            messages: sortMessagesAsc(rawMsgs),
          };
        };

        if (requestedId) {
          const found = safeRooms.find(
            (r) =>
              String(r.id) === String(requestedId) ||
              String(r.chatroom_id) === String(requestedId) ||
              String(r.room_id) === String(requestedId)
          );
          if (found) {
            const mapped = safeRooms.map(mapRoom);
            mapped.sort((a, b) => {
              if ((a.unread ? 1 : 0) !== (b.unread ? 1 : 0))
                return (b.unread ? 1 : 0) - (a.unread ? 1 : 0);
              const ta = Date.parse(a.lastTime || 0) || 0;
              const tb = Date.parse(b.lastTime || 0) || 0;
              return tb - ta;
            });
            setThreads((prev) =>
              mapped.map((m) => ({
                ...m,
                messages:
                  Array.isArray(m.messages) && m.messages.length > 0
                    ? m.messages
                    : prev.find((p) => p.id === m.id)?.messages || [],
              }))
            );
            setActiveThread(
              found.id || found.chatroom_id || found.room_id
            );
            return;
          } else {
            try {
              const msgsResp = await getChatMessages(requestedId);
              const serverMessages = Array.isArray(msgsResp)
                ? msgsResp
                : msgsResp.messages || [];
              const newThread = {
                id: requestedId,
                name: "Admin",
                avatar: "A",
                avatarBg: "#4d7b65",
                avatarUrl: CompanyLogo,
                isAdmin: true,
                unread: 0,
                lastTime: "",
                messages: sortMessagesAsc(serverMessages),
              };
              const mapped = safeRooms.map(mapRoom);
              setThreads([newThread, ...mapped]);
              setActiveThread(requestedId);
              return;
            } catch (e) {}
          }
        }

        if (safeRooms.length > 0) {
          const mapped = safeRooms.map(mapRoom);
          mapped.sort((a, b) => {
            if ((a.unread ? 1 : 0) !== (b.unread ? 1 : 0))
              return (b.unread ? 1 : 0) - (a.unread ? 1 : 0);
            const ta = Date.parse(a.lastTime || 0) || 0;
            const tb = Date.parse(b.lastTime || 0) || 0;
            return tb - ta;
          });
          setThreads((prev) =>
            mapped.map((m) => ({
              ...m,
              messages:
                Array.isArray(m.messages) && m.messages.length > 0
                  ? m.messages
                  : prev.find((p) => p.id === m.id)?.messages || [],
            }))
          );
          setActiveThread(mapped[0]?.id ?? null);
        }
      } catch (err) {
        const msg = err && err.message ? err.message : String(err);
        if (msg === "Unauthenticated.") {
          setUnauthenticated(true);
          setThreads([]);
        } else {
          console.warn("Failed to load chat rooms:", msg);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /* ── Poll messages for active thread ── */
  useEffect(() => {
    if (!activeThread || unauthenticated) return;
    let mounted = true;

    const poll = async () => {
      try {
        if (isTypingRef.current) return;
        const msgsResp = await getChatMessages(activeThread);
        const serverMessages = Array.isArray(msgsResp)
          ? msgsResp
          : msgsResp.messages || [];
        const safeMsgs = filterMessagesForUser(serverMessages);
        const sortedSafeMsgs = sortMessagesAsc(safeMsgs);
        if (!mounted) return;

        const messageKey = (m) =>
          m?.id ??
          m?.message_id ??
          `${m?.user_id ?? m?.sender_id ?? ""}-${
            m?.created_at ?? m?.time ?? ""
          }`;
        const newLast = sortedSafeMsgs.length
          ? messageKey(sortedSafeMsgs[sortedSafeMsgs.length - 1])
          : null;
        const existing =
          (threads.find((t) => t.id === activeThread) || {}).messages || [];
        const existingSorted = sortMessagesAsc(existing);
        const prevLast = existingSorted.length
          ? messageKey(existingSorted[existingSorted.length - 1])
          : null;

        if (
          prevLast === newLast &&
          existingSorted.length === sortedSafeMsgs.length
        )
          return;

        setThreads((prev) =>
          prev.map((t) =>
            t.id === activeThread
              ? {
                  ...t,
                  messages:
                    sortedSafeMsgs.length > 0
                      ? sortedSafeMsgs
                      : t.messages,
                }
              : t
          )
        );

        if (!prevLast || (newLast && newLast !== prevLast)) {
          try {
            bottomRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "end",
            });
          } catch (e) {}
        }
      } catch (err) {
        console.warn("Polling messages failed:", err);
      }
    };

    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => {
      mounted = false;
      clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [activeThread, currentUser, unauthenticated]);

  /* ── Auto-start chat ── */
  const AUTO_START_KEY = "chat_auto_started_v1";

  async function openOrCreateUserChat() {
    try {
      const roomsResp = await getChatRooms();
      const rooms = Array.isArray(roomsResp)
        ? roomsResp
        : roomsResp?.rooms || roomsResp?.chatrooms || roomsResp?.data || [];
      if (rooms.length > 0) {
        const room = rooms[0];
        const chatroomId =
          room.id || room.chatroom_id || room.room_id || null;
        if (chatroomId) {
          const msgsResp = await getChatMessages(chatroomId);
          const messages = Array.isArray(msgsResp)
            ? msgsResp
            : msgsResp?.messages || msgsResp?.data || [];
          return { chatroomId, messages };
        }
      }
    } catch (e) {}

    try {
      const lock = localStorage.getItem(AUTO_START_KEY);
      if (lock) {
        const parsed = JSON.parse(lock);
        if (parsed?.chatroomId) {
          const chatroomId = parsed.chatroomId;
          try {
            const msgsResp = await getChatMessages(chatroomId);
            const messages = Array.isArray(msgsResp)
              ? msgsResp
              : msgsResp?.messages || msgsResp?.data || [];
            return { chatroomId, messages };
          } catch (e) {}
        }
      }
    } catch (e) {}

    try {
      const created = await postChatMessage({
        messages: "Hello admin, I need help with an order.",
      });
      const msgObj = created?.data ?? created?.message ?? created ?? {};
      const chatroomId =
        msgObj?.chatroom_id || msgObj?.chatroom?.id || msgObj?.id || null;
      if (!chatroomId) return null;
      try {
        localStorage.setItem(
          AUTO_START_KEY,
          JSON.stringify({ chatroomId, ts: Date.now() })
        );
      } catch (e) {}
      const msgsResp = await getChatMessages(chatroomId);
      const messages = Array.isArray(msgsResp)
        ? msgsResp
        : msgsResp?.messages || msgsResp?.data || [];
      return { chatroomId, messages };
    } catch (err) {
      throw err;
    }
  }

  function subscribeEcho(chatroomId) {
    if (!window.Echo) return;
    try {
      try {
        window.Echo.leave("chat." + chatroomId);
      } catch (e) {}
      window.Echo.private("chat." + chatroomId).listen(
        "NewMessage",
        (ev) => {
          const raw = ev?.message || ev || {};
          const avatarCandidate =
            raw.avatarUrl ||
            raw.avatar ||
            raw.user?.profile_picture ||
            raw.user?.profile_image ||
            raw.user?.avatar ||
            raw.user?.picture ||
            null;
          let avatarUrl = normalizeAvatar(avatarCandidate);
          if (
            raw?.is_admin ||
            raw?.sender === "admin" ||
            raw?.from === "admin" ||
            (raw.user && (raw.user.is_admin || raw.user.role === "admin"))
          ) {
            avatarUrl = CompanyLogo;
          }
          const payload = { ...raw, avatarUrl };
          setThreads((prev) =>
            prev.map((t) => {
              if (t.id !== chatroomId) return t;
              const msgs = Array.isArray(t.messages)
                ? [...t.messages, payload]
                : [payload];
              return { ...t, messages: sortMessagesAsc(msgs) };
            })
          );
        }
      );
    } catch (e) {
      console.warn("Echo subscribe failed", e);
    }
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (unauthenticated) return;
      if (threads.length > 0) return;
      try {
        if (
          new URLSearchParams(window.location.search || "").get(
            "chatroom_id"
          )
        )
          return;
      } catch (e) {}

      try {
        const res = await openOrCreateUserChat();
        if (!mounted || !res) return;
        const { chatroomId, messages } = res;
        const newThread = {
          id: chatroomId,
          name: "Admin",
          avatar: "A",
          avatarBg: "#4d7b65",
          avatarUrl: CompanyLogo,
          isAdmin: true,
          unread: 0,
          lastTime: "",
          messages: Array.isArray(messages) ? messages : [],
        };
        setThreads((prev) => [newThread, ...prev]);
        setActiveThread(chatroomId);
        subscribeEcho(chatroomId);
      } catch (err) {
        const msg = err && err.message ? err.message : String(err);
        if (msg === "Unauthenticated.") setUnauthenticated(true);
        else console.warn("auto-start failed", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [threads.length, unauthenticated]);

  /* ── Input handlers ── */
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const openThread = (id) => {
    setActiveThread(id);
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, unread: 0 } : t))
    );
  };

  /* ── Filter threads ── */
  const filteredThreads = threads.filter((t) => {
    const matchSearch = t.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    if (activeTab === "Unread") return matchSearch && t.unread > 0;
    if (activeTab === "Done")
      return matchSearch && t.unread === 0 && !t.isAdmin;
    return matchSearch;
  });

  const totalUnread = threads.reduce((s, t) => s + t.unread, 0);

  /* ── Formatters ── */
  const formatMsgTime = (msg) => {
    const t = msg?.time || msg?.created_at || msg?.createdAt;
    if (!t) return "";
    try {
      return new Date(t).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return String(t);
    }
  };

  const formatChatDate = (iso) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      if (isNaN(d)) return String(iso);
      const now = new Date();
      const diff = now - d;
      const oneDay = 24 * 60 * 60 * 1000;
      if (diff < oneDay)
        return d.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        });
      if (diff < 7 * oneDay)
        return d.toLocaleDateString([], {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
      return d.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (e) {
      return String(iso);
    }
  };

  const getMsgText = (msg) =>
    msg?.text || msg?.messages || msg?.message || "";

  /* ── Is product inquiry message ── */
  const isProductInquiry = (text) =>
    /interested in .+? \(ID \d+\)/.test(text || "");

  const getTextWithoutProductLine = (text) => {
    if (!text) return "";
    const cleaned = text
      .replace(/Hello admin, I'm interested in .+? \(ID \d+\)\s*/g, "")
      .trim();
    return cleaned;
  };

  /* ──────────────────────────────────────────
     RENDER
  ─────────────────────────────────────────── */
  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ paddingTop: "var(--header-h)", background: "#f0f4f8" }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .msg-bubble { animation: fadeInUp 0.22s ease; }
        .thread-item:hover { background: #f1f7f4 !important; }
        .thread-item.active { background: #e8f4ee !important; border-left: 3px solid #4d7b65 !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #c8dbd3; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #4d7b65; }
      `}</style>

      <section className="flex flex-1 overflow-hidden">
        <div
          style={{
            maxWidth: 1200,
            width: "100%",
            margin: "24px auto",
            display: "flex",
            borderRadius: 20,
            overflow: "hidden",
            boxShadow:
              "0 8px 48px rgba(0,0,0,0.10), 0 2px 12px rgba(0,0,0,0.06)",
            height: "calc(100vh - var(--header-h) - 48px)",
            background: "white",
            border: "1px solid #e2ece6",
          }}
        >
          {/* ══════════════ SIDEBAR ══════════════ */}
          <div
            style={{
              width: 320,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              borderRight: "1px solid #e8f0eb",
              background: "#fff",
            }}
          >
            {/* Sidebar header */}
            <div
              style={{
                padding: "20px 20px 14px",
                borderBottom: "1px solid #e8f0eb",
                background: "linear-gradient(135deg, #f9fcfa 0%, #f0f7f3 100%)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                }}
              >
                <h2
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#1a2e22",
                    margin: 0,
                  }}
                >
                  💬 Messages
                  {totalUnread > 0 && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: 22,
                        height: 22,
                        padding: "0 6px",
                        borderRadius: 99,
                        background: "#4d7b65",
                        color: "white",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {totalUnread}
                    </span>
                  )}
                </h2>
              </div>

              {/* Filter tabs */}
              <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
                {FILTER_TABS.map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 14px",
                        borderRadius: 99,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        border: "none",
                        transition: "all 0.2s",
                        background: isActive ? "#4d7b65" : "#edf4f0",
                        color: isActive ? "white" : "#5a7a6a",
                        boxShadow: isActive
                          ? "0 2px 8px rgba(77,123,101,0.35)"
                          : "none",
                      }}
                    >
                      {tab}
                      {tab === "Unread" && totalUnread > 0 && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: 16,
                            height: 16,
                            padding: "0 4px",
                            borderRadius: 99,
                            fontSize: 10,
                            fontWeight: 700,
                            background: isActive
                              ? "rgba(255,255,255,0.3)"
                              : "#4d7b65",
                            color: "white",
                          }}
                        >
                          {totalUnread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Search */}
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 13,
                    color: "#94a3b8",
                    pointerEvents: "none",
                  }}
                >
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Search messages…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    height: 38,
                    paddingLeft: 34,
                    paddingRight: 12,
                    background: "white",
                    border: "1.5px solid #dde8e2",
                    borderRadius: 10,
                    fontSize: 13,
                    color: "#1e293b",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderColor = "#4d7b65")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = "#dde8e2")
                  }
                />
              </div>
            </div>

            {/* Thread list */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {filteredThreads.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "48px 20px",
                    color: "#94a3b8",
                    fontSize: 13,
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                  No conversations found.
                </div>
              ) : (
                filteredThreads.map((t, threadIdx) => {
                  const lastMsg = t.messages[t.messages.length - 1];
                  const isActive = activeThread === t.id;
                  const lastMsgText =
                    lastMsg?.img
                      ? "📷 Photo"
                      : getMsgText(lastMsg) || "";
                  const displayText = isProductInquiry(lastMsgText)
                    ? "📦 Product inquiry"
                    : lastMsgText;

                  return (
                    <div
                      key={t.id ?? `thread-${threadIdx}`}
                      className={`thread-item${isActive ? " active" : ""}`}
                      onClick={() => openThread(t.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "13px 16px",
                        cursor: "pointer",
                        borderBottom: "1px solid #f3f8f5",
                        position: "relative",
                        transition: "background 0.15s",
                        background: isActive
                          ? "#e8f4ee"
                          : t.unread > 0
                          ? "#f9fdf9"
                          : "white",
                        borderLeft: isActive
                          ? "3px solid #4d7b65"
                          : "3px solid transparent",
                      }}
                    >
                      {/* Avatar */}
                      <div
                        style={{
                          position: "relative",
                          width: 46,
                          height: 46,
                          borderRadius: "50%",
                          background: t.avatarBg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: 700,
                          fontSize: 16,
                          flexShrink: 0,
                          overflow: "hidden",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                        }}
                      >
                        {t.isAdmin ? (
                          <img
                            src={CompanyLogo}
                            alt="Jem 8"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                            onError={(e) => {
                              e.target.src = svgFallback(
                                "J",
                                t.avatarBg || "#4d7b65"
                              );
                            }}
                          />
                        ) : t.avatarUrl ? (
                          <img
                            src={t.avatarUrl}
                            alt={t.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                            onError={(e) => {
                              e.target.src = svgFallback(
                                t.avatar,
                                t.avatarBg || "#4d7b65"
                              );
                            }}
                          />
                        ) : (
                          t.avatar
                        )}
                        {t.isAdmin && (
                          <span
                            style={{
                              position: "absolute",
                              bottom: 2,
                              right: 2,
                              width: 11,
                              height: 11,
                              background: "#22c55e",
                              border: "2px solid white",
                              borderRadius: "50%",
                            }}
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 3,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 13.5,
                              fontWeight: t.unread > 0 ? 800 : 600,
                              color: "#1a2e22",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Jem 8 Trading Co.
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              color: "#94a3b8",
                              flexShrink: 0,
                              marginLeft: 8,
                            }}
                          >
                            {formatChatDate(t.lastTime)}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: t.unread > 0 ? "#374151" : "#94a3b8",
                            fontWeight: t.unread > 0 ? 500 : 400,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {displayText}
                        </div>
                      </div>

                      {/* Unread badge */}
                      {t.unread > 0 && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: 20,
                            height: 20,
                            padding: "0 5px",
                            borderRadius: 99,
                            background: "#4d7b65",
                            color: "white",
                            fontSize: 11,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {t.unread}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ══════════════ CHAT WINDOW ══════════════ */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              background: "#f5f8f6",
            }}
          >
            {/* Chat header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 24px",
                background: "white",
                borderBottom: "1px solid #e8f0eb",
                boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: 46,
                  height: 46,
                  borderRadius: "50%",
                  background: thread?.avatarBg || "#4d7b65",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 16,
                  flexShrink: 0,
                  overflow: "hidden",
                  boxShadow: "0 2px 10px rgba(77,123,101,0.25)",
                }}
              >
                {thread?.isAdmin ? (
                  <img
                    src={CompanyLogo}
                    alt="Jem 8"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      e.target.src = svgFallback(
                        thread?.avatar,
                        thread?.avatarBg || "#4d7b65"
                      );
                    }}
                  />
                ) : thread?.avatarUrl ? (
                  <img
                    src={thread.avatarUrl}
                    alt={thread?.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      e.target.src = svgFallback(
                        thread?.avatar,
                        thread?.avatarBg || "#4d7b65"
                      );
                    }}
                  />
                ) : (
                  thread?.avatar
                )}
                {thread?.isAdmin && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: 2,
                      right: 2,
                      width: 11,
                      height: 11,
                      background: "#22c55e",
                      border: "2px solid white",
                      borderRadius: "50%",
                    }}
                  />
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: "#1a2e22",
                    marginBottom: 2,
                  }}
                >
                  Jem 8 Trading Co.
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  {thread?.isAdmin
                    ? "🟢 Online · JEM 8 Support Team"
                    : "JEM 8 Circle Trading Co."}
                </div>

                {/* Product chip in header */}
                {product?.name && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 6,
                      background: "#edf4f0",
                      border: "1px solid #c6ddd4",
                      borderRadius: 8,
                      padding: "4px 10px 4px 6px",
                    }}
                  >
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          objectFit: "cover",
                          border: "1px solid #b0cfc3",
                          flexShrink: 0,
                        }}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: 16 }}>📦</span>
                    )}
                    <span
                      style={{
                        fontSize: 12,
                        color: "#2d5a42",
                        fontWeight: 600,
                        maxWidth: 300,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {product.name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Messages area ── */}
            <div
              ref={messagesContainerRef}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "24px 28px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                alignItems: "flex-end",
              }}
            >
              {messagesToRender.map((msg, msgIdx) => {
                const currentUserId = getUserId(currentUser);
                const currentIsAdmin = isAdminUser(currentUser);

                let isFromMe = false;
                if (msg) {
                  if (currentUserId) {
                    if (currentIsAdmin) {
                      isFromMe = !!(
                        msg.is_admin ||
                        msg.sender === "admin" ||
                        msg.from === "admin"
                      );
                    } else {
                      isFromMe = !!(
                        msg.from === "me" ||
                        msg.user_id == currentUserId ||
                        msg.account_id == currentUserId ||
                        msg.sender_id == currentUserId ||
                        (msg.account && msg.account.id == currentUserId)
                      );
                    }
                  } else {
                    isFromMe = !!(msg.from === "me");
                  }
                }

                const msgText = getMsgText(msg);
                const hasProductCard = isProductInquiry(msgText);
                const displayText = hasProductCard
                  ? getTextWithoutProductLine(msgText)
                  : msgText;
                const attachments = extractAttachments(msg);
                const hasContent =
                  msg.img ||
                  attachments.length > 0 ||
                  msgText;

                if (!hasContent) return null;

                return (
                  <div
                    key={
                      msg.id ??
                      msg.message_id ??
                      `msg-${msgIdx}-${msg.created_at || msg.time || ""}`
                    }
                    className="msg-bubble"
                    style={{
                          display: "flex",
                          alignItems: "flex-end",
                          gap: 10,
                          flexDirection: isFromMe ? "row-reverse" : "row",
                          marginBottom: 2,
                          width: "100%",
                          boxSizing: "border-box",
                        }}
                  >
                    {/* Sender avatar (only for received messages) */}
                    {!isFromMe && (
                      (() => {
                        const senderIsAdmin = !!(
                          msg.is_admin ||
                          msg.sender === "admin" ||
                          msg.from === "admin"
                        );
                        const senderAvatarRaw = senderIsAdmin
                          ? CompanyLogo
                          : msg.avatarUrl ||
                            msg.avatar_url ||
                            msg.user?.profile_picture ||
                            thread?.avatarUrl ||
                            null;
                        const senderAvatar =
                          normalizeAvatar(senderAvatarRaw);
                        return senderAvatar ? (
                          <img
                            src={senderAvatar}
                            alt={thread?.name}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              flexShrink: 0,
                              marginBottom: 4,
                              objectFit: "cover",
                              boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                            }}
                            onError={(e) => {
                              e.target.src = svgFallback(
                                thread?.avatar || "A",
                                thread?.avatarBg || "#4d7b65"
                              );
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              background: thread?.avatarBg || "#4d7b65",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontWeight: 700,
                              fontSize: 13,
                              flexShrink: 0,
                              marginBottom: 4,
                            }}
                          >
                            {thread?.avatar || "J"}
                          </div>
                        );
                      })()
                    )}

                    {/* Bubble column */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        maxWidth: "68%",
                        alignItems: isFromMe ? "flex-end" : "flex-start",
                      }}
                    >
                      {/* Image attachment (legacy img field) */}
                      {msg.img && (
                        <img
                          src={msg.img}
                          alt="attachment"
                          style={{
                            maxWidth: "100%",
                            borderRadius: 14,
                            marginBottom: 6,
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                            maxHeight: 220,
                            objectFit: "cover",
                          }}
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      )}

                      {/* File attachments */}
                      {attachments.map((att, ai) => (
                        <div key={ai} style={{ marginBottom: 6 }}>
                          {att.mime && att.mime.startsWith("image") ? (
                            <img
                              src={att.url}
                              alt={att.filename || "attachment"}
                              style={{
                                maxWidth: "100%",
                                borderRadius: 14,
                                border: "1px solid #e2e8f0",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                                maxHeight: 220,
                                objectFit: "cover",
                              }}
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          ) : (
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "8px 14px",
                                background: "white",
                                border: "1px solid #e2e8f0",
                                borderRadius: 12,
                                fontSize: 13,
                                color: "#1e293b",
                                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                                textDecoration: "none",
                              }}
                            >
                              <FileIcon
                                filename={att.filename}
                                mime={att.mime}
                              />
                              <span
                                style={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  maxWidth: 260,
                                }}
                              >
                                {att.filename || att.url}
                              </span>
                            </a>
                          )}
                        </div>
                      ))}

                      {/* Main bubble */}
                      {(hasProductCard || displayText) && (
                        <div
                          style={{
                            padding: "12px 16px",
                            borderRadius: isFromMe
                              ? "18px 18px 4px 18px"
                              : "18px 18px 18px 4px",
                            background: isFromMe
                              ? "linear-gradient(135deg, #4d7b65, #3a6352)"
                              : "white",
                            color: isFromMe ? "white" : "#1e293b",
                            border: isFromMe
                              ? "none"
                              : "1px solid #e2ece8",
                            boxShadow: isFromMe
                              ? "0 4px 16px rgba(77,123,101,0.35)"
                              : "0 2px 8px rgba(0,0,0,0.06)",
                            fontSize: 14,
                            lineHeight: 1.55,
                          }}
                        >
                          {/* Product image card inside bubble */}
                          {hasProductCard && (
                            <ProductMsgCard
                              text={msgText}
                              isFromMe={isFromMe}
                            />
                          )}
                          {/* Remaining text */}
                          {displayText && (
                            <span>{displayText}</span>
                          )}
                        </div>
                      )}

                      {/* Timestamp */}
                      <span
                        style={{
                          fontSize: 11,
                          color: "#94a3b8",
                          marginTop: 4,
                          padding: "0 4px",
                        }}
                      >
                        {formatMsgTime(msg)}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* ── Input row ── */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 10,
                padding: "14px 20px",
                background: "white",
                borderTop: "1px solid #e8f0eb",
                boxShadow: "0 -2px 10px rgba(0,0,0,0.04)",
              }}
            >
              {/* Attach button */}
              <button
                aria-label="Attach file"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  background: "#edf4f0",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 18,
                  color: "#5a7a6a",
                  flexShrink: 0,
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#daeae3")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#edf4f0")
                }
              >
                📎
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,application/pdf,.doc,.docx"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />

              {/* Textarea wrapper */}
              <div style={{ flex: 1, position: "relative" }}>
                <div
                  style={{
                    background: "#f0f5f2",
                    border: "1.5px solid #dde8e2",
                    borderRadius: 16,
                    padding: "8px 12px",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                  onFocusCapture={(e) => {
                    e.currentTarget.style.borderColor = "#4d7b65";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 3px rgba(77,123,101,0.12)";
                    e.currentTarget.style.background = "white";
                  }}
                  onBlurCapture={(e) => {
                    e.currentTarget.style.borderColor = "#dde8e2";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.background = "#f0f5f2";
                  }}
                >
                  {/* File preview chip */}
                  {pendingFile && (
                    <div style={{ marginBottom: 8 }}>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          background: "white",
                          border: "1px solid #e2e8f0",
                          borderRadius: 99,
                          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                          padding: "4px 10px 4px 4px",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            background: "#f0f5f2",
                            borderRadius: "50%",
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {pendingPreview ? (
                            <img
                              src={pendingPreview}
                              alt={pendingFile.name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#5a7a6a",
                              }}
                            >
                              {String(pendingFile.name)
                                .split(".")
                                .pop()
                                ?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: 13,
                            color: "#1e293b",
                            maxWidth: 200,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {pendingFile.name}
                        </span>
                        <button
                          onClick={removePendingFile}
                          style={{
                            width: 22,
                            height: 22,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "50%",
                            border: "1px solid #e2e8f0",
                            background: "#f8fafc",
                            cursor: "pointer",
                            color: "#64748b",
                            flexShrink: 0,
                          }}
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M6 6l12 12M18 6L6 18"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  <textarea
                    ref={textRef}
                    placeholder="Type your message…"
                    defaultValue={input}
                    onChange={(e) => {
                      inputTextRef.current = e.target.value;
                      isTypingRef.current = true;
                      if (typingTimeoutRef.current)
                        clearTimeout(typingTimeoutRef.current);
                      typingTimeoutRef.current = setTimeout(() => {
                        isTypingRef.current = false;
                      }, 1200);
                      if (inputDebounceRef.current)
                        clearTimeout(inputDebounceRef.current);
                      inputDebounceRef.current = setTimeout(() => {
                        const val = inputTextRef.current;
                        if (val !== input) setInput(val);
                      }, 400);
                    }}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    style={{
                      width: "100%",
                      resize: "none",
                      border: "none",
                      background: "transparent",
                      outline: "none",
                      fontSize: 14,
                      color: "#1e293b",
                      lineHeight: 1.5,
                      maxHeight: 120,
                      overflowY: "auto",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Send button */}
              <button
                aria-label="Send"
                onClick={handleSend}
                disabled={!input.trim() && !pendingFile}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "none",
                  flexShrink: 0,
                  cursor:
                    input.trim() || pendingFile
                      ? "pointer"
                      : "not-allowed",
                  background:
                    input.trim() || pendingFile
                      ? "linear-gradient(135deg, #4d7b65, #3a6352)"
                      : "#e2e8f0",
                  color:
                    input.trim() || pendingFile ? "white" : "#94a3b8",
                  boxShadow:
                    input.trim() || pendingFile
                      ? "0 4px 14px rgba(77,123,101,0.4)"
                      : "none",
                  transition: "all 0.2s",
                  fontSize: 18,
                }}
                onMouseEnter={(e) => {
                  if (input.trim() || pendingFile)
                    e.currentTarget.style.transform = "scale(1.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M22 2L11 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M22 2L15 22 11 13 2 9l20-7z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}