import { buildSystemPrompt, buildUserPrompt } from './_prompt.js';

// One endpoint, four providers.
// muse (default): Meta Muse Glimmer on NVIDIA's free OpenAI-shaped endpoint,
//   paid for by the site owner's key held in LLM_API_KEY.
// anthropic / openai / gemini: the visitor brings their own key. It is used
//   for this single request and is never stored or logged.

const LIMITS = { jd: 14000, background: 3000, stages: 10 };
const DEFAULT_MODELS = {
  anthropic: 'claude-sonnet-5',
  openai: 'gpt-5-mini',
  gemini: 'gemini-2.5-flash',
};

async function callOpenAIShaped({ baseUrl, apiKey, model, system, user }) {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      max_tokens: 4000,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `Provider returned ${res.status}`);
  return data?.choices?.[0]?.message?.content || '';
}

async function callAnthropic({ apiKey, model, system, user }) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model, max_tokens: 4000, system, messages: [{ role: 'user', content: user }] }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `Anthropic returned ${res.status}`);
  return (data?.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
}

async function callGemini({ apiKey, model, system, user }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 4000 },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `Gemini returned ${res.status}`);
  return (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('\n');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const { company = '', role = '', jd = '', background = '', days = 7, provider = 'muse', apiKey = '', model = '' } = body;
  const stages = Array.isArray(body.stages) ? body.stages.filter(Boolean).slice(0, LIMITS.stages) : [];

  if (jd.trim().length < 200) return res.status(400).json({ error: 'Paste the full job description (at least a few paragraphs).' });
  if (jd.length > LIMITS.jd) return res.status(400).json({ error: `The JD is over ${LIMITS.jd} characters. Trim the boilerplate and try again.` });
  if (background.length > LIMITS.background) return res.status(400).json({ error: 'Keep your background under 3,000 characters.' });
  if (!stages.length) return res.status(400).json({ error: 'Add at least one hiring stage.' });

  const system = buildSystemPrompt();
  const user = buildUserPrompt({ company, role, jd, stages, days: Math.max(1, Math.min(60, Number(days) || 7)), background });

  try {
    let text = '';
    if (provider === 'muse') {
      if (!process.env.LLM_API_KEY || !process.env.LLM_MODEL) {
        return res.status(500).json({ error: 'The free model is not configured on this deployment. Bring your own key instead.' });
      }
      text = await callOpenAIShaped({
        baseUrl: process.env.LLM_BASE_URL || 'https://integrate.api.nvidia.com/v1',
        apiKey: process.env.LLM_API_KEY,
        model: process.env.LLM_MODEL,
        system,
        user,
      });
    } else {
      if (!apiKey) return res.status(400).json({ error: 'Add your API key for this provider.' });
      const m = model || DEFAULT_MODELS[provider];
      if (provider === 'anthropic') text = await callAnthropic({ apiKey, model: m, system, user });
      else if (provider === 'openai') text = await callOpenAIShaped({ baseUrl: 'https://api.openai.com/v1', apiKey, model: m, system, user });
      else if (provider === 'gemini') text = await callGemini({ apiKey, model: m, system, user });
      else return res.status(400).json({ error: 'Unknown provider.' });
    }
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(502).json({ error: err.message || 'The model call failed.' });
  }
}
