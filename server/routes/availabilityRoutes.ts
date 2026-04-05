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

  const bookedQuery = 'SELECT b.start_time, b.end_time FROM bookings b JOIN service_requests sr ON b.request_id = sr.id JOIN services s ON sr.service_id = s.id WHERE s.provider_id = ? AND b.booked_date = ? AND sr.status != ?';
  const booked = await db.all(bookedQuery, service.provider_id, date, 'cancelled');

  const available = availSlots.filter((slot: any) => {
    return !booked.some((b: any) => b.start_time === slot.start_time);
  });

  res.json(available);
});

// Book a slot when creating a request (supports recurring)
router.post('/book', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { request_id, booked_date, start_time, end_time, is_recurring, recurrence, recurrence_end } = req.body;
  if (!request_id || !booked_date || !start_time || !end_time) return res.status(400).json({ error: 'All fields required' });

  if (is_recurring && recurrence && recurrence_end) {
    // Create multiple bookings for recurring schedule
    const start = new Date(booked_date);
    const end = new Date(recurrence_end);
    const intervalDays = recurrence === 'weekly' ? 7 : recurrence === 'biweekly' ? 14 : 30;
    let current = new Date(start);
    let count = 0;
    while (current <= end && count < 52) {
      const dateStr = current.toISOString().split('T')[0];
      await db.run('INSERT INTO bookings (request_id, booked_date, start_time, end_time, is_recurring, recurrence, recurrence_end) VALUES (?, ?, ?, ?, ?, ?, ?)',
        request_id, dateStr, start_time, end_time, true, recurrence, recurrence_end);
      current.setDate(current.getDate() + intervalDays);
      count++;
    }
    res.status(201).json({ message: `${count} recurring bookings created` });
  } else {
    await db.run('INSERT INTO bookings (request_id, booked_date, start_time, end_time) VALUES (?, ?, ?, ?)', request_id, booked_date, start_time, end_time);
    res.status(201).json({ message: 'Slot booked' });
  }
});

// Get booking for a request
router.get('/booking/:requestId', async (req: AuthRequest, res: Response) => {
  const booking = await db.get('SELECT * FROM bookings WHERE request_id = ?', req.params.requestId);
  res.json(booking || null);
});

// Get upcoming bookings for the logged-in user
router.get('/upcoming', authMiddleware, async (req: AuthRequest, res: Response) => {
  const today = new Date().toISOString().split('T')[0];
  const bookings = await db.all(
    `SELECT b.*, sr.id as request_id, sr.status, s.title as service_title, s.id as service_id,
      p.username as provider_name, p.id as provider_id,
      r.username as requester_name, r.id as requester_id
    FROM bookings b
    JOIN service_requests sr ON b.request_id = sr.id
    JOIN services s ON sr.service_id = s.id
    JOIN users p ON s.provider_id = p.id
    JOIN users r ON sr.requester_id = r.id
    WHERE (s.provider_id = $1 OR sr.requester_id = $1)
    AND b.booked_date >= $2
    AND sr.status IN ('accepted', 'delivered')
    ORDER BY b.booked_date, b.start_time
    LIMIT 10`,
    req.userId, today
  );
  res.json(bookings);
});

// Get provider's next available day (for browse card badges)
router.get('/next-available/:userId', async (req: AuthRequest, res: Response) => {
  const slots = await db.all('SELECT day_of_week FROM availability WHERE user_id = ? ORDER BY day_of_week', req.params.userId);
  if (slots.length === 0) return res.json({ next: null });
  const today = new Date().getDay();
  const days = slots.map((s: any) => s.day_of_week);
  // Find next available day from today
  for (let i = 0; i < 7; i++) {
    const check = (today + i) % 7;
    if (days.includes(check)) {
      if (i === 0) return res.json({ next: 'today' });
      if (i === 1) return res.json({ next: 'tomorrow' });
      const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return res.json({ next: names[check] });
    }
  }
  res.json({ next: null });
});

export default router;
