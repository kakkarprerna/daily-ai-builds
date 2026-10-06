// Three worked examples. All items are invented for this demo, written to show
// typical judge drift patterns. They are not real customer data.

export function toCsv(items, withJudge) {
  const esc = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = ['id', 'input', 'response', 'human', 'note'];
  if (withJudge) head.push('judge', 'judge_reason');
  const rows = items.map((it) => {
    const r = [it.id, it.input, it.response, it.human, it.note || ''];
    if (withJudge) r.push(it.judge, it.reason || '');
    return r.map(esc).join(',');
  });
  return [head.join(','), ...rows].join('\n');
}

export const TEMPLATE = `id,input,response,human,note
q1,"Customer question or source text","The AI response you want scored",4,"Optional note from the person who scored it"
q2,"Another input","Another response",2,`;

export const EXAMPLES = [
  {
    key: 'telco',
    title: 'Support bot: policy accuracy',
    domain: 'Telco customer support',
    blurb: 'A Spanish telco support bot answering contract and billing questions. The judge rewards answers that sound confident, even when they state a policy that does not exist.',
    criterion: 'Policy accuracy',
    scale: '1-5',
    rubric: `5 = Correct and complete, matches published policy, gives the customer the next step.
4 = Correct, with a minor omission.
3 = Partly correct or vague; the customer would need to ask again.
2 = Mostly wrong, or misses the key condition.
1 = Wrong, or invents a policy.`,
    items: [
      { id: 't1', input: 'Can I cancel my fibre contract early without a fee?', response: 'Yes, you can cancel at any time free of charge through the app.', human: 1, note: 'Permanence period applies; this is invented.', judge: 4, reason: 'Clear, direct and gives the customer a way to act, close to level 5.' },
      { id: 't2', input: 'Is roaming in the UK included in my plan?', response: 'Roaming in the UK is included in your EU allowance at no extra cost.', human: 2, note: 'UK is outside EU roaming rules; depends on the tariff.', judge: 4, reason: 'Answers the question directly with a clear condition.' },
      { id: 't3', input: 'How do I port my number to you?', response: 'Ask your new operator to request portability. It completes within one working day and your old line stays active until then.', human: 5, note: '', judge: 5, reason: 'Correct, complete and gives the next step.' },
      { id: 't4', input: 'Why is my bill higher this month?', response: 'Your bill may include a prorated charge from your plan change. Check the tariff changes line in the app; if it is not there, reply and I will open a billing review.', human: 5, note: '', judge: 5, reason: 'Explains the likely cause and offers a clear next step.' },
      { id: 't5', input: 'Is the router mine to keep?', response: 'The router remains the property of the operator and must be returned within 30 days after cancellation to avoid a charge.', human: 4, note: 'Correct, but no amount or return method.', judge: 4, reason: 'Correct with a minor omission about how to return it.' },
      { id: 't6', input: 'Do I get compensated for the outage yesterday?', response: 'We are sorry for the inconvenience. Our team is working hard to keep you connected.', human: 2, note: 'Does not answer the compensation question at all.', judge: 3, reason: 'Polite but vague; the customer would need to ask again.' },
      { id: 't7', input: 'Can I add a line for my daughter?', response: 'Yes, you can add up to four extra lines from My Account, Lines. Each extra line is charged from the day it activates.', human: 5, note: '', judge: 5, reason: 'Correct and complete with the path in the app.' },
      { id: 't8', input: 'What is the permanence period on my offer?', response: 'Most offers have a 12-month permanence. Check your contract summary for the exact date.', human: 3, note: 'Generic; does not use the customer offer.', judge: 4, reason: 'Gives a clear figure and where to confirm it.' },
      { id: 't9', input: 'Why was I charged for premium SMS?', response: 'Premium SMS charges come from third-party services you subscribed to. You can block premium services free of charge by calling customer care or from the app.', human: 4, note: 'Fine, but no help disputing the existing charge.', judge: 5, reason: 'Correct explanation with a clear next step.' },
      { id: 't10', input: 'Can I pause my line for three months while I am abroad?', response: 'Yes, you can pause any line for up to six months at no cost.', human: 1, note: 'No such pause option exists.', judge: 3, reason: 'Answers the question but gives no detail on how to pause.' }
    ],
    diagnosis: `SUMMARY|The judge scores how confident and actionable an answer sounds, while your people score it against the real policy. Every large miss is a fluent answer that states a policy the judge had no way to check.
AMBIGUITY|matches published policy|The judge never saw the policy, so it treated plausibility as correctness; the humans checked each answer against the actual terms|t1,t2,t10
AMBIGUITY|invents a policy|Without a reference the judge cannot tell an invented policy from a real one, so level 1 is almost never used|t1,t10
AMBIGUITY|gives the customer the next step|The judge gave credit for a next step even when the answer itself was wrong, lifting wrong answers into levels 3 and 4|t1,t8,t9
REWRITE|matches published policy|matches the policy excerpt supplied with the item; if the response states a rule that is not in the excerpt, score 2 or lower
REWRITE|new line|Score correctness first. A next step only lifts a response that is already correct.
REWRITE|new line|A response that does not answer the question asked scores 2 or lower, however polite it is.
ADD_CASE|A fluent answer that quotes a real fee but the wrong amount|Whether the judge checks figures against the policy excerpt
ADD_CASE|A correct answer that says it will transfer to billing because it cannot see the account|Whether the judge penalises honest hand-offs
ADD_CASE|Two answers to the same question, one invented and one correct, written in the same confident tone|Whether tone alone moves the score
HUMAN_CHECK|t9|The human note reads as level 4, but the rubric has no rule that the customer must be helped with the existing charge; agree a rule or accept 5`
  },
  {
    key: 'summary',
    title: 'Meeting summaries: faithfulness',
    domain: 'Internal productivity tool',
    blurb: 'An assistant that summarises short meeting transcripts. The judge tracks the humans closely and is slightly stricter on figures, which is the healthy direction.',
    criterion: 'Faithfulness to the transcript',
    scale: '1-5',
    rubric: `5 = Every statement is supported by the transcript, nothing important missing.
4 = Supported throughout but leaves out a figure or an owner.
3 = One unsupported detail that would not change a decision.
2 = One unsupported or wrong claim that could change a decision.
1 = Several wrong claims, or reverses a decision.`,
    items: [
      { id: 'm1', input: 'Ana: We will move the launch to 14 March because legal needs another week. Ben: Fine, marketing can shift the emails.', response: 'Launch moves to 14 March to give legal another week; marketing will shift the emails.', human: 5, note: '', judge: 5, reason: 'Every statement is supported and nothing is missing.' },
      { id: 'm2', input: 'Raj: Churn was 3.1% last month, slightly up from 2.8%. Lia: Mostly the annual cohort.', response: 'Churn rose slightly last month, mostly in the annual cohort.', human: 4, note: 'Drops the figures.', judge: 4, reason: 'Supported but leaves out the churn figures.' },
      { id: 'm3', input: 'Sam: We agreed to pilot with two clinics, not five. Kim: Two, then review in June.', response: 'The team agreed to pilot with a few clinics and review later in the year.', human: 3, note: 'Vague rather than wrong.', judge: 2, reason: 'Changes the review date and the number of clinics, which could change planning.' },
      { id: 'm4', input: 'Eva: Budget approved at 40K. Tom: I will send the PO on Friday.', response: 'Budget approved at 40K; Tom sends the PO on Friday.', human: 5, note: '', judge: 5, reason: 'Fully supported, owner and figure included.' },
      { id: 'm5', input: 'Leo: I think we should consider dropping the free tier. Mia: Let us not decide today.', response: 'The team decided to drop the free tier.', human: 2, note: 'States a decision that was explicitly deferred.', judge: 2, reason: 'States a decision that the transcript says was not taken.' },
      { id: 'm6', input: 'Noor: Onboarding NPS went from 31 to 38 after the checklist change. Dan: Good, keep it.', response: 'Onboarding NPS improved from 31 to 38 after the checklist change, and the team will keep it.', human: 4, note: 'Only Dan said keep it.', judge: 5, reason: 'All figures and the outcome are supported.' },
      { id: 'm7', input: 'Ivy: The vendor contract renews in May; we have not decided. Max: I will gather quotes.', response: 'Vendor contract cancelled; Max will find a new vendor by May.', human: 1, note: 'Reverses an open decision.', judge: 1, reason: 'Reverses an undecided item and invents a deadline.' },
      { id: 'm8', input: 'Zoe: Hiring freeze until Q3, except for the two open support roles.', response: 'Hiring is frozen until Q3, apart from the two open support roles.', human: 5, note: '', judge: 5, reason: 'Fully supported.' },
      { id: 'm9', input: 'Ali: Mobile crash rate is down to 0.4%, target was 0.5%. Kat: I still want the Android fix shipped.', response: 'Crash rate hit 0.4%, beating target; Kat wants the Android fix shipped this week.', human: 3, note: '"This week" was never said.', judge: 3, reason: 'One unsupported detail about timing that would not change a decision.' },
      { id: 'm10', input: 'Pia: Q2 revenue target is 1.2M; we are at 0.9M. Gus: We need a push in enterprise.', response: 'Q2 revenue is on track at 1.2M; an enterprise push is planned.', human: 2, note: 'Says on track when it is behind.', judge: 1, reason: 'Misstates revenue and the push was suggested, not planned; two wrong claims.' }
    ],
    diagnosis: `SUMMARY|Agreement is strong and the judge leans slightly strict, mostly where a summary rounds or blurs a number or a date. The one lenient miss is about who agreed to something, which the rubric does not mention.
AMBIGUITY|would not change a decision|The judge treated blurred dates and counts as decision-changing; the humans treated them as vague but harmless|m3
AMBIGUITY|Several wrong claims|The judge counted a suggestion reported as a plan as a second wrong claim, pushing the item from 2 to 1|m10
AMBIGUITY|an owner|The rubric covers missing owners but not wrongly widened ones, so the judge gave full marks when one person's view became the team's decision|m6
REWRITE|new line|Attributing one person's view to the whole team counts as an unsupported detail.
REWRITE|One unsupported detail that would not change a decision|One unsupported or vaguer detail that would not change a decision, such as a softened date or count
ADD_CASE|A summary that rounds 3.1% to about 3%|Whether rounding is treated as faithful
ADD_CASE|A summary that names the wrong owner for an action|Whether the judge separates missing owners from wrong ones
HUMAN_CHECK|m10|The response contains two problems (on track, and planned); by the rubric as written the judge's 1 may be the better label`
  },
  {
    key: 'voice',
    title: 'Voice agent calls: resolution',
    domain: 'Automotive service bookings',
    blurb: 'A voice agent handling service bookings for a car manufacturer. The judge is stricter than people, reading line noise as agent failure and ignoring warm handovers.',
    criterion: 'Call resolution',
    scale: '1-4',
    rubric: `4 = Resolved in the call and the caller confirmed.
3 = Resolved, but the caller had to repeat themselves.
2 = Partly resolved, or handed to a human with context.
1 = Not resolved, or handed off without context.`,
    items: [
      { id: 'v1', input: 'Caller wants to book a service for Saturday.', response: 'Agent: Which city is the car in? Caller: P[inaudible]. Agent: Sorry, which city? Caller: Pune. Agent: Saturday 10am at the Baner workshop is free, shall I book it? Caller: Yes. Agent: Booked, you will get an SMS.', human: 4, note: 'Repeat was line noise, not the agent.', judge: 3, reason: 'Resolved, but the caller had to repeat the city.' },
      { id: 'v2', input: 'Caller asks the cost of the 20,000 km service.', response: 'Agent: Could you tell me the model? Caller: Nexon. Agent: Could you tell me the model? Caller: I said Nexon. Agent: The 20,000 km service for the Nexon is 4,850 rupees.', human: 3, note: 'Agent looped once, then answered.', judge: 2, reason: 'The agent repeated its question, so the call was only partly handled well.' },
      { id: 'v3', input: 'Caller wants to change the booked slot.', response: 'Agent: I cannot change slots, I will connect you to the workshop. They will see your Saturday 10am booking at Baner. [transfer]', human: 2, note: '', judge: 2, reason: 'Handed to a human with the booking details passed on.' },
      { id: 'v4', input: 'Caller wants pickup and drop.', response: 'Agent: Pickup is available in your area for 299 rupees. Shall I add it? Caller: Yes. Agent: Added, the driver will call 30 minutes before.', human: 4, note: '', judge: 4, reason: 'Resolved in the call with the caller confirming.' },
      { id: 'v5', input: 'Caller complains about a poor repair.', response: 'Agent: I understand. Let me book you a service. Caller: No, I want to complain! Agent: Let me book you a service. [caller hangs up]', human: 1, note: '', judge: 1, reason: 'Not resolved; the agent ignored the complaint.' },
      { id: 'v6', input: 'Caller asks workshop opening hours.', response: 'Agent: Which workshop? Caller: Wakad. Agent: Sorry, I did not catch that. Caller: Wa-kad. Agent: Wakad is open 9am to 7pm, Monday to Saturday.', human: 3, note: 'Resolved after one repeat.', judge: 2, reason: 'The agent failed to understand the first answer, so only partly resolved.' },
      { id: 'v7', input: 'Caller asks whether the warranty covers the battery.', response: 'Agent: Battery cover depends on the purchase date. I will transfer you to a warranty adviser and pass on your registration number. [warm transfer with summary]', human: 2, note: 'Warm transfer with context.', judge: 1, reason: 'Not resolved by the agent.' },
      { id: 'v8', input: 'Caller wants to cancel a booking.', response: 'Agent: Your Saturday booking at Baner is cancelled. Anything else? Caller: No, thanks.', human: 4, note: '', judge: 3, reason: 'Resolved, but the agent did not confirm which booking before cancelling.' },
      { id: 'v9', input: 'Caller asks for the nearest workshop.', response: 'Agent: Which area? Caller: Kothrud. Agent: Kothrud? Caller: Yes, Kothrud. Agent: The Kothrud workshop is on Paud Road. I have texted you the location.', human: 3, note: '', judge: 3, reason: 'Resolved after the caller repeated the area.' },
      { id: 'v10', input: 'Caller asks about loan options.', response: 'Agent: I cannot help with finance, but I have sent you the finance team number by SMS.', human: 2, note: '', judge: 2, reason: 'Partly resolved with a useful pointer.' }
    ],
    diagnosis: `SUMMARY|The judge never scores above the humans and drops a level whenever a call contains a repeat, a transfer, or something it thinks the agent should have checked. Each case traces to a rubric line that does not say whose fault a repeat is or what counts as context.
AMBIGUITY|the caller had to repeat themselves|The judge counts any repeat, including line noise marked [inaudible], as agent failure and sometimes drops to level 2; the humans only penalise repeats the agent caused|v1,v2,v6
AMBIGUITY|handed to a human with context|The judge read a warm transfer with a summary as not resolved; the humans read it as exactly the context the rubric asks for|v7
AMBIGUITY|unstated standard|The judge applied a rule that the agent must confirm the booking before cancelling, which the rubric never states|v8
REWRITE|Resolved, but the caller had to repeat themselves.|Resolved, but the caller had to repeat themselves because the agent misheard or looped. Repeats caused by line noise or [inaudible] audio do not lower the score.
REWRITE|handed to a human with context|handed to a human with the caller details and reason passed on (a warm transfer)
REWRITE|new line|Score only against these levels. Do not apply standards that are not written here.
ADD_CASE|A call with heavy road noise where the agent still books correctly first time|Whether noise alone lowers the score
ADD_CASE|The same transfer done cold and then warm|Whether the judge separates level 1 from level 2 handovers
HUMAN_CHECK|v1|Read literally, the rubric puts any repeat at level 3; the humans used a rule the rubric does not state yet, so either label is defensible until the rewrite lands`
  }
];
