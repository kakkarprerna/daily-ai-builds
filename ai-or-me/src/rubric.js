// AI or Me? rubric engine.
// Deterministic on purpose: the verdict on whether to use AI is worked out
// by a fixed, printed formula. No model call decides it.
//
// Two axes, each 0 to 100:
//   Learning value  (L): how much you lose in skill if AI does this for you
//   AI fit          (D): how safely and usefully AI could do this task
// Each answer carries a value between 0 and 1 on one or both axes.
// A custom option you type yourself scores 0.5 (neutral) on its axes.

export const FIELDS = [
  {
    id: 'taskType',
    label: 'What kind of task is it?',
    hint: 'Pick the closest. Each kind exercises a different PM skill.',
    icon: 'Shapes',
    options: [
      { value: 'draft', label: 'Drafting text', D: 0.85, skill: 'writing clearly for a specific reader' },
      { value: 'summarise', label: 'Summarising material', D: 0.8, skill: 'synthesis: spotting what actually matters' },
      { value: 'research', label: 'Desk research', D: 0.65, skill: 'judging whether a source can be trusted' },
      { value: 'data', label: 'Analysing data', D: 0.6, skill: 'reading data critically' },
      { value: 'spec', label: 'Writing a spec or PRD', D: 0.5, skill: 'thinking through edge cases before they bite' },
      { value: 'stakeholder', label: 'A sensitive stakeholder message', D: 0.45, skill: 'reading the room and choosing what to say' },
      { value: 'prioritise', label: 'Prioritising', D: 0.35, skill: 'reasoning through trade-offs' },
      { value: 'decide', label: 'A judgement call', D: 0.15, skill: 'product judgement' },
    ],
  },
  {
    id: 'skillStage',
    label: 'Where are you with this skill?',
    hint: 'Be honest. This answer carries the most weight on learning value.',
    icon: 'Sprout',
    options: [
      { value: 'learning', label: 'Core to my role, still learning it', L: 1.0 },
      { value: 'strong', label: 'Core to my role, already strong', L: 0.25 },
      { value: 'peripheral', label: 'Not core to my role', L: 0.05 },
    ],
  },
  {
    id: 'doneBefore',
    label: 'Have you done it without AI before?',
    hint: 'If you never have, you have nothing to check the AI against.',
    icon: 'History',
    options: [
      { value: 'never', label: 'Never', L: 1.0 },
      { value: 'few', label: 'A few times', L: 0.6 },
      { value: 'many', label: 'Many times', L: 0.1 },
    ],
  },
  {
    id: 'judgement',
    label: 'Is your own thinking the deliverable?',
    hint: 'Some work is valued for the output. Some is valued for the reasoning behind it.',
    icon: 'Brain',
    options: [
      { value: 'yes', label: 'Yes, my judgement is the point', L: 0.9, D: 0.1 },
      { value: 'partly', label: 'Partly', L: 0.5, D: 0.5 },
      { value: 'no', label: 'No, the output is the point', L: 0.1, D: 0.9 },
    ],
  },
  {
    id: 'frequency',
    label: 'How often do you do it?',
    hint: 'Frequent work repays both learning it well and automating it.',
    icon: 'Repeat',
    options: [
      { value: 'daily', label: 'Daily', L: 0.8, D: 0.8 },
      { value: 'weekly', label: 'Weekly', L: 0.8, D: 0.7 },
      { value: 'monthly', label: 'Monthly', L: 0.5, D: 0.5 },
      { value: 'rarely', label: 'Rarely', L: 0.3, D: 0.4 },
      { value: 'once', label: 'One-off', L: 0.1, D: 0.4 },
    ],
  },
  {
    id: 'stakes',
    label: 'What happens if it is wrong?',
    hint: 'Think about who would notice and what it would cost to fix.',
    icon: 'Scale',
    options: [
      { value: 'low', label: 'Minor, easy to fix', D: 0.9 },
      { value: 'medium', label: 'Noticeable, some rework', D: 0.6 },
      { value: 'high', label: 'Serious, costly to fix', D: 0.3 },
      { value: 'irreversible', label: 'Hard or impossible to undo', D: 0.05 },
    ],
  },
  {
    id: 'verify',
    label: 'Could you check the AI’s answer yourself?',
    hint: 'If you could not spot a wrong answer, AI is a risk rather than a help.',
    icon: 'SearchCheck',
    options: [
      { value: 'quick', label: 'Yes, quickly', D: 0.95 },
      { value: 'effort', label: 'Yes, with effort', D: 0.6 },
      { value: 'no', label: 'Not really', D: 0.1 },
    ],
  },
  {
    id: 'context',
    label: 'How much of it depends on context only you hold?',
    hint: 'History with a stakeholder, unwritten politics, what the team tried last year.',
    icon: 'KeyRound',
    options: [
      { value: 'none', label: 'Very little', D: 0.9 },
      { value: 'some', label: 'Some', D: 0.55 },
      { value: 'most', label: 'Most of it', D: 0.15 },
    ],
  },
  {
    id: 'data',
    label: 'What data would you share with the AI?',
    hint: 'Check your company’s approved tools before sharing anything internal.',
    icon: 'ShieldCheck',
    options: [
      { value: 'public', label: 'Public information only', D: 1.0 },
      { value: 'internal', label: 'Internal, not sensitive', D: 0.7 },
      { value: 'confidential', label: 'Confidential or personal data', D: 0.3 },
    ],
  },
  {
    id: 'time',
    label: 'How much time pressure is there?',
    hint: 'Urgency tilts towards AI a little. It never removes the learning cost.',
    icon: 'Timer',
    options: [
      { value: 'none', label: 'No rush', D: 0.4 },
      { value: 'tight', label: 'Tight', D: 0.6 },
      { value: 'urgent', label: 'Urgent', D: 0.8 },
    ],
  },
];

