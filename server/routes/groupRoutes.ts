import { Router, Response } from 'express';
import db from '../database';
import { authMiddleware, AuthRequest } from '../auth';
import { notify } from '../notify';
import { randomUUID } from 'crypto';

const router = Router();

// Create a group
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { name, description, is_public } = req.body;
  if (!name) return res.status(400).json({ error: 'Group name is required' });
  const inviteCode = Math.random().toString(36).substring(2, 10);
  try {
    const result = await db.run(
      'INSERT INTO groups (name, description, is_public, invite_code, created_by) VALUES (?, ?, ?, ?, ?)',
      name, description || '', is_public !== false, inviteCode, req.userId
    );
    await db.run('INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)', result.lastInsertRowid, req.userId, 'admin');
    res.status(201).json({ id: result.lastInsertRowid, invite_code: inviteCode });
  } catch (err: any) {
    if (err.message?.includes('unique') || err.message?.includes('duplicate')) return res.status(409).json({ error: 'Group name already exists' });
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// List public groups with optional search
router.get('/', async (req: AuthRequest, res: Response) => {
  const { search } = req.query;
  let query = `SELECT g.*, u.username as creator_name,
    (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) as member_count
    FROM groups g JOIN users u ON g.created_by = u.id WHERE g.is_public = true`;
  const params: any[] = [];
  if (search) {
    query += ` AND (g.name ILIKE $1 OR g.description ILIKE $1)`;
    params.push(`%${search}%`);
  }
  query += ' ORDER BY g.created_at DESC';
  const groups = await db.all(query, ...params);
  res.json(groups);
});

// Get my groups
router.get('/mine', authMiddleware, async (req: AuthRequest, res: Response) => {
  const groups = await db.all(`SELECT g.*, gm.role,
    (SELECT COUNT(*) FROM group_members gm2 WHERE gm2.group_id = g.id) as member_count
    FROM groups g JOIN group_members gm ON g.id = gm.group_id WHERE gm.user_id = ?`, req.userId);
  res.json(groups);
});

// Get upcoming public events across all groups (used by Events tab on GroupsPage)
router.get('/events', async (req: AuthRequest, res: Response) => {
  const { lat, lng, radius, from, to } = req.query;

  let conditions = [
    "ga.event_date IS NOT NULL",
    "ga.event_date >= CURRENT_DATE",
    "g.is_public = true",
  ];
  const params: any[] = [];

  if (from) { params.push(from); conditions.push(`ga.event_date >= $${params.length}`); }
  if (to)   { params.push(to);   conditions.push(`ga.event_date <= $${params.length}`); }

  // Proximity filter — use event coords, fall back to group creator's home coords
  let distanceExpr = 'NULL::real as distance_km';
  if (lat && lng && radius) {
    const latN = parseFloat(String(lat));
    const lngN = parseFloat(String(lng));
    const radN = parseFloat(String(radius));
    distanceExpr = `(6371 * acos(GREATEST(-1, LEAST(1,
      cos(radians(${latN})) * cos(radians(COALESCE(ga.event_latitude, uc.latitude))) *
      cos(radians(COALESCE(ga.event_longitude, uc.longitude)) - radians(${lngN})) +
      sin(radians(${latN})) * sin(radians(COALESCE(ga.event_latitude, uc.latitude)))
    )))) as distance_km`;
    conditions.push(`COALESCE(ga.event_latitude, uc.latitude) IS NOT NULL`);
    conditions.push(`(6371 * acos(GREATEST(-1, LEAST(1,
      cos(radians(${latN})) * cos(radians(COALESCE(ga.event_latitude, uc.latitude))) *
      cos(radians(COALESCE(ga.event_longitude, uc.longitude)) - radians(${lngN})) +
      sin(radians(${latN})) * sin(radians(COALESCE(ga.event_latitude, uc.latitude)))
    )))) <= ${radN}`);
  }

  const where = conditions.join(' AND ');
  const events = await db.all(`
    SELECT ga.id, ga.group_id, ga.content, ga.image,
           ga.event_date, ga.event_time, ga.event_location,
           ga.event_latitude, ga.event_longitude,
           ga.max_attendees, ga.ticket_price_eur,
           g.name as group_name, g.id as group_id,
           ua.username as author_name,
           (SELECT COUNT(*) FROM announcement_rsvps ar
            WHERE ar.announcement_id = ga.id
            AND (ar.payment_status = 'free' OR ar.payment_status = 'paid')) as rsvp_count,
           ${distanceExpr}
    FROM group_announcements ga
    JOIN groups g ON ga.group_id = g.id
    JOIN users ua ON ga.author_id = ua.id
    LEFT JOIN users uc ON g.created_by = uc.id
    WHERE ${where}
    ORDER BY ga.event_date ASC, ga.event_time ASC NULLS LAST
    LIMIT 100`, ...params);

  res.json(events);
});

// Get group details
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const group = await db.get(`SELECT g.*, u.username as creator_name,
    (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) as member_count
    FROM groups g JOIN users u ON g.created_by = u.id WHERE g.id = ?`, req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  // Check if requester is a member (via auth header if present)
  let isMember = false;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET || 'skillswap-dev-secret-change-in-production') as { userId: number };
      const membership = await db.get('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?', req.params.id, decoded.userId);
      isMember = !!membership;
    } catch {}
  }

  // Public info: name, description, member count
  const publicInfo = { ...group, members: [], services: [] };

  if (!isMember) {
    return res.json({ ...publicInfo, is_private_content: true });
  }

  // Members-only: full member list and services
  const members = await db.all('SELECT gm.role, u.id, u.username, u.city FROM group_members gm JOIN users u ON gm.user_id = u.id WHERE gm.group_id = ? ORDER BY gm.role DESC, gm.joined_at', req.params.id);
  const services = await db.all(`SELECT s.*, c.name as category_name, c.icon as category_icon, u.username as provider_name
    FROM services s JOIN categories c ON s.category_id = c.id JOIN users u ON s.provider_id = u.id
    WHERE s.group_id = ? AND s.is_active = 1 ORDER BY s.created_at DESC`, req.params.id);
  res.json({ ...group, members, services, is_private_content: false });
});

