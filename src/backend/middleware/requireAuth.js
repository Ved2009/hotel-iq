const jwt = require('jsonwebtoken');
const db  = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'hotel-iq-dev-only-secret';

async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ error: 'Not authenticated' });
  try {
    const { email } = jwt.verify(header.slice(7), JWT_SECRET);
    const user = await db.findByEmail(email);
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (!user.isApproved) return res.status(403).json({ error: 'Account pending approval' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Token invalid or expired' });
  }
}

async function requireAdmin(req, res, next) {
  await requireAuth(req, res, async () => {
    if (!req.user?.isAdmin)
      return res.status(403).json({ error: 'Admin access required' });
    next();
  });
}

module.exports = { requireAuth, requireAdmin };
