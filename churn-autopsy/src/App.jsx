import { useRef, useState } from 'react';
import {
  Microscope, FileSearch, BookOpen, Library, Plus, X, Play, KeyRound, Loader2,
  MousePointerClick, TrendingUp, Users, MessageCircleHeart, LifeBuoy, Receipt, Globe, Tag,
  Flag, OctagonX, Clock, ArrowRight, EyeOff, Lightbulb, ListChecks, Copy, Check,
  RefreshCw, Info, ShieldCheck, Scale, AlertTriangle, PencilLine, Rewind, Database, Activity,
} from 'lucide-react';
import { EXAMPLES } from './examples.js';
import { parseAutopsy } from './parse.js';

/* ---------- constants ---------- */

const CAT_ICONS = {
  'Product adoption': MousePointerClick,
  'Business outcomes': TrendingUp,
  Engagement: Users,
  Sentiment: MessageCircleHeart,
  Support: LifeBuoy,
  Commercial: Receipt,
  External: Globe,
};
const CATEGORIES = Object.keys(CAT_ICONS);
const catIcon = (c) => {
  const key = Object.keys(CAT_ICONS).find((k) => k.toLowerCase() === String(c || '').toLowerCase().trim());
  return key ? CAT_ICONS[key] : Tag;
};

const SEGMENTS = ['SMB', 'Mid-market', 'Enterprise'];
const SIZES = ['Under €10k', '€10k to €50k', '€50k to €150k', '€150k+'];
const TENURES = ['Under 1 year', '1 to 2 years', '2 to 4 years', '4+ years'];
const OUTCOMES = ["Didn't renew", 'Downgraded', 'Cancelled mid-term', 'Went quiet'];

const PROVIDERS = [
  { id: 'muse', label: 'Muse Glimmer', note: 'Free, no key needed' },
  { id: 'anthropic', label: 'Anthropic', note: 'Your own key' },
  { id: 'openai', label: 'OpenAI', note: 'Your own key' },
  { id: 'gemini', label: 'Gemini', note: 'Your own key' },
];

const NAV = [
  { id: 'run', label: 'Run an autopsy', desc: 'Rebuild a lost account and find where it turned', icon: FileSearch },
  { id: 'how', label: 'How it works', desc: 'What it looks for and where answers come from', icon: BookOpen },
  { id: 'examples', label: 'Examples', desc: 'Three saved autopsies, no key needed', icon: Library },
];

const blankEvent = (months = '') => ({ months, category: '', note: '' });
const blankAccount = () => ({
  name: '', segment: '', size: '', tenure: '', outcome: '', stated: '', actions: '',
  events: [blankEvent(9), blankEvent(6), blankEvent(3)],
});

/* ---------- small components ---------- */

function ChipGroup({ options, value, onChange, allowCustom = true, icons }) {
  const [extra, setExtra] = useState([]);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const all = [...options, ...extra, ...(value && ![...options, ...extra].includes(value) ? [value] : [])];
  const commit = () => {
    const v = draft.trim();
    if (v) {
      if (!all.includes(v)) setExtra((e) => [...e, v]);
      onChange(v);
    }
    setDraft('');
    setAdding(false);
  };
  return (
    <div className="chips">
      {all.map((o) => {
        const Icon = icons ? icons(o) : null;
        return (
          <button type="button" key={o} className={`chip ${value === o ? 'on' : ''}`} onClick={() => onChange(value === o ? '' : o)}>
            {Icon && <Icon size={14} />} {o}
          </button>
        );
      })}
      {allowCustom &&
        (adding ? (
          <span className="chip-input">
            <input
              autoFocus value={draft} placeholder="Type and press Enter"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } if (e.key === 'Escape') setAdding(false); }}
              onBlur={commit}
            />
          </span>
        ) : (
          <button type="button" className="chip add" onClick={() => setAdding(true)}>
            <Plus size={14} /> Add your own
          </button>
        ))}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="field">
      <div className="field-label">{label}{hint && <span className="hint">{hint}</span>}</div>
      {children}
    </div>
  );
}