export const WEIGHTS = {
  L: { skillStage: 0.35, doneBefore: 0.25, judgement: 0.25, frequency: 0.15 },
  D: { verify: 0.25, stakes: 0.2, taskType: 0.2, context: 0.15, judgement: 0.1, data: 0.05, time: 0.05 },
};

export const THRESHOLDS = { fitLow: 40, fitHigh: 70, learn: 55 };

export const VERDICTS = {
  yourself: {
    key: 'yourself',
    title: 'Do it yourself',
    short: 'AI is a poor fit here',
    icon: 'Hand',
    summary: 'AI would be guessing at context you hold, or its mistakes would be costly and hard to catch. Your own thinking is the safer tool.',
    how: [
      { icon: 'PenLine', text: 'Work it through on paper or in a doc first, in your own words.' },
      { icon: 'Users', text: 'If you want a sounding board, use a colleague who knows the context.' },
      { icon: 'Search', text: 'AI can still help with a narrow, checkable piece, such as finding a definition or a past figure.' },
    ],
  },
  youfirst: {
    key: 'youfirst',
    title: 'You first, then AI',
    short: 'Learning mode',
    icon: 'GraduationCap',
    summary: 'AI could do a decent job, which is exactly the risk. This task is building a skill you need, so do your own version before you look at anything AI produces.',
    how: [
      { icon: 'PenLine', text: 'Write your own answer first, even a rough one, with a time limit.' },
      { icon: 'MessageSquareQuote', text: 'Then ask AI to critique your version, rather than to write its own.' },
      { icon: 'GitCompare', text: 'Note one thing it caught that you missed, and one thing you caught that it missed.' },
    ],
  },
  aidrafts: {
    key: 'aidrafts',
    title: 'AI drafts, you decide',
    short: 'Assisted',
    icon: 'Handshake',
    summary: 'You already have this skill, and AI can take the first pass. The judgement and the final call stay with you.',
    how: [
      { icon: 'ListChecks', text: 'Tell AI what a good result looks like before it starts.' },
      { icon: 'SearchCheck', text: 'Check every claim against a source you trust, not against how confident it sounds.' },
      { icon: 'Stamp', text: 'Rewrite the conclusion yourself so the reasoning is yours.' },
    ],
  },
  handover: {
    key: 'handover',
    title: 'Hand it over',
    short: 'Delegate',
    icon: 'Send',
    summary: 'Low learning value, easy to check and cheap if wrong. Let AI do it and spend the time you save on something that does build your skills.',
    how: [
      { icon: 'FileText', text: 'Save the prompt that works so the next run takes seconds.' },
      { icon: 'Eye', text: 'Spot-check one output in five rather than reading every line.' },
      { icon: 'Hourglass', text: 'Put the time you save into a task that is still on your learning list.' },
    ],
  },
};

function optionFor(field, answer) {
  if (!answer) return null;
  if (answer.custom) {
    return { value: 'custom', label: answer.custom, L: 0.5, D: 0.5, custom: true, skill: 'the core skill behind this task' };
  }
  return field.options.find((o) => o.value === answer.value) || null;
}

function axisScore(axis, answers) {
  let total = 0;
  const parts = [];
  for (const [fid, w] of Object.entries(WEIGHTS[axis])) {
    const field = FIELDS.find((f) => f.id === fid);
    const opt = optionFor(field, answers[fid]);
    const v = opt && opt[axis] !== undefined ? opt[axis] : 0.5;
    total += v * w;
    parts.push({ field: fid, label: field.label, choice: opt ? opt.label : 'Not answered', value: v, weight: w, axis });
  }
  return { score: Math.round(total * 100), parts };
}

function verdictFrom(L, D) {
  if (D < THRESHOLDS.fitLow) return 'yourself';
  if (L >= THRESHOLDS.learn) return 'youfirst';
  if (D < THRESHOLDS.fitHigh) return 'aidrafts';
  return 'handover';
}

