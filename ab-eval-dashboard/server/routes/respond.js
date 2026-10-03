// Answers one test message under one candidate system prompt.
import { complete, clip, HttpError } from '../providers.js';

export default async function respond({ body, key, env }) {
  const system = clip(body.system, 6000, 'The system prompt');
  const message = clip(body.message, 2000, 'The test message');
  if (!system.trim() || !message.trim()) throw new HttpError(400, 'Both a system prompt and a test message are needed.');
  const reply = await complete({ env, provider: body.provider, model: body.model, key, system, user: message, maxTokens: 500, temperature: 0.3 });
  if (!reply) throw new HttpError(502, 'The model returned an empty reply. Try again in a moment.');
  return { reply };
}
