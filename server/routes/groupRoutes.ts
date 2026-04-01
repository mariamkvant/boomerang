import { Router, Response } from 'express';
import db from '../database';
import { authMiddleware, AuthRequest } from '../auth';
import { notify } from '../notify';

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
