/*
  Dígame — server side.
  Holds the two prompts and the Gemini key. The browser never sees either.

  Runs on either Gemini or Anthropic. The prompts and the tagged output format
  are shared, so only the request envelope differs and nothing downstream cares
  which one answered.

  Gemini uses the Interactions API, which replaced generateContent as the
  default interface in June 2026.

  Environment variables:
    PROVIDER         anthropic, gemini or nvidia. Defaults to anthropic when
                     ANTHROPIC_API_KEY is present, otherwise gemini.
    NVIDIA_API_KEY   from build.nvidia.com, free prototyping tier
    NVIDIA_MODEL     optional, defaults to meta/muse-glimmer-30b
    NVIDIA_MAX_TOKENS optional, defaults to 4000
    NVIDIA_BASE_URL  optional, any OpenAI-compatible host
    GEMINI_API_KEY   from aistudio.google.com/apikey
    GEMINI_MODEL     optional, defaults to gemini-3.8-flash
    ANTHROPIC_API_KEY from console.anthropic.com
    ANTHROPIC_MODEL  optional, defaults to claude-sonnet-5
*/

const PROVIDER = (process.env.PROVIDER || (process.env.ANTHROPIC_API_KEY ? "anthropic" : "gemini")).toLowerCase();

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

const ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

/* Any OpenAI-shaped host. Defaults to NVIDIA's free prototyping endpoint
   running Meta's Muse Glimmer. Point NVIDIA_BASE_URL at http://localhost:1234/v1
   to use a local server such as LM Studio instead. */
const NVIDIA_BASE = process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || "meta/muse-glimmer-30b";
/* Glimmer is a reasoning model and spends tokens thinking before it answers,
   so its ceiling is well above the other two. */
const NVIDIA_MAX_TOKENS = Number(process.env.NVIDIA_MAX_TOKENS || 4000);

export const config = { maxDuration: 30 };

const RULES = `You write telephone scripts for foreigners living in Spain who have to ring a Spanish office, institution or company and are not confident speaking Spanish on the phone.

Rules:
- Write natural, polite peninsular Spanish as it is actually spoken on the phone in Spain. Use the usted form throughout.
- Every Spanish line needs three things: the Spanish, a plain English meaning, and a rough pronunciation for an English speaker written in hyphenated syllables with the stressed syllable in capitals.
- Use ... as the blank wherever the caller has to insert their own detail.
- Be honest about how these calls really go: recorded menus, queues, transfers, being asked for a reference the caller may not have.
- Never invent phone numbers, opening hours, addresses, legal deadlines, fees or the caller's own reference numbers. If something varies by province or provider, say so instead of guessing.
- No legal, immigration, tax or financial advice. Describe what to ask and what to write down, not what the outcome will be.
- Keep every line short enough to read off a screen while talking, no more than about 25 words.
- Reply with the tagged lines described below and nothing else. No preamble, no markdown, no JSON, no blank tags.
- When the caller has little or no Spanish, the OPENING line must say so and ask the other person to speak slowly. This matters more than sounding fluent.
- Pronunciations are for Spain: c before e or i, and z, are the th in think, not an s.
- One field per line. Where a line has several parts, separate them with a vertical bar. Never use a vertical bar inside the text itself.`;
const SYSTEM_A =
  RULES +
  `

You are writing the first half: everything before the caller speaks, plus their two opening lines.

Write exactly these lines, in this order:

OFFICE: who is being rung
GOAL: what the caller wants out of the call, in English
MENU: what the recorded menu will do before a person answers
MENUTIP: one practical tip for getting through the menu
MENUTIP: a second tip
MENUTIP: a third tip
OPENING: Spanish greeting line | English meaning | pronunciation
REASON: Spanish sentence saying why they are calling | English meaning | pronunciation
READY: what to have on the desk | why it matters | the Spanish line for reading it out
READY: a second thing | why | Spanish line
READY: a third thing | why | Spanish line`;

const SYSTEM_B =
  RULES +
  `

You are writing the second half: what comes back at the caller, and how the call ends.

Write exactly these lines, in this order:

ASK: a question they will ask in Spanish | English meaning | the caller's answer in Spanish | that answer in English
ASK: a second question | English | answer | English
ASK: a third question | English | answer | English
RESCUE: Spanish phrase for when the caller is lost | English meaning | pronunciation
RESCUE: a second phrase | English | pronunciation
RESCUE: a third phrase | English | pronunciation
CLOSE: something to get or write down before hanging up
CLOSE: a second thing
CLOSE: a third thing
FAIL: what to do if the call gets nowhere
FAIL: a second route
FAIL: a third route
WATCH: one honest warning about this kind of call, scams included where relevant`;

const TAIL = "\n\nAnswer only with the tagged lines. One field per line, parts separated by a vertical bar.";

/* Interactions replies are a list of execution steps. Thinking steps are
   skipped and every text block from the remaining steps is joined. Written
   tolerantly because the step shape can gain fields over time. */
function extractText(data) {
  const out = [];

  const readBlocks = (content) => {
    if (typeof content === "string") {
      out.push(content);
      return;
    }
    if (!Array.isArray(content)) return;
    for (const block of content) {
      if (!block) continue;
      if (typeof block === "string") out.push(block);
      else if (block.type === "text" && typeof block.text === "string") out.push(block.text);
      else if (typeof block.text === "string" && block.type !== "thought") out.push(block.text);
    }
  };

  const steps = Array.isArray(data && data.steps) ? data.steps : [];
  for (const step of steps) {
    if (!step || step.type === "thought" || step.type === "user_input") continue;
    readBlocks(step.content);
  }

  if (!out.length && typeof (data && data.output_text) === "string") out.push(data.output_text);
  return out.join("\n").trim();
}

