import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import path from 'path';
import { initDatabase } from './database';
import db from './database';
import { initWebSocket } from './ws';
import { initPush } from './push';
import { notify } from './notify';
import { notificationEmailHtml } from './notify';
import userRoutes from './routes/userRoutes';
import serviceRoutes from './routes/serviceRoutes';
import requestRoutes from './routes/requestRoutes';
import availabilityRoutes from './routes/availabilityRoutes';
import trustRoutes from './routes/trustRoutes';
import notificationRoutes from './routes/notificationRoutes';
import groupRoutes from './routes/groupRoutes';
import helpWantedRoutes from './routes/helpWantedRoutes';
import dmRoutes from './routes/dmRoutes';
import socialRoutes from './routes/socialRoutes';
import pushRoutes from './routes/pushRoutes';
import adminRoutes from './routes/adminRoutes';
import digestRoutes from './routes/digestRoutes';
import leaderboardRoutes from './routes/leaderboardRoutes';
import paymentRoutes from './routes/paymentRoutes';

import { rateLimit } from './rateLimit';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Trust proxy (Railway runs behind a reverse proxy)
app.set('trust proxy', 1);

// Global rate limit: 200 requests per minute per IP
app.use(rateLimit(60_000, 200));

// CORS — restrict in production
const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3001', 'https://www.boomerang.fyi', 'https://boomerang.fyi'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) callback(null, true);
    else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' wss: https:; font-src 'self' data:; frame-ancestors 'none';");
  }
  next();
});

app.use(express.json({ limit: '10mb' }));

// Page view tracking — lightweight, fire-and-forget
app.post('/api/track', (req, res) => {
  const { page, entity_id } = req.body;
  if (!page) return res.status(400).json({});
  const token = req.headers.authorization?.split(' ')[1];
  let viewerId: number | null = null;
  if (token) { try { const d: any = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'skillswap-dev-secret-change-in-production'); viewerId = d.userId; } catch {} }
  const referrer = (req.body.referrer || req.headers.referer || '').substring(0, 500);
  const userAgent = (req.headers['user-agent'] || '').substring(0, 500);
  db.run('INSERT INTO page_views (page, entity_id, viewer_id, ip, referrer, user_agent) VALUES ($1, $2, $3, $4, $5, $6)', page, entity_id || null, viewerId, req.ip, referrer, userAgent).catch(() => {});
  res.json({ ok: true });
});

app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/trust', trustRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/help-wanted', helpWantedRoutes);
app.use('/api/dm', dmRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/digest', digestRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Catch-all for unknown API routes
app.all('/api/*', (_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// robots.txt
app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send(`User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin
Sitemap: https://www.boomerang.fyi/sitemap.xml`);
});

// Android TWA Digital Asset Links
app.get('/.well-known/assetlinks.json', (_req, res) => {
  const fingerprint = process.env.ANDROID_SHA256_FINGERPRINT;
  if (!fingerprint) {
    return res.json([]);
  }
  res.json([{
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: process.env.ANDROID_PACKAGE_NAME || 'fyi.boomerang.app',
      sha256_cert_fingerprints: [fingerprint],
    },
  }]);
});

// Apple App Site Association
app.get('/.well-known/apple-app-site-association', (_req, res) => {
  const appId = process.env.APPLE_APP_ID;
  if (!appId) {
    return res.json({ applinks: { apps: [], details: [] } });
  }
  res.json({
    applinks: {
      apps: [],
      details: [{ appID: appId, paths: ['*'] }],
    },
    webcredentials: {
      apps: [appId],
    },
  });
});

