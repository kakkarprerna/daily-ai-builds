// Serverless function for So What?
// Takes pasted research, feedback or a metric readout plus the team's goal, and asks a model to
// pull out the insights and propose actions, using fixed word lists for every judgement.
// The model never ranks, buckets or estimates impact. Those are worked out in the browser with
// printed rules, including a check that every quoted piece of evidence really appears in the source.
// The prompt lives here, not in the browser bundle. Output uses tagged lines, not JSON,
// so any provider that follows a plain format works.

const MAX_SOURCE = 20000;
const MAX_FIELD = 1200;

const SYSTEM = `You help a product manager turn raw findings into a plan the team can act on this week.

You receive the team's goal, the metric it is measured by, the kind of material, and the material itself: interview notes, support tickets, survey answers, sales call notes, a metric readout or a mix.

First pull out 3 to 7 insights. An insight is one finding that the material supports, written as a plain statement, followed by "so what": why it matters for the stated goal, in one sentence. Merge findings that say the same thing. Do not invent findings the material does not support.

For each insight pick from these word lists, copying the words exactly:
Strength: Single mention, Repeated, Measured
- Single mention: one person or one data point says it.
- Repeated: several people or sources say it independently.
- Measured: a number in the material shows it.
Reach: Few, Some, Most (how many of the customers or users in scope it affects, judged from the material)

Give one evidence quote per insight, copied exactly from the material, 4 to 15 words. Do not paraphrase the quote.

Then propose 3 to 8 actions. Each action is something a team can do, named as a verb phrase. Each must be built on one or more insights. For each action pick from these word lists, copying the words exactly:
Lever: Activation, Conversion, Retention, Expansion, Pricing, Efficiency
Effort: Hours, Days, Weeks, Months
Owner: Product, Engineering, Design, Data, Sales, Customer success, Marketing, Operations
Goal fit: Direct, Supports, Off goal

Then for each action give:
- the first step someone can take this week, concrete enough to put in a calendar
- one metric to watch, with the direction it should move
- a stop condition: what result, by when, would mean dropping or rethinking it

Include at least one cheap action that tests a thin insight before anything big is built on it. Be honest with goal fit: an action can be useful and still be Off goal.

Finally list 2 to 4 gaps: what is missing from the material that would change the plan.

Do not rank the actions or estimate money. Write in plain British English. No jargon.

Output only tagged lines, one per line, in this format:
SUMMARY|<one sentence on what the material says overall>
INSIGHT|I<n>|<the finding>|<so what for the goal>|<Strength>|<Reach>|<exact quote from the material>
ACTION|A<n>|<insight ids separated by commas>|<action>|<Lever>|<Effort>|<Owner>|<Goal fit>|<first step this week>|<metric to watch>|<stop condition>
GAP|<what is missing>

Give exactly one SUMMARY, 3 to 7 INSIGHT lines, 3 to 8 ACTION lines and 2 to 4 GAP lines. No pipe characters inside fields. No markdown, no headings, no other text.`;

const clip = (s, n = MAX_FIELD) => String(s ?? '').slice(0, n);

function buildMessage(b) {
  return [
    `Team goal: ${clip(b.goal) || 'not given'}`,
    `Measured by: ${clip(b.goalMetric, 80) || 'not given'}`,
    `Kind of material: ${clip(b.sourceType, 80) || 'not given'}`,
    `Time frame: ${clip(b.horizon, 40) || 'not given'}`,
    '',
    'Material:',
    clip(b.source, MAX_SOURCE)
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
  const words = String(b.source || '').trim().split(/\s+/).filter(Boolean).length;
  if (words < 40) {
    return res.status(400).json({ error: 'Paste at least a short paragraph of findings, around 40 words or more, so there is something to work from.' });
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
