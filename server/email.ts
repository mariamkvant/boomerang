// Email service using Resend
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'Boomerang <onboarding@resend.dev>';

export async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.log(`[EMAIL SKIPPED] To: ${to}, Subject: ${subject}`);
    return true; // Skip in dev
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });
    return res.ok;
  } catch (err) {
    console.error('Email send failed:', err);
    return false;
  }
}

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function verifyEmailHtml(code: string): string {
  return `<div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:20px">
    <h2 style="color:#22c55e">🪃 Welcome to Boomerang</h2>
    <p>Your verification code is:</p>
    <div style="background:#f0fdf4;border:2px solid #22c55e;border-radius:12px;padding:20px;text-align:center;font-size:32px;font-weight:bold;letter-spacing:8px;color:#16a34a">${code}</div>
    <p style="color:#666;font-size:14px;margin-top:16px">This code expires in 15 minutes.</p>
  </div>`;
}

export function resetPasswordHtml(code: string): string {
  return `<div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:20px">
    <h2 style="color:#22c55e">🪃 Boomerang Password Reset</h2>
    <p>Your password reset code is:</p>
    <div style="background:#f0fdf4;border:2px solid #22c55e;border-radius:12px;padding:20px;text-align:center;font-size:32px;font-weight:bold;letter-spacing:8px;color:#16a34a">${code}</div>
    <p style="color:#666;font-size:14px;margin-top:16px">This code expires in 15 minutes. If you didn't request this, ignore this email.</p>
  </div>`;
}
