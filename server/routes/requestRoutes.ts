import { Router, Response } from 'express';
import db from '../database';
import { authMiddleware, AuthRequest } from '../auth';
import { notify, notificationEmailHtml } from '../notify';

const router = Router();

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { service_id, message } = req.body;
  if (!service_id) return res.status(400).json({ error: 'service_id is required' });
  // Gate: must offer at least 1 service before requesting
  const myServices = await db.get('SELECT COUNT(*) as c FROM services WHERE provider_id = ? AND is_active = 1', req.userId);
  if (parseInt(myServices?.c || '0') === 0) {
    return res.status(403).json({ error: 'You need to offer at least one service before requesting. Give first, then get help back!' });
  }
  const service = await db.get('SELECT * FROM services WHERE id = ? AND is_active = 1', service_id);
  if (!service) return res.status(404).json({ error: 'Service not found' });
  if (service.provider_id === req.userId) return res.status(400).json({ error: 'Cannot request your own service' });
  const user = await db.get('SELECT points FROM users WHERE id = ?', req.userId);
  if (user.points < service.points_cost) return res.status(400).json({ error: 'Not enough points' });
  const result = await db.run('INSERT INTO service_requests (service_id, requester_id, message) VALUES (?, ?, ?)', service_id, req.userId, message || '');
  const provider = await db.get('SELECT id, email, username FROM users WHERE id = ?', service.provider_id);
  if (provider) { await notify({ userId: provider.id, type: 'new_request', title: 'New service request', body: 'Someone requested your service: ' + service.title, link: '/dashboard', email: { to: provider.email, subject: 'New request on Boomerang', html: notificationEmailHtml('New Service Request', 'Someone wants your help with: ' + service.title, '') } }); }
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
  await db.run("UPDATE service_requests SET status = 'accepted' WHERE id = ?", req.params.id);
  const requesterAccept = await db.get('SELECT id, email FROM users WHERE id = ?', r.requester_id);
  if (requesterAccept) { await notify({ userId: requesterAccept.id, type: 'request_accepted', title: 'Request accepted!', body: 'Your service request has been accepted.', link: '/dashboard' }); }
  res.json({ message: 'Request accepted' });
});

// Provider marks service as delivered
router.put('/:id/deliver', authMiddleware, async (req: AuthRequest, res: Response) => {
  const r = await db.get('SELECT sr.*, s.provider_id FROM service_requests sr JOIN services s ON sr.service_id = s.id WHERE sr.id = ?', req.params.id);
  if (!r) return res.status(404).json({ error: 'Request not found' });
  if (r.provider_id !== req.userId) return res.status(403).json({ error: 'Not your service' });
  if (r.status !== 'accepted') return res.status(400).json({ error: 'Request must be accepted first' });
  await db.run("UPDATE service_requests SET status = 'delivered' WHERE id = ?", req.params.id);
  const requesterDeliver = await db.get('SELECT id, email FROM users WHERE id = ?', r.requester_id);
  if (requesterDeliver) { await notify({ userId: requesterDeliver.id, type: 'service_delivered', title: 'Service delivered!', body: 'The provider marked your service as delivered. Please confirm.', link: '/dashboard' }); }
  res.json({ message: 'Service marked as delivered. Waiting for requester confirmation.' });
});

