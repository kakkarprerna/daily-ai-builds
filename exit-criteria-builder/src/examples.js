// Three worked examples with saved results, so the app works without any API key.

export const EXAMPLES = [
  {
    id: "reminders",
    tag: "B2B SaaS",
    blurb: "An invoicing tool for small agencies adds automatic payment reminders.",
    input: {
      name: "Automatic payment reminders",
      summary:
        "An invoicing tool for small creative agencies. Adds reminders that email clients before and after an invoice falls due, so agencies spend less time chasing late payments.",
      productType: "B2B SaaS",
      risk: "Balanced",
      sources: ["Product analytics", "Support tickets", "Sales CRM"],
      stages: [
        { name: "Discovery", goal: "Confirm late payment is a costly, frequent problem for agencies", draft: "Customers say they want it" },
        { name: "Private beta", goal: "Prove reminders get invoices paid sooner without annoying clients", draft: "Beta is stable\nReminders work well" },
        { name: "General availability", goal: "Roll out to all paying accounts", draft: "Launch by end of Q1" },
      ],
    },
    saved: `SUMMARY|Discovery and beta test the problem and the effect on payment time; GA tests whether the effect holds at scale without new support load. The biggest risk sits in beta, where a reminder that sounds pushy could cost an agency its client.
STAGE|1|Discovery|Show that late payment is frequent and costly enough for agencies to pay to fix
CRIT|1|Agencies interviewed who describe chasing a late invoice in the last 60 days|At least 8 of 12|Structured interview with a fixed question set|Interviews|Qualitative
CRIT|1|Share of paid invoices settled after the due date|At least 30%|Compare paid date with due date across active accounts for the last two quarters|Product analytics|Lagging
CRIT|1|Agencies who ask to join the beta after seeing a mock-up|At least 6|Offer beta sign-up at the end of each interview|Sales CRM|Leading
STOP|1|Fewer than 4 of 12 agencies describe late payment as a recurring cost, or late invoices sit under 15% of the total
DRAFT|1|Customers say they want it|Vague|At least 8 of 12 interviewed agencies describe chasing a late invoice in the last 60 days, and 6 ask to join the beta
ASSUME|1|That your invoice data records the real paid date and not the date someone marked it paid by hand
STAGE|2|Private beta|Prove reminders shorten time to payment without harming client relationships
CRIT|2|Median days from due date to payment for beta accounts|At least 5 days shorter than their own previous two quarters|Before and after comparison per account, same clients only|Product analytics|Lagging
CRIT|2|Reminder emails that fail to send or bounce|Under 1% of reminders sent|Delivery log for every scheduled reminder|Product analytics|Leading
CRIT|2|Agencies who turn reminders off within 30 days|Under 20% of beta accounts|Track the settings toggle per account|Product analytics|Leading
CRIT|2|Support tickets tagged reminders that report a client complaint|No more than 2 across the beta|Tag and review every reminders ticket weekly|Support tickets|Qualitative
STOP|2|Payment time does not improve by at least 2 days, or more than 1 in 3 agencies switch reminders off
DRAFT|2|Beta is stable|Vague|Under 1% of scheduled reminders fail to send or bounce across the beta period
DRAFT|2|Reminders work well|Vague|Median days from due date to payment falls by at least 5 for beta accounts against their own previous two quarters
ASSUME|2|That the beta group pays on a similar pattern to your wider base; agencies who volunteer may already be more organised
STAGE|3|General availability|Keep the payment time gain at full scale without raising support load
CRIT|3|Accounts with reminders switched on 60 days after release|At least 50% of active paying accounts|Weekly adoption report|Product analytics|Leading
CRIT|3|Median days from due date to payment across adopting accounts|Gain within 1 day of the beta result|Same before and after method as beta|Product analytics|Lagging
CRIT|3|Reminders tickets per 100 active accounts per month|No higher than 2|Tagged ticket count divided by active accounts|Support tickets|Lagging
STOP|3|Adoption stays under 25% after 60 days, which suggests the default or the setup flow is wrong
DRAFT|3|Launch by end of Q1|Unmeasurable|Keep the date as a planning target, and gate the rollout on the two beta criteria being met
ASSUME|3|That default on or default off has been decided; the 50% adoption bar assumes reminders start switched off
GAP|No criterion covers the client side. Consider an unsubscribe or complaint rate from the people receiving reminders.
GAP|Nobody owns the reminders ticket tag. Without one owner the support criteria will go unchecked.`,
  },
  {
    id: "voice",
    tag: "Conversational AI",
    blurb: "An enterprise voice agent platform adds Spanish as a supported language.",
    input: {
      name: "Spanish-language voice agent",
      summary:
        "An enterprise platform for AI voice agents that answer inbound support calls. Adds Spanish as a supported language, starting with one retail client in Spain.",
      productType: "Conversational AI",
      risk: "Cautious",
      sources: ["Call logs", "Product analytics", "Support tickets", "Surveys"],
      stages: [
        { name: "Pilot with one client", goal: "Show the agent handles real Spanish calls for one client", draft: "Agent understands Spanish callers" },
        { name: "Controlled rollout", goal: "Extend to three clients with different accents and call types", draft: "Hallucinations are rare" },
        { name: "General availability", goal: "Offer Spanish to every client on the platform", draft: "" },
      ],
    },
    saved: `SUMMARY|The pilot tests understanding and safe handover on one client's calls; the rollout tests whether that holds across regional accents and call types; GA tests whether it holds without close watching. The biggest risk is confidently wrong answers, so every stage carries an accuracy check on sampled calls.
STAGE|1|Pilot with one client|Show the agent resolves real Spanish calls for one client and hands over safely when it cannot
CRIT|1|Calls where the caller's intent was correctly identified|At least 90% on a sample of 200 reviewed calls|Native speaker reviews a random sample of transcripts against the recording|Call logs|Leading
CRIT|1|Calls resolved without a human|At least 55% of in-scope calls|Resolution flag in the call record, checked against the sample|Call logs|Lagging
CRIT|1|Handovers where the human agent had to re-ask for details the caller already gave|Under 10% of handovers|Review handover summaries on the sampled calls|Call logs|Leading
CRIT|1|Answers containing information that contradicts the client's knowledge base|Zero on the reviewed sample|Reviewer checks every factual answer in the sample against the knowledge base|Call logs|Qualitative
STOP|1|Any sampled call where the agent gives a wrong answer on price, refund or delivery terms, or intent accuracy below 80%
DRAFT|1|Agent understands Spanish callers|Vague|The agent identifies caller intent correctly on at least 90% of 200 reviewed Spanish calls
ASSUME|1|That the pilot client's callers mostly speak Castilian Spanish; accuracy on one accent says little about others
STAGE|2|Controlled rollout|Hold accuracy and safe handover across three clients with different accents and call types
CRIT|2|Intent accuracy per client|At least 88% for every client, not just on average|Per client sample of 150 reviewed calls|Call logs|Leading
CRIT|2|Answers that contradict the knowledge base|Fewer than 1 in 500 answers|Reviewer sample plus an automated check against the current knowledge base version|Call logs|Lagging
CRIT|2|Post-call satisfaction for Spanish calls|Within 0.3 points of the same client's English or human baseline|Short post-call survey on a 5 point scale|Surveys|Lagging
STOP|2|One client falls below 80% intent accuracy, or two wrong answers on a regulated topic in any week
DRAFT|2|Hallucinations are rare|Vague|Fewer than 1 in 500 answers contradict the client's current knowledge base, checked on reviewed samples and an automated version check
ASSUME|2|That the knowledge base is versioned; the contradiction check means little if the agent can read a stale copy
STAGE|3|General availability|Offer Spanish to every client while keeping quality steady without manual review of every account
CRIT|3|Clients who switch Spanish on within 90 days of release|At least 25% of clients with Spanish-speaking customers|Settings and account report|Product analytics|Leading
CRIT|3|Spanish-related support tickets per active Spanish client per month|No more than 1|Tagged ticket count|Support tickets|Lagging
CRIT|3|Intent accuracy on a monthly random sample across all clients|At least 88%|Monthly review of 300 calls drawn across clients|Call logs|Lagging
STOP|3|Accuracy on the monthly sample falls below 85% for two months in a row
ASSUME|3|That you can keep paying for native speaker review at GA; if not, the monthly sample needs another method
GAP|No stage checks latency. Slow replies on a phone line feel like the agent has failed even when the answer is right.
GAP|The rollout picks three clients but no criterion says which accents they must cover. Name them so the stage tests what it claims to.`,
  },
  {
    id: "streaks",
    tag: "Consumer app",
    blurb: "A language-learning app tests daily streaks to bring learners back.",
    input: {
      name: "Daily practice streaks",
      summary:
        "A language-learning app for adults. Adds a daily streak counter and a gentle reminder to bring learners back each day. The team wants to move fast and roll back if it backfires.",
      productType: "Consumer app",
      risk: "Fast",
      sources: ["Product analytics", "Surveys"],
      stages: [
        { name: "Discovery", goal: "Check whether learners drop off because they forget", draft: "" },
        { name: "Prototype test", goal: "See how learners react to a streak counter", draft: "Testers love it" },
        { name: "Beta", goal: "Measure the effect on return visits for a slice of users", draft: "Retention improves" },
        { name: "Launch", goal: "Roll out to all users", draft: "" },
      ],
    },
    saved: `SUMMARY|Discovery checks that forgetting is a real cause of drop-off; the prototype checks the idea does not feel like pressure; beta measures the effect on return visits with a holdout; launch confirms it at full scale. Moving fast is fine here because a streak can be switched off, so each stage leans on a clear rollback trigger.
STAGE|1|Discovery|Confirm that a meaningful share of drop-off comes from forgetting rather than difficulty or boredom
CRIT|1|Lapsed learners who give forgetting or lost habit as the main reason they stopped|At least 35% of survey responses|Short exit survey to learners inactive for 14 days, minimum 150 responses|Surveys|Qualitative
CRIT|1|Learners who return within 7 days after a gap of 2 or more days|Under 40%|Cohort query on return after a gap|Product analytics|Lagging
STOP|1|Fewer than 20% cite forgetting; if difficulty dominates, a streak treats the wrong cause
ASSUME|1|That lapsed learners who answer a survey are similar to those who ignore it
STAGE|2|Prototype test|Check that learners read the streak as encouragement and not as pressure
CRIT|2|Testers who say the streak would make them more likely to practise tomorrow|At least 12 of 20|Clickable prototype test with a fixed question at the end|Interviews|Qualitative
CRIT|2|Testers who describe the streak as stressful or guilt-inducing|No more than 4 of 20|Same session, open question coded afterwards|Interviews|Qualitative
STOP|2|More than a quarter of testers call it stressful; redesign the loss moment before building
DRAFT|2|Testers love it|Vague|At least 12 of 20 testers say the streak would make them more likely to practise tomorrow, and no more than 4 call it stressful
ASSUME|2|That 20 testers are enough to spot a strong negative reaction; they are not enough to estimate a percentage
STAGE|3|Beta|Measure the effect on return visits against a holdout group
CRIT|3|Day 7 return rate for new learners with streaks against a holdout|At least 3 points higher|Randomised 20% slice with streaks, same size holdout without|Product analytics|Lagging
CRIT|3|Learners who switch off the streak reminder|Under 15% of the beta slice|Settings event per user|Product analytics|Leading
CRIT|3|Lessons completed per active learner per week|No lower than the holdout|Weekly comparison between the two groups|Product analytics|Leading
STOP|3|Day 7 return rate is flat or lower than holdout after 3 weeks, or lessons per learner drop, which would mean people open the app to save the streak and leave
DRAFT|3|Retention improves|Unmeasurable|Day 7 return rate for new learners is at least 3 points higher than a randomised holdout after 3 weeks
ASSUME|3|That your baseline day 7 return rate is between 20% and 40%; a 3 point lift means something very different at 10% or 60%
STAGE|4|Launch|Keep the beta lift at full scale and watch for fatigue over time
CRIT|4|Day 30 return rate against a small long-term holdout|At least 2 points higher|Keep a 5% holdout for 60 days after launch|Product analytics|Lagging
CRIT|4|App store reviews that mention streak pressure|Under 5 per month|Monthly review search for streak, pressure, guilt|Manual count|Qualitative
STOP|4|The day 30 gap closes to zero, which would mean the streak shifts when learners come back but not whether they stay
GAP|No stage measures what happens when a long streak breaks. That moment is where many learners quit, so it needs its own check in beta.
GAP|Surveys and analytics are listed but nobody is named to run the exit survey. Assign it before discovery starts.`,
  },
];
