// Front Door: printed rules.
// Every finding, score, ranking, verdict, fix and test plan comes from this file.
// A model only reads the flow notes and points at moments that quote them (see api/read.js),
// and each of those is checked here before it can count.

export const SEGMENTS = ['Small businesses', 'Teams buying together', 'Developers', 'Consumers', 'Enterprise trial'];
export const TEAM_SEGMENTS = ['Teams buying together', 'Enterprise trial'];

export const ENTRIES = ['Free plan', 'Free trial, no card', 'Free trial, card up front', 'Demo request first'];
export const ENTRY_HINT = {
  'Free plan': 'Anyone can sign up and keep using a free tier',
  'Free trial, no card': 'Time-limited trial, card asked at the end',
  'Free trial, card up front': 'Card details asked before the trial starts',
  'Demo request first': 'People book a call before they get an account'
};

export const MODES = ['Required', 'Skippable'];

export const SIGNIN = [
  'Email and password', 'Magic link', 'Google or Microsoft', 'Company SSO',
  'Self-serve password reset', 'MFA every time', 'Remember this device'
];

// Step library. "line" is the alert line: flag the step when fewer than this share of the
// people who reach it move on. These are starting lines I set from experience,
// not published benchmarks. Change them to your own.
export const STEP_TYPES = [
  { id: 'landing', label: 'Sign-up button', line: 40, hint: 'The page or button where people start' },
  { id: 'account', label: 'Account form', line: 70, hint: 'Name, email, company and other fields' },
  { id: 'social', label: 'Google or Microsoft sign-up', line: 85, hint: 'One click with an existing account' },
  { id: 'sso', label: 'Company SSO', line: 80, hint: 'SAML or OIDC through their identity provider' },
  { id: 'password', label: 'Set a password', line: 85, hint: 'Password with rules to meet' },
  { id: 'verify', label: 'Email check', line: 80, hint: 'Confirm by clicking a link or typing a code' },
  { id: 'phone', label: 'Phone or SMS check', line: 80, hint: 'A code sent to a mobile number' },
  { id: 'questions', label: 'Onboarding questions', line: 80, hint: 'Role, team size, goals and so on' },
  { id: 'workspace', label: 'Workspace setup', line: 85, hint: 'Name the workspace, pick a URL' },
  { id: 'plan', label: 'Choose a plan', line: 80, hint: 'Pick a tier before going in' },
  { id: 'payment', label: 'Card details', line: 50, hint: 'Payment details before using the product' },
  { id: 'invite', label: 'Invite teammates', line: 75, hint: 'Add colleagues by email' },
  { id: 'connect', label: 'Connect data or an app', line: 70, hint: 'Bank, CRM, Slack, a data source' },
  { id: 'apikey', label: 'Create an API key', line: 85, hint: 'Developer key or token' },
  { id: 'tour', label: 'Product tour', line: 85, hint: 'Guided walkthrough of the product' },
  { id: 'value', label: 'First value moment', line: null, hint: 'The first time the product does its job for them' }
];
export const CUSTOM_LINE = 75;
export const typeById = (id) => STEP_TYPES.find((t) => t.id === id);
export const typeLabel = (step) => typeById(step.type)?.label || step.type || 'Step';
export const lineFor = (step) => {
  const n = Number(step.line);
  if (step.line !== undefined && step.line !== '' && Number.isFinite(n) && n > 0 && n <= 100) return n;
  return typeById(step.type)?.line ?? CUSTOM_LINE;
};

export const PHASES = {
  signup: { label: 'Signing up', short: 'Sign-up' },
  value: { label: 'Getting to value', short: 'To value' },
  signin: { label: 'Coming back', short: 'Sign-in' }
};

export const SEVERITY = {
  High: { pts: 3, tone: 'bad' },
  Medium: { pts: 2, tone: 'warn' },
  Low: { pts: 1, tone: 'ok' }
};

