# Who Owns This?

Daily AI build, PM workflow diagnosis series. Describe a bug's symptoms
(where it was noticed, what kind of failure, when it started, who's
affected, plus free-text notes) and get back a ranked guess at which system
owns it: reasoning grounded in the specific symptoms, the questions that
would confirm or rule it out fastest, and a draft handoff message for the
top candidate.

Built to save the round trip a vague bug report causes when it bounces
between frontend, backend and a vendor before anyone confirms whose
problem it actually is.

## Stack

- React + Vite, plain CSS (no framework), lucide-react for icons
- A single Vercel serverless function (`/api/diagnose.js`) holds the system
  prompt and calls the Anthropic API; the key never reaches the client
- Model output is plain tagged-line text rather than JSON, parsed by
  `src/lib/parseResponse.js` — see `/method` in the app for why
- Three saved worked examples (`src/data/examples.js`) so the reasoning is
  visible without an API key
- Visitors can add their own Anthropic key from the Diagnose page
  (`src/components/ApiKeyPanel.jsx`); it's kept in `localStorage` only and
  sent as an `x-user-api-key` header, which the function prefers over the
  shared `ANTHROPIC_API_KEY` when present

## Run locally

```bash
npm install
npm run dev
```

The dev server proxies `/api/*` to `localhost:3000`. To exercise the real
endpoint locally, run `vercel dev` instead (needs the Vercel CLI and an
`ANTHROPIC_API_KEY` in `.env.local`), or just rely on the Examples page,
which needs no key at all.

## Deploy

1. Push this repo to GitHub.
2. Import it in Vercel (framework preset: Vite).
3. Add `ANTHROPIC_API_KEY` under Project Settings → Environment Variables.
4. Deploy. The serverless function at `/api/diagnose` picks up the key
   automatically.
