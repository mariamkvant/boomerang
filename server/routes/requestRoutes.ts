import { Router, Response } from 'express';
import db from '../database';
import { authMiddleware, AuthRequest } from '../auth';

const router = Router();

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { service_id, message } = req.body;
  if (!service_id) return res.status(400).json({ error: 'service_id is required' });
  const service = await db.get('SELECT * FROM services WHERE id = ? AND is_active = 1', service_id);
  if (!service) return res.status(404).json({ error: 'Service not found' });
  if (service.provider_id === req.userId) return res.status(400).json({ error: 'Cannot request your own service' });
  const user = await db.get('SELECT points FROM users WHERE id = ?', req.userId);
  if (user.points < service.points_cost) return res.status(400).json({ error: 'Not enough points' });
  const result = await db.run('INSERT INTO service_requests (service_id, requester_id, message) VALUES (?, ?, ?)', service_id, req.userId, message || '');
  res.status(201).json({ id: result.lastInsertRowid, message: 'Request created' });
});

router.get('/incoming', authMiddleware, async (req: AuthRequest, res: Response) => {
  const requests = await db.all('SELECT sr.*, s.title as service_title, s.points_cost, u.username as requester_name FROM service_requests sr JOIN services s ON sr.service_id = s.id JOIN users u ON sr.requester_id = u.id WHERE s.provider_id = ? ORDER BY sr.created_at DESC', req.userId);
  res.json(requests);
});

router.get('/outgoing', authMiddleware, async (req: AuthRequest, res: Response) => {
  const requests = await db.all('SELECT sr.*, s.title as service_title, s.points_cost, u.username as provider_name, s.provider_id, (SELECT COUNT(*) FROM reviews r WHERE r.request_id = sr.id AND r.reviewer_id = ?) as has_reviewed FROM service_requests sr JOIN services s ON sr.service_id = s.id JOIN users u ON s.provider_id = u.id WHERE sr.requester_id = ? ORDER BY sr.created_at DESC', req.userId, req.userId);
  res.json(requests);
});

router.put('/:id/accept', authMiddleware, async (req: AuthRequest, res: Response) => {
  const r = await db.get('SELECT sr.*, s.provider_id FROM service_requests sr JOIN services s ON sr.service_id = s.id WHERE sr.id = ?', req.params.id);
  if (!r) return res.status(404).json({ error: 'Request not found' });
  if (r.provider_id !== req.userId) return res.status(403).json({ error: 'Not your service' });
  if (r.status !== 'pending') return res.status(400).json({ error: 'Request is not pending' });
  await db.run(UPDATE service_requests SET status = 'accepted' WHERE id = ?, req.params.id);
  res.json({ message: 'Request accepted' });
});

router.put('/:id/complete', authMiddleware, async (req: AuthRequest, res: Response) => {
  const r = await db.get('SELECT sr.*, s.provider_id, s.points_cost FROM service_requests sr JOIN services s ON sr.service_id = s.id WHERE sr.id = ?', req.params.id);
  if (!r) return res.status(404).json({ error: 'Request not found' });
  if (r.provider_id !== req.userId) return res.status(403).json({ error: 'Not your service' });
  if (r.status !== 'accepted') return res.status(400).json({ error: 'Request must be accepted first' });
  const requester = await db.get('SELECT points FROM users WHERE id = ?', r.requester_id);
  if (requester.points < r.points_cost) return res.status(400).json({ error: 'Requester does not have enough points' });
  await db.run('UPDATE users SET points = points - ? WHERE id = ?', r.points_cost, r.requester_id);
  await db.run('UPDATE users SET points = points + ? WHERE id = ?', r.points_cost, req.userId);
  await db.run(UPDATE service_requests SET status = 'completed', completed_at = NOW() WHERE id = ?, req.params.id);
  res.json({ message: 'Service completed, points transferred' });
});

router.put('/:id/cancel', authMiddleware, async (req: AuthRequest, res: Response) => {
  const r = await db.get('SELECT sr.*, s.provider_id FROM service_requests sr JOIN services s ON sr.service_id = s.id WHERE sr.id = ?', req.params.id);
  if (!r) return res.status(404).json({ error: 'Request not found' });
  if (r.requester_id !== req.userId && r.provider_id !== req.userId) return res.status(403).json({ error: 'Not authorized' });
  if (r.status === 'completed') return res.status(400).json({ error: 'Cannot cancel a completed request' });
  await db.run(UPDATE service_requests SET status = 'cancelled' WHERE id = ?, req.params.id);
  res.json({ message: 'Request cancelled' });
});

router.post('/:id/review', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5' });
  const r = await db.get('SELECT * FROM service_requests WHERE id = ? AND requester_id = ?', req.params.id, req.userId);
  if (!r) return res.status(404).json({ error: 'Request not found' });
  if (r.status !== 'completed') return res.status(400).json({ error: 'Can only review completed services' });
  try {
    await db.run('INSERT INTO reviews (request_id, reviewer_id, rating, comment) VALUES (?, ?, ?, ?)', req.params.id, req.userId, rating, comment || '');
    res.status(201).json({ message: 'Review submitted' });
  } catch (err: any) {
    if (err.message?.includes('unique') || err.message?.includes('duplicate')) return res.status(409).json({ error: 'Already reviewed' });
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

export default router;
