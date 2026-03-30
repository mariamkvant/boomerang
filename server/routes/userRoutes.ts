import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../database';
import { generateToken, authMiddleware, AuthRequest } from '../auth';

const router = Router();

// Register
router.post('/register', (req: AuthRequest, res: Response) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const hash = bcrypt.hashSync(password, 10);
    const result = db.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      username, email, hash
    );
    const token = generateToken(result.lastInsertRowid);
    res.status(201).json({ token, user: { id: result.lastInsertRowid, username, email, points: 50 } });
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;
  const user = db.get('SELECT * FROM users WHERE email = ?', email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = generateToken(user.id);
  res.json({ token, user: { id: user.id, username: user.username, email: user.email, points: user.points, bio: user.bio } });
});

// Get current user profile
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = db.get('SELECT id, username, email, bio, points, created_at FROM users WHERE id = ?', req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const avgRating = db.get(`
    SELECT AVG(r.rating) as avg_rating, COUNT(r.id) as review_count
    FROM reviews r JOIN service_requests sr ON r.request_id = sr.id
    JOIN services s ON sr.service_id = s.id WHERE s.provider_id = ?
  `, req.userId);

  res.json({ ...user, avg_rating: avgRating?.avg_rating, review_count: avgRating?.review_count || 0 });
});

// Update profile
router.put('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  const { bio, username } = req.body;
  db.run('UPDATE users SET bio = COALESCE(?, bio), username = COALESCE(?, username) WHERE id = ?', bio, username, req.userId);
  res.json({ message: 'Profile updated' });
});

// Get any user's public profile
router.get('/:id', (req: AuthRequest, res: Response) => {
  const user = db.get('SELECT id, username, bio, points, created_at FROM users WHERE id = ?', req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const avgRating = db.get(`
    SELECT AVG(r.rating) as avg_rating, COUNT(r.id) as review_count
    FROM reviews r JOIN service_requests sr ON r.request_id = sr.id
    JOIN services s ON sr.service_id = s.id WHERE s.provider_id = ?
  `, req.params.id);

  const services = db.all(
    'SELECT s.*, c.name as category_name, c.icon as category_icon FROM services s JOIN categories c ON s.category_id = c.id WHERE s.provider_id = ? AND s.is_active = 1',
    req.params.id
  );

  res.json({ ...user, avg_rating: avgRating?.avg_rating, review_count: avgRating?.review_count || 0, services });
});

export default router;
