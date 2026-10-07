// Worth Building? calculation engine.
// Every figure in a case comes from here, in the browser, with fixed printed formulas.
// The model never produces a number. It only writes the words around these figures.

export const SCENARIOS = {
  conservative: {
    label: 'Conservative',
    note: 'Time saved and peak adoption at 70%, ramp 50% slower, error rate and build cost 30% higher, revenue and cost avoided at 70%',
    minsSaved: 0.7, peak: 0.7, ramp: 1.5, errorRate: 1.3, build: 1.3, revenue: 0.7, avoided: 0.7
  },
  base: {
    label: 'Base',
    note: 'Your numbers exactly as entered',
    minsSaved: 1, peak: 1, ramp: 1, errorRate: 1, build: 1, revenue: 1, avoided: 1
  },
  optimistic: {
    label: 'Optimistic',
    note: 'Time saved 20% higher, peak adoption 15% higher (capped at 100%), ramp 30% faster, error rate 20% lower',
    minsSaved: 1.2, peak: 1.15, ramp: 0.7, errorRate: 0.8, build: 1, revenue: 1.2, avoided: 1.1
  }
};

// Inputs that the sensitivity test moves, with a plain label for each.
export const DRIVERS = [
  { key: 'volume', label: 'Tasks per month' },
  { key: 'minsSaved', label: 'Minutes saved per task' },
  { key: 'hourly', label: 'Loaded hourly cost' },
  { key: 'redeploy', label: 'Share of saved time put to use' },
  { key: 'peak', label: 'Peak adoption' },
  { key: 'rampMonths', label: 'Months to reach peak' },
  { key: 'aiCostPerTask', label: 'AI cost per task' },
  { key: 'reviewRate', label: 'Share of outputs a person reviews' },
  { key: 'errorRate', label: 'Error rate' },
  { key: 'costPerError', label: 'Cost of one error' },
  { key: 'buildCost', label: 'One-off build cost' },
  { key: 'runFixed', label: 'Fixed monthly running cost' },
  { key: 'revenueBase', label: 'Monthly revenue affected' },
  { key: 'upliftPct', label: 'Revenue uplift' },
  { key: 'avoidedMonthly', label: 'Monthly cost avoided' }
];

const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

export function normalise(raw) {
  return {
    volume: Math.max(0, n(raw.volume)),
    minsSaved: Math.max(0, n(raw.minsSaved)),
    hourly: Math.max(0, n(raw.hourly)),
    redeploy: clamp(n(raw.redeploy), 0, 100),
    peak: clamp(n(raw.peak), 0, 100),
    rampMonths: Math.max(1, Math.round(n(raw.rampMonths) || 1)),
    aiCostPerTask: Math.max(0, n(raw.aiCostPerTask)),
    reviewRate: clamp(n(raw.reviewRate), 0, 100),
    reviewMins: Math.max(0, n(raw.reviewMins)),
    errorRate: clamp(n(raw.errorRate), 0, 100),
    costPerError: Math.max(0, n(raw.costPerError)),
    buildCost: Math.max(0, n(raw.buildCost)),
    runFixed: Math.max(0, n(raw.runFixed)),
    revenueBase: Math.max(0, n(raw.revenueBase)),
    upliftPct: Math.max(0, n(raw.upliftPct)),
    avoidedMonthly: Math.max(0, n(raw.avoidedMonthly)),
    horizon: Math.max(6, Math.round(n(raw.horizon) || 24))
  };
}

function clamp(x, lo, hi) {
  return Math.min(hi, Math.max(lo, x));
}

// Apply a scenario's multipliers to normalised inputs.
export function applyScenario(i, s) {
  return {
    ...i,
    minsSaved: i.minsSaved * s.minsSaved,
    peak: Math.min(100, i.peak * s.peak),
    rampMonths: Math.max(1, Math.round(i.rampMonths * s.ramp)),
    errorRate: Math.min(100, i.errorRate * s.errorRate),
    buildCost: i.buildCost * s.build,
    upliftPct: i.upliftPct * s.revenue,
    avoidedMonthly: i.avoidedMonthly * s.avoided
  };
}

// The model itself. One row per month.
// progress(m)   = min(1, m / rampMonths)
// adoption(m)   = peak% x progress(m)
// handled(m)    = volume x adoption(m)
// timeValue     = handled x minsSaved / 60 x hourly x redeploy%
// revenueValue  = revenueBase x uplift% x progress(m)
// avoidedValue  = avoidedMonthly x progress(m)
// aiCost        = handled x aiCostPerTask
// reviewCost    = handled x reviewRate% x reviewMins / 60 x hourly
// errorCost     = handled x errorRate% x costPerError
// net(m)        = timeValue + revenueValue + avoidedValue - runFixed - aiCost - reviewCost - errorCost
// cumulative(m) = -buildCost + sum of net up to m
export function project(i) {
  const rows = [];
  let cumulative = -i.buildCost;
  let paybackMonth = null;
  let totalBenefit = 0;
  let totalCost = 0;
  for (let m = 1; m <= i.horizon; m++) {
    const progress = Math.min(1, m / i.rampMonths);
    const adoption = (i.peak / 100) * progress;
    const handled = i.volume * adoption;
    const timeValue = (handled * i.minsSaved / 60) * i.hourly * (i.redeploy / 100);
    const revenueValue = i.revenueBase * (i.upliftPct / 100) * progress;
    const avoidedValue = i.avoidedMonthly * progress;
    const aiCost = handled * i.aiCostPerTask;
    const reviewCost = handled * (i.reviewRate / 100) * (i.reviewMins / 60) * i.hourly;
    const errorCost = handled * (i.errorRate / 100) * i.costPerError;
    const benefit = timeValue + revenueValue + avoidedValue;
    const cost = i.runFixed + aiCost + reviewCost + errorCost;
    const net = benefit - cost;
    cumulative += net;
    totalBenefit += benefit;
    totalCost += cost;
    if (paybackMonth === null && cumulative >= 0) paybackMonth = m;
    rows.push({ m, adoption, handled, timeValue, revenueValue, avoidedValue, aiCost, reviewCost, errorCost, benefit, cost, net, cumulative });
  }
  const steady = rows[rows.length - 1];
  const netValue = totalBenefit - totalCost - i.buildCost;
  const invested = i.buildCost + totalCost;
  const roi = invested > 0 ? netValue / invested : 0;
  return {
    rows,
    paybackMonth,
    totalBenefit,
    totalCost,
    netValue,
    roi,
    steadyNet: steady.net,
    steadyBenefit: steady.benefit,
    steadyCost: steady.cost,
    costPerTaskHandled: steady.handled > 0 ? steady.cost / steady.handled : 0,
    valuePerTaskHandled: steady.handled > 0 ? steady.benefit / steady.handled : 0
  };
}