// sitemap.xml
app.get('/sitemap.xml', (_req, res) => {
  const pages = ['/', '/browse', '/help-wanted', '/groups', '/leaderboard', '/community', '/people', '/register', '/login', '/privacy', '/terms'];
  const urls = pages.map(p => `  <url><loc>https://www.boomerang.fyi${p}</loc><changefreq>weekly</changefreq></url>`).join('\n');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`);
});

// Serve frontend
const clientDist = path.resolve(__dirname, '..', 'client', 'dist');
const clientDistAlt = path.resolve(__dirname, '..', '..', 'client', 'dist');
const fs = require('fs');
const servePath = fs.existsSync(clientDist) ? clientDist : clientDistAlt;
app.use(express.static(servePath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(servePath, 'index.html'));
});

initDatabase().then(() => {
  initPush();
  initWebSocket(server);

  // Weekly digest scheduler — runs every 5 min, sends on Mondays at 9am
  setInterval(async () => {
    const now = new Date();
    if (now.getUTCDay() === 1 && now.getUTCHours() === 9 && now.getUTCMinutes() < 5) {
      console.log('[DIGEST] Triggering weekly digest...');
      try {
        const res = await fetch(`http://localhost:${PORT}/api/digest/weekly?secret=${process.env.DIGEST_SECRET || 'boomerang-digest-secret'}`, { method: 'POST' });
        const data: any = await res.json();
        console.log('[DIGEST]', data.message);
      } catch (err) {
        console.error('[DIGEST] Failed:', err);
      }
    }

    // Automatic reminders — check every 5 min for stale requests
    try {
      // Remind providers about pending requests (not responded in 24h)
      const staleRequests = await db.all(
        `SELECT sr.id, sr.requester_id, s.provider_id, s.title, u.email as provider_email, u.username as provider_name
         FROM service_requests sr
         JOIN services s ON sr.service_id = s.id
         JOIN users u ON s.provider_id = u.id
         WHERE sr.status = 'pending'
         AND sr.created_at < NOW() - INTERVAL '24 hours'
         AND sr.created_at > NOW() - INTERVAL '25 hours'`
      );
      for (const r of staleRequests) {
        await notify({
          userId: r.provider_id, type: 'reminder',
          title: 'Pending request waiting',
          body: `You have a pending request for "${r.title}". Please accept or decline.`,
          link: '/dashboard',
          email: { to: r.provider_email, subject: `Reminder: Pending request for ${r.title}`, html: notificationEmailHtml('Pending request', `Someone is waiting for your response on "${r.title}". Please accept or decline the request.`, 'https://www.boomerang.fyi/dashboard') },
        });
      }

      // Remind requesters about delivered services (not confirmed in 48h)
      const staleDeliveries = await db.all(
        `SELECT sr.id, sr.requester_id, s.title, u.email as requester_email, u.username as requester_name
         FROM service_requests sr
         JOIN services s ON sr.service_id = s.id
         JOIN users u ON sr.requester_id = u.id
         WHERE sr.status = 'delivered'
         AND sr.updated_at < NOW() - INTERVAL '48 hours'
         AND sr.updated_at > NOW() - INTERVAL '49 hours'`
      );
      for (const r of staleDeliveries) {
        await notify({
          userId: r.requester_id, type: 'reminder',
          title: 'Please confirm delivery',
          body: `"${r.title}" was marked as delivered. Please confirm to complete the exchange.`,
          link: '/dashboard',
          email: { to: r.requester_email, subject: `Please confirm: ${r.title}`, html: notificationEmailHtml('Confirm delivery', `The service "${r.title}" was marked as delivered. Please confirm to release the boomerangs.`, 'https://www.boomerang.fyi/dashboard') },
        });
      }

      // Remind about accepted but not delivered (7 days)
      const staleAccepted = await db.all(
        `SELECT sr.id, s.provider_id, s.title, u.email as provider_email
         FROM service_requests sr
         JOIN services s ON sr.service_id = s.id
         JOIN users u ON s.provider_id = u.id
         WHERE sr.status = 'accepted'
         AND sr.updated_at < NOW() - INTERVAL '7 days'
         AND sr.updated_at > NOW() - INTERVAL '7 days 5 minutes'`
      );
      for (const r of staleAccepted) {
        await notify({
          userId: r.provider_id, type: 'reminder',
          title: 'Service reminder',
          body: `You accepted "${r.title}" a week ago. Don't forget to mark it as delivered when done.`,
          link: '/dashboard',
        });
      }

      // Booking reminders — 1 hour before scheduled time
      const nowHour = new Date();
      const inOneHour = new Date(nowHour.getTime() + 60 * 60_000);
      const todayStr = nowHour.toISOString().split('T')[0];
      const nowTime = nowHour.toTimeString().slice(0, 5);
      const soonTime = inOneHour.toTimeString().slice(0, 5);
      
      const upcomingSessions = await db.all(
        `SELECT b.*, sr.id as request_id, s.title, s.provider_id, sr.requester_id,
          p.username as provider_name, p.email as provider_email,
          r.username as requester_name, r.email as requester_email
        FROM bookings b
        JOIN service_requests sr ON b.request_id = sr.id
        JOIN services s ON sr.service_id = s.id
        JOIN users p ON s.provider_id = p.id
        JOIN users r ON sr.requester_id = r.id
        WHERE b.booked_date = $1
        AND b.start_time > $2 AND b.start_time <= $3
        AND sr.status IN ('accepted', 'delivered')`,
        todayStr, nowTime, soonTime
      );
      for (const session of upcomingSessions) {
        const msg = `Reminder: "${session.title}" at ${session.start_time} today`;
        await notify({ userId: session.provider_id, type: 'booking_reminder', title: 'Coming up soon', body: `${msg} with ${session.requester_name}`, link: '/dashboard' });
        await notify({ userId: session.requester_id, type: 'booking_reminder', title: 'Coming up soon', body: `${msg} with ${session.provider_name}`, link: '/dashboard' });
      }
    } catch (err) {
      console.error('[REMINDERS] Error:', err);
    }
  }, 5 * 60_000); // Check every 5 minutes

  server.listen(PORT, () => {
    console.log(`Boomerang server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// Graceful shutdown
function shutdown() {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  setTimeout(() => { console.error('Forced shutdown'); process.exit(1); }, 10_000);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
