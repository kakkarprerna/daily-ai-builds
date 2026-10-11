// Ready to Go Live? printed rules.
// Every status, the verdict and the rollout plan come from this file. No model is involved.
// The serverless function imports TOPICS from here, so the prompt and the rules use the same answers.

export const CHANNELS = ['Voice, inbound calls', 'Voice, outbound calls', 'Web chat', 'WhatsApp or SMS', 'Email'];
export const VOICE = ['Voice, inbound calls', 'Voice, outbound calls'];
export const VOLUMES = ['Under 500 a day', '500 to 5,000 a day', 'Over 5,000 a day'];
export const ACTIONS = [
  'Answers questions only',
  'Books, updates or logs records',
  'Moves money, cancels or changes contracts',
  'Gives health, legal or money guidance'
];
export const LANGS = ['English', 'Spanish', 'Catalan', 'French', 'German', 'Portuguese', 'Italian', 'Hindi'];

/* ---------- Risk ---------- */

export const RISK = {
  Low: { label: 'Low', maxCritical: 2, minSuccess: 75, minCases: 100, perStage: 100, line: 'Wrong answers are a nuisance and can be put right.' },
  Medium: { label: 'Medium', maxCritical: 1, minSuccess: 80, minCases: 200, perStage: 200, line: 'Wrong actions change records that people rely on.' },
  High: { label: 'High', maxCritical: 0.5, minSuccess: 85, minCases: 300, perStage: 300, line: 'Wrong actions cost people money, contracts or their health.' }
};

export function riskOf(form) {
  const a = form.action;
  let level = 'Medium';
  let why = 'Typed-in action, treated as Medium until it is one of the listed answers.';
  if (a === ACTIONS[0]) { level = 'Low'; why = 'The agent only answers questions.'; }
  if (a === ACTIONS[1]) { level = 'Medium'; why = 'The agent changes records in another system.'; }
  if (a === ACTIONS[2]) { level = 'High'; why = 'The agent moves money or changes contracts, which is hard to undo.'; }
  if (a === ACTIONS[3]) { level = 'High'; why = 'The agent gives guidance people may act on about health, law or money.'; }
  if (level === 'Low' && form.volume === VOLUMES[2]) {
    level = 'Medium';
    why = 'The agent only answers questions, but at over 5,000 conversations a day small error rates reach many people.';
  }
  return { level, why, ...RISK[level] };
}

/* ---------- Checks ---------- */

const CASE_SIZE = { 'None yet': 0, 'Under 50': 25, '50 to 199': 120, '200 to 499': 300, '500 or more': 500 };

export const GATES = [
  { id: 'scope', label: 'Scope and success', short: 'Scope' },
  { id: 'tests', label: 'Test evidence', short: 'Tests' },
  { id: 'systems', label: 'Connected systems', short: 'Systems' },
  { id: 'handoff', label: 'Handoff to people', short: 'Handoff' },
  { id: 'safety', label: 'Safety and data', short: 'Safety' },
  { id: 'ops', label: 'Launch operations', short: 'Operations' }
];

// status helpers
const P = 'pass';
const G = 'gap';
const B = 'blocker';
const NA = 'na';
const pick = (opts, value, map) => {
  const i = opts.indexOf(value);
  return i === -1 ? null : map[i];
};

