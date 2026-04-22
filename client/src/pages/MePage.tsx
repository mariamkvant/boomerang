import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { useInstall } from '../components/InstallPrompt';
import { isIOS } from '../utils/platform';
import { getLang, setLang, LANGUAGES, t } from '../i18n';
import { useDarkMode } from '../hooks/useDarkMode';

export default function MePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { dark, toggle: toggleDark } = useDarkMode();
  const [trust, setTrust] = useState<any>(null);
  const { canInstall, install } = useInstall();

  useEffect(() => {
    if (user) api.getTrustScore(user.id).then(setTrust).catch(() => {});
  }, [user]);

  if (!user) return null;

  const MenuItem = ({ to, label, icon }: { to: string; label: string; icon: JSX.Element }) => (
    <Link to={to} className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-[#2a3942] transition-colors">
      <span className="w-5 h-5 text-gray-400">{icon}</span>
      <span className="text-sm text-gray-700 dark:text-gray-200 flex-1">{label}</span>
      <svg className="w-4 h-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
    </Link>
  );

  return (
    <div className="max-w-lg mx-auto animate-fade-in pb-24">
      {/* Profile card */}
      <div className="bg-white dark:bg-[#202c33] rounded-2xl shadow-sm mb-3 overflow-hidden">
        <div className="p-5">
          <div className="flex items-center gap-4">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="w-14 h-14 rounded-full object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xl font-semibold">
                {user.username?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold dark:text-white truncate">{user.username}</h2>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
            <Link to={`/users/${user.id}`} className="text-xs text-primary-500 hover:text-primary-600 shrink-0">View profile</Link>
          </div>

          {/* Stats row — simplified */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold dark:text-white">{user.points}</span>
              <span className="text-xs text-gray-400">🪃</span>
            </div>
            {trust && (
              <>
                <span className="text-xs text-gray-400">{trust.completed || 0} exchanges</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  trust.level === 'Platinum' ? 'bg-violet-100 text-violet-700' :
                  trust.level === 'Gold' ? 'bg-amber-100 text-amber-700' :
                  trust.level === 'Silver' ? 'bg-gray-100 text-gray-600' :
                  'bg-orange-50 text-orange-600'
                }`}>{trust.level}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main menu */}
      <div className="bg-white dark:bg-[#202c33] rounded-2xl shadow-sm mb-3 overflow-hidden divide-y divide-gray-50 dark:divide-gray-700">
        <MenuItem to="/dashboard" label={t('dashboard.title')}
          icon={<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg>} />
        <MenuItem to="/settings" label={t('nav.myProfile')}
          icon={<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>} />
        <MenuItem to="/account" label={t('nav.accountSettings')}
          icon={<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>} />
        <MenuItem to="/availability" label={t('nav.availability')}
          icon={<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>} />
        {!isIOS && <MenuItem to="/buy" label={t('buy.title')}
          icon={<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" /></svg>} />}
      </div>

      {/* Secondary menu */}
      <div className="bg-white dark:bg-[#202c33] rounded-2xl shadow-sm mb-3 overflow-hidden divide-y divide-gray-50 dark:divide-gray-700">
        <MenuItem to="/leaderboard" label={t('leaderboard.title')}
          icon={<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 0 1-2.77.896m5.25-6.624V2.721" /></svg>} />
        <MenuItem to="/support" label={t('support.title')}
          icon={<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" /></svg>} />
      </div>

      {/* Preferences */}
      <div className="bg-white dark:bg-[#202c33] rounded-2xl shadow-sm mb-3 overflow-hidden">
        <button onClick={toggleDark} className="flex items-center gap-3.5 px-4 py-3.5 w-full hover:bg-gray-50 dark:hover:bg-[#2a3942] transition-colors border-b border-gray-50 dark:border-gray-700">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            {dark
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
            }
          </svg>
          <span className="text-sm text-gray-700 dark:text-gray-200 flex-1 text-left">{t('me.darkMode')}</span>
          <div className={`w-10 h-6 rounded-full transition-colors ${dark ? 'bg-primary-500' : 'bg-gray-200'} relative`}>
            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${dark ? 'translate-x-5' : 'translate-x-1'}`} />
          </div>
        </button>
        <div className="px-4 py-3.5">
          <div className="flex items-center gap-3.5 mb-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" /></svg>
            <span className="text-sm text-gray-700 dark:text-gray-200">{t('me.language')}</span>
          </div>
          <div className="flex gap-2 ml-8">
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={() => setLang(l.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${getLang() === l.code ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-[#2a3942] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3a4a54]'}`}>
                {l.flag} {l.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Admin */}
      {user.is_admin && (
        <div className="bg-white dark:bg-[#202c33] rounded-2xl shadow-sm mb-3 overflow-hidden">
          <MenuItem to="/admin" label={t('me.admin')}
            icon={<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>} />
        </div>
      )}

      {/* Install */}
      {canInstall && (
        <div className="bg-white dark:bg-[#202c33] rounded-2xl shadow-sm mb-3 overflow-hidden">
          <button onClick={install} className="flex items-center gap-3.5 px-4 py-3.5 w-full hover:bg-gray-50 dark:hover:bg-[#2a3942] transition-colors">
            <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
            <span className="text-sm text-primary-600 dark:text-primary-400 font-medium flex-1 text-left">{t('me.installApp')}</span>
          </button>
        </div>
      )}

      {/* Logout */}
      <button onClick={() => { logout(); navigate('/'); }}
        className="w-full bg-white dark:bg-[#202c33] rounded-2xl shadow-sm px-4 py-3.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors mb-8 text-left flex items-center gap-3.5">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
        {t('logout')}
      </button>
    </div>
  );
}
