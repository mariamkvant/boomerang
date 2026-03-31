import { Router, Response } from 'express';
import db from '../database';
import { authMiddleware, AuthRequest } from '../auth';
import { notify } from '../notify';

const router = Router();

// STATIC routes first
router.get('/user/mine', authMiddleware, async (req: AuthRequest, res: Response) => {
  const posts = await db.all('SELECT hw.*, c.name as category_name, c.icon as category_icon, u.username as helper_name FROM help_wanted hw JOIN categories c ON hw.category_id = c.id LEFT JOIN users u ON hw.accepted_by = u.id WHERE hw.requester_id = ? ORDER BY hw.created_at DESC', req.userId);
  res.json(posts);
});

// Get help wanted where I'm the helper
router.get('/user/helping', authMiddleware, async (req: AuthRequest, res: Response) => {
  const posts = await db.all('SELECT hw.*, c.name as category_name, c.icon as category_icon, u.username as requester_name FROM help_wanted hw JOIN categories c ON hw.category_id = c.id JOIN users u ON hw.requester_id = u.id WHERE hw.accepted_by = ? ORDER BY hw.created_at DESC', req.userId);
  res.json(posts);
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { title, description, category_id, points_budget } = req.body;
  if (!title || !description || !category_id) return res.status(400).json({ error: 'Title, description, and category required' });
  const result = await db.run('INSERT INTO help_wanted (requester_id, category_id, title, description, points_budget) VALUES (?, ?, ?, ?, ?)',
    req.userId, category_id, title, description, points_budget || 10);
  res.status(201).json({ id: result.lastInsertRowid });
});

router.get('/', async (req: AuthRequest, res: Response) => {
  const { category, search } = req.query;
  let query = `SELECT hw.*, c.name as category_name, c.icon as category_icon, u.username as requester_name, u.city as requester_city
    FROM help_wanted hw JOIN categories c ON hw.category_id = c.id JOIN users u ON hw.requester_id = u.id WHERE hw.status = 'open'`;
  const params: any[] = [];
  let n = 0;
  if (category) { query += ` AND hw.category_id = $${++n}`; params.push(category); }
  if (search) { query += ` AND (hw.title ILIKE $${++n} OR hw.description ILIKE $${++n})`; params.push(`%${search}%`, `%${search}%`); n++; }
  query += ' ORDER BY hw.created_at DESC LIMIT 50';
  const requests = await db.all(query, ...params);
  res.json(requests);
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const hw = await db.get(`SELECT hw.*, c.name as category_name, c.icon as category_icon,
    u.username as requester_name, u.id as requester_user_id, h.username as helper_name
    FROM help_wanted hw JOIN categories c ON hw.category_id = c.id JOIN users u ON hw.requester_id = u.id
    LEFT JOIN users h ON hw.accepted_by = h.id WHERE hw.id = ?`, req.params.id);
  if (!hw) return res.status(404).json({ error: 'Not found' });
  res.json(hw);
});

// Offer to help
router.put('/:id/offer', authMiddleware, async (req: AuthRequest, res: Response) => {
  const hw = await db.get('SELECT * FROM help_wanted WHERE id = ? AND status = ?', req.params.id, 'open');
  if (!hw) return res.status(404).json({ error: 'Not found or already taken' });
  if (hw.requester_id === req.userId) return res.status(400).json({ error: 'Cannot accept your own request' });
  await db.run('UPDATE help_wanted SET status = ?, accepted_by = ? WHERE id = ?', 'accepted', req.userId, req.params.id);
  const helper = await db.get('SELECT username FROM users WHERE id = ?', req.userId);
  await notify({ userId: hw.requester_id, type: 'help_offered', title: 'Someone can help!', body: (helper?.username || 'Someone') + ' offered to help with: ' + hw.title, link: '/dashboard' });
  res.json({ message: 'Offer sent!' });
});

// Helper marks as delivered
router.put('/:id/deliver', authMiddleware, async (req: AuthRequest, res: Response) => {
  const hw = await db.get('SELECT * FROM help_wanted WHERE id = ? AND accepted_by = ?', req.params.id, req.userId);
  if (!hw) return res.status(404).json({ error: 'Not found' });
  if (hw.status !== 'accepted') return res.status(400).json({ error: 'Must be accepted first' });
  await db.run('UPDATE help_wanted SET status = ? WHERE id = ?', 'delivered', req.params.id);
  await notify({ userId: hw.requester_id, type: 'help_delivered', title: 'Help delivered!', body: 'Please confirm the help was received.', link: '/dashboard' });
  res.json({ message: 'Marked as delivered' });
});

// Requester confirms delivery — points transfer
router.put('/:id/confirm', authMiddleware, async (req: AuthRequest, res: Response) => {
  const hw = await db.get('SELECT * FROM help_wanted WHERE id = ? AND requester_id = ?', req.params.id, req.userId);
  if (!hw) return res.status(404).json({ error: 'Not found' });
  if (hw.status !== 'delivered') return res.status(400).json({ error: 'Must be delivered first' });
  const requester = await db.get('SELECT points FROM users WHERE id = ?', hw.requester_id);
  if (requester.points < hw.points_budget) return res.status(400).json({ error: 'Not enough points' });
  await db.run('UPDATE users SET points = points - ? WHERE id = ?', hw.points_budget, hw.requester_id);
  await db.run('UPDATE users SET points = points + ? WHERE id = ?', hw.points_budget, hw.accepted_by);
  await db.run('UPDATE help_wanted SET status = ? WHERE id = ?', 'completed', req.params.id);
  await notify({ userId: hw.accepted_by, type: 'help_confirmed', title: 'Help confirmed! Points received.', body: hw.points_budget + ' points transferred to you.', link: '/dashboard' });
  res.json({ message: 'Confirmed! Points transferred.' });
});

// Close/cancel
router.put('/:id/close', authMiddleware, async (req: AuthRequest, res: Response) => {
  const hw = await db.get('SELECT * FROM help_wanted WHERE id = ? AND requester_id = ?', req.params.id, req.userId);
  if (!hw) return res.status(404).json({ error: 'Not found' });
  await db.run('UPDATE help_wanted SET status = ? WHERE id = ?', 'closed', req.params.id);
  res.json({ message: 'Closed' });
});

export default router;
