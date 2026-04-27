import { useState, useEffect } from 'react';
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
  const [pendingActions, setPendingActions] = useState(0);

  useEffect(() => {
    if (user) {
      api.getUnreadDMCount().then(r => setUnreadDMs(r.count || 0)).catch(() => {});
      api.getIncoming().then((inc: any[]) => {
        const pending = inc.filter((r: any) => ['pending', 'delivered'].includes(r.status)).length;
        setPendingActions(pending);
      }).catch(() => {});
    }
  }, [user, path]);

  useSocket('dm', () => { if (path !== '/messages') setUnreadDMs(c => c + 1); });

  if (!user) return null;

  const isActive = (paths: string[]) => paths.some(p => p === path || (p !== '/' && path.startsWith(p)));

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#202c33] border-t border-gray-100 dark:border-gray-700 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around h-[60px] max-w-lg mx-auto">

        {/* Home */}
        <Link to="/" className={`flex flex-col items-center justify-center flex-1 min-h-[44px] h-full gap-1 transition-colors ${isActive(['/']) && path === '/' ? 'text-primary-500' : 'text-gray-400'}`}>
          {isActive(['/']) && path === '/' ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" /><path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" /></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955a1.126 1.126 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
          )}
          <span className="text-[11px] font-medium leading-none">{t('nav.home')}</span>
        </Link>

        {/* Explore (was Browse) */}
        <Link to="/browse" className={`flex flex-col items-center justify-center flex-1 min-h-[44px] h-full gap-1 transition-colors ${isActive(['/browse', '/services/']) ? 'text-primary-500' : 'text-gray-400'}`}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
          <span className="text-[11px] font-medium leading-none">Explore</span>
        </Link>

        {/* Center: Offer button */}
        <Link to="/services/new" className="flex flex-col items-center justify-center flex-1 min-h-[44px] h-full gap-1">
          <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center -mt-5 shadow-lg shadow-primary-500/30">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <span className="text-[11px] font-medium text-primary-500 leading-none">{t('nav.offer2')}</span>
        </Link>

        {/* Dashboard (was Chat) — with pending badge */}
        <Link to="/dashboard" className={`flex flex-col items-center justify-center flex-1 min-h-[44px] h-full gap-1 transition-colors ${isActive(['/dashboard']) ? 'text-primary-500' : 'text-gray-400'}`}>
          <div className="relative">
            <svg className="w-6 h-6" fill={isActive(['/dashboard']) ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
            {(pendingActions > 0 || unreadDMs > 0) && (
              <span className="absolute -top-1 -right-1.5 min-w-[16px] h-[16px] bg-primary-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                {pendingActions + unreadDMs > 9 ? '9+' : pendingActions + unreadDMs}
              </span>
            )}
          </div>
          <span className="text-[11px] font-medium leading-none">Activity</span>
        </Link>

        {/* Me */}
        <Link to="/me" className={`flex flex-col items-center justify-center flex-1 min-h-[44px] h-full gap-1 transition-colors ${isActive(['/me', '/settings', '/account', '/availability']) ? 'text-primary-500' : 'text-gray-400'}`}>
          {isActive(['/me', '/settings', '/account', '/availability']) ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" /></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
          )}
          <span className="text-[11px] font-medium leading-none">{t('nav.me')}</span>
        </Link>

      </div>
    </nav>
  );
}
