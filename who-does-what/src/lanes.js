// Who Does What? rules engine.
// The model breaks a workflow into steps and suggests five facts about each one.
// Everything below decides the lane with fixed, printed rules, so the same facts
// always give the same answer, and a person can change any fact and see why.

export const FACTS = {
  action: {
    label: 'What the step does',
    hint: 'The kind of action, not the tool',
    options: [
      { id: 'read', label: 'Read or look up', pts: 0 },
      { id: 'compare', label: 'Compare or calculate', pts: 0 },
      { id: 'judge', label: 'Sort or judge', pts: 1 },
      { id: 'draft', label: 'Draft text', pts: 1 },
      { id: 'update', label: 'Update a record', pts: 2 },
      { id: 'send', label: 'Send outside', pts: 2 },
      { id: 'money', label: 'Move money', pts: 3 }
    ]
  },
  judgement: {
    label: 'Judgement needed',
    hint: 'Could a written rule decide it every time?',
    options: [
      { id: 'none', label: 'None, a rule decides', pts: 0 },
      { id: 'some', label: 'Some, clear examples exist', pts: 1 },
      { id: 'high', label: 'High, weighs trade-offs', pts: 3 }
    ]
  },
  input: {
    label: 'What it works from',
    hint: 'Fields in a system, or words written or spoken by a person',
    options: [
      { id: 'structured', label: 'Structured fields', pts: 0 },
      { id: 'mixed', label: 'Mixed', pts: 1 },
      { id: 'free', label: 'Free text or voice', pts: 1 }
    ]
  },
  undo: {
    label: 'If it goes wrong',
    hint: 'How easily the action can be reversed',
    options: [
      { id: 'easy', label: 'Easy to undo', pts: 0 },
      { id: 'hard', label: 'Hard to undo', pts: 2 },
      { id: 'cannot', label: 'Cannot undo', pts: 3 }
    ]
  },
  reach: {
    label: 'Who it touches',
    hint: 'The furthest a mistake would travel',
    options: [
      { id: 'internal', label: 'Internal only', pts: 0 },
      { id: 'customer', label: 'Customer sees it', pts: 1 },
      { id: 'money', label: 'Money or legal', pts: 2 },
      { id: 'regulated', label: 'Regulated or personal data', pts: 3 }
    ]
  }
};

export const FACT_KEYS = Object.keys(FACTS);

// Lanes, from no oversight to a person in charge. Darker means more human.
export const LANES = [
  { id: 0, key: 'rule', short: 'Rules', label: 'Rules, no model', who: 'A script or workflow tool', desc: 'A written rule does this the same way every time. A model adds cost and risk here without adding anything.' },
  { id: 1, key: 'agent', short: 'Agent', label: 'Agent runs it', who: 'The agent, with a log', desc: 'The agent acts alone. Every action is logged so it can be traced later.' },
  { id: 2, key: 'spot', short: 'Spot-check', label: 'Agent runs it, sample checked', who: 'The agent, a person reviews a sample', desc: 'The agent acts alone and a person reviews a regular sample after the fact.' },
  { id: 3, key: 'approve', short: 'Approve', label: 'Agent drafts, person approves', who: 'A person signs off each one', desc: 'Nothing leaves this step until a person approves it. On a live call this means a warm transfer.' },
  { id: 4, key: 'person', short: 'Person', label: 'Person decides, agent prepares', who: 'A person, with the facts gathered', desc: 'A person makes the call. The agent gathers the facts and drafts options to save them time.' }
];

export const BANDS = [
  { max: 2, lane: 1 },
  { max: 5, lane: 2 },
  { max: 8, lane: 3 },
  { max: Infinity, lane: 4 }
];

