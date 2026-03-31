import { Router, Response } from 'express';
import db from '../database';
import { authMiddleware, AuthRequest } from '../auth';
import { notify } from '../notify';

const router = Router();

// Post a thank-you shoutout
router.post('/shoutouts', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { to_user_id, request_id, message } = req.body;
  if (!to_user_id || !message) return res.status(400).json({ error: 'to_user_id and message required' });
  if (to_user_id === req.userId) return res.status(400).json({ error: 'Cannot shoutout yourself' });
  const result = await db.run('INSERT INTO shoutouts (from_user_id, to_user_id, request_id, message) VALUES (?, ?, ?, ?)',
    req.userId, to_user_id, request_id || null, message);
  const sender = await db.get('SELECT username FROM users WHERE id = ?', req.userId);
  await notify({ userId: to_user_id, type: 'shoutout', title: 'You got a shoutout! 🎉', body: (sender?.username || 'Someone') + ' thanked you publicly', link: '/community' });
  res.status(201).json({ id: result.lastInsertRowid });
});

// Get recent shoutouts (community feed)
router.get('/shoutouts', async (_req, res: Response) => {
  const shoutouts = await db.all(`SELECT s.*, fu.username as from_username, tu.username as to_username
    FROM shoutouts s JOIN users fu ON s.from_user_id = fu.id JOIN users tu ON s.to_user_id = tu.id
    ORDER BY s.created_at DESC LIMIT 20`);
  res.json(shoutouts);
});

// Get shoutouts for a specific user
router.get('/shoutouts/user/:id', async (req: AuthRequest, res: Response) => {
  const shoutouts = await db.all(`SELECT s.*, fu.username as from_username
    FROM shoutouts s JOIN users fu ON s.from_user_id = fu.id WHERE s.to_user_id = ?
    ORDER BY s.created_at DESC LIMIT 20`, req.params.id);
  res.json(shoutouts);
});

// Check Superhelper status for a user
router.get('/superhelper/:id', async (req: AuthRequest, res: Response) => {
  const stats = await db.get(`SELECT
    COUNT(CASE WHEN sr.status = 'completed' THEN 1 END) as completed,
    AVG(r.rating) as avg_rating,
    COUNT(r.id) as review_count
    FROM services s
    LEFT JOIN service_requests sr ON sr.service_id = s.id
    LEFT JOIN reviews r ON r.request_id = sr.id
    WHERE s.provider_id = ?`, req.params.id);
  const completed = parseInt(stats?.completed || '0');
  const avgRating = parseFloat(stats?.avg_rating || '0');
  const reviewCount = parseInt(stats?.review_count || '0');
  const isSuperhelper = completed >= 10 && avgRating >= 4.8 && reviewCount >= 5;
  res.json({ is_superhelper: isSuperhelper, completed, avg_rating: avgRating, review_count: reviewCount });
});

// Smart matching — suggest help wanted posts that match user's skills
router.get('/matches', authMiddleware, async (req: AuthRequest, res: Response) => {
  // Get categories the user offers services in
  const myCategories = await db.all('SELECT DISTINCT category_id FROM services WHERE provider_id = ? AND is_active = 1', req.userId);
  if (myCategories.length === 0) return res.json([]);
  const catIds = myCategories.map((c: any) => c.category_id);
  // Find open help wanted in those categories, not by the user
  const placeholders = catIds.map((_: any, i: number) => '$' + (i + 2)).join(',');
  const matches = await db.all(
    `SELECT hw.*, c.name as category_name, c.icon as category_icon, u.username as requester_name, u.city as requester_city
    FROM help_wanted hw JOIN categories c ON hw.category_id = c.id JOIN users u ON hw.requester_id = u.id
    WHERE hw.status = 'open' AND hw.requester_id != $1 AND hw.category_id IN (${placeholders})
    ORDER BY hw.created_at DESC LIMIT 10`,
    req.userId, ...catIds
  );
  res.json(matches);
});

// Daily match — one person near you who needs help with something you can do
router.get('/daily-match', authMiddleware, async (req: AuthRequest, res: Response) => {
  const myCategories = await db.all('SELECT DISTINCT category_id FROM services WHERE provider_id = ? AND is_active = 1', req.userId);
  if (myCategories.length === 0) return res.json(null);
  const catIds = myCategories.map((c: any) => c.category_id);
  const placeholders = catIds.map((_: any, i: number) => '$' + (i + 2)).join(',');
  const match = await db.get(
    `SELECT hw.*, c.name as category_name, c.icon as category_icon, u.username as requester_name, u.city as requester_city
    FROM help_wanted hw JOIN categories c ON hw.category_id = c.id JOIN users u ON hw.requester_id = u.id
    WHERE hw.status = 'open' AND hw.requester_id != $1 AND hw.category_id IN (${placeholders})
    ORDER BY RANDOM() LIMIT 1`,
    req.userId, ...catIds
  );
  res.json(match || null);
});

// Community feed
router.get('/feed', async (_req, res: Response) => {
  const shoutouts = await db.all(`SELECT s.id, 'shoutout' as type, s.message, s.created_at,
    fu.username as from_username, tu.username as to_username
    FROM shoutouts s JOIN users fu ON s.from_user_id = fu.id JOIN users tu ON s.to_user_id = tu.id
    ORDER BY s.created_at DESC LIMIT 10`);
  const recentExchanges = await db.get("SELECT COUNT(*) as count FROM service_requests WHERE status = 'completed' AND completed_at > NOW() - INTERVAL '7 days'");
  const totalMembers = await db.get('SELECT COUNT(*) as count FROM users');
  res.json({
    shoutouts,
    stats: { week_exchanges: parseInt(recentExchanges?.count || '0'), total_members: parseInt(totalMembers?.count || '0') }
  });
});

export default router;
