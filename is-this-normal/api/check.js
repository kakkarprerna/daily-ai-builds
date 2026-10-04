// Serverless function for Is This Normal?
// Default model: Meta Muse Glimmer on NVIDIA's free OpenAI-shaped endpoint, using the owner's key.
// Visitors can bring their own key for Anthropic, OpenAI or Gemini. A visitor key is used for
// that one request only. It is never logged or stored.

const SYSTEM_PROMPT = `You help parents understand whether something they have noticed about their child falls within the typical range for the child's age, according to published guidance from official child health bodies.

Sources you may draw on, and must name when you use them:
- CDC "Learn the Signs. Act Early." milestones (2022 revision; milestones most children, 75 percent or more, reach by each age)
- WHO Multicentre Growth Reference Study motor milestone windows
- NHS (UK) baby, toddler and child development pages
- AAP (American Academy of Pediatrics) HealthyChildren.org
- AEP (Asociación Española de Pediatría) and the Spanish Programa de Salud Infantil
- ASHA guidance on bilingual and multilingual language development

Rules:
1. You never diagnose. You never name a condition as likely or possible. You describe what is typical, what is worth watching, and when a professional should look.
2. Only state what these bodies actually say. If you are unsure of a figure, describe it in general terms rather than inventing a number. Never invent a source.
3. Pick exactly one verdict:
   - Typical: well within what the bodies describe for this age.
   - Worth watching: at the edge of the typical range, or typical but with a detail worth tracking for a few weeks.
   - Check with a professional: outside the range the bodies describe, or matches a sign they say should be checked.
4. Loss of a skill the child previously had is always "Check with a professional".
5. In multilingual homes, count words and skills across all languages together. Bilingualism does not cause language delay.
6. Write in British English, plain and warm, for a tired parent. No dashes used as punctuation. No jargon without a plain explanation.
7. Be specific to what the parent described. Refer to their details.

Reply ONLY with tagged lines in this exact format, one item per line, no other text:
VERDICT: Typical | Worth watching | Check with a professional
CONFIDENCE: High | Medium | Low
SUMMARY: one or two sentences in plain language
RANGE: the typical age range or norm for this skill or behaviour, in one line
SAYS: <body name> | <what that body says, paraphrased, one sentence>
WHY: one sentence of reasoning tied to the parent's details
TRY: one practical thing to try at home
WATCH: one sign that would change the picture over the next few weeks
CHECK: one situation in which they should book an appointment
ASK: one question to bring to an appointment
LIMIT: one thing this check cannot tell them

Give 2 to 4 SAYS lines, 2 to 3 WHY lines, 2 to 4 TRY lines, 2 to 3 WATCH lines, 2 to 3 CHECK lines, 2 to 3 ASK lines and 1 to 2 LIMIT lines.`;

function buildUserMessage(f) {
  const lines = [
    `Child's age: ${f.age || 'not given'}`,
    `Area: ${f.area || 'not given'}`,
    `What the parent noticed: ${f.noticed || 'not given'}`,
    `How long: ${f.duration || 'not given'}`,
    `Direction: ${f.direction || 'not given'}`,
    `Lost a skill they used to have: ${f.regression ? 'YES' : 'no'}`,
    `Recent changes: ${(f.changes || []).join(', ') || 'none mentioned'}`,
    `Languages at home: ${f.languages || 'not given'}`,
    `Country: ${f.country || 'not given'}`,
  ];
  return lines.join('\n');
}

async function callOpenAIShaped({ baseUrl, apiKey, model, user }) {
  const r = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 1400,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!r.ok) throw new Error(`Model provider returned ${r.status}`);
  const d = await r.json();
  return d.choices?.[0]?.message?.content || '';
}

async function callAnthropic({ apiKey, model, user }) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1400,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: user }],
    }),
  });
  if (!r.ok) throw new Error(`Anthropic returned ${r.status}`);
  const d = await r.json();
  return (d.content || []).map((c) => c.text || '').join('');
}

async function callGemini({ apiKey, model, user }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 1400 },
    }),
  });
  if (!r.ok) throw new Error(`Gemini returned ${r.status}`);
  const d = await r.json();
  return d.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
}

const DEFAULT_MODELS = {
  anthropic: 'claude-sonnet-5-5',
  openai: 'gpt-4.1-mini',
  gemini: 'gemini-2.5-flash',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST' });
    return;
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { form = {}, provider = 'glimmer', apiKey = '', model = '' } = body;

    if (!form.noticed || String(form.noticed).trim().length < 8) {
      res.status(400).json({ error: 'Please describe what you noticed in a sentence or two.' });
      return;
    }
    if (String(form.noticed).length > 2000) {
      res.status(400).json({ error: 'Please keep the description under 2,000 characters.' });
      return;
    }

    const user = buildUserMessage(form);
    let text = '';

    if (provider === 'glimmer') {
      const baseUrl = process.env.LLM_BASE_URL || 'https://integrate.api.nvidia.com/v1';
      const key = process.env.LLM_API_KEY;
      const m = process.env.LLM_MODEL;
      if (!key || !m) {
        res.status(500).json({ error: 'The default model is not configured on this deployment yet. Try an example, or bring your own key.' });
        return;
      }
      text = await callOpenAIShaped({ baseUrl, apiKey: key, model: m, user });
    } else {
      if (!apiKey) {
        res.status(400).json({ error: 'Add your API key for this provider, or switch back to the default model.' });
        return;
      }
      const m = model || DEFAULT_MODELS[provider];
      if (provider === 'anthropic') text = await callAnthropic({ apiKey, model: m, user });
      else if (provider === 'openai') text = await callOpenAIShaped({ baseUrl: 'https://api.openai.com/v1', apiKey, model: m, user });
      else if (provider === 'gemini') text = await callGemini({ apiKey, model: m, user });
      else {
        res.status(400).json({ error: 'Unknown provider.' });
        return;
      }
    }

    res.status(200).json({ text });
  } catch (err) {
    res.status(502).json({ error: err.message || 'Something went wrong reaching the model.' });
  }
}
