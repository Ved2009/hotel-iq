require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes     = require('./routes/auth');
const aiRoutes       = require('./routes/ai');
const compsetRoutes  = require('./routes/compset');
const propertyRoutes = require('./routes/property');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:1234',
  'https://hoteliq.us',
  'https://www.hoteliq.us',
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

// API routes
app.use('/api/auth',     authRoutes);
app.use('/api/ai',       aiRoutes);
app.use('/api/compset',  compsetRoutes);
app.use('/api/property', propertyRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// Serve built frontend in production
const frontendBuild = path.join(__dirname, '..', 'frontend', 'build');
app.use(express.static(frontendBuild));
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendBuild, 'index.html'), err => {
    if (err) res.status(404).send('Frontend not built yet. Run: npm run build:frontend');
  });
});

app.listen(PORT, () => {
  console.log(`\n  Hotel IQ Backend  →  http://localhost:${PORT}`);
  console.log(`  Auth API         →  http://localhost:${PORT}/api/auth`);
  console.log(`  AI Proxy         →  http://localhost:${PORT}/api/ai\n`);
});
