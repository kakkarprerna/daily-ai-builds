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
// A unit opens once the unit before it has at least one star.
export const isUnlocked = (stars, lang, i) => i === 0 || starsOf(stars, lang, i - 1) > 0;

function makeQ(type, target, words) {
  if (type === 'article' && !target.art) type = 'pickWord';
  if (type === 'article') return { type, target };
  return { type, target, opts: shuffle([target, ...sample(words.filter((w) => w !== target), 3)]) };
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
  qs.splice(3, 0, { type: 'match', pairs: sample(words, 4) });
  return qs;
}

export const lessonXp = (mistakes) => 10 + (mistakes === 0 ? 5 : 0);

// Quiz battle draws from every open unit. Wrong options come from the same unit
// as the answer, so a number is never up against an animal.
export const QUIZ_LENGTH = 10;
export const QUIZ_LIMIT_MS = 20000;

export function quizPool(stars, lang) {
  const out = [];
  DATA[lang].units.forEach((u, i) => {
    if (isUnlocked(stars, lang, i)) u.words.forEach((w) => out.push({ ...w, _u: i }));
  });
  return out;
}

export function buildQuiz(stars, lang, listenOk) {
  const pool = quizPool(stars, lang);
  const types = ['pickWord', 'pickPic'];
  if (listenOk) types.push('listen');
  const targets = shuffle(pool.slice()).slice(0, QUIZ_LENGTH);
  while (targets.length < QUIZ_LENGTH) targets.push(pick(pool));
  return targets.map((t) => {
    const same = pool.filter((w) => w._u === t._u && w.w !== t.w);
    return { type: pick(types), target: t, opts: shuffle([t, ...sample(same, 3)]) };
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
