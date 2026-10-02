# Loop Ready

**Paste a job description and the hiring stages. Get a stage-by-stage prep plan, a day-by-day schedule, and resources you can trust.**

**Try it live: [loop-ready.vercel.app](https://loop-ready.vercel.app)**. No sign-in. The free model runs by default, and three worked examples open without any key.

Part of my [daily AI builds](https://github.com/kakkarprerna/daily-ai-builds) series.

---

## The problem

A recruiter tells you the loop: screen, hiring manager, a product sense round, a take-home, a panel. Then you are on your own. Most candidates prepare the same way for every company, reading whatever turns up in a search, and walk into a SQL round having spent the week on product sense.

Asking a chatbot helps a little, but it has a habit of recommending articles that do not exist or links that go nowhere. When you have five days, a dead link is wasted time.

## What Loop Ready does

You give it four things:

| Input | Why it matters |
| --- | --- |
| The job description | The only source for what the role weighs |
| The hiring stages, in order | So each round gets its own prep |
| Days until the first interview | So the schedule fits the time you have |
| Your background (optional) | Turns on a gap check against the JD |

You get back:

- **What this JD weighs most**, with each theme tied to a short phrase quoted from the JD, so you can see where it came from
- **A card per stage**: what that round will test for this role, what to do, what to read, likely questions, and the mistake to avoid
- **A day-by-day plan** sized to your timeline, with the hardest and soonest rounds first
- **Gaps against your background**, and how to frame or close each one
- **Questions to ask** the recruiter or interviewer
- **Copy as text**, to paste the whole plan into your notes

## The design decision that matters: the model cannot invent a link

Every resource comes from a closed library of 27 links that I opened and checked by hand in October 2026. Courses, guides, tools and articles, tagged by the stage they help with: SQL tutorials, evals writing for AI PM rounds, the STAR worksheet, offer negotiation and more.

The model never writes a URL. It picks resources **by id** from that library and explains why each one fits this particular JD. The app then checks every id. Anything that is not in the library is dropped and counted, and the count is shown on the plan ("0 unverified links removed"). So the model does the part it is good at, reasoning about the role, and the part it is bad at, remembering URLs, is taken away from it.

```
JD + stages + days ──▶ model reads them against the library list
                         │
                         ▼
                tagged lines (SIGNAL | STAGE | PREP | RES | ...)
                         │
                         ▼
          parser checks every RES id against the library
             known id ──▶ shown with the real link
           unknown id ──▶ dropped and counted
```

## Worked examples (no key needed)

Three saved plans load instantly from the Worked examples page. The companies and JDs are fictional.

1. **Tessellate, Senior PM AI Assistant, 7 days.** An LLM assistant role heavy on evals and trust. Shows the AI / ML product round.
2. **Harbourline Payments, Senior PM Growth & Activation, 14 days.** A fintech growth role with a live SQL round, a take-home and a panel.
3. **Orbitly, Senior PM Integrations & Public API, 3 days.** A platform role with a technical round, run with a candidate background so the gap check shows.

## Models

| Option | Who pays | Notes |
| --- | --- | --- |
| **Meta Muse Glimmer** (default) | The site, through NVIDIA's free endpoint | Server-side key, nothing for the visitor to set up |
| Anthropic | Visitor's own key | Default model `claude-sonnet-5`, editable |
| OpenAI | Visitor's own key | Default model `gpt-5-mini`, editable |
| Gemini | Visitor's own key | Default model `gemini-2.5-flash`, editable |

Visitor keys are sent with that single request and are never stored or logged. The system prompt lives in a serverless function, not in the browser bundle.

The model replies in tagged lines (`STAGE|2|Hiring manager|...`) rather than JSON. Smaller open models break JSON often; a malformed tagged line is simply skipped, so one bad line never sinks the whole plan. It also makes switching providers cheap.

## Run it yourself

```bash
cd loop-ready
npm install
cp .env.example .env.local   # add your NVIDIA key and model id
npx vercel dev               # runs the React app and the /api function together
```

`npm run dev` runs the front end only. The worked examples and resource library work there; live plans need the API function, so use `vercel dev` or deploy.

### Deploy to Vercel

1. Import the repo in Vercel and set the **Root Directory** to `loop-ready`.
2. Framework preset: Vite. Build command `npm run build`, output `dist`.
3. Add environment variables:

| Variable | Value |
| --- | --- |
| `LLM_BASE_URL` | `https://integrate.api.nvidia.com/v1` |
| `LLM_MODEL` | Your Muse Glimmer model id on NVIDIA |
| `LLM_API_KEY` | Your NVIDIA API key |

If these are missing, the free option returns a clear message and visitors can still bring their own key.

## Project structure

```
loop-ready/
├── api/
│   ├── plan.js          # serverless endpoint, provider switch, input limits
│   └── _prompt.js       # system prompt and library list (not a public route)
├── src/
│   ├── data/
│   │   ├── resources.js # the 27 checked resources and the stage types
│   │   └── examples.js  # three worked examples with saved output
│   ├── lib/parse.js     # tagged-line parser, id check, copy-as-text
│   ├── App.jsx          # sidebar, form, plan view, library, examples, method
│   └── styles.css
└── index.html
```

## Updating the library

Add an entry to `src/data/resources.js` with an `id`, `url`, `type`, `cost` and the stage `tags` it helps with. The prompt and the parser both read from that one file, so a new resource is available to the model on the next request. Re-check the links every few months and update `VERIFIED_ON`.

## Limits

- It does not know how a specific company runs its interviews. Confirm the format with the recruiter; the plan suggests what to ask.
- Practice questions are likely questions, written from the JD. They are not leaked ones.
- Links were live when checked. Sites move, so one can break later.
- The plan is only as good as the JD. A vague JD gives a more generic plan.

## Stack

React 18, Vite, lucide-react icons, one Vercel serverless function. No database, no sign-in, no tracking.

## How this was built

I'm a product manager. I wrote the brief, chose the closed-library design, checked every resource link by hand and reviewed each version of the app. The code was written by AI coding tools working from my prompts and review.
