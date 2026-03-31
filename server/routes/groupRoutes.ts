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

// List public groups
router.get('/', async (_req, res: Response) => {
  const groups = await db.all(`SELECT g.*, u.username as creator_name,
    (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) as member_count
    FROM groups g JOIN users u ON g.created_by = u.id WHERE g.is_public = true ORDER BY g.created_at DESC`);
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
  const members = await db.all('SELECT gm.role, u.id, u.username, u.city FROM group_members gm JOIN users u ON gm.user_id = u.id WHERE gm.group_id = ? ORDER BY gm.role DESC, gm.joined_at', req.params.id);
  const services = await db.all(`SELECT s.*, c.name as category_name, c.icon as category_icon, u.username as provider_name
    FROM services s JOIN categories c ON s.category_id = c.id JOIN users u ON s.provider_id = u.id
    WHERE s.group_id = ? AND s.is_active = 1 ORDER BY s.created_at DESC`, req.params.id);
  res.json({ ...group, members, services });
});

// Join a group (public or by invite code)
router.post('/:id/join', authMiddleware, async (req: AuthRequest, res: Response) => {
  const group = await db.get('SELECT * FROM groups WHERE id = ?', req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  if (!group.is_public) {
    const { invite_code } = req.body;
    if (invite_code !== group.invite_code) return res.status(403).json({ error: 'Invalid invite code' });
  }
  try {
    await db.run('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', req.params.id, req.userId);
    res.json({ message: 'Joined group' });
  } catch { res.status(409).json({ error: 'Already a member' }); }
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

export default router;
