import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../database';
import { generateToken, authMiddleware, AuthRequest } from '../auth';
import { sendEmail, generateCode, verifyEmailHtml, resetPasswordHtml } from '../email';

const router = Router();

// Register
router.post('/register', async (req: AuthRequest, res: Response) => {
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
  if (new Date(user.verify_expires) < new Date()) return res.status(400).json({ error: 'Code expired. Request a new one.' });
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
router.post('/forgot-password', async (req: AuthRequest, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  const user = await db.get('SELECT * FROM users WHERE email = ?', email);
  // Always return success to prevent email enumeration
  if (!user) return res.json({ message: 'If that email exists, a reset code has been sent' });
  const code = generateCode();
  const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  await db.run('UPDATE users SET reset_code = ?, reset_expires = ? WHERE id = ?', code, expires, user.id);
  await sendEmail(email, 'Reset your Boomerang password', resetPasswordHtml(code));
  res.json({ message: 'If that email exists, a reset code has been sent' });
});

// Reset password with code
router.post('/reset-password', async (req: AuthRequest, res: Response) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) return res.status(400).json({ error: 'All fields are required' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  const user = await db.get('SELECT * FROM users WHERE email = ?', email);
  if (!user || user.reset_code !== code) return res.status(400).json({ error: 'Invalid code' });
  if (new Date(user.reset_expires) < new Date()) return res.status(400).json({ error: 'Code expired' });
  const hash = bcrypt.hashSync(newPassword, 10);
  await db.run('UPDATE users SET password = ?, reset_code = NULL, reset_expires = NULL WHERE id = ?', hash, user.id);
  res.json({ message: 'Password reset successful' });
});

// Login
router.post('/login', async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;
  const user = await db.get('SELECT * FROM users WHERE email = ?', email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = generateToken(user.id);
  res.json({ token, user: { id: user.id, username: user.username, email: user.email, points: user.points, bio: user.bio, email_verified: user.email_verified, city: user.city, latitude: user.latitude, longitude: user.longitude } });
});

// Get my referral info
router.get('/referral', authMiddleware, async (req: AuthRequest, res: Response) => {
  const count = await db.get('SELECT COUNT(*) as count FROM users WHERE referred_by = ?', req.userId);
  res.json({ referral_code: req.userId, referral_count: parseInt(count?.count || '0') });
});

// Get current user profile
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await db.get('SELECT id, username, email, bio, points, email_verified, city, latitude, longitude, created_at FROM users WHERE id = ?', req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const avgRating = await db.get('SELECT AVG(r.rating) as avg_rating, COUNT(r.id) as review_count FROM reviews r JOIN service_requests sr ON r.request_id = sr.id JOIN services s ON sr.service_id = s.id WHERE s.provider_id = ?', req.userId);
  res.json({ ...user, avg_rating: avgRating?.avg_rating, review_count: avgRating?.review_count || 0 });
});

// Update profile
router.put('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { bio, username, city, latitude, longitude } = req.body;
  await db.run('UPDATE users SET bio = COALESCE(?, bio), username = COALESCE(?, username), city = COALESCE(?, city), latitude = COALESCE(?, latitude), longitude = COALESCE(?, longitude) WHERE id = ?', bio, username, city, latitude, longitude, req.userId);
  res.json({ message: 'Profile updated' });
});

// Get any user's public profile
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const user = await db.get('SELECT id, username, bio, points, city, created_at FROM users WHERE id = ?', req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const avgRating = await db.get('SELECT AVG(r.rating) as avg_rating, COUNT(r.id) as review_count FROM reviews r JOIN service_requests sr ON r.request_id = sr.id JOIN services s ON sr.service_id = s.id WHERE s.provider_id = ?', req.params.id);
  const services = await db.all('SELECT s.*, c.name as category_name, c.icon as category_icon FROM services s JOIN categories c ON s.category_id = c.id WHERE s.provider_id = ? AND s.is_active = 1', req.params.id);
  res.json({ ...user, avg_rating: avgRating?.avg_rating, review_count: avgRating?.review_count || 0, services });
});

export default router;
