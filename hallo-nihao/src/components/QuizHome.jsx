import { DATA } from '../data.js';
import { QUIZ_LENGTH, isPractised, quizPool } from '../lib/game.js';

const MEDALS = ['🥇', '🥈', '🥉', '4', '5'];

export default function QuizHome({ lang, stars, best, onStart }) {
  const L = DATA[lang];
  const pool = quizPool(stars, lang);
  const done = L.units.filter((u, i) => isPractised(stars, lang, i)).length;

  return (
    <section>
      <div className="qhero">
        <div className="shapes" aria-hidden="true">
          <span className="c1">★</span><span className="c2">☾</span><span className="c3">♥</span><span className="c4">☁</span>
        </div>
        <h1>Quiz Battle</h1>
        <p>{done ? `${L.name} words from the ${done} unit${done > 1 ? 's' : ''} you have practised (${pool.length} words).` : `${L.name} words from ${L.units[0].tag}. Practise more units to add their words.`} Answer fast to score big, then beat your best.</p>
        <div className="rules">
          <div><b>{QUIZ_LENGTH}</b>questions</div>
          <div><b>20 s</b>per question</div>
          <div><b>1000</b>points max, faster gets more</div>
          <div><b>+100</b>for each answer in a row</div>
        </div>
        <button className="btn" onClick={onStart}>Start battle</button>
      </div>
      <div className="board">
        <h3>Hall of fame · {L.name}</h3>
        {best.length ? best.map((r, k) => (
          <div className="row" key={k}><span>{MEDALS[k]} &nbsp;{r.d}</span><b>{r.s}</b></div>
        )) : <p className="empty">No battles yet. Your first score lands here.</p>}
      </div>
    </section>
  );
}
