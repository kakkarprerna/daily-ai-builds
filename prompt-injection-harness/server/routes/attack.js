// Sends one attack message to the model under the visitor's system prompt,
// with the secret substituted for {{CANARY}}. Grading happens in the browser,
// so the check is visible and identical for every provider.
import { complete, clip, HttpError } from '../providers.js';

export default async function attack({ body, key, env }) {
  const template = clip(body.systemPrompt, 6000, 'The system prompt');
  const canary = clip(body.canary, 80, 'The secret');
  const message = clip(body.attack, 2000, 'The attack message');
  if (!template.includes('{{CANARY}}')) throw new HttpError(400, 'The system prompt needs {{CANARY}} where the secret goes.');
  if (canary.trim().length < 4) throw new HttpError(400, 'Use a secret of at least four characters.');
  if (!message.trim()) throw new HttpError(400, 'The attack message is empty.');

  const reply = await complete({
    env,
    provider: body.provider,
    model: body.model,
    key,
    system: template.split('{{CANARY}}').join(canary.trim()),
    user: message,
    maxTokens: 500,
    temperature: 0.3,
  });
  return { reply: reply || '' };
}