// Request to join a group
router.post('/:id/join', authMiddleware, async (req: AuthRequest, res: Response) => {
  const group = await db.get('SELECT * FROM groups WHERE id = ?', req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  // Check if already a member
  const existing = await db.get('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?', req.params.id, req.userId);
  if (existing) return res.status(409).json({ error: 'Already a member' });
  // If joining by invite code, add directly
  const { invite_code } = req.body;
  if (invite_code && invite_code === group.invite_code) {
    await db.run('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', req.params.id, req.userId);
    return res.json({ message: 'Joined group' });
  }
  // Otherwise create a join request
  try {
    await db.run("INSERT INTO group_join_requests (group_id, user_id) VALUES (?, ?)", req.params.id, req.userId);
    // Notify admin
    const admin = await db.get("SELECT user_id FROM group_members WHERE group_id = ? AND role = 'admin' LIMIT 1", req.params.id);
    if (admin) {
      const requester = await db.get('SELECT username FROM users WHERE id = ?', req.userId);
      await notify({ userId: admin.user_id, type: 'join_request', title: 'New join request', body: (requester?.username || 'Someone') + ' wants to join ' + group.name, link: '/groups/' + req.params.id });
    }
    res.json({ message: 'Join request sent! The admin will review it.' });
  } catch { res.status(409).json({ error: 'Already requested' }); }
});

// Get pending join requests (admin only)
router.get('/:id/requests', authMiddleware, async (req: AuthRequest, res: Response) => {
  const member = await db.get('SELECT role FROM group_members WHERE group_id = ? AND user_id = ?', req.params.id, req.userId);
  if (!member || member.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const requests = await db.all("SELECT jr.*, u.username, u.city FROM group_join_requests jr JOIN users u ON jr.user_id = u.id WHERE jr.group_id = ? AND jr.status = 'pending' ORDER BY jr.created_at DESC", req.params.id);
  res.json(requests);
});

// Approve join request (admin only)
router.put('/:id/requests/:requestId/approve', authMiddleware, async (req: AuthRequest, res: Response) => {
  const member = await db.get('SELECT role FROM group_members WHERE group_id = ? AND user_id = ?', req.params.id, req.userId);
  if (!member || member.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const jr = await db.get("SELECT * FROM group_join_requests WHERE id = ? AND group_id = ? AND status = 'pending'", req.params.requestId, req.params.id);
  if (!jr) return res.status(404).json({ error: 'Request not found' });
  await db.run('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', req.params.id, jr.user_id);
  await db.run("UPDATE group_join_requests SET status = 'approved' WHERE id = ?", req.params.requestId);
  const group = await db.get('SELECT name FROM groups WHERE id = ?', req.params.id);
  await notify({ userId: jr.user_id, type: 'join_approved', title: 'Welcome!', body: 'You were accepted into ' + (group?.name || 'the group'), link: '/groups/' + req.params.id });
  res.json({ message: 'Approved' });
});

// Deny join request
router.put('/:id/requests/:requestId/deny', authMiddleware, async (req: AuthRequest, res: Response) => {
  const member = await db.get('SELECT role FROM group_members WHERE group_id = ? AND user_id = ?', req.params.id, req.userId);
  if (!member || member.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  await db.run("UPDATE group_join_requests SET status = 'denied' WHERE id = ?", req.params.requestId);
  res.json({ message: 'Denied' });
});

// Public: look up group info by invite code (for share links)
router.get('/invite/:code', async (req: AuthRequest, res: Response) => {
  const group = await db.get(`SELECT g.id, g.name, g.description, u.username as creator_name,
    (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) as member_count
    FROM groups g JOIN users u ON g.created_by = u.id WHERE g.invite_code = ?`, req.params.code);
  if (!group) return res.status(404).json({ error: 'Invalid invite code' });
  res.json(group);
});

// Join by invite code
router.post('/join/:code', authMiddleware, async (req: AuthRequest, res: Response) => {
  const group = await db.get('SELECT * FROM groups WHERE invite_code = ?', req.params.code);
  if (!group) return res.status(404).json({ error: 'Invalid invite code' });
  try {
    await db.run('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', group.id, req.userId);
    res.json({ message: 'Joined group', group_id: group.id });
  } catch { res.status(409).json({ error: 'Already a member' }); }
});

// Leave a group
router.delete('/:id/leave', authMiddleware, async (req: AuthRequest, res: Response) => {
  await db.run('DELETE FROM group_members WHERE group_id = ? AND user_id = ?', req.params.id, req.userId);
  res.json({ message: 'Left group' });
});

// Invite a user by username
router.post('/:id/invite', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Username required' });
  const member = await db.get('SELECT role FROM group_members WHERE group_id = ? AND user_id = ?', req.params.id, req.userId);
  if (!member) return res.status(403).json({ error: 'You must be a member to invite' });
  const invitee = await db.get('SELECT id, username FROM users WHERE username = ?', username);
  if (!invitee) return res.status(404).json({ error: 'User not found' });
  const existing = await db.get('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?', req.params.id, invitee.id);
  if (existing) return res.status(409).json({ error: 'Already a member' });
  await db.run('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', req.params.id, invitee.id);
  const group = await db.get('SELECT name FROM groups WHERE id = ?', req.params.id);
  const inviter = await db.get('SELECT username FROM users WHERE id = ?', req.userId);
  await notify({ userId: invitee.id, type: 'group_invite', title: 'You were added to a group!', body: (inviter?.username || 'Someone') + ' added you to ' + (group?.name || 'a group'), link: '/groups/' + req.params.id });
  res.json({ message: 'User invited' });
});

// Remove a member (admin only)
router.delete('/:id/members/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const member = await db.get('SELECT role FROM group_members WHERE group_id = ? AND user_id = ?', req.params.id, req.userId);
  if (!member || member.role !== 'admin') return res.status(403).json({ error: 'Only admins can remove members' });
  if (Number(req.params.userId) === req.userId) return res.status(400).json({ error: 'Cannot remove yourself' });
  await db.run('DELETE FROM group_members WHERE group_id = ? AND user_id = ?', req.params.id, req.params.userId);
  res.json({ message: 'Member removed' });
});

// Delete a group (group admin or site admin)
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const group = await db.get('SELECT * FROM groups WHERE id = ?', req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  const member = await db.get('SELECT role FROM group_members WHERE group_id = ? AND user_id = ?', req.params.id, req.userId);
  if (!member || member.role !== 'admin') {
    return res.status(403).json({ error: 'Only the community admin can delete this group' });
  }
  // Clean up related data
  await db.run('DELETE FROM group_join_requests WHERE group_id = ?', req.params.id);
  await db.run('DELETE FROM group_members WHERE group_id = ?', req.params.id);
  await db.run('UPDATE services SET group_id = NULL WHERE group_id = ?', req.params.id);
  await db.run('DELETE FROM groups WHERE id = ?', req.params.id);
  res.json({ message: 'Group deleted' });
});

// Update group cover image (admin only)
router.put('/:id/cover', authMiddleware, async (req: AuthRequest, res: Response) => {
  const member = await db.get('SELECT role FROM group_members WHERE group_id = ? AND user_id = ?', req.params.id, req.userId);
  if (!member || member.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { cover_image } = req.body;
  let imageUrl = cover_image;
  if (cover_image && cover_image.startsWith('data:')) {
    try { const { uploadAvatar } = require('../cloudinary'); imageUrl = await uploadAvatar(cover_image); } catch { imageUrl = cover_image; }
  }
  await db.run('UPDATE groups SET cover_image = ? WHERE id = ?', imageUrl, req.params.id);
  res.json({ message: 'Cover updated' });
});

// Post announcement (members, admin can pin)
router.post('/:id/announcements', authMiddleware, async (req: AuthRequest, res: Response) => {
  const member = await db.get('SELECT role FROM group_members WHERE group_id = ? AND user_id = ?', req.params.id, req.userId);
  if (!member) return res.status(403).json({ error: 'Members only' });
  const { content, image, pinned, service_id, event_date, event_time, event_location, max_attendees, ticket_price_eur, event_latitude, event_longitude } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Content required' });
  let imageUrl = image || null;
  if (image && image.startsWith('data:')) {
    try { const { uploadAvatar } = require('../cloudinary'); imageUrl = await uploadAvatar(image); } catch { imageUrl = null; }
  }
  const canPin = member.role === 'admin' && pinned;
  // ticket_price_eur only applies to events; non-event posts ignore it
  const ticketPrice = event_date && ticket_price_eur != null && parseFloat(ticket_price_eur) > 0
    ? parseFloat(ticket_price_eur)
    : null;
  const evLat = event_date && event_latitude ? parseFloat(event_latitude) : null;
  const evLng = event_date && event_longitude ? parseFloat(event_longitude) : null;
  const result = await db.run(
    'INSERT INTO group_announcements (group_id, author_id, content, image, pinned, service_id, event_date, event_time, event_location, max_attendees, ticket_price_eur, event_latitude, event_longitude) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
    req.params.id, req.userId, content.trim(), imageUrl, canPin || false, service_id || null,
    event_date || null, event_time || null, event_location || null, max_attendees || null, ticketPrice, evLat, evLng
  );
  res.status(201).json({ id: result.lastInsertRowid });
});

// Get announcements with RSVP counts and comment counts
router.get('/:id/announcements', async (req: AuthRequest, res: Response) => {
  // Get viewer ID if authenticated
  let viewerId: number | null = null;
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try { const jwt = require('jsonwebtoken'); const d = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET || 'skillswap-dev-secret-change-in-production') as { userId: number }; viewerId = d.userId; } catch {}
  }

  const announcements = await db.all(
    `SELECT ga.*, u.username as author_name, u.avatar as author_avatar,
    s.id as service_id, s.title as service_title, s.points_cost as service_points,
    c.name as service_category, c.icon as service_category_icon,
    su.username as service_provider,
    (SELECT COUNT(*) FROM announcement_rsvps ar WHERE ar.announcement_id = ga.id) as rsvp_count,
    (SELECT COUNT(*) FROM announcement_comments ac WHERE ac.announcement_id = ga.id) as comment_count
    FROM group_announcements ga 
    JOIN users u ON ga.author_id = u.id
    LEFT JOIN services s ON ga.service_id = s.id
    LEFT JOIN categories c ON s.category_id = c.id
    LEFT JOIN users su ON s.provider_id = su.id
    WHERE ga.group_id = ? ORDER BY ga.pinned DESC, ga.created_at DESC LIMIT 50`, req.params.id);

  // Add viewer's RSVP status and ticket info
  if (viewerId) {
    const myRsvps = await db.all(
      'SELECT announcement_id, payment_status, ticket_code FROM announcement_rsvps WHERE user_id = ?',
      viewerId
    );
    const rsvpMap = new Map(myRsvps.map((r: any) => [r.announcement_id, r]));
    return res.json(announcements.map((a: any) => {
      const rsvp = rsvpMap.get(a.id) as any;
      return {
        ...a,
        i_rsvped: !!rsvp,
        my_payment_status: rsvp?.payment_status || null,
        my_ticket_code: rsvp?.ticket_code || null,
      };
    }));
  }
  res.json(announcements);
});

