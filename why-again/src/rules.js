// Why Again? rules.
// A model groups tickets by cause, quotes one phrase per group and answers four yes/no questions.
// Everything else happens here, with fixed rules: which ticket IDs are real, whether the quote is
// really in a ticket, how many customers came back, which fix lane a group goes in, how sure we
// are, the ranking, the verdict and the monthly estimate. Same tickets and same model reply,
// same answer every time.

export const PRODUCT_TYPES = ['B2B SaaS', 'API or developer product', 'Marketplace', 'Consumer app'];
export const CHANNELS = ['Email', 'Chat', 'Phone', 'Mixed'];
export const WINDOWS = ['Last 7 days', 'Last 30 days', 'Last 90 days'];

export const LANES = {
  product: { id: 'product', label: 'Product fix', short: 'Product', desc: 'Something in the product is broken or unclear. Engineering or design changes it.' },
  process: { id: 'process', label: 'Process fix', short: 'Process', desc: 'A person, policy or manual step on your side causes or delays it.' },
  help: { id: 'help', label: 'Help content', short: 'Help', desc: 'The product works. A clear article or in-product message would have answered it.' },
  look: { id: 'look', label: 'Needs a look', short: 'Look', desc: 'None of the four signals fired. Read these tickets yourself before routing.' }
};

export const CONF = [
  { label: 'Low', tone: 'bad' },
  { label: 'Medium', tone: 'warn' },
  { label: 'High', tone: 'ok' }
];

export const VERDICTS = {
  thin: { label: 'Too few tickets', tone: 'na', line: 'Paste at least 8 tickets. Below that, a pattern and a coincidence look the same.' },
  none: { label: 'Not grouped yet', tone: 'na', line: 'Your tickets are read. Group them to see the patterns.' },
  high: { label: 'Mostly repeat work', tone: 'bad', line: 'Half or more of these tickets come from causes you can fix once.' },
  mid: { label: 'Some repeat work', tone: 'warn', line: 'A quarter to half of these tickets come from causes you can fix once.' },
  low: { label: 'Mostly one-offs', tone: 'ok', line: 'Under a quarter of these tickets share a fixable cause.' }
};

export const QUESTIONS = [
  { key: 'a', name: 'Broke', text: 'Did the product fail or do something wrong: an error, a wrong figure, missing data, a feature not working?' },
  { key: 'b', name: 'Unclear', text: 'Did the product work as built, but the customer could not tell how to do something or what had happened?' },
  { key: 'c', name: 'Our side', text: 'Did a person, policy or manual step on your side cause or delay it?' },
  { key: 'd', name: 'Answerable', text: 'Would a clear help article or in-product message have answered it without a contact?' }
];

export const RULES = [
  { id: 'T1', group: 'Reading tickets', text: 'One ticket per line. Fields split on | or a tab: ID | customer | date | message. With two fields, ID | message. With one, the whole line is the message and gets an ID like T1.' },
  { id: 'T2', group: 'Reading tickets', text: 'A first line that starts with "id" or "ticket" is treated as a header and skipped. Repeated IDs get a suffix, so no ticket is lost.' },
  { id: 'T3', group: 'Reading tickets', text: 'A customer who appears on two or more tickets came back. Customer names are compared without case or extra spaces.' },
  { id: 'K1', group: 'Checking the model', text: 'A ticket ID the model names that is not in your list is dropped.' },
  { id: 'K2', group: 'Checking the model', text: 'A ticket placed in two groups stays in the first group only.' },
  { id: 'K3', group: 'Checking the model', text: 'The quote must appear in one of the group\'s own tickets, ignoring case and spacing. If it does not, the quote is dropped and the group loses a confidence point.' },
  { id: 'K4', group: 'Checking the model', text: 'A group left with fewer than two tickets is not a pattern. Its ticket moves to one-offs.' },
  { id: 'L1', group: 'Choosing the lane', text: 'Broke is yes: Product fix.' },
  { id: 'L2', group: 'Choosing the lane', text: 'Otherwise, Our side is yes: Process fix.' },
  { id: 'L3', group: 'Choosing the lane', text: 'Otherwise, Unclear and Answerable are both yes: Help content.' },
  { id: 'L4', group: 'Choosing the lane', text: 'Otherwise, Unclear is yes: Product fix, since the screen or wording has to change.' },
  { id: 'L5', group: 'Choosing the lane', text: 'Otherwise, Answerable is yes: Help content.' },
  { id: 'L6', group: 'Choosing the lane', text: 'Otherwise: Needs a look. This group counts as one-off work in the verdict.' },
  { id: 'C1', group: 'Confidence and order', text: 'One point each for: 4 or more tickets, 3 or more customers, at least one customer who came back about this cause, a quote found in the tickets. 4 points is High, 2 or 3 is Medium, 0 or 1 is Low.' },
  { id: 'C2', group: 'Confidence and order', text: 'Groups are ranked by tickets plus twice the customers who came back about that cause. A customer writing again about the same thing counts double, because that contact should never have been needed.' },
  { id: 'V1', group: 'Verdict and estimate', text: 'Fixable share is the tickets in groups with a lane other than Needs a look, divided by all tickets. 50% or more is Mostly repeat work, 25% to 49% is Some repeat work, under 25% is Mostly one-offs. Under 8 tickets, no verdict.' },
  { id: 'V2', group: 'Verdict and estimate', text: 'If you give a monthly ticket volume, contacts you could stop per month run from half to all of fixable share times that volume. Half allows for fixes that only partly work and a sample that is not typical. Cost uses your cost per contact.' }
];

