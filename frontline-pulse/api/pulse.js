// Serverless function for Frontline Pulse.
// Takes raw notes from sales calls, support tickets, customer success or field visits and asks a model to
// group them into recurring signals, with every judgement picked from fixed word lists and an exact quote
// for every mention. The model never counts accounts, adds up value, scores, routes or sets due dates.
// Those are worked out in the browser with printed rules, including a check that every quote and every
// figure really appears in the notes.
// The prompt lives here, not in the browser bundle. Output uses tagged lines, not JSON,
// so any provider that follows a plain format works.

const MAX_SOURCE = 24000;
const MAX_FIELD = 200;

const SYSTEM = `You help a product or revenue team turn raw notes from the people closest to customers into signals that someone can act on.

You receive the kind of notes, the period they cover, and the notes themselves: sales call notes, support tickets, customer success notes, field visit reports, win and loss notes or a mix. The notes name accounts, such as companies, clinics or shops.

Group the notes into 3 to 7 signals. A signal is one recurring blocker or request: something that stops or slows a deal, a go-live, daily use or a renewal. Merge notes that describe the same problem in different words. Keep separate problems separate, even if one account raised both. Include a signal even if only one account raised it, when it blocks money. Do not invent problems the notes do not describe.

For each signal pick from these word lists, copying the words exactly:
Stage: Winning the deal, Getting started, Day-to-day use, Renewal or reorder
Severity: Annoyance, Slows down, Blocks
- Blocks: the deal, go-live, use or reorder cannot go ahead until it is solved.
- Slows down: it goes ahead, with delay, extra work or doubt.
- Annoyance: people mention it but it changes nothing yet.
Fix: Build, Fix, Train, Change process, Message, Price
- Build: something the product does not do yet.
- Fix: something the product does, but wrongly.
- Train: the answer exists but the people in the field do not know it.
- Change process: an internal step, handoff or timing causes it.
- Message: customers believe something untrue about the product or offer.
- Price: the price, plan or terms cause it.
Workaround: None, Minutes, Hours (time the field team spends working around it each time it comes up)

Then for each signal give:
- the ask: one concrete request to the team that owns the fix, something they can say yes or no to
- the field reply: what the person talking to customers should say or do now, in one or two sentences, using only facts in the notes. If the notes give no answer, say what they can promise honestly, such as when they will hear back.

Then list every mention of each signal: the account, the value of that account or deal exactly as written in the notes (or none), and one quote copied exactly from the notes, 4 to 15 words. Do not paraphrase quotes. One account can be mentioned more than once.

Finally list 2 to 4 gaps: what the notes do not say that would change where these signals should go.

Do not count accounts, add up values, rank or score anything. Write in plain British English. No jargon.

Output only tagged lines, one per line, in this format:
SUMMARY|<one sentence on what the field is saying overall>
SIGNAL|S<n>|<short name>|<what is happening, one sentence>|<Stage>|<Severity>|<Fix>|<Workaround>|<the ask>|<the field reply>
MENTION|S<n>|<account>|<value as written or none>|<exact quote from the notes>
GAP|<what the notes do not say>

Give exactly one SUMMARY, 3 to 7 SIGNAL lines each followed by its MENTION lines, and 2 to 4 GAP lines. No pipe characters inside fields. No markdown, no headings, no other text.`;

const clip = (s, n = MAX_FIELD) => String(s ?? '').slice(0, n);

function buildMessage(b) {
  return [
    `Kind of notes: ${clip(b.sourceType, 80) || 'not given'}`,
    `Period covered: ${clip(b.period, 40) || 'not given'}`,
    `What the team sells: ${clip(b.context) || 'not given'}`,
    '',
    'Notes:',
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
      max_tokens: 3200,
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
    body: JSON.stringify({ model, max_tokens: 3200, temperature: 0, system, messages: [{ role: 'user', content: user }] })
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
      generationConfig: { temperature: 0, maxOutputTokens: 3200 }
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
  if (words < 60) {
    return res.status(400).json({ error: 'Paste a few notes, around 60 words or more, that name the accounts they came from.' });
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
