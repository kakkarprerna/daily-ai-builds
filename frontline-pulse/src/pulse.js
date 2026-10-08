// Frontline Pulse rules. Everything that decides routing lives here and is printed in How it works.
// The model only reads the pasted notes, groups them into signals and picks labels from fixed word lists.
// The quote check, account counts, value at stake, scores, lanes, owners and due dates are all worked
// out here, in the browser, so the same notes always give the same routing.

export const SOURCES = ['Sales call notes', 'Support tickets', 'Customer success notes', 'Field visit reports', 'Win and loss notes', 'Mixed'];
export const PERIODS = ['This week', 'Last 2 weeks', 'This month', 'This quarter'];

export const STAGES = ['Winning the deal', 'Getting started', 'Day-to-day use', 'Renewal or reorder'];
export const SEVERITIES = ['Annoyance', 'Slows down', 'Blocks'];
export const FIXES = ['Build', 'Fix', 'Train', 'Change process', 'Message', 'Price'];
export const WORKAROUNDS = ['None', 'Minutes', 'Hours'];
export const OWNERS = ['Product', 'Engineering', 'Enablement', 'Operations', 'Marketing', 'Revenue leadership', 'Customer success'];

export const STAGE_PTS = { 'Winning the deal': 3, 'Getting started': 2, 'Day-to-day use': 1, 'Renewal or reorder': 3 };
export const SEVERITY_PTS = { Annoyance: 1, 'Slows down': 2, Blocks: 3 };
export const DEFAULT_HOURS = { None: 0, Minutes: 0.25, Hours: 2 };

// Who a signal goes to, by the kind of fix it needs. The person can override any owner.
export const ROUTE = {
  Build: 'Product',
  Fix: 'Engineering',
  Train: 'Enablement',
  'Change process': 'Operations',
  Message: 'Marketing',
  Price: 'Revenue leadership'
};
// Fixes the owner can make without a roadmap slot.
export const FIELD_FIXES = ['Train', 'Change process', 'Message', 'Price'];

export const LANES = [
  { id: 'field', label: 'Fix in the field', due: 'This week', desc: 'The owner can change this without a roadmap slot' },
  { id: 'escalate', label: 'Escalate', due: 'Next roadmap review', desc: 'Needs building or fixing, and the evidence is strong' },
  { id: 'log', label: 'Log with evidence', due: 'Monthly review', desc: 'Needs building or fixing, not yet urgent' },
  { id: 'watch', label: 'Watch', due: 'Recheck next pulse', desc: 'One account so far, or too small to act on' }
];

export const RULES = [
  { id: 'M1', text: 'Every mention carries a quote. It is searched for in your notes, ignoring case, spacing and quote marks. A mention whose quote is not found does not count.' },
  { id: 'M2', text: 'Accounts are counted once per signal, however many times they come up.' },
  { id: 'V1', text: 'A value counts only if that figure appears in your notes as written.' },
  { id: 'V2', text: 'Values written per month are multiplied by 12, so everything is a yearly figure. Each account counts at its highest checked value.' },
  { id: 'V3', text: 'Totals count each account once across all signals, so one big account is not added up three times.' },
  { id: 'S1', text: 'Score = checked accounts × severity (Annoyance 1, Slows down 2, Blocks 3) × stage (Day-to-day use 1, Getting started 2, Winning the deal 3, Renewal or reorder 3).' },
  { id: 'L1', text: 'Fewer than 2 checked accounts goes to Watch, whatever the score. If it blocks a deal or a renewal with a checked value, it is flagged for one more call this week.' },
  { id: 'L2', text: 'Score under 6 goes to Watch.' },
  { id: 'L3', text: 'Train, Change process, Message and Price go to Fix in the field. The owner acts this week.' },
  { id: 'L4', text: 'Build and Fix with a score of 12 or more go to Escalate, for the next roadmap review.' },
  { id: 'L5', text: 'Build and Fix scoring 6 to under 12 go to Log with evidence, for the monthly review.' },
  { id: 'R1', text: 'Owner by fix: Build to Product, Fix to Engineering, Train to Enablement, Change process to Operations, Message to Marketing, Price to Revenue leadership.' },
  { id: 'T1', text: 'Workaround hours = checked mentions × hours per workaround (Minutes 0.25 h, Hours 2 h by default, editable).' }
];

