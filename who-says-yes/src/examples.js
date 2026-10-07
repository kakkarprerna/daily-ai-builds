// Three worked examples with saved model output, so the app works without a key.
// Each one runs through the same printed rules as a live map.

export const EXAMPLES = [
  {
    id: 'voice',
    team: 'Contact centre',
    title: 'Replace the phone menu with a voice agent',
    blurb: 'A car maker’s customer service team wants an AI voice agent in place of its press-1-for menu. Security has said no once already.',
    form: {
      name: 'Voice agent for customer service',
      proposal: 'Replace the press-a-number phone menu on the customer service line with an AI voice agent that understands open questions, books service appointments and passes harder calls to a person with the details already captured. Pilot on one regional line for eight weeks, then decide on a full rollout.',
      people: 'The Head of Customer Service owns the line and likes the idea. The CIO blocked a chatbot vendor last year over data leaving the EU and has not changed his view. Team leads in the contact centre worry about headcount and about cleaning up after the bot. The works council has not been told yet. The DPO will want to see where call recordings go. Finance wants payback inside a year. The Head of Digital backs it and is close to the CIO. Marketing cares about the brand voice.',
      ask: 'New AI feature',
      timing: 'This quarter',
      position: 'Proposing it to another team',
      constraints: ['Works council or union', 'Security review', 'Legal or privacy review']
    },
    text: `SUMMARY|The line owner is open and Digital backs it, but the CIO is against it after last year, and the people who carry the change day to day have not been heard yet.
PERSON|Head of Customer Service|Shorter queues and fewer complaints without losing control of the line|Signs off|High|Open|Heavy|Direct
PERSON|CIO|Customer data staying in the EU and no new vendor risk|Can block|High|Against|Some|Through someone
PERSON|Contact centre team leads|Their team’s jobs and not spending the day fixing the agent’s mistakes|Has to live with it|Medium|Doubtful|Heavy|Direct
PERSON|Works council|Whether jobs or monitoring of staff change|Can block|Medium|Unknown|Some|None yet
PERSON|Data protection officer|Where call recordings and transcripts are stored and for how long|Can block|Medium|Unknown|Little|Through someone
PERSON|Finance business partner|Payback inside twelve months on a cost that is easy to stop|Shapes the detail|Medium|Doubtful|Little|Direct
PERSON|Head of Digital|Showing progress on the digital roadmap|Kept informed|High|Backing|Little|Direct
PERSON|Brand and marketing|The agent sounding like the brand|Kept informed|Low|Open|Little|Direct
SWAYS|7|2|Peers on the leadership team and the CIO trusts his read on vendors
SWAYS|1|6|Owns the budget line Finance reviews
SWAYS|3|4|The council takes its lead from what team leads raise
SWAYS|1|3|Their manager
WORRY|1|A pilot that fails in public on the main line|Run it on one regional line with a person one step away on every call
WORRY|2|Customer data processed outside the EU, as with last year’s vendor|Show EU hosting and a data processing agreement before the meeting, not after it
WORRY|2|Another vendor to secure and audit|Offer to run it through the standard security review with his team setting the bar
WORRY|3|Headcount cuts by the back door|Say in writing that the pilot measures handling time, not headcount, and that team leads choose which calls it takes
WORRY|3|Agents cleaning up after a confused bot|Give team leads the say on when it hands over and a weekly review of transferred calls
WORRY|4|Calls being recorded and used to watch staff|Show that recordings cover the agent’s side only and are not used to rate staff
WORRY|5|No clear retention period for recordings|Bring a draft retention rule and the processing record for review
WORRY|6|An open-ended cost|Show a cost per call ceiling and a break clause at the end of the pilot
ASK|1|Sponsor the pilot and name the regional line it runs on
ASK|2|Agree the security conditions under which he would say yes
ASK|3|Co-write the rules for when the agent hands over
ASK|4|Hear the plan before any decision is taken
ASK|5|Review the data flow and retention rule
ASK|6|Agree the payback test the pilot has to pass
ASK|7|Raise it with the CIO before you do
ASK|8|Review the agent’s greeting and voice
QUESTION|Who besides the CIO can approve a new vendor that processes customer data?
QUESTION|Has the works council been involved in earlier automation on this line?
QUESTION|Does the pilot budget sit with Customer Service or Digital?`
  },
  {
    id: 'pricing',
    team: 'B2B SaaS',
    title: 'Move from seats to usage-based pricing',
    blurb: 'An analytics platform wants to charge by API calls instead of seats. Sales sees commission risk and the board has not been asked.',
    form: {
      name: 'Usage-based pricing',
      proposal: 'Move new customers from per-seat pricing to usage-based pricing on API calls, with a minimum monthly commitment, from next quarter. Existing customers keep their plan until renewal. The aim is to stop losing smaller teams that only need a few seats but call the API heavily.',
      people: 'The CEO asked for this. Sales leadership is worried about commission plans and longer deals. The CTO says metering is not built yet. Customer success sees churn in small accounts and supports a change. Finance has not given a view. Senior account executives are openly against it. The lead investor on the board needs to agree to pricing changes and only talks to the CEO.',
      ask: 'Pricing or commercial change',
      timing: 'This quarter',
      position: 'I own it',
      constraints: []
    },
    text: `SUMMARY|The CEO backs it and customer success has the churn evidence, but sales and engineering both see cost before benefit, and the board has not been asked.
PERSON|CEO|Growth from smaller teams without hurting revenue this year|Signs off|High|Backing|Some|Direct
PERSON|Head of Sales|Commission plans, deal length and hitting this quarter’s number|Can block|High|Doubtful|Heavy|Direct
PERSON|CTO|Not taking engineers off the roadmap to build metering|Shapes the detail|High|Doubtful|Heavy|Direct
PERSON|Customer success lead|Stopping small accounts leaving at renewal|Has to live with it|Medium|Open|Heavy|Direct
PERSON|Finance lead|Predictable revenue and how usage will be forecast|Shapes the detail|Medium|Unknown|Some|Direct
PERSON|Senior account executives|Their commission and deals already in progress|Has to live with it|Medium|Against|Heavy|Through someone
PERSON|Lead investor on the board|Revenue quality and how the change reads to the next round|Can block|High|Unknown|Little|None yet
SWAYS|1|7|The only person the investor talks to about pricing
SWAYS|4|2|Customer success owns the churn numbers sales trusts
SWAYS|1|5|Sets Finance’s priorities
SWAYS|2|6|Their manager and the voice they follow on commission
WORRY|2|Commission falls when deal values drop|Model the commission plan side by side on last quarter’s deals before the meeting
WORRY|2|Longer sales cycles while buyers learn the new model|Keep seats as an option for existing pipeline until quarter end
WORRY|3|Metering pulls engineers off the roadmap|Scope the smallest version: count calls per key from existing logs, invoice by hand for one quarter
WORRY|4|Being stuck explaining a new bill to angry customers|Give them the customer email and a bill explainer before launch
WORRY|5|Revenue becomes hard to forecast|Use a minimum monthly commitment and report usage above it separately
WORRY|6|Losing deals they are about to close|Grandfather every deal already in the pipeline
WORRY|7|A drop in reported recurring revenue before the next round|Show the churn saved in small accounts against the short-term dip
ASK|1|Raise it with the lead investor and say it is your plan
ASK|2|Agree a commission plan that sales can sign up to
ASK|3|Agree the smallest metering build that is good enough for one quarter
ASK|4|Share the churn data from small accounts with sales
ASK|5|Build the forecast model with a minimum commitment
ASK|6|Help write the grandfathering rules for current pipeline
ASK|7|Agree to the change at the next board meeting
QUESTION|Does a pricing change need a formal board vote or only the lead investor’s agreement?
QUESTION|How much of last year’s churn came from accounts under five seats?
QUESTION|Can usage be counted from existing API logs, or is new tracking needed?`
  },
  {
    id: 'discovery',
    team: 'Product team',
    title: 'One discovery process for three squads',
    blurb: 'A product team wants every squad to run discovery the same way before work reaches engineering. Leadership is on side; the managers are not sure.',
    form: {
      name: 'Shared discovery process',
      proposal: 'Have all three product squads use the same discovery process: a one-page problem brief, five customer conversations and a design review before anything goes into sprint planning. Try it for one quarter and review the cycle time and how many features were reworked after launch.',
      people: 'The VP of Product wants consistency and is backing it. The Director of Engineering is open if it does not slow delivery. Engineering managers think it adds meetings. Squad PMs are mostly keen. The design lead backs it and works closely with the PMs. The Head of Sales worries feature requests will take longer. The data team would need to help with the review numbers.',
      ask: 'Change to how people work',
      timing: 'Decision this month',
      position: 'I own it',
      constraints: []
    },
    text: `SUMMARY|Both leaders who decide are on side, so the work is with the engineering managers and squads who will run it every week.
PERSON|VP of Product|Consistent quality across squads and fewer reworked features|Signs off|High|Backing|Some|Direct
PERSON|Director of Engineering|Delivery speed and fewer half-specified tickets|Can block|High|Open|Some|Direct
PERSON|Engineering managers|More meetings and slower sprints|Has to live with it|Medium|Doubtful|Heavy|Direct
PERSON|Squad product managers|Time for customer conversations without losing delivery dates|Has to live with it|Medium|Open|Heavy|Direct
PERSON|Design lead|Getting design involved before scope is fixed|Shapes the detail|Low|Backing|Some|Direct
PERSON|Head of Sales|Customer requests not getting stuck in a longer process|Kept informed|High|Doubtful|Little|Through someone
PERSON|Data team|Being asked for numbers they do not track today|Shapes the detail|Low|Unknown|Some|Direct
SWAYS|5|4|Works with every PM daily and they trust her judgement on process
SWAYS|2|3|Their manager
SWAYS|1|6|Peer on the leadership team
WORRY|2|Delivery slows while squads learn it|Compare cycle time for one quarter and agree in advance what slowdown is acceptable
WORRY|3|More meetings for engineers|Keep engineers to the design review only, thirty minutes per feature
WORRY|4|Five customer calls per feature is too many for small changes|Let small changes skip to a brief only, with the bar written down
WORRY|6|Customer requests take longer to reach a release|Add a fast lane for contract-critical requests that skips discovery
WORRY|7|Being asked for rework numbers they cannot produce|Agree two measures they already track and start with those
ASK|1|Announce it as the product team’s standard for the quarter
ASK|2|Agree the delivery measure you will both watch
ASK|3|Co-design which meetings engineers attend and which they skip
ASK|4|Run the first brief and calls on a live feature
ASK|5|Present the design review step to the squad PMs
ASK|6|Agree what counts as a contract-critical request
ASK|7|Pick two measures for the quarter review
QUESTION|What cycle time would the Director of Engineering accept during the trial?
QUESTION|Who decides when a change is small enough to skip discovery?`
  }
];