// What a model may call a moment in the notes, and the severity each kind carries (rule M3).
export const KINDS = [
  { id: 'Blocks the way', sev: 'High', ask: 'Something stops people carrying on until they do or wait for something' },
  { id: 'Error or dead end', sev: 'High', ask: 'An error, a broken link, a page with no way forward' },
  { id: 'Asks too much', sev: 'Medium', ask: 'Fields, questions or effort out of proportion to the moment' },
  { id: 'Trust worry', sev: 'Medium', ask: 'People hesitate over money, data, permissions or who sees what' },
  { id: 'Sign-in trouble', sev: 'Medium', ask: 'Returning people cannot get back in easily' },
  { id: 'Unclear wording', sev: 'Low', ask: 'Copy that leaves people unsure what to do or what happens next' }
];
export const kindById = (id) => KINDS.find((k) => k.id === id);

// Fix and test library. Every finding points at one of these.
export const FIXES = {
  F1: {
    fix: 'Take the card at the end of the trial, or run a no-card trial for one group of new sign-ups.',
    change: 'Half of new sign-ups start without a card; card asked on day 10 of 14',
    metric: 'Paid customers per 100 sign-ups after 30 days (not per trial started)',
    guard: 'Refunds, chargebacks and support tickets about billing'
  },
  F2: {
    fix: 'Let people in straight away and ask them to confirm their email before they invite, export or pay. Add a resend button and a "check your spam folder" line on the waiting screen.',
    change: 'Verify after first value instead of before it',
    metric: 'Sign-ups reaching first value within 24 hours',
    guard: 'Share of accounts with bounced or fake emails'
  },
  F3: {
    fix: 'Only ask for a phone number when a risk signal fires, or at the first moment money or messages go out.',
    change: 'Phone check moved to the first send or payout',
    metric: 'Sign-ups reaching first value within 24 hours',
    guard: 'Fraud or abuse reports per 1,000 new accounts'
  },
  F4: {
    fix: 'Ask for email (or a one-click sign-up) and nothing else. Collect the other fields later, when they change what the person sees.',
    change: 'Account form cut to email only, or Google or Microsoft first',
    metric: 'Form starts that become accounts',
    guard: 'Sales-qualified leads from self-serve, if sales use those fields'
  },
  F5: {
    fix: 'Keep the one or two questions that change the first screen and make the rest skippable or move them after first value.',
    change: 'Questions cut to two, with a visible Skip',
    metric: 'People who finish the questions step',
    guard: 'Activation rate for people who skipped versus answered'
  },
  F6: {
    fix: 'Let one person reach first value alone. Ask for teammates afterwards, when they have something to show them.',
    change: 'Invite step made skippable and shown again after first value',
    metric: 'Sign-ups reaching first value, and teams with 2+ active people by day 7',
    guard: 'Seats per new account at day 30'
  },
  F7: {
    fix: 'Give a sample workspace or demo data so the product shows its value before anyone connects a real system.',
    change: 'Sample data on by default, connect prompt after first value',
    metric: 'Sign-ups reaching first value within 24 hours',
    guard: 'Share who connect real data by day 7'
  },
  F8: {
    fix: 'Name the first action that shows the product doing its job (an invoice sent, a report viewed, a call that works), add it as the last step and track it as an event.',
    change: 'No test yet. Agree the first value event and start counting it',
    metric: 'Sign-ups reaching that event within 7 days',
    guard: 'None until the event exists'
  },
  F9: {
    fix: 'Cut or defer every step that does not need to happen before first value. Move setup to after people have seen it work.',
    change: 'The two weakest steps before value deferred',
    metric: 'Median time from sign-up to first value',
    guard: 'Day-7 return rate'
  },
  F10: {
    fix: 'Start everyone on the free plan or trial by default and show the plans after first value.',
    change: 'Plan page removed from sign-up, shown in the app later',
    metric: 'Sign-ups reaching first value',
    guard: 'Paid conversion at day 30'
  },
  F11: {
    fix: 'Make the tour skippable or replace it with a short checklist people can come back to.',
    change: 'Tour opt-in, checklist on by default',
    metric: 'Sign-ups reaching first value',
    guard: 'Support tickets in week one'
  },
  F12: {
    fix: 'Add Google and Microsoft sign-in, and company SSO for larger accounts, so a whole team can come in the way IT expects.',
    change: 'Google and Microsoft buttons above the email form',
    metric: 'Invited teammates who accept and sign in',
    guard: 'Duplicate accounts per company'
  },
  F13: {
    fix: 'Let people sign up with a magic link or one click and set a password later if they want one.',
    change: 'Password step removed from sign-up',
    metric: 'Form starts that become accounts',
    guard: 'Locked-out sign-in tickets'
  },
  S1: {
    fix: 'Add a self-serve password reset on the sign-in page, with the email arriving in under a minute.',
    change: 'Reset link live on the sign-in page',
    metric: 'Sign-in attempts that end signed in',
    guard: 'Account takeover reports'
  },
  S2: {
    fix: 'Offer "remember this device for 30 days" and ask for the second factor again only on a new device or a risky action.',
    change: 'Remembered devices skip the code',
    metric: 'Weekly returning users',
    guard: 'Security incidents and your security team’s sign-off'
  },
  S3: {
    fix: 'Add a magic link or Google and Microsoft sign-in next to the password form.',
    change: 'Second way in on the sign-in page',
    metric: 'Sign-in attempts that end signed in',
    guard: 'Password reset requests'
  },
  L4: {
    fix: 'Do not guess. Watch ten session recordings of people who left at this step and read the support tickets that mention it, then write down what you saw.',
    change: 'No test yet. Find the cause first',
    metric: 'Share who move on from this step',
    guard: 'None until the cause is known'
  },
  K: {
    'Blocks the way': {
      fix: 'Let people carry on and finish the blocked task later, or remove the wait.',
      change: 'The blocking step made optional before first value',
      metric: 'Share who move on from this step',
      guard: 'Whatever the block was protecting'
    },
    'Error or dead end': {
      fix: 'Fix the error first, then give every error screen one clear next action and a way to reach a person.',
      change: 'Bug fixed and the error screen rewritten',
      metric: 'Share who hit the error, then share who recover',
      guard: 'Support tickets about this step'
    },
    'Asks too much': {
      fix: 'Cut what is asked here to what this moment needs and move the rest later.',
      change: 'Fewer fields or questions at this step',
      metric: 'Share who move on from this step',
      guard: 'Data quality for the fields you removed'
    },
    'Trust worry': {
      fix: 'Say right there why you ask, who sees it and how to undo it. Add a line of proof people can check.',
      change: 'One reassurance line next to the ask',
      metric: 'Share who move on from this step',
      guard: 'None needed'
    },
    'Sign-in trouble': {
      fix: 'Give returning people a second way in and make recovery self-serve.',
      change: 'Magic link or one-click sign-in added',
      metric: 'Sign-in attempts that end signed in',
      guard: 'Account security reports'
    },
    'Unclear wording': {
      fix: 'Rewrite the copy to say what happens next and how long it takes, in the words people use in tickets.',
      change: 'New copy on this screen',
      metric: 'Share who move on from this step',
      guard: 'None needed'
    }
  }
};

