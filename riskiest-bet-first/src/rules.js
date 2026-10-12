// Riskiest Bet First printed rules.
// Every score, the ranking, the verdict, the tests and the test plan come from this file. No model is involved.
// The serverless function imports CATEGORIES and EVIDENCE from here, so the prompt and the rules use the same labels.

export const SEGMENTS = ['Consumers', 'Small businesses', 'Large companies', 'An internal team'];
export const TIMEBOXES = ['2 weeks', '4 weeks', '6 weeks'];
const BOX_DAYS = { '2 weeks': 10, '4 weeks': 20, '6 weeks': 30 };

// Order matters: rule R3 uses it to break ties. It makes little sense to prove you can build something
// before you know anyone wants it, or to price a diagnosis before you know how it will be built.
export const CATEGORIES = [
  { id: 'problem', label: 'The problem is real', short: 'Problem', core: true, ask: 'People have this problem often enough, and badly enough, to act on it.' },
  { id: 'value', label: 'They will choose it', short: 'Value', core: true, ask: 'People will pick this over what they do today, and give time or money for it.' },
  { id: 'reach', label: 'We can reach them', short: 'Reach', core: true, ask: 'You can get it in front of the right people at a cost that works.' },
  { id: 'usability', label: 'They can use it', short: 'Usability', core: false, ask: 'People can work out how to use it without help.' },
  { id: 'feasibility', label: 'We can build it', short: 'Feasibility', core: false, ask: 'The team can build it to the quality needed, with the data and access you have.' },
  { id: 'viability', label: 'The numbers work', short: 'Viability', core: false, ask: 'It earns or saves more than it costs to build, run and sell.' }
];
export const catById = (id) => CATEGORIES.find((c) => c.id === id);

export const IMPACT = ['Kills the idea', 'Hurts it', 'Minor'];
const IMPACT_PTS = { 'Kills the idea': 3, 'Hurts it': 2, Minor: 1 };

export const EVIDENCE = ['Nothing yet', 'Opinions only', 'Some behaviour', 'Strong behaviour'];
export const EVIDENCE_HINT = {
  'Nothing yet': 'Nobody has checked',
  'Opinions only': 'People said they would, or the team believes it',
  'Some behaviour': 'A few people did something: clicked, signed, used a workaround',
  'Strong behaviour': 'People paid, came back, or data shows it at scale'
};
const UNCERTAIN_PTS = { 'Nothing yet': 4, 'Opinions only': 3, 'Some behaviour': 2, 'Strong behaviour': 1 };

export const BANDS = {
  leap: { label: 'Leap of faith', tone: 'bad', line: 'Could kill the idea and nobody has seen it happen' },
  soon: { label: 'Test soon', tone: 'warn', line: 'Worth a test inside this time box' },
  watch: { label: 'Watch', tone: 'ok', line: 'Keep a metric on it, no test needed yet' }
};

export const VERDICTS = {
  test: { label: 'Test before you build', short: 'Test first', tone: 'bad', line: 'The idea rests on something nobody has seen happen: the problem, the demand or the way to reach people. Do not write production code yet.' },
  prototype: { label: 'Prototype first', short: 'Prototype first', tone: 'warn', line: 'People seem to want it. Prove the hard part can be built, used or paid for before you commit a team.' },
  slice: { label: 'Build a thin slice', short: 'Thin slice', tone: 'mid', line: 'Ship the smallest version that tests the top bet with real users, with the kill line agreed before it ships.' },
  build: { label: 'Build it', short: 'Build it', tone: 'ok', line: 'Every bet that could kill the idea has strong behaviour behind it. Keep a metric on each one.' }
};

/* ---------- Scoring ---------- */

// A1: a typed-in impact counts as Kills the idea, and typed-in evidence as Opinions only, until a listed option is picked.
export function scoreOf(x) {
  const imp = IMPACT_PTS[x.impact] ?? 3;
  const unc = UNCERTAIN_PTS[x.evidence] ?? 3;
  const score = imp * unc;
  const band = score >= 9 ? 'leap' : score >= 6 ? 'soon' : 'watch';
  return { score, band, typed: !(x.impact in IMPACT_PTS) || !(x.evidence in UNCERTAIN_PTS) };
}

