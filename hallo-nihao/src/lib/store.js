// Progress lives only in this browser's localStorage. Nothing is sent anywhere.
const KEY = 'hallo-nihao-v1';

export function freshState() {
  return {
    lang: 'de',
    xp: 0,
    streak: 0,
    lastDay: null,
    stars: { de: {}, zh: {} },
    best: { de: [], zh: [] },
    sound: true,
  };
}

export function loadState() {
  const base = freshState();
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved) return { ...base, ...saved, stars: { ...base.stars, ...saved.stars }, best: { ...base.best, ...saved.best } };
  } catch (e) { /* storage blocked or empty */ }
  return base;
}

export function saveState(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* storage blocked */ }
}

export const dayStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// A streak grows by one on the first finished lesson of a day that follows a day
// with a finished lesson, and restarts at 1 after a missed day.
export function nextStreak(streak, lastDay, now = new Date()) {
  const today = dayStr(now);
  if (lastDay === today) return { streak, lastDay };
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  return { streak: lastDay === dayStr(y) ? streak + 1 : 1, lastDay: today };
}
