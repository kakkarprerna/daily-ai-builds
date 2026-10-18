// Round building and scoring for the four games. Fixed rules, all in the browser.
import { LANG_IDS } from './words.js';

export const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
export const sample = (a, n) => shuffle(a.slice()).slice(0, n);
export const pick = (a) => a[Math.floor(Math.random() * a.length)];

const ARTS = { es: ['el', 'la', 'los', 'las'], de: ['der', 'die', 'das'] };

// "la mamá" -> { art: 'la', w: 'mamá' }
export function split(word, lang) {
  const s = word[lang];
  if (lang === 'es' || lang === 'de') {
    const [first, ...rest] = s.split(' ');
    if (rest.length && ARTS[lang].includes(first.toLowerCase())) return { art: first, w: rest.join(' ') };
  }
  return { art: '', w: s };
}
export const bare = (word, lang) => split(word, lang).w;
export const full = (word, lang) => word[lang];
export const pinyin = (word) => (word.ph ? word.py : word.py.replace(/ /g, ''));

// Stretch words are only asked in English and Spanish.
export const canAsk = (word, lang) => !(word.big && (lang === 'de' || lang === 'zh'));

const LETTERS = /^[\p{L}]+$/u;
export function spellable(word, lang) {
  if (word.ph || !canAsk(word, lang)) return false;
  if (lang === 'zh') return [...word.zh].length <= 4;
  const w = bare(word, lang);
  const max = lang === 'de' ? 9 : 10;
  return LETTERS.test(w) && w.length >= 3 && w.length <= max;
}

// Upper case that keeps ß as one letter, so a German word keeps its length.
export const up = (s) => [...s].map((c) => (c === 'ß' ? 'ß' : c.toUpperCase())).join('');

// ---------- Tile values (our own table, by how rare a letter is across the four languages)
const VALUES = {
  1: 'aeionrstl', 2: 'dghmuáéíóú', 3: 'bcpfkwyv', 4: 'jäöüñß', 5: 'qxz',
};
export function tileValue(ch, lang) {
  if (lang === 'zh') return 3;
  const c = ch.toLowerCase();
  for (const [v, set] of Object.entries(VALUES)) if (set.includes(c)) return Number(v);
  return 2;
}
const EXTRA = {
  en: 'aeiourstlnmdbcgpkhwy',
  es: 'aeiourstlnmdbcgpvjñáéíóú',
  de: 'aeiourstlnmdbcgfhkwzäöüß',
};

// ---------- Tile builder
// The language to spell in rotates through all four. The clue comes from a different language.
export function buildTiles(words, rounds = 6) {
  const order = shuffle(LANG_IDS.slice());
  const used = new Set();
  const out = [];
  for (let i = 0; i < rounds * 4 && out.length < rounds; i++) {
    const lang = order[out.length % 4];
    const cands = words.filter((w) => spellable(w, lang) && !used.has(w.id));
    if (!cands.length) continue;
    const target = pick(cands);
    used.add(target.id);
    const clueLang = pick(LANG_IDS.filter((l) => l !== lang));
    let answer, tiles;
    if (lang === 'zh') {
      answer = [...target.zh];
      const syl = target.py.split(' ');
      const decoyPool = words.filter((w) => w.id !== target.id).flatMap((w) => [...w.zh].map((c, k) => ({ c, p: w.py.split(' ')[k] })));
      const decoys = [];
      for (const d of shuffle(decoyPool)) {
        if (decoys.length >= Math.max(3, 6 - answer.length)) break;
        if (!answer.includes(d.c) && !decoys.some((x) => x.c === d.c)) decoys.push(d);
      }
      tiles = shuffle([...answer.map((c, k) => ({ c, p: syl[k] })), ...decoys]);
    } else {
      // German nouns keep their capital letter; that is part of spelling them right.
      const w = bare(target, lang);
      answer = [...w];
      const decoys = sample([...EXTRA[lang]].filter((c) => !answer.some((a) => a.toLowerCase() === c)), 3).map((c) => ({ c }));
      tiles = shuffle([...answer.map((c) => ({ c })), ...decoys]);
    }
    tiles = tiles.map((t, k) => ({ ...t, k, v: tileValue(t.c, lang) }));
    out.push({ target, lang, clueLang, answer, tiles });
  }
  return out;
}

