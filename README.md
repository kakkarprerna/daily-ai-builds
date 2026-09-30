# Daily AI builds

Small AI tools, each aimed at one specific problem. I plan and direct every build with AI coding tools, then ship it to a live link with worked examples, so you can see it working without setting anything up.

Each folder is a self-contained app with its own README covering what it does, how it works and where its data comes from.

Most builds use React and Vite on Vercel, with prompts and API keys held in a serverless function rather than the browser. Newer builds default to Meta Muse Glimmer 30B and let visitors bring their own Anthropic, OpenAI or Gemini key.

## Product management

| Build | What it does | Live |
|---|---|---|
| [Exit Criteria Builder](./exit-criteria-builder) | Sets measurable exit criteria for each stage of a product roadmap. | [Open app](https://daily-ai-builds.vercel.app) |
| [Handback](./handback) | Paste a draft PRD and get the questions engineering will send back, ranked by whether the gap blocks the build, sign-off or launch. 22 deterministic rules, every one printed in the app. No model, no API key, runs entirely in the browser. | [Open app](https://handback-weld.vercel.app) |
| [Signal Translator](./signal-translator) | Triage tool for product managers: paste a stack trace, failed API response or webhook payload and get a plain-language verdict, blast radius, self-checks and a draft ticket. | [Open app](https://signal-translator.vercel.app) |
| [Repro Builder](./repro-builder) | Turns a vague bug report into a reproduction script that changes one variable at a time, plus the questions worth asking the reporter and a verdict: confirmed bug, spec gap, or expected behaviour the user disliked. | [Open app](https://repro-builder.vercel.app) |
| [Data or Product?](./data-or-product) | Tells a PM whether a metric moved because the measurement broke or because users behaved differently, with the cheap checks that settle it | [Open app](https://data-or-product.vercel.app) |
| [Who Owns This?](./who-owns-this) | Find who owns a website or domain using public web, domain, and company signals. | [Open app](https://who-owns-this-delta.vercel.app) |
| [Pattern or One-Off?](./pattern-or-one-off) | Takes a bug report and tells you whether it's a pattern worth escalating or a one-off you can close out. A PM triage tool that skips pulling in engineering first | [Open app](https://pattern-or-one-off.vercel.app) |
| [Works on Staging](./works-on-staging) | It works on staging, so why not in production? Diagnoses environment drift for PMs: likely cause, checks to run yourself, and a handover note for engineering. | [Open app](https://works-on-staging.vercel.app) |
| [Ship Check](./ship-check) | Vibe coding debt scanner: describe how something got built, get back a verdict, ranked risks, and questions to ask an engineer before shipping | [Open app](https://ship-check-app.vercel.app) |

## AI quality and evaluation

| Build | What it does | Live |
|---|---|---|
| [Eval Starter Kit](./eval-starter-kit) | Describe an AI feature, get a starter eval set: test cases, pass and fail rules, priorities and a model-judge prompt | [Open app](https://eval-starter-kit.vercel.app) |
| [Silent Failure Detector](./silent-failure-detector) | Audits AI answers by scoring confidence language against claim verifiability, flagging fluent wrong answers that standard evals miss. | Code only |
| [Escalation Quality Scorer](./escalation-quality-scorer) | Scores AI-to-human handoffs on context transfer and redundant questions, catching escalations where the customer has to repeat themselves. | Code only |
| [Cost-of-Error Estimator](./cost-of-error-estimator) | Estimates the monthly cost of AI product failures and ranks them by exposure, so PMs know where to invest in evals and guardrails first. | Code only |
| [Root Cause Detector](./root-cause-detector) | Diagnoses which stage of an AI agent's workflow most likely caused a failure, given a plain-language description of what went wrong. React and Vite, calls the Anthropic API directly from the browser. Ships with a worked example from a real voice-agent incident. | [Open app](https://root-cause-detector.vercel.app) |
| [A/B Eval Dashboard](./ab-eval-dashboard) | Compares two models' answers using a third model as judge. | Code only |
| [Prompt Injection Harness](./prompt-injection-harness) | Tests prompts against injection attacks. | Code only |

## Customer success

| Build | What it does | Live |
|---|---|---|
| [Pulse Check](./pulse-check) | Deterministic customer success health scorecard - turns account signals into a scored, banded diagnosis with ranked risks and a recommended next action. No model, every formula printed. | [Open app](https://pulse-check-rho-one.vercel.app) |
| [Churn Autopsy](./churn-autopsy) | Blameless churn post-mortems: find the first real warning sign, the point of no return, and early-warning rules for the rest of your book. | [Open app](https://churn-autopsy-sandy.vercel.app) |
| [Expansion Radar](./expansion-radar) | Scores an account's expansion readiness and returns the specific upsell or cross-sell play to run, not just a health number. Companion to Pulse Check. | [Open app](https://expansion-radar-eight.vercel.app) |
| [What Happens Next](./what-happens-next) | Rules-based next-steps planner for parents after an AI chatbot conversation flags a safety concern. Deterministic decision logic maps signal type, urgency and existing support to who to contact, what to avoid, and country-specific crisis lines. Third build in a daily AI safety series. | [Open app](https://what-happens-next-lake.vercel.app) |

## Teenagers and AI chatbots

| Build | What it does | Live |
|---|---|---|
| [Duty of Care](./duty-of-care) | A private, judgement free read on whether an AI chat conversation drifted somewhere risky. Daily AI build in the AI safety for teens series, built after the Sam Nelson case. | [Open app](https://duty-of-care.vercel.app) |
| [How to Bring It Up](./how-to-bring-it-up) | A low-pressure way to open a hard conversation about something you noticed involving an AI chatbot. Companion piece to Duty of Care in the AI safety for teens daily build series. | [Open app](https://hot-to-bring-it-up.vercel.app) |

## Everyday and specialist tools

| Build | What it does | Live |
|---|---|---|
| [Dígame](./digame) | Phone call scripts for people new to Spain, generated before you dial. Runs on Anthropic, Gemini or a free open-weight model. | [Open app](https://digame-rho.vercel.app) |
| [As Printed](./as-printed) | Decodes Spanish medical documents word for word: translation, expanded abbreviations, dosing restated in plain English. Deliberately never interprets results. | [Open app](https://as-printed.vercel.app) |
| [Before the Basket](./before-the-basket) | Scores a grocery or ready-made product on how it was produced and how it was processed, against the best and worst practice where you live. React + Vite, serverless AI judge, three worked examples. | [Open app](https://before-the-basket.vercel.app) |
| [Lab Report Translator](./lab-report-translator) | Reads a soil or leaf analysis and tells the farmer in plain language what is short, what it means for their crop, and what to do about it. Paste the lab sheet in any language, get the answer in any language. | [Open app](https://lab-report-translator-lilac.vercel.app) |
