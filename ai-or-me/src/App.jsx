import { useMemo, useRef, useState } from 'react';
import {
  Shapes, Sprout, History, Brain, Repeat, Scale, SearchCheck, KeyRound, ShieldCheck, Timer, Hand, GraduationCap,
  Handshake, Send, PenLine, Users, Search, MessageSquareQuote, GitCompare, ListChecks, Stamp, FileText, Eye, Hourglass,
  BadgeEuro, MessagesSquare, Megaphone, Compass, BookOpen, LayoutGrid, ArrowUp, ArrowDown, ArrowRight, Plus, X, Check,
  TriangleAlert, Info, RotateCcw, Loader2, Lightbulb, Target, Copy, Gauge, Shuffle, Dumbbell, Sparkle,
} from 'lucide-react';
import { FIELDS, WEIGHTS, THRESHOLDS, VERDICTS, evaluate, practiceFor } from './rubric.js';
import { EXAMPLES } from './examples.js';

const ICONS = {
  Shapes, Sprout, History, Brain, Repeat, Scale, SearchCheck, KeyRound, ShieldCheck, Timer, Hand, GraduationCap,
  Handshake, Send, PenLine, Users, Search, MessageSquareQuote, GitCompare, ListChecks, Stamp, FileText, Eye, Hourglass,
  BadgeEuro, MessagesSquare, Megaphone,
};
const Icon = ({ name, size = 18 }) => {
  const C = ICONS[name] || Sparkle;
  return <C size={size} strokeWidth={2.2} />;
};

const NAV = [
  { id: 'start', label: 'Start here', desc: 'What this is, in a minute', icon: Compass },
  { id: 'decide', label: 'Decide a task', desc: 'Answer ten questions, get a verdict', icon: Target },
  { id: 'how', label: 'How it works', desc: 'Every weight and rule, printed', icon: BookOpen },
  { id: 'examples', label: 'Examples', desc: 'Three PM tasks, worked through', icon: LayoutGrid },
];

const PROVIDERS = [
  { id: 'muse', label: 'Muse Glimmer (free)' },
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'gemini', label: 'Gemini' },
];

const SR_LABELS = {
  CHALLENGE: { t: 'The case against this verdict', i: Shuffle },
  MISSED: { t: 'What the chips could not see', i: Eye },
  SKILL: { t: 'The skill at stake', i: Sprout },
  PRACTICE: { t: 'A 30-minute practice', i: Dumbbell },
  PROMPT: { t: 'If you use AI, paste this', i: MessageSquareQuote },
};

