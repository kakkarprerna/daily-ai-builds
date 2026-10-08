// Three worked examples. Each has the pasted notes and the saved model reply for them,
// so the app runs end to end without a key. The rules treat them exactly like a live read.
// Companies, people and numbers are invented.

export const EXAMPLES = [
  {
    id: 'security',
    team: 'B2B SaaS sales',
    title: 'Deals stuck at IT review',
    blurb: 'Six weeks of sales call notes. One signal goes to the roadmap, three get fixed by the field this week, and a paraphrased quote is caught.',
    form: {
      name: 'Iberia mid-market deals',
      sourceType: 'Sales call notes',
      period: 'This month',
      context: 'Expense management software for companies with 100 to 2,000 staff'
    },
    source: `Sales call notes, Iberia mid-market team, 1 Sep to 10 Oct. Product: expense management for companies with 100 to 2,000 staff.

Costa Azul Hoteles (deal €72k ARR, stage: security review) - Marta, 12 Sep
IT director will not approve anything without single sign-on. "Every new tool has to go through our Microsoft login, no exceptions." Also asked about pricing for seasonal staff: "We hire 300 people every summer and drop them in October, paying per user all year makes no sense."

Grupo Talavera Logística (deal €54k ARR) - Iván, 15 Sep
Procurement liked the demo. Blocked at IT: "No SSO means no contract, our auditors flag every separate password." CFO thought we could not handle SII VAT reporting: "We assumed you don't do SII, so we'd still need the old tool for that." We do support SII since the spring release.

Clínicas Norte (deal €38k ARR) - Marta, 19 Sep
Data protection officer asked where the data is stored. I didn't know and promised to come back. "Our DPO needs to know which country the data sits in before the next meeting." Took 4 days to get an answer from the product team. Also thought we lack SII: "Our gestoría says your tool can't send SII files."

Faro Seguros (deal €90k ARR) - Iván, 23 Sep
Biggest deal this quarter. Security questionnaire, 140 questions. Two blockers: "Single sign-on with Azure AD is a hard requirement for us." And data residency: they want written confirmation the data stays in the EU. I spent most of a day pulling answers together.

Brisa Retail (deal €61k ARR) - Lucía, 26 Sep
Ops team keen. IT asked about login: they use Okta and need users created and removed automatically when staff join or leave. Will revisit next quarter.

Ventura Foods (deal €26k ARR) - Lucía, 30 Sep
Small finance team. Asked where data is hosted: "Is the data in Spain or in the US?" Found the answer in the security pack in the shared drive, page 4: hosted in Frankfurt, EU only. Took me an hour to find it. Also: "Seasonal pickers make per-seat pricing expensive for us."

Almendra Studio (trial, €9k ARR) - Marta, 3 Oct
Design studio on a trial. "The app closes every time I photograph a receipt on my old Samsung." Only on Android 10.

Rep note, Lucía, 6 Oct: the security pack covers data residency, the SSO roadmap and SII, but most of the team doesn't know it exists.`,
    text: `SUMMARY|Mid-market deals are stalling at IT and data protection review, mostly over single sign-on, and reps are losing time on questions the security pack already answers.
SIGNAL|S1|No single sign-on|IT teams will not approve the contract without login through their own identity provider.|Winning the deal|Blocks|Build|None|Prioritise single sign-on with Microsoft and Okta, and give sales a date they can quote.|Say single sign-on is on the roadmap and offer a call with product before the security review closes. Do not promise a date until product gives one.
MENTION|S1|Costa Azul Hoteles|€72k ARR|Every new tool has to go through our Microsoft login, no exceptions
MENTION|S1|Grupo Talavera Logística|€54k ARR|No SSO means no contract, our auditors flag every separate password
MENTION|S1|Faro Seguros|€90k ARR|Single sign-on with Azure AD is a hard requirement for us
MENTION|S1|Brisa Retail|€61k ARR|They need users created and removed automatically through Okta
SIGNAL|S2|Reps cannot answer where the data is stored|Data protection officers ask where data is hosted and reps take hours or days to find the answer.|Winning the deal|Slows down|Train|Hours|Walk the sales team through the security pack on Monday's call and pin it in the sales channel.|The data is hosted in Frankfurt, in the EU only. Send page 4 of the security pack in the shared drive.
MENTION|S2|Clínicas Norte|€38k ARR|Our DPO needs to know which country the data sits in before the next meeting
MENTION|S2|Faro Seguros|€90k ARR|they want written confirmation the data stays in the EU
MENTION|S2|Ventura Foods|€26k ARR|Is the data in Spain or in the US?
SIGNAL|S3|Prospects think we cannot do SII|Finance teams believe the product cannot send SII VAT files, so they plan to keep their old tool.|Winning the deal|Slows down|Message|Minutes|Add SII VAT reporting to the product page and the Spanish pitch deck, with one line of proof.|We have supported SII VAT reporting since the spring release. Offer to show it in the next demo.
MENTION|S3|Grupo Talavera Logística|€54k ARR|We assumed you don't do SII, so we'd still need the old tool for that
MENTION|S3|Clínicas Norte|€38k ARR|Our gestoría says your tool can't send SII files
SIGNAL|S4|Per-user pricing hurts seasonal teams|Companies with large seasonal workforces see paying per user all year as poor value.|Winning the deal|Slows down|Price|Minutes|Decide whether seasonal staff can be billed by active month, and tell sales what they can offer.|Say we are reviewing pricing for seasonal teams and that you will come back with an option within two weeks.
MENTION|S4|Costa Azul Hoteles|€72k ARR|We hire 300 people every summer and drop them in October
MENTION|S4|Ventura Foods|€26k ARR|Seasonal pickers make per-seat pricing expensive for us
SIGNAL|S5|App closes on receipt photos|The mobile app closes when a user photographs a receipt on an older Android phone.|Day-to-day use|Blocks|Fix|Minutes|Reproduce the crash on Samsung phones running Android 10.|Thank them, say engineering is looking at it, and ask which phone model and app version they use.
MENTION|S5|Almendra Studio|€9k ARR|The app closes every time I photograph a receipt on my old Samsung
GAP|Whether single sign-on is already planned, and for which identity providers.
GAP|How many deals were lost to the same blockers last quarter.
GAP|Whether finance would accept billing seasonal staff by active month.
GAP|When Brisa Retail plans to revisit and who decides there.`
  },
  {
    id: 'onboarding',
    team: 'Conversational AI, customer success',
    title: 'Go-lives slipping, renewals at risk',
    blurb: 'A month of customer success notes and tickets. Operations can fix the biggest delay this week, and two renewals need a report the product cannot export.',
    form: {
      name: 'September onboarding and renewals',
      sourceType: 'Customer success notes',
      period: 'This month',
      context: 'Chatbots and voice agents for customer service teams'
    },
    source: `Customer success notes and support tickets, chatbot and voice agent accounts, September.

Autohaus Iberia (€46k ARR, onboarding week 5) - CSM Nuria
Go-live slipped again. WhatsApp templates were submitted to Meta in week 4 and two are still pending. "We were told launch in three weeks, we're now in week five waiting on WhatsApp." Voice agent keeps mishearing "Ourense" as "orense" route codes, small but customers notice.

Clínica Dental Sonrisa (€18k ARR, onboarding) - CSM Nuria
Template approval again: "Our reminder messages can't go out until Meta approves the templates." The practice manager also raised ticket #4412 to change the opening hours answer. "Every time our hours change we have to open a ticket and wait a day." The answer editor in the admin panel does this in two minutes; she was never shown it.

Banco Mirador (pilot, €150k ARR if converted) - CSM Javier
Pilot going well, but their risk team says: "Conversion to a full contract depends on running the model inside our own data centre." Nobody else has asked for on-premise.

Seguros Litoral (€84k ARR, renewal in November) - CSM Javier
Renewal call. Head of service wants a monthly report she can take to the board: "If I can't show the board containment numbers every month, renewing is hard to justify." We only have the live dashboard, no export. Also templates for claims updates stuck in Meta review for 12 days. Voice agent struggles with Galician place names: "It keeps asking callers to repeat village names."

Telco Ola (€120k ARR, renewal in December) - CSM Javier
Ticket #4470: "Need a monthly PDF of resolution rates for our steering committee, the dashboard screenshots aren't enough." Ticket #4475: agent team asked how to update the answer for the new tariff; they did not know they could edit answers themselves.

EduPlus Academy (€22k ARR, onboarding week 3) - CSM Nuria
Enrolment reminders waiting on template approval: "Half our launch plan is WhatsApp and we can't send anything yet." Admin users asked twice in Slack how to change a bot answer.

Ops note: templates are submitted to Meta only after the build is signed off, usually week 3 or 4. Meta review can take 1 to 14 days.`,
    text: `SUMMARY|Onboarding is slipping on WhatsApp template approval, and two renewals worth more than €200k depend on a monthly report the product does not export.
SIGNAL|S1|WhatsApp template approval holds go-live|Templates go to Meta only after build sign-off, so review time adds straight onto the launch date.|Getting started|Blocks|Change process|Hours|Submit WhatsApp templates in kickoff week, before the build is signed off, so Meta review runs alongside the build.|Meta review can take 1 to 14 days. Tell customers the date each template went in and that we are moving submission earlier.
MENTION|S1|Autohaus Iberia|€46k ARR|we're now in week five waiting on WhatsApp
MENTION|S1|Clínica Dental Sonrisa|€18k ARR|Our reminder messages can't go out until Meta approves the templates
MENTION|S1|Seguros Litoral|€84k ARR|templates for claims updates stuck in Meta review for 12 days
MENTION|S1|EduPlus Academy|€22k ARR|Half our launch plan is WhatsApp and we can't send anything yet
SIGNAL|S2|Admins do not know they can edit answers|Customer admins open tickets or ask in Slack to change bot answers they could edit themselves.|Day-to-day use|Slows down|Train|Minutes|Add a ten-minute answer editor walkthrough to every onboarding and send a short how-to to current admins.|Admins can change any answer in the admin panel's answer editor in about two minutes. Show them on the next call instead of taking a ticket.
MENTION|S2|Clínica Dental Sonrisa|€18k ARR|Every time our hours change we have to open a ticket and wait a day
MENTION|S2|Telco Ola|€120k ARR|they did not know they could edit answers themselves
MENTION|S2|EduPlus Academy|€22k ARR|Admin users asked twice in Slack how to change a bot answer
SIGNAL|S3|No monthly report to take to the board|Renewing customers need a monthly report of containment and resolution rates, and the product only has a live dashboard.|Renewal or reorder|Blocks|Build|Hours|Build a monthly PDF or CSV export of containment and resolution rates before the November renewal.|Tell them the monthly report has gone to product with their renewal date attached, and agree a date for an update.
MENTION|S3|Seguros Litoral|€84k ARR|If I can't show the board containment numbers every month, renewing is hard to justify
MENTION|S3|Telco Ola|€120k ARR|Need a monthly PDF of resolution rates for our steering committee
SIGNAL|S4|Voice agent mishears Galician place names|The voice agent struggles with place names in Galicia and asks callers to repeat them.|Day-to-day use|Slows down|Fix|None|Add Galician place names to the voice agent's vocabulary and test them on recorded calls.|Say it is logged with examples and ask them to send any place names it misses.
MENTION|S4|Autohaus Iberia|€46k ARR|Voice agent keeps mishearing Ourense
MENTION|S4|Seguros Litoral|€84k ARR|It keeps asking callers to repeat village names
SIGNAL|S5|Pilot needs on-premise to convert|A bank pilot will only become a full contract if the model runs in their own data centre.|Winning the deal|Blocks|Build|None|Tell the account team whether on-premise is possible this year, yes or no.|Say the request is with product and agree when you will give their risk team an answer.
MENTION|S5|Banco Mirador|€150k ARR if converted|Conversion to a full contract depends on running the model inside our own data centre
GAP|How many other renewals in the next two quarters expect a monthly report.
GAP|How long Meta review usually takes for these template types.
GAP|Whether Banco Mirador would accept a private cloud instead of on-premise.
GAP|How many current admins have already been shown the answer editor.`
  },
  {
    id: 'field',
    team: 'Food producer, field sales',
    title: 'Promotions without stock',
    blurb: 'Two weeks of shop visit reports. Monthly order values become yearly figures, operations owns the top fix, and the order app goes to engineering.',
    form: {
      name: 'Jaén and Córdoba shop visits',
      sourceType: 'Field visit reports',
      period: 'Last 2 weeks',
      context: 'Extra virgin olive oil sold to independent shops and small supermarkets'
    },
    source: `Field visit reports, Jaén and Córdoba route, 22 Sep to 3 Oct. Product: Olivar del Sur extra virgin olive oil, sold to independent shops and small supermarkets.

Supermercado El Olivo, Jaén (orders about €2,400 a month) - rep Antonio, 22 Sep
Autumn promotion started on the 20th but the promo pallets arrived on the 24th. "Customers asked for the offer and the shelf was empty for four days." I drove two cases over from the depot myself. Owner asked for smaller cases: "Twelve bottles of the 1 litre is too much for my shelf."

Ultramarinos Paco, Úbeda (orders about €900 a month) - rep Antonio, 23 Sep
"The promotion leaflets came before the oil did." Order app failed again with no signal in the back room. I wrote the order on paper and typed it in that evening.

Mercado Central stall 14, Córdoba (orders about €1,300 a month) - rep Carmen, 25 Sep
Stall owner wants 6-bottle cases: "Half a case would sell, a full case sits for weeks." Asked about the new margin terms. I quoted the old 18% and found out later it's 20% from October.

Frutas Rocío, Linares (orders about €650 a month) - rep Carmen, 26 Sep
Promo stock late again: "Second promotion in a row where the stock came after the start date." Order app would not sync, lost the order and had to call it in.

Covirán Baeza (orders about €3,100 a month) - rep Antonio, 29 Sep
Store manager confused by margin: "Your colleague said 18% but the email says 20%." Display stand arrived with a broken shelf.

Tienda Gourmet Sur, Granada (orders about €1,100 a month) - rep Carmen, 1 Oct
Promo pallets came three days late. "We printed our own promotion signs and then had nothing to sell." Asked for 6-bottle cases of the premium oil.

Rep note, Carmen, 3 Oct: the order app needs signal to send. In rural shops I lose 20 minutes per visit retyping orders later.`,
    text: `SUMMARY|Promotions are starting before the stock reaches the shop, and reps are losing time to an order app that needs signal and to margin terms nobody briefed them on.
SIGNAL|S1|Promotion stock arrives after the promotion starts|Promotion pallets reach shops days after the start date, so shelves are empty while the offer runs.|Renewal or reorder|Blocks|Change process|Hours|Ship promotion stock to independent shops at least five days before each promotion start date.|Apologise for the late stock and confirm the delivery date for the next promotion before it starts.
MENTION|S1|Supermercado El Olivo|about €2,400 a month|Customers asked for the offer and the shelf was empty for four days
MENTION|S1|Ultramarinos Paco|about €900 a month|The promotion leaflets came before the oil did
MENTION|S1|Frutas Rocío|about €650 a month|Second promotion in a row where the stock came after the start date
MENTION|S1|Tienda Gourmet Sur|about €1,100 a month|We printed our own promotion signs and then had nothing to sell
SIGNAL|S2|Order app needs signal to send|The order app fails in shops without mobile signal, so reps retype or phone in orders.|Renewal or reorder|Slows down|Fix|Minutes|Let the order app save orders offline and send them when signal returns.|Until the fix, write the order down and send it from the car the same day, once you have signal.
MENTION|S2|Ultramarinos Paco|about €900 a month|Order app failed again with no signal in the back room
MENTION|S2|Frutas Rocío|about €650 a month|lost the order and had to call it in
SIGNAL|S3|Shops want 6-bottle cases|Smaller shops find 12-bottle cases too big for their shelves and slow to sell.|Renewal or reorder|Annoyance|Build|None|Cost a 6-bottle case for the 1 litre and premium lines.|Say the request is with the product team and note which lines each shop wants.
MENTION|S3|Supermercado El Olivo|about €2,400 a month|Twelve bottles of the 1 litre is too much for my shelf
MENTION|S3|Mercado Central stall 14|about €1,300 a month|Half a case would sell, a full case sits for weeks
MENTION|S3|Tienda Gourmet Sur|about €1,100 a month|Asked for 6-bottle cases of the premium oil
SIGNAL|S4|Reps quote the old margin|Reps were not briefed on the October margin terms and are quoting the old figure.|Renewal or reorder|Slows down|Train|Minutes|Brief every rep on the October margin terms this week and send a one-page sheet they can show shops.|The margin is 20% from October. If you quoted 18%, call the shop and correct it.
MENTION|S4|Mercado Central stall 14|about €1,300 a month|I quoted the old 18% and found out later it's 20% from October
MENTION|S4|Covirán Baeza|about €3,100 a month|Your colleague said 18% but the email says 20%
SIGNAL|S5|Display stand damaged in transit|A display stand reached a shop with a broken shelf.|Day-to-day use|Annoyance|Change process|None|Check how display stands are packed for transport.|Apologise and arrange a replacement shelf.
MENTION|S5|Covirán Baeza|about €3,100 a month|Display stand arrived with a broken shelf
GAP|Why promotion stock ships late: warehouse timing, transport or order cut-off.
GAP|How many other routes have shops without signal.
GAP|Whether a 6-bottle case is possible at the current price.
GAP|Whether any shop has cut its order because of the late stock.`
  }
];
