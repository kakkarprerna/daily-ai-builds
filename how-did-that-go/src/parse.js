// Parses the model's tagged-line reply into a structured debrief.
// Tolerant of stray bullets, numbering, markdown bold and extra spaces.

export function parseDebrief(text) {
  const out = {
    read: null,
    strengths: [],
    questions: {},
    patterns: [],
    fixes: [],
    note: [],
    next: [],
    limits: [],
  };
  const lines = String(text || '').split(/\r?\n/);
  for (let raw of lines) {
    let line = raw.trim().replace(/^[-*•\d.)\s]+(?=[A-Z])/, '').replace(/\*\*/g, '');
    if (!line.includes('|')) continue;
    const parts = line.split('|').map((s) => s.trim());
    const tag = parts[0].toUpperCase();
    if (tag === 'READ') {
      out.read = { label: norm(parts[1], ['Strong', 'Mixed', 'Needs work'], 'Mixed'), confidence: parts[2] || '', summary: parts.slice(3).join(' | ') };
    } else if (tag === 'STRENGTH') out.strengths.push(parts.slice(1).join(' | '));
    else if (tag === 'Q') {
      const n = parseInt(parts[1], 10);
      if (!n) continue;
      const kind = (parts[2] || '').toUpperCase();
      const q = (out.questions[n] = out.questions[n] || {});
      if (kind === 'PROBE') q.probe = parts.slice(3).join(' | ');
      else if (kind === 'LANDED') {
        q.landed = norm(parts[3], ['Landed', 'Partly', 'Missed'], 'Partly');
        q.landedWhy = parts.slice(4).join(' | ');
      } else if (kind === 'GAP') q.gap = parts.slice(3).join(' | ');
      else if (kind === 'BETTER') q.better = parts.slice(3).join(' | ');
    } else if (tag === 'PATTERN') out.patterns.push(parts.slice(1).join(' | '));
    else if (tag === 'FIX') out.fixes.push({ title: parts[1] || '', detail: parts.slice(2).join(' | ') });
    else if (tag === 'NOTE') out.note.push(parts.slice(1).join(' | '));
    else if (tag === 'NEXT') out.next.push(parts.slice(1).join(' | '));
    else if (tag === 'LIMIT') out.limits.push(parts.slice(1).join(' | '));
  }
  return out;
}

function norm(v, options, fallback) {
  const s = String(v || '').toLowerCase();
  const hit = options.find((o) => s.startsWith(o.toLowerCase()));
  return hit || fallback;
}

export function isUsable(d) {
  return d && d.read && Object.keys(d.questions).length > 0;
}
