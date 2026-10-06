// Serverless function for Judge Calibration Lab.
// Two modes:
//   score    -> the AI judge scores every golden-set item against the rubric
//   diagnose -> reads the disagreements and explains which rubric wording caused them
// Prompts live here, not in the browser bundle. Model output uses tagged lines, not JSON,
// so any provider that can follow a plain format works.

const MAX_ITEMS = 25;
const MAX_FIELD = 4000;

const SCORE_SYSTEM = `You are an evaluation judge. You score AI responses against a rubric written by a product team.

Rules:
- Score each item using only the rubric and the item in front of you. Do not invent extra standards the rubric does not state.
- Use whole numbers inside the scale you are given.
- Give one short reason per item, naming the rubric level you matched.
- Output only lines in this exact format, one line per item, in the order given:
ITEM|<id>|<score>|<reason in one sentence, no pipe characters>
- No headings, no extra commentary, no markdown.`;

const DIAGNOSE_SYSTEM = `You help a product manager find out why an AI judge and human scorers disagree.

You receive the rubric, agreement statistics, and the items where the judge and the humans gave different scores, with the judge's reasons and any human notes.

Find the cause in the rubric wording first. Typical causes: a phrase the judge and humans read differently, a standard the judge applied that the rubric never states, information the humans had that the judge did not (such as a policy document), and levels that overlap. Also consider that a human label may be the one that is off.

Output only tagged lines, using any of these, as many as needed:
SUMMARY|<two plain sentences on the main pattern behind the disagreements>
AMBIGUITY|<the exact rubric phrase or gap>|<how the judge read it versus how the humans read it>|<comma separated item ids>
REWRITE|<rubric wording to replace, or "new line">|<suggested replacement wording>
ADD_CASE|<a golden-set item to add>|<what it would test>
HUMAN_CHECK|<item id>|<why the human score may need a second look>

Write in plain British English. No pipe characters inside fields. No markdown, no other text.`;

function clip(s) {
  return String(s ?? '').slice(0, MAX_FIELD);
}

function buildScoreMessage(b) {
  const lines = [
    `What is being judged: ${clip(b.criterion)}`,
    `Scale: whole numbers from ${b.scaleMin} to ${b.scaleMax}`,
    '',
    'Rubric:',
    clip(b.rubric),
    '',
    'Items:'
  ];
  for (const it of b.items) {
    lines.push(`--- id: ${clip(it.id)}`);
    lines.push(`Input: ${clip(it.input)}`);
    lines.push(`Response: ${clip(it.response)}`);
  }
  return lines.join('\n');
}

function buildDiagnoseMessage(b) {
  const s = b.stats || {};
  const lines = [
    `What is being judged: ${clip(b.criterion)}`,
    `Scale: ${b.scaleMin} to ${b.scaleMax}`,
    '',
    'Rubric:',
    clip(b.rubric),
    '',
    `Statistics: ${s.n} items, weighted kappa ${s.kappa}, exact agreement ${s.exact}, close agreement ${s.close}, mean judge minus human ${s.bias}.`,
    '',
    'Items (H = human score, J = judge score):'
  ];
  for (const it of b.items) {
    lines.push(`--- id: ${clip(it.id)} | H ${it.human} | J ${it.judge}`);
    lines.push(`Input: ${clip(it.input)}`);
    lines.push(`Response: ${clip(it.response)}`);
    if (it.reason) lines.push(`Judge reason: ${clip(it.reason)}`);
    if (it.note) lines.push(`Human note: ${clip(it.note)}`);
  }
  return lines.join('\n');
}

async function callOpenAIShaped(base, key, model, system, user) {
  const r = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0,
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
      temperature: 0,
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
      generationConfig: { temperature: 0, maxOutputTokens: 2500 }
    })
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error?.message || `Provider returned ${r.status}`);
  return (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });

  const b = req.body || {};
  const { mode, provider = 'muse', apiKey = '', model = '' } = b;

  if (!['score', 'diagnose'].includes(mode)) return res.status(400).json({ error: 'Unknown mode.' });
  if (!Array.isArray(b.items) || b.items.length === 0) return res.status(400).json({ error: 'No items sent.' });
  if (b.items.length > MAX_ITEMS) return res.status(400).json({ error: `Up to ${MAX_ITEMS} items per run.` });
  if (!b.rubric || !String(b.rubric).trim()) return res.status(400).json({ error: 'Add a rubric first.' });

  const system = mode === 'score' ? SCORE_SYSTEM : DIAGNOSE_SYSTEM;
  const user = mode === 'score' ? buildScoreMessage(b) : buildDiagnoseMessage(b);
  const key = String(apiKey).trim();

  try {
    let text = '';
    if (provider === 'muse') {
      const useKey = key || process.env.LLM_API_KEY;
      const useModel = (key && model) || process.env.LLM_MODEL;
      if (!useKey || !useModel) return res.status(500).json({ error: 'Muse Glimmer is not configured on this deployment yet.' });
      text = await callOpenAIShaped(process.env.LLM_BASE_URL || 'https://integrate.api.nvidia.com/v1', useKey, useModel, system, user);
    } else if (provider === 'anthropic') {
      if (!key) return res.status(400).json({ error: 'Paste your Anthropic key to use this provider.' });
      text = await callAnthropic(key, model || process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5', system, user);
    } else if (provider === 'openai') {
      if (!key) return res.status(400).json({ error: 'Paste your OpenAI key to use this provider.' });
      text = await callOpenAIShaped('https://api.openai.com/v1', key, model || process.env.OPENAI_MODEL || 'gpt-4.1-mini', system, user);
    } else if (provider === 'gemini') {
      if (!key) return res.status(400).json({ error: 'Paste your Gemini key to use this provider.' });
      text = await callGemini(key, model || process.env.GEMINI_MODEL || 'gemini-2.5-flash', system, user);
    } else {
      return res.status(400).json({ error: 'Unknown provider.' });
    }
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(502).json({ error: `The model call failed: ${err.message}` });
  }
}
