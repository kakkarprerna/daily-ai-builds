// What It Counts rules. Everything that decides the verdict lives here and is printed in How it works.
// Pattern checks (D1 to D12) read the query itself, in the browser, before any model call.
// The model only explains the query in plain words and may raise traps from a fixed list, each tied to an
// exact piece of the query. That piece is searched for in the query, and a trap whose piece is missing
// does not count. Severity, the verdict, the checks to run and the message to the analyst all come from here.

export const DIALECTS = ['PostgreSQL', 'BigQuery', 'Snowflake', 'MySQL', 'SQL Server', 'Not sure'];
export const USES = ['Just understanding it', 'Weekly metrics', 'A decision', 'Board or investor deck'];
export const STRICT_USES = ['A decision', 'Board or investor deck'];
export const MATCHES = ['Matches', 'Partly', 'Does not match'];
export const SEV_ORDER = { High: 3, Medium: 2, Low: 1 };

// The fixed list of traps. The model must pick from these names.
export const TRAPS = {
  'Double counting': {
    sev: 'High',
    plain: 'The same thing is counted or added more than once, usually because a join repeats rows.',
    check: 'Run the query with COUNT(*) before the join and after it. If the number rises, rows are being repeated.',
    ask: 'Can one row on the left match several rows in the table joined here? If so, is the total repeated for each match?',
    caveat: 'may include repeated rows from a join'
  },
  'Rows dropped': {
    sev: 'High',
    plain: 'Rows you expect in the answer are quietly left out by a join, a filter or a limit.',
    check: 'Count the rows with and without this line. The gap is what the number leaves out.',
    ask: 'Should rows with no match, or beyond this cut-off, still be counted?',
    caveat: 'may leave out some rows'
  },
  'Null trap': {
    sev: 'High',
    plain: 'Empty values make a comparison quietly fail, so rows vanish or the whole filter keeps nothing.',
    check: 'Count how many rows have an empty value in the column this line compares.',
    ask: 'Can this column be empty? If it can, what should happen to those rows?',
    caveat: 'may be affected by empty values'
  },
  'Rows not people': {
    sev: 'High',
    plain: 'The question is about people or accounts, but the query counts rows such as sessions, events or orders.',
    check: 'Swap COUNT(*) for COUNT(DISTINCT the id of the thing you mean) and compare the two numbers.',
    ask: 'Does each row here stand for one customer, or can one customer have many rows?',
    caveat: 'counts rows rather than people'
  },
  'Integer division': {
    sev: 'High',
    plain: 'Two whole numbers are divided, and some databases throw away the decimals, so a share can come out as 0.',
    check: 'Multiply the top by 1.0 before dividing and see whether the answer changes.',
    ask: 'Does this division return a decimal in our database, or does it round down to a whole number?',
    caveat: 'may be rounded down by whole-number division'
  },
  'Wrong average': {
    sev: 'Medium',
    plain: 'An average of averages or of percentages gives every group equal weight, however big it is.',
    check: 'Work out the total of the top divided by the total of the bottom, and compare it with this average.',
    ask: 'Should every group count equally here, or should bigger groups weigh more?',
    caveat: 'is an average of group rates, not an overall rate'
  },
  'Date edge': {
    sev: 'Medium',
    plain: 'The date range stops at midnight at the start of the last day, so anything later that day is left out.',
    check: 'Count rows on the last day of the range with and without the time part. Any difference is lost.',
    ask: 'Does this column hold a time as well as a date? If it does, should the last day be included in full?',
    caveat: 'may leave out part of the last day'
  },
  'Hardcoded filter': {
    sev: 'Medium',
    plain: 'Specific IDs or labels are typed into the query, with no record of why. Lists like this go stale.',
    check: 'Ask where the list came from and when it was last checked.',
    ask: 'What are these values, and who keeps the list up to date?',
    caveat: 'excludes a fixed list of records'
  },
  'AND/OR order': {
    sev: 'Medium',
    plain: 'SQL reads every AND before any OR, so without brackets an OR can let rows skip the other filters.',
    check: 'Put brackets around the OR part and see whether the number changes.',
    ask: 'Was the OR meant to apply only to its own pair of conditions?',
    caveat: 'depends on how AND and OR combine'
  },
  'Time zone': {
    sev: 'Low',
    plain: 'Times are cut into days in the database time zone, usually UTC, not where your customers are.',
    check: 'Count one day both ways, in UTC and in local time, and compare.',
    ask: 'Which time zone are these times stored in, and which one should days follow?',
    caveat: 'uses days in the database time zone'
  },
  'Unstable result': {
    sev: 'Low',
    plain: 'Rows are cut to a number without a fixed order, so running it twice can give different rows.',
    check: 'Run it twice and compare, or add an ORDER BY.',
    ask: 'Which rows should come first when the result is cut down?',
    caveat: 'may pick different rows on each run'
  }
};
export const TRAP_NAMES = Object.keys(TRAPS);

