// Serverless function for Then What?.
// A model reads the activation notes and points at the moments where people stall after sign-up,
// quoting the words that show it. It never scores, ranks, picks fixes or sets the verdict.
// Those come from printed rules in src/rules.js, and every moment is checked in the browser before it can count.
// The prompt lives here, not in the browser bundle. Output uses tagged lines, not JSON,
// so any provider that follows a plain format works.

import { KINDS, STEP_TYPES } from '../src/rules.js';

const MAX_NOTES = 6000;
const MAX_FIELD = 200;
const clip = (s, n = MAX_FIELD) => String(s ?? '').slice(0, n);

const kindList = KINDS.map((k) => `- ${k.id}: ${k.ask}`).join('\n');
const typeLabel = (id) => STEP_TYPES.find((t) => t.id === id)?.label || clip(id, 60) || 'Milestone';

const SYSTEM = `You help a product manager find why new users of a SaaS product sign up and then never get value from it. A separate set of fixed rules scores what you find, ranks it, picks fixes and gives the verdict. Your only job is to read the activation notes and point at the moments where people stall, hesitate, hit an error, wait on someone or stop coming back.

The notes may be support tickets, interview notes, session recording notes, survey answers, screen copy or a plain description. Look hardest for moments that stop people reaching the first win (the first time the product proves its value to them), and for anything that stops people coming back after that first win.

For each moment give:
- the milestone number from the numbered ladder it happens at, or 0 if it is not tied to one milestone
- the kind, copied exactly from this list:
${kindList}
- what happens, as one plain sentence under 20 words
- the exact words from the notes that show it, 3 to 25 words, copied exactly
- one plain sentence on why it stops people

Only report moments the notes show. Do not invent problems the notes do not mention, and do not repeat general best practice. Do not list a moment without words in the notes to quote. Do not report things that work well. Prefer the moments that lose the most people.

Then give 3 questions the team should answer from their analytics, session recordings or support inbox to confirm the biggest moments. Make each one measurable.

Also give one sentence describing the product's activation and its main problem, in plain British English.

Do not score the moments, rank them, suggest fixes or give a verdict.

Output only tagged lines, one per line, in this format:
SUMMARY|<one sentence>
STUCK|<milestone number or 0>|<kind copied from the list>|<what happens>|<exact words from the notes>|<why, one sentence>
QUESTION|<question>

Give exactly one SUMMARY, 2 to 8 STUCK lines and 3 QUESTION lines. No pipe characters inside fields. No markdown, no headings, no other text.`;

function buildMessage(b) {
  const steps = Array.isArray(b.steps) ? b.steps.slice(0, 20) : [];
  const ladder = steps.map((s, i) => `${i + 1}. ${clip(s.label, 80) || typeLabel(s.type)} (${typeLabel(s.type)}${i > 0 ? `, ${s.mode === 'Optional' ? 'optional' : 'required'}` : ''}${s.who === 'Needs someone else' ? ', needs someone else' : ''})`);
  return [
    `Product: ${clip(b.name, 120) || 'not given'}`,
    `What it does: ${clip(b.pitch)}`,
    `Who signs up: ${clip(b.segment, 60)}`,
    `Activation window: ${clip(b.window, 30)}`,
    `First win counted as: ${clip(b.winDef, 60)}`,
    `First screen after sign-up: ${clip(b.firstScreen, 60)}`,
    `Help in place: ${(Array.isArray(b.support) ? b.support : []).map((x) => clip(x, 40)).join(', ') || 'none'}`,
    '',
    'Numbered ladder, from sign-up:',
    ladder.length ? ladder.join('\n') : 'not given',
    '',
    'Activation notes:',
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
    return res.status(400).json({ error: 'Write a few sentences about what happens after sign-up first.' });
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
