const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'hotel-iq-dev-secret-change-in-production';

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token invalid or expired' });
  }
}

// POST /api/ai/chat
router.post('/chat', requireAuth, async (req, res) => {
  const { messages, context } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'AI service not configured — add ANTHROPIC_API_KEY to .env' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: context || 'You are Hotel IQ, an expert hotel revenue management AI analyst. Be concise and data-driven.',
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err.error?.message || 'AI API error' });
    }

    const data = await response.json();
    res.json({ reply: data.content?.[0]?.text || '' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reach AI service' });
  }
});

module.exports = router;