export const PEOPLE_WORDS = /\b(customers?|users?|people|accounts?|clients?|members?|patients?|buyers?|subscribers?|shoppers?|visitors?|shops?|merchants?|sellers?|hosts?|guests?)\b/i;

export const RULES = [
  { id: 'D1', text: 'A SUM, COUNT or AVG taken after a JOIN is flagged as possible double counting (Medium). It becomes High if the model also finds repeated rows.' },
  { id: 'D2', text: 'A LEFT JOIN whose table is then filtered in WHERE, other than with IS NULL, quietly drops rows with no match (High).' },
  { id: 'D3', text: 'NOT IN followed by a sub-query keeps nothing if the sub-query returns a single empty value (High).' },
  { id: 'D4', text: '= NULL or <> NULL is never true. IS NULL is needed (High).' },
  { id: 'D5', text: 'BETWEEN or <= ending on a plain date drops everything after midnight on the last day if the column holds times (Medium).' },
  { id: 'D6', text: 'COUNT(*) or COUNT(1), with no COUNT(DISTINCT, when your question asks about customers, users, accounts or similar (High).' },
  { id: 'D7', text: 'AVG of a rate, share or percentage column, or AVG of a division, gives every group equal weight (Medium).' },
  { id: 'D8', text: 'LIMIT or TOP with no ORDER BY can return different rows on each run (Low).' },
  { id: 'D9', text: 'IN or NOT IN with three or more typed values, or a filter excluding a test, demo or internal label (Medium).' },
  { id: 'D10', text: 'COUNT divided by COUNT with no decimal cast, in PostgreSQL, SQL Server or an unknown database, rounds down to a whole number (High).' },
  { id: 'D11', text: 'DATE(), ::date or DATE_TRUNC with no time zone conversion cuts days in the database time zone (Low).' },
  { id: 'D12', text: 'AND and OR mixed in one WHERE without brackets around the OR (Medium).' },
  { id: 'M1', text: 'Every step and trap the model gives quotes a piece of the query. It is searched for, ignoring case and spacing. A trap whose piece is not found does not count.' },
  { id: 'M2', text: 'A trap raised by both a pattern check and the model is marked as agreed, at the higher severity.' },
  { id: 'V1', text: 'If the model says the query does not answer your question: Answers a different question.' },
  { id: 'V2', text: 'Any High trap: Check before quoting.' },
  { id: 'V3', text: 'Any Medium trap, or the model says it only partly answers the question: Quote with a caveat. For a decision or a board deck, this becomes Check before quoting.' },
  { id: 'V4', text: 'Only Low traps or none: No known traps in the text. The tables can still hold surprises.' }
];

