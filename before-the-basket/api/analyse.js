import { SYSTEM_PROMPT, buildUserText } from './_prompt.js';

// One serverless function, four providers.
// "glimmer" runs on the site owner's key (env vars). The other three use a key the
// visitor pastes in; it is forwarded for this one request and never stored or logged.

const DEFAULT_MODELS = {
  anthropic: 'claude-sonnet-5',
  openai: 'gpt-5-mini',
  gemini: 'gemini-2.5-flash',
};

const MAX_TOKENS = 1800;

function bad(res, status, message) {
  res.status(status).json({ error: message });
}

function clean(s, max = 4000) {
  return typeof s === 'string' ? s.slice(0, max) : '';
}

async function callOpenAIShaped({ baseUrl, apiKey, model, userText, image, isOpenAI = false }) {
  const content = image
    ? [
        { type: 'text', text: userText },
        { type: 'image_url', image_url: { url: `data:${image.mediaType};base64,${image.data}` } },
      ]
    : userText;
  // OpenAI's newer models take max_completion_tokens and only the default temperature.
  const limits = isOpenAI ? { max_completion_tokens: 6000 } : { temperature: 0.2, max_tokens: MAX_TOKENS };
  const r = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      ...limits,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content },
      ],
    }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error?.message || j?.detail || `Provider returned ${r.status}`);
  return j?.choices?.[0]?.message?.content || '';
}

async function callAnthropic({ apiKey, model, userText, image }) {
  const content = [{ type: 'text', text: userText }];
  if (image) {
    content.unshift({ type: 'image', source: { type: 'base64', media_type: image.mediaType, data: image.data } });
  }
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error?.message || `Anthropic returned ${r.status}`);
  return (j.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
}

async function callGemini({ apiKey, model, userText, image }) {
  const parts = [{ text: userText }];
  if (image) parts.unshift({ inline_data: { mime_type: image.mediaType, data: image.data } });
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts }],
      generationConfig: { temperature: 0.2, maxOutputTokens: MAX_TOKENS },
    }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error?.message || `Gemini returned ${r.status}`);
  return (j?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('\n');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return bad(res, 405, 'Use POST.');

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const provider = ['glimmer', 'anthropic', 'openai', 'gemini'].includes(body.provider) ? body.provider : 'glimmer';

  const input = {
    product: clean(body.product, 200),
    category: clean(body.category, 80),
    region: clean(body.region, 80),
    origin: clean(body.origin, 300),
    price: clean(body.price, 80),
    claims: Array.isArray(body.claims) ? body.claims.slice(0, 12).map((c) => clean(c, 60)) : [],
    dietary: Array.isArray(body.dietary) ? body.dietary.slice(0, 8).map((c) => clean(c, 60)) : [],
    mode: body.mode === 'photo' ? 'photo' : 'text',
    ingredients: clean(body.ingredients, 4000),
  };

  let image = null;
  if (input.mode === 'photo') {
    const img = body.image || {};
    if (!img.data || !/^image\/(jpeg|png|webp)$/.test(img.mediaType || '')) {
      return bad(res, 400, 'The label photo did not arrive. Try taking it again.');
    }
    if (img.data.length > 4_000_000) return bad(res, 413, 'That photo is too large. Try a closer, smaller shot.');
    image = { data: img.data, mediaType: img.mediaType };
  } else if (!input.ingredients.trim() && !input.product.trim()) {
    return bad(res, 400, 'Add the product name and its ingredients first.');
  }

  const userText = buildUserText(input);

  try {
    let text;
    if (provider === 'glimmer') {
      const { LLM_BASE_URL, LLM_MODEL, LLM_API_KEY, LLM_VISION_MODEL } = process.env;
      if (!LLM_BASE_URL || !LLM_MODEL || !LLM_API_KEY) {
        return bad(res, 503, 'The free model is not set up on this site yet. Pick your own provider under Model to try it.');
      }
      if (image && !LLM_VISION_MODEL) {
        return bad(res, 422, 'The free model reads text only. Type the ingredients instead, or switch to your own Anthropic, OpenAI or Gemini key to use a photo.');
      }
      text = await callOpenAIShaped({
        baseUrl: LLM_BASE_URL,
        apiKey: LLM_API_KEY,
        model: image ? LLM_VISION_MODEL : LLM_MODEL,
        userText,
        image,
      });
    } else {
      const apiKey = clean(body.apiKey, 300).trim();
      if (!apiKey) return bad(res, 400, 'Paste your API key under Model, or switch back to the free model.');
      const model = clean(body.model, 100).trim() || DEFAULT_MODELS[provider];
      if (provider === 'anthropic') text = await callAnthropic({ apiKey, model, userText, image });
      if (provider === 'openai') text = await callOpenAIShaped({ baseUrl: 'https://api.openai.com/v1', apiKey, model, userText, image, isOpenAI: true });
      if (provider === 'gemini') text = await callGemini({ apiKey, model, userText, image });
    }
    if (!text || !text.trim()) return bad(res, 502, 'The model sent back an empty answer. Try again.');
    return res.status(200).json({ text });
  } catch (err) {
    return bad(res, 502, `The model could not finish: ${String(err.message || err).slice(0, 240)}`);
  }
}
