// Vercel serverless function
// Default path (no provider/key from the visitor): Meta Muse Glimmer 30B via NVIDIA's
// OpenAI-shaped free endpoint, configured with LLM_BASE_URL / LLM_MODEL / LLM_API_KEY.
// Visitor-supplied path: the visitor picks a provider and pastes their own key in the UI,
// that key is used for this request only and is never written to disk or logged.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { provider, apiKey, prompt } = req.body || {};

  if (!prompt) {
    res.status(400).json({ error: 'Missing prompt' });
    return;
  }

  if (['anthropic', 'openai', 'gemini'].includes(provider) && !apiKey) {
    res.status(400).json({ error: 'This provider needs your own API key' });
    return;
  }

  try {
    let text = '';

    if (provider === 'anthropic') {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await r.json();
      text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
    } else if (provider === 'openai') {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await r.json();
      text = data.choices?.[0]?.message?.content || '';
    } else if (provider === 'gemini') {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
      const data = await r.json();
      text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else {
      // Muse Glimmer path (also the default when no provider is specified):
      // Meta Muse Glimmer 30B via NVIDIA, using the visitor's own key if they supplied one.
      const base = process.env.LLM_BASE_URL || 'https://integrate.api.nvidia.com/v1';
      const model = process.env.LLM_MODEL;
      const key = apiKey || process.env.LLM_API_KEY;
      const r = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await r.json();
      text = data.choices?.[0]?.message?.content || '';
    }

    if (!text) {
      res.status(502).json({ error: 'No response from the model' });
      return;
    }

    res.status(200).json({ text });
  } catch (err) {
    res.status(500).json({ error: 'Provider request failed' });
  }
}