// A fact the person typed in themselves has no built-in weight, so it scores
// as the middle of that fact's range and the step is marked as partly custom.
function factPoints(key, value) {
  const f = FACTS[key];
  const hit = f.options.find((o) => o.id === value);
  if (hit) return { pts: hit.pts, custom: false, label: hit.label };
  const vals = f.options.map((o) => o.pts);
  const mid = Math.round((Math.min(...vals) + Math.max(...vals)) / 2);
  return { pts: mid, custom: true, label: String(value || 'Not set') };
}

export function laneFor(step) {
  const parts = FACT_KEYS.map((k) => ({ key: k, ...factPoints(k, step[k]) }));
  const score = parts.reduce((s, p) => s + p.pts, 0);
  const hits = [];

  // Rule 0: no judgement on structured fields, and not writing words, so a plain rule can do it.
  const ruleable = step.judgement === 'none' && step.input === 'structured' && step.action !== 'draft';
  let lane;
  if (ruleable) {
    lane = 0;
    hits.push({ id: 'R0', text: 'No judgement, structured fields and no text to write, so a plain rule can do it' });
  } else {
    lane = BANDS.find((b) => score <= b.max).lane;
    hits.push({ id: 'Score', text: `${score} points puts it in the ${LANES[lane].short.toLowerCase()} band` });
  }

  // Overrides can only add oversight, never remove it.
  const raise = (to, id, text) => {
    if (lane < to) {
      lane = to;
      hits.push({ id, text, raised: true });
    } else {
      hits.push({ id, text: `${text}. The points already put it there`, also: true });
    }
  };
  if (step.action === 'money') raise(3, 'R1', 'It moves money, so a person approves each one');
  if (step.undo === 'cannot' && ['some', 'high'].includes(step.judgement) && step.reach !== 'internal') {
    raise(3, 'R2', 'It cannot be undone, needs judgement and reaches beyond the team, so a person approves each one');
  }
  if (step.judgement === 'high' && step.reach === 'regulated') {
    raise(4, 'R3', 'High judgement on regulated or personal data, so a person decides');
  }

  return { lane, score, parts, hits, custom: parts.some((p) => p.custom) };
}

export function analyse(steps) {
  const rows = steps.map((s, i) => ({ ...s, n: i + 1, ...laneFor(s) }));
  const count = (l) => rows.filter((r) => r.lane === l).length;
  const counts = LANES.map((l) => count(l.id));
  const unattended = rows.filter((r) => r.lane <= 2).length;

  // Consecutive approval steps can share one approval screen.
  const gates = [];
  let cur = null;
  for (const r of rows) {
    if (r.lane === 3) {
      if (cur) cur.push(r);
      else {
        cur = [r];
        gates.push(cur);
      }
    } else cur = null;
  }

  const raised = rows.filter((r) => r.hits.some((h) => h.raised));
  const custom = rows.filter((r) => r.custom);
  const writes = rows.filter((r) => ['update', 'send', 'money'].includes(r.action));
  const modelSteps = rows.filter((r) => r.lane >= 1);

  let shape;
  if (!rows.length) shape = { key: 'empty', label: 'No steps yet', line: 'Map a workflow or load an example.' };
  else if (counts[4] > 0 && counts[4] / rows.length >= 0.4) shape = { key: 'assist', label: 'Assistant, not agent', line: 'Most of the weight sits with a person. Build a helper that prepares their work.' };
  else if (gates.length === 0 && counts[4] === 0) shape = { key: 'auto', label: 'Can run end to end', line: 'No step needs a person in the loop. Watch the sample checks closely at launch.' };
  else {
    const bits = [];
    if (gates.length) bits.push(`${gates.length} approval ${gates.length === 1 ? 'point' : 'points'}`);
    if (counts[4]) bits.push(`a person deciding ${counts[4] === 1 ? 'the step that matters' : 'the steps that matter'} most`);
    shape = { key: 'gated', label: 'Agent with gates', line: `The agent can carry most of it, with ${bits.join(' and ')}.` };
  }

  return { rows, counts, unattended, gates, raised, custom, writes, modelSteps, shape };
}

