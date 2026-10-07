// Found or Fumbled? shared logic.
// Everything here runs in the browser with no model: chunk parsing, the word and number
// matching signals, the rule-based "text lean", and parsing the model's tagged lines.

// ---------- the eight stages ----------
export const PIPE = [
  { key: 'kb', label: 'Knowledge base', short: 'Source' },
  { key: 'chunk', label: 'Chunking', short: 'Chunks' },
  { key: 'retrieve', label: 'Retrieval', short: 'Search' },
  { key: 'rank', label: 'Ranking', short: 'Rank' },
  { key: 'gen', label: 'Answer writing', short: 'Answer' }
];

export const STAGES = {
  GAP: {
    name: 'Knowledge gap', pipe: 'kb', band: 'Content', owner: 'Content',
    plain: 'The answer was never in the knowledge base, and the assistant answered anyway instead of saying it did not know.',
    fix: 'Add the missing content, and make sure the assistant says it does not know when nothing relevant comes back.'
  },
  STALE: {
    name: 'Stale or conflicting source', pipe: 'kb', band: 'Content', owner: 'Content',
    plain: 'An old or contradicting version of the document is still indexed, and the assistant used it.',
    fix: 'Remove or re-index the old version, and store a version or date on every chunk so the newest wins.'
  },
  CHUNK: {
    name: 'Split across chunks', pipe: 'chunk', band: 'Retrieval', owner: 'Search',
    plain: 'The right answer was cut in two when the document was split, so the assistant only saw half of it.',
    fix: 'Split documents along headings and lists rather than a fixed length, or add overlap between chunks.'
  },
  MISS: {
    name: 'Retrieval miss', pipe: 'retrieve', band: 'Retrieval', owner: 'Search',
    plain: 'The right content exists, but the search did not bring it back for this question.',
    fix: 'Test the question wording against the search, add keyword search alongside meaning-based search, or add the terms users actually type.'
  },
  RANK: {
    name: 'Ranked too low', pipe: 'rank', band: 'Retrieval', owner: 'Search',
    plain: 'The right chunk came back, but below chunks that pointed the answer the wrong way.',
    fix: 'Add a re-ranking step, or tighten filters so off-topic chunks drop out before the answer is written.'
  },
  IGNORED: {
    name: 'Ignored the context', pipe: 'gen', band: 'Answer', owner: 'Prompt',
    plain: 'A retrieved chunk held the right answer, and the assistant contradicted or skipped it.',
    fix: 'Tell the model to answer only from the chunks and quote the line it used. Test with the same chunks in a different order.'
  },
  INVENTED: {
    name: 'Invented detail', pipe: 'gen', band: 'Answer', owner: 'Prompt',
    plain: 'The answer adds numbers, conditions or promises that no chunk supports.',
    fix: 'Require every specific claim to come from a chunk, and give the assistant a clear way to say it does not know.'
  },
  REFUSAL: {
    name: 'Wrongly refused', pipe: 'gen', band: 'Answer', owner: 'Prompt',
    plain: 'A chunk held the answer, but the assistant deflected or said it could not help.',
    fix: 'Loosen refusal wording that is too broad, and add this question to the test set as one that must be answered.'
  }
};

export const CODES = Object.keys(STAGES);

// ---------- chunk parsing ----------
// Chunks are separated by a line containing only ---.
// An optional first line in square brackets carries metadata:
// [source: refund-policy.md | updated: 2026-07-01 | score: 0.82]
export function parseChunks(raw) {
  const blocks = String(raw || '')
    .split(/^\s*-{3,}\s*$/m)
    .map((b) => b.trim())
    .filter(Boolean);
  return blocks.slice(0, 12).map((b, i) => {
    const out = { id: `C${i + 1}`, source: '', updated: '', score: '', text: b };
    const m = b.match(/^\[([^\]]*)\]\s*\n?/);
    if (m) {
      out.text = b.slice(m[0].length).trim();
      for (const part of m[1].split('|')) {
        const [k, ...v] = part.split(':');
        const key = (k || '').trim().toLowerCase();
        const val = v.join(':').trim();
        if (/^(source|doc|document|file)$/.test(key)) out.source = val;
        else if (/^(updated|date|version|modified)$/.test(key)) out.updated = val;
        else if (/^(score|similarity|relevance)$/.test(key)) out.score = val;
      }
    }
    return out;
  });
}

