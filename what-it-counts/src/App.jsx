import React, { useMemo, useRef, useState } from 'react';
import {
  Database, FileCode2, BookOpen, ShieldAlert, MessageSquareText, Layers, Sparkles, BadgeCheck, Scale, Info,
  TriangleAlert, KeyRound, Loader2, ListChecks, Check, X, Plus, Copy, Download, ArrowRight, CircleHelp, Ban,
  EyeOff, CircleSlash, Users, Divide, Sigma, CalendarClock, Hash, GitMerge, Globe, Shuffle, Search, Target,
  Lightbulb, Rows3, ScanSearch, Handshake, ClipboardCheck, Gauge, Briefcase, CircleCheck, OctagonAlert, Quote, Wand2
} from 'lucide-react';
import {
  DIALECTS, USES, STRICT_USES, TRAPS, RULES, VERDICTS, runRules, parseReply, buildReport, caveatLine, analystMessage,
  reportMarkdown
} from './counts.js';
import { EXAMPLES } from './examples.js';

const SECTIONS = [
  { id: 'start', icon: FileCode2, label: 'Paste a query', desc: 'The SQL, and the question it should answer' },
  { id: 'plain', icon: BookOpen, label: 'Plain English', desc: 'What it does, line by line' },
  { id: 'traps', icon: ShieldAlert, label: 'Traps', desc: 'What could skew the number, and a verdict' },
  { id: 'ask', icon: MessageSquareText, label: 'Ask the analyst', desc: 'Questions and a caveat, ready to send' },
  { id: 'how', icon: Scale, label: 'How it works', desc: 'The pattern checks and verdict rules' },
  { id: 'examples', icon: Layers, label: 'Examples', desc: 'Three worked cases, no key needed' }
];

const TRAP_ICONS = {
  'Double counting': Copy, 'Rows dropped': EyeOff, 'Null trap': CircleSlash, 'Rows not people': Users,
  'Integer division': Divide, 'Wrong average': Sigma, 'Date edge': CalendarClock, 'Hardcoded filter': Hash,
  'AND/OR order': GitMerge, 'Time zone': Globe, 'Unstable result': Shuffle
};
const VERDICT_ICONS = { different: OctagonAlert, check: OctagonAlert, caveat: TriangleAlert, safe: CircleCheck };
const SOURCE_LABEL = { both: 'Pattern check and model agree', rule: 'Pattern check only', model: 'Model only, line found' };

const PROVIDERS = [
  { id: 'muse', label: 'Muse Glimmer', note: 'Free, on this site' },
  { id: 'anthropic', label: 'Anthropic', note: 'Your key' },
  { id: 'openai', label: 'OpenAI', note: 'Your key' },
  { id: 'gemini', label: 'Gemini', note: 'Your key' }
];

const MAX_QUERY = 16000;
const BLANK = { question: '', dialect: 'Not sure', use: 'Weekly metrics', author: '', query: '' };
const slug = (s) => (s || 'what-it-counts').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

function fromExample(ex) {
  return { form: { ...ex.form, query: ex.query }, text: ex.text };
}

