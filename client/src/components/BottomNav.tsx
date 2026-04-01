import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { api } from '../api';
import { t } from '../i18n';

export default function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const path = location.pathname;
  const [unreadDMs, setUnreadDMs] = useState(0);

  useEffect(() => {
    if (user) api.getUnreadDMCount().then(r => setUnreadDMs(r.count || 0)).catch(() => {});
  }, [user, path]);

  // Update unread count on new DM
  useSocket('dm', () => {
    if (path !== '/messages') setUnreadDMs(c => c + 1);
  });

  if (!user) return null;

  const tabs = [
    { to: '/', icon: '🏠', label: t('nav.home'), active: path === '/' },
    { to: '/browse', icon: '🔍', label: t('nav.browse2'), active: path === '/browse' || path.startsWith('/services') },
    { to: '/services/new', icon: '➕', label: t('nav.offer2'), active: path === '/services/new' },
    { to: '/messages', icon: '💬', label: t('nav.chat'), active: path === '/messages', badge: unreadDMs },
    { to: '/me', icon: '👤', label: t('nav.me'), active: ['/me', '/dashboard', '/settings', '/account', '/availability'].includes(path) },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {tabs.map(tab => (
          <Link key={tab.to} to={tab.to}
            className={`flex flex-col items-center justify-center flex-1 h-full relative ${tab.active ? 'text-primary-600' : 'text-gray-400'}`}>
            <span className="text-lg leading-none relative">
              {tab.icon}
              {tab.badge && tab.badge > 0 && (
                <span className="absolute -top-1.5 -right-2.5 w-4 h-4 bg-primary-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              )}
            </span>
            <span className="text-[10px] mt-0.5 font-medium">{tab.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
