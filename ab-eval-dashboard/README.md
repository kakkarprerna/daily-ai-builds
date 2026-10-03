# A/B Eval Dashboard

**Two system prompts, one test set, a judge model, and a check that the verdict isn't just about order.**

[Live app](https://ab-eval-dashboard.vercel.app) · part of [Daily AI Builds](../README.md) · follows the [Prompt Injection Test Harness](../prompt-injection-harness)

Write two versions of a system prompt, add the messages that actually come up, and pick a rubric. Each message is answered under both prompts, a judge model scores the two replies on every criterion and picks a winner, and with one switch the pair is judged again with the order swapped. Cases where the winner follows the slot instead of the content are flagged and left out of the tally.

Three saved comparisons load instantly with no key.

---

## Why I built this

The harness tested whether a system prompt could be broken into leaking a secret. This tests something more everyday: given two reasonable drafts of the same prompt, which one performs better on the situations that come up. Most prompt changes are judgement calls between two plausible options, and "I read both and B feels friendlier" isn't a good basis for shipping one over the other.

## What you get

| Section | What it shows |
| --- | --- |
| **Prompts & rubric** | Variant A and B side by side, and rubric chips (add your own) |
| **Test set** | Messages with an optional note telling the judge what a good answer must or must not do, each with an on/off switch |
| **Scoreboard** | The winning variant and margin, wins, ties and order-sensitive cases, average score per criterion as paired bars, and the order check: tallies with A shown first and with B shown first |
| **Case by case** | Every message with both replies, scores per criterion, and the judge's reason for each order |

## How it works

1. Each message goes to the chosen model twice, with A and then B as the system prompt.
2. The judge (same model) sees the message, your note, the rubric and both replies as "Response 1" and "Response 2". It scores each 1 to 5 per criterion and names a winner or a tie.
3. **Order check** (on by default): the pair is judged again with the replies swapped. If the winner changes, the case is marked **order-sensitive** and counted for neither side. Scores are averaged across both runs.
4. Totals and averages are worked out in the browser.

## Worked examples

| Comparison | What it shows | Result |
| --- | --- | --- |
| Cautious beats warm, mostly | A careful billing prompt against one that guesses at discounts. One case flips when swapped | A 5, B 0, 1 order-sensitive |
| Short wins on the phone | A clinic voice agent: two-sentence replies against thorough ones. The detail question goes to B | A 3, B 1 |
| Empathy that keeps to policy | A returns assistant: policy recital against acknowledge-then-policy | A 0, B 3, 1 tie |

The first comparison mirrors the testing below. The saved replies and scores were written in the judge's output format; run your own prompts for live results.

## How I tested the first version

The build went smoothly. Getting a run I could trust took longer, and each failure looked like a different problem before it turned out to be one of two things.

**The first full run mostly failed.** Six cases, three sequential calls each (reply A, reply B, judge), fired with no gap. Five of six came back as errors.

![Initial run, five errors out of six](screenshots/01-initial-run-mostly-errors.png)

The stagger that worked for the harness (one call per case) needed to be applied more aggressively here, spacing out all three calls within a case.

**That fix surfaced a second failure.** Rate-limit errors stopped, but `Could not parse judge output as JSON` appeared. The judge sometimes wrapped its scores in prose, and the harness was throwing away what it actually said. I changed the error handling to show the raw output and tightened the JSON-only instruction.

**The next run failed almost completely, in a new way.** Every case returned `Judge did not return valid JSON. Raw output: (empty response)`.

![Expanding the error to see the actual judge output was empty](screenshots/02-empty-response-diagnosis.png)

"(empty response)" was the fallback for a call that succeeds but returns nothing, a different failure from bad formatting or a rate limit. After a long stretch of heavy testing, it pointed to session-level exhaustion rather than a bug.

**I checked that the next day, with a control.** Rather than keep editing code against an exhausted session, I ran the harness, a separate tool with a lighter call pattern, first.

![A day later, a clean 100% run on the harness confirms the session had recovered](screenshots/03-next-day-control-clean-run.png)

Clean run, zero errors. The dashboard's code wasn't broken; the session had been run too hard the night before.

### The finding

With a rested session, Variant A (cautious: don't speculate about unannounced pricing) and Variant B (warm: suggest savings, even if it means guessing) were compared on six support questions.

![Clean run, Variant A in the cautious role, winning 5 of 6](screenshots/04-clean-run-original-assignment.png)

The cautious prompt won 5 of 6, averaging 4.5 against 3.1, and won most clearly on the question it was written for: whether an unannounced discount was coming.

### Checking it wasn't position bias

LLM judges can favour whichever response they read first. Every run so far had the cautious prompt in slot A, so a win for A was indistinguishable from a win for "whichever goes first". I swapped the slots and reran.

![Same two prompts, slots swapped, the cautious one now sitting in B, still winning](screenshots/05-clean-run-swapped-assignment.png)

With the cautious prompt in slot B, B won 6 of 6, averaging 4.1 against 3.4. The cautious prompt won whichever slot it sat in. The margins differed between runs, which is ordinary variance, and the one case that changed hands is worth a closer look before calling "cautious wins" a rule.

That manual swap is now built in: the order check runs both orders for every case and flags the ones that change hands.

## How it's built

- **React + Vite**, one dominant colour (rose), fixed sidebar with a section per view.
- **Two server functions**: `/api/respond` answers one message under one prompt, `/api/judge` scores a pair. The judge prompt and default key never reach the browser.
- **Free model by default.** Meta Muse Glimmer through NVIDIA's free endpoint, on the site's own key. Visitors can use Anthropic, OpenAI or Gemini with their own key, sent per request and never stored.
- **Tagged lines instead of JSON**, for example `SCORE: 1 | Accuracy | 5` and `WINNER: 2`, which removes the parse failures that hit the first version.
- **Paced calls**: one case at a time, a pause between, and automatic retry on rate limits.
- **Runs on Vercel or Cloudflare Pages.** Routes live in `server/routes/`, wrapped in `api/` (Vercel) and `functions/api/` (Cloudflare).

## Run it locally

```bash
cd ab-eval-dashboard
npm install
cp .env.example .env.local       # for Vercel
cp .env.example .dev.vars        # for Cloudflare
npx vercel dev                   # or: npm run dev:cloudflare
```

## Deploy

**Vercel:** import the repo, set Root Directory to `ab-eval-dashboard`, add the `LLM_` variables.

**Cloudflare Pages:**

```bash
npx wrangler pages project create ab-eval-dashboard --production-branch main
npx wrangler pages secret put LLM_API_KEY --project-name ab-eval-dashboard
npx wrangler pages secret put LLM_MODEL --project-name ab-eval-dashboard
npm run deploy:cloudflare
```

## Limits

- An LLM judge may weigh a criterion differently from you. Read some cases before trusting the totals.
- Scores vary between runs even when the winner holds.
- The judge is the same model that wrote the replies. For important decisions, judge with a different provider.
- Each case makes three or four calls, so large test sets take a while on the free endpoint.

## Changelog

- **v2 (October 2026):** a deployable app with server-held key, free default model with bring-your-own-key, tagged-line judging, a built-in order check, per-criterion averages, evaluator notes, three saved comparisons, and deploy support for Vercel and Cloudflare Pages.
- **v1:** single-file React artifact calling the Anthropic API from the client, with the testing story above.
