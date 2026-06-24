const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../db');

const router = express.Router();

const JWT_SECRET   = process.env.JWT_SECRET || 'hotel-iq-dev-only-secret';
const ADMIN_EMAIL  = (process.env.ADMIN_EMAIL || '').toLowerCase();

const sign = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
const safe = ({ password, ...u }) => u;

const clean    = (s) => (typeof s === 'string' ? s.trim().replace(/\0/g, '') : '');
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const firstName = clean(req.body.firstName);
  const lastName  = clean(req.body.lastName ?? '');
  const hotelName = clean(req.body.hotelName);
  const email     = clean(req.body.email ?? '').toLowerCase();
  const password  = typeof req.body.password === 'string' ? req.body.password : '';

  if (!firstName || !hotelName || !email || !password)
    return res.status(400).json({ error: 'First name, hotel name, email and password are required' });
  if (!validEmail(email))
    return res.status(400).json({ error: 'Invalid email address' });
  if (password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  if (firstName.length > 100 || hotelName.length > 200)
    return res.status(400).json({ error: 'Input too long' });

  // Check invite token if provided
  const inviteToken = typeof req.body.inviteToken === 'string' ? req.body.inviteToken.trim() : null;
  let inviteValid = false;
  if (inviteToken) {
    const invite = await db.getInvite(inviteToken);
    if (invite && !invite.usedAt && new Date(invite.expiresAt) > new Date()) {
      inviteValid = true;
    }
  }

  // Admin email or valid invite = auto-approved
  const isAdmin    = ADMIN_EMAIL && email === ADMIN_EMAIL;
  const isApproved = isAdmin || inviteValid;

  try {
    const user = {
      id: Date.now().toString(),
      firstName, lastName, hotelName, email,
      password:   await bcrypt.hash(password, 12),
      isAdmin,
      isApproved,
      status:     isApproved ? 'active' : 'pending',
      createdAt:  new Date().toISOString(),
    };
    await db.insert(user);
    // Mark invite as used
    if (inviteValid && inviteToken) await db.useInvite(inviteToken, user.id);
    if (!isApproved) {
      return res.status(201).json({
        pending: true,
        message: 'Account created. An admin will review and approve your access shortly.',
      });
    }
    res.status(201).json({ token: sign({ userId: user.id, email }), user: safe(user) });
  } catch (err) {
    if (err.code === 'DUPLICATE') return res.status(409).json({ error: 'Email already registered' });
    console.error('register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const email    = clean(req.body.email ?? '').toLowerCase();
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' });

  try {
    const user = await db.findByEmail(email);
    const hash  = user?.password ?? '$2a$12$invalidsaltinvalidsaltinvalidsalthash';
    const match = await bcrypt.compare(password, hash);
    if (!user || !match)
      return res.status(401).json({ error: 'Invalid email or password' });

    // Auto-elevate admin email — even for accounts created before the admin system
    const isAdminEmail = ADMIN_EMAIL && email === ADMIN_EMAIL;
    if (isAdminEmail && (!user.isAdmin || !user.isApproved)) {
      await db.updateUser(user.id, { isAdmin: true, isApproved: true, status: 'active' });
      user.isAdmin = true;
      user.isApproved = true;
    }

    // Treat missing isApproved as approved (backward compat for pre-existing accounts)
    const approved = user.isApproved !== false;
    if (!approved)
      return res.status(403).json({
        pending: true,
        error: 'Your account is pending approval. You will receive access once an admin approves it.',
      });

    res.json({ token: sign({ userId: user.id, email }), user: safe(user) });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const { email } = jwt.verify(header.slice(7), JWT_SECRET);
    const user = await db.findByEmail(email);
    if (!user) return res.status(401).json({ error: 'User not found' });
    // Auto-elevate admin email on token refresh too
    const isAdminEmail = ADMIN_EMAIL && email === ADMIN_EMAIL;
    if (isAdminEmail && (!user.isAdmin || !user.isApproved)) {
      await db.updateUser(user.id, { isAdmin: true, isApproved: true, status: 'active' });
      user.isAdmin = true; user.isApproved = true;
    }
    if (user.isApproved === false) return res.status(403).json({ pending: true, error: 'Account pending approval' });
    res.json({ user: safe(user) });
  } catch {
    res.status(401).json({ error: 'Token invalid or expired' });
  }
});

module.exports = router;