/* ---------- Text helpers ---------- */

const norm = (s) => String(s || '').toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
const cleanQuote = (s) => String(s || '').trim().replace(/^["'“‘]+|["'”’]+$/g, '').replace(/[.,;:!?]+$/, '').trim();
const yes = (s) => /^(y|yes|true|si|sí)$/i.test(String(s || '').trim());

/* ---------- Tickets ---------- */

export function parseTickets(raw) {
  const lines = String(raw || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const tickets = [];
  const seen = new Map();
  lines.forEach((line, i) => {
    const parts = (line.includes('|') ? line.split('|') : line.includes('\t') ? line.split('\t') : [line]).map((x) => x.trim());
    if (i === 0 && parts.length > 1 && /^(id|ticket)/i.test(parts[0])) return;
    let id, customer = '', date = '', text;
    if (parts.length >= 4) [id, customer, date, text] = [parts[0], parts[1], parts[2], parts.slice(3).join(' | ')];
    else if (parts.length === 3) [id, customer, text] = parts;
    else if (parts.length === 2) [id, text] = parts;
    else text = parts[0];
    if (!text) return;
    id = id || `T${tickets.length + 1}`;
    const base = id;
    const n = (seen.get(base) || 0) + 1;
    seen.set(base, n);
    if (n > 1) id = `${base}-${n}`;
    tickets.push({ id, customer, cust: norm(customer), date, text });
  });
  return tickets;
}

function customerStats(tickets) {
  const counts = new Map();
  tickets.forEach((t) => t.cust && counts.set(t.cust, (counts.get(t.cust) || 0) + 1));
  const withCustomer = tickets.filter((t) => t.cust).length;
  const returning = [...counts.values()].filter((c) => c > 1).length;
  return { customers: counts.size, withCustomer, returning };
}

/* ---------- Model reply ---------- */

export function parseModel(text) {
  const out = { summary: '', groups: new Map(), order: [] };
  const get = (n) => {
    if (!out.groups.has(n)) {
      out.groups.set(n, { n, name: '', ids: [], quote: '', ans: null, fix: '', owner: '', proof: '' });
      out.order.push(n);
    }
    return out.groups.get(n);
  };
  String(text || '').split(/\r?\n/).forEach((raw) => {
    const line = raw.trim().replace(/^[-*•`>\s]+/, '').replace(/`+$/, '');
    if (!line.includes('|')) return;
    const f = line.split('|').map((x) => x.trim());
    const tag = f[0].toUpperCase();
    if (tag === 'SUMMARY' && f[1]) out.summary = f.slice(1).join(' ');
    const n = parseInt(f[1], 10);
    if (!Number.isFinite(n)) return;
    if (tag === 'GROUP' && f.length >= 5) {
      const g = get(n);
      g.name = f[2];
      g.ids = f[3].split(/[,\s]+/).map((x) => x.trim()).filter(Boolean);
      g.quote = cleanQuote(f[4]);
    } else if (tag === 'ANS' && f.length >= 6) {
      get(n).ans = { a: yes(f[2]), b: yes(f[3]), c: yes(f[4]), d: yes(f[5]) };
    } else if (tag === 'FIX' && f.length >= 5) {
      const g = get(n);
      g.fix = f[2];
      g.owner = f[3];
      g.proof = f[4];
    }
  });
  out.list = out.order.map((n) => out.groups.get(n)).filter((g) => g.name && g.ids.length);
  return out;
}

export function laneFor(ans) {
  if (!ans) return { lane: 'look', rule: 'L6' };
  if (ans.a) return { lane: 'product', rule: 'L1' };
  if (ans.c) return { lane: 'process', rule: 'L2' };
  if (ans.b && ans.d) return { lane: 'help', rule: 'L3' };
  if (ans.b) return { lane: 'product', rule: 'L4' };
  if (ans.d) return { lane: 'help', rule: 'L5' };
  return { lane: 'look', rule: 'L6' };
}

/* ---------- The audit ---------- */

export function analyse(form, modelText) {
  const tickets = parseTickets(form.tickets);
  const byId = new Map(tickets.map((t) => [t.id.toLowerCase(), t]));
  const stats = customerStats(tickets);
  const parsed = parseModel(modelText);
  const hasModel = parsed.list.length > 0;
  const checks = [];
  const used = new Set();
  const groups = [];
  const demoted = [];

  parsed.list.forEach((g) => {
    const own = [];
    g.ids.forEach((raw) => {
      const t = byId.get(raw.toLowerCase());
      if (!t) return checks.push({ rule: 'K1', text: `${raw} is not in your tickets, so it was dropped from "${g.name}".` });
      if (used.has(t.id)) return checks.push({ rule: 'K2', text: `${t.id} was also placed in "${g.name}". It stays in its first group.` });
      used.add(t.id);
      own.push(t);
    });
    if (own.length < 2) {
      own.forEach((t) => used.delete(t.id));
      demoted.push(g.name);
      return checks.push({ rule: 'K4', text: `"${g.name}" was left with ${own.length} ticket${own.length === 1 ? '' : 's'}, which is not a pattern.` });
    }
    const q = norm(g.quote);
    const source = q.length >= 6 ? own.find((t) => norm(t.text).includes(q)) : null;
    if (g.quote && !source) checks.push({ rule: 'K3', text: `The quote for "${g.name}" is not in its tickets, so it was dropped.` });
    if (!g.quote) checks.push({ rule: 'K3', text: `"${g.name}" came back without a quote.` });

    const perCust = new Map();
    own.forEach((t) => t.cust && perCust.set(t.cust, (perCust.get(t.cust) || 0) + 1));
    const cameBack = [...perCust.values()].filter((c) => c > 1).length;
    const repeatContacts = [...perCust.values()].reduce((s, c) => s + Math.max(0, c - 1), 0);
    const { lane, rule } = laneFor(g.ans);
    if (!g.ans) checks.push({ rule: 'L6', text: `"${g.name}" came back without its four answers, so it needs a look.` });

    const points = [own.length >= 4, perCust.size >= 3, cameBack >= 1, !!source];
    const pts = points.filter(Boolean).length;
    const conf = pts >= 4 ? 2 : pts >= 2 ? 1 : 0;

    groups.push({
      name: g.name, tickets: own, quote: source ? g.quote : '', quoteFrom: source?.id || '', fix: g.fix, owner: g.owner || 'Not named',
      proof: g.proof, ans: g.ans, lane, laneRule: rule, customers: perCust.size, cameBack, repeatContacts, points, conf,
      score: own.length + 2 * cameBack
    });
  });

  groups.sort((x, y) => y.score - x.score || y.tickets.length - x.tickets.length);
  groups.forEach((g, i) => (g.rank = i + 1));

  const oneOffs = tickets.filter((t) => !used.has(t.id));
  const fixable = groups.filter((g) => g.lane !== 'look').reduce((s, g) => s + g.tickets.length, 0);
  const share = tickets.length ? fixable / tickets.length : 0;
  const repeatContacts = groups.reduce((s, g) => s + g.repeatContacts, 0);

  let verdict = 'none';
  if (tickets.length < 8) verdict = 'thin';
  else if (hasModel) verdict = share >= 0.5 ? 'high' : share >= 0.25 ? 'mid' : 'low';

  const vol = Number(form.monthly) || 0;
  const cost = Number(form.cost) || 0;
  const estimate = vol > 0 && hasModel ? {
    low: Math.round(share * vol * 0.5), high: Math.round(share * vol),
    costLow: cost ? Math.round(share * vol * 0.5 * cost) : 0, costHigh: cost ? Math.round(share * vol * cost) : 0
  } : null;

  const byLane = Object.keys(LANES).reduce((o, k) => ({ ...o, [k]: groups.filter((g) => g.lane === k).reduce((s, g) => s + g.tickets.length, 0) }), {});

  return { tickets, stats, hasModel, summary: parsed.summary, groups, oneOffs, checks, demoted, fixable, share, repeatContacts, verdict, estimate, byLane };
}

/* ---------- Outputs ---------- */

export function handoffNote(form, g) {
  const lower = (x) => String(x || '').trim().replace(/\.$/, '').replace(/^./, (c) => c.toLowerCase());
  const owner = g.owner === 'Not named' ? 'team' : /team$/i.test(g.owner) ? g.owner : `${g.owner} team`;
  const period = String(form.window || 'this period').toLowerCase();
  const back = g.cameBack === 0 ? '' : g.cameBack === 1 ? ' One customer had to write in again about it.' : ` ${g.cameBack} of those customers had to write in again about it.`;
  const lines = [
    `Hi ${owner},`,
    '',
    `${g.tickets.length} support tickets from ${g.customers || 'several'} customer${g.customers === 1 ? '' : 's'} (${period}) came from one cause: ${lower(g.name)}.${back}`,
    g.quote ? `In their words: "${g.quote}" (${g.quoteFrom}).` : '',
    g.fix ? `What we think would stop these contacts: ${lower(g.fix)}.` : '',
    g.proof ? `How we would know it worked: ${lower(g.proof)} goes down.` : '',
    '',
    `Tickets: ${g.tickets.map((t) => t.id).join(', ')}`,
    'Could we agree an owner and a date for this?'
  ].filter((l) => l !== null);
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\n\n\n/g, '\n\n');
}

export function toMarkdown(form, r, now) {
  const V = VERDICTS[r.verdict];
  const pct = Math.round(r.share * 100);
  const out = [
    `# Why Again? ${form.product || 'Support tickets'}`,
    '',
    `${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · ${form.window} · ${form.channel} · ${r.tickets.length} tickets`,
    '',
    `**Verdict: ${V.label}.** ${pct}% of tickets come from causes you can fix once. ${r.repeatContacts} contacts were customers writing again about the same thing.`,
    ''
  ];
  if (r.estimate) out.push(`Contacts you could stop per month: ${r.estimate.low} to ${r.estimate.high}${r.estimate.costHigh ? ` (about €${r.estimate.costLow} to €${r.estimate.costHigh})` : ''}.`, '');
  if (r.summary) out.push(`> ${r.summary}`, '');
  out.push('## Patterns, ranked', '');
  r.groups.forEach((g) => {
    out.push(`### ${g.rank}. ${g.name}`, '',
      `- Lane: ${LANES[g.lane].label} (rule ${g.laneRule}) · Confidence: ${CONF[g.conf].label}`,
      `- ${g.tickets.length} tickets, ${g.customers} customers, ${g.cameBack} came back about it`,
      g.quote ? `- In their words: "${g.quote}" (${g.quoteFrom})` : '- Quote: none verified',
      `- Change: ${g.fix || 'not given'}`,
      `- Owner: ${g.owner}`,
      `- Proof it worked: ${g.proof || 'not given'}`,
      `- Tickets: ${g.tickets.map((t) => t.id).join(', ')}`, '');
  });
  if (r.oneOffs.length) out.push('## One-offs', '', ...r.oneOffs.map((t) => `- ${t.id}: ${t.text}`), '');
  if (r.checks.length) out.push('## Checks on the model', '', ...r.checks.map((c) => `- ${c.rule}: ${c.text}`), '');
  out.push('Made with Why Again?, a daily AI build by Prerna Kakkar. Groups come from a model; lanes, counts, confidence and the verdict come from printed rules.');
  return out.join('\n');
}

export function toCsv(r) {
  const esc = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
  const pattern = new Map();
  r.groups.forEach((g) => g.tickets.forEach((t) => pattern.set(t.id, g)));
  const rows = [['ticket_id', 'customer', 'date', 'pattern', 'lane', 'owner', 'message']];
  r.tickets.forEach((t) => {
    const g = pattern.get(t.id);
    rows.push([t.id, t.customer, t.date, g ? g.name : 'One-off', g ? LANES[g.lane].label : '', g ? g.owner : '', t.text]);
  });
  return rows.map((row) => row.map(esc).join(',')).join('\n');
}
