export const CATEGORIES = [
  'Core task',
  'Edge case',
  'Out of scope',
  'Adversarial',
  'Recovery',
  'Language & format',
];

function matchCategory(raw) {
  const s = String(raw || '').toLowerCase();
  const exact = CATEGORIES.find((c) => c.toLowerCase() === s);
  if (exact) return exact;
  if (s.includes('core') || s.includes('happy')) return 'Core task';
  if (s.includes('edge')) return 'Edge case';
  if (s.includes('scope')) return 'Out of scope';
  if (s.includes('advers') || s.includes('attack') || s.includes('inject')) return 'Adversarial';
  if (s.includes('recover') || s.includes('error')) return 'Recovery';
  if (s.includes('lang') || s.includes('format')) return 'Language & format';
  return 'Edge case';
}

export function parseKit(text) {
  const kit = { summary: '', risk: '', cases: [], judge: [], gaps: [], next: '' };
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.trim().replace(/^[-*•]\s*/, '').replace(/\*\*/g, '');
    const m = line.match(/^([A-Z]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const tag = m[1];
    const body = m[2].trim();
    if (!body) continue;
    if (tag === 'SUMMARY') kit.summary = kit.summary ? `${kit.summary} ${body}` : body;
    else if (tag === 'RISK') kit.risk = body;
    else if (tag === 'JUDGE') kit.judge.push(body);
    else if (tag === 'GAP') kit.gaps.push(body);
    else if (tag === 'NEXT') kit.next = body;
    else if (tag === 'CASE') {
      const p = body.split('|').map((x) => x.trim());
      if (p.length < 7) continue;
      const n = p.length;
      const pri = (p[1].match(/P[0-2]/i) || ['P1'])[0].toUpperCase();
      kit.cases.push({
        category: matchCategory(p[0]),
        priority: pri,
        title: p[2],
        input: p.slice(3, n - 3).join(' | '),
        expected: p[n - 3],
        passIf: p[n - 2],
        failIf: p[n - 1],
      });
    }
  }
  const order = { P0: 0, P1: 1, P2: 2 };
  kit.cases.sort((a, b) => order[a.priority] - order[b.priority]);
  kit.cases.forEach((c, i) => (c.id = `TC-${String(i + 1).padStart(2, '0')}`));
  return kit;
}

export function kitIsUsable(kit) {
  return kit && kit.cases.length > 0;
}

function csvCell(v) {
  return `"${String(v ?? '').replace(/"/g, '""')}"`;
}

export function toCSV(kit) {
  const head = ['id', 'category', 'priority', 'title', 'input', 'expected', 'pass_if', 'fail_if', 'result', 'notes'];
  const rows = kit.cases.map((c) =>
    [c.id, c.category, c.priority, c.title, c.input, c.expected, c.passIf, c.failIf, '', ''].map(csvCell).join(',')
  );
  return [head.join(','), ...rows].join('\n');
}

export function judgePrompt(kit, featureName) {
  const rules = kit.judge.map((r, i) => `${i + 1}. ${r}`).join('\n');
  return `You are grading one test case for an AI feature called "${featureName || 'this feature'}".

Apply these rules to every case:
${rules}

Test input:
{input}

Expected behaviour:
{expected}

Pass if:
{pass_if}

Fail if:
{fail_if}

The feature's actual reply:
{response}

Answer on two lines.
VERDICT: PASS or FAIL
EVIDENCE: one sentence quoting the part of the reply that decided it`;
}
