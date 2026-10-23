import { Fragment } from 'react';
import { DATA } from '../data.js';
import { starsOf } from '../lib/game.js';

const OFFSETS = [0, -70, -90, -40, 40, 90, 70];

export default function LearnPath({ lang, stars, onStart }) {
  const L = DATA[lang];
  const started = L.units.filter((u, i) => starsOf(stars, lang, i) > 0).length;
  const next = L.units.findIndex((u, i) => starsOf(stars, lang, i) === 0);

  return (
    <section>
      <div className="hello">
        <h1>{L.hello}{lang === 'zh' ? ' nǐ hǎo' : ''}</h1>
        <p>Following <b>{L.book}</b>. Units open in the book's order: finish one to unlock the next. {started} of {L.units.length} started, 3 stars each.</p>
      </div>
      <div className="path">
        {L.units.map((u, i) => {
          const st = starsOf(stars, lang, i);
          // A unit opens once the unit before it has at least one star, so the
          // path is worked through in the textbook's order. A unit already
          // practised stays open, so earlier progress is never lost.
          const locked = i > 0 && st === 0 && starsOf(stars, lang, i - 1) === 0;
          const newModule = u.module && u.module !== L.units[i - 1]?.module;
          return (
            <Fragment key={u.id}>
            {newModule && <div className="module">{u.module}</div>}
            <div className={`node ${locked ? 'locked' : st === 0 && i !== next ? 'fresh' : ''}`} style={{ '--x': `${OFFSETS[i % OFFSETS.length]}px`, '--lc': L.color }}>
              <button onClick={() => onStart(i)} disabled={locked} aria-label={locked ? `${u.tag}, ${u.name}, locked until the unit before is finished` : `${u.tag}, ${u.name}, ${st} of 3 stars`}>
                <span className="disc">
                  {i === next && <span className="bubble">Start</span>}
                  {locked ? '🔒' : u.icon}
                </span>
                <span className="tag">{u.tag}</span>
                <span className="nm">{u.name}</span>
                <span className="stars" aria-hidden="true">
                  {Array.from({ length: 3 }, (_, k) => (k < st ? <b key={k}>★</b> : <span key={k}>★</span>))}
                </span>
              </button>
            </div>
            </Fragment>
          );
        })}
      </div>
    </section>
  );
}
