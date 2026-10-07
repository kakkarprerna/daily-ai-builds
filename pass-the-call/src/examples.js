// Three worked examples with saved model output, so the app works without a key.
// Each one runs through the same rules as a live plan.

export const EXAMPLES = [
  {
    id: 'rides',
    team: 'Ride-hailing',
    title: 'Rider support line',
    blurb: 'A city ride app moving its rider phone line to a voice agent. Late drivers, fares, lost items and the rare safety call.',
    form: {
      name: 'Rider support line',
      callers: 'Riders of a ride-hailing app, often calling from the street or just after a trip',
      handles: 'Riders ring about a driver who is late or has not turned up, a fare that looks wrong, something left in the car, a blocked account, changing how they pay, and occasionally something that went wrong on the ride itself. The agent can look up trips, driver location and fare breakdowns in the trip system, and can raise a lost item report. Business riders sometimes ask for VAT invoices, which only the accounts team can issue. Refunds above the fare adjustment limit and account unblocks are done by the support team.',
      coverage: 'Staffed 24/7',
      delivery: 'Live transfer with on-screen summary',
      callerLanguages: ['Spanish', 'English', 'German'],
      agentLanguages: ['Spanish', 'English'],
      constraints: ['Personal data', 'Card payments on the call'],
      systems: ['Trip system', 'CRM', 'Payments']
    },
    text: `SUMMARY|Most rider calls are quick lookups the agent can close, but fares, lost items and blocked accounts need a person with the facts already gathered, and safety calls go straight over.
MOMENT|Driver late or not showing|Know where the driver is or cancel without a fee|Information only|Frustrated|Light|Fully|Short and predictable|Common|Trip system
MOMENT|Fare looks wrong|Get the difference refunded|Money|Frustrated|Light|Partly|Varied|Common|Trip system, Payments
MOMENT|Left something in the car|Get the item back from the driver|A booking or record|Upset or anxious|Light|Partly|Varied|Occasional|Trip system, CRM
MOMENT|Account blocked|Get back into the app before the next trip|A booking or record|Frustrated|Strong|No|Varied|Occasional|CRM
MOMENT|Something went wrong on the ride|Report a driver's behaviour or an accident|Safety or wellbeing|Upset or anxious|Light|No|Long story|Rare|CRM
MOMENT|Change how I pay|Swap the card or payment method on file|A booking or record|Calm|Strong|Fully|Short and predictable|Occasional|Payments
MOMENT|Invoice for a business trip|A VAT invoice for expenses|Information only|Calm|None|No|Short and predictable|Occasional|CRM
SIGNAL|2|The amount in dispute is above the fare adjustment limit
SIGNAL|2|The caller says they were charged twice for one trip
SIGNAL|3|The item is a phone, wallet, keys or medicine
SIGNAL|4|The caller mentions an upcoming trip they need within the hour
SIGNAL|6|The caller starts to read out a card number
FIELD|2|Trip id and date|Required
FIELD|2|Fare charged and fare expected|Required
FIELD|2|What the agent already adjusted, if anything|Required
FIELD|3|Trip id and drop-off point|Required
FIELD|3|Item description|Required
FIELD|3|Best number to reach the rider|Useful
FIELD|4|Message shown in the app when the account blocked|Required
FIELD|4|Last successful trip date|Useful
FIELD|5|Trip id if the caller has it|Useful
FIELD|5|Whether the caller is safe right now|Required
FIELD|7|Trip ids or date range|Required
FIELD|7|Company name and tax number for the invoice|Required
FIELD|7|Email to send it to|Useful
LINE|2|I can see the trip and the fare. A refund of this size needs a colleague to approve it, so I am passing you over now with the details, and you will not need to repeat them.
LINE|3|I have logged the item against your trip. I am putting you through to the team who contact drivers, and they already have the trip and what you left.
LINE|4|Unblocking an account is done by our support team. I have checked who you are, so I am passing you over now and they will see that.
LINE|5|Thank you for telling us. I am putting you through to a person right now.
LINE|6|Your new card is saved and will be used from your next trip. Is there anything else I can help with, or would you like to speak to someone?
LINE|7|Invoices are issued by our accounts team. I have noted the trips and the company details, so I am passing you over and they will not need to ask again.
QUESTION|What is the largest fare adjustment the agent is allowed to make on its own?
QUESTION|Does the safety team take live calls at night, or only the general support queue?
QUESTION|Is there a German speaker on every shift, or should German calls default to a callback?
QUESTION|Can the agent see why an account was blocked, or only that it is blocked?`
  },
  {
    id: 'service',
    team: 'Automotive',
    title: 'Car service bookings',
    blurb: 'A car maker’s service line across several Indian languages. Bookings and status checks, plus repair complaints and roadside breakdowns.',
    form: {
      name: 'Car service bookings',
      callers: 'Car owners, many calling while driving or from a workshop forecourt, in their regional language',
      handles: 'Owners ring to book a service, check whether their car is ready, reschedule, ask about warranty cover, complain about a repair, or because the car has broken down on the road. The agent can read and write bookings in the dealer system and read vehicle and warranty records. Warranty decisions and complaints sit with the customer care desk, which works business hours. Breakdowns go to a roadside assistance partner with its own 24 hour number.',
      coverage: 'Business hours only',
      delivery: 'Live transfer with on-screen summary',
      callerLanguages: ['Hindi', 'English', 'Tamil', 'Marathi', 'Bengali'],
      agentLanguages: ['Hindi', 'English', 'Tamil', 'Marathi'],
      constraints: ['Personal data'],
      systems: ['Dealer booking system', 'Vehicle records', 'Warranty system']
    },
    text: `SUMMARY|Bookings, status checks and reschedules are routine and the agent closes them; complaints and warranty questions need the care desk with the vehicle facts ready, and breakdowns go straight to roadside help.
MOMENT|Book a service|A slot at a nearby dealer|A booking or record|Calm|Light|Fully|Short and predictable|Common|Dealer booking system
MOMENT|Is my car ready|Know when to collect it and the bill so far|Information only|Calm|Light|Fully|Short and predictable|Common|Dealer booking system
MOMENT|Move my booking|A different day or dealer|A booking or record|Calm|Light|Fully|Short and predictable|Occasional|Dealer booking system
MOMENT|Is this covered by warranty|Know whether they will have to pay|Money|Frustrated|Light|Partly|Varied|Occasional|Warranty system, Vehicle records
MOMENT|Complaint about a repair|The fault fixed properly at no cost|Money|Upset or anxious|Light|Partly|Long story|Occasional|Dealer booking system, Vehicle records
MOMENT|Broken down on the road|Help getting the car moving or towed|Safety or wellbeing|Upset or anxious|None|No|Short and predictable|Rare|Roadside partner
SIGNAL|4|The caller says the dealer has already refused the claim
SIGNAL|5|The caller mentions the same fault coming back after an earlier repair
SIGNAL|5|The caller says the car is unsafe to drive
SIGNAL|1|The caller describes a warning light or noise rather than routine service
FIELD|4|Registration number|Required
FIELD|4|Odometer reading|Required
FIELD|4|The part or fault in the caller's words|Required
FIELD|5|Registration number|Required
FIELD|5|Date and dealer of the earlier repair|Required
FIELD|5|What the caller wants done|Useful
FIELD|6|Where the car is, as precisely as the caller can say|Required
FIELD|6|Whether anyone is hurt or in danger|Required
LINE|1|Your service is booked. You will get a message with the time and address. Would you like anything else, or to speak to someone?
LINE|4|Warranty decisions are made by our care team. I have your car's details and what is wrong, so I am passing you over and they will have it in front of them.
LINE|5|I am sorry the repair has not held. I have noted the car and the earlier visit, and I am putting you through to the care team now.
LINE|6|I am connecting you to roadside assistance now. If anyone is in danger, please call the emergency number first.
QUESTION|Does the roadside partner accept a live transfer, or only calls to its own number?
QUESTION|Is there a Bengali speaker on the care desk, or should Bengali calls be booked as callbacks?
QUESTION|How long after a repair does a returning fault count as a complaint rather than a new booking?`
  },
  {
    id: 'bank',
    team: 'Banking',
    title: 'Card and account line',
    blurb: 'A digital bank’s phone line, regulated and open all night. Lost cards, unknown payments, limits and customers who cannot pay.',
    form: {
      name: 'Card and account line',
      callers: 'Customers of a digital bank, some calling in a panic about money they did not spend',
      handles: 'Customers ring to block a lost or stolen card, ask about a payment they do not recognise, check their balance or recent payments, change their address, ask for a higher limit, or say they are struggling to pay. The agent can verify identity with a one-time code, freeze and block cards, read balances and transactions, and update contact details. Disputes, limit decisions and anything about financial difficulty are handled by specialist teams who are on shift around the clock.',
      coverage: 'Staffed 24/7',
      delivery: 'Live transfer with on-screen summary',
      callerLanguages: ['English', 'Spanish'],
      agentLanguages: ['English', 'Spanish'],
      constraints: ['Regulated (finance, health, insurance)', 'Personal data', 'Vulnerable callers likely'],
      systems: ['Core banking', 'Card platform', 'CRM']
    },
    text: `SUMMARY|The agent should block cards and answer balance questions itself, gather the facts on unknown payments and limit requests before passing them to specialists, and send anyone in financial difficulty straight to a person.
MOMENT|Lost or stolen card|Stop anyone using the card right now|A booking or record|Upset or anxious|Strong|Fully|Short and predictable|Common|Card platform
MOMENT|Payment I do not recognise|Know what it is and get the money back if it is fraud|Money|Upset or anxious|Strong|Partly|Varied|Common|Core banking, Card platform
MOMENT|Balance or recent payments|Hear the balance or check a payment went through|Information only|Calm|Strong|Fully|Short and predictable|Common|Core banking
MOMENT|Change my address|Update details on file|A booking or record|Calm|Strong|Fully|Short and predictable|Occasional|CRM
MOMENT|Raise my limit|A higher card or transfer limit|Money|Calm|Strong|Partly|Varied|Occasional|Core banking
MOMENT|I cannot pay|Help with a payment they cannot make|Money|Upset or anxious|Strong|No|Long story|Rare|CRM
SIGNAL|1|The caller says a payment has already gone out on the lost card
SIGNAL|2|The caller says they shared a code or password with someone
SIGNAL|2|The caller mentions several payments or a large amount
SIGNAL|3|The caller sounds confused about payments they made themselves
SIGNAL|5|The caller says the limit is for an urgent payment today
FIELD|2|Payment date, amount and merchant as it appears|Required
FIELD|2|Whether the card is still in the caller's hands|Required
FIELD|2|Whether the card was frozen on this call|Required
FIELD|5|Limit wanted and the reason|Required
FIELD|5|Date the higher limit is needed|Useful
FIELD|6|Which payment is due and when|Useful
LINE|1|Your card is blocked now and nobody can use it. A new card is on its way. Would you like to speak to someone about anything else?
LINE|2|I have frozen your card so nothing else can go out while we look. I am passing you to our payments team now, and they will already have the payment details.
LINE|5|Limit changes are decided by our team. I have noted what you need and by when, and I am putting you through now.
LINE|6|Thank you for telling us. I am putting you through to someone who can talk through your options with you now.
QUESTION|Can the agent raise a dispute itself for small amounts, or must every dispute go to the payments team?
QUESTION|Which words should count as financial difficulty under your vulnerable customer policy?
QUESTION|Does a customer who failed the one-time code still get passed over, and at what identity level?`
  }
];
