# Duty of Care

A daily AI build in the AI-safety-for-teens sub-series. Paste in how an AI
chat conversation went and get back a private, plain-language read on
whether it drifted somewhere risky, across three signals: physical safety,
emotional signals, and trust & boundaries.

Built after reading about Sam Nelson, a 19-year-old whose family is suing
OpenAI after ChatGPT gave him specific, escalating drug-dosing advice before
his death. This will not catch everything, and it is not trying to replace
a parent, a doctor, or a real conversation. It is one small, honest attempt
at the gap that let that conversation happen unchecked.

## Why it looks the way it does

- **Categories are deliberately soft.** No "self-harm," "overdose," or
  "exploitation" labels anywhere in the UI. The three signals (physical
  safety, emotional signals, trust & boundaries) say enough to be useful
  without sounding clinical, diagnostic, or like a surveillance tool. A
  teenager reading this should feel informed, not flagged.
- **Privacy is real, not just a banner.** No sign-in, no name, no storage.
  The `/api/scan` function does not write the transcript anywhere, not to a
  database, not to a log line beyond the default platform error logging on
  a crash. The only place the text goes is to the AI provider chosen for
  that one request. The copy on the Check and How This Works pages says
  exactly that and nothing more, since overselling privacy to someone who
  might be in a vulnerable spot would be worse than being plainly honest
  about the one real limit (the provider does see the text, briefly).
- **Worked examples are patterns, not real content.** Every example in
  `src/data/examples.js` describes how a conversation shifted, never an
  actual dose, method, or combination. That was a deliberate line, not an
  oversight: a demo that doubled as a working example of the exact harm it
  is meant to catch would defeat the point, and would not be something
  worth publishing regardless of the protective framing around it.
- **Crisis resources sit on every page**, not gated behind a red result,
  because someone using this out of worry for themselves shouldn't have to
  get a bad score first to see them.

## Local setup

```bash
npm install
cp .env.example .env
# fill in LLM_BASE_URL / LLM_MODEL / LLM_API_KEY with the same NVIDIA
# values used on your other daily builds (Dígame, Pattern or One-off, etc)
npm run dev
```

The dev server runs the frontend only. `/api/scan` is a Vercel serverless
function, so to test the free (Muse Glimmer) path locally you will need
`vercel dev` instead of `vite dev`, or deploy and test on Vercel directly.
The three bring-your-own-key providers (Anthropic, OpenAI, Gemini) need no
local env setup, since the visitor supplies the key in the browser.

## Deploy to Vercel

```bash
npm i -g vercel   # if not already installed
vercel
```

Then set the three env vars (`LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY`) in
the Vercel project settings, matching your other builds, and redeploy.

## Structure

```
src/
  App.jsx                 sidebar + page switch, no router needed at this size
  components/
    Sidebar.jsx
    CheckPage.jsx          the paste-and-scan flow
    Examples.jsx           three worked examples, click to expand
    HowItWorks.jsx         plain-language explainer + limits
    ResultCard.jsx         shared verdict display, used by both live scans and examples
    ResourceFooter.jsx     crisis resources, shown on every page
  data/examples.js          the three worked examples and their saved verdicts
  lib/parseResult.js        parses the model's tagged-line output
api/scan.js                 serverless function, routes to the chosen provider
```

## Model output format

Tagged lines, not JSON, matching the rest of the series:

```
RISK_LEVEL: green|amber|red
CONFIDENCE: 0-100
PHYSICAL: none|watch|flag
EMOTIONAL: none|watch|flag
TRUST: none|watch|flag
SUMMARY: ...
REASONING: ...
NEXT_STEP: ...
WHAT_WOULD_CHANGE: ...
```

The system prompt in `api/scan.js` explicitly instructs the model never to
include a specific dosage, method, or step-by-step detail in any field,
even when explaining why something was flagged.

## Honest limits

This is a prototype for a portfolio, not a safety product. It can misread
tone, miss real risk, or flag something harmless. It has no memory across
conversations, no way to notice patterns over time, and no connection to
the actual AI tool a person is using elsewhere. A real version of this
would need to be a browser extension with the AI providers' cooperation,
which is a genuinely different and much larger project. Worth being
upfront about that gap if this gets written up publicly.
