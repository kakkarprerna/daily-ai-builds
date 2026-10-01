# Says Who?

**Check baby and toddler advice against what the health bodies actually say.**

Every new parent gets advice from everywhere at once: grandparents, friends, forums, Instagram, AI chatbots. Much of it contradicts itself, some of it was right thirty years ago, and a small part of it is unsafe. Says Who? takes one tip, compares it with published guidance from **WHO, NHS, AAP and Spain's AEP**, and shows where those bodies agree, where they differ, and what to ask your paediatrician.

**Live app: [says-who-advice.vercel.app](https://says-who-advice.vercel.app)**

Built for parents of children aged 0 to 3. Part of my [daily AI builds](https://github.com/kakkarprerna/daily-ai-builds) series.

---

## What you get back

| | |
|---|---|
| 🎯 **Verdict** | Well supported, Mostly supported, Mixed, Outdated, Not supported or Unsafe, with a confidence level |
| ✅ **What holds up** | The part of the tip that matches guidance (most advice is partly right) |
| ❌ **What doesn't** | The part that doesn't, and why |
| 🏛️ **Where each body stands** | WHO, NHS, AAP and AEP side by side: Agrees, Partly, Disagrees or No clear position |
| 💬 **How current guidance would put it** | The tip rewritten the way the guidance phrases it today |
| 🩺 **Ask your paediatrician if** | The situations where this needs a professional conversation |
| 🛡️ **Safety rules this touches** | Fixed checks that run in the browser with no AI at all |

If what you type describes a child who seems unwell right now (breathing trouble, blue lips, a swallowed battery, a fever under 3 months), an emergency banner appears straight away, before any check runs.

## Why country matters

The most useful thing Says Who? often shows is that the bodies don't agree. Screen time is a good example: WHO and AAP allow some flexibility before age 2, while Spain's AEP updated its guidance in 2024 to recommend no screens at all before 6. A parent in Málaga and a parent in Manchester can both be following official advice and still be doing different things. You choose where you live, and the check leads with that country's body.

## Try it without a key

Open the [live app](https://says-who-advice.vercel.app) and go to **Examples** in the sidebar. Three checks are saved, so they work with no model and no key:

1. **Cereal in the bottle**: a grandparent tip for a 4-month-old. *Not supported.*
2. **Start solids at 4 months**: a forum claim about allergies. *Mixed*, because allergen guidance really did change.
3. **No screens before 2**: an Instagram rule that bans video calls too. *Mostly supported*, with the bodies split by country.

## How it works

```
Your tip ──► 14 fixed safety rules (browser, no AI)
         └─► serverless function ──► model compares with WHO / NHS / AAP / AEP
                                      └─► tagged lines ──► parsed into the result view
```

- **Fixed safety rules.** Fourteen rules covering honey, sleep position, soft bedding, inclined sleep, cereal in bottles, aspirin, cough and cold medicines, choking foods, cow's milk, salt, teething gels, teething necklaces, coats in car seats and baby walkers. Each one matches words in your text and only applies below a set age. Every rule is printed in **How it works** with the bodies behind it.
- **Model comparison.** The prompt lives in the serverless function, never in the client bundle. The model replies in tagged lines (`VERDICT:`, `POSITION:`, `SAFER:` and so on) rather than JSON, which is what makes swapping providers cheap.
- **Where the answers come from.** The model answers from what it learned about each body's published guidance. It doesn't fetch their pages live, so it can be out of date. The app says so on every result, and links to each body's site.

## What it won't do

- Diagnose a symptom
- Give medicine doses
- Replace a paediatrician, nurse or health visitor
- Store anything you type (no sign-in, no database)

## Models

| Provider | How |
|---|---|
| **Muse Glimmer 30B** (default) | Free, runs on NVIDIA's endpoint with my server-side key. Visitors need nothing. |
| Anthropic, OpenAI, Gemini | Visitors paste their own key under **Model & key**. It stays in the tab, passes through the function for one request, and is never saved or logged. |

## Run it yourself

```bash
npm install
cp .env.example .env.local   # add your NVIDIA key and Muse Glimmer model id
npx vercel dev               # runs the app and the /api/check function together
```

`npm run dev` runs the front end only; the saved examples work there, live checks need `vercel dev`.

### Environment variables

| Variable | Purpose |
|---|---|
| `LLM_BASE_URL` | OpenAI-shaped endpoint, defaults to `https://integrate.api.nvidia.com/v1` |
| `LLM_MODEL` | Model id for the free default |
| `LLM_API_KEY` | Key for the free default |
| `ANTHROPIC_MODEL`, `OPENAI_MODEL`, `GEMINI_MODEL` | Optional overrides for bring-your-own-key providers |

## Stack

React 18, Vite, lucide-react icons, one Vercel serverless function. Plus Jakarta Sans. Rose palette.

## Project structure

```
api/
  check.js        request handling and validation
  _prompt.js      system prompt (server-side only)
  _providers.js   Muse Glimmer, Anthropic, OpenAI, Gemini
src/
  App.jsx         sidebar, check form, result, examples, method, model views
  rules.js        the 14 fixed safety rules and the urgent-signs check
  parse.js        tagged-line parser
  examples.js     three worked examples with saved results
```

## A note on scope

Says Who? is a starting point for a conversation with a health professional. It compares advice with published guidance; it doesn't know your child. If something feels wrong with your child, trust that and call your doctor or emergency number.

---

Built by [Prerna Kakkar](https://github.com/kakkarprerna), Senior Product Manager.
