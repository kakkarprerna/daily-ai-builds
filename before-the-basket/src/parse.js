// Turns the model's tagged lines into a result object.
// Tagged lines instead of JSON keep this tolerant of small formatting slips
// and make swapping providers cheap.

const SINGLE = [
  'READABLE', 'PRODUCT', 'VERDICT', 'OVERALL', 'CERTAINTY', 'CERTAINTY_WHY',
  'PRODUCTION', 'PRODUCTION_WHY', 'PROCESSING', 'PROCESSING_WHY',
  'BEST', 'WORST', 'THEN_NOW', 'PLACEMENT', 'SWAP',
];
const MULTI = ['GOOD', 'CONCERN', 'UNKNOWN', 'INGREDIENT', 'CHECK', 'DIETARY'];
const ALL = [...SINGLE, ...MULTI];

function toScore(v) {
  const n = parseInt(String(v || '').match(/\d+/)?.[0] ?? '', 10);
  if (Number.isNaN(n)) return null;
  return Math.max(0, Math.min(100, n));
}

export function parseResult(text) {
  const out = { raw: text };
  MULTI.forEach((k) => (out[k] = []));
  let last = null;

  for (const rawLine of String(text || '').split('\n')) {
    const line = rawLine.replace(/^[\s*#>-]+/, '').replace(/\*\*/g, '').trim();
    if (!line) continue;
    const m = line.match(/^([A-Z_]+)\s*:\s*(.*)$/);
    if (m && ALL.includes(m[1])) {
      const [, key, value] = m;
      if (MULTI.includes(key)) {
        if (value) out[key].push(value);
      } else {
        out[key] = value;
      }
      last = key;
    } else if (last && SINGLE.includes(last)) {
      out[last] = `${out[last]} ${line}`.trim();
    } else if (last && MULTI.includes(last) && out[last].length) {
      out[last][out[last].length - 1] += ` ${line}`;
    }
  }

  const result = {
    readable: !/^no/i.test(out.READABLE || 'yes'),
    product: out.PRODUCT || '',
    verdict: out.VERDICT || '',
    overall: toScore(out.OVERALL),
    certainty: (out.CERTAINTY || '').toLowerCase().match(/high|medium|low/)?.[0] || 'medium',
    certaintyWhy: out.CERTAINTY_WHY || '',
    production: toScore(out.PRODUCTION),
    productionWhy: out.PRODUCTION_WHY || '',
    processing: toScore(out.PROCESSING),
    processingWhy: out.PROCESSING_WHY || '',
    best: out.BEST || '',
    worst: out.WORST || '',
    thenNow: out.THEN_NOW || '',
    placement: out.PLACEMENT || '',
    good: out.GOOD,
    concerns: out.CONCERN,
    unknowns: out.UNKNOWN,
    ingredients: out.INGREDIENT.map((l) => {
      const [name, status, ...note] = l.split('|').map((s) => s.trim());
      const st = (status || '').toLowerCase();
      return { name, status: st.includes('flag') ? 'flag' : st.includes('watch') ? 'watch' : 'fine', note: note.join(' | ') };
    }),
    checks: out.CHECK,
    dietary: out.DIETARY.map((l) => {
      const [focus, ...note] = l.split('|').map((s) => s.trim());
      return { focus, note: note.join(' | ') };
    }),
    swap: out.SWAP || '',
  };

  result.ok = !result.readable
    ? Boolean(result.verdict)
    : result.overall !== null && result.production !== null && result.processing !== null;
  return result;
}

export function band(score) {
  if (score === null || score === undefined) return 'none';
  if (score >= 70) return 'good';
  if (score >= 45) return 'mid';
  return 'low';
}

export const BAND_LABEL = { good: 'Buy with confidence', mid: 'Buy with care', low: 'Think twice', none: 'No score' };
