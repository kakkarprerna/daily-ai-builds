// Runs one test message against one version of the visitor's system prompt.
import { complete, handler, clip, HttpError } from './_lib/providers.js';

export default handler(async (body, key) => {
  const prompt = clip(body.prompt, 8000, 'The system prompt');
  const input = clip(body.input, 2000, 'The test message');
  if (!prompt.trim() || !input.trim()) throw new HttpError(400, 'Both a prompt and a test message are needed.');

  const reply = await complete({
    provider: body.provider,
    model: body.model,
    key,
    system: prompt,
    user: input,
    maxTokens: 600,
    temperature: 0.2,
  });
  return { reply };
});
