// Three worked examples with saved narratives, so the app works without a key.
// Every figure quoted in a narrative comes from the figure sheet the engine produces
// for these inputs. The narratives were written to that sheet and checked against it.

export const EXAMPLES = [
  {
    id: 'reply-drafts',
    title: 'Reply drafts for a support team',
    blurb: 'Energy retailer, 18,000 tickets a month. Pays back, but only if the time saved is real.',
    tag: 'Workable',
    form: {
      name: 'Reply Draft',
      idea: 'Drafts a first reply to each incoming email ticket from the ticket history and the help centre, for an agent to edit and send.',
      problem: 'Agents write most replies from scratch. Average handling time has crept up and the backlog grows every winter when bills rise.',
      users: 'Around 60 tier-one support agents handling Spanish and English email',
      alternative: 'Expand the saved-reply library and train agents on it',
      audiences: ['Finance', 'Operations lead', 'Engineering lead'],
      volume: 18000, minsSaved: 3.5, hourly: 24, redeploy: 60, peak: 75, rampMonths: 4,
      aiCostPerTask: 0.02, reviewRate: 10, reviewMins: 2, errorRate: 2, costPerError: 6,
      buildCost: 85000, runFixed: 2500, revenueBase: 0, upliftPct: 0, avoidedMonthly: 0, horizon: 24,
      sources: {
        volume: 'measured', minsSaved: 'guess', hourly: 'measured', redeploy: 'guess', peak: 'benchmark',
        rampMonths: 'guess', aiCostPerTask: 'benchmark', reviewRate: 'measured', errorRate: 'guess',
        costPerError: 'measured', buildCost: 'benchmark', runFixed: 'benchmark'
      }
    },
    narrative: `SUMMARY|Reply Draft is a workable case. On the base numbers it pays back in month 17 and returns €43k net over 24 months, which is a 20% return on the money that goes in. The conservative scenario never pays back inside the horizon, so approval should depend on proving the time saved per ticket before the full build.
PROBLEM|Agents write most email replies from scratch, handling time is rising and the backlog grows each winter. Every minute per ticket is multiplied across 18,000 tickets a month.
ASK|An €85k build and a running budget of €2.5k a month, with a go or stop decision after a two-week pilot that measures minutes saved per ticket.
AUDIENCE|Finance|Whether the €43k net value survives realistic assumptions|Base payback is month 17 and the conservative scenario does not pay back, so we are asking for a gated build|Saved minutes do not turn into lower cost|Agreed. Only part of the saved time is counted, and the pilot must show it going into the backlog before the full spend
AUDIENCE|Operations lead|Handling time, backlog and whether agents will use it|Monthly net at full adoption is €5.9k, earned by agents clearing backlog faster|Agents will stop trusting drafts after a few bad ones|Agents send every reply themselves and a share of drafts get a quality review, so a bad draft costs an edit
AUDIENCE|Engineering lead|Build size, data access and who maintains prompts|One €85k build reusing the ticket history and help centre we already have|Help centre content is out of date and drafts will repeat it|Content owners fix the twenty most used articles before launch and that is part of the plan
VALIDATE|Minutes saved per ticket|Two-week pilot with ten agents, timing drafted against undrafted tickets of the same type|Support operations analyst
VALIDATE|Share of saved time put to use|Track backlog and tickets closed per agent during the pilot, not only handling time|Support team leads
VALIDATE|Peak adoption|Count drafts sent with light edits versus drafts discarded during the pilot|Product manager
RISK|A wrong draft about a bill or a tariff reaches a customer|Agents send every reply, high-risk categories such as debt and disconnection get no draft at launch
RISK|Savings are absorbed as idle time rather than backlog|Set a backlog target with operations before launch and report against it monthly
KILL|Stop if the pilot shows under two minutes saved per ticket, since the case then does not pay back inside 24 months
KILL|Stop if fewer than half of drafts are sent with light edits after the first month
ALTERNATIVE|A larger saved-reply library with agent training|Wins if most tickets fall into a few repeat categories, since it costs far less and carries no error risk`
  },
  {
    id: 'meeting-notes',
    title: 'Meeting notes for a sales team',
    blurb: '40 sellers, 1,200 calls a month. The licence costs more than the time it saves.',
    tag: 'No case',
    form: {
      name: 'Call Notes Assistant',
      idea: 'Joins sales calls, writes a summary and next steps, and logs them to the CRM.',
      problem: 'Sellers skip CRM notes after calls, so pipeline reviews run on memory and handovers lose detail.',
      users: 'A 40-person sales team running discovery and demo calls',
      alternative: 'A three-field note template in the CRM, checked in weekly pipeline reviews',
      audiences: ['Finance', 'Head of Sales'],
      volume: 1200, minsSaved: 8, hourly: 45, redeploy: 30, peak: 60, rampMonths: 6,
      aiCostPerTask: 0.15, reviewRate: 0, reviewMins: 0, errorRate: 4, costPerError: 25,
      buildCost: 60000, runFixed: 1800, revenueBase: 0, upliftPct: 0, avoidedMonthly: 0, horizon: 24,
      sources: {
        volume: 'measured', minsSaved: 'guess', hourly: 'measured', redeploy: 'guess', peak: 'guess',
        rampMonths: 'guess', aiCostPerTask: 'benchmark', errorRate: 'guess', costPerError: 'guess',
        buildCost: 'benchmark', runFixed: 'measured'
      }
    },
    narrative: `SUMMARY|On these numbers there is no case. At full adoption it costs €2.6k a month to run and returns €1.3k, so it loses money every month and ends 24 months at minus €93k. Even the optimistic scenario finishes at minus €81k, which points at the cost side rather than the estimates.
PROBLEM|Sellers skip CRM notes after calls, so pipeline reviews depend on memory and handovers lose detail. The real cost is poor pipeline data, which this case does not value.
ASK|No build on the current plan. Instead, a decision on whether better pipeline data is worth paying for, and a cheaper route to it.
AUDIENCE|Finance|Monthly cost against monthly return|At full adoption it costs €2.6k a month and returns €1.3k, so we are not asking for budget|Why bring it at all|To record why we said no, and what would need to change for a yes
AUDIENCE|Head of Sales|Better notes without slowing sellers down|The time-saving case fails, but the data quality problem is real and worth solving more cheaply|Sellers will not fill in a template either|A short template checked in the weekly review costs nothing to try for a month
VALIDATE|Value of better pipeline data|Ask sales leadership for two recent deals lost or delayed because of missing notes, and what that cost|Head of Sales
VALIDATE|Fixed monthly running cost|Ask the vendor for pricing at 40 seats on an annual plan|Product manager
RISK|A summary records a commitment the seller never made and it ends up in the CRM|If revisited, sellers approve each summary before it is logged
KILL|Revisit only if the running cost drops below the monthly benefit, or if lost-deal evidence puts a value on note quality
ALTERNATIVE|A three-field CRM note template checked in weekly pipeline reviews|Wins here, since it targets the same data problem at almost no cost`
  },
  {
    id: 'invoice-extraction',
    title: 'Invoice data capture for finance operations',
    blurb: '40,000 supplier invoices a month and an outsourcing contract to cut. Pays back in month 5.',
    tag: 'Strong',
    form: {
      name: 'Invoice Capture',
      idea: 'Reads supplier invoices in any layout and fills the accounts payable fields, sending low-confidence ones to a person.',
      problem: 'An outsourced team keys invoice data by hand. It is slow at month end and the contract renews next quarter.',
      users: 'The accounts payable team and the outsourced data entry provider',
      alternative: 'Renegotiate the outsourcing contract and keep manual entry',
      audiences: ['Finance', 'Legal and compliance', 'Engineering lead'],
      volume: 40000, minsSaved: 2, hourly: 20, redeploy: 40, peak: 85, rampMonths: 3,
      aiCostPerTask: 0.03, reviewRate: 15, reviewMins: 1.5, errorRate: 1, costPerError: 15,
      buildCost: 65000, runFixed: 3000, revenueBase: 0, upliftPct: 0, avoidedMonthly: 22000, horizon: 24,
      sources: {
        volume: 'measured', minsSaved: 'benchmark', hourly: 'measured', redeploy: 'guess', peak: 'benchmark',
        rampMonths: 'guess', aiCostPerTask: 'benchmark', reviewRate: 'benchmark', reviewMins: 'guess',
        errorRate: 'benchmark', costPerError: 'measured', buildCost: 'benchmark', runFixed: 'benchmark',
        avoidedMonthly: 'guess'
      }
    },
    narrative: `SUMMARY|Invoice Capture is a strong case. It pays back in month 5, returns €378k net over 24 months and still pays back by month 12 in the conservative scenario. Most of the value rests on the monthly cost avoided from the outsourcing contract, so that number needs confirming before the renewal date.
PROBLEM|An outsourced team keys supplier invoice data by hand, which is slow at month end, and the contract renews next quarter, so the timing of this decision is fixed.
ASK|A €65k build and €3k a month to run, approved before the contract renewal so the reduced scope can be negotiated.
AUDIENCE|Finance|Payback and the size of the saving|Payback in month 5, and month 12 even in the conservative scenario|The outsourcing saving may not be as large as assumed|Agreed, it is the biggest swing input, so procurement confirms the reduced contract price before we commit
AUDIENCE|Legal and compliance|Accuracy of records and an audit trail|Low-confidence invoices go to a person, and every extracted field keeps a link to the source document|An error in a tax field reaches the ledger|Tax and bank detail fields always get a human check at launch, whatever the model's confidence
AUDIENCE|Engineering lead|Integration effort with the accounts payable system|A €65k build feeding the fields the outsourced team fills today|Supplier layouts vary too much|The pilot runs on the top 50 suppliers first, which cover most of the volume
VALIDATE|Monthly cost avoided|Ask procurement and the provider to price a reduced scope covering exceptions only|Procurement lead
VALIDATE|Minutes saved per task|Time the in-house team on 200 invoices with and without extraction|Accounts payable lead
VALIDATE|Share of saved time put to use|Agree with the finance controller which month-end tasks the freed time goes to|Finance controller
RISK|Bank detail changes slip through and enable invoice fraud|Any change to supplier bank details always needs human approval, separate from extraction
RISK|The provider will not reduce scope mid-contract|Time the decision to the renewal and keep the exceptions-only quote in writing
KILL|Stop if the reduced outsourcing quote saves less than half of the €22k a month assumed
KILL|Stop if field-level accuracy on the pilot suppliers is below the in-house manual rate
ALTERNATIVE|Renegotiate the contract and keep manual entry|Wins if the provider offers a deep discount, since it removes the build and accuracy risk`
  }
];
