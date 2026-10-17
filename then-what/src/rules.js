// Then What?: printed rules.
// Every finding, score, ranking, verdict, fix and test plan comes from this file.
// A model only reads the activation notes and points at moments where people stall, quoting them
// (see api/read.js), and each of those is checked here before it can count.

export const SEGMENTS = ['Individuals', 'Small teams', 'Developers', 'Consumers', 'Sales-assisted accounts'];
export const WINDOWS = ['1 day', '7 days', '14 days', '30 days'];

export const WIN_DEFS = ['A core job done', 'A setup action', 'A visit or sign-in', 'Not agreed yet'];
export const WIN_HINT = {
  'A core job done': 'The result people came for: an invoice paid, a rota published, a report read',
  'A setup action': 'Profile complete, workspace created, integration connected',
  'A visit or sign-in': 'Came back, opened the app, logged in again',
  'Not agreed yet': 'The team has no single activation event'
};

export const FIRST_SCREENS = ['Empty, no guidance', 'Empty with one clear first action', 'Sample data or a template', 'Guided checklist'];

export const SUPPORT = [
  'Welcome email', 'Onboarding checklist', 'Empty-state guidance', 'Sample data or templates',
  'In-app tips', 'Nudge emails in week one', 'Human onboarding call', 'Messages after the first win'
];
// What counts as a nudge towards the first win (rule N1). A welcome email alone does not.
export const NUDGES = ['Onboarding checklist', 'Empty-state guidance', 'In-app tips', 'Nudge emails in week one', 'Human onboarding call'];

export const MODES = ['Required', 'Optional'];
export const WHO = ['They can do it alone', 'Needs someone else'];

// Milestone library. "line" is the alert line: flag the milestone when fewer than this share of the
// people at the milestone before it get here. These are starting lines I set from experience,
// not published benchmarks. Change them to your own.
export const STEP_TYPES = [
  { id: 'signup', label: 'Signed up', line: null, hint: 'Where the cohort starts' },
  { id: 'setup', label: 'Setup step', line: 80, hint: 'Profile, workspace, settings, roles' },
  { id: 'template', label: 'Pick a template or sample', line: 85, hint: 'Start from something ready-made' },
  { id: 'import', label: 'Import or connect data', line: 65, hint: 'Upload a file, connect a bank, CRM or calendar' },
  { id: 'install', label: 'Install something', line: 70, hint: 'SDK, browser extension, mobile app, integration' },
  { id: 'invite', label: 'Invite someone', line: 55, hint: 'Colleagues, staff, clients or an admin' },
  { id: 'core', label: 'First core action', line: 75, hint: 'The first time they do the main thing' },
  { id: 'win', label: 'First win', line: 75, hint: 'The first time the product proves its value. Your activation event' },
  { id: 'repeat', label: 'Second use', line: 55, hint: 'Comes back and gets the result again' },
  { id: 'habit', label: 'Regular use', line: 65, hint: 'Uses it most weeks' },
  { id: 'share', label: 'Shares the result', line: 50, hint: 'Sends, exports or presents what it made' }
];
export const CUSTOM_LINE = 70;
export const SETUP_TYPES = ['setup', 'template', 'import', 'install', 'invite'];
export const STICK_TYPES = ['repeat', 'habit'];
export const typeById = (id) => STEP_TYPES.find((t) => t.id === id);
export const typeLabel = (step) => typeById(step.type)?.label || step.type || 'Milestone';
export const lineFor = (step) => {
  const n = Number(step.line);
  if (step.line !== undefined && step.line !== '' && Number.isFinite(n) && n > 0 && n <= 100) return n;
  return typeById(step.type)?.line ?? CUSTOM_LINE;
};

export const PHASES = {
  setup: { label: 'Setting up', short: 'Setup' },
  win: { label: 'Reaching the first win', short: 'First win' },
  stick: { label: 'Making it stick', short: 'Stick' }
};

export const SEVERITY = {
  High: { pts: 3, tone: 'bad' },
  Medium: { pts: 2, tone: 'warn' },
  Low: { pts: 1, tone: 'ok' }
};

// What a model may call a moment in the notes, and the severity each kind carries (rule M3).
export const KINDS = [
  { id: 'Waiting on someone', sev: 'High', ask: 'People cannot carry on until a colleague, admin or another system acts' },
  { id: 'Error or dead end', sev: 'High', ask: 'An error, a failed import or a page with no way forward' },
  { id: 'Setup before payoff', sev: 'Medium', ask: 'Effort is asked before anything useful has happened' },
  { id: 'Blank start', sev: 'Medium', ask: 'People land and do not know what to do first' },
  { id: 'Value unclear', sev: 'Medium', ask: 'People do the main action but do not see what it did for them' },
  { id: 'Nothing brings them back', sev: 'Medium', ask: 'After a first visit or first win, nothing gives people a reason to return' },
  { id: 'Confusing wording', sev: 'Low', ask: 'Copy that leaves people unsure what to do or what happens next' }
];
export const kindById = (id) => KINDS.find((k) => normalise(k.id) === normalise(id));

