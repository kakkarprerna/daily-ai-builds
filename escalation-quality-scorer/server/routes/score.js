// Reviews one AI-to-human handoff: what the human agent needs, whether the
// handoff note carries it, questions the bot asked twice, timing, urgency, and
// a rewritten note. The score is computed in the browser from these lines.
import { complete, clip, HttpError } from '../providers.js';

const SYSTEM = `You review customer support conversations where an AI agent hands a customer over to a human agent. You get the TRANSCRIPT and the HANDOFF NOTE the AI wrote for the human (the note may be empty).

1. From the TRANSCRIPT, list the facts a human agent needs to carry on without re-asking the customer: the issue in specific terms, identifying details the customer gave (account, order, booking or reference numbers, email), what has already been tried or ruled out, what the customer wants as an outcome, and any frustration, urgency or deadline. Between 3 and 8 facts.

2. For each fact, check the HANDOFF NOTE:
- Carried: the note states it clearly enough that the human would not need to ask.
- Partial: the note hints at it but the human would still need to ask or check.
- Missing: not in the note.

3. Find every moment the AI asked the customer for something they had already given earlier in the same conversation. Copy the AI's question as an exact substring of the TRANSCRIPT, character for character.

4. Rate the timing of the escalation: Early (handed over before trying to help with something it could have handled), Appropriate, or Late (the customer had to push for a person, or the AI kept failing first).

5. Urgency: Flagged if the customer showed frustration or a deadline and the note says so. Not flagged if they did and the note does not. None to flag if there was nothing to pass on.

6. Write a better handoff note the human could act on at once, using only facts from the transcript.

Reply with tagged lines only, one per line, no markdown, no JSON, nothing before or after:
FACT: <Carried|Partial|Missing> | <the fact, under 14 words> | <what the note says about it, or what is missing>
REDUNDANT: <exact quote of the AI's repeated question> | <what the customer had already said, and roughly when>
TIMING: <Early|Appropriate|Late> | <one sentence>
URGENCY: <Flagged|Not flagged|None to flag> | <one sentence>
SUMMARY: <under 30 words, plain language, for a support or product manager>
FIX: <one concrete change to the note template or the bot's behaviour>
NOTE: <one line of the rewritten handoff note>

Use up to 3 FIX lines and 3 to 7 NOTE lines. Write in British English. Never invent details that are not in the transcript.`;

export default async function score({ body, key, env }) {
  const transcript = clip(body.transcript, 12000, 'The transcript');
  const note = clip(body.note, 3000, 'The handoff note');
  const channel = clip(body.channel, 120, 'The channel');
  const sector = clip(body.sector, 120, 'The sector');
  if (transcript.trim().length < 40) throw new HttpError(400, 'Paste the conversation between the AI agent and the customer.');

  const report = await complete({
    env,
    provider: body.provider,
    model: body.model,
    key,
    system: SYSTEM,
    user: `CHANNEL: ${channel || 'not stated'}\nSECTOR: ${sector || 'not stated'}\n\nTRANSCRIPT\n${transcript}\n\nHANDOFF NOTE\n${note.trim() || '(empty: no note was written)'}`,
    maxTokens: 1400,
    temperature: 0.1,
  });
  if (!report) throw new HttpError(502, 'The model returned an empty reply. Try again, or switch provider in Model & key.');
  return { report };
}
