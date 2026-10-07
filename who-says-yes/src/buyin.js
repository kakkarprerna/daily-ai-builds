// Printed rules for Who Says Yes?
// The model only lists the people and suggests facts about each one from fixed word lists.
// Everything below is plain code: the same facts in always give the same map, plays and order.

export const FACTS = {
  role: {
    label: 'Part in the decision',
    hint: 'What they can do to the decision itself',
    options: [
      { id: 'Signs off', pts: 3, note: 'Their yes is needed for it to happen' },
      { id: 'Can block', pts: 3, note: 'Cannot approve it alone, but can stop or stall it' },
      { id: 'Shapes the detail', pts: 2, note: 'Decides how it is built, priced or rolled out' },
      { id: 'Has to live with it', pts: 1, note: 'Their daily work changes once it lands' },
      { id: 'Kept informed', pts: 0, note: 'Needs to know, has no say' }
    ]
  },
  influence: {
    label: 'Weight in the room',
    hint: 'How much others follow their lead, title aside',
    options: [
      { id: 'High', pts: 3 },
      { id: 'Medium', pts: 2 },
      { id: 'Low', pts: 1 }
    ]
  },
  stance: {
    label: 'Where they stand today',
    hint: 'What they would say if asked tomorrow',
    options: [
      { id: 'Backing', pts: 2 },
      { id: 'Open', pts: 1 },
      { id: 'Unknown', pts: 0 },
      { id: 'Doubtful', pts: -1 },
      { id: 'Against', pts: -2 }
    ]
  },
  impact: {
    label: 'How much it changes their work',
    hint: 'Changes to their team, targets or tools',
    options: [
      { id: 'Heavy', pts: 2 },
      { id: 'Some', pts: 1 },
      { id: 'Little', pts: 0 }
    ]
  },
  access: {
    label: 'Your route to them',
    hint: 'Whether you can book time with them yourself',
    options: [
      { id: 'Direct', pts: 0 },
      { id: 'Through someone', pts: 0 },
      { id: 'None yet', pts: 0 }
    ]
  }
};
export const FACT_KEYS = ['role', 'influence', 'stance', 'impact', 'access'];

// A typed fact has no weight of its own, so it scores as the middle of its range.
const MIDDLE = { role: 2, influence: 2, stance: 0, impact: 1, access: 0 };

export const STANCES = ['Against', 'Doubtful', 'Unknown', 'Open', 'Backing'];
export const POWER_BANDS = ['High', 'Medium', 'Low'];

export const PLAYS = [
  { id: 0, label: 'Sponsor', short: 'Sponsor', who: 'Strong say, already on side', desc: 'Ask them to put their name to it and open doors. Meet them first, so every later conversation starts with cover.' },
  { id: 1, label: 'Win over', short: 'Win over', who: 'Strong say, not on side yet', desc: 'A one to one before any group meeting. Lead with their worry, not your pitch, and bring the evidence that answers it.' },
  { id: 2, label: 'Co-design', short: 'Co-design', who: 'Lives with it every day', desc: 'Bring them in to shape the detail before it is decided. Resistance from the people who do the work travels upwards fast.' },
  { id: 3, label: 'Messenger', short: 'Messenger', who: 'On side, and someone listens to them', desc: 'Ask them to vouch for it to the person they sway, in their own words, before you meet that person.' },
  { id: 4, label: 'Keep posted', short: 'Keep posted', who: 'Little say, little change', desc: 'A short note at the key moments. No meeting needed unless something changes.' }
];

export const ASKS = ['New budget', 'New tool or vendor', 'Change to how people work', 'New AI feature', 'Pricing or commercial change', 'Policy change'];
export const TIMING = ['Decision this month', 'This quarter', 'No fixed date'];
export const POSITION = ['I own it', 'Proposing it to another team', 'New to this organisation'];
export const CONSTRAINTS = ['Works council or union', 'Security review', 'Procurement', 'Legal or privacy review', 'Budget freeze', 'Regulated industry'];