/* ---------- Matrix: the signature visual ---------- */
function Matrix({ L, D, verdict, compact }) {
  const W = 300, H = 230, pad = 26;
  const x = (v) => pad + (v / 100) * (W - pad * 2);
  const y = (v) => H - pad - (v / 100) * (H - pad * 2);
  const zone = (k) => (k === verdict ? 'var(--moss-700)' : 'var(--moss-200)');
  const txt = (k) => (k === verdict ? '#fff' : 'var(--moss-800)');
  const fx1 = x(THRESHOLDS.fitLow), fx2 = x(THRESHOLDS.fitHigh), ly = y(THRESHOLDS.learn);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Matrix: learning value ${L}, AI fit ${D}`}>
      <rect x={x(0)} y={y(100)} width={fx1 - x(0)} height={y(0) - y(100)} rx="10" fill={zone('yourself')} />
      <rect x={fx1 + 3} y={y(100)} width={x(100) - fx1 - 3} height={ly - y(100) - 3} rx="10" fill={zone('youfirst')} />
      <rect x={fx1 + 3} y={ly} width={fx2 - fx1 - 6} height={y(0) - ly} rx="10" fill={zone('aidrafts')} />
      <rect x={fx2 + 3} y={ly} width={x(100) - fx2 - 3} height={y(0) - ly} rx="10" fill={zone('handover')} />
      <text x={(x(0) + fx1) / 2} y={y(100) + 22} textAnchor="middle" fontSize="11.5" fontWeight="700" fill={txt('yourself')}>
        <tspan x={(x(0) + fx1) / 2}>Do it</tspan><tspan x={(x(0) + fx1) / 2} dy="14">yourself</tspan>
      </text>
      <text x={(fx1 + x(100)) / 2} y={y(100) + 22} textAnchor="middle" fontSize="11.5" fontWeight="700" fill={txt('youfirst')}>You first, then AI</text>
      <text x={(fx1 + fx2) / 2} y={ly + 20} textAnchor="middle" fontSize="11" fontWeight="700" fill={txt('aidrafts')}>
        <tspan x={(fx1 + fx2) / 2}>AI drafts,</tspan><tspan x={(fx1 + fx2) / 2} dy="13">you decide</tspan>
      </text>
      <text x={(fx2 + x(100)) / 2} y={ly + 20} textAnchor="middle" fontSize="11" fontWeight="700" fill={txt('handover')}>
        <tspan x={(fx2 + x(100)) / 2}>Hand it</tspan><tspan x={(fx2 + x(100)) / 2} dy="13">over</tspan>
      </text>
      {!compact && (
        <>
          <circle cx={x(D)} cy={y(L)} r="13" fill="var(--moss-300)" opacity="0.6" />
          <circle cx={x(D)} cy={y(L)} r="7" fill="#fff" stroke="var(--moss-900)" strokeWidth="3" />
        </>
      )}
      <text x={W / 2} y={H - 6} textAnchor="middle" fontSize="10.5" fill="var(--ink-3)" fontWeight="600">AI fit →</text>
      <text x="10" y={H / 2} textAnchor="middle" fontSize="10.5" fill="var(--ink-3)" fontWeight="600" transform={`rotate(-90 10 ${H / 2})`}>Learning value →</text>
    </svg>
  );
}

/* ---------- Start ---------- */
function Start({ go, loadExample }) {
  return (
    <div className="page">
      <div className="hero">
        <div className="eyebrow" style={{ color: 'var(--moss-200)' }}>A daily AI build for product managers</div>
        <h2>Should AI do this task, or should you?</h2>
        <p>Answer ten quick questions about a task. You get a clear verdict, the reasons behind it, and a way to keep building the skill if you do use AI.</p>
        <div className="btn-row">
          <button className="btn btn-light" onClick={() => go('decide')}>Decide a task <ArrowRight size={16} /></button>
          <button className="btn btn-outline-light" onClick={() => loadExample(EXAMPLES[1])}>See an example</button>
        </div>
      </div>

      <div className="quad-teaser">
        {Object.values(VERDICTS).map((v) => (
          <div className="qt" key={v.key}>
            <div className="ico" style={{ background: 'var(--moss-100)', color: 'var(--moss-700)' }}><Icon name={v.icon} /></div>
            <strong>{v.title}</strong>
            <span>{v.short}</span>
          </div>
        ))}
      </div>

      <div className="card stack" style={{ marginTop: 18 }}>
        <div className="note">
          <Lightbulb size={18} className="ico" />
          <div>
            <b>Why this exists.</b> In a 2025 survey of 319 knowledge workers by Microsoft Research and Carnegie Mellon, people who trusted AI more reported thinking critically less, while people confident in their own skills thought critically more.{' '}
            <a href="https://www.microsoft.com/en-us/research/publication/the-impact-of-generative-ai-on-critical-thinking-self-reported-reductions-in-cognitive-effort-and-confidence-effects-from-a-survey-of-knowledge-workers/" target="_blank" rel="noreferrer">Read the study</a>
          </div>
        </div>
        <div className="note">
          <Info size={18} className="ico" />
          <div>
            <b>Where the verdict comes from.</b> A fixed formula with printed weights, no AI model involved. The weights are a product judgement by the author, not research findings. An optional second read uses an AI model and can be wrong.
          </div>
        </div>
        <div className="note">
          <ShieldCheck size={18} className="ico" />
          <div><b>Private by default.</b> Nothing is stored. Your answers stay in this browser tab.</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Question card with chips and custom option ---------- */
function Question({ field, answer, onPick }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const done = !!answer;
  const saveCustom = () => {
    if (draft.trim()) onPick({ custom: draft.trim() });
    setAdding(false);
    setDraft('');
  };
  return (
    <div className="card q">
      <div className="q-head">
        <div className={`q-ico ${done ? 'done' : ''}`}>{done ? <Check size={18} strokeWidth={3} /> : <Icon name={field.icon} />}</div>
        <div>
          <h3>{field.label}</h3>
          <p>{field.hint}</p>
        </div>
      </div>
      <div className="chips">
        {field.options.map((o) => (
          <button key={o.value} className={`chip ${answer?.value === o.value && !answer?.custom ? 'on' : ''}`} onClick={() => onPick({ value: o.value })}>
            {o.label}
          </button>
        ))}
        {answer?.custom && (
          <button className="chip on" onClick={() => onPick(null)} title="Remove">
            {answer.custom} <X size={14} />
          </button>
        )}
        {!adding && !answer?.custom && (
          <button className="chip add" onClick={() => setAdding(true)}><Plus size={14} /> Add your own</button>
        )}
      </div>
      {adding && (
        <div className="custom-row">
          <input className="input" autoFocus value={draft} maxLength={60} placeholder="Type your own answer" onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveCustom()} />
          <button className="btn btn-ghost" onClick={saveCustom}>Add</button>
        </div>
      )}
      {adding && <div className="small" style={{ marginTop: 6 }}>Your own answer scores as neutral, since it has no built-in weight.</div>}
    </div>
  );
}

/* ---------- Second read ---------- */
function SecondRead({ task, setTask, answers, result, saved, setSaved, fromExample }) {
  const [provider, setProvider] = useState('muse');
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [live, setLive] = useState(false);

  const summary = FIELDS.map((f) => {
    const a = answers[f.id];
    const label = a?.custom || f.options.find((o) => o.value === a?.value)?.label || 'Not answered';
    return `${f.label} ${label}`;
  }).join('\n');

  const run = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/second-read', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ task, answers: summary, verdict: result.info.title, provider, key }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'The second read is not available on this deployment.');
      setSaved(j.result);
      setLive(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const copy = (t) => {
    navigator.clipboard?.writeText(t).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});
  };

  return (
    <div className="card">
      <h3 className="section-h"><span className="ico"><Sparkle size={17} /></span>Second read (optional)</h3>
      <p className="small" style={{ marginTop: -6 }}>Describe the task in your own words. An AI model looks for what the multiple-choice answers missed. It does not change the verdict above.</p>
      <textarea className="textarea" value={task} maxLength={1500} placeholder="For example: Recommend which three onboarding problems we take into next quarter's planning, based on 12 interviews." onChange={(e) => setTask(e.target.value)} />
      <div className="provider-row">
        {PROVIDERS.map((p) => (
          <button key={p.id} className={`chip ${provider === p.id ? 'on' : ''}`} onClick={() => setProvider(p.id)}>{p.label}</button>
        ))}
      </div>
      {provider !== 'muse' && (
        <>
          <input className="input" type="password" value={key} placeholder={`Your ${PROVIDERS.find((p) => p.id === provider).label} API key`} onChange={(e) => setKey(e.target.value)} />
          <div className="small" style={{ marginTop: 6 }}>Your key is sent with this one request and is never stored or logged.</div>
        </>
      )}
      <div style={{ marginTop: 12 }}>
        <button className="btn btn-primary" disabled={loading || task.trim().length < 15} onClick={run}>
          {loading ? <Loader2 size={16} className="spin" /> : <Sparkle size={16} />} {loading ? 'Reading' : 'Get a second read'}
        </button>
      </div>
      {error && <div className="err">{error}</div>}

      {saved && fromExample && !live && <div className="small" style={{ marginTop: 14 }}>Showing a saved second read for this example, written in advance so it works without a key.</div>}
      {saved && (
        <div className="sr-grid">
          {['CHALLENGE', 'MISSED', 'SKILL', 'PRACTICE'].map((k) => saved[k] && (
            <div className="sr" key={k}>
              <h4>{(() => { const I = SR_LABELS[k].i; return <I size={15} />; })()}{SR_LABELS[k].t}</h4>
              <p>{saved[k]}</p>
            </div>
          ))}
          {saved.PROMPT && (
            <div className="sr prompt wide">
              <h4><MessageSquareQuote size={15} />{SR_LABELS.PROMPT.t}</h4>
              <p>{saved.PROMPT}</p>
              <button className="copy-btn" onClick={() => copy(saved.PROMPT)}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Copied' : 'Copy prompt'}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Result ---------- */
function Result({ result, task, setTask, answers, saved, setSaved, fromExample }) {
  const v = result.info;
  return (
    <div className="stack" style={{ marginTop: 28 }}>
      <div className="verdict">
        <div>
          <span className="vtag"><Gauge size={14} /> Verdict <span className="conf">{result.confidence} confidence</span></span>
          <h2><span className="big-ico"><Icon name={v.icon} size={26} /></span>{v.title}</h2>
          <p>{v.summary}</p>
          <div className="meters">
            <div className="meter"><label>Learning value <b>{result.L}</b></label><div className="track"><div className="fill" style={{ width: `${result.L}%` }} /></div></div>
            <div className="meter"><label>AI fit <b>{result.D}</b></label><div className="track"><div className="fill" style={{ width: `${result.D}%` }} /></div></div>
          </div>
        </div>
        <div className="matrix-wrap"><Matrix L={result.L} D={result.D} verdict={result.verdict} /></div>
      </div>

      {(result.flags.length > 0 || result.rules.length > 0) && (
        <div className="stack" style={{ gap: 8 }}>
          {result.flags.map((f, i) => (
            <div key={i} className={`flag ${f.tone}`}><TriangleAlert size={17} style={{ flexShrink: 0 }} />{f.text}</div>
          ))}
          {result.rules.map((r) => (
            <div key={r.id} className="rule"><ShieldCheck size={17} style={{ flexShrink: 0, color: 'var(--moss-700)' }} />{r.text}</div>
          ))}
        </div>
      )}

      <div className="grid2">
        <div className="card">
          <h3 className="section-h"><span className="ico"><ListChecks size={17} /></span>How to work on it</h3>
          <div className="steps">
            {v.how.map((s, i) => (
              <div className="step" key={i}><span className="n"><Icon name={s.icon} size={16} /></span>{s.text}</div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3 className="section-h"><span className="ico"><Scale size={17} /></span>What pushed it here</h3>
          {result.drivers.map((d, i) => (
            <div className="driver" key={i}>
              <span className={`arrow ${d.direction}`}>{d.direction === 'up' ? <ArrowUp size={15} /> : <ArrowDown size={15} />}</span>
              <div className="t"><b>{d.choice}</b><span>{d.text}</span></div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid2">
        <div className="card skill-card">
          <h3 className="section-h"><span className="ico" style={{ background: '#fff' }}><Sprout size={17} /></span>The skill at stake</h3>
          <div className="big">{result.skill.charAt(0).toUpperCase() + result.skill.slice(1)}</div>
          <div className="step" style={{ background: '#fff' }}><span className="n"><Dumbbell size={16} /></span>{practiceFor(result.skill, result.verdict)}</div>
        </div>
        <div className="card">
          <h3 className="section-h"><span className="ico"><Shuffle size={17} /></span>What would change the verdict</h3>
          {result.flips.length === 0 && <p className="small">No single answer change would move this verdict. It is a firm result.</p>}
          {result.flips.map((f, i) => (
            <div className="flip" key={i}>
              <span className="small" style={{ width: '100%' }}>{f.field}</span>
              <span className="pill">{f.to}</span>
              <ArrowRight size={15} />
              <span className="pill dark">{VERDICTS[f.verdict].title}</span>
            </div>
          ))}
        </div>
      </div>

      <SecondRead task={task} setTask={setTask} answers={answers} result={result} saved={saved} setSaved={setSaved} fromExample={fromExample} />
    </div>
  );
}

/* ---------- Decide ---------- */
function Decide({ answers, setAnswers, task, setTask, saved, setSaved, shown, setShown, exampleTitle }) {
  const count = FIELDS.filter((f) => answers[f.id]).length;
  const result = useMemo(() => evaluate(answers), [answers]);
  const resultRef = useRef(null);
  const pick = (id, val) => {
    setAnswers((a) => {
      const n = { ...a };
      if (val) n[id] = val; else delete n[id];
      return n;
    });
    setSaved(null);
  };
  const show = () => {
    setShown(true);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };
  const reset = () => { setAnswers({}); setTask(''); setSaved(null); setShown(false); };

  return (
    <div className="page">
      <div className="eyebrow">{exampleTitle ? `Example: ${exampleTitle}` : 'Decide a task'}</div>
      <h2 className="page-title">Ten questions about your task</h2>
      <p className="lede">Pick the closest answer for each. If none fits, add your own. The verdict updates as soon as all ten are answered.</p>
      <div className="progress">
        <div className="progress-bar"><div style={{ width: `${(count / FIELDS.length) * 100}%` }} /></div>
        <span>{count} of {FIELDS.length}</span>
        {count > 0 && <button className="btn btn-ghost" style={{ padding: '8px 14px' }} onClick={reset}><RotateCcw size={14} /> Start over</button>}
      </div>
      <div className="stack">
        {FIELDS.map((f) => <Question key={f.id} field={f} answer={answers[f.id]} onPick={(v) => pick(f.id, v)} />)}
      </div>
      {!shown && (
        <div className="sticky-cta">
          <span>{count === FIELDS.length ? 'All answered.' : `${FIELDS.length - count} left to answer`}</span>
          <button className="btn btn-primary" disabled={count < FIELDS.length} onClick={show}>See the verdict <ArrowRight size={16} /></button>
        </div>
      )}
      <div ref={resultRef}>
        {shown && count === FIELDS.length && (
          <Result result={result} task={task} setTask={setTask} answers={answers} saved={saved} setSaved={setSaved} fromExample={!!exampleTitle} />
        )}
      </div>
    </div>
  );
}

/* ---------- How it works ---------- */
function How() {
  const axis = (k, title, desc) => (
    <div className="card">
      <h3 className="section-h"><span className="ico">{k === 'L' ? <Sprout size={17} /> : <Gauge size={17} />}</span>{title}</h3>
      <p className="small" style={{ marginTop: -6 }}>{desc}</p>
      <table className="wtable"><tbody>
        {Object.entries(WEIGHTS[k]).map(([fid, w]) => {
          const f = FIELDS.find((x) => x.id === fid);
          return (
            <tr key={fid}>
              <td>
                <b>{f.label}</b>
                <div className="opt-list">{f.options.map((o) => <span key={o.value}>{o.label} <b>{o[k]}</b></span>)}</div>
              </td>
              <td><span className="wbar" style={{ width: w * 300 }} />{Math.round(w * 100)}%</td>
            </tr>
          );
        })}
      </tbody></table>
    </div>
  );
  return (
    <div className="page">
      <div className="eyebrow">How it works</div>
      <h2 className="page-title">A fixed formula, all of it printed</h2>
      <p className="lede">Each answer carries a value between 0 and 1. Weighted together they give two scores out of 100. Where the two scores meet on the grid decides the verdict.</p>
      <div className="grid2" style={{ alignItems: 'start' }}>
        <div className="card">
          <h3 className="section-h"><span className="ico"><LayoutGrid size={17} /></span>The grid</h3>
          <div className="matrix-wrap"><Matrix L={0} D={0} verdict="" compact /></div>
          <div className="steps" style={{ marginTop: 12 }}>
            <div className="step"><span className="n"><Hand size={16} /></span>AI fit below {THRESHOLDS.fitLow}: do it yourself, whatever the learning value.</div>
            <div className="step"><span className="n"><GraduationCap size={16} /></span>Learning value {THRESHOLDS.learn} or more: you first, then AI.</div>
            <div className="step"><span className="n"><Handshake size={16} /></span>AI fit {THRESHOLDS.fitLow} to {THRESHOLDS.fitHigh - 1}: AI drafts, you decide.</div>
            <div className="step"><span className="n"><Send size={16} /></span>AI fit {THRESHOLDS.fitHigh} or more: hand it over.</div>
          </div>
        </div>
        <div className="card">
          <h3 className="section-h"><span className="ico"><ShieldCheck size={17} /></span>Guardrails that override the maths</h3>
          <div className="steps">
            <div className="step"><span className="n"><Sprout size={16} /></span>Still learning a core skill you have never done unaided: learning value is held at 70 or above.</div>
            <div className="step"><span className="n"><SearchCheck size={16} /></span>You could not check the answer: AI fit is capped at 60.</div>
            <div className="step"><span className="n"><KeyRound size={16} /></span>Confidential or personal data: AI fit is capped at 69.</div>
            <div className="step"><span className="n"><TriangleAlert size={16} /></span>Hard to undo and impossible to check: always do it yourself.</div>
          </div>
          <h3 className="section-h" style={{ marginTop: 20 }}><span className="ico"><Gauge size={17} /></span>Confidence</h3>
          <p className="small">High when the point sits 12 or more away from the nearest boundary, Medium at 5 to 11, Low under 5. Two or more answers you typed yourself, or any unanswered question, lower it a step.</p>
        </div>
      </div>
      <div className="stack" style={{ marginTop: 16 }}>
        {axis('L', 'Learning value', 'How much skill you give up if AI does this for you.')}
        {axis('D', 'AI fit', 'How safely and usefully AI could do this task.')}
        <div className="card">
          <div className="note"><Info size={18} className="ico" /><div>The weights are a product judgement by the author, shaped by ten years of PM work. They are not drawn from a study. If you disagree with one, that disagreement is useful: it tells you what you value in your own growth.</div></div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Examples ---------- */
function Examples({ loadExample }) {
  return (
    <div className="page">
      <div className="eyebrow">Examples</div>
      <h2 className="page-title">Three PM tasks, worked through</h2>
      <p className="lede">Each one loads its answers and a saved second read, so you can see every part of the result without an API key.</p>
      <div className="ex-grid">
        {EXAMPLES.map((ex) => {
          const r = evaluate(ex.answers);
          return (
            <div className="card ex" key={ex.id}>
              <div className="ico"><Icon name={ex.icon} size={22} /></div>
              <h3>{ex.title}</h3>
              <p>{ex.blurb}</p>
              <span className="pill" style={{ alignSelf: 'flex-start' }}><Icon name={r.info.icon} size={13} /> {r.info.title}</span>
              <button className="btn btn-primary" onClick={() => loadExample(ex)}>Load this example <ArrowRight size={16} /></button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('start');
  const [answers, setAnswers] = useState({});
  const [task, setTask] = useState('');
  const [saved, setSaved] = useState(null);
  const [shown, setShown] = useState(false);
  const [exampleTitle, setExampleTitle] = useState('');
  const mainRef = useRef(null);

  const go = (v) => {
    setView(v);
    mainRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  };
  const loadExample = (ex) => {
    setAnswers(ex.answers);
    setTask(ex.task);
    setSaved(ex.secondRead);
    setShown(true);
    setExampleTitle(ex.title);
    setView('decide');
    setTimeout(() => {
      const el = document.querySelector('.verdict');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };
  const setAnswersUser = (fn) => { setExampleTitle(''); setAnswers(fn); };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">AI?</div>
          <div><h1>AI or Me?</h1><p>Keep the skills that matter</p></div>
        </div>
        {NAV.map((n) => {
          const I = n.icon;
          return (
            <button key={n.id} className={`nav-btn ${view === n.id ? 'active' : ''}`} onClick={() => go(n.id)}>
              <span className="ico"><I size={17} /></span>
              <span><strong>{n.label}</strong><span className="desc">{n.desc}</span></span>
            </button>
          );
        })}
        <div className="sidebar-foot">Part of the daily AI builds series by Prerna Kakkar. Nothing you enter is stored.</div>
      </aside>
      <main className="main" ref={mainRef}>
        {view === 'start' && <Start go={go} loadExample={loadExample} />}
        {view === 'decide' && (
          <Decide answers={answers} setAnswers={setAnswersUser} task={task} setTask={setTask} saved={saved} setSaved={setSaved} shown={shown} setShown={setShown} exampleTitle={exampleTitle} />
        )}
        {view === 'how' && <How />}
        {view === 'examples' && <Examples loadExample={loadExample} />}
      </main>
    </div>
  );
}
