import React, { useEffect, useMemo, useState } from 'react';
import {
  Gamepad2, BookOpen, Sparkles, Info, Volume2, VolumeX, Star, ArrowLeft, Grid3x3, Puzzle, Shapes, Languages,
  Search, Plus, Trash2, Wand2, ShieldCheck, Database, KeyRound, BookMarked, Mic, Layers, RotateCcw, Check,
} from 'lucide-react';
import { WORDS, TOPICS, LANGS, LANG_IDS } from './words.js';
import { buildTiles, buildMatch, buildWhich, buildCrossword, pinyin, split } from './game.js';
import { parseSet, setWords, SET_TOPICS, EXAMPLE_SETS } from './aiwords.js';
import { load, save } from './store.js';
import { hasVoice, onVoices } from './sound.js';
import { Pic, Flag, Word, Speak } from './Bits.jsx';
import { Tiles, Match, Which, Crossword, tilesMax, matchMax, crosswordMax } from './Games.jsx';

const SECTIONS = [
  { id: 'play', name: 'Play', desc: 'Four word games, every round in four languages', icon: Gamepad2 },
  { id: 'bank', name: 'Word bank', desc: 'Every word with its picture, read aloud', icon: BookOpen },
  { id: 'new', name: 'New words', desc: 'Make a fresh word set on any topic', icon: Sparkles },
  { id: 'help', name: 'For grown-ups', desc: 'Where the words come from, what is stored', icon: Info },
];

const GAMES = [
  { id: 'tiles', name: 'Tile builder', desc: 'See a word in one language, spell it in another from letter tiles. Rarer letters score more.', icon: Puzzle, unit: '6 words' },
  { id: 'match', name: 'Four-way match', desc: 'One picture. Find its word in English, Spanish, German and Chinese.', icon: Shapes, unit: '6 pictures' },
  { id: 'crossword', name: 'Mini crossword', desc: 'Every clue is in one language and every answer in another.', icon: Grid3x3, unit: '1 puzzle' },
  { id: 'which', name: 'Which language?', desc: 'Spot the language of a word, then find the odd one out.', icon: Languages, unit: '10 questions' },
];

const NEED = { tiles: 6, match: 4, crossword: 8, which: 6 };