function Card({ icon: Icon, title, kicker, children, className = '' }) {
  return (
    <section className={`card ${className}`}>
      {(title || Icon) && (
        <header className="card-head">
          {Icon && <span className="card-icon"><Icon size={18} /></span>}
          <div>
            {kicker && <div className="kicker">{kicker}</div>}
            {title && <h3>{title}</h3>}
          </div>
        </header>
      )}
      {children}
    </section>
  );
}

function ConfPill({ level }) {
  const l = (level || '').toLowerCase();
  const cls = l.startsWith('h') ? 'good' : l.startsWith('m') ? 'warn' : 'bad';
  return <span className={`pill status ${cls}`}><Activity size={13} /> {level || 'Unknown'} confidence</span>;
}

/* ---------- results ---------- */

function Results({ account, result, source, onEdit }) {
  const [copied, setCopied] = useState(false);
  const events = account.events;
  const missedSet = new Set(result.missed.map((m) => m.event));
  const first = result.firstSignal?.event;
  const last = result.noReturn?.event;
  const Verdict = catIcon(result.verdict);

  const copyRules = async () => {
    try {
      await navigator.clipboard.writeText(result.rules.map((r) => `• ${r}`).join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked */ }
  };

  return (
    <div className="results">
      <div className="verdict">
        <div className="verdict-top">
          <span className="verdict-icon"><Verdict size={26} /></span>
          <div>
            <div className="kicker light">Root cause · {account.name || 'This account'}</div>
            <h2>{result.verdict}</h2>
          </div>
        </div>
        <p>{result.summary}</p>
        <div className="verdict-meta">
          <ConfPill level={result.confidence} />
          {result.saveWindow && <span className="pill light"><Clock size={13} /> Save window: {result.saveWindow}</span>}
        </div>
      </div>

      <div className="grid2">
        <Card icon={Flag} kicker="Earliest real warning" title={first ? `Event ${first}` : 'Not identified'}>
          <p className="muted">{result.firstSignal?.why}</p>
        </Card>
        <Card icon={OctagonX} kicker="Point of no return" title={last ? `Event ${last}` : 'Not identified'} className="noreturn">
          <p className="muted">{result.noReturn?.why}</p>
        </Card>
      </div>

      <Card icon={Rewind} title="The timeline, re-read">
        <ol className="tl">
          {events.map((e, i) => {
            const n = i + 1;
            const inWindow = first && last && n >= first && n < last;
            const Icon = catIcon(e.category);
            return (
              <li key={i} className={`tl-item ${inWindow ? 'win' : ''} ${n === first ? 'first' : ''} ${n === last ? 'last' : ''}`}>
                <div className="tl-rail"><span className="tl-dot">{n}</span></div>
                <div className="tl-body">
                  <div className="tl-meta">
                    <span className="tl-when">{e.months === 0 || e.months === '0' ? 'Exit month' : `${e.months} mo before`}</span>
                    <span className="tl-cat"><Icon size={13} /> {e.category || 'Uncategorised'}</span>
                    {n === first && <span className="tag first"><Flag size={12} /> First real signal</span>}
                    {n === last && <span className="tag last"><OctagonX size={12} /> No return</span>}
                    {missedSet.has(n) && <span className="tag missed"><EyeOff size={12} /> Missed</span>}
                  </div>
                  <p>{e.note}</p>
                </div>
              </li>
            );
          })}
        </ol>
        {first && last && <div className="legend"><span className="sw" /> Shaded events sit inside the save window</div>}
      </Card>

      <Card icon={Scale} title="What they said vs what happened">
        <div className="versus">
          <div className="vs-box"><div className="kicker">They said</div><p>{result.stated}</p></div>
          <ArrowRight className="vs-arrow" size={22} />
          <div className="vs-box real"><div className="kicker">Likely real reason</div><p>{result.real}</p></div>
        </div>
      </Card>

      <Card icon={EyeOff} title="Signals that were there, but missed">
        <div className="stack">
          {result.missed.map((m, i) => {
            const Icon = catIcon(m.category);
            return (
              <div className="row-card" key={i}>
                <span className="num">{m.event ?? '?'}</span>
                <div>
                  <p>{m.why}</p>
                  <span className="tl-cat"><Icon size={13} /> Should have been caught by: {m.category}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card icon={Lightbulb} title="What would have changed the outcome">
        <div className="steps">
          {result.plays.map((p, i) => (
            <div className="step" key={i}>
              <span className="step-n">{i + 1}</span>
              <div><div className="step-when">{p.when}</div><p>{p.what}</p></div>
            </div>
          ))}
        </div>
      </Card>

      <Card icon={ListChecks} title="Rules to run across the rest of your book" className="rules-card">
        <div className="rules">
          {result.rules.map((r, i) => (
            <div className="rule" key={i}><ShieldCheck size={18} /><span>{r}</span></div>
          ))}
        </div>
        <button className="btn ghost small" onClick={copyRules}>
          {copied ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy rules</>}
        </button>
      </Card>

      {result.flips.length > 0 && (
        <Card icon={RefreshCw} title="What would change this verdict">
          <div className="stack">
            {result.flips.map((f, i) => <div className="flip" key={i}><RefreshCw size={15} /> <span>{f}</span></div>)}
          </div>
        </Card>
      )}

      <div className="disclose">
        <Info size={16} />
        <p>
          {source === 'example'
            ? 'Saved example. A fictional account, analysed ahead of time so you can see a full autopsy without a key. '
            : 'Written by the model you picked, using only the events you entered. '}
          It is not compared against industry churn data. Treat it as a structured second opinion to discuss with your team.
        </p>
      </div>

      <div className="actions">
        <button className="btn ghost" onClick={onEdit}><PencilLine size={16} /> Edit and re-run</button>
      </div>
    </div>
  );
}

/* ---------- sections ---------- */

function HowItWorks({ go }) {
  const steps = [
    { icon: PencilLine, t: 'You rebuild the timeline', d: 'What happened, roughly when, and what kind of signal it was. Plus the reason the customer gave.' },
    { icon: Flag, t: 'It finds the first real warning', d: 'Not the loudest moment. The earliest one that actually predicted the loss.' },
    { icon: OctagonX, t: 'And the point of no return', d: 'The gap between the two is your save window: the time you had to act.' },
    { icon: ListChecks, t: 'You leave with rules', d: 'Early-warning checks you can run on every other account this week.' },
  ];
  return (
    <div className="page">
      <div className="page-head">
        <h1>How it works</h1>
        <p className="lede">Most churn reviews stop at the reason the customer gave. This one looks at when things really started to go wrong.</p>
      </div>
      <div className="grid2">
        {steps.map((s) => (
          <div className="mini" key={s.t}><span className="card-icon"><s.icon size={18} /></span><div><h4>{s.t}</h4><p>{s.d}</p></div></div>
        ))}
      </div>

      <Card icon={Tag} title="The seven signal types">
        <p className="muted">The first five match the categories in Pulse Check, so a missed signal points straight at the part of your health score that should have caught it.</p>
        <div className="chips static">
          {CATEGORIES.map((c) => { const I = CAT_ICONS[c]; return <span className="chip on" key={c}><I size={14} /> {c}</span>; })}
        </div>
      </Card>

      <div className="grid2">
        <Card icon={Database} title="Where the answer comes from">
          <p className="muted">A language model reads only what you type in. It is told to refer to your events by number and never invent new ones. It does not use outside churn data or benchmarks.</p>
        </Card>
        <Card icon={ShieldCheck} title="What happens to your data">
          <p className="muted">Nothing is saved. Your timeline goes to the model provider you pick for that one request, then it is gone. Use a fake account name if you prefer.</p>
        </Card>
      </div>

      <Card icon={AlertTriangle} title="Good to know">
        <p className="muted">Thin timelines give thin answers. Five to ten events across the last year works best. The confidence level drops when the evidence is weak.</p>
      </Card>

      <div className="actions"><button className="btn" onClick={() => go('run')}><Play size={16} /> Run an autopsy</button></div>
    </div>
  );
}

function Examples({ open, edit }) {
  return (
    <div className="page">
      <div className="page-head">
        <h1>Examples</h1>
        <p className="lede">Three fictional accounts, already analysed. Open one to see the full autopsy, or load it into the form and change it.</p>
      </div>
      <div className="ex-grid">
        {EXAMPLES.map((ex) => {
          const a = ex.account;
          return (
            <div className="ex" key={ex.id}>
              <div className="ex-top">
                <span className="pill">{a.segment}</span>
                <span className="pill">{a.outcome}</span>
              </div>
              <h3>{a.name}</h3>
              <p className="muted">{ex.blurb}</p>
              <div className="ex-meta"><Clock size={14} /> {a.events.length} events · {a.tenure}</div>
              <div className="ex-actions">
                <button className="btn small" onClick={() => open(ex)}><Microscope size={15} /> Open autopsy</button>
                <button className="btn ghost small" onClick={() => edit(ex)}><PencilLine size={15} /> Load into form</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RunForm({ account, setAccount, provider, setProvider, apiKey, setApiKey, onRun, busy, error }) {
  const set = (k) => (v) => setAccount((a) => ({ ...a, [k]: v }));
  const setEvent = (i, k, v) => setAccount((a) => ({ ...a, events: a.events.map((e, j) => (j === i ? { ...e, [k]: v } : e)) }));
  const addEvent = () => setAccount((a) => ({ ...a, events: [...a.events, blankEvent()] }));
  const removeEvent = (i) => setAccount((a) => ({ ...a, events: a.events.filter((_, j) => j !== i) }));
  const filled = account.events.filter((e) => e.note.trim() && e.months !== '');
  const needsKey = provider !== 'muse';
  const canRun = filled.length >= 2 && (!needsKey || apiKey.trim()) && !busy;

  return (
    <div className="page">
      <div className="page-head">
        <h1>Run an autopsy</h1>
        <p className="lede">Rebuild what happened with a lost account. You will get the first real warning sign, the point of no return, and rules for the rest of your book.</p>
      </div>

      <Card icon={Users} kicker="Step 1" title="The account">
        <Field label="Account name" hint="A made-up name is fine">
          <input className="input" value={account.name} onChange={(e) => set('name')(e.target.value)} placeholder="e.g. Northwind Retail" />
        </Field>
        <Field label="Segment"><ChipGroup options={SEGMENTS} value={account.segment} onChange={set('segment')} /></Field>
        <Field label="Contract size (per year)"><ChipGroup options={SIZES} value={account.size} onChange={set('size')} /></Field>
        <Field label="Time as a customer"><ChipGroup options={TENURES} value={account.tenure} onChange={set('tenure')} /></Field>
        <Field label="How it ended"><ChipGroup options={OUTCOMES} value={account.outcome} onChange={set('outcome')} /></Field>
      </Card>

      <Card icon={MessageCircleHeart} kicker="Step 2" title="The exit">
        <Field label="Reason the customer gave">
          <textarea className="input" rows={2} value={account.stated} onChange={(e) => set('stated')(e.target.value)} placeholder="e.g. Budget cuts, moving to a cheaper tool" />
        </Field>
        <Field label="What your team did" hint="Optional">
          <textarea className="input" rows={2} value={account.actions} onChange={(e) => set('actions')(e.target.value)} placeholder="e.g. Monthly check-ins, offered a discount at renewal" />
        </Field>
      </Card>

      <Card icon={Rewind} kicker="Step 3" title="The timeline">
        <p className="muted small">Add what happened, oldest first. Use 0 for the month they left. At least two events.</p>
        <div className="events">
          {account.events.map((e, i) => (
            <div className="event" key={i}>
              <div className="event-head">
                <span className="num">{i + 1}</span>
                <label className="months">
                  <input
                    className="input tiny" type="number" min="0" max="60" value={e.months}
                    onChange={(ev) => setEvent(i, 'months', ev.target.value === '' ? '' : Number(ev.target.value))}
                  />
                  <span>months before exit</span>
                </label>
                {account.events.length > 2 && (
                  <button className="icon-btn" onClick={() => removeEvent(i)} aria-label="Remove event"><X size={16} /></button>
                )}
              </div>
              <ChipGroup options={CATEGORIES} value={e.category} onChange={(v) => setEvent(i, 'category', v)} icons={catIcon} />
              <textarea className="input" rows={2} value={e.note} onChange={(ev) => setEvent(i, 'note', ev.target.value)} placeholder="What happened? e.g. Champion left the company" />
            </div>
          ))}
        </div>
        <button className="btn ghost small" onClick={addEvent}><Plus size={15} /> Add event</button>
      </Card>

      <Card icon={KeyRound} kicker="Step 4" title="The model">
        <div className="providers">
          {PROVIDERS.map((p) => (
            <button type="button" key={p.id} className={`prov ${provider === p.id ? 'on' : ''}`} onClick={() => setProvider(p.id)}>
              <strong>{p.label}</strong><span>{p.note}</span>
            </button>
          ))}
        </div>
        <Field label={needsKey ? 'Your API key' : 'Your NVIDIA key'} hint={needsKey ? 'Required' : 'Optional, uses the free default if blank'}>
          <input className="input" type="password" autoComplete="off" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={needsKey ? 'Paste your key' : 'Leave blank to use the free default'} />
        </Field>
        <p className="muted small"><ShieldCheck size={13} className="inline" /> Your key is sent with this one request and never stored.</p>
      </Card>

      {error && <div className="error"><AlertTriangle size={16} /> {error}</div>}

      <div className="actions sticky">
        <button className="btn big" disabled={!canRun} onClick={onRun}>
          {busy ? <><Loader2 size={18} className="spin" /> Reading the timeline…</> : <><Microscope size={18} /> Run the autopsy</>}
        </button>
        {!canRun && !busy && <span className="muted small">{filled.length < 2 ? 'Add at least two events with a month and a note.' : 'Add your API key for this provider.'}</span>}
      </div>
    </div>
  );
}

/* ---------- app ---------- */

export default function App() {
  const [view, setView] = useState('run');
  const [account, setAccount] = useState(blankAccount);
  const [provider, setProvider] = useState('muse');
  const [apiKey, setApiKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null); // { account, result, source }
  const mainRef = useRef(null);

  const go = (v) => { setView(v); mainRef.current?.scrollTo({ top: 0 }); };

  const run = async () => {
    setBusy(true); setError('');
    const clean = {
      ...account,
      events: account.events
        .filter((e) => e.note.trim() && e.months !== '')
        .map((e) => ({ ...e, months: Number(e.months), category: e.category || 'Uncategorised' }))
        .sort((a, b) => b.months - a.months),
    };
    try {
      const r = await fetch('/api/autopsy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: clean, provider, apiKey }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Something went wrong. Try again.');
      const result = parseAutopsy(d.text);
      if (!result.ok) throw new Error('The model replied in an unexpected format. Try again, or pick another model.');
      setReport({ account: clean, result, source: 'live' });
      go('result');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const openExample = (ex) => { setReport({ account: ex.account, result: parseAutopsy(ex.result), source: 'example' }); go('result'); };
  const editExample = (ex) => { setAccount(JSON.parse(JSON.stringify(ex.account))); setError(''); go('run'); };
  const editReport = () => { if (report) setAccount(JSON.parse(JSON.stringify(report.account))); go('run'); };

  const activeNav = view === 'result' ? (report?.source === 'example' ? 'examples' : 'run') : view;

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">
          <span className="logo"><Microscope size={20} /></span>
          <div><strong>Churn Autopsy</strong><span>Customer success diagnostics</span></div>
        </div>
        <nav className="nav">
          {NAV.map((n) => (
            <button key={n.id} className={`nav-item ${activeNav === n.id ? 'on' : ''}`} onClick={() => go(n.id)}>
              <span className="nav-icon"><n.icon size={18} /></span>
              <span className="nav-text"><strong>{n.label}</strong><span>{n.desc}</span></span>
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <span className="foot-title">Part of a set</span>
          <span>Pulse Check scores health. Expansion Radar spots growth. Churn Autopsy learns from the ones that got away.</span>
        </div>
      </aside>

      <main className="main" ref={mainRef}>
        <div className="main-inner">
          {view === 'run' && (
            <RunForm {...{ account, setAccount, provider, setProvider, apiKey, setApiKey, onRun: run, busy, error }} />
          )}
          {view === 'how' && <HowItWorks go={go} />}
          {view === 'examples' && <Examples open={openExample} edit={editExample} />}
          {view === 'result' && report && (
            <Results account={report.account} result={report.result} source={report.source} onEdit={editReport} />
          )}
        </div>
      </main>
    </div>
  );
}
