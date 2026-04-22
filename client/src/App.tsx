import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useSocketConnection } from './hooks/useSocket';
import { useDarkMode } from './hooks/useDarkMode';
import InstallPrompt from './components/InstallPrompt';
import NotificationBell from './components/NotificationBell';
import BottomNav from './components/BottomNav';
import OfflineBanner from './components/OfflineBanner';
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
      className={`text-sm font-medium px-3 py-3 rounded-lg whitespace-nowrap ${isActive(to) ? 'text-primary-700 bg-primary-50' : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'}`}>
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
    <nav className="bg-white/80 dark:bg-[#202c33]/90 backdrop-blur-md shadow-nav border-b border-gray-100 dark:border-gray-700 sticky top-0 z-50">
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

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-1">
          {navLink('/browse', t('nav.browse'))}
          {user && navLink('/services/new', t('nav.offer'))}
          {navLink('/help-wanted', t('nav.help'))}
          {navLink('/groups', t('nav.communities'))}
          {user && navLink('/dashboard', t('nav.dashboard'))}
          {navLink('/leaderboard', '🏆')}
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
                {dark ? '☀️' : '🌙'}
              </button>
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setProfileOpen(!profileOpen); }}
                  className="w-9 h-9 rounded-full bg-primary-500 text-white font-semibold text-sm flex items-center justify-center hover:bg-primary-600">
                  {user.username.charAt(0).toUpperCase()}
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#202c33] rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 animate-fade-in">
                    <div className="px-4 py-2 border-b border-gray-50 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <Link to="/messages" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Messages</Link>
                    <Link to="/settings" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">My Profile</Link>
                    <Link to="/account" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Account Settings</Link>
                    <Link to="/people" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Find People</Link>
                    <Link to="/community" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Community Feed</Link>
                    <Link to="/support" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Help & Support</Link>
                    {user.is_admin && <Link to="/admin" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Admin</Link>}
                    <button onClick={() => { logout(); navigate('/'); setProfileOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50">Log out</button>
                  </div>
                )}
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
        <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100" aria-label="Toggle menu">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu — only items NOT in bottom nav */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-[#202c33] px-4 py-2 space-y-0.5 animate-fade-in max-h-[70vh] overflow-y-auto">
          {navLink('/help-wanted', t('nav.help'))}
          {navLink('/groups', t('nav.communities'))}
          {navLink('/leaderboard', t('leaderboard.title'))}
          {navLink('/people', 'Find People')}
          {navLink('/community', 'Community Feed')}
          {user && navLink('/dashboard', t('nav.dashboard'))}
          {!user && navLink('/login', 'Log in')}
          {!user && navLink('/register', 'Sign up free')}
          {user && (
            <button onClick={() => { logout(); navigate('/'); setMobileOpen(false); }}
              className="w-full text-left text-sm text-red-500 px-3 py-3 rounded-lg hover:bg-red-50 min-h-[44px]">Log out</button>
          )}
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
              <Link to="/support" className="block text-gray-400 hover:text-primary-500">Support Boomerang ♥</Link>
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
      </main>
      <Footer />
      <BottomNav />
      <OfflineBanner />
      <InstallPrompt />
    </div>
  );
}