export const VERDICTS = {
  unblock: { label: 'Unblock the path to value', tone: 'bad', line: 'Something serious stands between sign-up and the first moment the product works for people. Fix that before polishing anything else.' },
  signin: { label: 'Fix the way back in', tone: 'warn', line: 'People get in, but returning people hit a serious wall. Losing someone who already signed up costs more than losing a visitor.' },
  smooth: { label: 'Smooth the rough steps', tone: 'warn', line: 'Nothing blocks the path, but several steps make it harder than it needs to be. Work down the list one test at a time.' },
  tune: { label: 'Measure and tune', tone: 'ok', line: 'No serious friction found. Keep counting each step and test small changes.' }
};

const n = (v) => {
  const x = Number(String(v ?? '').replace(/[,\s]/g, ''));
  return Number.isFinite(x) && String(v ?? '').trim() !== '' ? x : null;
};
const isCustomType = (s) => !typeById(s.type);

export const normalise = (s) => String(s || '').toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();

/* ---------- Funnel (rules L1 to L3) ---------- */

export function funnel(form) {
  const steps = form.steps || [];
  const rows = steps.map((s, i) => ({ step: s, i, count: n(s.count) }));
  const first = rows.find((r) => r.count !== null)?.count || null;
  const out = rows.map((r, idx) => {
    const next = rows[idx + 1];
    let kept = null;
    let lost = null;
    if (r.count !== null && next && next.count !== null && r.count > 0) {
      kept = Math.round((next.count / r.count) * 1000) / 10;
      lost = Math.max(0, r.count - next.count);
    }
    const line = lineFor(r.step);
    const leak = kept !== null && line !== null && kept < line;
    return { ...r, kept, lost, line, leak, share: first && r.count !== null ? Math.round((r.count / first) * 1000) / 10 : null };
  });
  const withLoss = out.filter((r) => r.lost !== null);
  const biggest = withLoss.length ? withLoss.reduce((a, b) => (b.lost > a.lost ? b : a)) : null;
  const vIdx = steps.findIndex((s) => s.type === 'value');
  const start = out.find((r) => r.count !== null);
  const valueRow = vIdx >= 0 ? out[vIdx] : null;
  const overall = start && valueRow && valueRow.count !== null && start.count > 0 ? Math.round((valueRow.count / start.count) * 1000) / 10 : null;
  return { rows: out, biggest: biggest && biggest.lost > 0 ? biggest : null, hasCounts: withLoss.length > 0, overall };
}

