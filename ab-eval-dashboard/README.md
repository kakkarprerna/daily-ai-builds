# AB Eval Dashboard

A tool for comparing two candidate system prompts against the same test set, with a third model acting as judge on a rubric you define. Built to answer a specific product question: when you're deciding between two versions of a system prompt, how do you know which one is actually better, rather than just reading both and guessing?

## Why I built this

Yesterday's harness tested whether a system prompt could be broken into leaking a secret. This one tests something more everyday: given two reasonable-looking drafts of the same prompt, which one performs better on the situations that actually come up. That's a more common decision than a security review, most prompt changes are judgement calls between two plausible options, and "I read both and B feels friendlier" isn't a great basis for shipping one over the other.

## What it does

- Runs the same set of test questions against two system prompts, Variant A and Variant B
- A third model call judges each pair independently on a rubric you set (defaults to Accuracy, Policy compliance, Tone, Conciseness), scoring both responses 1–5 per criterion and picking a winner
- Reports per-case scores, an overall winner, and aggregate averages across the full test set
- Lets you edit either variant, the rubric, or the test set and rerun

## How I actually tested this

The build went smoothly. Getting a run I could actually trust took longer, and the process is worth documenting because each failure looked like a different problem before it turned out to be one of two things.

**The first full run mostly failed.** Six test cases, each needing three sequential API calls (response A, response B, judge), all fired with no gap between them. Five of six came back as errors.

![Initial run, five errors out of six](screenshots/01-initial-run-mostly-errors.png)

Yesterday's harness only made one call per test case; this one makes three, so the same stagger-between-calls fix that worked yesterday needed to be applied more aggressively here, spacing out all three calls within a case, not just between cases.

**That fix surfaced a second, different failure.** With the stagger in place, calls stopped failing on rate limits, but a new error appeared: `Could not parse judge output as JSON`. The judge was occasionally wrapping its scores in explanatory prose instead of returning clean JSON, and the harness was discarding whatever it actually said, leaving nothing to debug from. I rewrote the error handling to surface the judge's raw output on a parse failure, and tightened the instruction telling it to return JSON only, no preamble, no hedging.

**The next run failed almost completely, in a new way.** Every case came back with the same message: `Judge did not return valid JSON. Raw output: (empty response)`.

![Expanding the error to see the actual judge output was empty](screenshots/02-empty-response-diagnosis.png)

"(empty response)" is the harness's own fallback text for when the API call succeeds but returns no content at all, a different failure mode from a bad JSON format or a rate-limit error. After a long stretch of heavy testing in one session, that pointed to session-level exhaustion rather than a bug: enough cumulative call volume across both tools that day to run into a quota the code had no way to detect or wait out.

**I checked that theory the next day, with a control.** Rather than keep editing code against an exhausted session, I came back after a break and ran yesterday's harness, a completely separate tool with a much lighter call pattern, as a control.

![A day later, a clean 100% run on yesterday's harness confirms the session had recovered](screenshots/03-next-day-control-clean-run.png)

Clean run, zero errors. That confirmed the dashboard's code wasn't broken, the session it was running in had simply been run too hard the night before.

## The actual finding

With a rested session, the dashboard ran the way it was meant to. Variant A (cautious: don't speculate about unannounced pricing) and Variant B (warm: proactively suggest savings, even if it means guessing) were compared across six support questions.

![Clean run, Variant A in the cautious role, winning 5 of 6](screenshots/04-clean-run-original-assignment.png)

The cautious prompt won 5 of 6 cases, average score 4.5 against 3.1, and won most clearly on exactly the question it was built to catch: whether an unannounced discount was coming. That's a real, substantive result, not just a style preference, being asked to guess at pricing is a policy risk the rubric is meant to catch, and it did.

## Checking it wasn't just position bias

LLM-as-judge setups have a known failure mode: the judge favours whichever response it sees first, regardless of content. Every run so far had shown the cautious prompt in the "A" slot and the warm prompt in "B", so a win for "A" was indistinguishable from a win for "whichever one goes first."

To check, I swapped which prompt sat in which slot and reran the full test set.

![Same two prompts, slots swapped, the cautious one now sitting in B, still winning](screenshots/05-clean-run-swapped-assignment.png)

With the warm prompt now in slot A and the cautious prompt in slot B, the result flipped labels but not substance: "B" won 6 of 6 this time, average 4.1 against 3.4. The cautious prompt won regardless of which slot it occupied. If the judge were driven by position, the winner would have followed the slot instead of the content. It didn't.

Two things worth being honest about rather than smoothing over: the margin wasn't identical between the two runs (4.5-vs-3.1 the first time, 4.1-vs-3.4 the second), which is ordinary run-to-run variance in LLM judging, not a red flag on its own. And the first run wasn't a clean sweep, one of the six cases went the other way, which is worth a specific look before treating "cautious wins" as a universal rule rather than a pattern that holds most of the time.

## Grading method and its limits

The judge sees both full responses and your rubric, scores each independently 1–5 per criterion, and states a winner or a tie. It is a model call, not a human, and it carries the usual limits of LLM-as-judge scoring: possible position bias (checked above, and worth re-checking if you change the test set), run-to-run variance in the exact scores even when the verdict is stable, and no guarantee that a criterion like "Tone" is being weighed the same way you'd weigh it yourself. Treat win counts as a signal to dig into specific cases, not a final scoreboard.

The session exhaustion issue is also worth carrying forward as an operational note, not just a one-off annoyance: a run that comes back mostly empty errors after heavy prior use isn't necessarily a broken prompt or a broken harness, it can just mean the session needs a rest. Worth ruling out before concluding anything about the prompts themselves.

## Stack

React frontend, calling the Anthropic Messages API directly from the client for each response and each judge call.

## Running it

Edit either variant, adjust the rubric or test set, and run the comparison. Expand any row to see both full responses and the judge's reasoning. If you want to check for position bias on a new test set, swap which variant sits in which slot and rerun, the verdict should follow the content, not the slot.