// Which rule finding a moment tied to no milestone joins, by kind (rule M4).
const STEP0_HOSTS = {
  'Blank start': ['P3'],
  'Nothing brings them back': ['N2', 'H1', 'D3'],
  'Waiting on someone': ['P1'],
  'Setup before payoff': ['P2', 'P4', 'P5']
};

// Fix and test library. Every finding points at one of these.
export const FIXES = {
  D1: {
    fix: 'Pick the one action that shows the product did its job for this person (an invoice paid, a rota published, a summary read) and agree it with product, sales and customer success. Count it as an event from today.',
    change: 'No test yet. Agree the first win and start counting it',
    metric: 'Sign-ups reaching that event inside the window',
    guard: 'None until the event exists'
  },
  D2: {
    fix: 'Move the activation event to the first result people came for. Keep the visit or setup event as a milestone on the way.',
    change: 'Activation redefined, and last quarter counted again against the new event',
    metric: 'Share reaching the new event, and how well it predicts who is still active in week four',
    guard: 'Reported activation will fall. Agree that with whoever owns the number first'
  },
  D3: {
    fix: 'Add the milestone after the first win, such as a second use within seven days, so you can see whether the win led anywhere.',
    change: 'Second-use event added and tracked',
    metric: 'People with a first win who come back within 7 days',
    guard: 'None needed'
  },
  P1: {
    fix: 'Let one person reach the first win alone. Ask for the colleague, admin or approval after they have something to show.',
    change: 'A solo path to the first win, with the step that needs someone else moved after it',
    metric: 'Sign-ups reaching the first win inside the window',
    guard: 'Accounts with a second active person by day 30'
  },
  P2: {
    fix: 'Load sample data or a ready template so people see a real result before they bring their own data. Offer the import once they want their own version.',
    change: 'Sample workspace on by default, import prompt after the first win',
    metric: 'Sign-ups reaching the first win within 24 hours',
    guard: 'Share who import real data by day 7'
  },
  P3: {
    fix: 'Replace the empty first screen with one clear first action, or a sample to explore, and a line on what good looks like.',
    change: 'Empty state rewritten around one action',
    metric: 'Sign-ups who take the first action on day one',
    guard: 'Support tickets in week one'
  },
  P4: {
    fix: 'Cut or defer every required milestone that does not have to happen before the first win.',
    change: 'The two weakest required milestones moved after the first win',
    metric: 'Median time from sign-up to first win',
    guard: 'Setup completeness by day 30'
  },
  P5: {
    fix: 'Give people a way to see the result before installing anything: a hosted sandbox, a test mode or a run on their own inputs.',
    change: 'Try-it-first path ahead of the install',
    metric: 'Sign-ups reaching the first win, and installs among them',
    guard: 'Installs per new account by day 14'
  },
  T1: {
    fix: 'Find the slowest stretch on the way to the first win and remove the wait, or give people something useful to do while it happens.',
    change: 'Slowest milestone shortened or moved after the first win',
    metric: 'Median hours from sign-up to first win',
    guard: 'Share reaching the first win at all'
  },
  T2: {
    fix: 'Look at what people wait for here (an email, an approval, a sync, another person) and either remove it or let people carry on while it happens.',
    change: 'The wait at this milestone removed or made non-blocking',
    metric: 'Median hours spent getting to this milestone',
    guard: 'Errors or failed syncs at this milestone'
  },
  N1: {
    fix: 'Add prompts that point people at the next step: a checklist in the product and two emails in the first week that each name one action.',
    change: 'Checklist plus day-1 and day-3 emails for half of new sign-ups',
    metric: 'Sign-ups reaching the first win inside the window',
    guard: 'Unsubscribes and spam complaints'
  },
  N2: {
    fix: 'Give people a reason to come back after the first win: the next result to get, a digest of what changed, or a reminder when the job comes round again.',
    change: 'One message after the first win pointing at the second use',
    metric: 'People with a first win who come back within 7 days',
    guard: 'Unsubscribes'
  },
  H1: {
    fix: 'Talk to ten people who got the first win and did not return. Find out whether the job is occasional, the result was not good enough, or nothing reminded them, then fix the reason most of them give.',
    change: 'One change aimed at the most common reason',
    metric: 'People with a first win who come back within 7 days',
    guard: 'Activation rate, so the fix does not trade one for the other'
  },
  SG1: {
    fix: 'Look at that group’s path on its own. Either give it a first win and path that suit it, or decide it is not who the product is for and stop spending acquisition on it.',
    change: 'A path built for that segment, or a change to who you target',
    metric: 'Activation rate for that segment',
    guard: 'Activation rate for the best segment'
  },
  G4: {
    fix: 'Do not guess. Watch ten session recordings of people who stalled here and read the tickets that mention it, then write down what you saw.',
    change: 'No test yet. Find the cause first',
    metric: 'Share of people who reach this milestone',
    guard: 'None until the cause is known'
  },
  K: {
    'Waiting on someone': {
      fix: 'Give the person a way forward on their own while the other party catches up, and chase that party for them.',
      change: 'The dependency made non-blocking before the first win',
      metric: 'Share who reach the next milestone',
      guard: 'Whatever the dependency was protecting'
    },
    'Error or dead end': {
      fix: 'Fix the error first, then give every error screen one clear next action and a way to reach a person.',
      change: 'Bug fixed and the error screen rewritten',
      metric: 'Share who hit the error, then share who recover',
      guard: 'Support tickets about this milestone'
    },
    'Setup before payoff': {
      fix: 'Ask only for what this moment needs and move the rest after the first win, with sensible defaults in its place.',
      change: 'Defaults in place of the required setup',
      metric: 'Share who reach the next milestone',
      guard: 'Setup completeness by day 30'
    },
    'Blank start': {
      fix: 'Show one clear first action and an example of what good looks like on the first screen.',
      change: 'First screen redesigned around one action',
      metric: 'Sign-ups who take the first action on day one',
      guard: 'None needed'
    },
    'Value unclear': {
      fix: 'Make the result point at what it saved or changed for the person, in their words, at the moment they see it.',
      change: 'The first result shows its payoff up front',
      metric: 'People with a first win who come back within 7 days',
      guard: 'Satisfaction with the result, from a one-question survey'
    },
    'Nothing brings them back': {
      fix: 'Tie a return prompt to the moment the job comes round again, not to a fixed schedule.',
      change: 'One triggered message or reminder',
      metric: 'People with a first win who come back within 7 days',
      guard: 'Unsubscribes'
    },
    'Confusing wording': {
      fix: 'Rewrite the copy to say what happens next, using the words people use in tickets.',
      change: 'New copy on this screen',
      metric: 'Share who reach the next milestone',
      guard: 'None needed'
    }
  }
};