// RSVP to an event — free events: direct insert; paid events: create Stripe PaymentIntent
router.post('/:id/announcements/:annId/rsvp', authMiddleware, async (req: AuthRequest, res: Response) => {
  const member = await db.get('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?', req.params.id, req.userId);
  if (!member) return res.status(403).json({ error: 'Members only' });
  const ann = await db.get('SELECT * FROM group_announcements WHERE id = ? AND group_id = ?', req.params.annId, req.params.id);
  if (!ann) return res.status(404).json({ error: 'Not found' });

  // Check capacity (count only paid/free confirmed RSVPs, not pending)
  if (ann.max_attendees) {
    const count = await db.get(
      "SELECT COUNT(*) as c FROM announcement_rsvps WHERE announcement_id = ? AND (payment_status = 'free' OR payment_status = 'paid')",
      req.params.annId
    );
    if (parseInt(count?.c || '0') >= ann.max_attendees) return res.status(400).json({ error: 'Event is full' });
  }

  const ticketPrice = ann.ticket_price_eur ? parseFloat(ann.ticket_price_eur) : 0;

  // ── FREE event ────────────────────────────────────────────────────────────
  if (ticketPrice <= 0) {
    try {
      await db.run(
        "INSERT INTO announcement_rsvps (announcement_id, user_id, payment_status) VALUES (?, ?, 'free')",
        req.params.annId, req.userId
      );
      return res.json({ message: 'RSVP confirmed', is_paid: false });
    } catch {
      return res.status(409).json({ error: 'Already RSVPed' });
    }
  }

  // ── PAID event ────────────────────────────────────────────────────────────
  // Check the group creator's Stripe Connect account
  const group = await db.get('SELECT created_by FROM groups WHERE id = ?', req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const organiser = await db.get(
    'SELECT stripe_account_id, stripe_account_status, email FROM users WHERE id = ?',
    group.created_by
  );
  if (!organiser?.stripe_account_id) {
    return res.status(422).json({
      error: 'The event organiser has not set up their payout account yet. Tickets cannot be purchased until they do.',
    });
  }
  if (organiser.stripe_account_status !== 'active') {
    return res.status(422).json({
      error: "The organiser's payout account is not fully verified yet. Please try again later.",
    });
  }

  // Check for existing pending/paid RSVP
  const existingRsvp = await db.get(
    'SELECT id, payment_status FROM announcement_rsvps WHERE announcement_id = ? AND user_id = ?',
    req.params.annId, req.userId
  );
  if (existingRsvp?.payment_status === 'paid') {
    return res.status(409).json({ error: 'You already have a ticket for this event' });
  }

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const PLATFORM_FEE_RATE = 0.20;
    const amountCents = Math.round(ticketPrice * 100);
    const feeCents = Math.round(amountCents * PLATFORM_FEE_RATE);

    const buyer = await db.get('SELECT email FROM users WHERE id = ?', req.userId);

    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'eur',
      capture_method: 'manual',
      payment_method_types: ['card'],
      receipt_email: buyer?.email || undefined,
      description: `Ticket: ${ann.content?.substring(0, 60)}`,
      transfer_data: { destination: organiser.stripe_account_id },
      application_fee_amount: feeCents,
      metadata: {
        announcement_id: String(req.params.annId),
        group_id: String(req.params.id),
        buyer_id: String(req.userId),
      },
    });

    // Upsert the RSVP row as pending
    if (existingRsvp) {
      await db.run(
        "UPDATE announcement_rsvps SET stripe_payment_intent_id = ?, payment_status = 'pending', ticket_code = NULL WHERE id = ?",
        intent.id, existingRsvp.id
      );
    } else {
      await db.run(
        "INSERT INTO announcement_rsvps (announcement_id, user_id, payment_status, stripe_payment_intent_id) VALUES (?, ?, 'pending', ?)",
        req.params.annId, req.userId, intent.id
      );
    }

    return res.json({
      is_paid: true,
      client_secret: intent.client_secret,
      amount_eur: ticketPrice,
    });
  } catch (err: any) {
    console.error('[TICKET] PaymentIntent creation failed:', err.message);
    return res.status(500).json({ error: 'Payment setup failed. Please try again.' });
  }
});

