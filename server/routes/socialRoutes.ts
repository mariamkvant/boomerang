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

// Edit own shoutout
router.put('/shoutouts/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Message required' });
  const result = await db.run('UPDATE shoutouts SET message = $1 WHERE id = $2 AND from_user_id = $3', message.trim(), req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Shoutout not found or not yours' });
  res.json({ message: 'Updated' });
});

// Delete own shoutout
router.delete('/shoutouts/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = await db.run('DELETE FROM shoutouts WHERE id = ? AND from_user_id = ?', req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Shoutout not found or not yours' });
  res.json({ message: 'Deleted' });
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
    fu.username as from_username, fu.id as from_user_id, fu.avatar as from_avatar,
    tu.username as to_username, tu.id as to_user_id, tu.avatar as to_avatar
    FROM shoutouts s JOIN users fu ON s.from_user_id = fu.id JOIN users tu ON s.to_user_id = tu.id
    ORDER BY s.created_at DESC LIMIT 10`);
  const recentExchanges = await db.all(`SELECT sr.id, 'exchange' as type, sr.completed_at as created_at,
    s.title as service_title, s.id as service_id, s.points_cost,
    p.username as provider_name, p.id as provider_id, p.avatar as provider_avatar,
    r.username as requester_name, r.id as requester_id
    FROM service_requests sr JOIN services s ON sr.service_id = s.id
    JOIN users p ON s.provider_id = p.id JOIN users r ON sr.requester_id = r.id
    WHERE sr.status = 'completed' AND sr.completed_at > NOW() - INTERVAL '7 days'
    ORDER BY sr.completed_at DESC LIMIT 10`);
  const newServices = await db.all(`SELECT s.id, 'new_service' as type, s.title, s.created_at, s.points_cost,
    c.icon as category_icon, c.name as category_name,
    u.username as provider_name, u.id as provider_id, u.avatar as provider_avatar
    FROM services s JOIN categories c ON s.category_id = c.id JOIN users u ON s.provider_id = u.id
    WHERE s.is_active = 1 AND s.created_at > NOW() - INTERVAL '7 days'
    ORDER BY s.created_at DESC LIMIT 10`);
  const exchangeCount = await db.get("SELECT COUNT(*) as count FROM service_requests WHERE status = 'completed' AND completed_at > NOW() - INTERVAL '7 days'");
  const totalMembers = await db.get('SELECT COUNT(*) as count FROM users');
  const totalPoints = await db.get("SELECT COALESCE(SUM(s.points_cost), 0) as total FROM service_requests sr JOIN services s ON sr.service_id = s.id WHERE sr.status = 'completed'");
  // Merge and sort all feed items by date
  const allItems = [...shoutouts, ...recentExchanges, ...newServices].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 20);
  res.json({
    shoutouts,
    feed: allItems,
    stats: {
      week_exchanges: parseInt(exchangeCount?.count || '0'),
      total_members: parseInt(totalMembers?.count || '0'),
      total_points_exchanged: parseInt(totalPoints?.total || '0'),
    }
  });
});

export default router;
