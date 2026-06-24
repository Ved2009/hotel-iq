require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

const authRoutes     = require('./routes/auth');
const aiRoutes       = require('./routes/ai');
const compsetRoutes  = require('./routes/compset');
const propertyRoutes = require('./routes/property');
const adminRoutes    = require('./routes/admin');

// Fail fast if JWT_SECRET is not set in production
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set.');
  process.exit(1);
}

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Flutter web uses inline scripts
  crossOriginEmbedderPolicy: false,
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:1234',
  'https://hoteliq.us',
  'https://www.hoteliq.us',
  'http://localhost:5000',
  'http://localhost:3000',
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '50kb' })); // Prevent huge payloads

// ── Rate limiters ─────────────────────────────────────────────────────────────
// Auth: 10 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts. Please wait 15 minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI chat: 30 messages per hour per IP (protects Anthropic API credits)
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { error: 'AI rate limit reached. You can send 30 messages per hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API: 200 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', generalLimiter);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/ai',   aiLimiter,   aiRoutes);
app.use('/api/compset',  compsetRoutes);
app.use('/api/property', propertyRoutes);
app.use('/api/admin',    adminRoutes);

// Health check (not rate-limited)
app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── Serve Flutter web build ───────────────────────────────────────────────────
const flutterBuild = path.join(__dirname, '..', '..', 'flutter_app', 'build', 'web');
app.use(express.static(flutterBuild));
app.get('*', (_req, res) => {
  res.sendFile(path.join(flutterBuild, 'index.html'), err => {
    if (err) res.status(404).send('Frontend not built.');
  });
});

app.listen(PORT, () => {
  console.log(`\n  Hotel IQ  →  http://localhost:${PORT}`);
  console.log(`  Mode      →  ${process.env.NODE_ENV || 'development'}\n`);
});
