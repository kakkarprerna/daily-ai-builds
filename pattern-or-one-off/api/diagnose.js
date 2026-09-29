// Serverless function (Vercel). Muse Glimmer runs on the app's own server-side
// key by default — no key needed from visitors. Anthropic, OpenAI, and Gemini
// have no server-side fallback: a visitor who picks one of those must supply
// their own key, which is used for that single request only and never stored.

const MUSE_BASE_URL = process.env.LLM_BASE_URL || 'https://integrate.api.nvidia.com/v1'
const MUSE_MODEL = process.env.LLM_MODEL || 'meta/llama-3.3-70b-instruct' // set to your Muse Glimmer deployment id
const MUSE_API_KEY = process.env.LLM_API_KEY

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5'
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

const SYSTEM_PROMPT = `You are a senior engineering lead helping a product manager triage a bug report before deciding whether it needs to be escalated. The PM cannot read code and will not open a debugger — your job is to reason from the report itself.

Weigh these signals against each other rather than scoring them independently: how many times this has happened, whether there's a shape to the timing or trigger, how many people or which segment is affected, and what changed nearby (deploys, config, dependencies). A single report immediately after a deploy can outweigh several unrelated reports with nothing nearby. If the signals genuinely conflict or there isn't enough to go on, say so rather than forcing a confident verdict.

Reply in exactly this tagged-line format, one tag per line, nothing else before or after — no preamble, no markdown, no numbering:

VERDICT: Pattern | One-off | Unclear
CONFIDENCE: High | Medium | Low
REASONING: one tight paragraph, plain language, no jargon, on a single line
CHECK: a cheap, concrete thing to check before deciding (repeat this CHECK line 2-4 times for a short ordered list)
IF_PATTERN: what to do next if this is a pattern — only include this line if VERDICT is Pattern
IF_ONEOFF: what to do next if this is a one-off — only include this line if VERDICT is One-off
FLIP: what new information would change this verdict, on a single line

Ground REASONING and FLIP in the specific details given — do not write generic advice that could apply to any bug report.`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST.' })
    return
  }

  const { symptom, occurrences, timePattern, affected, changedNearby, notes, provider, apiKey } = req.body || {}

  if (!symptom || !occurrences || !affected || !changedNearby) {
    res.status(400).json({ error: 'Missing required fields.' })
    return
  }

  const chosenProvider = provider || 'muse'

  if (chosenProvider !== 'muse' && !apiKey) {
    res.status(400).json({ error: `An API key is required to use ${chosenProvider}.` })
    return
  }

  if (chosenProvider === 'muse' && !MUSE_API_KEY) {
    res.status(500).json({ error: 'The free demo is not configured yet (missing LLM_API_KEY).' })
    return
  }

  const userPrompt = `Bug report to triage:

What broke: ${symptom}
How many times this has happened before: ${occurrences}
Pattern to the timing/trigger: ${Array.isArray(timePattern) && timePattern.length ? timePattern.join(', ') : 'Not specified'}
Who's affected: ${affected}
What's changed nearby recently: ${changedNearby}
Additional notes: ${notes || 'None given'}`

  try {
    const text = await callProvider(chosenProvider, apiKey, userPrompt)

    if (!text.trim()) {
      res.status(502).json({ error: 'The model returned an empty response.' })
      return
    }

    res.status(200).json({ text })
  } catch (err) {
    res.status(502).json({ error: err.message || 'Could not reach the model provider. Try again shortly.' })
  }
}

async function callProvider(provider, visitorKey, userPrompt) {
  switch (provider) {
    case 'muse':
      return callOpenAiShaped(MUSE_BASE_URL, MUSE_API_KEY, MUSE_MODEL, userPrompt)
    case 'openai':
      return callOpenAiShaped('https://api.openai.com/v1', visitorKey, OPENAI_MODEL, userPrompt)
    case 'anthropic':
      return callAnthropic(visitorKey, userPrompt)
    case 'gemini':
      return callGemini(visitorKey, userPrompt)
    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}

async function callOpenAiShaped(baseUrl, key, model, userPrompt) {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 700,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Provider error: ${errText.slice(0, 200)}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

async function callAnthropic(key, userPrompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 700,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Anthropic error: ${errText.slice(0, 200)}`)
  }

  const data = await response.json()
  return (data.content || []).map((block) => block.text || '').join('')
}

async function callGemini(key, userPrompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 700 },
      }),
    }
  )

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Gemini error: ${errText.slice(0, 200)}`)
  }

  const data = await response.json()
  const parts = data.candidates?.[0]?.content?.parts || []
  return parts.map((p) => p.text || '').join('')
}
