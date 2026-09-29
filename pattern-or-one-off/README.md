# Pattern or One-Off?

Daily AI build — takes a bug report and what you already know about how it's shown up
(repeat count, timing, who's affected, what changed nearby) and returns a verdict:
is this an isolated glitch, or the start of something worth escalating as systemic.
Built for PMs diagnosing product workflow issues without pulling engineering in first.

Part of the "diagnose workflow issues without pulling in engineering" series, alongside
Signal Translator, Repro Builder, Data or Product?, Who Owns This?, and Handback.

## Stack

- React + Vite, no UI framework
- Serverless function (`api/diagnose.js`) holds the model call and API key
- Model output uses tagged lines rather than JSON — see `src/lib/parseResult.js`
- Three saved worked examples (`src/data/examples.js`) so it's fully explorable with no key

## Local development

```bash
npm install
npm run dev
```

The `/api/diagnose` route only runs under Vercel's dev server or once deployed —
plain `vite dev` will serve the frontend but the diagnose button will 404 until
you either run `vercel dev` locally or deploy. The three worked examples in the
Examples tab work with no backend at all.

## Providers

Muse Glimmer is the default and runs on your own server-side key — visitors need nothing
to try it. Anthropic, OpenAI, and Gemini are also selectable, but have no server-side
fallback: a visitor who picks one of those must paste their own key, which is sent
straight through for that one request and never stored or logged.

## Deploy

1. Push this to a GitHub repo.
2. Import it in Vercel.
3. Set environment variables (see `.env.example`):
   - `LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY` — Muse Glimmer, required
   - `ANTHROPIC_MODEL`, `OPENAI_MODEL`, `GEMINI_MODEL` — optional, only if you want
     different default model ids for visitors bringing their own key

## Palette

Sapphire (`#0f52ba`), following the one-dominant-colour-per-app rule. Red, amber and
green are reserved for the verdict status states only.