export const CHECKS = [
  {
    id: 'scope', gate: 'scope', rule: 'S1', owner: 'Both', label: 'Use cases in scope',
    options: ['Written and signed off by the customer', 'Agreed on a call, not written', 'Still changing'],
    status: (v) => pick(CHECKS[0].options, v, [P, G, B]),
    fix: 'Write the in-scope and out-of-scope requests on one page and get the customer owner to sign it off.'
  },
  {
    id: 'metrics', gate: 'scope', rule: 'S2', owner: 'Both', label: 'Success metrics',
    options: ['Agreed, with a baseline from today', 'Agreed, no baseline', 'Not agreed'],
    status: (v) => pick(CHECKS[1].options, v, [P, G, G]),
    fix: 'Agree two or three metrics and pull today’s figures before launch, or nobody can say later whether it worked.'
  },
  {
    id: 'owner', gate: 'scope', rule: 'S3', owner: 'Customer', label: 'Customer-side owner for launch',
    options: ['Named, with time set aside', 'Named, no time set aside', 'No one named'],
    status: (v) => pick(CHECKS[2].options, v, [P, G, B]),
    fix: 'Get one named person on the customer side who can approve changes and block time for launch weeks.'
  },
  {
    id: 'cases', gate: 'tests', rule: 'T1', owner: 'Us', label: 'Size of the test set',
    options: Object.keys(CASE_SIZE),
    status: (v, ctx) => {
      if (!(v in CASE_SIZE)) return null;
      const n = CASE_SIZE[v];
      if (n >= ctx.risk.minCases) return P;
      if (n >= ctx.risk.minCases / 2) return G;
      return B;
    },
    fix: (ctx) => `Grow the test set to at least ${ctx.risk.minCases} cases for ${ctx.risk.label.toLowerCase()} risk, weighted towards the requests the customer sees most.`
  },
  {
    id: 'real', gate: 'tests', rule: 'T2', owner: 'Us', label: 'Where the test cases came from',
    options: ['Mostly real customer conversations or calls', 'A mix of real and written', 'Written by the team only'],
    status: (v, ctx) => pick(CHECKS[4].options, v, [P, G, ctx.voice || ctx.risk.level === 'High' ? B : G]),
    fix: 'Add real conversations or call recordings to the test set. Scripted cases pass in demos and miss how people actually speak and write.'
  },
  {
    id: 'success', gate: 'tests', rule: 'T3', owner: 'Us', label: 'Task success on the test set (%)', numeric: true,
    status: (v, ctx) => {
      const n = parseNum(v);
      if (n === null) return ctx.risk.level === 'Low' ? G : B;
      if (n >= ctx.risk.minSuccess) return P;
      if (n >= ctx.risk.minSuccess - 10) return G;
      return B;
    },
    fix: (ctx) => `Measure task success on the full test set and get it to ${ctx.risk.minSuccess}% or above.`
  },
  {
    id: 'critical', gate: 'tests', rule: 'T4', owner: 'Us', label: 'Critical failures on the test set (%)', numeric: true,
    hint: 'Wrong facts stated as true, wrong actions taken, or private data shown to the wrong person.',
    status: (v, ctx) => {
      const n = parseNum(v);
      if (n === null) return ctx.risk.level === 'Low' ? G : B;
      if (n <= ctx.risk.maxCritical) return P;
      if (n <= ctx.risk.maxCritical * 2) return G;
      return B;
    },
    fix: (ctx) => `Bring critical failures to ${ctx.risk.maxCritical}% or below, and fix each one by cause rather than by patching the single case.`
  },
  {
    id: 'langs', gate: 'tests', rule: 'T5', owner: 'Us', label: 'Languages and accents in testing',
    options: ['Every launch language, with real speakers', 'Every launch language, written tests only', 'Some launch languages missing'],
    status: (v) => pick(CHECKS[7].options, v, [P, G, B]),
    fix: 'Test every launch language with real speakers, including the regional accents the customer’s callers or writers use.'
  },
  {
    id: 'lines', gate: 'tests', rule: 'T6', owner: 'Us', label: 'Tested on real phone lines', voiceOnly: true,
    options: ['Yes, with noise, holds and interruptions', 'Yes, quiet conditions only', 'Not yet'],
    status: (v, ctx) => (!ctx.voice ? NA : pick(CHECKS[8].options, v, [P, G, B])),
    fix: 'Run calls on real lines from cars, streets and hold queues. Background noise and holds set off false interruptions that never show up in a quiet room.'
  },
  {
    id: 'e2e', gate: 'systems', rule: 'C1', owner: 'Both', label: 'Connected systems tested end to end',
    options: ['Yes, in staging with real data shapes', 'Partly, some calls mocked', 'No, mocked only', 'No systems connected'],
    status: (v, ctx) => pick(CHECKS[9].options, v, [P, G, ctx.risk.level === 'Low' ? G : B, NA]),
    fix: 'Run the full flow against the customer’s staging systems with realistic records, including empty fields, duplicates and old formats.'
  },
  {
    id: 'down', gate: 'systems', rule: 'C2', owner: 'Us', label: 'When a connected system is down',
    options: ['Defined and tested', 'Defined, not tested', 'Not defined', 'No systems connected'],
    status: (v, ctx) => pick(CHECKS[10].options, v, [P, ctx.risk.level === 'High' ? B : G, B, ctx.connected ? G : NA]),
    fix: 'Decide what the agent says and does when a system times out, and test it by switching the system off in staging.'
  },
  {
    id: 'kb', gate: 'systems', rule: 'C3', owner: 'Both', label: 'Knowledge base version',
    options: ['Pinned, with an owner and update process', 'Owner named, version not pinned', 'No owner'],
    status: (v) => pick(CHECKS[11].options, v, [P, G, B]),
    fix: 'Pin the knowledge base version the agent reads, name who updates it, and check the version before closing any wrong-answer report. A stale copy produces confident wrong answers that look like hallucinations.'
  },
  {
    id: 'path', gate: 'handoff', rule: 'H1', owner: 'Both', label: 'Handoff to a person',
    options: ['Live transfer, tested', 'Live transfer, not tested', 'Ticket or callback only', 'No handoff'],
    status: (v, ctx) => pick(CHECKS[12].options, v, [P, G, ctx.risk.level === 'High' ? B : G, B]),
    fix: 'Give every conversation a way to reach a person, and test the transfer with the team who will pick it up.'
  },
  {
    id: 'context', gate: 'handoff', rule: 'H2', owner: 'Us', label: 'What the person receives',
    options: ['Summary and full transcript', 'Transcript only', 'Nothing, the customer starts again'],
    status: (v) => pick(CHECKS[13].options, v, [P, G, G]),
    fix: 'Pass a short summary with the reason, what was tried and what the customer wants, so nobody has to repeat themselves.'
  },
  {
    id: 'hours', gate: 'handoff', rule: 'H3', owner: 'Customer', label: 'Outside staffed hours',
    options: ['Defined message and callback', 'Staffed around the clock', 'Not defined'],
    status: (v) => pick(CHECKS[14].options, v, [P, P, G]),
    fix: 'Decide what happens when nobody is there to take a handoff: the message, the callback time and who makes the call.'
  },
  {
    id: 'disclose', gate: 'safety', rule: 'D1', owner: 'Us', label: 'Tells people they are talking to AI',
    options: ['Yes, at the start', 'Only if asked', 'No'],
    status: (v) => pick(CHECKS[15].options, v, [P, B, B]),
    fix: 'Say it is an AI agent at the start of every conversation. Article 50 of the EU AI Act has required this since 2 August 2026.'
  },
  {
    id: 'consent', gate: 'safety', rule: 'D2', owner: 'Customer', label: 'Recording and data processing',
    options: ['Lawful basis and notice confirmed by the customer', 'Assumed, not confirmed', 'Not discussed'],
    status: (v) => pick(CHECKS[16].options, v, [P, G, B]),
    fix: 'Get the customer’s data protection lead to confirm the lawful basis, the notice wording and who is controller and processor.'
  },
  {
    id: 'pii', gate: 'safety', rule: 'D3', owner: 'Us', label: 'Personal data in logs and transcripts',
    options: ['Redacted or access limited, with a retention period', 'Stored in full, access limited', 'Stored in full, open access'],
    status: (v) => pick(CHECKS[17].options, v, [P, G, B]),
    fix: 'Limit who can read transcripts, redact card and ID numbers, and set how long recordings are kept.'
  },
  {
    id: 'outscope', gate: 'safety', rule: 'D4', owner: 'Us', label: 'Requests outside scope',
    options: ['Refuses and redirects, tested', 'In the prompt, not tested', 'Not handled'],
    status: (v) => pick(CHECKS[18].options, v, [P, G, B]),
    fix: 'Add out-of-scope requests to the test set, including ones that sound in scope, and check the agent redirects rather than guesses.'
  },
  {
    id: 'monitor', gate: 'ops', rule: 'O1', owner: 'Us', label: 'Monitoring',
    options: ['Dashboard with alert thresholds', 'Dashboard, no alerts', 'No dashboard yet'],
    status: (v, ctx) => pick(CHECKS[19].options, v, [P, G, ctx.risk.level === 'Low' ? G : B]),
    fix: 'Set alerts on the rollback triggers below so someone hears about a bad day before the customer does.'
  },
  {
    id: 'review', gate: 'ops', rule: 'O2', owner: 'Us', label: 'People reading conversations in launch weeks',
    options: ['Daily sample with a named reviewer', 'Weekly sample', 'None planned'],
    status: (v) => pick(CHECKS[20].options, v, [P, G, B]),
    fix: 'Name a reviewer who reads a sample of conversations every day of each stage. Most launch problems are found by reading, not by dashboards.'
  },
  {
    id: 'rollback', gate: 'ops', rule: 'O3', owner: 'Us', label: 'Rollback or off switch',
    options: ['Tested, under 15 minutes', 'Exists, not tested', 'None'],
    status: (v) => pick(CHECKS[21].options, v, [P, G, B]),
    fix: 'Build a switch that sends traffic back to the old route, and time a test run of it before launch.'
  },
  {
    id: 'frontline', gate: 'ops', rule: 'O4', owner: 'Customer', label: 'Customer’s frontline team',
    options: ['Briefed, with a script for questions about the agent', 'Told it is coming', 'Not told'],
    status: (v) => pick(CHECKS[22].options, v, [P, G, G]),
    fix: 'Brief the people who take handoffs and complaints, with a short script for when customers ask about the agent.'
  },
  {
    id: 'cover', gate: 'ops', rule: 'O5', owner: 'Both', label: 'Launch week cover',
    options: ['Named people on both sides', 'Our side only', 'Not arranged'],
    status: (v) => pick(CHECKS[23].options, v, [P, G, B]),
    fix: 'Name who is on call on both sides for the first week of each stage, with a shared channel.'
  }
];