export default function App() {
  const [s, setS] = useState(load);
  const [section, setSection] = useState('play');
  const [game, setGame] = useState(null);
  const up = (patch) => setS((x) => ({ ...x, ...(typeof patch === 'function' ? patch(x) : patch) }));
  useEffect(() => save(s), [s]);

  const allWords = useMemo(() => [...WORDS, ...s.sets.flatMap(setWords)], [s.sets]);
  const topics = useMemo(() => [...TOPICS, ...s.sets.map((x) => ({ id: x.id, name: x.name, icon: x.icon, set: true }))], [s.sets]);
  const pool = useMemo(() => allWords.filter((w) => (s.topics.length ? s.topics.includes(w.t) : true) && (s.big || !w.big)), [allWords, s.topics, s.big]);

  const go = (id) => { setSection(id); setGame(null); };

  return (
    <div className="shell">
      <aside className="side" aria-label="Sections">
        <div className="brand">
          <span className="logo" aria-hidden="true">M</span>
          <div><b>Mischmasch</b><small>Word games in four languages</small></div>
        </div>
        <nav className="nav">
          {SECTIONS.map((x) => (
            <button key={x.id} aria-current={section === x.id ? 'page' : undefined} onClick={() => go(x.id)}>
              <span className="ic"><x.icon size={18} /></span>
              <span><b>{x.name}</b><small>{x.desc}</small></span>
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <div className="flags" aria-hidden="true">{LANG_IDS.map((l) => <span key={l}>{LANGS[l].flag}</span>)}</div>
          <div className="side-stat"><span>Stars earned</span><b>⭐ {s.stars}</b></div>
          <button className="toggle" onClick={() => up({ sound: !s.sound })} aria-pressed={s.sound}>
            {s.sound ? <Volume2 size={18} /> : <VolumeX size={18} />} Sound {s.sound ? 'on' : 'off'}
          </button>
        </div>
      </aside>

      <main className="main">
        <div className="page">
          <div className="mobile-top">
            <div className="brand"><div><b>Mischmasch</b><small>Word games in four languages</small></div></div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="score">⭐ {s.stars}</span>
              <button className="iconbtn" onClick={() => up({ sound: !s.sound })} aria-label={s.sound ? 'Sound off' : 'Sound on'}>
                {s.sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
            </div>
          </div>
          {section === 'play' && !game && <PlayHome s={s} up={up} pool={pool} topics={topics} onStart={setGame} goNew={() => go('new')} />}
          {section === 'play' && game && <GameFrame key={game.key} id={game.id} pool={pool} s={s} up={up} onExit={() => setGame(null)} onAgain={() => setGame({ id: game.id, key: Date.now() })} />}
          {section === 'bank' && <Bank words={allWords} topics={topics} />}
          {section === 'new' && <NewWords s={s} up={up} bank={allWords} />}
          {section === 'help' && <Help />}
        </div>
      </main>

      <nav className="tabs" aria-label="Sections">
        {SECTIONS.map((x) => (
          <button key={x.id} aria-current={section === x.id ? 'page' : undefined} onClick={() => go(x.id)}>
            <x.icon size={20} />{x.name}
          </button>
        ))}
      </nav>
    </div>
  );
}

// ---------------- Play home
function PlayHome({ s, up, pool, topics, onStart, goNew }) {
  const toggleTopic = (id) => up((x) => ({ topics: x.topics.includes(id) ? x.topics.filter((t) => t !== id) : [...x.topics, id] }));
  return (
    <>
      <div className="welcome">
        <span className="big" aria-hidden="true">🇬🇧🇪🇸🇩🇪🇨🇳</span>
        <div>
          <h2>Pick a game. Every round mixes all four languages.</h2>
          <p>Tap the speaker on any word to hear it.</p>
        </div>
      </div>

      <div className="games">
        {GAMES.map((g) => {
          const enough = pool.length >= NEED[g.id];
          return (
            <button key={g.id} className="card game" onClick={() => enough && onStart({ id: g.id, key: Date.now() })} disabled={!enough}>
              <span className="gi"><g.icon size={30} /></span>
              <span>
                <h3>{g.name}</h3>
                <p>{g.desc}</p>
                <span className="meta">
                  <span className="badge">{g.unit}</span>
                  {s.best[g.id] > 0 && <span className="badge solid"><Star size={12} /> Best {s.best[g.id]}</span>}
                  {!enough && <span className="badge">Pick more topics</span>}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="card pad filters">
        <div>
          <p className="label">Topics · {s.topics.length ? `${pool.length} words picked` : `all ${pool.length} words`}</p>
          <div className="chips">
            <button className="chip" aria-pressed={!s.topics.length} onClick={() => up({ topics: [] })}>All topics</button>
            {topics.map((t) => (
              <button key={t.id} className="chip" aria-pressed={s.topics.includes(t.id)} onClick={() => toggleTopic(t.id)}>
                <span aria-hidden="true">{t.icon}</span>{t.name}{t.set && <Sparkles size={12} />}
              </button>
            ))}
            <button className="chip add" onClick={goNew}><Plus size={14} /> Your own topic</button>
          </div>
        </div>
        <div>
          <p className="label">Harder words</p>
          <div className="chips">
            <button className="chip" aria-pressed={s.big} onClick={() => up({ big: !s.big })}>
              <span aria-hidden="true">🦋</span> Big words in English and Spanish
            </button>
          </div>
          <p className="muted" style={{ fontSize: 13.5, margin: '8px 0 0' }}>Longer words like butterfly and mariposa. They are only ever asked in English or Spanish, his school languages. German and Chinese stay at starter level.</p>
        </div>
      </div>
    </>
  );
}

// ---------------- Game frame: builds rounds, tracks score, shows the result
function GameFrame({ id, pool, s, up, onExit, onAgain }) {
  const meta = GAMES.find((g) => g.id === id);
  const data = useMemo(() => {
    if (id === 'tiles') { const r = buildTiles(pool); return { r, max: tilesMax(r), n: r.length }; }
    if (id === 'match') { const r = buildMatch(pool); return { r, max: matchMax(r), n: r.length }; }
    if (id === 'which') { const r = buildWhich(pool); return { r, max: r.length, n: r.length }; }
    const p = buildCrossword(pool);
    return { r: p, max: p ? crosswordMax(p) : 0, n: 1 };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [step, setStep] = useState(0);

  const add = (p) => setScore((x) => x + p);
  const finish = () => setDone(true);

  useEffect(() => {
    if (!done) return;
    const frac = data.max ? score / data.max : 0;
    const stars = frac >= 0.85 ? 3 : frac >= 0.55 ? 2 : 1;
    up((x) => ({ stars: x.stars + stars, played: x.played + 1, best: { ...x.best, [id]: Math.max(x.best[id] || 0, score) } }));
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!data.r || (Array.isArray(data.r) && !data.r.length)) {
    return (
      <div className="card result">
        <h2>Not enough words for this game</h2>
        <p className="muted">Pick more topics on the Play page and try again.</p>
        <div className="acts"><button className="btn" onClick={onExit}><ArrowLeft size={18} /> Back</button></div>
      </div>
    );
  }

  if (done) {
    const frac = data.max ? score / data.max : 0;
    const stars = frac >= 0.85 ? 3 : frac >= 0.55 ? 2 : 1;
    return (
      <div className="card result">
        <p className="label">{meta.name}</p>
        <h2>{stars === 3 ? 'Brilliant!' : stars === 2 ? 'Well done!' : 'Good try!'}</h2>
        <div className="stars" aria-label={`${stars} stars`}>{[1, 2, 3].map((n) => <span key={n} className={n > stars ? 'off' : ''}>⭐</span>)}</div>
        <p className="pts">{score} of {data.max} points</p>
        <p className="muted">{LANG_IDS.map((l) => LANGS[l].cheer).join('  ·  ')}</p>
        <div className="acts">
          <button className="btn" onClick={onAgain}><RotateCcw size={18} /> Play again</button>
          <button className="btn soft" onClick={onExit}><ArrowLeft size={18} /> All games</button>
        </div>
      </div>
    );
  }

  const Comp = { tiles: Tiles, match: Match, which: Which }[id];
  return (
    <>
      <div className="gamebar">
        <button className="iconbtn" onClick={onExit} aria-label="Back to games"><ArrowLeft size={18} /></button>
        <h2>{meta.name}</h2>
        <span className="score"><Star size={16} /> {score}</span>
      </div>
      {id !== 'crossword' && <div className="progress" aria-hidden="true"><span style={{ width: `${(step / data.n) * 100}%` }} /></div>}
      {id === 'crossword'
        ? <Crossword puzzle={data.r} sound={s.sound} onScore={add} onDone={finish} />
        : <Comp rounds={data.r} sound={s.sound} onScore={add} onDone={finish} onStep={setStep} />}
    </>
  );
}

// ---------------- Word bank
function Bank({ words, topics }) {
  const [q, setQ] = useState('');
  const [t, setT] = useState('');
  const [, force] = useState(0);
  useEffect(() => onVoices(() => force((n) => n + 1)), []);
  const list = words.filter((w) => (!t || w.t === t) && (!q || LANG_IDS.some((l) => (w[l] || '').toLowerCase().includes(q.toLowerCase())) || w.py.replace(/ /g, '').includes(q.toLowerCase())));
  const noVoice = LANG_IDS.filter((l) => !hasVoice(l));
  return (
    <>
      <div className="head">
        <div>
          <h1>Word bank</h1>
          <p>All {words.length} words, each in four languages. Spanish and German show el, la, der, die or das, and Chinese shows pinyin with tone marks.</p>
        </div>
      </div>
      <div className="bank-tools">
        <label className="search"><Search size={18} className="muted" /><span className="sr">Search</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search any language" />
        </label>
      </div>
      <div className="chips" style={{ marginBottom: 16 }}>
        <button className="chip" aria-pressed={!t} onClick={() => setT('')}>All</button>
        {topics.map((x) => <button key={x.id} className="chip" aria-pressed={t === x.id} onClick={() => setT(x.id)}><span aria-hidden="true">{x.icon}</span>{x.name}</button>)}
      </div>
      {noVoice.length > 0 && <p className="note"><Mic size={16} /> This device has no voice for {noVoice.map((l) => LANGS[l].name).join(', ')}, so those speaker buttons stay quiet.</p>}
      <div className="bank" style={{ marginTop: 12 }}>
        {list.map((w) => (
          <div key={w.id} className="card wcard">
            <Pic w={w} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <ul>
                {LANG_IDS.map((l) => (
                  <li key={l}>
                    <span className="f" aria-hidden="true">{LANGS[l].flag}</span>
                    <span className="x"><Word w={w} lang={l} /></span>
                    <Speak w={w} lang={l} small />
                  </li>
                ))}
              </ul>
              {(w.big || w.ai || w.ph) && (
                <div className="tagrow">
                  {w.big && <span className="badge">🦋 Big word: asked in EN and ES</span>}
                  {w.ph && <span className="badge">Phrase</span>}
                  {w.ai && <span className="badge"><Sparkles size={12} /> Made by AI</span>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ---------------- New words (AI sets)
const PROVIDERS = [
  { id: 'muse', name: 'Muse Glimmer (free, no key needed)' },
  { id: 'anthropic', name: 'Anthropic (your key)' },
  { id: 'openai', name: 'OpenAI (your key)' },
  { id: 'gemini', name: 'Gemini (your key)' },
];

function NewWords({ s, up, bank }) {
  const [topic, setTopic] = useState('');
  const [custom, setCustom] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [draft, setDraft] = useState(null); // { name, icon, words, dropped, keep, made }
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');

  const chosen = custom.trim() || topic;
  const iconFor = (name) => SET_TOPICS.find((x) => x.name === name)?.icon || '✨';

  const make = async () => {
    setErr(''); setDraft(null); setBusy(true);
    try {
      const r = await fetch('/api/words', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: chosen, provider: s.provider, apiKey, model }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
      const res = parseSet(data.text, bank);
      if (res.unsuitable) { setErr(res.unsuitable); return; }
      if (!res.words.length) { setErr('None of the words passed the checks. Try again or pick another topic.'); return; }
      setDraft({ name: chosen, icon: iconFor(chosen), words: res.words, dropped: res.dropped, keep: res.words.map(() => true), made: 'ai' });
    } catch (e) {
      setErr(e.message);
    } finally { setBusy(false); }
  };

  const loadExample = (ex) => {
    setErr('');
    setDraft({ id: ex.id, name: ex.name, icon: ex.icon, words: ex.words, dropped: [], keep: ex.words.map(() => true), made: 'example' });
  };

  const add = () => {
    const words = draft.words.filter((_, i) => draft.keep[i]);
    const id = draft.id || `set-${Date.now().toString(36)}`;
    up((x) => ({ sets: [...x.sets.filter((y) => y.id !== id), { id, name: draft.name, icon: draft.icon, words, made: draft.made }] }));
    setDraft(null);
  };
  const remove = (id) => up((x) => ({ sets: x.sets.filter((y) => y.id !== id), topics: x.topics.filter((t) => t !== id) }));

  return (
    <>
      <div className="head">
        <div>
          <h1>New words</h1>
          <p>Ask a model for eight new words on a topic he loves, in all four languages. A grown-up checks the list before it joins the games.</p>
        </div>
      </div>
      <div className="two">
        <div className="stack">
          <div className="card pad">
            <p className="label">Topic</p>
            <div className="chips">
              {SET_TOPICS.map((t) => (
                <button key={t.name} className="chip" aria-pressed={!custom && topic === t.name} onClick={() => { setTopic(t.name); setCustom(''); }}>
                  <span aria-hidden="true">{t.icon}</span>{t.name}
                </button>
              ))}
              <label className="chip add"><Plus size={14} /><span className="sr">Your own topic</span>
                <input value={custom} onChange={(e) => setCustom(e.target.value.slice(0, 40))} placeholder="Your own topic" />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16, flexWrap: 'wrap' }}>
              <button className="btn" onClick={make} disabled={!chosen || busy}><Wand2 size={18} /> {busy ? 'Making words…' : 'Make 8 words'}</button>
              <span className="muted" style={{ fontSize: 13.5 }}>Takes about 10 to 20 seconds.</span>
            </div>
            {err && <p className="err" style={{ marginTop: 12 }}>{err}</p>}
          </div>

          {draft && (
            <div className="card pad">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: 20 }}>{draft.icon} {draft.name}</h3>
                <span className="badge">{draft.made === 'ai' ? <><Sparkles size={12} /> Made by AI · check before adding</> : <><Check size={12} /> Saved example · checked by hand</>}</span>
              </div>
              <p className="muted" style={{ fontSize: 14, margin: '6px 0 0' }}>Untick any word that looks wrong. Every line has already passed the checks listed on the right.</p>
              <div className="review">
                {draft.words.map((w, i) => (
                  <label key={i} className={`rv ${draft.keep[i] ? '' : 'off'}`}>
                    <input type="checkbox" checked={draft.keep[i]} onChange={() => setDraft({ ...draft, keep: draft.keep.map((k, j) => (j === i ? !k : k)) })} />
                    <span className="e">{w.pic}</span>
                    <span className="ws">
                      <span>🇬🇧 {w.en}</span><span>🇪🇸 {w.es}</span><span>🇩🇪 {w.de}</span><span>🇨🇳 <span className="hz">{w.zh}</span> {w.py.replace(/ /g, '')}</span>
                    </span>
                  </label>
                ))}
              </div>
              {draft.dropped.length > 0 && (
                <div className="drop" style={{ marginTop: 10 }}>
                  <b>{draft.dropped.length} line{draft.dropped.length > 1 ? 's' : ''} dropped by the checks:</b>
                  {draft.dropped.map((d, i) => <div key={i}>{d.why}: {d.line}</div>)}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                <button className="btn" onClick={add} disabled={!draft.keep.some(Boolean)}><Plus size={18} /> Add {draft.keep.filter(Boolean).length} words to the games</button>
                <button className="btn ghost" onClick={() => setDraft(null)}>Discard</button>
              </div>
            </div>
          )}

          {s.sets.length > 0 && (
            <div className="card pad">
              <p className="label">Sets in the games</p>
              <div className="stack" style={{ gap: 8 }}>
                {s.sets.map((x) => (
                  <div key={x.id} className="setrow">
                    <span className="e">{x.icon}</span>
                    <span className="grow"><b>{x.name}</b> <span className="muted">· {x.words.length} words · {x.made === 'ai' ? 'made by AI' : 'example'}</span></span>
                    <button className="iconbtn small" onClick={() => remove(x.id)} aria-label={`Remove ${x.name}`}><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="stack">
          <div className="card pad">
            <p className="label">Try a saved example</p>
            <div className="examples">
              {EXAMPLE_SETS.map((ex) => (
                <button key={ex.id} className="card ex" onClick={() => loadExample(ex)}>
                  <span className="e">{ex.icon}</span>
                  <span><b>{ex.name}</b><small>{ex.words.slice(0, 4).map((w) => w.en).join(', ')}…</small></span>
                </button>
              ))}
            </div>
          </div>
          <div className="card pad">
            <p className="label">Checks on every line</p>
            <div className="stack" style={{ gap: 8, fontSize: 14 }}>
              {['A picture and all four languages are present', 'Spanish article is el, la, los or las; German is der, die or das', 'Chinese is 1 to 4 characters, one pinyin syllable for each', 'Pinyin uses only letters and tone marks', 'Not already in the word bank', 'Topics that are not right for a child are refused'].map((c) => (
                <div key={c} className="note" style={{ padding: '8px 12px' }}><ShieldCheck size={16} /> {c}</div>
              ))}
            </div>
          </div>
          <details className="card pad settings">
            <summary><KeyRound size={16} /> Model settings</summary>
            <div className="stack" style={{ gap: 12 }}>
              <label className="field">Provider
                <select value={s.provider} onChange={(e) => up({ provider: e.target.value })}>
                  {PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
              {s.provider !== 'muse' && (
                <>
                  <label className="field">API key
                    <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Used for one request, never stored" autoComplete="off" />
                  </label>
                  <label className="field">Model (optional)
                    <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Leave blank for the default" />
                  </label>
                </>
              )}
            </div>
          </details>
        </div>
      </div>
    </>
  );
}

// ---------------- For grown-ups
function Help() {
  const facts = [
    { icon: Layers, h: 'Every round mixes languages', p: 'The tile builder rotates the language to spell in, the match asks for all four at once, every crossword answer is in a different language from its clue, and the odd one out puts four languages side by side.' },
    { icon: BookMarked, h: 'Where the words come from', p: `All ${WORDS.length} core words are written into the app and checked by hand. German and Chinese stay at the level of his first-year books. English and Spanish add longer stretch words, since those are his school languages.` },
    { icon: Sparkles, h: 'What the AI does', p: 'Only the New words page uses a model, and only when a grown-up asks. Each line is checked for shape, and you tick the words before they join the games. Sets made this way carry a "Made by AI" tag.' },
    { icon: Database, h: 'What is stored', p: 'Scores, stars, topic choices and added sets stay in this browser. There is no sign-in. The only thing sent anywhere is the topic typed into New words. An API key is used for one request and never saved.' },
    { icon: Mic, h: 'Voices', p: 'Words are read aloud by the voices already on the device. Most tablets and phones have all four. If one is missing, its speaker button stays quiet; adding the language in the device settings fixes it.' },
    { icon: Puzzle, h: 'Scoring', p: 'Tiles score more for rarer letters (q, x, z, ñ, ü, ß) and 3 for each Chinese character, plus 5 for a word with no hints or wrong tries. Stars at the end: three for 85% of the points, two for 55%.' },
  ];
  return (
    <>
      <div className="head"><div><h1>For grown-ups</h1><p>How Mischmasch works, in a minute.</p></div></div>
      <div className="facts">
        {facts.map((f) => (
          <div key={f.h} className="card fact">
            <span className="fi"><f.icon size={22} /></span>
            <div><h3>{f.h}</h3><p>{f.p}</p></div>
          </div>
        ))}
      </div>
      <div className="card pad booklist">
        <p className="label">Pitched at 3º Primaria, alongside these books</p>
        <table>
          <thead><tr><th>Language</th><th>Book on the list</th><th>Level used here</th></tr></thead>
          <tbody>
            <tr><td>🇬🇧 English</td><td>Amazing Journey 4 (Richmond), Cambridge Primary Reading Anthologies 3</td><td>Everyday words plus stretch words up to 10 letters</td></tr>
            <tr><td>🇪🇸 Spanish</td><td>Lengua 3 (Grazalema)</td><td>Everyday words plus stretch words, with accents on the tiles</td></tr>
            <tr><td>🇩🇪 German</td><td>Paul, Lisa &amp; Co Starter (Hueber)</td><td>Starter words with der, die or das</td></tr>
            <tr><td>🇨🇳 Chinese</td><td className="hz">Kuaile Hanyu 1 (快乐汉语 第一册)</td><td>Starter words in characters with pinyin</td></tr>
          </tbody>
        </table>
        <p className="muted" style={{ fontSize: 13.5, marginBottom: 0 }}>The words follow the level and topics of these books. They are not copied from the books' own word lists.</p>
      </div>
    </>
  );
}