// ---------- Four-way match
// One picture, three choices in each language. Wrong choices come from the same topic where possible.
export function buildMatch(words, rounds = 6) {
  const asks = words.filter((w) => !w.big);
  const targets = sample(asks, rounds);
  return targets.map((target) => {
    const rows = {};
    for (const lang of LANG_IDS) {
      const same = words.filter((w) => w.id !== target.id && w.t === target.t && !w.big && w[lang] !== target[lang]);
      const other = words.filter((w) => w.id !== target.id && !w.big && w[lang] !== target[lang]);
      const picks = [];
      for (const w of [...shuffle(same), ...shuffle(other)]) {
        if (picks.length >= 2) break;
        if (!picks.some((p) => p[lang] === w[lang])) picks.push(w);
      }
      rows[lang] = shuffle([target, ...picks]);
    }
    return { target, rows };
  });
}

// ---------- Which language?
// Two question kinds: spot the language of one word, or find the odd one out among four
// words in four languages where three mean the same thing.
function owners(words) {
  const m = new Map();
  for (const w of words) for (const l of ['en', 'es', 'de']) {
    const k = bare(w, l).toLowerCase();
    if (!m.has(k)) m.set(k, new Set());
    m.get(k).add(l);
  }
  return m;
}
export function buildWhich(words, rounds = 10) {
  const own = owners(words);
  const qs = [];
  const used = new Set();
  for (let i = 0; i < rounds; i++) {
    if (i % 2 === 0) {
      const cands = [];
      for (const w of words) for (const l of ['en', 'es', 'de']) {
        if (!canAsk(w, l) || used.has(w.id + l)) continue;
        if (own.get(bare(w, l).toLowerCase()).size === 1) cands.push({ w, l });
      }
      if (!cands.length) continue;
      const c = pick(cands);
      used.add(c.w.id + c.l);
      qs.push({ kind: 'spot', word: c.w, lang: c.l, text: bare(c.w, c.l) });
    } else {
      const a = pick(words.filter((w) => !w.big));
      const sameTopic = words.filter((w) => w.id !== a.id && w.t === a.t && !w.big);
      const b = pick(sameTopic.length ? sameTopic : words.filter((w) => w.id !== a.id && !w.big));
      const langs = shuffle(LANG_IDS.slice());
      const oddLang = langs[0];
      if (b[oddLang] === a[oddLang]) { i--; continue; }
      const cards = shuffle(langs.map((l) => ({ lang: l, word: l === oddLang ? b : a, odd: l === oddLang })));
      qs.push({ kind: 'odd', main: a, other: b, cards });
    }
  }
  return qs;
}

// ---------- Mini crossword
// Answers are in English, Spanish or German (letters fit a grid; Chinese is used for clues).
// Each clue gives a picture and the word in a different language, and says which language to answer in.
function tryLayout(cands, want) {
  const grid = new Map();
  const placed = [];
  const key = (r, c) => `${r},${c}`;
  const fits = (letters, r, c, dir) => {
    const dr = dir === 'down' ? 1 : 0, dc = dir === 'across' ? 1 : 0;
    let crosses = 0;
    if (grid.has(key(r - dr, c - dc)) || grid.has(key(r + dr * letters.length, c + dc * letters.length))) return -1;
    for (let k = 0; k < letters.length; k++) {
      const rr = r + dr * k, cc = c + dc * k;
      const cur = grid.get(key(rr, cc));
      if (cur) {
        if (cur.ch !== letters[k] || cur[dir]) return -1;
        crosses++;
      } else {
        // no side neighbours for new cells
        if (grid.has(key(rr + dc, cc + dr)) || grid.has(key(rr - dc, cc - dr))) return -1;
      }
    }
    return crosses;
  };
  const put = (item, letters, r, c, dir) => {
    const dr = dir === 'down' ? 1 : 0, dc = dir === 'across' ? 1 : 0;
    for (let k = 0; k < letters.length; k++) {
      const kk = key(r + dr * k, c + dc * k);
      const cell = grid.get(kk) || { ch: letters[k] };
      cell[dir] = true;
      grid.set(kk, cell);
    }
    placed.push({ ...item, letters, r, c, dir });
  };
  const first = cands[0];
  put(first, first.letters, 0, 0, 'across');
  for (const item of cands.slice(1)) {
    if (placed.length >= want) break;
    if (placed.some((p) => p.word.id === item.word.id)) continue;
    const opts = [];
    for (const p of placed) {
      const dir = p.dir === 'across' ? 'down' : 'across';
      for (let i = 0; i < p.letters.length; i++) for (let j = 0; j < item.letters.length; j++) {
        if (p.letters[i] !== item.letters[j]) continue;
        const pr = p.dir === 'across' ? p.r : p.r + i;
        const pc = p.dir === 'across' ? p.c + i : p.c;
        const r = dir === 'down' ? pr - j : pr;
        const c = dir === 'across' ? pc - j : pc;
        if (fits(item.letters, r, c, dir) > 0) opts.push({ r, c, dir });
      }
    }
    if (opts.length) { const o = pick(opts); put(item, item.letters, o.r, o.c, o.dir); }
  }
  return { grid, placed };
}

