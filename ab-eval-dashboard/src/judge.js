import { tagLines, pick, num } from './kit/tags.js';

// order 'AB' means Response 1 was variant A; 'BA' means Response 1 was B.
export function parseJudge(text, order, criteria) {
  const s1 = {};
  const s2 = {};
  let w = null;
  let reason = '';
  const match = (c) => criteria.find((k) => k.toLowerCase() === (c || '').toLowerCase().trim()) || criteria.find((k) => (c || '').toLowerCase().includes(k.toLowerCase()));
  for (const { tag, parts, rest } of tagLines(text)) {
    if (tag === 'SCORE' && parts.length >= 3) {
      const which = parts[0].replace(/\D/g, '');
      const crit = match(parts[1]);
      const v = num(parts[2], 1, 5);
      if (!crit || v == null) continue;
      if (which === '1') s1[crit] = v;
      if (which === '2') s2[crit] = v;
    } else if (tag === 'WINNER') w = pick(rest.replace(/response\s*/i, ''), ['1', '2', 'Tie'], null);
    else if (tag === 'REASON') reason = rest;
  }
  if (!w || !Object.keys(s1).length || !Object.keys(s2).length) return null;
  const toAB = (x) => (x === 'Tie' ? 'Tie' : (x === '1') === (order === 'AB') ? 'A' : 'B');
  return {
    order,
    scoresA: order === 'AB' ? s1 : s2,
    scoresB: order === 'AB' ? s2 : s1,
    winner: toAB(w),
    reason,
  };
}

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

// Combines one or two judge runs for a case. If two runs disagree on the
// winner, the case is "Split": the verdict followed the order, not the content.
export function combine(runs, criteria) {
  const ok = runs.filter(Boolean);
  if (!ok.length) return null;
  const winners = [...new Set(ok.map((r) => r.winner))];
  const per = (side) => Object.fromEntries(criteria.map((c) => [c, mean(ok.map((r) => r[side][c]).filter((v) => v != null))]));
  const scoresA = per('scoresA');
  const scoresB = per('scoresB');
  return {
    winner: winners.length === 1 ? winners[0] : 'Split',
    scoresA,
    scoresB,
    avgA: mean(Object.values(scoresA).filter((v) => v != null)),
    avgB: mean(Object.values(scoresB).filter((v) => v != null)),
    runs: ok,
  };
}

export function scoreboard(cases, results, criteria) {
  const judged = cases.map((c) => results[c.id]?.combined).filter(Boolean);
  const count = (w) => judged.filter((j) => j.winner === w).length;
  const byOrder = (order, w) => judged.filter((j) => j.runs.find((r) => r.order === order)?.winner === w).length;
  const twoRuns = judged.filter((j) => j.runs.length === 2).length;
  return {
    n: judged.length,
    winsA: count('A'),
    winsB: count('B'),
    ties: count('Tie'),
    split: count('Split'),
    meanA: mean(judged.map((j) => j.avgA).filter((v) => v != null)),
    meanB: mean(judged.map((j) => j.avgB).filter((v) => v != null)),
    perCrit: criteria.map((c) => ({
      c,
      a: mean(judged.map((j) => j.scoresA[c]).filter((v) => v != null)),
      b: mean(judged.map((j) => j.scoresB[c]).filter((v) => v != null)),
    })),
    twoRuns,
    abOrder: { A: byOrder('AB', 'A'), B: byOrder('AB', 'B') },
    baOrder: { A: byOrder('BA', 'A'), B: byOrder('BA', 'B') },
  };
}
