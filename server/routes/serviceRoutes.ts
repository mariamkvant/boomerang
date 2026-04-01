import { Router, Response } from 'express';
import db from '../database';
import { authMiddleware, AuthRequest } from '../auth';

const router = Router();

router.get('/categories', async (_req, res: Response) => {
  const categories = await db.all('SELECT * FROM categories ORDER BY name');
  res.json(categories);
});

// Platform stats for activity feed
router.get('/stats', async (_req, res: Response) => {
  const users = await db.get('SELECT COUNT(*) as count FROM users');
  const services = await db.get('SELECT COUNT(*) as count FROM services WHERE is_active = 1');
  const completed = await db.get("SELECT COUNT(*) as count FROM service_requests WHERE status = 'completed'");
  const weekCompleted = await db.get("SELECT COUNT(*) as count FROM service_requests WHERE status = 'completed' AND completed_at > NOW() - INTERVAL '7 days'");
  const weekNew = await db.get("SELECT COUNT(*) as count FROM services WHERE created_at > NOW() - INTERVAL '7 days'");
  const totalPoints = await db.get("SELECT COALESCE(SUM(s.points_cost), 0) as total FROM service_requests sr JOIN services s ON sr.service_id = s.id WHERE sr.status = 'completed'");
  res.json({
    total_users: parseInt(users?.count || '0'),
    total_services: parseInt(services?.count || '0'),
    total_completed: parseInt(completed?.count || '0'),
    week_completed: parseInt(weekCompleted?.count || '0'),
    week_new_services: parseInt(weekNew?.count || '0'),
    total_points_exchanged: parseInt(totalPoints?.total || '0'),
  });
});

router.get('/categories/:id/subcategories', async (req: AuthRequest, res: Response) => {
  const subs = await db.all('SELECT * FROM subcategories WHERE category_id = ? ORDER BY name', req.params.id);
  res.json(subs);
});

router.get('/subcategories', async (_req, res: Response) => {
  const subs = await db.all('SELECT s.*, c.name as category_name, c.icon as category_icon FROM subcategories s JOIN categories c ON s.category_id = c.id ORDER BY c.name, s.name');
  res.json(subs);
});

router.get('/calculate-points', async (req: AuthRequest, res: Response) => {
  const { category_id, duration_minutes } = req.query;
  if (!category_id || !duration_minutes) return res.status(400).json({ error: 'category_id and duration_minutes required' });
  const cat = await db.get('SELECT * FROM categories WHERE id = ?', category_id);
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  const hours = Number(duration_minutes) / 60;
  const suggested = Math.round(hours * cat.base_rate * cat.multiplier);
  res.json({ suggested, min: Math.round(suggested * 0.8), max: Math.round(suggested * 1.2), multiplier: cat.multiplier, base_rate: cat.base_rate });
});

