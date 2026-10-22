// Three worked examples. Products, plans and questions are invented.
// Each has a saved model map, so it opens without a key. The rules still run live on every one.

export const EXAMPLES = [
  {
    id: 'signup',
    title: 'Invoicing app sign-up',
    blurb: 'A B2B SaaS sign-up in Amplitude. Two names for one event, an email in a property and no failure events.',
    tag: 'Sign-up',
    form: {
      product: 'Tallyo invoicing',
      flow: 'Sign-up and activation',
      tool: 'Amplitude',
      convention: 'snake_case',
      identity: 'Anonymous, then identified',
      steps: `Lands on the sign-up page
Starts sign-up
Verifies email
Creates a first invoice
Sends the first invoice`,
      questions: `Where do people drop between starting sign-up and verifying their email?
Which channel brings people who go on to send a first invoice?
Why do people fail email verification?
How long does it take from sign-up to the first invoice sent?`,
      plan: `signup_page_viewed | utm_source, utm_campaign, referrer | Sign-up page finishes loading
signup_started | method | First sign-up form step is submitted
sign_up_started | method, email | Continue with Google is pressed
email_verified | verification_attempt | User opens the link in the verification email
Invoice Created | invoice_id, amount, currency |
invoice_sent | invoice_id, delivery_method | Server confirms the invoice email was sent
button_clicked | button_text |`
    },
    text: `SUMMARY|Most of the funnel is covered, but failed verifications are invisible and the source on the first page view may not reach the invoice.
STEP|1|signup_page_viewed|Page view with UTMs
STEP|2|signup_started, sign_up_started|Two events for one step, so the count is split
STEP|3|email_verified|Fires on opening the link, not on success
STEP|4|Invoice Created|
STEP|5|invoice_sent|
Q|1|partly|signup_started, sign_up_started, email_verified|NONE|Sign-up starts are split across two event names
Q|2|partly|signup_page_viewed, invoice_sent|utm_source|Source is only on an anonymous page view and needs identity to carry it to the invoice
Q|3|no|NONE|NONE|Nothing fires when verification fails or the link expires
Q|4|yes|signup_started, invoice_sent|NONE|
ADD|email_verification_failed|failure_reason, verification_attempt|The verification link is expired, already used or invalid|Q3
ADD|signup_completed|method, utm_source|Account is created and the user is identified|Q2
PROP|invoice_sent|is_first_invoice|Lets Q4 pick the first invoice without a query over every invoice|Q4`
  },
  {
    id: 'checkout',
    title: 'Grocery app checkout',
    blurb: 'A Mixpanel checkout in Title Case. Clean names and full coverage, but payment failures carry no reason.',
    tag: 'Checkout',
    form: {
      product: 'Cesta grocery app',
      flow: 'Checkout',
      tool: 'Mixpanel',
      convention: 'Title Case',
      identity: 'Identified from the start',
      steps: `Views the basket
Starts checkout
Picks a delivery slot
Adds a payment method
Places the order`,
      questions: `Which step of checkout loses the most people?
Do people who apply a promo code complete more orders?
Why do payments fail: a declined card or something else?`,
      plan: `Basket Viewed | Item Count, Basket Value | Basket screen opens
Checkout Started | Basket Value, Item Count | Go to checkout is tapped
Delivery Slot Selected | Slot Date, Slot Type | A slot is confirmed
Payment Method Added | Method Type | A card or wallet is saved
Promo Code Applied | Promo Code, Discount Value | A valid code is accepted
Order Placed | Order Id, Order Value, Promo Code | Order confirmation screen opens
Payment Failed | Method Type | Payment provider returns an error`
    },
    text: `SUMMARY|Every step and the promo question are covered; payment failures are counted but cannot be told apart.
STEP|1|Basket Viewed|
STEP|2|Checkout Started|
STEP|3|Delivery Slot Selected|
STEP|4|Payment Method Added|Covered, though saved cards skip it
STEP|5|Order Placed|
Q|1|yes|Basket Viewed, Checkout Started, Delivery Slot Selected, Payment Method Added, Order Placed|NONE|
Q|2|yes|Promo Code Applied, Order Placed|Promo Code|
Q|3|partly|Payment Failed|Failure Reason|Payment Failed has no reason or decline code
PROP|Payment Failed|Failure Reason|Separates a declined card from a timeout or 3-D Secure drop|Q3
PROP|Checkout Started|Has Saved Card|Explains why some people never fire Payment Method Added|Q1`
  },
  {
    id: 'booking',
    title: 'Holiday rental direct booking',
    blurb: 'A GA4 booking site with guest checkout. One name too long for GA4, guest details sent as properties and a question nothing answers.',
    tag: 'Booking',
    form: {
      product: 'Alcazaba Stays direct booking',
      flow: 'Booking',
      tool: 'GA4',
      convention: 'snake_case',
      identity: 'Never identified',
      steps: `Searches dates
Views a property
Starts a booking
Enters guest details
Pays
Sees the confirmation`,
      questions: `Where do guests drop between searching dates and paying?
Do guests who open the cancellation policy book less often?
Which channel brings guests who complete a booking?`,
      plan: `search_dates | check_in, check_out, guests, utm_source | Search button is pressed
property_viewed | property_id, nightly_rate | Property page loads
booking_flow_started_from_property_details_page | property_id, check_in, check_out | Book now is pressed
guest_details_submitted | guest_email, guest_phone, country | Guest details form passes validation
payment_completed | booking_id, total_value, currency, property_id | Payment provider confirms
page_view | page_location | Automatic`
    },
    text: `SUMMARY|The booking path is covered end to end, but nothing records the cancellation policy and one event name is too long for GA4.
STEP|1|search_dates|
STEP|2|property_viewed|
STEP|3|booking_flow_started_from_property_details_page|Covered, if GA4 accepts the name
STEP|4|guest_details_submitted|
STEP|5|payment_completed|
STEP|6|page_view|Only if the confirmation page has its own URL
Q|1|yes|search_dates, property_viewed, booking_flow_started_from_property_details_page, guest_details_submitted, payment_completed|NONE|
Q|2|no|NONE|NONE|Nothing fires when the cancellation policy is opened
Q|3|partly|search_dates, payment_completed|utm_source|Source is on the search only, and guests are never identified to join it to the payment
ADD|cancellation_policy_viewed|property_id, check_in|Cancellation policy is expanded or its page opens|Q2
ADD|booking_failed|failure_reason, property_id|Payment is declined or the dates are no longer free|Step 5
PROP|payment_completed|utm_source|Keeps the source on the booking itself, since guests are never identified|Q3`
  }
];