export const VERDICTS = {
  define: { label: 'Agree what the first win is', tone: 'bad', line: 'Activation is not pinned to a result people came for, so any gap you find may be the wrong one. Settle the event first.' },
  shorten: { label: 'Shorten the road to the first win', tone: 'bad', line: 'Something serious stands between sign-up and the first moment the product proves its value. Fix that before anything else.' },
  stick: { label: 'Make the first win stick', tone: 'warn', line: 'People reach the first win, but too few come back. Keeping someone who already got value costs less than finding a new sign-up.' },
  smooth: { label: 'Smooth the stuck points', tone: 'warn', line: 'Nothing blocks the way, but several moments slow people down. Work down the list one test at a time.' },
  tune: { label: 'Measure and tune', tone: 'ok', line: 'No serious gap found. Keep counting each milestone and test small changes.' }
};

const n = (v) => {
  const x = Number(String(v ?? '').replace(/[,\s]/g, ''));
  return Number.isFinite(x) && String(v ?? '').trim() !== '' ? x : null;
};
const isCustomType = (s) => !typeById(s.type);
const req = (s) => (s.mode || 'Required') !== 'Optional';
const round1 = (x) => Math.round(x * 10) / 10;

export const normalise = (s) => String(s || '').toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();

export const fmtHours = (h) => {
  if (h === null || h === undefined) return 'n/a';
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 48) return `${round1(h)} h`;
  return `${round1(h / 24)} days`;
};

// Time lines for rule T1 and T2, in hours. Sales-assisted accounts get longer lines.
export const timeLines = (segment) => (segment === 'Sales-assisted accounts' ? { medium: 168, high: 336, hop: 120 } : { medium: 24, high: 72, hop: 24 });

/* ---------- Ladder (rules G1 to G3) ---------- */

