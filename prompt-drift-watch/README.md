# Prompt Drift Watch

**You edited a system prompt to fix one thing. What else did you change without meaning to?**

Prompt Drift Watch runs the same user messages through two versions of a system prompt, puts the replies side by side, and labels every difference as something you asked for or a side effect you didn't. It ends with a verdict: **Ship**, **Retest** or **Hold**.

Part of my [daily AI builds](https://github.com/kakkarprerna/daily-ai-builds) series.

---

## The problem

Prompt edits are among the most frequent changes an AI product team ships, and often the least tested. Someone shortens the prompt because replies are too long on mobile. The replies do get shorter. They also stop mentioning the cancellation fee, stop offering a refund ticket, and stop apologising to a customer on their third outage that month.

Nobody wrote "remove the cancellation terms". It happened because a sentence was trimmed, or a new instruction like *get to the point* gave the model permission to cut steps along with words. Reading the two prompts side by side rarely reveals this. You only see it in the replies.

## What it does

| Section | What you get |
|---|---|
| **Compare prompts** | Paste the current and proposed prompts, say what you meant to change, add up to six real user messages (or ask it to suggest some) |
| **What changed** | A sentence-level diff of the two prompts, worked out in the browser with no AI, highlighting what was added and what was dropped |
| **Side by side** | Each test message answered twice, once under each prompt |
| **Drift report** | A verdict with confidence, whether your intended change landed, a label for every test (Intended, Side effect, No change, Unclear), the exact wording behind each side effect, retests to run, and what would flip the verdict |

The stated intent matters most. *"I only wanted shorter replies"* is the yardstick every difference gets measured against, which is how the tool separates a change you wanted from one you didn't.

## Try it without a key

Three worked examples load instantly with saved replies and full reports:

1. **Support bot asked to be shorter** (Hold). A broadband assistant trimmed for length loses its cancellation terms, refund route and empathy on outages.
2. **Booking assistant gets Spanish** (Retest). A physio clinic adds Spanish support, and English patients start getting Spanish greetings and dates.
3. **HR helper told to cite policy** (Ship). Citations land and guessing stops, with one small new refusal on a question the handbook does answer.

All companies and replies in the examples are invented.

## How the verdict works

- **Ship** when the intended change landed and any side effect is cosmetic
- **Retest** when a side effect is real but easy to fix, or the tests are too thin to be sure
- **Hold** when a side effect touches safety, accuracy, contractual information, or stops a user getting what they came for

Confidence drops when the tests are few or narrow. The Method section in the app prints these rules and the tool's limits in full.

## Honest limits

- Four to six messages are a spot check, not a full evaluation suite
- One run per version, at low temperature. Rerun anything borderline
- The judge is a model, so it can miss a subtle change or overstate a harmless one
- Only the system prompt and a single message are tested. Tool calls, retrieval and multi-turn history are out of scope

## Models and keys

By default everything runs on **Meta Muse Glimmer** through NVIDIA's free endpoint, on the site's own key, so visitors need nothing. Visitors can switch to **Anthropic**, **OpenAI** or **Gemini** with their own key. A visitor's key lives only in that browser tab's memory and travels with each request through the server function. It is never stored or logged.

The model replies in tagged lines (`VERDICT:`, `CHANGE:`, `CAUSE:` and so on) rather than JSON. That format survives smaller models far better, and it is what made swapping providers cheap.

## Privacy

No sign-in, no database, no analytics on pasted text. Prompts and messages go through a Vercel serverless function to the chosen model provider and nowhere else. The judging instructions live server-side and never ship in the browser bundle.

## Tech

- React 18 + Vite, `lucide-react` icons, Plus Jakarta Sans
- Vercel serverless functions: `api/run.js` (one message under one prompt), `api/judge.js` (the drift report), `api/suggest.js` (test message ideas)
- One shared provider layer in `api/_lib/providers.js` for all four providers
- Sentence-level LCS diff in `src/diff.js`, tolerant tagged-line parser in `src/parse.js`

## Run it locally

```bash
npm install
cp .env.example .env.local   # add your NVIDIA key and the Muse Glimmer model id
npx vercel dev               # serves the app and the /api functions together
```

`npm run dev` serves the interface only. The worked examples work there, live runs need `vercel dev`.

### Environment variables

| Variable | Purpose |
|---|---|
| `LLM_BASE_URL` | OpenAI-shaped endpoint for the default model. Defaults to `https://integrate.api.nvidia.com/v1` |
| `LLM_MODEL` | Model id for Muse Glimmer on that endpoint |
| `LLM_API_KEY` | Your key for that endpoint |

## Why I built it

At Jinn Live I learnt that a failure which looks like a one-off is often a pattern with a cause nobody noticed. Prompt edits work the same way. The edit is small, the intent is clear, and the side effect only shows up in front of a customer. As a PM I want a cheap way to see that before shipping, without waiting for an eval pipeline or pulling in an engineer.

---

Built by [Prerna Kakkar](https://github.com/kakkarprerna), Senior Product Manager working on AI products.