export const CHECK_BY_ID = Object.fromEntries(CHECKS.map((c) => [c.id, c]));

// The answers a model may suggest. Context fields first, then every chip-based check.
export const TOPICS = {
  'What the agent can do': ACTIONS,
  ...Object.fromEntries(CHECKS.filter((c) => !c.numeric).map((c) => [c.label, c.options]))
};
export const TOPIC_FIELD = {
  'What the agent can do': 'action',
  ...Object.fromEntries(CHECKS.filter((c) => !c.numeric).map((c) => [c.label, c.id]))
};

/* ---------- Scoring ---------- */

export function parseNum(v) {
  if (v === null || v === undefined || String(v).trim() === '') return null;
  const n = Number(String(v).replace('%', '').replace(',', '.').trim());
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
}

const fixText = (c, ctx) => (typeof c.fix === 'function' ? c.fix(ctx) : c.fix);

export const VERDICTS = {
  notready: { label: 'Not ready', short: 'Not ready', tone: 'bad', line: 'At least one blocker. Fix the blockers before any real traffic reaches the agent.' },
  pilot: { label: 'Pilot first', short: 'Pilot first', tone: 'warn', line: 'No blockers, but the evidence is thin in places. Start small, read what happens and step up only when the exit criteria hold.' },
  watch: { label: 'Go live, with watch items', short: 'Go live, watch', tone: 'ok', line: 'Ready for a staged launch. Close the watch items during the first stage.' },
  go: { label: 'Go live', short: 'Go live', tone: 'ok', line: 'Every check passed. Run the staged launch and keep reading conversations.' }
};

