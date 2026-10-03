import { useMemo, useRef, useState } from 'react';
import {
  Compass,
  GitCompare,
  FileDiff,
  MessagesSquare,
  ClipboardCheck,
  BookOpen,
  Settings2,
  FlaskConical,
  Play,
  Plus,
  X,
  Check,
  Wand2,
  Loader2,
  Waves,
  CircleCheck,
  TriangleAlert,
  OctagonX,
  Minus,
  CircleHelp,
  Quote,
  RotateCcw,
  ArrowRight,
  Lock,
  Cpu,
  KeyRound,
  Eye,
  Target,
  Repeat,
  ShieldCheck,
  Database,
  Scale,
  Info,
} from 'lucide-react';
import { diffPrompts, diffStats } from './diff.js';
import { parseReport } from './parse.js';
import { EXAMPLES } from './examples.js';

const SECTIONS = [
  { id: 'start', title: 'Start here', desc: 'What this checks, in a minute', icon: Compass },
  { id: 'compare', title: 'Compare prompts', desc: 'Paste both versions and your tests', icon: GitCompare },
  { id: 'diff', title: 'What changed', desc: 'Text added and removed, no AI', icon: FileDiff },
  { id: 'runs', title: 'Side by side', desc: 'Each test answered under A and B', icon: MessagesSquare },
  { id: 'report', title: 'Drift report', desc: 'Intended, side effect, verdict', icon: ClipboardCheck },
  { id: 'examples', title: 'Worked examples', desc: 'Three saved runs, no key needed', icon: FlaskConical },
  { id: 'method', title: 'Method', desc: 'How it judges and its limits', icon: BookOpen },
  { id: 'settings', title: 'Model & key', desc: 'Pick who answers and judges', icon: Settings2 },
];

const PURPOSES = ['Customer support', 'Booking assistant', 'Sales assistant', 'Internal tool', 'Voice agent'];
const INTENTS = ['Shorter replies', 'Tone', 'New rule', 'Language', 'Safety guardrail', 'Formatting'];

const PROVIDERS = [
  { id: 'glimmer', name: 'Muse Glimmer', note: 'Default, free to use here', needsKey: false },
  { id: 'anthropic', name: 'Anthropic', note: 'Your own key', needsKey: true, model: 'claude-sonnet-5-5' },
  { id: 'openai', name: 'OpenAI', note: 'Your own key', needsKey: true, model: 'gpt-5-mini' },
  { id: 'gemini', name: 'Gemini', note: 'Your own key', needsKey: true, model: 'gemini-2.5-flash' },
];

const LABEL_META = {
  Intended: { cls: 'ok', icon: CircleCheck },
  'Side effect': { cls: 'bad', icon: TriangleAlert },
  'No change': { cls: 'quiet', icon: Minus },
  Unclear: { cls: 'quiet', icon: CircleHelp },
};

const VERDICT_META = {
  Ship: { cls: 'ok', icon: CircleCheck, line: 'The change you meant landed, and nothing important moved with it.' },
  Retest: { cls: 'warn', icon: TriangleAlert, line: 'Something moved that you did not ask for. Fix it and run again.' },
  Hold: { cls: 'bad', icon: OctagonX, line: 'A side effect affects what users get. Do not ship this version yet.' },
};