/* OpenAI-shaped hosts put the answer in choices[0].message.content. Agentic
   models sometimes prepend a reasoning block, which is stripped here. */
function extractChoiceText(data) {
  const choice = data && Array.isArray(data.choices) ? data.choices[0] : null;
  const message = choice && choice.message;
  let text = message && typeof message.content === "string" ? message.content : "";
  if (!text && message && Array.isArray(message.content)) {
    text = message.content.map((b) => (b && typeof b.text === "string" ? b.text : "")).join("");
  }
  /* When a reasoning model is cut off mid-thought, content is null and the
     work sits in reasoning_content. Tagged lines are recoverable from it. */
  if (!text && message && typeof message.reasoning_content === "string") {
    text = message.reasoning_content;
  }
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

/* Anthropic returns a flat list of content blocks. */
function extractAnthropicText(data) {
  const blocks = Array.isArray(data && data.content) ? data.content : [];
  return blocks
    .map((b) => (b && b.type === "text" && typeof b.text === "string" ? b.text : ""))
    .join("")
    .trim();
}

export default async function handler(req, res) {
  /* GET reports what this process can see, so a misread env file can be
     diagnosed without restarting anything or printing a key. Presence only,
     never values. */
  if (req.method === "GET") {
    res.status(200).json({
      provider_in_use: PROVIDER,
      provider_env_var: process.env.PROVIDER || "(not set, so it was inferred)",
      keys_present: {
        ANTHROPIC_API_KEY: Boolean(process.env.ANTHROPIC_API_KEY),
        GEMINI_API_KEY: Boolean(process.env.GEMINI_API_KEY),
        NVIDIA_API_KEY: Boolean(process.env.NVIDIA_API_KEY),
      },
      models: { anthropic: ANTHROPIC_MODEL, gemini: GEMINI_MODEL, nvidia: NVIDIA_MODEL },
    });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Send a POST or GET request." });
    return;
  }

  const gemini = PROVIDER === "gemini";
  const nvidia = PROVIDER === "nvidia";
  const keyName = gemini ? "GEMINI_API_KEY" : nvidia ? "NVIDIA_API_KEY" : "ANTHROPIC_API_KEY";
  const key = process.env[keyName];
  if (!key) {
    res.status(500).json({ error: keyName + " is not set on the server." });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = null;
    }
  }

  const half = body && body.half;
  const brief = body && typeof body.brief === "string" ? body.brief.trim() : "";

  if ((half !== "a" && half !== "b") || !brief) {
    res.status(400).json({ error: "Send { half: 'a' or 'b', brief: '...' }." });
    return;
  }
  if (brief.length > 2000) {
    res.status(400).json({ error: "That brief is longer than this endpoint accepts." });
    return;
  }

  const system = half === "a" ? SYSTEM_A : SYSTEM_B;
  const input = brief + TAIL;

  /* The two providers differ only in the envelope. The prompts and the tagged
     output format are identical, so nothing downstream knows which ran. */
  const request = nvidia
    ? {
        url: NVIDIA_BASE.replace(/\/$/, "") + "/chat/completions",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
        payload: {
          model: NVIDIA_MODEL,
          max_tokens: NVIDIA_MAX_TOKENS,
          temperature: 0.4,
          messages: [
            { role: "system", content: system },
            {
              role: "user",
              content: input + "\n\nDo not reason step by step. Write the tagged lines straight out.",
            },
          ],
        },
      }
    : gemini
    ? {
        url: GEMINI_ENDPOINT,
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        payload: {
          model: GEMINI_MODEL,
          /* store false keeps the caller's situation off Google's servers. */
          store: false,
          system_instruction: system,
          input: input,
          generation_config: { thinking_level: "low", temperature: 0.4 },
        },
      }
    : {
        url: ANTHROPIC_ENDPOINT,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        payload: {
          model: ANTHROPIC_MODEL,
          max_tokens: 1200,
          temperature: 0.4,
          system: system,
          messages: [{ role: "user", content: input }],
        },
      };

  let upstream;
  try {
    upstream = await fetch(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify(request.payload),
    });
  } catch (e) {
    res.status(502).json({
      error: "Could not reach " + PROVIDER + ": " + (e && e.message ? e.message : String(e)),
    });
    return;
  }

  let data = null;
  let raw = "";
  try {
    raw = await upstream.text();
    data = JSON.parse(raw);
  } catch (e) {
    /* keep raw for the error path */
  }

  if (!upstream.ok) {
    const message =
      (data && data.error && data.error.message) ||
      raw.slice(0, 300) ||
      PROVIDER + " returned status " + upstream.status + ".";
    res.status(upstream.status).json({ error: message });
    return;
  }

  const text = gemini ? extractText(data) : nvidia ? extractChoiceText(data) : extractAnthropicText(data);
  if (!text) {
    res.status(502).json({ error: PROVIDER + " replied with no usable text.", raw: raw.slice(0, 500) });
    return;
  }

  const modelUsed = gemini ? GEMINI_MODEL : nvidia ? NVIDIA_MODEL : ANTHROPIC_MODEL;
  res.status(200).json({ text: text, provider: PROVIDER, model: modelUsed });
}
