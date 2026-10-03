import { tagLines, pick, num } from './kit/tags.js';

export function parseEstimate(text) {
  const r = { costs: {}, assumptions: [], watch: [], summary: '' };
  for (const { tag, parts, rest } of tagLines(text)) {
    if (tag === 'COST' && parts.length >= 3) {
      const n = parseInt((parts[0] || '').replace(/\D/g, ''), 10);
      const low = num(parts[1], 0, 1e9);
      const high = num(parts[2], 0, 1e9);
      if (!Number.isFinite(n) || low == null || high == null) continue;
      r.costs[n] = {
        low: Math.min(low, high),
        high: Math.max(low, high),
        confidence: pick(parts[3], ['High', 'Medium', 'Low'], 'Medium'),
        drivers: (parts[4] || '').split(';').map((s) => s.trim()).filter(Boolean),
        rationale: parts.slice(5).join(' | '),
      };
    } else if (tag === 'ASSUMPTION' && rest) r.assumptions.push(rest);
    else if (tag === 'WATCH' && rest) r.watch.push(rest);
    else if (tag === 'SUMMARY') r.summary = rest;
  }
  r.ok = Object.keys(r.costs).length > 0;
  return r;
}

// Joins categories (with their current frequencies) to the cost estimates
// and ranks them by monthly exposure at the midpoint.
export function rank(categories, costs) {
  const rows = categories
    .map((c, i) => {
      const est = costs[i + 1];
      if (!est) return null;
      const f = Math.max(0, Number(c.frequency) || 0);
      const mid = (est.low + est.high) / 2;
      return { ...c, idx: i + 1, ...est, mid, monthLow: est.low * f, monthHigh: est.high * f, monthMid: mid * f, freq: f };
    })
    .filter(Boolean)
    .sort((a, b) => b.monthMid - a.monthMid);
  const total = rows.reduce((s, r) => s + r.monthMid, 0);
  rows.forEach((r) => (r.share = total ? r.monthMid / total : 0));
  return { rows, total, totalLow: rows.reduce((s, r) => s + r.monthLow, 0), totalHigh: rows.reduce((s, r) => s + r.monthHigh, 0) };
}

export const money = (n, currency) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency, currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 }).format(Math.round(n || 0));
