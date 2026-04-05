import { Router, Response } from 'express';
import db from '../database';
import { authMiddleware, AuthRequest } from '../auth';

const router = Router();

// Get trust score for a user
router.get('/score/:userId', async (req: AuthRequest, res: Response) => {
  const user = await db.get('SELECT id, created_at, email_verified, phone_verified, points FROM users WHERE id = ?', req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const stats = await db.get(`SELECT
    COUNT(CASE WHEN sr.status = 'completed' THEN 1 END) as completed,
    COUNT(sr.id) as total_requests
    FROM service_requests sr
    JOIN services s ON sr.service_id = s.id
    WHERE s.provider_id = ? OR sr.requester_id = ?`, req.params.userId, req.params.userId);

  const rating = await db.get('SELECT AVG(r.rating) as avg_rating, COUNT(r.id) as review_count FROM reviews r JOIN service_requests sr ON r.request_id = sr.id JOIN services s ON sr.service_id = s.id WHERE s.provider_id = ?', req.params.userId);

  // Average response time (hours from request to accept)
  const responseTime = await db.get(`SELECT AVG(EXTRACT(EPOCH FROM (sr.completed_at - sr.created_at)) / 3600) as avg_hours
    FROM service_requests sr JOIN services s ON sr.service_id = s.id
    WHERE s.provider_id = ? AND sr.status = 'completed'`, req.params.userId);

  // Completion rate
  const totalAsProvider = stats?.total_requests || 0;
  const completedCount = stats?.completed || 0;
  const completionRate = totalAsProvider > 0 ? Math.round((completedCount / totalAsProvider) * 100) : 0;

  // Calculate trust score (0-100)
  let score = 0;
  score += user.email_verified ? 10 : 0;
  score += user.phone_verified ? 10 : 0;
  const ageDays = (Date.now() - new Date(user.created_at).getTime()) / 86400000;
  score += Math.min(15, Math.floor(ageDays / 7)); // up to 15 for account age
  score += Math.min(30, (stats?.completed || 0) * 3); // up to 30 for completions
  score += Math.min(25, Math.floor((rating?.avg_rating || 0) * 5)); // up to 25 for rating
  score += Math.min(10, (rating?.review_count || 0) * 2); // up to 10 for review count

  const level = score >= 80 ? 'Platinum' : score >= 60 ? 'Gold' : score >= 35 ? 'Silver' : 'Bronze';
  const emoji = score >= 80 ? '💎' : score >= 60 ? '🥇' : score >= 35 ? '🥈' : '🥉';

  // Get streak
  const streakData = await db.get('SELECT streak_weeks FROM users WHERE id = ?', req.params.userId);

  res.json({ score, level, emoji, completed: stats?.completed || 0, total_requests: totalAsProvider, completion_rate: completionRate, avg_hours: responseTime?.avg_hours || null, avg_rating: rating?.avg_rating, review_count: rating?.review_count || 0, streak_weeks: streakData?.streak_weeks || 0 });
});

// Report a user
router.post('/report', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { reported_id, reason, details } = req.body;
  if (!reported_id || !reason) return res.status(400).json({ error: 'reported_id and reason required' });
  if (reported_id === req.userId) return res.status(400).json({ error: 'Cannot report yourself' });
  await db.run('INSERT INTO reports (reporter_id, reported_id, reason, details) VALUES (?, ?, ?, ?)', req.userId, reported_id, reason, details || '');
  // Auto-suspend if user has 5+ pending reports
  const reportCount = await db.get("SELECT COUNT(*) as c FROM reports WHERE reported_id = ? AND status = 'pending'", reported_id);
  if (parseInt(reportCount?.c || '0') >= 5) {
    await db.run('UPDATE users SET points = -1 WHERE id = ? AND points != -1', reported_id);
  }
  res.status(201).json({ message: 'Report submitted. We will review it.' });
});

// Block a user
router.post('/block', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { blocked_id } = req.body;
  if (!blocked_id) return res.status(400).json({ error: 'blocked_id required' });
  if (blocked_id === req.userId) return res.status(400).json({ error: 'Cannot block yourself' });
  try {
    await db.run('INSERT INTO blocks (blocker_id, blocked_id) VALUES (?, ?)', req.userId, blocked_id);
    res.status(201).json({ message: 'User blocked' });
  } catch { res.status(409).json({ error: 'Already blocked' }); }
});

// Unblock a user
router.delete('/block/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  await db.run('DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?', req.userId, req.params.userId);
  res.json({ message: 'User unblocked' });
});

// Get my blocked users
router.get('/blocked', authMiddleware, async (req: AuthRequest, res: Response) => {
  const blocked = await db.all('SELECT b.blocked_id, u.username FROM blocks b JOIN users u ON b.blocked_id = u.id WHERE b.blocker_id = ?', req.userId);
  res.json(blocked);
});

// Check if I blocked a user
router.get('/blocked/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const block = await db.get('SELECT id FROM blocks WHERE blocker_id = ? AND blocked_id = ?', req.userId, req.params.userId);
  res.json({ blocked: !!block });
});

export default router;
