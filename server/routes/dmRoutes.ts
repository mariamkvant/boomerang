import { Router, Response } from 'express';
import db from '../database';
import { authMiddleware, AuthRequest } from '../auth';
import { notify } from '../notify';

const router = Router();

// IMPORTANT: Static routes must come before /:userId dynamic routes

// Get total unread DM count
router.get('/unread/count', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = await db.get('SELECT COUNT(*) as count FROM direct_messages WHERE receiver_id = ? AND is_read = false', req.userId);
  res.json({ count: parseInt(result?.count || '0') });
});

// Get my conversations
router.get('/conversations', authMiddleware, async (req: AuthRequest, res: Response) => {
  const convos = await db.all(`
    SELECT u.id, u.username, u.city,
      (SELECT body FROM direct_messages dm2 WHERE (dm2.sender_id = ? AND dm2.receiver_id = u.id) OR (dm2.sender_id = u.id AND dm2.receiver_id = ?) ORDER BY dm2.created_at DESC LIMIT 1) as last_message,
      (SELECT created_at FROM direct_messages dm3 WHERE (dm3.sender_id = ? AND dm3.receiver_id = u.id) OR (dm3.sender_id = u.id AND dm3.receiver_id = ?) ORDER BY dm3.created_at DESC LIMIT 1) as last_at,
      (SELECT COUNT(*) FROM direct_messages dm4 WHERE dm4.sender_id = u.id AND dm4.receiver_id = ? AND dm4.is_read = false) as unread
    FROM users u WHERE u.id IN (
      SELECT DISTINCT CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END
      FROM direct_messages WHERE sender_id = ? OR receiver_id = ?
    ) ORDER BY last_at DESC
  `, req.userId, req.userId, req.userId, req.userId, req.userId, req.userId, req.userId, req.userId);
  res.json(convos);
});

// Dynamic routes AFTER static ones

// Get messages with a specific user
router.get('/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const messages = await db.all(
    'SELECT dm.*, u.username as sender_name FROM direct_messages dm JOIN users u ON dm.sender_id = u.id WHERE (dm.sender_id = ? AND dm.receiver_id = ?) OR (dm.sender_id = ? AND dm.receiver_id = ?) ORDER BY dm.created_at ASC LIMIT 100',
    req.userId, req.params.userId, req.params.userId, req.userId
  );
  await db.run('UPDATE direct_messages SET is_read = true WHERE sender_id = ? AND receiver_id = ? AND is_read = false', req.params.userId, req.userId);
  res.json(messages);
});

// Send a message
router.post('/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { body } = req.body;
  if (!body || !body.trim()) return res.status(400).json({ error: 'Message cannot be empty' });
  if (Number(req.params.userId) === req.userId) return res.status(400).json({ error: 'Cannot message yourself' });
  const result = await db.run('INSERT INTO direct_messages (sender_id, receiver_id, body) VALUES (?, ?, ?)', req.userId, req.params.userId, body.trim());
  const sender = await db.get('SELECT username FROM users WHERE id = ?', req.userId);
  await notify({ userId: Number(req.params.userId), type: 'new_dm', title: 'New message', body: (sender?.username || 'Someone') + ' sent you a message', link: '/messages' });
  res.status(201).json({ id: result.lastInsertRowid });
});

export default router;
