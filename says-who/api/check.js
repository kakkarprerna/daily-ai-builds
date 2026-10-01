import { SYSTEM_PROMPT, buildUserMessage } from './_prompt.js';
import { callModel } from './_providers.js';

const PROVIDERS = new Set(['muse', 'anthropic', 'openai', 'gemini']);
const clip = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST.' });
  }

  const body = typeof req.body === 'string' ? safeJson(req.body) : req.body || {};
  const advice = clip(body.advice, 1500);
  if (advice.length < 8) {
    return res.status(400).json({ error: 'Paste the advice you want checked (a sentence or two is enough).' });
  }

  const provider = PROVIDERS.has(body.provider) ? body.provider : 'muse';
  // A visitor's own key is used for this one request and never stored or logged.
  const apiKey = clip(body.apiKey, 300);

  const user = buildUserMessage({
    advice,
    source: clip(body.source, 80),
    age: clip(body.age, 60),
    topic: clip(body.topic, 60),
    country: clip(body.country, 60),
    notes: clip(body.notes, 600),
  });

  try {
    const text = await callModel({ provider, apiKey, system: SYSTEM_PROMPT, user });
    if (!/VERDICT\s*:/i.test(text)) {
      return res.status(502).json({ error: 'The model replied in an unexpected format. Try again, or switch model.' });
    }
    return res.status(200).json({ text, provider });
  } catch (err) {
    return res.status(502).json({ error: `Model call failed: ${String(err.message || err).slice(0, 300)}` });
  }
}

function safeJson(s) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
