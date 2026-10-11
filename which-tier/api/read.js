// Serverless function for Which Tier?
// A model reads the plain description of an AI feature and checks it against the answers given in the form.
// It may suggest a different answer for a question, quoting the words in the description that point to it.
// It never sets the tier, the duties or the dates. Those come from printed rules in src/rules.js,
// and every suggestion is checked in the browser before it counts.
// The prompt lives here, not in the browser bundle. Output uses tagged lines, not JSON,
// so any provider that follows a plain format works.

import { TOPICS } from '../src/rules.js';

const MAX_DESC = 6000;
const MAX_FIELD = 300;
const clip = (s, n = MAX_FIELD) => String(s ?? '').slice(0, n);

const topicList = Object.entries(TOPICS)
  .map(([t, opts]) => `${t}:\n${opts.map((o) => `  - ${o}`).join('\n')}`)
  .join('\n');

const SYSTEM = `You help a product manager sort an AI feature under the EU AI Act. A separate set of fixed rules decides the risk tier. Your only job is to read the plain description of the feature and check whether the answers the product manager gave fit what the description says.

You receive the description and the current answers.

For each topic below, if the description contains words that point to an answer, give a SIGNAL with the answer copied exactly from that topic's list, the exact words from the description that point to it (3 to 20 words, copied exactly, including capital letters and punctuation), and one plain sentence why. Raise a SIGNAL when the description points to a different answer from the one given, and also when it confirms an answer that matters. Do not raise a SIGNAL without words in the description to quote. Do not invent facts that are not in the description.

Topics and the only allowed answers:
${topicList}

Be careful:
- Profiling means automated evaluation or prediction of things about a person, such as performance, reliability, behaviour, interests or fit.
- Only point to a prohibited practice when the description clearly describes it.
- Ranking or filtering people is not a narrow procedural task.

Then give 2 to 4 short questions the team should answer, or ask legal, before relying on the result. Ask about facts that would change the outcome.

Also give one sentence describing what the system does, in plain British English.

Do not name a risk tier. Do not give legal advice. Do not list duties or dates.

Output only tagged lines, one per line, in this format:
SUMMARY|<one sentence>
SIGNAL|<topic>|<answer copied from the list>|<exact words from the description>|<why, one sentence>
QUESTION|<question>

Give exactly one SUMMARY, 0 to 8 SIGNAL lines and 2 to 4 QUESTION lines. No pipe characters inside fields. No markdown, no headings, no other text.`;

function buildMessage(b) {
  const a = b.answers || {};
  const list = (x) => (Array.isArray(x) && x.length ? x.map((v) => clip(v)).join('; ') : 'none');
  return [
    `Feature name: ${clip(a.name, 120) || 'not given'}`,
    '',
    'Description:',
    clip(b.description, MAX_DESC),
    '',
    'Current answers:',
    `Role: ${clip(a.role)}`,
    `EU link: ${clip(a.eu)}`,
    `Prohibited: ${list(a.practices)}`,
    `Product: ${clip(a.product)}`,
    `Use: ${clip(a.use) || 'none'}`,
    `Profiling: ${clip(a.profiling)}`,
    `Exemption: ${clip(a.exemption)}`,
    `Transparency: ${list(a.transparency)}`,
    `GPAI: ${clip(a.gpai)}`
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
  if (String(b.description || '').trim().length < 40) {
    return res.status(400).json({ error: 'Describe the feature in at least a couple of sentences first.' });
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
