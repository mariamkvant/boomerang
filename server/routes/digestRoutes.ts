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

  const users = await db.all('SELECT id, username, email FROM users WHERE email_verified = true');
  let sent = 0;

  for (const user of users) {
    // Get user's weekly activity
    const newRequests = await db.get("SELECT COUNT(*) as c FROM service_requests sr JOIN services s ON sr.service_id = s.id WHERE s.provider_id = ? AND sr.created_at > NOW() - INTERVAL '7 days'", user.id);
    const completed = await db.get("SELECT COUNT(*) as c FROM service_requests sr JOIN services s ON sr.service_id = s.id WHERE (s.provider_id = ? OR sr.requester_id = ?) AND sr.status = 'completed' AND sr.completed_at > NOW() - INTERVAL '7 days'", user.id, user.id);
    const newDMs = await db.get("SELECT COUNT(*) as c FROM direct_messages WHERE receiver_id = ? AND created_at > NOW() - INTERVAL '7 days'", user.id);
    const newServices = await db.get("SELECT COUNT(*) as c FROM services WHERE created_at > NOW() - INTERVAL '7 days' AND is_active = 1");

    const reqCount = parseInt(newRequests?.c || '0');
    const compCount = parseInt(completed?.c || '0');
    const dmCount = parseInt(newDMs?.c || '0');
    const svcCount = parseInt(newServices?.c || '0');

    // Skip if nothing happened
    if (reqCount === 0 && compCount === 0 && dmCount === 0 && svcCount === 0) continue;

    const lines = [];
    if (reqCount > 0) lines.push(`📋 ${reqCount} new request${reqCount > 1 ? 's' : ''} for your services`);
    if (compCount > 0) lines.push(`✅ ${compCount} exchange${compCount > 1 ? 's' : ''} completed`);
    if (dmCount > 0) lines.push(`💬 ${dmCount} new message${dmCount > 1 ? 's' : ''}`);
    lines.push(`🆕 ${svcCount} new services posted this week`);

    const body = `Hi ${user.username}, here's your weekly Boomerang recap:\n\n${lines.join('\n')}`;
    const html = notificationEmailHtml('Your Weekly Boomerang Recap 🪃', lines.join('<br/>'), '');

    try {
      await sendEmail(user.email, 'Your Weekly Boomerang Recap 🪃', html);
      sent++;
    } catch {}
  }

  res.json({ message: `Digest sent to ${sent} users` });
});

export default router;
