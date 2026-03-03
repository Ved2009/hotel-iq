require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:1234',
  credentials: true,
}));
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);

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