// Confirm ticket payment after Stripe card authorisation
router.post('/:id/announcements/:annId/rsvp/confirm', authMiddleware, async (req: AuthRequest, res: Response) => {
  const rsvp = await db.get(
    'SELECT * FROM announcement_rsvps WHERE announcement_id = ? AND user_id = ?',
    req.params.annId, req.userId
  );
  if (!rsvp) return res.status(404).json({ error: 'No pending RSVP found' });
  if (rsvp.payment_status === 'paid') return res.json({ ticket_code: rsvp.ticket_code, message: 'Already confirmed' });
  if (rsvp.payment_status !== 'pending') return res.status(400).json({ error: 'RSVP is not in pending state' });

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const intent = await stripe.paymentIntents.capture(rsvp.stripe_payment_intent_id);
    if (intent.status !== 'succeeded') {
      return res.status(402).json({ error: 'Payment capture failed', stripe_status: intent.status });
    }

    const ticketCode = randomUUID();
    await db.run(
      "UPDATE announcement_rsvps SET payment_status = 'paid', ticket_code = ? WHERE id = ?",
      ticketCode, rsvp.id
    );

    return res.json({ ticket_code: ticketCode, message: 'Ticket confirmed' });
  } catch (err: any) {
    console.error('[TICKET] Capture failed:', err.message);
    return res.status(500).json({ error: 'Payment capture failed. Please contact support.' });
  }
});

