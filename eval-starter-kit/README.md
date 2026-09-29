# Eval Starter Kit

**Describe an AI feature. Get the test cases that show how it fails, before your users find out.**

Most teams ship AI features with a handful of happy-path checks and a feeling. Eval Starter Kit turns a short description of the feature into a starter evaluation set: realistic test messages, each with an expected behaviour and observable pass and fail conditions, plus a ready-to-paste prompt for a model judge.

It is built for product managers who want to know what "good" looks like before launch, without waiting for an engineer to write a test harness.

---

## What you get

| Output | What it is for |
| --- | --- |
| **Test cases** | 8, 12 or 16 messages written the way a real user would send them, in their language |
| **Pass if / Fail if** | Conditions you can check from the reply alone. No "responds appropriately" |
| **Priorities** | P0 would stop launch, P1 erodes trust, P2 is polish |
| **Coverage view** | How the cases spread across six categories, so gaps are visible at a glance |
| **Test this first** | The single riskiest behaviour, pulled out on its own |
| **Judge prompt** | Rules plus a template you paste into a second model to grade replies |
| **What this kit misses** | The blind spots, stated plainly, with how to close them |
| **CSV and JSON export** | The CSV carries empty result and notes columns, so you can grade in a spreadsheet |

## The six kinds of case

- **Core task**: the job the feature exists to do
- **Edge case**: typos, vague requests, odd formats
- **Out of scope**: things it should decline or redirect
- **Adversarial**: prompt injection, data fishing, manipulation
- **Recovery**: a tool breaks, or the user says the answer was wrong
- **Language & format**: language switches, length, layout

## Worked examples

Three finished kits ship with the app, so anyone can see the output without an API key. The companies are fictional.

1. **Utility support chatbot**: a Spanish electricity supplier's chat assistant. The top risk is sharing account data before identity is verified.
2. **Clinic voice receptionist**: a phone agent that books appointments. The top risk is offering a slot to someone describing emergency symptoms.
3. **CV screening assistant**: rates CVs against a role. The top risk is a protected characteristic changing the result, tested with swap cases.

## How it works

```
Your description ──► serverless function (prompt lives here) ──► chosen model
                                                                      │
Kit view ◄── parser ◄── tagged lines (SUMMARY / RISK / CASE / JUDGE / GAP / NEXT)
```

- The system prompt sits in `api/_prompt.js` and never reaches the browser.
- The model replies in tagged lines rather than JSON. Tagged lines survive small formatting slips, and they make swapping providers cheap.
- The parser (`src/parse.js`) tolerates stray bullets, bold markers and misplaced pipes, sorts cases by priority and assigns IDs.

## Models

| Provider | Key |
| --- | --- |
| **Muse Glimmer** (default) | Runs free on the site owner's NVIDIA key. Visitors can supply their own |
| **Claude** | Visitor's own Anthropic key |
| **OpenAI** | Visitor's own OpenAI key |
| **Gemini** | Visitor's own Gemini key |

Visitor keys travel with a single request and are not stored or logged.

## Where the output comes from

The cases are written by a language model from your description alone. Nothing is run against your real system, and the model knows nothing about your prices, policies or knowledge base, so it writes "per the knowledge base" where the right answer depends on them. Treat the kit as a strong first draft to edit, not a certified test suite.

## Run it locally

```bash
npm install
cp .env.example .env.local   # add LLM_MODEL and LLM_API_KEY
npx vercel dev               # runs the app and the /api function together
```

`npm run dev` alone serves the front end; the examples work there, live generation needs `vercel dev`.

## Deploy

Import the repo in Vercel and set these environment variables:

| Variable | Required | Notes |
| --- | --- | --- |
| `LLM_API_KEY` | Yes | NVIDIA API key for the free default model |
| `LLM_MODEL` | Yes | Muse Glimmer model id on NVIDIA |
| `LLM_BASE_URL` | No | Defaults to `https://integrate.api.nvidia.com/v1` |
| `ANTHROPIC_MODEL` / `OPENAI_MODEL` / `GEMINI_MODEL` | No | Override the default model for each bring-your-own-key provider |

## Stack

React 18 and Vite, plain CSS, lucide icons, one Vercel serverless function. No database, no sign-in, no tracking.

## Part of a series

One of my daily AI builds, a set of small tools on the problems PMs meet when shipping AI products. This one follows a hand-run evaluation of a Spanish support chatbot ([support-bot-eval](https://github.com/kakkarprerna/support-bot-eval)) and packages that method so anyone can start one in a few minutes.

Built by [Prerna Kakkar](https://github.com/kakkarprerna), Senior Product Manager.