export function assess(form) {
  const risk = riskOf(form);
  const voice = VOICE.includes(form.channel);
  const connected = !!form.e2e && form.e2e !== 'No systems connected';
  const ctx = { risk, voice, connected };
  const rows = CHECKS.map((c) => {
    const v = form[c.id];
    let status = c.status(v, ctx);
    let custom = false;
    if (status === null || status === undefined) {
      // A typed-in answer cannot be scored against the printed options, so it counts as a gap to confirm.
      status = String(v || '').trim() ? G : B;
      custom = !!String(v || '').trim();
    }
    return { ...c, value: v, status, custom, fixText: fixText(c, ctx) };
  });
  const live = rows.filter((r) => r.status !== NA);
  const blockers = live.filter((r) => r.status === B);
  const gaps = live.filter((r) => r.status === G);
  const passes = live.filter((r) => r.status === P);
  const score = Math.round((live.reduce((s, r) => s + (r.status === P ? 1 : r.status === G ? 0.5 : 0), 0) / live.length) * 100);
  const gates = GATES.map((g) => {
    const gr = live.filter((r) => r.gate === g.id);
    const gs = gr.length ? Math.round((gr.reduce((s, r) => s + (r.status === P ? 1 : r.status === G ? 0.5 : 0), 0) / gr.length) * 100) : null;
    return { ...g, rows: rows.filter((r) => r.gate === g.id), score: gs, blockers: gr.filter((r) => r.status === B).length, gaps: gr.filter((r) => r.status === G).length };
  });

  const trail = [];
  trail.push({ rule: 'R1', text: `Risk is ${risk.level}. ${risk.why}`, fired: true });
  const keyGaps = gaps.filter((r) => r.gate === 'tests' || r.gate === 'handoff');
  let verdict;
  let rule;
  if (blockers.length) {
    verdict = 'notready'; rule = 'V1';
    trail.push({ rule: 'V1', text: `${blockers.length} blocker${blockers.length > 1 ? 's' : ''}: ${blockers.map((b) => b.label.toLowerCase()).join('; ')}.`, fired: true });
  } else {
    trail.push({ rule: 'V1', text: 'No blockers.', fired: false });
    if (gaps.length >= 4 || keyGaps.length) {
      verdict = 'pilot'; rule = 'V2';
      trail.push({ rule: 'V2', text: keyGaps.length ? `${keyGaps.length} gap${keyGaps.length > 1 ? 's' : ''} in test evidence or handoff, which only real traffic at small scale can close.` : `${gaps.length} gaps, four or more.`, fired: true });
    } else if (gaps.length) {
      verdict = 'watch'; rule = 'V3';
      trail.push({ rule: 'V2', text: 'No gaps in test evidence or handoff, and fewer than four gaps in all.', fired: false });
      trail.push({ rule: 'V3', text: `${gaps.length} gap${gaps.length > 1 ? 's' : ''} to close during the first stage.`, fired: true });
    } else {
      verdict = 'go'; rule = 'V4';
      trail.push({ rule: 'V4', text: 'Every applicable check passed.', fired: true });
    }
  }
  const unsure = rows.filter((r) => r.custom).length;
  return { risk, voice, rows, live, blockers, gaps, passes, score, gates, verdict, rule, trail, unsure, plan: rolloutPlan(verdict, risk, form) };
}

