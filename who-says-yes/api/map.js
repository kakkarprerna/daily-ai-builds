// Serverless function for Who Says Yes?
// Takes a proposal and what the user knows about the people around it, and asks a model
// to list the people and suggest facts about each one from fixed word lists.
// The model never picks a play, an order or a verdict. That happens in the browser with printed rules.
// The prompt lives here, not in the browser bundle. Output uses tagged lines, not JSON,
// so any provider that follows a plain format works.

const MAX_FIELD = 4000;
const MAX_LIST = 12;

const SYSTEM = `You help a product manager plan how to get buy-in for a proposal inside an organisation.

You receive the proposal, what the user knows about the people around it, the kind of ask, the timing, the user's position and any constraints. List the 4 to 9 people or groups whose agreement, help or acceptance matters. Use the roles and names the user gives. Treat a group that acts as one, such as a team of engineers or a works council, as one entry. Do not invent people the description gives no reason to expect, apart from an obvious approver for the kind of ask (for example finance for new budget).

For each person, pick facts ONLY from these word lists. Copy the words exactly.
Role (their part in the decision): Signs off, Can block, Shapes the detail, Has to live with it, Kept informed
Influence (how much others follow their lead): High, Medium, Low
Stance (where they stand today, from what the user says): Backing, Open, Unknown, Doubtful, Against
Impact (how much the proposal changes their work): Heavy, Some, Little
Access (the user's route to them): Direct, Through someone, None yet

If the user says nothing about someone's view, the stance is Unknown. Do not guess optimism.
Do not decide who to approach first or whether the proposal is ready. Only describe.

Then give:
- SWAYS lines: who listens to whom, only where the description supports it.
- WORRY lines: the objection each person is most likely to raise, and the specific evidence or change that would answer it. One or two per person.
- ASK lines: the one specific thing to ask each person for. Concrete, not "support".
- QUESTION lines: what the description leaves unclear that would change a fact.

Write in plain British English. Person numbers count from 1 in the order you list the people.

Output only tagged lines, one per line, in this format:
SUMMARY|<one sentence on the shape of support today>
PERSON|<name or role>|<what they care about most, one line>|<Role>|<Influence>|<Stance>|<Impact>|<Access>
SWAYS|<person number who sways>|<person number swayed>|<why, short>
WORRY|<person number>|<the likely objection>|<what answers it>
ASK|<person number>|<the specific ask>
QUESTION|<question for the user>

Give exactly one SUMMARY, 4 to 9 PERSON lines, 0 to 8 SWAYS lines, 1 or 2 WORRY lines per person, one ASK per person and 2 to 4 QUESTION lines. No pipe characters inside fields. No markdown, no headings, no other text.`;

const clip = (s, n = MAX_FIELD) => String(s ?? '').slice(0, n);
const list = (a) => (Array.isArray(a) ? a.slice(0, MAX_LIST).map((x) => clip(x, 120)).join(', ') : '');

function buildMessage(b) {
  return [
    `Proposal name: ${clip(b.name, 200) || 'not given'}`,
    `The proposal: ${clip(b.proposal)}`,
    `The people around it and what the user knows: ${clip(b.people) || 'not given'}`,
    `Kind of ask: ${clip(b.ask, 100)}. Timing: ${clip(b.timing, 100)}. User's position: ${clip(b.position, 100)}`,
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
  if (String(b.proposal || '').trim().length < 40 || String(b.people || '').trim().length < 60) {
    return res.status(400).json({ error: 'Describe the proposal and the people around it, in a few sentences each.' });
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
