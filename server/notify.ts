import db from './database';
import { sendEmail } from './email';
import { sendToUser } from './ws';
import { sendPushToUser } from './push';

interface NotifyOptions {
  userId: number;
  type: string;
  title: string;
  body: string;
  link?: string;
  email?: { to: string; subject: string; html: string };
}

export async function notify(opts: NotifyOptions) {
  // Save in-app notification
  const result = await db.run(
    'INSERT INTO notifications (user_id, type, title, body, link) VALUES (?, ?, ?, ?, ?)',
    opts.userId, opts.type, opts.title, opts.body, opts.link || null
  );
  // Push real-time via WebSocket
  sendToUser(opts.userId, 'notification', {
    id: result.lastInsertRowid,
    notificationType: opts.type,
    title: opts.title,
    body: opts.body,
    link: opts.link || null,
    created_at: new Date().toISOString(),
  });
  // Send email if provided
  if (opts.email) {
    await sendEmail(opts.email.to, opts.email.subject, opts.email.html);
  }
  // Send push notification
  await sendPushToUser(opts.userId, opts.title, opts.body, opts.link);
}

export function notificationEmailHtml(title: string, body: string, link?: string): string {
  return `<div style="font-family:sans-serif;max-width:450px;margin:0 auto;padding:20px">
    <div style="text-align:center;margin-bottom:20px">
      <span style="font-size:24px;font-weight:300;color:#f97316;letter-spacing:2px">boomerang</span>
    </div>
    <h2 style="color:#1f2937;font-size:18px;margin-bottom:8px">${title}</h2>
    <p style="color:#6b7280;font-size:14px;line-height:1.6">${body}</p>
    ${link ? `<a href="${link}" style="display:inline-block;margin-top:16px;background:#f97316;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500">View Details</a>` : ''}
    <p style="color:#9ca3af;font-size:12px;margin-top:24px;border-top:1px solid #f3f4f6;padding-top:16px">What you give, comes back.</p>
  </div>`;
}
