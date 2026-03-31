import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const path = location.pathname;
  const [showMenu, setShowMenu] = useState(false);

  if (!user) return null;

  const tabs = [
    { to: '/', icon: '🏠', label: 'Home', active: path === '/' },
    { to: '/browse', icon: '🔍', label: 'Browse', active: path === '/browse' },
    { to: '/services/new', icon: '➕', label: 'Offer', active: path === '/services/new' },
    { to: '/messages', icon: '💬', label: 'Chat', active: path === '/messages' },
  ];

  const menuActive = ['/dashboard', '/settings', '/account', '/availability'].includes(path);

  return (
    <>
      {showMenu && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setShowMenu(false)}>
          <div className="absolute bottom-16 right-2 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 w-48 animate-fade-in" onClick={e => e.stopPropagation()}>
            <Link to="/dashboard" onClick={() => setShowMenu(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">📊 Dashboard</Link>
            <Link to="/settings" onClick={() => setShowMenu(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">👤 My Profile</Link>
            <Link to="/account" onClick={() => setShowMenu(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">⚙️ Account Settings</Link>
            <Link to="/availability" onClick={() => setShowMenu(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">📅 Availability</Link>
          </div>
        </div>
      )}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-14">
          {tabs.map(t => (
            <Link key={t.to} to={t.to}
              className={`flex flex-col items-center justify-center flex-1 h-full ${t.active ? 'text-primary-600' : 'text-gray-400'}`}>
              <span className="text-lg leading-none">{t.icon}</span>
              <span className="text-[10px] mt-0.5 font-medium">{t.label}</span>
            </Link>
          ))}
          <button onClick={() => setShowMenu(!showMenu)}
            className={`flex flex-col items-center justify-center flex-1 h-full ${menuActive ? 'text-primary-600' : 'text-gray-400'}`}>
            <span className="text-lg leading-none">👤</span>
            <span className="text-[10px] mt-0.5 font-medium">Me</span>
          </button>
        </div>
      </nav>
    </>
  );
}