// ---------- word and number matching ----------
const STOP = new Set(`about above after again against also been before being below between both cannot could does doing down during each from further have having here into itself just more most must only other over same should some such than that their them then there these they this those through under until very what when where which while will with would your yours you're please thank thanks hello yes need want know tell like make made more much many also within without can't don't isn't aren't `.split(/\s+/));

function norm(s) {
  return String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
}

export function numbersIn(s) {
  const found = norm(s).match(/\d+(?:[.,]\d+)?/g) || [];
  return [...new Set(found.map((n) => n.replace(',', '.').replace(/\.0+$/, '')))];
}

export function wordsIn(s) {
  const w = norm(s).match(/[a-z][a-z'-]{3,}/g) || [];
  return [...new Set(w.filter((x) => !STOP.has(x)).map((x) => x.replace(/(ies)$/, 'y').replace(/(s)$/, '')))];
}

function share(needles, hay) {
  if (!needles.length) return null;
  const h = new Set(hay);
  return needles.filter((n) => h.has(n)).length / needles.length;
}

function sentences(s) {
  return String(s || '').split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter((x) => x.length > 2);
}

function endsMidThought(text) {
  const t = String(text || '').trim();
  return /[:;,]$/.test(t) || /\b(and|or|the|following|include|including|except)$/i.test(t);
}

function parseDate(s) {
  const m = String(s || '').match(/(\d{4})-(\d{1,2})(?:-(\d{1,2}))?/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3] || 1)).getTime();
}

// Returns everything the browser can tell from the text alone.
export function computeSignals({ question, answer, expected, chunks, facts }) {
  const qWords = wordsIn(question);
  const expWords = wordsIn(expected);
  const expNums = numbersIn(expected);
  const ansNums = numbersIn(answer);
  const ansWords = wordsIn(answer);

  const perChunk = chunks.map((c, i) => {
    const w = wordsIn(c.text);
    const n = numbersIn(c.text);
    return {
      id: c.id,
      rank: i + 1,
      words: w,
      nums: n,
      question: share(qWords, w) ?? 0,
      expected: expected ? share([...expWords, ...expNums], [...w, ...n]) ?? 0 : null,
      cutOff: endsMidThought(c.text),
      date: parseDate(c.updated),
      source: c.source
    };
  });

  const allWords = perChunk.flatMap((c) => c.words);
  const allNums = new Set(perChunk.flatMap((c) => c.nums));

  const best = expected && perChunk.length
    ? perChunk.reduce((a, b) => (b.expected > a.expected ? b : a), perChunk[0])
    : null;
  const unionExpected = expected ? share([...expWords, ...expNums], [...allWords, ...allNums]) ?? 0 : null;

  const unsupportedNums = ansNums.filter((n) => !allNums.has(n));
  const expNumsFound = expNums.filter((n) => allNums.has(n));
  const expNumsMissingFromAnswer = expNumsFound.filter((n) => !ansNums.includes(n));
  const grounding = share(ansWords, allWords);

  // sentences in the answer with little overlap with any chunk
  const loose = sentences(answer).filter((s) => {
    const w = wordsIn(s);
    const n = numbersIn(s);
    if (w.length + n.length < 3) return false;
    const g = share([...w, ...n], [...allWords, ...allNums]);
    return g !== null && g < 0.5;
  });

  // same source indexed more than once with different dates
  const bySource = {};
  perChunk.forEach((c) => {
    if (!c.source) return;
    const k = norm(c.source).replace(/\.[a-z0-9]+$/, '').replace(/[-_ ]?(v\d+|old|new|\d{4}).*$/, '');
    (bySource[k] = bySource[k] || []).push(c);
  });
  const versionClash = Object.values(bySource).find((list) => new Set(list.map((c) => c.date).filter(Boolean)).size > 1) || null;

  const dated = perChunk.filter((c) => c.date);
  const newest = dated.length ? Math.max(...dated.map((c) => c.date)) : null;
  const olderTop = facts.changed === 'Yes' && dated.length > 1 && perChunk[0]?.date && perChunk[0].date < newest;

  return {
    perChunk, best, unionExpected, unsupportedNums, expNumsFound, expNumsMissingFromAnswer,
    grounding, loose, versionClash, olderTop, ansNums, hasExpected: !!String(expected || '').trim(),
    cutOffChunks: perChunk.filter((c) => c.cutOff).map((c) => c.id)
  };
}

