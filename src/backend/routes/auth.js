const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'hotel-iq-dev-secret-change-in-production';

const sign = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
const safe = ({ password, ...u }) => u;

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { firstName, lastName, hotelName, email, password } = req.body;
  if (!firstName || !hotelName || !email || !password)
    return res.status(400).json({ error: 'First name, hotel name, email and password are required' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  try {
    const user = {
      id: Date.now().toString(),
      firstName, lastName: lastName || '', hotelName,
      email: email.toLowerCase(),
      password: await bcrypt.hash(password, 10),
      createdAt: new Date().toISOString(),
    };
    db.insert(user);
    res.status(201).json({ token: sign({ userId: user.id, email: user.email }), user: safe(user) });
  } catch (err) {
    if (err.code === 'DUPLICATE') return res.status(409).json({ error: 'Email already registered' });
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const user = db.findByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ error: 'Invalid email or password' });
  res.json({ token: sign({ userId: user.id, email: user.email }), user: safe(user) });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const { email } = jwt.verify(header.slice(7), JWT_SECRET);
    const user = db.findByEmail(email);
    if (!user) return res.status(401).json({ error: 'User not found' });
    res.json({ user: safe(user) });
  } catch {
    res.status(401).json({ error: 'Token invalid or expired' });
  }
});

module.exports = router;
