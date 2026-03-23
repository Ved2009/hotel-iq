const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'hotel-iq-dev-secret-change-in-production';

module.exports = function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ error: 'Not authenticated' });
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token invalid or expired' });
  }
};
