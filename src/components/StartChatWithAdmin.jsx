import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import CompanyLogo from "../assets/Logo — Jem 8 Circle Trading Co (1).png";

const svgFallback = (letter = 'A', bg = '#4d7b65') => {
  const txt = String(letter).charAt(0).toUpperCase() || 'A';
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><rect width='100%' height='100%' fill='${bg}' rx='12' ry='12'/><text x='50%' y='50%' dy='.35em' text-anchor='middle' font-family='Helvetica, Arial, sans-serif' font-size='34' fill='#fff'>${txt}</text></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
};

export default function StartChatWithAdmin({
  initialMessage = 'Hello admin',
  onStarted,
  productId = null,
  productName = null,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatroomId, setChatroomId] = useState(null);
  const echoRef = useRef(null);

  const extractChatroomId = (resData) => {
    // Try a few common shapes the backend might return
    return (
      resData?.chatroom_id ||
      resData?.message?.chatroom_id ||
      resData?.data?.chatroom_id ||
      resData?.chatroom?.id ||
      resData?.id ||
      null
    );
  };

  const loadHistory = async (id) => {
    try {
      const r = await api.get('/chat/messages', { params: { chatroom_id: id } });
      // backend may return array directly or wrapped in data
      const list = r.data?.data || r.data || [];
      setMessages(Array.isArray(list) ? list : []);
      return list;
    } catch (err) {
      setError('Failed to load messages');
      return [];
    }
  };

  const subscribe = (id) => {
    if (!window.Echo) return;
    try {
      echoRef.current = window.Echo.private('chat.' + id).listen('NewMessage', (e) => {
        const raw = e?.message || e || {};
        const avatarCandidate = raw.avatarUrl || raw.avatar || raw.user?.profile_picture || raw.user?.profile_image || raw.user?.avatar || raw.user?.picture || null;
        let avatarUrl = null;
        try {
          // reuse same normalization rules as frontend api utils
          if (/^data:|^https?:\/\//i.test(avatarCandidate)) avatarUrl = avatarCandidate;
          else if (avatarCandidate) {
            const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || process.env.REACT_APP_API_URL || '';
            const path = String(avatarCandidate).replace(/^\/+/, '');
            avatarUrl = base ? base.replace(/\/+$/, '') + '/storage/' + path : '/storage/' + path;
          }
        } catch (err) { avatarUrl = null; }
        const payload = { ...raw, avatarUrl };
        setMessages((prev) => [...prev, payload]);
      });
    } catch (err) {
      // subscription may fail silently
      console.warn('Echo subscription failed', err);
    }
  };

  const unsubscribe = () => {
    try {
      if (echoRef.current && echoRef.current.unsubscribe) {
        echoRef.current.unsubscribe();
      }
      // also try to leave channel if Echo is available
      if (window.Echo && chatroomId) {
        window.Echo.leave('chat.' + chatroomId);
      }
    } catch (err) {
      // ignore
    }
    echoRef.current = null;
  };

  useEffect(() => {
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startChat = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/chat/messages', { messages: initialMessage });
      const resData = res.data || {};
      const id = extractChatroomId(resData);
      if (!id) {
        setError('No chatroom_id returned from server');
        setLoading(false);
        return;
      }
      setChatroomId(id);
      const history = await loadHistory(id);
      subscribe(id);
      if (onStarted) onStarted({ chatroomId: id, messages: history });
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        window.location.href = '/login';
        return;
      }
      if (status === 422) {
        const validation = err.response?.data || {};
        setError(validation.message || 'Validation error');
      } else {
        setError('Failed to start chat');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3">
        <button
          onClick={startChat}
          disabled={loading}
          className="inline-flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-br from-[#2f855a] to-[#1e40af] hover:from-[#2b7a50] hover:to-[#1b3aa0] transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>{loading ? 'Starting chat…' : 'Contact Admin / Start Chat'}</span>
        </button>

        <div className="text-xs text-gray-500">Available Mon–Fri, 9am–5pm</div>
      </div>

      {error && (
        <div className="mt-3 text-sm text-red-600">
          {error} <button onClick={startChat} className="ml-2 underline">Retry</button>
        </div>
      )}

      {chatroomId && (
        <div className="mt-4 bg-white border border-gray-100 rounded-xl shadow-sm p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-[#f0faf5] flex items-center justify-center text-lg">💬</div>
              <div>
                <div className="text-sm font-semibold">Live chat started</div>
                <div className="text-xs text-gray-400">Chat ID: {chatroomId}</div>
              </div>
            </div>
            {productName && (
              <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-md">Product: {productName}</div>
            )}
          </div>

          <div className="mt-3 max-h-48 overflow-auto space-y-2">
            {messages.length === 0 && <div className="text-xs text-gray-400">No messages yet</div>}
            {messages.map((m, i) => {
              const senderIsAdmin = !!(m.is_admin || m.sender === 'admin' || m.from === 'admin');
              const avatarCandidate = senderIsAdmin ? CompanyLogo : (m.avatarUrl || m.avatar || m.user?.profile_picture || m.user?.avatar || null);
              const letter = (m.sender_name || m.user?.name || 'A')[0] || 'A';
              const avatarSrc = avatarCandidate;
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={m.sender_name || m.sender || m.user?.name || ''}
                        className="w-full h-full object-cover block"
                        onError={(e) => { try { e.target.onerror = null; e.target.src = svgFallback(letter, '#4d7b65'); } catch (err) { e.target.style.display = 'none'; } }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#4d7b65] text-white font-bold">{letter.toUpperCase()}</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500">{m.sender_name || m.sender || m.user?.name || ''}</div>
                    <div className="text-sm text-gray-700">{m.messages || m.message || m.text || JSON.stringify(m)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
