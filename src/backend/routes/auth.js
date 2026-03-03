const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'hotel-iq-dev-secret-change-in-production';
const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) return {};
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

function saveUsers(users) {
  const dir = path.dirname(USERS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { firstName, lastName, hotelName, email, password } = req.body;

  if (!firstName || !hotelName || !email || !password) {
    return res.status(400).json({ error: 'First name, hotel name, email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const users = loadUsers();
  if (users[email.toLowerCase()]) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = {
    id: Date.now().toString(),
    firstName,
    lastName: lastName || '',
    hotelName,
    email: email.toLowerCase(),
    password: hashed,
    createdAt: new Date().toISOString(),
  };

  users[email.toLowerCase()] = user;
  saveUsers(users);

  const { password: _pw, ...safeUser } = user;
  const token = signToken({ userId: user.id, email: user.email });
  res.status(201).json({ token, user: safeUser });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const users = loadUsers();
  const user = users[email.toLowerCase()];

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const { password: _pw, ...safeUser } = user;
  const token = signToken({ userId: user.id, email: user.email });
  res.json({ token, user: safeUser });
});

// GET /api/auth/me  (verify token + return user)
router.get('/me', (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const decoded = jwt.verify(header.slice(7), JWT_SECRET);
    const users = loadUsers();
    const user = users[decoded.email];
    if (!user) return res.status(401).json({ error: 'User not found' });
    const { password: _pw, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch {
    res.status(401).json({ error: 'Token invalid or expired' });
  }
});

module.exports = router;
