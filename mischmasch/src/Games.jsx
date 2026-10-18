import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Lightbulb, Eraser, ArrowRight, Check, Delete, Eye } from 'lucide-react';
import { LANGS, LANG_IDS } from './words.js';
import { pinyin, split, up, KEYS } from './game.js';
import { say, beep } from './sound.js';
import { Pic, Flag, Word, Speak } from './Bits.jsx';

const cheerFor = (lang) => LANGS[lang].cheer;

function Feedback({ ok, children, onNext, last }) {
  return (
    <div className={`feedback ${ok ? 'ok' : 'no'}`} role="status">
      <div className="grow">{children}</div>
      {onNext && (
        <button className="btn" onClick={onNext} autoFocus>
          {last ? 'See my score' : 'Next'} <ArrowRight size={18} />
        </button>
      )}
    </div>
  );
}

// ---------------- Tile builder
// Each round is its own component (keyed by round), so no tile state leaks into the next word.
export function Tiles(props) {
  const [i, setI] = useState(0);
  useEffect(() => { props.onStep && props.onStep(i); }, [i]); // eslint-disable-line
  return <TileRound key={i} {...props} i={i} setI={setI} />;
}

function TileRound({ rounds, sound, onScore, onDone, i, setI }) {
  const [placed, setPlaced] = useState([]);
  const [state, setState] = useState('play'); // play | wrong | right
  const [hints, setHints] = useState(0);
  const [miss, setMiss] = useState(0);
  const [got, setGot] = useState(0);
  const r = rounds[i];
  const isZh = r.lang === 'zh';


  const word = placed.map((k) => r.tiles[k].c);
  const full = placed.length === r.answer.length;

  useEffect(() => {
    if (!full || state === 'right') return;
    if (word.join('') === r.answer.join('')) {
      const pts = r.answer.reduce((s, c) => s + r.tiles.find((t) => t.c === c).v, 0) - hints * 2 + (hints === 0 && miss === 0 ? 5 : 0);
      const p = Math.max(1, pts);
      setGot(p);
      onScore(p);
      setState('right');
      beep(true, sound);
      setTimeout(() => say(r.target[r.lang], r.lang, sound), 300);
    } else {
      setState('wrong');
      setMiss((m) => m + 1);
      beep(false, sound);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [full, placed]);

  const tap = (k) => {
    if (state === 'right' || placed.includes(k) || full) return;
    setState('play');
    setPlaced([...placed, k]);
  };
  const untap = (idx) => {
    if (state === 'right') return;
    setState('play');
    setPlaced(placed.filter((_, j) => j !== idx));
  };
  const hint = () => {
    // keep the correct start, drop the rest, then add the next right tile
    let keep = 0;
    while (keep < placed.length && r.tiles[placed[keep]].c === r.answer[keep]) keep++;
    if (keep >= r.answer.length) return;
    const base = placed.slice(0, keep);
    const k = r.tiles.find((t) => t.c === r.answer[keep] && !base.includes(t.k));
    if (!k) return;
    setHints((h) => h + 1);
    setState('play');
    setPlaced([...base, k.k]);
  };

  const next = () => (i + 1 < rounds.length ? setI(i + 1) : onDone());

  return (
    <div className="stage">
      <div className="card clue">
        <Pic w={r.target} />
        <div>
          <p className="label">Clue in <Flag lang={r.clueLang} label /></p>
          <div className="cw">
            <Word w={r.target} lang={r.clueLang} />
            <Speak w={r.target} lang={r.clueLang} small />
          </div>
        </div>
      </div>

      <p className="ask">
        <span className="flagbig" aria-hidden="true">{LANGS[r.lang].flag}</span>
        {isZh ? 'Build it in Chinese characters' : `Spell it in ${LANGS[r.lang].name}`}
        {!isZh && split(r.target, r.lang).art && state !== 'right' && <span className="badge">starts with “{split(r.target, r.lang).art}”</span>}
      </p>

      <div className={`slots ${state === 'wrong' ? 'wrong' : ''} ${state === 'right' ? 'right' : ''}`} aria-label="Your word">
        {r.answer.map((_, idx) => {
          const k = placed[idx];
          if (k == null) return <span key={idx} className={`slot ${isZh ? 'hz' : ''}`} />;
          const t = r.tiles[k];
          return (
            <button key={idx} className={`tile ${isZh ? 'hz' : ''}`} onClick={() => untap(idx)} aria-label={`Remove ${t.c}`}>
              {t.c}{isZh ? <span className="p">{t.p}</span> : <span className="v">{t.v}</span>}
            </button>
          );
        })}
      </div>

      <div className="rack">
        {r.tiles.map((t) => (
          <button key={t.k} className={`tile ${isZh ? 'hz' : ''} ${placed.includes(t.k) ? 'used' : ''}`} onClick={() => tap(t.k)} aria-label={`Tile ${t.c}`}>
            {t.c}{isZh ? <span className="p">{t.p}</span> : <span className="v">{t.v}</span>}
          </button>
        ))}
      </div>

      {state !== 'right' && (
        <div className="tools">
          <button className="btn soft small" onClick={hint}><Lightbulb size={16} /> Hint (−2)</button>
          <button className="btn soft small" onClick={() => { setPlaced([]); setState('play'); }}><Eraser size={16} /> Clear</button>
        </div>
      )}

      {state === 'wrong' && <Feedback ok={false}>Not quite. Tap a tile in your word to take it back, or try a hint.</Feedback>}
      {state === 'right' && (
        <Feedback ok onNext={next} last={i + 1 === rounds.length}>
          <b>{cheerFor(r.lang)}</b> +{got} point{got === 1 ? "" : "s"}
          <div className="fw"><Word w={r.target} lang={r.lang} /> <Speak w={r.target} lang={r.lang} small /></div>
        </Feedback>
      )}
    </div>
  );
}
export const tilesMax = (rounds) => rounds.reduce((s, r) => s + r.answer.reduce((a, c) => a + r.tiles.find((t) => t.c === c).v, 0) + 5, 0);

// ---------------- Four-way match
export function Match({ rounds, sound, onScore, onDone, onStep }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState({});
  const r = rounds[i];
  useEffect(() => { setPicked({}); onStep && onStep(i); }, [i]); // eslint-disable-line
  const done = LANG_IDS.every((l) => picked[l]);
  const right = LANG_IDS.filter((l) => picked[l] === r.target.id).length;

  const choose = (lang, w) => {
    if (picked[lang]) return;
    const ok = w.id === r.target.id;
    const np = { ...picked, [lang]: w.id };
    setPicked(np);
    beep(ok, sound);
    if (ok) { onScore(1); say(r.target[lang], lang, sound); }
    if (LANG_IDS.every((l) => np[l]) && LANG_IDS.every((l) => np[l] === r.target.id)) onScore(1);
  };
  const next = () => (i + 1 < rounds.length ? setI(i + 1) : onDone());

  return (
    <div className="stage">
      <div className="card clue" style={{ justifyContent: 'center' }}>
        <Pic w={r.target} />
        <div>
          <p className="label">Find this in all four languages</p>
          <p className="muted" style={{ margin: 0 }}>One right answer in each row. Get all four for a bonus point.</p>
        </div>
      </div>
      <div className="rows">
        {LANG_IDS.map((lang) => (
          <div key={lang} className="card mrow">
            <span className="who"><span className="f" aria-hidden="true">{LANGS[lang].flag}</span><span className={lang === 'zh' ? 'hz' : ''}>{LANGS[lang].name}</span></span>
            <div className="opts">
              {r.rows[lang].map((w) => {
                const p = picked[lang];
                const cls = !p ? '' : w.id === r.target.id ? 'right' : w.id === p ? 'wrong' : 'dim';
                return (
                  <button key={w.id} className={`opt ${cls}`} disabled={!!p} onClick={() => choose(lang, w)}>
                    {lang === 'zh'
                      ? <><span className="hzbig">{w.zh}</span>{p && w.id === r.target.id && <small>{pinyin(w)}</small>}</>
                      : <Word w={w} lang={lang} />}
                  </button>
                );
              })}
            </div>
            {picked[lang] && <Speak w={r.target} lang={lang} small />}
          </div>
        ))}
      </div>
      {done && (
        <Feedback ok={right >= 3} onNext={next} last={i + 1 === rounds.length}>
          <b>{right === 4 ? 'All four! +1 bonus' : `${right} of 4 right`}</b>
        </Feedback>
      )}
    </div>
  );
}
export const matchMax = (rounds) => rounds.length * 5;

// ---------------- Which language?
export function Which({ rounds, sound, onScore, onDone, onStep }) {
  const [i, setI] = useState(0);
  const [ans, setAns] = useState(null);
  const q = rounds[i];
  useEffect(() => { setAns(null); onStep && onStep(i); }, [i]); // eslint-disable-line
  const next = () => (i + 1 < rounds.length ? setI(i + 1) : onDone());
  const answer = (x, ok) => {
    if (ans) return;
    setAns(x);
    beep(ok, sound);
    if (ok) onScore(1);
  };

  if (q.kind === 'spot') {
    const ok = ans === q.lang;
    return (
      <div className="stage">
        <p className="ask">Which language is this word?</p>
        <div className="card bigword">
          <div className="w">{q.text}</div>
          <div style={{ marginTop: 12 }}><Speak w={q.word} lang={q.lang} /></div>
        </div>
        <div className="langpick">
          {LANG_IDS.map((l) => (
            <button key={l} className={`langbtn ${ans ? (l === q.lang ? 'right' : l === ans ? 'wrong' : '') : ''}`} onClick={() => answer(l, l === q.lang)} disabled={!!ans}>
              <span className="f" aria-hidden="true">{LANGS[l].flag}</span>
              <span className={l === 'zh' ? 'hz' : ''}>{LANGS[l].name}</span>
            </button>
          ))}
        </div>
        {ans && (
          <Feedback ok={ok} onNext={next} last={i + 1 === rounds.length}>
            <b>{ok ? cheerFor(q.lang) : `It's ${LANGS[q.lang].name}.`}</b>
            <div className="fw"><Pic w={q.word} /> <Word w={q.word} lang={q.lang} /> = {q.word.en}</div>
          </Feedback>
        )}
      </div>
    );
  }

  const ok = ans && ans.odd;
  return (
    <div className="stage">
      <p className="ask">Odd one out: three of these mean the same thing. Which one doesn't?</p>
      <div className="oddgrid">
        {q.cards.map((c) => (
          <button key={c.lang} className={`oddcard ${ans ? (c.odd ? 'right' : c === ans ? 'wrong' : '') : ''}`} onClick={() => answer(c, c.odd)} disabled={!!ans}>
            <Flag lang={c.lang} />
            <span className={c.lang === 'zh' ? 'hzw' : 'w'}>{c.lang === 'zh' ? c.word.zh : <Word w={c.word} lang={c.lang} />}</span>
            {ans && <span className="mean">{c.lang === 'zh' ? `${pinyin(c.word)} · ` : ''}{c.word.en}</span>}
          </button>
        ))}
      </div>
      {ans && (
        <Feedback ok={ok} onNext={next} last={i + 1 === rounds.length}>
          <b>{ok ? 'Spotted it!' : 'Not that one.'}</b> The other three all mean <b>{q.main.en}</b>; the odd one means <b>{q.other.en}</b>.
        </Feedback>
      )}
    </div>
  );
}

// ---------------- Mini crossword
export function Crossword({ puzzle, sound, onScore, onDone }) {
  const { items, cells, H, W } = puzzle;
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState(0);
  const [entry, setEntry] = useState({});
  const [marks, setMarks] = useState({});
  const [reveals, setReveals] = useState(0);
  const [checks, setChecks] = useState(0);
  const [solved, setSolved] = useState(false);
  const wrapRef = useRef(null);

  const cellsOf = (idx) => items[idx].letters.map((_, k) => `${items[idx].r + (items[idx].dir === 'down' ? k : 0)},${items[idx].c + (items[idx].dir === 'across' ? k : 0)}`);
  const act = cellsOf(active);
  const cur = act[Math.min(pos, act.length - 1)];
  const doneWord = (idx) => cellsOf(idx).every((k) => entry[k] === cells[k].ch);

  const startN = useMemo(() => {
    const m = {};
    items.forEach((p) => { m[`${p.r},${p.c}`] = p.n; });
    return m;
  }, [items]);

  const select = (key) => {
    const ws = cells[key].words;
    let idx = ws[0];
    if (ws.length > 1 && ws.includes(active) && cur === key) idx = ws.find((x) => x !== active);
    else if (ws.includes(active)) idx = active;
    setActive(idx);
    setPos(cellsOf(idx).indexOf(key));
  };

  const typeCh = (ch) => {
    if (solved) return;
    const k = act[pos] || act[act.length - 1];
    setEntry((e) => ({ ...e, [k]: ch }));
    setMarks((m) => { const n = { ...m }; delete n[k]; return n; });
    if (pos < act.length - 1) setPos(pos + 1);
  };
  const back = () => {
    if (solved) return;
    const k = act[pos];
    if (entry[k]) { setEntry((e) => { const n = { ...e }; delete n[k]; return n; }); return; }
    if (pos > 0) {
      const pk = act[pos - 1];
      setEntry((e) => { const n = { ...e }; delete n[pk]; return n; });
      setPos(pos - 1);
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Backspace') { e.preventDefault(); back(); return; }
      if (e.key.length === 1 && /\p{L}/u.test(e.key)) { e.preventDefault(); typeCh(up(e.key)); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const all = Object.keys(cells);
  const check = () => {
    const m = {};
    all.forEach((k) => { if (entry[k]) m[k] = entry[k] === cells[k].ch ? 'ok' : 'bad'; });
    setMarks(m);
    setChecks((c) => c + 1);
    const win = all.every((k) => entry[k] === cells[k].ch);
    beep(win, sound);
    if (win) finish(reveals, checks + 1);
  };
  const reveal = () => {
    const e = { ...entry };
    act.forEach((k) => { e[k] = cells[k].ch; });
    setEntry(e);
    setReveals((r) => r + 1);
    const it = items[active];
    say(it.word[it.lang], it.lang, sound);
    if (all.every((k) => e[k] === cells[k].ch)) finish(reveals + 1, checks);
  };
  const finish = (rv, ck) => {
    setSolved(true);
    const m = {};
    all.forEach((k) => { m[k] = 'ok'; });
    setMarks(m);
    onScore(Math.max(items.length * 2, items.length * 10 - rv * 8 - Math.max(0, ck - 1) * 2));
  };

  const it = items[active];
  const cs = W > 8 ? 34 : 40;
  const accents = it.lang === 'es' ? KEYS.es : it.lang === 'de' ? KEYS.de : '';

  return (
    <div className="stage" style={{ maxWidth: 1040 }} ref={wrapRef}>
      <div className="cwrap">
        <div>
          <div className="grid" style={{ gridTemplateColumns: `repeat(${W}, var(--cs))`, '--cs': `${cs}px` }} role="grid" aria-label="Crossword">
            {Array.from({ length: H * W }, (_, n) => {
              const r = Math.floor(n / W), c = n % W, key = `${r},${c}`;
              if (!cells[key]) return <span key={key} className="void" />;
              const cls = [marks[key] || '', key === cur && !solved ? 'cur' : act.includes(key) && !solved ? 'on' : ''].join(' ');
              return (
                <button key={key} className={`cell ${cls}`} onClick={() => select(key)} aria-label={`Square ${key}`}>
                  {startN[key] && <span className="n">{startN[key]}</span>}
                  {entry[key] || ''}
                </button>
              );
            })}
          </div>
          {!solved && (
            <>
              <div className="keypad" aria-label="Letters">
                {[...KEYS.en].map((k) => <button key={k} className="key" onClick={() => typeCh(k)}>{k}</button>)}
                {[...accents].map((k) => <button key={k} className="key acc" onClick={() => typeCh(k)}>{k}</button>)}
                <button className="key wide" onClick={back} aria-label="Delete"><Delete size={18} /></button>
              </div>
              <div className="tools">
                <button className="btn small" onClick={check}><Check size={16} /> Check</button>
                <button className="btn soft small" onClick={reveal}><Eye size={16} /> Show this word (−8)</button>
              </div>
            </>
          )}
        </div>
        <div className="clues">
          <p className="label">Clues · each answer is in a different language</p>
          {items.map((p, idx) => (
            <button key={idx} className={`clueitem ${idx === active ? 'on' : ''} ${doneWord(idx) ? 'done' : ''}`} onClick={() => { setActive(idx); setPos(0); }}>
              <span className="no">{p.n}{p.dir === 'across' ? '→' : '↓'}</span>
              <span className="e"><Pic w={p.word} /></span>
              <span className="t">
                <b><Word w={p.word} lang={p.clueLang} /></b>
                <small>Answer in {LANGS[p.lang].flag} {LANGS[p.lang].name} · {p.letters.length} letters</small>
              </span>
              <Speak w={p.word} lang={p.clueLang} small />
            </button>
          ))}
        </div>
      </div>
      {solved && (
        <Feedback ok onNext={onDone} last>
          <b>Puzzle done!</b> {reveals ? `${reveals} word${reveals > 1 ? 's' : ''} shown.` : 'No words shown.'}
        </Feedback>
      )}
    </div>
  );
}
export const crosswordMax = (p) => p.items.length * 10;
