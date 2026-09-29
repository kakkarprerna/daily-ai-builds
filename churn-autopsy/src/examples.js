// Three worked examples with saved autopsies, so the app works without any API key.
// All accounts are fictional composites.

export const EXAMPLES = [
  {
    id: 'lindqvist',
    blurb: 'Said it was budget. The seats told a different story from month one.',
    account: {
      name: 'Lindqvist Freight',
      segment: 'Mid-market',
      size: '€10k to €50k',
      tenure: '1 to 2 years',
      outcome: "Didn't renew",
      stated: 'Budget cuts. Moving to a cheaper tool that covers the basics.',
      actions: 'Monthly check-ins with the day-to-day contact. Sent a feature newsletter. Offered a 10% discount at renewal.',
      events: [
        { months: 11, category: 'Product adoption', note: 'Onboarding finished three weeks late. Only the operations team activated: 12 of 40 licensed seats.' },
        { months: 9, category: 'Engagement', note: 'Champion (Head of Ops) promoted to regional director. New day-to-day contact skipped the admin training.' },
        { months: 8, category: 'Product adoption', note: 'Weekly active users dropped from 12 to 7. Reporting module never switched on.' },
        { months: 6, category: 'Engagement', note: 'QBR postponed twice, then held with no executive present.' },
        { months: 4, category: 'Support', note: 'Two tickets asking how to bulk export all shipment data to spreadsheets.' },
        { months: 3, category: 'Sentiment', note: 'NPS 5, with the comment: does what we need, but we barely use it.' },
        { months: 2, category: 'Commercial', note: 'Procurement asked for a 30% discount before discussing renewal.' },
        { months: 1, category: 'Commercial', note: 'Formal notice of non-renewal.' },
      ],
    },
    result: `VERDICT: Product adoption
CONFIDENCE: High
SUMMARY: The account never grew past the operations team, so nobody senior could point to value when the budget review came. Price was the reason given, but low adoption is what made the tool easy to cut.
FIRST_SIGNAL: 1 | Only 12 of 40 paid seats went live at onboarding. Seventy per cent of the licence was unused from the start, and the account never recovered from that.
NO_RETURN: 5 | Asking how to bulk export all their data is what customers do when they are preparing to move. By then a replacement was likely already being evaluated.
SAVE_WINDOW: Between 11 and 5 months before exit, roughly six months
STATED: Budget cuts, and a cheaper tool covers the basics
REAL: The tool was used by one team at about a fifth of its paid capacity, and the person who bought it had moved on, so no one could defend the cost
MISSED: 2 | A champion promotion was treated as good news rather than a loss of the one person who knew why they bought the tool | Engagement
MISSED: 3 | Falling active users were seen as seasonal instead of a second drop on an already thin base | Product adoption
MISSED: 4 | A QBR with no executive present was held anyway, so value was never shown to anyone who controls budget | Engagement
MISSED: 6 | The NPS comment said outright that they barely use it, but the score of 5 was logged without follow-up | Sentiment
PLAY: At event 1 (11 months out) | Treat unused seats as the first risk. Agree a seat activation plan with named teams and dates, and review it weekly until at least 70% of seats are active.
PLAY: At event 2 (9 months out) | Ask the promoted champion for an introduction to their replacement and to one executive, and rebuild the success plan with the new contact.
PLAY: At event 4 (6 months out) | Do not run a QBR without a budget holder. Reschedule it, and send a one-page value summary to the executive in the meantime.
RULE: Flag any account where less than half of licensed seats are active 60 days after onboarding
RULE: When a champion changes role, secure a new champion and an executive contact within 30 days
RULE: Treat a bulk data export request with no stated project as a churn signal and call within 48 hours
FLIP: If the new tool really does cost much less for the same use, the loss may be mostly Commercial
FLIP: If the export tickets were for a genuine reporting need, the point of no return moves later to event 7`,
  },
  {
    id: 'pellago',
    blurb: 'Healthy usage, happy users, and still cut by 60%. No one had measured the value.',
    account: {
      name: 'Pellago Health',
      segment: 'Enterprise',
      size: '€150k+',
      tenure: '1 to 2 years',
      outcome: 'Downgraded',
      stated: 'Group-wide restructuring and cost review.',
      actions: 'Strong usage reporting in every QBR. Escalated to the account executive when the sponsor went quiet. Offered a multi-year discount.',
      events: [
        { months: 14, category: 'Business outcomes', note: 'Kick-off: agreed goal to cut patient intake time by 20%. No baseline was measured.' },
        { months: 12, category: 'Product adoption', note: 'Usage looks strong: 85% of seats active weekly.' },
        { months: 9, category: 'Business outcomes', note: 'First QBR showed usage charts. CFO asked what it had saved them. No answer ready.' },
        { months: 7, category: 'External', note: 'Parent group announced a cost review across all software vendors.' },
        { months: 5, category: 'Engagement', note: 'Executive sponsor stopped replying. CS escalated to the account executive.' },
        { months: 3, category: 'Commercial', note: 'Vendor review scorecard rated the tool as nice to have.' },
        { months: 1, category: 'Commercial', note: 'Renewed at 40% of seats.' },
      ],
    },
    result: `VERDICT: Business outcomes
CONFIDENCE: High
SUMMARY: People used the tool, but nobody could prove what it saved. When the cost review arrived, a tool with no measured return was an easy place to cut.
FIRST_SIGNAL: 1 | A 20% time-saving goal was agreed without measuring where they started. From that moment, the value could never be proven with numbers.
NO_RETURN: 6 | Once the scorecard rated the tool as nice to have, the decision was essentially made. The renewal was about how much to cut, not whether.
SAVE_WINDOW: Between 14 and 4 months before exit, with the best chance before the cost review at 7 months
STATED: Group-wide restructuring and a cost review
REAL: The restructuring was real, but it only exposed that the account had no evidence of return to defend itself with
MISSED: 2 | High usage was read as health, when it only showed activity, not value | Business outcomes
MISSED: 3 | The CFO's question in the QBR was a direct request for proof of value and was not followed up with a plan to measure it | Business outcomes
MISSED: 5 | A silent executive sponsor during a known cost review was escalated commercially instead of answered with evidence | Engagement
PLAY: At event 1 (14 months out) | Measure current intake time before go-live, even roughly, and agree how and when it will be re-measured.
PLAY: At event 3 (9 months out) | Answer the CFO within two weeks with a before and after, or a short time study on a sample of intakes.
PLAY: At event 4 (7 months out) | Get ahead of the review by sending the sponsor a one-page value case they could take into the room.
RULE: Every success goal needs a baseline number before go-live, or it is not a goal
RULE: Never present usage without a value metric beside it in an executive meeting
RULE: When a customer announces a vendor cost review, prepare a written value case within 30 days
FLIP: If the parent group cut every vendor by a similar share regardless of value, the loss is mostly External
FLIP: If a value case was shared and still rated nice to have, the cause shifts to Product fit`,
  },
  {
    id: 'brightwell',
    blurb: 'When the stated reason and the real reason are the same, and still went unheard.',
    account: {
      name: 'Brightwell Studios',
      segment: 'SMB',
      size: 'Under €10k',
      tenure: 'Under 1 year',
      outcome: 'Cancelled mid-term',
      stated: 'Too many bugs. The calendar sync keeps failing.',
      actions: 'Support gave a workaround each time. Invited the owner to a check-in call once the escalation came in.',
      events: [
        { months: 7, category: 'Support', note: 'Calendar sync bug reported. Workaround given and ticket closed.' },
        { months: 6, category: 'Support', note: 'Same bug reopened by a different user. Tagged low priority.' },
        { months: 5, category: 'Sentiment', note: 'CSAT 2 out of 5 on the reopened ticket: third time explaining this.' },
        { months: 4, category: 'Product adoption', note: 'Two of five designers stopped logging in.' },
        { months: 3, category: 'Support', note: 'Missed a client deadline after a sync failure. Angry email to the founder.' },
        { months: 2, category: 'Engagement', note: 'Owner declined the check-in call.' },
        { months: 0, category: 'Commercial', note: 'Cancelled mid-term, citing bugs.' },
      ],
    },
    result: `VERDICT: Support
CONFIDENCE: High
SUMMARY: One bug came back again and again and was handled as a one-off each time. When it cost the customer a client deadline, trust was gone.
FIRST_SIGNAL: 2 | A second user hitting the same bug showed it was not a one-off. Tagging it low priority told the customer their problem was not taken seriously.
NO_RETURN: 5 | Missing a client deadline turned an annoyance into real business damage for a small agency. After that, only an immediate fix and a personal apology could have helped.
SAVE_WINDOW: Between 6 and 3 months before exit
STATED: Too many bugs, especially calendar sync
REAL: The same as stated. The bug was real, and the repeated closing of the ticket made it feel ignored
MISSED: 1 | Closing a ticket with a workaround hid the fact that the bug was still there | Support
MISSED: 3 | A CSAT of 2 with a comment about repeating themselves was not routed to anyone beyond support | Sentiment
MISSED: 4 | Two of five users going quiet is 40% of a small team and was not linked back to the bug | Product adoption
PLAY: At event 2 (6 months out) | Link the reopened ticket to the first one, raise priority, and give the customer an honest timeline for a fix.
PLAY: At event 3 (5 months out) | Have a CSM call the owner, acknowledge the repeat, and agree a way to avoid missed bookings until the fix ships.
PLAY: At event 5 (3 months out) | Founder-level reply within a day, with a credit and a named person accountable for the fix.
RULE: Any bug reopened by a second user on the same account goes to the CSM, not just the support queue
RULE: A CSAT of 2 or below triggers a CSM call within three working days
RULE: For small teams, flag when any two users stop logging in
FLIP: If the bug affected all customers and was fixed soon after, the loss is more about response than product quality
FLIP: If the owner was already planning to move tools for other reasons, the bug was the trigger, not the cause`,
  },
];
