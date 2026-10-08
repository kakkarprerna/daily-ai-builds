// So What? rules. Everything that decides the plan lives here and is printed in How it works.
// The model only reads the pasted material and proposes insights and actions from fixed word lists.
// Scoring, the evidence check, the buckets, the capacity fill and the impact ranges are all worked
// out here, in the browser, so the same inputs always give the same plan.

export const SOURCES = ['User interviews', 'Support tickets', 'Survey answers', 'Sales call notes', 'Metric readout', 'Usability tests', 'Mixed'];
export const GOALS = ['Trial to paid', 'Activation', 'Retention', 'Expansion revenue', 'Support load', 'Team time'];
export const HORIZONS = ['Next 2 weeks', 'This month', 'This quarter'];
export const CAPACITIES = [5, 10, 20, 40];

export const STRENGTHS = ['Single mention', 'Repeated', 'Measured'];
export const REACHES = ['Few', 'Some', 'Most'];
export const FITS = ['Direct', 'Supports', 'Off goal'];
export const EFFORTS = ['Hours', 'Days', 'Weeks', 'Months'];
export const LEVERS = ['Activation', 'Conversion', 'Retention', 'Expansion', 'Pricing', 'Efficiency'];
export const OWNERS = ['Product', 'Engineering', 'Design', 'Data', 'Sales', 'Customer success', 'Marketing', 'Operations'];

export const STRENGTH_PTS = { 'Single mention': 1, Repeated: 2, Measured: 3 };
export const REACH_PTS = { Few: 1, Some: 2, Most: 3 };
export const REACH_SHARE = { Few: 0.2, Some: 0.5, Most: 1 };
export const FIT_PTS = { Direct: 3, Supports: 2, 'Off goal': 1 };
export const EFFORT_DIV = { Hours: 1, Days: 2, Weeks: 3, Months: 4 };
export const EFFORT_DAYS = { Hours: 0.5, Days: 3, Weeks: 10, Months: 30 };
export const EVIDENCE_WEIGHT = { 1: 0.4, 2: 0.7, 3: 1 };

// Starting assumptions, not benchmarks. Share of monthly revenue an action on this lever could move
// if it reached every customer. Efficiency is a share of the team hours you enter instead.
export const DEFAULT_LIFTS = {
  Activation: [1, 3],
  Conversion: [1, 4],
  Retention: [1, 3],
  Expansion: [2, 5],
  Pricing: [2, 6],
  Efficiency: [5, 15]
};

export const BUCKETS = [
  { id: 'now', label: 'Do now', desc: 'Strong enough and fits the capacity you set' },
  { id: 'next', label: 'Plan next', desc: 'Worth doing, after the first batch' },
  { id: 'test', label: 'Test first', desc: 'Thin evidence. Run the cheap check before building' },
  { id: 'park', label: 'Park', desc: 'Off goal, or too little value for the effort' }
];

export const RULES = [
  { id: 'E1', text: 'Every insight carries a quote. It is searched for in your pasted material, ignoring case, spacing and quote marks.' },
  { id: 'E2', text: 'An insight whose quote is not found drops one evidence level, never below Single mention.' },
  { id: 'E3', text: 'An action takes the strongest evidence and widest reach of the insights it is built on.' },
  { id: 'S1', text: 'Score = reach (1 to 3) × evidence (1 to 3) × goal fit (1 to 3) ÷ effort (Hours 1, Days 2, Weeks 3, Months 4).' },
  { id: 'P1', text: 'Off goal goes to Park, whatever its score.' },
  { id: 'P2', text: 'Evidence at Single mention goes to Test first when the action takes weeks or more, or reaches Some or Most.' },
  { id: 'P3', text: 'Score 6 or more is a Do now candidate. Candidates are filled in score order until the person-days you set run out. The rest go to Plan next.' },
  { id: 'P4', text: 'Score from 2 to under 6 goes to Plan next.' },
  { id: 'P5', text: 'Anything below 2 goes to Park.' },
  { id: 'G1', text: 'Revenue range = monthly revenue × lever range × reach share (Few 20%, Some 50%, Most 100%). Weighted figure = midpoint × evidence weight (40%, 70%, 100%).' },
  { id: 'G2', text: 'Efficiency actions show hours back per week instead: team hours × lever range × reach share.' }
];

