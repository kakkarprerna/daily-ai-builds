// Are We Tracking That? Printed rules.
// Everything that decides the verdict lives in this file. The How it works page prints from RULES.
// A model only maps questions and funnel steps to events. Every event and property it names
// is checked against the pasted plan here, and the check can only lower its answer, never raise it.

export const FLOWS = ['Sign-up and activation', 'Onboarding', 'Checkout', 'Booking', 'Feature adoption', 'Subscription and billing'];
export const TOOLS = ['Amplitude', 'Mixpanel', 'Segment', 'GA4', 'PostHog', 'Other'];
export const CONVENTIONS = ['snake_case', 'Title Case', 'camelCase', 'Not set'];
export const IDENTITY = ['Anonymous, then identified', 'Identified from the start', 'Never identified', 'Not sure'];

// Flows where people can be lost to a failure (a form error, a declined card) and where
// knowing where they came from matters for the drop-off question.
const FAILURE_FLOWS = ['Sign-up and activation', 'Onboarding', 'Checkout', 'Booking', 'Subscription and billing'];
const SOURCE_FLOWS = ['Sign-up and activation', 'Booking'];

export const SEVERITY = [
  { id: 0, key: 'blocker', label: 'Blocks an answer', short: 'Blocker', tone: 'bad' },
  { id: 1, key: 'gap', label: 'Weakens an answer', short: 'Gap', tone: 'warn' },
  { id: 2, key: 'tidy', label: 'Tidy before build', short: 'Tidy', tone: 'mid' }
];

export const VERDICTS = [
  { id: 0, label: 'Ready to measure', line: 'Every question and step has an event behind it, and nothing in the plan breaks the count.', tone: 'ok' },
  { id: 1, label: 'Measurable, with gaps', line: 'You will get numbers, but some answers will be partial until the gaps are fixed.', tone: 'warn' },
  { id: 2, label: 'Not measurable yet', line: 'At least one question or step has nothing behind it, or the plan sends something it should not.', tone: 'bad' },
  { id: 3, label: 'Nothing to check yet', line: 'Paste a tracking plan to start. The rules run as you type.', tone: 'na' }
];

export const RULES = [
  { id: 'R1', sev: null, group: 'Reading the model', text: 'An event the model names counts only if it is in your plan. Anything else is dropped and listed' },
  { id: 'R2', sev: null, group: 'Reading the model', text: 'A property the model says a question needs counts only if one of the cited events carries it' },
  { id: 'R3', sev: null, group: 'Reading the model', text: 'The check can lower the model\'s answer for a question, never raise it' },
  { id: 'S1', sev: 0, group: 'Questions and steps', text: 'A funnel step with no event behind it blocks the funnel' },
  { id: 'Q1', sev: 0, group: 'Questions and steps', text: 'A question with no event that answers it is a blocker' },
  { id: 'Q2', sev: 1, group: 'Questions and steps', text: 'A question answered only in part is a gap' },
  { id: 'P1', sev: 0, group: 'What the plan sends', text: 'A property that looks like personal data (email, phone, name, address, IP, ID numbers, card or bank details) is a blocker until removed or hashed' },
  { id: 'G1', sev: 0, group: 'What the plan sends', text: 'GA4 only: an event or property name over 40 characters' },
  { id: 'G2', sev: 0, group: 'What the plan sends', text: 'GA4 only: more than 25 properties on one event' },
  { id: 'G3', sev: 0, group: 'What the plan sends', text: 'GA4 only: a reserved event name, a reserved prefix (firebase_, google_, ga_) or characters other than letters, numbers and underscores' },
  { id: 'F1', sev: 1, group: 'Seeing why, not only where', text: 'A flow where people can fail, with start or submit events but no failure event anywhere' },
  { id: 'F2', sev: 1, group: 'Seeing why, not only where', text: 'A failure event with no reason or error property' },
  { id: 'I1', sev: 1, group: 'Joining it up', text: 'You are not sure how users are identified, so visits before and after sign-up may not join' },
  { id: 'I2', sev: 1, group: 'Joining it up', text: 'Visitors start anonymous, but no event marks the moment they become a known user' },
  { id: 'A1', sev: 1, group: 'Joining it up', text: 'A sign-up or booking flow with no source, UTM, campaign or referrer property anywhere' },
  { id: 'D1', sev: 1, group: 'Counting once', text: 'Two events that mean the same thing under different names, which splits the count' },
  { id: 'N1', sev: 2, group: 'Tidy before build', text: 'An event or property name that breaks your naming convention, or the plan\'s own majority style when none is set' },
  { id: 'N2', sev: 2, group: 'Tidy before build', text: 'A vague event, such as button_clicked, with nothing in the name or properties saying what was clicked' },
  { id: 'N3', sev: 2, group: 'Tidy before build', text: 'An event with no description of when it fires, so two engineers can build it two ways' },
  { id: 'N4', sev: 2, group: 'Tidy before build', text: 'The same event name listed twice' },
  { id: 'V', sev: null, group: 'Verdict', text: 'Any blocker: Not measurable yet. Gaps only: Measurable, with gaps. Neither: Ready to measure. Tidy-ups never change the verdict' }
];

