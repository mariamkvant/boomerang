import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { api } from '../api';
import { t } from '../i18n';

export default function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const [unreadDMs, setUnreadDMs] = useState(0);
  const [pendingActions, setPendingActions] = useState(0);
  const [showPostSheet, setShowPostSheet] = useState(false);

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
  // Reset unread count when user navigates to Messages
  useEffect(() => { if (path === '/messages') setUnreadDMs(0); }, [path]);

  if (!user) return null;

  const isActive = (paths: string[]) => paths.some(p => p === path || (p !== '/' && path.startsWith(p)));

  return (
    <>
    {/* Post action sheet */}
    {showPostSheet && (
      <div className="fixed inset-0 z-[60] flex flex-col justify-end" onClick={() => setShowPostSheet(false)}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="relative bg-white dark:bg-[#1c1c1c] rounded-t-2xl shadow-2xl px-4 pt-3 pb-6"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
          onClick={e => e.stopPropagation()}>
          {/* Handle */}
          <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-5" />
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center mb-4">What would you like to post?</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => { setShowPostSheet(false); navigate('/services/new'); }}
              className="flex items-center gap-4 bg-gray-50 dark:bg-[#242424] hover:bg-primary-50 dark:hover:bg-primary-900/20 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 text-left transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-2xl shrink-0">🛠</div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-primary-600">Offer a service</p>
                <p className="text-xs text-gray-400 mt-0.5">List something you can do for others</p>
              </div>
              <svg className="w-4 h-4 text-gray-300 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
            </button>
            <button
              onClick={() => { setShowPostSheet(false); navigate('/requests?post=1'); }}
              className="flex items-center gap-4 bg-gray-50 dark:bg-[#242424] hover:bg-amber-50 dark:hover:bg-amber-900/20 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 text-left transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-2xl shrink-0">📋</div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-amber-600">Post a request</p>
                <p className="text-xs text-gray-400 mt-0.5">Ask the community for help with a task</p>
              </div>
              <svg className="w-4 h-4 text-gray-300 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
            </button>
          </div>
        </div>
      </div>
    )}

    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#202c33] border-t border-gray-100 dark:border-gray-700 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around h-[60px] max-w-lg mx-auto">

        {/* Home */}
        <Link to="/" className={`flex flex-col items-center justify-center flex-1 min-h-[44px] h-full gap-1 transition-colors ${isActive(['/']) && path === '/' ? 'text-primary-500' : 'text-gray-400'}`}>
          {isActive(['/']) && path === '/' ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" /><path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" /></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955a1.126 1.126 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
          )}
          <span className="text-xs font-medium leading-none">{t('nav.home')}</span>
        </Link>

        {/* Explore Offers (/browse) */}
        <Link to="/browse" className={`flex flex-col items-center justify-center flex-1 min-h-[44px] h-full gap-1 transition-colors ${isActive(['/browse', '/services/']) ? 'text-primary-500' : 'text-gray-400'}`}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
          <span className="text-xs font-medium leading-none">Offers</span>
        </Link>

        {/* Center: Post action button (Offer or Request) */}
        <button onClick={() => setShowPostSheet(true)} className="flex flex-col items-center justify-center flex-1 min-h-[44px] h-full gap-1">
          <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center -mt-5 shadow-lg shadow-primary-500/30">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <span className="text-xs font-medium text-primary-500 leading-none">Post</span>
        </button>

        {/* Explore Requests (/requests) */}
        <Link to="/requests" className={`flex flex-col items-center justify-center flex-1 min-h-[44px] h-full gap-1 transition-colors ${isActive(['/requests']) ? 'text-amber-500' : 'text-gray-400'}`}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" /></svg>
          <span className="text-xs font-medium leading-none">Requests</span>
        </Link>

        {/* Communities */}
        <Link to="/groups" className={`flex flex-col items-center justify-center flex-1 min-h-[44px] h-full gap-1 transition-colors ${isActive(['/groups']) ? 'text-primary-500' : 'text-gray-400'}`}>
          <svg className="w-6 h-6" fill={isActive(['/groups']) ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
          </svg>
          <span className="text-xs font-medium leading-none">Groups</span>
        </Link>

        {/* Me */}
        <Link to="/me" className={`flex flex-col items-center justify-center flex-1 min-h-[44px] h-full gap-1 transition-colors ${isActive(['/me', '/settings', '/account', '/availability']) ? 'text-primary-500' : 'text-gray-400'}`}>
          <div className="relative">
            {isActive(['/me', '/settings', '/account', '/availability']) ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
            )}
            {pendingActions > 0 && (
              <span className="absolute -top-1 -right-1.5 min-w-[16px] h-[16px] bg-primary-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                {pendingActions > 9 ? '9+' : pendingActions}
              </span>
            )}
          </div>
          <span className="text-xs font-medium leading-none">{t('nav.me')}</span>
        </Link>

      </div>
    </nav>
    </>
  );
}
