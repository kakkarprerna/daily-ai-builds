// Pass the Call: fixed rules for when a voice agent hands a call to a person.
// The model only describes the call moments and suggests facts from fixed word lists.
// Everything below (points, lanes, overrides, live triggers, out-of-hours plan,
// context packet, transfer share) is worked out here, so the same facts always give
// the same answer.

export const FACTS = {
  stakes: {
    label: 'What a mistake touches',
    hint: 'The worst thing that happens if the agent gets this moment wrong',
    options: [
      { id: 'Information only', pts: 0 },
      { id: 'A booking or record', pts: 1 },
      { id: 'Money', pts: 2 },
      { id: 'Safety or wellbeing', pts: 3 }
    ]
  },
  feeling: {
    label: 'How callers sound',
    hint: 'The usual mood when people ring about this',
    options: [
      { id: 'Calm', pts: 0 },
      { id: 'Frustrated', pts: 1 },
      { id: 'Upset or anxious', pts: 2 }
    ]
  },
  verify: {
    label: 'Identity check',
    hint: 'What the caller has to prove before anything happens',
    options: [
      { id: 'None', pts: 0 },
      { id: 'Light', pts: 1, note: 'name, booking or order reference' },
      { id: 'Strong', pts: 2, note: 'security questions, one-time code' }
    ]
  },
  agent: {
    label: 'Can the agent finish it',
    hint: 'With the systems and permissions it has today',
    options: [
      { id: 'Fully', pts: 0 },
      { id: 'Partly', pts: 2 },
      { id: 'No', pts: 4 }
    ]
  },
  words: {
    label: 'How callers explain it',
    hint: 'Long, varied stories are harder to understand over the phone',
    options: [
      { id: 'Short and predictable', pts: 0 },
      { id: 'Varied', pts: 1 },
      { id: 'Long story', pts: 2 }
    ]
  }
};

export const FACT_KEYS = ['stakes', 'feeling', 'verify', 'agent', 'words'];

export const FREQ = ['Common', 'Occasional', 'Rare'];
const FREQ_WEIGHT = { Common: 3, Occasional: 2, Rare: 1 };

export const LANES = [
  {
    id: 0,
    label: 'Agent resolves',
    short: 'Resolves',
    who: 'The agent finishes the call. A person is one ask away',
    desc: 'The agent handles the whole moment. If the caller asks for a person, the live triggers decide when to pass the call.'
  },
  {
    id: 1,
    label: 'Agent resolves, offers a person',
    short: 'Offers a person',
    who: 'The agent finishes, then offers a person before ending',
    desc: 'The agent handles it, but checks the caller is satisfied and offers a person before closing. A first request for a person is honoured straight away.'
  },
  {
    id: 2,
    label: 'Agent gathers, warm transfer',
    short: 'Warm transfer',
    who: 'The agent verifies and captures facts, then passes the call',
    desc: 'The agent does the checks and collects the facts a person needs, tells the caller what happens next, and transfers with the context packet. The person should not ask any of it again.'
  },
  {
    id: 3,
    label: 'Straight to a person',
    short: 'Straight over',
    who: 'One line of capture, then a person',
    desc: 'The agent captures the caller’s name and one line on the reason, then transfers at once. No identity checks first, no attempts to solve.'
  }
];

// Points to lane, before overrides.
export const BANDS = [
  { from: 0, to: 2, lane: 0 },
  { from: 3, to: 5, lane: 1 },
  { from: 6, to: 9, lane: 2 },
  { from: 10, to: 99, lane: 3 }
];

export const COVERAGE = ['Staffed 24/7', 'Business hours only', 'Callbacks only'];
export const DELIVERY = ['Live transfer with on-screen summary', 'Live transfer, no screen', 'Callback only'];
export const CONSTRAINTS = ['Regulated (finance, health, insurance)', 'Personal data', 'Card payments on the call', 'Vulnerable callers likely'];

function factPoints(key, value) {
  const f = FACTS[key];
  const o = f.options.find((x) => x.id === value);
  if (o) return { pts: o.pts, custom: false };
  // A typed value has no weight of its own: middle of the range, rounded up.
  const vals = f.options.map((x) => x.pts);
  return { pts: Math.ceil((Math.min(...vals) + Math.max(...vals)) / 2), custom: !!value };
}

const has = (list, needle) => (list || []).some((x) => x.toLowerCase().startsWith(needle.toLowerCase()));