// Get my ticket for an event (returns ticket_code for QR)
router.get('/:id/announcements/:annId/my-ticket', authMiddleware, async (req: AuthRequest, res: Response) => {
  const rsvp = await db.get(
    'SELECT payment_status, ticket_code, checked_in, created_at FROM announcement_rsvps WHERE announcement_id = ? AND user_id = ?',
    req.params.annId, req.userId
  );
  if (!rsvp) return res.status(404).json({ error: 'No ticket found' });
  res.json(rsvp);
});

// Cancel RSVP (free) or refund/cancel ticket (paid or pending)
router.delete('/:id/announcements/:annId/rsvp', authMiddleware, async (req: AuthRequest, res: Response) => {
  const rsvp = await db.get(
    'SELECT * FROM announcement_rsvps WHERE announcement_id = ? AND user_id = ?',
    req.params.annId, req.userId
  );
  if (!rsvp) return res.status(404).json({ error: 'No RSVP found' });

  // Pending tickets: card was authorised but capture never happened — cancel the authorisation
  if (rsvp.payment_status === 'pending' && rsvp.stripe_payment_intent_id) {
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      await stripe.paymentIntents.cancel(rsvp.stripe_payment_intent_id);
    } catch (err: any) {
      // Log but don't block — Stripe may have already expired/cancelled the intent
      console.warn('[TICKET] Cancel pending intent failed (may be already expired):', err.message);
    }
    await db.run('DELETE FROM announcement_rsvps WHERE id = ?', rsvp.id);
    return res.json({ message: 'RSVP cancelled' });
  }

  // Paid tickets: attempt Stripe refund before deleting
  if (rsvp.payment_status === 'paid' && rsvp.stripe_payment_intent_id) {
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      await stripe.refunds.create({ payment_intent: rsvp.stripe_payment_intent_id });
      await db.run("UPDATE announcement_rsvps SET payment_status = 'refunded', ticket_code = NULL WHERE id = ?", rsvp.id);
      return res.json({ message: 'Ticket cancelled and refunded' });
    } catch (err: any) {
      console.error('[TICKET] Refund failed:', err.message);
      return res.status(500).json({ error: 'Refund failed. Please contact support.' });
    }
  }

  await db.run('DELETE FROM announcement_rsvps WHERE announcement_id = ? AND user_id = ?', req.params.annId, req.userId);
  res.json({ message: 'RSVP cancelled' });
});