// Rollout in three phases, built from the lanes. Fixed text, no model.
export function rollout(a) {
  const names = (rs) => rs.map((r) => `${r.n}. ${r.name}`);
  const live = a.rows.filter((r) => r.lane <= 1);
  const sampled = a.rows.filter((r) => r.lane === 2);
  const approvals = a.rows.filter((r) => r.lane === 3);
  const people = a.rows.filter((r) => r.lane === 4);
  const shadow = a.rows.filter((r) => r.lane >= 1 && r.lane <= 3);
  return [
    {
      title: 'Shadow mode',
      when: 'First',
      line: 'The agent runs alongside the team and only suggests. People act exactly as they do today.',
      steps: names(shadow),
      exit: 'Move on when its suggestions match what the person did on a sample size you agree before you start.'
    },
    {
      title: 'Go live with oversight',
      when: 'Next',
      line: 'Switch on the rule and agent steps. Approval steps stay gated and sampled steps get reviewed every week.',
      steps: names(live),
      also: [
        ...(sampled.length ? [`Sample checks on: ${names(sampled).join(', ')}`] : []),
        ...(approvals.length ? [`Approvals stay on: ${names(approvals).join(', ')}`] : []),
        ...(people.length ? [`People keep deciding: ${names(people).join(', ')}`] : [])
      ],
      exit: 'Move on when sampled steps hold their error target for a full month.'
    },
    {
      title: 'Earn more autonomy',
      when: 'Later',
      line: 'Track how often a person changes what the agent drafted. Only a long run of approvals with no edits justifies moving a step down to sample checks.',
      steps: names(approvals),
      exit: 'Never relax a step that a hard rule put there. Moving money and irreversible judgement calls keep their gate.'
    }
  ];
}

/* ---------- Model output parsing ---------- */

const MATCH = {
  action: [
    ['money', ['money', 'pay', 'refund', 'transfer']],
    ['send', ['send', 'outside', 'email', 'message', 'notify']],
    ['update', ['update', 'record', 'write', 'post', 'create']],
    ['draft', ['draft', 'text', 'compose']],
    ['judge', ['sort', 'judge', 'classif', 'decide', 'triage']],
    ['compare', ['compare', 'calculat', 'match', 'check']],
    ['read', ['read', 'look', 'fetch', 'find', 'extract']]
  ],
  judgement: [
    ['high', ['high', 'trade']],
    ['some', ['some', 'example', 'medium', 'moderate']],
    ['none', ['none', 'no ', 'rule']]
  ],
  input: [
    ['free', ['free', 'voice', 'text', 'unstructured']],
    ['mixed', ['mixed', 'semi']],
    ['structured', ['structured', 'field']]
  ],
  undo: [
    ['cannot', ['cannot', "can't", 'irreversible', 'not undo']],
    ['hard', ['hard', 'partly', 'difficult']],
    ['easy', ['easy', 'reversible']]
  ],
  reach: [
    ['regulated', ['regulat', 'personal', 'health', 'gdpr']],
    ['money', ['money', 'legal', 'financ']],
    ['customer', ['customer', 'sees', 'external', 'caller']],
    ['internal', ['internal', 'team']]
  ]
};

function matchFact(key, raw) {
  const s = String(raw || '').toLowerCase().trim();
  if (!s) return '';
  const exact = FACTS[key].options.find((o) => o.label.toLowerCase() === s || o.id === s);
  if (exact) return exact.id;
  for (const [id, words] of MATCH[key]) if (words.some((w) => s.includes(w))) return id;
  return String(raw).trim().slice(0, 40);
}

