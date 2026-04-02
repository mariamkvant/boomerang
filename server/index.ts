import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import path from 'path';
import { initDatabase } from './database';
import { initWebSocket } from './ws';
import { initPush } from './push';
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

app.use(express.json({ limit: '5mb' }));

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

  // Weekly digest scheduler — runs every hour, sends on Mondays at 9am
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
