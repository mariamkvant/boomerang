import { Router, Response } from 'express';
import db from '../database';
import { authMiddleware, AuthRequest } from '../auth';

const router = Router();

router.get('/categories', async (_req, res: Response) => {
  const categories = await db.all('SELECT * FROM categories ORDER BY name');
  res.json(categories);
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
  const { category, subcategory, search, page = '1' } = req.query;
  const limit = 20;
  const offset = (parseInt(page as string) - 1) * limit;
  let query = `SELECT s.*, c.name as category_name, c.icon as category_icon, c.multiplier,
    u.username as provider_name, u.city as provider_city, sc.name as subcategory_name,
    (SELECT AVG(r.rating) FROM reviews r JOIN service_requests sr ON r.request_id = sr.id WHERE sr.service_id = s.id) as avg_rating
    FROM services s JOIN categories c ON s.category_id = c.id JOIN users u ON s.provider_id = u.id
    LEFT JOIN subcategories sc ON s.subcategory_id = sc.id WHERE s.is_active = 1`;
  const params: any[] = [];
  let n = 0;
  if (category) { query += ` AND s.category_id = $${++n}`; params.push(category); }
  if (subcategory) { query += ` AND s.subcategory_id = $${++n}`; params.push(subcategory); }
  if (search) { query += ` AND (s.title ILIKE $${++n} OR s.description ILIKE $${++n})`; params.push(`%${search}%`, `%${search}%`); n++; }
  query += ` ORDER BY s.created_at DESC LIMIT $${++n} OFFSET $${++n}`;
  params.push(limit, offset);
  const services = await db.all(query, ...params);
  res.json(services);
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const service = await db.get(`SELECT s.*, c.name as category_name, c.icon as category_icon, c.multiplier, c.base_rate,
    u.username as provider_name, u.id as provider_id, u.bio as provider_bio, sc.name as subcategory_name,
    (SELECT AVG(r.rating) FROM reviews r JOIN service_requests sr ON r.request_id = sr.id WHERE sr.service_id = s.id) as avg_rating,
    (SELECT COUNT(r.id) FROM reviews r JOIN service_requests sr ON r.request_id = sr.id WHERE sr.service_id = s.id) as review_count
    FROM services s JOIN categories c ON s.category_id = c.id JOIN users u ON s.provider_id = u.id
    LEFT JOIN subcategories sc ON s.subcategory_id = sc.id WHERE s.id = ?`, req.params.id);
  if (!service) return res.status(404).json({ error: 'Service not found' });
  const reviews = await db.all('SELECT r.*, u.username as reviewer_name FROM reviews r JOIN users u ON r.reviewer_id = u.id JOIN service_requests sr ON r.request_id = sr.id WHERE sr.service_id = ? ORDER BY r.created_at DESC', req.params.id);
  res.json({ ...service, reviews });
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { title, description, category_id, subcategory_id, points_cost, duration_minutes } = req.body;
  if (!title || !description || !category_id) return res.status(400).json({ error: 'Title, description, and category are required' });
  let finalPoints = points_cost;
  if (!finalPoints) {
    const cat = await db.get('SELECT * FROM categories WHERE id = ?', category_id);
    finalPoints = cat ? Math.round(((duration_minutes || 60) / 60) * cat.base_rate * cat.multiplier) : 10;
  }
  const result = await db.run('INSERT INTO services (provider_id, category_id, subcategory_id, title, description, points_cost, duration_minutes) VALUES (?, ?, ?, ?, ?, ?, ?)',
    req.userId, category_id, subcategory_id || null, title, description, finalPoints, duration_minutes || 60);
  res.status(201).json({ id: result.lastInsertRowid, message: 'Service created' });
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const service = await db.get('SELECT * FROM services WHERE id = ? AND provider_id = ?', req.params.id, req.userId);
  if (!service) return res.status(404).json({ error: 'Service not found or not yours' });
  const { title, description, category_id, subcategory_id, points_cost, duration_minutes, is_active } = req.body;
  await db.run('UPDATE services SET title = COALESCE(?, title), description = COALESCE(?, description), category_id = COALESCE(?, category_id), subcategory_id = COALESCE(?, subcategory_id), points_cost = COALESCE(?, points_cost), duration_minutes = COALESCE(?, duration_minutes), is_active = COALESCE(?, is_active) WHERE id = ?',
    title, description, category_id, subcategory_id, points_cost, duration_minutes, is_active, req.params.id);
  res.json({ message: 'Service updated' });
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = await db.run('DELETE FROM services WHERE id = ? AND provider_id = ?', req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Service not found or not yours' });
  res.json({ message: 'Service deleted' });
});

export default router;
