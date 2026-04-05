import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../database';
import { generateToken, authMiddleware, AuthRequest } from '../auth';
import { sendEmail, generateCode, verifyEmailHtml, resetPasswordHtml } from '../email';
import { uploadAvatar } from '../cloudinary';
import { checkAchievements, BADGES } from '../achievements';
import { rateLimit } from '../rateLimit';

const router = Router();

const authLimiter = rateLimit(15 * 60 * 1000, 20); // 20 attempts per 15 min

// Register
router.post('/register', authLimiter, async (req: AuthRequest, res: Response) => {
  const { username, email, password, referral_code } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'All fields are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  try {
    const hash = bcrypt.hashSync(password, 10);
    const code = generateCode();
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    // Check referral
    let referrerId: number | null = null;
    if (referral_code) {
      const referrer = await db.get('SELECT id FROM users WHERE id = ?', referral_code);
      if (referrer) referrerId = referrer.id;
    }
    const startPoints = referrerId ? 75 : 50; // 25 bonus for referred users
    const result = await db.run(
      'INSERT INTO users (username, email, password, verify_code, verify_expires, referred_by, points) VALUES (?, ?, ?, ?, ?, ?, ?)',
      username, email, hash, code, expires, referrerId, startPoints
    );
    // Give referrer bonus points
    if (referrerId) {
      await db.run('UPDATE users SET points = points + 25 WHERE id = ?', referrerId);
    }
    await sendEmail(email, 'Verify your Boomerang account', verifyEmailHtml(code));
    const token = generateToken(result.lastInsertRowid);
    res.status(201).json({ token, user: { id: result.lastInsertRowid, username, email, points: startPoints, email_verified: false } });
  } catch (err: any) {
    if (err.message?.includes('unique') || err.message?.includes('duplicate')) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Verify email
router.post('/verify-email', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Code is required' });
  const user = await db.get('SELECT * FROM users WHERE id = ?', req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.email_verified) return res.json({ message: 'Already verified' });
  if (user.verify_code !== code) return res.status(400).json({ error: 'Invalid code' });
  try {
    const expiresDate = new Date(user.verify_expires);
    if (isNaN(expiresDate.getTime()) || expiresDate < new Date()) {
      return res.status(400).json({ error: 'Code expired. Request a new one.' });
    }
  } catch {
    return res.status(400).json({ error: 'Code expired. Request a new one.' });
  }
  await db.run('UPDATE users SET email_verified = true, verify_code = NULL, verify_expires = NULL WHERE id = ?', req.userId);
  res.json({ message: 'Email verified' });
});

// Resend verification code
router.post('/resend-verify', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await db.get('SELECT * FROM users WHERE id = ?', req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.email_verified) return res.json({ message: 'Already verified' });
  const code = generateCode();
  const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  await db.run('UPDATE users SET verify_code = ?, verify_expires = ? WHERE id = ?', code, expires, req.userId);
  await sendEmail(user.email, 'Verify your Boomerang account', verifyEmailHtml(code));
  res.json({ message: 'Verification code sent' });
});

// Request password reset
router.post('/forgot-password', authLimiter, async (req: AuthRequest, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  const user = await db.get('SELECT * FROM users WHERE email = ?', email);
  if (!user) return res.json({ message: 'If that email exists, a reset code has been sent' });
  const code = generateCode();
  const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  await db.run('UPDATE users SET reset_code = ?, reset_expires = ? WHERE id = ?', code, expires, user.id);
  const sent = await sendEmail(email, 'Reset your Boomerang password', resetPasswordHtml(code));
  if (!sent) console.error(`[RESET] Failed to send email to ${email}`);
  res.json({ message: 'If that email exists, a reset code has been sent' });
});

// Reset password with code
router.post('/reset-password', async (req: AuthRequest, res: Response) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) return res.status(400).json({ error: 'All fields are required' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  const user = await db.get('SELECT * FROM users WHERE email = ?', email);
  if (!user || user.reset_code !== code) return res.status(400).json({ error: 'Invalid code' });
  // Compare dates safely
  try {
    const expiresDate = new Date(user.reset_expires);
    if (isNaN(expiresDate.getTime()) || expiresDate < new Date()) {
      return res.status(400).json({ error: 'Code expired. Please request a new one.' });
    }
  } catch {
    return res.status(400).json({ error: 'Code expired. Please request a new one.' });
  }
  const hash = bcrypt.hashSync(newPassword, 10);
  await db.run('UPDATE users SET password = ?, reset_code = NULL, reset_expires = NULL WHERE id = ?', hash, user.id);
  res.json({ message: 'Password reset successful' });
});

// Login
router.post('/login', authLimiter, async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;
  const user = await db.get('SELECT * FROM users WHERE email = ?', email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = generateToken(user.id);
  res.json({ token, user: { id: user.id, username: user.username, email: user.email, points: user.points, bio: user.bio, email_verified: user.email_verified, city: user.city, latitude: user.latitude, longitude: user.longitude, languages_spoken: user.languages_spoken, is_admin: user.is_admin } });
});

