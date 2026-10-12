// Serverless function for Riskiest Bet First.
// A model reads the idea notes and lists the assumptions the idea takes for granted, quoting the words that take them for granted.
// It never scores, ranks, picks tests or sets the verdict. Those come from printed rules in src/rules.js,
// and every suggestion is checked in the browser before it can be added.
// The prompt lives here, not in the browser bundle. Output uses tagged lines, not JSON,
// so any provider that follows a plain format works.

import { CATEGORIES, EVIDENCE, EVIDENCE_HINT } from '../src/rules.js';

const MAX_NOTES = 6000;
const MAX_FIELD = 300;
const clip = (s, n = MAX_FIELD) => String(s ?? '').slice(0, n);

const catList = CATEGORIES.map((c) => `- ${c.label}: ${c.ask}`).join('\n');
const evList = EVIDENCE.map((e) => `- ${e}: ${EVIDENCE_HINT[e]}`).join('\n');

const SYSTEM = `You help a product manager find the assumptions a new product idea rests on, before anyone builds it. A separate set of fixed rules scores the assumptions, ranks them and picks tests. Your only job is to read the idea notes and list what they take for granted.

An assumption is something that must be true for the idea to work, which the notes treat as settled. Look hardest for the ones nobody has checked: who has the problem, whether they will choose this over what they do today, how the team will reach them, whether they can use it, whether it can be built, and whether the numbers work.

For each assumption give:
- the category, copied exactly from this list:
${catList}
- the belief, as one plain sentence about the world, under 20 words
- the exact words from the notes that take it for granted, 3 to 20 words, copied exactly
- the evidence the notes give for it, copied exactly from this list:
${evList}
- one plain sentence on why it matters or what is missing

Be strict about evidence. What people said they would do, liked, loved or were excited by is Opinions only. What the team believes or plans is Opinions only or Nothing yet. Only count what people did: paid, signed, clicked, came back, used a workaround, or what product data shows. A small number of friendly people counts as Some behaviour at most.

Do not invent facts that are not in the notes. Do not list an assumption without words in the notes to quote. Prefer the assumptions that would kill the idea if wrong.

Then give 3 or 4 questions to ask users in interviews. Ask about past behaviour, never about the idea or what they would do. Good: "When did you last...", "What did you do the last time...". Bad: "Would you use...", "Do you like...".

Also give one sentence describing the idea, in plain British English.

Do not score the assumptions, rank them, suggest tests or say whether to build it.

Output only tagged lines, one per line, in this format:
SUMMARY|<one sentence>
ASSUMPTION|<category copied from the list>|<belief>|<exact words from the notes>|<evidence copied from the list>|<why, one sentence>
QUESTION|<question>

Give exactly one SUMMARY, 4 to 10 ASSUMPTION lines and 3 or 4 QUESTION lines. No pipe characters inside fields. No markdown, no headings, no other text.`;

function buildMessage(b) {
  return [
    `Idea: ${clip(b.name, 120) || 'not given'}`,
    `One line: ${clip(b.pitch, 200) || 'not given'}`,
    `Who it is for: ${clip(b.segment, 80) || 'not given'}`,
    '',
    'Idea notes:',
    clip(b.notes, MAX_NOTES)
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
  if (String(b.notes || '').trim().length < 60) {
    return res.status(400).json({ error: 'Write a few sentences about the idea first.' });
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
