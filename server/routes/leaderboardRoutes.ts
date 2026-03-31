import { Router, Response } from 'express';
import db from '../database';
import { AuthRequest } from '../auth';

const router = Router();

// Top helpers this week
router.get('/weekly', async (_req, res: Response) => {
  const helpers = await db.all(`
    SELECT u.id, u.username, u.city, u.avatar, COUNT(sr.id) as completed_count,
      COALESCE(SUM(s.points_cost), 0) as points_earned
    FROM users u
    JOIN services s ON s.provider_id = u.id
    JOIN service_requests sr ON sr.service_id = s.id
    WHERE sr.status = 'completed' AND sr.completed_at > NOW() - INTERVAL '7 days'
    GROUP BY u.id, u.username, u.city, u.avatar
    ORDER BY completed_count DESC, points_earned DESC
    LIMIT 10
  `);
  res.json(helpers);
});

// Top helpers all time
router.get('/alltime', async (_req, res: Response) => {
  const helpers = await db.all(`
    SELECT u.id, u.username, u.city, u.avatar, COUNT(sr.id) as completed_count,
      COALESCE(SUM(s.points_cost), 0) as points_earned,
      (SELECT AVG(r.rating) FROM reviews r JOIN service_requests sr2 ON r.request_id = sr2.id JOIN services s2 ON sr2.service_id = s2.id WHERE s2.provider_id = u.id) as avg_rating
    FROM users u
    JOIN services s ON s.provider_id = u.id
    JOIN service_requests sr ON sr.service_id = s.id
    WHERE sr.status = 'completed'
    GROUP BY u.id, u.username, u.city, u.avatar
    ORDER BY completed_count DESC, points_earned DESC
    LIMIT 20
  `);
  res.json(helpers);
});

// Most active communities
router.get('/communities', async (_req, res: Response) => {
  const groups = await db.all(`
    SELECT g.id, g.name, g.description,
      (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) as member_count,
      (SELECT COUNT(*) FROM services s WHERE s.group_id = g.id AND s.is_active = 1) as service_count
    FROM groups g WHERE g.is_public = true
    ORDER BY member_count DESC
    LIMIT 10
  `);
  res.json(groups);
});

export default router;