export function buildCrossword(words, want = 5) {
  const cands0 = [];
  for (const w of words) for (const l of ['en', 'es', 'de']) {
    if (!spellable(w, l)) continue;
    const s = bare(w, l);
    if (s.length > 8) continue;
    cands0.push({ word: w, lang: l, answer: s, letters: [...up(s)] });
  }
  if (cands0.length < 4) return null;
  let best = null;
  for (let a = 0; a < 60; a++) {
    // mix the answer languages: shuffle, then interleave by language
    const byLang = { en: [], es: [], de: [] };
    for (const c of shuffle(cands0.slice())) byLang[c.lang].push(c);
    const order = [];
    const lo = shuffle(['en', 'es', 'de']);
    for (let i = 0; order.length < cands0.length && i < 400; i++) { const x = byLang[lo[i % 3]].shift(); if (x) order.push(x); }
    const res = tryLayout(order, want);
    const rs = [...res.grid.keys()].map((k) => k.split(',').map(Number));
    const h = Math.max(...rs.map((x) => x[0])) - Math.min(...rs.map((x) => x[0])) + 1;
    const wd = Math.max(...rs.map((x) => x[1])) - Math.min(...rs.map((x) => x[1])) + 1;
    const langs = new Set(res.placed.map((p) => p.lang)).size;
    const score = res.placed.length * 100 + langs * 20 - Math.max(h, wd) * 3;
    if (wd <= 10 && h <= 10 && (!best || score > best.score)) best = { ...res, h, wd, score };
    if (best && best.placed.length >= want && langs === 3 && Math.max(h, wd) <= 8) break;
  }
  if (!best || best.placed.length < 3) return null;
  // normalise to 0,0 and number the clues
  const rs = best.placed.flatMap((p) => p.letters.map((_, k) => [p.r + (p.dir === 'down' ? k : 0), p.c + (p.dir === 'across' ? k : 0)]));
  const r0 = Math.min(...rs.map((x) => x[0])), c0 = Math.min(...rs.map((x) => x[1]));
  const items = best.placed.map((p) => ({ ...p, r: p.r - r0, c: p.c - c0 }));
  const starts = [...new Set(items.map((p) => `${p.r},${p.c}`))].sort((a, b) => {
    const [ar, ac] = a.split(',').map(Number), [br, bc] = b.split(',').map(Number);
    return ar - br || ac - bc;
  });
  items.forEach((p) => { p.n = starts.indexOf(`${p.r},${p.c}`) + 1; p.clueLang = pick(LANG_IDS.filter((l) => l !== p.lang)); });
  const cells = {};
  items.forEach((p, idx) => p.letters.forEach((ch, k) => {
    const r = p.r + (p.dir === 'down' ? k : 0), c = p.c + (p.dir === 'across' ? k : 0);
    const kk = `${r},${c}`;
    cells[kk] = cells[kk] || { r, c, ch, words: [] };
    cells[kk].words.push(idx);
  }));
  const H = Math.max(...Object.values(cells).map((x) => x.r)) + 1;
  const Wd = Math.max(...Object.values(cells).map((x) => x.c)) + 1;
  items.sort((a, b) => (a.dir === b.dir ? a.n - b.n : a.dir === 'across' ? -1 : 1));
  // re-index cell word links after sort
  Object.values(cells).forEach((cell) => { cell.words = []; });
  items.forEach((p, idx) => p.letters.forEach((_, k) => {
    const r = p.r + (p.dir === 'down' ? k : 0), c = p.c + (p.dir === 'across' ? k : 0);
    cells[`${r},${c}`].words.push(idx);
  }));
  return { items, cells, H, W: Wd };
}

export const KEYS = {
  en: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  es: 'ÁÉÍÓÚÑ',
  de: 'ÄÖÜß',
};
