# Works on Staging

**It works on staging. Why not in production?**

Works on Staging helps a product manager find out why something behaves in one environment and breaks in another, and gives them checks they can run themselves before pulling an engineer off their work.

You describe the gap. It tells you which kind of drift is most likely behind it, how sure it is, what to check first, what it has ruled out, and what finding would change its mind. If your checks don't settle it, you get a short handover note for engineering with gaps left for what you found.

Part of my [daily AI builds](https://github.com/kakkarprerna/daily-ai-builds) series, in the PM workflow diagnosis theme alongside Signal Translator, Repro Builder, Handback, Data or product?, Who Owns This? and Pattern or One-Off?.

---

## Why this exists

"Works on my machine" has a grown-up cousin: works on staging. The code is usually the same in both places. What differs is everything around it: a setting, a flag, the shape of real customer data, a cache, a vendor's test mode. Most of those can be checked from a settings screen, an admin panel or an incognito window. A PM who knows which one to look at first saves an engineer an interruption and gets to a fix faster.

## What you get back

| Section | What it tells you |
| --- | --- |
| **Most likely drift** | One of seven drift types, with a confidence level and a plain-language reason |
| **Where the drift could be** | Up to four candidates, ranked, each tied to your symptoms |
| **Checks to run yourself** | Four to six checks, cheapest first, none needing code, each with what the result means |
| **Probably not** | Drift types your inputs already rule out, and why |
| **What would change the call** | The finding that would flip the verdict, and to what |
| **Handover note** | A short message for engineering, ready to copy, with brackets for your check results |

## The seven kinds of drift

| Drift | Looks like |
| --- | --- |
| Configuration | Settings, secrets and feature flags that differ per environment |
| Data | Real records look different from test records: gaps, old formats, volume |
| Permissions | Roles, groups, sign-in and access rules that differ per environment |
| Caching | An older stored copy is served instead of the new one |
| Version | Different builds run in each environment, or a release only partly landed |
| Infrastructure | Domains, networking, limits and timeouts around the app |
| Third-party | A vendor behaves differently in test mode and live mode |

## Try it without a key

Three worked examples ship with saved results, so anyone can see the full output without calling a model:

1. **Order emails never arrive** (Third-party, high confidence). Emails send on staging, never in production. The live-mode webhook is the likely culprit.
2. **Blank dashboard for some accounts** (Data, high confidence). Only pre-2023 accounts see an empty page after a migration. Staging only has fresh test accounts.
3. **New feature missing after release** (Caching, medium confidence). Flag is on, deploy succeeded, most users still see the old page. The first check separates caching from a partial deploy.

The scenarios are invented.

## Models

| Provider | Key |
| --- | --- |
| **Meta Muse Glimmer 30B** (default) | Free for visitors, runs on the owner's key via NVIDIA's endpoint. Visitors can paste their own NVIDIA key instead. |
| Anthropic | Visitor's own key |
| OpenAI | Visitor's own key |
| Gemini | Visitor's own key |

The system prompt and the default key live in a serverless function (`api/diagnose.js`), never in the browser bundle. A visitor's pasted key is sent with that one request and is not logged or stored.

The model replies in tagged lines (`VERDICT:`, `DRIFT:`, `CHECK:` and so on) rather than JSON. Tagged lines are easier for smaller models to get right and made adding providers cheap: one parser, four adapters.

## How it's built

- React + Vite, deployed on Vercel
- One serverless function with adapters for NVIDIA (OpenAI-shaped), Anthropic, OpenAI and Gemini
- `src/parse.js` turns tagged lines into the result view
- `src/examples.js` holds the three worked examples and their saved results
- Icons from lucide-react, type set in Plus Jakarta Sans

## Run it locally

```bash
npm install
cp .env.example .env.local   # add your NVIDIA key and model id
npx vercel dev               # serves the app and /api/diagnose together
```

`npm run dev` also works for the interface and the worked examples, but live diagnosis needs `vercel dev` so the serverless function runs.

## Deploy

1. Import the repo into Vercel.
2. Add `LLM_BASE_URL`, `LLM_MODEL` and `LLM_API_KEY` under Environment Variables.
3. Deploy. Vercel picks up the `api/` folder automatically.

## Limits

- It only knows what you type. It cannot see your systems, logs or settings.
- It points you at a likely cause. Your checks confirm it.
- For live incidents affecting customers, follow your incident process first.

---

Built by [Prerna Kakkar](https://github.com/kakkarprerna), Senior Product Manager, as part of a daily series of AI tools for product work.
