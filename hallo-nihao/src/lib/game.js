// Question building and scoring. All rules are fixed and run in the browser.
import { DATA } from '../data.js';

export const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
export const sample = (a, n) => shuffle(a.slice()).slice(0, n);
export const pick = (a) => a[Math.floor(Math.random() * a.length)];

export const starsOf = (stars, lang, i) => stars[lang][DATA[lang].units[i].id] || 0;
// Every unit is open, so a child can jump to the lesson the class is on.
// The quiz uses the units already practised (at least one star), or the
// first unit before any practice.
export const isPractised = (stars, lang, i) => starsOf(stars, lang, i) > 0;

// Wrong options never share the answer's word, meaning or (for reading
// questions) pinyin, so every question has exactly one right answer.
const clash = (a, b) => a === b || a.w === b.w || a.en === b.en || (a.py && a.py === b.py);
export const distractors = (target, words) => sample(words.filter((w) => !clash(w, target)), 3);

function makeQ(type, target, words) {
  if (type === 'article' && !target.art) type = 'pickWord';
  if (type === 'article') return { type, target };
  return { type, target, opts: shuffle([target, ...distractors(target, words)]) };
}

// A lesson is 7 mixed questions plus one match-the-pairs round in the middle.
// Listening only appears when the device has a voice for the language.
export function buildLesson(lang, ui, listenOk) {
  const words = DATA[lang].units[ui].words;
  const types = ['pickPic', 'pickWord', 'pickWord'];
  if (listenOk) types.push('listen', 'listen');
  if (lang === 'de' && words.some((w) => w.art)) types.push('article', 'article');
  if (lang === 'zh') types.push('pinyin', 'pinyin');
  const order = shuffle(words.slice());
  const qs = [];
  for (let i = 0; i < 7; i++) qs.push(makeQ(pick(types), order[i % order.length], words));
  const pairs = [];
  for (const w of shuffle(words.slice())) if (pairs.length < 4 && !pairs.some((p) => p.en === w.en || p.pic && p.pic === w.pic)) pairs.push(w);
  qs.splice(3, 0, { type: 'match', pairs });
  return qs;
}

export const lessonXp = (mistakes) => 10 + (mistakes === 0 ? 5 : 0);

// Quiz battle draws from every practised unit. Wrong options come from the same unit
// as the answer, so a number is never up against an animal.
export const QUIZ_LENGTH = 10;
export const QUIZ_LIMIT_MS = 20000;

export function quizPool(stars, lang) {
  const out = [];
  const units = DATA[lang].units;
  const picked = units.map((u, i) => i).filter((i) => isPractised(stars, lang, i));
  (picked.length ? picked : [0]).forEach((i) => units[i].words.forEach((w) => out.push({ ...w, _u: i })));
  return out;
}

export function buildQuiz(stars, lang, listenOk) {
  const pool = quizPool(stars, lang);
  const types = ['pickWord', 'pickPic'];
  if (listenOk) types.push('listen');
  const targets = shuffle(pool.slice()).slice(0, QUIZ_LENGTH);
  while (targets.length < QUIZ_LENGTH) targets.push(pick(pool));
  return targets.map((t) => {
    const same = pool.filter((w) => w._u === t._u);
    return { type: pick(types), target: t, opts: shuffle([t, ...distractors(t, same)]) };
  });
}

// Up to 1000 points for an instant answer, falling to 500 at the buzzer,
// plus 100 for each answer in a row after the first, capped at 500.
export function quizPoints(ok, elapsedMs, run) {
  if (!ok) return { pts: 0, bonus: 0 };
  const pts = Math.round(1000 * (1 - Math.min(elapsedMs, QUIZ_LIMIT_MS) / QUIZ_LIMIT_MS / 2));
  const bonus = Math.min(500, (run - 1) * 100);
  return { pts, bonus };
}