export default function App() {
  const first = useMemo(() => fromExample(EXAMPLES[0]), []);
  const [section, setSection] = useState('traps');
  const [form, setForm] = useState(first.form);
  const [loadedExample, setLoadedExample] = useState(EXAMPLES[0].id);
  const [modelText, setModelText] = useState(first.text);
  const [modelQuery, setModelQuery] = useState(first.form.query);
  const [provider, setProvider] = useState('muse');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const mainRef = useRef(null);

  const parsed = useMemo(() => parseReply(modelText), [modelText]);
  const report = useMemo(() => buildReport({ form, parsed }), [form, parsed]);
  const stale = !!modelText && modelQuery.trim() !== form.query.trim();

  const go = (id) => {
    setSection(id);
    if (mainRef.current) mainRef.current.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  };
  const set = (k, v) => {
    setLoadedExample(null);
    setForm((f) => ({ ...f, [k]: v }));
  };

  const loadExample = (ex) => {
    const s = fromExample(ex);
    setForm(s.form);
    setLoadedExample(ex.id);
    setModelText(s.text);
    setModelQuery(s.form.query);
    setError('');
    go('traps');
  };
  const startBlank = () => {
    setForm(BLANK);
    setLoadedExample(null);
    setModelText('');
    setModelQuery('');
    setError('');
    go('start');
  };

  const explain = async () => {
    setError('');
    if (!/\bselect\b/i.test(form.query)) {
      setError('Paste a SQL query that includes a SELECT.');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey, model, question: form.question, dialect: form.dialect, query: form.query.slice(0, MAX_QUERY) })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
      const p = parseReply(data.text);
      if (!p.summary && p.steps.length < 2) throw new Error('The model replied, but not in the expected format. Try again or switch provider.');
      setModelText(data.text);
      setModelQuery(form.query);
      go('plain');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const copyText = async (text, which) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(''), 1800);
    } catch {
      setError('Copy failed in this browser. Use download instead.');
    }
  };
  const downloadReport = () => {
    const blob = new Blob([reportMarkdown(form, report)], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${slug(form.question)}-what-it-counts.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const hasQuery = form.query.trim().length > 0;
  const v = VERDICTS[report.verdict];
  const VIcon = VERDICT_ICONS[report.verdict];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Database size={20} /></div>
          <div>
            <div className="brand-name">What It Counts</div>
            <div className="brand-sub">Read a query before you quote it</div>
          </div>
        </div>
        <nav className="nav">
          {SECTIONS.map((s) => (
            <button key={s.id} className={`nav-item ${section === s.id ? 'active' : ''}`} onClick={() => go(s.id)}>
              <s.icon size={18} className="nav-icon" />
              <span className="nav-text">
                <span className="nav-label">{s.label}</span>
                <span className="nav-desc">{s.desc}</span>
              </span>
            </button>
          ))}
        </nav>
        {hasQuery && (
          <div className="side-plan">
            <div className="side-label">Current query</div>
            <div className="side-name">{form.question || 'Untitled query'}</div>
            <div className={`side-verdict t-${v.tone}`}><VIcon size={14} /> {v.label}</div>
            <div className="side-counts">
              {['High', 'Medium', 'Low'].map((s) => (
                <div key={s} className={`side-count s-${s}`}><b>{report.count[s]}</b> {s.toLowerCase()}</div>
              ))}
            </div>
          </div>
        )}
        <div className="side-foot">A daily AI build by Prerna Kakkar</div>
      </aside>

      <main className="main" ref={mainRef}>
        {section === 'start' && (
          <StartSection
            form={form} set={set} report={report} loadedExample={loadedExample} startBlank={startBlank} go={go}
            provider={provider} setProvider={setProvider} apiKey={apiKey} setApiKey={setApiKey}
            model={model} setModel={setModel} busy={busy} error={error} explain={explain}
          />
        )}
        {section === 'plain' && (report.hasModel ? (
          <PlainSection form={form} report={report} go={go} loadedExample={loadedExample} stale={stale} />
        ) : <Empty icon={BookOpen} eyebrow="Plain English" title="No explanation yet" lede="Pattern checks run as you type, but the line-by-line explanation needs one model call. Paste a query and press Explain, or open a worked example." go={go} />)}
        {section === 'traps' && (hasQuery ? (
          <TrapsSection form={form} report={report} go={go} loadedExample={loadedExample} stale={stale} />
        ) : <Empty icon={ShieldAlert} eyebrow="Traps" title="No query yet" lede="Paste a query and the pattern checks run straight away, with no key." go={go} />)}
        {section === 'ask' && (hasQuery ? (
          <AskSection form={form} report={report} copyText={copyText} copied={copied} downloadReport={downloadReport} error={error} />
        ) : <Empty icon={MessageSquareText} eyebrow="Ask the analyst" title="No query yet" lede="Paste a query first, or open a worked example." go={go} />)}
        {section === 'how' && <HowSection />}
        {section === 'examples' && <ExamplesSection loadExample={loadExample} loadedExample={loadedExample} startBlank={startBlank} />}
      </main>
    </div>
  );
}

/* ---------- Shared bits ---------- */

function PageHead({ icon: Icon, eyebrow, title, lede, children }) {
  return (
    <header className="page-head">
      <div className="eyebrow"><Icon size={14} /> {eyebrow}</div>
      <h1>{title}</h1>
      {lede && <p className="lede">{lede}</p>}
      {children}
    </header>
  );
}

