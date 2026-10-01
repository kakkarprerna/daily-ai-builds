// Parses the model's tagged-line reply into a result object.

const VERDICTS = ['Well supported', 'Mostly supported', 'Mixed', 'Outdated', 'Not supported', 'Unsafe'];
const STANCES = ['Agrees', 'Partly', 'Disagrees', 'No clear position'];

function matchFrom(list, raw, fallback) {
  const v = (raw || '').trim().toLowerCase();
  return list.find((x) => v.startsWith(x.toLowerCase())) || fallback;
}

export function parseResult(text) {
  const out = {
    verdict: 'Mixed',
    confidence: 'Low',
    headline: '',
    trueParts: [],
    wrongParts: [],
    positions: [],
    why: '',
    safer: '',
    ask: [],
    urgent: false,
    urgentNote: '',
    limits: '',
  };

  for (const rawLine of String(text || '').split(/\r?\n/)) {
    const line = rawLine.replace(/^[\s*\-•]+/, '').replace(/\*\*/g, '');
    const m = line.match(/^([A-Z_]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const [, tag, value] = m;
    const v = value.trim();
    if (!v) continue;
    switch (tag) {
      case 'VERDICT': out.verdict = matchFrom(VERDICTS, v, 'Mixed'); break;
      case 'CONFIDENCE': out.confidence = matchFrom(['High', 'Medium', 'Low'], v, 'Low'); break;
      case 'HEADLINE': out.headline = v; break;
      case 'TRUE': out.trueParts.push(v); break;
      case 'WRONG': out.wrongParts.push(v); break;
      case 'POSITION': {
        const [body, stance, ...rest] = v.split('|').map((s) => s.trim());
        if (body) out.positions.push({ body, stance: matchFrom(STANCES, stance, 'No clear position'), note: rest.join(' | ') });
        break;
      }
      case 'WHY': out.why = v; break;
      case 'SAFER': out.safer = v; break;
      case 'ASK': out.ask.push(v); break;
      case 'URGENT': out.urgent = /^y(es)?/i.test(v); break;
      case 'URGENT_NOTE': out.urgentNote = v; break;
      case 'LIMITS': out.limits = v; break;
      default: break;
    }
  }
  return out;
}
