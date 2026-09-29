// Vercel serverless function: POST /api/autopsy
// Muse Glimmer runs on the owner's server-side key by default.
// Anthropic, OpenAI and Gemini require the visitor's own key (no server fallback).

import { SYSTEM_PROMPT, buildUserMessage } from './_prompt.js';

const TIMEOUT_MS = 55000;

async function post(url, headers, body) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      const msg = data?.error?.message || data?.error || data?.detail || `HTTP ${r.status}`;
      throw new Error(typeof msg === 'string' ? msg : `HTTP ${r.status}`);
    }
    return data;
  } finally {
    clearTimeout(t);
  }
}

async function callMuse(user, key) {
  const base = (process.env.LLM_BASE_URL || 'https://integrate.api.nvidia.com/v1').replace(/\/$/, '');
  const model = process.env.LLM_MODEL;
  const apiKey = key || process.env.LLM_API_KEY;
  if (!model || !apiKey) throw new Error('The free model is not configured on this deployment yet.');
  const d = await post(
    `${base}/chat/completions`,
    { Authorization: `Bearer ${apiKey}` },
    {
      model,
      temperature: 0.2,
      max_tokens: 1800,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: user },
      ],
    },
  );
  return d?.choices?.[0]?.message?.content || '';
}

async function callOpenAI(user, key) {
  const d = await post(
    'https://api.openai.com/v1/chat/completions',
    { Authorization: `Bearer ${key}` },
    {
      model: process.env.OPENAI_MODEL || 'gpt-5-mini',
      max_completion_tokens: 4000,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: user },
      ],
    },
  );
  return d?.choices?.[0]?.message?.content || '';
}

async function callAnthropic(user, key) {
  const d = await post(
    'https://api.anthropic.com/v1/messages',
    { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    {
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5',
      max_tokens: 1800,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: user }],
    },
  );
  return (d?.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
}

async function callGemini(user, key) {
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const d = await post(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    { 'x-goog-api-key': key },
    {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 4000 },
    },
  );
  return (d?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('\n');
}

const PROVIDERS = {
  muse: { call: callMuse, needsKey: false },
  anthropic: { call: callAnthropic, needsKey: true },
  openai: { call: callOpenAI, needsKey: true },
  gemini: { call: callGemini, needsKey: true },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST.' });
  }
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const { account, provider = 'muse', apiKey = '' } = body;
  const p = PROVIDERS[provider];
  if (!p) return res.status(400).json({ error: 'Unknown provider.' });
  if (p.needsKey && !apiKey.trim()) {
    return res.status(400).json({ error: 'This provider needs your own API key.' });
  }
  if (!account || !Array.isArray(account.events) || account.events.length < 2) {
    return res.status(400).json({ error: 'Add at least two timeline events.' });
  }
  try {
    const text = await p.call(buildUserMessage(account), apiKey.trim());
    if (!text.trim()) throw new Error('The model returned an empty answer. Try again.');
    return res.status(200).json({ text });
  } catch (e) {
    const msg = e.name === 'AbortError' ? 'The model took too long. Try again.' : e.message;
    return res.status(502).json({ error: msg });
  }
}
