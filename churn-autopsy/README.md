# Churn Autopsy

**Every lost account leaves a trail. Churn Autopsy finds where it started.**

When a customer leaves, the post-mortem usually stops at the reason they gave: budget, price, "moving to another tool". That reason is often the last thing that happened, not the first. Churn Autopsy takes the timeline of a lost or shrunk account and works out:

- 🚩 **The first real warning sign.** The earliest event that actually predicted the loss, which is rarely the loudest one.
- ⛔ **The point of no return.** The moment after which a save was very unlikely.
- ⏳ **The save window.** How much time the team really had to act.
- ⚖️ **What they said vs what happened.** The stated exit reason next to the likely real one.
- 👁️ **Missed signals.** What was visible at the time, and which part of a health score should have caught it.
- 🛠️ **What would have changed the outcome.** Specific plays, tied to specific moments.
- ✅ **Rules for the rest of your book.** Early-warning checks you can run on every other account this week.

It is the third build in my customer success diagnostics series:

| Build | Question it answers |
|---|---|
| Pulse Check | How healthy is this account right now? |
| Expansion Radar | Is this account ready to grow? |
| **Churn Autopsy** | **We lost this one. When did it really go wrong?** |

The signal categories line up with Pulse Check's five health categories (Product adoption, Business outcomes, Engagement, Sentiment, Support), plus Commercial and External. So a missed signal points straight at the part of your health score that should have flagged it.

## Why I built it

I ran customer success alongside product at Ylytic and Jinn Live. The churn reviews I sat in almost always argued about the last month. The useful question was what we could have seen nine months earlier, and what rule would catch it next time on a different account. This tool is that review, structured and blameless.

## Try it without a key

Open **Examples** in the sidebar. Three fictional accounts come with saved autopsies:

| Account | Segment | Outcome | What it shows |
|---|---|---|---|
| Lindqvist Freight | Mid-market | Didn't renew | Said "budget". Really low seat adoption from month one. |
| Pellago Health | Enterprise | Downgraded 60% | Healthy usage, no measured value. A cost review did the rest. |
| Brightwell Studios | SMB | Cancelled mid-term | Stated and real reasons match. A repeat bug handled as a one-off. |

Each one can also be loaded into the form, changed, and re-run.

## How to use it

1. **The account.** Segment, contract size, tenure, how it ended. Every chip row lets you add your own option.
2. **The exit.** The reason the customer gave, and what your team did.
3. **The timeline.** Events, oldest first, each with months before exit and a signal type. Five to ten events across the last year works best.
4. **The model.** Muse Glimmer runs free by default. Anthropic, OpenAI or Gemini are available with your own key.

## Where the answer comes from

A language model reads only the events you enter. The prompt tells it to refer to events by number, never invent new ones, lower its confidence when the timeline is thin, and say what evidence would change its verdict. It is not compared against industry churn benchmarks. Treat the output as a structured second opinion for your team to discuss.

**Privacy:** nothing is stored. The timeline goes to the chosen model provider for that one request. Visitor API keys are passed through for that request only and never saved or logged.

## How it's built

- **Frontend:** React + Vite, plain CSS, `lucide-react` icons. Fixed left sidebar with the main column as its own scroll area. Olive palette.
- **Backend:** one Vercel serverless function, `api/autopsy.js`. The system prompt lives in `api/_prompt.js`, server-side, so it never ships in the client bundle.
- **Models:** Muse Glimmer on NVIDIA's OpenAI-compatible endpoint by default, on the owner's key. Anthropic, OpenAI and Gemini are bring-your-own-key only, with no server fallback.
- **Output format:** tagged lines (`VERDICT:`, `FIRST_SIGNAL:`, `MISSED:` and so on) instead of JSON. Small models follow it more reliably, and switching providers needs no parser changes. The parser lives in `src/parse.js`.

```
churn-autopsy/
├── api/
│   ├── autopsy.js      # provider routing, validation, timeouts
│   └── _prompt.js      # system prompt and message builder
├── src/
│   ├── App.jsx         # sidebar, form, results, how it works, examples
│   ├── examples.js     # three worked examples with saved results
│   ├── parse.js        # tagged-line parser
│   └── styles.css
└── index.html
```

## Run it locally

```bash
npm install
cp .env.example .env.local   # add your NVIDIA key and model id
npx vercel dev               # runs the site and /api together
```

`npm run dev` also works for the interface and the saved examples, but live runs need `vercel dev` so the function is available.

## Deploy

Import the repo in Vercel and set these environment variables:

| Variable | Required | Purpose |
|---|---|---|
| `LLM_API_KEY` | Yes | Your NVIDIA key for the free default model |
| `LLM_MODEL` | Yes | Muse Glimmer model id on NVIDIA |
| `LLM_BASE_URL` | No | Defaults to `https://integrate.api.nvidia.com/v1` |
| `ANTHROPIC_MODEL` / `OPENAI_MODEL` / `GEMINI_MODEL` | No | Override the default model for each bring-your-own-key provider |

## Limits

- The quality of the autopsy depends on the timeline. Thin input gives thin, low-confidence output.
- It diagnoses one account at a time. Patterns across many losses still need a human looking across several autopsies.
- It is a decision aid for CS teams, not a scoring model trained on churn data.

---

Part of my [daily AI builds](https://github.com/kakkarprerna/daily-ai-builds) series.
