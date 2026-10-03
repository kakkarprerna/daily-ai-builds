// Audits one AI answer: extracts checkable claims, rates each, and rates how
// assertively the answer is phrased. Returns tagged lines; the score itself is
// computed in the browser from these two ratings so the formula stays visible.
import { complete, clip, HttpError } from '../providers.js';

const SYSTEM = `You audit an AI assistant's answer for silent failure: claims stated with more certainty than the evidence supports.

Work in three steps.

1. Extract every discrete, checkable factual claim in the ANSWER: numbers, dates, names, organisations, statistics, quotations, causal claims. Skip opinions, generic advice and the hedging language itself. Copy each claim as an exact substring of the ANSWER, character for character, so it can be highlighted.

2. Give each claim one status:
- Verified: you are confident this specific detail is accurate.
- Plausible: fits what you know, but you cannot confirm the specific detail.
- Unverifiable: specific enough to matter, and you have no basis to confirm or deny it.
- Fabrication risk: precise about an entity, figure or event you have reason to think is invented, wrong or misremembered.
Say what a reviewer should check, in under 18 words.

3. Rate the ANSWER as a whole:
- CONFIDENCE 0-100 for how assertive the wording is, ignoring accuracy. 100 = flat statements with no caveats. 0 = heavily hedged, open about uncertainty.
- VERIFIABILITY 0-100. 100 = every claim Verified or Plausible. 0 = every claim Unverifiable or Fabrication risk. If there are no checkable claims, 100.

Reply with tagged lines only, one item per line, no markdown, no JSON, nothing before or after:
CONFIDENCE: <0-100> | <under 15 words on the tone>
VERIFIABILITY: <0-100>
CLAIM: <Verified|Plausible|Unverifiable|Fabrication risk> | <exact quote from the answer> | <what to check>
HEDGE: <exact quote of a phrase in the answer that signals uncertainty, if any>
SUMMARY: <under 30 words, plain language, for a product manager>
FIX: <one concrete change to the answer or the system that produced it>

Use as many CLAIM lines as there are claims (maximum 12). HEDGE lines are optional. Write in British English.`;

export default async function audit({ body, key, env }) {
  const question = clip(body.question, 3000, 'The question');
  const answer = clip(body.answer, 8000, 'The answer');
  const domain = clip(body.domain, 200, 'The topic');
  if (!answer.trim()) throw new HttpError(400, 'Paste the AI answer you want to audit.');

  const report = await complete({
    env,
    provider: body.provider,
    model: body.model,
    key,
    system: SYSTEM,
    user: `TOPIC: ${domain || 'not stated'}\n\nQUESTION\n${question || '(not given)'}\n\nANSWER\n${answer}`,
    maxTokens: 1200,
    temperature: 0.1,
  });
  if (!report) throw new HttpError(502, 'The model returned an empty reply. Try again, or switch provider in Model & key.');
  return { report };
}