function core(answers) {
  const l = axisScore('L', answers);
  const d = axisScore('D', answers);
  let L = l.score;
  let D = d.score;
  const rules = [];

  const v = answers.verify?.value;
  const s = answers.stakes?.value;
  const data = answers.data?.value;

  if (answers.skillStage?.value === 'learning' && answers.doneBefore?.value === 'never' && L < 70) {
    L = 70;
    rules.push({ id: 'floor', text: 'Still learning a core skill you have never done unaided, so learning value is held at 70 or above.' });
  }
  if (v === 'no' && D > 60) {
    D = 60;
    rules.push({ id: 'verifycap', text: 'You could not check the answer, so AI fit is capped at 60. Full hand-over is ruled out.' });
  }
  if (data === 'confidential' && D > 69) {
    D = 69;
    rules.push({ id: 'datacap', text: 'Confidential or personal data is involved, so AI fit is capped at 69. Full hand-over is ruled out.' });
  }
  let verdict = verdictFrom(L, D);
  if (s === 'irreversible' && v === 'no') {
    verdict = 'yourself';
    rules.push({ id: 'irreversible', text: 'Hard to undo and impossible for you to check: this is always a do-it-yourself task.' });
  }
  return { L, D, verdict, rules, lParts: l.parts, dParts: d.parts };
}

export function evaluate(answers) {
  const answered = FIELDS.filter((f) => answers[f.id]).length;
  const base = core(answers);
  const { L, D, verdict } = base;

  // Confidence: how far the point sits from the nearest boundary that matters.
  const dists = [];
  if (verdict === 'yourself') dists.push(THRESHOLDS.fitLow - D);
  else {
    dists.push(D - THRESHOLDS.fitLow);
    dists.push(Math.abs(L - THRESHOLDS.learn));
    if (verdict !== 'youfirst') dists.push(Math.abs(D - THRESHOLDS.fitHigh));
  }
  const margin = Math.min(...dists.map((x) => Math.abs(x)));
  const customCount = FIELDS.filter((f) => answers[f.id]?.custom).length;
  let confidence = margin >= 12 ? 'High' : margin >= 5 ? 'Medium' : 'Low';
  if (base.rules.some((r) => r.id === 'irreversible')) confidence = 'High';
  if (customCount >= 2 && confidence === 'High') confidence = 'Medium';
  if (answered < FIELDS.length && confidence !== 'Low') confidence = confidence === 'High' ? 'Medium' : 'Low';

  // Drivers: the answers that moved each axis furthest from the midpoint.
  const drivers = [...base.lParts, ...base.dParts]
    .map((p) => ({ ...p, push: (p.value - 0.5) * p.weight }))
    .filter((p) => Math.abs(p.push) > 0.04)
    .sort((a, b) => Math.abs(b.push) - Math.abs(a.push))
    .slice(0, 4)
    .map((p) => ({
      label: p.label,
      choice: p.choice,
      axis: p.axis,
      direction: p.push > 0 ? 'up' : 'down',
      text:
        p.axis === 'L'
          ? p.push > 0 ? 'Raises learning value' : 'Lowers learning value'
          : p.push > 0 ? 'Makes AI a better fit' : 'Makes AI a worse fit',
    }));

  // What would flip it: single answer changes that move the verdict.
  const flips = [];
  for (const f of FIELDS) {
    for (const o of f.options) {
      if (answers[f.id]?.value === o.value && !answers[f.id]?.custom) continue;
      const trial = { ...answers, [f.id]: { value: o.value } };
      const r = core(trial);
      if (r.verdict !== verdict) {
        flips.push({ field: f.label, to: o.label, verdict: r.verdict, shift: Math.abs(r.L - L) + Math.abs(r.D - D) });
      }
    }
  }
  const seen = new Set();
  const topFlips = flips
    .sort((a, b) => a.shift - b.shift)
    .filter((f) => (seen.has(f.field) ? false : seen.add(f.field)))
    .slice(0, 3);

  const taskOpt = optionFor(FIELDS[0], answers.taskType);
  const skill = taskOpt?.skill || 'the core skill behind this task';

  const flags = [];
  if (answers.data?.value === 'confidential') flags.push({ tone: 'red', text: 'Only use an AI tool your organisation has approved for confidential or personal data.' });
  if (answers.verify?.value === 'no') flags.push({ tone: 'amber', text: 'You said you could not check the answer. Whatever you decide, find someone who can before it goes out.' });
  if (answers.doneBefore?.value === 'never' && verdict !== 'yourself' && verdict !== 'youfirst') flags.push({ tone: 'amber', text: 'You have never done this unaided. Do it once yourself soon, so you can tell a good answer from a plausible one.' });

  return { ...base, confidence, margin, answered, drivers, flips: topFlips, skill, flags, info: VERDICTS[verdict] };
}

export function practiceFor(skill, verdict) {
  const base = {
    yourself: `Before your next task of this kind, write down what you expect the answer to be. Afterwards, compare. That gap is where ${skill} grows.`,
    youfirst: `Give yourself 20 minutes to produce your own version first. Only then ask AI to critique it. Repeat for the next three times you do this task, then score yourself again.`,
    aidrafts: `Once a month, do this task with AI switched off. If it feels noticeably harder than it used to, move this task back to "You first, then AI".`,
    handover: `This task is not where your growth is. Name the task that is, and protect the time you saved for it this week.`,
  };
  return base[verdict];
}
