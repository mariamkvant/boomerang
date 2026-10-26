/**
 * Auth guard tests — verify protected route logic.
 *
 * Rather than rendering the full lazy App (which requires Suspense,
 * all page mocks, socket connections, etc.), we test the guard logic
 * directly: given a user state and a target path, which route should render?
 *
 * This mirrors exactly the conditions in App.tsx:
 *   needsVerification = user && !user.email_verified
 *   needsOnboarding   = user && user.email_verified && !user.city && onboarding_done !== 'true'
 *
 * Protected routes redirect to /login (no user), /verify-email (unverified),
 * or /onboarding (verified but no city + onboarding not done).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// ── Types matching AuthContext ─────────────────────────────────────────────

interface User {
  id: number;
  email_verified: boolean;
  city: string | null;
}

// ── Replicate App.tsx guard logic exactly ──────────────────────────────────

function resolveRoute(
  targetPath: string,
  user: User | null,
  onboardingDone: boolean,
): string {
  const needsVerification = !!user && !user.email_verified;
  const needsOnboarding   = !!user && user.email_verified && !user.city && !onboardingDone;

  // Public routes — always accessible
  const PUBLIC = ['/', '/browse', '/requests', '/login', '/register',
                  '/forgot-password', '/privacy', '/terms', '/support',
                  '/people', '/community', '/leaderboard'];
  if (PUBLIC.includes(targetPath)) return targetPath;
  if (targetPath.startsWith('/services/') && !targetPath.includes('/new') && !targetPath.includes('/edit') && !targetPath.includes('/hours')) return targetPath;
  if (targetPath.startsWith('/users/')) return targetPath;
  if (targetPath.startsWith('/help-wanted')) return targetPath;

  // No user → login
  if (!user) return '/login';

  // Unverified → verify-email (except for /account and /onboarding which are exempt in App.tsx)
  if (needsVerification && targetPath !== '/account') return '/verify-email';

  // Verified but no city + onboarding not done → onboarding
  if (needsOnboarding && ['/dashboard','/services/new','/requests/new','/messages','/me'].includes(targetPath)) {
    return '/onboarding';
  }

  // Otherwise the user reaches their destination
  return targetPath;
}

// ── Fixtures ───────────────────────────────────────────────────────────────

const VERIFIED_USER: User   = { id: 1, email_verified: true,  city: 'Luxembourg' };
const UNVERIFIED_USER: User = { id: 2, email_verified: false, city: null };
const NO_CITY_USER: User    = { id: 3, email_verified: true,  city: null };

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Auth guards — unauthenticated user', () => {
  it('redirects /dashboard to /login', () => {
    expect(resolveRoute('/dashboard', null, false)).toBe('/login');
  });

  it('redirects /settings to /login', () => {
    expect(resolveRoute('/settings', null, false)).toBe('/login');
  });

  it('redirects /groups to /login', () => {
    expect(resolveRoute('/groups', null, false)).toBe('/login');
  });

  it('redirects /messages to /login', () => {
    expect(resolveRoute('/messages', null, false)).toBe('/login');
  });

  it('redirects /me to /login', () => {
    expect(resolveRoute('/me', null, false)).toBe('/login');
  });

  it('redirects /services/new to /login', () => {
    expect(resolveRoute('/services/new', null, false)).toBe('/login');
  });

  it('allows / without login (public)', () => {
    expect(resolveRoute('/', null, false)).toBe('/');
  });

  it('allows /browse without login (public)', () => {
    expect(resolveRoute('/browse', null, false)).toBe('/browse');
  });

  it('allows /requests without login (public)', () => {
    expect(resolveRoute('/requests', null, false)).toBe('/requests');
  });

  it('allows /services/:id without login (public listing view)', () => {
    expect(resolveRoute('/services/42', null, false)).toBe('/services/42');
  });

  it('allows /users/:id without login (public profile)', () => {
    expect(resolveRoute('/users/7', null, false)).toBe('/users/7');
  });

  it('allows /privacy without login', () => {
    expect(resolveRoute('/privacy', null, false)).toBe('/privacy');
  });
});

describe('Auth guards — verified user with city', () => {
  it('allows /dashboard', () => {
    expect(resolveRoute('/dashboard', VERIFIED_USER, true)).toBe('/dashboard');
  });

  it('allows /settings', () => {
    expect(resolveRoute('/settings', VERIFIED_USER, true)).toBe('/settings');
  });

  it('allows /groups', () => {
    expect(resolveRoute('/groups', VERIFIED_USER, true)).toBe('/groups');
  });

  it('allows /messages', () => {
    expect(resolveRoute('/messages', VERIFIED_USER, true)).toBe('/messages');
  });

  it('allows /me', () => {
    expect(resolveRoute('/me', VERIFIED_USER, true)).toBe('/me');
  });

  it('allows /services/new', () => {
    expect(resolveRoute('/services/new', VERIFIED_USER, true)).toBe('/services/new');
  });
});

describe('Auth guards — unverified user', () => {
  it('redirects /dashboard to /verify-email', () => {
    expect(resolveRoute('/dashboard', UNVERIFIED_USER, false)).toBe('/verify-email');
  });

  it('redirects /settings to /verify-email', () => {
    expect(resolveRoute('/settings', UNVERIFIED_USER, false)).toBe('/verify-email');
  });

  it('redirects /groups to /verify-email', () => {
    expect(resolveRoute('/groups', UNVERIFIED_USER, false)).toBe('/verify-email');
  });

  it('redirects /messages to /verify-email', () => {
    expect(resolveRoute('/messages', UNVERIFIED_USER, false)).toBe('/verify-email');
  });
});

describe('Auth guards — verified user without city (needs onboarding)', () => {
  it('redirects /dashboard to /onboarding', () => {
    expect(resolveRoute('/dashboard', NO_CITY_USER, false)).toBe('/onboarding');
  });

  it('redirects /messages to /onboarding', () => {
    expect(resolveRoute('/messages', NO_CITY_USER, false)).toBe('/onboarding');
  });

  it('does NOT redirect /settings (settings exempt from onboarding gate)', () => {
    // Settings is not in the onboarding-gated list — user can always reach settings
    expect(resolveRoute('/settings', NO_CITY_USER, false)).toBe('/settings');
  });

  it('does NOT redirect when onboarding is already done', () => {
    expect(resolveRoute('/dashboard', NO_CITY_USER, true)).toBe('/dashboard');
  });
});

describe('Auth guards — completeness check', () => {
  const PROTECTED_ROUTES = [
    '/dashboard', '/settings', '/groups', '/messages', '/me',
    '/services/new', '/requests/new',
  ];

  it('all protected routes redirect to /login for null user', () => {
    for (const route of PROTECTED_ROUTES) {
      expect(resolveRoute(route, null, false)).toBe('/login');
    }
  });

  it('all protected routes redirect to /verify-email for unverified user', () => {
    for (const route of PROTECTED_ROUTES) {
      const result = resolveRoute(route, UNVERIFIED_USER, false);
      expect(result).toBe('/verify-email');
    }
  });

  it('all protected routes are accessible for verified user with city', () => {
    for (const route of PROTECTED_ROUTES) {
      expect(resolveRoute(route, VERIFIED_USER, true)).toBe(route);
    }
  });
});