const pc = (x) => `${Math.round((x || 0) * 100)}%`;

// Plain sentences sent to the model and shown in the app.
export function signalLines(s) {
  const out = [];
  if (s.hasExpected && s.best) {
    out.push(`Best match for the expected answer is ${s.best.id} (rank ${s.best.rank}), covering ${pc(s.best.expected)} of its words and numbers.`);
    out.push(`All chunks together cover ${pc(s.unionExpected)} of the expected answer.`);
  }
  if (s.unsupportedNums.length) out.push(`Numbers in the answer that appear in no chunk: ${s.unsupportedNums.join(', ')}.`);
  if (s.expNumsMissingFromAnswer.length) out.push(`Numbers from the expected answer that a chunk holds but the answer does not use: ${s.expNumsMissingFromAnswer.join(', ')}.`);
  if (s.grounding !== null) out.push(`${pc(s.grounding)} of the answer's key words appear somewhere in the chunks.`);
  if (s.loose.length) out.push(`${s.loose.length} answer sentence(s) share less than half their words with any chunk.`);
  if (s.cutOffChunks.length) out.push(`Chunk(s) that end mid-sentence or mid-list: ${s.cutOffChunks.join(', ')}.`);
  if (s.versionClash) out.push(`The same source appears with different dates: ${s.versionClash.map((c) => c.id).join(' and ')}.`);
  if (s.olderTop) out.push('The top-ranked chunk is older than another retrieved chunk, and the source changed recently.');
  return out;
}

// ---------- the text lean: fixed, printed rules ----------
export const LEAN_RULES = [
  { code: 'STALE', rule: 'The same source appears with two different dates, or the source changed recently and the top chunk is older than another retrieved chunk.' },
  { code: 'INVENTED', rule: 'The answer contains a number that appears in no chunk, and the chunks cover less than 60% of the expected answer (or no expected answer was given).' },
  { code: 'REFUSAL', rule: 'You ticked "Refused or deflected", and some chunk covers at least 60% of the expected answer.' },
  { code: 'GAP', rule: 'The chunks cover less than 35% of the expected answer and you ticked that the answer is not in the knowledge base.' },
  { code: 'MISS', rule: 'The chunks cover less than 35% of the expected answer and the answer is (or may be) in the knowledge base.' },
  { code: 'CHUNK', rule: 'The best chunk covers less than 60% on its own, but all chunks together cover 60% or more, or the best chunk ends mid-list.' },
  { code: 'RANK', rule: 'The best chunk covers 60% or more but sits at rank 3 or lower, below chunks that do not.' },
  { code: 'IGNORED', rule: 'The best chunk covers 60% or more, and a number it holds from the expected answer is missing from the answer.' }
];

