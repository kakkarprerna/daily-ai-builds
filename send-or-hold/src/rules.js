// Send or Hold? Printed rules.
// A model reads the guest message, quotes it and drafts a reply. It never decides who sends.
// Everything below is fixed: the kinds, the lanes, the word lists, the checks and the host note.

export const CHANNELS = ['Airbnb', 'Booking.com', 'Vrbo', 'Direct booking', 'WhatsApp'];
export const STAGES = ['Enquiry', 'Booked, before arrival', 'Arrival day', 'In the stay', 'After check-out'];
export const TIMES = ['Daytime', 'Evening', 'Night, 23:00 to 08:00'];
export const LANGS = ['English', 'Spanish', 'German', 'French'];
export const CALENDAR = ['Another guest leaves on their arrival day', 'Another guest arrives on their departure day', 'Free nights either side'];
export const AUTONOMY = [
  { id: 'cautious', label: 'Cautious', hint: 'Nothing goes out alone. The host checks every reply.' },
  { id: 'balanced', label: 'Balanced', hint: 'Routine answers backed by your house facts go out alone.' },
  { id: 'handsoff', label: 'Hands-off', hint: 'Also sends enquiry answers and other languages alone.' }
];

// What the Co-host may never promise without the host. Each maps to ask kinds and to words in a draft.
export const PROMISES = [
  { id: 'money', label: 'Prices, discounts or refunds' },
  { id: 'timing', label: 'Early check-in or late check-out' },
  { id: 'guests', label: 'Extra guests, pets or visitors' },
  { id: 'change', label: 'Date changes or cancellations' }
];
export const DEFAULT_PROMISES = PROMISES.map((p) => p.id);

export const LANES = [
  { id: 0, key: 'send', label: 'Send now', tone: 'ok', line: 'The Co-host can send this reply alone. Every answer comes from your house facts.' },
  { id: 1, key: 'check', label: 'Host checks', tone: 'mid', line: 'The draft is ready, but a person reads it before it goes. One tap to send.' },
  { id: 2, key: 'decide', label: 'Host decides', tone: 'warn', line: 'The guest wants something only the host can agree. Send the holding reply now and decide.' },
  { id: 3, key: 'act', label: 'Act now', tone: 'bad', line: 'Someone may be in danger or cannot get in. Send the fixed safety message and call the guest.' }
];

// Ask kinds: what the guest wants. promise = the never-promise group it belongs to.
export const ASKS = [
  { id: 'access', label: 'Check-in, keys or directions', base: 0 },
  { id: 'house', label: 'House info or amenities', base: 0 },
  { id: 'local', label: 'Local tips', base: 0 },
  { id: 'booking', label: 'Availability or booking details', base: 0 },
  { id: 'thanks', label: 'Thanks or small talk', base: 0 },
  { id: 'timing', label: 'Early check-in or late check-out', base: 0, promise: 'timing' },
  { id: 'money', label: 'Price, discount or refund', base: 0, promise: 'money' },
  { id: 'change', label: 'Date change or cancellation', base: 0, promise: 'change' },
  { id: 'guests', label: 'Extra guests, pets or visitors', base: 0, promise: 'guests' },
  { id: 'problem', label: 'Something broken or missing', base: 1 },
  { id: 'other', label: 'Something else', base: 1 }
];

// Signals: how the message reads. lane = the lowest lane the signal allows.
export const SIGNALS = [
  { id: 'safety', label: 'Danger to people or property', lane: 3 },
  { id: 'lockout', label: 'Cannot get in', lane: 3 },
  { id: 'upset', label: 'Upset or threatening a bad review', lane: 2 },
  { id: 'party', label: 'Party, event or more people than booked', lane: 2 },
  { id: 'offplatform', label: 'Wants to pay or talk off the platform', lane: 2 },
  { id: 'person', label: 'Asks for a real person', lane: 2 },
  { id: 'legal', label: 'Police, legal or official bodies', lane: 2 }
];

