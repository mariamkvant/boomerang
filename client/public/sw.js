const CACHE_NAME = 'boomerang-v3';
const STATIC_ASSETS = [
  '/',
  '/logo.svg',
  '/icons/icon-192.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/manifest.json',
];

// Install — cache static assets + offline shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first for navigation, cache first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Skip API and WebSocket requests
  if (request.url.includes('/api/') || request.url.includes('/ws')) return;

  // Navigation requests (HTML pages) — network first, fallback to cached shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match('/').then((cached) => cached || offlineResponse()))
    );
    return;
  }

  // Static assets — cache first, then network
  if (request.url.match(/\.(js|css|png|svg|jpg|jpeg|webp|woff2?|ttf)(\?|$)/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Everything else — network first
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

function offlineResponse() {
  return new Response(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Boomerang</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,system-ui,sans-serif;background:#f9fafb;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:24px}
    .c{max-width:320px}.icon{width:48px;height:48px;margin:0 auto 16px}h1{font-size:20px;font-weight:700;color:#111;margin-bottom:8px}p{font-size:14px;color:#6b7280;margin-bottom:24px}
    button{background:#f97316;color:#fff;border:none;padding:12px 32px;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer}</style></head>
    <body><div class="c"><img src="/logo.svg" class="icon" alt=""><h1>You're offline</h1><p>Check your connection and try again.</p><button onclick="location.reload()">Retry</button></div></body></html>`,
    { headers: { 'Content-Type': 'text/html' } }
  );
}

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'Boomerang', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: data.data || {},
      tag: 'boomerang-' + Date.now(),
    })
  );
});

// Notification click — open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
