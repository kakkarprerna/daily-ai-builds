// Serverless function for Ready to Go Live?
// A model reads the team's rollout notes and checks them against the answers given in the form.
// It may suggest a different answer for a check, quoting the words in the notes that point to it.
// It never sets a status, the verdict or the rollout plan. Those come from printed rules in src/rules.js,
// and every suggestion and risk is checked in the browser before it counts.
// The prompt lives here, not in the browser bundle. Output uses tagged lines, not JSON,
// so any provider that follows a plain format works.

import { TOPICS, CHECKS } from '../src/rules.js';

const MAX_NOTES = 6000;
const MAX_FIELD = 300;
const clip = (s, n = MAX_FIELD) => String(s ?? '').slice(0, n);

const topicList = Object.entries(TOPICS)
  .map(([t, opts]) => `${t}:\n${opts.map((o) => `  - ${o}`).join('\n')}`)
  .join('\n');

const SYSTEM = `You help a team decide whether an AI agent is ready to launch for a customer. A separate set of fixed rules decides the verdict. Your only job is to read the team's rollout notes and check whether the answers they gave in a readiness form fit what the notes say.

You receive the notes and the current answers.

For each topic below, if the notes contain words that point to an answer, give a SIGNAL with the answer copied exactly from that topic's list, the exact words from the notes that point to it (3 to 20 words, copied exactly), and one plain sentence why. Raise a SIGNAL when the notes point to a different answer from the one given, and also when they confirm an answer that matters. Do not raise a SIGNAL without words in the notes to quote. Do not invent facts that are not in the notes.

Topics and the only allowed answers:
${topicList}

Be careful:
- Changing a tariff, plan, subscription, booking fee or payment method counts as changing contracts or moving money.
- Opening a ticket, booking or updating a record counts as updating records.
- A test that used a mock or a sandbox copy is not an end-to-end test.
- A rule written in the prompt is not a tested behaviour.

Then give up to 3 RISK lines for things in the notes that the form does not ask about but that could hurt the launch, each with exact words from the notes (3 to 20 words) and one plain sentence why.

Then give 2 to 4 short questions the team should settle with the customer before launch. Ask about facts that would change the plan.

Also give one sentence describing what the agent does, in plain British English.

Do not give a verdict. Do not say whether the agent is ready. Do not suggest traffic levels or dates.

Output only tagged lines, one per line, in this format:
SUMMARY|<one sentence>
SIGNAL|<topic>|<answer copied from the list>|<exact words from the notes>|<why, one sentence>
RISK|<exact words from the notes>|<why, one sentence>
QUESTION|<question>

Give exactly one SUMMARY, 0 to 8 SIGNAL lines, 0 to 3 RISK lines and 2 to 4 QUESTION lines. No pipe characters inside fields. No markdown, no headings, no other text.`;

function buildMessage(b) {
  const a = b.answers || {};
  const lines = [
    `Agent: ${clip(a.name, 120) || 'not given'}`,
    `Customer: ${clip(a.customer, 120) || 'not given'}`,
    `Channel: ${clip(a.channel)}`,
    `Languages: ${Array.isArray(a.languages) && a.languages.length ? a.languages.map((x) => clip(x, 40)).join(', ') : 'not given'}`,
    `Volume: ${clip(a.volume)}`,
    '',
    'Rollout notes:',
    clip(b.notes, MAX_NOTES),
    '',
    'Current answers:',
    `What the agent can do: ${clip(a.action)}`
  ];
  CHECKS.forEach((c) => lines.push(`${c.label}: ${clip(a[c.id]) || 'not answered'}`));
  return lines.join('\n');
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
    return res.status(400).json({ error: 'Write a few sentences of rollout notes first.' });
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
