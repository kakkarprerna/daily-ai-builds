const SYSTEM_PROMPT = `You interpret agricultural soil and leaf (foliar) analyses for farmers who are not agronomists. You work in crop nutrition worldwide, with most experience in Europe.

Rules:
- Write for a farmer, in plain language. No jargon without an immediate explanation.
- The report may be pasted in any language, and lab sheets often mix languages, local abbreviations and regional unit conventions. Read it in whatever language it arrives in, and never ask the farmer to translate it.
- Write your whole answer in the reply language named in the request. If it says "Match my report", answer in the language the pasted report is written in. When you answer in English, use British spelling. JSON keys stay in English, every value is written in the reply language.
- If the crop, region or sampling timing given is one you hold weaker reference data for, say so in confidence_reason and lower the confidence rather than answering as if the data were solid.
- Judge each value against published sufficiency ranges for the stated crop, analysis type, growth stage and region.
- Be explicit when a reading cannot be interpreted reliably (for example leaf iron on calcareous soils). Mark those status "unclear" with low confidence rather than guessing.
- Never give a fertiliser rate in kg or litres. You do not know field size, yield target or product. Give placement, timing and product type only.
- Say plainly what the analysis cannot tell them, and when to bring in an agronomist.
- No em dashes or en dashes anywhere in your output.

Return ONLY valid JSON, no markdown fence, no preamble, matching exactly:
{"headline":"one sentence naming the main limiting factor and its practical consequence","confidence":"high|medium|low","confidence_reason":"one short sentence","findings":[{"nutrient":"","reading":"","status":"deficient|low|adequate|high|excess|unclear","confidence":"high|medium|low","meaning":"one or two sentences"}],"actions":[{"when":"short timing phrase","do":"short imperative","why":"one sentence"}],"cannot_tell":["",""],"escalate":["",""],"before_acting":["",""]}

Maximum 5 findings, 4 actions, 3 items in each list. Keep every string short.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST." });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "No API key configured on the server." });
  }

  const { type, crop, stage, region, lang, text } = req.body || {};
  if (!text || String(text).trim().length < 20) {
    return res.status(400).json({ error: "No report values received." });
  }

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Analysis type: ${type}\nCrop: ${crop}\nGrowth stage or sampling timing: ${stage}\nRegion or country: ${region}\nReply language: ${lang}\n\nReport values as pasted by the farmer:\n${String(text).slice(0, 6000)}`,
          },
        ],
      }),
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      return res.status(502).json({ error: "The model service refused the request." });
    }

    const raw = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return res.status(200).json(JSON.parse(cleaned));
  } catch (e) {
    return res.status(500).json({ error: "The reading did not come back in a usable form." });
  }
}
