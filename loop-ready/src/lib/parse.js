import { RESOURCE_BY_ID } from '../data/resources.js';

// The model replies in tagged lines (TAG|field|field) instead of JSON.
// Smaller open models break JSON often; a stray line here just gets skipped.
// Resource ids are checked against the library, and anything unknown is
// dropped and counted, so the UI can show "0 links invented" honestly.

const clean = (s) => (s || '').trim().replace(/^["']|["']$/g, '');

export function parsePlan(text) {
  const out = { summary: '', signals: [], stages: [], plan: [], gaps: [], asks: [], dropped: 0 };
  const stageByN = new Map();
  const getStage = (n) => {
    const key = String(parseInt(n, 10));
    if (!stageByN.has(key)) {
      const s = { n: Number(key), name: `Stage ${key}`, tests: '', effort: 'Medium', prep: [], res: [], practice: [], trap: [] };
      stageByN.set(key, s);
    }
    return stageByN.get(key);
  };

  for (const raw of (text || '').split('\n')) {
    const line = raw.replace(/^[\s>*\-•]+/, '').replace(/\*\*/g, '').trim();
    if (!line.includes('|')) continue;
    const parts = line.split('|').map(clean);
    const tag = parts[0].toUpperCase();

    switch (tag) {
      case 'SUMMARY':
        out.summary = parts.slice(1).join(' ').trim();
        break;
      case 'SIGNAL':
        if (parts[1]) out.signals.push({ theme: parts[1], evidence: parts[2] || '' });
        break;
      case 'STAGE': {
        if (!parts[1] || isNaN(parseInt(parts[1], 10))) break;
        const s = getStage(parts[1]);
        s.name = parts[2] || s.name;
        s.tests = parts[3] || s.tests;
        const effort = (parts[4] || '').toLowerCase();
        s.effort = effort.startsWith('h') ? 'High' : effort.startsWith('l') ? 'Low' : 'Medium';
        break;
      }
      case 'PREP':
        if (parts[1] && parts[2]) getStage(parts[1]).prep.push(parts[2]);
        break;
      case 'RES': {
        if (!parts[1] || !parts[2]) break;
        const id = parts[2].toLowerCase();
        if (RESOURCE_BY_ID[id]) {
          const s = getStage(parts[1]);
          if (!s.res.some((r) => r.id === id)) s.res.push({ id, why: parts[3] || '' });
        } else {
          out.dropped += 1;
        }
        break;
      }
      case 'PRACTICE':
        if (parts[1] && parts[2]) getStage(parts[1]).practice.push(parts[2]);
        break;
      case 'TRAP':
        if (parts[1] && parts[2]) getStage(parts[1]).trap.push(parts[2]);
        break;
      case 'PLAN':
        if (parts[1] && parts[2]) out.plan.push({ when: parts[1], task: parts[2] });
        break;
      case 'GAP':
        if (parts[1]) out.gaps.push({ area: parts[1], fix: parts[2] || '' });
        break;
      case 'ASK':
        if (parts[1]) out.asks.push(parts[1]);
        break;
      default:
        break;
    }
  }

  out.stages = [...stageByN.values()].sort((a, b) => a.n - b.n);
  return out;
}

export function planToText(result, meta) {
  const lines = [];
  lines.push(`Prep plan: ${meta.role || 'Role'}${meta.company ? ` at ${meta.company}` : ''}`);
  if (result.summary) lines.push('', result.summary);
  if (result.signals.length) {
    lines.push('', 'What this JD weighs most');
    result.signals.forEach((s) => lines.push(`- ${s.theme}${s.evidence ? ` ("${s.evidence}")` : ''}`));
  }
  result.stages.forEach((s) => {
    lines.push('', `Stage ${s.n}: ${s.name} (${s.effort} prep)`, s.tests);
    s.prep.forEach((p) => lines.push(`- Do: ${p}`));
    s.res.forEach((r) => {
      const lib = RESOURCE_BY_ID[r.id];
      lines.push(`- Read: ${lib.title}, ${lib.source}: ${lib.url}${r.why ? ` (${r.why})` : ''}`);
    });
    s.practice.forEach((q) => lines.push(`- Practise: ${q}`));
    s.trap.forEach((t) => lines.push(`- Avoid: ${t}`));
  });
  if (result.plan.length) {
    lines.push('', 'Day by day');
    result.plan.forEach((p) => lines.push(`- ${p.when}: ${p.task}`));
  }
  if (result.gaps.length) {
    lines.push('', 'Gaps to close');
    result.gaps.forEach((g) => lines.push(`- ${g.area}: ${g.fix}`));
  }
  if (result.asks.length) {
    lines.push('', 'Questions to ask');
    result.asks.forEach((a) => lines.push(`- ${a}`));
  }
  return lines.join('\n');
}
