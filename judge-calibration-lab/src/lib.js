// Parsing and statistics. Everything here runs in the browser and makes no model calls.

// ---------- scale ----------
export function parseScale(label) {
  const m = String(label).match(/(-?\d+)\s*(?:-|to|–)\s*(-?\d+)/i);
  if (!m) return null;
  const min = parseInt(m[1], 10);
  const max = parseInt(m[2], 10);
  if (!(max > min) || max - min > 20) return null;
  return { min, max };
}

// Close-match tolerance: one point on scales with four or more levels, exact match on shorter ones.
export function toleranceFor(min, max) {
  return max - min + 1 >= 4 ? 1 : 0;
}

// ---------- CSV / TSV ----------
function splitRows(text) {
  const delim = text.split('\n')[0].includes('\t') ? '\t' : ',';
  const rows = [];
  let row = [];
  let cell = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === delim) { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c !== '\r') cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim() !== ''));
}

const HEADERS = {
  id: ['id', 'item', 'item_id'],
  input: ['input', 'question', 'prompt', 'source', 'transcript'],
  response: ['response', 'output', 'answer', 'summary', 'reply'],
  human: ['human', 'human_score', 'human score', 'label', 'gold'],
  judge: ['judge', 'judge_score', 'judge score', 'model_score'],
  reason: ['judge_reason', 'reason'],
  note: ['note', 'human_note', 'comment', 'notes']
};

export function parseGoldenSet(text) {
  const rows = splitRows(String(text || '').trim());
  if (rows.length < 2) return { items: [], problems: ['Paste a header row and at least one item.'] };
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const col = {};
  for (const [k, names] of Object.entries(HEADERS)) {
    const idx = head.findIndex((h) => names.includes(h));
    if (idx >= 0) col[k] = idx;
  }
  const problems = [];
  if (col.response === undefined) problems.push('No "response" column found.');
  if (col.human === undefined) problems.push('No "human" score column found.');
  const items = [];
  rows.slice(1).forEach((r, i) => {
    const get = (k) => (col[k] !== undefined ? (r[col[k]] ?? '').trim() : '');
    const human = parseFloat(get('human'));
    const judge = parseFloat(get('judge'));
    items.push({
      id: get('id') || `item-${i + 1}`,
      input: get('input'),
      response: get('response'),
      human: Number.isFinite(human) ? human : null,
      judge: Number.isFinite(judge) ? judge : null,
      reason: get('reason'),
      note: get('note')
    });
  });
  const missing = items.filter((x) => x.human === null).length;
  if (missing) problems.push(`${missing} item(s) have no human score and will be left out of the numbers.`);
  return { items, problems, hasJudge: col.judge !== undefined && items.some((x) => x.judge !== null) };
}