export const VERDICTS = {
  different: { label: 'Answers a different question', short: 'Different question', tone: 'bad', line: 'Before checking the details, the query measures something other than what you asked.' },
  check: { label: 'Check before quoting', short: 'Check first', tone: 'bad', line: 'At least one trap could move the number a lot. Run the checks or ask the analyst before using it.' },
  caveat: { label: 'Quote with a caveat', short: 'Caveat', tone: 'warn', line: 'Usable, as long as the caveat travels with the number.' },
  safe: { label: 'No known traps in the text', short: 'No known traps', tone: 'ok', line: 'Nothing in the query text matches a known trap. That does not prove the tables hold what you expect.' }
};

/* ---------- Reading the query ---------- */

// Blanks out comments and the inside of string literals, keeping every character position,
// so pattern checks never match text inside a comment or a quoted label.
export function mask(sql) {
  const s = String(sql || '');
  let out = '';
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    const n = s[i + 1];
    if (c === '-' && n === '-') {
      while (i < s.length && s[i] !== '\n') { out += ' '; i += 1; }
    } else if (c === '/' && n === '*') {
      const end = s.indexOf('*/', i + 2);
      const stop = end === -1 ? s.length : end + 2;
      for (; i < stop; i += 1) out += s[i] === '\n' ? '\n' : ' ';
    } else if (c === "'") {
      out += "'";
      i += 1;
      while (i < s.length) {
        if (s[i] === "'" && s[i + 1] === "'") { out += '  '; i += 2; continue; }
        if (s[i] === "'") break;
        out += s[i] === '\n' ? '\n' : ' ';
        i += 1;
      }
      if (i < s.length) { out += "'"; i += 1; }
    } else {
      out += c;
      i += 1;
    }
  }
  return out;
}

const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Finds a quoted piece of the query, ignoring case and spacing. Returns [start, end] or null.
export function locate(snippet, sql) {
  let s = String(snippet || '').trim();
  if (/^".*"$/.test(s) && s.length > 2) s = s.slice(1, -1);
  const parts = s.split(/\s+/).filter(Boolean);
  if (!parts.length || parts.join('').length < 3) return null;
  try {
    const re = new RegExp(parts.map(esc).join('\\s+'), 'i');
    const m = re.exec(String(sql || ''));
    return m ? [m.index, m.index + m[0].length] : null;
  } catch {
    return null;
  }
}

function lineAt(sql, idx) {
  const start = sql.lastIndexOf('\n', idx - 1) + 1;
  let end = sql.indexOf('\n', idx);
  if (end === -1) end = sql.length;
  return [start, end];
}

function trimRange(sql, [a, b]) {
  while (a < b && /\s/.test(sql[a])) a += 1;
  while (b > a && /[\s,;]/.test(sql[b - 1])) b -= 1;
  return [a, b];
}

// The text of each WHERE clause, up to the next clause keyword.
function whereClauses(m) {
  const out = [];
  const re = /\bWHERE\b/gi;
  let hit;
  while ((hit = re.exec(m))) {
    const from = hit.index + hit[0].length;
    const rest = m.slice(from);
    const stop = rest.search(/\b(GROUP\s+BY|ORDER\s+BY|HAVING|LIMIT|QUALIFY|UNION|WINDOW)\b|;/i);
    // Stop at a closing bracket that ends the sub-query this WHERE sits in.
    let depth = 0;
    let close = -1;
    for (let k = 0; k < rest.length; k += 1) {
      if (rest[k] === '(') depth += 1;
      else if (rest[k] === ')') {
        if (depth === 0) { close = k; break; }
        depth -= 1;
      }
    }
    const ends = [stop, close].filter((x) => x >= 0);
    const len = ends.length ? Math.min(...ends) : rest.length;
    out.push({ start: from, end: from + len });
  }
  return out;
}

// Balanced brackets starting at an opening bracket.
function balanced(m, open) {
  let depth = 0;
  for (let k = open; k < m.length; k += 1) {
    if (m[k] === '(') depth += 1;
    else if (m[k] === ')') {
      depth -= 1;
      if (depth === 0) return k;
    }
  }
  return m.length - 1;
}

