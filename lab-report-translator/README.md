# Lab Report Translator

Reads a soil or leaf analysis and gives the farmer back what is short, what it means for their crop, and what to do about it. Paste the lab sheet in any language, get the answer in any language.

Part of my daily AI build series.

## The problem

Soil and leaf analyses are the most widely available agronomic data a farmer already owns, and among the least used. The barrier is not access, it is that the output is a table of ppm and percentages with no interpretation attached. The value sits in the translation layer, not in the measurement, which makes it a software problem rather than a laboratory one.

## What it does

- Takes analysis type, crop, sampling timing, region and reply language, all of which accept custom values rather than a fixed list.
- Reads pasted lab values in any language, including mixed-language sheets with local abbreviations and unit conventions.
- Returns a headline verdict, a per nutrient reading with status and confidence, timed actions, the limits of the analysis, and the conditions for calling an agronomist.
- Ships with three worked examples with saved results, so it can be evaluated without an API key.

## Decisions worth defending

**Crop and sampling timing are required, not optional.** A potassium reading of 0.7 % is low for olive and near normal for citrus. Accepting a bare list of numbers would have made onboarding faster and every reading meaningless.

**No fertiliser rates.** A rate needs field size, yield target, product and application method, none of which are in a lab report. The model has no basis for one, so producing it would be the most damaging thing this tool could do while looking the most useful. Placement, timing and product type are answerable. Kilos per hectare are not.

**An "unclear" status sits alongside deficient, low and adequate.** Leaf iron on calcareous soils forced it. Trees can show clear chlorosis with an iron reading inside the normal range, because much of the iron present is not usable. Having somewhere honest to put a weak signal keeps the rest of the output credible.

**Opening up crop and region meant tightening the confidence rules.** Reference range coverage is strong for major European crops and thinner elsewhere. The prompt requires lower confidence outside well covered ground, and the sources page says so to the user in plain terms.

**Every reading names its own edge.** The limits of the analysis and the escalation conditions are part of the output, not a footnote. A tool that knows where it stops is easier to trust than one that answers everything.

## What I would measure

- Share of readings where the farmer takes at least one named action, checked at the next sampling.
- Repeat use across seasons, which is the real signal the reading was worth having.
- Rate of escalation to an agronomist, watched in both directions. Too low means the tool is overreaching.
- Agreement between the tool's reading and an agronomist's, sampled and reviewed rather than assumed.

## Running it

```bash
npm install
cp .env.example .env
# add your Anthropic API key to .env
npm run dev
```

The API key is held server side in `api/read.js`, which runs as a Vercel serverless function. It is never exposed to the browser, and the interpretation prompt stays out of the client bundle. Anything prefixed `VITE_` ships to the browser, so the key must not be.

## Deploying

Push to GitHub, import the repo in Vercel, and add `ANTHROPIC_API_KEY` as an environment variable in the project settings. Vercel detects Vite and picks up `/api` automatically.

## Limits

Sufficiency ranges come from published agronomy references, the kind used in university extension guides and lab interpretation sheets. They are general values, not any fertiliser company's proprietary calibration, and not tuned to variety, rootstock, soil type or irrigation water. This is guidance, not a fertiliser prescription, and not a substitute for an agronomist who has walked the field.
