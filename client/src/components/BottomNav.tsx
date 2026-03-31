import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  if (!user) return null;

  const tabs = [
    { to: '/', icon: '🏠', label: 'Home', active: path === '/' },
    { to: '/browse', icon: '🔍', label: 'Browse', active: path === '/browse' },
    { to: '/services/new', icon: '➕', label: 'Offer', active: path === '/services/new' },
    { to: '/messages', icon: '💬', label: 'Chat', active: path === '/messages' },
    { to: '/dashboard', icon: '👤', label: 'Me', active: path === '/dashboard' || path === '/settings' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {tabs.map(t => (
          <Link key={t.to} to={t.to}
            className={`flex flex-col items-center justify-center flex-1 h-full ${t.active ? 'text-primary-600' : 'text-gray-400'}`}>
            <span className="text-lg leading-none">{t.icon}</span>
            <span className="text-[10px] mt-0.5 font-medium">{t.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
