// One entry point for every model call. The default runs on the site owner's
// key (an OpenAI-shaped endpoint, NVIDIA's free tier by default). The other
// three run on a key the visitor supplies with the request. Keys are never
// stored or logged.

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const DEFAULT_MODELS = {
  anthropic: 'claude-sonnet-5-5',
  openai: 'gpt-5-mini',
  gemini: 'gemini-2.5-flash',
};

const MODEL_RE = /^[A-Za-z0-9._:\/-]{1,80}$/;

async function readError(r) {
  try {
    const j = await r.json();
    return j?.error?.message || j?.message || JSON.stringify(j).slice(0, 300);
  } catch {
    return r.statusText;
  }
}

async function openAIShape({ base, apiKey, model, system, user, maxTokens, temperature, isOpenAI }) {
  const body = {
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  };
  if (isOpenAI) {
    body.max_completion_tokens = maxTokens;
  } else {
    body.max_tokens = maxTokens;
    body.temperature = temperature;
  }
  const r = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new HttpError(r.status, `Model provider said: ${await readError(r)}`);
  const j = await r.json();
  return j?.choices?.[0]?.message?.content?.trim() || '';
}

async function anthropic({ apiKey, model, system, user, maxTokens, temperature }) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  if (!r.ok) throw new HttpError(r.status, `Anthropic said: ${await readError(r)}`);
  const j = await r.json();
  return (j?.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
}

async function gemini({ apiKey, model, system, user, maxTokens, temperature }) {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature },
      }),
    }
  );
  if (!r.ok) throw new HttpError(r.status, `Gemini said: ${await readError(r)}`);
  const j = await r.json();
  return (j?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
}

export async function complete({ provider = 'glimmer', model, key, system, user, maxTokens = 900, temperature = 0.2 }) {
  if (provider === 'glimmer') {
    const base = process.env.LLM_BASE_URL || 'https://integrate.api.nvidia.com/v1';
    const apiKey = process.env.LLM_API_KEY;
    const m = process.env.LLM_MODEL;
    if (!apiKey || !m) {
      throw new HttpError(503, 'The default model is not set up on this deployment yet. Pick another provider and add your own key.');
    }
    return openAIShape({ base, apiKey, model: m, system, user, maxTokens, temperature, isOpenAI: false });
  }

  if (!['anthropic', 'openai', 'gemini'].includes(provider)) {
    throw new HttpError(400, 'Unknown provider.');
  }
  if (!key || typeof key !== 'string' || key.length < 10) {
    throw new HttpError(400, 'Add your API key for this provider in Model & key.');
  }
  const m = model && MODEL_RE.test(model) ? model : DEFAULT_MODELS[provider];

  if (provider === 'anthropic') return anthropic({ apiKey: key, model: m, system, user, maxTokens, temperature });
  if (provider === 'gemini') return gemini({ apiKey: key, model: m, system, user, maxTokens, temperature });
  return openAIShape({
    base: 'https://api.openai.com/v1',
    apiKey: key,
    model: m,
    system,
    user,
    maxTokens,
    temperature,
    isOpenAI: true,
  });
}

// Shared request handling: method check, body limits, error shape.
export function handler(fn) {
  return async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Use POST.' });
      return;
    }
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const key = req.headers['x-provider-key'] || '';
      const out = await fn(body, key);
      res.status(200).json(out);
    } catch (e) {
      const status = e instanceof HttpError ? e.status : 500;
      res.status(status >= 400 && status < 600 ? status : 500).json({ error: e.message || 'Something went wrong.' });
    }
  };
}

export function clip(value, max, label) {
  const s = typeof value === 'string' ? value : '';
  if (s.length > max) throw new HttpError(413, `${label} is too long (limit ${max.toLocaleString('en-GB')} characters).`);
  return s;
}
