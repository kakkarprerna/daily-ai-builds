# Before the Basket

**Two scores for anything you are about to buy: how it was produced, and how it was processed, measured against the best and worst practice where you live.**

A jar of honey, a pack of chicken and a loaf of bread can all look ordinary on the shelf. What differs is everything that happened before they got there: how the bees, birds or wheat were raised, what was added in the factory, and whether the rules where you live would even allow it. Before the Basket reads the label (typed or photographed), asks which country you are shopping in, and returns a confidence score you can act on in the aisle.

Part of my [daily AI builds](https://github.com/kakkarprerna/daily-ai-builds) series.

---

## What you get back

| | |
|---|---|
| **Overall confidence, 0 to 100** | How comfortable a careful shopper in your region could be buying this, with a band: buy with confidence, buy with care, or think twice |
| **Production score** | How the raw ingredients were most likely farmed or sourced: welfare, breed, feed, sprays, origin, traceability |
| **Processing score** | What happened between the farm and the pack: additives and whether your region permits them, added sugar or water, heating and filtering |
| **Regional yardstick** | What the best and the worst producers of this item do in your region today, and where this product sits between them |
| **Then and now** | One line on how making this staple has changed there over recent decades |
| **Signals** | What counts in its favour, what is worth worrying about, and what missing fact would change the score |
| **Ingredient notes** | Each ingredient worth a comment, marked fine, watch or flag |
| **Checks** | Things you can look for on the pack or the shelf before deciding |
| **Dietary focus** | How the product fits any focus you picked, such as fewer additives or animal welfare |
| **A better swap** | The type of product to look for instead (never a brand) |

## Why it exists

This started with a simple question about staples like chicken and honey: how much has the way they are produced changed in a few decades, and how would an ordinary shopper tell a good one from a bad one? Labels answer part of it. The rest depends on where you live, because the same ingredient list can be normal in one country and not permitted in another. Scoring against the shopper's own region is the product decision that makes the answer useful rather than generic.

## Worked examples (no key needed)

Open **Worked examples** in the app to see three saved results, each losing points for a different reason.

| Product | Region | Overall | Production | Processing | What it shows |
|---|---|---|---|---|---|
| Supermarket honey blend, 1 kg | Spain | 41 | 36 | 60 | Adulteration risk in cheap imported blends |
| Standard chicken breast | United Kingdom | 56 | 44 | 92 | Clean pack, lower welfare system |
| Budget white sandwich bread | United States | 29 | 52 | 17 | Flour treatments the UK and EU do not allow |

The saved results are stored in exactly the format the model returns, so they run through the same parser as a live check.

## How it works

```
Label (typed or photo) + region + optional claims, price and dietary focus
        │
        ▼
Serverless function (api/analyse.js)
  • holds the judging prompt, so it never ships in the client bundle
  • calls the chosen model
        │
        ▼
Model replies in tagged lines (OVERALL: 41, CONCERN: ..., INGREDIENT: name | watch | note)
        │
        ▼
Parser (src/parse.js) turns the lines into the result view
```

**Tagged lines rather than JSON.** Smaller open models slip on strict JSON. One fact per line is easier for them to produce and easier to recover from, and it made adding four providers cheap.

**Two scores, kept apart.** A product can be farmed badly and processed well, or the reverse. Blending them into one number would hide the thing a shopper most needs to know.

## Choosing the model

| Provider | Key | Label photos |
|---|---|---|
| Meta Muse Glimmer 30B (default) | Site owner's key, free NVIDIA endpoint | Only if `LLM_VISION_MODEL` is set |
| Anthropic | Visitor brings their own | Yes |
| OpenAI | Visitor brings their own | Yes |
| Gemini | Visitor brings their own | Yes |

A visitor's key lives in the browser tab's memory, is passed through the function for that one request, and is never stored or logged. Model names can be changed on the Model page.

## Where the judgement comes from

Scores are a model's judgement, drawn from its general knowledge of farming practice and food rules in the chosen region, plus whatever the shopper enters from the pack. Nothing is looked up about the brand and no pack is tested. The worked examples were written with a model and then checked by hand against public rules (EU honey origin labelling, UK chicken assurance standards, EU and UK flour treatment rules).

**Limits worth stating plainly:** it cannot detect fraud in a specific jar, it does not give medical or nutrition advice, and allergens must always be read from the physical pack.

## Privacy

No sign-in, no database, no analytics. A check is sent once to the chosen model and not kept.

## Run it yourself

```bash
npm install
cp .env.example .env.local   # add your NVIDIA key and model id
npx vercel dev               # runs the app and the /api function together
```

`npm run dev` also works for the interface and the worked examples, but live checks need the function, so use `vercel dev` locally.

### Deploy on Vercel

1. Import the repo in Vercel (framework preset: Vite).
2. Add environment variables: `LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY`, and optionally `LLM_VISION_MODEL`.
3. Deploy.

## Built with

React 18, Vite 5, lucide-react icons, a single Vercel serverless function. Plus Jakarta Sans. Olive palette, with red, amber and green kept for score bands only.

## Project layout

```
api/
  analyse.js     serverless function, provider switch
  _prompt.js     judging prompt and input builder (not exposed as a route)
src/
  App.jsx        sidebar, check form, result view, examples, how it works, model picker
  parse.js       tagged-line parser and score bands
  examples.js    three worked examples with saved results
  styles.css
```

---

Built by [Prerna Kakkar](https://github.com/kakkarprerna), Senior Product Manager.
