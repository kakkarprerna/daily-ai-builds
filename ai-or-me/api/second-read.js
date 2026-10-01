// Serverless function for the optional "Second read".
// The prompt lives here, never in the client bundle.
// Default provider: Muse Glimmer on NVIDIA's free OpenAI-shaped endpoint, on the
// owner's key (LLM_BASE_URL / LLM_MODEL / LLM_API_KEY).
// Visitors can bring their own key for Anthropic, OpenAI or Gemini. That key is
// used for the one request and is never stored or logged.

const SYSTEM = `You are a blunt, kind senior product manager helping another PM decide whether to use AI for a task.
A fixed rubric has already given a verdict. Your job is a second read: find what the rubric could not see from multiple-choice answers.
The person's long-term skill growth matters as much as getting today's task done. Do not cheerlead for AI or against it.

Reply with exactly five lines, each starting with its tag, in this order, and nothing else:
CHALLENGE: the strongest argument that the rubric verdict is wrong for this task (2 sentences max)
MISSED: something in the description the multiple-choice answers would not have captured (2 sentences max)
SKILL: the specific skill this task exercises, named plainly (1 sentence)
PROMPT: if they do use AI, one prompt they can paste that keeps the thinking with them, asking for critique of their own work rather than an answer (2 sentences max)
PRACTICE: one exercise of 30 minutes or less that builds that skill (2 sentences max)

Use British English. Plain words a non-specialist would understand. No dashes as punctuation. No markdown.`;

const TAGS = ['CHALLENGE', 'MISSED', 'SKILL', 'PROMPT', 'PRACTICE'];

function parse(text) {
  const out = {};
  let current = null;
  for (const raw of String(text).split('\n')) {
    const line = raw.trim().replace(/^\*+|\*+$/g, '');
    const m = line.match(/^([A-Z_]+)\s*:\s*(.*)$/);
    if (m && TAGS.includes(m[1])) {
      current = m[1];
      out[current] = m[2];
    } else if (current && line) {
      out[current] += ' ' + line;
    }
  }
  return out;
}

async function callOpenAIShaped(base, key, model, user) {
  const r = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: 700,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: user },
      ],
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message || `Provider returned ${r.status}`);
  return j.choices?.[0]?.message?.content || '';
}

async function callAnthropic(key, user) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
      max_tokens: 700,
      system: SYSTEM,
      messages: [{ role: 'user', content: user }],
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message || `Anthropic returned ${r.status}`);
  return (j.content || []).map((c) => c.text || '').join('');
}

async function callGemini(key, user) {
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 700 },
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message || `Gemini returned ${r.status}`);
  return j.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const task = String(body.task || '').slice(0, 1500).trim();
    const answers = String(body.answers || '').slice(0, 1500);
    const verdict = String(body.verdict || '').slice(0, 200);
    const provider = body.provider || 'muse';
    const userKey = String(body.key || '').trim();
    if (task.length < 15) return res.status(400).json({ error: 'Describe the task in a sentence or two first.' });

    const user = `Task description:\n${task}\n\nTheir rubric answers:\n${answers}\n\nRubric verdict: ${verdict}`;

    let text;
    if (provider === 'muse') {
      const key = process.env.LLM_API_KEY;
      const model = process.env.LLM_MODEL;
      if (!key || !model) return res.status(500).json({ error: 'The free model is not configured on this deployment. Choose another provider and add your own key.' });
      text = await callOpenAIShaped(process.env.LLM_BASE_URL || 'https://integrate.api.nvidia.com/v1', key, model, user);
    } else {
      if (!userKey) return res.status(400).json({ error: 'Add your own API key for this provider.' });
      if (provider === 'anthropic') text = await callAnthropic(userKey, user);
      else if (provider === 'openai') text = await callOpenAIShaped('https://api.openai.com/v1', userKey, process.env.OPENAI_MODEL || 'gpt-4.1-mini', user);
      else if (provider === 'gemini') text = await callGemini(userKey, user);
      else return res.status(400).json({ error: 'Unknown provider.' });
    }

    const parsed = parse(text);
    const missing = TAGS.filter((t) => !parsed[t]);
    if (missing.length === TAGS.length) return res.status(502).json({ error: 'The model replied in an unexpected format. Try again.' });
    return res.status(200).json({ result: parsed, missing });
  } catch (e) {
    return res.status(502).json({ error: e.message || 'Something went wrong reaching the model.' });
  }
}
