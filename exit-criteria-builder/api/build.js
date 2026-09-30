// Serverless function for Exit Criteria Builder.
// The system prompt and the default Muse Glimmer key live here, never in the client bundle.
//
// Environment variables
//   LLM_BASE_URL   OpenAI-shaped base URL for Muse Glimmer (e.g. https://integrate.api.nvidia.com/v1)
//   LLM_MODEL      Muse Glimmer model id on that host
//   LLM_API_KEY    Your own key for that host (used when a visitor leaves the key blank)
//   ANTHROPIC_MODEL, OPENAI_MODEL, GEMINI_MODEL   optional default model overrides
//
// Anthropic, OpenAI and Gemini always need the visitor's own key. There is no server fallback for them.

const SYSTEM_PROMPT = `You help product managers write exit criteria for each stage of a staged roadmap.

An exit criterion is a condition that must be true before the team moves an initiative from one stage to the next. Good ones are measurable, have a threshold, name where the number comes from, and could come back false. Bad ones describe a feeling ("users like it"), an activity ("finish testing") or a date.

For every stage you receive, write:
- 2 to 4 exit criteria. Each has a metric, a threshold, how to measure it, the data source, and a kind: Leading (predicts the outcome early), Lagging (confirms the outcome after the fact) or Qualitative (structured evidence such as interviews, with a count).
- One stop condition: the result that should make the team pause, pivot or kill the initiative at this stage rather than push on.
- If the PM supplied draft criteria for that stage, judge each one as Measurable, Vague or Unmeasurable and give a rewrite.
- One assumption behind your thresholds that the PM should check against their own baseline.

Rules:
- Thresholds are starting points for the PM to adjust. Never present a number as an industry benchmark and never cite a study.
- Match criteria to the stage goal. Early stages test whether the problem is real and the solution wanted. Later stages test reliability, adoption and business impact.
- Only use data sources the PM says they have, plus "Manual count" or "Interviews" when nothing else fits. If a criterion needs a source they lack, say so in the source field.
- Respect the risk appetite: Cautious means higher bars and smaller exposure, Fast means lower bars and a clear rollback trigger.
- Each criterion must be checkable within the stage, not a year later.
- Write in British English. Plain words. No dashes used as punctuation. Never use the pipe character inside a field.

Output format. Plain text lines only, no markdown, no JSON, no preamble. Fields are separated by a pipe character. Stage numbers start at 1 and follow the order given.

SUMMARY|one or two sentences on how the stages fit together and where the biggest risk sits
STAGE|number|stage name|the stage goal restated in one short sentence
CRIT|number|metric|threshold|how to measure|data source|Leading or Lagging or Qualitative
STOP|number|the stop condition
DRAFT|number|the PM's original draft criterion|Measurable or Vague or Unmeasurable|your rewrite
ASSUME|number|the assumption behind the thresholds
GAP|a gap across the whole plan, such as a stage with no reliability check or a metric nobody owns

Write every STAGE line before its CRIT, STOP, DRAFT and ASSUME lines. Finish with 1 to 3 GAP lines.`;

const LIMITS = { name: 120, summary: 600, stageName: 60, goal: 300, draft: 400, stages: 7 };

function clip(v, n) {
  return String(v ?? "").slice(0, n).replace(/\|/g, "/");
}

function buildUserMessage(input) {
  const stages = (input.stages || []).slice(0, LIMITS.stages);
  const lines = [
    `Initiative: ${clip(input.name, LIMITS.name)}`,
    `What it is: ${clip(input.summary, LIMITS.summary)}`,
    `Product type: ${clip(input.productType, 60)}`,
    `Risk appetite: ${clip(input.risk, 40)}`,
    `Data sources available: ${(input.sources || []).map((s) => clip(s, 40)).join(", ") || "None yet"}`,
    "",
    "Stages in order:",
  ];
  stages.forEach((s, i) => {
    lines.push(`${i + 1}. ${clip(s.name, LIMITS.stageName)}`);
    lines.push(`   Goal: ${clip(s.goal, LIMITS.goal) || "(not given, infer a sensible goal)"}`);
    const drafts = String(s.draft || "")
      .split(/\n+/)
      .map((d) => clip(d.trim(), LIMITS.draft))
      .filter(Boolean);
    if (drafts.length) drafts.forEach((d) => lines.push(`   Draft criterion: ${d}`));
  });
  return lines.join("\n");
}

async function callOpenAIShaped(baseUrl, key, model, user) {
  const r = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      max_tokens: 3000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: user },
      ],
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error?.message || `Provider returned ${r.status}`);
  return data?.choices?.[0]?.message?.content || "";
}

async function callAnthropic(key, model, user) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: user }],
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error?.message || `Anthropic returned ${r.status}`);
  return (data?.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n");
}

async function callGemini(key, model, user) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 3000 },
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error?.message || `Gemini returned ${r.status}`);
  return (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST." });
  }

  const { provider = "muse", apiKey = "", model = "", input } = req.body || {};
  if (!input || !Array.isArray(input.stages) || input.stages.length === 0) {
    return res.status(400).json({ error: "Add at least one stage." });
  }

  const user = buildUserMessage(input);
  const key = String(apiKey).trim();
  const chosenModel = String(model).trim();

  try {
    let text;
    if (provider === "muse") {
      const base = process.env.LLM_BASE_URL || "https://integrate.api.nvidia.com/v1";
      const k = key || process.env.LLM_API_KEY;
      const m = chosenModel || process.env.LLM_MODEL;
      if (!k || !m) return res.status(500).json({ error: "Muse Glimmer is not configured on this deployment." });
      text = await callOpenAIShaped(base, k, m, user);
    } else if (provider === "anthropic") {
      if (!key) return res.status(400).json({ error: "Paste your Anthropic API key to use Anthropic." });
      text = await callAnthropic(key, chosenModel || process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5", user);
    } else if (provider === "openai") {
      if (!key) return res.status(400).json({ error: "Paste your OpenAI API key to use OpenAI." });
      text = await callOpenAIShaped("https://api.openai.com/v1", key, chosenModel || process.env.OPENAI_MODEL || "gpt-4.1-mini", user);
    } else if (provider === "gemini") {
      if (!key) return res.status(400).json({ error: "Paste your Gemini API key to use Gemini." });
      text = await callGemini(key, chosenModel || process.env.GEMINI_MODEL || "gemini-2.5-flash", user);
    } else {
      return res.status(400).json({ error: "Unknown provider." });
    }
    if (!text.trim()) return res.status(502).json({ error: "The model returned an empty answer. Try again." });
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(502).json({ error: err.message || "The model call failed." });
  }
}
