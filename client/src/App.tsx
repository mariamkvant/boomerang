import React, { useState } from 'react';
import { Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useSocketConnection } from './hooks/useSocket';
import { useDarkMode } from './hooks/useDarkMode';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BrowsePage from './pages/BrowsePage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import CreateServicePage from './pages/CreateServicePage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AvailabilityPage from './pages/AvailabilityPage';
import InstallPrompt from './components/InstallPrompt';
import NotificationBell from './components/NotificationBell';
import SettingsPage from './pages/SettingsPage';
import GroupsPage from './pages/GroupsPage';
import GroupDetailPage from './pages/GroupDetailPage';
import HelpWantedPage from './pages/HelpWantedPage';
import AccountPage from './pages/AccountPage';
import PeoplePage from './pages/PeoplePage';
import MessagesPage from './pages/MessagesPage';
import CommunityPage from './pages/CommunityPage';
import OnboardingPage from './pages/OnboardingPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import EditServicePage from './pages/EditServicePage';
import AdminPage from './pages/AdminPage';
import LeaderboardPage from './pages/LeaderboardPage';
import BottomNav from './components/BottomNav';
import { getLang, setLang, LANGUAGES, t } from './i18n';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { dark, toggle: toggleDark } = useDarkMode();

  const isActive = (path: string) => location.pathname === path;
  const isHome = location.pathname === '/';
  const navLink = (to: string, label: string) => (
    <Link to={to} onClick={() => setMobileOpen(false)}
      className={`text-sm font-medium px-3 py-2 rounded-lg ${isActive(to) ? 'text-primary-700 bg-primary-50' : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'}`}>
      {label}
    </Link>
  );

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-nav border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {!isHome && (
            <button onClick={() => navigate(-1)} className="md:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-500" aria-label="Go back">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
          )}
          <Link to="/" className="flex items-center gap-2.5 group">
          <img src="/logo.svg" alt="" className="w-8 h-8 group-hover:scale-110 transition-transform" />
          <span className="text-2xl font-light font-logo bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent tracking-wide">boomerang</span>
        </Link>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLink('/browse', t('nav.browse'))}
          {user && navLink('/services/new', t('nav.offer'))}
          {navLink('/help-wanted', t('nav.help'))}
          {navLink('/groups', t('nav.communities'))}
          {navLink('/leaderboard', '🏆')}
          {user && navLink('/dashboard', t('nav.dashboard'))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-2 bg-primary-50 px-3 py-1.5 rounded-full">
                <span className="text-sm font-semibold text-primary-700">{user.points}</span>
                <span className="text-xs text-primary-500">🪃</span>
              </div>
              <NotificationBell />
              <button onClick={toggleDark} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" aria-label="Toggle dark mode">
                {dark ? '☀️' : '🌙'}
              </button>
              <div className="relative group">
                <button className="w-9 h-9 rounded-full bg-primary-500 text-white font-semibold text-sm flex items-center justify-center hover:bg-primary-600">
                  {user.username.charAt(0).toUpperCase()}
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="px-4 py-2 border-b border-gray-50">
                    <p className="text-sm font-medium text-gray-900">{user.username}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <Link to="/messages" className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">💬 Messages</Link>
                  <Link to="/settings" className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">My Profile</Link>
                  <Link to="/account" className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Account Settings</Link>
                  {user.is_admin && <Link to="/admin" className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">🛡️ Admin</Link>}
                  <button onClick={() => { logout(); navigate('/'); }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50">Log out</button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-primary-600 px-3 py-2">Log in</Link>
              <Link to="/register" className="text-sm font-medium bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 hover:shadow-md">Sign up free</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100" aria-label="Toggle menu">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1 animate-fade-in">
          {navLink('/browse', t('nav.browse'))}
          {user && navLink('/services/new', t('nav.offer'))}
          {navLink('/help-wanted', t('nav.help'))}
          {navLink('/groups', t('nav.communities'))}
          {user && navLink('/messages', '💬 Messages')}
          {user && navLink('/dashboard', t('nav.dashboard'))}
          {!user && navLink('/login', 'Log in')}
          {!user && navLink('/register', 'Sign up free')}
          {user && (
            <button onClick={() => { logout(); navigate('/'); setMobileOpen(false); }}
              className="w-full text-left text-sm text-red-500 px-3 py-2 rounded-lg hover:bg-red-50">Log out</button>
          )}
        </div>
      )}
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src="/logo.svg" alt="" className="w-7 h-7" />
              <span className="text-lg font-light font-logo text-gray-900 tracking-wide">boomerang</span>
            </div>
            <p className="text-sm text-gray-500 max-w-xs">{t('footer.tagline')}</p>
          </div>
          <div className="flex gap-12 text-sm">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Platform</h4>
              <div className="space-y-2">
                <Link to="/browse" className="block text-gray-500 hover:text-primary-600">Browse Services</Link>
                <Link to="/help-wanted" className="block text-gray-500 hover:text-primary-600">Help Needed</Link>
                <Link to="/people" className="block text-gray-500 hover:text-primary-600">Find People</Link>
                <Link to="/community" className="block text-gray-500 hover:text-primary-600">Community Feed</Link>
                <Link to="/services/new" className="block text-gray-500 hover:text-primary-600">Offer a Service</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Account</h4>
              <div className="space-y-2">
                <Link to="/register" className="block text-gray-500 hover:text-primary-600">Sign Up</Link>
                <Link to="/login" className="block text-gray-500 hover:text-primary-600">Log In</Link>
                <Link to="/privacy" className="block text-gray-500 hover:text-primary-600">Privacy Policy</Link>
                <Link to="/terms" className="block text-gray-500 hover:text-primary-600">Terms of Service</Link>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <span>© 2026 Boomerang. Built with community in mind.</span>
          <div className="flex items-center gap-1">
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={() => setLang(l.code)}
                className={`px-2 py-1 rounded text-xs ${getLang() === l.code ? 'bg-primary-100 text-primary-700 font-medium' : 'hover:text-gray-600'}`}>
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
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-6 w-full pb-20 md:pb-6">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />
          <Route path="/verify-email" element={user ? <VerifyEmailPage /> : <Navigate to="/login" />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/services/new" element={user ? <CreateServicePage /> : <Navigate to="/login" />} />
          <Route path="/services/:id/edit" element={user ? <EditServicePage /> : <Navigate to="/login" />} />
          <Route path="/services/:id" element={<ServiceDetailPage />} />
          <Route path="/dashboard" element={user ? <DashboardPage /> : <Navigate to="/login" />} />
          <Route path="/availability" element={user ? <AvailabilityPage /> : <Navigate to="/login" />} />
          <Route path="/settings" element={user ? <SettingsPage /> : <Navigate to="/login" />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/groups/:id" element={<GroupDetailPage />} />
          <Route path="/help-wanted" element={<HelpWantedPage />} />
          <Route path="/people" element={<PeoplePage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/onboarding" element={user ? <OnboardingPage /> : <Navigate to="/login" />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/messages" element={user ? <MessagesPage /> : <Navigate to="/login" />} />
          <Route path="/account" element={user ? <AccountPage /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user ? <AdminPage /> : <Navigate to="/login" />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/users/:id" element={<ProfilePage />} />
        </Routes>
      </main>
      <Footer />
      <BottomNav />
      <InstallPrompt />
    </div>
  );
}