const GATES = {
  'Works council or union': { name: 'Employee representatives', text: 'Check whether the change must be shared with employee representatives before it is decided. In Spain and much of the EU, changes to how work is organised or monitored often need them informed or consulted first.' },
  'Security review': { name: 'Security review', text: 'Book the security review before the decision meeting, so a late finding does not reopen a decision already made.' },
  'Procurement': { name: 'Procurement', text: 'Start the supplier and contract checks in parallel. They rarely move faster than the people do.' },
  'Legal or privacy review': { name: 'Legal and privacy', text: 'Get the legal and privacy questions answered in writing before deciders see it, so their sign-off is not conditional.' },
  'Budget freeze': { name: 'Budget freeze', text: 'Frame the first ask as something that fits inside existing budget, such as a pilot, and keep the full spend for a later decision.' },
  'Regulated industry': { name: 'Compliance', text: 'Ask compliance which approvals apply and add their sign-off to the decision, rather than treating it as a later check.' }
};

const ptsOf = (key, value) => {
  const o = FACTS[key].options.find((x) => x.id === value);
  return o ? o.pts : MIDDLE[key];
};
const isKnown = (key, value) => FACTS[key].options.some((x) => x.id === value);

function snap(key, raw) {
  const v = String(raw || '').trim();
  const hit = FACTS[key].options.find((o) => o.id.toLowerCase() === v.toLowerCase());
  if (hit) return hit.id;
  const loose = FACTS[key].options.find((o) => v.toLowerCase().includes(o.id.toLowerCase().split(' ')[0]));
  return loose ? loose.id : v || FACTS[key].options[Math.floor(FACTS[key].options.length / 2)].id;
}

// ---------- Parse the model's tagged lines ----------

export function parseMap(text) {
  const out = { summary: '', people: [], sways: [], worries: [], asks: [], questions: [] };
  String(text || '').split('\n').forEach((line) => {
    const p = line.split('|').map((x) => x.trim());
    const tag = (p[0] || '').toUpperCase().replace(/[^A-Z]/g, '');
    if (tag === 'SUMMARY' && p[1]) out.summary = p[1];
    else if (tag === 'PERSON' && p[1]) {
      out.people.push({
        id: `s${out.people.length + 1}`,
        n: out.people.length + 1,
        name: p[1],
        cares: p[2] || '',
        role: snap('role', p[3]),
        influence: snap('influence', p[4]),
        stance: snap('stance', p[5]),
        impact: snap('impact', p[6]),
        access: snap('access', p[7])
      });
    } else if (tag === 'SWAYS' && p[2]) {
      const from = parseInt(p[1], 10);
      const to = parseInt(p[2], 10);
      if (from && to && from !== to) out.sways.push({ from, to, how: p[3] || '' });
    } else if (tag === 'WORRY' && p[2]) out.worries.push({ n: parseInt(p[1], 10), worry: p[2], answer: p[3] || '' });
    else if (tag === 'ASK' && p[2]) out.asks.push({ n: parseInt(p[1], 10), text: p[2] });
    else if (tag === 'QUESTION' && p[1]) out.questions.push(p[1]);
  });
  // Drop links that point at people who are not on the list.
  const max = out.people.length;
  out.sways = out.sways.filter((s) => s.from <= max && s.to <= max);
  return out;
}

// ---------- Rules ----------

