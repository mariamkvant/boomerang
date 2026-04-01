import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getLang, setLang, LANGUAGES, t } from '../i18n';
import { useDarkMode } from '../hooks/useDarkMode';

export default function MePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { dark, toggle: toggleDark } = useDarkMode();

  if (!user) return null;

  const menuItems = [
    { to: '/dashboard', icon: '📊', label: t('dashboard.title') },
    { to: '/settings', icon: '👤', label: t('nav.myProfile') },
    { to: '/account', icon: '⚙️', label: t('nav.accountSettings') },
    { to: '/availability', icon: '📅', label: t('nav.availability') },
    { to: '/messages', icon: '💬', label: t('messages.title') },
    { to: '/leaderboard', icon: '🏆', label: t('leaderboard.title') },
  ];

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      {/* Profile card */}
      <div className="bg-white p-6 rounded-2xl shadow-card mb-4">
        <div className="flex items-center gap-4">
          {user.avatar ? (
            <img src={user.avatar} alt="" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center text-white text-2xl font-semibold">
              {user.username?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">{user.username}</h2>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-sm font-semibold text-primary-600">{user.points}</span>
              <span className="text-xs text-primary-500">🪃</span>
            </div>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden mb-4">
        {menuItems.map((item, i) => (
          <Link key={item.to} to={item.to}
            className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
            <span className="text-lg">{item.icon}</span>
            <span className="text-sm font-medium text-gray-700 flex-1">{item.label}</span>
            <span className="text-gray-300">›</span>
          </Link>
        ))}
      </div>

      {/* Dark mode toggle */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden mb-4">
        <button onClick={toggleDark} className="flex items-center gap-4 px-5 py-4 w-full hover:bg-gray-50">
          <span className="text-lg">{dark ? '☀️' : '🌙'}</span>
          <span className="text-sm font-medium text-gray-700 flex-1 text-left">{dark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>

      {/* Language selector */}
      <div className="bg-white p-5 rounded-2xl shadow-card mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">🌍 {t('settings.appLanguage')}</h3>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map(l => (
            <button key={l.code} onClick={() => setLang(l.code)} title={l.name}
              className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${getLang() === l.code ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'}`}>
              {l.flag} {l.name}
            </button>
          ))}
        </div>
      </div>

      {/* Admin link */}
      {user.is_admin && (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden mb-4">
          <Link to="/admin" className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50">
            <span className="text-lg">🛡️</span>
            <span className="text-sm font-medium text-gray-700 flex-1">Admin</span>
            <span className="text-gray-300">›</span>
          </Link>
        </div>
      )}

      {/* Logout */}
      <button onClick={() => { logout(); navigate('/'); }}
        className="w-full bg-white rounded-2xl shadow-card px-5 py-4 text-sm font-medium text-red-500 hover:bg-red-50 mb-8">
        {t('logout')}
      </button>
    </div>
  );
}
