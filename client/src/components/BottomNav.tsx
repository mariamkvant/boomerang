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

  useSocket('dm', () => { if (path !== '/messages') setUnreadDMs(c => c + 1); });

  if (!user) return null;

  const isActive = (paths: string[]) => paths.some(p => p === path || (p !== '/' && path.startsWith(p)));

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        <Link to="/" className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 ${isActive(['/']) ? 'text-primary-500' : 'text-gray-400'}`}>
          <svg className="w-6 h-6" fill={isActive(['/']) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={isActive(['/']) ? 0 : 1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          <span className="text-[10px] font-medium">{t('nav.home')}</span>
        </Link>

        <Link to="/browse" className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 ${isActive(['/browse', '/services']) ? 'text-primary-500' : 'text-gray-400'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <span className="text-[10px] font-medium">{t('nav.browse2')}</span>
        </Link>

        <Link to="/services/new" className="flex flex-col items-center justify-center flex-1 h-full gap-0.5">
          <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center -mt-3 shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
        </Link>

        <Link to="/messages" className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 relative ${isActive(['/messages']) ? 'text-primary-500' : 'text-gray-400'}`}>
          <div className="relative">
            <svg className="w-6 h-6" fill={isActive(['/messages']) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={isActive(['/messages']) ? 0 : 1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
            {unreadDMs > 0 && (
              <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-primary-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unreadDMs > 9 ? '9+' : unreadDMs}</span>
            )}
          </div>
          <span className="text-[10px] font-medium">{t('nav.chat')}</span>
        </Link>

        <Link to="/me" className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 ${isActive(['/me', '/dashboard', '/settings', '/account', '/availability']) ? 'text-primary-500' : 'text-gray-400'}`}>
          <svg className="w-6 h-6" fill={isActive(['/me', '/dashboard', '/settings', '/account']) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={isActive(['/me', '/dashboard', '/settings', '/account']) ? 0 : 1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <span className="text-[10px] font-medium">{t('nav.me')}</span>
        </Link>
      </div>
    </nav>
  );
}
