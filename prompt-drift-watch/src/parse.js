// Reads the judge's tagged-line output. Tolerant of stray whitespace,
// bullets or bold markers a model might add.

const pick = (v, allowed, fallback) => {
  const hit = allowed.find((a) => v.toLowerCase().startsWith(a.toLowerCase()));
  return hit || fallback;
};

const LABELS = ['Intended', 'Side effect', 'No change', 'Unclear'];

export function parseReport(text) {
  const r = { verdict: null, confidence: null, summary: '', intent: null, changes: [], causes: [], retests: [], flip: '' };
  for (const raw of (text || '').split('\n')) {
    const line = raw.replace(/^[\s*\-•>#]+/, '').replace(/\*\*/g, '').trim();
    const m = line.match(/^([A-Z_]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const [, tag, rest] = m;
    const parts = rest.split('|').map((s) => s.trim());
    switch (tag) {
      case 'VERDICT':
        r.verdict = pick(rest, ['Ship', 'Retest', 'Hold'], null);
        break;
      case 'CONFIDENCE':
        r.confidence = pick(rest, ['High', 'Medium', 'Low'], null);
        break;
      case 'SUMMARY':
        r.summary = rest;
        break;
      case 'INTENT':
        r.intent = { status: pick(parts[0] || '', ['Yes', 'Partly', 'No'], 'Partly'), note: parts.slice(1).join(' | ') };
        break;
      case 'CHANGE': {
        const num = parseInt((parts[0] || '').replace(/\D/g, ''), 10);
        r.changes.push({
          test: Number.isFinite(num) ? num : r.changes.length + 1,
          label: pick(parts[1] || '', LABELS, 'Unclear'),
          what: parts[2] || '',
          why: parts.slice(3).join(' | '),
        });
        break;
      }
      case 'CAUSE':
        r.causes.push({ phrase: (parts[0] || '').replace(/^["“']|["”']$/g, ''), effect: parts.slice(1).join(' | ') });
        break;
      case 'RETEST':
        if (rest) r.retests.push(rest);
        break;
      case 'FLIP':
        r.flip = rest;
        break;
      default:
        break;
    }
  }
  r.ok = Boolean(r.verdict && r.changes.length);
  return r;
}