const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[‘’`´]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/["']/g, '')
    .replace(/[^\p{L}\p{N}%€$£.,]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export function quoteFound(quote, source) {
  const q = norm(quote).replace(/[.,]+$/, '');
  if (q.length < 6) return false;
  return norm(source).includes(q);
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
export function parsePlan(text) {
  const out = { summary: '', insights: [], actions: [], gaps: [], offList: 0 };
  String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim().replace(/^[-*]\s*/, ''))
    .filter(Boolean)
    .forEach((line) => {
      const f = line.split('|').map((x) => x.trim());
      const tag = f[0].toUpperCase();
      if (tag === 'SUMMARY') out.summary = f.slice(1).join(' ');
      else if (tag === 'INSIGHT' && f.length >= 7) {
        const s = pick(STRENGTHS, f[4], 'Single mention');
        const r = pick(REACHES, f[5], 'Some');
        if (!s.ok || !r.ok) out.offList += 1;
        out.insights.push({ id: f[1].toUpperCase(), finding: f[2], soWhat: f[3], strength: s.value, reach: r.value, quote: f.slice(6).join(' ') });
      } else if (tag === 'ACTION' && f.length >= 11) {
        const lever = pick(LEVERS, f[4], 'Activation');
        const effort = pick(EFFORTS, f[5], 'Weeks');
        const owner = pick(OWNERS, f[6], 'Product');
        const fit = pick(FITS, f[7], 'Supports');
        if (!lever.ok || !effort.ok || !owner.ok || !fit.ok) out.offList += 1;
        out.actions.push({
          id: f[1].toUpperCase(),
          from: f[2].toUpperCase().split(/[,\s]+/).filter(Boolean),
          title: f[3],
          lever: lever.value,
          effort: effort.value,
          owner: owner.value,
          fit: fit.value,
          first: f[8],
          metric: f[9],
          stop: f.slice(10).join(' ')
        });
      } else if (tag === 'GAP' && f[1]) out.gaps.push(f.slice(1).join(' '));
    });
  return out;
}

const eur = (n) => `€${Math.round(n).toLocaleString('en-GB')}`;
export const money = (n) => (n >= 10000 ? `€${Math.round(n / 100) / 10}k` : eur(n));

// Turns insights and actions (possibly edited by the user) into a ranked plan.
export function buildPlan({ insights, actions, source, capacity, revenue, teamHours, lifts }) {
  const ins = insights.map((i) => {
    const found = quoteFound(i.quote, source);
    const base = STRENGTH_PTS[i.strength] || 1;
    const evidence = found ? base : Math.max(1, base - 1);
    return { ...i, found, evidence, downgraded: !found && base > 1 };
  });
  const byId = Object.fromEntries(ins.map((i) => [i.id, i]));

  const rows = actions.map((a) => {
    const linked = a.from.map((id) => byId[id]).filter(Boolean);
    const evidence = linked.length ? Math.max(...linked.map((i) => i.evidence)) : 1;
    const reachPts = linked.length ? Math.max(...linked.map((i) => REACH_PTS[i.reach] || 1)) : 1;
    const reach = REACHES[reachPts - 1];
    const fitPts = FIT_PTS[a.fit] || 2;
    const div = EFFORT_DIV[a.effort] || 3;
    const score = Math.round(((reachPts * evidence * fitPts) / div) * 10) / 10;
    const lift = lifts[a.lever] || DEFAULT_LIFTS[a.lever] || [1, 3];
    const share = REACH_SHARE[reach];
    let impact = null;
    if (a.lever === 'Efficiency') {
      if (teamHours > 0) {
        const lo = (teamHours * lift[0] * share) / 100;
        const hi = (teamHours * lift[1] * share) / 100;
        impact = { kind: 'hours', lo, hi, weighted: ((lo + hi) / 2) * EVIDENCE_WEIGHT[evidence] };
      }
    } else if (revenue > 0) {
      const lo = (revenue * lift[0] * share) / 100;
      const hi = (revenue * lift[1] * share) / 100;
      impact = { kind: 'money', lo, hi, weighted: ((lo + hi) / 2) * EVIDENCE_WEIGHT[evidence] };
    }
    return { ...a, linked, evidence, reach, reachPts, fitPts, div, score, days: EFFORT_DAYS[a.effort] || 10, impact, bucket: null, rule: '', why: '' };
  });

  // Bucket in score order so the capacity fill is deterministic. Ties keep the model's order.
  const order = rows.map((r, i) => ({ r, i })).sort((x, y) => y.r.score - x.r.score || x.i - y.i).map((x) => x.r);
  let used = 0;
  order.forEach((r) => {
    if (r.fit === 'Off goal') {
      Object.assign(r, { bucket: 'park', rule: 'P1', why: 'It does not move the goal you set.' });
    } else if (r.evidence === 1 && (EFFORT_DIV[r.effort] >= 3 || r.reachPts >= 2)) {
      Object.assign(r, { bucket: 'test', rule: 'P2', why: r.effort === 'Weeks' || r.effort === 'Months' ? 'Thin evidence for a build this size.' : 'Thin evidence for something this wide.' });
    } else if (r.score >= 6) {
      if (used + r.days <= capacity) {
        used += r.days;
        Object.assign(r, { bucket: 'now', rule: 'P3', why: 'Strong score and it fits the capacity left.' });
      } else {
        Object.assign(r, { bucket: 'next', rule: 'P3', why: `Strong, but it needs ${fmtDays(r.days)} and only ${fmtDays(Math.max(0, capacity - used))} are left.` });
      }
    } else if (r.score >= 2) {
      Object.assign(r, { bucket: 'next', rule: 'P4', why: 'Worth doing, but not first.' });
    } else {
      Object.assign(r, { bucket: 'park', rule: 'P5', why: 'Too little value for the effort.' });
    }
  });

  const sum = (list, kind, key) => list.filter((r) => r.impact && r.impact.kind === kind).reduce((t, r) => t + r.impact[key], 0);
  const now = order.filter((r) => r.bucket === 'now');
  const next = order.filter((r) => r.bucket === 'next');
  const totals = {
    nowMoney: { lo: sum(now, 'money', 'lo'), hi: sum(now, 'money', 'hi'), w: sum(now, 'money', 'weighted') },
    nextMoney: { lo: sum(next, 'money', 'lo'), hi: sum(next, 'money', 'hi'), w: sum(next, 'money', 'weighted') },
    nowHours: { lo: sum(now, 'hours', 'lo'), hi: sum(now, 'hours', 'hi'), w: sum(now, 'hours', 'weighted') },
    nextHours: { lo: sum(next, 'hours', 'lo'), hi: sum(next, 'hours', 'hi'), w: sum(next, 'hours', 'weighted') }
  };

  const unlinked = ins.filter((i) => !rows.some((r) => r.from.includes(i.id)));
  return {
    insights: ins,
    rows: order,
    buckets: Object.fromEntries(BUCKETS.map((b) => [b.id, order.filter((r) => r.bucket === b.id)])),
    used,
    capacity,
    totals,
    verified: ins.filter((i) => i.found).length,
    unlinked
  };
}

export function fmtDays(d) {
  if (d < 1) return 'half a day';
  const n = Math.round(d * 10) / 10;
  return `${n} person-day${n === 1 ? '' : 's'}`;
}

export function impactText(imp, short) {
  if (!imp) return null;
  if (imp.kind === 'hours') return `${Math.round(imp.lo)} to ${Math.round(imp.hi)} h a week${short ? '' : ' back'}`;
  return `${money(imp.lo)} to ${money(imp.hi)} a month`;
}

export function briefMarkdown(form, parsed, plan) {
  const L = [];
  L.push(`# ${form.name || 'Action brief'}`);
  L.push('');
  L.push(`**Goal:** ${form.goal || 'not set'} (${form.goalMetric})  `);
  L.push(`**Source:** ${form.sourceType}  `);
  L.push(`**Capacity:** ${form.capacity} person-days, ${form.horizon.toLowerCase()}`);
  if (parsed.summary) {
    L.push('');
    L.push(`> ${parsed.summary}`);
  }
  L.push('');
  L.push('## What we learned');
  plan.insights.forEach((i) => {
    L.push(`- **${i.id}. ${i.finding}** So what: ${i.soWhat} _(${i.strength}, reaches ${i.reach.toLowerCase()}${i.found ? ', quote checked' : ', quote not found in source'})_`);
  });
  BUCKETS.forEach((b) => {
    const list = plan.buckets[b.id];
    if (!list.length) return;
    L.push('');
    L.push(`## ${b.label}`);
    list.forEach((r) => {
      L.push(`### ${r.title}`);
      L.push(`- Owner: ${r.owner} · Lever: ${r.lever} · Effort: ${r.effort} · Score: ${r.score} (${r.rule})`);
      L.push(`- Built on: ${r.from.join(', ')}`);
      L.push(`- First step this week: ${r.first}`);
      L.push(`- Metric to watch: ${r.metric}`);
      L.push(`- Stop if: ${r.stop}`);
      const it = impactText(r.impact);
      if (it) L.push(`- Possible impact: ${it} (starting assumption, see method)`);
      L.push(`- Why here: ${r.why}`);
    });
  });
  if (plan.buckets.now.length) {
    L.push('');
    L.push('## This week');
    plan.buckets.now.forEach((r) => L.push(`- [ ] ${r.owner}: ${r.first}`));
  }
  if (parsed.gaps.length) {
    L.push('');
    L.push('## What would change this plan');
    parsed.gaps.forEach((g) => L.push(`- ${g}`));
  }
  L.push('');
  L.push('_Made with So What? Scores and buckets come from printed rules. Impact ranges are starting assumptions, not benchmarks._');
  return L.join('\n');
}