// E1: words that report what people said, not what they did. Used to cap a model's evidence level.
const SAY = /\b(said|says|say|saying|would|loved?|loves|liked?|likes|excited|interested|agreed?|agrees|think|thinks|thought|believe|believes|promised|wants?|wanted|hope|hopes|keen)\b/i;
const DO = /\b(paid|pays|paying|signed|bought|buys|pre-?ordered|deposits?|used|uses|returned|came back|tapped|clicked|abandon\w*|spent|spends|showed|tickets?|funnel|data|renewed|churned|logged)\b/i;
export function capEvidence(evidence, quote) {
  const strong = evidence === 'Some behaviour' || evidence === 'Strong behaviour';
  if (strong && SAY.test(quote || '') && !DO.test(quote || '')) return { evidence: 'Opinions only', capped: true };
  return { evidence, capped: false };
}

/* ---------- Test library ---------- */

// Each category has an early test (for Nothing yet or Opinions only) and a next test (for Some behaviour).
// Strong behaviour needs no test, only a metric to watch.
// Some tests change with who the idea is for. A typed-in segment uses the small business version (rule A2).
const seg = (segment) => (SEGMENTS.includes(segment) ? segment : 'Small businesses');

const T = {
  interviews: (s) => ({
    id: 'interviews', name: 'Problem interviews', days: s === 'Large companies' ? 10 : 5, cost: '€0',
    how: 'Talk to 10 people from the segment about the last time this happened. Ask what they did, not what they would do. Do not show the idea.',
    measure: 'People who describe a recent case and something they already tried',
    pass: '6 of 10 or more', kill: '3 of 10 or fewer'
  }),
  workaround: () => ({
    id: 'workaround', name: 'Workaround audit', days: 5, cost: '€0',
    how: 'Find 5 people who already spend time or money working around the problem, and ask to see the workaround: the spreadsheet, the tool, the person they pay.',
    measure: 'People with a workaround that costs them real time or money',
    pass: '3 of 5 or more', kill: 'None of 5'
  }),
  fakeDoor: (s) => ({
    id: 'fake-door', name: 'Fake door', days: 5, cost: s === 'Consumers' ? '€100 to €300 in ads' : '€0 to €200',
    how: 'Put a button or landing page with the price in front of at least 200 people from the segment. A click leads to a short "coming soon" note and an optional sign-up.',
    measure: 'Share who click through to sign up',
    pass: '5% or more', kill: 'Under 1%'
  }),
  buyerInterviews: () => ({
    id: 'buyer-interviews', name: 'Buyer interviews', days: 10, cost: '€0',
    how: 'Talk to 8 people who would sign off the budget. Ask what they spend on this problem today and who else has to agree.',
    measure: 'Buyers who name a budget they spend on this problem today',
    pass: '4 of 8 or more', kill: '1 of 8 or none'
  }),
  askForTime: () => ({
    id: 'ask-for-time', name: 'Ask for people', days: 5, cost: '€0',
    how: 'Show a mock-up to the leads of two teams and ask each to name people for a two-week pilot.',
    measure: 'Team leads who name people and dates',
    pass: 'Both teams commit', kill: 'Neither commits'
  }),
  concierge: () => ({
    id: 'concierge', name: 'Concierge run', days: 10, cost: 'Team time only',
    how: 'Deliver the result by hand to 10 people for two weeks, with no product behind it. Watch who asks for it again without being chased.',
    measure: 'People who come back in week two unprompted',
    pass: '6 of 10 or more', kill: '2 of 10 or fewer'
  }),
  paidPilot: () => ({
    id: 'paid-pilot', name: 'Paid pilot or letter of intent', days: 10, cost: '€0',
    how: 'Ask 10 qualified prospects for a paid pilot, a deposit or a signed letter of intent with a price in it.',
    measure: 'Prospects who commit money or a signature',
    pass: '3 of 10 or more', kill: 'None of 10'
  }),
  manualPilot: () => ({
    id: 'manual-pilot', name: 'Two-week manual pilot', days: 10, cost: 'Team time only',
    how: 'Run it by hand for one team for two weeks. Do not remind them to use it in week two.',
    measure: 'Whether the team keeps using it in week two',
    pass: 'Used most working days in week two', kill: 'Dropped after week one'
  }),
  channel: () => ({
    id: 'channel', name: 'Channel test', days: 7, cost: '€200 to €500',
    how: 'Spend a small budget on the one channel you plan to rely on, sending people to a sign-up page. Count only sign-ups from the segment.',
    measure: 'Cost per sign-up from the segment',
    pass: 'At or under your target cost per customer', kill: 'Over three times the target, or no sign-ups from the segment'
  }),
  outbound: () => ({
    id: 'outbound', name: 'Outbound test', days: 10, cost: '€0',
    how: 'Send 50 personal messages to named buyers in the segment, through the route you plan to use at scale.',
    measure: 'First meetings booked',
    pass: '5 or more', kill: '1 or none'
  }),
  rolloutPath: () => ({
    id: 'rollout-path', name: 'Rollout path check', days: 5, cost: '€0',
    how: 'List who must approve access, the systems it touches and the training one team needs. Ask each approver for a date.',
    measure: 'Approvers who give a date',
    pass: 'Every approver gives a date', kill: 'Security, legal or IT says no'
  }),
  doubleSpend: () => ({
    id: 'double-spend', name: 'Repeat at double spend', days: 10, cost: 'Twice the first budget',
    how: 'Run the same channel for two more weeks at twice the budget to see whether the cost holds.',
    measure: 'Change in cost per sign-up',
    pass: 'Rises by under 30%', kill: 'Doubles or more'
  }),
  referral: () => ({
    id: 'referral', name: 'Referral ask', days: 10, cost: '€0',
    how: 'Ask 5 happy customers to introduce one peer each.',
    measure: 'Introductions that turn into a first meeting',
    pass: '2 or more', kill: 'None'
  }),
  secondTeam: () => ({
    id: 'second-team', name: 'Second team', days: 10, cost: 'Team time only',
    how: 'Roll it to a second team with half the support the first team had.',
    measure: 'Whether the second team adopts it',
    pass: 'Used most working days by week two', kill: 'Needs as much hand-holding as the first'
  }),
  prototype5: () => ({
    id: 'prototype-5', name: 'Prototype test with 5 people', days: 4, cost: '€0 to €100 in vouchers',
    how: 'Give 5 people from the segment a clickable prototype and one main task. Do not help them.',
    measure: 'People who finish the main task on their own',
    pass: '4 of 5 or more', kill: '2 of 5 or fewer'
  }),
  unmoderated: () => ({
    id: 'unmoderated', name: 'Unmoderated test with 15 people', days: 5, cost: '€150 to €400',
    how: 'Run the main task with 15 people through a remote testing tool, timing each one.',
    measure: 'People who finish within your target time',
    pass: '12 of 15 or more', kill: 'Under 9 of 15'
  }),
  unitEconomics: (s) => ({
    id: 'unit-economics', name: s === 'An internal team' ? 'Cost against time saved' : 'One-page unit economics', days: 1, cost: '€0',
    how: s === 'An internal team'
      ? 'On one page, set the running cost and support time against the hours it saves each month. Use cautious numbers.'
      : 'On one page: price, cost to serve one customer, cost to win one, and months to pay back. Use cautious numbers.',
    measure: s === 'An internal team' ? 'Value of time saved against cost' : 'Months to pay back the cost of winning a customer',
    pass: s === 'An internal team' ? 'Time saved is worth twice the cost or more' : '12 months or less',
    kill: s === 'An internal team' ? 'Costs more than it saves on hopeful numbers' : 'Each customer loses money even on hopeful numbers'
  }),
  priceTest: () => ({
    id: 'price-test', name: 'Price test', days: 10, cost: '€0',
    how: 'Show two prices, splitting traffic or alternating between sales calls.',
    measure: 'Conversion at the higher price against the lower one',
    pass: '70% or more of the lower price', kill: 'Nobody converts at the price your numbers need'
  }),
  spike: () => ({
    id: 'spike', name: 'Spike on the hardest part', days: 3, cost: 'One engineer',
    how: 'One engineer, two or three days, on only the piece you are least sure of. For an AI feature, run 50 real inputs through the model and grade every output.',
    measure: 'Whether a working path exists, or graded outputs that are acceptable',
    pass: 'A working path, or 40 of 50 acceptable', kill: 'Under 25 of 50, or it needs access you do not control'
  }),
  flag: () => ({
    id: 'flag-test', name: 'Behind a feature flag', days: 10, cost: 'Build the thin slice',
    how: 'Ship the smallest working version to a small share of existing users behind a flag, with a control group that does not see it.',
    measure: 'The behaviour the bet is about, against the control group',
    pass: 'The lift you agreed before launch', kill: 'No lift, or worse than control'
  }),
  loadCost: () => ({
    id: 'load-cost', name: 'Load and cost check', days: 3, cost: 'One engineer',
    how: 'Run the prototype at the volume you expect for a day. Record the cost per use and the response time.',
    measure: 'Cost per use and response time',
    pass: 'Both inside what your numbers allow', kill: 'Cost per use above the price'
  })
};

