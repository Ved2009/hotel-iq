const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// serve static frontend build if exists
app.use(express.static(path.join(__dirname, '..', 'frontend', 'build')));

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from backend!' });
});

// catch-all to serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
