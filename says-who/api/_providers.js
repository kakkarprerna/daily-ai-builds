// One function, four providers. Output is tagged lines, so swapping
// providers needs no change to parsing.

const MAX_TOKENS = 1400;

async function readError(res) {
  const body = await res.text().catch(() => '');
  return `${res.status} ${body.slice(0, 300)}`;
}

async function openAiShaped({ baseUrl, key, model, system, user }) {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: MAX_TOKENS,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(await readError(res));
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '';
}

async function anthropic({ key, model, system, user }) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: MAX_TOKENS,
      temperature: 0.2,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  if (!res.ok) throw new Error(await readError(res));
  const data = await res.json();
  return (data?.content || []).map((c) => c.text || '').join('');
}

async function gemini({ key, model, system, user }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: MAX_TOKENS },
    }),
  });
  if (!res.ok) throw new Error(await readError(res));
  const data = await res.json();
  return (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
}

export async function callModel({ provider, apiKey, system, user }) {
  const env = process.env;
  switch (provider) {
    case 'anthropic':
      if (!apiKey) throw new Error('Add your Anthropic key in Model & key.');
      return anthropic({ key: apiKey, model: env.ANTHROPIC_MODEL || 'claude-sonnet-5-5', system, user });
    case 'openai':
      if (!apiKey) throw new Error('Add your OpenAI key in Model & key.');
      return openAiShaped({
        baseUrl: 'https://api.openai.com/v1',
        key: apiKey,
        model: env.OPENAI_MODEL || 'gpt-4.1',
        system,
        user,
      });
    case 'gemini':
      if (!apiKey) throw new Error('Add your Gemini key in Model & key.');
      return gemini({ key: apiKey, model: env.GEMINI_MODEL || 'gemini-2.5-flash', system, user });
    case 'muse':
    default:
      if (!env.LLM_API_KEY || !env.LLM_MODEL) {
        throw new Error('The free default model is not configured on this deployment yet.');
      }
      return openAiShaped({
        baseUrl: env.LLM_BASE_URL || 'https://integrate.api.nvidia.com/v1',
        key: env.LLM_API_KEY,
        model: env.LLM_MODEL,
        system,
        user,
      });
  }
}
