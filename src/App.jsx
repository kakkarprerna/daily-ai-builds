import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRightLeft,
  BookOpen,
  Check,
  ChevronRight,
  ClipboardCopy,
  Cpu,
  Database,
  FlaskConical,
  GitBranch,
  HelpCircle,
  KeyRound,
  Layers,
  Lightbulb,
  ListChecks,
  Loader2,
  Network,
  Plug,
  Plus,
  RotateCcw,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Stethoscope,
  TriangleAlert,
  X,
  XCircle,
} from 'lucide-react';
import { EXAMPLES } from './examples.js';
import { parseDiagnosis } from './parse.js';

/* ---------- Reference data ---------- */

const CATEGORY_META = {
  Configuration: { icon: SlidersHorizontal, line: 'Settings, secrets and feature flags that differ per environment.' },
  Data: { icon: Database, line: 'Real records look different from test records: gaps, old formats, volume.' },
  Permissions: { icon: KeyRound, line: 'Roles, groups, sign-in and access rules that differ per environment.' },
  Caching: { icon: Layers, line: 'An older stored copy is being served instead of the new one.' },
  Version: { icon: GitBranch, line: 'The environments run different builds, or a release only partly landed.' },
  Infrastructure: { icon: Network, line: 'Domains, networking, limits and timeouts around the app.' },
  'Third-party': { icon: Plug, line: 'A vendor behaves differently in test mode and live mode.' },
  Unclear: { icon: HelpCircle, line: 'The details given do not yet separate the options.' },
};

const ENVS = ['Local', 'Dev', 'Staging', 'QA / UAT', 'Production'];
const FAILURE_KINDS = [
  'Error message',
  'Blank or missing data',
  'Wrong data shown',
  'Slow or timing out',
  'Feature missing or not showing',
  'Access denied or login fails',
  'Integration not firing',
];
const AFFECTED = ['Everyone', 'Some users or accounts', 'Only new users', 'Only certain roles', 'Only one region', 'Just me so far'];
const STARTED = [
  'Since first deploy to that environment',
  'After a recent deploy',
  'After a config or flag change',
  'After a data migration',
  'No clear trigger',
];
const CHECKED = [
  'Same build version in both',
  'Feature flags compared',
  'Tried another account',
  'Cleared cache or used incognito',
  'Checked error logs',
  'Compared settings screens',
];

const PROVIDERS = [
  { id: 'muse', name: 'Muse Glimmer', note: 'Free demo', keyLabel: 'Your own NVIDIA key (optional)', needsKey: false },
  { id: 'anthropic', name: 'Anthropic', note: 'Your key', keyLabel: 'Your Anthropic API key', needsKey: true },
  { id: 'openai', name: 'OpenAI', note: 'Your key', keyLabel: 'Your OpenAI API key', needsKey: true },
  { id: 'gemini', name: 'Gemini', note: 'Your key', keyLabel: 'Your Gemini API key', needsKey: true },
];

const EMPTY = {
  symptom: '',
  worksIn: 'Staging',
  failsIn: 'Production',
  failureKind: '',
  affected: '',
  started: '',
  checked: [],
  notes: '',
};

const NAV = [
  { id: 'diagnose', label: 'Diagnose', line: 'Describe the gap, get the likely cause and checks', icon: Stethoscope },
  { id: 'examples', label: 'Examples', line: 'Three saved cases, no key needed', icon: FlaskConical },
  { id: 'how', label: 'How it works', line: 'The seven drift types and the limits', icon: BookOpen },
];

/* ---------- App ---------- */

