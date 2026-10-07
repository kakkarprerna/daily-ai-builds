// Serverless function for Who Does What?
// The model breaks a described workflow into steps and suggests five facts per step.
// It never picks a lane: the browser does that with fixed, printed rules.
// Prompts live here, not in the browser bundle. Output uses tagged lines, not JSON,
// so any provider that can follow a plain format works.

const MAX_FIELD = 4000;

const SYSTEM = `You help a product manager decide which parts of a business workflow an AI agent should do.

You receive a description of how the work is done today. Break it into the steps that actually happen, in order, and describe each step with five facts using only the words allowed below. Do not decide who should do each step. Separate software will do that from your facts.

Splitting steps:
- 4 to 10 steps. One action per step. Split reading from deciding, and deciding from acting, because they carry different risks.
- If deciding and sending happen together (writing and sending a reply), keep them as one step only if nobody would ever review the words before they go.
- Use only steps the description supports or clearly implies. Do not add steps the team does not do.

The five facts, allowed words only:
- Action: Read or look up | Compare or calculate | Sort or judge | Draft text | Update a record | Send outside | Move money
- Judgement: None | Some | High. None means a written rule could decide it every time. High means weighing trade-offs, policy exceptions or a person's circumstances.
- Input: Structured | Mixed | Free text or voice
- Undo: Easy | Hard | Cannot. Messages already sent and money already paid cannot be undone.
- Reach: Internal | Customer sees it | Money or legal | Regulated or personal data. Pick the furthest a mistake would travel.

Be honest about judgement. Do not mark a step None just because software already exists for it, and do not mark it High just because it feels important.

Failure modes: for the steps most likely to go wrong when an agent does them, give how it fails in practice, the signal a team would notice, and one concrete guard. Specific to this workflow, not generic AI risks.

Tools: every system the agent would touch, whether it needs read only or read and write access, and which step numbers use it. Least access that works.

Questions: what the process owner must confirm before anyone builds this. Things the description leaves unclear that would change a fact.

Plain British English. Short sentences. No hype, no filler, no dashes used as punctuation.

Output only lines in these formats, no headings, no markdown, no pipe characters inside fields:
SUMMARY|<two sentences: what kind of workflow this is and where the risk sits>
STEP|<number>|<short name, verb first>|<what happens, one sentence>|<system or tool used>|<Action>|<Judgement>|<Input>|<Undo>|<Reach>
FAIL|<step number>|<how it goes wrong>|<how the team would notice>|<guard>
TOOL|<system>|<Read only or Read and write>|<step numbers, comma separated>
QUESTION|<question for the process owner>`;

function clip(s, n = MAX_FIELD) {
  return String(s ?? '').slice(0, n).replace(/\|/g, '/');
}

function list(v) {
  return (Array.isArray(v) ? v : []).map((x) => clip(x, 80)).join(', ');
}

function buildMessage(b) {
  return [
    `Workflow: ${clip(b.name, 200)}`,
    `Starts when: ${clip(b.trigger, 400) || 'not given'}`,
    `Done today by: ${clip(b.today, 400) || 'not given'}`,
    `Volume: ${clip(b.volume, 80) || 'not given'}`,
    `Systems mentioned: ${list(b.systems) || 'none listed'}`,
    `Known constraints: ${list(b.constraints) || 'none listed'}`,
    '',
    'How it is done today:',
    clip(b.process)
  ].join('\n');
}

async function callOpenAIShaped(base, key, model, system, user) {
  const r = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 2500,
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
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 2500,
      temperature: 0.2,
      system,
      messages: [{ role: 'user', content: user }]
    })
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
      generationConfig: { temperature: 0.2, maxOutputTokens: 2500 }
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

  if (!b.process || String(b.process).trim().length < 60) {
    return res.status(400).json({ error: 'Describe how the work is done today in a few sentences first.' });
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