export function testFor(category, evidence, segment) {
  const s = seg(segment);
  const stage = evidence === 'Some behaviour' ? 'next' : evidence === 'Strong behaviour' ? 'none' : 'early';
  if (stage === 'none') return null;
  const pick = {
    problem: { early: () => T.interviews(s), next: () => T.workaround() },
    value: {
      early: () => (s === 'Large companies' ? T.buyerInterviews() : s === 'An internal team' ? T.askForTime() : T.fakeDoor(s)),
      next: () => (s === 'Consumers' ? T.concierge() : s === 'An internal team' ? T.manualPilot() : T.paidPilot())
    },
    reach: {
      early: () => (s === 'Large companies' ? T.outbound() : s === 'An internal team' ? T.rolloutPath() : T.channel()),
      next: () => (s === 'Large companies' ? T.referral() : s === 'An internal team' ? T.secondTeam() : T.doubleSpend())
    },
    usability: { early: () => T.prototype5(), next: () => T.unmoderated() },
    viability: { early: () => T.unitEconomics(s), next: () => T.priceTest() },
    feasibility: { early: () => T.spike(), next: () => T.loadCost() }
  };
  const f = pick[category]?.[stage];
  return f ? { ...f(), stage } : null;
}

// T2: a bet's test can be swapped for any other test in its category. The pass and kill lines come with the test.
export function testOptions(category, segment) {
  const s = seg(segment);
  const early = testFor(category, 'Nothing yet', s);
  const next = testFor(category, 'Some behaviour', s);
  const opts = [early, next].filter(Boolean);
  if (category === 'value' && s !== 'An internal team') opts.push({ ...T.flag(), stage: 'slice' });
  return opts;
}