export default function App() {
  const [view, setView] = useState('diagnose');
  const [form, setForm] = useState(EMPTY);
  const [provider, setProvider] = useState('muse');
  const [apiKey, setApiKey] = useState('');
  const [result, setResult] = useState(null);
  const [exampleId, setExampleId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const mainRef = useRef(null);
  const resultRef = useRef(null);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [view]);

  const update = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setExampleId(null);
  };

  const scrollToResult = () =>
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);

  const loadExample = (ex) => {
    setForm({ ...EMPTY, ...ex.input });
    setResult(parseDiagnosis(ex.result));
    setExampleId(ex.id);
    setError('');
    setView('diagnose');
    scrollToResult();
  };

  const reset = () => {
    setForm(EMPTY);
    setResult(null);
    setExampleId(null);
    setError('');
  };

  const run = async () => {
    setError('');
    if (!form.symptom.trim()) return setError('Describe what happens first.');
    if (!form.failsIn) return setError('Pick where it fails.');
    const p = PROVIDERS.find((x) => x.id === provider);
    if (p.needsKey && !apiKey.trim()) return setError(`${p.name} needs your own API key. Or switch to Muse Glimmer, which is free.`);

    setLoading(true);
    setResult(null);
    try {
      const r = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey: apiKey.trim(), input: form }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Something went wrong. Try again.');
      const parsed = parseDiagnosis(data.text);
      if (!parsed.verdict) throw new Error('The model reply could not be read. Try again, or switch provider.');
      setResult(parsed);
      scrollToResult();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shell">
      <Sidebar view={view} setView={setView} />
      <main className="main" ref={mainRef}>
        <div className="main-inner">
          {view === 'diagnose' && (
            <DiagnoseView
              form={form}
              update={update}
              provider={provider}
              setProvider={setProvider}
              apiKey={apiKey}
              setApiKey={setApiKey}
              run={run}
              reset={reset}
              loading={loading}
              error={error}
              result={result}
              resultRef={resultRef}
              exampleId={exampleId}
              goExamples={() => setView('examples')}
            />
          )}
          {view === 'examples' && <ExamplesView loadExample={loadExample} />}
          {view === 'how' && <HowView goDiagnose={() => setView('diagnose')} />}
        </div>
      </main>
    </div>
  );
}

/* ---------- Sidebar ---------- */

function Sidebar({ view, setView }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <ArrowRightLeft size={20} strokeWidth={2.6} />
        </div>
        <div>
          <div className="brand-name">Works on Staging</div>
          <div className="brand-sub">Environment drift, diagnosed</div>
        </div>
      </div>
      <nav className="nav">
        {NAV.map((n) => {
          const Icon = n.icon;
          return (
            <button key={n.id} className={`nav-item ${view === n.id ? 'active' : ''}`} onClick={() => setView(n.id)}>
              <span className="nav-icon">
                <Icon size={18} />
              </span>
              <span className="nav-text">
                <span className="nav-label">{n.label}</span>
                <span className="nav-line">{n.line}</span>
              </span>
            </button>
          );
        })}
      </nav>
      <div className="sidebar-foot">
        <ShieldCheck size={15} />
        <span>Nothing you type is stored. Pasted keys are used for one request only.</span>
      </div>
    </aside>
  );
}

/* ---------- Diagnose ---------- */