/* ---------- Rollout plan ---------- */

export function rolloutPlan(verdict, risk, form) {
  const days = risk.level === 'High' ? 14 : risk.level === 'Medium' ? 7 : 5;
  const exit = [
    `Critical failures at or below ${risk.maxCritical}% across at least ${risk.perStage} reviewed conversations`,
    `Task success at or above ${risk.minSuccess}%`,
    'Handoff rate within 10 points of the test set',
    'No open incident rated serious by either side'
  ];
  let stages = [];
  if (verdict === 'notready') {
    stages = [{ name: 'Fix blockers', traffic: '0%', scope: 'No real traffic. Internal and customer test calls only', days: null, exit: ['Every blocker cleared and this check run again'] }];
  } else if (verdict === 'pilot') {
    stages = [
      { name: 'Pilot', traffic: risk.level === 'Low' ? '10%' : '5%', scope: 'One queue or one region, staffed hours only, so every handoff reaches a person', days, exit },
      { name: 'Widen', traffic: '25%', scope: 'All queues in staffed hours, out-of-hours rule switched on', days, exit },
      { name: 'Full', traffic: '100%', scope: 'All traffic. Daily review drops to weekly after two clean weeks', days: null, exit: [] }
    ];
  } else if (verdict === 'watch') {
    stages = [
      { name: 'First stage', traffic: '25%', scope: 'All queues, staffed hours only, while the watch items are closed', days: Math.max(3, Math.round(days / 2)), exit: [...exit, 'Every watch item closed'] },
      { name: 'Full', traffic: '100%', scope: 'All traffic. Daily review drops to weekly after two clean weeks', days: null, exit: [] }
    ];
  } else {
    stages = [
      { name: 'First stage', traffic: risk.level === 'High' ? '25%' : '50%', scope: 'All queues', days: risk.level === 'High' ? 7 : 2, exit },
      { name: 'Full', traffic: '100%', scope: 'All traffic. Daily review drops to weekly after two clean weeks', days: null, exit: [] }
    ];
  }
  const triggers = [
    `Critical failures above ${risk.maxCritical * 2}% on any day`,
    'The AI disclosure missing from any reviewed conversation',
    'Wait time for handoffs doubles against the week before launch',
    'A connected system error rate above 5% for an hour'
  ];
  if (risk.level === 'High') triggers.unshift('Any wrong payment, cancellation or contract change');
  return { stages, triggers, days };
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
  const out = { summary: '', signals: [], questions: [], risks: [] };
  String(text || '').split('\n').forEach((raw) => {
    const line = raw.trim().replace(/^[-*]\s*/, '');
    const parts = line.split('|').map((p) => p.trim());
    const tag = parts[0]?.toUpperCase();
    if (tag === 'SUMMARY' && parts[1]) out.summary = parts[1];
    else if (tag === 'SIGNAL' && parts.length >= 5) out.signals.push({ topic: parts[1], value: parts[2], quote: parts[3], why: parts.slice(4).join(' ') });
    else if (tag === 'RISK' && parts.length >= 3) out.risks.push({ quote: parts[1], why: parts.slice(2).join(' ') });
    else if (tag === 'QUESTION' && parts[1]) out.questions.push(parts[1]);
  });
  return out;
}

