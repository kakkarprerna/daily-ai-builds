# Pulse Check

A customer success health scorecard that shows its working.

## The problem

Most CS platforms hand a rep a single health score and expect them to trust
it. When a VP asks why an account dropped from 80 to 68, "the tool says so"
is not an answer, and a rep who can't explain a score can't defend a renewal
risk assessment in the room. Health scoring has become a black box exactly
where CS teams need the opposite: something they can stand behind on a call.

## What Pulse Check does

Enter an account's signals across five areas (adoption, business outcomes,
engagement, sentiment, support) and it returns:

- An overall health score out of 100, banded red, yellow or green, with the
  trend against last quarter
- A breakdown of all five category scores
- The three biggest risks on the account, ranked by severity
- One recommended next action, chosen from a fixed decision table

Every number traces back to a printed formula. There is no model call
anywhere in the scoring path, so the same inputs always produce the same
score, and the **How it works** page inside the app spells out every weight
and threshold used.

## Why deterministic, not AI

An AI-generated health score would need to be trusted blind, and a
confidence-weighted guess is a poor foundation for a renewal conversation.
Pulse Check treats the score itself as a calculation problem, not a
reasoning one: fixed weights, fixed thresholds, fixed decision rules. That
also means the tool works instantly with no API key, no cost per use and no
risk of drift between two runs of the same account.

## The method, briefly

| Category | Weight | What feeds it |
|---|---|---|
| Product adoption | 25% | Active users, core feature usage, usage trend |
| Business outcomes | 25% | Success milestones hit, ROI demonstrated |
| Engagement | 20% | Champion strength, exec sponsor, meeting attendance |
| Sentiment | 15% | CSAT, NPS |
| Support | 15% | Open critical and non-critical issues |

Full formulas, including why executive sponsorship is weighted above the
champion relationship, are documented in-app.

## Try it

Three worked examples ship with the app (a watch account, a healthy one and
one at risk), each scored live by the same engine a real account would use.

## Stack

React + Vite, no backend, no dependencies beyond the framework. Deploys as a
static site.

```bash
npm install
npm run dev      # local preview
npm run build    # static output in dist/
```

## Part of the series

First build in a customer success diagnostics sub-series within my
[daily AI builds](https://github.com/kakkarprerna/daily-ai-builds), drawing
on my time as a founding PM at Ylytic and a Senior PM at Jinn Live, both of
which carried CSM responsibilities alongside the product role.
