// Three saved runs: inputs plus the model's tagged-line report.

export const EXAMPLES = [
  {
    id: 'broadband',
    title: 'The empty handoff',
    channel: 'Chat',
    sector: 'Telco',
    blurb: 'The bot gathers everything, asks for the account number twice, then hands over with a one-line note. The customer starts again.',
    transcript: `AI: Hi, I'm Nova, the virtual assistant. What can I help with today?
Customer: My broadband has been down since yesterday evening. It went off during the storm and hasn't come back.
AI: Sorry to hear that. Could you give me your account number so I can check your line?
Customer: It's 4471 2093 88.
AI: Thanks. Have you tried restarting your router?
Customer: Yes, twice last night and again this morning. All the lights are on except the internet one, which is red.
AI: Thanks for trying that. I can see there are no reported outages in your area right now.
Customer: There must be something, my neighbour's is down too. I work from home and I've lost a full morning already.
AI: I understand. Can you confirm your account number for me?
Customer: I just gave it to you. 4471 2093 88. Can I please speak to a person?
AI: Let me try a line test first. The test could not complete.
Customer: Please just put me through to someone.
AI: Of course. I'm transferring you to an agent now.`,
    note: 'Customer needs help with internet.',
    report: `FACT: Partial | Broadband down since yesterday evening, after the storm | Note says "help with internet" with no detail
FACT: Missing | Account number 4471 2093 88 | Not in the note
FACT: Missing | Router restarted three times; internet light is red | Not in the note
FACT: Missing | Neighbour also without service, suggesting a local fault | Not in the note
FACT: Missing | Line test failed to complete | Not in the note
FACT: Missing | Works from home, has already lost a morning, asked for a person twice | No sign of urgency in the note
REDUNDANT: Can you confirm your account number for me? | Customer gave the account number in their second message
TIMING: Late | The customer asked for a person twice and the bot ran another failed test before handing over.
URGENCY: Not flagged | The customer said they work from home and had lost a morning, and the note says nothing of it.
SUMMARY: The bot collected almost everything the agent needs and passed on none of it. The human will have to ask for the account number a third time.
FIX: Make the handoff note a template with required fields: reference number, issue, steps already tried, test results, urgency.
FIX: Hand over on the first request for a person once basic checks are done, instead of running another test.
FIX: Keep identifiers the customer has given in session memory so the bot never asks for them again.
NOTE: Account 4471 2093 88. Broadband down since yesterday evening, started during the storm.
NOTE: Router restarted three times. All lights on except internet, which is red.
NOTE: Line test from chat failed to complete. No outage showing, but the customer says a neighbour is also down.
NOTE: Works from home and has lost a morning. Asked for a person twice. Please lead with a fix time or an engineer slot.`,
  },
  {
    id: 'billing',
    title: 'The clean handoff',
    channel: 'Chat',
    sector: 'SaaS',
    blurb: 'A double charge, handled properly. The bot checks what it can, hands over at the right moment and writes a note the agent can act on.',
    transcript: `AI: Hello, you're chatting with the Ledgerly assistant. How can I help?
Customer: I've been charged twice for my March invoice. Workspace is northwind-design, the email on the account is ana@northwind.studio.
AI: Thanks, Ana. I can see two payments of €49 on 3 March against invoice INV-20931. Is that what you're seeing on your card statement too?
Customer: Yes, both have gone through, they're not pending.
AI: Understood. Refunds for duplicate payments need a member of our billing team to approve. Would you like the refund back to the same card?
Customer: Yes please, same card.
AI: I'll pass this to billing now with everything they need, so you won't need to repeat it. A person will reply here, usually within two working hours.
Customer: Great, thanks.`,
    note: `Duplicate payment, refund requested.
Workspace: northwind-design. Contact: ana@northwind.studio.
Invoice INV-20931, two payments of €49 on 3 March, both settled on the customer's card (not pending).
Customer wants the duplicate refunded to the same card.
Customer is calm. Told to expect a reply within two working hours.`,
    report: `FACT: Carried | Charged twice for the March invoice | Note opens with "Duplicate payment"
FACT: Carried | Workspace northwind-design, email ana@northwind.studio | Both in the note
FACT: Carried | Invoice INV-20931, two €49 payments on 3 March | Stated in full
FACT: Carried | Both payments settled, not pending | Stated
FACT: Carried | Wants the refund to the same card | Stated
FACT: Partial | Customer was promised a reply within two working hours | Mentioned, but not as a deadline the agent has to meet
TIMING: Appropriate | The bot confirmed the duplicate itself and handed over only for the approval it cannot give.
URGENCY: None to flag | The customer was calm and set no deadline of their own.
SUMMARY: A handoff the agent can act on in one step. Nothing was asked twice and every identifier made it into the note.
FIX: Put any promised response time at the top of the note as a due-by time, so it is visible in the agent's queue.
NOTE: DUE BY: within two working hours of handoff, as promised to the customer.
NOTE: Duplicate payment on invoice INV-20931: two settled payments of €49 on 3 March.
NOTE: Workspace northwind-design, contact ana@northwind.studio.
NOTE: Refund the duplicate to the original card. Customer is calm.`,
  },
  {
    id: 'rebooking',
    title: 'Close, but the frustration got lost',
    channel: 'Voice',
    sector: 'Travel',
    blurb: 'A voice agent passes on the booking and the cancellation, asks for the reference twice, and leaves out that this is the customer\'s third call.',
    transcript: `AI: Thanks for calling Brisa Air. I'm the automated assistant. How can I help?
Customer: My flight tomorrow morning to Lisbon has been cancelled and I need to get there the same day. Booking reference K7T4QZ.
AI: Thank you. I can see flight BR 312 from Málaga to Lisbon at 07:40 tomorrow is cancelled. I'm sorry about that.
Customer: I tried rebooking in the app but it only offers Thursday. I have a meeting at four tomorrow afternoon.
AI: I understand you need to arrive tomorrow. Let me look at alternatives.
Customer: This is the third time I've called today. Last time I was cut off after twenty minutes.
AI: I'm sorry about that. To search for flights, could you tell me your booking reference?
Customer: K7T4QZ. I gave it to you at the start.
AI: Thank you. Same-day options need an agent to rebook on a partner airline. I'll connect you now.`,
    note: `Booking K7T4QZ. BR 312 AGP to LIS 07:40 tomorrow cancelled.
Customer needs to arrive in Lisbon tomorrow; check same-day partner options.
Meeting at 16:00.`,
    report: `FACT: Carried | Booking reference K7T4QZ | In the note
FACT: Carried | BR 312 Málaga to Lisbon, 07:40 tomorrow, cancelled | In the note
FACT: Carried | Must arrive in Lisbon tomorrow | In the note
FACT: Carried | Meeting at 16:00 tomorrow | In the note
FACT: Missing | App rebooking only offers Thursday | Not mentioned, so the agent may suggest the app
FACT: Missing | Third call today, cut off once after twenty minutes | Not mentioned
REDUNDANT: could you tell me your booking reference? | Customer gave the reference in their first sentence
TIMING: Appropriate | Same-day partner rebooking needs an agent, and the bot handed over once that was clear.
URGENCY: Not flagged | The meeting time is there, but not that this is a third call after being cut off.
SUMMARY: The facts about the flight made it through. The two things that shape how the agent should open, that the app failed and the customer is on a third call, did not.
FIX: Add "already tried" and "contact history today" lines to the voice handoff template.
FIX: Stop the bot asking for a reference it has already read back to the customer.
NOTE: Third call today, cut off once after twenty minutes. Open with an apology and do not transfer again.
NOTE: Booking K7T4QZ. BR 312 Málaga to Lisbon 07:40 tomorrow, cancelled.
NOTE: Needs to land in Lisbon in time for a 16:00 meeting tomorrow.
NOTE: App only offers Thursday, so check same-day partner flights directly.`,
  },
];
