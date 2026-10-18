// Scores, settings and any AI word sets live only in this browser. Nothing is sent anywhere
// except the topic typed into New words, and only when someone asks for a new set.
const KEY = 'mischmasch-v1';

export function fresh() {
  return {
    best: { tiles: 0, match: 0, crossword: 0, which: 0 },
    stars: 0,
    played: 0,
    sound: true,
    topics: [],        // empty means every topic
    big: true,         // include stretch words in English and Spanish
    sets: [],          // AI word sets added by a grown-up
    provider: 'muse',
  };
}
export function load() {
  const base = fresh();
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s) return { ...base, ...s, best: { ...base.best, ...s.best } };
  } catch (e) { /* storage blocked or empty */ }
  return base;
}
export function save(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* storage blocked */ }
}
