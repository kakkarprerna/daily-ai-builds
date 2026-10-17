import { useEffect, useRef, useState } from 'react';
import { DATA } from '../data.js';
import { QUIZ_LIMIT_MS, buildQuiz, pick, quizPoints } from '../lib/game.js';
import { beep, speak } from '../lib/sound.js';
import { Pic, Word, answerText } from './Bits.jsx';

const GLYPH = ['★', '☾', '♥', '☁'];

export default function QuizBattle({ lang, stars, sound, listenOk, onEnd, onAgain, onClose }) {
  const L = DATA[lang];
  const [qs] = useState(() => buildQuiz(stars, lang, listenOk));
  const [phase, setPhase] = useState('count'); // count | ask | reveal | end
  const [count, setCount] = useState(3);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [right, setRight] = useState(0);
  const [picked, setPicked] = useState(null);
  const [last, setLast] = useState(null);
  const [result, setResult] = useState(null);
  const run = useRef(0);
  const t0 = useRef(0);
  const bar = useRef(null);
  const phaseRef = useRef(phase);
  const nextBtn = useRef(null);
  phaseRef.current = phase;
  const q = qs[i];

  // 3, 2, 1, go
  useEffect(() => {
    if (phase !== 'count') return undefined;
    if (count > 0) beep(true, sound);
    const t = setTimeout(() => (count > 0 ? setCount(count - 1) : setPhase('ask')), count > 0 ? 900 : 800);
    return () => clearTimeout(t);
  }, [phase, count]); // eslint-disable-line react-hooks/exhaustive-deps

  function answer(idx) {
    if (phaseRef.current !== 'ask') return;
    phaseRef.current = 'reveal';
    const elapsed = performance.now() - t0.current;
    const ok = idx >= 0 && q.opts[idx] === q.target;
    run.current = ok ? run.current + 1 : 0;
    const { pts, bonus } = quizPoints(ok, elapsed, run.current);
    setScore((s) => s + pts + bonus);
    if (ok) setRight((r) => r + 1);
    setPicked(idx);
    setLast({ ok, pts, bonus, timeout: idx < 0, cheer: ok ? pick(L.cheers) : L.oops });
    beep(ok, sound);
    speak(q.target, lang, sound);
    setPhase('reveal');
  }

  // Question timer: the bar is updated directly each frame to avoid re-rendering.
  useEffect(() => {
    if (phase !== 'ask') return undefined;
    let speakT;
    if (q.type !== 'pickWord') speakT = setTimeout(() => speak(q.target, lang, sound), 200);
    t0.current = performance.now();
    let raf;
    const step = () => {
      const el = performance.now() - t0.current;
      const f = Math.max(0, 1 - el / QUIZ_LIMIT_MS);
      if (bar.current) {
        bar.current.style.width = `${f * 100}%`;
        bar.current.classList.toggle('low', f < 0.25);
      }
      if (el >= QUIZ_LIMIT_MS) { answer(-1); return; }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); clearTimeout(speakT); };
  }, [phase, i]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (phase === 'reveal') nextBtn.current?.focus(); }, [phase]);

  function next() {
    if (i + 1 < qs.length) {
      setI(i + 1);
      setPicked(null);
      setPhase('ask');
    } else {
      setResult(onEnd(score, right));
      beep(true, sound);
      setPhase('end');
    }
  }

  let content;
  if (phase === 'count') {
    content = <div className="count"><span key={count}>{count > 0 ? count : L.go}</span></div>;
  } else if (phase === 'end' && result) {
    const slot = (r, cls, place) => (
      <div className={`pod ${cls} ${r?.me ? 'me' : ''}`}>
        <span className="sc">{r ? r.s : '–'}</span>
        <span className="who">{r ? (r.me ? 'This game' : r.d) : 'empty'}</span>
        <div className="blk">{place}</div>
      </div>
    );
    content = (
      <>
        <div className="sbar"><span className="pill">{L.name}</span><span className="pill">{right} of {qs.length} right</span></div>
        <div className="endhead">
          <h2>{result.record ? 'New record!' : 'Battle over'}</h2>
          <p>{score} points · +{right * 2} XP</p>
        </div>
        <div className="podium">
          {slot(result.top[1], 'p2', '2')}
          {slot(result.top[0], 'p1', '1')}
          {slot(result.top[2], 'p3', '3')}
        </div>
        <div className="foot">
          <button className="btn" onClick={onAgain}>Play again</button>
          <button className="btn ghost" onClick={onClose}>Done</button>
        </div>
      </>
    );
  } else {
    const revealed = phase === 'reveal';
    content = (
      <>
        <div className="sbar">
          <button onClick={onClose}>✕ Quit</button>
          <span className="pill">Question {i + 1} of {qs.length}</span>
          <span className="pill">{score} pts</span>
        </div>
        <div className="qcard">
          {q.type === 'pickWord' && <><span className="lab">How do you say this?</span><Pic w={q.target} /><span className="en">{q.target.en}</span></>}
          {q.type === 'pickPic' && <><span className="lab">Find the picture</span><span className="word"><Word w={q.target} lang={lang} /></span></>}
          {q.type === 'listen' && <><span className="lab">What do you hear?</span>
            <button className="bigspk" onClick={() => speak(q.target, lang, sound)} aria-label="Play again">🔊</button></>}
        </div>
        <div className="timer"><i ref={bar} /></div>
        <div className="ans">
          {q.opts.map((o, k) => (
            <button key={`${i}-${k}`} className={`c${k + 1} ${revealed ? (o === q.target ? 'hit' : 'dim') : ''}`}
              onClick={() => answer(k)} disabled={revealed}>
              <span className="glyph" aria-hidden="true">{GLYPH[k]}</span>
              {q.type === 'pickPic' ? <span><Pic w={o} /><span className="en">{o.en}</span></span> : <Word w={o} lang={lang} />}
            </button>
          ))}
        </div>
        <div aria-live="polite">
          {revealed && last && (
            <div className={`verdict ${last.ok ? 'ok' : 'no'}`}>
              <h3>{last.timeout ? 'Time is up!' : last.cheer}</h3>
              {last.ok
                ? <span className="pts">+{last.pts}{last.bonus ? `  🔥 +${last.bonus} streak` : ''}</span>
                : <span>{answerText(q.target, lang)}</span>}
              <button ref={nextBtn} className="btn" onClick={next}>{i + 1 < qs.length ? 'Next question' : 'See the podium'}</button>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="overlay stage" role="dialog" aria-label="Quiz battle">
      <div className="ov-in">{content}</div>
    </div>
  );
}
