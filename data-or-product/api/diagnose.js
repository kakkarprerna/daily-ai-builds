const SYSTEM_PROMPT = `You are an experienced product analytics diagnostician helping a product manager work out whether a metric moved because the measurement broke or because people genuinely behaved differently. The PM has no access to engineering time yet and wants to avoid escalating something that turns out to be a broken event tag.

Judge from the shape of the change, the scope, what changed nearby, and how it is being measured. Key reasoning patterns: sharp overnight steps that hold flat suggest instrumentation; gradual slides suggest behaviour or mix; single-platform drops that match a release window are suspicious of tags shipped in that release; drops with matching support tickets are almost always real; a single unconfirmed data source lowers confidence.

Reply ONLY in the tagged line format below. No preamble, no markdown, no headings. Every line starts with a tag. Use British English. Write plainly, as a colleague would, and be specific about numbers and windows the PM gave you. Do not hedge everything; commit to a verdict and say what would change it.

VERDICT: one of "Most likely a measurement problem" or "Most likely a real behaviour change" or "Not separable yet"
CONFIDENCE: High or Medium or Low
WHY: one reason (write 3 to 4 WHY lines, each 1 to 3 sentences)
CHECK: title || what to actually do || what it rules out, written as a bare phrase without the words "rules out" || rough time (write 3 to 5 CHECK lines, cheapest and most decisive first)
IFARTEFACT: what to do if it turns out to be measurement (1 to 2 lines)
IFREAL: what to do if it turns out to be behaviour (1 to 2 lines)
ESCALATE: when to involve engineering or data, and exactly what to hand them (1 to 2 lines)
FLIP: a single observation that would overturn your verdict, one per line (write 2 to 3 separate FLIP lines, never several observations in one line)`;

const BASE_URL = process.env.LLM_BASE_URL || "https://integrate.api.nvidia.com/v1";
const MODEL = process.env.LLM_MODEL || "meta/muse-glimmer-30b";

function buildUserMessage(form) {
  const j = (v) => (Array.isArray(v) ? v.join(", ") : v || "");
  return [
    `Metric: ${form.metric}`,
    `Movement: ${form.movement}`,
    `Shape on the chart: ${j(form.shape) || "not stated"}`,
    `Where it shows: ${j(form.scope) || "not stated"}`,
    `Changed nearby: ${j(form.changed) || "not stated"}`,
    `Measured with: ${j(form.source) || "not stated"}`,
    `Already ruled out: ${j(form.checked) || "nothing"}`,
    form.notes ? `Extra context: ${form.notes}` : "",
    "",
    "Reply with the tagged lines only. Start the first line with VERDICT:",
  ]
    .filter((l) => l !== undefined)
    .join("\n");
}

// Muse Glimmer returns its reasoning separately, and some hosts inline it in
// <think> tags. Either way, only the tagged lines should reach the client.
function cleanReply(choice) {
  const raw = (choice && choice.message && choice.message.content) || "";
  return raw
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/^```[a-z]*\n?|```$/gim, "")
    .trim();
}

async function ask(messages, apiKey) {
  const r = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.3,
      top_p: 0.95,
      max_tokens: 1600,
      stream: false,
    }),
  });

  if (!r.ok) {
    const detail = await r.text();
    const err = new Error(`Upstream returned ${r.status}`);
    err.status = r.status;
    err.detail = detail;
    throw err;
  }

  const data = await r.json();
  return cleanReply(data.choices && data.choices[0]);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "This endpoint takes POST requests only." });
  }

  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "The API key is not set on the server." });
  }

  const form = (req.body && req.body.form) || null;
  if (!form || !form.metric || !form.movement) {
    return res.status(400).json({ error: "Name the metric and what it did before running this." });
  }

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: buildUserMessage(form) },
  ];

  try {
    let text = await ask(messages, apiKey);

    // Smaller models sometimes open with a sentence of preamble. One nudge fixes it.
    if (!/^VERDICT:/m.test(text)) {
      text = await ask(
        [
          ...messages,
          { role: "assistant", content: text },
          {
            role: "user",
            content:
              "That was not in the required format. Send the same analysis again as tagged lines only, no preamble, first line starting with VERDICT:",
          },
        ],
        apiKey
      );
    }

    if (!/^VERDICT:/m.test(text)) {
      return res.status(502).json({ error: "The model did not return a readable verdict." });
    }

    return res.status(200).json({ text });
  } catch (e) {
    console.error("LLM error", e.status || "", e.detail || e.message);
    return res
      .status(502)
      .json({ error: `The model service returned ${e.status || "an error"}.` });
  }
}