router.get('/', async (req: AuthRequest, res: Response) => {
  const { category, subcategory, search, provider, page = '1', sort, lat, lng, radius } = req.query;
  const limit = 20;
  const offset = (parseInt(page as string) - 1) * limit;
  const baseFrom = `FROM services s JOIN categories c ON s.category_id = c.id JOIN users u ON s.provider_id = u.id
    LEFT JOIN subcategories sc ON s.subcategory_id = sc.id WHERE s.is_active = 1 AND s.group_id IS NULL`;
  let where = '';
  const filterParams: any[] = [];
  if (provider) { where += ' AND s.provider_id = ?'; filterParams.push(provider); }
  if (category) { where += ' AND s.category_id = ?'; filterParams.push(category); }
  if (subcategory) { where += ' AND s.subcategory_id = ?'; filterParams.push(subcategory); }
  if (search) { where += ' AND (s.title ILIKE ? OR s.description ILIKE ?)'; filterParams.push(`%${search}%`, `%${search}%`); }

  const countRes = await db.get('SELECT COUNT(*) as total ' + baseFrom + where, ...filterParams);
  const total = parseInt(countRes?.total || '0');

  let orderBy = ' ORDER BY s.created_at DESC';
  if (sort === 'price_low') orderBy = ' ORDER BY s.points_cost ASC';
  else if (sort === 'price_high') orderBy = ' ORDER BY s.points_cost DESC';
  else if (sort === 'rating') orderBy = ' ORDER BY avg_rating DESC NULLS LAST';

  const selectCols = `SELECT s.*, c.name as category_name, c.icon as category_icon, c.multiplier,
    u.username as provider_name, u.city as provider_city, u.id as provider_user_id, u.latitude as provider_latitude, u.longitude as provider_longitude, u.avatar as provider_avatar, sc.name as subcategory_name,
    (SELECT AVG(r.rating) FROM reviews r JOIN service_requests sr ON r.request_id = sr.id WHERE sr.service_id = s.id) as avg_rating `;
  const services = await db.all(selectCols + baseFrom + where + orderBy + ' LIMIT ? OFFSET ?', ...filterParams, limit, offset);
  res.json({ services, total, page: parseInt(page as string), totalPages: Math.ceil(total / limit) });
});
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const service = await db.get(`SELECT s.*, c.name as category_name, c.icon as category_icon, c.multiplier, c.base_rate,
    u.username as provider_name, u.id as provider_id, u.bio as provider_bio, sc.name as subcategory_name,
    (SELECT AVG(r.rating) FROM reviews r JOIN service_requests sr ON r.request_id = sr.id WHERE sr.service_id = s.id) as avg_rating,
    (SELECT COUNT(r.id) FROM reviews r JOIN service_requests sr ON r.request_id = sr.id WHERE sr.service_id = s.id) as review_count,
    (SELECT COUNT(*) FROM service_requests sr2 WHERE sr2.service_id = s.id) as total_requests,
    (SELECT COUNT(*) FROM service_requests sr3 WHERE sr3.service_id = s.id AND sr3.status = 'completed') as total_completed
    FROM services s JOIN categories c ON s.category_id = c.id JOIN users u ON s.provider_id = u.id
    LEFT JOIN subcategories sc ON s.subcategory_id = sc.id WHERE s.id = ?`, req.params.id);
  if (!service) return res.status(404).json({ error: 'Service not found' });
  const reviews = await db.all('SELECT r.*, u.username as reviewer_name FROM reviews r JOIN users u ON r.reviewer_id = u.id JOIN service_requests sr ON r.request_id = sr.id WHERE sr.service_id = ? AND (r.is_hidden = false OR r.is_hidden IS NULL) ORDER BY r.created_at DESC', req.params.id);
  res.json({ ...service, reviews });
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { title, description, category_id, subcategory_id, points_cost, duration_minutes, image } = req.body;
  if (!title || !description || !category_id) return res.status(400).json({ error: 'Title, description, and category are required' });
  if (image && image.length > 2_800_000) return res.status(400).json({ error: 'Image too large (max 2MB)' });
  let finalPoints = points_cost;
  if (!finalPoints) {
    const cat = await db.get('SELECT * FROM categories WHERE id = ?', category_id);
    finalPoints = cat ? Math.round(((duration_minutes || 60) / 60) * cat.base_rate * cat.multiplier) : 10;
  }
  // Apply bundle discount if applicable
  if (req.body.is_bundle && req.body.sessions_count > 1 && req.body.bundle_discount > 0) {
    finalPoints = Math.round(finalPoints * req.body.sessions_count * (1 - req.body.bundle_discount / 100));
  }
  const result = await db.run('INSERT INTO services (provider_id, category_id, subcategory_id, title, description, points_cost, duration_minutes, is_bundle, sessions_count, bundle_discount, group_id, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    req.userId, category_id, subcategory_id || null, title, description, finalPoints, duration_minutes || 60, req.body.is_bundle || false, req.body.sessions_count || 1, req.body.bundle_discount || 0, req.body.group_id || null, image || null);
  res.status(201).json({ id: result.lastInsertRowid, message: 'Service created' });
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const service = await db.get('SELECT * FROM services WHERE id = ? AND provider_id = ?', req.params.id, req.userId);
  if (!service) return res.status(404).json({ error: 'Service not found or not yours' });
  const { title, description, category_id, subcategory_id, points_cost, duration_minutes, is_active, image } = req.body;
  if (image !== undefined) {
    if (image && image.length > 2_800_000) return res.status(400).json({ error: 'Image too large (max 2MB)' });
    await db.run('UPDATE services SET image = ? WHERE id = ?', image || null, req.params.id);
  }
  await db.run('UPDATE services SET title = COALESCE(?, title), description = COALESCE(?, description), category_id = COALESCE(?, category_id), subcategory_id = COALESCE(?, subcategory_id), points_cost = COALESCE(?, points_cost), duration_minutes = COALESCE(?, duration_minutes), is_active = COALESCE(?, is_active) WHERE id = ?',
    title, description, category_id, subcategory_id, points_cost, duration_minutes, is_active, req.params.id);
  res.json({ message: 'Service updated' });
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = await db.run('DELETE FROM services WHERE id = ? AND provider_id = ?', req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Service not found or not yours' });
  res.json({ message: 'Service deleted' });
});

