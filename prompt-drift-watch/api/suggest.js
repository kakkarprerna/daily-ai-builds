// Proposes test messages that probe the intended change and likely side effects.
import { complete, handler, clip, HttpError } from './_lib/providers.js';
import { SUGGEST_SYSTEM } from './_lib/prompts.js';

export default handler(async (body, key) => {
  const promptA = clip(body.promptA, 8000, 'Prompt A');
  const promptB = clip(body.promptB, 8000, 'Prompt B');
  const purpose = clip(body.purpose, 300, 'The assistant type');
  const intent = clip(body.intent, 1200, 'The intended change');
  if (!promptA.trim() || !promptB.trim()) throw new HttpError(400, 'Paste both prompt versions first.');

  const text = await complete({
    provider: body.provider,
    model: body.model,
    key,
    system: SUGGEST_SYSTEM,
    user: `ASSISTANT IS FOR: ${purpose || 'not stated'}\nAUTHOR MEANT TO CHANGE: ${intent || 'not stated'}\n\nPROMPT A\n${promptA}\n\nPROMPT B\n${promptB}`,
    maxTokens: 500,
    temperature: 0.5,
  });

  const tests = text
    .split('\n')
    .map((l) => l.match(/^\s*TEST:\s*(.+)$/i)?.[1]?.trim())
    .filter(Boolean)
    .slice(0, 6);
  if (!tests.length) throw new HttpError(502, 'The model did not return any test messages. Try again.');
  return { tests };
});