/* ---------- Model reply ---------- */

export function parseReply(text) {
  const out = { summary: '', moments: [], questions: [] };
  String(text || '').split('\n').forEach((raw) => {
    const line = raw.trim().replace(/^[-*]\s*/, '');
    const parts = line.split('|').map((x) => x.trim());
    const tag = parts[0]?.toUpperCase();
    if (tag === 'SUMMARY' && parts[1]) out.summary = parts.slice(1).join(' ');
    else if (tag === 'MOMENT' && parts.length >= 6) {
      out.moments.push({ step: parts[1], kind: parts[2], what: parts[3], quote: /^["“].*["”]$/.test(parts[4]) ? parts[4].slice(1, -1) : parts[4], why: parts.slice(5).join(' ') });
    } else if (tag === 'QUESTION' && parts[1]) out.questions.push(parts.slice(1).join(' '));
  });
  return out;
}

// Rules M1 and M2: a moment counts only if its quote is in the notes and its kind is listed.
// Rule M3 sets its severity from the kind. Its step number must exist, or it is tied to no step.
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
    const signin = String(m.step || '').trim() === '0' || /sign[- ]?in|log[- ]?in|return/i.test(m.step || '') || kind.id === 'Sign-in trouble';
    kept.push({ ...m, kind: kind.id, sev: kind.sev, stepIdx: stepIdx, signin: stepIdx === null && signin });
  });
  return { kept, dropped };
}

/* ---------- Findings (rules F, S, L4) ---------- */

