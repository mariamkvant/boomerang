import { Router, Response } from 'express';
import db from '../database';
import { authMiddleware, AuthRequest } from '../auth';
import { notify, notificationEmailHtml } from '../notify';

const router = Router();

// Post a help wanted request
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { title, description, category_id, points_budget } = req.body;
  if (!title || !description || !category_id) return res.status(400).json({ error: 'Title, description, and category required' });
  const result = await db.run(
    'INSERT INTO help_wanted (requester_id, category_id, title, description, points_budget) VALUES (?, ?, ?, ?, ?)',
    req.userId, category_id, title, description, points_budget || 10
  );
  res.status(201).json({ id: result.lastInsertRowid, message: 'Help wanted posted' });
});

// Browse help wanted (open requests)
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

// Get single help wanted
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const hw = await db.get(`SELECT hw.*, c.name as category_name, c.icon as category_icon,
    u.username as requester_name, u.city as requester_city, u.id as requester_user_id
    FROM help_wanted hw JOIN categories c ON hw.category_id = c.id JOIN users u ON hw.requester_id = u.id WHERE hw.id = ?`, req.params.id);
  if (!hw) return res.status(404).json({ error: 'Not found' });
  res.json(hw);
});

// Offer to help (accept a help wanted)
router.put('/:id/offer', authMiddleware, async (req: AuthRequest, res: Response) => {
  const hw = await db.get('SELECT * FROM help_wanted WHERE id = ? AND status = ?', req.params.id, 'open');
  if (!hw) return res.status(404).json({ error: 'Request not found or already taken' });
  if (hw.requester_id === req.userId) return res.status(400).json({ error: 'Cannot accept your own request' });
  await db.run('UPDATE help_wanted SET status = ?, accepted_by = ? WHERE id = ?', 'accepted', req.userId, req.params.id);
  const helper = await db.get('SELECT username FROM users WHERE id = ?', req.userId);
  await notify({
    userId: hw.requester_id, type: 'help_offered',
    title: 'Someone can help!',
    body: (helper?.username || 'Someone') + ' offered to help with: ' + hw.title,
    link: '/help-wanted'
  });
  res.json({ message: 'Offer sent! The requester will be notified.' });
});

// Close/cancel a help wanted (by requester)
router.put('/:id/close', authMiddleware, async (req: AuthRequest, res: Response) => {
  const hw = await db.get('SELECT * FROM help_wanted WHERE id = ? AND requester_id = ?', req.params.id, req.userId);
  if (!hw) return res.status(404).json({ error: 'Not found' });
  await db.run('UPDATE help_wanted SET status = ? WHERE id = ?', 'closed', req.params.id);
  res.json({ message: 'Request closed' });
});

// Get my help wanted posts
router.get('/user/mine', authMiddleware, async (req: AuthRequest, res: Response) => {
  const posts = await db.all('SELECT hw.*, c.name as category_name, c.icon as category_icon, u.username as helper_name FROM help_wanted hw JOIN categories c ON hw.category_id = c.id LEFT JOIN users u ON hw.accepted_by = u.id WHERE hw.requester_id = ? ORDER BY hw.created_at DESC', req.userId);
  res.json(posts);
});

export default router;
