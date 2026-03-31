import webpush from 'web-push';
import db from './database';

// VAPID keys — set these as env vars on Railway
// Generate once with: npx web-push generate-vapid-keys
const VAPID_PUBLIC = (process.env.VAPID_PUBLIC_KEY || '').trim();
const VAPID_PRIVATE = (process.env.VAPID_PRIVATE_KEY || '').trim();
const rawEmail = (process.env.VAPID_EMAIL || 'mailto:hello@boomerang.fyi').trim();
const VAPID_EMAIL = rawEmail.startsWith('mailto:') ? rawEmail : `mailto:${rawEmail}`;

let pushEnabled = false;

export function initPush() {
  if (VAPID_PUBLIC && VAPID_PRIVATE) {
    try {
      webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
      pushEnabled = true;
      console.log('[PUSH] Web push notifications enabled');
    } catch (err) {
      console.error('[PUSH] Failed to initialize VAPID — check your keys:', err);
    }
  } else {
    console.log('[PUSH] No VAPID keys set — push notifications disabled. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY env vars.');
  }
}

export function getVapidPublicKey(): string {
  return VAPID_PUBLIC;
}

export async function saveSubscription(userId: number, subscription: webpush.PushSubscription) {
  const endpoint = subscription.endpoint;
  const json = JSON.stringify(subscription);
  // Upsert — replace if same endpoint exists
  await db.run(
    `INSERT INTO push_subscriptions (user_id, endpoint, subscription) VALUES (?, ?, ?)
     ON CONFLICT (endpoint) DO UPDATE SET user_id = ?, subscription = ?, updated_at = NOW()`,
    userId, endpoint, json, userId, json
  );
}

export async function removeSubscription(endpoint: string) {
  await db.run('DELETE FROM push_subscriptions WHERE endpoint = ?', endpoint);
}

export async function sendPushToUser(userId: number, title: string, body: string, link?: string) {
  if (!pushEnabled) return;

  const subs = await db.all('SELECT * FROM push_subscriptions WHERE user_id = ?', userId);
  if (!subs.length) return;

  const payload = JSON.stringify({
    title,
    body,
    icon: '/icons/icon-192.svg',
    badge: '/icons/icon-192.svg',
    data: { url: link || '/' },
  });

  const stale: number[] = [];

  await Promise.allSettled(
    subs.map(async (sub: any) => {
      try {
        await webpush.sendNotification(JSON.parse(sub.subscription), payload);
      } catch (err: any) {
        // 404 or 410 means subscription expired — clean it up
        if (err.statusCode === 404 || err.statusCode === 410) {
          stale.push(sub.id);
        }
      }
    })
  );

  // Remove stale subscriptions
  for (const id of stale) {
    await db.run('DELETE FROM push_subscriptions WHERE id = ?', id);
  }
}
