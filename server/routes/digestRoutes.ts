import { Router, Response } from 'express';
import db from '../database';
import { sendEmail } from '../email';
import { notificationEmailHtml } from '../notify';

const router = Router();

const DIGEST_SECRET = process.env.DIGEST_SECRET || 'boomerang-digest-secret';

// Weekly digest — call via cron: POST /api/digest/weekly?secret=xxx
router.post('/weekly', async (req, res: Response) => {
  const { secret } = req.query;
  if (secret !== DIGEST_SECRET) return res.status(403).json({ error: 'Invalid secret' });

  // Only send to verified users who haven't opted out of email notifications
  const users = await db.all(
    `SELECT id, username, email FROM users
     WHERE email_verified = true
     AND (notify_email IS NULL OR notify_email = true)`
  );
  console.log(`[DIGEST] Found ${users.length} eligible users`);
  let sent = 0;

  // Platform-wide new services count (shared across all users)
  const newServicesRow = await db.get(
    `SELECT COUNT(*) as c FROM services WHERE created_at > NOW() - INTERVAL '7 days' AND is_active = 1`
  );
  const svcCount = parseInt(newServicesRow?.c || '0');

  for (const user of users) {
    // Get user's weekly personal activity
    const newRequests = await db.get(
      `SELECT COUNT(*) as c FROM service_requests sr
       JOIN services s ON sr.service_id = s.id
       WHERE s.provider_id = ? AND sr.created_at > NOW() - INTERVAL '7 days'`,
      user.id
    );
    const completed = await db.get(
      `SELECT COUNT(*) as c FROM service_requests sr
       JOIN services s ON sr.service_id = s.id
       WHERE (s.provider_id = ? OR sr.requester_id = ?)
       AND sr.status = 'completed'
       AND sr.completed_at > NOW() - INTERVAL '7 days'`,
      user.id, user.id
    );
    const newDMs = await db.get(
      `SELECT COUNT(*) as c FROM direct_messages
       WHERE receiver_id = ? AND created_at > NOW() - INTERVAL '7 days'`,
      user.id
    );

    const reqCount = parseInt(newRequests?.c || '0');
    const compCount = parseInt(completed?.c || '0');
    const dmCount = parseInt(newDMs?.c || '0');

    // Skip users with no personal activity AND no new services on the platform
    if (reqCount === 0 && compCount === 0 && dmCount === 0 && svcCount === 0) {
      console.log(`[DIGEST] Skipping ${user.username} — no activity`);
      continue;
    }

    const lines: string[] = [];
    if (reqCount > 0) lines.push(`📋 ${reqCount} new request${reqCount > 1 ? 's' : ''} for your services`);
    if (compCount > 0) lines.push(`✅ ${compCount} exchange${compCount > 1 ? 's' : ''} completed`);
    if (dmCount > 0) lines.push(`💬 ${dmCount} new message${dmCount > 1 ? 's' : ''}`);
    if (svcCount > 0) lines.push(`🆕 ${svcCount} new service${svcCount > 1 ? 's' : ''} posted this week`);

    // Only send if there's at least one personal activity item or platform news
    if (lines.length === 0) continue;

    const html = notificationEmailHtml(
      'Your Weekly Boomerang Recap 🪃',
      `Hi ${user.username},<br/><br/>Here's your weekly recap:<br/><br/>${lines.join('<br/>')}`,
      'https://www.boomerang.fyi/dashboard'
    );

    try {
      console.log(`[DIGEST] Sending to ${user.email}...`);
      const ok = await sendEmail(user.email, 'Your Weekly Boomerang Recap 🪃', html);
      if (ok) sent++;
      else console.warn(`[DIGEST] sendEmail returned false for ${user.email}`);
    } catch (err) {
      console.error(`[DIGEST] Failed to send to ${user.email}:`, err);
    }
  }

  res.json({ message: `Digest sent to ${sent} of ${users.length} users` });
});

export default router;
