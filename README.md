# Root Cause Detector

A daily AI build that traces a failure back through an AI agent's workflow
architecture and estimates which stage most likely caused it.

You describe the stages your agent's pipeline passes through (or start from a
RAG, tool-use, or multi-agent template) and what went wrong. Claude reads the
description, weighs each stage's likelihood of being the fault, and returns
reasoning plus a suggested diagnostic test per stage.

The app ships with a worked example, a real barge-in failure from a Jinn Live
voice agent, so anyone without an Anthropic API key can still see a full case
end to end.

## Stack

React + Vite, calling the Anthropic API directly from the browser. No
backend, no database. State lives in memory only.

## Running locally

```
npm install
npm run dev
```

## Live diagnosis

A live run needs your own Anthropic API key, entered directly in the app.
The key is only ever sent from your browser straight to Anthropic for that
one request. It's never stored, logged, or sent anywhere else, including to
this app's own code.

## Deploying

Push this repo to GitHub, then import it into Vercel as a new project.
Vercel auto-detects the Vite build (`npm run build`, output directory
`dist`) with no extra configuration needed.
