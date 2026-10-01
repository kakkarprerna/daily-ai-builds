# AI or Me?

**Decide whether a product task should go to AI or stay with you, without losing the skills that matter.**

Part of my [daily AI builds](https://github.com/kakkarprerna/daily-ai-builds) series.

---

## Why I built this

AI has made a lot of PM work faster. It has also made it easy to stop practising the skills that make a PM worth listening to: synthesis, trade-off reasoning, product judgement. If AI writes every first draft, you never find out whether you could have.

A 2025 study by Microsoft Research and Carnegie Mellon surveyed 319 knowledge workers and found that people with more confidence in AI reported less critical thinking, while people confident in their own skills reported more ([Lee et al., CHI 2025](https://www.microsoft.com/en-us/research/publication/the-impact-of-generative-ai-on-critical-thinking-self-reported-reductions-in-cognitive-effort-and-confidence-effects-from-a-survey-of-knowledge-workers/)).

So the question I wanted a tool for is a simple one. For this task, today, should AI do it, or should I?

## What it does

You answer ten multiple-choice questions about a task. You get:

| Output | What it tells you |
|---|---|
| **Verdict** | One of four: Do it yourself, You first then AI, AI drafts you decide, Hand it over |
| **Two scores** | Learning value (what you'd give up) and AI fit (how safely AI could do it), each out of 100 |
| **The grid** | Where your task lands, so you can see how close it is to another verdict |
| **Confidence** | High, Medium or Low, based on distance from the nearest boundary |
| **How to work on it** | Concrete steps for that verdict, such as writing your own version before asking AI to critique it |
| **What pushed it here** | The answers that moved each score most |
| **What would change it** | Single answer changes that would flip the verdict |
| **The skill at stake** | The skill this kind of task builds, plus a short practice |
| **Second read** (optional) | An AI model reads your own description of the task and looks for what the chips missed |

## The four verdicts

```
                AI fit →
          0        40           70        100
   100 ┌────────┬──────────────────────────┐
       │        │    You first, then AI    │
 L     │ Do it  │                          │
 e  55 │yourself├─────────────┬────────────┤
 a     │        │ AI drafts,  │  Hand it   │
 r     │        │ you decide  │   over     │
 n   0 └────────┴─────────────┴────────────┘
```

## How it decides

**The verdict is deterministic.** A fixed formula with printed weights, no AI model involved. That is deliberate: a tool about not over-relying on AI should not hand its main judgement to one.

**Learning value** comes from four answers: where you are with the skill (35%), whether you've done it without AI before (25%), whether your thinking is the deliverable (25%) and how often you do it (15%).

**AI fit** comes from seven: whether you could check the answer (25%), what happens if it's wrong (20%), the kind of task (20%), how much context only you hold (15%), whether your thinking is the deliverable (10%), data sensitivity (5%) and time pressure (5%).

**Guardrails override the maths:**
- Still learning a core skill you've never done unaided: learning value is held at 70 or above
- You couldn't check the answer: AI fit is capped at 60, so full hand-over is ruled out
- Confidential or personal data: AI fit is capped at 69
- Hard to undo and impossible to check: always do it yourself

Every weight, value and rule is printed in the app under **How it works**. The weights are my product judgement after ten years of PM work. They are not research findings.

Any answer you type yourself scores as neutral (0.5), since it has no built-in weight.

## Second read

The optional second read sends your task description, your answers and the verdict to a model, which returns five tagged lines: the case against the verdict, what the chips missed, the skill at stake, a prompt to paste that asks AI for critique rather than an answer, and a 30-minute practice.

- **Default:** Muse Glimmer 30B on NVIDIA's free endpoint, on my key, held in a serverless function
- **Bring your own key:** Anthropic, OpenAI or Gemini. The key goes with that one request and is never stored or logged
- The prompt lives server-side in `api/second-read.js`, never in the client bundle
- Model output uses tagged lines rather than JSON, which keeps the provider swap cheap
- It never changes the verdict

## Worked examples

Three examples load with saved second reads, so you can see the full result without a key.

| Example | Verdict |
|---|---|
| Pricing a new tier, first time | Do it yourself |
| Synthesising 12 discovery interviews | You first, then AI |
| Weekly release notes from Jira | Hand it over |

## Privacy

No sign-in, no database, no analytics. Answers stay in your browser tab. The only thing that leaves it is the second read request, and only when you press the button.

## Run it

```bash
npm install
cp .env.example .env.local   # add LLM_MODEL and LLM_API_KEY for the free model
npx vercel dev               # runs the app and the /api function together
```

`npm run dev` also works for the rubric and examples; the second read needs `vercel dev` or a deployment.

## Deploy

Vercel, with **Root Directory** set to `ai-or-me`. Environment variables:

| Variable | Purpose |
|---|---|
| `LLM_BASE_URL` | OpenAI-shaped endpoint, defaults to `https://integrate.api.nvidia.com/v1` |
| `LLM_MODEL` | Model id for the free default |
| `LLM_API_KEY` | Key for the free default |
| `ANTHROPIC_MODEL`, `OPENAI_MODEL`, `GEMINI_MODEL` | Optional overrides for bring-your-own-key providers |

## Stack

React 18, Vite, lucide-react icons, Plus Jakarta Sans. One Vercel serverless function.

## Limits

- Ten questions can't capture every task. That is why the second read exists, and why you can add your own answers
- The weights reflect one PM's view. If you disagree with one, that tells you something about what you value in your own growth
- The second read is an AI model and can be wrong