// Get RSVPs for an event
router.get('/:id/announcements/:annId/rsvps', async (req: AuthRequest, res: Response) => {
  const rsvps = await db.all('SELECT u.id, u.username, u.avatar FROM announcement_rsvps ar JOIN users u ON ar.user_id = u.id WHERE ar.announcement_id = ? ORDER BY ar.created_at', req.params.annId);
  res.json(rsvps);
});

// Get comments for an announcement
router.get('/:id/announcements/:annId/comments', async (req: AuthRequest, res: Response) => {
  const comments = await db.all(
    'SELECT ac.*, u.username as author_name, u.avatar as author_avatar FROM announcement_comments ac JOIN users u ON ac.author_id = u.id WHERE ac.announcement_id = ? ORDER BY ac.created_at',
    req.params.annId
  );
  res.json(comments);
});

// Post a comment
router.post('/:id/announcements/:annId/comments', authMiddleware, async (req: AuthRequest, res: Response) => {
  const member = await db.get('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?', req.params.id, req.userId);
  if (!member) return res.status(403).json({ error: 'Members only' });
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Content required' });
  const result = await db.run('INSERT INTO announcement_comments (announcement_id, author_id, content) VALUES (?, ?, ?)', req.params.annId, req.userId, content.trim());
  res.status(201).json({ id: result.lastInsertRowid });
});

