// Serverless function for Mischmasch.
// A model suggests a small set of new words on a topic, in English, Spanish, German and Chinese.
// The core word bank never comes from here: it is written into the app and checked by hand.
// Every line the model sends back is checked in the browser (src/aiwords.js) before a child sees it,
// and the grown-up reviews the set before adding it. The prompt lives here, not in the browser bundle.
// Output uses tagged lines, not JSON, so any provider that follows a plain format works.

const clip = (s, n) => String(s ?? '').replace(/[|\n\r]/g, ' ').slice(0, n).trim();

const SYSTEM = `You write vocabulary for an 8-year-old at a bilingual school in Spain. He speaks English and Spanish well and is in his first year of German (Paul, Lisa & Co Starter) and Chinese (Kuaile Hanyu 1).

Given a topic, give 8 everyday, concrete, picturable words a child that age would meet. Prefer single nouns. Every word must be suitable for a young child: nothing scary, violent, rude, romantic, medical, about drugs or alcohol, or about real people or brands.

If the topic itself is not suitable for a young child, output one line only: UNSUITABLE|<a short, kind reason>

For each word give:
- one emoji that pictures it
- the English word, lower case unless it is a proper noun
- the Spanish article (el, la, los or las), or - if it is not a noun
- the Spanish word without the article, with correct accents
- the German article (der, die or das), or - if it is not a noun
- the German word without the article, nouns with a capital letter, with correct umlauts and ß
- the Chinese word in simplified characters, 1 to 4 characters, the most common word a mainland school would teach
- the pinyin with tone marks, one syllable per character, syllables separated by single spaces, neutral tone with no mark

Use the standard word used in Spain for Spanish and in Germany for German. Do not give words that are the same in every language.

Output only tagged lines, one per line, in this format:
WORD|<emoji>|<english>|<spanish article>|<spanish>|<german article>|<german>|<chinese>|<pinyin>

Give exactly 8 WORD lines. No pipe characters inside fields. No numbering, no markdown, no other text.`;

async function callOpenAIShaped(base, key, model, system, user) {
  const r = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: 1200,
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
    body: JSON.stringify({ model, max_tokens: 1200, temperature: 0.4, system, messages: [{ role: 'user', content: user }] })
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
      generationConfig: { temperature: 0.4, maxOutputTokens: 1200 }
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
  const topic = clip(b.topic, 40);
  if (topic.length < 2) return res.status(400).json({ error: 'Pick or type a topic first.' });
  const user = `Topic: ${topic}`;
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