function Card({ icon: Icon, title, sub, children, right }) {
  return (
    <section className="card">
      <div className="card-head">
        <div className="card-icon"><Icon size={18} /></div>
        <div className="card-titles">
          <h2>{title}</h2>
          {sub && <div className="card-sub">{sub}</div>}
        </div>
        {right}
      </div>
      <div className="card-body">{children}</div>
    </section>
  );
}

function TextField({ label, hint, value, onChange, placeholder, area, rows = 2, type = 'text', mono }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {hint && <span className="field-hint">{hint}</span>}
      {area ? (
        <textarea className={mono ? 'mono' : ''} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} spellCheck={!mono} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete="off" />
      )}
    </label>
  );
}

function AddOwn({ onAdd, placeholder }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const commit = () => {
    const val = draft.trim();
    if (val) onAdd(val);
    setAdding(false);
    setDraft('');
  };
  return adding ? (
    <span className="chip-add">
      <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && commit()} placeholder={placeholder} />
      <button className="chip-ok" onClick={commit} aria-label="Add"><Check size={14} /></button>
      <button className="chip-ok" onClick={() => setAdding(false)} aria-label="Cancel"><X size={14} /></button>
    </span>
  ) : (
    <button className="chip dashed" onClick={() => setAdding(true)}><Plus size={14} /> Add your own</button>
  );
}

function Chips({ options, value, onChange, placeholder, custom = true }) {
  const isCustom = value !== '' && value != null && !options.includes(value);
  return (
    <div className="chip-row">
      {options.map((o) => (
        <button key={o} className={`chip ${value === o ? 'on' : ''}`} onClick={() => onChange(o)}>{o}</button>
      ))}
      {isCustom && <button className="chip on">{value}</button>}
      {custom && <AddOwn onAdd={onChange} placeholder={placeholder} />}
    </div>
  );
}

