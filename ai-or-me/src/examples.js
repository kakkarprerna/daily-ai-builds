// Three worked examples. Each verdict is computed live by the rubric.
// The "second read" for each is a saved model response, so visitors
// without a key can see what that step returns.

const a = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { value: v }]));

export const EXAMPLES = [
  {
    id: 'pricing',
    title: 'Pricing a new tier',
    tag: 'Judgement call',
    icon: 'BadgeEuro',
    blurb: 'A PM asked to recommend the price for a new Pro tier, for the first time.',
    task:
      'Recommend a price for our new Pro tier to the leadership team. I have the usage data, two competitor price pages and notes from sales calls where customers pushed back on the current price. I have never set a price before.',
    answers: a({
      taskType: 'decide', skillStage: 'learning', doneBefore: 'never', judgement: 'yes', frequency: 'rarely',
      stakes: 'high', verify: 'effort', context: 'most', data: 'internal', time: 'tight',
    }),
    secondRead: {
      CHALLENGE:
        'AI could reasonably build the comparison table of competitor tiers and usage bands for you. That part is checkable and saves an evening. Keeping the whole task human risks running out of time and presenting a thinner case.',
      MISSED:
        'The sales call notes are the most valuable input here and they are context only you have. A model would treat a loud objection and a common one the same way.',
      SKILL: 'Pricing judgement: turning willingness to pay, cost to serve and positioning into one number you can defend.',
      PROMPT:
        'Here is my recommended price for a new Pro tier and my three reasons. Do not suggest a price. List the strongest objection a CFO would raise to each reason, and one piece of evidence that would answer it.',
      PRACTICE:
        'Take a product you use and write down the price you would charge for its top tier and why, in five lines. Then check what it actually costs and work out what they knew that you did not.',
    },
  },
  {
    id: 'interviews',
    title: 'Synthesising interviews',
    tag: 'Learning mode',
    icon: 'MessagesSquare',
    blurb: 'A PM with a handful of discovery rounds behind them, now facing 12 interview transcripts.',
    task:
      'Pull the main themes out of 12 customer interview transcripts from our onboarding discovery round, and decide which three problems we take into the next planning cycle.',
    answers: a({
      taskType: 'summarise', skillStage: 'learning', doneBefore: 'few', judgement: 'partly', frequency: 'monthly',
      stakes: 'medium', verify: 'effort', context: 'some', data: 'confidential', time: 'none',
    }),
    secondRead: {
      CHALLENGE:
        'Twelve transcripts is a lot of reading, and a model is good at first-pass clustering. If the deadline were tight, letting AI draft the clusters and then checking them against the transcripts would be defensible.',
      MISSED:
        'There are two tasks hiding in this one. Finding themes is synthesis. Choosing which three problems to take forward is prioritisation, and that part should stay with you whatever happens to the first.',
      SKILL: 'Synthesis: hearing the problem underneath what a customer says, and noticing when one quote is carrying a whole theme.',
      PROMPT:
        'Here are the five themes I found in these interviews, with the quotes I think support each. Tell me where a quote does not really support its theme, and point to any transcript that contradicts a theme.',
      PRACTICE:
        'Read three transcripts and write your themes on sticky notes before anything else. Time-box it to 30 minutes. Only after that, compare with any AI summary.',
    },
  },
  {
    id: 'release',
    title: 'Weekly release notes',
    tag: 'Repetitive',
    icon: 'Megaphone',
    blurb: 'A senior PM who turns merged Jira tickets into a customer changelog every Friday.',
    task:
      'Turn this week’s merged Jira tickets into a short customer-facing changelog in our usual format. Ticket titles and descriptions only, no customer data.',
    answers: a({
      taskType: 'draft', skillStage: 'peripheral', doneBefore: 'many', judgement: 'no', frequency: 'weekly',
      stakes: 'low', verify: 'quick', context: 'none', data: 'internal', time: 'tight',
    }),
    secondRead: {
      CHALLENGE:
        'Changelogs are read by customers, so tone mistakes are public. If a release includes a breaking change or a removed feature, that entry deserves your own words.',
      MISSED:
        'Ticket titles are written for engineers. Some will hide a change customers care about, and some will describe internal work customers should never see. A quick scan for both is the real job here.',
      SKILL: 'Product communication: explaining a change in terms of what the customer can now do.',
      PROMPT:
        'Turn these tickets into changelog entries in the format below. Leave out internal-only work. Flag, rather than rewrite, any ticket that looks like a breaking change or a removal.',
      PRACTICE:
        'Not needed for this task. Spend the saved half hour on whatever task is currently sitting in "You first, then AI".',
    },
  },
];
