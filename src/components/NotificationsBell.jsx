import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useNotifications from '../hooks/useNotifications';
import api from '../api/axios';

function timeAgo(iso) {
  try {
    const d = new Date(iso);
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const days = Math.floor(h / 24);
    return `${days}d`;
  } catch (e) {
    return '';
  }
}

export default function NotificationsBell({ user: userProp, token: tokenProp, onOpen = () => {} }) {
  const token = tokenProp ?? (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  const [user, setUser] = useState(userProp ?? null);

  // keep local user state in sync when parent provides `user` later
  useEffect(() => {
    if (userProp) setUser(userProp);
  }, [userProp]);

  // If user not provided, attempt to fetch /me using token
  useEffect(() => {
    // only try to fetch /me if parent didn't provide `user`
    if (userProp) return;
    if (!token) return;
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/me');
        const u = res.data?.data ?? res.data;
        if (mounted && u) {
          setUser(u);
          try { console.debug('[NotificationsBell] fetched /me', u); } catch (e) {}
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [userProp, token]);

  const { list, unreadCount, loading, loadMore, markRead, markAllRead } = useNotifications({ user, token });
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const handleClickNotification = async (n) => {
    try {
      if (!n) return;
      // close the dropdown immediately for a snappy UX
      setOpen(false);

      // optimistic mark-as-read
      if (!n.is_read) await markRead([n.id]);

      // notify parent if they want to handle the open action
      onOpen(n);

      // navigate based on known reference types or payload
      const refType = n.reference_type || n.data?.reference_type || n.type || '';
      const orderId = n.data?.order_id || n.data?.reference_id || n.data?.id;

      if (orderId) {
        navigate(`/orders/${orderId}`);
        return;
      }

      if (refType === 'checkout' || refType === 'order' || refType === 'order_status') {
        // fallback to generic orders page
        navigate('/orders');
        return;
      }

      if (refType === 'blog' || refType === 'post') {
        const slug = n.data?.slug || n.data?.post_slug;
        if (slug) navigate(`/blog/${slug}`);
        else navigate('/blog');
        return;
      }

      // default fallback
      navigate('/notifications');
    } catch (e) {
      console.warn('Failed to mark notification read', e);
    }
  };

  return (
    <div className="notifications-bell" ref={ref} style={{ position: 'relative' }}>
      <button
        aria-haspopup="true"
        aria-expanded={open}
        className="nb-button"
        onClick={() => setOpen(o => !o)}
        title="Notifications"
      >
        <span aria-hidden className="nb-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="nb-badge" aria-label={`${unreadCount} unread notifications`}>{unreadCount}</span>
        )}
      </button>

      {open && (
        <div
          className="nb-dropdown"
          role="menu"
          aria-label="Notifications"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: 360,
            zIndex: 60,
            background: '#ffffff',
            border: '1px solid #e6e6e6',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            overflow: 'hidden'
          }}
        >
          <div className="nb-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #eee' }}>
            <strong>Notifications</strong>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="nb-markall" onClick={async () => { await markAllRead(); }} aria-label="Mark all as read">Mark all</button>
              <button className="nb-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
            </div>
          </div>

          <div className="nb-list" style={{ maxHeight: 320, overflow: 'auto' }}>
            {loading && list.length === 0 && (
              <div className="nb-empty" style={{ padding: 20 }}>Loading…</div>
            )}

            {!loading && list.length === 0 && (
              <div className="nb-empty" style={{ padding: 20 }}>No notifications</div>
            )}

            {list.map((n) => {
              const title = n.title || n.data?.title || n.type || 'Notification';
              const message = n.data?.message || n.data?.body || n.message || n.text || '';
              const created = n.created_at || n.createdAt || n.timestamp || n.time || n.date;
              const unread = !n.is_read && (n.is_read !== 1 && n.is_read !== true);
              return (
                <button
                  key={n.id}
                  onClick={() => handleClickNotification(n)}
                  className={`nb-item ${unread ? 'nb-item--unread' : ''}`}
                  style={{ display: 'flex', gap: 10, padding: '10px 12px', width: '100%', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  role="menuitem"
                >
                  <div style={{ flex: '0 0 44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="nb-dot" style={{ width: 10, height: 10, borderRadius: 6, background: unread ? '#4d7b65' : '#ddd' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
                      <div style={{ fontSize: 12, color: '#888', flexShrink: 0 }}>{timeAgo(created)}</div>
                    </div>
                    {message && <div style={{ fontSize: 13, color: '#555', marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{message}</div>}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="nb-footer" style={{ borderTop: '1px solid #eee', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="nb-loadmore" onClick={() => loadMore && loadMore()} disabled={!loadMore}>Load more</button>
            <a href="/notifications" className="nb-viewall">View all</a>
          </div>
        </div>
      )}
    </div>
  );
}
