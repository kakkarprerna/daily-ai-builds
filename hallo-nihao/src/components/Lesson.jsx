import { useEffect, useRef, useState } from 'react';
import { DATA } from '../data.js';
import { buildLesson, lessonXp, pick, shuffle } from '../lib/game.js';
import { beep, speak } from '../lib/sound.js';
import { Pic, Word, answerText } from './Bits.jsx';

const hearts = (n) => '♥'.repeat(Math.max(0, n)) + '♡'.repeat(3 - Math.max(0, n));

export default function Lesson({ lang, ui, sound, listenOk, onClose, onRetry, onFinish }) {
  const L = DATA[lang];
  const unit = L.units[ui];
  const [queue, setQueue] = useState(() => buildLesson(lang, ui, listenOk));
  const [i, setI] = useState(0);
  const [lives, setLives] = useState(3);
  const [sel, setSel] = useState(null);
  const [phase, setPhase] = useState('ask'); // ask | feedback | out | done
  const [verdict, setVerdict] = useState(null); // { ok, cheer }
  const [match, setMatch] = useState(null);
  const [summary, setSummary] = useState(null);
  const mistakes = useRef(0);
  const nextBtn = useRef(null);
  const q = queue[i];

  useEffect(() => {
    if (phase !== 'ask' || !q) return undefined;
    setSel(null);
    if (q.type === 'match') {
      setMatch({ L: shuffle(q.pairs.slice()), R: shuffle(q.pairs.slice()), left: null, done: [], wrong: null });
    }
    if (q.type === 'pickPic' || q.type === 'listen') {
      const t = setTimeout(() => speak(q.target, lang, sound), 250);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [i, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (phase === 'feedback') nextBtn.current?.focus(); }, [phase]);

  function answer(ok) {
    beep(ok, sound);
    if (q.target) speak(q.target, lang, sound);
    if (!ok) {
      mistakes.current += 1;
      setLives((h) => h - 1);
      // A missed question comes back once at the end, with its options reshuffled.
      if (!q.retry) setQueue((prev) => [...prev, { ...q, retry: true, opts: q.opts ? shuffle(q.opts.slice()) : undefined }]);
    }
    setVerdict({ ok, cheer: ok ? pick(L.cheers) : L.oops });
    setPhase('feedback');
  }

  function check() {
    const ok = q.type === 'article' ? sel === q.target.art : q.opts[sel] === q.target;
    answer(ok);
  }

  function next() {
    if (lives <= 0) { setPhase('out'); return; }
    if (i + 1 >= queue.length) {
      const xp = lessonXp(mistakes.current);
      const s = onFinish(unit.id, xp);
      setSummary({ ...s, xp, perfect: mistakes.current === 0, cheer: pick(L.cheers).split(' ')[0] });
      beep(true, sound);
      setPhase('done');
      return;
    }
    setI(i + 1);
    setPhase('ask');
  }

  function choose(v, w) {
    if (phase !== 'ask') return;
    setSel(v);
    if (w && (q.type === 'pinyin' || q.type === 'pickWord')) speak(w, lang, sound);
  }

  function tapLeft(idx) {
    if (phase !== 'ask') return;
    setMatch((m) => ({ ...m, left: idx }));
    speak(match.L[idx], lang, sound);
  }

  function tapRight(idx) {
    if (phase !== 'ask' || !match) return;
    if (match.left == null) {
      setMatch((m) => ({ ...m, wrong: { r: idx } }));
      setTimeout(() => setMatch((m) => m && { ...m, wrong: null }), 420);
      return;
    }
    const lw = match.L[match.left];
    const rw = match.R[idx];
    if (lw === rw) {
      beep(true, sound);
      const done = [...match.done, lw];
      setMatch({ ...match, done, left: null });
      if (done.length === match.L.length) {
        setTimeout(() => { setVerdict({ ok: true, cheer: pick(L.cheers) }); setPhase('feedback'); }, 300);
      }
    } else {
      mistakes.current += 1;
      beep(false, sound);
      setMatch({ ...match, wrong: { l: match.left, r: idx } });
      setTimeout(() => setMatch((m) => m && { ...m, wrong: null }), 450);
    }
  }

  const progress = phase === 'done' ? 100 : (i / queue.length) * 100;
  const revealed = phase === 'feedback';
  const optClass = (isSel, isRight) =>
    `opt ${isSel && !revealed ? 'sel' : ''} ${revealed && isRight ? 'right' : ''} ${revealed && isSel && !isRight ? 'wrong' : ''}`;

  let body = null;
  if (phase === 'out') {
    body = (
      <div className="result">
        <div className="big">💔</div>
        <h2>Out of hearts</h2>
        <p>No problem. Every mistake is practice. Shall we go again?</p>
      </div>
    );
  } else if (phase === 'done' && summary) {
    body = (
      <div className="result">
        <div className="big">{summary.perfect ? '🏅' : '🎉'}</div>
        <h2>{summary.cheer}</h2>
        <p>You finished <b>{unit.name}</b>{summary.perfect ? ' with no mistakes' : ''}.</p>
        <div className="tiles">
          <div className="tile"><b>+{summary.xp}</b><span>XP</span></div>
          <div className="tile"><b>{'★'.repeat(summary.stars)}</b><span>Stars</span></div>
          <div className="tile"><b>{summary.streak}</b><span>Day streak</span></div>
        </div>
      </div>
    );
  } else if (q.type === 'pickPic') {
    body = (
      <>
        <p className="qlabel">Which picture is this?</p>
        <button className="say" onClick={() => speak(q.target, lang, sound)}>
          <Word w={q.target} lang={lang} /><span className="spk" aria-label="Hear it">🔊</span>
        </button>
        <div className="grid">
          {q.opts.map((o, k) => (
            <button key={k} className={optClass(sel === k, o === q.target)} onClick={() => choose(k)}>
              <Pic w={o} /><span className="en">{o.en}</span>
            </button>
          ))}
        </div>
      </>
    );
  } else if (q.type === 'pickWord' || q.type === 'listen') {
    body = (
      <>
        <p className="qlabel">{q.type === 'listen' ? 'What do you hear?' : 'How do you say this?'}</p>
        {q.type === 'listen' ? (
          <button className="bigspk" onClick={() => speak(q.target, lang, sound)} aria-label="Play the word again">🔊</button>
        ) : (
          <div className="showpic"><Pic w={q.target} /><span className="en">{q.target.en}</span></div>
        )}
        <div className="grid">
          {q.opts.map((o, k) => (
            <button key={k} className={optClass(sel === k, o === q.target)} onClick={() => choose(k, o)}>
              <Word w={o} lang={lang} />
            </button>
          ))}
        </div>
      </>
    );
  } else if (q.type === 'pinyin') {
    body = (
      <>
        <p className="qlabel">How do you read this?</p>
        <div className="hanzi-big">{q.target.w}</div>
        <div className="grid">
          {q.opts.map((o, k) => (
            <button key={k} className={optClass(sel === k, o === q.target)} onClick={() => choose(k, o)}>{o.py}</button>
          ))}
        </div>
      </>
    );
  } else if (q.type === 'article') {
    body = (
      <>
        <p className="qlabel">der, die or das?</p>
        <div className="showpic"><Pic w={q.target} /><span className="en big-en">… {q.target.w}</span></div>
        <div className="arts">
          {['der', 'die', 'das'].map((a) => (
            <button key={a} className={`${optClass(sel === a, a === q.target.art)} a-${a}`} onClick={() => choose(a)}>{a}</button>
          ))}
        </div>
        <p className="hint">
          Tip: <span className="art a-der">der</span> is often a boy word, <span className="art a-die">die</span> a girl word and{' '}
          <span className="art a-das">das</span> a thing word. Not always, so keep practising!
        </p>
      </>
    );
  } else if (q.type === 'match' && match) {
    body = (
      <>
        <p className="qlabel">Match the pairs</p>
        <div className="match">
          <div className="col">
            {match.L.map((o, k) => (
              <button key={k} onClick={() => tapLeft(k)}
                className={`opt ${match.left === k ? 'sel' : ''} ${match.done.includes(o) ? 'done' : ''} ${match.wrong?.l === k ? 'wrong shake' : ''}`}>
                <Word w={o} lang={lang} />
              </button>
            ))}
          </div>
          <div className="col">
            {match.R.map((o, k) => (
              <button key={k} onClick={() => tapRight(k)}
                className={`opt ${match.done.includes(o) ? 'done' : ''} ${match.wrong?.r === k ? 'wrong shake' : ''}`}>
                <Pic w={o} /><span className="en">{o.en}</span>
              </button>
            ))}
          </div>
        </div>
      </>
    );
  }

  let foot = null;
  if (phase === 'ask' && q.type !== 'match') {
    foot = <button className="btn" disabled={sel == null} onClick={check}>Check</button>;
  } else if (phase === 'feedback' && verdict) {
    foot = (
      <div className={`sheet ${verdict.ok ? 'ok' : 'no'}`}>
        <h3>{verdict.cheer}</h3>
        {q.target && (verdict.ok
          ? <p>{answerText(q.target, lang)}</p>
          : <p>The answer is <b>{answerText(q.target, lang)}</b>. We will try it again at the end.</p>)}
        <button ref={nextBtn} className={`btn ${verdict.ok ? 'good' : 'bad'}`} onClick={next}>Continue</button>
      </div>
    );
  } else if (phase === 'out') {
    foot = (
      <>
        <button className="btn" onClick={onRetry}>Try again</button>
        <button className="btn ghost" onClick={onClose}>Back to the path</button>
      </>
    );
  } else if (phase === 'done') {
    foot = <button className="btn good" onClick={onClose}>Continue</button>;
  }

  return (
    <div className="overlay" role="dialog" aria-label={`${unit.name} lesson`}>
      <div className="ov-in">
        <div className="lbar">
          <button className="iconbtn" onClick={onClose} aria-label="Leave lesson">✕</button>
          <div className="prog"><i style={{ width: `${progress}%` }} /></div>
          <span className="hearts" aria-label={`${Math.max(0, lives)} hearts left`}>{hearts(lives)}</span>
        </div>
        <div className="qarea">{body}</div>
        <div className="foot" aria-live="polite">{foot}</div>
      </div>
    </div>
  );
}
