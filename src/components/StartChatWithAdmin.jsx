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
    <div>
      <button onClick={startChat} disabled={loading}>
        {loading ? 'Starting chat…' : 'Contact Admin / Start Chat'}
      </button>
      {error && (
        <div style={{ color: 'red', marginTop: 8 }}>
          {error} <button onClick={startChat}>Retry</button>
        </div>
      )}

      {chatroomId && (
        <div style={{ marginTop: 12 }}>
          <div><strong>Chatroom:</strong> Admin (ID: 1)</div>
          <div style={{ maxHeight: 240, overflow: 'auto', border: '1px solid #eee', padding: 8, marginTop: 8 }}>
            {messages.length === 0 && <div>No messages</div>}
            {messages.map((m, i) => {
              const senderIsAdmin = !!(m.is_admin || m.sender === 'admin' || m.from === 'admin');
              const avatarCandidate = senderIsAdmin ? CompanyLogo : (m.avatarUrl || m.avatar || m.user?.profile_picture || m.user?.avatar || null);
              const letter = (m.sender_name || m.user?.name || 'A')[0] || 'A';
              const avatarSrc = avatarCandidate;
              return (
                <div key={i} style={{ padding: 6, borderBottom: '1px solid #f4f4f4', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 18, overflow: 'hidden', flexShrink: 0 }}>
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={m.sender_name || m.sender || m.user?.name || ''}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={(e) => { try { e.target.onerror = null; e.target.src = svgFallback(letter, '#4d7b65'); } catch (err) { e.target.style.display = 'none'; } }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#4d7b65', color: '#fff', fontWeight: 700 }}>{letter.toUpperCase()}</div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: '#555' }}>{m.sender_name || m.sender || m.user?.name || ''}</div>
                    <div>{m.messages || m.message || m.text || JSON.stringify(m)}</div>
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
