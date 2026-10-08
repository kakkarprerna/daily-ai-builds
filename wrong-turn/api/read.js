// Serverless function for Wrong Turn.
// Takes a pasted agent trace, numbers its lines, and asks a model to split it into steps
// and suggest a status and a problem for each from fixed word lists.
// The model never names the wrong turn, the confidence or the fix. Those are worked out
// in the browser with printed rules, including a check that every quoted piece of
// evidence really appears in the trace.
// The prompt lives here, not in the browser bundle. Output uses tagged lines, not JSON,
// so any provider that follows a plain format works.

const MAX_TRACE = 24000;
const MAX_LINES = 400;
const MAX_FIELD = 1500;

const SYSTEM = `You read the trace of one run of an AI agent and describe what happened at each step, so a product manager can find where it went wrong.

You receive what the agent was supposed to do, what went wrong as reported, the setup, and the trace. Every trace line is numbered L1, L2 and so on. Split the trace into 4 to 14 steps in order. A step is one meaningful action: a user message, a plan, a piece of reasoning, a tool call with its result, a retrieval, a handoff between agents, a reply, or a system event such as a limit being hit. A tool call and its result may share one step. Give each step the range of trace lines it covers, using the L numbers.

For each step, pick facts ONLY from these word lists. Copy the words exactly.
Kind: User message, Plan, Model reasoning, Tool call, Tool result, Retrieval, Handoff, Reply, System
Status: Fine, Suspect, Failed
Problem: None, Wrong tool chosen, Bad arguments, Tool or API failed, Error ignored, Result misread, Missing context, Instruction ignored, Retrieved wrong source, Handoff dropped context, Made up a fact, Repeated itself, Stopped too early

Rules for status and problem:
- A tool that honestly reports an error is Fine. The step that then mishandles the error is the problem.
- Use Failed only when the trace itself shows the step was wrong. Use Suspect when it looks wrong but the trace cannot prove it.
- A Fine step has Problem None. A Suspect or Failed step must have a problem other than None.
- Do not decide which step is the root cause. Describe every step on its own.

For each step give a short evidence quote copied exactly from the trace, 3 to 12 words, without the L number. Do not paraphrase the evidence.

Then give:
- SHOULD lines for each Suspect or Failed step: what should have happened there instead. Concrete.
- LINK lines: where a problem at one step led to a problem at a later step, only where the trace supports it.
- QUESTION lines: what the trace does not show that would change a status or a problem.

Write in plain British English. Step numbers count from 1.

Output only tagged lines, one per line, in this format:
SUMMARY|<one sentence on what the agent did and how it ended>
STEP|<step number>|<first line>-<last line>|<Kind>|<who acted: user, agent name, tool name or runner>|<what happened, one line>|<Status>|<Problem>|<exact quote from the trace>
SHOULD|<step number>|<what should have happened>
LINK|<earlier step number>|<later step number>|<how one led to the other>
QUESTION|<question for the user>

Give exactly one SUMMARY, 4 to 14 STEP lines, one SHOULD per Suspect or Failed step, 0 to 8 LINK lines and 2 to 4 QUESTION lines. No pipe characters inside fields. No markdown, no headings, no other text.`;

const clip = (s, n = MAX_FIELD) => String(s ?? '').slice(0, n);

function numbered(trace) {
  return clip(trace, MAX_TRACE)
    .split(/\r?\n/)
    .slice(0, MAX_LINES)
    .map((line, i) => `L${i + 1}: ${line}`)
    .join('\n');
}

function buildMessage(b) {
  return [
    `What the agent was supposed to do: ${clip(b.goal) || 'not given'}`,
    `What went wrong, as reported: ${clip(b.outcome, 120) || 'not given'}`,
    `Setup: ${clip(b.setup, 120) || 'not given'}`,
    '',
    'Trace:',
    numbered(b.trace)
  ].join('\n');
}

async function callOpenAIShaped(base, key, model, system, user) {
  const r = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: 2600,
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
    body: JSON.stringify({ model, max_tokens: 2600, temperature: 0, system, messages: [{ role: 'user', content: user }] })
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
      generationConfig: { temperature: 0, maxOutputTokens: 2600 }
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
  const lines = String(b.trace || '').split(/\r?\n/).filter((l) => l.trim()).length;
  if (lines < 4) {
    return res.status(400).json({ error: 'Paste a trace of at least four lines: what the user asked, what the agent did and how it ended.' });
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
