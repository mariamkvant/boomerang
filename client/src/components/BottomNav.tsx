import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';

export default function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  if (!user) return null;

  const tabs = [
    { to: '/', icon: '🏠', label: t('nav.home'), active: path === '/' },
    { to: '/browse', icon: '🔍', label: t('nav.browse2'), active: path === '/browse' },
    { to: '/services/new', icon: '➕', label: t('nav.offer2'), active: path === '/services/new' },
    { to: '/messages', icon: '💬', label: t('nav.chat'), active: path === '/messages' },
    { to: '/me', icon: '👤', label: t('nav.me'), active: ['/me', '/dashboard', '/settings', '/account', '/availability'].includes(path) },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {tabs.map(tab => (
          <Link key={tab.to} to={tab.to}
            className={`flex flex-col items-center justify-center flex-1 h-full ${tab.active ? 'text-primary-600' : 'text-gray-400'}`}>
            <span className="text-lg leading-none">{tab.icon}</span>
            <span className="text-[10px] mt-0.5 font-medium">{tab.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
