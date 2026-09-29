# Silent Failure Detector

Part of an ongoing series of small AI product builds. Each one is scoped to a day and picks a single AI product-management problem worth prototyping.

## The problem

Most evals are built to catch two failure modes: outright errors and refusals. Both are visible, so they get flagged and fixed. The failure mode that does the most damage in production is quieter: an answer that sounds completely certain and is wrong. There's no error trace, no refusal, nothing for a monitoring dashboard to catch. The only signal is a mismatch between how confidently the answer is phrased and how much of it can actually be verified.

## What it does

Paste a question and an AI-generated answer. A judge model (Claude) extracts the checkable factual claims in the answer, rates each one from verified through to fabrication risk, and separately scores how assertively the answer is phrased.

The two scores combine into a single silent failure score, with three response bands:

- **0–25** — safe to auto-serve
- **26–55** — spot-check or add sourcing before it ships
- **56–100** — route to a human reviewer

The claims render back over the original answer as a redlined transcript, so it's clear exactly which phrases are carrying more certainty than the evidence behind them supports. A claims ledger below lists each one individually with its status and a short rationale.

## Why this framing

The weighted-band approach mirrors the scoring logic used elsewhere in this build series, most directly the match-score rubric in the job-search automation tool: a numeric score, a fixed threshold, and a clear action tied to each band, rather than a single pass or fail. Confidence and verifiability are scored separately on purpose. An answer can be highly confident and highly verifiable (fine), highly confident and poorly verifiable (the actual risk case), or hedged and poorly verifiable (lower risk, because at least it's flagged as uncertain).

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

Load either of the two built-in examples to see it work end to end without writing your own test case.

## Limitations

- The judge model scores claims against its own training knowledge, not a grounded retrieval source. Treat the output as a triage signal, not a verified fact-check.
- This demo calls the Anthropic API directly from the browser with a key read from `.env`, which is fine for local use but exposes the key client-side. A production version would route the call through a backend so the key never reaches the browser.
- Inline highlighting depends on the judge model quoting the answer verbatim. Paraphrased claims still appear in the claims ledger even if they aren't highlighted in the transcript.
