import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useSocket } from '../hooks/useSocket';

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getUnreadCount().then(r => setCount(r.count)).catch(() => {});
  }, []);

  // Real-time notification updates via WebSocket
  useSocket('notification', (data) => {
    setCount((c) => c + 1);
    // If dropdown is open, prepend the new notification
    setNotifications((prev) => [{ ...data, is_read: false, type: data.notificationType }, ...prev]);
  });

  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggle = async () => {
    if (!open) {
      const notifs = await api.getNotifications();
      setNotifications(notifs);
    }
    setOpen(!open);
  };

  const markAllRead = async () => {
    await api.markAllRead();
    setCount(0);
    setNotifications(n => n.map(x => ({ ...x, is_read: true })));
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={toggle} className="relative p-2 rounded-lg hover:bg-gray-100" aria-label="Notifications">
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px]">{count > 9 ? '9+' : count}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <span className="text-sm font-semibold">Notifications</span>
            {count > 0 && <button onClick={markAllRead} className="text-xs text-primary-600 hover:underline">Mark all read</button>}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No notifications yet</p>
            ) : (
              notifications.slice(0, 20).map((n: any) => (
                <Link key={n.id} to={n.link || '/dashboard'} onClick={() => { setOpen(false); if (!n.is_read) api.markRead(n.id).then(() => setCount(c => Math.max(0, c - 1))); }}
                  className={`block px-4 py-3 border-b border-gray-50 hover:bg-gray-50 ${!n.is_read ? 'bg-primary-50/50' : ''}`}>
                  <p className="text-sm font-medium text-gray-900">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
                  <p className="text-[10px] text-gray-300 mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
