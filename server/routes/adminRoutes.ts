import { Router, Response } from 'express';
import db from '../database';
import { authMiddleware, AuthRequest } from '../auth';

const router = Router();

// Admin middleware
async function adminMiddleware(req: AuthRequest, res: Response, next: Function) {
  const user = await db.get('SELECT is_admin FROM users WHERE id = ?', req.userId);
  if (!user?.is_admin) return res.status(403).json({ error: 'Admin access required' });
  next();
}

// Dashboard stats
router.get('/stats', authMiddleware, adminMiddleware, async (_req: AuthRequest, res: Response) => {
  const users = await db.get('SELECT COUNT(*) as count FROM users');
  const services = await db.get('SELECT COUNT(*) as count FROM services WHERE is_active = 1');
  const requests = await db.get('SELECT COUNT(*) as count FROM service_requests');
  const completed = await db.get("SELECT COUNT(*) as count FROM service_requests WHERE status = 'completed'");
  const reports = await db.get("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'");
  const groups = await db.get('SELECT COUNT(*) as count FROM groups');
  const dms = await db.get('SELECT COUNT(*) as count FROM direct_messages');
  const weekUsers = await db.get("SELECT COUNT(*) as count FROM users WHERE created_at > NOW() - INTERVAL '7 days'");
  res.json({
    total_users: parseInt(users?.count || '0'),
    total_services: parseInt(services?.count || '0'),
    total_requests: parseInt(requests?.count || '0'),
    total_completed: parseInt(completed?.count || '0'),
    pending_reports: parseInt(reports?.count || '0'),
    total_groups: parseInt(groups?.count || '0'),
    total_messages: parseInt(dms?.count || '0'),
    new_users_week: parseInt(weekUsers?.count || '0'),
  });
});

// List users with pagination
router.get('/users', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  const { search, page = '1' } = req.query;
  const limit = 30;
  const offset = (parseInt(page as string) - 1) * limit;
  let query = 'SELECT id, username, email, points, email_verified, is_admin, city, created_at FROM users';
  const params: any[] = [];
  if (search) {
    query += ' WHERE username ILIKE $1 OR email ILIKE $1';
    params.push(`%${search}%`);
  }
  query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
  params.push(limit, offset);
  const users = await db.all(query, ...params);
  const total = await db.get(search ? "SELECT COUNT(*) as count FROM users WHERE username ILIKE $1 OR email ILIKE $1" : 'SELECT COUNT(*) as count FROM users', ...(search ? [`%${search}%`] : []));
  res.json({ users, total: parseInt(total?.count || '0'), page: parseInt(page as string), pages: Math.ceil(parseInt(total?.count || '0') / limit) });
});

// Ban/unban user (set points to -1 / restore)
router.put('/users/:id/ban', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  const { banned } = req.body;
  if (Number(req.params.id) === req.userId) return res.status(400).json({ error: 'Cannot ban yourself' });
  await db.run('UPDATE users SET points = ? WHERE id = ?', banned ? -1 : 50, req.params.id);
  res.json({ message: banned ? 'User banned' : 'User unbanned' });
});

// Make/remove admin
router.put('/users/:id/admin', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  const { is_admin } = req.body;
  await db.run('UPDATE users SET is_admin = ? WHERE id = ?', is_admin, req.params.id);
  res.json({ message: is_admin ? 'Admin granted' : 'Admin removed' });
});

// Get reports
router.get('/reports', authMiddleware, adminMiddleware, async (_req: AuthRequest, res: Response) => {
  const reports = await db.all(`SELECT r.*, u1.username as reporter_name, u2.username as reported_name 
    FROM reports r JOIN users u1 ON r.reporter_id = u1.id JOIN users u2 ON r.reported_id = u2.id 
    ORDER BY CASE WHEN r.status = 'pending' THEN 0 ELSE 1 END, r.created_at DESC LIMIT 100`);
  res.json(reports);
});

// Resolve report
router.put('/reports/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  if (!['resolved', 'dismissed'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  await db.run('UPDATE reports SET status = ? WHERE id = ?', status, req.params.id);
  res.json({ message: 'Report updated' });
});

// Delete any service
router.delete('/services/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  await db.run('UPDATE services SET is_active = 0 WHERE id = ?', req.params.id);
  res.json({ message: 'Service removed' });
});

// Check if current user is admin
router.get('/check', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await db.get('SELECT is_admin FROM users WHERE id = ?', req.userId);
  res.json({ is_admin: !!user?.is_admin });
});

export default router;
