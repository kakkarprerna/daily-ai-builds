# What Happens Next

Rules-based next-steps planner for the moment an AI-chat safety signal is confirmed. Third build in a daily AI safety series looking at where AI chatbots put teenagers at risk, and what a product response to that risk could actually look like.

## Live

- App: [add your Vercel URL]
- Series so far: Duty of Care (conversation analyser), How to Bring It Up (parent conversation guide), What Happens Next (this build)

## Why this exists

Detecting a problem is not the same as knowing what to do about it. Duty of Care, the first build in this series, scores an AI chat for physical safety, emotional and trust and boundary signals. That leaves a parent with a hard fact and no next step. What Happens Next picks up from there.

## What it does

Seven short questions about the situation:

- Signal type flagged
- How urgent it feels
- How it came up
- Living arrangement
- Whether the teen knows
- Existing professional support
- Country

These map through a fixed set of rules, not a model, to:

- Who to contact first, ordered by urgency and existing support
- What not to do in the first hour
- What to say, in general terms rather than a script
- What to watch for next, specific to the flagged signal
- Named support lines for Spain, the UK and the US, with a general fallback elsewhere

Three saved worked examples let a visitor see a finished plan without entering anything themselves.

## Why deterministic, not a model

Every other build in this portfolio calls the Anthropic API. This one does not. A crisis line number, or a same-day-versus-next-session judgement, is not somewhere I want a model improvising a plausible-sounding answer. The full rule set is visible in `index.html`, nothing is hidden behind a prompt.

## Stack

Plain HTML, CSS and JavaScript. No framework, no build step, no API key, no sign-in. Nothing entered on the page is stored or sent anywhere, it stays in the browser tab.

## Note

This is a decision-support starting point, not a substitute for a professional who can see the specific situation. If there is any chance of immediate danger, that comes before anything the tool suggests.
