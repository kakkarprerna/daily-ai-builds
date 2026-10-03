# Escalation Quality Scorer

**When an AI agent hands a customer to a human, did anything useful survive the handoff?**

[Live app](https://escalation-quality-scorer.vercel.app) · part of [Daily AI Builds](../README.md) · companion to [Silent Failure Detector](../silent-failure-detector)

Paste a bot conversation and the note it left for the human agent. The app lists what the agent needed to know, checks which of those facts made it into the note, finds every question the customer had to answer twice, rates the timing of the escalation, and writes a better note you can copy.

Three worked examples load instantly with no key.

---

## The problem

Escalation is easy to measure: it happened or it didn't. Whether it worked is much harder to see. A customer who has to repeat their account number, the steps they've already tried and how long they've been waiting has had a worse experience than if there had been no bot at all. The bot collected all of it. It just didn't pass it on.

I saw this pattern often enough running customer success for conversational AI products that I wanted a quick way to score it from the transcript alone.

## What you get

| Section | What it shows |
| --- | --- |
| **Handoff score** | Band and verdict, the score on a gauge, the sum behind it, escalation timing, whether urgency was passed on, and what to fix |
| **What reached the human** | Each fact the agent needed, marked Carried, Partial or Missing, missing first |
| **Asked twice** | Every repeated question, with what the customer had already said, highlighted in the transcript |
| **Better note** | The bot's original note beside a rewritten one built only from the transcript, with a copy button |

## How the score works

```
context transfer = (carried + ½ × partial) ÷ facts needed × 100
handoff score    = context transfer − 15 × repeated questions
```

| Score | Band | Meaning |
| --- | --- | --- |
| 80 to 100 | Clean handoff | The agent can reply straight away |
| 50 to 79 | Needs a skim | Usable, but read the transcript first |
| 0 to 49 | Broken handoff | The customer effectively starts again |

Context transfer and repeated questions are kept apart because they fail for different reasons. A low context score usually means the note template is missing a field. Repeated questions usually mean the bot isn't using its own conversation history. Blending them would hide which one to fix.

Timing (Early, Appropriate, Late) and urgency (Flagged, Not flagged, None to flag) appear as separate checks rather than in the score, since they are yes-or-no questions rather than a scale.

## Worked examples

| Example | Channel | What it shows | Score |
| --- | --- | --- | --- |
| The empty handoff | Chat, telco | Bot gathers everything, asks for the account number twice, hands over with "Customer needs help with internet" | 0 |
| Close, but the frustration got lost | Voice, travel | Flight facts carried, but not that the app failed or that this is a third call | 52 |
| The clean handoff | Chat, SaaS | Duplicate charge confirmed by the bot and handed over for the one step it can't do | 92 |

The saved results were written in the model's output format to show each band. Paste your own transcript for a live review.

## How it's built

- **React + Vite**, one dominant colour (teal), fixed sidebar with a section per view.
- **Server function holds the prompt and the key.** The browser calls `/api/score`.
- **Free model by default.** Meta Muse Glimmer through NVIDIA's free endpoint, on the site's own key. Visitors can switch to Anthropic, OpenAI or Gemini with their own key, used for one request and never stored.
- **Tagged lines instead of JSON**, for example `FACT: Missing | Account number 4471 2093 88 | Not in the note`. A broken line is skipped.
- **The score is computed in the browser** from the fact and repeat lines, so the number always matches what you can see.
- **Runs on Vercel or Cloudflare Pages.** The route lives in `server/routes/score.js`, wrapped by `api/score.js` (Vercel) and `functions/api/score.js` (Cloudflare).

## Run it locally

```bash
cd escalation-quality-scorer
npm install
cp .env.example .env.local       # for Vercel
cp .env.example .dev.vars        # for Cloudflare
```

Fill in `LLM_MODEL` and `LLM_API_KEY`, then:

```bash
npx vercel dev                   # Vercel runtime
npm run dev:cloudflare           # Cloudflare runtime, on http://localhost:8788
```

## Deploy

**Vercel:** import the repo, set Root Directory to `escalation-quality-scorer`, add the `LLM_` variables.

**Cloudflare Pages:**

```bash
npx wrangler pages project create escalation-quality-scorer --production-branch main
npx wrangler pages secret put LLM_API_KEY --project-name escalation-quality-scorer
npx wrangler pages secret put LLM_MODEL --project-name escalation-quality-scorer
npm run deploy:cloudflare
```

## Limits

- The review sees only the pasted text. A real agent might also see a CRM record that fills some gaps.
- The 15-point penalty is a judgement call. Tune it against your own transcripts before using the score for targets.
- The list of needed facts is the model's judgement, so two runs can differ slightly. Use it for QA sampling, not to grade one agent.
- Remove names and account numbers from real transcripts before pasting. Nothing is stored.

## Changelog

- **v2 (October 2026):** rebuilt with a server-held prompt and key, free default model with bring-your-own-key, fact-by-fact view, a rewritten handoff note, three worked examples, and deploy support for Vercel and Cloudflare Pages. The context score is now computed from the listed facts rather than taken from the model as a single number.
- **v1:** browser-only prototype calling the Anthropic API directly with a local key.