export function chosenTest(x, segment) {
  if (x.test) {
    const t = testOptions(x.category, segment).find((o) => o.id === x.test);
    if (t) return { ...t, swapped: true };
  }
  return testFor(x.category, x.evidence in UNCERTAIN_PTS ? x.evidence : 'Opinions only', segment);
}

/* ---------- Assess ---------- */

export function assess(form) {
  const list = (form.assumptions || []).map((x) => ({ ...x, belief: String(x.belief || '').trim() ? x.belief : 'Untitled bet', untitled: !String(x.belief || '').trim() }));
  // C1: a core category nobody has written down is itself a leap of faith.
  const ghosts = CATEGORIES.filter((c) => c.core && !list.some((x) => x.category === c.id)).map((c) => ({
    id: `ghost-${c.id}`, category: c.id, belief: `Nothing written down yet for "${c.label}"`, impact: 'Kills the idea', evidence: 'Nothing yet', ghost: true
  }));
  const all = [...list, ...ghosts].map((x) => ({ ...x, ...scoreOf(x), cat: catById(x.category) || CATEGORIES[0] }));
  const order = (x) => CATEGORIES.findIndex((c) => c.id === x.category);
  // R3: leaps of faith first, then bets to test soon, then watch items. Inside each band, the problem, demand and
  // reach come before use, building and numbers, then higher scores, then category order.
  const bandN = { leap: 0, soon: 1, watch: 2 };
  const ranked = [...all].sort((a, b) =>
    bandN[a.band] - bandN[b.band] || (b.cat.core ? 1 : 0) - (a.cat.core ? 1 : 0) || b.score - a.score || order(a) - order(b));
  ranked.forEach((x, i) => { x.rank = i + 1; });

  const leaps = ranked.filter((x) => x.band === 'leap');
  const soon = ranked.filter((x) => x.band === 'soon');
  const watch = ranked.filter((x) => x.band === 'watch');
  const coreLeaps = leaps.filter((x) => x.cat.core);

  let verdict = 'build';
  let rule = 'V4';
  if (coreLeaps.length) { verdict = 'test'; rule = 'V1'; }
  else if (leaps.length) { verdict = 'prototype'; rule = 'V2'; }
  else if (soon.length) { verdict = 'slice'; rule = 'V3'; }

  const trail = [
    { rule: 'C1', fired: ghosts.length > 0, text: ghosts.length ? `${ghosts.length} core ${ghosts.length === 1 ? 'category has' : 'categories have'} no assumption written down, so ${ghosts.length === 1 ? 'it counts' : 'each counts'} as a leap of faith` : 'Every core category has at least one assumption' },
    { rule: 'R2', fired: leaps.length > 0, text: leaps.length ? `${leaps.length} leap${leaps.length === 1 ? '' : 's'} of faith: could kill the idea, with nothing or only opinions behind ${leaps.length === 1 ? 'it' : 'them'}` : 'No leaps of faith' },
    { rule: 'V1', fired: rule === 'V1', text: 'A leap of faith about the problem, the demand or reaching people: Test before you build' },
    { rule: 'V2', fired: rule === 'V2', text: 'Leaps of faith only about use, numbers or building: Prototype first' },
    { rule: 'V3', fired: rule === 'V3', text: 'No leaps, but bets scoring 6 to 8: Build a thin slice' },
    { rule: 'V4', fired: rule === 'V4', text: 'Nothing scores 6 or more: Build it' }
  ];

  return { all: ranked, list, ghosts, leaps, soon, watch, verdict, rule, trail, plan: planTests(ranked, form), thin: list.length < 4 };
}