export function analyse(people, sways, form) {
  const byN = Object.fromEntries(people.map((p) => [p.n, p]));
  const rows = people.map((p) => {
    const rolePts = ptsOf('role', p.role);
    const infPts = ptsOf('influence', p.influence);
    const power = rolePts + infPts;
    const support = ptsOf('stance', p.stance);
    const impact = ptsOf('impact', p.impact);
    const high = power >= 4;
    const swaysOut = sways.filter((s) => s.from === p.n);
    const listensTo = sways.filter((s) => s.to === p.n);
    const custom = FACT_KEYS.some((k) => p[k] && !isKnown(k, p[k]));
    const hits = [];

    hits.push({ id: 'P', text: `Say ${rolePts} (${p.role}) plus weight ${infPts} (${p.influence}) gives power ${power} of 6. ${high ? 'Four or more counts as a strong say.' : 'Under four counts as a lighter say.'}` });

    let play;
    if (high && support > 0) {
      play = 0;
      hits.push({ id: 'A1', text: 'Strong say and already backing or open, so they can sponsor it.' });
    } else if (high) {
      play = 1;
      hits.push({ id: 'A2', text: `Strong say and ${p.stance.toLowerCase()} today, so they need winning over before any group meeting.` });
    } else if (impact >= 2) {
      play = 2;
      hits.push({ id: 'A3', text: 'Lighter say, but their work changes heavily, so they shape the detail.' });
    } else if (support > 0 && swaysOut.length) {
      play = 3;
      hits.push({ id: 'A4', text: `On side and sways ${swaysOut.map((s) => byN[s.to]?.name).filter(Boolean).join(' and ')}, so they carry the message.` });
    } else {
      play = 4;
      hits.push({ id: 'A5', text: 'Lighter say and limited change to their work, so a short update is enough.' });
    }

    const flags = [];
    const decider = p.role === 'Signs off' || p.role === 'Can block';
    if (decider && p.stance === 'Against') {
      flags.push({ id: 'R1', kind: 'block', text: 'Blocker. Meet them one to one before anything goes to a group, and do not ask for the decision until they move to doubtful or better, or their concern has gone to whoever sits above them.' });
    }
    if (p.role === 'Signs off' && p.stance === 'Unknown') {
      flags.push({ id: 'R2', kind: 'warn', text: 'Unknown sign-off. Find out where they stand before meeting anyone doubtful. It is the biggest blind spot on the map.' });
    }
    if (high && p.access === 'None yet') {
      const allies = listensTo.map((s) => byN[s.from]).filter((x) => x && ptsOf('stance', x.stance) > 0);
      flags.push({
        id: 'R3', kind: 'warn',
        text: allies.length
          ? `No route in yet. Ask ${allies.map((a) => a.name).join(' or ')} for an introduction, since they already back it and this person listens to them.`
          : 'No route in yet, and nobody on the map who backs it is known to sway them. Find someone who can introduce you before planning the meeting.'
      });
    }
    if (!high && p.influence === 'High' && support < 0) {
      flags.push({ id: 'R5', kind: 'warn', text: 'Little formal say, but people follow their lead and they are not on side. Give them a short preview before it is announced, so they hear it from you first.' });
    }
    if (!high && impact >= 2 && support < 0) {
      flags.push({ id: 'R4', kind: 'warn', text: 'Heavily affected and not on side. Involve them before the plan is fixed. Announcing it to them afterwards is how quiet resistance starts.' });
    }

    const allies = listensTo.map((s) => ({ ...s, person: byN[s.from] })).filter((s) => s.person && ptsOf('stance', s.person.stance) > 0);

    return { ...p, power, support, impactPts: impact, high, play, hits, flags, custom, swaysOut, listensTo, allies };
  });

  const counts = PLAYS.map((pl) => rows.filter((r) => r.play === pl.id).length);
  const deciders = rows.filter((r) => r.role === 'Signs off' || r.role === 'Can block');
  const totalPower = rows.reduce((s, r) => s + r.power, 0) || 1;
  const weighted = Math.round((rows.reduce((s, r) => s + r.power * ((r.support + 2) / 4), 0) / totalPower) * 100);
  const deciderPower = deciders.reduce((s, r) => s + r.power, 0) || 1;
  const deciderOnSide = Math.round((deciders.filter((r) => r.support > 0).reduce((s, r) => s + r.power, 0) / deciderPower) * 100);

  let verdict;
  const blockers = rows.filter((r) => r.flags.some((f) => f.id === 'R1'));
  const signOffDoubt = rows.filter((r) => r.role === 'Signs off' && r.support < 0);
  const unsure = deciders.filter((r) => r.support <= 0);
  if (!deciders.length) {
    verdict = { level: 1, label: 'Nobody decides yet', text: 'No one on the map signs off or can block. Find who actually says yes before planning any meetings.' };
  } else if (blockers.length || signOffDoubt.length) {
    const names = [...new Set([...blockers, ...signOffDoubt].map((r) => r.name))];
    verdict = { level: 0, label: 'Not ready to ask', text: `${listJoin(names)} would say no today. Asking for the decision now risks a recorded no, which is harder to reverse than a delay.` };
  } else if (unsure.length) {
    verdict = { level: 1, label: 'Getting there', text: `${listJoin(unsure.map((r) => r.name))} ${unsure.length === 1 ? 'is' : 'are'} still unsure. Finish the one to ones before asking for the decision.` };
  } else {
    verdict = { level: 2, label: 'Ready to ask', text: 'Everyone who signs off or can block is backing it or open. Book the decision meeting.' };
  }

  const notes = [];
  if (!rows.some((r) => r.play === 0)) notes.push('No sponsor on the map. Find someone with a strong say who backs it before anything else.');
  if (form?.timing === 'Decision this month' && counts[1] >= 3) {
    notes.push(`${counts[1]} people to win over in under a month is tight. Consider asking for a smaller first decision, such as a pilot.`);
  }
  if (form?.position === 'New to this organisation' && rows.filter((r) => r.access === 'None yet').length >= 2) {
    notes.push('You are new and several people have no route in yet. Spend the first week on introductions, not on the pitch.');
  }

  const gates = (form?.constraints || []).map((c) => GATES[c] ? { id: c, ...GATES[c] } : { id: c, name: c, text: 'Your own constraint. Agree with the sponsor where it sits in the order.' });

  return { rows, counts, deciders, weighted, deciderOnSide, verdict, notes, gates };
}

