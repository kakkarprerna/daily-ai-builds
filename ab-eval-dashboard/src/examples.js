// Three saved comparisons. Each case stores both replies and two judge runs:
// ab (A shown first) and ba (B shown first). Scores are listed in criteria
// order and turned into the judge's tagged-line format, so saved runs go
// through exactly the same parser as live ones.

function tagged(criteria, first, second, winner, reason) {
  return [
    ...criteria.map((c, i) => `SCORE: 1 | ${c} | ${first[i]}`),
    ...criteria.map((c, i) => `SCORE: 2 | ${c} | ${second[i]}`),
    `WINNER: ${winner}`,
    `REASON: ${reason}`,
  ].join('\n');
}

// j = { A: [...], B: [...], w: 'A' | 'B' | 'Tie', r: reason }
function build(ex) {
  return {
    ...ex,
    cases: ex.cases.map((c, i) => {
      const w1 = (j) => (j.w === 'Tie' ? 'Tie' : j.w === 'A' ? '1' : '2');
      const w2 = (j) => (j.w === 'Tie' ? 'Tie' : j.w === 'B' ? '1' : '2');
      return {
        ...c,
        id: `${ex.id}-${i}`,
        ab: tagged(ex.criteria, c.jab.A, c.jab.B, w1(c.jab), c.jab.r),
        ba: tagged(ex.criteria, c.jba.B, c.jba.A, w2(c.jba), c.jba.r),
      };
    }),
  };
}

const NW_A = 'You are a support assistant for Northwind Billing. Answer billing questions accurately and concisely. Do not speculate about pricing changes, discounts, or promotions that have not been officially announced.';
const NW_B = "You're a support assistant for Northwind Billing! Be warm and conversational. Help customers with billing questions and proactively suggest ways they might save money, even if it means guessing at upcoming promotions or discounts.";

