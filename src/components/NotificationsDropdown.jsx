import React from 'react';

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

export default function NotificationsDropdown({
  notifications = [],
  loading = false,
  onOpen = () => {},
  onMarkRead = () => {},
  onMarkAllRead = () => {},
  onLoadMore = null,
}) {
  return (
    <div
      className="nb-dropdown"
      role="menu"
      aria-label="Notifications"
      style={{
        width: 360,
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
          <button className="nb-markall" onClick={onMarkAllRead} aria-label="Mark all as read">Mark all</button>
        </div>
      </div>

      <div className="nb-list" style={{ maxHeight: 320, overflow: 'auto' }}>
        {loading && notifications.length === 0 && (
          <div className="nb-empty" style={{ padding: 20 }}>Loading…</div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="nb-empty" style={{ padding: 20 }}>No notifications</div>
        )}

        {notifications.map((n) => {
          const title = n.title || n.data?.title || n.type || 'Notification';
          const message = n.data?.message || n.data?.body || n.message || n.text || '';
          const created = n.created_at || n.createdAt || n.timestamp || n.time || n.date;
          const unread = !n.is_read && (n.is_read !== 1 && n.is_read !== true);
          return (
            <button
              key={n.id}
              onClick={() => onOpen(n)}
              className={`nb-item ${unread ? 'nb-item--unread' : ''}`}
              style={{ display: 'flex', gap: 10, padding: '10px 12px', width: '100%', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer' }}
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
        <button className="nb-loadmore" onClick={() => onLoadMore && onLoadMore()} disabled={!onLoadMore}>Load more</button>
        <a href="/notifications" className="nb-viewall">View all</a>
      </div>
    </div>
  );
}