// ---------- Order of approach ----------

export function rounds(a) {
  const R = [];
  const by = (play) => a.rows.filter((r) => r.play === play);
  const sponsors = by(0).sort((x, y) => y.power - x.power || y.support - x.support);
  R.push({
    id: 1, icon: 'shield', title: 'Line up cover', why: 'A sponsor first means every later conversation starts with someone senior already on side.',
    people: sponsors, empty: 'No sponsor yet. This round is finding one.'
  });
  const co = by(2).sort((x, y) => x.support - y.support || y.power - x.power);
  R.push({
    id: 2, icon: 'pencil', title: 'Shape it with the people who live with it', why: 'Their input changes the proposal, so it has to come before the people who judge the proposal see it. Least supportive first, so their concerns are in the design.',
    people: co, empty: 'Nobody here is heavily affected without a strong say.'
  });
  const winTargets = by(1);
  const msg = by(3).sort((x, y) => {
    const xs = x.swaysOut.filter((s) => winTargets.some((w) => w.n === s.to)).length;
    const ys = y.swaysOut.filter((s) => winTargets.some((w) => w.n === s.to)).length;
    return ys - xs;
  });
  R.push({
    id: 3, icon: 'megaphone', title: 'Line up voices', why: 'People you need to win over hear it from someone they trust before they hear it from you.',
    people: msg, empty: 'No messengers on the map. Sponsors can vouch for it instead.'
  });
  const order = { Unknown: 0, Open: 0, Doubtful: 1, Against: 2 };
  const win = winTargets.sort((x, y) => (order[x.stance] ?? 1) - (order[y.stance] ?? 1) || y.allies.length - x.allies.length || y.power - x.power);
  R.push({
    id: 4, icon: 'handshake', title: 'One to ones', why: 'Unknowns first, to find out where they stand. Then the doubtful, then anyone against, so each meeting can point to support already won.',
    people: win, empty: 'Nobody with a strong say needs winning over.'
  });
  if (a.gates.length) {
    R.push({ id: 5, icon: 'lock', title: 'Clear the gates', why: 'Fixed steps from your constraints. Run them alongside the one to ones, finished before the decision.', people: [], gates: a.gates });
  }
  R.push({
    id: 6, icon: 'gavel', title: 'Ask for the decision', why: a.verdict.level === 2 ? 'Everyone who decides is on side or open.' : 'Only once the verdict reads Ready to ask.',
    people: a.deciders.slice().sort((x, y) => y.power - x.power), decision: true, empty: 'Nobody on the map signs off.'
  });
  const posted = by(4);
  R.push({
    id: 7, icon: 'mail', title: 'Tell everyone else', why: 'A short note once it is decided, so nobody learns about it second hand.',
    people: posted, empty: 'Nobody left to tell.'
  });
  return R.map((r, i) => ({ ...r, step: i + 1 }));
}

