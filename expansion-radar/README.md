# Expansion Radar

**Most CS tools tell you an account is healthy. They don't tell you what to do about it.**

Expansion Radar is a decision-support tool for customer success and account teams. Feed it what you're already seeing on an account, usage depth, who's using it, whether the champion is advocating, what they're asking for, when the renewal lands, and it returns a readiness score plus one specific play to run, not a generic "this account looks good."

Live: **[expansion-radar-eight.vercel.app](https://expansion-radar-eight.vercel.app)**

## The problem

Most CS dashboards stop at a health score. A green account still needs a human to work out *what to actually do with it*, and that judgment call usually lives in the CSM's head, made differently by every rep on the team. Expansion Radar makes that judgment explicit: a fixed, printed formula turns a set of signals into a ranked shortlist and a concrete next move, so the reasoning is visible and repeatable instead of tribal knowledge.

## What it scores

| Signal | Weight | What it's reading |
|---|---|---|
| Usage depth & growth | 25% | Seats used, feature breadth, quarter-over-quarter trend |
| Organisational spread | 20% | Teams beyond the original buyer, exec sponsor engagement |
| Champion advocacy | 20% | Referrals, references, QBR sentiment, NPS/CSAT |
| Buying signals | 20% | What they're asking for, and whether they've expanded before |
| Timing fit | 15% | Distance to the renewal or budget cycle |

The score then runs through a decision table to land on one of five plays: **seat expansion**, **cross-sell adjacent module**, **tier upgrade conversation**, **reference-to-expansion bridge**, or **nurture**, each with a suggested opener and what to bring into the conversation.

Every preset field also takes a custom, typed-in option when none of the built-in choices fit the account in front of you.

## How it works

- Fixed weights and formula, no AI model call, no API key needed
- Fully client-side. Nothing you enter is sent or stored anywhere
- The full scoring method and decision table are printed in-app under **How it works**, not hidden behind a black box
- Three worked examples included, so the scoring logic is visible without entering data yourself

## Part of a series

Companion to **Pulse Check**, which scores account *risk*. Expansion Radar is the other half: it scores account *growth*. Both come out of hands-on CSM work at Ylytic and Jinn Live, where the gap between "the account is fine" and "here's what to do next" showed up constantly.

Part of an ongoing [daily AI build series](https://github.com/kakkarprerna/daily-ai-builds) exploring how PMs can use AI tools to prototype and validate product ideas quickly.

## Built with

Vanilla HTML, CSS and JavaScript. No framework, no build step, no dependencies. Deployed on Vercel as a static site.

## Run locally

```bash
npx serve .
```

Or just open `index.html` in a browser.

---

Built by [Prerna Kakkar](https://github.com/kakkarprerna), Senior PM.