// Delete a comment
router.delete('/:id/announcements/:annId/comments/:commentId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const comment = await db.get('SELECT * FROM announcement_comments WHERE id = ?', req.params.commentId);
  if (!comment) return res.status(404).json({ error: 'Not found' });
  const member = await db.get('SELECT role FROM group_members WHERE group_id = ? AND user_id = ?', req.params.id, req.userId);
  if (comment.author_id !== req.userId && member?.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });
  await db.run('DELETE FROM announcement_comments WHERE id = ?', req.params.commentId);
  res.json({ message: 'Deleted' });
});

// Delete announcement (author or admin)
router.delete('/:id/announcements/:annId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const member = await db.get('SELECT role FROM group_members WHERE group_id = ? AND user_id = ?', req.params.id, req.userId);
  const ann = await db.get('SELECT * FROM group_announcements WHERE id = ? AND group_id = ?', req.params.annId, req.params.id);
  if (!ann) return res.status(404).json({ error: 'Not found' });
  if (ann.author_id !== req.userId && member?.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });
  await db.run('DELETE FROM group_announcements WHERE id = ?', req.params.annId);
  res.json({ message: 'Deleted' });
});

// Toggle pin (admin only)
router.put('/:id/announcements/:annId/pin', authMiddleware, async (req: AuthRequest, res: Response) => {
  const member = await db.get('SELECT role FROM group_members WHERE group_id = ? AND user_id = ?', req.params.id, req.userId);
  if (!member || member.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const ann = await db.get('SELECT pinned FROM group_announcements WHERE id = ?', req.params.annId);
  if (!ann) return res.status(404).json({ error: 'Not found' });
  await db.run('UPDATE group_announcements SET pinned = ? WHERE id = ?', !ann.pinned, req.params.annId);
  res.json({ message: ann.pinned ? 'Unpinned' : 'Pinned' });
});

// Group activity feed
router.get('/:id/activity', async (req: AuthRequest, res: Response) => {
  // Recent services added to the group
  const newServices = await db.all(`SELECT 'new_service' as type, s.id, s.title, s.created_at, u.username, u.id as user_id, c.name as category_name
    FROM services s JOIN users u ON s.provider_id = u.id JOIN categories c ON s.category_id = c.id
    WHERE s.group_id = ? AND s.is_active = 1 ORDER BY s.created_at DESC LIMIT 10`, req.params.id);

  // Recent members who joined
  const newMembers = await db.all(`SELECT 'new_member' as type, gm.joined_at as created_at, u.username, u.id as user_id, u.city
    FROM group_members gm JOIN users u ON gm.user_id = u.id
    WHERE gm.group_id = ? ORDER BY gm.joined_at DESC LIMIT 10`, req.params.id);

  // Completed exchanges within the group
  const exchanges = await db.all(`SELECT 'exchange' as type, sr.completed_at as created_at, s.title,
    req.username as requester_name, req.id as requester_id, prov.username as provider_name, prov.id as provider_id
    FROM service_requests sr JOIN services s ON sr.service_id = s.id
    JOIN users req ON sr.requester_id = req.id JOIN users prov ON s.provider_id = prov.id
    WHERE s.group_id = ? AND sr.status = 'completed' ORDER BY sr.completed_at DESC LIMIT 10`, req.params.id);

  // Merge and sort by date
  const activity = [...newServices, ...newMembers, ...exchanges]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 15);
  res.json(activity);
});

export default router;
