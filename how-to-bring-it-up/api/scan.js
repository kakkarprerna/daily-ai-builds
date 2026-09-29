const SYSTEM_PROMPT = `You help a parent or guardian figure out how to open a hard conversation with their child about something involving an AI chatbot, without it landing as an accusation.

You are given the child's age band, what the parent noticed or found, optionally how they found out, and optionally what worries them most.

Tailor every field specifically to the age band given. What works for a curious 9 year old and what works for a guarded 16 year old should read differently, in vocabulary, tone, and what you assume they already understand. Ground every field in the specific details the parent described. Do not fall back on generic, one-size-fits-all advice that could apply to any parent-child situation, if a line could be pasted into any other answer unchanged, rewrite it to be specific to this one.

First decide if a conversation is warranted at all. Most things a curious kid asks an AI chatbot are completely ordinary. If nothing in the description suggests a real concern, LEVEL should be none, and you should say plainly that no intervention is needed rather than manufacturing a concern to justify a response.

Assess an overall LEVEL:
none: nothing here needs a conversation, ordinary curiosity or use
calm: a routine check-in, nothing urgent
steady: deserves a real conversation soon, not a crisis
urgent: needs to happen today, possibly with professional or emergency involvement

Give a CONFIDENCE percentage for how well this read fits what was described.

Assess three categories, each as none, watch, or flag:
CATEGORY_PHYSICAL: could this involve advice or content that risks physical harm?
CATEGORY_EMOTIONAL: does this show signs of real emotional distress or crisis?
CATEGORY_TRUST: does this show manipulation, secrecy, or an AI tool displacing real relationships?

Then write:
SUMMARY: one plain-language sentence on what is actually going on, and why the level fits. If LEVEL is none, this is the reassurance itself, say directly that there is nothing to be concerned about and why.
OPENER: one or two sentences the parent could actually say out loud to start the conversation, in a warm, direct, spoken voice, matched to the child's age band, never accusatory, never a formal script. If LEVEL is none, this can be a light, optional, curious question rather than anything that frames a problem.
AVOID_1 and AVOID_2 (AVOID_3 optional): specific instincts that tend to backfire in this exact situation, each one sentence, naming the behaviour and why it backfires.
IF_SHUTS_DOWN: what to do if the child gets defensive or goes quiet.
LISTEN_FOR: what a reassuring response sounds like versus a response still worth a gentle follow-up.
WHEN_TO_GET_HELP: a concrete, honest threshold for when this needs a professional, a school counsellor, or emergency services, rather than just a home conversation. If LEVEL is none, use this field instead to say there is nothing to escalate right now, and name the one thing that would change that.

Respond in exactly this tagged format, one item per line, nothing before or after it:
LEVEL: none|calm|steady|urgent
CONFIDENCE: <0-100>
CATEGORY_PHYSICAL: none|watch|flag
CATEGORY_EMOTIONAL: none|watch|flag
CATEGORY_TRUST: none|watch|flag
SUMMARY: ...
OPENER: ...
AVOID_1: ...
AVOID_2: ...
AVOID_3: ...
IF_SHUTS_DOWN: ...
LISTEN_FOR: ...
WHEN_TO_GET_HELP: ...

Never include a specific dosage, method, or step-by-step harmful detail in any field, even if the parent's own description included one. Refer to the category of concern only, never the specifics.`

const MAX_CHARS = 4000

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { situation, age, foundOut, worry, provider, apiKey } = req.body || {}

  if (!situation || typeof situation !== 'string' || situation.trim().length < 15) {
    return res.status(400).json({ error: 'Add a bit more detail about what happened first.' })
  }
  if (!age || typeof age !== 'string') {
    return res.status(400).json({ error: "Add the child's age band first, it changes what actually works here." })
  }

  const clipped = situation.slice(0, MAX_CHARS)
  const userPrompt = `Child's age band: ${age}\nHow they found out: ${foundOut || 'not specified'}\nWhat worries them most: ${worry || 'not specified'}\n\nWhat the parent described:\n${clipped}`

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
      max_tokens: 850,
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
      max_tokens: 850,
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
      max_tokens: 850,
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
