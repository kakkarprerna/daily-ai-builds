# Daily AI Builds

Small, working AI tools built by a product manager. One problem per build, each with a live app or worked examples you can open without an API key.

I'm Prerna Kakkar, a Senior Product Manager with 10+ years across conversational AI, API-first SaaS and analytics. Each build starts from a problem I've seen at work or in daily life. I write the brief, make the product and design calls, set the guardrails and review every version. The code is written by AI coding tools working from my prompts and review.

---

## Latest

**[Send or Hold?](./send-or-hold)** · [live app](https://send-or-hold.vercel.app)
Decides whether a holiday rental's AI co-host can answer a guest alone. Paste a guest message and your house facts: a model quotes what the guest wants and drafts a reply in their language, and printed rules put the message in one of four lanes, Send now, Host checks, Host decides or Act now. A safety word list in four languages runs before any model call, every number in the draft is checked against the house facts, and Act now sends a fixed safety message rather than model text. The host gets a note with each decision, the guest's words and options to pick from. Built from hosting my own holiday rentals in Málaga and building agents with human handoff at Jinn Live.

**[Mischmasch](./mischmasch)** · [live app](https://mischmasch-words.vercel.app)
Word games for a child learning English, Spanish, German and Chinese at once, where every round mixes all four. A tile builder that rotates the language to spell in (character tiles with pinyin for Chinese, rarer letters scoring more), a four-way picture match, a mini crossword where every clue is in one language and its answer in another, and a language spotter with an odd one out. German and Chinese stay at the level of his first-year books, while English and Spanish, his school languages, add longer stretch words. The 112 core words are written in and checked by hand. A model only suggests optional new sets on a topic, each line is checked for shape in the browser, and a grown-up reviews the set before it joins the games.

---

## The builds

Every build has its own folder with a README. **Live** opens the deployed app, where the worked examples run without a key.

### PM practice and career
Including tools for the candidate's side of hiring, drawn from my time in HR tech.

| Build | What it does | Try it |
| --- | --- | --- |
| [Riskiest Bet First](./riskiest-bet-first) | Ranks the bets a new idea rests on, says whether to build yet and plans the cheapest test for each, with pass and kill lines | [Live](https://riskiest-bet-first.vercel.app) |
| [Frontline Pulse](./frontline-pulse) | Groups field notes into recurring blockers, counts the accounts and money behind each, routes them to an owner with a date and writes what the field should say now | [Live](https://frontline-pulse.vercel.app) |
| [So What?](./so-what) | Turns findings into ranked actions that fit your capacity, each with an owner, a first step this week, a metric, a stop condition and a rough impact range | [Live](https://so-what-plan.vercel.app) |
| [Who Says Yes?](./who-says-yes) | Maps who has to agree to a proposal, gives each person a play, sets the order to meet them and says whether you are ready to ask | [Live](https://who-says-yes.vercel.app) |
| [Worth Building?](./worth-building) | Turns an AI feature idea into a business case with payback, scenarios, the assumptions to check first and a pitch per approver | [Live](https://worth-building.vercel.app) |
| [How Did That Go?](./how-did-that-go) | Debriefs an interview round: what each question was testing, where your answer fell short and what to fix before the next one | [Live](https://how-did-that-go.vercel.app) |
| [Loop Ready](./loop-ready) | JD and hiring stages in, prep plan per round out, with verified resources only | [Live](https://loop-ready.vercel.app) |
| [AI or Me?](./ai-or-me) | Helps a PM decide whether a task needs AI at all, or is better done by hand to keep the skill | [Live](https://ai-or-me-advice.vercel.app) |
| [Exit Criteria Builder](./exit-criteria-builder) | Gives every stage of a roadmap a measurable finish line the team can check | [Live](https://exit-criteria-builder.vercel.app) |
| [Ship Check](./ship-check) | Describe how something was vibe coded and get a verdict, ranked risks and questions for engineering | [Live](https://ship-check-app.vercel.app) |

### PM workflow diagnosis
Tools that help a PM work out what is wrong before pulling in engineering.

| Build | What it does | Try it |
| --- | --- | --- |
| [Then What?](./then-what) | Finds where new users stall between sign-up and the first win, where the time goes and which segments lag, and ranks the fixes, each with a test and the numbers to measure and watch | [Live](https://then-what-activation.vercel.app) |
| [Front Door](./front-door) | Finds where a SaaS sign-up and sign-in flow loses people, step by step against alert lines, and ranks the fixes, each with a test and the numbers to measure and watch | [Live](https://front-door-signup.vercel.app) |
| [What It Counts](./what-it-counts) | Explains a SQL query in plain English line by line, marks the traps that could skew its number and writes the questions for the analyst | [Live](https://what-it-counts.vercel.app) |
| [Signal Translator](./signal-translator) | Turns a stack trace, failed API response or webhook payload into a plain verdict, blast radius and draft ticket | [Live](https://signal-translator-prerna-kakkar.vercel.app) |
| [Repro Builder](./repro-builder) | Turns a vague user complaint into a reproduction script that isolates one variable at a time | [Live](https://repro-builder.vercel.app) |
| [Handback](./handback) | Audits a draft PRD and lists the questions engineering will send back, ranked by what they block. No model, rules only | [Live](https://handback-weld.vercel.app) |
| [Data or Product?](./data-or-product) | Says whether a metric anomaly looks like broken measurement or a real change in behaviour | [Live](https://data-or-product.vercel.app) |
| [Who Owns This?](./who-owns-this) | Ranks the systems most likely to own a bug and drafts the handoff message | [Live](https://who-owns-this-prerna-kakkar.vercel.app) |
| [Pattern or One-Off?](./pattern-or-one-off) | Judges whether a bug report is a pattern or a one-off, and what would change that verdict | [Live](https://pattern-or-one-off-prerna-kakkar.vercel.app) |
| [Works on Staging](./works-on-staging) | Finds why something works in one environment and breaks in another, with checks to run before involving engineering | [Live](https://works-on-staging.vercel.app) |

### AI reliability and evaluation

| Build | What it does | Try it |
| --- | --- | --- |
| [Ready to Go Live?](./ready-to-go-live) | Checks an AI agent is ready to launch at a customer: 24 checks by gate, a go, pilot or not-yet verdict, a staged rollout plan with rollback triggers, and a second read of your rollout notes | [Live](https://ready-to-go-live.vercel.app) |
| [Wrong Turn](./wrong-turn) | Reads an agent trace step by step, checks each quote against it and names the first step that went wrong, the layer to fix and how to confirm it | [Live](https://wrong-turn-trace.vercel.app) |
| [Send or Hold?](./send-or-hold) | Puts a holiday rental guest message in one of four lanes, from the AI co-host sending alone to the host acting now, with a checked draft, a fixed safety message and a host note with options | [Live](https://send-or-hold.vercel.app) |
| [Pass the Call](./pass-the-call) | Plans when a voice agent hands a call to a person: a lane per call moment, live triggers, out-of-hours rules and the context packet | [Live](https://pass-the-call.vercel.app) |
| [Who Does What?](./who-does-what) | Splits a workflow into steps and puts each in a lane, from plain rules to a person deciding, with approval points, tool access and a rollout plan | [Live](https://who-does-what-daily-ai.vercel.app) |
| [Found or Fumbled?](./found-or-fumbled) | Takes one wrong answer from a document-backed assistant and names which of eight stages broke, with checks, the fix owner and a draft ticket | [Live](https://found-or-fumbled.vercel.app) |
| [Judge Calibration Lab](./judge-calibration-lab) | Compares an AI judge with human scores on a golden set, shows which way it leans and finds the rubric wording behind each miss | [Live](https://judge-calibration-lab.vercel.app) |
| [Prompt Drift Watch](./prompt-drift-watch) | Runs the same messages under two versions of a system prompt and flags behaviour changes you didn't ask for | [Live](https://prompt-drift-watch.vercel.app) |
| [Eval Starter Kit](./eval-starter-kit) | Turns a description of an AI feature into a starter eval set with pass and fail conditions | [Live](https://eval-starter-kit.vercel.app) |
| [Root Cause Detector](./root-cause-detector) | Points to the stage of an AI agent's workflow most likely to have caused a failure | [Live](https://root-cause-detector-prerna-kakkar.vercel.app) |
| [Silent Failure Detector](./silent-failure-detector) | Flags AI answers that sound confident about claims that cannot be checked, with a redline of every claim | [Live](https://silent-failure-detector.vercel.app) |
| [Escalation Quality Scorer](./escalation-quality-scorer) | Scores AI-to-human handoffs on context passed and questions repeated, and rewrites the handoff note | [Live](https://escalation-quality-scorer.vercel.app) |
| [Cost-of-Error Estimator](./cost-of-error-estimator) | Estimates the monthly cost of each AI failure type, ranks them and tests what a fix would save | [Live](https://cost-of-error-estimator.vercel.app) |
| [Prompt Injection Test Harness](./prompt-injection-harness) | Runs 14 injection attempts against a prompt and checks each reply for the secret, with a positive control | [Live](https://prompt-injection-harness.vercel.app) |
| [A/B Eval Dashboard](./ab-eval-dashboard) | Compares two system prompts on one test set with a judge model, and checks the verdict survives swapping the order | [Live](https://ab-eval-dashboard.vercel.app) |

### AI governance and compliance

| Build | What it does | Try it |
| --- | --- | --- |
| [Which Tier?](./which-tier) | Places an AI feature in an EU AI Act tier with printed rules, lists the duties for your role with dates as amended in 2026, and checks your answers against your own description | [Live](https://which-tier.vercel.app) |

### Customer success diagnostics
Drawn from my time running customer success alongside product.

| Build | What it does | Try it |
| --- | --- | --- |
| [Pulse Check](./pulse-check) | Account health score from 0 to 100 across five weighted categories, with top risks and one next action. Fixed formula, no model | [Live](https://pulse-check-account-health.vercel.app) |
| [Expansion Radar](./expansion-radar) | Expansion readiness score and the play to run next. Fixed formula, no model | [Live](https://expansion-radar-eight.vercel.app) |
| [Churn Autopsy](./churn-autopsy) | A post-mortem on a lost account's timeline | [Live](https://churn-autopsy-sandy.vercel.app) |

### Teen safety with AI chatbots
Tools aimed at reducing harm when AI chatbots give teenagers dangerous advice. No sign-in, nothing stored, and worked examples written without any real method or dosage detail.

| Build | What it does | Try it |
| --- | --- | --- |
| [Duty of Care](./duty-of-care) | Reads a pasted chat and scores three softly named signals: physical safety, emotional signals, trust and boundaries | [Live](https://duty-of-care.vercel.app) |
| [How to Bring It Up](./how-to-bring-it-up) | For parents and guardians: an opener, what to avoid, what to listen for and when to get professional help | [Live](https://how-to-bring-it-up.vercel.app) |
| [What Happens Next](./what-happens-next) | Once a concern is confirmed: who to contact first, what to say and named support lines by country. Rules only, no model, for reliability | [Live](https://what-happens-next-lake.vercel.app) |

### Everyday life
Several of these came from living in Spain as an expat, or from raising children here.

| Build | What it does | Try it |
| --- | --- | --- |
| [Mischmasch](./mischmasch) | Word games where every round mixes English, Spanish, German and Chinese: tile builder, four-way match, mini crossword and language spotter, with optional AI word sets a grown-up reviews | [Live](https://mischmasch-words.vercel.app) |
| [Hallo Nǐ Hǎo](./hallo-nihao) | German and Chinese practice that follows the school textbooks lesson by lesson, with a timed quiz battle and every word read aloud. No model | [Live](https://hallo-nihao.vercel.app) |
| [Dígame](./digame) | Writes a phone script for calling a Spanish office, in the order the call happens, with Spanish read aloud | [Live](https://digame-rho.vercel.app) |
| [As Printed](./as-printed) | Translates Spanish medical documents literally, expands abbreviations and lists questions for the doctor. It does not interpret | [Live](https://as-printed.vercel.app) |
| [Is This Normal?](./is-this-normal) | Describe something you've noticed about your child and see what official guidance says is typical for that age, and when to ask a professional | [Live](https://is-this-normal-check.vercel.app) |
| [Says Who?](./says-who) | Paste a parenting tip for ages 0 to 3 and see how well official health bodies back it | [Live](https://says-who-advice.vercel.app) |
| [Before the Basket](./before-the-basket) | Scores a grocery item on how it was produced and processed, from its ingredients or a label photo | [Live](https://before-the-basket.vercel.app) |
| [Lab Report Translator](./lab-report-translator) | Reads a soil or leaf analysis and returns per-nutrient status, timed actions and the limits of the test | [Live](https://lab-report-translator-read.vercel.app) |

---

## How the builds are made

The same patterns run through most of them.

- **Free model by default.** Recent builds run on Meta Muse Glimmer through NVIDIA's free endpoint, on my key. Visitors can switch to Anthropic, OpenAI or Gemini with their own key, which is used for one request and never stored.
- **Prompts stay on the server.** The system prompt and API key sit in a serverless function, not in the browser bundle. The newest builds keep that function host-neutral, so the same folder deploys to Vercel or Cloudflare Pages.
- **Tagged lines instead of JSON.** Models reply in lines like `STAGE|2|Hiring manager|...`. A broken line is skipped, so one bad line doesn't sink the result, and changing provider is cheap.
- **Three worked examples per build.** Saved results load instantly, so anyone can see the tool work without a key.
- **Rules where a model is the wrong tool.** Handback, Pulse Check, Expansion Radar and What Happens Next use fixed, printed rules because the answer has to be the same every time. Is This Normal? keeps its safety rules out of the model for the same reason, Judge Calibration Lab works out its agreement figures and verdict without one, and Worth Building? never lets the model produce a number and checks the written case against the calculated sheet. Who Does What? lets the model describe each step but sets every lane with printed rules, Who Says Yes? does the same for the people behind a decision, Wrong Turn lets the model describe each step of an agent run but picks the wrong turn with rules and checks every quote it cites against the trace, What It Counts finds known SQL traps with pattern checks before any model call and lets the model only explain and point at lines, Which Tier? sets the AI Act tier, duties and dates with printed rules while the model only checks your answers against your description, Ready to Go Live? sets every launch check, the verdict and the rollout plan with rules while the model only checks your answers against your rollout notes, Riskiest Bet First scores, ranks and plans tests for every bet with rules while the model only lists the assumptions it can quote from your notes, Front Door finds the leaks and ranks every sign-up fix with rules while the model only points at struggles it can quote from your notes, and Then What? does the same for the road from sign-up to the first win and the use after it. Hallo Nǐ Hǎo has no model at all: its words come from the class textbooks and are written into the app, so a child never sees a made-up translation. Mischmasch keeps that rule for its games, and lets a model suggest only optional extra word sets, which are checked line by line and reviewed by a grown-up before a child sees them. Send or Hold? lets a model read a guest message and draft the reply, but printed rules decide whether an AI co-host may send it alone, and a safety word list runs before any model call.
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

Builds with a `functions/` folder (Silent Failure Detector, Escalation Quality Scorer, Cost-of-Error Estimator, Prompt Injection Test Harness, A/B Eval Dashboard) also deploy to Cloudflare Pages for free: `npm run deploy:cloudflare` from the build folder, after setting `LLM_API_KEY` and `LLM_MODEL` with `npx wrangler pages secret put`.

## Contact

Find me on LinkedIn as Prerna Kakkar, or on GitHub at [kakkarprerna](https://github.com/kakkarprerna).
