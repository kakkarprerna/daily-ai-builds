// Serverless function for What It Counts.
// Takes a SQL query and the question it is meant to answer, and asks a model to explain it in plain words,
// line by line, and to raise traps from a fixed list, each tied to an exact piece of the query.
// The model never sets severity or the verdict. Pattern checks, the quote check, severity, the verdict
// and the message to the analyst are all worked out in the browser with printed rules.
// The prompt lives here, not in the browser bundle. Output uses tagged lines, not JSON,
// so any provider that follows a plain format works.

const MAX_QUERY = 16000;
const MAX_FIELD = 300;

const SYSTEM = `You help a product manager who does not write SQL understand a query someone else wrote, before they quote its number.

You receive the question the number is meant to answer, the database it runs on, and the query.

Explain what the query actually does, in plain British English, for someone who knows the business but not SQL. Explain what it does, not what it was meant to do. No jargon unless you explain it.

Give:
- a one-sentence summary of what number the query returns, in business words
- the grain: what one row stands for just before any counting or adding up, and in the final result
- whether the query answers the question asked: Matches, Partly or Does not match, with one sentence why
- 4 to 10 steps in the order the database applies them, each tied to a piece of the query copied exactly, 2 to 12 words, and one sentence on what that piece does
- traps: things in the query that could make the number wrong. Only raise a trap you can point to in the query. Pick each trap's name from this list, copying the words exactly:
Double counting, Rows dropped, Null trap, Rows not people, Integer division, Wrong average, Date edge, Hardcoded filter, AND/OR order, Time zone, Unstable result
  - Double counting: a join or repeated rows make a total or count too big
  - Rows dropped: a join, filter or limit leaves out rows that belong in the answer
  - Null trap: empty values make a comparison quietly fail
  - Rows not people: the question is about people or accounts, the query counts rows
  - Integer division: whole numbers divided, decimals lost in this database
  - Wrong average: an average of averages, rates or percentages
  - Date edge: a range that cuts off part of its first or last day
  - Hardcoded filter: typed IDs or labels with no stated reason
  - AND/OR order: AND and OR mixed without brackets
  - Time zone: days cut in the database time zone
  - Unstable result: rows cut without a fixed order
- 2 to 4 questions to ask the person who wrote the query, about meaning rather than syntax
- 2 to 5 SQL words used in the query, each explained in one plain sentence

Do not score anything or say whether the number can be used. Copy every piece of the query exactly as written, including quote marks and capital letters.

Output only tagged lines, one per line, in this format:
SUMMARY|<one sentence>
GRAIN|<what one row stands for>
MATCH|<Matches or Partly or Does not match>|<one sentence why>
STEP|<n>|<exact piece of the query>|<what it does>
TRAP|<trap name from the list>|<exact piece of the query>|<what could go wrong, one or two sentences>
QUESTION|<question for the author>
TERM|<SQL word>|<plain meaning>

Give exactly one SUMMARY, GRAIN and MATCH, 4 to 10 STEP lines, 0 to 6 TRAP lines, 2 to 4 QUESTION lines and 2 to 5 TERM lines. No pipe characters inside fields. No markdown, no headings, no other text.`;

const clip = (s, n = MAX_FIELD) => String(s ?? '').slice(0, n);

function buildMessage(b) {
  return [
    `Question the number should answer: ${clip(b.question) || 'not given'}`,
    `Database: ${clip(b.dialect, 40) || 'not given'}`,
    '',
    'Query:',
    clip(b.query, MAX_QUERY)
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
  if (!/\bselect\b/i.test(String(b.query || ''))) {
    return res.status(400).json({ error: 'Paste a SQL query that includes a SELECT.' });
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