export function assess(form, moments = [], dismissed = {}) {
  const steps = form.steps || [];
  const vIdx = steps.findIndex((s) => s.type === 'value');
  const beforeValue = vIdx >= 0 ? steps.slice(0, vIdx) : steps;
  const isBefore = (i) => (vIdx >= 0 ? i < vIdx : true);
  const req = (s) => (s.mode || 'Required') !== 'Skippable';
  const fl = funnel(form);
  const signin = form.signin || [];
  const team = TEAM_SEGMENTS.includes(form.segment);
  const found = [];
  const add = (f) => found.push(f);
  const idxOf = (pred) => steps.findIndex((s, i) => isBefore(i) && pred(s));

  // F1 card before value
  const payIdx = idxOf((s) => s.type === 'payment' && req(s));
  if (payIdx >= 0 || form.entry === 'Free trial, card up front') {
    add({ id: 'F1', sev: 'High', phase: 'signup', stepIdx: payIdx >= 0 ? payIdx : null, title: 'Card asked before people see it work', why: 'Asking for payment before first value filters out people who would have paid later. Many never come back to finish.' });
  }
  // F2 email check before value
  const verIdx = idxOf((s) => s.type === 'verify' && req(s));
  if (verIdx >= 0) add({ id: 'F2', sev: 'High', phase: 'signup', stepIdx: verIdx, title: 'Email check stops people before value', why: 'People leave to find the email, it lands in spam or arrives late, and the tab they had open goes cold.' });
  // F3 phone check
  const phIdx = idxOf((s) => s.type === 'phone' && req(s));
  if (phIdx >= 0) add({ id: 'F3', sev: 'High', phase: 'signup', stepIdx: phIdx, title: 'Phone number asked before value', why: 'A phone number feels personal and slow to give on a work laptop. Codes fail across borders and carriers.' });
  // F4 long account form
  const accIdx = idxOf((s) => s.type === 'account');
  if (accIdx >= 0) {
    const f = n(steps[accIdx].fields) || 0;
    if (f > 4) add({ id: 'F4', sev: f > 7 ? 'High' : 'Medium', phase: 'signup', stepIdx: accIdx, title: `Account form asks for ${f} fields`, why: 'Each field is another reason to stop. Most of them can wait until they change what the person sees.' });
  }
  // F5 required onboarding questions
  const qIdx = idxOf((s) => s.type === 'questions' && req(s));
  if (qIdx >= 0) {
    const f = n(steps[qIdx].fields) || 0;
    if (f > 3) add({ id: 'F5', sev: 'Medium', phase: 'value', stepIdx: qIdx, title: `${f} onboarding questions, none skippable`, why: 'Questions before value feel like work done for you, not for them, unless each answer visibly changes what comes next.' });
  }
  // F6 invites before value
  const invIdx = idxOf((s) => s.type === 'invite' && req(s));
  if (invIdx >= 0) add({ id: 'F6', sev: 'High', phase: 'value', stepIdx: invIdx, title: 'Teammates must be invited before value', why: 'Nobody invites colleagues to something they have not seen work. They stall here or invite no one.' });
  // F7 connect before value
  const conIdx = idxOf((s) => s.type === 'connect' && req(s));
  if (conIdx >= 0) add({ id: 'F7', sev: 'High', phase: 'value', stepIdx: conIdx, title: 'A real system must be connected before value', why: 'Connecting a bank, CRM or data source needs permissions, time and trust. Without sample data the product looks empty until then.' });
  // F8 no first value moment
  if (vIdx < 0 && steps.length) add({ id: 'F8', sev: 'High', phase: 'value', stepIdx: null, title: 'No first value moment in the flow', why: 'Without the moment the product first works for someone, there is no finish line for sign-up and no way to tell a good flow from a bad one.' });
  // F9 long road to value
  if (beforeValue.length > 5) add({ id: 'F9', sev: beforeValue.length > 7 ? 'High' : 'Medium', phase: 'value', stepIdx: null, title: `${beforeValue.length} steps before first value`, why: 'Each step loses some people, and the losses multiply. Short roads to value keep more of them.' });
  // F10 plan choice before value
  const planIdx = idxOf((s) => s.type === 'plan' && req(s));
  if (planIdx >= 0 && ['Free plan', 'Free trial, no card'].includes(form.entry)) {
    add({ id: 'F10', sev: 'Medium', phase: 'signup', stepIdx: planIdx, title: 'Plan choice before people know what they need', why: 'Choosing a tier is a buying decision. Asking for it before value makes a free start feel like a purchase.' });
  }
  // F11 forced tour
  const tourIdx = steps.findIndex((s) => s.type === 'tour' && req(s));
  if (tourIdx >= 0) add({ id: 'F11', sev: 'Low', phase: 'value', stepIdx: tourIdx, title: 'Product tour cannot be skipped', why: 'People who came to do one thing want to do it. A forced tour delays that and is mostly clicked through.' });
  // F12 teams without one-click or SSO
  const hasSocial = steps.some((s) => s.type === 'social' || s.type === 'sso') || signin.includes('Google or Microsoft') || signin.includes('Company SSO');
  if (team && !hasSocial) add({ id: 'F12', sev: 'Medium', phase: 'signin', stepIdx: null, title: 'Teams cannot sign in with Google, Microsoft or SSO', why: 'Teams expect to use the account IT already manages. Without it, invites stall and people make duplicate accounts.' });
  // F13 password before value
  const pwIdx = idxOf((s) => s.type === 'password' && req(s));
  if (pwIdx >= 0) add({ id: 'F13', sev: 'Low', phase: 'signup', stepIdx: pwIdx, title: 'Password rules at sign-up', why: 'Password rules add a step that fails often. A magic link or one click skips it.' });
  // S1 to S3 sign-in
  const pw = signin.includes('Email and password');
  if (pw && !signin.includes('Self-serve password reset')) add({ id: 'S1', sev: 'High', phase: 'signin', stepIdx: null, title: 'No self-serve password reset', why: 'Everyone forgets a password eventually. Without a reset link they email support, wait, or leave for good.' });
  if (signin.includes('MFA every time') && !signin.includes('Remember this device')) add({ id: 'S2', sev: 'Medium', phase: 'signin', stepIdx: null, title: 'Code asked at every sign-in', why: 'A second factor every time on the same laptop wears people down and pushes them to share accounts.' });
  if (pw && !signin.some((x) => ['Magic link', 'Google or Microsoft', 'Company SSO'].includes(x))) add({ id: 'S3', sev: 'Low', phase: 'signin', stepIdx: null, title: 'Password is the only way back in', why: 'One way in means one way to get stuck. A magic link or one click gives people a second route.' });

  // Model moments (rule M3 severity from kind, rule M4 joins them to a rule finding on the same step)
  const rank3 = { High: 3, Medium: 2, Low: 1 };
  let mNum = 0;
  moments.forEach((m) => {
    const stepIdx = m.stepIdx;
    const signinHost = found.filter((f) => !f.model && /^S/.test(f.id)).sort((x, y) => rank3[y.sev] - rank3[x.sev])[0];
    const host = m.kind === 'Error or dead end' ? null
      : stepIdx !== null ? found.find((f) => !f.model && f.stepIdx === stepIdx)
      : m.signin ? signinHost : null;
    if (host) {
      host.quotes = [...(host.quotes || []), m.quote];
      host.noted = true;
      if (rank3[m.sev] > rank3[host.sev]) { host.sev = m.sev; host.raised = m.kind; }
      return;
    }
    const phase = m.signin ? 'signin' : stepIdx !== null && !isBefore(stepIdx) ? 'value' : stepIdx !== null && ['questions', 'invite', 'connect', 'tour', 'workspace', 'apikey'].includes(steps[stepIdx]?.type) ? 'value' : m.kind === 'Sign-in trouble' ? 'signin' : 'signup';
    mNum += 1;
    add({ id: `M${mNum}`, model: true, noted: true, kind: m.kind, sev: m.sev, phase, stepIdx, title: m.what, why: m.why, quotes: [m.quote] });
  });

  // L4: a leaking step with nothing explaining it
  fl.rows.forEach((r) => {
    if (r.leak && !found.some((f) => f.stepIdx === r.i)) {
      add({ id: 'L4', sev: 'Medium', phase: isBefore(r.i) ? 'signup' : 'value', stepIdx: r.i, title: `Unexplained drop after ${r.step.label || typeLabel(r.step)}`, why: `Only ${r.kept}% move on, under the ${r.line}% alert line, and nothing in the flow explains it yet.`, unexplained: true });
    }
  });

  // Scoring (rules R1 to R3)
  const scored = found.map((f) => {
    const row = f.stepIdx !== null ? fl.rows[f.stepIdx] : null;
    const leakPts = row?.leak ? 2 : 0;
    const bigPts = fl.biggest && row && fl.biggest.i === row.i ? 1 : 0;
    const quotePts = f.noted ? 1 : 0;
    const score = SEVERITY[f.sev].pts * 2 + leakPts + bigPts + quotePts;
    const lib = f.model ? FIXES.K[f.kind] : FIXES[f.id];
    return { ...f, key: `${f.id}-${f.stepIdx}`, score, leakPts, bigPts, quotePts, row, lib };
  });
  const order = { signup: 0, value: 1, signin: 2 };
  const ranked = scored
    .filter((f) => !dismissed[f.key])
    .sort((a, b) => b.score - a.score || order[a.phase] - order[b.phase] || (a.stepIdx ?? 99) - (b.stepIdx ?? 99))
    .map((f, i) => ({ ...f, rank: i + 1 }));
  const hidden = scored.filter((f) => dismissed[f.key]);

  // Verdict (rules V1 to V4)
  const highBefore = ranked.filter((f) => f.sev === 'High' && f.phase !== 'signin');
  const highSignin = ranked.filter((f) => f.sev === 'High' && f.phase === 'signin');
  const mediums = ranked.filter((f) => f.sev === 'Medium');
  let verdict = 'tune';
  let rule = 'V4';
  if (highBefore.length) { verdict = 'unblock'; rule = 'V1'; }
  else if (highSignin.length) { verdict = 'signin'; rule = 'V2'; }
  else if (mediums.length) { verdict = 'smooth'; rule = 'V3'; }

  const reqBefore = beforeValue.filter(req);
  const fieldsBefore = beforeValue.reduce((t, s) => t + (req(s) ? (n(s.fields) || 0) : 0), 0);

  const trail = [
    { rule: 'V1', fired: rule === 'V1', text: `High findings on the way to value: ${highBefore.length}` },
    { rule: 'V2', fired: rule === 'V2', text: `High findings on the way back in: ${highSignin.length}` },
    { rule: 'V3', fired: rule === 'V3', text: `Medium findings: ${mediums.length}` },
    { rule: 'V4', fired: rule === 'V4', text: 'Only low findings or none' }
  ];

  return {
    ranked, hidden, verdict, rule, trail, fl,
    vIdx, beforeCount: beforeValue.length, requiredBefore: reqBefore.length, fieldsBefore,
    custom: steps.filter(isCustomType).length,
    bySev: { High: ranked.filter((f) => f.sev === 'High').length, Medium: mediums.length, Low: ranked.filter((f) => f.sev === 'Low').length },
    byPhase: Object.fromEntries(Object.keys(PHASES).map((p) => [p, ranked.filter((f) => f.phase === p)]))
  };
}

