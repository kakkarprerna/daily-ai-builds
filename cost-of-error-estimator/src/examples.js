// Three saved runs: the setup plus the model's tagged-line estimate.

export const EXAMPLES = [
  {
    id: 'saas',
    title: 'The rare one that costs the most',
    product: 'Support chatbot',
    currency: 'USD',
    blurb: 'A B2B support bot. Forty wrong refund answers a month look like the problem, until one privacy slip outweighs everything else.',
    context: 'B2B SaaS customer support chatbot for a mid-market platform. About 8,000 monthly active users, $4,800 average annual contract value, support team of 6, customers in the US and EU.',
    contactCost: '22',
    customerValue: '4800',
    categories: [
      { name: 'Confidently wrong refund answer', frequency: 40, description: 'Bot states the wrong refund policy with full confidence; a human agent steps in after the customer complains.' },
      { name: 'Missed escalation', frequency: 25, description: "Bot doesn't recognise repeated frustration and never hands off to a human agent." },
      { name: 'Hallucinated integration status', frequency: 15, description: 'Bot tells an enterprise user an integration is live when it is not, which turns into an account escalation.' },
      { name: "Shows another customer's ticket details", frequency: 1, description: "Retrieval pulls in a different customer's support history and the bot quotes from it." },
    ],
    report: `COST: 1 | 35 | 90 | High | agent time to correct; repeat contact; small refund goodwill | Mostly 20 to 40 minutes of agent time plus the occasional goodwill credit to calm the customer.
COST: 2 | 60 | 220 | Medium | longer recovery contact; churn risk on $4,800 contracts | Frustration left unhandled raises cancellation risk; a few per hundred tipping into churn drives the high end.
COST: 3 | 150 | 600 | Medium | account manager time; delayed rollout; deal risk at renewal | Enterprise users plan work around integrations, so a false "live" creates escalations and renewal friction.
COST: 4 | 8000 | 40000 | Low | breach assessment and notification; legal review; churn of both accounts | A cross-customer disclosure is likely a reportable personal data breach in the EU, with legal and trust costs.
ASSUMPTION: Agent time is costed at about $45 an hour loaded, consistent with $22 per contact.
ASSUMPTION: Roughly 3% of customers hit by a missed escalation go on to cancel.
ASSUMPTION: The ticket leak involves personal data of EU users, which brings GDPR breach duties into play.
WATCH: Regulatory fines for the data leak are left out; they are rare but could exceed every other figure here.
WATCH: Public reviews mentioning the bot can slow new sales in ways these figures do not capture.
SUMMARY: The once-a-month data leak carries about two thirds of the total exposure. Fix retrieval isolation before tuning refund answers, even though refund errors are forty times more frequent.`,
  },
  {
    id: 'utility',
    title: 'Missing a vulnerable customer',
    product: 'Support chatbot',
    currency: 'EUR',
    blurb: 'A Spanish energy supplier\'s chatbot. Tariff mix-ups are constant and cheap; three missed vulnerable customers a month are not.',
    context: 'Customer support chatbot for an electricity and gas supplier in Spain with about 120,000 household customers. Handles bills, tariffs, meter readings and payment plans in Spanish and English.',
    contactCost: '4.50',
    customerValue: '780',
    categories: [
      { name: 'Wrong tariff explanation', frequency: 300, description: 'Explains time-of-use periods or prices incorrectly, so the customer calls to check.' },
      { name: 'Gives the wrong payment due date', frequency: 40, description: 'States a later due date than the real one; some customers pay late and complain about fees.' },
      { name: 'Fails to spot a vulnerable customer', frequency: 3, description: 'Customer mentions inability to pay or a medical device at home; bot does not route them to the protected-customer process before a supply cut-off.' },
      { name: 'Wrong meter reading guidance', frequency: 150, description: 'Tells the customer to read the wrong figure on a digital meter, causing an estimated bill dispute.' },
    ],
    report: `COST: 1 | 3 | 9 | High | repeat call to contact centre; agent time | One extra call at €4.50, occasionally two, with little lasting harm.
COST: 2 | 25 | 80 | High | late fee reversals; complaint handling; repeat contacts | Most cases end in a fee reversal and a complaint call; a few go to a formal written complaint.
COST: 3 | 2000 | 15000 | Low | formal complaint to the consumer authority; reconnection and compensation; reputational risk | Spanish rules protect vulnerable consumers from cut-offs, so a missed case can lead to regulatory complaints and compensation.
COST: 4 | 4 | 12 | High | bill dispute handling; re-billing | A short dispute and a corrected bill, rarely escalating further.
ASSUMPTION: Contact centre cost of €4.50 per call applies to every repeat contact.
ASSUMPTION: About one in ten late-paying customers files a written complaint.
ASSUMPTION: A missed vulnerable customer leads to a cut-off or a near miss in a meaningful share of cases.
WATCH: Press coverage of a cut-off affecting a vulnerable household could cost far more than the figures here.
SUMMARY: Three missed vulnerable customers a month outweigh 300 tariff errors many times over. Build a hard rule that routes any mention of inability to pay or medical equipment to a person.`,
  },
  {
    id: 'returns',
    title: 'Frequent and medium beats rare',
    product: 'Returns assistant',
    currency: 'GBP',
    blurb: 'A UK online shop\'s returns assistant. Here the everyday mistake, approving returns outside policy, is the one to fix first.',
    context: 'Returns and refunds assistant for a UK fashion retailer with about 40,000 orders a month. Average order value £68. Customers chat in the app and on the website.',
    contactCost: '3.80',
    customerValue: '210',
    categories: [
      { name: 'Approves a return outside policy', frequency: 200, description: 'Accepts returns after the 30-day window or on final-sale items; the warehouse processes the refund.' },
      { name: 'Wrong refund timeline', frequency: 500, description: 'Says refunds take 2 days when they take 5 to 7; customers contact support asking where their money is.' },
      { name: 'Invents a discount code', frequency: 30, description: 'Offers a code that does not exist to calm an unhappy customer.' },
      { name: 'Refuses a valid faulty-item return', frequency: 12, description: 'Wrongly tells a customer a faulty item cannot be returned, despite their statutory rights.' },
    ],
    report: `COST: 1 | 8 | 30 | High | refund on unsellable or late stock; return shipping; handling | Part of the stock cannot be resold at full price, plus shipping and warehouse handling.
COST: 2 | 2 | 6 | High | follow-up contact; agent time | One extra contact at £3.80, sometimes two.
COST: 3 | 10 | 40 | Medium | honouring the discount; complaint if refused | Most retailers honour it to avoid a complaint; the rest generate a contact and some ill will.
COST: 4 | 60 | 400 | Medium | chargeback; complaint escalation; negative review; customer loss | Refusing a statutory right invites chargebacks and complaints, and some of these customers do not return.
ASSUMPTION: About half of out-of-policy returns arrive in a condition that cannot be resold at full price.
ASSUMPTION: A refused faulty-item customer is worth £210 a year and around a third stop buying.
ASSUMPTION: Invented codes are honoured four times out of five.
WATCH: Repeated refusals of statutory rights could draw attention from Trading Standards.
SUMMARY: Out-of-policy approvals cost the most each month because they are frequent and each one loses stock value. Check the return date and sale status in code before the bot can approve anything.`,
  },
];