// Requester confirms delivery -> triggers point transfer (in a transaction)
router.put('/:id/confirm', authMiddleware, async (req: AuthRequest, res: Response) => {
  const r = await db.get('SELECT sr.*, s.provider_id, s.points_cost FROM service_requests sr JOIN services s ON sr.service_id = s.id WHERE sr.id = ?', req.params.id);
  if (!r) return res.status(404).json({ error: 'Request not found' });
  if (r.requester_id !== req.userId) return res.status(403).json({ error: 'Only the requester can confirm' });
  if (r.status !== 'delivered') return res.status(400).json({ error: 'Service must be marked as delivered first' });

  try {
    await db.transaction(async (tx) => {
      const requester = await tx.get('SELECT points FROM users WHERE id = ?', r.requester_id);
      if (requester.points < r.points_cost) throw new Error('Not enough points');
      await tx.run('UPDATE users SET points = points - ? WHERE id = ?', r.points_cost, r.requester_id);
      await tx.run('UPDATE users SET points = points + ? WHERE id = ?', r.points_cost, r.provider_id);
      await tx.run("UPDATE service_requests SET status = 'completed', completed_at = NOW() WHERE id = ?", req.params.id);
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Transfer failed' });
  }

  const providerConfirm = await db.get('SELECT id, email FROM users WHERE id = ?', r.provider_id);
  if (providerConfirm) { await notify({ userId: providerConfirm.id, type: 'delivery_confirmed', title: 'Delivery confirmed!', body: 'Points have been transferred to your account.', link: '/dashboard' }); }
  res.json({ message: 'Delivery confirmed! Points transferred.' });
});

// Requester disputes delivery
router.put('/:id/dispute', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { reason } = req.body;
  const r = await db.get('SELECT sr.*, s.provider_id, s.title FROM service_requests sr JOIN services s ON sr.service_id = s.id WHERE sr.id = ?', req.params.id);
  if (!r) return res.status(404).json({ error: 'Request not found' });
  if (r.requester_id !== req.userId) return res.status(403).json({ error: 'Only the requester can dispute' });
  if (r.status !== 'delivered') return res.status(400).json({ error: 'Can only dispute delivered services' });
  await db.run("UPDATE service_requests SET status = 'disputed', dispute_reason = ? WHERE id = ?", reason || null, req.params.id);
  // Notify provider
  const requester = await db.get('SELECT username FROM users WHERE id = ?', req.userId);
  await notify({ userId: r.provider_id, type: 'dispute', title: 'Dispute opened', body: `${requester?.username} disputed "${r.title}". Please respond.`, link: '/dashboard' });
  res.json({ message: 'Dispute opened' });
});

// Either party can propose resolution, but only requester can confirm completion on disputed
router.put('/:id/resolve', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { resolution } = req.body; // 'complete' or 'cancel'
  const r = await db.get('SELECT sr.*, s.provider_id, s.points_cost, s.title FROM service_requests sr JOIN services s ON sr.service_id = s.id WHERE sr.id = ?', req.params.id);
  if (!r) return res.status(404).json({ error: 'Request not found' });
  if (r.requester_id !== req.userId && r.provider_id !== req.userId) return res.status(403).json({ error: 'Not authorized' });
  if (r.status !== 'disputed') return res.status(400).json({ error: 'Can only resolve disputed requests' });

  const isRequester = r.requester_id === req.userId;

  if (resolution === 'complete') {
    // Only the requester (who disputed) can agree to complete — they're releasing the points
    if (!isRequester) return res.status(403).json({ error: 'Only the requester can confirm completion on a dispute' });
    await db.transaction(async (client: any) => {
      await client.query('UPDATE users SET points = points - $1 WHERE id = $2', [r.points_cost, r.requester_id]);
      await client.query('UPDATE users SET points = points + $1 WHERE id = $2', [r.points_cost, r.provider_id]);
      await client.query("UPDATE service_requests SET status = 'completed', completed_at = NOW() WHERE id = $1", [req.params.id]);
    });
    await notify({ userId: r.provider_id, type: 'dispute_resolved', title: 'Dispute resolved', body: `"${r.title}" was completed. Points transferred.`, link: '/dashboard' });
    res.json({ message: 'Resolved as completed. Points transferred.' });
  } else if (resolution === 'cancel') {
    // Either party can agree to cancel — no points move
    await db.run("UPDATE service_requests SET status = 'cancelled' WHERE id = ?", req.params.id);
    const otherUserId = isRequester ? r.provider_id : r.requester_id;
    await notify({ userId: otherUserId, type: 'dispute_resolved', title: 'Dispute resolved', body: `"${r.title}" was cancelled. No points transferred.`, link: '/dashboard' });
    res.json({ message: 'Resolved as cancelled. No points transferred.' });
  } else {
    res.status(400).json({ error: 'Resolution must be "complete" or "cancel"' });
  }
});

