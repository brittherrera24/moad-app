// ── Secure Claude API proxy ───────────────────────────────────────────────────
// Runs server-side on Vercel. The ANTHROPIC_API_KEY env var is never exposed
// to the browser. All task content passes through this function and is not
// logged or stored.
/* eslint-env node */
/* global process */

const ALLOWED_ORIGINS = [
  'https://moad-app.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
]

// Cap tokens so a bug in the frontend can't run up an enormous bill
const MAX_TOKENS_CAP = 4096

export default async function handler(req, res) {
  // ── CORS headers ────────────────────────────────────────────────────────────
  const origin = req.headers.origin || ''
  const originAllowed =
    ALLOWED_ORIGINS.includes(origin) ||
    // Allow Vercel preview deployments (*.vercel.app)
    /^https:\/\/[a-z0-9-]+-brittanis-projects[a-z0-9-]*\.vercel\.app$/.test(origin) ||
    /^https:\/\/moad-app-[a-z0-9-]+\.vercel\.app$/.test(origin)

  if (origin && !originAllowed) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  res.setHeader('Access-Control-Allow-Origin', origin || '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle preflight
  if (req.method === 'OPTIONS') return res.status(200).end()

  // Only POST from here on
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // ── Validate API key is configured ─────────────────────────────────────────
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY env var is not set')
    return res.status(500).json({ error: 'API not configured on server' })
  }

  // ── Sanitize payload — only forward known safe fields ──────────────────────
  const { model, max_tokens, system, messages } = req.body || {}

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' })
  }

  const body = {
    model:      model      || 'claude-haiku-4-5-20251001',
    max_tokens: Math.min(Number(max_tokens) || 1024, MAX_TOKENS_CAP),
    messages,
  }
  if (system) body.system = system

  // ── Call Anthropic server-side ──────────────────────────────────────────────
  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await upstream.json()
    return res.status(upstream.status).json(data)
  } catch {
    // Do not log err.message — it may contain request content
    console.error('Claude proxy: upstream fetch failed')
    return res.status(502).json({ error: 'Upstream request failed' })
  }
}