// Verdict bands, fixed and printed in How it works.
export function verdict(base, horizon) {
  if (base.steadyNet <= 0) {
    return { key: 'none', label: 'No case on these numbers', line: 'At full adoption it still costs more each month than it returns.' };
  }
  if (base.paybackMonth !== null && base.paybackMonth <= 6 && base.roi >= 1) {
    return { key: 'strong', label: 'Strong case', line: 'Pays back within six months and returns at least double what goes in.' };
  }
  if (base.paybackMonth !== null) {
    return { key: 'workable', label: 'Workable case', line: `Pays back inside the ${horizon}-month horizon, so it stands or falls on the assumptions below.` };
  }
  return { key: 'weak', label: 'Weak case', line: `Earns money each month at full adoption but does not recover the build cost inside ${horizon} months.` };
}

// One-at-a-time sensitivity: move each driver down and up by 25% and record the change
// in net value over the horizon. Ranked by the size of the swing.
export function sensitivity(i) {
  const baseNet = project(i).netValue;
  const out = [];
  for (const d of DRIVERS) {
    if (!i[d.key]) continue;
    const lowIn = { ...i, [d.key]: tweak(d.key, i[d.key], 0.75) };
    const highIn = { ...i, [d.key]: tweak(d.key, i[d.key], 1.25) };
    const low = project(lowIn).netValue - baseNet;
    const high = project(highIn).netValue - baseNet;
    out.push({ ...d, low, high, swing: Math.abs(high - low) });
  }
  return out.sort((a, b) => b.swing - a.swing);
}

function tweak(key, v, f) {
  const x = v * f;
  if (['redeploy', 'peak', 'reviewRate', 'errorRate'].includes(key)) return Math.min(100, x);
  if (key === 'rampMonths') return Math.max(1, Math.round(x));
  return x;
}

export function runAll(raw) {
  const base = normalise(raw);
  const results = {};
  for (const [k, s] of Object.entries(SCENARIOS)) results[k] = project(applyScenario(base, s));
  return {
    inputs: base,
    results,
    verdict: verdict(results.base, base.horizon),
    sensitivity: sensitivity(base)
  };
}

// Formatting, used both on screen and in the figures sent to the model,
// so the figure check compares like with like.
export function eur(v) {
  const sign = v < 0 ? '-' : '';
  const a = Math.abs(v);
  if (a < 0.005) return '€0';
  if (a >= 1e6) return `${sign}€${(a / 1e6).toFixed(a >= 1e7 ? 1 : 2).replace(/\.?0+$/, '')}M`;
  if (a >= 1e4) return `${sign}€${Math.round(a / 1e3)}k`;
  if (a >= 1e3) return `${sign}€${(a / 1e3).toFixed(1).replace(/\.0$/, '')}k`;
  if (a >= 10) return `${sign}€${Math.round(a)}`;
  return `${sign}€${a.toFixed(2)}`;
}

export function pct(v) {
  return `${Math.round(v * 100)}%`;
}

export function paybackText(r, horizon) {
  return r.paybackMonth ? `month ${r.paybackMonth}` : `not within ${horizon} months`;
}

// The fixed set of figures the model is allowed to quote.
export function figureSheet(out) {
  const { inputs: i, results: r, verdict: v, sensitivity: s } = out;
  const lines = [
    `Verdict: ${v.label}`,
    `Horizon: ${i.horizon} months`,
    `Base payback: ${paybackText(r.base, i.horizon)}`,
    `Conservative payback: ${paybackText(r.conservative, i.horizon)}`,
    `Optimistic payback: ${paybackText(r.optimistic, i.horizon)}`,
    `Base net value over horizon: ${eur(r.base.netValue)}`,
    `Conservative net value over horizon: ${eur(r.conservative.netValue)}`,
    `Optimistic net value over horizon: ${eur(r.optimistic.netValue)}`,
    `Base return on money in: ${pct(r.base.roi)}`,
    `Monthly net at full adoption (base): ${eur(r.base.steadyNet)}`,
    `Monthly benefit at full adoption (base): ${eur(r.base.steadyBenefit)}`,
    `Monthly cost at full adoption (base): ${eur(r.base.steadyCost)}`,
    `One-off build cost: ${eur(i.buildCost)}`,
    `Biggest swing inputs: ${s.slice(0, 3).map((d) => d.label).join('; ')}`
  ];
  return lines;
}
