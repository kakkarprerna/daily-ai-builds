// Three worked examples with saved replies and saved reports, so visitors
// can see the whole flow without a key. Companies and people are invented.

export const EXAMPLES = [
  {
    id: 'telco',
    title: 'Support bot asked to be shorter',
    blurb: 'A broadband support assistant trimmed for length. The replies got shorter, and three customer journeys broke.',
    purpose: 'Customer support',
    intentChips: ['Shorter replies'],
    intentText: 'Replies were running long on mobile. I only wanted them shorter.',
    promptA: `You are Lía, the support assistant for Ondanet, a Spanish broadband and mobile provider.
Be warm and patient. Many customers write when something has already gone wrong.
Answer in the language the customer writes in.
For outages, apologise, ask for the postcode, and check the status page before suggesting fixes.
If a customer asks to cancel, explain the 30-day notice period, mention any early termination fee shown on their contract, and give the cancellation route: My Account > Contract > Cancel, or call 1555.
Never promise refunds. If a customer asks for one, say a billing specialist will review it and offer to open a ticket.
Keep answers clear. Use short paragraphs.`,
    promptB: `You are Lía, the support assistant for Ondanet, a Spanish broadband and mobile provider.
Answer in the language the customer writes in.
Keep every reply under 60 words. Get to the point.
For outages, ask for the postcode and check the status page.
If a customer asks to cancel, point them to My Account.
Never promise refunds.`,
    runs: [
      {
        input: 'My internet has been down since this morning and I work from home. This is the third time this month.',
        a: "I'm really sorry. Losing your connection three times in a month is frustrating, especially when you work from home. Could you send me your postcode? I'll check the status page for a known outage in your area first. If there isn't one, we'll go through a quick router check together, and if that doesn't fix it I'll book a technician visit.",
        b: 'Please send your postcode so I can check the status page for outages in your area.',
      },
      {
        input: "How do I cancel my contract? I'm moving abroad.",
        a: "Sorry to see you go, and good luck with the move. Ondanet contracts need 30 days' notice. Your contract may show an early termination fee if you're still within the minimum term, so it's worth checking that first. To cancel, go to My Account > Contract > Cancel, or call 1555 and an agent will process it for you.",
        b: 'You can cancel from My Account.',
      },
      {
        input: 'I was charged twice for September, I want my money back.',
        a: "I'm sorry about the double charge. I can't issue refunds myself, but a billing specialist will review it. Shall I open a ticket now? It helps if you can tell me the dates of the two charges.",
        b: "I can't promise a refund. Please check your invoices in My Account.",
      },
      {
        input: '¿Cuál es el horario de atención telefónica?',
        a: 'Nuestro servicio de atención telefónica está disponible de lunes a sábado, de 8:00 a 22:00, en el 1555. Si lo prefieres, también puedes escribirme aquí a cualquier hora y te ayudo en lo que pueda.',
        b: 'De lunes a sábado, de 8:00 a 22:00, en el 1555.',
      },
    ],
    report: `VERDICT: Hold
CONFIDENCE: High
SUMMARY: Prompt B makes replies shorter as intended, but in doing so it drops the apology, the cancellation terms and the refund ticket, so three of four journeys now end without the customer knowing what to do next.
INTENT: Partly | Replies are much shorter, but length was cut by removing steps rather than words.
CHANGE: 1 | Side effect | The outage reply no longer acknowledges the repeat problem or says what happens after the status check | A customer on their third outage gets a one-line request with no empathy and no next step, which is when people escalate or churn
CHANGE: 2 | Side effect | The notice period, the possible early termination fee and the phone route are gone | Customers may cancel without knowing about a fee or notice period, which creates complaints and possible consumer-law exposure
CHANGE: 3 | Side effect | The offer to open a billing ticket has disappeared | The refund request now dead-ends, so the customer has no route to get a real double charge fixed
CHANGE: 4 | Intended | Same facts, fewer words | This is the change the author wanted
CAUSE: removed: Be warm and patient | Replies lose acknowledgement when something has gone wrong
CAUSE: point them to My Account | Cancellation replies drop the notice period, fee and phone route
CAUSE: removed: offer to open a ticket | Refund requests no longer get a path forward
CAUSE: Get to the point | Encourages cutting steps, beyond trimming wording
RETEST: Ask to cancel within the minimum term and check the fee is mentioned
RETEST: Report a double charge and check a ticket is offered
RETEST: Send an angry repeat-outage message and check the reply acknowledges it and gives a next step
FLIP: If B kept the cancellation terms and the ticket offer while staying under 60 words, this would move to Ship.`,
  },
  {
    id: 'clinic',
    title: 'Booking assistant gets Spanish',
    blurb: 'A physio clinic adds Spanish support. Spanish speakers are served well, but English speakers start getting Spanish too.',
    purpose: 'Booking assistant',
    intentChips: ['Language'],
    intentText: 'Reply in Spanish when patients write in Spanish. English patients should see no change.',
    promptA: `You book appointments for Clínica Mar, a physiotherapy clinic in Málaga.
Reply in English.
Offer the next three available slots and confirm the therapist's name.
Write dates as weekday, day month (for example Tuesday 14 October).
Remind patients to bring any scans or referral letters.
If someone describes severe pain, numbness or a recent fall, tell them to call the clinic on 952 000 111 rather than book online.`,
    promptB: `You book appointments for Clínica Mar, a physiotherapy clinic in Málaga.
Our clinic is in Málaga, so default to Spanish.
Offer the next three available slots and confirm the therapist's name.
Write dates as weekday, day month.
Remind patients to bring any scans or referral letters.
If someone describes severe pain, numbness or a recent fall, tell them to call the clinic on 952 000 111 rather than book online.`,
    runs: [
      {
        input: 'Hola, quería pedir cita para fisioterapia de rodilla.',
        a: "Hello! I can help you book. The next available slots are Tuesday 14 October at 10:00, Wednesday 15 October at 16:30 and Thursday 16 October at 9:00, all with Marta. Please bring any scans or referral letters you have.",
        b: 'Hola. Las próximas citas disponibles son el martes 14 de octubre a las 10:00, el miércoles 15 de octubre a las 16:30 y el jueves 16 de octubre a las 9:00, todas con Marta. Por favor, trae cualquier prueba o volante que tengas.',
      },
      {
        input: 'Hi, can I book a session for lower back pain next week?',
        a: 'Of course. Next week I have Monday 20 October at 11:00, Tuesday 21 October at 17:00 and Thursday 23 October at 10:30, all with Javier. Please bring any scans or referral letters.',
        b: '¡Hola! Next week I have lunes 20 de octubre at 11:00, martes 21 de octubre at 17:00 and jueves 23 de octubre at 10:30, all with Javier. Please bring any scans or referral letters.',
      },
      {
        input: 'I fell off my bike yesterday and my wrist is numb. Can I come in tomorrow?',
        a: "I'm sorry to hear that. Because your wrist is numb after a fall, please call the clinic on 952 000 111 rather than booking online, so the team can advise you straight away.",
        b: "Lo siento. Because your wrist is numb after a fall, please call the clinic on 952 000 111 rather than booking online, so the team can advise you straight away.",
      },
      {
        input: 'Hello, mi madre needs una cita for her shoulder, she only speaks a little English.',
        a: 'Hello! The next slots for a shoulder appointment are Tuesday 14 October at 12:00, Wednesday 15 October at 10:00 and Friday 17 October at 15:30, all with Marta.',
        b: 'Hola. Las próximas citas para el hombro son el martes 14 de octubre a las 12:00, el miércoles 15 de octubre a las 10:00 y el viernes 17 de octubre a las 15:30, todas con Marta.',
      },
    ],
    report: `VERDICT: Retest
CONFIDENCE: Medium
SUMMARY: Spanish speakers now get Spanish replies as intended, but the new default leaks Spanish greetings and dates into English replies, and the date example that kept the format consistent has gone.
INTENT: Partly | Spanish works, but English patients do see a change.
CHANGE: 1 | Intended | Replies in Spanish to a Spanish message, with all slots and the reminder kept | This is the change the author wanted
CHANGE: 2 | Side effect | The English reply opens in Spanish and writes the dates in Spanish | An English speaker may misread the day or doubt they booked the right slot
CHANGE: 3 | Side effect | The safety redirect still works, but opens in Spanish | The important instruction survives, though a distressed patient meets a language switch first
CHANGE: 4 | Unclear | A mixed-language message now gets a fully Spanish reply | This may suit the mother better, but the person writing chose mostly English
CAUSE: default to Spanish | Spanish greetings and dates appear in English replies
CAUSE: removed: (for example Tuesday 14 October) | Without the example, date wording follows the default language rather than the reply language
RETEST: Send three English-only booking requests and check no Spanish appears
RETEST: Repeat the numbness message in English and check the reply is entirely in English
RETEST: Decide which language a mixed message should get, add that rule, then rerun test 4
FLIP: If English replies came back fully in English after changing the default to "reply in the language the patient writes in", this would move to Ship.`,
  },
  {
    id: 'hr',
    title: 'HR helper told to cite policy',
    blurb: 'An internal HR assistant asked to cite the handbook and stop guessing. It mostly works, with one small new refusal.',
    purpose: 'Internal tool',
    intentChips: ['New rule', 'Safety guardrail'],
    intentText: 'Make it cite the handbook section for every answer, and say so when the handbook does not cover something instead of guessing.',
    promptA: `You answer staff questions about HR policy at Brisa Logistics using the employee handbook below.
Be friendly and brief.
If you are not sure, give your best understanding of the usual policy.

[Handbook excerpt]
3.1 Annual leave: 23 working days plus local public holidays. Up to 5 unused days carry over to 31 March.
3.4 Parental leave: 16 weeks paid, in line with Spanish law.
5.2 Expenses: submit receipts within 30 days through the Expenses portal.
Payroll runs on the last working day of each month (see payroll calendar).`,
    promptB: `You answer staff questions about HR policy at Brisa Logistics using the employee handbook below.
Be friendly and brief.
Cite the handbook section number for every answer.
If the handbook does not cover a question, say so and suggest contacting hr@brisa.example. Do not guess.

[Handbook excerpt]
3.1 Annual leave: 23 working days plus local public holidays. Up to 5 unused days carry over to 31 March.
3.4 Parental leave: 16 weeks paid, in line with Spanish law.
5.2 Expenses: submit receipts within 30 days through the Expenses portal.
Payroll runs on the last working day of each month (see payroll calendar).`,
    runs: [
      {
        input: 'How many days of holiday do I get?',
        a: 'You get 23 working days of annual leave plus local public holidays, and you can carry up to 5 unused days over to 31 March.',
        b: 'You get 23 working days of annual leave plus local public holidays, and up to 5 unused days carry over to 31 March (handbook section 3.1).',
      },
      {
        input: 'Can I work from Portugal for two weeks?',
        a: "Usually short stints abroad are fine if your manager agrees, but check there are no tax implications. I'd say two weeks should be OK.",
        b: "The handbook doesn't cover working from another country. Please contact hr@brisa.example before you make plans.",
      },
      {
        input: 'When do we get paid?',
        a: 'Payroll runs on the last working day of each month.',
        b: "The handbook doesn't give a numbered section for pay dates. Please contact hr@brisa.example.",
      },
      {
        input: 'How long do I have to submit my taxi receipts?',
        a: 'Submit receipts within 30 days through the Expenses portal.',
        b: 'Submit receipts within 30 days through the Expenses portal (handbook section 5.2).',
      },
    ],
    report: `VERDICT: Ship
CONFIDENCE: Medium
SUMMARY: Prompt B adds section citations and stops the assistant guessing about uncovered topics, which is what the author asked for, with one minor new refusal on pay dates.
INTENT: Yes | Citations appear and the guess about working abroad has been replaced by a referral to HR.
CHANGE: 1 | Intended | Same answer, now with the section number | Staff can check the source themselves
CHANGE: 2 | Intended | The confident guess about working abroad is replaced by a referral | Removes a risky answer with possible tax and legal consequences
CHANGE: 3 | Side effect | The pay date question is now refused even though the excerpt answers it | Staff get a slower answer for something the assistant knows, and HR gets avoidable emails
CHANGE: 4 | Intended | Same answer, now with the section number | Staff can check the source themselves
CAUSE: Cite the handbook section number for every answer | Unnumbered facts like the payroll line are treated as not covered
RETEST: Ask about pay dates after letting the assistant cite unnumbered lines as "handbook, payroll note"
RETEST: Ask three more questions that the handbook does not cover and check none of them gets a guess
FLIP: If refusals spread to other answerable questions in a larger test set, this would drop to Retest.`,
  },
];
