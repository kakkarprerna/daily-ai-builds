import { DATA } from '../data.js';
import { isUnlocked, starsOf } from '../lib/game.js';

const OFFSETS = [0, -70, -90, -40, 40, 90, 70];

export default function LearnPath({ lang, stars, onStart }) {
  const L = DATA[lang];
  const started = L.units.filter((u, i) => starsOf(stars, lang, i) > 0).length;
  const next = L.units.findIndex((u, i) => isUnlocked(stars, lang, i) && starsOf(stars, lang, i) === 0);

  return (
    <section>
      <div className="hello">
        <h1>{L.hello}{lang === 'zh' ? ' nǐ hǎo' : ''}</h1>
        <p>{L.name} path: {started} of {L.units.length} units started. Each unit has 3 stars to win.</p>
      </div>
      <div className="path">
        {L.units.map((u, i) => {
          const locked = !isUnlocked(stars, lang, i);
          const st = starsOf(stars, lang, i);
          return (
            <div key={u.id} className={`node ${locked ? 'locked' : ''}`} style={{ '--x': `${OFFSETS[i % OFFSETS.length]}px`, '--lc': L.color }}>
              <button disabled={locked} onClick={() => onStart(i)} aria-label={`${u.name}${locked ? ' (locked)' : `, ${st} of 3 stars`}`}>
                <span className="disc">
                  {i === next && <span className="bubble">Start</span>}
                  {locked ? '🔒' : u.icon}
                </span>
                <span className="nm">{u.name}</span>
                <span className="stars" aria-hidden="true">
                  {Array.from({ length: 3 }, (_, k) => (k < st ? <b key={k}>★</b> : <span key={k}>★</span>))}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