// Admin can force-resolve any dispute
router.put('/:id/admin-resolve', authMiddleware, async (req: AuthRequest, res: Response) => {
  const admin = await db.get('SELECT is_admin FROM users WHERE id = ?', req.userId);
  if (!admin?.is_admin) return res.status(403).json({ error: 'Admin only' });
  const { resolution } = req.body;
  const r = await db.get('SELECT sr.*, s.provider_id, s.points_cost FROM service_requests sr JOIN services s ON sr.service_id = s.id WHERE sr.id = ?', req.params.id);
  if (!r) return res.status(404).json({ error: 'Request not found' });

  if (resolution === 'complete') {
    await db.transaction(async (client: any) => {
      await client.query('UPDATE users SET points = points - $1 WHERE id = $2', [r.points_cost, r.requester_id]);
      await client.query('UPDATE users SET points = points + $1 WHERE id = $2', [r.points_cost, r.provider_id]);
      await client.query("UPDATE service_requests SET status = 'completed', completed_at = NOW() WHERE id = $1", [req.params.id]);
    });
  } else {
    await db.run("UPDATE service_requests SET status = 'cancelled' WHERE id = ?", req.params.id);
  }
  // Notify both parties
  await notify({ userId: r.requester_id, type: 'dispute_resolved', title: 'Dispute resolved', body: `An admin resolved the dispute as ${resolution}d.`, link: '/dashboard' });
  await notify({ userId: r.provider_id, type: 'dispute_resolved', title: 'Dispute resolved', body: `An admin resolved the dispute as ${resolution}d.`, link: '/dashboard' });
  res.json({ message: `Admin resolved as ${resolution}` });
});

// Nudge — send a reminder to the other party (rate limited: once per 24h per request)
router.post('/:id/nudge', authMiddleware, async (req: AuthRequest, res: Response) => {
  const r = await db.get('SELECT sr.*, s.provider_id, s.title FROM service_requests sr JOIN services s ON sr.service_id = s.id WHERE sr.id = ?', req.params.id);
  if (!r) return res.status(404).json({ error: 'Request not found' });
  if (r.requester_id !== req.userId && r.provider_id !== req.userId) return res.status(403).json({ error: 'Not authorized' });
  if (!['pending', 'accepted', 'delivered'].includes(r.status)) return res.status(400).json({ error: 'Cannot nudge on this status' });
  // Rate limit: check last nudge
  const lastNudge = await db.get("SELECT created_at FROM notifications WHERE user_id = $1 AND type = 'nudge' AND link = $2 AND created_at > NOW() - INTERVAL '24 hours'",
    r.requester_id === req.userId ? r.provider_id : r.requester_id, '/dashboard');
  if (lastNudge) return res.status(429).json({ error: 'Already nudged in the last 24 hours' });
  const sender = await db.get('SELECT username FROM users WHERE id = ?', req.userId);
  const targetId = r.requester_id === req.userId ? r.provider_id : r.requester_id;
  const action = r.status === 'pending' ? 'respond to' : r.status === 'delivered' ? 'confirm' : 'complete';
  await notify({ userId: targetId, type: 'nudge', title: 'Friendly reminder', body: `${sender?.username} is waiting for you to ${action} "${r.title}"`, link: '/dashboard' });
  res.json({ message: 'Nudge sent!' });
});

router.put('/:id/cancel', authMiddleware, async (req: AuthRequest, res: Response) => {
  const r = await db.get('SELECT sr.*, s.provider_id FROM service_requests sr JOIN services s ON sr.service_id = s.id WHERE sr.id = ?', req.params.id);
  if (!r) return res.status(404).json({ error: 'Request not found' });
  if (r.requester_id !== req.userId && r.provider_id !== req.userId) return res.status(403).json({ error: 'Not authorized' });
  if (r.status === 'completed') return res.status(400).json({ error: 'Cannot cancel a completed request' });
  await db.run("UPDATE service_requests SET status = 'cancelled' WHERE id = ?", req.params.id);
  res.json({ message: 'Request cancelled' });
});

