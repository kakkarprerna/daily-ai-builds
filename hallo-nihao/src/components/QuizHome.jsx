import { DATA } from '../data.js';
import { QUIZ_LENGTH, isUnlocked, quizPool } from '../lib/game.js';

const MEDALS = ['🥇', '🥈', '🥉', '4', '5'];

export default function QuizHome({ lang, stars, best, onStart }) {
  const L = DATA[lang];
  const pool = quizPool(stars, lang);
  const open = L.units.filter((u, i) => isUnlocked(stars, lang, i)).length;

  return (
    <section>
      <div className="qhero">
        <div className="shapes" aria-hidden="true">
          <span className="c1">★</span><span className="c2">☾</span><span className="c3">♥</span><span className="c4">☁</span>
        </div>
        <h1>Quiz Battle</h1>
        <p>{L.name} words from your {open} open unit{open > 1 ? 's' : ''} ({pool.length} words). Answer fast to score big, then try to beat your best.</p>
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