// Favorite a service
router.post('/:id/favorite', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await db.run('INSERT INTO favorites (user_id, service_id) VALUES (?, ?)', req.userId, req.params.id);
    res.status(201).json({ message: 'Favorited' });
  } catch { res.status(409).json({ error: 'Already favorited' }); }
});

// Unfavorite
router.delete('/:id/favorite', authMiddleware, async (req: AuthRequest, res: Response) => {
  await db.run('DELETE FROM favorites WHERE user_id = ? AND service_id = ?', req.userId, req.params.id);
  res.json({ message: 'Unfavorited' });
});

// Get my favorites
router.get('/user/favorites', authMiddleware, async (req: AuthRequest, res: Response) => {
  const favs = await db.all('SELECT s.*, c.name as category_name, c.icon as category_icon, u.username as provider_name FROM favorites f JOIN services s ON f.service_id = s.id JOIN categories c ON s.category_id = c.id JOIN users u ON s.provider_id = u.id WHERE f.user_id = ? ORDER BY f.created_at DESC', req.userId);
  res.json(favs);
});

// Check if I favorited a service
router.get('/:id/favorited', authMiddleware, async (req: AuthRequest, res: Response) => {
  const fav = await db.get('SELECT id FROM favorites WHERE user_id = ? AND service_id = ?', req.userId, req.params.id);
  res.json({ favorited: !!fav });
});

// Nearby services — location-based search
router.get('/nearby', async (req: AuthRequest, res: Response) => {
  const { lat, lng, radius = '50' } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });
  const maxDist = Number(radius);
  const services = await db.all(
    `SELECT s.*, c.name as category_name, c.icon as category_icon,
      u.username as provider_name, u.city as provider_city, u.id as provider_user_id, u.avatar as provider_avatar, u.latitude as provider_latitude, u.longitude as provider_longitude,
      (6371 * acos(LEAST(1.0, cos(radians($1)) * cos(radians(u.latitude)) * cos(radians(u.longitude) - radians($2)) + sin(radians($1)) * sin(radians(u.latitude))))) as distance
    FROM services s JOIN categories c ON s.category_id = c.id JOIN users u ON s.provider_id = u.id
    WHERE s.is_active = 1 AND s.group_id IS NULL AND u.latitude IS NOT NULL AND u.longitude IS NOT NULL
      AND (6371 * acos(LEAST(1.0, cos(radians($1)) * cos(radians(u.latitude)) * cos(radians(u.longitude) - radians($2)) + sin(radians($1)) * sin(radians(u.latitude))))) < $3
    ORDER BY distance ASC LIMIT 30`,
    Number(lat), Number(lng), maxDist
  );
  res.json(services);
});

// Popular services this week
router.get('/trending/popular', async (_req, res: Response) => {
  const services = await db.all("SELECT s.*, c.name as category_name, c.icon as category_icon, u.username as provider_name, u.city as provider_city, COUNT(sr.id) as request_count, (SELECT AVG(r.rating) FROM reviews r JOIN service_requests sr2 ON r.request_id = sr2.id WHERE sr2.service_id = s.id) as avg_rating FROM services s JOIN categories c ON s.category_id = c.id JOIN users u ON s.provider_id = u.id LEFT JOIN service_requests sr ON sr.service_id = s.id AND sr.created_at > NOW() - INTERVAL '7 days' WHERE s.is_active = 1 AND s.group_id IS NULL GROUP BY s.id, c.name, c.icon, u.username, u.city ORDER BY request_count DESC, s.created_at DESC LIMIT 10");
  res.json(services);
});

export default router;