function DiagnoseView(props) {
  const { form, update, provider, setProvider, apiKey, setApiKey, run, reset, loading, error, result, resultRef, exampleId, goExamples } = props;
  const p = PROVIDERS.find((x) => x.id === provider);
  const ex = EXAMPLES.find((e) => e.id === exampleId);

  return (
    <>
      <header className="page-head">
        <span className="eyebrow">
          <Sparkles size={14} /> PM workflow diagnosis
        </span>
        <h1>It works on staging. Why not in production?</h1>
        <p className="lede">
          Describe the gap. Get the most likely kind of drift, checks you can run yourself, and a ready note for engineering if it comes to that.
        </p>
        <button className="link-btn" onClick={goExamples}>
          New here? Load a worked example <ChevronRight size={16} />
        </button>
      </header>

      <section className="card">
        <FieldTitle n="1" title="What happens" hint="Describe what you expected and what you see instead, in each environment." />
        <textarea
          rows={4}
          value={form.symptom}
          onChange={(e) => update('symptom', e.target.value)}
          placeholder="e.g. Invite emails arrive on staging, but in production new team members never get them."
        />

        <div className="env-pair">
          <ChipRow label="Works in" icon={Check} options={ENVS} value={form.worksIn} onChange={(v) => update('worksIn', v)} allowCustom />
          <ChipRow label="Fails in" icon={X} options={ENVS} value={form.failsIn} onChange={(v) => update('failsIn', v)} allowCustom />
        </div>
      </section>

      <section className="card">
        <FieldTitle n="2" title="What the failure looks like" hint="Pick the closest match, or add your own." />
        <ChipRow label="Kind of failure" options={FAILURE_KINDS} value={form.failureKind} onChange={(v) => update('failureKind', v)} allowCustom />
        <ChipRow label="Who is affected where it fails" options={AFFECTED} value={form.affected} onChange={(v) => update('affected', v)} allowCustom />
        <ChipRow label="When it started" options={STARTED} value={form.started} onChange={(v) => update('started', v)} allowCustom />
      </section>

      <section className="card">
        <FieldTitle n="3" title="What you already know" hint="Checks you have done are used to rule causes out, so tick any that apply." />
        <ChipRow label="Checks already done" options={CHECKED} value={form.checked} onChange={(v) => update('checked', v)} multi allowCustom />
        <label className="sub-label">Anything else (optional)</label>
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="Results of your checks, an error message you saw, or a pattern support has noticed."
        />
      </section>

      <section className="card">
        <FieldTitle n="4" title="Model" hint="Muse Glimmer is free to use here. The others need your own key." />
        <div className="chips">
          {PROVIDERS.map((x) => (
            <button key={x.id} className={`chip provider ${provider === x.id ? 'on' : ''}`} onClick={() => setProvider(x.id)}>
              <Cpu size={14} />
              {x.name}
              <span className="chip-note">{x.note}</span>
            </button>
          ))}
        </div>
        <label className="sub-label">{p.keyLabel}</label>
        <input
          type="password"
          autoComplete="off"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={p.needsKey ? 'Paste your key' : 'Leave blank to use the free demo'}
        />
      </section>

      {error && (
        <div className="alert">
          <TriangleAlert size={18} /> {error}
        </div>
      )}

      <div className="actions">
        <button className="btn-primary" onClick={run} disabled={loading}>
          {loading ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
          {loading ? 'Diagnosing…' : 'Diagnose the drift'}
        </button>
        <button className="btn-ghost" onClick={reset}>
          <RotateCcw size={16} /> Start again
        </button>
      </div>

      <div ref={resultRef}>
        {result && <Result result={result} example={ex} />}
      </div>
    </>
  );
}

function FieldTitle({ n, title, hint }) {
  return (
    <div className="field-title">
      <span className="step-num">{n}</span>
      <div>
        <h3>{title}</h3>
        <p>{hint}</p>
      </div>
    </div>
  );
}

function ChipRow({ label, icon: Icon, options, value, onChange, multi = false, allowCustom = false }) {
  const [extra, setExtra] = useState([]);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const selected = multi ? value : [value];
  const all = [...options, ...extra, ...selected.filter((s) => s && !options.includes(s) && !extra.includes(s))];

  const toggle = (opt) => {
    if (multi) onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
    else onChange(value === opt ? '' : opt);
  };

  const commit = () => {
    const v = draft.trim();
    if (v) {
      if (!all.includes(v)) setExtra((e) => [...e, v]);
      if (multi) onChange(value.includes(v) ? value : [...value, v]);
      else onChange(v);
    }
    setDraft('');
    setAdding(false);
  };

  return (
    <div className="chip-row">
      <div className="chip-label">
        {Icon && <Icon size={14} />} {label}
      </div>
      <div className="chips">
        {all.map((opt) => (
          <button key={opt} className={`chip ${selected.includes(opt) ? 'on' : ''}`} onClick={() => toggle(opt)}>
            {multi && selected.includes(opt) && <Check size={13} />}
            {opt}
          </button>
        ))}
        {allowCustom &&
          (adding ? (
            <span className="chip-input">
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commit();
                  if (e.key === 'Escape') setAdding(false);
                }}
                onBlur={commit}
                placeholder="Type and press Enter"
              />
            </span>
          ) : (
            <button className="chip add" onClick={() => setAdding(true)}>
              <Plus size={13} /> Add your own
            </button>
          ))}
      </div>
    </div>
  );
}

