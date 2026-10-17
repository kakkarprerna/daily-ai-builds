// Three worked examples. All products are invented. Counts and times are illustrative.
// Each carries a saved model reply so it works without a key.

let k = 0;
const st = (type, label, mode, who, count, hours) => ({ id: `m${++k}`, type, label, mode, who: who || 'They can do it alone', count: count ?? '', hours: hours ?? '' });
const sg = (name, rate) => ({ id: `g${++k}`, name, rate });
const ALONE = 'They can do it alone';
const OTHER = 'Needs someone else';

export const EXAMPLES = [
  {
    id: 'rotakit',
    sector: 'Shift rotas for restaurants',
    title: 'Rota Kit',
    blurb: 'Owners have to set pay rates, upload a staff file and wait for staff to accept invites before they can publish a single rota. About one in seven gets there.',
    form: {
      name: 'Rota Kit',
      pitch: 'Staff rotas and shift swaps for restaurants and cafés',
      segment: 'Small teams',
      window: '14 days',
      winDef: 'A core job done',
      firstScreen: 'Empty, no guidance',
      support: ['Welcome email'],
      steps: [
        st('signup', 'Signed up', 'Required', ALONE, 2400, 0),
        st('setup', 'Add opening hours and roles', 'Required', ALONE, 1700, 2),
        st('import', 'Upload the staff list', 'Required', ALONE, 900, 20),
        st('invite', 'Staff accept their invites', 'Required', OTHER, 520, 70),
        st('core', 'First rota drafted', 'Required', ALONE, 430, 80),
        st('win', 'First rota published', 'Required', ALONE, 340, 96),
        st('repeat', 'Second week published', 'Required', ALONE, 250, 260)
      ],
      segments: [sg('Cafés', 19), sg('Restaurants with 20+ staff', 8)],
      notes: `After sign-up the first screen is a blank calendar with a sidebar that says "No staff yet". Support says new owners click around the calendar and cannot work out where to start.

Step two asks for opening hours and then every role and its hourly pay rate before you can continue. One café owner told us she did not have pay rates to hand on her phone and planned to come back later. Most who say that never do.

The staff upload only takes a CSV in our template. Tickets every week say the upload failed with "Row 14: invalid format" and nothing else, so they give up or email us the spreadsheet.

Staff have to accept an email invite before they appear on the rota, and the rota cannot be published until at least three staff have accepted. Owners say staff ignore the invite email or it goes to spam, and the owner is stuck waiting for days.

Once staff are in, drafting the first rota is quick and owners like the drag and drop. A head chef in an interview said publishing the first rota was the moment it clicked, because staff got their shifts on their phones.

We send a welcome email on day one and nothing after that.`
    },
    text: `SUMMARY|Restaurant owners sign up to plan rotas, but an empty start, pay rates, a fragile staff upload and staff invites all stand before the first published rota.
STUCK|0|Blank start|New owners land on an empty calendar and cannot tell where to begin|new owners click around the calendar and cannot work out where to start|A screen with no first action loses people before they try anything.
STUCK|2|Setup before payoff|Every role and its pay rate is required before going any further|every role and its hourly pay rate before you can continue|Owners without the numbers to hand leave and rarely come back.
STUCK|3|Error or dead end|The staff upload fails with an error that does not say what is wrong|the upload failed with "Row 14: invalid format" and nothing else|People who cannot see what to fix give up on the import or wait for support.
STUCK|4|Waiting on someone|Owners cannot publish until three staff accept an email invite|the rota cannot be published until at least three staff have accepted|The owner's first win depends on other people acting, so it stalls for days.
QUESTION|What share of staff uploads fail on the first try, and which errors cause most of them?
QUESTION|How long does the third staff invite take to be accepted, and how many owners never get to three?
QUESTION|Do owners who finish setup on day one publish a rota more often than those who leave and come back?`
  },
  {
    id: 'quillnote',
    sector: 'AI meeting notes',
    title: 'Quillnote',
    blurb: 'More than half of sign-ups get a useful summary on day one. Then the bot has to be switched on for every meeting, nothing reminds people, and most never record a second.',
    form: {
      name: 'Quillnote',
      pitch: 'Joins your calls and sends a summary with action items',
      segment: 'Individuals',
      window: '7 days',
      winDef: 'A core job done',
      firstScreen: 'Empty with one clear first action',
      support: ['Welcome email', 'Onboarding checklist', 'In-app tips'],
      steps: [
        st('signup', 'Signed up', 'Required', ALONE, 8000, 0),
        st('import', 'Connect your calendar', 'Optional', ALONE, 6100, 0.2),
        st('core', 'First meeting recorded', 'Required', ALONE, 4900, 6),
        st('win', 'First summary opened', 'Required', ALONE, 4300, 7),
        st('repeat', 'Second meeting recorded', 'Required', ALONE, 1200, 120),
        st('habit', 'Used in 3 of the first 4 weeks', 'Required', ALONE, 560, '')
      ],
      segments: [],
      notes: `Most people connect their calendar straight away because the first screen has one button, "Connect your calendar". The ones who skip it can upload a recording instead.

The first summary arrives a few minutes after the meeting ends and people open it. In interviews they say the action items are useful, but several said the summary is too long to skim between meetings and they went back to their own notes.

Week two is where we lose them. Users told us they forgot Quillnote was running, and the bot only joins meetings if you switch it on for each one. We have no email or message after the first summary. One product lead said she would use it every day if it just joined her recurring meetings on its own.

The onboarding checklist disappears once the first summary is opened.`
    },
    text: `SUMMARY|People reach a useful first summary quickly, but most never record a second meeting because the bot must be switched on each time and nothing brings them back.
STUCK|4|Value unclear|The first summary is too long to read between meetings|the summary is too long to skim between meetings|If the result takes longer to read than the notes it replaces, people go back to their old habit.
STUCK|5|Nothing brings them back|The bot has to be switched on for every meeting|the bot only joins meetings if you switch it on for each one|Each meeting needs a fresh decision, so the second use depends on remembering.
STUCK|0|Nothing brings them back|No email or message reaches people after the first summary|We have no email or message after the first summary|People who forget the product is running get no prompt to come back.
QUESTION|What share of first-summary users switch the bot on for any meeting in the following seven days?
QUESTION|How long do people spend on the first summary, and do those who read the action items come back more often?
QUESTION|How many of those who return in week two have a recurring meeting on their connected calendar?`
  },
  {
    id: 'pingpost',
    sector: 'Uptime alerts for developers',
    title: 'Pingpost',
    blurb: 'Sign-up is quick and the checklist works. The gap sits at the SDK install, where people have to redeploy before they see an alert, and agencies activate at half the rate of in-house teams.',
    form: {
      name: 'Pingpost',
      pitch: 'Uptime and webhook alerts in Slack for small engineering teams',
      segment: 'Developers',
      window: '7 days',
      winDef: 'A core job done',
      firstScreen: 'Guided checklist',
      support: ['Onboarding checklist', 'Sample data or templates', 'Nudge emails in week one', 'Messages after the first win'],
      steps: [
        st('signup', 'Signed up', 'Required', ALONE, 3000, 0),
        st('setup', 'Create an API key', 'Required', ALONE, 2700, 0.1),
        st('install', 'Add the SDK to your app', 'Required', ALONE, 1500, 5),
        st('core', 'First event received', 'Required', ALONE, 1250, 6),
        st('win', 'First alert delivered', 'Required', ALONE, 1000, 9),
        st('repeat', 'Second alert acted on', 'Required', ALONE, 720, 60),
        st('habit', 'Active every week for 4 weeks', 'Required', ALONE, 500, '')
      ],
      segments: [sg('In-house teams', 41), sg('Agencies', 22)],
      notes: `Sign-up is GitHub or Google, then the dashboard shows a three-item checklist with the API key already created.

The SDK step is where people stall. Developers told us they have to add the SDK, redeploy and wait for a release before they see anything, and some would rather point Pingpost at a URL first to see an alert before touching their code. We do have a demo project with fake events but it is hidden under Settings.

Our docs say "send a test event" but the dashboard button says "Ping now", and a few people thought these were different things.

Agencies manage many client apps and told us the SDK has to go into each one before they can show a client anything.

Once the first alert arrives in Slack people trust it and most keep it on.`
    },
    text: `SUMMARY|Developers get through sign-up easily, but adding the SDK and redeploying before any alert shows is where almost half of them stop.
STUCK|3|Setup before payoff|An SDK install and a redeploy come before any alert can be seen|add the SDK, redeploy and wait for a release before they see anything|People want to see one alert before changing their code, and many stop here.
STUCK|4|Confusing wording|The docs and the dashboard use different names for the same test|Our docs say "send a test event" but the dashboard button says "Ping now"|People who think these are different things lose time and doubt their setup.
STUCK|0|Setup before payoff|Agencies must install the SDK in every client app first|the SDK has to go into each one before they can show a client anything|For agencies the setup cost multiplies before any client sees value.
QUESTION|What share of people who create a key open the demo project, and do they reach a first alert more often?
QUESTION|How many hours pass between creating a key and the first event for those who stall, and how many are waiting on a release?
QUESTION|How many apps does a typical agency account connect in its first week compared with an in-house team?`
  }
];