/* ---------------- Reading the pasted plan ---------------- */

const splitProps = (s) =>
  String(s || '')
    .split(/[,;]/)
    .map((p) => p.trim().replace(/^["'`]|["'`]$/g, '').replace(/\s*[(:].*$/, '').trim())
    .filter(Boolean);

function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q;
    } else if (c === ',' && !q) { out.push(cur); cur = ''; } else cur += c;
  }
  out.push(cur);
  return out.map((x) => x.trim());
}

const HEADER = /^(event|event name|event_name|name|events?)$/i;

// Accepts one event per line as `event | properties | when it fires`, tab-separated rows pasted
// from a sheet, or CSV with an "event" header and the properties in quotes.
export function parsePlan(text) {
  const lines = String(text || '').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !/^#|^\/\//.test(l));
  const events = [];
  const csvMode = lines.length > 0 && !lines[0].includes('|') && !lines[0].includes('\t') && /^"?event/i.test(lines[0]) && lines[0].includes(',');
  lines.forEach((line, i) => {
    let cells;
    if (line.includes('|')) cells = line.split('|').map((c) => c.trim());
    else if (line.includes('\t')) cells = line.split('\t').map((c) => c.trim());
    else if (csvMode) cells = splitCsvLine(line);
    else cells = [line];
    cells = cells.map((c) => c.replace(/^["']|["']$/g, '').trim());
    if (!cells[0] || HEADER.test(cells[0])) return;
    events.push({ name: cells[0], props: splitProps(cells[1]), trigger: (cells[2] || '').trim(), line: i + 1 });
  });
  return events;
}

/* ---------------- Words inside names ---------------- */

export function words(name) {
  return String(name || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

const JOIN = [['sign', 'up', 'signup'], ['log', 'in', 'login'], ['sign', 'in', 'login'], ['check', 'out', 'checkout'], ['on', 'boarding', 'onboarding'], ['e', 'mail', 'email']];
const SYN = {
  tapped: 'clicked', tap: 'clicked', pressed: 'clicked', press: 'clicked', click: 'clicked',
  view: 'viewed', seen: 'viewed', shown: 'viewed', opened: 'viewed', open: 'viewed', loaded: 'viewed',
  start: 'started', begin: 'started', began: 'started', initiated: 'started',
  complete: 'completed', finished: 'completed', finish: 'completed', done: 'completed', succeeded: 'completed', success: 'completed',
  fail: 'failed', error: 'failed', errored: 'failed', failure: 'failed',
  submit: 'submitted',
  register: 'signup', registration: 'signup', registered: 'signup',
  signin: 'login', logged: 'login',
  create: 'created', added: 'created', add: 'created'
};

function joined(tokens) {
  const out = [];
  for (let i = 0; i < tokens.length; i++) {
    const j = JOIN.find(([a, b]) => tokens[i] === a && tokens[i + 1] === b);
    if (j) { out.push(j[2]); i++; } else out.push(tokens[i]);
  }
  return out;
}

export const meaningKey = (name) => [...new Set(joined(words(name)).map((t) => SYN[t] || t))].sort().join(' ');
const tokensOf = (name) => joined(words(name)).map((t) => SYN[t] || t);

/* ---------------- Naming conventions ---------------- */

const STYLE = {
  snake_case: /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/,
  'Title Case': /^[A-Z0-9][A-Za-z0-9]*( [A-Z0-9][A-Za-z0-9]*)*$/,
  camelCase: /^[a-z][a-zA-Z0-9]*$/
};

export function styleOf(name) {
  if (STYLE.snake_case.test(name) && STYLE.camelCase.test(name)) return 'either'; // one lowercase word fits both
  if (STYLE.snake_case.test(name)) return 'snake_case';
  if (STYLE.camelCase.test(name)) return 'camelCase';
  if (STYLE['Title Case'].test(name)) return 'Title Case';
  return 'mixed';
}

export function toStyle(name, style) {
  const t = words(name);
  if (!t.length) return name;
  if (style === 'Title Case') return t.map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
  if (style === 'camelCase') return t[0] + t.slice(1).map((w) => w[0].toUpperCase() + w.slice(1)).join('');
  return t.join('_');
}

const fits = (name, style) => {
  const s = styleOf(name);
  if (s === 'either') return style === 'snake_case' || style === 'camelCase';
  return s === style;
};

export function effectiveStyle(events, chosen) {
  if (chosen !== 'Not set') return { style: chosen, inferred: false };
  const count = {};
  events.forEach((e) => {
    const s = styleOf(e.name);
    if (s === 'either') { count.snake_case = (count.snake_case || 0) + 1; count.camelCase = (count.camelCase || 0) + 1; } else count[s] = (count[s] || 0) + 1;
  });
  const best = Object.entries(count).filter(([k]) => k !== 'mixed').sort((a, b) => b[1] - a[1])[0];
  return { style: best ? best[0] : 'snake_case', inferred: true };
}

/* ---------------- Word lists ---------------- */

const GENERIC = new Set(['clicked', 'button', 'event', 'action', 'track', 'tracked', 'interaction', 'page', 'viewed', 'screen', 'submitted', 'test', 'misc', 'other', 'cta', 'element', 'link', 'generic', 'custom', 'form', 'item']);
const LOCATOR = /^(page|path|url|screen|page_?name|screen_?name|page_?location|page_?path|page_?title|button_?(id|name)|element_?(id|name)|cta_?(id|name)|target|location)$/i;

const PII_TOKENS = new Set(['email', 'phone', 'mobile', 'telephone', 'address', 'street', 'postcode', 'zip', 'zipcode', 'ip', 'dob', 'birthday', 'birthdate', 'password', 'passport', 'dni', 'nie', 'ssn', 'iban', 'surname', 'firstname', 'lastname', 'fullname', 'username']);
const PII_EXACT = /^(name|full_?name|first_?name|last_?name|user_?name|customer_?name|guest_?name|client_?name|contact_?name|card_?number|account_?number|national_?id|tax_?id)$/i;

export function piiReason(prop) {
  const t = joined(words(prop));
  if (PII_EXACT.test(prop.replace(/\s+/g, '_'))) return 'a person\'s name or account number';
  if (t.includes('hashed') || t.includes('hash')) return null;
  const hit = t.find((w) => PII_TOKENS.has(w));
  if (!hit) return null;
  return {
    email: 'an email address', phone: 'a phone number', mobile: 'a phone number', telephone: 'a phone number', address: 'an address',
    street: 'an address', postcode: 'an address', zip: 'an address', zipcode: 'an address', ip: 'an IP address', dob: 'a date of birth',
    birthday: 'a date of birth', birthdate: 'a date of birth', password: 'a password', passport: 'an ID number', dni: 'an ID number',
    nie: 'an ID number', ssn: 'an ID number', iban: 'bank details', surname: 'a person\'s name', firstname: 'a person\'s name',
    lastname: 'a person\'s name', fullname: 'a person\'s name', username: 'a person\'s name'
  }[hit];
}

const REASON_PROP = /(reason|error|code|message|cause|decline|status)/i;
const SOURCE_PROP = /(utm|source|channel|referr|campaign|medium|acquisition)/i;

const GA4_RESERVED = new Set(['ad_activeview', 'ad_click', 'ad_exposure', 'ad_query', 'ad_reward', 'adunit_exposure', 'app_clear_data', 'app_exception', 'app_install', 'app_remove', 'app_store_refund', 'app_update', 'app_upgrade', 'dynamic_link_app_open', 'dynamic_link_app_update', 'dynamic_link_first_open', 'error', 'first_open', 'first_visit', 'in_app_purchase', 'notification_dismiss', 'notification_foreground', 'notification_open', 'notification_receive', 'os_update', 'session_start', 'user_engagement']);

/* ---------------- Plan rules (no model needed) ---------------- */

export function planFindings(form, events) {
  const out = [];
  const add = (f) => out.push(f);
  const { style, inferred } = effectiveStyle(events, form.convention);
  const allProps = events.flatMap((e) => e.props);
  const keyed = (t) => tokensOf(t);

  // P1 personal data
  const pii = [];
  events.forEach((e) => e.props.forEach((p) => { const r = piiReason(p); if (r) pii.push({ event: e.name, prop: p, why: r }); }));
  if (pii.length) {
    add({
      rule: 'P1', sev: 0, title: `${pii.length === 1 ? 'One property looks' : `${pii.length} properties look`} like personal data`,
      detail: 'Analytics tools are a poor place for personal data under GDPR. Send an internal user ID and keep the rest in your own database, or hash it before it leaves the app.',
      items: pii.map((x) => `${x.event} · ${x.prop} (${x.why})`), events: [...new Set(pii.map((x) => x.event))],
      fix: pii.map((x) => ({ event: x.event, action: 'remove-prop', prop: x.prop }))
    });
  }

  // GA4 limits
  if (form.tool === 'GA4') {
    const long = [];
    events.forEach((e) => {
      if (e.name.length > 40) long.push(`${e.name} (${e.name.length} characters)`);
      e.props.forEach((p) => p.length > 40 && long.push(`${e.name} · ${p} (${p.length} characters)`));
    });
    const longEvents = events.filter((e) => e.name.length > 40).map((e) => e.name);
    if (long.length) add({ rule: 'G1', sev: 0, title: 'Names over GA4\'s 40-character limit', detail: 'GA4 limits event and parameter names to 40 characters, so these will not be collected as written. Shorten them.', items: long, events: longEvents, fix: longEvents.map((n) => ({ event: n, action: 'shorten' })) });
    const many = events.filter((e) => e.props.length > 25);
    if (many.length) add({ rule: 'G2', sev: 0, title: 'More than 25 properties on one event', detail: 'GA4 accepts up to 25 parameters per event. Move the rest to user properties or split the event.', items: many.map((e) => `${e.name} (${e.props.length})`), events: many.map((e) => e.name) });
    const bad = events.filter((e) => GA4_RESERVED.has(e.name.toLowerCase()) || /^(firebase_|google_|ga_)/i.test(e.name) || !/^[A-Za-z][A-Za-z0-9_]*$/.test(e.name));
    if (bad.length) add({ rule: 'G3', sev: 0, title: 'Names GA4 will not accept as custom events', detail: 'GA4 reserves some names and prefixes, and custom event names can only use letters, numbers and underscores, starting with a letter.', items: bad.map((e) => e.name), events: bad.map((e) => e.name) });
  }

  // F1 / F2 failure events
  const failures = events.filter((e) => keyed(e.name).includes('failed'));
  const starts = events.filter((e) => { const t = keyed(e.name); return t.includes('started') || t.includes('submitted'); });
  if (FAILURE_FLOWS.includes(form.flow) && starts.length && !failures.length) {
    add({ rule: 'F1', sev: 1, title: 'You will see where people drop, not why', detail: 'The plan has start and submit events but nothing fires when something goes wrong. Add a failure event with a reason property next to each form or payment step.', items: starts.map((e) => `${e.name} has no failure partner`), events: starts.map((e) => e.name) });
  }
  const noReason = failures.filter((e) => !e.props.some((p) => REASON_PROP.test(p)));
  if (noReason.length) {
    add({ rule: 'F2', sev: 1, title: 'Failure events with no reason', detail: 'A count of failures without a reason cannot tell a declined card from a timeout. Add a reason or error code property.', items: noReason.map((e) => e.name), events: noReason.map((e) => e.name), fix: noReason.map((e) => ({ event: e.name, action: 'add-prop', prop: toStyle('failure_reason', style) })) });
  }

  // I1 / I2 identity
  if (form.identity === 'Not sure') {
    add({ rule: 'I1', sev: 1, title: 'Before and after sign-up may not join up', detail: 'Ask engineering when the tool\'s identify call runs. Until you know, any question that starts before sign-up and ends after it may count people twice.', items: ['Identity: not sure'], events: [] });
  }
  if (form.identity === 'Anonymous, then identified') {
    const marker = events.find((e) => {
      const t = keyed(e.name);
      return (t.some((w) => ['signup', 'login', 'account', 'user'].includes(w)) && t.some((w) => ['completed', 'created', 'identified', 'login'].includes(w))) || t.includes('identified');
    });
    if (!marker) add({ rule: 'I2', sev: 1, title: 'Nothing marks when a visitor becomes a user', detail: 'Visitors start anonymous, but no event like signup_completed or account_created fires when they are identified. Add one, and fire the identify call with it.', items: ['No sign-up completed, account created or login event'], events: [], fix: [{ action: 'add-event', event: toStyle('signup_completed', style), props: [toStyle('method', style)], trigger: 'Account is created and the user is identified', note: 'Marks when a visitor becomes a known user (I2)' }] });
  }

  // A1 acquisition source
  if (SOURCE_FLOWS.includes(form.flow) && events.length && !allProps.some((p) => SOURCE_PROP.test(p))) {
    add({ rule: 'A1', sev: 1, title: 'No way to split by where people came from', detail: 'No event carries a source, UTM, campaign or referrer property, so drop-off cannot be compared by channel. Add them to the first event in the flow.', items: [`${events[0].name} is the first event`], events: [events[0].name], fix: [{ event: events[0].name, action: 'add-prop', prop: toStyle('utm_source', style) }, { event: events[0].name, action: 'add-prop', prop: toStyle('utm_campaign', style) }] });
  }

  // D1 near-duplicates, N4 exact duplicates
  const groups = {};
  events.forEach((e) => { const k = meaningKey(e.name); (groups[k] = groups[k] || []).push(e); });
  const dupes = Object.values(groups).filter((g) => new Set(g.map((e) => e.name)).size > 1);
  if (dupes.length) {
    add({ rule: 'D1', sev: 1, title: `${dupes.length === 1 ? 'Two names' : `${dupes.length} sets of names`} for the same thing`, detail: 'Each event below has a twin that means the same thing. Pick one name and fire it from both places, with a property for where it came from, or the count is split.', items: dupes.map((g) => [...new Set(g.map((e) => e.name))].join(' = ')), events: dupes.flatMap((g) => g.map((e) => e.name)), fix: dupes.flatMap((g) => { const names = [...new Set(g.map((e) => e.name))]; const keep = names.find((n) => fits(n, style)) || names[0]; return names.filter((n) => n !== keep).map((n) => ({ event: n, action: 'merge', into: keep })); }) });
  }
  const exact = Object.values(groups).flatMap((g) => { const c = {}; g.forEach((e) => (c[e.name] = (c[e.name] || 0) + 1)); return Object.entries(c).filter(([, n]) => n > 1).map(([n, k]) => `${n} (${k} times)`); });
  if (exact.length) add({ rule: 'N4', sev: 2, title: 'Listed more than once', detail: 'Merge the rows so the properties and trigger are written in one place.', items: exact, events: exact.map((x) => x.replace(/ \(.*$/, '')) });

  // N1 naming
  const offName = events.filter((e) => !fits(e.name, style));
  const offProps = [];
  const propStyle = style === 'Title Case' ? null : style; // Title Case plans often keep properties in any case
  if (propStyle) events.forEach((e) => e.props.forEach((p) => !fits(p, propStyle) && offProps.push({ event: e.name, prop: p })));
  if (offName.length || offProps.length) {
    add({
      rule: 'N1', sev: 2, title: `Names that break ${inferred ? 'the plan\'s own style' : 'your convention'} (${style})`,
      detail: inferred ? `No convention was set, so the plan's majority style, ${style}, is used.` : 'Most tools treat differently cased names as different events. Rename before anything ships.',
      items: [...offName.map((e) => `${e.name} → ${toStyle(e.name, style)}`), ...offProps.map((x) => `${x.event} · ${x.prop} → ${toStyle(x.prop, propStyle)}`)],
      events: offName.map((e) => e.name),
      fix: [...offName.map((e) => ({ event: e.name, action: 'rename', to: toStyle(e.name, style) })), ...offProps.map((x) => ({ event: x.event, action: 'rename-prop', prop: x.prop, to: toStyle(x.prop, propStyle) }))]
    });
  }

  // N2 vague
  const vague = events.filter((e) => {
    const t = keyed(e.name);
    if (!t.every((w) => GENERIC.has(w))) return false;
    return !e.props.some((p) => LOCATOR.test(p.replace(/\s+/g, '_')));
  });
  if (vague.length) add({ rule: 'N2', sev: 2, title: 'Too vague to answer anything', detail: 'Nothing in the name or properties says which button or page this is. Name the thing, as in plan_selected, or add a property that does.', items: vague.map((e) => e.name), events: vague.map((e) => e.name) });

  // N3 trigger
  const noTrigger = events.filter((e) => e.trigger.length < 6);
  if (noTrigger.length) add({ rule: 'N3', sev: 2, title: 'No description of when it fires', detail: 'Write one line per event saying the exact moment it fires, for example on page load or when the server confirms. Two engineers will otherwise build it two ways.', items: noTrigger.map((e) => e.name), events: noTrigger.map((e) => e.name) });

  return { findings: out, style, inferred };
}

/* ---------------- Reading the model ---------------- */

const STATUS = { yes: 2, partly: 1, partial: 1, no: 0 };
const listOf = (s) => String(s || '').split(',').map((x) => x.trim()).filter((x) => x && !/^none$/i.test(x));

export function parseModel(text) {
  const out = { summary: '', steps: [], questions: [], adds: [], props: [], bad: 0 };
  String(text || '').split(/\r?\n/).forEach((raw) => {
    const line = raw.trim().replace(/^[-*]\s*/, '');
    if (!line.includes('|')) return;
    const c = line.split('|').map((x) => x.trim());
    const tag = c[0].toUpperCase();
    if (tag === 'SUMMARY' && c[1]) out.summary = c[1];
    else if (tag === 'STEP' && c.length >= 3) out.steps.push({ n: parseInt(c[1], 10), events: listOf(c[2]), note: c[3] || '' });
    else if (tag === 'Q' && c.length >= 4) out.questions.push({ n: parseInt(c[1], 10), status: STATUS[c[2].toLowerCase()] ?? 0, events: listOf(c[3]), needs: listOf(c[4]), missing: c[5] || '' });
    else if (tag === 'ADD' && c.length >= 3) out.adds.push({ name: c[1], props: listOf(c[2]), trigger: c[3] || '', refs: c[4] || '' });
    else if (tag === 'PROP' && c.length >= 3) out.props.push({ event: c[1], prop: c[2], why: c[3] || '', refs: c[4] || '' });
    else out.bad++;
  });
  return out;
}

const lines = (s) => String(s || '').split(/\r?\n/).map((x) => x.replace(/^\s*(\d+[.)]|[-*•])\s*/, '').trim()).filter(Boolean);
export const questionsOf = (form) => lines(form.questions).slice(0, 8);
export const stepsOf = (form) => lines(form.steps).slice(0, 10);

function findEvent(events, name) {
  return events.find((e) => e.name === name) || events.find((e) => e.name.toLowerCase() === String(name).toLowerCase());
}

// Checks the model's map against the plan. R1: unknown events are dropped. R2: needed properties
// must be on a cited event. R3: the final status is the lower of the model's and the check's.
export function checkModel(form, events, m, style) {
  const dropped = [];
  const qs = questionsOf(form).map((text, i) => {
    const r = m.questions.find((q) => q.n === i + 1);
    if (!r) return { n: i + 1, text, mapped: false, status: null, events: [], needs: [], missing: '' };
    const found = [];
    r.events.forEach((name) => { const e = findEvent(events, name); if (e) found.push(e); else dropped.push({ where: `Q${i + 1}`, name }); });
    const needs = r.needs.map((p) => ({ prop: p, on: found.find((e) => e.props.some((x) => x.toLowerCase() === p.toLowerCase()))?.name || null }));
    let check = 2;
    if (!found.length) check = 0;
    else if (found.length < r.events.length || needs.some((x) => !x.on)) check = 1;
    const status = Math.min(r.status, check);
    return { n: i + 1, text, mapped: true, status, modelStatus: r.status, lowered: status < r.status, events: found.map((e) => e.name), needs, missing: r.missing };
  });
  const steps = stepsOf(form).map((text, i) => {
    const r = m.steps.find((s) => s.n === i + 1);
    if (!r) return { n: i + 1, text, mapped: false, events: [], note: '' };
    const found = [];
    r.events.forEach((name) => { const e = findEvent(events, name); if (e) found.push(e.name); else dropped.push({ where: `Step ${i + 1}`, name }); });
    return { n: i + 1, text, mapped: true, events: found, note: r.note };
  });
  const existing = new Map(events.map((e) => [meaningKey(e.name), e.name]));
  const adds = [];
  const skipped = [];
  m.adds.forEach((a) => {
    const name = fits(a.name, style) ? a.name : toStyle(a.name, style);
    const twin = existing.get(meaningKey(name));
    if (twin) { skipped.push({ name: a.name, twin }); return; }
    if (adds.some((x) => meaningKey(x.name) === meaningKey(name))) return;
    adds.push({ ...a, name, renamed: name !== a.name, props: a.props.filter((p) => !piiReason(p)).map((p) => (style === 'Title Case' || fits(p, style) ? p : toStyle(p, style))) });
  });
  const props = [];
  m.props.forEach((p) => {
    const e = findEvent(events, p.event);
    if (!e) { dropped.push({ where: 'Property', name: p.event }); return; }
    if (piiReason(p.prop)) return;
    const prop = style === 'Title Case' || fits(p.prop, style) ? p.prop : toStyle(p.prop, style);
    if (e.props.some((x) => x.toLowerCase() === prop.toLowerCase())) return;
    if (props.some((x) => x.event === e.name && x.prop === prop)) return;
    props.push({ ...p, prop, event: e.name });
  });
  return { qs, steps, adds, props, dropped, skipped };
}

/* ---------------- Verdict ---------------- */

export function audit(form, modelText) {
  const events = parsePlan(form.plan);
  const { findings, style, inferred } = planFindings(form, events);
  const m = parseModel(modelText);
  const hasModel = !!modelText && (m.questions.length > 0 || m.steps.length > 0);
  const checked = hasModel ? checkModel(form, events, m, style) : null;
  const all = [...findings];

  if (checked) {
    const noStep = checked.steps.filter((s) => s.mapped && !s.events.length);
    if (noStep.length) {
      all.unshift({ rule: 'S1', sev: 0, title: `${noStep.length === 1 ? 'A funnel step has' : `${noStep.length} funnel steps have`} no event`, detail: 'The funnel breaks at these steps: everyone who passes them is invisible. The suggested events below cover them.', items: noStep.map((s) => `Step ${s.n}: ${s.text}`), events: [] });
    }
    const noQ = checked.qs.filter((q) => q.mapped && q.status === 0);
    if (noQ.length) all.unshift({ rule: 'Q1', sev: 0, title: `${noQ.length === 1 ? 'A question has' : `${noQ.length} questions have`} nothing to answer from`, detail: 'No event in the plan answers these. See the suggested events below.', items: noQ.map((q) => `Q${q.n}: ${q.text}`), events: [] });
    const partQ = checked.qs.filter((q) => q.mapped && q.status === 1);
    if (partQ.length) {
      all.push({ rule: 'Q2', sev: 1, title: `${partQ.length === 1 ? 'A question is' : `${partQ.length} questions are`} only partly answerable`, detail: 'There are events behind these, but something is missing, usually a property.', items: partQ.map((q) => `Q${q.n}: ${q.missing || q.text}`), events: partQ.flatMap((q) => q.events) });
    }
  }

  if (!events.length) all.length = 0;
  all.sort((a, b) => a.sev - b.sev);
  const by = [0, 1, 2].map((s) => all.filter((f) => f.sev === s).length);
  const verdict = !events.length ? 3 : by[0] ? 2 : by[1] ? 1 : 0;
  const qs = checked?.qs || questionsOf(form).map((text, i) => ({ n: i + 1, text, mapped: false, status: null, events: [], needs: [] }));
  const steps = checked?.steps || stepsOf(form).map((text, i) => ({ n: i + 1, text, mapped: false, events: [] }));
  const flagged = {};
  all.forEach((f) => (f.events || []).forEach((n) => { (flagged[n] = flagged[n] || []).push(f.rule); }));
  return { events, findings: all, by, verdict, style, inferred, hasModel, m, checked, qs, steps, flagged };
}

/* ---------------- Exports ---------------- */

export function patchedRows(a) {
  const rows = a.events.map((e) => {
    let name = e.name;
    let props = [...e.props];
    const notes = [];
    let status = 'Keep';
    a.findings.forEach((f) => (f.fix || []).forEach((x) => {
      if (x.event !== e.name) return;
      if (x.action === 'rename') { name = x.to; status = 'Rename'; notes.push(`Was ${e.name} (${f.rule})`); }
      if (x.action === 'shorten') { status = 'Rename'; notes.push(`Shorten to 40 characters or fewer (${f.rule})`); }
      if (x.action === 'merge') { status = 'Merge'; notes.push(`Fire ${x.into} instead (${f.rule})`); }
      if (x.action === 'remove-prop') { props = props.filter((p) => p !== x.prop); status = status === 'Keep' ? 'Change' : status; notes.push(`Removed ${x.prop}, personal data (${f.rule})`); }
      if (x.action === 'rename-prop') { props = props.map((p) => (p === x.prop ? x.to : p)); status = status === 'Keep' ? 'Change' : status; notes.push(`${x.prop} renamed (${f.rule})`); }
      if (x.action === 'add-prop' && !props.includes(x.prop)) { props.push(x.prop); status = status === 'Keep' ? 'Change' : status; notes.push(`Added ${x.prop} (${f.rule})`); }
    }));
    (a.checked?.props || []).forEach((p) => {
      if (p.event === e.name && !props.includes(p.prop)) { props.push(p.prop); status = status === 'Keep' ? 'Change' : status; notes.push(`Added ${p.prop} for ${p.refs || 'a question'}`); }
    });
    if ((a.flagged[e.name] || []).includes('N3') && status === 'Keep') status = 'Describe';
    return { status, name, props, trigger: e.trigger || 'To describe', note: notes.join('; ') };
  });
  const adds = [];
  a.findings.forEach((f) => (f.fix || []).forEach((x) => x.action === 'add-event' && adds.push({ status: 'Add', name: x.event, props: x.props, trigger: x.trigger, note: x.note || `For ${f.rule}` })));
  (a.checked?.adds || []).forEach((x) => {
    const twin = adds.find((y) => meaningKey(y.name) === meaningKey(x.name));
    if (twin) {
      twin.props = [...new Set([...twin.props, ...x.props])];
      if (x.refs) twin.note = `${twin.note}; unblocks ${x.refs}`;
    } else adds.push({ status: 'Add', name: x.name, props: x.props, trigger: x.trigger, note: x.refs ? `Unblocks ${x.refs}` : '' });
  });
  return [...rows, ...adds];
}

const csvCell = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
export function toCsv(rows) {
  return ['status,event,properties,when it fires,note', ...rows.map((r) => [r.status, r.name, r.props.join(', '), r.trigger, r.note].map(csvCell).join(','))].join('\n');
}

export function toMarkdown(form, a, now) {
  const V = VERDICTS[a.verdict];
  const out = [`# Tracking plan audit: ${form.product || 'untitled'}`, '', `${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · ${form.flow} · ${form.tool}`, '', `**Verdict: ${V.label}.** ${V.line}`, ''];
  if (a.hasModel) {
    out.push('## Questions', '');
    a.qs.forEach((q) => out.push(`- **Q${q.n}** ${q.text} · ${['No', 'Partly', 'Yes'][q.status ?? 0]}${q.events.length ? ` · ${q.events.join(', ')}` : ''}${q.status < 2 && q.missing ? ` · Missing: ${q.missing}` : ''}`));
    out.push('');
  }
  SEVERITY.forEach((s) => {
    const fs = a.findings.filter((f) => f.sev === s.id);
    if (!fs.length) return;
    out.push(`## ${s.label}`, '');
    fs.forEach((f) => { out.push(`- **${f.rule} ${f.title}.** ${f.detail}`); f.items.forEach((i) => out.push(`  - ${i}`)); });
    out.push('');
  });
  const adds = patchedRows(a).filter((r) => r.status === 'Add');
  if (adds.length) {
    out.push('## Events to add', '', '| Event | Properties | When it fires |', '| --- | --- | --- |');
    adds.forEach((r) => out.push(`| ${r.name} | ${r.props.join(', ')} | ${r.trigger} |`));
    out.push('');
  }
  out.push('Made with Are We Tracking That? Printed rules decide the verdict; a model only maps questions to events.');
  return out.join('\n');
}
