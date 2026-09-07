# Handback

Paste a draft PRD or ticket. Handback returns the decisions it has not made yet, ranked by whether the gap blocks the build, sign-off, or launch.

Live: _add your Vercel URL here after the first deploy_

## The problem

When a spec reaches a development team, they read it looking for the decisions they need before they can start. Anything missing comes back as a question, and the work waits until it is answered. That round trip is the handback the tool is named after.

The questions are predictable. Where does the data live. What happens when it fails. Who is allowed to do it. How fast is fast enough. A PM who runs that list themselves before sending the spec removes a day or two of latency from every ticket, and removes the reputational cost of being the person whose specs always bounce.

## What it does

1. **Paste the draft.** A PRD, a ticket, or rough notes. The text stays in the browser.
2. **It runs 22 rules.** Each has a trigger deciding whether it applies to your text, and an answer test deciding whether you have already covered it.
3. **You get a checklist.** Open questions ranked by what the missing answer holds up, plus a wording scan and a coverage view, copyable straight into the ticket.

The rules cover six areas: data and state, behaviour and edge cases, access and permissions, dependencies, non-functional requirements, and definition of done.

## Product decisions

**No model behind it.** The obvious build here calls an LLM and asks it to review the spec. This one does not. Every rule is a trigger pattern and an answer pattern, both printed in full in the Method section of the app. The trade is real: a model would catch phrasing the rules miss, and would give better answers. What the rules buy instead is that a user can audit the reasoning, that the same spec always produces the same result, and that nothing needs a key, an account, or a network call. For a tool whose entire job is to make hidden assumptions visible, hiding its own reasoning inside a model was the wrong call.

**Ranked by what it blocks, not by importance.** Every gap is sorted into blocks the build, blocks sign-off, or blocks launch. A missing data model stops a developer starting. A missing analytics event does not. Sorting by topic importance would have produced a list that reads as nagging. Sorting by what waits on the answer produces a list you can work through in order tonight.

**It over-asks on purpose, and says so.** The rules match words, so they raise questions that do not apply. Rather than tuning for precision and quietly missing real gaps, the app states the failure mode on the front page and shows the trigger word that raised each question, so a wrong one is obvious and cheap to dismiss.

**Custom context is checked, not just recorded.** Tagging a spec with context that never appears in the text becomes its own question, because context held only in the PM's head is a common source of a rewritten ticket.

**Four worked examples, one of them finished.** Three are specs written the way they usually arrive. The fourth is the first one again after its questions are answered, dropping from ten open questions to one. The contrast is the demonstration.

## Limits

- It matches words and patterns. It does not understand the product.
- It cannot judge whether an answer is a good one, only whether the topic is addressed.
- It misses anything phrased in words the rules do not know.
- The rule list is opinionated. It comes from recurring clarification requests in spec review, not from a standard.

## Running it locally

```bash
npm install
npm run dev
```

Build for production with `npm run build`. There is no environment configuration and no API key.

## Stack

React 18, Vite, Tailwind, lucide-react. Deployed on Vercel as a static build.

## Licence

MIT
