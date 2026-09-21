# Pulse Check

A customer success account health scorecard. Every score comes from a fixed,
printed formula, not a model or an AI guess, so a rep can always trace a
number back to the inputs that produced it.

Daily AI build, first entry in the customer success diagnostics theme.

## What it does

Enter an account's signals (adoption, business outcomes, engagement,
sentiment, support) and it returns:

- An overall health score (0-100) with a red/yellow/green band and trend
  vs last quarter
- A breakdown across five weighted categories
- The top three risks, ranked by a severity score
- One recommended next action, chosen from a decision table

The full method, including every weight and threshold, is on the
**How it works** page inside the app.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Outputs a static site to `dist/`, deployable anywhere that serves static
files (Vercel, Netlify, GitHub Pages).

## Deploy to your usual stack (GitHub + Vercel)

```bash
# from this folder
git init
git add .
git commit -m "Pulse Check: CS account health scorecard"
gh repo create kakkarprerna/pulse-check --public --source=. --push

# then either import the repo at vercel.com/new, or:
npx vercel --prod
```

No API key, no environment variables and no serverless function needed —
this build is fully deterministic and runs entirely client side.
