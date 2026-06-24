const express = require('express');
const crypto  = require('crypto');
const { requireAdmin } = require('../middleware/requireAuth');
const db = require('../db');

const router = express.Router();

// All routes require admin
router.use(requireAdmin);

// GET /api/admin/users — list all users
router.get('/users', async (req, res) => {
  try {
    const users = await db.listUsers();
    res.json({ users });
  } catch (err) {
    console.error('admin/users error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/users/:id/approve
router.post('/users/:id/approve', async (req, res) => {
  try {
    const user = await db.updateUser(req.params.id, { isApproved: true, status: 'active' });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error('admin/approve error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/users/:id/deactivate
router.post('/users/:id/deactivate', async (req, res) => {
  try {
    if (req.params.id === req.user.id)
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    const user = await db.updateUser(req.params.id, { isApproved: false, status: 'deactivated' });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error('admin/deactivate error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/invites — generate an invite link
router.post('/invites', async (req, res) => {
  try {
    const token = crypto.randomBytes(24).toString('hex');
    const invite = await db.createInvite(token, req.user.id);
    const baseUrl = process.env.FRONTEND_URL || 'https://hoteliq.us';
    res.json({ invite, link: `${baseUrl}?invite=${token}` });
  } catch (err) {
    console.error('create invite error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/invites — list all invites
router.get('/invites', async (req, res) => {
  try {
    const invites = await db.listInvites();
    res.json({ invites });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