function Step({ n, icon: Icon, text }) {
  return (
    <div className="step">
      <div className="step-n">{n}</div>
      <Icon size={18} className="step-icon" />
      <div>{text}</div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className={`kpi ${accent ? 'accent' : ''}`}>
      <div className="kpi-label"><Icon size={14} /> {label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

function SevTag({ sev }) {
  return <span className={`sev s-${sev}`}>{sev}</span>;
}

function Empty({ icon, eyebrow, title, lede, go }) {
  return (
    <div className="page">
      <PageHead icon={icon} eyebrow={eyebrow} title={title} lede={lede} />
      <div className="row-btns">
        <button className="btn primary" onClick={() => go('start')}><FileCode2 size={16} /> Paste a query</button>
        <button className="btn ghost" onClick={() => go('examples')}><Layers size={16} /> See examples</button>
      </div>
    </div>
  );
}

function Notices({ loadedExample, stale, go }) {
  return (
    <>
      {loadedExample && (
        <div className="notice">
          <Info size={16} />
          <span>Worked example with a saved model reply. <button className="link" onClick={() => go('start')}>Edit the query</button> and the pattern checks rerun at once.</span>
        </div>
      )}
      {stale && (
        <div className="notice warn">
          <TriangleAlert size={16} />
          <span>The query has changed since the model read it. Pattern checks are current. <button className="link" onClick={() => go('start')}>Explain again</button> to refresh the plain English.</span>
        </div>
      )}
    </>
  );
}

// Shows the query with chosen pieces marked. Overlapping pieces keep the first.
function SqlView({ sql, marks = [], title = 'The query' }) {
  const segs = [];
  const sorted = marks.filter((x) => x.start >= 0 && x.end > x.start).sort((a, b) => a.start - b.start);
  let at = 0;
  sorted.forEach((mk) => {
    if (mk.start < at) return;
    if (mk.start > at) segs.push({ text: sql.slice(at, mk.start) });
    segs.push({ text: sql.slice(mk.start, mk.end), cls: mk.cls, label: mk.label });
    at = mk.end;
  });
  if (at < sql.length) segs.push({ text: sql.slice(at) });
  return (
    <div className="sql-card">
      <div className="sql-head"><Database size={14} /> {title}</div>
      <pre className="sql">
        {segs.map((s, i) => (s.cls ? <mark key={i} className={s.cls} data-label={s.label}>{s.text}</mark> : <span key={i}>{s.text}</span>))}
      </pre>
    </div>
  );
}

/* ---------- Paste a query ---------- */

function StartSection(p) {
  const { form, set, report } = p;
  const lines = form.query ? form.query.split('\n').length : 0;
  const hits = report.rules.length;
  return (
    <div className="page">
      <PageHead
        icon={FileCode2}
        eyebrow="Paste a query"
        title="Know what the number counts before you quote it."
        lede="Paste the SQL behind a metric someone sent you. You get it in plain words, line by line, the traps that could skew the number, and the questions to ask the person who wrote it."
      >
        <div className="steps">
          <Step n="1" icon={ScanSearch} text="Pattern checks read the query in your browser as you type" />
          <Step n="2" icon={Sparkles} text="A model explains each line and quotes the part it means" />
          <Step n="3" icon={Gauge} text="Printed rules check every quote and set the verdict" />
        </div>
        {p.loadedExample && (
          <div className="notice">
            <Info size={16} />
            <span>Showing a worked example. Edit it, <button className="link" onClick={p.startBlank}>start blank</button> or <button className="link" onClick={() => p.go('examples')}>pick another</button>.</span>
          </div>
        )}
      </PageHead>

      <div className="build-grid">
        <div className="build-form">
          <Card icon={Target} title="What the number should answer" sub="The question decides whether the query answers it">
            <TextField label="The question, in business words" value={form.question} onChange={(v) => set('question', v)} placeholder="How many customers were active in September?" />
            <div className="field">
              <span className="field-label">Where will you use it?</span>
              <Chips options={USES} value={form.use} onChange={(v) => set('use', v)} placeholder="Your use" />
              <span className="field-hint">{STRICT_USES.includes(form.use) ? 'Stricter: any medium trap means check before quoting.' : 'A medium trap means quote it with a caveat.'}</span>
            </div>
            <TextField label="Who wrote the query? (optional)" value={form.author} onChange={(v) => set('author', v)} placeholder="First name, for the message to them" />
          </Card>

          <Card icon={FileCode2} title="The query" sub="Paste it as you got it. Comments are fine">
            <div className="field">
              <span className="field-label">Which database runs it?</span>
              <Chips options={DIALECTS} value={form.dialect} onChange={(v) => set('dialect', v)} placeholder="Your database" />
            </div>
            <TextField
              label="SQL" mono area rows={14} value={form.query} onChange={(v) => set('query', v)}
              hint="Remove passwords or customer details from typed values first. Table and column names stay."
              placeholder={'SELECT\n  COUNT(*) AS active_customers\nFROM accounts a\nJOIN sessions s ON s.account_id = a.id\nWHERE ...'}
            />
            <div className="field-foot">
              <span>{lines} line{lines === 1 ? '' : 's'}</span>
              {form.query.length > MAX_QUERY && <span className="warn-text"><TriangleAlert size={13} /> Only the first {MAX_QUERY.toLocaleString('en-GB')} characters go to the model</span>}
            </div>
          </Card>
        </div>

        <div className="sticky-results">
          <div className="panel live">
            <div className="panel-title"><ScanSearch size={16} /> Pattern checks, live</div>
            <div className="panel-sub">These run in your browser with no model and no key.</div>
            {hits ? (
              <div className="live-list">
                {report.rules.slice(0, 6).map((h, i) => {
                  const Icon = TRAP_ICONS[h.type];
                  return <div key={i} className="live-hit"><Icon size={14} /> <span>{h.type}</span> <SevTag sev={h.sev} /></div>;
                })}
                {hits > 6 && <div className="live-more">and {hits - 6} more</div>}
                <button className="link small" onClick={() => p.go('traps')}>See the traps <ArrowRight size={12} /></button>
              </div>
            ) : (
              <div className="no-act"><Info size={14} /> {form.query.trim() ? 'No known patterns so far.' : 'Paste a query to start.'}</div>
            )}
          </div>
          <div className="panel">
            <div className="panel-title"><KeyRound size={16} /> Model</div>
            <div className="panel-sub">The model explains and points to lines. It does not set severity or the verdict.</div>
            <div className="chip-row">
              {PROVIDERS.map((x) => (
                <button key={x.id} className={`chip sm ${p.provider === x.id ? 'on' : ''}`} onClick={() => p.setProvider(x.id)}>
                  {x.label} <span className="chip-note">{x.note}</span>
                </button>
              ))}
            </div>
            {p.provider !== 'muse' ? (
              <div className="key-fields">
                <TextField label="Your API key" type="password" value={p.apiKey} onChange={p.setApiKey} placeholder="Sent once with this request, never stored" />
                <TextField label="Model (optional)" value={p.model} onChange={p.setModel} placeholder="Leave blank for the default" />
              </div>
            ) : (
              <div className="key-fields">
                <TextField label="Your NVIDIA key (optional)" type="password" value={p.apiKey} onChange={p.setApiKey} placeholder="Leave blank to use this site's key" />
              </div>
            )}
            <button className="btn primary wide" onClick={p.explain} disabled={p.busy}>
              {p.busy ? <><Loader2 size={16} className="spin" /> Reading your query</> : <><Wand2 size={16} /> Explain this query</>}
            </button>
            {p.error && <div className="error"><TriangleAlert size={16} /> {p.error}</div>}
          </div>
          <div className="panel">
            <div className="panel-title"><ListChecks size={16} /> What you get</div>
            <ul className="icon-list">
              <li><BookOpen size={16} /> Each line in plain words, marked on the query</li>
              <li><Rows3 size={16} /> What one row stands for, before and after counting</li>
              <li><ShieldAlert size={16} /> Traps, each tied to the exact line</li>
              <li><Gauge size={16} /> A verdict for how you plan to use the number</li>
              <li><MessageSquareText size={16} /> A message to the analyst and a caveat line</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Plain English ---------- */

function PlainSection({ form, report, go, loadedExample, stale }) {
  const [active, setActive] = useState(0);
  const m = report.model;
  const step = report.steps[active];
  const marks = report.steps.map((s, i) => ({ start: s.start, end: s.end, cls: i === active ? 'hl on' : 'hl', label: String(i + 1) }));
  const matchTone = m.match === 'Matches' ? 'ok' : m.match === 'Partly' ? 'warn' : 'bad';
  return (
    <div className="page">
      <PageHead icon={BookOpen} eyebrow={`Plain English · ${form.dialect}`} title={form.question || 'What this query does'}>
        <Notices loadedExample={loadedExample} stale={stale} go={go} />
      </PageHead>

      <section className="hero">
        <div className="hero-eyebrow">What the number is, in one sentence</div>
        <div className="hero-line">{m.summary}</div>
        <div className="hero-cards">
          <div className="hero-card">
            <div className="hero-card-label"><Rows3 size={14} /> One row is</div>
            <p>{m.grain}</p>
          </div>
          {m.match && (
            <div className="hero-card">
              <div className="hero-card-label"><Target size={14} /> Answers your question? <span className={`match t-${matchTone}`}>{m.match}</span></div>
              <p>{m.matchWhy}</p>
            </div>
          )}
        </div>
      </section>

      <div className="plain-grid">
        <div>
          <div className="section-title"><ListChecks size={18} /> Line by line</div>
          <div className="step-list">
            {report.steps.map((s, i) => (
              <button key={i} className={`pstep ${i === active ? 'on' : ''} ${s.found ? '' : 'miss'}`} onClick={() => setActive(i)}>
                <span className="pstep-n">{i + 1}</span>
                <span className="pstep-body">
                  <code className="pstep-code">{s.snippet}</code>
                  <span className="pstep-text">{s.text}</span>
                  {!s.found && <span className="q-check miss"><TriangleAlert size={12} /> Line not found in the query</span>}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="sticky-side">
          <SqlView sql={form.query} marks={marks} title={step ? `Step ${active + 1} marked` : 'The query'} />
          {m.terms.length > 0 && (
            <div className="panel">
              <div className="panel-title"><Lightbulb size={16} /> SQL words used here</div>
              <div className="terms">
                {m.terms.map((t, i) => (
                  <div key={i} className="term-row"><span className="term-word">{t.term}</span><span>{t.text}</span></div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="row-btns">
        <button className="btn primary" onClick={() => go('traps')}><ShieldAlert size={16} /> See the traps</button>
        <button className="btn ghost" onClick={() => go('ask')}><MessageSquareText size={16} /> Ask the analyst</button>
      </div>
    </div>
  );
}

/* ---------- Traps ---------- */

function TrapsSection({ form, report, go, loadedExample, stale }) {
  const [focus, setFocus] = useState(null);
  const v = VERDICTS[report.verdict];
  const VIcon = VERDICT_ICONS[report.verdict];
  const marks = report.cards.flatMap((c) => c.ranges.map(([s, e]) => ({ start: s, end: e, cls: `tm s-${c.sev} ${focus === c.type ? 'on' : focus ? 'dim' : ''}`, label: c.type })));
  const agreed = report.cards.filter((c) => c.source === 'both').length;
  const modelAll = report.modelTraps.length;
  const modelOk = modelAll - report.dropped.length;

  return (
    <div className="page">
      <PageHead icon={ShieldAlert} eyebrow={`Traps · used for ${form.use.toLowerCase()}`} title={form.question || 'What could skew the number'}>
        <Notices loadedExample={loadedExample} stale={stale} go={go} />
      </PageHead>

      <section className={`verdict t-${v.tone}`}>
        <div className="verdict-icon"><VIcon size={26} /></div>
        <div className="verdict-body">
          <div className="verdict-eyebrow">Verdict <span className="rule-id light">{report.rule}</span></div>
          <div className="verdict-label">{v.label}</div>
          <div className="verdict-line">{v.line}{report.rule === 'V3' && report.strict ? ` Because this is for ${form.use === 'A decision' ? 'a decision' : 'a board deck'}, a medium trap is enough to check first.` : ''}</div>
        </div>
        <div className="verdict-actions">
          <button className="btn light" onClick={() => go('ask')}><MessageSquareText size={16} /> Ask the analyst</button>
          {report.hasModel && <button className="btn light-ghost" onClick={() => go('plain')}><BookOpen size={16} /> Plain English</button>}
        </div>
      </section>

      <div className="kpis">
        <Kpi icon={OctagonAlert} label="High" value={report.count.High} sub="could move the number a lot" accent />
        <Kpi icon={TriangleAlert} label="Medium" value={report.count.Medium} sub="needs a caveat or a check" />
        <Kpi icon={Handshake} label="Agreed" value={`${agreed} / ${report.cards.length}`} sub="found by a pattern check and the model" />
        <Kpi icon={BadgeCheck} label="Model lines found" value={report.hasModel ? `${modelOk} / ${modelAll}` : 'No model yet'} sub={report.hasModel ? 'traps whose line is in the query (M1)' : 'pattern checks only'} />
      </div>

      <div className="trap-grid">
        <div className="trap-list">
          {report.cards.length ? report.cards.map((c) => (
            <TrapCard key={c.type} c={c} on={focus === c.type} onFocus={() => setFocus(focus === c.type ? null : c.type)} />
          )) : (
            <div className="card"><div className="no-act"><CircleCheck size={16} /> No pattern check or model trap matched this query.</div></div>
          )}
          {report.dropped.length > 0 && (
            <Card icon={Ban} title="Not counted" sub="The model raised these, but the line it quoted is not in the query (M1)">
              <div className="q-list">
                {report.dropped.map((t, i) => <div key={i} className="q"><span className="q-n">{i + 1}</span><span><b>{t.type}:</b> {t.text} <code className="inline">{t.snippet}</code></span></div>)}
              </div>
            </Card>
          )}
        </div>
        <div className="sticky-side">
          <SqlView sql={form.query} marks={marks} title={focus ? `${focus} marked` : 'Every trap marked'} />
          <div className="legend">
            <span><i className="dot s-High" /> High</span>
            <span><i className="dot s-Medium" /> Medium</span>
            <span><i className="dot s-Low" /> Low</span>
            <span className="legend-note">Click a trap to mark only its lines</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrapCard({ c, on, onFocus }) {
  const Icon = TRAP_ICONS[c.type];
  return (
    <section className={`trap s-${c.sev} ${on ? 'on' : ''}`}>
      <button className="trap-head" onClick={onFocus}>
        <div className="trap-icon"><Icon size={18} /></div>
        <div className="trap-titles">
          <div className="trap-name">{c.type} <SevTag sev={c.sev} /></div>
          <div className="trap-plain">{c.meta.plain}</div>
        </div>
        <span className={`src src-${c.source}`}>{c.source === 'both' ? <Handshake size={13} /> : c.source === 'rule' ? <ScanSearch size={13} /> : <Sparkles size={13} />} {SOURCE_LABEL[c.source]}</span>
      </button>
      <div className="evidence">
        {c.rules.map((h, i) => (
          <div key={`r${i}`} className="ev">
            <span className="rule-id">{h.id}</span>
            <div className="ev-body">
              <code className="ev-code">{h.snippet}</code>
              <p>{h.note}</p>
            </div>
          </div>
        ))}
        {c.model.map((t, i) => (
          <div key={`m${i}`} className="ev">
            <span className="rule-id model"><Sparkles size={11} /> Model</span>
            <div className="ev-body">
              <code className="ev-code">{t.snippet}</code>
              <p>{t.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="trap-actions">
        <div className="ta check"><div className="action-head"><ClipboardCheck size={15} /> Quick check</div><p>{c.meta.check}</p></div>
        <div className="ta ask"><div className="action-head"><CircleHelp size={15} /> Ask</div><p>{c.meta.ask}</p></div>
      </div>
    </section>
  );
}

/* ---------- Ask the analyst ---------- */

function AskSection({ form, report, copyText, copied, downloadReport, error }) {
  const msg = analystMessage(form, report);
  const cav = caveatLine(form, report);
  const v = VERDICTS[report.verdict];
  return (
    <div className="page">
      <PageHead
        icon={MessageSquareText}
        eyebrow="Ask the analyst"
        title="Ask about meaning, not syntax."
        lede="The person who wrote the query usually knows the answers in a minute. These questions point at the exact lines, so nobody has to guess what you mean."
      />

      <div className="brief-grid">
        <section className="brief-card">
          <div className="brief-head">
            <div className="panel-title"><MessageSquareText size={16} /> Message to {form.author || 'the analyst'}</div>
            <button className="btn primary sm" onClick={() => copyText(msg, 'msg')}>{copied === 'msg' ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy</>}</button>
          </div>
          <pre className="brief-text">{msg}</pre>
        </section>

        <div className="brief-side">
          <div className={`panel verdict-mini t-${v.tone}`}>
            <div className="panel-title"><Gauge size={16} /> {v.label}</div>
            <div className="panel-sub">{v.line}</div>
          </div>
          <div className="panel">
            <div className="panel-title"><Quote size={16} /> Caveat to keep with the number</div>
            {cav ? (
              <>
                <div className="panel-sub">For under a chart or in a footnote, if you use the number before hearing back.</div>
                <p className="caveat">{cav}</p>
                <button className="btn ghost sm" onClick={() => copyText(cav, 'cav')}>{copied === 'cav' ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy caveat</>}</button>
              </>
            ) : <div className="no-act"><Info size={14} /> No high or medium trap, so no caveat is needed.</div>}
          </div>
          <div className="panel">
            <div className="panel-title"><Download size={16} /> Full report</div>
            <div className="panel-sub">The verdict, the query, every line explained and every trap with its check, as Markdown for Notion, Confluence, Jira or an email.</div>
            <div className="row-btns tight">
              <button className="btn primary sm" onClick={() => copyText(reportMarkdown(form, report), 'rep')}>{copied === 'rep' ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy report</>}</button>
              <button className="btn ghost sm" onClick={downloadReport}><Download size={15} /> Download .md</button>
            </div>
            {error && <div className="error"><TriangleAlert size={16} /> {error}</div>}
          </div>
        </div>
      </div>

      <div className="notice warn">
        <Info size={16} />
        <span>The model's explanations can be wrong. The quoted lines are checked against your query, but what a line means is still worth confirming with the person who wrote it.</span>
      </div>
    </div>
  );
}

/* ---------- How it works ---------- */

function HowSection() {
  return (
    <div className="page">
      <PageHead
        icon={Scale}
        eyebrow="How it works"
        title="A model explains. Rules decide."
        lede="Whether a number is safe to quote should not depend on how confident a model sounds. So known traps are found by pattern checks you can read, the model only explains and points, and the verdict comes from printed rules."
      />

      <div className="how-grid">
        <Card icon={Sparkles} title="What the model does" sub="One call, tagged lines back, no JSON">
          <ul className="tick-list">
            <li><Check size={16} /> Says what number the query returns, in business words</li>
            <li><Check size={16} /> Says what one row stands for, before and after counting</li>
            <li><Check size={16} /> Says whether the query answers your question</li>
            <li><Check size={16} /> Explains each step, quoting the exact line</li>
            <li><Check size={16} /> Raises traps from a fixed list of eleven, quoting the line</li>
          </ul>
        </Card>
        <Card icon={Ban} title="What it never does" sub="These happen in your browser">
          <ul className="tick-list muted">
            <li><X size={16} /> Set how serious a trap is</li>
            <li><X size={16} /> Decide whether the number can be quoted</li>
            <li><X size={16} /> Mark its own quoted lines as found</li>
            <li><X size={16} /> Run the query or see your data</li>
          </ul>
        </Card>
      </div>

      <Card icon={Search} title="The rules" sub="Pattern checks D1 to D12 run as you type. M and V rules apply once the model replies">
        <div className="rule-list">
          {RULES.map((r) => (
            <div key={r.id} className="rule"><span className="rule-id">{r.id}</span><p>{r.text}</p></div>
          ))}
        </div>
      </Card>

      <Card icon={ShieldAlert} title="The eleven traps" sub="Each with its default severity, the check to run and the question to ask">
        <div className="trap-table">
          {Object.entries(TRAPS).map(([name, t]) => {
            const Icon = TRAP_ICONS[name];
            return (
              <div key={name} className="tt-row">
                <div className="tt-name"><Icon size={15} /> {name} <SevTag sev={t.sev} /></div>
                <p>{t.plain}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="how-grid">
        <Card icon={Info} title="What it cannot see" sub="Read this before trusting a clean result">
          <ul className="tick-list">
            <li><Info size={16} /> It reads the query text only. It never runs it or sees your tables</li>
            <li><Info size={16} /> It cannot tell whether a join is one to one without knowing the data, so D1 says possible</li>
            <li><Info size={16} /> Pattern checks cover common traps, not every way a query can be wrong</li>
            <li><Info size={16} /> Integer division depends on the database, so pick the right one</li>
          </ul>
        </Card>
        <Card icon={Briefcase} title="Why this exists" sub="The same split as Wrong Turn and Frontline Pulse in this repo">
          <p className="panel-text">Most metric mistakes I have seen were not bad maths. They were a join that repeated rows, a filter that let test accounts back in, or a share that came out as 0. The person quoting the number could not read the query, and the person who wrote it was never asked. This puts the question in plain words, next to the exact line, so it gets asked before the number reaches a slide.</p>
        </Card>
      </div>
    </div>
  );
}

/* ---------- Examples ---------- */

function ExamplesSection({ loadExample, loadedExample, startBlank }) {
  return (
    <div className="page">
      <PageHead icon={Layers} eyebrow="Examples" title="Three worked cases" lede="Each has the query and a saved model reply, so it runs without a key. Pattern checks run live on each one." />
      <div className="ex-grid">
        {EXAMPLES.map((ex) => {
          const form = { ...ex.form, query: ex.query };
          const r = buildReport({ form, parsed: parseReply(ex.text) });
          const v = VERDICTS[r.verdict];
          return (
            <button key={ex.id} className={`ex-card ${loadedExample === ex.id ? 'current' : ''}`} onClick={() => loadExample(ex)}>
              <div className="ex-top">
                <span className="team-tag"><Briefcase size={13} /> {ex.team}</span>
                {loadedExample === ex.id && <span className="ex-current">Open now</span>}
              </div>
              <div className="ex-title">{ex.title}</div>
              <div className="ex-blurb">{ex.blurb}</div>
              <div className="ex-stats">
                <span className={`ex-stat t-${v.tone}`}>{v.short}</span>
                <span className="ex-stat"><Database size={12} /> {ex.form.dialect}</span>
                <span className="ex-stat">{r.count.High} high · {r.count.Medium} medium · {r.count.Low} low</span>
              </div>
              <div className="ex-open">Open this query <ArrowRight size={15} /></div>
            </button>
          );
        })}
        <button className="ex-card blank" onClick={startBlank}>
          <div className="ex-blank-icon"><Plus size={20} /></div>
          <div className="ex-title">Start with your own</div>
          <div className="ex-blurb">Paste a query, say what it should answer and where you will use it.</div>
          <div className="ex-open">Start blank <ArrowRight size={15} /></div>
        </button>
      </div>
      <div className="notice">
        <Info size={16} />
        <span>Companies, people, tables and numbers in the examples are invented.</span>
      </div>
    </div>
  );
}