async function callApi(path, body, settings) {
  const headers = { 'Content-Type': 'application/json' };
  if (settings.provider !== 'glimmer') headers['x-provider-key'] = settings.key;
  const r = await fetch(`/api/${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...body, provider: settings.provider, model: settings.model }),
  });
  let j = {};
  try {
    j = await r.json();
  } catch {
    /* non-JSON error page */
  }
  if (!r.ok) throw new Error(j.error || `Request failed (${r.status}).`);
  return j;
}

function ChipRow({ label, options, selected, onToggle, onAdd, hint }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const commit = () => {
    const v = draft.trim();
    if (v) onAdd(v);
    setDraft('');
    setAdding(false);
  };
  return (
    <div className="field">
      <div className="field-label">
        {label}
        {hint && <span className="field-hint">{hint}</span>}
      </div>
      <div className="chips">
        {options.map((o) => (
          <button key={o} type="button" className={`chip ${selected.includes(o) ? 'on' : ''}`} onClick={() => onToggle(o)}>
            {selected.includes(o) && <Check size={14} />}
            {o}
          </button>
        ))}
        {adding ? (
          <span className="chip-input">
            <input
              autoFocus
              value={draft}
              placeholder="Type and press Enter"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') setAdding(false);
              }}
              onBlur={commit}
            />
          </span>
        ) : (
          <button type="button" className="chip add" onClick={() => setAdding(true)}>
            <Plus size={14} /> Add your own
          </button>
        )}
      </div>
    </div>
  );
}

function SectionHead({ icon: Icon, kicker, title, children }) {
  return (
    <header className="section-head">
      <div className="section-icon">
        <Icon size={22} />
      </div>
      <div>
        {kicker && <div className="kicker">{kicker}</div>}
        <h2>{title}</h2>
        {children && <p className="lede">{children}</p>}
      </div>
    </header>
  );
}

function Empty({ icon: Icon, title, children, action }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon size={26} />
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}

function Pill({ label }) {
  const meta = LABEL_META[label] || LABEL_META.Unclear;
  const Icon = meta.icon;
  return (
    <span className={`pill ${meta.cls}`}>
      <Icon size={13} /> {label}
    </span>
  );
}

export default function App() {
  const [section, setSection] = useState('start');
  const mainRef = useRef(null);

  const [purposeOptions, setPurposeOptions] = useState(PURPOSES);
  const [purpose, setPurpose] = useState([]);
  const [intentOptions, setIntentOptions] = useState(INTENTS);
  const [intentChips, setIntentChips] = useState([]);
  const [intentText, setIntentText] = useState('');
  const [promptA, setPromptA] = useState('');
  const [promptB, setPromptB] = useState('');
  const [tests, setTests] = useState(['', '']);

  const [runs, setRuns] = useState([]);
  const [reportText, setReportText] = useState('');
  const [source, setSource] = useState(null); // 'live' or example title
  const [busy, setBusy] = useState(null); // 'suggest' | 'run' | null
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [showRaw, setShowRaw] = useState(false);

  const [settings, setSettings] = useState({ provider: 'glimmer', model: '', key: '' });

  const report = useMemo(() => parseReport(reportText), [reportText]);
  const parts = useMemo(() => diffPrompts(promptA, promptB), [promptA, promptB]);
  const stats = useMemo(() => diffStats(parts, promptA, promptB), [parts, promptA, promptB]);

  const go = (id) => {
    setSection(id);
    if (mainRef.current) mainRef.current.scrollTop = 0;
  };

  const intentSummary = [intentChips.join(', '), intentText.trim()].filter(Boolean).join('. ');
  const purposeSummary = purpose.join(', ');
  const filledTests = tests.map((t) => t.trim()).filter(Boolean);
  const provider = PROVIDERS.find((p) => p.id === settings.provider);
  const keyMissing = provider.needsKey && settings.key.trim().length < 10;

  const toggle = (setter) => (v) => setter((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]));
  const addOption = (setOpts, setSel) => (v) => {
    setOpts((cur) => (cur.includes(v) ? cur : [...cur, v]));
    setSel((cur) => (cur.includes(v) ? cur : [...cur, v]));
  };

  const loadExample = (ex) => {
    setPurposeOptions((cur) => (cur.includes(ex.purpose) ? cur : [...cur, ex.purpose]));
    setPurpose([ex.purpose]);
    setIntentOptions((cur) => [...new Set([...cur, ...ex.intentChips])]);
    setIntentChips(ex.intentChips);
    setIntentText(ex.intentText);
    setPromptA(ex.promptA);
    setPromptB(ex.promptB);
    setTests(ex.runs.map((r) => r.input));
    setRuns(ex.runs.map((r) => ({ ...r, status: 'done' })));
    setReportText(ex.report);
    setSource(ex.title);
    setError('');
    go('report');
  };

  const resetAll = () => {
    setPurpose([]);
    setIntentChips([]);
    setIntentText('');
    setPromptA('');
    setPromptB('');
    setTests(['', '']);
    setRuns([]);
    setReportText('');
    setSource(null);
    setError('');
  };

  const suggest = async () => {
    setError('');
    if (!promptA.trim() || !promptB.trim()) return setError('Paste both prompt versions first, then I can suggest tests.');
    if (keyMissing) return setError(`Add your ${provider.name} key in Model & key first.`);
    setBusy('suggest');
    try {
      const { tests: t } = await callApi('suggest', { promptA, promptB, purpose: purposeSummary, intent: intentSummary }, settings);
      setTests((cur) => {
        const kept = cur.map((x) => x.trim()).filter(Boolean);
        return [...kept, ...t].slice(0, 6);
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const run = async () => {
    setError('');
    if (!promptA.trim() || !promptB.trim()) return setError('Paste both versions of the prompt.');
    if (!filledTests.length) return setError('Add at least one test message, or ask for suggestions.');
    if (keyMissing) return setError(`Add your ${provider.name} key in Model & key first.`);

    setBusy('run');
    setReportText('');
    setSource('live');
    const fresh = filledTests.map((input) => ({ input, a: '', b: '', status: 'waiting' }));
    setRuns(fresh);
    go('runs');

    const done = [];
    try {
      for (let i = 0; i < fresh.length; i++) {
        setProgress(`Running test ${i + 1} of ${fresh.length} under both versions`);
        setRuns((cur) => cur.map((r, k) => (k === i ? { ...r, status: 'running' } : r)));
        const [ra, rb] = await Promise.all([
          callApi('run', { prompt: promptA, input: fresh[i].input }, settings),
          callApi('run', { prompt: promptB, input: fresh[i].input }, settings),
        ]);
        const row = { input: fresh[i].input, a: ra.reply, b: rb.reply, status: 'done' };
        done.push(row);
        setRuns((cur) => cur.map((r, k) => (k === i ? row : r)));
      }
      setProgress('Comparing the replies and writing the report');
      const { report: text } = await callApi(
        'judge',
        { promptA, promptB, purpose: purposeSummary, intent: intentSummary, runs: done },
        settings
      );
      setReportText(text);
      go('report');
    } catch (e) {
      setError(e.message);
      setRuns((cur) => cur.map((r) => (r.status === 'done' ? r : { ...r, status: 'failed' })));
    } finally {
      setBusy(null);
      setProgress('');
    }
  };

  const changeFor = (n) => report.changes.find((c) => c.test === n);
  const sideEffects = report.changes.filter((c) => c.label === 'Side effect').length;

  const badge = (id) => {
    if (id === 'diff' && (promptA || promptB)) return stats.added + stats.removed || null;
    if (id === 'runs' && runs.length) return runs.length;
    if (id === 'report' && report.verdict) return report.verdict;
    return null;
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Waves size={20} />
          </div>
          <div>
            <div className="brand-name">Prompt Drift Watch</div>
            <div className="brand-sub">Catch the changes you didn't mean</div>
          </div>
        </div>
        <nav className="nav">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const b = badge(s.id);
            return (
              <button key={s.id} className={`nav-item ${section === s.id ? 'active' : ''}`} onClick={() => go(s.id)}>
                <span className="nav-icon">
                  <Icon size={18} />
                </span>
                <span className="nav-text">
                  <span className="nav-title">
                    {s.title}
                    {b != null && <span className={`nav-badge ${s.id === 'report' ? (VERDICT_META[b]?.cls || '') : ''}`}>{b}</span>}
                  </span>
                  <span className="nav-desc">{s.desc}</span>
                </span>
              </button>
            );
          })}
        </nav>
        <button className="model-chip" onClick={() => go('settings')}>
          <Cpu size={16} />
          <span>
            <span className="model-chip-label">Model</span>
            <span className="model-chip-name">{provider.name}</span>
          </span>
          {keyMissing && <span className="dot-warn" title="Key needed" />}
        </button>
      </aside>

      <main className="main" ref={mainRef}>
        <div className="content">
          {error && (
            <div className="alert">
              <TriangleAlert size={18} />
              <span>{error}</span>
              <button aria-label="Dismiss" onClick={() => setError('')}>
                <X size={16} />
              </button>
            </div>
          )}
          {busy === 'run' && progress && (
            <div className="progress">
              <Loader2 size={18} className="spin" />
              {progress}
            </div>
          )}

          {section === 'start' && (
            <section>
              <div className="hero">
                <div className="hero-text">
                  <div className="kicker">For anyone who edits a system prompt</div>
                  <h1>Did your prompt edit change more than you meant?</h1>
                  <p>
                    You shorten a prompt or add a rule, and something else quietly breaks. Paste the old and new versions with a few real user
                    messages. You'll see what each version actually says, which changes were the ones you wanted, and which slipped in.
                  </p>
                  <div className="row">
                    <button className="btn primary" onClick={() => go('examples')}>
                      <FlaskConical size={18} /> See a worked example
                    </button>
                    <button className="btn ghost" onClick={() => go('compare')}>
                      Compare my prompts <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
                <div className="hero-visual" aria-hidden="true">
                  <div className="hv-card">
                    <span className="hv-tag">A</span>
                    <span className="hv-line" />
                    <span className="hv-line short" />
                    <span className="hv-line" />
                  </div>
                  <div className="hv-card b">
                    <span className="hv-tag">B</span>
                    <span className="hv-line" />
                    <span className="hv-line mark" />
                    <span className="hv-line short" />
                  </div>
                  <div className="hv-result">
                    <TriangleAlert size={16} /> 1 side effect
                  </div>
                </div>
              </div>

              <div className="steps">
                {[
                  { icon: GitCompare, t: 'Paste both versions', d: 'The prompt you run today and the one you want to ship.' },
                  { icon: MessagesSquare, t: 'Add real messages', d: 'What users actually send. It can suggest some for you.' },
                  { icon: ClipboardCheck, t: 'Read the drift', d: 'Every reply is labelled intended or side effect, with a verdict.' },
                ].map((s, i) => (
                  <div className="step" key={s.t}>
                    <div className="step-num">{i + 1}</div>
                    <s.icon size={22} className="step-icon" />
                    <h3>{s.t}</h3>
                    <p>{s.d}</p>
                  </div>
                ))}
              </div>

              <div className="card soft">
                <h3 className="card-title">
                  <Info size={18} /> Where the results come from
                </h3>
                <ul className="icon-list">
                  <li>
                    <span className="il-icon">
                      <FileDiff size={16} />
                    </span>
                    <span>
                      <b>What changed</b> is worked out in your browser by comparing sentences. No AI is involved.
                    </span>
                  </li>
                  <li>
                    <span className="il-icon">
                      <MessagesSquare size={16} />
                    </span>
                    <span>
                      <b>Side by side</b> replies are generated live by the model you pick, once with each prompt.
                    </span>
                  </li>
                  <li>
                    <span className="il-icon">
                      <Scale size={16} />
                    </span>
                    <span>
                      <b>The verdict</b> is that same model's judgement. Treat it as a careful second read, not proof.
                    </span>
                  </li>
                  <li>
                    <span className="il-icon">
                      <Lock size={16} />
                    </span>
                    <span>
                      <b>Nothing is stored.</b> No sign-in, no database. Your text goes only to the model provider for that run.
                    </span>
                  </li>
                </ul>
              </div>
            </section>
          )}

          {section === 'compare' && (
            <section>
              <SectionHead icon={GitCompare} kicker="Step 1" title="Compare prompts">
                Tell it what you meant to change. That sentence is what every difference gets judged against.
              </SectionHead>

              <div className="card">
                <ChipRow
                  label="What is the assistant for?"
                  options={purposeOptions}
                  selected={purpose}
                  onToggle={toggle(setPurpose)}
                  onAdd={addOption(setPurposeOptions, setPurpose)}
                />
                <ChipRow
                  label="What did you mean to change?"
                  hint="Pick any that apply"
                  options={intentOptions}
                  selected={intentChips}
                  onToggle={toggle(setIntentChips)}
                  onAdd={addOption(setIntentOptions, setIntentChips)}
                />
                <div className="field">
                  <label className="field-label" htmlFor="intent">
                    In your own words
                  </label>
                  <textarea
                    id="intent"
                    rows={2}
                    value={intentText}
                    placeholder="e.g. Replies were too long on mobile. I only wanted them shorter."
                    onChange={(e) => setIntentText(e.target.value)}
                  />
                </div>
              </div>

              <div className="prompt-pair">
                <div className="card prompt-card">
                  <div className="prompt-head">
                    <span className="vtag">A</span>
                    <div>
                      <b>Current prompt</b>
                      <span>What runs today</span>
                    </div>
                  </div>
                  <textarea rows={12} value={promptA} placeholder="Paste the system prompt you use now" onChange={(e) => setPromptA(e.target.value)} />
                  <div className="count">{stats.wordsA} words</div>
                </div>
                <div className="card prompt-card">
                  <div className="prompt-head">
                    <span className="vtag b">B</span>
                    <div>
                      <b>Proposed prompt</b>
                      <span>What you want to ship</span>
                    </div>
                  </div>
                  <textarea rows={12} value={promptB} placeholder="Paste the edited version" onChange={(e) => setPromptB(e.target.value)} />
                  <div className="count">{stats.wordsB} words</div>
                </div>
              </div>

              <div className="card">
                <div className="tests-head">
                  <div>
                    <div className="field-label">Test messages</div>
                    <p className="muted">Messages a real user would send. Up to six. Include at least one the change should not affect.</p>
                  </div>
                  <button className="btn ghost small" onClick={suggest} disabled={busy}>
                    {busy === 'suggest' ? <Loader2 size={16} className="spin" /> : <Wand2 size={16} />} Suggest tests
                  </button>
                </div>
                <div className="tests">
                  {tests.map((t, i) => (
                    <div className="test-row" key={i}>
                      <span className="test-num">{i + 1}</span>
                      <input
                        value={t}
                        placeholder={i === 0 ? 'e.g. How do I cancel my contract?' : 'Another message'}
                        onChange={(e) => setTests((cur) => cur.map((x, k) => (k === i ? e.target.value : x)))}
                      />
                      <button className="icon-btn" aria-label="Remove test" onClick={() => setTests((cur) => (cur.length > 1 ? cur.filter((_, k) => k !== i) : ['']))}>
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                {tests.length < 6 && (
                  <button className="chip add" onClick={() => setTests((cur) => [...cur, ''])}>
                    <Plus size={14} /> Add a message
                  </button>
                )}
              </div>

              <div className="run-bar">
                <div className="muted small-text">
                  {filledTests.length
                    ? `${filledTests.length * 2 + 1} model calls on ${provider.name}`
                    : 'Add a test message to run'}
                </div>
                <div className="row">
                  <button className="btn ghost" onClick={resetAll} disabled={busy}>
                    <RotateCcw size={16} /> Clear
                  </button>
                  <button className="btn primary" onClick={run} disabled={busy}>
                    {busy === 'run' ? <Loader2 size={18} className="spin" /> : <Play size={18} />} Run the comparison
                  </button>
                </div>
              </div>
            </section>
          )}

          {section === 'diff' && (
            <section>
              <SectionHead icon={FileDiff} kicker="No AI" title="What changed in the text">
                Sentence by sentence, what B added and what it dropped from A. Dropped lines are where side effects usually start.
              </SectionHead>
              {!promptA && !promptB ? (
                <Empty icon={FileDiff} title="Nothing to compare yet" action={<button className="btn primary" onClick={() => go('compare')}>Paste prompts</button>}>
                  Paste both versions, or load a worked example.
                </Empty>
              ) : (
                <>
                  <div className="stats">
                    <div className="stat">
                      <Plus size={18} />
                      <b>{stats.added}</b>
                      <span>sentences added</span>
                    </div>
                    <div className="stat">
                      <Minus size={18} />
                      <b>{stats.removed}</b>
                      <span>sentences dropped</span>
                    </div>
                    <div className="stat">
                      <Check size={18} />
                      <b>{stats.same}</b>
                      <span>kept as is</span>
                    </div>
                    <div className="stat">
                      <Repeat size={18} />
                      <b>
                        {stats.wordsA} → {stats.wordsB}
                      </b>
                      <span>words, A to B</span>
                    </div>
                  </div>
                  <div className="card diff">
                    {parts.map((p, i) => (
                      <div key={i} className={`diff-line ${p.type}`}>
                        <span className="diff-mark">{p.type === 'added' ? <Plus size={14} /> : p.type === 'removed' ? <Minus size={14} /> : null}</span>
                        <span>{p.text}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          )}

          {section === 'runs' && (
            <section>
              <SectionHead icon={MessagesSquare} kicker={source && source !== 'live' ? `Worked example: ${source}` : 'Live run'} title="Side by side">
                The same message sent to the assistant twice, once with each prompt.
              </SectionHead>
              {!runs.length ? (
                <Empty icon={MessagesSquare} title="No replies yet" action={<button className="btn primary" onClick={() => go('compare')}>Set up a comparison</button>}>
                  Run a comparison, or open a worked example to see how this looks.
                </Empty>
              ) : (
                <div className="runs">
                  {runs.map((r, i) => {
                    const c = changeFor(i + 1);
                    return (
                      <article className="card run" key={i}>
                        <div className="run-head">
                          <span className="test-num">{i + 1}</span>
                          <p className="run-input">“{r.input}”</p>
                          {c && <Pill label={c.label} />}
                        </div>
                        <div className="run-cols">
                          {['a', 'b'].map((v) => (
                            <div className={`reply ${v}`} key={v}>
                              <div className="reply-tag">
                                <span className={`vtag ${v === 'b' ? 'b' : ''}`}>{v.toUpperCase()}</span>
                                {v === 'a' ? 'Current' : 'Proposed'}
                              </div>
                              {r.status === 'done' ? (
                                <p>{r[v]}</p>
                              ) : r.status === 'failed' ? (
                                <p className="muted">Not run</p>
                              ) : (
                                <div className="skeleton">
                                  <span />
                                  <span />
                                  <span className="short" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {c && c.what && (
                          <div className="run-note">
                            <Eye size={15} /> {c.what}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {section === 'report' && (
            <section>
              <SectionHead icon={ClipboardCheck} kicker={source && source !== 'live' ? `Worked example: ${source}` : 'Live run'} title="Drift report" />
              {!reportText ? (
                <Empty icon={ClipboardCheck} title="No report yet" action={<button className="btn primary" onClick={() => go('examples')}>Open a worked example</button>}>
                  The report appears here after a run.
                </Empty>
              ) : !report.ok ? (
                <div className="card">
                  <h3 className="card-title">
                    <TriangleAlert size={18} /> The model's answer didn't follow the expected format
                  </h3>
                  <p className="muted">Here is what it returned. Running again usually fixes this.</p>
                  <pre className="raw">{reportText}</pre>
                </div>
              ) : (
                <>
                  {(() => {
                    const vm = VERDICT_META[report.verdict];
                    const VI = vm.icon;
                    const level = { High: 3, Medium: 2, Low: 1 }[report.confidence] || 0;
                    return (
                      <div className={`verdict ${vm.cls}`}>
                        <div className="verdict-icon">
                          <VI size={30} />
                        </div>
                        <div className="verdict-body">
                          <div className="verdict-top">
                            <h3>{report.verdict}</h3>
                            <span className="conf" title="Confidence">
                              {[1, 2, 3].map((n) => (
                                <i key={n} className={n <= level ? 'on' : ''} />
                              ))}
                              {report.confidence} confidence
                            </span>
                          </div>
                          <p className="verdict-line">{vm.line}</p>
                          <p>{report.summary}</p>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="tiles">
                    <div className="tile">
                      <Target size={20} />
                      <div>
                        <span className="tile-label">Your change landed?</span>
                        <b>{report.intent?.status || 'Not stated'}</b>
                        {report.intent?.note && <p>{report.intent.note}</p>}
                      </div>
                    </div>
                    <div className="tile">
                      <TriangleAlert size={20} />
                      <div>
                        <span className="tile-label">Side effects</span>
                        <b>
                          {sideEffects} of {report.changes.length} tests
                        </b>
                        <p>Behaviour that changed without being asked for.</p>
                      </div>
                    </div>
                  </div>

                  <h3 className="sub">Test by test</h3>
                  <div className="changes">
                    {report.changes.map((c, i) => (
                      <div className={`change ${LABEL_META[c.label]?.cls}`} key={i}>
                        <div className="change-top">
                          <span className="test-num">{c.test}</span>
                          <Pill label={c.label} />
                        </div>
                        {runs[c.test - 1] && <p className="change-input">“{runs[c.test - 1].input}”</p>}
                        <p className="change-what">{c.what}</p>
                        {c.why && <p className="change-why">{c.why}</p>}
                      </div>
                    ))}
                  </div>

                  {report.causes.length > 0 && (
                    <>
                      <h3 className="sub">Wording behind the side effects</h3>
                      <div className="causes">
                        {report.causes.map((c, i) => {
                          const removed = /^removed:/i.test(c.phrase);
                          return (
                            <div className="cause" key={i}>
                              <div className={`cause-quote ${removed ? 'removed' : ''}`}>
                                {removed ? <Minus size={15} /> : <Quote size={15} />}
                                <span>{c.phrase.replace(/^removed:\s*/i, '')}</span>
                                <em>{removed ? 'dropped from A' : 'in B'}</em>
                              </div>
                              <p>{c.effect}</p>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  <div className="two-col">
                    <div className="card">
                      <h3 className="card-title">
                        <ShieldCheck size={18} /> Retest before shipping
                      </h3>
                      <ul className="checklist">
                        {report.retests.map((t, i) => (
                          <li key={i}>
                            <span className="box" />
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="card flip">
                      <h3 className="card-title">
                        <Repeat size={18} /> What would change the verdict
                      </h3>
                      <p>{report.flip}</p>
                    </div>
                  </div>

                  <button className="link-btn" onClick={() => setShowRaw((v) => !v)}>
                    {showRaw ? 'Hide' : 'Show'} the model's raw answer
                  </button>
                  {showRaw && <pre className="raw">{reportText}</pre>}
                </>
              )}
            </section>
          )}

          {section === 'examples' && (
            <section>
              <SectionHead icon={FlaskConical} kicker="No key needed" title="Worked examples">
                Saved runs with real-looking replies and full reports. Load one, then look around every section.
              </SectionHead>
              <div className="examples">
                {EXAMPLES.map((ex) => {
                  const r = parseReport(ex.report);
                  const vm = VERDICT_META[r.verdict];
                  const VI = vm.icon;
                  return (
                    <button className="example" key={ex.id} onClick={() => loadExample(ex)}>
                      <div className="example-top">
                        <span className="chip on static">{ex.purpose}</span>
                        <span className={`pill ${vm.cls}`}>
                          <VI size={13} /> {r.verdict}
                        </span>
                      </div>
                      <h3>{ex.title}</h3>
                      <p>{ex.blurb}</p>
                      <div className="example-foot">
                        <span>
                          {ex.runs.length} tests · {r.changes.filter((c) => c.label === 'Side effect').length} side effects
                        </span>
                        <ArrowRight size={18} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {section === 'method' && (
            <section>
              <SectionHead icon={BookOpen} title="Method">
                How the comparison works, and where it can go wrong.
              </SectionHead>
              <div className="method">
                {[
                  { icon: FileDiff, t: 'Text diff', d: 'Both prompts are split into sentences and lined up in your browser. Added and dropped sentences are shown as they are, with no interpretation.' },
                  { icon: MessagesSquare, t: 'Paired runs', d: 'Each test message goes to the chosen model twice, once with prompt A as the system prompt and once with B, at a low temperature so differences come from the prompt more than from chance.' },
                  { icon: Scale, t: 'Judgement', d: 'The model reads your stated intent, both prompts and every pair of replies, then labels each test Intended, Side effect, No change or Unclear and quotes the wording it thinks caused each side effect.' },
                  { icon: ClipboardCheck, t: 'Verdict rules', d: 'Ship if the change landed and side effects are cosmetic. Retest if a side effect is real but easy to fix. Hold if it touches safety, accuracy, contractual information, or stops a user getting what they came for.' },
                ].map((m) => (
                  <div className="method-step" key={m.t}>
                    <span className="il-icon big">
                      <m.icon size={20} />
                    </span>
                    <div>
                      <h3>{m.t}</h3>
                      <p>{m.d}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="two-col">
                <div className="card">
                  <h3 className="card-title">
                    <TriangleAlert size={18} /> Limits
                  </h3>
                  <ul className="icon-list tight">
                    <li><span className="il-icon"><Minus size={14} /></span>Four to six messages are a spot check, not a full eval. Confidence drops when tests are narrow.</li>
                    <li><span className="il-icon"><Minus size={14} /></span>One run per version. A model can answer differently on a second try, so rerun anything borderline.</li>
                    <li><span className="il-icon"><Minus size={14} /></span>The judge is a model too. It can miss a subtle change or overstate a harmless one.</li>
                    <li><span className="il-icon"><Minus size={14} /></span>Tool calls, retrieval and conversation history are not simulated. Only the system prompt and one message.</li>
                  </ul>
                </div>
                <div className="card">
                  <h3 className="card-title">
                    <Database size={18} /> Data and privacy
                  </h3>
                  <ul className="icon-list tight">
                    <li><span className="il-icon"><Lock size={14} /></span>No accounts, no database, no analytics on what you paste.</li>
                    <li><span className="il-icon"><Cpu size={14} /></span>Text goes through this site's server function to the model provider you picked, and nowhere else.</li>
                    <li><span className="il-icon"><KeyRound size={14} /></span>Your own key is sent with each request and kept only in this tab's memory. Refreshing clears it.</li>
                    <li><span className="il-icon"><FlaskConical size={14} /></span>Worked examples use invented companies and saved replies, written to show realistic drift.</li>
                  </ul>
                </div>
              </div>
            </section>
          )}

          {section === 'settings' && (
            <section>
              <SectionHead icon={Settings2} title="Model & key">
                The same model answers the test messages and writes the report.
              </SectionHead>
              <div className="providers">
                {PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    className={`provider ${settings.provider === p.id ? 'on' : ''}`}
                    onClick={() => setSettings((s) => ({ ...s, provider: p.id, model: p.model || '' }))}
                  >
                    <span className="provider-icon">{settings.provider === p.id ? <Check size={18} /> : <Cpu size={18} />}</span>
                    <b>{p.name}</b>
                    <span>{p.note}</span>
                  </button>
                ))}
              </div>
              {provider.needsKey ? (
                <div className="card">
                  <div className="field">
                    <label className="field-label" htmlFor="key">
                      <KeyRound size={15} /> {provider.name} API key
                    </label>
                    <input
                      id="key"
                      type="password"
                      autoComplete="off"
                      value={settings.key}
                      placeholder="Paste your key"
                      onChange={(e) => setSettings((s) => ({ ...s, key: e.target.value }))}
                    />
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor="model">
                      Model name
                    </label>
                    <input id="model" value={settings.model} onChange={(e) => setSettings((s) => ({ ...s, model: e.target.value }))} />
                    <span className="muted small-text">Change this if your account uses a different model.</span>
                  </div>
                  <p className="note">
                    <Lock size={15} /> Kept in this tab only. Sent with each request through this site's server function to {provider.name}, never stored or logged.
                  </p>
                </div>
              ) : (
                <div className="card soft">
                  <p className="note">
                    <Info size={15} /> Runs on Meta's Muse Glimmer through NVIDIA's free endpoint, on this site's own key. No key needed from you. If it is busy, switch to a provider above with your own key.
                  </p>
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