export const RULES_TABLE = [
  ['L1', 'For each step with a count, kept = people at the next step ÷ people at this step'],
  ['L2', 'A step leaks when kept falls under its alert line. The step losing the most people is the biggest leak'],
  ['L3', 'Counts are optional. Without them the findings still stand, ranked on severity alone'],
  ['L4', 'A leaking step that no rule or note explains becomes an Unexplained drop (Medium), with a fix of finding the cause before changing anything'],
  ['F1', 'Card details before first value, or a trial that takes the card up front: High'],
  ['F2', 'A required email check before first value: High'],
  ['F3', 'A required phone or SMS check before first value: High'],
  ['F4', 'Account form with more than 4 fields: Medium. More than 7: High'],
  ['F5', 'More than 3 required onboarding questions before first value: Medium'],
  ['F6', 'Inviting teammates required before first value: High'],
  ['F7', 'Connecting a real system required before first value: High'],
  ['F8', 'No first value step in the flow: High'],
  ['F9', 'More than 5 steps before first value: Medium. More than 7: High'],
  ['F10', 'A required plan choice before value when the start is free: Medium'],
  ['F11', 'A product tour that cannot be skipped: Low'],
  ['F12', 'Teams or enterprise trial with no Google, Microsoft or SSO sign-in: Medium'],
  ['F13', 'A required password step before value: Low'],
  ['S1', 'Email and password sign-in with no self-serve reset: High'],
  ['S2', 'A code at every sign-in with no remembered device: Medium'],
  ['S3', 'Password as the only way back in: Low'],
  ['M1', 'A model moment counts only if its quote is in your notes, word for word'],
  ['M2', 'Its kind must be one on the printed list. Its step number must exist, or it is tied to no step. Step 0 means coming back to sign in'],
  ['M3', 'The kind sets the severity: Blocks the way and Error or dead end are High; Asks too much, Trust worry and Sign-in trouble are Medium; Unclear wording is Low'],
  ['M4', 'A moment on a step a rule already flags, or a sign-in moment when an S rule already fires, joins that finding as evidence and keeps the higher severity. An error or dead end always stands on its own, since it needs its own fix'],
  ['R1', 'Score = severity (High 3, Medium 2, Low 1) × 2, plus 2 if its step leaks, plus 1 if its step is the biggest leak, plus 1 if your notes show it happening'],
  ['R2', 'Rank by score, then sign-up before getting to value before coming back, then by step order'],
  ['R3', 'You can hide a finding. It leaves the ranking and the verdict, and stays listed as hidden'],
  ['V1', 'Any High finding on the way to value: Unblock the path to value'],
  ['V2', 'No High on the way in, but a High on the way back: Fix the way back in'],
  ['V3', 'Medium findings only: Smooth the rough steps'],
  ['V4', 'Low findings or none: Measure and tune'],
  ['A2', 'You can set your own alert line for any step. It replaces the default for that step only'],
  ['A1', 'A step type you type yourself uses a 75% alert line and triggers no F rule, only leaks and model moments']
];

