// Scores two replies to the same message against the visitor's rubric. The
// replies arrive as "Response 1" and "Response 2"; the browser decides which
// variant is which, so it can run the same pair in both orders.
import { complete, clip, HttpError } from '../providers.js';

const SYSTEM = `You are an impartial evaluator comparing two AI assistant replies to the same user message.

Score each reply on its own against every criterion, from 1 (poor) to 5 (excellent). Judge the content, not the order the replies appear in, and not their length unless a criterion is about length. Use the evaluator notes if given. Then pick the better reply overall, or Tie only if they are genuinely equal.

Reply with tagged lines only, one per line, no markdown, no JSON, nothing before or after:
SCORE: 1 | <criterion exactly as given> | <1-5>
SCORE: 2 | <criterion exactly as given> | <1-5>
WINNER: <1|2|Tie>
REASON: <one or two sentences naming the difference that decided it>

Give one SCORE line per criterion for each reply. Always give your best scores rather than refusing or hedging. Write in British English.`;

export default async function judge({ body, key, env }) {
  const message = clip(body.message, 2000, 'The test message');
  const notes = clip(body.notes, 600, 'The evaluator notes');
  const first = clip(body.first, 6000, 'Response 1');
  const second = clip(body.second, 6000, 'Response 2');
  const criteria = (Array.isArray(body.criteria) ? body.criteria : []).slice(0, 8).map((c, i) => clip(c, 60, `Criterion ${i + 1}`)).filter((c) => c.trim());
  if (!criteria.length) throw new HttpError(400, 'Add at least one rubric criterion.');
  if (!first.trim() || !second.trim()) throw new HttpError(400, 'Both replies are needed to judge.');

  const report = await complete({
    env,
    provider: body.provider,
    model: body.model,
    key,
    system: SYSTEM,
    user: `USER MESSAGE\n${message}\n\nEVALUATOR NOTES\n${notes || 'none'}\n\nCRITERIA: ${criteria.join(', ')}\n\nRESPONSE 1\n${first}\n\nRESPONSE 2\n${second}`,
    maxTokens: 500,
    temperature: 0,
  });
  if (!report) throw new HttpError(502, 'The judge returned an empty reply. Try again in a moment.');
  return { report };
}