export const EXAMPLES = [
  build({
    id: 'northwind',
    title: 'Cautious beats warm, mostly',
    blurb: 'A careful billing prompt against a friendly one that guesses at discounts. The careful one wins, and one case flips when the order is swapped.',
    variantA: NW_A,
    variantB: NW_B,
    criteria: ['Accuracy', 'Policy compliance', 'Tone', 'Conciseness'],
    cases: [
      {
        prompt: 'Is there a discount coming up for annual plans?',
        notes: 'Should not confirm or imply an unannounced promotion.',
        a: "There's no announced discount on annual plans right now. Annual billing already costs less than paying monthly; I can show you the difference for your plan.",
        b: "Ooh, good timing! We often run promos around the end of the quarter, so there could well be an annual deal coming soon. I'd hold off a couple of weeks if you can!",
        jab: { A: [5, 5, 4, 5], B: [2, 1, 4, 3], w: 'A', r: 'B implies an unannounced promotion and advises the customer to wait, which breaks the stated policy.' },
        jba: { A: [5, 5, 4, 5], B: [2, 1, 5, 3], w: 'A', r: 'The cautious reply states the facts; the warm one speculates about a deal that has not been announced.' },
      },
      {
        prompt: 'Why was I charged twice this month?',
        a: 'That usually means a failed payment was retried, or two workspaces are billed to the same card. If you share the invoice numbers, I can check which applies and start a refund for any duplicate.',
        b: "Oh no, that's so annoying, sorry! It might be a glitch on our side. Send me the details and I'll get it sorted for you right away!",
        jab: { A: [5, 5, 4, 4], B: [3, 4, 5, 4], w: 'A', r: 'A gives the likely causes and the next step; B is friendly but vague about what happened.' },
        jba: { A: [5, 5, 4, 4], B: [3, 4, 5, 3], w: 'A', r: 'A explains the probable cause and asks for exactly what it needs.' },
      },
      {
        prompt: 'Can you cancel my subscription right now?',
        a: 'I can cancel it from here. It will stay active until the end of your current billing period, 30 November, and you will not be charged again. Shall I go ahead?',
        b: "Of course! Before you go, did you know you might save by switching to annual? There may be a deal coming. But if you're sure, I can cancel it!",
        jab: { A: [5, 5, 4, 5], B: [3, 2, 3, 3], w: 'A', r: 'B delays a clear cancellation request with a speculative retention pitch.' },
        jba: { A: [5, 5, 5, 5], B: [3, 2, 3, 3], w: 'A', r: 'A confirms the outcome and the end date; B pushes a guessed discount before acting.' },
      },
      {
        prompt: "What's the cheapest plan for a 10-person team?",
        a: 'For 10 people, Team is the lowest-cost plan at €8 per user per month, so €80 a month. Paying annually lowers that to €68 a month.',
        b: "Great question! Team is your best bet at €8 per user, so €80 a month for 10. Go annual and it's €68 a month, and keep an eye out, we sometimes drop prices for growing teams!",
        jab: { A: [5, 5, 4, 5], B: [5, 4, 5, 4], w: 'B', r: 'Both give the right price; B adds the annual saving warmly, though the closing line hints at unannounced pricing.' },
        jba: { A: [5, 5, 4, 5], B: [5, 3, 5, 4], w: 'A', r: 'Both are accurate; A avoids the hint about future price drops, which the policy rules out.' },
      },
      {
        prompt: "I'm frustrated, this is the third time I've had a billing issue.",
        notes: 'Watch tone under a mildly upset customer.',
        a: "I'm sorry, three billing problems is too many. Tell me what's wrong this time and I'll fix it, and I'll note the earlier issues on your account so it's looked at properly.",
        b: "I totally get it and I'm so sorry! Let me make it up to you. I bet we can find you a discount for the trouble!",
        jab: { A: [5, 5, 5, 5], B: [2, 2, 4, 4], w: 'A', r: 'B promises a discount it has no basis to offer; A acknowledges the pattern and commits to a fix.' },
        jba: { A: [5, 5, 5, 4], B: [2, 2, 4, 4], w: 'A', r: 'A is empathetic without inventing compensation.' },
      },
      {
        prompt: 'Do you offer refunds for annual plans if I cancel early?',
        a: 'Annual plans can be refunded in full within 14 days of purchase. After that, cancelling stops renewal but the plan runs to the end of the paid year, with no partial refund.',
        b: "We're pretty flexible! Reach out and we'll usually work something out, it never hurts to ask.",
        jab: { A: [5, 5, 4, 5], B: [2, 3, 4, 4], w: 'A', r: 'A states the refund policy; B is vague and could set a false expectation.' },
        jba: { A: [5, 5, 4, 5], B: [2, 3, 5, 4], w: 'A', r: 'A gives the actual terms; B suggests flexibility that may not exist.' },
      },
    ],
  }),
  build({
    id: 'voice',
    title: 'Short wins on the phone',
    blurb: 'A clinic booking voice agent: two-sentence replies against thorough ones. Short wins three of four, and the one it loses is the question that needed detail.',
    variantA: 'You are the phone booking assistant for Clínica Mar, a physiotherapy clinic. This is a voice call. Reply in at most two short sentences. Ask one question at a time. Never read out lists of more than three items.',
    variantB: 'You are the phone booking assistant for Clínica Mar, a physiotherapy clinic. Be thorough and helpful. Give callers complete information so they do not need to call back.',
    criteria: ['Accuracy', 'Brevity for voice', 'Completeness', 'Tone'],
    cases: [
      {
        prompt: "Hi, I'd like to book a physio appointment for my back.",
        a: 'Happy to help. Is this your first visit with us, or have you been before?',
        b: "Of course! We offer initial assessments of 45 minutes and follow-up sessions of 30 minutes. Our physiotherapists specialise in back pain, sports injuries and post-surgery rehab. We're open Monday to Friday from 8am to 8pm and Saturdays from 9 to 2. Would you like an initial assessment?",
        jab: { A: [5, 5, 4, 5], B: [5, 1, 5, 4], w: 'A', r: 'On a call, B front-loads details the caller did not ask for; A moves the booking forward with one question.' },
        jba: { A: [5, 5, 4, 5], B: [5, 1, 5, 4], w: 'A', r: 'A suits a voice call; B is a paragraph the caller has to hold in their head.' },
      },
      {
        prompt: 'What time do you open on Saturday?',
        a: "We're open from 9 until 2 on Saturdays.",
        b: "On Saturdays we're open from 9am to 2pm. During the week we're open 8am to 8pm, and we're closed on Sundays and public holidays.",
        jab: { A: [5, 5, 5, 5], B: [5, 3, 5, 4], w: 'A', r: 'Both are correct; A answers exactly what was asked.' },
        jba: { A: [5, 5, 5, 5], B: [5, 3, 5, 4], w: 'A', r: 'A answers in one line; the extra hours in B are not needed.' },
      },
      {
        prompt: 'Does my private insurance cover it? I have Sanitas.',
        a: 'We work with Sanitas. Cover depends on your policy, so please check with them.',
        b: "Yes, we're on the Sanitas network. Most Sanitas policies cover physiotherapy with a doctor's referral, usually up to a set number of sessions a year. Bring your insurance card and the referral to your first visit, and we'll check your cover before treatment starts.",
        jab: { A: [4, 5, 2, 4], B: [5, 3, 5, 5], w: 'B', r: 'Here the caller needs to know about the referral and what to bring; A leaves them to call back.' },
        jba: { A: [4, 5, 2, 4], B: [5, 3, 5, 5], w: 'B', r: 'B gives the referral requirement the caller would otherwise miss.' },
      },
      {
        prompt: 'Can I come Tuesday afternoon?',
        a: 'Tuesday afternoon works. Would 4pm or 5:30 suit you better?',
        b: 'Let me check Tuesday afternoon. We have availability at 3pm, 4pm, 4:30pm, 5:30pm and 6:15pm with different physiotherapists. Do any of those work for you?',
        jab: { A: [5, 5, 4, 5], B: [5, 2, 5, 4], w: 'A', r: 'Five spoken time slots is hard to follow on a call; A offers two.' },
        jba: { A: [5, 5, 4, 5], B: [5, 2, 5, 4], w: 'A', r: 'A keeps the choice simple enough to answer by voice.' },
      },
    ],
  }),
  build({
    id: 'refunds',
    title: 'Empathy that keeps to policy',
    blurb: 'A returns assistant: a strict prompt that recites policy against one that acknowledges the customer first. This time B wins, with one tie.',
    variantA: 'You are the returns assistant for Lumen Home, an online homeware shop. State the returns policy accurately: 30 days, unused items, original packaging, refund within 5 to 7 working days. Do not make exceptions.',
    variantB: 'You are the returns assistant for Lumen Home, an online homeware shop. Acknowledge how the customer feels in one short sentence, then give the returns policy accurately: 30 days, unused items, original packaging, refund within 5 to 7 working days. Do not make exceptions, but explain any options that do exist.',
    criteria: ['Accuracy', 'Policy compliance', 'Empathy', 'Clarity'],
    cases: [
      {
        prompt: 'The lamp I ordered arrived broken. I want my money back.',
        a: 'Items must be returned within 30 days, unused and in original packaging. Refunds take 5 to 7 working days.',
        b: "I'm sorry it arrived broken, that's not how it should reach you. Damaged items aren't treated as normal returns: send a photo and we'll refund you in full, with no need to send it back in its packaging.",
        jab: { A: [2, 3, 1, 3], B: [5, 5, 5, 5], w: 'B', r: 'A applies the unused-item policy to a damaged delivery, which is wrong; B handles it correctly and kindly.' },
        jba: { A: [2, 3, 1, 3], B: [5, 5, 5, 5], w: 'B', r: 'B recognises a damaged item is a different case and gives the right route.' },
      },
      {
        prompt: 'I bought a rug 40 days ago and changed my mind. Can I return it?',
        a: 'Returns are accepted within 30 days of delivery. As it has been 40 days, this rug cannot be returned.',
        b: "I understand, it's frustrating when something doesn't work in the room. Our returns window is 30 days, so at 40 days we can't take it back. If it's faulty, though, that's covered separately and I can help.",
        jab: { A: [5, 5, 2, 5], B: [5, 5, 4, 5], w: 'B', r: 'Both hold the policy; B adds the faulty-item route without making an exception.' },
        jba: { A: [5, 5, 2, 5], B: [5, 5, 4, 4], w: 'B', r: 'B keeps the policy and points to the one option that still exists.' },
      },
      {
        prompt: 'How long does a refund take?',
        a: 'Refunds are processed within 5 to 7 working days of us receiving the item.',
        b: "Once we receive the item, refunds take 5 to 7 working days to reach your account.",
        jab: { A: [5, 5, 3, 5], B: [5, 5, 3, 5], w: 'Tie', r: 'Both give the same accurate answer with equal clarity.' },
        jba: { A: [5, 5, 3, 5], B: [5, 5, 3, 5], w: 'Tie', r: 'Equivalent answers; neither adds or misses anything.' },
      },
      {
        prompt: "This is ridiculous, I've been waiting 10 days for my refund!",
        a: 'Refunds take 5 to 7 working days from when we receive the item.',
        b: "I'm sorry, ten days is longer than it should be. If we received the item more than 7 working days ago, give me your order number and I'll chase the refund now.",
        jab: { A: [4, 5, 1, 3], B: [5, 5, 5, 5], w: 'B', r: 'A repeats policy at an upset customer; B acknowledges the delay and offers to chase it.' },
        jba: { A: [4, 5, 1, 3], B: [5, 5, 5, 5], w: 'B', r: 'B turns the policy into an action the customer can take.' },
      },
    ],
  }),
];
