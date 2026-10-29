// Three worked examples with saved model replies, so the app works without a key.
// Companies, customers and tickets are invented. Example 2 carries one made-up ticket ID and one
// quote that is not in the tickets, so the checks have something to catch.

export const EXAMPLES = [
  {
    id: 'booking-api',
    tag: 'API product',
    title: 'Hotel booking API',
    blurb: 'Travel agencies booking hotels through an API. Rates move between search and booking, and refunds run late.',
    form: {
      product: 'RoomLink hotel booking API',
      type: 'API or developer product',
      channel: 'Email',
      window: 'Last 30 days',
      monthly: '420',
      cost: '9',
      tickets: [
        'T-1041 | Viajes Sol | 2026-10-02 | Search returned 112 EUR for the Hotel Alameda room but the booking call came back at 131 EUR. Our client was charged the higher price.',
        'T-1044 | Nordic Trips | 2026-10-03 | Price at booking does not match the search result again, about 15% higher on three bookings today.',
        'T-1047 | Viajes Sol | 2026-10-06 | Same problem as last week, the rate jumped between search and book. Who pays the difference?',
        'T-1050 | AgenTour | 2026-10-07 | How do we download the commission invoice for September? Cannot find it in the dashboard.',
        'T-1052 | Nordic Trips | 2026-10-09 | Rate changed between search and booking for a Seville hotel. Please explain why this keeps happening.',
        'T-1055 | Blue Compass | 2026-10-10 | Where is the monthly commission statement? Our accountant needs it.',
        'T-1058 | AgenTour | 2026-10-13 | We cancelled booking 88213 on the 1st and the refund still has not arrived. It has been 12 days.',
        'T-1060 | Viajes Sol | 2026-10-14 | Is there a way to get the commission invoice as PDF? Asked last month too.',
        'T-1063 | Blue Compass | 2026-10-15 | Refund for cancelled booking 88540 still pending after 10 days. Your team said 3 to 5 days.',
        'T-1066 | Medina Travel | 2026-10-16 | Our API key stopped working after we rotated it in the dashboard. Getting 401 on every call.',
        'T-1069 | Nordic Trips | 2026-10-20 | Refund still pending for booking 88702, cancelled two weeks ago.',
        'T-1071 | Medina Travel | 2026-10-21 | Can you add Portuguese to the confirmation email templates?',
        'T-1074 | AgenTour | 2026-10-23 | Booking response showed a higher rate than search again. Our margin on this one is gone.',
        'T-1077 | Blue Compass | 2026-10-27 | Still waiting on refund for 88540, this is the second time I am writing.'
      ].join('\n')
    },
    text: [
      'SUMMARY|Most of this month\'s email came from three causes: rates changing between search and booking, refunds slower than promised, and a commission invoice agencies cannot find.',
      'GROUP|1|Rate changes between search and booking|T-1041, T-1044, T-1047, T-1052, T-1074|the rate jumped between search and book',
      'ANS|1|yes|no|no|no',
      'FIX|1|Re-check the rate at booking and return a price-changed response before charging, and shorten how long search prices are cached|Engineering|Share of bookings where the booked rate differs from the search rate',
      'GROUP|2|Refunds slower than promised|T-1058, T-1063, T-1069, T-1077|Your team said 3 to 5 days',
      'ANS|2|no|no|yes|no',
      'FIX|2|Release refunds automatically when a cancellation is confirmed, or quote the real refund time in the cancellation response|Finance operations|Median days from cancellation to refund',
      'GROUP|3|Commission invoice hard to find|T-1050, T-1055, T-1060|Cannot find it in the dashboard',
      'ANS|3|no|yes|no|yes',
      'FIX|3|Put the commission invoice download on the billing page and link a short help article from it|Support content|Commission invoice questions per month'
    ].join('\n')
  },
  {
    id: 'analytics-saas',
    tag: 'B2B SaaS',
    title: 'Creator analytics dashboard',
    blurb: 'Brands tracking creator campaigns. Long exports fail, numbers differ from Instagram, and Google sign-in loops.',
    form: {
      product: 'Creator analytics dashboard',
      type: 'B2B SaaS',
      channel: 'Chat',
      window: 'Last 30 days',
      monthly: '260',
      cost: '12',
      tickets: [
        'C-201 | Lumen Beauty | 2026-10-01 | Export to CSV spins forever when I pick the last 90 days.',
        'C-202 | Fable Foods | 2026-10-02 | The follower count here is lower than what Instagram shows on my phone.',
        'C-203 | Lumen Beauty | 2026-10-03 | Tried the export again with 90 days, still nothing downloads.',
        'C-204 | Hart & Co | 2026-10-06 | Our numbers do not match the Instagram app, which one is right?',
        'C-205 | Orbit Sport | 2026-10-08 | CSV export fails for a quarter of data. 30 days works fine.',
        'C-206 | Fable Foods | 2026-10-09 | Engagement rate is different from the one in the TikTok app.',
        'C-207 | Hart & Co | 2026-10-13 | Cannot log in with Google since this morning, it sends me back to the login page.',
        'C-208 | Nimbus Labs | 2026-10-14 | Is there an API endpoint for story views?',
        'C-209 | Orbit Sport | 2026-10-16 | Export still broken for long date ranges, we need this for a board report.',
        'C-210 | Pico Studio | 2026-10-17 | Google sign-in loops back to the login screen.',
        'C-211 | Lumen Beauty | 2026-10-20 | Why do numbers on the dashboard differ from Instagram insights?',
        'C-212 | Pico Studio | 2026-10-22 | Login loop again today with Google sign-in.',
        'C-213 | Nimbus Labs | 2026-10-24 | Please add a dark mode.'
      ].join('\n')
    },
    text: [
      'SUMMARY|Long CSV exports, figures that differ from the platforms\' own apps and a Google sign-in loop account for most chats.',
      'GROUP|1|CSV export fails on long date ranges|C-201, C-203, C-205, C-209|spins forever when I pick the last 90 days',
      'ANS|1|yes|no|no|no',
      'FIX|1|Run exports over 30 days in the background and email a download link when ready|Engineering|Failed exports for ranges over 30 days',
      'GROUP|2|Figures differ from the platform\'s own app|C-202, C-204, C-206, C-211|your numbers never match Instagram',
      'ANS|2|no|yes|no|yes',
      'FIX|2|Show when each figure was last refreshed and how it is counted next to the number, with a help article on why it can differ|Support content|Mismatch questions per month',
      'GROUP|3|Google sign-in loops back to login|C-207, C-210, C-212, C-214|sends me back to the login page',
      'ANS|3|yes|no|no|no',
      'FIX|3|Fix the Google sign-in redirect and add an alert when sign-in failures spike|Engineering|Failed Google sign-ins per day'
    ].join('\n')
  },
  {
    id: 'grocery-app',
    tag: 'Consumer app',
    title: 'Grocery delivery app',
    blurb: 'A busy week of chat and phone contacts. Three causes repeat, and the rest is scattered one-off questions.',
    form: {
      product: 'Cesta grocery delivery app',
      type: 'Consumer app',
      channel: 'Mixed',
      window: 'Last 7 days',
      monthly: '3100',
      cost: '4',
      tickets: [
        'G-01 | ana.r | 2026-10-20 | Two items missing from my order, the app says refund under review.',
        'G-02 | j.moreno | 2026-10-20 | Promo code SAVE10 says not valid on my basket.',
        'G-03 | luis.p | 2026-10-21 | Driver called me because the map put him in the wrong street.',
        'G-04 | ana.r | 2026-10-22 | Still no refund for the missing yoghurt and bread, three days now.',
        'G-05 | marta.g | 2026-10-22 | My code did not work at checkout, it was meant for 10 euros off.',
        'G-06 | k.smith | 2026-10-22 | Refund for a missing item has been under review for 4 days.',
        'G-07 | luis.p | 2026-10-23 | Again the driver went to the postcode centre instead of my door.',
        'G-08 | p.navarro | 2026-10-23 | Can I change my delivery slot after ordering?',
        'G-09 | j.moreno | 2026-10-24 | Why does the promo not apply to offers?',
        'G-10 | sofia.l | 2026-10-24 | Rider could not find my building, the pin was in the middle of the area.',
        'G-11 | k.smith | 2026-10-25 | Second time asking about my refund for the missing milk.',
        'G-12 | d.ortega | 2026-10-25 | The promo code is not valid, but I am sure I typed it right.',
        'G-13 | r.blanco | 2026-10-26 | Substituted pasta with a gluten one I did not want.',
        'G-14 | sofia.l | 2026-10-26 | Delivery late because the rider was lost again.',
        'G-15 | m.ibanez | 2026-10-20 | How do I delete my account?',
        'G-16 | t.garcia | 2026-10-21 | The strawberries were mouldy, can you refund them?',
        'G-17 | e.lopez | 2026-10-21 | Can I pay with a meal voucher card?',
        'G-18 | n.ruiz | 2026-10-22 | I was charged twice for the same order this morning.',
        'G-19 | h.diaz | 2026-10-22 | Do you deliver to Rincon de la Victoria?',
        'G-20 | c.perez | 2026-10-23 | The rider was rude when I asked him to bring the bags upstairs.',
        'G-21 | a.santos | 2026-10-23 | I want to add a note for the rider about my dog.',
        'G-22 | b.molina | 2026-10-24 | Eggs arrived broken.',
        'G-23 | f.castro | 2026-10-24 | Is there a minimum order for free delivery?',
        'G-24 | i.romero | 2026-10-25 | My invoice needs my company tax number, where do I add it?',
        'G-25 | v.herrera | 2026-10-25 | The app logged me out and my basket was empty.',
        'G-26 | l.vega | 2026-10-26 | Can I tip the rider after delivery?'
      ].join('\n')
    },
    text: [
      'SUMMARY|Missing-item refunds held for manual review, map pins placed at the postcode centre and codes that exclude offered items drive most of the week.',
      'GROUP|1|Missing-item refunds stuck in review|G-01, G-04, G-06, G-11|the app says refund under review',
      'ANS|1|no|no|yes|no',
      'FIX|1|Approve missing-item refunds under 15 euros automatically instead of sending them to manual review|Customer operations|Hours from report to refund for missing items',
      'GROUP|2|Address pin placed at the postcode centre|G-03, G-07, G-10, G-14|went to the postcode centre instead of my door',
      'ANS|2|yes|no|no|no',
      'FIX|2|Ask customers to confirm the pin on the map at checkout when the address has no exact match|Engineering|Deliveries with a rider call about location',
      'GROUP|3|Promo codes rejected on offer items|G-02, G-05, G-09, G-12|Why does the promo not apply to offers',
      'ANS|3|no|yes|no|yes',
      'FIX|3|Say which items a code excludes in the checkout error message and in the code\'s terms|Product design|Promo code contacts per week'
    ].join('\n')
  }
];
