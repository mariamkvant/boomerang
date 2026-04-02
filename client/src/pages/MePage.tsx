import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { useInstall } from '../components/InstallPrompt';
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

  const menuItems = [
    { to: '/dashboard', icon: '📊', label: t('dashboard.title') },
    { to: '/settings', icon: '👤', label: t('nav.myProfile') },
    { to: '/account', icon: '⚙️', label: t('nav.accountSettings') },
    { to: '/availability', icon: '📅', label: t('nav.availability') },
    { to: '/messages', icon: '💬', label: t('messages.title') },
    { to: '/leaderboard', icon: '🏆', label: t('leaderboard.title') },
    { to: '/support', icon: '❓', label: 'Help & Support' },
    { to: '/buy', icon: '💰', label: 'Buy Boomerangs' },
  ];

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      {/* Profile card */}
      <div className="bg-white p-6 rounded-2xl shadow-card mb-4">
        <div className="flex items-center gap-4">
          {user.avatar ? (
            <img src={user.avatar} alt="" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-semibold">
              {user.username?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">{user.username}</h2>
            <p className="text-sm text-gray-400 truncate">{user.email}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-sm font-semibold text-gray-900">{user.points} boomerangs</span>
              {trust && trust.avg_rating && <span className="text-sm text-gray-600">{Number(trust.avg_rating).toFixed(1)} rating</span>}
              {trust && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  trust.level === 'Platinum' ? 'bg-violet-100 text-violet-700' :
                  trust.level === 'Gold' ? 'bg-amber-100 text-amber-700' :
                  trust.level === 'Silver' ? 'bg-gray-100 text-gray-600' :
                  'bg-orange-50 text-orange-600'
                }`}>{trust.level}</span>
              )}
            </div>
          </div>
        </div>
        {trust && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="flex gap-4 text-xs text-gray-500">
              <span>{trust.completed} exchanges</span>
              <span>{trust.review_count} reviews</span>
              <span>Trust: {trust.score}/100</span>
            </div>
            <Link to={`/users/${user.id}`} className="text-xs text-primary-600 hover:underline">View profile →</Link>
          </div>
        )}
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

      {/* Install app */}
      {canInstall && (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden mb-4">
          <button onClick={install} className="flex items-center gap-4 px-5 py-4 w-full hover:bg-gray-50">
            <span className="text-lg">📲</span>
            <span className="text-sm font-medium text-primary-600 flex-1 text-left">Install Boomerang app</span>
          </button>
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