// Get my referral info
router.get('/referral', authMiddleware, async (req: AuthRequest, res: Response) => {
  const count = await db.get('SELECT COUNT(*) as count FROM users WHERE referred_by = ?', req.userId);
  res.json({ referral_code: req.userId, referral_count: parseInt(count?.count || '0') });
});

// Get my achievements
router.get('/achievements', authMiddleware, async (req: AuthRequest, res: Response) => {
  await checkAchievements(req.userId!);
  const earned = await db.all('SELECT * FROM user_achievements WHERE user_id = ? ORDER BY awarded_at DESC', req.userId);
  const all = BADGES.map(b => ({ ...b, check: undefined, earned: earned.some((e: any) => e.badge === b.id), awarded_at: earned.find((e: any) => e.badge === b.id)?.awarded_at }));
  res.json(all);
});

// Get any user's achievements
router.get('/:id/achievements', async (req: AuthRequest, res: Response) => {
  const earned = await db.all('SELECT * FROM user_achievements WHERE user_id = ? ORDER BY awarded_at DESC', req.params.id);
  const all = BADGES.map(b => ({ ...b, check: undefined, earned: earned.some((e: any) => e.badge === b.id) }));
  res.json(all.filter(a => a.earned));
});

// Get current user profile
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await db.get('SELECT id, username, email, bio, points, email_verified, is_admin, city, latitude, longitude, languages_spoken, avatar, notify_email, notify_push, notify_reminders, created_at FROM users WHERE id = ?', req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const avgRating = await db.get('SELECT AVG(r.rating) as avg_rating, COUNT(r.id) as review_count FROM reviews r JOIN service_requests sr ON r.request_id = sr.id JOIN services s ON sr.service_id = s.id WHERE s.provider_id = ?', req.userId);
  res.json({ ...user, avg_rating: avgRating?.avg_rating, review_count: avgRating?.review_count || 0 });
});

// Update profile
router.put('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { bio, username, city, latitude, longitude, languages_spoken, avatar } = req.body;
  if (avatar !== undefined) {
    if (avatar && avatar.length > 5_000_000) return res.status(400).json({ error: 'Image too large (max 2MB)' });
    const avatarUrl = avatar ? await uploadAvatar(avatar) : null;
    await db.run('UPDATE users SET avatar = ? WHERE id = ?', avatarUrl, req.userId);
  }
  await db.run('UPDATE users SET bio = COALESCE(?, bio), username = COALESCE(?, username), city = COALESCE(?, city), latitude = COALESCE(?, latitude), longitude = COALESCE(?, longitude), languages_spoken = COALESCE(?, languages_spoken) WHERE id = ?', bio, username, city, latitude, longitude, languages_spoken, req.userId);
  // Update notification preferences if provided
  const { notify_email, notify_push, notify_reminders } = req.body;
  if (notify_email !== undefined || notify_push !== undefined || notify_reminders !== undefined) {
    await db.run('UPDATE users SET notify_email = COALESCE(?, notify_email), notify_push = COALESCE(?, notify_push), notify_reminders = COALESCE(?, notify_reminders) WHERE id = ?',
      notify_email, notify_push, notify_reminders, req.userId);
  }
  res.json({ message: 'Profile updated' });
});

// Search people — show all if no query
router.get('/search/people', async (req: AuthRequest, res: Response) => {
  const { q } = req.query;
  if (!q) {
    const users = await db.all('SELECT id, username, bio, city, languages_spoken, points FROM users ORDER BY created_at DESC LIMIT 50');
    return res.json(users);
  }
  const users = await db.all(
    "SELECT id, username, bio, city, languages_spoken, points FROM users WHERE username ILIKE ? OR city ILIKE ? OR languages_spoken ILIKE ? OR bio ILIKE ? LIMIT 20",
    `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`
  );
  res.json(users);
});

// Delete account
router.delete('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  await db.run('DELETE FROM users WHERE id = ?', req.userId);
  res.json({ message: 'Account deleted' });
});

// Get any user's public profile
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const user = await db.get('SELECT id, username, bio, points, city, languages_spoken, avatar, created_at FROM users WHERE id = ?', req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const avgRating = await db.get('SELECT AVG(r.rating) as avg_rating, COUNT(r.id) as review_count FROM reviews r JOIN service_requests sr ON r.request_id = sr.id JOIN services s ON sr.service_id = s.id WHERE s.provider_id = ?', req.params.id);
  const services = await db.all('SELECT s.*, c.name as category_name, c.icon as category_icon FROM services s JOIN categories c ON s.category_id = c.id WHERE s.provider_id = ? AND s.is_active = 1', req.params.id);
  res.json({ ...user, avg_rating: avgRating?.avg_rating, review_count: avgRating?.review_count || 0, services });
});

export default router;
