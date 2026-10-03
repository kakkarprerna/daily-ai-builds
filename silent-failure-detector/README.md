# Silent Failure Detector

**Catch AI answers that sound certain and aren't.**

[Live app](https://silent-failure-detector.vercel.app) · part of [Daily AI Builds](../README.md)

Paste a question and an AI-written answer. The app pulls out every checkable claim, rates how far each one can be trusted, rates how sure the wording sounds, and turns the two into a single score with an action attached: serve it, spot-check it, or send it to a person.

Three worked examples load instantly with no key, so you can see the whole report before trying your own.

---

## The problem

Most evals catch the failures you can see: an error, a refusal, a timeout. The one that does real damage in production is quieter. The answer reads well, states a date, a figure and a name with full confidence, and one of them is wrong. Nothing errors, nothing gets flagged, and a user acts on it.

The only signal is a mismatch between how confident the answer sounds and how much of it can be backed up. This tool measures that mismatch.

## What you get

| Section | What it shows |
| --- | --- |
| **Verdict** | Band and action, the score on a gauge, the two ratings behind it with the sum written out, a count of claims by status, and one concrete fix |
| **Redline** | The answer as the user saw it, with every rated claim highlighted in the colour of its status, plus any hedging phrases |
| **Claims ledger** | Each claim on its own line, riskiest first, with what a reviewer should check |
| **Tone check** | A plain word count in the browser (doubt words, certainty words, figures), with no AI, so the tone rating has a visible sanity check |

## How the score works

Two ratings, kept separate on purpose:

- **How sure it sounds (0 to 100).** Assertiveness of the wording, judged without regard to accuracy.
- **How much can be backed up (0 to 100).** The share of claims rated Verified or Plausible.

```
score = sure × (100 − backed up) ÷ 100
```

| Score | Band | Action |
| --- | --- | --- |
| 0 to 25 | Safe to serve | Tone matches the evidence |
| 26 to 55 | Spot-check | Check the flagged claims or add sources |
| 56 to 100 | Route to a human | Certain about things that can't be confirmed |

Sure and checkable scores low. Sure and uncheckable scores high. Hedged and uncheckable also stays low, because the reader can see the doubt. The formula runs in the browser, so the number on screen can always be traced back to the two ratings.

Each claim gets one of four statuses: **Verified**, **Plausible**, **Unverifiable** or **Fabrication risk**.

## Worked examples

| Example | What it shows | Band |
| --- | --- | --- |
| The confident fact sheet | A startup's founding date, founder, round size and lead investor, all precise, none traceable | Route to a human (87) |
| Mostly right, quietly wrong | Two correct GDPR facts followed by two wrong ones in the same certain tone | Spot-check (44) |
| The honest "I don't know" | Asked for a figure it can't know, the answer says so and points to real sources | Safe to serve (0) |

The saved results were written in the model's output format to show each band. Run your own answer to see a live audit.

## How it's built

- **React + Vite**, one dominant colour (indigo), fixed sidebar with a section per view.
- **Server function holds the prompt and the key.** The browser calls `/api/audit`; the system prompt and default key never reach the page.
- **Free model by default.** Meta Muse Glimmer through NVIDIA's free endpoint, on the site's own key. Visitors can switch to Anthropic, OpenAI or Gemini with their own key, which is sent for one request and never stored.
- **Tagged lines instead of JSON.** The model replies in lines like `CLAIM: Fabrication risk | led by Highline Ventures | Check the investor's portfolio`. A malformed line is skipped rather than sinking the whole result.
- **Runs on Vercel or Cloudflare Pages.** The route lives in `server/routes/audit.js`. `api/audit.js` wraps it for Vercel and `functions/api/audit.js` wraps it for Cloudflare.

```
silent-failure-detector/
├── server/              host-neutral code: providers, route, adapters
├── api/                 Vercel functions (thin wrappers)
├── functions/api/       Cloudflare Pages Functions (thin wrappers)
└── src/                 React app, parser, worked examples
```

## Run it locally

```bash
cd silent-failure-detector
npm install
cp .env.example .env.local       # for Vercel
cp .env.example .dev.vars        # for Cloudflare
```

Fill in `LLM_MODEL` and `LLM_API_KEY`, then pick one:

```bash
npx vercel dev                   # Vercel runtime
npm run dev:cloudflare           # Cloudflare runtime, on http://localhost:8788
```

`npm run dev` on its own serves the page without the API, which is enough to browse the worked examples.

## Deploy

**Vercel:** import the repo, set Root Directory to `silent-failure-detector`, add the three `LLM_` variables.

**Cloudflare Pages:**

```bash
npx wrangler login
npx wrangler pages project create silent-failure-detector --production-branch main
npx wrangler pages secret put LLM_API_KEY --project-name silent-failure-detector
npx wrangler pages secret put LLM_MODEL --project-name silent-failure-detector
npm run deploy:cloudflare
```

## Limits

- The judging model checks claims against its training, not a live source. Treat the output as triage, not a fact-check.
- The judge can be wrong itself, in both directions. Verified means check less, not skip checking.
- Highlighting depends on the model quoting the answer exactly. Paraphrased claims still appear in the ledger.
- Nothing is stored. Text goes to the chosen model once, through the server function, and is discarded.

## Changelog

- **v2 (October 2026):** rebuilt with a server-held prompt and key, free default model with bring-your-own-key, three worked examples, redline and ledger views, a no-AI tone check, and deploy support for Vercel and Cloudflare Pages.
- **v1:** browser-only prototype calling the Anthropic API directly with a local key.