export function ladder(form) {
  const steps = form.steps || [];
  const rows = steps.map((s, i) => ({ step: s, i, count: n(s.count), hours: n(s.hours) }));
  const first = rows.find((r) => r.count !== null)?.count || null;
  const out = rows.map((r, idx) => {
    const prev = rows[idx - 1];
    let reach = null;
    let lost = null;
    if (idx > 0 && r.count !== null && prev && prev.count !== null && prev.count > 0) {
      reach = round1((r.count / prev.count) * 100);
      lost = Math.max(0, prev.count - r.count);
    }
    const line = idx === 0 ? null : lineFor(r.step);
    const gap = reach !== null && line !== null && reach < line;
    const hop = idx > 0 && r.hours !== null && prev && prev.hours !== null ? Math.max(0, r.hours - prev.hours) : null;
    return { ...r, reach, lost, line, gap, hop, share: first && r.count !== null ? round1((r.count / first) * 100) : null };
  });
  const withLoss = out.filter((r) => r.lost !== null && r.lost > 0);
  const biggest = withLoss.length ? withLoss.reduce((a, b) => (b.lost > a.lost ? b : a)) : null;
  const wIdx = steps.findIndex((s) => s.type === 'win');
  const start = out.find((r) => r.count !== null);
  const winRow = wIdx >= 0 ? out[wIdx] : null;
  const activation = start && winRow && winRow.count !== null && start.count > 0 && winRow.i !== start.i ? round1((winRow.count / start.count) * 100) : null;
  const sIdx = wIdx >= 0 ? steps.findIndex((s, i) => i > wIdx && STICK_TYPES.includes(s.type)) : -1;
  const stickRow = sIdx >= 0 ? out[sIdx] : null;
  const stick = winRow && stickRow && winRow.count && stickRow.count !== null ? round1((stickRow.count / winRow.count) * 100) : null;
  const timeToWin = winRow ? winRow.hours : null;
  return { rows: out, biggest, hasCounts: out.some((r) => r.reach !== null), activation, stick, sIdx, wIdx, timeToWin };
}

/* ---------- Model reply ---------- */

