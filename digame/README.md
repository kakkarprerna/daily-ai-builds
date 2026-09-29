# Dígame

Phone call scripts for people new to Spain. You say who you are ringing and what
you need, and it writes the call out in the order it happens: the recorded menu,
your opening line, the sentence that routes you to the right desk, the questions
they will fire back with answers already written, the phrases that rescue you
mid-call, and what to write down before you hang up.

Every Spanish line carries an English meaning, a rough pronunciation and a play
button that reads it aloud in Spanish.

Two parts work with no API call at all: the spelling tool, which turns a
surname, NIE or email into the Spanish letter names you say out loud, and the
big-text view you hold up while you are actually on the phone.

## Running it

```
npm install
npm run dev        # vite, with the api folder served by vercel dev
```

The browser talks only to `/api/script`. The prompts and the Gemini key live in
that function and never reach the bundle.

## Deploying

```
vercel deploy
```

Set one environment variable in the Vercel project:

| Variable | Required | Notes |
| --- | --- | --- |
| `GEMINI_API_KEY` | yes | From aistudio.google.com/apikey |
| `GEMINI_MODEL` | no | Defaults to `gemini-3.8-flash` |

## Decisions worth knowing about

**Gemini Interactions API rather than generateContent.** Interactions became the
default interface in June 2026. generateContent is still supported but is now
the legacy path, and new capabilities land on Interactions first.

**`store: false` on every request.** By default Gemini keeps interaction records
so you can chain turns with `previous_interaction_id`, one day on the free tier
and longer on paid. This app has no multi-turn conversation to chain, and the
briefs contain things like why someone is ringing immigration, so the records
are switched off.

**The model returns tagged lines, not JSON.** An earlier version asked for JSON
and kept failing: a reply cut off at the token ceiling is unparseable, and one
unescaped character anywhere in the Spanish breaks the whole object. Tagged
lines degrade instead of breaking. A cut-off reply loses its last lines and
keeps everything before them, and no quote or accent can corrupt the structure.

```
OPENING: Buenos días, hablo poco español. | Good morning, I speak little Spanish. | bwe-nos DEE-as
READY: IBAN | They cannot find the account without it | Mi IBAN es ...
```

**Two requests, not one.** The script is generated in halves that run in
parallel. Each output is small enough to finish comfortably, and if one half
fails the other still renders.

**Thinking set to low.** These are short structured outputs where extended
reasoning adds latency and cost without improving the Spanish.

## Scope

It writes what to ask, not what the answer will be. It does not give phone
numbers, opening hours, fees or deadlines, because those change constantly and a
wrong one wastes someone's morning. It gives no legal, immigration or tax
advice, and it cannot book anything or make the call.
