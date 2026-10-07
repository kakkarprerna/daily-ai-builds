import { eur, pct, figureSheet } from './calc.js';

// Parse the model's tagged lines. A line that does not fit its tag is skipped,
// so one broken line never sinks the whole case.
export function parseNarrative(text) {
  const out = { summary: '', problem: '', ask: '', audiences: [], validate: [], risks: [], kills: [], alternatives: [], skipped: 0 };
  for (const raw of String(text || '').split('\n')) {
    const line = raw.trim().replace(/^[-*\d.\s]+(?=[A-Z]+\|)/, '');
    if (!line) continue;
    const parts = line.split('|').map((p) => p.trim());
    const tag = parts[0];
    const f = parts.slice(1);
    if (tag === 'SUMMARY' && f[0]) out.summary = f.join(' ');
    else if (tag === 'PROBLEM' && f[0]) out.problem = f.join(' ');
    else if (tag === 'ASK' && f[0]) out.ask = f.join(' ');
    else if (tag === 'AUDIENCE' && f.length >= 5) out.audiences.push({ who: f[0], cares: f[1], lead: f[2], objection: f[3], answer: f[4] });
    else if (tag === 'VALIDATE' && f.length >= 3) out.validate.push({ what: f[0], check: f[1], owner: f[2] });
    else if (tag === 'RISK' && f.length >= 2) out.risks.push({ risk: f[0], mitigation: f[1] });
    else if (tag === 'KILL' && f[0]) out.kills.push(f[0]);
    else if (tag === 'ALTERNATIVE' && f.length >= 2) out.alternatives.push({ option: f[0], wins: f[1] });
    else out.skipped += 1;
  }
  return out;
}

// Every euro amount, percentage and month number the model is allowed to use.
export function allowedFigures(out) {
  const { inputs: i, results: r } = out;
  const allowed = new Set();
  const addEur = (v) => allowed.add(norm(eur(v)));
  const addPct = (v) => allowed.add(`${Math.round(v)}%`);
  for (const k of ['buildCost', 'runFixed', 'hourly', 'costPerError', 'aiCostPerTask', 'avoidedMonthly', 'revenueBase']) addEur(i[k]);
  for (const k of ['redeploy', 'peak', 'reviewRate', 'errorRate', 'upliftPct']) addPct(i[k]);
  for (const s of Object.values(r)) {
    for (const v of [s.netValue, s.steadyNet, s.steadyBenefit, s.steadyCost, s.totalBenefit, s.totalCost]) {
      addEur(v);
      addEur(Math.abs(v));
    }
    allowed.add(norm(pct(s.roi)));
    allowed.add(norm(pct(Math.abs(s.roi))));
    if (s.paybackMonth) allowed.add(`month ${s.paybackMonth}`);
  }
  allowed.add(`month ${i.horizon}`);
  allowed.add('month 1');
  return allowed;
}

function norm(s) {
  return s.replace(/^-/, '').toLowerCase();
}

// Find figures in the narrative that are not on the sheet.
export function checkFigures(narrativeText, out) {
  const allowed = allowedFigures(out);
  const found = new Set();
  const re = /€\s?\d[\d.,]*\s?[kKmM]?|\b\d+(?:\.\d+)?%|\bmonth \d+\b/g;
  for (const m of String(narrativeText).matchAll(re)) found.add(m[0].replace(/\s/g, '').replace(/^month/, 'month ').toLowerCase());
  const unknown = [...found].filter((f) => !allowed.has(f));
  return { checked: found.size, unknown };
}

export { figureSheet };