export function parseReply(text) {
  const out = { summary: '', moments: [], questions: [] };
  String(text || '').split('\n').forEach((raw) => {
    const line = raw.trim().replace(/^[-*]\s*/, '');
    const parts = line.split('|').map((x) => x.trim());
    const tag = parts[0]?.toUpperCase();
    if (tag === 'SUMMARY' && parts[1]) out.summary = parts.slice(1).join(' ');
    else if ((tag === 'STUCK' || tag === 'MOMENT') && parts.length >= 6) {
      const q = parts[4];
      out.moments.push({ step: parts[1], kind: parts[2], what: parts[3], quote: /^["“].*["”]$/.test(q) && (q.match(/["“”]/g) || []).length === 2 ? q.slice(1, -1) : q, why: parts.slice(5).join(' ') });
    } else if (tag === 'QUESTION' && parts[1]) out.questions.push(parts.slice(1).join(' '));
  });
  return out;
}

// Rules M1 and M2: a moment counts only if its quote is in the notes and its kind is listed.
// Rule M3 sets its severity from the kind. Its milestone number must exist, or it is tied to no milestone.
export function checkMoments(parsed, form) {
  const notes = normalise(form.notes);
  const kept = [];
  const dropped = [];
  parsed.moments.forEach((m) => {
    const q = normalise(m.quote);
    const kind = kindById(m.kind);
    if (!q || q.length < 8 || !notes.includes(q)) return dropped.push({ ...m, reason: 'Quote not found in your notes' });
    if (!kind) return dropped.push({ ...m, reason: 'Kind not on the list' });
    const num = parseInt(m.step, 10);
    const stepIdx = Number.isFinite(num) && num >= 1 && num <= (form.steps || []).length ? num - 1 : null;
    kept.push({ ...m, kind: kind.id, sev: kind.sev, stepIdx });
  });
  return { kept, dropped };
}

/* ---------- Findings ---------- */

export function assess(form, moments = [], dismissed = {}) {
  const steps = form.steps || [];
  const lad = ladder(form);
  const wIdx = lad.wIdx;
  const isBefore = (i) => (wIdx >= 0 ? i < wIdx : true);
  const support = form.support || [];
  const hasSample = support.includes('Sample data or templates') || form.firstScreen === 'Sample data or a template';
  const tl = timeLines(form.segment);
  const phaseOf = (i) => {
    if (i === null || i === undefined) return 'win';
    if (wIdx >= 0 && i > wIdx) return 'stick';
    return SETUP_TYPES.includes(steps[i]?.type) ? 'setup' : 'win';
  };
  const found = [];
  const add = (f) => found.push(f);
  const name = (i) => steps[i]?.label || typeLabel(steps[i] || {});

  // D1 no agreed first win
  if (wIdx < 0 || form.winDef === 'Not agreed yet') {
    add({ id: 'D1', sev: 'High', phase: 'win', stepIdx: null, title: wIdx < 0 ? 'No first win on the ladder' : 'The team has not agreed what activation is', why: 'Without one agreed moment where the product proves its value, every gap is measured against a moving finish line.' });
  }
  // D2 activation counts the wrong thing
  if (wIdx >= 0 && form.winDef === 'A visit or sign-in') {
    add({ id: 'D2', sev: 'High', phase: 'win', stepIdx: wIdx, title: 'Activation counts a visit, not a result', why: 'Coming back or signing in says nothing about whether the product did its job. The rate will look healthy while people leave.' });
  } else if (wIdx >= 0 && form.winDef === 'A setup action') {
    add({ id: 'D2', sev: 'Medium', phase: 'win', stepIdx: wIdx, title: 'Activation counts setup, not a result', why: 'Finishing setup shows effort, not value. People can complete it and still never get what they came for.' });
  }
  // D3 nothing after the win
  if (wIdx >= 0 && lad.sIdx < 0) {
    add({ id: 'D3', sev: 'Medium', phase: 'stick', stepIdx: null, title: 'Nothing measures whether the first win sticks', why: 'With no second use or regular use on the ladder, a first win that leads nowhere looks the same as one that turns into a habit.' });
  }
  // P1 needs someone else before the win
  const p1 = new Set();
  steps.forEach((s, i) => {
    if (i > 0 && isBefore(i) && req(s) && (s.who === 'Needs someone else' || s.type === 'invite')) {
      p1.add(i);
      add({ id: 'P1', sev: 'High', phase: phaseOf(i), stepIdx: i, title: `${name(i)} needs someone else before the first win`, why: 'The person who signed up cannot reach value until another person acts. Most of those people have no reason to hurry.' });
    }
  });
  // P2 real data before the win, with nothing to try
  steps.forEach((s, i) => {
    if (i > 0 && isBefore(i) && req(s) && s.type === 'import' && !hasSample && !p1.has(i)) {
      add({ id: 'P2', sev: 'High', phase: 'setup', stepIdx: i, title: `${name(i)} comes before any result, with nothing to try first`, why: 'Bringing real data takes time, files and trust. Without a sample, the product looks empty until it is done.' });
    }
  });
  // P3 empty first screen
  if (form.firstScreen === 'Empty, no guidance' && !support.includes('Empty-state guidance') && !support.includes('Onboarding checklist')) {
    add({ id: 'P3', sev: 'Medium', phase: 'setup', stepIdx: null, title: 'First screen is empty, with nothing to do', why: 'People who land on a blank screen have to work out the product before they can use it. Many close the tab instead.' });
  }
  // P4 long road to the win
  const between = wIdx >= 0 ? steps.slice(1, wIdx) : steps.slice(1);
  const reqBetween = between.filter(req).length;
  if (reqBetween > 3) {
    add({ id: 'P4', sev: reqBetween > 5 ? 'High' : 'Medium', phase: 'setup', stepIdx: null, title: `${reqBetween} required milestones before the first win`, why: 'Each milestone loses some people, and the losses multiply. Fewer stops on the way keep more of them.' });
  }
  // P5 install before the win
  steps.forEach((s, i) => {
    if (i > 0 && isBefore(i) && req(s) && s.type === 'install' && !p1.has(i)) {
      add({ id: 'P5', sev: 'Medium', phase: 'setup', stepIdx: i, title: `${name(i)} before any result`, why: 'Installing asks for a commitment, a release or an approval before people have seen whether it works for them.' });
    }
  });
  // T1 slow to the win
  const t1 = lad.timeToWin !== null && lad.timeToWin > tl.medium;
  if (t1) {
    add({ id: 'T1', sev: lad.timeToWin > tl.high ? 'High' : 'Medium', phase: 'win', stepIdx: null, title: `Half of those who get there take ${fmtHours(lad.timeToWin)} to the first win`, why: `Past ${fmtHours(tl.medium)} the first visit has gone cold, and the reason people signed up has often moved on.` });
  }
  // T2 where the wait sits
  if (wIdx > 0 && lad.timeToWin) {
    const hops = lad.rows.slice(1, wIdx + 1).filter((r) => r.hop !== null);
    if (hops.length) {
      const slow = hops.reduce((a, b) => (b.hop > a.hop ? b : a));
      if (slow.hop > tl.hop && slow.hop > lad.timeToWin / 2) {
        add({ id: 'T2', sev: 'Medium', phase: phaseOf(slow.i), stepIdx: slow.i, title: `Most of the wait sits before ${name(slow.i)}`, why: `${fmtHours(slow.hop)} of the ${fmtHours(lad.timeToWin)} to the first win is spent getting to this milestone.` });
      }
    }
  }
  // N1 no nudges towards the win
  if (wIdx >= 0 && !support.some((x) => NUDGES.includes(x))) {
    add({ id: 'N1', sev: t1 ? 'High' : 'Medium', phase: 'win', stepIdx: null, title: 'Nothing nudges people towards the first win', why: 'People who stall on day one get no prompt to come back and carry on, so a pause becomes an exit.' });
  }
  // H1 the win does not stick
  if (lad.stick !== null && lad.stick < 40) {
    add({ id: 'H1', sev: 'High', phase: 'stick', stepIdx: lad.sIdx, title: `Only ${lad.stick}% come back after the first win`, why: 'Most people got value once and did not return. Activation without a second use rarely turns into a paying habit.' });
  }
  // N2 nothing after the win, and the stick milestones leak
  const stickGap = lad.rows.some((r) => wIdx >= 0 && r.i > wIdx && r.gap);
  if (stickGap && !support.includes('Messages after the first win')) {
    add({ id: 'N2', sev: 'Medium', phase: 'stick', stepIdx: null, title: 'Nothing reaches people after the first win', why: 'The milestones after the win leak, and no message gives people a reason to come back for the second result.' });
  }
  // SG1 segment gaps
  const segs = (form.segments || []).map((s) => ({ ...s, r: n(s.rate) })).filter((s) => s.name && s.r !== null);
  if (segs.length >= 2) {
    const best = segs.reduce((a, b) => (b.r > a.r ? b : a));
    segs.forEach((s) => {
      if (s === best || best.r <= 0) return;
      const ratio = s.r / best.r;
      if (ratio < 0.6) {
        add({ id: 'SG1', segKey: s.name, sev: ratio < 0.4 ? 'High' : 'Medium', phase: 'win', stepIdx: null, title: `${s.name} activate at ${s.r}%, against ${best.r}% for ${best.name}`, why: `That is ${Math.round(ratio * 100)}% of the best segment's rate. The path may suit one kind of customer and not the other.` });
      }
    });
  }

  // Model moments (rule M3 severity from kind, rule M4 joins them to a rule finding)
  const rank3 = { High: 3, Medium: 2, Low: 1 };
  let mNum = 0;
  moments.forEach((m) => {
    const stepIdx = m.stepIdx;
    let host = null;
    if (m.kind !== 'Error or dead end') {
      if (stepIdx !== null) host = found.find((f) => !f.model && f.stepIdx === stepIdx);
      else host = (STEP0_HOSTS[m.kind] || []).map((id) => found.find((f) => !f.model && f.id === id)).find(Boolean) || null;
    }
    if (host) {
      host.quotes = [...(host.quotes || []), m.quote];
      host.noted = true;
      if (rank3[m.sev] > rank3[host.sev]) { host.sev = m.sev; host.raised = m.kind; }
      return;
    }
    const phase = stepIdx !== null ? phaseOf(stepIdx)
      : m.kind === 'Nothing brings them back' ? 'stick'
      : ['Blank start', 'Setup before payoff'].includes(m.kind) ? 'setup' : 'win';
    mNum += 1;
    add({ id: `M${mNum}`, model: true, noted: true, kind: m.kind, sev: m.sev, phase, stepIdx, title: m.what, why: m.why, quotes: [m.quote] });
  });

  // G4: a gap with nothing explaining it
  lad.rows.forEach((r) => {
    if (r.gap && !found.some((f) => f.stepIdx === r.i)) {
      add({ id: 'G4', sev: 'Medium', phase: phaseOf(r.i), stepIdx: r.i, title: `Unexplained gap before ${name(r.i)}`, why: `Only ${r.reach}% of people get here from the milestone before, under the ${r.line}% alert line, and nothing on the ladder or in your notes explains it yet.`, unexplained: true });
    }
  });

  // Scoring (rules R1 to R3)
  const scored = found.map((f) => {
    const row = f.stepIdx !== null ? lad.rows[f.stepIdx] : null;
    const gapPts = row?.gap ? 2 : 0;
    const bigPts = lad.biggest && row && lad.biggest.i === row.i ? 1 : 0;
    const quotePts = f.noted ? 1 : 0;
    const score = SEVERITY[f.sev].pts * 2 + gapPts + bigPts + quotePts;
    const lib = f.model ? FIXES.K[f.kind] : FIXES[f.id];
    return { ...f, key: `${f.id}-${f.stepIdx}-${f.segKey || ''}`, score, gapPts, bigPts, quotePts, row, lib };
  });
  const order = { setup: 0, win: 1, stick: 2 };
  const ranked = scored
    .filter((f) => !dismissed[f.key])
    .sort((a, b) => b.score - a.score || order[a.phase] - order[b.phase] || (a.stepIdx ?? 99) - (b.stepIdx ?? 99))
    .map((f, i) => ({ ...f, rank: i + 1 }));
  const hidden = scored.filter((f) => dismissed[f.key]);

  // Verdict (rules V0 to V4)
  const defineFired = ranked.some((f) => f.id === 'D1' || (f.id === 'D2' && f.sev === 'High'));
  const highBefore = ranked.filter((f) => f.sev === 'High' && f.phase !== 'stick');
  const highAfter = ranked.filter((f) => f.sev === 'High' && f.phase === 'stick');
  const mediums = ranked.filter((f) => f.sev === 'Medium');
  let verdict = 'tune';
  let rule = 'V4';
  if (defineFired) { verdict = 'define'; rule = 'V0'; }
  else if (highBefore.length) { verdict = 'shorten'; rule = 'V1'; }
  else if (highAfter.length) { verdict = 'stick'; rule = 'V2'; }
  else if (mediums.length) { verdict = 'smooth'; rule = 'V3'; }

  const trail = [
    { rule: 'V0', fired: rule === 'V0', text: `First win missing, not agreed or counting a visit: ${defineFired ? 'yes' : 'no'}` },
    { rule: 'V1', fired: rule === 'V1', text: `High findings on the way to the first win: ${highBefore.length}` },
    { rule: 'V2', fired: rule === 'V2', text: `High findings after the first win: ${highAfter.length}` },
    { rule: 'V3', fired: rule === 'V3', text: `Medium findings: ${mediums.length}` },
    { rule: 'V4', fired: rule === 'V4', text: 'Only low findings or none' }
  ];

  return {
    ranked, hidden, verdict, rule, trail, lad, wIdx, reqBetween, tl,
    custom: steps.filter(isCustomType).length,
    bySev: { High: ranked.filter((f) => f.sev === 'High').length, Medium: mediums.length, Low: ranked.filter((f) => f.sev === 'Low').length },
    byPhase: Object.fromEntries(Object.keys(PHASES).map((p) => [p, ranked.filter((f) => f.phase === p)]))
  };
}

export const RULES_TABLE = [
  ['G1', 'For each milestone with a count, reach = people at this milestone ÷ people at the one before'],
  ['G2', 'A milestone has a gap when reach falls under its alert line. The milestone losing the most people is the biggest gap'],
  ['G3', 'Counts and times are optional. Without them the findings still stand, ranked on severity alone'],
  ['G4', 'A gap that no rule or note explains becomes an Unexplained gap (Medium), with a fix of finding the cause before changing anything'],
  ['D1', 'No first win on the ladder, or the team has not agreed one: High'],
  ['D2', 'Activation counts a visit or sign-in: High. It counts a setup action: Medium'],
  ['D3', 'No second use or regular use after the first win: Medium'],
  ['P1', 'A required milestone before the first win that needs someone else (an invite, an admin, staff accepting): High'],
  ['P2', 'Required import or connection before the first win, with no sample data or template: High'],
  ['P3', 'An empty first screen with no empty-state guidance or checklist: Medium'],
  ['P4', 'More than 3 required milestones between sign-up and the first win: Medium. More than 5: High'],
  ['P5', 'A required install before the first win: Medium'],
  ['T1', 'Median time to the first win over 24 hours: Medium. Over 72 hours: High. For sales-assisted accounts, 7 and 14 days'],
  ['T2', 'One stretch on the way to the first win takes over half the total time and over 24 hours (5 days if sales-assisted): Medium'],
  ['N1', 'No checklist, guidance, tips, week-one nudges or onboarding call before the first win: Medium, High if T1 fires. A welcome email alone does not count'],
  ['N2', 'A milestone after the first win has a gap and nothing is sent after the win: Medium'],
  ['H1', 'Fewer than 40% of people with a first win reach the next second-use or regular-use milestone: High'],
  ['SG1', 'A segment activating at under 60% of the best segment’s rate: Medium. Under 40%: High'],
  ['M1', 'A model moment counts only if its quote is in your notes, word for word'],
  ['M2', 'Its kind must be on the printed list. Its milestone number must exist, or it is tied to no milestone'],
  ['M3', 'The kind sets the severity: Waiting on someone and Error or dead end are High; Setup before payoff, Blank start, Value unclear and Nothing brings them back are Medium; Confusing wording is Low'],
  ['M4', 'A moment on a milestone a rule already flags joins that finding as evidence and keeps the higher severity. A moment tied to no milestone joins the matching rule by kind (Blank start to P3, Nothing brings them back to N2, H1 or D3, Waiting on someone to P1, Setup before payoff to P2, P4 or P5). An error or dead end always stands on its own'],
  ['R1', 'Score = severity (High 3, Medium 2, Low 1) × 2, plus 2 if its milestone has a gap, plus 1 if that is the biggest gap, plus 1 if your notes show it happening'],
  ['R2', 'Rank by score, then setting up before reaching the first win before making it stick, then by milestone order'],
  ['R3', 'You can hide a finding. It leaves the ranking and the verdict, and stays listed as hidden'],
  ['V0', 'D1 fires, or D2 at High: Agree what the first win is'],
  ['V1', 'Any other High finding on the way to the first win: Shorten the road to the first win'],
  ['V2', 'No High on the way, but a High after the first win: Make the first win stick'],
  ['V3', 'Medium findings only: Smooth the stuck points'],
  ['V4', 'Low findings or none: Measure and tune'],
  ['A1', 'A milestone type you type yourself uses a 70% alert line and triggers no P rule, only gaps, time and model moments'],
  ['A2', 'You can set your own alert line for any milestone. It replaces the default for that milestone only']
];

/* ---------- Report ---------- */

export function reportMarkdown(form, a, today, parsed) {
  const v = VERDICTS[a.verdict];
  const L = a.lad;
  const lines = [];
  lines.push(`# ${form.name || 'Activation'}: activation gap review`);
  lines.push('');
  lines.push(`${today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · ${form.segment} · ${form.window} window · first win counted as: ${(form.winDef || '').toLowerCase()}`);
  lines.push('');
  lines.push(`**Verdict: ${v.label}** (rule ${a.rule}). ${v.line}`);
  lines.push('');
  if (L.activation !== null) lines.push(`- Sign-up to first win: ${L.activation}%`);
  if (L.timeToWin !== null) lines.push(`- Median time to first win: ${fmtHours(L.timeToWin)}`);
  if (L.stick !== null) lines.push(`- First win to next use: ${L.stick}%`);
  lines.push(`- Required milestones before the first win: ${a.reqBetween}`);
  if (L.biggest) lines.push(`- Biggest gap: before ${L.biggest.step.label || typeLabel(L.biggest.step)}, ${L.biggest.lost.toLocaleString('en-GB')} people lost (${L.biggest.reach}% reach it)`);
  lines.push('');
  lines.push('## The ladder');
  L.rows.forEach((r, i) => {
    const bits = [`${i + 1}. ${r.step.label || typeLabel(r.step)} (${typeLabel(r.step)}${i > 0 ? `, ${(r.step.mode || 'Required').toLowerCase()}` : ''})`];
    if (r.count !== null) bits.push(`${r.count.toLocaleString('en-GB')} people`);
    if (r.reach !== null) bits.push(`${r.reach}% reach it${r.gap ? `, under the ${r.line}% line` : ''}`);
    if (r.hours !== null && i > 0) bits.push(`median ${fmtHours(r.hours)} after sign-up`);
    lines.push(bits.join(' · '));
  });
  const segs = (form.segments || []).filter((s) => s.name && String(s.rate).trim() !== '');
  if (segs.length) {
    lines.push('');
    lines.push('## Segments');
    segs.forEach((s) => lines.push(`- ${s.name}: ${s.rate}% activate`));
  }
  lines.push('');
  lines.push('## Fixes, in order');
  a.ranked.forEach((f) => {
    const where = f.stepIdx !== null ? ` · milestone ${f.stepIdx + 1}` : '';
    lines.push(`### ${f.rank}. ${f.title}`);
    lines.push(`${f.sev} · ${PHASES[f.phase].label}${where} · score ${f.score} · ${f.model ? `from your notes (${f.kind})` : f.unexplained ? 'from your counts (G4)' : `rule ${f.id}${f.noted ? ', seen in your notes' : ''}`}`);
    (f.quotes || []).forEach((q) => lines.push(`> ${q}`));
    lines.push('');
    lines.push(f.why);
    lines.push('');
    lines.push(`- **Fix:** ${f.lib.fix}`);
    lines.push(`- **Test:** ${f.lib.change}`);
    lines.push(`- **Measure:** ${f.lib.metric}`);
    lines.push(`- **Watch:** ${f.lib.guard}`);
    lines.push('');
  });
  if (parsed?.questions?.length) {
    lines.push('## Check in your data and recordings');
    parsed.questions.forEach((q) => lines.push(`- ${q}`));
    lines.push('');
  }
  lines.push('---');
  lines.push('Made with Then What?. Printed rules decide the findings, ranking and verdict. Alert lines and time lines are starting points, not published benchmarks.');
  return lines.join('\n');
}
