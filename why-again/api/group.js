// Serverless function for Why Again?
// A model reads the pasted support tickets, groups the ones that share a cause, quotes one phrase per
// group and answers four yes/no questions. It never ranks, scores or picks a fix lane. Printed rules
// in src/rules.js do that in the browser, and they check every ticket ID and quote against the paste.
// The prompt lives here, not in the browser bundle. Output uses tagged lines, not JSON,
// so any provider that follows a plain format works.

const MAX_TICKETS = 120;
const MAX_LINE = 400;
const MAX_FIELD = 120;
const clip = (s, n = MAX_FIELD) => String(s ?? '').slice(0, n);

const SYSTEM = `You help a support or product lead find out why customers keep contacting support. You read a set of support tickets and group the ones that share the same underlying cause. Fixed rules then count the repeats, check your work, choose the fix lane and rank the groups. You never rank, score or give a verdict.

Rules:
- Group by underlying cause, not by shared words. Refund tickets caused by a slow manual step and refund tickets caused by a wrong price are two different causes.
- A group needs at least two tickets. Leave a ticket out of every group if no other ticket shares its cause.
- Use ticket IDs exactly as given. Put each ticket in one group at most.
- For each group, copy one phrase of 3 to 12 words exactly as the customer wrote it in one of that group's tickets. Do not reword it.
- For each group, answer four questions with yes or no:
  A Broke: did the product fail or do something wrong, such as an error, a wrong figure, missing data or a feature not working?
  B Unclear: did the product work as built, but the customer could not tell how to do something or what had happened?
  C Our side: did a person, policy or manual step on the company's side cause or delay it?
  D Answerable: would a clear help article or in-product message have answered it without a contact?
- For each group, name one change that would stop these contacts, the team that owns that change (for example Engineering, Product design, Finance operations, Customer operations, Support content), and the number that would show the change worked.
- Write in plain British English. No pipe characters inside fields.

Give at most 8 groups, largest first. Output only tagged lines, one per line, in this format:
SUMMARY|<one sentence on what drives most of these tickets>
GROUP|<group number>|<short name for the cause, under 8 words>|<ticket IDs, comma separated>|<exact phrase from one of its tickets>
ANS|<group number>|<A yes or no>|<B yes or no>|<C yes or no>|<D yes or no>
FIX|<group number>|<the change, one sentence>|<owning team>|<the number that would show it worked>

Give exactly one SUMMARY, then a GROUP, ANS and FIX line for every group. No markdown, no headings, no other text.`;

function buildMessage(b) {
  const lines = String(b.tickets || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, MAX_TICKETS)
    .map((l) => clip(l, MAX_LINE));
  return [
    `Product: ${clip(b.product) || 'not given'}`,
    `Product type: ${clip(b.type, 60)}`,
    `Support channel: ${clip(b.channel, 40)}`,
    `Period: ${clip(b.window, 40)}`,
    '',
    'Tickets (ID | customer | date | message, some fields may be missing):',
    ...lines
  ].join('\n');
}

async function callOpenAIShaped(base, key, model, system, user) {
  const r = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: 2000,
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
    body: JSON.stringify({ model, max_tokens: 2000, temperature: 0, system, messages: [{ role: 'user', content: user }] })
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
      generationConfig: { temperature: 0, maxOutputTokens: 2000 }
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
  const count = String(b.tickets || '').split(/\r?\n/).filter((l) => l.trim()).length;
  if (count < 2) return res.status(400).json({ error: 'Paste at least two tickets, one per line.' });

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