export function checkSignals(parsed, form) {
  const notes = norm(form.notes);
  const kept = [];
  const dropped = [];
  parsed.signals.forEach((s) => {
    const topic = Object.keys(TOPICS).find((t) => norm(t) === norm(s.topic));
    const value = topic && TOPICS[topic].find((v) => norm(v) === norm(s.value));
    const found = s.quote && notes.includes(norm(s.quote));
    if (!topic || !value) { dropped.push({ ...s, reason: 'The suggestion is not one of the listed answers' }); return; }
    if (!found) { dropped.push({ ...s, reason: 'The quote is not in your notes' }); return; }
    const field = TOPIC_FIELD[topic];
    kept.push({ ...s, topic, value, field, agrees: form[field] === value, current: form[field] });
  });
  const risks = parsed.risks.filter((r) => r.quote && notes.includes(norm(r.quote)));
  return { kept, dropped, risks, droppedRisks: parsed.risks.length - risks.length };
}

export function applySignal(form, s) {
  return { ...form, [s.field]: s.value };
}

/* ---------- Export ---------- */

const STATUS_WORD = { pass: 'Pass', gap: 'Gap', blocker: 'Blocker', na: 'Not applicable' };

export function reportMarkdown(form, a, today, model) {
  const v = VERDICTS[a.verdict];
  const L = [];
  const date = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  L.push(`# ${form.name || 'AI agent'}${form.customer ? ` for ${form.customer}` : ''}: ${v.label}`);
  L.push('');
  L.push(`Checked with Ready to Go Live? on ${date}. Risk ${a.risk.level}. Readiness ${a.score}/100. Rule ${a.rule}.`);
  L.push('');
  L.push(`> ${v.line}`);
  L.push('');
  L.push(`- Channel: ${form.channel}`);
  L.push(`- Languages: ${(form.languages || []).join(', ') || 'not given'}`);
  L.push(`- Volume: ${form.volume}`);
  L.push(`- What the agent can do: ${form.action}`);
  L.push('');
  if (a.blockers.length) {
    L.push('## Blockers');
    L.push('');
    a.blockers.forEach((r) => L.push(`- **${r.label}** (${r.rule}, owner: ${r.owner}). Now: ${r.value || 'not answered'}. To clear it: ${r.fixText}`));
    L.push('');
  }
  if (a.gaps.length) {
    L.push(a.verdict === 'watch' ? '## Watch items' : '## Gaps');
    L.push('');
    a.gaps.forEach((r) => L.push(`- **${r.label}** (${r.rule}, owner: ${r.owner}). Now: ${r.value || 'not answered'}. To close it: ${r.fixText}`));
    L.push('');
  }
  L.push('## Rollout plan');
  L.push('');
  a.plan.stages.forEach((s, i) => {
    L.push(`${i + 1}. **${s.name}**, ${s.traffic} of traffic${s.days ? `, at least ${s.days} days` : ''}. ${s.scope}.`);
    s.exit.forEach((e) => L.push(`   - Move on when: ${e}`));
  });
  L.push('');
  L.push('Roll back if:');
  L.push('');
  a.plan.triggers.forEach((t) => L.push(`- ${t}`));
  L.push('');
  const qs = model?.questions || [];
  if (qs.length) {
    L.push('## Questions before launch');
    L.push('');
    qs.forEach((q) => L.push(`- ${q}`));
    L.push('');
  }
  L.push('## All checks');
  L.push('');
  L.push('| Rule | Check | Answer | Status |');
  L.push('| --- | --- | --- | --- |');
  a.rows.forEach((r) => L.push(`| ${r.rule} | ${r.label} | ${r.value || 'not answered'} | ${STATUS_WORD[r.status]} |`));
  L.push('');
  L.push('A readiness check against printed rules, not a guarantee. The thresholds are starting points to agree with the customer.');
  return L.join('\n');
}
