# Daily AI Builds

Small, working AI tools built by a product manager. One problem per build, each with a live app or worked examples you can open without an API key.

I'm Prerna Kakkar, a Senior Product Manager with 10+ years across conversational AI, API-first SaaS and analytics. Each build starts from a problem I've seen at work or in daily life. I write the brief, make the product and design calls, set the guardrails and review every version. The code is written by AI coding tools working from my prompts and review.

---

## Latest

**[Prompt Drift Watch](./prompt-drift-watch)** · [live app](https://prompt-drift-watch.vercel.app)
Paste the current and proposed versions of a system prompt, say what you meant to change, and add a few real user messages. Each message runs under both prompts, and every difference is labelled as intended or a side effect, ending in Ship, Retest or Hold. It also quotes the wording in the new prompt most likely behind each side effect.

---

## The builds

### Career and PM practice

| Build | What it does | Try it |
| --- | --- | --- |
| [Loop Ready](./loop-ready) | JD and hiring stages in, prep plan per round out, with verified resources only | [Live](https://loop-ready.vercel.app) |
| [AI or Me?](./ai-or-me) | Helps a PM decide whether a task needs AI at all, or is better done by hand to keep the skill | [Live](https://ai-or-me-advice.vercel.app) |

### PM workflow diagnosis
Tools that help a PM work out what is wrong before pulling in engineering.

| Build | What it does | Try it |
| --- | --- | --- |
| [Signal Translator](./signal-translator) | Turns a stack trace, failed API response or webhook payload into a plain verdict, blast radius and draft ticket | Worked examples |
| [Repro Builder](./repro-builder) | Turns a vague user complaint into a reproduction script that isolates one variable at a time | Worked examples |
| [Handback](./handback) | Audits a draft PRD and lists the questions engineering will send back, ranked by what they block. No model, rules only | [Live](https://handback-weld.vercel.app) |
| [Data or Product?](./data-or-product) | Says whether a metric anomaly looks like broken measurement or a real change in behaviour | Worked examples |
| [Who Owns This?](./who-owns-this) | Ranks the systems most likely to own a bug and drafts the handoff message | Worked examples |
| [Pattern or One-Off?](./pattern-or-one-off) | Judges whether a bug report is a pattern or a one-off, and what would change that verdict | Worked examples |

### AI reliability and evaluation

| Build | What it does | Try it |
| --- | --- | --- |
| [Prompt Drift Watch](./prompt-drift-watch) | Runs the same messages under two versions of a system prompt and flags behaviour changes you didn't ask for | [Live](https://prompt-drift-watch.vercel.app) |
| [Silent Failure Detector](./silent-failure-detector) | Flags AI answers that sound confident about claims that cannot be checked | Worked examples |
| [Escalation Quality Scorer](./escalation-quality-scorer) | Scores AI-to-human handoffs on context passed and questions repeated | Worked examples |
| [Root Cause Detector](./root-cause-detector) | Points to the stage of an AI agent's workflow most likely to have caused a failure | Worked example |
| Cost-of-Error Estimator | Estimates the monthly cost of each AI failure type and ranks them | |
| Prompt injection test harness | Runs injection attempts against a prompt and records which ones get through | |
| A/B eval dashboard | Compares two model outputs with a third model as judge | |

### Customer success diagnostics
Drawn from my time running customer success alongside product.

| Build | What it does | Try it |
| --- | --- | --- |
| Pulse Check | Account health score from 0 to 100 across five weighted categories, with top risks and one next action. Fixed formula, no model | |
| Expansion Radar | Expansion readiness score and the play to run next. Fixed formula, no model | |
| Churn Autopsy | A post-mortem on a lost account's timeline | [Live](https://churn-autopsy-sandy.vercel.app) |

### Teen safety with AI chatbots
Tools aimed at reducing harm when AI chatbots give teenagers dangerous advice. No sign-in, nothing stored, and worked examples written without any real method or dosage detail.

| Build | What it does |
| --- | --- |
| Duty of Care | Reads a pasted chat and scores three softly named signals: physical safety, emotional signals, trust and boundaries |
| How to Bring It Up | For parents and guardians: an opener, what to avoid, what to listen for and when to get professional help |
| What Happens Next | Once a concern is confirmed: who to contact first, what to say and named support lines by country. Rules only, no model, for reliability |

### Everyday life
Several of these came from living in Spain as an expat.

| Build | What it does | Try it |
| --- | --- | --- |
| [Dígame](./digame) | Writes a phone script for calling a Spanish office, in the order the call happens, with Spanish read aloud | [Live](https://digame-rho.vercel.app) |
| [As Printed](./as-printed) | Translates Spanish medical documents literally, expands abbreviations and lists questions for the doctor. It does not interpret | Worked examples |
| [Says Who?](./says-who) | Paste a parenting tip for ages 0 to 3 and see how well official health bodies back it | [Live](https://says-who-advice.vercel.app) |
| [Before the Basket](./before-the-basket) | Scores a grocery item on how it was produced and processed, from its ingredients or a label photo | [Live](https://before-the-basket.vercel.app) |
| [Lab Report Translator](./lab-report-translator) | Reads a soil or leaf analysis and returns per-nutrient status, timed actions and the limits of the test | Worked examples |

---

## How the builds are made

The same patterns run through most of them.

- **Free model by default.** Recent builds run on Meta Muse Glimmer through NVIDIA's free endpoint, on my key. Visitors can switch to Anthropic, OpenAI or Gemini with their own key, which is used for one request and never stored.
- **Prompts stay on the server.** The system prompt and API key sit in a Vercel serverless function, not in the browser bundle.
- **Tagged lines instead of JSON.** Models reply in lines like `STAGE|2|Hiring manager|...`. A broken line is skipped, so one bad line doesn't sink the result, and changing provider is cheap.
- **Three worked examples per build.** Saved results load instantly, so anyone can see the tool work without a key.
- **Rules where a model is the wrong tool.** Handback, Pulse Check, Expansion Radar and What Happens Next use fixed, printed rules because the answer has to be the same every time.
- **Sources shown.** Each app says where its data or judgement comes from and what it cannot do.

## Running a build locally

Each folder is its own Vite project.

```bash
cd <build-folder>
npm install
npx vercel dev   # runs the app and its API function together
```

Builds with a model call need these environment variables, set in Vercel or a local `.env.local`:

| Variable | Value |
| --- | --- |
| `LLM_BASE_URL` | `https://integrate.api.nvidia.com/v1` |
| `LLM_MODEL` | The Muse Glimmer model id on NVIDIA |
| `LLM_API_KEY` | Your NVIDIA API key |

To deploy one build on Vercel, import this repo and set the Root Directory to that build's folder.

## Contact

Find me on LinkedIn as Prerna Kakkar, or on GitHub at [kakkarprerna](https://github.com/kakkarprerna).
