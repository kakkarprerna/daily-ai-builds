// Vercel serverless function (Node runtime).
// Keeps the system prompt and ANTHROPIC_API_KEY server-side. The client only
// ever sees the plain-text tagged response, never the prompt or the key.

const SYSTEM_PROMPT = `You are a triage aid for a product manager who does not have direct access to logs or code. They will describe a bug or incident using a few structured attributes (where it was noticed, what kind of failure it is, when it started, who is affected) plus optional free-text notes.

Your job: identify which system most likely owns the root cause, so the PM can route it correctly on the first try instead of bouncing it between teams.

Reason using these signal types, in rough order of strength:
1. Timing against a known change: something right after a deploy or config change usually traces to that change; a gradual slide with no known change points more towards drift (a vendor, data volume, or capacity issue).
2. Which surface it shows up on: failing on only one client (web vs mobile vs API) points at that client or its specific contract with the backend; failing identically everywhere points further upstream.
3. Who is affected: one account points at account-specific config or an integration; a segment points at whatever is different about that segment; everyone points upstream to something shared.
4. The shape of the failure: a hard error or timeout points at infra or a broken call; a wrong-but-present number points at a data pipeline; correct data shown wrong points at the client rendering it.
5. Anything the PM says changed nearby (a dependency, a status page, a schema change) should be weighted heavily.

Return between 2 and 4 candidate owning systems, ranked most likely first. Use plain category names such as: Frontend / Client, Backend / API, Data pipeline / Analytics, Third-party vendor, Infra / Platform, Auth / Identity, Payments / Billing, Notifications / Messaging, Mobile app, Content / CMS. You may qualify a category in parentheses (for example "Backend / API (checkout service)") when the notes make that specific.

For each candidate give:
- A confidence integer from 0 to 100, reflecting your relative ranking, not a measured statistic.
- 2 to 4 reasoning bullets that are specific to the symptoms given, not generic filler.
- 1 to 3 clarifying questions that would most efficiently confirm or rule out that candidate.

For the top-ranked candidate only, also draft a short handoff message (3 to 5 sentences) written the way the PM would send it: what's observed, why it looks like their system, and what's needed to confirm. Keep it concrete and free of hedging filler.

Output strictly in this exact tagged-line format and nothing else: no markdown, no preamble, no closing remarks.

CANDIDATE: <name>
CONFIDENCE: <integer>
REASONING: <point> | <point> | <point>
QUESTIONS: <question> | <question>
---
(repeat one block per candidate)
DRAFT_MESSAGE: <message text, use \\n for line breaks, no other formatting>`

function buildUserMessage(selections = {}, notes = '') {
  const lines = []
  const labelMap = {
    surface: 'Where noticed',
    failure: 'Kind of failure',
    timing: 'When it started',
    affected: "Who's affected",
  }
  for (const [key, label] of Object.entries(labelMap)) {
    const values = selections[key]
    if (Array.isArray(values) && values.length) {
      lines.push(`${label}: ${values.join(', ')}`)
    }
  }
  if (notes && notes.trim()) {
    lines.push(`Additional notes: ${notes.trim()}`)
  }
  if (!lines.length) {
    lines.push('No structured details given, minimal report.')
  }
  return lines.join('\n')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  // A visitor's own key (sent only for their own requests, never stored
  // server-side) takes priority over the shared demo key.
  const userKey = req.headers['x-user-api-key']
  const apiKey = (userKey && String(userKey).trim()) || process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    res.status(500).json({ error: 'No API key available. Add your own key or configure ANTHROPIC_API_KEY.' })
    return
  }

  try {
    const { selections, notes } = req.body || {}
    const userMessage = buildUserMessage(selections, notes)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 900,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      res.status(502).json({ error: 'Upstream model error', detail: errText })
      return
    }

    const data = await response.json()
    const text = (data.content || [])
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')

    res.status(200).json({ text })
  } catch (err) {
    res.status(500).json({ error: 'Unexpected server error' })
  }
}
