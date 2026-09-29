// Works on Staging: serverless diagnosis endpoint.
// The system prompt and the default key live here, never in the client bundle.
//
// Providers
//   muse       Meta Muse Glimmer 30B on NVIDIA's OpenAI-shaped endpoint. Uses the
//              owner's LLM_API_KEY unless the visitor supplies their own NVIDIA key.
//   anthropic  Visitor's own key only.
//   openai     Visitor's own key only.
//   gemini     Visitor's own key only.
//
// Visitor keys are used for this one request and are never logged or stored.

const SYSTEM_PROMPT = `You are an environment-drift diagnostician helping a product manager work out why something works in one environment (for example staging) and fails in another (for example production), before they pull in an engineer.

Classify the most likely cause into exactly one of these drift categories:
- Configuration: environment variables, feature flags, settings, secrets, per-environment toggles.
- Data: differences in the shape, volume or quality of data (seed or test data versus real data, nulls, legacy records, migrations that ran in one place only).
- Permissions: roles, user groups, SSO, API scopes, allowlists, row-level access rules.
- Caching: CDN, browser cache, service workers, cached API responses, stale builds being served.
- Version: the environments run different builds, dependencies or database schemas, or a deploy did not fully land.
- Infrastructure: networking, DNS, domains, CORS, firewalls, rate limits, timeouts, resource limits.
- Third-party: a vendor behaves differently per environment (sandbox versus live keys, webhooks registered against the wrong URL, vendor-side settings).
- Unclear: use only when the inputs genuinely do not separate the options.

Rules:
- Ground every claim in the specific symptoms given. Quote or reference what the user told you. Do not invent systems, vendors, error codes or facts that were not provided; if you mention a vendor or tool as an example, say it is an example.
- Checks must be things a product manager can do without writing code: comparing settings screens, trying another account, opening an incognito window, reading a status page, looking at a dashboard or admin panel, asking a specific person a specific question. Order them cheapest first.
- Take account of checks the user has already done. Do not repeat them; use their results to rule categories in or out.
- Write in plain British English. No jargon without a short explanation. No em dashes.
- Be honest about confidence. If two categories are close, say so and put the check that separates them first.

Respond ONLY with tagged lines in this exact format, one item per line, no markdown, no extra commentary:
VERDICT: <one category from the list above>
CONFIDENCE: <High | Medium | Low>
SUMMARY: <one or two sentences in plain language explaining the verdict>
DRIFT: <category> | <High | Medium | Low> | <why, tied to the symptoms>
(2 to 4 DRIFT lines, most likely first, the first matching the VERDICT)
CHECK: <short title> | <exactly what to do, in plain steps> | <what each result would tell you>
(4 to 6 CHECK lines, cheapest and most separating first)
RULED_OUT: <category> | <why the inputs make it unlikely>
(0 to 3 RULED_OUT lines)
HANDOVER: <one line of a short note the PM could send to an engineer if the checks do not settle it>
(3 to 6 HANDOVER lines forming the note, starting with a greeting-free first line that states the problem)
FLIP: <what finding would change the verdict, and to what>`;

function buildUserMessage(input = {}) {
  const list = (v) => (Array.isArray(v) && v.length ? v.join('; ') : 'not specified');
  const one = (v) => (v && String(v).trim() ? String(v).trim() : 'not specified');
  return [
    `What happens: ${one(input.symptom)}`,
    `Works in: ${one(input.worksIn)}`,
    `Fails in: ${one(input.failsIn)}`,
    `Kind of failure: ${one(input.failureKind)}`,
    `Who is affected in the failing environment: ${one(input.affected)}`,
    `When it started: ${one(input.started)}`,
    `Checks already done: ${list(input.checked)}`,
    `Extra notes or pasted error: ${one(input.notes)}`,
  ].join('\n');
}

async function callOpenAIShaped({ baseUrl, apiKey, model, user }) {
  const r = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 1400,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: user },
      ],
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error?.message || `Provider returned ${r.status}`);
  return data?.choices?.[0]?.message?.content || '';
}

async function callAnthropic({ apiKey, model, user }) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1400,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: user }],
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error?.message || `Anthropic returned ${r.status}`);
  return (data?.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
}

async function callGemini({ apiKey, model, user }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 1400 },
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error?.message || `Gemini returned ${r.status}`);
  return (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('\n');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST.' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const { provider = 'muse', apiKey: visitorKey = '', input } = body;

  if (!input || !String(input.symptom || '').trim() || !String(input.failsIn || '').trim()) {
    return res.status(400).json({ error: 'Describe what happens and pick where it fails.' });
  }

  const user = buildUserMessage(input);
  const key = String(visitorKey || '').trim();

  try {
    let text = '';
    if (provider === 'muse') {
      const apiKey = key || process.env.LLM_API_KEY;
      if (!apiKey) return res.status(500).json({ error: 'The demo model is not configured on this deployment.' });
      text = await callOpenAIShaped({
        baseUrl: process.env.LLM_BASE_URL || 'https://integrate.api.nvidia.com/v1',
        apiKey,
        model: process.env.LLM_MODEL,
        user,
      });
    } else if (provider === 'anthropic') {
      if (!key) return res.status(400).json({ error: 'Paste your own Anthropic API key to use this provider.' });
      text = await callAnthropic({ apiKey: key, model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5', user });
    } else if (provider === 'openai') {
      if (!key) return res.status(400).json({ error: 'Paste your own OpenAI API key to use this provider.' });
      text = await callOpenAIShaped({
        baseUrl: 'https://api.openai.com/v1',
        apiKey: key,
        model: process.env.OPENAI_MODEL || 'gpt-5-mini',
        user,
      });
    } else if (provider === 'gemini') {
      if (!key) return res.status(400).json({ error: 'Paste your own Gemini API key to use this provider.' });
      text = await callGemini({ apiKey: key, model: process.env.GEMINI_MODEL || 'gemini-2.5-flash', user });
    } else {
      return res.status(400).json({ error: 'Unknown provider.' });
    }

    if (!/VERDICT\s*:/i.test(text)) {
      return res.status(502).json({ error: 'The model replied in an unexpected format. Try again, or switch provider.' });
    }
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(502).json({ error: err.message || 'The model call failed.' });
  }
}
