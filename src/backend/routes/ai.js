const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
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

let _client = null;
function client() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

// POST /api/ai/chat
router.post('/chat', requireAuth, async (req, res) => {
  const { messages, context } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'AI service not configured — add ANTHROPIC_API_KEY to .env' });
  }

  try {
    const response = await client().messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      system: context || 'You are Hotel IQ, an expert hotel revenue management AI analyst. Be concise and data-driven.',
      messages: messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
    });

    if (response.stop_reason === 'refusal') {
      return res.status(422).json({ error: 'The AI declined to respond to this request.' });
    }

    const textBlock = response.content.find(b => b.type === 'text');
    res.json({ reply: textBlock ? textBlock.text : '' });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      console.error('[ai] Anthropic auth error — check ANTHROPIC_API_KEY');
      return res.status(503).json({ error: 'AI service misconfigured' });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: 'AI service is rate limited — try again shortly' });
    }
    console.error('[ai] chat error:', err.message || err);
    res.status(500).json({ error: 'Failed to reach AI service' });
  }
});

module.exports = router;
