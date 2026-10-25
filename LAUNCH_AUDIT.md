# Boomerang Pre-Launch Bug Audit
Generated: October 2026

## 🔴 CRITICAL — Fix before launch

### 1. `/nearby` route unreachable (serviceRoutes.ts)
`GET /services/nearby` is shadowed by `GET /services/:id` — the nearby endpoint **never executes**. Same for `/suggestions` and `/trending/popular`. Move all static-segment routes before `/:id`.

### 2. Giveaway listings always fail (CreateServicePage.tsx)
`isGiveaway` sets `price_eur = '0'`, but `handleSubmit` checks `price <= 0` → "Price must be greater than €0". Giveaway listings can never be created. Fix: change check to `price < 0` for paid services, allow `0` for giveaways.

### 3. Item category never submitted (CreateServicePage.tsx)
In item mode, `itemCategory` state is set when user picks a category, but it is never included in the `api.createService()` call. All item listings are saved with `category_id = 0`. Fix: map `itemCategory → form.category_id` in the category pill onClick.

### 4. No rate limit on password reset (userRoutes.ts)
`POST /users/reset-password` has no rate limiter. 6-digit code = 900,000 possibilities. An attacker can brute-force anyone's account. Apply `authLimiter`.

### 5. No rate limit on email verification (userRoutes.ts)
`POST /users/verify-email` and `POST /users/resend-verify` have no rate limit. Apply `authLimiter`.

### 6. XSS in email templates (notify.ts)
Service titles and descriptions are interpolated directly into email HTML without escaping. A service named `<script>alert(1)</script>` sends XSS payload to all notified users. HTML-escape all dynamic values in `notificationEmailHtml`.

### 7. Unsanitized link in email href (notify.ts)
`link` parameter in `notificationEmailHtml` is inserted into `<a href="...">` without validation. Allows `javascript:` injection. Validate link starts with `/` or `https://www.boomerang.fyi`.

---

## 🟠 HIGH — Fix soon after launch

### 8. Delivery photo silently dropped (DashboardPage.tsx)
Provider can attach a delivery photo in the UI, but `api.deliverRequest(id, note)` never receives the photo. It's discarded. Add photo parameter to the API call.

### 9. `window.confirm` / `alert()` broken on iOS native app (SettingsPage.tsx)
"Start over" for Stripe Connect uses `window.confirm()` — WKWebView suppresses it (always returns false). IBAN error uses `alert()` — same problem. Replace with `useConfirm` hook and `toast()`.

### 10. `pendingActions` badge on wrong nav icon (BottomNav.tsx)
The "pending requests" badge is shown on the "Groups" icon. Users can't find their pending requests. Move badge to a relevant tab or add a Dashboard shortcut.

### 11. stripeConnectStatus failure leaves UI permanently loading (SettingsPage.tsx)
If the status API throws, `.catch(() => {})` swallows it and `connectStatus` stays `null` forever. Set `connectStatus` to `{ status: 'none' }` in the catch.

### 12. Card decline leaves dangling request in provider inbox (ServiceDetailPage.tsx)
**Already fixed in latest commit** — confirming resolved.

### 13. Unread DM counter never resets (BottomNav.tsx + MessagesPage.tsx)
`unreadDMs` increments on WebSocket events but is never cleared when user opens Messages. Add a reset call when `path === '/messages'` or when a conversation is opened.

### 14. In-memory rate limiter resets on server restart (rateLimit.ts)
Rate limits are stored in a `Map` that resets on every Railway deploy. Brute-force attacks spanning a restart bypass all limits. Consider Redis for production, or at minimum log when limits are hit.

### 15. isGeorgianUser detection unreliable (SettingsPage.tsx)
Georgia detection based on city name strings — a user in Tbilisi's "Saburtalo" neighbourhood won't match. Use `user.country` from the profile or a server-side flag.

---

## 🟡 MEDIUM — Fix in first week post-launch

### 16. Profile save doesn't clear stale GPS when city text is changed manually (SettingsPage.tsx)
`handleSave` saves new `city` text but doesn't clear old `latitude/longitude`. User ends up with mismatched city name and old coordinates.

### 17. `stripe_account_id` exposed in public user profiles (userRoutes.ts)
`GET /users/:id` returns `stripe_account_id` to unauthenticated callers. Remove from public profile response.

### 18. `/search/people` unauthenticated with no rate limit (userRoutes.ts)
Anyone can enumerate all users in batches of 50 with no auth. Add rate limit or require auth.

### 19. `bcrypt.hashSync` / `compareSync` block event loop (userRoutes.ts)
Synchronous bcrypt blocks Node.js thread for ~100ms per call. Under load this degrades all API responses. Use async `bcrypt.hash()` / `bcrypt.compare()`.

### 20. joinByCode failure silently swallowed on registration (RegisterPage.tsx)
If group join fails after registration, user is redirected to verify-email with no feedback. They never know they missed the group. Show a toast after verification.

### 21. Webhook raw body may not be preserved correctly (index.ts)
The `express.raw()` middleware for Stripe webhook is followed by a no-op `next()`, then `express.json()` globally. Verify Stripe signature verification actually works end-to-end (confirmed working from live test, but the wiring is fragile).

### 22. Digest week ID calculation is wrong (index.ts)
`Math.ceil(date / 7)` gives week-of-month, not ISO week. The weekly digest could double-send or skip. Use date string as week ID instead.

### 23. DashboardPage `load()` missing `user` dependency (DashboardPage.tsx)
`useEffect(() => { load() }, [])` runs once on mount, but `load()` uses `user.id`. If auth context hasn't populated yet, trust score never loads. Add `user` to effect dependencies.

### 24. Onboarding `handleFinish` has no error handling (OnboardingPage.tsx)
Two `api.updateProfile` calls in `handleFinish` are not in a try/catch. Network errors leave user stuck on step 4 with no feedback.

### 25. IP geolocation sent over HTTP (index.ts)
`http://ip-api.com/...` — user IPs sent unencrypted to third party. Use HTTPS endpoint.

---

## 🟢 LOW — Nice to have

- `deliverPhoto` state not reset after modal closes → old photo pre-filled next time
- `GET /services/calculate-points` — no upper bound on `duration_minutes`
- Cascade delete in service delete not in a transaction
- JWT has no invalidation on account delete (7-day tokens live on)
- `require('jsonwebtoken')` inline in tracking endpoint — use shared secret constant
- BottomNav `/services/` active check highlights "Offers" tab when creating a service
- MessagesPage DM poll + WebSocket running simultaneously can discard optimistic messages
- Dashboard "Services" tab shows disputed requests without any actions available
