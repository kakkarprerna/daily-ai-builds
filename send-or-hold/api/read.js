// Serverless function for Send or Hold?
// A model reads one guest message against the host's house facts. It quotes what the guest wants,
// flags how the message reads, lists the facts it used and drafts a reply and a holding reply.
// It never picks the lane. Printed rules in src/rules.js do that, and every quote is checked in the browser.
// The prompt lives here, not in the browser bundle. Output uses tagged lines, not JSON,
// so any provider that follows a plain format works.

import { ASKS, SIGNALS } from '../src/rules.js';

const MAX_MESSAGE = 3000;
const MAX_FACTS = 5000;
const MAX_FIELD = 120;
const clip = (s, n = MAX_FIELD) => String(s ?? '').slice(0, n);

const askList = ASKS.map((a) => `- ${a.id}: ${a.label}`).join('\n');
const signalList = SIGNALS.map((s) => `- ${s.id}: ${s.label}`).join('\n');

const SYSTEM = `You help the AI co-host of a holiday rental answer one guest message. A separate set of fixed rules decides whether your reply can be sent alone, needs the host to check it, needs the host to decide, or needs the host to act now. You never decide that. Your job is to read the message, point at what the guest wants and how the message reads, and draft the wording.

1. Each thing the guest asks for or tells the host, as an ASK. Use a kind copied exactly from this list:
${askList}
For each, say what they want in under 12 words, then copy 3 to 25 words from the message, exactly as written, that show it.

2. How the message reads, as a SIGNAL, only when the message shows it. Use a kind copied exactly from this list:
${signalList}
Copy 3 to 25 words from the message exactly, then one plain sentence on why it matters. Flag any risk to people or the property as safety, even if the guest sounds calm.

3. Each sentence from the house facts your reply relies on, as a FACT, copied exactly from the house facts.

4. Each question the house facts do not answer, as a GAP, in under 12 words.

5. A reply to the guest, in the language the guest wrote in, as REPLY lines (one line per sentence, 2 to 6 lines). Only state what the house facts say. Never invent a time, price, code, phone number or name. Never agree to a discount, refund, early check-in, late check-out, extra guests, pets or a date change: say the host will confirm. Never ask the guest to pay or talk outside the booking platform. Warm, short, plain.

6. A holding reply, in the guest's language, as HOLD lines (1 or 2 lines): thank them and say the host will reply soon, without answering anything that needs the host.

Also give one SUMMARY sentence in plain British English, and the language the guest wrote in as LANG (for example English, Spanish, German, French).

Output only tagged lines, one per line, in this format:
SUMMARY|<one sentence>
LANG|<language>
ASK|<kind>|<what they want>|<exact words from the message>
SIGNAL|<kind>|<exact words from the message>|<why, one sentence>
FACT|<exact words from the house facts>
GAP|<question the facts do not answer>
REPLY|<one sentence of the reply>
HOLD|<one sentence of the holding reply>

Give exactly one SUMMARY and one LANG, 1 to 6 ASK lines, 0 to 4 SIGNAL lines, 0 to 8 FACT lines, 0 to 4 GAP lines, 2 to 6 REPLY lines and 1 or 2 HOLD lines. No pipe characters inside fields. No markdown, no headings, no other text.`;

function buildMessage(b) {
  return [
    `Property: ${clip(b.property) || 'not given'}`,
    `Booked through: ${clip(b.channel, 40)}`,
    `Booking stage: ${clip(b.stage, 40)}`,
    `Message arrived: ${clip(b.time, 40)}`,
    '',
    'House facts:',
    clip(b.facts, MAX_FACTS) || 'none given',
    '',
    'Guest message:',
    clip(b.message, MAX_MESSAGE)
  ].join('\n');
}

async function callOpenAIShaped(base, key, model, system, user) {
  const r = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: 1500,
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
    body: JSON.stringify({ model, max_tokens: 1500, temperature: 0, system, messages: [{ role: 'user', content: user }] })
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
      generationConfig: { temperature: 0, maxOutputTokens: 1500 }
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
  if (String(b.message || '').trim().length < 10) {
    return res.status(400).json({ error: 'Paste the guest message first.' });
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