// S0: phrases that send a message to Act now before any model call. Kept narrow on purpose.
export const SAFETY_WORDS = [
  'smell of gas', 'smells of gas', 'smell gas', 'gas smell', 'gas leak', 'carbon monoxide', 'smoke', 'on fire', 'a fire', 'fire alarm',
  'flooding', 'flooded', 'water everywhere', 'electric shock', 'sparks', 'injured', 'bleeding', 'ambulance', 'emergency', 'unconscious',
  'locked out', "can't get in", 'cannot get in', 'stuck outside', 'break-in', 'broken into', 'intruder',
  'huele a gas', 'olor a gas', 'fuga de gas', 'humo', 'fuego', 'incendio', 'inundado', 'inundación', 'herido', 'ambulancia', 'urgencia', 'emergencia',
  'no podemos entrar', 'no puedo entrar', 'nos hemos quedado fuera',
  'gasgeruch', 'riecht nach gas', 'rauch', 'feuer', 'notfall', 'verletzt', 'kommen nicht rein',
  'odeur de gaz', 'fumée', 'incendie', 'urgence', 'blessé'
];

// D1: words in a draft that offer something on the never-promise list.
export const PROMISE_WORDS = {
  money: ['refund', 'discount', 'compensation', 'free of charge', 'no charge', 'free night', 'money back', 'reembolso', 'descuento', 'compensación', 'gratis', 'rabatt', 'erstattung', 'remboursement', 'réduction'],
  timing: ['early check-in', 'late check-out', 'check in early', 'check out late', 'stay until', 'entrada anticipada', 'salida tardía', 'antes de las', 'früher einchecken', 'später auschecken'],
  guests: ['bring your dog', 'bring the dog', 'pets are welcome', 'extra guest', 'extra person', 'mascotas son bienvenidas', 'podéis traer', 'pueden traer'],
  change: ['change your dates', 'move your dates', 'cancel for free', 'full refund', 'cambiar las fechas', 'cancelar sin coste']
};

// Choices the host gets for each kind of decision.
export const OPTIONS = {
  timing: ['Yes, at a set time', 'Luggage drop only', 'No, standard times'],
  money: ['Hold the price', 'Offer a set discount', 'Point to the policy'],
  guests: ['Yes, with any fee', 'Yes, with conditions', 'No, as the house rules say'],
  change: ['Move the dates', 'Cancel under the policy', 'Ask them to rebook'],
  problem: ['Send fix steps', 'Send someone today', 'Offer a move or refund'],
  other: ['Answer it yourself', 'Add it to house facts'],
  upset: ['Call the guest', 'Apologise and fix it', 'Offer something within policy'],
  party: ['Restate the house rules', 'Ask how many will come', 'Decline the event'],
  offplatform: ['Keep it on the platform', 'Point to the platform rules'],
  person: ['Reply as yourself', 'Call the guest'],
  legal: ['Answer from your records', 'Ask the authority for details'],
  safety: ['Call the guest now', 'Call 112 if no answer', 'Send someone to the property'],
  lockout: ['Call the guest now', 'Send the backup key route', 'Send someone with a key']
};

// The fixed safety message for Act now. It is printed, never written by the model.
export const SAFETY_SCRIPT = {
  English: 'If you smell gas or see smoke or fire, or anyone is hurt: get everyone outside now, do not switch lights or appliances on or off, and call 112. I am alerting the host now and they will phone you in the next few minutes.',
  Spanish: 'Si huele a gas, hay humo o fuego, o alguien está herido: salid todos de la casa ahora, no encendáis ni apaguéis luces ni aparatos, y llamad al 112. Estoy avisando al anfitrión ahora y os llamará en unos minutos.'
};
export const LOCKOUT_SCRIPT = {
  English: 'Sorry you cannot get in. Please stay where you are and keep your phone on. I am alerting the host now and they will phone you in the next few minutes.',
  Spanish: 'Sentimos que no podáis entrar. Quedaos donde estáis y tened el teléfono a mano. Estoy avisando al anfitrión ahora y os llamará en unos minutos.'
};