// ---------- tagged model output ----------
function lines(text) {
  return String(text || '')
    .split('\n')
    .map((l) => l.trim().replace(/^[-*`\s]+/, '').replace(/`+$/, ''))
    .filter((l) => l.includes('|'))
    .map((l) => l.split('|').map((s) => s.trim()));
}

export function parseJudgeOutput(text, min, max) {
  const out = {};
  for (const p of lines(text)) {
    if (p[0].toUpperCase() !== 'ITEM' || p.length < 3) continue;
    const n = parseFloat(p[2]);
    if (!Number.isFinite(n)) continue;
    out[p[1]] = { score: Math.min(max, Math.max(min, Math.round(n))), reason: p.slice(3).join(' ') };
  }
  return out;
}

export function parseDiagnosis(text) {
  const d = { summary: '', ambiguities: [], rewrites: [], addCases: [], humanChecks: [] };
  for (const p of lines(text)) {
    const tag = p[0].toUpperCase();
    if (tag === 'SUMMARY') d.summary = p.slice(1).join(' ');
    else if (tag === 'AMBIGUITY') d.ambiguities.push({ phrase: p[1], how: p[2] || '', ids: (p[3] || '').split(',').map((s) => s.trim()).filter(Boolean) });
    else if (tag === 'REWRITE') d.rewrites.push({ from: p[1], to: p[2] || '' });
    else if (tag === 'ADD_CASE') d.addCases.push({ item: p[1], tests: p[2] || '' });
    else if (tag === 'HUMAN_CHECK') d.humanChecks.push({ id: p[1], why: p[2] || '' });
  }
  return d;
}

// ---------- statistics ----------
export function computeStats(items, min, max) {
  const pairs = items.filter((x) => x.human !== null && x.judge !== null);
  const n = pairs.length;
  const K = max - min + 1;
  const tol = toleranceFor(min, max);
  if (!n) return null;

  const idx = (v) => Math.min(K - 1, Math.max(0, Math.round(v) - min));
  const O = Array.from({ length: K }, () => Array(K).fill(0));
  const hH = Array(K).fill(0);
  const hJ = Array(K).fill(0);
  let exact = 0, close = 0, sumDiff = 0, sumAbs = 0, higher = 0, lower = 0;

  for (const p of pairs) {
    const i = idx(p.human), j = idx(p.judge);
    O[i][j]++; hH[i]++; hJ[j]++;
    const d = p.judge - p.human;
    sumDiff += d; sumAbs += Math.abs(d);
    if (d === 0) exact++;
    if (Math.abs(d) <= tol) close++;
    if (d > 0) higher++;
    if (d < 0) lower++;
  }

  // Quadratic weighted kappa (Cohen, 1968)
  let num = 0, den = 0;
  for (let i = 0; i < K; i++) {
    for (let j = 0; j < K; j++) {
      const w = K > 1 ? ((i - j) ** 2) / ((K - 1) ** 2) : 0;
      num += w * O[i][j];
      den += w * (hH[i] * hJ[j]) / n;
    }
  }
  const kappa = den > 0 ? 1 - num / den : null;

  const perLevel = hH.map((count, i) => {
    if (!count) return null;
    const js = pairs.filter((p) => idx(p.human) === i).map((p) => p.judge);
    return { level: i + min, count, judgeMean: js.reduce((a, b) => a + b, 0) / js.length };
  });

  const s = {
    n, K, tol,
    kappa,
    exact: exact / n,
    close: close / n,
    bias: sumDiff / n,
    mae: sumAbs / n,
    higher, lower, same: exact,
    matrix: O,
    perLevel
  };
  s.verdict = verdictFor(s);
  return s;
}

export const THRESHOLDS = {
  minItems: 8,
  trust: { kappa: 0.8, close: 0.9, bias: 0.3 },
  usable: { kappa: 0.6, close: 0.8 }
};

export function verdictFor(s) {
  const T = THRESHOLDS;
  if (s.n < T.minItems) return { key: 'few', label: 'Too few items to tell', tone: 'neutral', line: `Add at least ${T.minItems} scored items before reading anything into these numbers.` };
  const k = s.kappa ?? 0;
  if (k >= T.trust.kappa && s.close >= T.trust.close && Math.abs(s.bias) <= T.trust.bias)
    return { key: 'trust', label: 'Trust it, with spot checks', tone: 'good', line: 'The judge agrees with your people closely enough to run at scale. Keep sampling a few items by hand each week.' };
  if (k >= T.usable.kappa && s.close >= T.usable.close)
    return { key: 'usable', label: 'Usable after rubric fixes', tone: 'warn', line: 'The judge mostly tracks your people but drifts in one direction or on specific cases. Fix the rubric wording, then re-run.' };
  return { key: 'recal', label: 'Recalibrate before you rely on it', tone: 'bad', line: 'The judge and your people are scoring different things. Its numbers would mislead a dashboard or a launch decision.' };
}

export function pct(x) {
  return `${Math.round(x * 100)}%`;
}

export function fmt(x, d = 2) {
  if (x === null || x === undefined || !Number.isFinite(x)) return 'n/a';
  return (x > 0 && d === 2 ? '+' : '') + x.toFixed(d);
}
