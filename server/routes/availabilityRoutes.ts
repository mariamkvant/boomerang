import { Router, Response } from 'express';
import db from '../database';
import { authMiddleware, AuthRequest } from '../auth';

const router = Router();

// Get my availability
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const slots = await db.all('SELECT * FROM availability WHERE user_id = ? ORDER BY day_of_week, start_time', req.userId);
  res.json(slots);
});

// Set my availability (replace all slots)
router.put('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { slots } = req.body;
  if (!Array.isArray(slots)) return res.status(400).json({ error: 'slots array required' });
  await db.run('DELETE FROM availability WHERE user_id = ?', req.userId);
  for (const s of slots) {
    if (s.day_of_week == null || !s.start_time || !s.end_time) continue;
    await db.run('INSERT INTO availability (user_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)',
      req.userId, s.day_of_week, s.start_time, s.end_time);
  }
  res.json({ message: 'Availability updated' });
});

// Get a user's availability (public)
router.get('/user/:id', async (req: AuthRequest, res: Response) => {
  const slots = await db.all('SELECT day_of_week, start_time, end_time FROM availability WHERE user_id = ? ORDER BY day_of_week, start_time', req.params.id);
  res.json(slots);
});

// Get available slots for a specific service on a specific date
router.get('/slots', async (req: AuthRequest, res: Response) => {
  const { service_id, date } = req.query;
  if (!service_id || !date) return res.status(400).json({ error: 'service_id and date required' });

  const service = await db.get('SELECT s.*, u.id as provider_id FROM services s JOIN users u ON s.provider_id = u.id WHERE s.id = ?', service_id);
  if (!service) return res.status(404).json({ error: 'Service not found' });

  const dayOfWeek = new Date(date as string).getDay();
  const availSlots = await db.all('SELECT start_time, end_time FROM availability WHERE user_id = ? AND day_of_week = ? ORDER BY start_time', service.provider_id, dayOfWeek);

  // Get already booked slots for that date
  const booked = await db.all(SELECT b.start_time, b.end_time FROM bookings b
    JOIN service_requests sr ON b.request_id = sr.id
    JOIN services s ON sr.service_id = s.id
    WHERE s.provider_id = ? AND b.booked_date = ? AND sr.status NOT IN ('cancelled'), service.provider_id, date);

  // Filter out booked times
  const available = availSlots.filter((slot: any) => {
    return !booked.some((b: any) => b.start_time === slot.start_time);
  });

  res.json(available);
});

// Book a slot when creating a request
router.post('/book', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { request_id, booked_date, start_time, end_time } = req.body;
  if (!request_id || !booked_date || !start_time || !end_time) return res.status(400).json({ error: 'All fields required' });
  await db.run('INSERT INTO bookings (request_id, booked_date, start_time, end_time) VALUES (?, ?, ?, ?)', request_id, booked_date, start_time, end_time);
  res.status(201).json({ message: 'Slot booked' });
});

// Get booking for a request
router.get('/booking/:requestId', async (req: AuthRequest, res: Response) => {
  const booking = await db.get('SELECT * FROM bookings WHERE request_id = ?', req.params.requestId);
  res.json(booking || null);
});

export default router;
