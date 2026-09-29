# Escalation Quality Scorer

Part of an ongoing series of small AI product builds. Each one is scoped to a day and picks a single AI product-management problem worth prototyping. Sits alongside [Silent Failure Detector](https://github.com/kakkarprerna/silent-failure-detector) as a pair, both are about the gap between how an AI system looks like it's performing and what actually reaches the next person in the loop.

## The problem

When a conversational AI agent escalates to a human, the escalation itself is easy to measure, it either happens or it doesn't. What's much harder to see is whether anything useful survived the handoff. A customer who has to repeat their issue, their account details, or their frustration to a human after an AI already collected all of it has had a worse experience than if there had been no AI in the loop at all.

## What it does

Paste a conversation transcript between an AI agent and a customer, along with the handoff note the AI wrote for the human agent, if one exists. A judge model (Claude) checks two things:

- **Context transfer** — how much of what the human agent needs (the issue, identifying details, what's already been tried, whether the customer is frustrated) actually made it into the handoff note
- **Redundant questions** — moments where the AI asked the customer for something they'd already provided earlier in the same conversation

These combine into a single **handoff quality score**: context transfer minus a fixed penalty per redundant question, with three response bands:

- **80–100** — clean handoff, ready to route
- **50–79** — needs a quick human skim before responding
- **0–49** — broken handoff, the customer effectively restarts

Escalation timing (early, appropriate, late) and whether urgency was flagged to the human agent show as separate pass/fail badges rather than folded into the score, since those are checklist items, not a spectrum.

## Why this framing

Context transfer and redundancy are scored separately rather than as one blended metric, because they fail for different reasons and point to different fixes. Low context transfer usually means the handoff note template is missing a field. Redundant questions usually mean the AI isn't referencing its own conversation history correctly. Conflating them into one number would hide which one to go fix.

## Tech

- React + Vite
- Anthropic API (Claude), called directly from the browser for this demo, acting as the judge model
- No backend, no data storage

## Running it locally

```bash
npm install
cp .env.example .env   # add your own Anthropic API key to .env
npm run dev
```

Load either of the two built-in examples to see it work end to end without writing your own test transcript.

## Limitations

- The judge model scores the handoff from the transcript alone, with no access to the live account or CRM record a real human agent would see. Treat the output as a triage signal for QA sampling, not a definitive audit of any single handoff.
- The 15-point penalty per redundant question is a judgement call for this demo, not a validated weighting. It's worth tuning against real transcripts before using the score for anything operational.
- This demo calls the Anthropic API directly from the browser with a key read from `.env`, which is fine for local use but exposes the key client-side. A production version would route the call through a backend so the key never reaches the browser.
- Inline highlighting depends on the judge model quoting the transcript verbatim. Paraphrased matches still appear in the redundancy log even if they aren't underlined in the transcript.
