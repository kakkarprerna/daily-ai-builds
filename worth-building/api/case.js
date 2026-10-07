// Serverless function for Worth Building?
// The browser works out every figure with fixed formulas and sends them here as a figure sheet.
// The model writes the words of the business case around those figures and may not add new ones.
// Prompts live here, not in the browser bundle. Output uses tagged lines, not JSON,
// so any provider that can follow a plain format works.

const MAX_FIELD = 1500;

const SYSTEM = `You write the narrative of a business case for an AI feature, for a product manager to take to the people who approve budget.

You receive a description of the feature and a figure sheet. The figures were calculated outside the model with fixed formulas.

Rules on numbers:
- Quote only figures that appear on the figure sheet or in the inputs, written exactly as they appear there.
- Never calculate, round, combine or estimate a new euro amount, percentage or month. If a point needs a number that is not on the sheet, make it in words.
- Do not soften the verdict. If the sheet says there is no case, say so plainly and explain what would have to change.

Rules on content:
- Lead each audience with what that person cares about, and give the objection they are most likely to raise with a straight answer.
- VALIDATE lines must cover the inputs listed under "Validate first", most important first, each with the cheapest real check and a named role who owns it.
- KILL lines are conditions under which the team should stop, written so they can be checked.
- Include at least one ALTERNATIVE that does not use AI, and say when it would win.
- Plain British English. Short sentences. No hype, no filler, no dashes used as punctuation.

Output only lines in these formats, no headings, no markdown, no pipe characters inside fields:
SUMMARY|<three sentences: the verdict, the key figures, what approval should depend on>
PROBLEM|<two sentences on the problem today and why it matters now>
ASK|<one sentence: what is being asked for, and any gate before full spend>
AUDIENCE|<who>|<what they care about>|<line to lead with>|<likely objection>|<answer>
VALIDATE|<assumption>|<cheapest way to check it>|<role who owns the check>
RISK|<risk>|<mitigation>
KILL|<condition to stop>
ALTERNATIVE|<option>|<when it wins>`;

function clip(s) {
  return String(s ?? '').slice(0, MAX_FIELD).replace(/\|/g, '/');
}

function buildMessage(b) {
  const lines = [
    `Feature: ${clip(b.name)}`,
    `What it does: ${clip(b.idea)}`,
    `Problem today: ${clip(b.problem)}`,
    `Who uses it: ${clip(b.users)}`,
    `Alternative already considered: ${clip(b.alternative) || 'none given'}`,
    `People who must approve it: ${(Array.isArray(b.audiences) ? b.audiences : []).map(clip).join(', ') || 'Finance'}`,
    '',
    'Inputs as entered:',
    ...(Array.isArray(b.inputLines) ? b.inputLines.slice(0, 30).map(clip) : []),
    '',
    'Figure sheet:',
    ...(Array.isArray(b.figures) ? b.figures.slice(0, 30).map(clip) : []),
    '',
    'Validate first (highest impact inputs that are guesses or benchmarks, most important first):',
    ...(Array.isArray(b.validateFirst) && b.validateFirst.length ? b.validateFirst.slice(0, 6).map(clip) : ['none flagged'])
  ];
  return lines.join('\n');
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

  if (!b.name || !String(b.name).trim()) return res.status(400).json({ error: 'Give the feature a name first.' });
  if (!b.idea || !String(b.idea).trim()) return res.status(400).json({ error: 'Say what the feature does first.' });
  if (!Array.isArray(b.figures) || b.figures.length === 0) return res.status(400).json({ error: 'No figures were sent.' });

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