/* ---------- Result ---------- */

function Result({ result, example }) {
  const [copied, setCopied] = useState(false);
  const meta = CATEGORY_META[result.verdict] || CATEGORY_META.Unclear;
  const VIcon = meta.icon;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.handover.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <section className="result">
      {example && (
        <div className="saved-banner">
          <FlaskConical size={16} />
          <span>
            Saved worked example: <strong>{example.title}</strong>. Edit any field and diagnose again to run it live.
          </span>
        </div>
      )}

      <div className="verdict">
        <div className="verdict-icon">
          <VIcon size={30} />
        </div>
        <div className="verdict-body">
          <div className="verdict-top">
            <span className="verdict-kicker">Most likely drift</span>
            {result.confidence && <span className="conf-pill">{result.confidence} confidence</span>}
          </div>
          <h2>{result.verdict}</h2>
          <p>{result.summary}</p>
        </div>
      </div>

      {result.drift.length > 0 && (
        <div className="block">
          <BlockHead icon={Layers} title="Where the drift could be" line="Ranked from most to least likely, with the reason." />
          <div className="drift-list">
            {result.drift.map((d, i) => {
              const DI = (CATEGORY_META[d.category] || CATEGORY_META.Unclear).icon;
              return (
                <div className="drift" key={i}>
                  <div className="drift-head">
                    <span className="drift-icon">
                      <DI size={18} />
                    </span>
                    <strong>{d.category}</strong>
                    <Likelihood level={d.level} />
                  </div>
                  <p>{d.why}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {result.checks.length > 0 && (
        <div className="block">
          <BlockHead icon={ListChecks} title="Checks to run yourself" line="Cheapest first. None of these need code." />
          <ol className="checks">
            {result.checks.map((c, i) => (
              <li key={i} className="check">
                <span className="check-num">{i + 1}</span>
                <div>
                  <h4>{c.title}</h4>
                  <p>{c.how}</p>
                  {c.means && (
                    <p className="means">
                      <Lightbulb size={15} /> <span>{c.means}</span>
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="two-col">
        {result.ruledOut.length > 0 && (
          <div className="block">
            <BlockHead icon={XCircle} title="Probably not" line="Ruled out by what you told it." />
            <ul className="ruled">
              {result.ruledOut.map((r, i) => {
                const RI = (CATEGORY_META[r.category] || CATEGORY_META.Unclear).icon;
                return (
                  <li key={i}>
                    <span className="ruled-icon">
                      <RI size={15} />
                    </span>
                    <div>
                      <strong>{r.category}</strong>
                      <span>{r.why}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {result.flip && (
          <div className="block flip">
            <BlockHead icon={RotateCcw} title="What would change the call" line="Watch for this while you check." />
            <p>{result.flip}</p>
          </div>
        )}
      </div>

      {result.handover.length > 0 && (
        <div className="block">
          <div className="handover-head">
            <BlockHead icon={Send} title="If you still need engineering" line="A short note to send. Fill in the brackets with what your checks found." />
            <button className="btn-soft" onClick={copy}>
              {copied ? <Check size={16} /> : <ClipboardCopy size={16} />} {copied ? 'Copied' : 'Copy note'}
            </button>
          </div>
          <div className="handover">
            {result.handover.map((h, i) => (
              <p key={i}>{h}</p>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function BlockHead({ icon: Icon, title, line }) {
  return (
    <div className="block-head">
      <span className="block-icon">
        <Icon size={18} />
      </span>
      <div>
        <h3>{title}</h3>
        <p>{line}</p>
      </div>
    </div>
  );
}

function Likelihood({ level }) {
  const n = level === 'High' ? 3 : level === 'Medium' ? 2 : 1;
  return (
    <span className="likely" title={`${level} likelihood`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={`bar ${i <= n ? 'on' : ''}`} />
      ))}
      <span className="likely-label">{level}</span>
    </span>
  );
}

/* ---------- Examples ---------- */

function ExamplesView({ loadExample }) {
  return (
    <>
      <header className="page-head">
        <span className="eyebrow">
          <FlaskConical size={14} /> Worked examples
        </span>
        <h1>Three cases, already diagnosed</h1>
        <p className="lede">Open one to see the inputs and the full saved result. No key or model call needed.</p>
      </header>
      <div className="ex-grid">
        {EXAMPLES.map((ex) => {
          const verdict = parseDiagnosis(ex.result).verdict;
          const Icon = (CATEGORY_META[verdict] || CATEGORY_META.Unclear).icon;
          return (
            <button key={ex.id} className="ex-card" onClick={() => loadExample(ex)}>
              <div className="ex-top">
                <span className="ex-icon">
                  <Icon size={22} />
                </span>
                <span className="ex-tag">{verdict}</span>
              </div>
              <h3>{ex.title}</h3>
              <p>{ex.blurb}</p>
              <div className="ex-envs">
                <span>
                  <Check size={13} /> {ex.input.worksIn}
                </span>
                <span>
                  <X size={13} /> {ex.input.failsIn}
                </span>
              </div>
              <span className="ex-open">
                Open example <ChevronRight size={16} />
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ---------- How it works ---------- */

function HowView({ goDiagnose }) {
  const steps = [
    { icon: Stethoscope, title: 'Describe the gap', line: 'Where it works, where it fails, and what you have already checked.' },
    { icon: Layers, title: 'Get the likely drift', line: 'One of seven drift types, ranked, with confidence and reasons.' },
    { icon: ListChecks, title: 'Check it yourself', line: 'Ordered checks you can run without code, then a note for engineering if needed.' },
  ];
  return (
    <>
      <header className="page-head">
        <span className="eyebrow">
          <BookOpen size={14} /> How it works
        </span>
        <h1>Same code, different result</h1>
        <p className="lede">
          When something works in one environment and not another, the code is usually identical. What differs is everything around it. This app helps you find which part.
        </p>
      </header>

      <div className="how-steps">
        {steps.map((s, i) => (
          <div className="how-step" key={i}>
            <span className="how-icon">
              <s.icon size={22} />
            </span>
            <h3>{s.title}</h3>
            <p>{s.line}</p>
          </div>
        ))}
      </div>

      <div className="block">
        <BlockHead icon={Layers} title="The seven kinds of drift" line="Every diagnosis is placed in one of these." />
        <div className="cat-grid">
          {Object.entries(CATEGORY_META)
            .filter(([k]) => k !== 'Unclear')
            .map(([k, m]) => (
              <div className="cat" key={k}>
                <span className="cat-icon">
                  <m.icon size={18} />
                </span>
                <div>
                  <strong>{k}</strong>
                  <span>{m.line}</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="two-col">
        <div className="block">
          <BlockHead icon={Cpu} title="Where the answer comes from" line="Worth knowing before you act on it." />
          <ul className="plain-list">
            <li>A language model reads your description with fixed instructions and returns a structured diagnosis.</li>
            <li>It only knows what you type. It cannot see your systems, logs or settings.</li>
            <li>The worked examples are invented scenarios with saved answers.</li>
          </ul>
        </div>
        <div className="block">
          <BlockHead icon={TriangleAlert} title="Limits" line="Use it to point, not to prove." />
          <ul className="plain-list">
            <li>It gives a likely cause. Your checks confirm it.</li>
            <li>Vague descriptions lead to vague answers, so include what you have already tried.</li>
            <li>For outages affecting customers now, follow your incident process first.</li>
          </ul>
        </div>
      </div>

      <button className="btn-primary" onClick={goDiagnose}>
        <Stethoscope size={18} /> Diagnose a gap
      </button>
    </>
  );
}
