# Ship Check

Vibe coding debt scanner. Describe how something got built, get back a verdict,
ranked risks, questions for engineering, and what would flip the call.

## Local setup

```
npm install
npm run dev
```

## Deploy (Vercel)

Push this to GitHub and import it into Vercel as you have with the other
daily builds. Set these so the free default model works:

- `LLM_BASE_URL` (defaults to `https://integrate.api.nvidia.com/v1`, only set
  this if you are pointing at a different OpenAI-shaped host)
- `LLM_MODEL` (the NVIDIA model slug for Meta Muse Glimmer 30B)
- `LLM_API_KEY` (your NVIDIA API key)

Anthropic, OpenAI, and Gemini have no server-side key, visitors must paste
their own to use those three. Muse Glimmer stays selected by default and
runs on the key above unless a visitor pastes their own NVIDIA key instead.
Any pasted key is sent to `api/scan.js` with the single request it is used
for and is never stored or logged.

## Notes

- `src/App.jsx` tries `/api/scan` first, which only exists once this is
  deployed with the serverless function above. If that route is not
  reachable (for example when previewing the component on its own), it falls
  back to calling Anthropic directly, so the Free demo and Anthropic options
  still work without a backend.