export function textLean(s, facts) {
  const why = (code) => LEAN_RULES.find((r) => r.code === code).rule;
  if (s.versionClash || s.olderTop) return { code: 'STALE', why: why('STALE') };
  const lowCover = !s.hasExpected || (s.unionExpected ?? 0) < 0.6;
  if (s.unsupportedNums.length && lowCover) return { code: 'INVENTED', why: why('INVENTED') };
  if (!s.hasExpected || !s.best) return null;
  if (facts.symptom === 'Refused or deflected' && s.best.expected >= 0.6) return { code: 'REFUSAL', why: why('REFUSAL') };
  if (s.unionExpected < 0.35) {
    if (facts.inKb === 'No') return { code: 'GAP', why: why('GAP') };
    return { code: 'MISS', why: why('MISS') };
  }
  const bestCut = s.best.cutOff;
  if ((s.best.expected < 0.6 && s.unionExpected >= 0.6) || (bestCut && s.best.expected < 0.85)) return { code: 'CHUNK', why: why('CHUNK') };
  if (s.best.expected >= 0.6 && s.best.rank >= 3) return { code: 'RANK', why: why('RANK') };
  if (s.best.expected >= 0.6 && s.expNumsMissingFromAnswer.length) return { code: 'IGNORED', why: why('IGNORED') };
  return null;
}

// ---------- tagged model output ----------
function lines(text) {
  return String(text || '')
    .split('\n')
    .map((l) => l.trim().replace(/^[-*`\s]+/, '').replace(/`+$/, ''))
    .filter((l) => l.includes('|'))
    .map((l) => l.split('|').map((x) => x.trim()));
}

function code(s) {
  const c = String(s || '').toUpperCase().replace(/[^A-Z]/g, '');
  return CODES.includes(c) ? c : null;
}

export function parseDiagnosis(text) {
  const d = { verdict: null, why: '', also: [], claims: [], evidence: [], checks: [], fixes: [], flips: [], ticket: null };
  for (const p of lines(text)) {
    const tag = p[0].toUpperCase();
    if (tag === 'VERDICT' && code(p[1]) && !d.verdict) {
      const conf = /high/i.test(p[2]) ? 'High' : /low/i.test(p[2]) ? 'Low' : 'Medium';
      d.verdict = { code: code(p[1]), confidence: conf, line: p.slice(3).join(' ') };
    } else if (tag === 'WHY') d.why = p.slice(1).join(' ');
    else if (tag === 'ALSO' && code(p[1])) d.also.push({ code: code(p[1]), line: p.slice(2).join(' ') });
    else if (tag === 'CLAIM') {
      const st = /contra/i.test(p[2]) ? 'Contradicted' : /^supp/i.test(p[2] || '') ? 'Supported' : 'Unsupported';
      d.claims.push({ text: p[1], status: st, ref: p[3] || 'none' });
    } else if (tag === 'EVIDENCE') d.evidence.push({ ref: p[1], line: p.slice(2).join(' ') });
    else if (tag === 'CHECK') d.checks.push({ step: p[1], confirms: p.slice(2).join(' ') });
    else if (tag === 'FIX') d.fixes.push({ owner: p[1], line: p.slice(2).join(' ') });
    else if (tag === 'FLIP') d.flips.push(p.slice(1).join(' '));
    else if (tag === 'TICKET' && !d.ticket) d.ticket = { title: p[1], body: p.slice(2).join(' ') };
  }
  return d;
}

export function agreement(lean, diag) {
  if (!diag?.verdict) return null;
  if (!lean) return { tone: 'neutral', label: 'No text lean to compare', line: 'The word and number checks did not point to one stage, so the model verdict stands alone. Run the checks before acting on it.' };
  if (lean.code === diag.verdict.code) return { tone: 'good', label: 'Text checks agree', line: 'The fixed rules and the model point to the same stage.' };
  if (diag.also.some((a) => a.code === lean.code)) return { tone: 'warn', label: 'Partly agree', line: `The rules point to ${STAGES[lean.code].name.toLowerCase()}, which the model lists as a second cause.` };
  return { tone: 'bad', label: 'Text checks disagree', line: `The rules point to ${STAGES[lean.code].name.toLowerCase()}. Run the cheap checks before trusting either reading.` };
}
