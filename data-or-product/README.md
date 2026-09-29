# Data or product?

A metric moved. Before you tell anyone why, you need to know whether it moved at all.

Most anomalies that reach a product manager are one of two things wearing the same clothes: the measurement broke, or people genuinely changed. This tool reads a plain description of what happened and returns a verdict on which one you're looking at, an ordered list of cheap checks that would settle it, and the point where it stops being a PM question and becomes engineering's.

**Live:** [data-or-product.vercel.app](https://data-or-product.vercel.app)

## How it decides

You describe the metric, what it did, and six things about the shape of the change: how it looks on the chart, where it shows up, what changed nearby, which tool the number comes from, and what you've already ruled out. A language model reasons over that description the way a colleague who has debugged a hundred of these would, before anyone opens a dashboard.

The patterns it leans on:

- A sharp overnight step that then holds flat usually means the counting broke. Code ships at a moment, so instrumentation breaks at a moment.
- A gradual slide over weeks usually means behaviour or traffic mix. Instrumentation doesn't drift.
- A drop confined to one platform that lines up with a release is worth suspecting, since tags ship inside releases.
- Matching support tickets are strong evidence the change is real, since broken tracking never generates complaints.

Three worked examples ship with the app and need no model call at all, so the reasoning is visible even without a key.

## Stack

React and Vite on the front end, a single Vercel serverless function on the back. The function holds the system prompt and the API key, calling an OpenAI-shaped chat completions endpoint. It's currently pointed at Meta's Muse Glimmer 30B on NVIDIA's hosted endpoint, chosen so the whole thing runs for free, but the base URL and model are both environment variables, so swapping providers doesn't touch the code.

```
LLM_BASE_URL   defaults to https://integrate.api.nvidia.com/v1
LLM_MODEL      defaults to meta/muse-glimmer-30b
LLM_API_KEY    required, no default
```

## Running it locally

```bash
npm install
echo "LLM_API_KEY=your-key-here" > .env.local
vercel dev
```

Use `vercel dev` rather than `npm run dev`. Plain Vite has no way to serve the function under `/api`, so the diagnosis call will 404 without it.

## Deploying

```bash
vercel link
vercel env add LLM_API_KEY production
vercel --prod
```

## Part of a series

Built as one of a run of daily AI-assisted tools exploring the same question from different angles: where a product manager's judgement and an LLM's pattern-matching actually combine well. More at [Prerna Kakkar's GitHub](https://github.com/kakkarprerna).