// Messages for a request
router.get('/:id/messages', authMiddleware, async (req: AuthRequest, res: Response) => {
  const r = await db.get('SELECT sr.*, s.provider_id FROM service_requests sr JOIN services s ON sr.service_id = s.id WHERE sr.id = ?', req.params.id);
  if (!r) return res.status(404).json({ error: 'Request not found' });
  if (r.requester_id !== req.userId && r.provider_id !== req.userId) return res.status(403).json({ error: 'Not authorized' });
  const messages = await db.all('SELECT m.*, u.username as sender_name FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.request_id = ? ORDER BY m.created_at ASC', req.params.id);
  res.json(messages);
});

router.post('/:id/messages', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { body } = req.body;
  if (!body || !body.trim()) return res.status(400).json({ error: 'Message cannot be empty' });
  const r = await db.get('SELECT sr.*, s.provider_id FROM service_requests sr JOIN services s ON sr.service_id = s.id WHERE sr.id = ?', req.params.id);
  if (!r) return res.status(404).json({ error: 'Request not found' });
  if (r.requester_id !== req.userId && r.provider_id !== req.userId) return res.status(403).json({ error: 'Not authorized' });
  if (r.status === 'pending' || r.status === 'cancelled') return res.status(400).json({ error: 'Cannot message on this request' });
  const result = await db.run('INSERT INTO messages (request_id, sender_id, body) VALUES (?, ?, ?)', req.params.id, req.userId, body.trim());
  res.status(201).json({ id: result.lastInsertRowid, message: 'Message sent' });
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

// Hide/unhide a review (provider can hide reviews on their services)
router.put('/reviews/:reviewId/hide', authMiddleware, async (req: AuthRequest, res: Response) => {
  const review = await db.get(`SELECT r.*, sr.service_id, s.provider_id FROM reviews r 
    JOIN service_requests sr ON r.request_id = sr.id JOIN services s ON sr.service_id = s.id WHERE r.id = ?`, req.params.reviewId);
  if (!review) return res.status(404).json({ error: 'Review not found' });
  if (review.provider_id !== req.userId) return res.status(403).json({ error: 'Only the service provider can hide reviews' });
  const { hidden } = req.body;
  await db.run('UPDATE reviews SET is_hidden = ? WHERE id = ?', !!hidden, req.params.reviewId);
  res.json({ message: hidden ? 'Review hidden' : 'Review visible' });
});

// Edit own review
router.put('/reviews/:reviewId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const review = await db.get('SELECT * FROM reviews WHERE id = ? AND reviewer_id = ?', req.params.reviewId, req.userId);
  if (!review) return res.status(404).json({ error: 'Review not found or not yours' });
  const { rating, comment } = req.body;
  if (rating && (rating < 1 || rating > 5)) return res.status(400).json({ error: 'Rating must be 1-5' });
  await db.run('UPDATE reviews SET rating = COALESCE($1, rating), comment = COALESCE($2, comment) WHERE id = $3',
    rating || null, comment !== undefined ? comment : null, req.params.reviewId);
  res.json({ message: 'Review updated' });
});

// Delete own review
router.delete('/reviews/:reviewId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = await db.run('DELETE FROM reviews WHERE id = ? AND reviewer_id = ?', req.params.reviewId, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Review not found or not yours' });
  res.json({ message: 'Review deleted' });
});

// Provider replies to a review
router.post('/reviews/:reviewId/reply', authMiddleware, async (req: AuthRequest, res: Response) => {
  const review = await db.get(`SELECT r.*, s.provider_id FROM reviews r
    JOIN service_requests sr ON r.request_id = sr.id JOIN services s ON sr.service_id = s.id WHERE r.id = ?`, req.params.reviewId);
  if (!review) return res.status(404).json({ error: 'Review not found' });
  if (review.provider_id !== req.userId) return res.status(403).json({ error: 'Only the service provider can reply' });
  const { reply } = req.body;
  if (!reply?.trim()) return res.status(400).json({ error: 'Reply cannot be empty' });
  await db.run('UPDATE reviews SET provider_reply = $1, provider_reply_at = NOW() WHERE id = $2', reply.trim(), req.params.reviewId);
  res.json({ message: 'Reply posted' });
});

export default router;
