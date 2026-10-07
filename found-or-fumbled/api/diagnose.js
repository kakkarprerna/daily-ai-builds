// Serverless function for Found or Fumbled?
// Takes one bad answer from a retrieval-augmented (RAG) assistant, the chunks it retrieved,
// and the signals the browser already worked out, and asks a model which stage of the
// pipeline most likely broke. The prompt lives here, not in the browser bundle.
// Model output uses tagged lines, not JSON, so any provider that follows a plain format works.

const MAX_CHUNKS = 12;
const MAX_FIELD = 4000;
const MAX_CHUNK = 2500;

const SYSTEM = `You help a product manager work out why a retrieval-augmented (RAG) assistant gave a bad answer, before they pull in engineering.

You receive the user's question, the answer the assistant gave, the answer it should have given (if known), the chunks the retriever returned in rank order (C1 is the top result), facts the PM ticked about the setup, and signals the browser worked out by matching words and numbers.

Pick the ONE stage most likely to have caused the bad answer, from these codes:
GAP = the knowledge base never contained the right answer, and the assistant should have said it did not know
STALE = an outdated or conflicting version of the source was indexed and used
MISS = the right content exists in the knowledge base but no retrieved chunk contains it
RANK = a chunk with the right content was retrieved but ranked low, below chunks that misled the answer
CHUNK = the right content was cut across chunk boundaries, so the retrieved chunk held only part of it
IGNORED = a retrieved chunk held the right answer and the assistant contradicted or skipped it
INVENTED = the answer adds specific details (numbers, conditions, promises) that no chunk supports
REFUSAL = the assistant refused or deflected when a chunk held the answer

How to decide:
- Work from the evidence in the chunks. Quote chunk ids (C1, C2...) for every claim you make about them.
- Separate what the text shows from what you are guessing. If the deciding evidence is outside what you were given (for example whether a document exists in the knowledge base), lower your confidence and say what to check.
- The browser signals come from simple word matching. Use them as hints, and say so when you disagree with them.
- A wrong answer can have two causes. Give the main one in VERDICT and at most two others in ALSO.
- Write for a product manager, in plain British English. Name the fix owner as one of: Content, Search, Prompt, Product.

Output only tagged lines, one per line, in this format:
VERDICT|<code>|<High, Medium or Low>|<one plain sentence naming what broke>
WHY|<two or three plain sentences explaining the reasoning, citing chunk ids>
ALSO|<code>|<one sentence on how it contributed>
CLAIM|<a claim from the assistant's answer>|<Supported, Contradicted or Unsupported>|<chunk id, or none>
EVIDENCE|<chunk id or ANSWER>|<what it shows, one sentence>
CHECK|<a cheap check the PM can run without engineering>|<the result that would confirm the verdict>
FIX|<Content, Search, Prompt or Product>|<the fix in one or two sentences>
FLIP|<a finding that would change the verdict, and to which code>
TICKET|<a short ticket title>|<a ticket body of three to five sentences: what happened, evidence, suspected stage, suggested fix>

Give exactly one VERDICT, one WHY and one TICKET. Give two to five CLAIM lines, two to four CHECK lines, one to three FIX lines and one or two FLIP lines. No pipe characters inside fields. No markdown, no headings, no other text.`;

function clip(s, n = MAX_FIELD) {
  return String(s ?? '').slice(0, n);
}

function buildMessage(b) {
  const L = [];
  L.push(`Question: ${clip(b.question)}`);
  L.push(`Answer the assistant gave: ${clip(b.answer)}`);
  L.push(`Answer it should have given: ${b.expected ? clip(b.expected) : 'not provided'}`);
  L.push('');
  L.push('Setup facts ticked by the PM:');
  const f = b.facts || {};
  L.push(`- Is the right answer in the knowledge base: ${clip(f.inKb || 'Not sure', 200)}`);
  L.push(`- Has the source changed recently: ${clip(f.changed || 'Not sure', 200)}`);
  L.push(`- What looks wrong: ${clip(f.symptom || 'Not given', 200)}`);
  L.push(`- Retriever returns: ${clip(f.topK || 'Not given', 200)}`);
  if (f.notes) L.push(`- Notes: ${clip(f.notes, 1000)}`);
  L.push('');
  L.push('Signals worked out in the browser by matching words and numbers:');
  for (const s of (b.signals || []).slice(0, 12)) L.push(`- ${clip(s, 300)}`);
  L.push('');
  L.push('Retrieved chunks, in rank order:');
  for (const c of b.chunks) {
    const meta = [c.source && `source ${c.source}`, c.updated && `updated ${c.updated}`, c.score && `score ${c.score}`]
      .filter(Boolean)
      .join(', ');
    L.push(`--- ${clip(c.id, 10)}${meta ? ` (${clip(meta, 300)})` : ''}`);
    L.push(clip(c.text, MAX_CHUNK));
  }
  return L.join('\n');
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
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
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

  if (!String(b.question || '').trim()) return res.status(400).json({ error: 'Add the question first.' });
  if (!String(b.answer || '').trim()) return res.status(400).json({ error: 'Add the answer the assistant gave.' });
  if (!Array.isArray(b.chunks)) return res.status(400).json({ error: 'No chunks sent.' });
  if (b.chunks.length > MAX_CHUNKS) return res.status(400).json({ error: `Up to ${MAX_CHUNKS} chunks per run.` });

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
