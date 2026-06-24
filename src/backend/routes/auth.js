const express = require('express');
const bcrypt  = require('bcryptjs');
const crypto  = require('crypto');
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

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const email = clean(req.body.email ?? '').toLowerCase();
  if (!email || !validEmail(email))
    return res.status(400).json({ error: 'Valid email required' });

  // Always respond success — don't reveal whether email exists
  res.json({ message: 'If that email is registered, a reset link has been sent.' });

  try {
    const user = await db.findByEmail(email);
    if (!user) return; // silently do nothing

    const token  = crypto.randomBytes(32).toString('hex');
    await db.createResetToken(email, token);

    const frontendUrl = process.env.FRONTEND_URL || 'https://hoteliq.us';
    const resetLink   = `${frontendUrl}?reset=${token}`;

    const RESEND_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_KEY) {
      console.log(`[DEV] Password reset link for ${email}: ${resetLink}`);
      return;
    }

    const { Resend } = require('resend');
    const resend = new Resend(RESEND_KEY);
    await resend.emails.send({
      from: 'Hotel IQ <noreply@hoteliq.us>',
      to: email,
      subject: 'Reset your Hotel IQ password',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#05050A;color:#F8F8FF;padding:40px;border-radius:16px">
          <div style="font-size:22px;font-weight:800;margin-bottom:8px">Hotel<span style="color:#F59E0B">IQ</span></div>
          <h2 style="font-size:20px;margin:24px 0 12px">Reset your password</h2>
          <p style="color:#A0A0C0;line-height:1.6">
            Someone (hopefully you) requested a password reset for <strong style="color:#fff">${email}</strong>.
            Click the button below to set a new password. This link expires in 1 hour.
          </p>
          <div style="margin:32px 0">
            <a href="${resetLink}" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#5B21B6);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px">
              Reset Password →
            </a>
          </div>
          <p style="color:#606080;font-size:12px">
            If you didn't request this, you can safely ignore this email.
            This link will expire in 1 hour and can only be used once.
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error('forgot-password error:', err);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const token    = clean(req.body.token ?? '');
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!token || !password)
    return res.status(400).json({ error: 'Token and new password required' });
  if (password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' });

  try {
    const record = await db.getResetToken(token);
    if (!record)
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    if (record.usedAt)
      return res.status(400).json({ error: 'This reset link has already been used' });
    if (new Date(record.expiresAt) < new Date())
      return res.status(400).json({ error: 'This reset link has expired. Request a new one.' });

    const hashed = await bcrypt.hash(password, 12);
    await db.setPassword(record.email, hashed);
    await db.useResetToken(token);

    res.json({ message: 'Password updated successfully. You can now log in.' });
  } catch (err) {
    console.error('reset-password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
