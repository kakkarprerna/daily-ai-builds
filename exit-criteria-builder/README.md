<p align="center">
  <img src="public/favicon.svg" width="64" alt="" />
</p>

<h1 align="center">Exit Criteria Builder</h1>

<p align="center">
  Give every stage of a roadmap a finish line you can check.
</p>

---

## The problem

Most staged roadmaps say *what* happens in each stage and *when*. Very few say what has to be true before the team is allowed to move on. So stages end on a date or a demo, and "Beta is stable" or "customers like it" quietly becomes the bar for general availability.

When that happens, a team can ship every stage on time and still not know whether any of it worked.

## What it does

You describe an initiative and its stages in order, plus what each stage should prove. For every stage you get back:

| | |
|---|---|
| 📏 **2 to 4 exit criteria** | Each with a metric, a threshold, how to measure it, the data source and whether it is leading, lagging or qualitative |
| 🛑 **A stop condition** | The result that should make the team pause, pivot or kill the work at that stage |
| ✍️ **Your drafts, rewritten** | Any criteria you already wrote, judged Measurable, Vague or Unmeasurable, with a sharper version |
| 💡 **One assumption to check** | The thing your baseline needs to confirm before you trust the thresholds |

Plus **gaps across the whole plan**, such as a stage with no reliability check or a metric nobody owns. The whole plan copies out as Markdown, ready to paste into a PRD.

## Two layers, on purpose

**1. A wording check that runs in the browser, no AI.** As you type draft criteria, fixed rules flag the usual problems: no number, vague words (*stable, good, seamless*), activities instead of outcomes (*finish testing*), dates posing as evidence (*launch by end of Q1*) and no data source. Every rule lives in `src/parse.js`.

**2. One model call for the plan.** The inputs go through a serverless function to the model the visitor picks. The model replies in tagged lines (`STAGE|`, `CRIT|`, `STOP|`, `DRAFT|`, `ASSUME|`, `GAP|`), which the app parses into cards. Tagged lines are easier for smaller models to get right than JSON, and they make swapping providers cheap.

## Where the numbers come from

Thresholds are **starting points suggested by the model** from what you entered, shaped by the risk appetite you pick (Cautious, Balanced or Fast). They are not industry benchmarks and no study sits behind them. The app says so on every result, and each stage carries an assumption to test against your own baseline.

Criteria only lean on the data sources you tick, plus interviews or a manual count when nothing else fits.

## Try it without a key

Three worked examples are saved in the app, so anyone can open a full plan with no API key:

- **Automatic payment reminders** · B2B SaaS invoicing tool, balanced risk, Discovery → Private beta → GA
- **Spanish-language voice agent** · enterprise conversational AI, cautious risk, Pilot → Controlled rollout → GA
- **Daily practice streaks** · consumer language-learning app, fast risk, Discovery → Prototype test → Beta → Launch

## Models

| Provider | Key |
|---|---|
| **Muse Glimmer** (default) | Free on this site, runs on the owner's server-side key. Visitors can paste their own NVIDIA key instead |
| Anthropic | Visitor's own key |
| OpenAI | Visitor's own key |
| Gemini | Visitor's own key |

Visitor keys go to the serverless function for that one request and are never stored. The system prompt also lives server-side, never in the client bundle.

## Privacy

No sign-in, no database, no analytics. Nothing typed into the app is saved.

## Run it locally

```bash
npm install
npm run dev          # the UI and saved examples work without the API
vercel dev           # runs the UI and /api/build together
```

## Deploy on Vercel

This build lives in the `exit-criteria-builder` folder of the `daily-ai-builds` repo. In Vercel, import the repo and set **Root Directory** to `exit-criteria-builder`. The framework preset is Vite.

Environment variables:

| Variable | Purpose |
|---|---|
| `LLM_BASE_URL` | OpenAI-shaped base URL for Muse Glimmer, e.g. `https://integrate.api.nvidia.com/v1` |
| `LLM_MODEL` | The Muse Glimmer model id on that host |
| `LLM_API_KEY` | Your own key for that host |
| `ANTHROPIC_MODEL`, `OPENAI_MODEL`, `GEMINI_MODEL` | Optional default model ids for bring-your-own-key providers. Visitors can also type a model id in the app |

## Stack

React 18 and Vite, plain CSS, Lucide icons, one Vercel serverless function (`api/build.js`).

## Project layout

```
api/build.js        system prompt, provider calls, input limits
src/App.jsx         sidebar, form, results, how it works, examples
src/parse.js        tagged-line parser, wording check, Markdown export
src/examples.js     three worked examples with saved results
src/styles.css      moss palette, layout, mobile rules
```

## Part of Daily AI Builds

One small AI product a day, built to show how a PM thinks about a problem, scopes a tool and ships it. This one belongs to the PM workflow set, alongside Handback, Data or product?, Who Owns This? and Pattern or One-Off?

Built by [Prerna Kakkar](https://github.com/kakkarprerna).
