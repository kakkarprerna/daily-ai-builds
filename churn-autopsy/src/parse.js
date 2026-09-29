// Parses the model's tagged-line output into a structured result.
// Tagged lines (not JSON) keep every provider interchangeable and survive
// small formatting slips like stray markdown or bullets.

const num = (s) => {
  const m = String(s || '').match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
};

export function parseAutopsy(text) {
  const out = {
    verdict: '',
    confidence: '',
    summary: '',
    firstSignal: null,
    noReturn: null,
    saveWindow: '',
    stated: '',
    real: '',
    missed: [],
    plays: [],
    rules: [],
    flips: [],
  };
  const lines = String(text || '').split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.replace(/^[\s*\-•#>]+/, '').replace(/\*\*/g, '').trim();
    const m = line.match(/^([A-Z_]+)\s*:\s*(.+)$/);
    if (!m) continue;
    const tag = m[1];
    const parts = m[2].split('|').map((p) => p.trim());
    switch (tag) {
      case 'VERDICT': out.verdict = parts[0]; break;
      case 'CONFIDENCE': out.confidence = parts[0].replace(/[^A-Za-z]/g, ''); break;
      case 'SUMMARY': out.summary = m[2].trim(); break;
      case 'FIRST_SIGNAL': out.firstSignal = { event: num(parts[0]), why: parts.slice(1).join(' | ') }; break;
      case 'NO_RETURN': out.noReturn = { event: num(parts[0]), why: parts.slice(1).join(' | ') }; break;
      case 'SAVE_WINDOW': out.saveWindow = m[2].trim(); break;
      case 'STATED': out.stated = m[2].trim(); break;
      case 'REAL': out.real = m[2].trim(); break;
      case 'MISSED': out.missed.push({ event: num(parts[0]), why: parts[1] || '', category: parts[2] || '' }); break;
      case 'PLAY': out.plays.push({ when: parts[0], what: parts.slice(1).join(' | ') }); break;
      case 'RULE': out.rules.push(m[2].trim()); break;
      case 'FLIP': out.flips.push(m[2].trim()); break;
      default: break;
    }
  }
  out.ok = Boolean(out.verdict && (out.firstSignal || out.summary));
  return out;
}