export function laneFor(m, form = {}) {
  const parts = FACT_KEYS.map((k) => ({ key: k, ...factPoints(k, m[k]) }));
  const score = parts.reduce((s, p) => s + p.pts, 0);
  const band = BANDS.find((b) => score >= b.from && score <= b.to) || BANDS[BANDS.length - 1];
  let lane = band.lane;
  const hits = [{ id: 'Points', text: `${score} points puts it in "${LANES[band.lane].label}".` }];

  const raise = (to, id, text) => {
    if (lane < to) {
      lane = to;
      hits.push({ id, text, raised: true });
    } else {
      hits.push({ id, text: `${text} Already at or above this lane.`, also: true });
    }
  };

  if (m.stakes === 'Safety or wellbeing') raise(3, 'R1', 'Safety or wellbeing is at stake, so a person takes it straight away.');
  if (m.agent === 'No') {
    if (m.feeling === 'Upset or anxious') raise(3, 'R2', 'The agent cannot finish it and callers are upset, so collecting facts first only adds wait time.');
    else raise(2, 'R2', 'The agent cannot finish it, so its job is to gather the facts and pass the call.');
  }
  if (m.stakes === 'Money' && m.verify === 'Strong' && m.agent !== 'Fully') raise(2, 'R3', 'Money is involved behind a strong identity check and the agent cannot complete it alone, so a person confirms.');
  if (has(form.constraints, 'Regulated') && m.feeling === 'Upset or anxious' && m.agent !== 'Fully') {
    raise(2, 'R4', 'On a regulated line, an upset caller whose issue the agent cannot finish gets a person.');
  }
  return { lane, score, parts, hits, custom: parts.some((p) => p.custom) };
}

export function analyse(moments, form = {}) {
  const rows = moments.map((m, i) => ({ ...m, n: i + 1, ...laneFor(m, form) }));
  const counts = [0, 0, 0, 0];
  rows.forEach((r) => { counts[r.lane] += 1; });
  let wAll = 0;
  let wPerson = 0;
  rows.forEach((r) => {
    const w = FREQ_WEIGHT[r.frequency] || 2;
    wAll += w;
    if (r.lane >= 2) wPerson += w;
  });
  const share = wAll ? Math.round((wPerson / wAll) * 100) : 0;
  return { rows, counts, share, toPerson: counts[2] + counts[3] };
}

// Live triggers that apply to any moment of the call.
export function triggers(form, a) {
  const vulnerable = has(form.constraints, 'Vulnerable');
  const delivery = form.delivery || DELIVERY[0];
  const callbackOnly = delivery === 'Callback only' || form.coverage === 'Callbacks only';
  const pass = callbackOnly ? 'book a callback with the context packet' : 'pass the call';
  const out = [];

  out.push({
    id: 'T1',
    icon: 'hand',
    name: 'Caller asks for a person',
    when: vulnerable
      ? 'First request, in any moment'
      : 'Second request. First request in any moment in the offer, warm transfer or straight-over lanes',
    then: vulnerable
      ? `Honour it at once and ${pass}. Vulnerable callers should never have to ask twice.`
      : `On a first request in an "Agent resolves" moment, the agent says once, in one sentence, what it can do right now. On a second request it stops and will ${pass}.`,
    why: 'Holding a caller who wants a person is the fastest way to lose trust in the agent.'
  });
  out.push({
    id: 'T2',
    icon: 'ear',
    name: 'Agent cannot understand',
    when: 'Two failed turns in a row',
    then: `The agent says it wants to get this right and will ${pass}. The packet records what it did catch.`,
    why: 'A third "sorry, could you repeat that" costs more goodwill than a transfer.'
  });
  out.push({
    id: 'T3',
    icon: 'loop',
    name: 'Going in circles',
    when: 'The same question or answer comes up three times',
    then: `Treat it as a moment the agent cannot finish and ${pass}.`,
    why: 'Loops usually mean the caller’s problem is not one the agent has a path for.'
  });
  out.push({
    id: 'T4',
    icon: 'heart',
    name: 'Distress or vulnerability',
    when: 'Words about danger, harm, bereavement, being unable to cope or pay, or confusion about what is happening',
    then: callbackOnly || form.coverage !== 'Staffed 24/7'
      ? 'Pass the call at once when the team is in. Out of hours, give the urgent or emergency number in plain words, then book the earliest callback.'
      : 'Pass the call at once to the priority queue, skipping identity checks.',
    why: 'The agent should not try to handle these, however well it is doing.'
  });
  out.push({
    id: 'T5',
    icon: 'mute',
    name: 'Noise guard',
    when: 'Background noise, hold music, a side conversation, or sound while the agent is giving its opening message',
    then: 'Do not count it as an interruption or a failed turn. Keep the opening message going, and re-prompt once after it ends.',
    why: 'Callers on the road or on speaker trigger false interruptions. Counting them as failures sends good calls to people for no reason.'
  });
  out.push({
    id: 'T6',
    icon: 'silence',
    name: 'Long silence',
    when: 'No speech for about six seconds, twice',
    then: 'Re-prompt twice, then offer a callback and end politely. Do not put a silent call in the queue for a person.',
    why: 'A silent call in the queue takes a person away from someone who is waiting.'
  });

  const uncovered = (form.callerLanguages || []).filter((l) => !(form.agentLanguages || []).includes(l));
  if (uncovered.length) {
    out.push({
      id: 'T7',
      icon: 'globe',
      name: 'Language the agent does not speak',
      when: `Caller speaks ${listJoin(uncovered)}`,
      then: callbackOnly
        ? `Say in that language, if a recorded line exists, that someone will call back. Book the callback tagged with the language.`
        : `Pass the call to a ${listJoin(uncovered, 'or')} speaker if one is on shift. If not, book a callback tagged with the language.`,
      why: 'Running the whole call in a second language the caller only half speaks produces wrong captures that look right in the packet.'
    });
  }
  if (has(form.constraints, 'Card payments')) {
    out.push({
      id: 'T8',
      icon: 'card',
      name: 'Card details on the call',
      when: 'The caller starts reading out a card number, or a payment is needed',
      then: 'Stop them politely and move the payment to secure capture (keypad entry or a payment link). Card numbers never go into the transcript or the context packet.',
      why: 'A transcript with card numbers in it brings the whole call system into scope for card security rules.'
    });
  }
  return out;
}

