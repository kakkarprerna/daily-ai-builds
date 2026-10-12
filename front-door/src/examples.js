// Three worked examples. All products are invented. Counts are illustrative.
// Each carries a saved model reply so it works without a key.

let k = 0;
const st = (type, label, mode, fields, count) => ({ id: `s${++k}`, type, label, mode, fields: fields ?? '', count: count ?? '' });

export const EXAMPLES = [
  {
    id: 'ledgerly',
    sector: 'Invoicing for freelancers',
    title: 'Ledgerly',
    blurb: 'A card-up-front trial, an email check and a bank connection all stand before the first invoice. About one in nine people who start ever sends one.',
    form: {
      name: 'Ledgerly',
      pitch: 'Invoices and payment reminders for freelancers',
      segment: 'Small businesses',
      entry: 'Free trial, card up front',
      signin: ['Email and password', 'Self-serve password reset'],
      steps: [
        st('account', 'Create your account', 'Required', 7, 10000),
        st('verify', 'Confirm your email', 'Required', '', 6200),
        st('plan', 'Pick Starter or Pro', 'Required', '', 4100),
        st('payment', 'Start your 14-day trial', 'Required', 4, 3600),
        st('questions', 'Tell us about your business', 'Required', 5, 1500),
        st('connect', 'Connect your bank', 'Required', '', 1300),
        st('value', 'First invoice sent', 'Required', '', 1150)
      ],
      notes: `Sign-up form asks for first name, last name, email, password, business name, VAT number and country. Support says the VAT number field confuses people who are not VAT registered yet, and some just close the tab.

After the form we send a confirmation email. Tickets every week say the confirmation email went to spam or never arrived, and the waiting screen only says "Check your inbox to continue" with no resend button.

Then people pick Starter or Pro and enter card details for the 14-day trial. Several people wrote in asking why we need a card if the trial is free, and the page does not say when they will be charged.

The business questions ask for industry, team size, monthly invoice volume, how they heard about us and their main goal.

Connecting the bank uses Open Banking. The bank connection page times out for some Spanish banks and shows "Something went wrong" with no way to retry except starting again.

Sign-in is email and password with a reset link.`
    },
    text: `SUMMARY|Freelancers sign up for an invoicing trial, but a long form, an unreliable email check, an unexplained card request and a failing bank connection stand before the first invoice.
MOMENT|1|Asks too much|The VAT number field confuses people who are not VAT registered yet|the VAT number field confuses people who are not VAT registered yet|People who cannot answer a required field leave instead of guessing.
MOMENT|2|Blocks the way|Confirmation email lands in spam or never arrives, and there is no resend|the confirmation email went to spam or never arrived|Nobody can carry on until an email they cannot find arrives.
MOMENT|2|Unclear wording|The waiting screen gives no next step if the email does not come|"Check your inbox to continue" with no resend button|The screen leaves people with nothing to do but wait or give up.
MOMENT|4|Trust worry|People do not know why a free trial needs a card or when they will be charged|asking why we need a card if the trial is free|Unanswered money questions at the card step turn into abandoned trials.
MOMENT|6|Error or dead end|Bank connection times out for some Spanish banks with no retry|shows "Something went wrong" with no way to retry except starting again|People who hit this have done six steps and are sent back to the start.
QUESTION|What share of people who reach the email check open the email within 10 minutes, and how many ask for it again?
QUESTION|Which banks account for the bank connection timeouts, and what share of Spanish sign-ups use them?
QUESTION|How many trials with a card were cancelled before the first charge, and how many without ever sending an invoice?`
  },
  {
    id: 'standup',
    sector: 'Async standups for teams',
    title: 'Standup Loop',
    blurb: 'Getting in is easy and the invite screen can be skipped, if you find the link. The serious problem is coming back: a code at every sign-in and no way to recover it.',
    form: {
      name: 'Standup Loop',
      pitch: 'Written daily standups for remote teams, in Slack or the web app',
      segment: 'Teams buying together',
      entry: 'Free plan',
      signin: ['Google or Microsoft', 'Email and password', 'MFA every time'],
      steps: [
        st('social', 'Continue with Google', 'Required', '', 5000),
        st('workspace', 'Name your team', 'Required', 2, 4400),
        st('invite', 'Invite your teammates', 'Skippable', '', 4100),
        st('connect', 'Add to Slack', 'Skippable', '', 3000),
        st('value', 'First standup posted', 'Required', '', 2700)
      ],
      notes: `New team leads sign up with Google, name their team and pick a URL. The next screen says "Standups work best with your team" and asks for teammates' emails, with a small grey "Skip for now" link under the Continue button. Session recordings show leads scrolling around the invite screen looking for a way past it before closing the tab.

In interviews two team leads said they wanted to try it alone first before asking anyone else to join.

Slack is optional and most people who reach it connect it.

Returning users sign in with Google or with a password, and we ask for a six-digit code from an authenticator app every time they sign in, on every device. There is no password reset page and no recovery codes. Our support inbox gets weekly emails from people who changed phones and lost their authenticator, and each one takes about two days to sort out.`
    },
    text: `SUMMARY|Team leads get in easily, but the skip on the invite screen is hard to find, and returning users face a code at every sign-in with no way to recover a lost one.
MOMENT|3|Unclear wording|The way past the invite screen is a small grey link people miss|a small grey "Skip for now" link under the Continue button|People who want to carry on alone do not see that they can.
MOMENT|3|Asks too much|Leads want to try the product alone before inviting anyone|wanted to try it alone first before asking anyone else to join|Asking for colleagues before value feels like a commitment they are not ready to make.
MOMENT|0|Sign-in trouble|People who changed phones lose access and need support to get back in|people who changed phones and lost their authenticator|Without a recovery route these users are locked out for days.
MOMENT|0|Blocks the way|Locked-out users wait about two days for support|each one takes about two days to sort out|Two days locked out of a daily habit is long enough to drop it.
QUESTION|What share of team leads on the invite screen click Skip for now, and how long do they spend there first?
QUESTION|What share of team leads who leave at the invite step come back within 7 days?
QUESTION|How many sign-ins a week fail at the code step, and how many end in a support email?`
  },
  {
    id: 'fieldnote',
    sector: 'Developer API',
    title: 'Fieldnote API',
    blurb: 'A short, clean sign-up for developers. The one real leak sits between creating a key and making the first call, where the quickstart asks for too much.',
    form: {
      name: 'Fieldnote API',
      pitch: 'Speech-to-text API for field service apps',
      segment: 'Developers',
      entry: 'Free plan',
      signin: ['Email and password', 'Magic link', 'GitHub', 'Self-serve password reset'],
      steps: [
        st('account', 'Sign up with email or GitHub', 'Required', 2, 3000),
        st('verify', 'Confirm your email', 'Skippable', '', 2750),
        st('apikey', 'Create your first key', 'Required', '', 2400),
        st('value', 'First successful API call', 'Required', '', 1450)
      ],
      notes: `Developers sign up with email or GitHub and land in the dashboard straight away. Email confirmation is a banner they can dismiss.

After creating a key, the quickstart asks developers to install the SDK, set three environment variables and download a sample audio file before they can make their first call. There is no copy-and-run curl example. In our last survey, developers who left said setup took longer than they had time for.

The docs search returns the old v1 reference first.

Sign-in has email and password, magic link, and GitHub, with a reset link.`
    },
    text: `SUMMARY|Developers sign up and get a key quickly, but the quickstart asks for a full setup before the first call, so many leave before they hear the API work.
MOMENT|3|Asks too much|The first call needs an SDK, three environment variables and a sample file|install the SDK, set three environment variables and download a sample audio file|Every setup task before the first call is a chance to run out of time.
MOMENT|3|Asks too much|No quick way to try a call without setting anything up|There is no copy-and-run curl example|Developers judge an API by how fast they can see it respond.
MOMENT|3|Unclear wording|Docs search shows the old reference first|The docs search returns the old v1 reference first|Developers looking for help land on instructions that no longer apply.
QUESTION|How long after creating a key do developers who succeed make their first good call, compared with those who leave?
QUESTION|Which quickstart step do developers who leave reach last?
QUESTION|Which docs pages do developers open between creating a key and leaving?`
  }
];
