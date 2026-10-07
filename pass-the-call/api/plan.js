// Serverless function for Pass the Call.
// Takes a description of a phone line a voice agent will answer and asks a model to
// split it into call moments and suggest facts for each, from fixed word lists.
// The model never picks a handoff lane. That happens in the browser with printed rules.
// The prompt lives here, not in the browser bundle. Output uses tagged lines, not JSON,
// so any provider that follows a plain format works.

const MAX_FIELD = 4000;
const MAX_LIST = 12;

const SYSTEM = `You help a product manager plan when an AI voice agent on a phone line should hand a call to a person.

You receive a description of the line: who calls, what they ring about, what the agent can do with its systems, and what the human team handles. Split the line into 4 to 8 call moments. A call moment is one reason a caller rings, phrased the way a caller would think of it.

For each moment, pick facts ONLY from these word lists. Copy the words exactly.
Stakes (what a mistake touches): Information only, A booking or record, Money, Safety or wellbeing
Feeling (how callers usually sound): Calm, Frustrated, Upset or anxious
Verify (identity check needed): None, Light, Strong
Agent (can the agent finish it with the systems described): Fully, Partly, No
Words (how callers explain it): Short and predictable, Varied, Long story
Frequency: Common, Occasional, Rare

Judge "Agent" strictly from what the description says the agent can do. If a team is said to handle it, the answer is Partly or No.
Do not decide whether to transfer. Only describe.

Then, for the moments, give:
- SIGNAL lines: specific things a caller might say that should make the agent hand over earlier than usual in that moment.
- FIELD lines: facts the agent should capture so a person never asks again. Mark each Required or Useful.
- LINE lines: one or two sentences the agent says when it hands over or offers a person in that moment. Plain, warm, no false promises, no apology loops.
- QUESTION lines: what the description leaves unclear that would change a fact.

Write in plain British English. Moment numbers count from 1 in the order you list the moments.

Output only tagged lines, one per line, in this format:
SUMMARY|<one sentence on the shape of the line>
MOMENT|<short name>|<what the caller wants, one line>|<Stakes>|<Feeling>|<Verify>|<Agent>|<Words>|<Frequency>|<systems involved>
SIGNAL|<moment number>|<the signal>
FIELD|<moment number>|<field to capture>|<Required or Useful>
LINE|<moment number>|<what the agent says>
QUESTION|<question for the contact centre lead>

Give exactly one SUMMARY, 4 to 8 MOMENT lines, 3 to 8 SIGNAL lines, 4 to 14 FIELD lines, one LINE per moment and 2 to 5 QUESTION lines. No pipe characters inside fields. No markdown, no headings, no other text.`;

const clip = (s, n = MAX_FIELD) => String(s ?? '').slice(0, n);
const list = (a) => (Array.isArray(a) ? a.slice(0, MAX_LIST).map((x) => clip(x, 120)).join(', ') : '');

function buildMessage(b) {
  return [
    `Line name: ${clip(b.name, 200) || 'not given'}`,
    `Who calls: ${clip(b.callers, 600) || 'not given'}`,
    `What callers ring about and what the agent and team can do: ${clip(b.handles)}`,
    `Human cover: ${clip(b.coverage, 100)}. How calls reach a person: ${clip(b.delivery, 100)}`,
    `Languages callers use: ${list(b.callerLanguages) || 'not given'}. Languages the agent speaks: ${list(b.agentLanguages) || 'not given'}`,
    `Systems: ${list(b.systems) || 'not given'}`,
    `Constraints: ${list(b.constraints) || 'none given'}`
  ].join('\n');
}

async function callOpenAIShaped(base, key, model, system, user) {
  const r = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: 2400,
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
    body: JSON.stringify({ model, max_tokens: 2400, temperature: 0, system, messages: [{ role: 'user', content: user }] })
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
      generationConfig: { temperature: 0, maxOutputTokens: 2400 }
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
  if (String(b.handles || '').trim().length < 60) {
    return res.status(400).json({ error: 'Describe what callers ring about and what the agent can do, in a few sentences.' });
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