// What happens to each lane when nobody is in.
export function outOfHours(form) {
  const cov = form.coverage || COVERAGE[0];
  const callbackOnly = (form.delivery || '') === 'Callback only' || cov === 'Callbacks only';
  const rows = [
    { lane: 0, inHours: 'Agent finishes the call', out: 'Agent finishes the call' },
    { lane: 1, inHours: 'Agent finishes, offers a person', out: 'Agent finishes, offers a callback instead of a person' },
    { lane: 2, inHours: callbackOnly ? 'Callback booked with the packet' : 'Warm transfer with the packet', out: 'Callback booked with the packet, time given to the caller' },
    { lane: 3, inHours: callbackOnly ? 'Priority callback, earliest slot' : 'Straight to a person', out: 'Urgent or emergency number given in plain words, then priority callback' }
  ];
  if (cov === 'Staffed 24/7') rows.forEach((r) => { r.out = r.inHours; });
  return { cov, rows, applies: cov !== 'Staffed 24/7' };
}

// Context packet: what the person sees before saying hello.
export const BASE_FIELDS = [
  { field: 'Why the call came over', note: 'The lane or the live trigger that fired' },
  { field: 'What the caller wants', note: 'One line, in the caller’s own terms' },
  { field: 'Identity status', note: 'Verified, how, and at what level. Or not verified' },
  { field: 'What the agent already did', note: 'Lookups, changes made, anything sent' },
  { field: 'What the agent told the caller', note: 'Any promise, time or amount mentioned' },
  { field: 'Language and mood', note: 'Language spoken and how the caller sounds' },
  { field: 'Time on the call so far', note: 'So the person knows how long they have waited' }
];

export function packetFor(row, map) {
  const own = map.fields.filter((f) => f.moment === row.n);
  return { base: BASE_FIELDS, own };
}

// ---------- Parsing the model's tagged lines ----------

const norm = (s) => String(s || '').trim();

function snap(key, raw) {
  const v = norm(raw).toLowerCase();
  if (!v) return FACTS[key].options[0].id;
  const opts = FACTS[key].options;
  const exact = opts.find((o) => o.id.toLowerCase() === v);
  if (exact) return exact.id;
  const starts = opts.find((o) => v.startsWith(o.id.toLowerCase().split(' ')[0]));
  if (starts) return starts.id;
  const contains = opts.find((o) => v.includes(o.id.toLowerCase().split(' ')[0]));
  return contains ? contains.id : norm(raw);
}

function snapFreq(raw) {
  const v = norm(raw).toLowerCase();
  return FREQ.find((f) => v.startsWith(f.toLowerCase().slice(0, 4))) || 'Occasional';
}

