// Vercel serverless function (Node runtime).
// Muse Glimmer runs on Prerna's own NVIDIA key, set as env vars below.
// Anthropic, OpenAI and Gemini are bring-your-own-key: the visitor's key is
// used for that one request only and is never written to disk or logged.

const SYSTEM_PROMPT = `You are a safety-reading assistant. You are given a description of a conversation someone had with an AI chatbot (ChatGPT, Claude, Perplexity, Character.AI, or similar). Your only job is to assess whether the AI's responses in that conversation could have put the person in physical, emotional, or relational danger. You never generate, complete, improve, or elaborate on any harmful content yourself. You only assess what is described to you.

Assess three signals, each as none, watch, or flag:
PHYSICAL: could following this advice cause physical harm? (dangerous substances, doses, combinations, self-harm methods, unsafe physical acts)
EMOTIONAL: does the conversation show real emotional distress, crisis, or hopelessness that was not adequately addressed?
TRUST: does the conversation show manipulation, secrecy-building, isolation from other people, or exploitation?

Then give an overall RISK_LEVEL of green, amber, or red, and a CONFIDENCE percentage.

Respond in exactly this tagged format, one item per line, nothing before or after it:
RISK_LEVEL: green|amber|red
CONFIDENCE: <0-100>
PHYSICAL: none|watch|flag
EMOTIONAL: none|watch|flag
TRUST: none|watch|flag
SUMMARY: <one plain-language sentence>
REASONING: <two to three sentences, grounded in specific moments described>
NEXT_STEP: <one or two practical, non-alarmist sentences, written directly to the person>
WHAT_WOULD_CHANGE: <one sentence on what would move the verdict up or down>

Write SUMMARY and NEXT_STEP in a warm, non-clinical, non-judgemental voice, suitable for a teenager reading it directly, never a lecture. Never include a specific dosage, quantity, method, or step-by-step detail in any field, even to illustrate the risk. Describe the category of concern only, never the specifics.`

const MAX_TRANSCRIPT_CHARS = 6000

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { transcript, tool, provider, apiKey } = req.body || {}

  if (!transcript || typeof transcript !== 'string' || transcript.trim().length < 20) {
    return res.status(400).json({ error: 'Add a bit more detail about what happened first.' })
  }

  const clipped = transcript.slice(0, MAX_TRANSCRIPT_CHARS)
  const userPrompt = `AI tool involved: ${tool || 'not specified'}\n\nConversation description:\n${clipped}`

  try {
    let raw
    switch (provider) {
      case 'anthropic':
        raw = await callAnthropic(userPrompt, apiKey)
        break
      case 'openai':
        raw = await callOpenAI(userPrompt, apiKey)
        break
      case 'gemini':
        raw = await callGemini(userPrompt, apiKey)
        break
      case 'muse':
      default:
        raw = await callMuse(userPrompt)
        break
    }
    return res.status(200).json({ raw })
  } catch (err) {
    console.error('scan error', err)
    return res.status(500).json({ error: err.message || 'That read could not be completed. Try again shortly.' })
  }
}

async function callMuse(userPrompt) {
  const baseUrl = process.env.LLM_BASE_URL
  const model = process.env.LLM_MODEL
  const key = process.env.LLM_API_KEY
  if (!baseUrl || !model || !key) {
    throw new Error('The free option is not configured yet. Try one of the bring-your-own-key providers.')
  }

  const r = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      max_tokens: 600,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    }),
  })
  if (!r.ok) throw new Error(`Free option is unavailable right now (${r.status}).`)
  const data = await r.json()
  return data.choices?.[0]?.message?.content || ''
}

async function callAnthropic(userPrompt, apiKey) {
  if (!apiKey) throw new Error('Add your Anthropic API key first.')
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })
  if (!r.ok) {
    const detail = await r.json().catch(() => ({}))
    throw new Error(detail.error?.message || `Anthropic request failed (${r.status}).`)
  }
  const data = await r.json()
  return data.content?.[0]?.text || ''
}

async function callOpenAI(userPrompt, apiKey) {
  if (!apiKey) throw new Error('Add your OpenAI API key first.')
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 600,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    }),
  })
  if (!r.ok) {
    const detail = await r.json().catch(() => ({}))
    throw new Error(detail.error?.message || `OpenAI request failed (${r.status}).`)
  }
  const data = await r.json()
  return data.choices?.[0]?.message?.content || ''
}

async function callGemini(userPrompt, apiKey) {
  if (!apiKey) throw new Error('Add your Gemini API key first.')
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }] }],
      }),
    }
  )
  if (!r.ok) {
    const detail = await r.json().catch(() => ({}))
    throw new Error(detail.error?.message || `Gemini request failed (${r.status}).`)
  }
  const data = await r.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}
