// Serverless function for Are We Tracking That?
// A model maps each funnel step and each question to events in the pasted tracking plan, and
// suggests events or properties to add. It never gives the verdict. Printed rules in src/rules.js
// do that, and every event and property the model names is checked against the plan in the browser.
// The prompt lives here, not in the browser bundle. Output uses tagged lines, not JSON,
// so any provider that follows a plain format works.

const MAX_PLAN = 8000;
const MAX_LIST = 2000;
const MAX_FIELD = 120;
const clip = (s, n = MAX_FIELD) => String(s ?? '').slice(0, n);
const numbered = (s, max) =>
  String(s || '')
    .split(/\r?\n/)
    .map((x) => x.replace(/^\s*(\d+[.)]|[-*•])\s*/, '').trim())
    .filter(Boolean)
    .slice(0, max)
    .map((x, i) => `${i + 1}. ${clip(x, 200)}`)
    .join('\n');

const SYSTEM = `You help a product manager check whether an analytics tracking plan can answer their questions. A separate set of fixed rules gives the verdict and checks naming, personal data and tool limits. You never give a verdict. Your job is to map each funnel step and each question to events in the plan, and to say what is missing.

Rules for every event and property you name:
- Copy event names and property names exactly as they are written in the plan, with the same case and spaces. Never name an event that is not in the plan, except on ADD lines.
- An event answers a question only if it really fires at the moment the question needs. Read the "when it fires" text. An event that fires on opening a link does not prove the link worked.
- Timestamps and a user ID are sent with every event by every analytics tool, so never list them as missing.
- Never suggest a property that holds personal data such as an email, phone, name, address or ID number.

1. For each funnel step, one STEP line: the step number, the event or events that mark it (comma separated, or NONE), and a note under 12 words.

2. For each question, one Q line: the question number, whether the plan can answer it (yes, partly or no), the events needed (comma separated, or NONE), the properties needed on those events (comma separated, or NONE), and in one sentence what is missing (empty if nothing).

3. For each event that should be added to answer a question or cover a step, one ADD line: a name in the plan's naming style, its properties (comma separated), when exactly it fires, and the questions or steps it unblocks (for example Q3 or Step 2).

4. For each property that should be added to an existing event, one PROP line: the existing event name exactly, the new property in the plan's style, why in one sentence, and the questions or steps it unblocks.

Also give one SUMMARY sentence in plain British English.

Output only tagged lines, one per line, in this format:
SUMMARY|<one sentence>
STEP|<step number>|<events or NONE>|<note>
Q|<question number>|<yes, partly or no>|<events or NONE>|<properties or NONE>|<what is missing>
ADD|<new event name>|<properties>|<when it fires>|<unblocks>
PROP|<existing event name>|<new property>|<why>|<unblocks>

Give exactly one SUMMARY, one STEP line per step, one Q line per question, 0 to 5 ADD lines and 0 to 5 PROP lines. No pipe characters inside fields. No markdown, no headings, no other text.`;

function buildMessage(b) {
  return [
    `Product: ${clip(b.product) || 'not given'}`,
    `Flow: ${clip(b.flow, 60)}`,
    `Analytics tool: ${clip(b.tool, 40)}`,
    `Naming convention: ${clip(b.convention, 40)}`,
    `How users are identified: ${clip(b.identity, 60)}`,
    '',
    'Funnel steps:',
    numbered(clip(b.steps, MAX_LIST), 10) || 'none given',
    '',
    'Questions:',
    numbered(clip(b.questions, MAX_LIST), 8) || 'none given',
    '',
    'Tracking plan (event | properties | when it fires):',
    clip(b.plan, MAX_PLAN)
  ].join('\n');
}

async function callOpenAIShaped(base, key, model, system, user) {
  const r = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: 1800,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ]
    })
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error?.message || `Provider returned ${r.status}`);
  return data?.choices?.[0]?.message?.content || '';
}

async function callAnthropic(key, model, system, user) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model, max_tokens: 1800, temperature: 0, system, messages: [{ role: 'user', content: user }] })
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error?.message || `Provider returned ${r.status}`);
  return (data?.content || []).map((c) => c.text || '').join('');
}

async function callGemini(key, model, system, user) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 1800 }
    })
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error?.message || `Provider returned ${r.status}`);
  return (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  const b = req.body || {};
  const { provider = 'muse', apiKey = '', model = '' } = b;
  if (String(b.plan || '').trim().length < 10) return res.status(400).json({ error: 'Paste your tracking plan first.' });
  if (!String(b.questions || '').trim() && !String(b.steps || '').trim()) {
    return res.status(400).json({ error: 'Add at least one question or funnel step.' });
  }

  const user = buildMessage(b);
  const key = String(apiKey).trim();

  try {
    let text = '';
    if (provider === 'muse') {
      const useKey = key || process.env.LLM_API_KEY;
      const useModel = (key && model) || process.env.LLM_MODEL;
      if (!useKey || !useModel) return res.status(500).json({ error: 'Muse Glimmer is not configured on this deployment yet.' });
      text = await callOpenAIShaped(process.env.LLM_BASE_URL || 'https://integrate.api.nvidia.com/v1', useKey, useModel, SYSTEM, user);
    } else if (provider === 'anthropic') {
      if (!key) return res.status(400).json({ error: 'Paste your Anthropic key to use this provider.' });
      text = await callAnthropic(key, model || process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5', SYSTEM, user);
    } else if (provider === 'openai') {
      if (!key) return res.status(400).json({ error: 'Paste your OpenAI key to use this provider.' });
      text = await callOpenAIShaped('https://api.openai.com/v1', key, model || process.env.OPENAI_MODEL || 'gpt-4.1-mini', SYSTEM, user);
    } else if (provider === 'gemini') {
      if (!key) return res.status(400).json({ error: 'Paste your Gemini key to use this provider.' });
      text = await callGemini(key, model || process.env.GEMINI_MODEL || 'gemini-2.5-flash', SYSTEM, user);
    } else {
      return res.status(400).json({ error: 'Unknown provider.' });
    }
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(502).json({ error: `The model call failed: ${err.message}` });
  }
}
