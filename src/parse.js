// Parses the tagged-line format the model returns.
// Tagged lines (not JSON) keep the output readable and make provider swaps cheap.

export function parseDiagnosis(text = '') {
  const out = {
    verdict: '',
    confidence: '',
    summary: '',
    drift: [],
    checks: [],
    ruledOut: [],
    handover: [],
    flip: '',
  };

  for (const raw of text.split('\n')) {
    const m = raw.match(/^\s*[-*]?\s*\**([A-Z_]+)\**\s*:\s*(.+)$/);
    if (!m) continue;
    const tag = m[1].toUpperCase();
    const val = m[2].trim();
    const parts = val.split('|').map((s) => s.trim());

    switch (tag) {
      case 'VERDICT':
        out.verdict = normaliseCategory(val);
        break;
      case 'CONFIDENCE':
        out.confidence = normaliseLevel(val);
        break;
      case 'SUMMARY':
        out.summary = val;
        break;
      case 'DRIFT':
        if (parts.length >= 3)
          out.drift.push({ category: normaliseCategory(parts[0]), level: normaliseLevel(parts[1]), why: parts.slice(2).join(' | ') });
        break;
      case 'CHECK':
        if (parts.length >= 2)
          out.checks.push({ title: parts[0], how: parts[1], means: parts.slice(2).join(' | ') });
        break;
      case 'RULED_OUT':
        if (parts.length >= 2) out.ruledOut.push({ category: normaliseCategory(parts[0]), why: parts.slice(1).join(' | ') });
        break;
      case 'HANDOVER':
        out.handover.push(val);
        break;
      case 'FLIP':
        out.flip = val;
        break;
      default:
        break;
    }
  }
  return out;
}

export const CATEGORIES = ['Configuration', 'Data', 'Permissions', 'Caching', 'Version', 'Infrastructure', 'Third-party', 'Unclear'];

function normaliseCategory(v = '') {
  const s = v.toLowerCase();
  if (s.startsWith('config')) return 'Configuration';
  if (s.startsWith('data')) return 'Data';
  if (s.startsWith('perm')) return 'Permissions';
  if (s.startsWith('cach')) return 'Caching';
  if (s.startsWith('vers')) return 'Version';
  if (s.startsWith('infra')) return 'Infrastructure';
  if (s.startsWith('third') || s.includes('vendor')) return 'Third-party';
  if (s.startsWith('unclear')) return 'Unclear';
  return v.trim();
}

function normaliseLevel(v = '') {
  const s = v.toLowerCase();
  if (s.startsWith('high')) return 'High';
  if (s.startsWith('med')) return 'Medium';
  if (s.startsWith('low')) return 'Low';
  return v.trim();
}