export function parseMap(text) {
  const out = { summary: '', moments: [], signals: [], fields: [], lines: [], questions: [] };
  String(text || '').split('\n').forEach((line) => {
    const p = line.split('|').map((x) => x.trim());
    const tag = (p[0] || '').toUpperCase().replace(/[^A-Z]/g, '');
    if (tag === 'SUMMARY' && p[1]) out.summary = p[1];
    else if (tag === 'MOMENT' && p[1]) {
      out.moments.push({
        id: `m${out.moments.length + 1}`,
        name: p[1],
        want: p[2] || '',
        stakes: snap('stakes', p[3]),
        feeling: snap('feeling', p[4]),
        verify: snap('verify', p[5]),
        agent: snap('agent', p[6]),
        words: snap('words', p[7]),
        frequency: snapFreq(p[8]),
        systems: p[9] || ''
      });
    } else if (tag === 'SIGNAL' && p[2]) out.signals.push({ moment: parseInt(p[1], 10), text: p[2] });
    else if (tag === 'FIELD' && p[2]) out.fields.push({ moment: parseInt(p[1], 10), field: p[2], need: /req/i.test(p[3] || '') ? 'Required' : 'Useful' });
    else if (tag === 'LINE' && p[2]) out.lines.push({ moment: parseInt(p[1], 10), text: p[2] });
    else if (tag === 'QUESTION' && p[1]) out.questions.push(p[1]);
  });
  return out;
}

function listJoin(arr, word = 'and') {
  if (arr.length <= 1) return arr.join('');
  return `${arr.slice(0, -1).join(', ')} ${word} ${arr[arr.length - 1]}`;
}

// ---------- Markdown export ----------

export function specMarkdown(form, map, a) {
  const T = triggers(form, a);
  const ooh = outOfHours(form);
  const L = [];
  L.push(`# Handoff spec: ${form.name || 'Voice line'}`);
  L.push('');
  if (map.summary) L.push(map.summary, '');
  L.push(`- Callers: ${form.callers || 'not given'}`);
  L.push(`- Cover: ${form.coverage}. Delivery: ${form.delivery}`);
  if ((form.constraints || []).length) L.push(`- Constraints: ${form.constraints.join(', ')}`);
  L.push(`- Rough share of calls that reach a person: ${a.share}% (weighted by how often each moment comes up, not a forecast)`);
  L.push('', '## Call moments', '');
  L.push('| # | Moment | Lane | Points | Rules applied |', '| --- | --- | --- | --- | --- |');
  a.rows.forEach((r) => {
    const rules = r.hits.filter((h) => h.raised).map((h) => h.id).join(', ') || 'none';
    L.push(`| ${r.n} | ${r.name} | ${LANES[r.lane].label} | ${r.score} | ${rules} |`);
  });
  a.rows.forEach((r) => {
    L.push('', `### ${r.n}. ${r.name}`, '');
    if (r.want) L.push(`Caller wants: ${r.want}`, '');
    L.push(`Facts: ${FACT_KEYS.map((k) => `${FACTS[k].label}: ${r[k]}`).join('; ')}. Frequency: ${r.frequency}.`);
    const line = map.lines.find((l) => l.moment === r.n);
    if (line && r.lane >= 1) L.push('', `Handover line: "${line.text}"`);
    const sig = map.signals.filter((s) => s.moment === r.n);
    if (sig.length) L.push('', 'Hand over early if:', ...sig.map((s) => `- ${s.text}`));
    const own = map.fields.filter((f) => f.moment === r.n);
    if (own.length && r.lane >= 2) L.push('', 'Capture before passing the call:', ...own.map((f) => `- ${f.field} (${f.need.toLowerCase()})`));
  });
  L.push('', '## Live triggers', '');
  T.forEach((t) => L.push(`- **${t.id} ${t.name}.** When: ${t.when}. Then: ${t.then}`));
  if (ooh.applies) {
    L.push('', `## Out of hours (${ooh.cov})`, '');
    ooh.rows.forEach((r) => L.push(`- ${LANES[r.lane].label}: ${r.out}`));
  }
  L.push('', '## Every context packet carries', '');
  BASE_FIELDS.forEach((f) => L.push(`- ${f.field}: ${f.note}`));
  L.push('', 'Rule: the person never asks again for anything the packet already holds.');
  if (map.questions.length) {
    L.push('', '## Open questions for the contact centre lead', '');
    map.questions.forEach((q) => L.push(`- ${q}`));
  }
  L.push('', '_Made with Pass the Call. Lanes and triggers come from printed rules; moments, fields and lines are model suggestions to check with the team._');
  return L.join('\n');
}
