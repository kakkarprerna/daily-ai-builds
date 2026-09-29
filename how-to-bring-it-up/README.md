# How to Bring It Up

Second build in the AI-safety-for-teens sub-series, and a companion piece to
[Duty of Care](https://github.com/kakkarprerna/duty-of-care). That one reads
a conversation a kid already had with an AI chatbot. This one is for the
adult on the other side of that discovery: describe what you noticed and get
a low-pressure way to open the conversation, without it landing as an
accusation.

## Why it looks the way it does

- **Built for the adult, not the teen**, which flips a few defaults from
  Duty of Care. The tone is calmer, and LEVEL runs none, calm, steady,
  urgent, an extra rung below Duty of Care's scale, because most things a
  parent notices genuinely need no conversation at all. The categories
  (physical safety, emotional signals, trust and boundaries) are the same
  three used there, so the two builds share one taxonomy.
- **Age is asked directly**, in bands rather than an exact number, because
  what works for a curious 8 year old and what works for a guarded 17 year
  old are different scripts, not the same script said more slowly. The
  system prompt explicitly instructs against generic, one-size-fits-all
  phrasing that could be pasted into any answer unchanged.
- **Willing to say nothing is needed.** The none level exists so the tool
  does not manufacture a concern to justify a response. One worked example
  (an 7 year old asking about volcanoes for homework) exists specifically
  to prove that out.
- **How you found out changes everything**, so it is a first-class input,
  not an afterthought. Finding something by checking a phone without
  permission needs a very different opener than a kid volunteering it
  themselves. The worked examples deliberately cover both.
- **Two resource sections, not one.** ResourceFooter carries the same
  crisis lines as Duty of Care, for anything acute. CommunicationResources
  is new here: real, checked links (Common Sense Media, Internet Matters,
  Child Mind Institute) for the ongoing work of talking to kids about AI
  and staying in touch with one who is pulling away, since a single opener
  is a start, not the whole job.
- **Privacy is handled the same way as Duty of Care**: no sign-in, no
  storage, the text goes only to whichever AI provider is chosen for that
  one request. What a parent types here is often more identifying (it is
  about a specific real child, now with an age band attached) than what
  goes into Duty of Care, so this matters at least as much here, arguably
  more.
- **Crisis resources sit on every page**, unchanged from Duty of Care,
  since a parent using this may be dealing with something more urgent than
  a conversation script can address.

## Local setup

```bash
npm install
cp .env.example .env
# fill in LLM_BASE_URL / LLM_MODEL / LLM_API_KEY, same values as your other builds
npm run dev
```

`/api/scan` is a Vercel serverless function. Use `vercel dev` instead of
`vite dev` to test the free (Muse Glimmer) path locally, or deploy and test
on Vercel directly. The bring-your-own-key providers need no local setup.

## Deploy to Vercel

```bash
vercel
```

Then set `LLM_BASE_URL`, `LLM_MODEL`, and `LLM_API_KEY` in the Vercel
project settings, matching your other builds, and redeploy with
`vercel --prod`.

## Structure

```
src/
  App.jsx                 sidebar + page switch
  components/
    Sidebar.jsx
    CheckPage.jsx           describe the situation and age, get an opener
    Examples.jsx            four worked situations, click to expand
    HowItWorks.jsx          plain-language explainer + limits
    ResultCard.jsx          shared result display, categories + opener
    ResourceFooter.jsx      crisis resources, shown on every page
    CommunicationResources.jsx  ongoing communication resources, shown on every page
  data/examples.js           the four worked situations and saved results
  lib/parseResult.js         parses the model's tagged-line output
api/scan.js                  serverless function, routes to the chosen provider
```

## Model output format

```
LEVEL: none|calm|steady|urgent
CONFIDENCE: 0-100
CATEGORY_PHYSICAL: none|watch|flag
CATEGORY_EMOTIONAL: none|watch|flag
CATEGORY_TRUST: none|watch|flag
SUMMARY: ...
OPENER: ...
AVOID_1: ...
AVOID_2: ...
AVOID_3: ...
IF_SHUTS_DOWN: ...
LISTEN_FOR: ...
WHEN_TO_GET_HELP: ...
```

Same reasoning as Duty of Care for tagged lines over JSON: cheap to keep
consistent across four different providers, and it degrades gracefully if a
response is slightly malformed.

## Honest limits

A generated opening line is a starting point, not a script to read word for
word, and it cannot know the actual relationship or history involved. It is
a prototype for a portfolio, not a substitute for a family therapist, a
paediatrician, or a school counsellor when the situation calls for one.