// Tagged lines, one fact per field. A line that does not fit is skipped.
export function parseMap(text) {
  const out = { summary: '', steps: [], fails: [], tools: [], questions: [], skipped: 0 };
  for (const raw of String(text || '').split('\n')) {
    const line = raw.trim().replace(/^[-*\d.\s]+(?=[A-Z]+\|)/, '');
    if (!line) continue;
    const f = line.split('|').map((p) => p.trim());
    const tag = f.shift();
    if (tag === 'SUMMARY' && f[0]) out.summary = f.join(' ');
    else if (tag === 'STEP' && f.length >= 9) {
      out.steps.push({
        id: `s${out.steps.length + 1}`,
        name: f[1], what: f[2], system: f[3],
        action: matchFact('action', f[4]),
        judgement: matchFact('judgement', f[5]),
        input: matchFact('input', f[6]),
        undo: matchFact('undo', f[7]),
        reach: matchFact('reach', f[8])
      });
    } else if (tag === 'FAIL' && f.length >= 4) out.fails.push({ step: parseInt(f[0], 10) || 0, how: f[1], notice: f[2], guard: f[3] });
    else if (tag === 'TOOL' && f.length >= 3) out.tools.push({ system: f[0], access: /write/i.test(f[1]) ? 'Read and write' : 'Read only', steps: f[2] });
    else if (tag === 'QUESTION' && f[0]) out.questions.push(f[0]);
    else out.skipped += 1;
  }
  return out;
}

/* ---------- Agent brief export ---------- */

export function briefMarkdown(form, map, a) {
  const L = (r) => LANES[r.lane].label;
  const factLabel = (k, v) => FACTS[k].options.find((o) => o.id === v)?.label || v || 'Not set';
  const lines = [
    `# Agent brief: ${form.name || 'Untitled workflow'}`,
    '',
    form.trigger ? `**Starts when:** ${form.trigger}` : '',
    form.today ? `**Done today by:** ${form.today}` : '',
    '',
    `**Shape:** ${a.shape.label}. ${a.shape.line}`,
    `**Steps without a person in the loop:** ${a.unattended} of ${a.rows.length}`,
    '',
    map.summary ? `${map.summary}\n` : '',
    '## Steps and who does them',
    '',
    '| # | Step | Lane | Why |',
    '| --- | --- | --- | --- |',
    ...a.rows.map((r) => `| ${r.n} | ${r.name} | ${L(r)} | ${r.hits.map((h) => h.text).join('. ')} |`),
    '',
    '## Step facts',
    '',
    ...a.rows.flatMap((r) => [
      `**${r.n}. ${r.name}** (${r.system || 'system not named'})`,
      r.what ? `${r.what}` : '',
      FACT_KEYS.map((k) => `${FACTS[k].label}: ${factLabel(k, r[k])}`).join(' · '),
      ''
    ]),
    '## Approval points',
    '',
    ...(a.gates.length
      ? a.gates.map((g, i) => `${i + 1}. Step${g.length > 1 ? 's' : ''} ${g.map((r) => r.n).join(' and ')}: ${g.map((r) => r.name).join(', then ')}`)
      : ['None.']),
    '',
    '## Tool access',
    '',
    ...(map.tools.length ? map.tools.map((t) => `- ${t.system}: ${t.access} (steps ${t.steps})`) : ['- Not listed.']),
    '',
    '## How it fails and the guard',
    '',
    ...(map.fails.length ? map.fails.map((f) => `- Step ${f.step}: ${f.how}. Noticed by: ${f.notice}. Guard: ${f.guard}`) : ['- Not listed.']),
    '',
    '## Rollout',
    '',
    ...rollout(a).flatMap((p) => [`**${p.when}: ${p.title}.** ${p.line}`, p.steps.length ? `Steps: ${p.steps.join(', ')}` : '', `Exit: ${p.exit}`, '']),
    '## Questions for the process owner',
    '',
    ...(map.questions.length ? map.questions.map((q) => `- ${q}`) : ['- None listed.']),
    '',
    '_Lanes set by fixed rules in Who Does What? Step facts suggested by a model and reviewed by a person._'
  ];
  return lines.filter((l, i, arr) => !(l === '' && arr[i - 1] === '')).join('\n');
}
