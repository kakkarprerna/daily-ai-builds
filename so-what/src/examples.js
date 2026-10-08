// Three worked examples. Each has the pasted material and the saved model reply for it,
// so the app runs end to end without a key. The rules treat them exactly like a live read.
// Companies and people are invented.

export const EXAMPLES = [
  {
    id: 'trials',
    team: 'B2B analytics SaaS',
    title: 'Trials that never get going',
    blurb: 'A cohort review and nine interviews explain why only 9% of trials pay. Most of the fix is in the first day.',
    form: {
      name: 'Why trials stall',
      goal: 'Lift trial to paid conversion for agencies and brands this quarter.',
      goalMetric: 'Trial to paid',
      sourceType: 'Mixed',
      horizon: 'Next 2 weeks',
      capacity: 10,
      revenue: 85000,
      teamHours: 0
    },
    source: `Trial cohort review, March to May. 412 trials started, 38 converted to paid (9.2%).

Product data: 61% of trials never connected a social account. Of trials that connected an account in the first 24 hours, 22% converted. Of those that never connected, 1.4% converted.

Interview notes, 9 trial users who did not convert:
- Agency lead, Madrid: "I got stuck on the Instagram permission screen and assumed it needed our client's password."
- Brand manager: "The dashboard was empty so I couldn't show my boss anything."
- Freelance strategist: "I wasn't sure which plan had the competitor reports, so I waited."
- Agency analyst: "We needed to connect twelve client accounts and doing them one by one was painful."
- Two more agency users said the permission step asked for access they did not have.
- Brand manager, retail: "The sample report you emailed on day 3 was the first time I understood what it does."
- Second brand manager: "Nothing to look at until our data loaded, and by then the trial was half over."
- Startup founder: "Price is fine, I just never had time to set it up."

Sales note: three agencies asked on calls whether we offer bulk account import.

Support: 47 tickets in the period tagged 'connect account', most about Facebook Business permissions.`,
    text: `SUMMARY|Trials stall at connecting a first account, and the ones that connect on day one convert at many times the rate of the rest.
INSIGHT|I1|Most trials never connect an account, and connecting in the first day is what separates payers from the rest|Getting an account connected on day one is the biggest lever on trial to paid|Measured|Most|61% of trials never connected a social account
INSIGHT|I2|The permission screen makes people think they need passwords or access they do not have|This is where most of the failed connections happen|Repeated|Some|assumed it needed our client's password
INSIGHT|I3|An empty dashboard gives trial users nothing to show their manager|Without something to show, the buyer cannot make the case to pay|Repeated|Some|the dashboard was empty so there was nothing to show my boss
INSIGHT|I4|Agencies with many client accounts need a way to connect them in one go|Agency trials need more set-up time than the trial allows|Repeated|Few|doing them one by one was painful
INSIGHT|I5|Some trial users cannot tell which plan includes competitor reports|Unclear plans delay the decision to pay|Single mention|Few|I wasn't sure which plan had the competitor reports
ACTION|A1|I1,I2|Rewrite the permission screen to say exactly what access is needed and that no password is shared|Activation|Days|Design|Direct|Draft new copy for the Instagram and Facebook permission screens and test it with two agency users on Thursday|Share of trials connecting an account within 24 hours, up from 39%|Stop if the 24 hour connection rate has not moved after three weeks
ACTION|A2|I3|Show a sample account in empty dashboards until the user's own data arrives|Activation|Weeks|Engineering|Direct|Pick the sample account and list the five charts it must fill|Trial users who share or export a report in week one|Stop if report sharing in week one stays flat after a full cohort
ACTION|A3|I1|Send the sample report on day one with a two minute guide to connecting an account|Conversion|Hours|Marketing|Direct|Move the day 3 sample report email to day one and add the connection guide|Trial to paid for the next cohort, up from 9.2%|Stop if the email is opened by more than 40% and connection rates do not move within a month
ACTION|A4|I4|Build bulk import for agencies connecting many accounts|Expansion|Months|Engineering|Supports|Go back to the three agency sales calls and note how many accounts each needed to connect|Accounts connected per agency trial|Stop if fewer than one in five agency trials need more than five accounts
ACTION|A5|I5|Add a line to the trial banner saying which plan includes competitor reports|Conversion|Hours|Product|Direct|Write the banner line and add it under the competitor reports tab|Trial users who visit pricing from the banner|Stop if pricing visits from trial users do not rise in two weeks
ACTION|A6|I2|Offer every agency trial a 15 minute set-up call|Conversion|Days|Customer success|Direct|Add a booking link to the welcome email for sign-ups that say they are an agency|Trial to paid for agencies that booked a call|Stop if fewer than 10% of agency trials book within two weeks
GAP|Nothing here says why the 38 who paid chose to, which would show what to protect
GAP|Conversion is not split between agencies and brands, so the agency actions may be over or under weighted
GAP|The 47 connection tickets are not split by platform`
  },
  {
    id: 'handoffs',
    team: 'Conversational AI support',
    title: 'Too many chats reach a person',
    blurb: 'A support bot hands 30% of chats to agents. A sample of 200 handoffs shows which ones the bot should keep.',
    form: {
      name: 'Cut avoidable chatbot handoffs',
      goal: 'Cut the share of chats the support bot hands to a human agent without hurting satisfaction.',
      goalMetric: 'Support load',
      sourceType: 'Support tickets',
      horizon: 'This month',
      capacity: 20,
      revenue: 0,
      teamHours: 320
    },
    source: `Chatbot handoff review, September. 18,400 conversations, 5,520 handed to a human agent (30%). Agents spend about 320 hours a week on handed-over chats.

Top handoff reasons from a sample of 200 handed-over chats:
- Order status where the order was split across two parcels: 58 chats
- Address change after dispatch: 31 chats
- Customer typed in Catalan or Basque: 22 chats
- Refund amount questions: 19 chats
- Bot asked for the order number again after the customer already gave it: 17 chats

Agent comments:
- "Half my morning is split-parcel tracking that the bot could answer if it read the second tracking number."
- "Customers are already annoyed by the time they reach me because the bot asked for the order number twice."
- "Address changes after dispatch need the courier portal, the bot can't do that and shouldn't."

CSAT for chats resolved by the bot: 4.3. CSAT for handed-over chats: 3.1.

One agent suggested adding a voice channel.`,
    text: `SUMMARY|Most avoidable handoffs come from two gaps in what the bot reads, while a few handoffs are right by design.
INSIGHT|I1|Split-parcel order status is the largest handoff reason, because the bot only reads the first tracking number|Fixing this one gap removes the biggest block of agent work|Measured|Some|Order status where the order was split across two parcels: 58 chats
INSIGHT|I2|The bot asks for the order number again after the customer has given it|Customers reach agents already annoyed, which drags satisfaction down|Repeated|Few|the bot asked for the order number twice
INSIGHT|I3|Customers who write in Catalan or Basque get handed over|A language gap sends solvable chats to people|Measured|Few|Customer typed in Catalan or Basque: 22 chats
INSIGHT|I4|Handed-over chats score far lower on satisfaction than chats the bot resolves|Every avoidable handoff costs satisfaction as well as agent time|Measured|Some|CSAT for handed-over chats: 3.1
INSIGHT|I5|Address changes after dispatch need the courier portal and should stay with people|Some handoffs are correct and should get faster, not disappear|Measured|Few|the bot can't do that and shouldn't
INSIGHT|I6|One agent would like a voice channel|An idea, not a finding about handoffs|Single mention|Few|One agent suggested adding a voice channel
ACTION|A1|I1|Let the bot read every tracking number on a split order|Efficiency|Weeks|Engineering|Direct|Pull 20 split-parcel chats and find which order API field holds the second tracking number|Handoffs for order status chats, down from 29% of all handoffs|Stop if split-order handoffs fall by less than half after two weeks live
ACTION|A2|I2,I4|Carry the order number through the conversation so the bot never asks twice|Efficiency|Days|Engineering|Direct|Use 5 of the 17 chats to find the step where the order number is dropped|Chats where the order number is asked twice, down to zero|Stop if repeat asks stay above 2% of chats after the fix ships
ACTION|A3|I3|Teach the bot to handle order questions in Catalan and Basque|Efficiency|Weeks|Product|Direct|Run 10 real Catalan and Basque chats through the current model and see where they fail|Handoffs tagged as language, down from 11% of handoffs|Stop if the test chats already resolve, which would mean the problem is routing, not language
ACTION|A4|I5|Send address changes straight to an agent with the order details attached|Efficiency|Days|Operations|Supports|Ask three agents what they need in the handoff note for an address change|Agent handling time for address changes|Stop if handling time does not drop within a month
ACTION|A5|I6|Launch a voice channel for support|Retention|Months|Product|Off goal|Ask the agent who suggested it which problem a voice channel would solve|Share of chats asking for phone support|Stop if fewer than 5 in 200 chats ask for a phone call
ACTION|A6|I4|Add a free-text question to the survey after every handed-over chat|Retention|Hours|Customer success|Supports|Add the question to the existing post-chat survey|Satisfaction for handed-over chats, up from 3.1|Stop if fewer than 10% answer it after two weeks
GAP|The sample of 200 may not match all 5,520 handoffs
GAP|There is no cost per handoff, so agent time is the only measure of load
GAP|It is not clear how many orders ship in more than one parcel`
  },
  {
    id: 'churn',
    team: 'HR tech, shift scheduling',
    title: 'An update that cost customers',
    blurb: 'NPS fell 13 points after a new rota editor. A small team has five person-days, so the plan has to choose.',
    form: {
      name: 'Win back trust after the editor release',
      goal: 'Bring monthly logo churn back to 2% for restaurant and retail customers.',
      goalMetric: 'Retention',
      sourceType: 'Survey answers',
      horizon: 'Next 2 weeks',
      capacity: 5,
      revenue: 140000,
      teamHours: 0
    },
    source: `Quarterly NPS survey, shift-scheduling app for restaurants and retail. 640 responses. NPS 18, down from 31 last quarter. Monthly logo churn rose from 2.1% to 3.4%.

Detractor comments (sample):
- "Since the update the rota takes twice as long to publish."
- "Swapping shifts on the phone app keeps failing for my staff."
- "Shift swaps fail on Android, staff text me instead."
- "We moved to the new rota editor and lost the copy last week button."
- "Copying last week's rota was the only reason we used you."
- "Payroll export doesn't match our hours, we fix it by hand every month."
- "Would love a dark mode."

Passive comments:
- "Fine, but the new editor is slower."
- "Good for scheduling, I wish it did time off requests."

Product data: shift swap attempts on Android fail 14% of the time, iOS 1%. Uses of 'copy last week' fell from 3,100 a week to zero after the editor release (feature not yet rebuilt).

Churned accounts' exit notes: 11 of 19 mention the new editor.`,
    text: `SUMMARY|The drop in NPS and the rise in churn trace back to the new rota editor, with Android shift swaps as a second problem.
INSIGHT|I1|Removing copy last week from the new editor took away a feature thousands of rotas relied on|This is the most direct cause of the churn rise|Measured|Most|Uses of 'copy last week' fell from 3,100 a week to zero
INSIGHT|I2|Shift swaps fail far more often on Android than on iOS|Managers end up handling swaps by text, which wears down the reason to use the app|Measured|Some|shift swap attempts on Android fail 14% of the time
INSIGHT|I3|Most churned accounts name the new editor in their exit notes|Fixing the editor is a retention job, not polish|Measured|Some|11 of 19 mention the new editor
INSIGHT|I4|The new editor is slower to publish a rota|Every week the slower editor reminds customers of the change|Repeated|Some|the rota takes twice as long to publish
INSIGHT|I5|Payroll export does not match recorded hours for at least one customer|If widespread, it is a hidden monthly cost for customers|Single mention|Some|Payroll export doesn't match our hours
INSIGHT|I6|One customer would like time off requests|A feature wish, not a reason customers are leaving|Single mention|Few|I wish it did time off requests
ACTION|A1|I1,I3|Bring back copy last week in the new editor|Retention|Weeks|Engineering|Direct|Ship a plain copy last week button behind a flag to the 20 accounts that used it most|Weekly uses of copy last week, back above 2,000|Stop if churn among flagged accounts is not below 3% after a month
ACTION|A2|I1,I3|Email the accounts that used copy last week a two-step workaround until it returns|Retention|Hours|Customer success|Direct|Write the workaround and send it to the top 200 accounts by past usage on Monday|Monthly logo churn, back toward 2.1%|Stop if replies say the workaround does not save time
ACTION|A3|I2|Fix shift swaps failing on Android|Retention|Days|Engineering|Direct|Pull the Android error logs for failed swaps from the last seven days|Android swap failure rate, down from 14% to under 2%|Stop if the failures sit on old app versions, and push an update prompt instead
ACTION|A4|I4|Find and fix the slowest step in publishing a rota|Retention|Days|Engineering|Direct|Time publishing a 30-person rota in the old and new editors|Time to publish a rota|Stop if publish time is already within 10% of the old editor
ACTION|A5|I5|Check payroll export against five customers' real hours|Retention|Days|Data|Supports|Ask five accounts for last month's export and their corrected version|Accounts reporting manual payroll fixes|Stop if all five match, which would make it a set-up issue for a few accounts
ACTION|A6|I6|Build time off requests|Expansion|Months|Product|Off goal|Count how many survey comments ask for time off requests|Requests for time off in feedback|Stop if fewer than 5% of comments mention it
GAP|The comments are a sample, so it is not clear how many detractors mention the editor
GAP|There is no split of churn by restaurant and retail
GAP|Nothing shows whether the Android failures hit specific app versions`
  }
];