export const RULES_TABLE = [
  ['Q1', 'An ask or signal counts only if its quote is in the guest message, word for word'],
  ['Q2', 'A fact counts only if it is in your house facts, word for word'],
  ['Q3', 'Kinds must be on the printed lists. Anything else is dropped'],
  ['S0', 'A safety phrase in the message means Act now, before and without the model'],
  ['S1', 'A Danger or Cannot get in signal means Act now'],
  ['H1', 'An ask on your never-promise list means Host decides'],
  ['H2', 'Upset, party, off-platform, asking for a person, or police and legal means Host decides. Off-platform is ignored for direct bookings and WhatsApp'],
  ['H3', 'Something broken with no fix in your house facts means Host decides. With a fix in them: Host checks'],
  ['G1', 'A question your house facts do not answer means Host checks, and the host note says what to add'],
  ['G2', 'An ask the model could not place (Something else) means Host checks'],
  ['D1', 'A draft that offers anything on your never-promise list unasked, or uses one of your own watch words, means Host decides'],
  ['D2', 'A draft that gives a time, code or number not in your house facts or the message means Host checks'],
  ['C1', 'An enquiry about availability before booking means Host checks, unless Hands-off'],
  ['C2', 'A message in a language you do not read means Host checks, unless Hands-off'],
  ['C3', 'Four or more asks in one message means Host checks, since one may be missed'],
  ['C4', 'Cautious: nothing goes out alone, so the lowest lane is Host checks'],
  ['N1', 'Act now at night: phone the host, do not wait for the app'],
  ['N2', 'Host decides at night: the holding reply goes now, the decision waits for the morning unless they arrive today'],
  ['T1', 'Early check-in or late check-out against a same-day turnover: the note offers luggage drop instead'],
  ['V', 'The lane is the highest one any rule sets. Send now needs every rule to pass']
];