/* ---------- Plan ---------- */

// S1: tests run one after another in rank order, inside the time box.
// S2: two bets that need the same test share one run of it.
// T1: only bets scoring 6 or more get a test. Watch items get a metric.
export function planTests(ranked, form) {
  // A3: a typed-in time box like "3 weeks" counts five working days a week. Anything unreadable counts as 4 weeks.
  const weeks = parseFloat(String(form.timebox || '').replace(',', '.'));
  const box = BOX_DAYS[form.timebox] || (weeks > 0 && weeks <= 52 ? Math.round(weeks * 5) : 20);
  const runs = [];
  ranked.filter((x) => x.score >= 6).forEach((x) => {
    const t = chosenTest(x, form.segment);
    if (!t) return;
    const same = runs.find((r) => r.test.id === t.id && r.category === x.category);
    if (same) { same.bets.push(x); return; }
    runs.push({ test: t, category: x.category, bets: [x] });
  });
  let day = 0;
  runs.forEach((r) => {
    r.start = day + 1;
    r.end = day + r.test.days;
    r.inBox = r.end <= box;
    day = r.end;
  });
  return { runs, box, used: Math.min(day, box), total: day, later: runs.filter((r) => !r.inBox) };
}

/* ---------- Model reply ---------- */

export function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[‘’“”]/g, "'")
    .replace(/["']/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseReply(text) {
  const out = { summary: '', assumptions: [], questions: [] };
  String(text || '').split('\n').forEach((raw) => {
    const line = raw.trim().replace(/^[-*]\s*/, '');
    const parts = line.split('|').map((p) => p.trim());
    const tag = parts[0]?.toUpperCase();
    if (tag === 'SUMMARY' && parts[1]) out.summary = parts[1];
    else if (tag === 'ASSUMPTION' && parts.length >= 6) out.assumptions.push({ category: parts[1], belief: parts[2], quote: parts[3], evidence: parts[4], why: parts.slice(5).join(' ') });
    else if (tag === 'QUESTION' && parts[1]) out.questions.push(parts[1]);
  });
  return out;
}

// M1: a suggestion counts only if its quote is in the notes, and its category and evidence are listed options.
// E1 then caps the evidence if the quote only reports what people said.
export function checkSuggestions(parsed, form) {
  const notes = norm(form.notes);
  const kept = [];
  const dropped = [];
  parsed.assumptions.forEach((s) => {
    const cat = CATEGORIES.find((c) => norm(c.label) === norm(s.category) || norm(c.id) === norm(s.category) || norm(c.short) === norm(s.category));
    const ev = EVIDENCE.find((e) => norm(e) === norm(s.evidence));
    if (!cat || !ev) { dropped.push({ ...s, reason: 'The category or evidence level is not a listed option' }); return; }
    if (!s.quote || !notes.includes(norm(s.quote))) { dropped.push({ ...s, reason: 'The quote is not in your notes' }); return; }
    const capped = capEvidence(ev, s.quote);
    const added = (form.assumptions || []).some((x) => x.quote && norm(x.quote) === norm(s.quote));
    kept.push({ ...s, category: cat.id, evidence: capped.evidence, suggested: ev, capped: capped.capped, added });
  });
  return { kept, dropped };
}

/* ---------- Note ---------- */

export function noteMarkdown(form, a, today, parsed) {
  const v = VERDICTS[a.verdict];
  const date = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const L = [];
  L.push(`# ${form.name || 'Untitled idea'}: riskiest bets`);
  L.push('');
  if (form.pitch) L.push(`> ${form.pitch}`, '');
  L.push(`For: ${form.segment || 'not given'} · Time box: ${form.timebox} · ${date}`);
  L.push('');
  L.push(`## Verdict: ${v.label} (rule ${a.rule})`);
  L.push('');
  L.push(v.line);
  L.push('');
  L.push('## Bets, riskiest first');
  L.push('');
  L.push('| # | Bet | Category | Impact if wrong | Evidence | Score | Band |');
  L.push('| --- | --- | --- | --- | --- | --- | --- |');
  a.all.forEach((x) => L.push(`| ${x.rank} | ${x.belief.replace(/\|/g, '/')} | ${x.cat.label} | ${x.impact} | ${x.evidence} | ${x.score} | ${BANDS[x.band].label} |`));
  L.push('');
  L.push('## Test plan');
  L.push('');
  if (!a.plan.runs.length) L.push('No bet scores 6 or more. Keep a metric on each one.');
  a.plan.runs.forEach((r, i) => {
    L.push(`### ${i + 1}. ${r.test.name} (days ${r.start} to ${r.end}${r.inBox ? '' : ', after this time box'})`);
    L.push('');
    L.push(`Tests: ${r.bets.map((b) => b.belief).join('; ')}`);
    L.push('');
    L.push(`- How: ${r.test.how}`);
    L.push(`- Cost: ${r.test.cost}`);
    L.push(`- Measure: ${r.test.measure}`);
    L.push(`- Pass: ${r.test.pass}`);
    L.push(`- Kill: ${r.test.kill}`);
    L.push('');
  });
  if (parsed && parsed.questions.length) {
    L.push('## Questions for user interviews');
    L.push('');
    parsed.questions.forEach((q) => L.push(`- ${q}`));
    L.push('');
  }
  L.push('Pass and kill lines are agreed before each test runs. Made with Riskiest Bet First, a daily AI build by Prerna Kakkar.');
  return L.join('\n');
}
