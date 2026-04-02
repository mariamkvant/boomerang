# Boomerang — App Store Launch Guide

## App Store Listing

**App Name:** Boomerang — Skill Exchange
**Subtitle:** What you give, comes back
**Developer:** Boomerang
**Website:** https://www.boomerang.fyi
**Privacy Policy:** https://www.boomerang.fyi/privacy
**Terms:** https://www.boomerang.fyi/terms
**Support:** https://www.boomerang.fyi/support
**Category:** Social Networking (primary), Lifestyle (secondary)
**Age Rating:** 12+ (User Generated Content)
**Price:** Free

### Description

Boomerang is a community platform where people exchange skills and services without money. Share what you can do, earn boomerangs, and use them to get help when you need it.

How it works:
1. List your skills — gardening, cooking, tech help, home repair, tutoring, and 20+ categories
2. Help someone and earn boomerangs automatically
3. Use your boomerangs to request services from others

Features:
- 20+ service categories
- Direct messaging with photo sharing
- Communities — create or join local groups
- Help Wanted board — post what you need
- Trust scores and verified profiles
- Multi-language (English, French, Luxembourgish)
- No money involved — just people helping people

"What you give is yours, what you don't is lost" — Shota Rustaveli

### Keywords
skill exchange, community, time banking, services, help, volunteer, local, neighborhood, barter, free

---

## Step-by-Step: Google Play Store (via TWA)

### Prerequisites
- Google Play Developer account ($25 one-time fee): https://play.google.com/console
- Android Studio installed
- Your PWA must score 90+ on Lighthouse PWA audit
- Your site must be live on HTTPS

### Step 1: Generate PNG icons
You need real PNG icons (not SVG). Use https://realfavicongenerator.net or create them:
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)
- `icon-maskable-192.png` (192x192, with safe zone padding)
- `icon-maskable-512.png` (512x512, with safe zone padding)

Place them in `client/public/icons/`.

### Step 2: Verify Digital Asset Links
Add this file to your server at `/.well-known/assetlinks.json`:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "fyi.boomerang.app",
    "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
  }
}]
```
You get the fingerprint after signing your app in Step 4.

### Step 3: Use PWABuilder (easiest method)
1. Go to https://www.pwabuilder.com
2. Enter `https://www.boomerang.fyi`
3. Click "Package for stores"
4. Select "Android"
5. Fill in:
   - Package ID: `fyi.boomerang.app`
   - App name: `Boomerang`
   - Version: `1.0.0`
   - Signing key: Generate new
6. Download the APK/AAB bundle

### Step 4: Upload to Google Play Console
1. Go to https://play.google.com/console
2. Create new app → fill in listing details from above
3. Upload the AAB from PWABuilder
4. Add screenshots (at least 2 phone, 1 tablet recommended):
   - Take screenshots at 1080x1920 (phone)
   - Take screenshots at 1920x1200 (tablet, optional)
5. Complete the content rating questionnaire
6. Set pricing (Free)
7. Select countries
8. Submit for review

### Step 5: Update assetlinks.json
After signing, get your SHA256 fingerprint from Play Console:
App signing → App signing key certificate → SHA-256
Update the `assetlinks.json` file and redeploy.

---

## Step-by-Step: Apple App Store (via PWA wrapper)

### Prerequisites
- Apple Developer account ($99/year): https://developer.apple.com
- Mac with Xcode installed
- Your PWA must be live on HTTPS

### Option A: PWABuilder (simpler)
1. Go to https://www.pwabuilder.com
2. Enter `https://www.boomerang.fyi`
3. Click "Package for stores" → "iOS"
4. Download the Xcode project
5. Open in Xcode, set your Team/Bundle ID
6. Build and archive
7. Upload to App Store Connect

### Option B: Manual Xcode wrapper (more control)
1. Create new Xcode project → App → SwiftUI
2. Bundle ID: `fyi.boomerang.app`
3. Replace ContentView.swift with a WKWebView loading your PWA URL
4. Add these capabilities:
   - Push Notifications
   - Associated Domains (for universal links)
5. Configure `apple-app-site-association` on your server

### Upload to App Store Connect
1. Go to https://appstoreconnect.apple.com
2. Create new app
3. Fill in listing details from above
4. Upload screenshots:
   - iPhone 6.7" (1290x2796) — required
   - iPhone 6.5" (1284x2778) — required
   - iPad 12.9" (2048x2732) — optional but recommended
5. Submit for review

### Apple Review Tips
- Apple is stricter about PWA wrappers. Make sure:
  - The app provides real value beyond a website
  - Push notifications work
  - Offline mode works (service worker)
  - No "just a website in a wrapper" feel
  - Login/signup works smoothly
  - All links stay within the app (no Safari redirects)

---

## Screenshots Needed

Take these on a real phone or simulator at the required resolutions:

1. **Home screen** — hero section with search
2. **Browse services** — showing category pills and service cards
3. **Service detail** — a service with reviews
4. **Messages** — WhatsApp-style chat
5. **Dashboard** — showing requests and stats
6. **Communities** — group listing
7. **Profile** — user profile with trust score

Save as PNG in `client/public/screenshots/` for the PWA manifest,
and separately at store-required resolutions for submission.

---

## Quick Checklist Before Submission

- [ ] PNG icons generated (192, 512, maskable versions)
- [ ] Screenshots taken at required resolutions
- [ ] Privacy Policy page live at /privacy
- [ ] Terms of Service page live at /terms
- [ ] Support/contact page live at /support
- [ ] App works offline (service worker caching)
- [ ] Push notifications working
- [ ] All links stay within the app
- [ ] Lighthouse PWA score 90+
- [ ] assetlinks.json deployed (Android)
- [ ] apple-app-site-association deployed (iOS)
- [ ] Google Play Developer account created
- [ ] Apple Developer account created