const norm = (s) => String(s || '')
  .toLowerCase()
  .normalize('NFC')
  .replace(/[‘’´`]/g, "'")
  .replace(/[“”«»]/g, '"')
  .replace(/\s+/g, ' ')
  .trim();
const stripEnds = (s) => norm(s).replace(/^["'.,;:!?¿¡\s]+|["'.,;:!?\s]+$/g, '');
export const contains = (hay, needle) => {
  const n = stripEnds(needle);
  return n.length >= 3 && norm(hay).includes(n);
};

export const askById = (id) => ASKS.find((a) => a.id === id);
export const signalById = (id) => SIGNALS.find((s) => s.id === id);

// Parse tagged lines. Broken lines are skipped, one bad line never sinks the rest.
export function parseReply(text) {
  const out = { summary: '', lang: '', asks: [], signals: [], facts: [], gaps: [], reply: [], hold: [] };
  for (const raw of String(text || '').split('\n')) {
    const line = raw.trim().replace(/^[-*•]\s*/, '');
    if (!line.includes('|')) continue;
    const parts = line.split('|').map((x) => x.trim());
    const tag = parts[0].toUpperCase();
    if (tag === 'SUMMARY' && parts[1]) out.summary = parts.slice(1).join(' ');
    else if (tag === 'LANG' && parts[1]) out.lang = parts[1];
    else if (tag === 'ASK' && parts.length >= 4) out.asks.push({ kind: parts[1].toLowerCase(), what: parts[2], quote: parts.slice(3).join(' ') });
    else if (tag === 'SIGNAL' && parts.length >= 4) out.signals.push({ kind: parts[1].toLowerCase(), quote: parts[2], why: parts.slice(3).join(' ') });
    else if (tag === 'FACT' && parts[1]) out.facts.push(parts.slice(1).join(' '));
    else if (tag === 'GAP' && parts[1]) out.gaps.push(parts.slice(1).join(' '));
    else if (tag === 'REPLY' && parts[1]) out.reply.push(parts.slice(1).join(' '));
    else if (tag === 'HOLD' && parts[1]) out.hold.push(parts.slice(1).join(' '));
  }
  return out;
}

// Q1 to Q3: keep only what the message and facts back up.
export function checkRead(p, form) {
  const kept = { asks: [], signals: [], facts: [] };
  const dropped = [];
  for (const a of p.asks) {
    if (!askById(a.kind)) dropped.push({ quote: a.quote, reason: 'Kind not on the list' });
    else if (!contains(form.message, a.quote)) dropped.push({ quote: a.quote, reason: 'Not in the message' });
    else kept.asks.push(a);
  }
  for (const s of p.signals) {
    if (!signalById(s.kind)) dropped.push({ quote: s.quote, reason: 'Kind not on the list' });
    else if (!contains(form.message, s.quote)) dropped.push({ quote: s.quote, reason: 'Not in the message' });
    else kept.signals.push(s);
  }
  for (const f of p.facts) {
    if (contains(form.facts, f)) kept.facts.push(f);
    else dropped.push({ quote: f, reason: 'Not in your house facts' });
  }
  return { kept, dropped };
}

// S0: the word list. Runs on the message alone.
export function safetyHits(message) {
  const m = norm(message);
  return SAFETY_WORDS.filter((w) => {
    const re = new RegExp(`(^|[^\\p{L}])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\p{L}])`, 'u');
    return re.test(m);
  });
}

const LOCKOUT_WORDS = ['locked out', "can't get in", 'cannot get in', 'stuck outside', 'no podemos entrar', 'no puedo entrar', 'nos hemos quedado fuera', 'kommen nicht rein'];

// D2: times, codes and numbers in the draft that appear nowhere in the facts or message.
export function strayNumbers(draft, form) {
  const pool = `${norm(form.facts)} ${norm(form.message)}`;
  const found = String(draft || '').match(/\b\d{1,2}[:.h]\d{2}\b|\+?\d[\d\s]{5,}\d|\b\d{3,}\b/g) || [];
  return [...new Set(found.map((x) => x.trim()))].filter((x) => !pool.includes(norm(x)));
}

// D1: offers in the draft the host has not allowed and the guest did not ask for.
export function strayPromises(draft, form, askedGroups) {
  const d = norm(draft);
  const hits = [];
  for (const g of form.promises || []) {
    if (askedGroups.has(g)) continue;
    const w = (PROMISE_WORDS[g] || []).find((x) => d.includes(norm(x)));
    if (w) hits.push({ group: g, word: w });
  }
  for (const w of form.watchWords || []) {
    if (norm(w).length >= 3 && d.includes(norm(w))) hits.push({ group: 'own', word: w });
  }
  return hits;
}

const laneMax = (a, b) => (b > a ? b : a);

export function assess(form, parsed, checked) {
  const trail = [];
  const fire = (rule, lane, text) => trail.push({ rule, lane, text, fired: true });
  const pass = (rule, text) => trail.push({ rule, lane: null, text, fired: false });
  const autonomy = form.autonomy || 'balanced';
  const promises = new Set(form.promises || []);
  const night = form.time === TIMES[2];
  const direct = ['Direct booking', 'WhatsApp'].includes(form.channel);
  const asks = checked.kept.asks;
  const signals = checked.kept.signals.filter((s) => !(s.kind === 'offplatform' && direct));
  const facts = checked.kept.facts;
  const hasRead = !!(parsed.summary || parsed.asks.length || parsed.reply.length);
  const draft = parsed.reply.join('\n');

  // S0
  const hits = safetyHits(form.message);
  const lockoutHit = hits.some((h) => LOCKOUT_WORDS.includes(h));
  if (hits.length) fire('S0', 3, `Safety phrase in the message: ${hits.map((h) => `"${h}"`).join(', ')}`);
  else pass('S0', 'No safety phrase in the message');

  // S1, H2
  const actSignals = signals.filter((s) => signalById(s.kind).lane === 3);
  const decideSignals = signals.filter((s) => signalById(s.kind).lane === 2);
  if (actSignals.length) fire('S1', 3, `Model flagged ${actSignals.map((s) => signalById(s.kind).label.toLowerCase()).join(', ')}`);
  else pass('S1', 'No danger or lock-out signal from the model');
  if (decideSignals.length) fire('H2', 2, `Signals: ${[...new Set(decideSignals.map((s) => signalById(s.kind).label.toLowerCase()))].join(', ')}`);
  else pass('H2', 'No upset, party, off-platform, person or legal signal');

  // H1
  const askedGroups = new Set(asks.map((a) => askById(a.kind).promise).filter(Boolean));
  const held = asks.filter((a) => askById(a.kind).promise && promises.has(askById(a.kind).promise));
  if (held.length) fire('H1', 2, `On your never-promise list: ${[...new Set(held.map((a) => askById(a.kind).label.toLowerCase()))].join(', ')}`);
  else pass('H1', 'Nothing on your never-promise list');

  // H3
  const problems = asks.filter((a) => a.kind === 'problem');
  const factText = facts.join(' ');
  const problemUnfixed = problems.filter((a) => !factCovers(a, facts));
  if (problemUnfixed.length) fire('H3', 2, `Something broken with no fix in your house facts: ${problemUnfixed.map((a) => a.what).join('; ')}`);
  else if (problems.length) fire('H3', 1, 'Something broken, with a fix in your house facts');
  else pass('H3', 'Nothing reported broken');

  // G1, G2
  if (parsed.gaps.length) fire('G1', 1, `Not in your house facts: ${parsed.gaps.join('; ')}`);
  else pass('G1', 'Every question is answered by your house facts');
  if (asks.some((a) => a.kind === 'other')) fire('G2', 1, 'An ask the model could not place');
  else pass('G2', 'Every ask placed in a kind');

  // D1, D2
  const offers = strayPromises(draft, form, askedGroups);
  if (offers.length) fire('D1', 2, `Draft offers what you have not allowed: ${offers.map((o) => `"${o.word}"`).join(', ')}`);
  else pass('D1', 'Draft offers nothing on your never-promise list');
  const strays = strayNumbers(draft, form);
  if (strays.length) fire('D2', 1, `Draft gives numbers not in your facts: ${strays.join(', ')}`);
  else pass('D2', 'Every time, code and number in the draft is in your facts or the message');

  // C1 to C4
  const enquiry = form.stage === 'Enquiry' && asks.some((a) => a.kind === 'booking');
  if (enquiry && autonomy !== 'handsoff') fire('C1', 1, 'Enquiry before booking: a person checks the answer');
  else pass('C1', enquiry ? 'Enquiry, sent alone on Hands-off' : 'Not an enquiry about availability');
  const lang = parsed.lang || '';
  const reads = (form.hostLangs || []).map(norm);
  const foreign = !!lang && !reads.includes(norm(lang));
  if (foreign && autonomy !== 'handsoff') fire('C2', 1, `Written in ${lang}, which you have not said you read`);
  else pass('C2', foreign ? `Written in ${lang}, sent alone on Hands-off` : `Written in ${lang || 'a language you read'}`);
  if (asks.length >= 4) fire('C3', 1, `${asks.length} asks in one message`);
  else pass('C3', 'Three asks or fewer');
  if (autonomy === 'cautious') fire('C4', 1, 'Cautious: nothing goes out alone');
  else pass('C4', `${AUTONOMY.find((a) => a.id === autonomy).label}: routine answers may go out alone`);

  let lane = 0;
  for (const t of trail) if (t.fired && t.lane !== null) lane = laneMax(lane, t.lane);
  if (!hasRead && !hits.length) lane = Math.max(lane, 1);

  // Notes that change what the host does, not the lane.
  const notes = [];
  if (lane === 3 && night) notes.push({ rule: 'N1', text: 'It is night. Phone the host, do not wait for them to open the app.' });
  if (lane === 2 && night) notes.push({ rule: 'N2', text: form.stage === 'Arrival day' ? 'It is night and they arrive today: the host decides now.' : 'It is night. Send the holding reply now, decide in the morning.' });
  const turnover = (form.calendar || []).some((c) => c !== CALENDAR[2]);
  if (asks.some((a) => a.kind === 'timing') && turnover) notes.push({ rule: 'T1', text: 'A same-day turnover is on the calendar. Offer luggage drop or a time after cleaning instead of a firm early or late time.' });

  // The decisions to put in front of the host.
  const decisions = [];
  const actQuotes = new Set(actSignals.map((s) => stripEnds(s.quote)));
  for (const a of asks) {
    if (actQuotes.has(stripEnds(a.quote))) continue;
    const k = askById(a.kind);
    const needs = (k.promise && promises.has(k.promise)) || (a.kind === 'problem' && problemUnfixed.includes(a)) || a.kind === 'other';
    if (needs) decisions.push({ key: `a-${decisions.length}`, title: a.what, kind: k.label, quote: a.quote, options: OPTIONS[k.promise || a.kind] || OPTIONS.other });
  }
  for (const s of signals) {
    if (signalById(s.kind).lane >= 2) decisions.push({ key: `s-${decisions.length}`, title: signalById(s.kind).label, kind: 'Signal', quote: s.quote, options: OPTIONS[s.kind] });
  }
  if (hits.length && !actSignals.length) decisions.unshift({ key: 's0', title: 'Possible danger (word list)', kind: 'Signal', quote: hits.join(', '), options: lockoutHit ? OPTIONS.lockout : OPTIONS.safety });

  const scriptKind = lane === 3 ? (actSignals.some((s) => s.kind === 'safety') || (hits.length && !lockoutHit) ? 'safety' : 'lockout') : null;
  return {
    lane, trail, notes, decisions, offers, strays, hits, asks, signals, facts, factText,
    caughtByListOnly: hits.length > 0 && !actSignals.length && hasRead, scriptKind, hasRead, askedGroups
  };
}

// A problem counts as covered when a kept fact shares a meaningful word with what is broken.
const STOP = new Set(['the', 'and', 'with', 'not', 'does', 'doesn', 'dont', 'working', 'work', 'broken', 'missing', 'there', 'they', 'that', 'this', 'from', 'have', 'into', 'para', 'por', 'que', 'una', 'los', 'las', 'del', 'advice', 'about']);
function factCovers(ask, facts) {
  const words = norm(`${ask.what} ${ask.quote}`).split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 4 && !STOP.has(w));
  return facts.some((f) => {
    const fw = norm(f);
    return words.some((w) => fw.includes(w));
  });
}

export function laneOf(id) {
  return LANES[id];
}

// The host note, as Markdown.
export function hostNote(form, a, parsed, now, picked = {}) {
  const L = LANES[a.lane];
  const lines = [];
  lines.push(`# Host note: ${form.property || 'Your property'}`);
  lines.push('');
  lines.push(`**Lane: ${L.label}.** ${L.line}`);
  lines.push('');
  lines.push(`- Guest message via ${form.channel}, ${form.stage.toLowerCase()}, ${form.time.toLowerCase()}`);
  if (parsed.lang) lines.push(`- Written in ${parsed.lang}`);
  if (parsed.summary) lines.push(`- In short: ${parsed.summary}`);
  lines.push(`- Prepared ${now.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}`);
  lines.push('');
  for (const n of a.notes) lines.push(`> ${n.rule}: ${n.text}`);
  if (a.notes.length) lines.push('');
  if (a.decisions.length) {
    lines.push('## What you need to decide');
    a.decisions.forEach((d, i) => {
      lines.push(`${i + 1}. **${d.title}** (${d.kind})`);
      lines.push(`   - They wrote: "${d.quote}"`);
      lines.push(`   - Options: ${d.options.join(' / ')}`);
      if (picked[d.key]) lines.push(`   - Host's call: **${picked[d.key]}**`);
    });
    lines.push('');
  }
  if (a.asks.length) {
    lines.push('## What they asked');
    a.asks.forEach((x) => lines.push(`- ${askById(x.kind).label}: ${x.what}`));
    lines.push('');
  }
  if (a.facts.length) {
    lines.push('## House facts the draft used');
    a.facts.forEach((f) => lines.push(`- ${f}`));
    lines.push('');
  }
  if (parsed.gaps.length) {
    lines.push('## Add to your house facts');
    parsed.gaps.forEach((g) => lines.push(`- ${g}`));
    lines.push('');
  }
  lines.push('## Why this lane');
  a.trail.filter((t) => t.fired).forEach((t) => lines.push(`- ${t.rule}: ${t.text}`));
  lines.push('');
  const reply = a.lane === 3 ? scriptFor(a, parsed) : a.lane === 2 ? parsed.hold.join('\n') : parsed.reply.join('\n');
  if (reply) {
    lines.push(a.lane === 3 ? '## Fixed safety message' : a.lane === 2 ? '## Holding reply' : '## Draft reply');
    lines.push('');
    lines.push(reply);
    lines.push('');
  }
  lines.push('_Prepared by Send or Hold? Rules set the lane; a model drafted the wording._');
  return lines.join('\n');
}

export function scriptFor(a, parsed) {
  const set = a.scriptKind === 'lockout' ? LOCKOUT_SCRIPT : SAFETY_SCRIPT;
  const lang = parsed.lang && set[parsed.lang] ? parsed.lang : null;
  return lang && lang !== 'English' ? `${set[lang]}\n\n${set.English}` : set.English;
}
