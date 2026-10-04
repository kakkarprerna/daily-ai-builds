// Deterministic layer. These rules run in the browser, before and after the model,
// so the safety-critical parts never depend on what a model decides to say.

const URGENT_TERMS = [
  'seizure', 'fit ', 'fitting', 'convuls', 'not breathing', 'stopped breathing',
  'struggling to breathe', 'turning blue', 'blue lips', 'unresponsive', 'floppy',
  'won\'t wake', 'will not wake', 'hard to wake', 'non-blanching', 'rash that doesn\'t fade',
  'swallowed', 'poison', 'head injury', 'fell on his head', 'fell on her head',
];

export function urgentScan(text = '') {
  const t = ` ${text.toLowerCase()} `;
  return URGENT_TERMS.some((w) => t.includes(w));
}

export const EMERGENCY_NUMBERS = {
  Spain: '112',
  UK: '999 (or 111 if it is not an emergency)',
  US: '911',
  Other: 'your local emergency number',
};

export const WHO_TO_ASK = {
  Spain: [
    'Your pediatra or enfermera de pediatría at the centro de salud. The routine revisiones del niño sano are a good moment to raise it.',
    'For children under 6, ask whether a referral to atención temprana (the regional early support service, often a CDIAT) makes sense.',
  ],
  UK: [
    'Your health visitor for children under 5, or your GP at any age.',
    'For school-age children, the school nurse or SENCo can also help.',
  ],
  US: [
    'Your child\'s pediatrician. Ask for a developmental screening if one is not already due.',
    'Under 3s can be evaluated for free through your state\'s Early Intervention programme, without a referral.',
  ],
  Other: [
    'Your family doctor or paediatrician.',
    'Ask whether your area has an early support or child development service.',
  ],
};

export function parseResult(text = '') {
  const out = {
    verdict: '', confidence: '', summary: '', range: '',
    says: [], why: [], tryList: [], watch: [], check: [], ask: [], limits: [],
  };
  const map = { WHY: 'why', TRY: 'tryList', WATCH: 'watch', CHECK: 'check', ASK: 'ask', LIMIT: 'limits' };
  for (const raw of text.split('\n')) {
    const line = raw.replace(/^[\s*\-•]+/, '').trim();
    const m = line.match(/^([A-Z]+)\s*:\s*(.+)$/);
    if (!m) continue;
    const [, tag, val] = m;
    if (tag === 'VERDICT') out.verdict = val.trim();
    else if (tag === 'CONFIDENCE') out.confidence = val.trim();
    else if (tag === 'SUMMARY') out.summary = val.trim();
    else if (tag === 'RANGE') out.range = val.trim();
    else if (tag === 'SAYS') {
      const [body, ...rest] = val.split('|');
      out.says.push({ body: body.trim(), text: rest.join('|').trim() || body.trim() });
    } else if (map[tag]) out[map[tag]].push(val.trim());
  }
  out.verdict = normaliseVerdict(out.verdict);
  return out;
}

function normaliseVerdict(v) {
  const s = v.toLowerCase();
  if (s.includes('check') || s.includes('professional')) return 'Check with a professional';
  if (s.includes('watch')) return 'Worth watching';
  if (s.includes('typical')) return 'Typical';
  return v || 'Worth watching';
}

// Applied after the model replies. Loss of a skill always means "check", whatever the model said.
export function applyOverrides(result, form) {
  const r = { ...result, overridden: false };
  if (form.regression && r.verdict !== 'Check with a professional') {
    r.verdict = 'Check with a professional';
    r.overridden = true;
  }
  if (form.regression) {
    const note = 'Every body listed here treats losing a skill a child once had as a reason to see a professional soon, whatever the age.';
    if (!r.check.includes(note)) r.check = [note, ...r.check];
  }
  return r;
}
