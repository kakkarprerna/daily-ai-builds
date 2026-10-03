# Cost-of-Error Estimator

**Which AI failure should you fix first? The one you see most often is rarely the one costing most.**

[Live app](https://cost-of-error-estimator.vercel.app) · part of [Daily AI Builds](../README.md)

Describe your AI product and list the ways it gets things wrong, with a rough count per month. The app estimates a cost range for one incident of each, multiplies by frequency, and ranks the failures by monthly cost. Then you can test a fix: say what share of incidents a guardrail would stop and what it costs to run, and see the saving.

Three worked examples load instantly with no key.

---

## The problem

When a team decides where to put eval and guardrail effort, the loudest failure usually wins: the one that shows up in support tickets every day. But forty cheap mistakes a month can matter less than one expensive one. A support bot that occasionally quotes another customer's ticket history, or a utility chatbot that misses a customer who can't pay their bill, may happen once or twice a month and still outweigh everything else on the list.

Putting a rough price on each failure turns "what feels worst" into a ranking you can argue about with numbers.

## What you get

| Section | What it shows |
| --- | --- |
| **Ranking** | The failure to fix first and its share of the total, monthly and yearly totals with a range, and every failure as a bar showing its midpoint and low-to-high range, cost drivers, confidence and the reasoning. Frequencies can be edited in place and everything recalculates |
| **Assumptions to check** | What the estimate assumed, as a checklist to confirm against your own numbers |
| **Not in these figures** | Costs left out, such as regulatory action or brand damage |
| **What if we fix it?** | Pick a failure, set the share of incidents a fix would stop and its running cost, and see the monthly and yearly saving. No AI involved |

## How the figures work

```
monthly exposure = frequency × (low + high) ÷ 2
saving           = monthly exposure × share stopped − running cost of the fix
```

- **Cost per incident** is the only figure from a model. It reasons from your context: staff time at a loaded rate, refunds and credits, repeat contacts, likely churn times customer value, and legal exposure only where a failure plausibly triggers it.
- **Everything else is arithmetic in the browser**, so a changed frequency updates the ranking straight away without another model call.
- **Confidence** is High when the cost is mostly staff time, Medium when it depends on churn, and Low when it depends on rare legal or regulatory outcomes.
- Two optional inputs, **cost of a human support contact** and **yearly value of a customer**, anchor the estimate to your real numbers. Euros, dollars and pounds are supported.

## Worked examples

| Example | Product | What it shows | Fix first |
| --- | --- | --- | --- |
| The rare one that costs the most | B2B SaaS support bot, USD | One cross-customer data leak a month is two thirds of the exposure | Retrieval isolation |
| Missing a vulnerable customer | Spanish energy supplier chatbot, EUR | Three missed vulnerable customers outweigh 300 tariff errors | Hard routing rule to a person |
| Frequent and medium beats rare | UK fashion returns assistant, GBP | The everyday out-of-policy approval tops the list | Check dates and sale status in code |

The saved results were written in the model's output format to show different rankings. Run your own product for a live estimate.

## How it's built

- **React + Vite**, one dominant colour (violet), fixed sidebar with a section per view.
- **Server function holds the prompt and the key.** The browser calls `/api/estimate`.
- **Free model by default.** Meta Muse Glimmer through NVIDIA's free endpoint, on the site's own key. Visitors can switch to Anthropic, OpenAI or Gemini with their own key, used for one request and never stored.
- **Tagged lines instead of JSON**, for example `COST: 4 | 8000 | 40000 | Low | breach notification; legal review | ...`. A malformed line is skipped.
- **Runs on Vercel or Cloudflare Pages.** The route lives in `server/routes/estimate.js`, wrapped by `api/estimate.js` (Vercel) and `functions/api/estimate.js` (Cloudflare).

## Run it locally

```bash
cd cost-of-error-estimator
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

**Vercel:** import the repo, set Root Directory to `cost-of-error-estimator`, add the `LLM_` variables.

**Cloudflare Pages:**

```bash
npx wrangler pages project create cost-of-error-estimator --production-branch main
npx wrangler pages secret put LLM_API_KEY --project-name cost-of-error-estimator
npx wrangler pages secret put LLM_MODEL --project-name cost-of-error-estimator
npm run deploy:cloudflare
```

GitHub Pages is no longer an option for this build: it serves static files only, and the model call now runs in a server function so the key stays private.

## Limits

- Estimates come from the context you type, not your cost data. Check the listed assumptions.
- Low-confidence costs can swing by an order of magnitude. Treat them as a reason to look closer.
- Brand damage and lost future sales sit mostly outside the figures and are flagged separately.
- Nothing is stored. Inputs go to the chosen model once and are discarded.

## Changelog

- **v2 (October 2026):** rebuilt with a server-held prompt and key, free default model with bring-your-own-key, currency choice, anchoring inputs, in-place frequency edits, a what-if savings calculator, three worked examples, and deploy support for Vercel and Cloudflare Pages.
- **v1:** browser-only version calling the Anthropic API with a key stored in the browser, deployed to GitHub Pages.