function listJoin(arr, word = 'and') {
  if (arr.length <= 1) return arr.join('');
  return `${arr.slice(0, -1).join(', ')} ${word} ${arr[arr.length - 1]}`;
}

// ---------- Markdown export ----------

export function planMarkdown(form, map, a) {
  const R = rounds(a);
  const L = [];
  L.push(`# Buy-in plan: ${form.name || 'Untitled decision'}`, '');
  if (map.summary) L.push(map.summary, '');
  L.push(`- The ask: ${form.ask}. Timing: ${form.timing}.`);
  if ((form.constraints || []).length) L.push(`- Constraints: ${form.constraints.join(', ')}`);
  L.push(`- Verdict: **${a.verdict.label}**. ${a.verdict.text}`);
  L.push(`- Weighted support: ${a.weighted}%. Decision power on side: ${a.deciderOnSide}%`, '');
  a.notes.forEach((n) => L.push(`> ${n}`, ''));
  L.push('## Order of approach', '');
  R.forEach((r) => {
    L.push(`### ${r.step}. ${r.title}`, '', r.why, '');
    if (r.gates) r.gates.forEach((g) => L.push(`- **${g.name}**: ${g.text}`));
    else if (!r.people.length) L.push(`- ${r.empty}`);
    else r.people.forEach((p) => {
      const ask = map.asks.find((x) => x.n === p.n);
      L.push(`- **${p.name}** (${PLAYS[p.play].label}, ${p.stance.toLowerCase()})${ask ? `: ${ask.text}` : ''}`);
      if (p.allies.length && p.play === 1) L.push(`  - Meet after: ${p.allies.map((x) => x.person.name).join(', ')}`);
    });
    L.push('');
  });
  L.push('## People', '');
  a.rows.forEach((p) => {
    L.push(`### ${p.n}. ${p.name}`, '');
    L.push(`- Cares about: ${p.cares || 'not given'}`);
    L.push(`- ${p.role}, ${p.influence.toLowerCase()} weight, ${p.stance.toLowerCase()}, ${p.impact.toLowerCase()} change to their work, route: ${p.access.toLowerCase()}`);
    L.push(`- Play: ${PLAYS[p.play].label}. ${PLAYS[p.play].desc}`);
    p.flags.forEach((f) => L.push(`- ${f.id}: ${f.text}`));
    map.worries.filter((w) => w.n === p.n).forEach((w) => L.push(`- Likely worry: ${w.worry}${w.answer ? ` Answer with: ${w.answer}` : ''}`));
    L.push('');
  });
  if (map.questions.length) {
    L.push('## Open questions', '');
    map.questions.forEach((q) => L.push(`- ${q}`));
    L.push('');
  }
  L.push('---', 'Made with Who Says Yes? The model listed the people and suggested their facts. Plays, order and verdict come from printed rules.');
  return L.join('\n');
}
