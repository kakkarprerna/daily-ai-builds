import { useEffect, useState } from 'react';
import { DATA } from './data.js';
import { loadState, nextStreak, saveState } from './lib/store.js';
import { canListen, onVoicesChanged } from './lib/sound.js';
import LearnPath from './components/LearnPath.jsx';
import Lesson from './components/Lesson.jsx';
import QuizHome from './components/QuizHome.jsx';
import QuizBattle from './components/QuizBattle.jsx';
import WordList from './components/WordList.jsx';
import GrownUps from './components/GrownUps.jsx';

const TABS = [
  ['learn', '🗺️', 'Learn'],
  ['quiz', '🏆', 'Quiz Battle'],
  ['words', '📖', 'Words'],
];

export default function App() {
  const [S, setS] = useState(loadState);
  const [tab, setTab] = useState('learn');
  const [lesson, setLesson] = useState(null); // { ui, key }
  const [quizKey, setQuizKey] = useState(null);
  const [info, setInfo] = useState(false);
  const [, setVoiceTick] = useState(0);

  useEffect(() => onVoicesChanged(() => setVoiceTick((n) => n + 1)), []);
  useEffect(() => {
    document.body.style.overflow = lesson || quizKey || info ? 'hidden' : '';
  }, [lesson, quizKey, info]);

  const commit = (n) => { saveState(n); setS(n); return n; };
  const lang = S.lang;

  function finishLesson(unitId, xp) {
    const stars = Math.min(3, (S.stars[lang][unitId] || 0) + 1);
    const { streak, lastDay } = nextStreak(S.streak, S.lastDay);
    commit({ ...S, xp: S.xp + xp, streak, lastDay, stars: { ...S.stars, [lang]: { ...S.stars[lang], [unitId]: stars } } });
    return { stars, streak };
  }

  function endQuiz(score, right) {
    const me = { s: score, d: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), me: true };
    const prevBest = S.best[lang][0]?.s || 0;
    const list = [...S.best[lang], me].sort((a, b) => b.s - a.s);
    const best = list.slice(0, 5).map(({ s, d }) => ({ s, d }));
    commit({ ...S, xp: S.xp + right * 2, best: { ...S.best, [lang]: best } });
    return { top: list.slice(0, 3), record: score > prevBest && score > 0 };
  }

  return (
    <>
      <main className="wrap">
        <header className="top">
          <div className="langs" role="group" aria-label="Language">
            {Object.keys(DATA).map((k) => (
              <button key={k} className={k} aria-pressed={lang === k} onClick={() => commit({ ...S, lang: k })}>{DATA[k].name}</button>
            ))}
          </div>
          <div className="stats">
            <span className="stat" title="Day streak">🔥 {S.streak}</span>
            <span className="stat" title="Total XP">⚡ {S.xp}</span>
            <button className="iconbtn" onClick={() => commit({ ...S, sound: !S.sound })} aria-label={S.sound ? 'Turn sound off' : 'Turn sound on'}>
              {S.sound ? '🔊' : '🔇'}
            </button>
            <button className="iconbtn" onClick={() => setInfo(true)} aria-label="For grown-ups">ℹ️</button>
          </div>
        </header>

        {tab === 'learn' && <LearnPath lang={lang} stars={S.stars} onStart={(ui) => setLesson({ ui, key: Date.now() })} />}
        {tab === 'quiz' && <QuizHome lang={lang} stars={S.stars} best={S.best[lang]} onStart={() => setQuizKey(Date.now())} />}
        {tab === 'words' && <WordList lang={lang} sound={S.sound} />}
      </main>

      <nav className="tabs" role="tablist">
        <div className="in">
          {TABS.map(([id, icon, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => { setTab(id); window.scrollTo(0, 0); }}>
              <span aria-hidden="true">{icon}</span>{label}
            </button>
          ))}
        </div>
      </nav>

      {lesson && (
        <Lesson
          key={lesson.key}
          lang={lang}
          ui={lesson.ui}
          sound={S.sound}
          listenOk={canListen(lang)}
          onClose={() => setLesson(null)}
          onRetry={() => setLesson({ ui: lesson.ui, key: Date.now() })}
          onFinish={finishLesson}
        />
      )}

      {quizKey && (
        <QuizBattle
          key={quizKey}
          lang={lang}
          stars={S.stars}
          sound={S.sound}
          listenOk={canListen(lang)}
          onEnd={endQuiz}
          onAgain={() => setQuizKey(Date.now())}
          onClose={() => setQuizKey(null)}
        />
      )}

      {info && <GrownUps onClose={() => setInfo(false)} />}
    </>
  );
}
