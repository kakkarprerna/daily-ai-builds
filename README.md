# Signal Translator

A triage tool for product managers. Paste a raw technical artefact and it returns what broke in plain language, who it affects, whether you can fix it yourself, and a draft ticket if you cannot.

Built as part of a daily AI builds series exploring where product managers can diagnose problems without pulling an engineer in first.

## The problem

When something goes wrong in a product, the evidence arrives in a form written for engineers: a stack trace, a failed API response, a browser console dump, a webhook retrying against a 401. Most product managers forward that on and wait. The wait costs an engineer's context switch, and it happens whether or not the answer needed one.

## What it does

Given the artefact plus a line of context, it returns:

| Output | Purpose |
| --- | --- |
| Verdict | Configuration, Contract or data, or Code defect, with a confidence level |
| Plain summary | What broke, written without technical vocabulary |
| Journey affected and blast radius | Which part of the customer experience, and how wide |
| Self-checks | Up to three checks a PM can run alone, each with what the answer would mean |
| Draft ticket | Title, severity with a rationale, repro steps, expected, actual, what to attach |
| Glossary | Terms lifted from the artefact, explained without jargon |
| Limits | What the artefact cannot tell you |

The three verdicts are the point of the tool. Configuration means credentials, settings or account state and no code change. Contract or data means the system behaved as built but the data or the agreed shape between two systems is wrong or stale. Code defect is the only one that needs an engineer.

## Design notes

Type carries the argument. A serif sets everything written for a human, a mono sets everything the machine produced, and a neutral sans handles interface chrome only. The split between raw signal and translated signal is visible before you read a word.

The self-checks are checkboxes rather than a list, so the section behaves like a gate. The copy-as-markdown button carries the ticked checks into the ticket, which means what lands in the tracker shows the triage that already happened.

## Honesty about the output

The model reads only the pasted text and the typed context. It has no access to logs, dashboards or monitoring, and it cannot verify anything. Every result is a first-pass opinion to check against your own systems, not a diagnosis to act on. The interface says this where it can be seen during use, and every result closes with what the artefact could not tell you.

## Running it

```bash
npm install
npm run dev
```

Bring your own Anthropic API key, pasted into the field in the console panel. The key stays in browser memory for the session and is never stored or sent anywhere except the Anthropic API.

The three worked examples carry saved results, so the tool demonstrates itself in full without a key.

## Stack

React 18, Vite, no UI framework. Calls the Anthropic Messages API directly from the browser.
