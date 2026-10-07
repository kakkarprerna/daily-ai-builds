// Three worked examples. Each stores the form and a saved model reply in the same
// tagged-line format the live model returns, so it runs through the same parser
// and the same lane rules as a fresh map.

export const EXAMPLES = [
  {
    id: 'refunds',
    team: 'Customer support',
    title: 'Refund requests for an online homeware shop',
    blurb: 'Five support agents handle refund emails by hand. The policy check runs on a rule, the two steps that move money or reach the customer stay gated, and exceptions stay with a person.',
    form: {
      name: 'Refund requests',
      trigger: 'A customer emails or uses the contact form asking for a refund',
      today: 'Five support agents in the helpdesk, with a team lead for exceptions',
      process:
        'An agent reads the email and finds the order in Shopify. They check the date against our 30 day return window and whether the item was marked as delivered. If it is inside policy they approve it. If it is outside policy, damaged, or the customer is angry, they decide whether to refund, send a replacement or decline, and big ones go to the team lead. They issue the refund in Stripe, write back to the customer and tag the ticket with a reason code in Zendesk.',
      systems: ['Helpdesk', 'Shop platform', 'Payments'],
      volume: '500 to 5,000',
      constraints: ['Customers see the output', 'Handles money']
    },
    text: `SUMMARY|A refund flow with a clear policy core and a judgement-heavy edge. Rules can check the return window, an agent can read and draft, and anything that moves money or goes to the customer needs a person to approve it first.
STEP|1|Read the request and find the order|Reads the customer's message and finds the matching order by email and order number|Zendesk and Shopify|Read or look up|Some|Free text or voice|Easy|Internal
STEP|2|Check the return window|Compares the order and delivery dates with the 30 day policy|Shopify|Compare or calculate|None|Structured|Easy|Internal
STEP|3|Decide the outcome for exceptions|Chooses refund, replacement or decline when the request falls outside policy or the item is damaged|Zendesk|Sort or judge|High|Mixed|Hard|Money or legal
STEP|4|Issue the refund|Sends the approved refund back to the original card|Stripe|Move money|None|Structured|Cannot|Money or legal
STEP|5|Write and send the reply|Explains the outcome to the customer in the shop's tone|Zendesk|Send outside|Some|Mixed|Cannot|Customer sees it
STEP|6|Tag the ticket with a reason code|Adds the refund reason so the team can report on it|Zendesk|Update a record|Some|Mixed|Easy|Internal
FAIL|1|Matches the wrong order when a customer has several recent orders|Refund amount does not match the item named in the email|Show the matched order next to the message and ask for the order number when more than one order fits
FAIL|2|Uses the order date instead of the delivery date|Late deliveries get declined although they are inside policy|Read the delivery date only and test the rule on last month's tickets before switching it on
FAIL|3|Treats an angry tone as a reason to refund outside policy|Exception refunds rise without a change in damage reports|Give the approver the policy reason and the customer's history side by side
FAIL|5|Promises a refund before the approval goes through|Customers chase refunds that were never issued|Only send the reply after step 4 confirms in Stripe
FAIL|6|Picks a vague reason code such as other|Reporting shows a growing other bucket|Limit the agent to the existing code list and sample tags weekly
TOOL|Zendesk|Read and write|1, 3, 5, 6
TOOL|Shopify|Read only|1, 2
TOOL|Stripe|Read and write|4
QUESTION|Is there a refund amount above which the team lead must approve, and what is it?
QUESTION|Do damaged items need a photo before any outcome is decided?
QUESTION|Which reason codes exist today, and which are actually used in reporting?`
  },
  {
    id: 'invoices',
    team: 'Finance operations',
    title: 'Supplier invoice matching in finance operations',
    blurb: 'Most of this work is matching and posting, which rules handle better than a model. The agent earns its place on reading messy PDFs and explaining variances.',
    form: {
      name: 'Supplier invoice matching',
      trigger: 'A supplier invoice lands in the accounts payable inbox',
      today: 'Three accounts payable clerks, with the finance controller signing off variances',
      process:
        'A clerk opens the PDF invoice and types the supplier, invoice number, lines and totals into the ERP. They match it to the purchase order and the goods received note. If prices or quantities differ by more than 2% they flag it and look into why, then the controller decides whether to accept, short pay or dispute. Matched invoices are posted and added to the Thursday payment run.',
      systems: ['ERP or finance system', 'Email', 'Payments'],
      volume: '500 to 5,000',
      constraints: ['Handles money']
    },
    text: `SUMMARY|A matching workflow where rules should do most of the work. The agent is useful at the two ends that involve reading words, capturing PDFs and explaining variances, while the controller keeps the decision on exceptions and payments stay gated.
STEP|1|Capture the invoice fields|Reads supplier, invoice number, line items and totals from the PDF|AP inbox and ERP|Read or look up|Some|Free text or voice|Easy|Internal
STEP|2|Match to order and receipt|Matches each line to the purchase order and goods received note|ERP|Compare or calculate|None|Structured|Easy|Internal
STEP|3|Flag variances over tolerance|Flags lines where price or quantity differs by more than 2%|ERP|Compare or calculate|None|Structured|Easy|Internal
STEP|4|Explain the variance|Looks at the order history and supplier emails and suggests a likely reason and a resolution|ERP and email|Sort or judge|Some|Mixed|Easy|Internal
STEP|5|Decide accept, short pay or dispute|Chooses how to settle an invoice that is over tolerance|ERP|Sort or judge|High|Mixed|Hard|Money or legal
STEP|6|Post the invoice|Posts the matched or resolved invoice to the ledger|ERP|Update a record|None|Structured|Hard|Money or legal
STEP|7|Add to the payment run|Includes posted invoices in the Thursday payment run|Banking portal|Move money|None|Structured|Cannot|Money or legal
FAIL|1|Reads a credit note as an invoice, or misses a second page of lines|Totals captured do not equal the PDF total|Check captured lines add up to the stated total and route any mismatch to a clerk
FAIL|2|Matches to a closed or duplicate purchase order|Same order number appears on two posted invoices|Block posting when the order is closed or already fully invoiced
FAIL|4|Gives a confident reason that is not in the evidence|Controller overturns the suggested resolution often|Make the agent cite the email or order line behind each reason, and show none found when there is none
FAIL|6|Posts to the wrong cost centre|Budget owners query unexpected spend|Take the cost centre from the purchase order only, never from the invoice text
FAIL|7|Pays a duplicate invoice|Supplier statement shows a credit balance|Check supplier and invoice number against the last 12 months before the run
TOOL|AP inbox|Read only|1, 4
TOOL|ERP|Read and write|1, 2, 3, 4, 5, 6
TOOL|Banking portal|Read and write|7
QUESTION|Is the 2% tolerance the same for every supplier, or do some contracts set their own?
QUESTION|Who signs off the payment run today, and does that change above a certain total?
QUESTION|How often do suppliers send credit notes or multi-page invoices?`
  },
  {
    id: 'voice',
    team: 'Voice agent',
    title: 'Service appointment changes by voice for a car dealer group',
    blurb: 'A voice agent takes calls to move service bookings. Looking up and moving slots can run on rules, while warranty and complaint calls go to a person.',
    form: {
      name: 'Service appointment changes by phone',
      trigger: 'A customer rings the service line to move or cancel a booking',
      today: 'A six-person call centre covering 14 dealerships, office hours only',
      process:
        'The agent answers, confirms who is calling with the registration and postcode, and finds the booking in the dealer management system. They read out the next free slots at that workshop and book the one the customer picks. If the customer raises a complaint, a warranty question or a recall, they take notes and pass it to the service advisor. They send a text to confirm the new time.',
      systems: ['Phone system', 'Dealer management system', 'SMS'],
      volume: '500 to 5,000',
      constraints: ['Customers see the output', 'Personal data', 'Out-of-hours cover needed']
    },
    text: `SUMMARY|A good fit for a voice agent with a narrow job. Finding bookings and moving slots can run on rules behind the agent, the conversation itself needs sample checks, and anything about warranty, recalls or complaints should go to a person with the call notes ready.
STEP|1|Answer and confirm who is calling|Greets the caller and confirms identity with the registration and postcode|Phone system|Read or look up|Some|Free text or voice|Easy|Regulated or personal data
STEP|2|Find the booking|Looks up the booking by registration in the dealer management system|Dealer management system|Read or look up|None|Structured|Easy|Internal
STEP|3|Offer the next free slots|Reads out the next free slots at the same workshop|Dealer management system|Compare or calculate|None|Structured|Easy|Customer sees it
STEP|4|Understand what the caller wants|Works out whether the caller wants to move, cancel or raise something else, across accents and background noise|Phone system|Sort or judge|Some|Free text or voice|Easy|Customer sees it
STEP|5|Move or cancel the booking|Books the chosen slot or cancels the booking|Dealer management system|Update a record|None|Structured|Easy|Customer sees it
STEP|6|Handle warranty, recall or complaint calls|Decides what to tell a caller who raises a warranty claim, a recall or a complaint|Phone system|Sort or judge|High|Free text or voice|Hard|Regulated or personal data
STEP|7|Text the confirmation|Sends a templated text with the new date, time and workshop|SMS gateway|Send outside|None|Structured|Cannot|Customer sees it
FAIL|1|Confirms identity on a partial match and reads out another customer's booking|Caller corrects the name or address on the booking|Require both registration and postcode to match before saying anything about the booking
FAIL|4|Hears a complaint as a cancellation because of background noise|Cancellations rise with no matching drop in bookings elsewhere|Repeat the request back and wait for a clear yes before acting
FAIL|4|Cuts in while the caller is still speaking on a noisy line|Callers repeat themselves and calls run longer|Tune interruption detection on real recordings from the road, not on scripted test calls
FAIL|5|Books a slot that was taken a moment earlier|Two cars arrive for the same bay|Hold the slot in the system before reading it out and confirm the write succeeded
FAIL|6|Gives an answer on warranty cover|A customer quotes the agent in a dispute|Agent never answers warranty questions, it takes notes and transfers with them
TOOL|Phone system|Read and write|1, 4, 6
TOOL|Dealer management system|Read and write|2, 3, 5
TOOL|SMS gateway|Read and write|7
QUESTION|Out of hours, who receives warranty and complaint calls that the agent cannot transfer live?
QUESTION|Can the dealer management system hold a slot while the caller decides?
QUESTION|Are any workshops on a different booking system?`
  }
];
