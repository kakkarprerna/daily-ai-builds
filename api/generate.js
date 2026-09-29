import { SYSTEM_PROMPT, buildUserMessage } from './_prompt.js';

// Provider rules:
// - muse (default): runs on the owner's NVIDIA key (LLM_API_KEY). A visitor key is an optional override.
// - anthropic, openai, gemini: visitor must supply their own key. No server-side fallback.

const MAX_TOKENS = 4000;

async function callOpenAIShaped({ baseUrl, model, key, user }) {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      max_tokens: MAX_TOKENS,
      temperature: 0.4,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: user },
      ],
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `Provider returned ${res.status}`);
  return data?.choices?.[0]?.message?.content || '';
}

async function callAnthropic({ key, user }) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: user }],
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `Anthropic returned ${res.status}`);
  return (data?.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
}

async function callGemini({ key, user }) {
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { maxOutputTokens: MAX_TOKENS, temperature: 0.4 },
      }),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `Gemini returned ${res.status}`);
  return (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('\n');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST.' });
  }

  const { form, provider = 'muse', apiKey = '' } = req.body || {};
  if (!form || !String(form.description || '').trim()) {
    return res.status(400).json({ error: 'Describe what the feature does first.' });
  }

  const user = buildUserMessage(form);
  const visitorKey = String(apiKey || '').trim();

  try {
    let text = '';
    if (provider === 'muse') {
      const key = visitorKey || process.env.LLM_API_KEY;
      const model = process.env.LLM_MODEL;
      if (!key || !model) {
        return res.status(500).json({ error: 'The free Muse Glimmer model is not configured on this deployment.' });
      }
      text = await callOpenAIShaped({
        baseUrl: process.env.LLM_BASE_URL || 'https://integrate.api.nvidia.com/v1',
        model,
        key,
        user,
      });
    } else if (provider === 'anthropic') {
      if (!visitorKey) return res.status(400).json({ error: 'Paste your Anthropic API key to use Claude.' });
      text = await callAnthropic({ key: visitorKey, user });
    } else if (provider === 'openai') {
      if (!visitorKey) return res.status(400).json({ error: 'Paste your OpenAI API key to use OpenAI.' });
      text = await callOpenAIShaped({
        baseUrl: 'https://api.openai.com/v1',
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        key: visitorKey,
        user,
      });
    } else if (provider === 'gemini') {
      if (!visitorKey) return res.status(400).json({ error: 'Paste your Gemini API key to use Gemini.' });
      text = await callGemini({ key: visitorKey, user });
    } else {
      return res.status(400).json({ error: 'Unknown provider.' });
    }

    if (!text.trim()) return res.status(502).json({ error: 'The model returned an empty reply. Try again.' });
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(502).json({ error: err.message || 'The model call failed.' });
  }
}
