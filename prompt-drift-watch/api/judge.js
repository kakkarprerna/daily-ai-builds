// Compares replies under prompt A and prompt B and returns tagged lines.
import { complete, handler, clip, HttpError } from './_lib/providers.js';
import { JUDGE_SYSTEM } from './_lib/prompts.js';

export default handler(async (body, key) => {
  const promptA = clip(body.promptA, 8000, 'Prompt A');
  const promptB = clip(body.promptB, 8000, 'Prompt B');
  const purpose = clip(body.purpose, 300, 'The assistant type');
  const intent = clip(body.intent, 1200, 'The intended change');
  const runs = Array.isArray(body.runs) ? body.runs.slice(0, 6) : [];
  if (!runs.length) throw new HttpError(400, 'Run at least one test message first.');

  const runText = runs
    .map((r, i) => {
      const input = clip(r.input, 2000, `Test ${i + 1}`);
      const a = clip(r.a, 6000, `Reply A to test ${i + 1}`);
      const b = clip(r.b, 6000, `Reply B to test ${i + 1}`);
      return `TEST ${i + 1}\nUser message: ${input}\nReply under A: ${a}\nReply under B: ${b}`;
    })
    .join('\n\n');

  const user = `ASSISTANT IS FOR: ${purpose || 'not stated'}
AUTHOR MEANT TO CHANGE: ${intent || 'not stated'}

PROMPT A (current)
${promptA}

PROMPT B (proposed)
${promptB}

${runText}`;

  const report = await complete({
    provider: body.provider,
    model: body.model,
    key,
    system: JUDGE_SYSTEM,
    user,
    maxTokens: 1400,
    temperature: 0.1,
  });
  return { report };
});
