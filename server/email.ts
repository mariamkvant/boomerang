// Email service using Resend
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'Boomerang <onboarding@resend.dev>';

export async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.log(`[EMAIL SKIPPED - No API key] To: ${to}, Subject: ${subject}`);
    return true;
  }
  try {
    console.log(`[EMAIL SENDING] To: ${to}, Subject: ${subject}, From: ${FROM_EMAIL}`);
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
    });
    const data: any = await res.json();
    if (!res.ok) {
      console.error(`[EMAIL FAILED] Status: ${res.status}`, data);
      return false;
    }
    console.log(`[EMAIL SENT] ID: ${data.id}`);
    return true;
  } catch (err) {
    console.error('[EMAIL ERROR]', err);
    return false;
  }
}

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function verifyEmailHtml(code: string): string {
  return `<div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:20px">
    <h2 style="color:#f97316">🪃 Welcome to Boomerang</h2>
    <p>Your verification code is:</p>
    <div style="background:#fff7ed;border:2px solid #f97316;border-radius:12px;padding:20px;text-align:center;font-size:32px;font-weight:bold;letter-spacing:8px;color:#ea580c">${code}</div>
    <p style="color:#666;font-size:14px;margin-top:16px">This code expires in 15 minutes.</p>
  </div>`;
}

export function resetPasswordHtml(code: string): string {
  return `<div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:20px">
    <h2 style="color:#f97316">🪃 Boomerang Password Reset</h2>
    <p>Your password reset code is:</p>
    <div style="background:#fff7ed;border:2px solid #f97316;border-radius:12px;padding:20px;text-align:center;font-size:32px;font-weight:bold;letter-spacing:8px;color:#ea580c">${code}</div>
    <p style="color:#666;font-size:14px;margin-top:16px">This code expires in 15 minutes. If you didn't request this, ignore this email.</p>
  </div>`;
}