const KEYWORDS = /^(ON|USING|WHERE|LEFT|RIGHT|INNER|FULL|JOIN|GROUP|ORDER|AND|OR|AS|CROSS|OUTER|LIMIT|HAVING)$/i;

/* ---------- Pattern checks ---------- */

export function runRules({ query, question = '', dialect = 'Not sure' }) {
  const sql = String(query || '');
  const m = mask(sql);
  const hits = [];
  const add = (id, type, range, note, sev) => {
    const r = trimRange(sql, range);
    if (r[1] <= r[0]) return;
    hits.push({ id, type, sev: sev || TRAPS[type].sev, start: r[0], end: r[1], snippet: sql.slice(r[0], r[1]), note });
  };
  const has = (re) => re.test(m);
  if (!sql.trim()) return hits;

  // D1 aggregate after a join
  const joinRe = /\b(?:(?:LEFT|RIGHT|INNER|FULL|CROSS)\s+)?(?:OUTER\s+)?JOIN\b/gi;
  const firstJoin = joinRe.exec(m);
  const sumOrAvg = has(/\b(SUM|AVG)\s*\(/i);
  const plainCount = has(/\bCOUNT\s*\(\s*(?!DISTINCT\b)/i);
  if (firstJoin && (sumOrAvg || plainCount)) {
    add('D1', 'Double counting', lineAt(sql, firstJoin.index).map((x, k) => (k === 0 ? Math.max(x, firstJoin.index) : x)),
      'A total is taken after this join. If the joined table has several rows for one row on the left, each is counted again.', 'Medium');
  }

  // D2 LEFT JOIN then filtered in WHERE
  const leftRe = /\bLEFT\s+(?:OUTER\s+)?JOIN\s+([`"\w.\-]+)(?:\s+(?:AS\s+)?([A-Za-z_]\w*))?/gi;
  const wheres = whereClauses(m);
  let lj;
  while ((lj = leftRe.exec(m))) {
    const table = lj[1].replace(/[`"]/g, '');
    const alias = lj[2] && !KEYWORDS.test(lj[2]) ? lj[2] : table.split('.').pop();
    const after = wheres.filter((w) => w.start > lj.index);
    for (const w of after) {
      const clause = m.slice(w.start, w.end);
      const colRe = new RegExp(`\\b${esc(alias)}\\.\\w+\\s*(?!IS\\s+NULL\\b)(=|<>|!=|>=|<=|>|<|IN\\b|NOT\\s+IN\\b|LIKE\\b|ILIKE\\b|BETWEEN\\b|IS\\s+NOT\\s+NULL\\b)`, 'i');
      const c = colRe.exec(clause);
      if (c) {
        const at = w.start + c.index;
        const [ls, le] = lineAt(sql, at);
        const tail = m.slice(at, le).replace(/\bBETWEEN\b[\s\S]*?\bAND\b/i, (x) => x.replace(/AND$/i, '___'));
        const cut = tail.search(/\s+(AND|OR)\s+/i);
        add('D2', 'Rows dropped', [at, cut > 0 ? at + cut : le],
          `${alias} is LEFT JOINed, then filtered here. Rows with no match have empty values and fail this filter, so the LEFT JOIN acts like a plain JOIN.`);
        void ls;
        break;
      }
    }
  }

  // D3 NOT IN sub-query
  const notInSub = /\bNOT\s+IN\s*\(\s*SELECT\b/gi;
  let ni;
  while ((ni = notInSub.exec(m))) {
    const open = m.indexOf('(', ni.index);
    const close = balanced(m, open);
    add('D3', 'Null trap', [ni.index, close + 1], 'If the sub-query returns even one empty value, NOT IN keeps no rows at all.');
  }

  // D4 = NULL
  const eqNull = /(=|<>|!=)\s*NULL\b/gi;
  let en;
  while ((en = eqNull.exec(m))) {
    const before = m.slice(Math.max(0, en.index - 40), en.index);
    const col = /([\w.]+)\s*$/.exec(before);
    const start = col ? en.index - col[0].length : en.index;
    add('D4', 'Null trap', [start, en.index + en[0].length], 'Comparing with NULL using = or <> is never true. Use IS NULL or IS NOT NULL.');
  }

  // D5 date edge
  const between = /\bBETWEEN\s+(?:(?:DATE|TIMESTAMP)\s+)?'[^']*'\s+AND\s+(?:(?:DATE|TIMESTAMP)\s+)?'[^']*'/gi;
  let bt;
  while ((bt = between.exec(m))) {
    const orig = sql.slice(bt.index, bt.index + bt[0].length);
    const end = /AND\s+(?:(?:DATE|TIMESTAMP)\s+)?'(\d{4}-\d{2}-\d{2})'\s*$/i.exec(orig);
    if (end) add('D5', 'Date edge', [bt.index, bt.index + bt[0].length], `The range ends at midnight at the start of ${end[1]}. Rows later that day are left out if the column holds times.`);
  }
  const lte = /<=\s*(?:(?:DATE|TIMESTAMP)\s+)?'[^']*'/gi;
  let le;
  while ((le = lte.exec(m))) {
    const orig = sql.slice(le.index, le.index + le[0].length);
    const d = /'(\d{4}-\d{2}-\d{2})'$/.exec(orig);
    if (!d) continue;
    const before = m.slice(Math.max(0, le.index - 40), le.index);
    const col = /([\w.]+)\s*$/.exec(before);
    const start = col ? le.index - col[0].length : le.index;
    add('D5', 'Date edge', [start, le.index + le[0].length], `This keeps rows up to midnight at the start of ${d[1]}, not the whole day, if the column holds times.`);
  }

  // D6 rows, not people
  if (PEOPLE_WORDS.test(question) && !has(/\bCOUNT\s*\(\s*DISTINCT\b/i)) {
    const c = /\bCOUNT\s*\(\s*(\*|1)\s*\)/i.exec(m);
    if (c) {
      const word = PEOPLE_WORDS.exec(question)[0].toLowerCase();
      add('D6', 'Rows not people', [c.index, c.index + c[0].length], `Your question is about ${word}, but this counts rows. One ${word.replace(/s$/, '')} with many rows is counted many times.`);
    }
  }

  // D7 average of rates or of a division
  const avgRe = /\bAVG\s*\(/gi;
  let av;
  while ((av = avgRe.exec(m))) {
    const open = m.indexOf('(', av.index);
    const close = balanced(m, open);
    const inner = m.slice(open + 1, close);
    if (/\//.test(inner) || /(rate|pct|percent|ratio|share|conversion|avg|average)\w*\s*$/i.test(inner.trim())) {
      add('D7', 'Wrong average', [av.index, close + 1], 'This averages rates or shares, so a small group weighs as much as a big one.');
    }
  }

  // D8 LIMIT or TOP with no ORDER BY
  const lim = /\bLIMIT\s+\d+|\bTOP\s*\(?\s*\d+\s*\)?/i.exec(m);
  if (lim && !has(/\bORDER\s+BY\b/i)) add('D8', 'Unstable result', [lim.index, lim.index + lim[0].length], 'Rows are cut with no ORDER BY, so which rows you get can change between runs.');

  // D9 typed lists and test labels
  const inList = /\b(?:NOT\s+)?IN\s*\(/gi;
  let il;
  while ((il = inList.exec(m))) {
    const open = m.indexOf('(', il.index);
    const close = balanced(m, open);
    const inner = m.slice(open + 1, close);
    if (/\bSELECT\b/i.test(inner)) continue;
    const items = inner.split(',').filter((x) => x.trim());
    if (items.length >= 3) add('D9', 'Hardcoded filter', [il.index, close + 1], `${items.length} values are typed in by hand here. Nothing says why, or whether the list is still complete.`);
  }
  const label = /(<>|!=|NOT\s+I?LIKE|NOT\s+IN\s*\()\s*'[^']*'/gi;
  let lb;
  while ((lb = label.exec(m))) {
    const orig = sql.slice(lb.index, lb.index + lb[0].length);
    if (!/(test|demo|internal|staff|dummy|qa|sandbox|fake)/i.test(orig)) continue;
    const before = m.slice(Math.max(0, lb.index - 40), lb.index);
    const col = /([\w.]+)\s*$/.exec(before);
    const start = col ? lb.index - col[0].length : lb.index;
    add('D9', 'Hardcoded filter', [start, lb.index + lb[0].length], 'Test or internal records are removed by a typed label. Any that are labelled differently stay in.');
  }

  // D10 whole-number division
  if (['PostgreSQL', 'SQL Server', 'Not sure'].includes(dialect)) {
    const div = /\bCOUNT\s*\([^()]*\)\s*(?:FILTER\s*\((?:[^()]|\([^()]*\))*\)\s*)?\/\s*(?:NULLIF\s*\(\s*)?COUNT\s*\([^()]*\)/gi;
    let dv;
    while ((dv = div.exec(m))) {
      const near = m.slice(Math.max(0, dv.index - 30), dv.index + dv[0].length + 20);
      if (/::\s*(numeric|float|decimal|real|double)|\bCAST\s*\(|\b\d+\.\d+\b|\bFLOAT\b|\bDECIMAL\b/i.test(near)) continue;
      add('D10', 'Integer division', [dv.index, dv.index + dv[0].length], `Both sides are whole-number counts. In ${dialect === 'Not sure' ? 'PostgreSQL and SQL Server' : dialect} the result is rounded down, so any share below 1 becomes 0.`);
    }
  }

  // D11 days cut in the database time zone
  if (!has(/AT\s+TIME\s+ZONE|CONVERT_TIMEZONE|CONVERT_TZ|\bTIMEZONE\b|SWITCHOFFSET/i)) {
    const dz = /\bDATE\s*\(\s*[\w.]+\s*\)|[\w.]+\s*::\s*date\b|\bDATE_TRUNC\s*\([^()]*\)/i.exec(m);
    if (dz) add('D11', 'Time zone', [dz.index, dz.index + dz[0].length], 'Days are cut at midnight in the database time zone, usually UTC.');
  }

  // D12 AND and OR mixed without brackets
  for (const w of wheres) {
    const clause = m.slice(w.start, w.end).replace(/\bBETWEEN\b[\s\S]*?\bAND\b/gi, (x) => x.replace(/\bAND\b/gi, '___'));
    let depth = 0;
    let andAt = -1;
    let orAt = -1;
    for (let k = 0; k < clause.length; k += 1) {
      const ch = clause[k];
      if (ch === '(') depth += 1;
      else if (ch === ')') depth -= 1;
      else if (depth === 0) {
        const rest = clause.slice(k, k + 5);
        const prev = k === 0 ? ' ' : clause[k - 1];
        if (/\W/.test(prev) && /^AND\b/i.test(rest) && andAt < 0) andAt = k;
        if (/\W/.test(prev) && /^OR\b/i.test(rest) && orAt < 0) orAt = k;
      }
    }
    if (andAt >= 0 && orAt >= 0) {
      const at = w.start + orAt;
      const [ls, lend] = lineAt(sql, at);
      add('D12', 'AND/OR order', [ls, lend], 'AND and OR are mixed with no brackets. SQL applies every AND first, so the OR side can skip the other filters.');
    }
  }

  return hits;
}

/* ---------- Model reply ---------- */

function pick(list, raw, fallback) {
  const v = String(raw || '').trim().toLowerCase();
  const hit = list.find((x) => x.toLowerCase() === v);
  if (hit) return { value: hit, ok: true };
  const loose = list.find((x) => v && (x.toLowerCase().startsWith(v) || v.startsWith(x.toLowerCase()) || v.includes(x.toLowerCase())));
  if (loose) return { value: loose, ok: true };
  return { value: fallback, ok: false };
}

export function parseReply(text) {
  const out = { summary: '', grain: '', match: null, matchWhy: '', steps: [], traps: [], questions: [], terms: [], offList: 0 };
  String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim().replace(/^[-*]\s*/, ''))
    .filter(Boolean)
    .forEach((line) => {
      const f = line.split('|').map((x) => x.trim());
      const tag = f[0].toUpperCase();
      if (tag === 'SUMMARY') out.summary = f.slice(1).join(' ');
      else if (tag === 'GRAIN') out.grain = f.slice(1).join(' ');
      else if (tag === 'MATCH' && f.length >= 3) {
        const p = pick(MATCHES, f[1], 'Partly');
        if (!p.ok) out.offList += 1;
        out.match = p.value;
        out.matchWhy = f.slice(2).join(' ');
      } else if (tag === 'STEP' && f.length >= 4) out.steps.push({ n: f[1], snippet: f[2], text: f.slice(3).join(' ') });
      else if (tag === 'TRAP' && f.length >= 4) {
        const p = pick(TRAP_NAMES, f[1], null);
        if (!p.ok) { out.offList += 1; return; }
        out.traps.push({ type: p.value, snippet: f[2], text: f.slice(3).join(' ') });
      } else if (tag === 'QUESTION' && f[1]) out.questions.push(f.slice(1).join(' '));
      else if (tag === 'TERM' && f.length >= 3) out.terms.push({ term: f[1], text: f.slice(2).join(' ') });
    });
  return out;
}

/* ---------- Putting it together ---------- */

export function buildReport({ form, parsed }) {
  const sql = form.query || '';
  const rules = runRules(form);
  const model = parsed || parseReply('');

  const steps = model.steps.map((s) => {
    const r = locate(s.snippet, sql);
    return { ...s, found: !!r, start: r ? r[0] : -1, end: r ? r[1] : -1 };
  });
  const modelTraps = model.traps.map((t) => {
    const r = locate(t.snippet, sql);
    return { ...t, found: !!r, start: r ? r[0] : -1, end: r ? r[1] : -1 };
  });
  const dropped = modelTraps.filter((t) => !t.found);

  // One card per trap type (M2).
  const byType = {};
  rules.forEach((h) => {
    byType[h.type] = byType[h.type] || { type: h.type, rules: [], model: [] };
    byType[h.type].rules.push(h);
  });
  modelTraps.filter((t) => t.found).forEach((t) => {
    byType[t.type] = byType[t.type] || { type: t.type, rules: [], model: [] };
    byType[t.type].model.push(t);
  });
  const cards = Object.values(byType).map((c) => {
    const sevs = [...c.rules.map((h) => h.sev), ...(c.model.length ? [TRAPS[c.type].sev] : [])];
    const sev = sevs.sort((a, b) => SEV_ORDER[b] - SEV_ORDER[a])[0];
    const source = c.rules.length && c.model.length ? 'both' : c.rules.length ? 'rule' : 'model';
    const ranges = [...c.rules, ...c.model].map((x) => [x.start, x.end]);
    return { ...c, sev, source, ranges, meta: TRAPS[c.type] };
  }).sort((a, b) => SEV_ORDER[b.sev] - SEV_ORDER[a.sev] || (a.source === 'both' ? -1 : 0) - (b.source === 'both' ? -1 : 0));

  const count = { High: 0, Medium: 0, Low: 0 };
  cards.forEach((c) => { count[c.sev] += 1; });

  let verdict;
  let rule;
  const strict = STRICT_USES.includes(form.use);
  if (model.match === 'Does not match') { verdict = 'different'; rule = 'V1'; }
  else if (count.High) { verdict = 'check'; rule = 'V2'; }
  else if (count.Medium || model.match === 'Partly') { verdict = strict ? 'check' : 'caveat'; rule = 'V3'; }
  else { verdict = 'safe'; rule = 'V4'; }

  return { rules, steps, modelTraps, dropped, cards, count, verdict, rule, strict, model, hasModel: !!(model.summary || model.steps.length) };
}

export function caveatLine(form, report) {
  const caveats = report.cards.filter((c) => c.sev !== 'Low').slice(0, 3).map((c) => c.meta.caveat);
  if (!caveats.length) return '';
  const list = caveats.length > 1 ? `${caveats.slice(0, -1).join(', ')} and ${caveats[caveats.length - 1]}` : caveats[0];
  return `Caveat: this figure ${list}. It is being checked with the data team.`;
}

export function analystMessage(form, report) {
  const name = (form.author || '').trim();
  const L = [];
  L.push(`Hi${name ? ` ${name}` : ''},`);
  L.push('');
  L.push(`Thanks for the query${form.question ? ` for "${form.question.replace(/[?.]+$/, '')}"` : ''}. Before I use the number${form.use && form.use !== 'Just understanding it' ? ` in ${form.use === 'A decision' ? 'a decision' : form.use === 'Weekly metrics' ? 'our weekly metrics' : 'the board deck'}` : ''}, could you help me check a few things?`);
  const items = report.cards.filter((c) => c.sev !== 'Low').slice(0, 5);
  let n = 0;
  items.forEach((c) => {
    n += 1;
    const piece = (c.rules[0] || c.model[0]).snippet.replace(/\s+/g, ' ').slice(0, 90);
    L.push('');
    L.push(`${n}. ${c.meta.ask}`);
    L.push(`   (The line: ${piece})`);
  });
  report.model.questions.slice(0, 3).forEach((q) => {
    n += 1;
    L.push('');
    L.push(`${n}. ${q}`);
  });
  if (!n) {
    L.push('');
    L.push('1. Is there anything about these tables I should know before quoting the result?');
  }
  L.push('');
  L.push('Happy to jump on a quick call if that is easier. Thanks!');
  return L.join('\n');
}

export function reportMarkdown(form, report) {
  const v = VERDICTS[report.verdict];
  const L = [];
  L.push(`# ${form.question || 'What It Counts'}`);
  L.push('');
  L.push(`**Verdict:** ${v.label} (${report.rule})  `);
  L.push(`**Database:** ${form.dialect} · **Used for:** ${form.use}  `);
  L.push(`**Traps:** ${report.count.High} high, ${report.count.Medium} medium, ${report.count.Low} low`);
  if (report.model.summary) {
    L.push('');
    L.push(`> ${report.model.summary}`);
  }
  if (report.model.grain) L.push('', `**One row is:** ${report.model.grain}`);
  if (report.model.match) L.push('', `**Answers your question?** ${report.model.match}. ${report.model.matchWhy}`);
  L.push('', '```sql', form.query.trim(), '```');
  if (report.steps.length) {
    L.push('', '## Line by line');
    report.steps.forEach((s, i) => L.push(`${i + 1}. \`${s.snippet}\`: ${s.text}`));
  }
  if (report.cards.length) {
    L.push('', '## Traps');
    report.cards.forEach((c) => {
      L.push(`### ${c.type} (${c.sev})`);
      [...c.rules.map((h) => `- **${h.id}** \`${h.snippet.replace(/\s+/g, ' ')}\`: ${h.note}`), ...c.model.map((t) => `- **Model** \`${t.snippet}\`: ${t.text}`)].forEach((x) => L.push(x));
      L.push(`- Check: ${c.meta.check}`);
    });
  }
  const cav = caveatLine(form, report);
  if (cav) L.push('', '## Caveat to keep with the number', cav);
  L.push('', '_Made with What It Counts. Pattern checks and the verdict come from printed rules. Explanations are written by a model and every quoted line is checked against the query._');
  return L.join('\n');
}