const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[‘’`´]/g, "'")
    .replace(/[“”«»]/g, '"')
    .replace(/["']/g, '')
    .replace(/[^\p{L}\p{N}%€$£.,]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export function quoteFound(quote, source) {
  const q = norm(quote).replace(/[.,]+$/, '');
  if (q.length < 6) return false;
  return norm(source).includes(q);
}

const accKey = (a) => norm(a).replace(/[.,]/g, '');

// Reads a written value such as "€72k", "€1.2m", "48,000 euros" or "€1,850 a month".
// Returns the figure as written (for the V1 check) and a yearly number.
export function parseValue(raw) {
  const s = String(raw || '').trim();
  if (!s || /^(none|n\/a|not stated|unknown|-)$/i.test(s)) return null;
  const m = s.match(/(\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d+)?)\s*([kKmM])?/);
  if (!m) return null;
  let digits = m[1];
  let n;
  if (/^\d{1,3}([.,]\d{3})+$/.test(digits)) n = Number(digits.replace(/[.,]/g, ''));
  else n = Number(digits.replace(',', '.'));
  const unit = (m[2] || '').toLowerCase();
  if (unit === 'k') n *= 1000;
  if (unit === 'm') n *= 1000000;
  const monthly = /month|\/mo\b|per mes|al mes|monthly|a mes/i.test(s);
  return { token: m[0].trim(), yearly: monthly ? n * 12 : n, monthly };
}

export function valueFound(token, source) {
  const t = norm(token).replace(/[.,]+$/, '');
  if (!t) return false;
  const src = norm(source);
  if (src.includes(t)) return true;
  // Allow "72k" written in the notes as "72 k" or "€72k"
  return src.replace(/\s+/g, '').includes(t.replace(/\s+/g, ''));
}

function pick(list, raw, fallback) {
  const v = String(raw || '').trim().toLowerCase();
  const hit = list.find((x) => x.toLowerCase() === v);
  if (hit) return { value: hit, ok: true };
  const loose = list.find((x) => v && (x.toLowerCase().startsWith(v) || v.startsWith(x.toLowerCase())));
  if (loose) return { value: loose, ok: true };
  return { value: fallback, ok: !v };
}

// Reads the model's tagged lines. Anything off-list is mapped to a safe default and counted.
export function parsePulse(text) {
  const out = { summary: '', signals: [], gaps: [], offList: 0 };
  const mentions = [];
  String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim().replace(/^[-*]\s*/, ''))
    .filter(Boolean)
    .forEach((line) => {
      const f = line.split('|').map((x) => x.trim());
      const tag = f[0].toUpperCase();
      if (tag === 'SUMMARY') out.summary = f.slice(1).join(' ');
      else if (tag === 'SIGNAL' && f.length >= 10) {
        const stage = pick(STAGES, f[4], 'Day-to-day use');
        const sev = pick(SEVERITIES, f[5], 'Slows down');
        const fix = pick(FIXES, f[6], 'Fix');
        const wk = pick(WORKAROUNDS, f[7], 'None');
        if (!stage.ok || !sev.ok || !fix.ok || !wk.ok) out.offList += 1;
        out.signals.push({
          id: f[1].toUpperCase(), name: f[2], what: f[3], stage: stage.value, severity: sev.value, fix: fix.value,
          workaround: wk.value, ask: f[8], reply: f.slice(9).join(' '), owner: null, mentions: []
        });
      } else if (tag === 'MENTION' && f.length >= 5) {
        mentions.push({ signal: f[1].toUpperCase(), account: f[2], value: f[3], quote: f.slice(4).join(' ') });
      } else if (tag === 'GAP' && f[1]) out.gaps.push(f.slice(1).join(' '));
    });
  mentions.forEach((m) => {
    const s = out.signals.find((x) => x.id === m.signal);
    if (s) s.mentions.push(m);
  });
  return out;
}

export const eur = (n) => {
  if (!n) return '€0';
  if (n >= 1000000) return `€${Math.round(n / 100000) / 10}m`;
  if (n >= 10000) return `€${Math.round(n / 1000)}k`;
  return `€${Math.round(n).toLocaleString('en-GB')}`;
};

// Turns signals (possibly edited by the person) into a routed pulse.
export function buildPulse({ signals, source, hours = DEFAULT_HOURS }) {
  const rows = signals.map((s) => {
    const mentions = s.mentions.map((m) => {
      const found = quoteFound(m.quote, source);
      const v = parseValue(m.value);
      const vFound = v ? valueFound(v.token, source) : false;
      return { ...m, found, parsed: v, valueOk: !!(v && vFound && found) };
    });
    const ok = mentions.filter((m) => m.found);
    const byAcc = {};
    ok.forEach((m) => {
      const k = accKey(m.account);
      if (!k) return;
      const val = m.valueOk ? m.parsed.yearly : 0;
      byAcc[k] = byAcc[k] ? { ...byAcc[k], value: Math.max(byAcc[k].value, val) } : { name: m.account, value: val };
    });
    const accounts = Object.values(byAcc);
    const n = accounts.length;
    const sev = SEVERITY_PTS[s.severity] || 2;
    const stg = STAGE_PTS[s.stage] || 1;
    const score = n * sev * stg;
    const value = accounts.reduce((t, a) => t + a.value, 0);
    const owner = s.owner || ROUTE[s.fix] || 'Product';
    const hrs = ok.length * (hours[s.workaround] ?? DEFAULT_HOURS[s.workaround] ?? 0);

    let lane;
    let rule;
    let why;
    let flag = '';
    let move = '';
    if (n < 2) {
      lane = 'watch'; rule = 'L1';
      why = n === 0 ? 'No quote for this signal was found in the notes.' : 'Only one account has raised it so far.';
      move = 'One more account raising it moves this out of Watch.';
      if (n === 1 && s.severity === 'Blocks' && (s.stage === 'Winning the deal' || s.stage === 'Renewal or reorder') && value > 0) {
        flag = `It blocks ${eur(value)} on its own. Make one call this week to find out whether others feel it too.`;
      }
    } else if (score < 6) {
      lane = 'watch'; rule = 'L2';
      why = `Score ${score} is under 6.`;
      const need = Math.ceil(6 / (sev * stg));
      move = need > n ? `${need} accounts at this severity and stage would reach 6.` : 'A higher severity or a revenue stage would lift it.';
    } else if (FIELD_FIXES.includes(s.fix)) {
      lane = 'field'; rule = 'L3';
      why = `${s.fix} is something ${owner} can change without engineering.`;
    } else if (score >= 12) {
      lane = 'escalate'; rule = 'L4';
      why = `${s.fix} needs a roadmap slot, and a score of ${score} justifies asking for one.`;
    } else {
      lane = 'log'; rule = 'L5';
      why = `${s.fix} needs a roadmap slot. Score ${score} is real but not yet urgent.`;
      move = `${Math.ceil(12 / (sev * stg))} accounts at this severity and stage would escalate it.`;
    }
    const laneMeta = LANES.find((l) => l.id === lane);
    return { ...s, mentions, accounts, n, sevPts: sev, stagePts: stg, score, value, owner, hours: hrs, lane, rule, why, flag, move, due: laneMeta.due, checked: ok.length };
  });

  const order = rows.map((r, i) => ({ r, i })).sort((x, y) => y.r.score - x.r.score || y.r.value - x.r.value || x.i - y.i).map((x) => x.r);
  const lanes = Object.fromEntries(LANES.map((l) => [l.id, order.filter((r) => r.lane === l.id)]));

  // V3: each account once across the acted-on signals, at its highest value.
  const acted = order.filter((r) => r.lane !== 'watch');
  const accMax = {};
  acted.forEach((r) => r.accounts.forEach((a) => {
    const k = accKey(a.name);
    accMax[k] = Math.max(accMax[k] || 0, a.value);
  }));
  const allAcc = new Set();
  order.forEach((r) => r.accounts.forEach((a) => allAcc.add(accKey(a.name))));

  const owners = {};
  acted.forEach((r) => {
    owners[r.owner] = owners[r.owner] || [];
    owners[r.owner].push(r);
  });

  const mentionsAll = order.reduce((t, r) => t + r.mentions.length, 0);
  const mentionsOk = order.reduce((t, r) => t + r.checked, 0);
  return {
    rows: order,
    lanes,
    owners,
    valueAtStake: Object.values(accMax).reduce((t, v) => t + v, 0),
    accountsActed: Object.keys(accMax).length,
    accountsHeard: allAcc.size,
    hours: order.reduce((t, r) => t + r.hours, 0),
    hoursField: lanes.field.reduce((t, r) => t + r.hours, 0),
    mentionsAll,
    mentionsOk
  };
}

export function fieldMessage(form, pulse) {
  const live = pulse.rows.filter((r) => r.lane !== 'watch');
  if (!live.length) return 'Nothing from this pulse needs a change in how we talk to customers yet.';
  const L = [];
  L.push(`Frontline Pulse: ${form.name || 'what you told us'} (${form.period.toLowerCase()})`);
  L.push('');
  L.push(`Thanks for the notes. ${pulse.accountsHeard} accounts came up. Here is what to say now, and what is happening behind it.`);
  live.forEach((r, i) => {
    L.push('');
    L.push(`${i + 1}. ${r.name}`);
    L.push(`Do now: ${r.reply}`);
    L.push(`Behind it: ${r.owner}, ${r.lane === 'field' ? 'this week' : r.lane === 'escalate' ? 'going to the next roadmap review' : 'logged for the monthly review'}.`);
  });
  const w = pulse.lanes.watch;
  if (w.length) {
    L.push('');
    L.push(`Still listening for: ${w.map((r) => r.name.toLowerCase()).join('; ')}. If you hear any of these, add it to your notes.`);
  }
  return L.join('\n');
}

export function digestMarkdown(form, parsed, pulse) {
  const L = [];
  L.push(`# ${form.name || 'Frontline Pulse'}`);
  L.push('');
  L.push(`**Source:** ${form.sourceType}, ${form.period.toLowerCase()}  `);
  L.push(`**Accounts heard from:** ${pulse.accountsHeard}  `);
  L.push(`**Value at stake in acted-on signals:** ${eur(pulse.valueAtStake)} a year, ${pulse.accountsActed} accounts, each counted once  `);
  L.push(`**Quotes checked:** ${pulse.mentionsOk} of ${pulse.mentionsAll} found in the notes`);
  if (parsed.summary) {
    L.push('');
    L.push(`> ${parsed.summary}`);
  }
  LANES.forEach((l) => {
    const list = pulse.lanes[l.id];
    if (!list.length) return;
    L.push('');
    L.push(`## ${l.label} (${l.due.toLowerCase()})`);
    list.forEach((r) => {
      L.push(`### ${r.name}`);
      L.push(`- ${r.what}`);
      L.push(`- Owner: ${r.owner} · Fix: ${r.fix} · Stage: ${r.stage} · Severity: ${r.severity} · Score: ${r.score} (${r.rule})`);
      L.push(`- Accounts: ${r.accounts.map((a) => (a.value ? `${a.name} (${eur(a.value)})` : a.name)).join(', ') || 'none checked'}`);
      if (r.lane !== 'watch') L.push(`- Ask: ${r.ask}`);
      L.push(`- Field reply: ${r.reply}`);
      if (r.hours) L.push(`- Workaround time in these notes: about ${Math.round(r.hours * 10) / 10} h`);
      if (r.flag) L.push(`- Flag: ${r.flag}`);
      if (r.move) L.push(`- What would move it: ${r.move}`);
      const ev = r.mentions.filter((m) => m.found).slice(0, 2);
      ev.forEach((m) => L.push(`  > "${m.quote}" (${m.account})`));
    });
  });
  const owners = Object.keys(pulse.owners);
  if (owners.length) {
    L.push('');
    L.push('## Asks by owner');
    owners.forEach((o) => {
      pulse.owners[o].forEach((r) => L.push(`- [ ] **${o}** (${r.due.toLowerCase()}): ${r.ask}`));
    });
  }
  if (parsed.gaps.length) {
    L.push('');
    L.push('## What the notes do not tell us');
    parsed.gaps.forEach((g) => L.push(`- ${g}`));
  }
  L.push('');
  L.push('_Made with Frontline Pulse. Counts, values, scores and owners come from printed rules. Values are as written in the notes._');
  return L.join('\n');
}
