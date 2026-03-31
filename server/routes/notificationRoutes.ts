import { Router, Response } from 'express';
import db from '../database';
import { authMiddleware, AuthRequest } from '../auth';

const router = Router();

// Get my notifications
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const notifications = await db.all(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', req.userId
  );
  res.json(notifications);
});

// Get unread count
router.get('/unread', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = await db.get(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = false', req.userId
  );
  res.json({ count: parseInt(result?.count || '0') });
});

// Mark one as read
router.put('/:id/read', authMiddleware, async (req: AuthRequest, res: Response) => {
  await db.run('UPDATE notifications SET is_read = true WHERE id = ? AND user_id = ?', req.params.id, req.userId);
  res.json({ message: 'Marked as read' });
});

// Mark all as read
router.put('/read-all', authMiddleware, async (req: AuthRequest, res: Response) => {
  await db.run('UPDATE notifications SET is_read = true WHERE user_id = ?', req.userId);
  res.json({ message: 'All marked as read' });
});

export default router;
