import { useEffect, useRef, useState, useCallback } from 'react';
import api from '../api/axios';

/**
 * useNotifications hook
 * @param {{ user: { id: number|string } | null, token: string|null, pageSize?: number }} opts
 * @returns {{ list: Array, unreadCount: number, loading: boolean, error: string|null, loadMore: Function, markRead: Function, markAllRead: Function }}
 *
 * Usage:
 * const { list, unreadCount, loading, loadMore, markRead } = useNotifications({ user, token });
 */
export default function useNotifications({ user, token, pageSize = 20 } = {}) {
  const [list, setList] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const echoRef = useRef(null);

  const apiHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token]);

  const fetchNotifications = useCallback(async (page = 1) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // include both `per_page` (Laravel paginator) and `limit` for compatibility
      // include user_id when available so backend can scope results
      const userParam = user?.id ? `&user_id=${user.id}` : '';
      const res = await api.get(`/notifications?page=${page}&per_page=${pageSize}&limit=${pageSize}${userParam}`);
      const json = res.data;

      // Support common shapes: { data: [...], meta: {...} } or simply array
      const items = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : (json.data || []));

      // normalize items: ensure each item has `id`, `title`, `message`, `is_read`, and `created_at` fallbacks
      const normalize = (it) => ({
        id: it.id ?? it.notification_id ?? it.notificationId ?? null,
        title: it.title ?? it.data?.title ?? it.type ?? '',
        message: it.message ?? it.data?.message ?? it.data?.body ?? it.text ?? '',
        is_read: typeof it.is_read !== 'undefined' ? it.is_read : (it.read_at ? 1 : 0),
        created_at: it.created_at ?? it.createdAt ?? it.timestamp ?? it.time ?? it.date ?? null,
        reference_type: it.reference_type ?? it.data?.reference_type ?? null,
        data: it.data ?? it,
        ...it,
      });

      const normalizedItems = Array.isArray(items) ? items.map(normalize) : [];

      if (page === 1) setList(normalizedItems);
      else setList(prev => [...prev, ...normalizedItems]);

      // debug: show what we received (remove in production)
      try { console.debug('[useNotifications] fetched', normalizedItems); } catch (e) {}

      // determine hasMore heuristically
      if (Array.isArray(items) && items.length < pageSize) hasMoreRef.current = false;
      else hasMoreRef.current = true;
      pageRef.current = page;
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }, [user, apiHeaders, pageSize]);

  const fetchUnread = useCallback(async () => {
    if (!user) return;
    try {
      const userParam = user?.id ? `?user_id=${user.id}` : '';
      const res = await api.get(`/notifications/unread${userParam}`);
      const json = res.data;
      // Support { count } or { data: { count } } or { data: [...] }
      let count = 0;
      if (typeof json.count === 'number') count = json.count;
      else if (json.data && typeof json.data.count === 'number') count = json.data.count;
      else if (Array.isArray(json.data)) count = json.data.filter(n => !n.is_read).length;
      setUnreadCount(count);
    } catch (err) {
      // ignore unread fetch errors silently
      console.warn('Failed to fetch unread count', err);
    }
  }, [user, apiHeaders]);

  const loadMore = useCallback(() => {
    if (!hasMoreRef.current) return;
    const next = pageRef.current + 1;
    fetchNotifications(next);
  }, [fetchNotifications]);

  const markRead = useCallback(async (ids = []) => {
    if (!ids || ids.length === 0) return;
    // optimistic update
    setList(prev => prev.map(n => ids.includes(n.id) ? { ...n, is_read: 1 } : n));
    setUnreadCount(prev => Math.max(0, prev - ids.length));

    try {
      const body = { ids, user_id: user?.id };
      const res = await api.post('/notifications/mark-read', body);
      if (!(res.status >= 200 && res.status < 300)) throw new Error('Failed to mark read');
    } catch (err) {
      console.warn('markRead failed, reverting optimistic update', err);
      // revert by re-fetching current page
      fetchNotifications(1);
      fetchUnread();
    }
  }, [apiHeaders, fetchNotifications, fetchUnread]);

  const markAllRead = useCallback(async () => {
    // prefer server-side efficient endpoint when available
    try {
      const unreadIds = list.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length === 0) return;

      // optimistic update locally
      setList(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);

      const res = await api.post('/notifications/mark-all-read', { user_id: user?.id });
      if (!(res.status >= 200 && res.status < 300)) {
        // fallback to marking specific ids
        await markRead(unreadIds);
      }
    } catch (err) {
      console.warn('markAllRead failed, falling back to markRead', err);
      // fallback: try individual markRead
      const ids = list.filter(n => !n.is_read).map(n => n.id);
      if (ids.length) await markRead(ids);
    }
  }, [list, markRead]);

  // initialize: fetch first page and unread count
  useEffect(() => {
    if (!user) return;
    pageRef.current = 1;
    hasMoreRef.current = true;
    fetchNotifications(1);
    fetchUnread();
  }, [user, fetchNotifications, fetchUnread]);

  // Real-time setup using laravel-echo + socket.io-client (dynamic import)
  useEffect(() => {
    if (!user || !token || typeof window === 'undefined') return undefined;

    let stopped = false;

    (async () => {
      try {
        const wsHost = import.meta.env.VITE_WS_URL || window.location.origin;
        const { default: io } = await import('socket.io-client');
        const { default: Echo } = await import('laravel-echo');

        // expose client for Echo (some builds expect global `io`)
        try { window.io = io; } catch (e) { /* ignore */ }

        // If an Echo instance is already available globally, reuse it so other
        // components (e.g., StartChatWithAdmin) relying on `window.Echo` continue to work.
        let echo;
        if (typeof window.Echo !== 'undefined' && window.Echo && typeof window.Echo.private === 'function') {
          echo = window.Echo;
        } else {
          echo = new Echo({
            broadcaster: 'socket.io',
            host: wsHost,
            client: io,
            auth: { headers: { Authorization: `Bearer ${token}` } },
            transports: ['websocket', 'polling'],
          });
          try { window.Echo = echo; } catch (e) { /* ignore */ }
        }

        echoRef.current = echo;

        // subscribe to likely channel names (backend may use `user.{id}` or `private-user.{id}`)
        const chanNames = [`user.${user.id}`, `private-user.${user.id}`];

        const attachListeners = (channel) => {
          try {
            // Laravel notification helper: channel.notification(callback)
            if (typeof channel.notification === 'function') {
              channel.notification((payload) => {
                const notif = payload?.notification ?? payload;
                try { console.debug('[useNotifications] realtime notification', notif); } catch (e) {}
                setList(prev => [notif, ...prev]);
                setUnreadCount(prev => prev + 1);
              });
            }

            // generic event names: 'notification' and custom broadcast name '.notification.created'
            channel.listen('notification', (ev) => {
              const notif = ev?.notification ?? ev;
              try { console.debug('[useNotifications] realtime event (notification)', notif); } catch (e) {}
              setList(prev => [notif, ...prev]);
              setUnreadCount(prev => prev + 1);
            });

            channel.listen('.notification.created', (ev) => {
              const notif = ev?.notification ?? ev;
              try { console.debug('[useNotifications] realtime event (.notification.created)', notif); } catch (e) {}
              setList(prev => [notif, ...prev]);
              setUnreadCount(prev => prev + 1);
            });
          } catch (e) {
            // ignore listener attach errors per-channel
          }
        };

        for (const name of chanNames) {
          try {
            const ch = echo.private(name);
            attachListeners(ch);
          } catch (e) {
            // some channels may not exist; ignore
          }
        }

        // optional: handle connection errors (guard against missing connector/socket)
        try {
          if (echo && echo.connector && echo.connector.socket && typeof echo.connector.socket.on === 'function') {
            echo.connector.socket.on('connect_error', (err) => console.warn('Echo connect_error', err));
          }
        } catch (e) {
          // ignore
        }

        if (stopped) {
          try { echo.disconnect(); } catch (e) {}
        }
      } catch (err) {
        console.warn('Realtime init failed:', err);
      }
    })();

    return () => {
      stopped = true;
      if (echoRef.current) {
        try { echoRef.current.disconnect(); } catch (e) { /* ignore */ }
        echoRef.current = null;
      }
    };
  }, [user, token]);

  return {
    list,
    unreadCount,
    loading,
    error,
    loadMore,
    markRead,
    markAllRead,
  };
}

/**
 * Small usage example:
 *
 * import useNotifications from '../hooks/useNotifications';
 * function Header({ user, token }) {
 *   const { list, unreadCount, markRead } = useNotifications({ user, token });
 *   return <div>Notifications: {unreadCount}</div>;
 * }
 */
