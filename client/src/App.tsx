import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useSocketConnection } from './hooks/useSocket';
import { useDarkMode } from './hooks/useDarkMode';
import InstallPrompt from './components/InstallPrompt';
import NotificationBell from './components/NotificationBell';
import BottomNav from './components/BottomNav';
import OfflineBanner from './components/OfflineBanner';
import ErrorBoundary from './components/ErrorBoundary';
import OnboardingTooltip from './components/OnboardingTooltip';
import { getLang, setLang, LANGUAGES, t } from './i18n';
import { isIOS } from './utils/platform';

// Lazy-loaded pages
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const BrowsePage = lazy(() => import('./pages/BrowsePage'));
const ServiceDetailPage = lazy(() => import('./pages/ServiceDetailPage'));
const CreateServicePage = lazy(() => import('./pages/CreateServicePage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const AvailabilityPage = lazy(() => import('./pages/AvailabilityPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const GroupsPage = lazy(() => import('./pages/GroupsPage'));
const GroupDetailPage = lazy(() => import('./pages/GroupDetailPage'));
const HelpWantedPage = lazy(() => import('./pages/HelpWantedPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const PeoplePage = lazy(() => import('./pages/PeoplePage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const EditServicePage = lazy(() => import('./pages/EditServicePage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const MePage = lazy(() => import('./pages/MePage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const BuyBoomerangsPage = lazy(() => import('./pages/BuyBoomerangsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { dark, toggle: toggleDark } = useDarkMode();

  const isActive = (path: string) => location.pathname === path;
  const isHome = location.pathname === '/';
  const navLink = (to: string, label: string) => (
    <Link to={to} onClick={() => setMobileOpen(false)}
      className={`block text-sm font-medium px-3 py-3 rounded-lg ${isActive(to) ? 'text-primary-700 bg-primary-50 dark:bg-primary-900/20' : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-[#2a3942]'}`}>
      {label}
    </Link>
  );

  // Close profile dropdown when clicking outside
  useEffect(() => {
    if (!profileOpen) return;
    const close = () => setProfileOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [profileOpen]);

  return (
    <nav className="bg-white/95 dark:bg-[#1e1b18]/95 backdrop-blur-xl border-b border-gray-100/80 dark:border-gray-800 sticky top-0 z-50" style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.06)' }}>
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {!isHome && (
            <button onClick={() => navigate(-1)} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-500" aria-label="Go back">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
          )}
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src="/logo.svg" alt="" className="w-8 h-8 group-hover:scale-110 transition-transform" />
            <span className="text-2xl font-light font-logo bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent tracking-wide">boomerang</span>
          </Link>
        </div>

        {/* Desktop nav — 3 primary items only */}
        <div className="hidden lg:flex items-center gap-1">
          {navLink('/browse', t('nav.browse'))}
          {user && navLink('/services/new', t('nav.offer'))}
          {user && navLink('/dashboard', t('nav.dashboard'))}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <>
              {isIOS ? (
                <div className="flex items-center gap-2 bg-primary-50 px-3 py-1.5 rounded-full">
                  <span className="text-sm font-semibold text-primary-700">{user.points}</span>
                  <span className="text-xs text-primary-500">🪃</span>
                </div>
              ) : (
                <Link to="/buy" className="flex items-center gap-2 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-full transition-colors">
                  <span className="text-sm font-semibold text-primary-700">{user.points}</span>
                  <span className="text-xs text-primary-500">🪃</span>
                </Link>
              )}
              <NotificationBell />
              <button onClick={toggleDark} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" aria-label="Toggle dark mode">
                {dark ? '☀' : '☽'}
              </button>
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setProfileOpen(!profileOpen); }}
                  className="w-9 h-9 rounded-full bg-[#374151] text-white font-semibold text-sm flex items-center justify-center hover:bg-[#2d3748]">
                  {user.username.charAt(0).toUpperCase()}
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-[#1c1c1c] rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 py-2 animate-fade-in">
                    {/* User info */}
                    <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.username}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                    {/* Discover */}
                    <div className="py-1">
                      <p className="px-4 pt-1.5 pb-0.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Discover</p>
                      <Link to="/help-wanted" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#242424]">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" /></svg>
                        Requests
                      </Link>
                      <Link to="/groups" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#242424]">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /></svg>
                        Communities
                      </Link>
                      <Link to="/leaderboard" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#242424]">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" /></svg>
                        Leaderboard
                      </Link>
                      <Link to="/people" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#242424]">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                        Find People
                      </Link>
                    </div>
                    {/* Account */}
                    <div className="border-t border-gray-100 dark:border-gray-800 py-1">
                      <p className="px-4 pt-1.5 pb-0.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Account</p>
                      <Link to="/messages" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#242424]">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" /></svg>
                        Messages
                      </Link>
                      <Link to="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#242424]">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                        My Profile
                      </Link>
                      <Link to="/account" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#242424]">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                        Settings
                      </Link>
                      <Link to="/support" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#242424]">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" /></svg>
                        Help & Support
                      </Link>
                      {user.is_admin && <Link to="/admin" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#242424]">Admin</Link>}
                    </div>
                    <div className="border-t border-gray-100 dark:border-gray-800 pt-1">
                      <button onClick={() => { logout(); navigate('/'); setProfileOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-primary-600 px-3 py-2">Log in</Link>
              <Link to="/register" className="text-sm font-medium bg-[#374151] text-white px-4 py-2 rounded-lg hover:bg-[#2d3748]">Sign up free</Link>
            </>
          )}
        </div>

        {/* Mobile: balance pill + hamburger */}
        <div className="lg:hidden flex items-center gap-2">
          {user && (
            <Link to="/buy"
              className="flex items-center gap-1.5 bg-primary-50 hover:bg-primary-100 active:bg-primary-200 px-3 py-1.5 rounded-full transition-colors min-h-[36px]">
              <span className="text-sm font-semibold text-primary-700">{user.points}</span>
              <span className="text-sm">🪃</span>
            </Link>
          )}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Toggle menu">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu — full vertical list */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-[#202c33] px-2 py-3 animate-fade-in max-h-[80vh] overflow-y-auto">
          {user && (
            <div className="px-3 py-2 mb-2 border-b border-gray-100 dark:border-gray-700">
              <p className="text-sm font-semibold dark:text-white">{user.username}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
          )}
          <div className="flex flex-col">
            {user && navLink('/dashboard', t('nav.dashboard'))}
            {navLink('/browse', t('nav.browse'))}
            {navLink('/help-wanted', t('nav.help'))}
            {navLink('/groups', t('nav.communities'))}
            {navLink('/leaderboard', t('leaderboard.title'))}
            {navLink('/people', 'Find People')}
            {navLink('/community', 'Community Feed')}
            {user && navLink('/messages', 'Messages')}
            {user && navLink('/settings', 'My Profile')}
            {user && navLink('/account', 'Account Settings')}
            {user && navLink('/support', 'Help & Support')}
            {user?.is_admin && navLink('/admin', 'Admin')}
            {!user && navLink('/login', 'Log in')}
            {!user && navLink('/register', 'Sign up free')}
            {user && (
              <button onClick={() => { logout(); navigate('/'); setMobileOpen(false); }}
                className="block w-full text-left text-sm text-red-500 px-3 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 min-h-[44px]">Log out</button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function Footer() {
  // Hide footer on mobile in standalone mode (iOS app)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
  if (isStandalone && window.innerWidth < 768) return null;

  return (
    <footer className="bg-white dark:bg-[#111b21] border-t border-gray-100 dark:border-gray-800 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <img src="/logo.svg" alt="" className="w-6 h-6" />
              <span className="text-base font-light font-logo text-gray-900 dark:text-white tracking-wide">boomerang</span>
            </div>
            <p className="text-xs text-gray-400 max-w-xs">{t('footer.tagline')}</p>
          </div>
          <div className="flex gap-8 sm:gap-12 text-xs">
            <div className="space-y-1.5">
              <Link to="/browse" className="block text-gray-400 hover:text-primary-500">{t('footer.browseServices')}</Link>
              <Link to="/help-wanted" className="block text-gray-400 hover:text-primary-500">{t('footer.helpNeeded')}</Link>
              <Link to="/groups" className="block text-gray-400 hover:text-primary-500">{t('nav.communities')}</Link>
              <Link to="/services/new" className="block text-gray-400 hover:text-primary-500">{t('footer.offerService')}</Link>
            </div>
            <div className="space-y-1.5">
              <Link to="/privacy" className="block text-gray-400 hover:text-primary-500">{t('footer.privacy')}</Link>
              <Link to="/terms" className="block text-gray-400 hover:text-primary-500">{t('footer.terms')}</Link>
              <Link to="/support" className="block text-gray-400 hover:text-primary-500">Help & Support</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 dark:border-gray-800 mt-6 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-400">
          <span>© 2026 Boomerang</span>
          <div className="flex items-center gap-1">
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={() => setLang(l.code)}
                className={`px-2 py-1 rounded text-[11px] ${getLang() === l.code ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium' : 'hover:text-gray-600 dark:hover:text-gray-300'}`}>
                {l.flag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const { user } = useAuth();
  useSocketConnection();

  // Redirect to verify-email if not verified, then onboarding if no city
  const needsVerification = user && !user.email_verified;
  const needsOnboarding = user && user.email_verified && !user.city && localStorage.getItem('onboarding_done') !== 'true';

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full pb-24 lg:pb-6">
        <ErrorBoundary>
        <Suspense fallback={<div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div></div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={user ? <Navigate to={needsVerification ? '/verify-email' : needsOnboarding ? '/onboarding' : '/dashboard'} /> : <LoginPage />} />
          <Route path="/register" element={user ? <Navigate to={needsVerification ? '/verify-email' : '/onboarding'} /> : <RegisterPage />} />
          <Route path="/verify-email" element={user ? (user.email_verified ? <Navigate to={needsOnboarding ? '/onboarding' : '/dashboard'} /> : <VerifyEmailPage />) : <Navigate to="/login" />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/services/new" element={user ? (needsVerification ? <Navigate to="/verify-email" /> : needsOnboarding ? <Navigate to="/onboarding" /> : <CreateServicePage />) : <Navigate to="/login" />} />
          <Route path="/services/:id/edit" element={user ? <EditServicePage /> : <Navigate to="/login" />} />
          <Route path="/services/:id" element={<ServiceDetailPage />} />
          <Route path="/dashboard" element={user ? (needsVerification ? <Navigate to="/verify-email" /> : needsOnboarding ? <Navigate to="/onboarding" /> : <DashboardPage />) : <Navigate to="/login" />} />
          <Route path="/availability" element={user ? <AvailabilityPage /> : <Navigate to="/login" />} />
          <Route path="/settings" element={user ? <SettingsPage /> : <Navigate to="/login" />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/groups/:id" element={<GroupDetailPage />} />
          <Route path="/help-wanted" element={<HelpWantedPage />} />
          <Route path="/people" element={<PeoplePage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/onboarding" element={user ? (needsVerification ? <Navigate to="/verify-email" /> : <OnboardingPage />) : <Navigate to="/login" />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/messages" element={user ? (needsVerification ? <Navigate to="/verify-email" /> : needsOnboarding ? <Navigate to="/onboarding" /> : <MessagesPage />) : <Navigate to="/login" />} />
          <Route path="/account" element={user ? <AccountPage /> : <Navigate to="/login" />} />
          <Route path="/me" element={user ? (needsVerification ? <Navigate to="/verify-email" /> : needsOnboarding ? <Navigate to="/onboarding" /> : <MePage />) : <Navigate to="/login" />} />
          <Route path="/admin" element={user ? <AdminPage /> : <Navigate to="/login" />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/buy" element={user ? (isIOS ? <Navigate to="/dashboard" /> : <BuyBoomerangsPage />) : <Navigate to="/login" />} />
          <Route path="/users/:id" element={<ProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
      <BottomNav />
      <OfflineBanner />
      <InstallPrompt />
      {user && <OnboardingTooltip />}
    </div>
  );
}