/* ---------- Report ---------- */

export function reportMarkdown(form, a, today, parsed) {
  const v = VERDICTS[a.verdict];
  const lines = [];
  lines.push(`# ${form.name || 'Sign-up flow'}: front door review`);
  lines.push('');
  lines.push(`${today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · ${form.segment} · ${form.entry}`);
  lines.push('');
  lines.push(`**Verdict: ${v.label}** (rule ${a.rule}). ${v.line}`);
  lines.push('');
  lines.push(`- Steps before first value: ${a.vIdx >= 0 ? a.beforeCount : 'no first value step marked'}`);
  lines.push(`- Required fields before first value: ${a.fieldsBefore}`);
  if (a.fl.overall !== null) lines.push(`- Start to first value: ${a.fl.overall}%`);
  if (a.fl.biggest) lines.push(`- Biggest leak: ${a.fl.biggest.step.label || typeLabel(a.fl.biggest.step)}, ${a.fl.biggest.lost.toLocaleString('en-GB')} people lost (${a.fl.biggest.kept}% kept)`);
  lines.push('');
  lines.push('## The flow');
  a.fl.rows.forEach((r, i) => {
    const bits = [`${i + 1}. ${r.step.label || typeLabel(r.step)} (${typeLabel(r.step)}, ${(r.step.mode || 'Required').toLowerCase()})`];
    if (r.count !== null) bits.push(`${r.count.toLocaleString('en-GB')} people`);
    if (r.kept !== null) bits.push(`${r.kept}% move on${r.leak ? `, under the ${r.line}% line` : ''}`);
    lines.push(bits.join(' · '));
  });
  lines.push('');
  lines.push('## Fixes, in order');
  a.ranked.forEach((f) => {
    const where = f.stepIdx !== null ? ` · step ${f.stepIdx + 1}` : '';
    lines.push(`### ${f.rank}. ${f.title}`);
    lines.push(`${f.sev} · ${PHASES[f.phase].label}${where} · score ${f.score} · ${f.model ? `from your notes (${f.kind})` : f.unexplained ? 'from your counts (L4)' : `rule ${f.id}${f.noted ? ', seen in your notes' : ''}`}`);
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
  lines.push('Made with Front Door. Printed rules decide the findings, ranking and verdict. Alert lines are starting points, not published benchmarks.');
  return lines.join('\n');
}
