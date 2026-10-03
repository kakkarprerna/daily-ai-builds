import { tagLines, pick, unquote } from './kit/tags.js';

export const PENALTY = 15;
export const FACT_STATES = ['Carried', 'Partial', 'Missing'];

export const BANDS = [
  { from: 0, to: 50, cls: 'bad', label: 'Broken handoff', line: 'The customer will have to start again with the human agent.' },
  { from: 50, to: 80, cls: 'warn', label: 'Needs a skim', line: 'Usable, but the human should read the transcript before replying.' },
  { from: 80, to: 100, cls: 'ok', label: 'Clean handoff', line: 'The human agent can pick this up and reply straight away.' },
];

export const bandFor = (s) => (s == null ? null : BANDS.find((b) => s < b.to) || BANDS[BANDS.length - 1]);

// Context transfer = carried facts plus half credit for partial ones, as a
// share of everything the human needed. Each repeated question costs a fixed
// 15 points, because it is the moment the customer notices the AI wasn't listening.
export function parseScore(text) {
  const r = { facts: [], repeats: [], timing: null, urgency: null, summary: '', fixes: [], note: [] };
  for (const { tag, parts, rest } of tagLines(text)) {
    if (tag === 'FACT' && parts.length >= 2) r.facts.push({ state: pick(parts[0], FACT_STATES, 'Missing'), fact: parts[1], detail: parts.slice(2).join(' | ') });
    else if (tag === 'REDUNDANT' && parts[0]) r.repeats.push({ quote: unquote(parts[0]), already: parts.slice(1).join(' | ') });
    else if (tag === 'TIMING') r.timing = { label: pick(parts[0], ['Early', 'Appropriate', 'Late'], 'Appropriate'), why: parts.slice(1).join(' | ') };
    else if (tag === 'URGENCY') r.urgency = { label: pick(parts[0], ['Flagged', 'Not flagged', 'None to flag'], 'None to flag'), why: parts.slice(1).join(' | ') };
    else if (tag === 'SUMMARY') r.summary = rest;
    else if (tag === 'FIX' && rest) r.fixes.push(rest);
    else if (tag === 'NOTE' && rest) r.note.push(rest);
  }
  const n = r.facts.length;
  const carried = r.facts.filter((f) => f.state === 'Carried').length;
  const partial = r.facts.filter((f) => f.state === 'Partial').length;
  r.carried = carried;
  r.partial = partial;
  r.missing = n - carried - partial;
  r.context = n ? Math.round(((carried + partial * 0.5) / n) * 100) : null;
  r.score = r.context == null ? null : Math.max(0, r.context - r.repeats.length * PENALTY);
  r.band = bandFor(r.score);
  r.ok = r.score != null;
  return r;
}
