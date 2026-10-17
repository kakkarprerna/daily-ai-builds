import { DATA } from '../data.js';
import { speak } from '../lib/sound.js';
import { Pic, Word } from './Bits.jsx';

export default function WordList({ lang, sound }) {
  const L = DATA[lang];
  return (
    <section>
      <div className="hello">
        <h1>My words</h1>
        <p>Tap 🔊 to hear any word. Handy for homework.</p>
      </div>
      <div className="legend">
        {lang === 'de' ? (
          <>
            <span className="a-der">der · masculine</span>
            <span className="a-die">die · feminine</span>
            <span className="a-das">das · neuter</span>
          </>
        ) : (
          <span>Tones: ā flat · á up · ǎ down and up · à down</span>
        )}
      </div>
      {L.units.map((u) => (
        <section className="wsec" key={u.id}>
          <h2><span aria-hidden="true">{u.icon}</span> {u.name}</h2>
          {u.words.map((w) => (
            <div className="wrow" key={w.w}>
              <span className="pic"><Pic w={w} /></span>
              <span className="w">
                {lang === 'zh'
                  ? <><span className="hz">{w.w}</span> <span className="py inline">{w.py}</span></>
                  : <Word w={w} lang={lang} />}
                <span className="en">{w.en}</span>
              </span>
              <button className="iconbtn" onClick={() => speak(w, lang, sound)} aria-label={`Hear ${w.en}`}>🔊</button>
            </div>
          ))}
        </section>
      ))}
    </section>
  );
}
