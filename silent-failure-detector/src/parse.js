import { tagLines, pick, num, unquote } from './kit/tags.js';

export const STATUSES = ['Verified', 'Plausible', 'Unverifiable', 'Fabrication risk'];

// Score = how assertive the wording is, multiplied by how much of it cannot
// be backed up. Confident and checkable is fine; confident and uncheckable is
// the risk; hedged and uncheckable is lower risk because it is flagged.
export const BANDS = [
  { from: 0, to: 26, cls: 'ok', label: 'Safe to serve', line: 'The tone matches the evidence. This can go out without review.' },
  { from: 26, to: 56, cls: 'warn', label: 'Spot-check', line: 'Some claims are stated more firmly than they can be backed up. Check them or add sources first.' },
  { from: 56, to: 100, cls: 'bad', label: 'Route to a human', line: 'It sounds certain about things that cannot be confirmed. A person should review it before anyone relies on it.' },
];

export const bandFor = (score) => (score == null ? null : BANDS.find((b) => score < b.to) || BANDS[BANDS.length - 1]);

export function parseAudit(text) {
  const r = { confidence: null, tone: '', verifiability: null, claims: [], hedges: [], summary: '', fixes: [] };
  for (const { tag, parts, rest } of tagLines(text)) {
    if (tag === 'CONFIDENCE') {
      r.confidence = num(parts[0]);
      r.tone = parts.slice(1).join(' | ');
    } else if (tag === 'VERIFIABILITY') r.verifiability = num(parts[0]);
    else if (tag === 'CLAIM' && parts.length >= 2) {
      r.claims.push({ status: pick(parts[0], STATUSES, 'Unverifiable'), quote: unquote(parts[1]), check: parts.slice(2).join(' | ') });
    } else if (tag === 'HEDGE' && rest) r.hedges.push(unquote(rest));
    else if (tag === 'SUMMARY') r.summary = rest;
    else if (tag === 'FIX' && rest) r.fixes.push(rest);
  }
  // If the model skipped the verifiability line, derive it from the claims.
  if (r.verifiability == null && r.claims.length) {
    const good = r.claims.filter((c) => c.status === 'Verified' || c.status === 'Plausible').length;
    r.verifiability = Math.round((good / r.claims.length) * 100);
  }
  if (r.verifiability == null && r.confidence != null) r.verifiability = 100;
  r.score = r.confidence != null && r.verifiability != null ? Math.round((r.confidence / 100) * (100 - r.verifiability)) : null;
  r.band = bandFor(r.score);
  r.ok = r.score != null;
  return r;
}

// Browser-only tone scan. No model involved: just counts wording that
// signals doubt or certainty, so the confidence rating has a visible check.
const HEDGE_WORDS = ['may', 'might', 'could', 'possibly', 'likely', 'approximately', 'roughly', 'around', 'i think', 'i believe', 'not sure', "i don't have", "i don't know", 'unclear', 'it depends', 'estimate', 'reportedly', 'as far as i know', 'worth checking', 'i cannot confirm', "can't confirm"];
const SURE_WORDS = ['definitely', 'always', 'never', 'certainly', 'guaranteed', 'exactly', 'proven', 'the largest', 'the first', 'the only', 'undoubtedly', 'clearly', 'without doubt', '100%'];

function findAll(text, words) {
  const lower = ` ${(text || '').toLowerCase()} `;
  return words.filter((w) => new RegExp(`(^|[^a-z])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`).test(lower));
}

export function toneScan(text) {
  return { hedges: findAll(text, HEDGE_WORDS), sure: findAll(text, SURE_WORDS), figures: ((text || '').match(/\d[\d.,%]*/g) || []).length };
}
