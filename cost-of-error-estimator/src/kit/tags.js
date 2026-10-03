// Reads tagged-line model output ("TAG: a | b | c"). Tolerant of bullets,
// bold markers and stray whitespace a model might add. A malformed line is
// skipped rather than breaking the whole result.
export function tagLines(text) {
  const out = [];
  for (const raw of (text || '').split('\n')) {
    const line = raw.replace(/^[\s*\-•>#]+/, '').replace(/\*\*/g, '').trim();
    const m = line.match(/^([A-Z][A-Z_ ]{1,24}?)\s*[:|]\s*(.*)$/);
    if (!m) continue;
    const tag = m[1].trim().replace(/\s+/g, '_');
    const rest = m[2].trim();
    out.push({ tag, rest, parts: rest.split('|').map((s) => s.trim()) });
  }
  return out;
}

// Case-insensitive match of an allowed label at the start of a value.
export function pick(value, allowed, fallback) {
  const v = (value || '').toLowerCase();
  return allowed.find((a) => v.startsWith(a.toLowerCase())) || fallback;
}

export function num(value, lo = 0, hi = 100) {
  const n = parseFloat(String(value || '').replace(/[^\d.\-]/g, ''));
  if (!Number.isFinite(n)) return null;
  return Math.max(lo, Math.min(hi, n));
}

export const unquote = (s) => (s || '').trim().replace(/^["“'‘]+|["”'’]+$/g, '').trim();
