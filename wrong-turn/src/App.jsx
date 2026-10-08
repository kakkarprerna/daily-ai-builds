import React, { useMemo, useRef, useState } from 'react';
import {
  Signpost, Pencil, ListOrdered, Crosshair, BookOpen, Layers, Sparkles, Scale, Info, Check, Plus, X, ArrowRight,
  TriangleAlert, Copy, Download, RotateCcw, KeyRound, Loader2, ScanSearch, Quote, BadgeCheck, CircleAlert, Repeat,
  Wrench, Brain, Database, ArrowLeftRight, MessageSquare, Cog, UserRound, ListTree, Inbox, Target, CircleHelp,
  Gauge, Flag, FlaskConical, Hammer, CornerDownRight, FileText, Building2, Footprints, Route, ShieldCheck
} from 'lucide-react';
import {
  STATUSES, PROBLEMS, PROBLEM_IDS, OUTCOMES, SETUPS, SCAN_RULES, CONF,
  parseTrace, scanTrace, analyse, ticketMarkdown, evalCase
} from './trace.js';
import { EXAMPLES } from './examples.js';

const SECTIONS = [
  { id: 'start', icon: Pencil, label: 'Read a trace', desc: 'Paste a run log and say what should have happened' },
  { id: 'steps', icon: ListOrdered, label: 'Step by step', desc: 'Every step, its status and the evidence behind it' },
  { id: 'turn', icon: Crosshair, label: 'The wrong turn', desc: 'Where it went wrong, the fix and a draft ticket' },
  { id: 'how', icon: BookOpen, label: 'How it works', desc: 'The scan, the checks and what the model does' },
  { id: 'examples', icon: Layers, label: 'Examples', desc: 'Three broken runs, no key needed' }
];

const KIND_ICONS = {
  'User message': UserRound, Plan: ListTree, 'Model reasoning': Brain, 'Tool call': Wrench, 'Tool result': Inbox,
  Retrieval: Database, Handoff: ArrowLeftRight, Reply: MessageSquare, System: Cog
};

const PROVIDERS = [
  { id: 'muse', label: 'Muse Glimmer', note: 'Free, on this site' },
  { id: 'anthropic', label: 'Anthropic', note: 'Your key' },
  { id: 'openai', label: 'OpenAI', note: 'Your key' },
  { id: 'gemini', label: 'Gemini', note: 'Your key' }
];

const MAX_TRACE = 24000;
const BLANK = { name: '', goal: '', outcome: OUTCOMES[0], setup: SETUPS[0], trace: '' };
const slug = (s) => (s || 'agent-run').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const statusClass = (s) => (s === 'Fine' ? 'fine' : s === 'Failed' ? 'failed' : 'suspect');

export default function App() {
  const first = EXAMPLES[0];
  const firstParsed = parseTrace(first.text);
  const [section, setSection] = useState('turn');
  const [form, setForm] = useState({ ...first.form, trace: first.trace });
  const [loadedExample, setLoadedExample] = useState(first.id);
  const [modelText, setModelText] = useState(first.text);
  const [steps, setSteps] = useState(firstParsed.steps);
  const [selected, setSelected] = useState(null);
  const [provider, setProvider] = useState('muse');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const mainRef = useRef(null);

  const parsed = useMemo(() => parseTrace(modelText), [modelText]);
  const a = useMemo(() => analyse(steps, parsed, form.trace), [steps, parsed, form.trace]);
  const edits = useMemo(() => {
    let n = 0;
    steps.forEach((s, i) => {
      const o = parsed.steps[i];
      if (o && (o.status !== s.status || o.problem !== s.problem)) n += 1;
    });
    return n;
  }, [steps, parsed]);

  const go = (id) => {
    setSection(id);
    if (mainRef.current) mainRef.current.scrollTo({ top: 0 });
  };
  const set = (k, v) => {
    setLoadedExample(null);
    setForm((f) => ({ ...f, [k]: v }));
  };
  const setStep = (id, k, v) => setSteps((ss) => ss.map((s) => (s.id === id ? { ...s, [k]: v } : s)));
  const resetSteps = () => setSteps(parsed.steps);

  const loadExample = (ex) => {
    setForm({ ...ex.form, trace: ex.trace });
    setLoadedExample(ex.id);
    setModelText(ex.text);
    setSteps(parseTrace(ex.text).steps);
    setSelected(null);
    setError('');
    go('turn');
  };
  const startBlank = () => {
    setForm(BLANK);
    setLoadedExample(null);
    setModelText('');
    setSteps([]);
    setSelected(null);
    setError('');
    go('start');
  };

  const runRead = async () => {
    setError('');
    const lines = form.trace.split(/\r?\n/).filter((l) => l.trim()).length;
    if (lines < 4) {
      setError('Paste a trace of at least four lines: what the user asked, what the agent did and how it ended.');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey, model, goal: form.goal, outcome: form.outcome, setup: form.setup, trace: form.trace.slice(0, MAX_TRACE) })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
      const p = parseTrace(data.text);
      if (p.steps.length < 2) throw new Error('The model replied, but not in the expected format. Try again or switch provider.');
      setModelText(data.text);
      setSteps(p.steps);
      setSelected(null);
      go('steps');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const ticket = () => ticketMarkdown(form, parsed, a);
  const copyTicket = async () => {
    try {
      await navigator.clipboard.writeText(ticket());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('Copy failed in this browser. Use download instead.');
    }
  };
  const downloadTicket = () => {
    const blob = new Blob([ticket()], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${slug(form.name)}-wrong-turn.md`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const openStep = (id) => {
    setSelected(id);
    go('steps');
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Signpost size={20} /></div>
          <div>
            <div className="brand-name">Wrong Turn</div>
            <div className="brand-sub">Find where an AI agent went wrong</div>
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
        {a.rows.length > 0 && (
          <div className="side-verdict">
            <div className="side-verdict-label">Current run</div>
            <div className="side-name">{form.name || 'Untitled run'}</div>
            <RouteStrip rows={a.rows} root={a.root} dark />
            {a.root ? (
              <div className="side-verdict-line"><b>Step {a.root.n}:</b> {a.root.problem}<br />{CONF[a.conf]} confidence</div>
            ) : (
              <div className="side-verdict-line">No wrong turn flagged</div>
            )}
          </div>
        )}
        <div className="side-foot">A daily AI build by Prerna Kakkar</div>
      </aside>

      <main className="main" ref={mainRef}>
        {section === 'start' && (
          <StartSection
            form={form} set={set} loadedExample={loadedExample} startBlank={startBlank} go={go}
            provider={provider} setProvider={setProvider} apiKey={apiKey} setApiKey={setApiKey}
            model={model} setModel={setModel} busy={busy} error={error} runRead={runRead}
          />
        )}
        {section === 'steps' && (
          <StepsSection
            form={form} a={a} parsed={parsed} selected={selected} setSelected={setSelected} setStep={setStep}
            edits={edits} resetSteps={resetSteps} go={go} loadedExample={loadedExample}
          />
        )}
        {section === 'turn' && (
          <TurnSection form={form} a={a} parsed={parsed} go={go} openStep={openStep} copyTicket={copyTicket} copied={copied} downloadTicket={downloadTicket} error={error} loadedExample={loadedExample} />
        )}
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

function AddOwn({ onAdd, placeholder, label = 'Add your own' }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const commit = () => {
    const v = draft.trim();
    if (v) onAdd(v);
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
    <button className="chip dashed" onClick={() => setAdding(true)}><Plus size={14} /> {label}</button>
  );
}

function Chips({ options, value, onChange, placeholder, small }) {
  const isCustom = value && !options.includes(value);
  return (
    <div className="chip-row">
      {options.map((o) => (
        <button key={o} className={`chip ${small ? 'sm' : ''} ${value === o ? 'on' : ''}`} onClick={() => onChange(o)}>{o}</button>
      ))}
      {isCustom && <button className={`chip ${small ? 'sm' : ''} on`}>{value}</button>}
      <AddOwn onAdd={onChange} placeholder={placeholder} label={small ? 'Own' : 'Add your own'} />
    </div>
  );
}

function StatusPill({ status }) {
  const c = statusClass(status);
  const Icon = c === 'fine' ? Check : c === 'failed' ? X : CircleAlert;
  return <span className={`status-pill st-${c}`}><Icon size={12} /> {status}</span>;
}

function ConfPill({ conf }) {
  return (
    <span className={`conf-pill c-${conf}`}>
      <span className="conf-bars">{[1, 2, 3].map((i) => <span key={i} className={i <= conf ? 'on' : ''} />)}</span>
      {CONF[conf]} confidence
    </span>
  );
}

function RouteStrip({ rows, root, dark, onPick }) {
  return (
    <div className={`route-strip ${dark ? 'dark' : ''}`} aria-label="Steps in the run">
      {rows.map((r) => (
        <button
          key={r.id}
          className={`rs-dot st-${statusClass(r.status)} ${root && root.n === r.n ? 'root' : ''}`}
          title={`Step ${r.n}: ${r.kind}, ${r.status}${r.problem !== 'None' ? `, ${r.problem}` : ''}`}
          onClick={onPick ? () => onPick(r.id) : undefined}
          tabIndex={onPick ? 0 : -1}
        >
          {root && root.n === r.n ? <Signpost size={11} /> : r.n}
        </button>
      ))}
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

function Kpi({ icon: Icon, label, value, sub }) {
  return (
    <div className="kpi">
      <div className="kpi-label"><Icon size={14} /> {label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

function Empty({ icon, eyebrow, go }) {
  return (
    <div className="page">
      <PageHead icon={icon} eyebrow={eyebrow} title="No trace read yet" lede="Paste a trace and read it first, or open one of the worked examples." />
      <div className="row-btns">
        <button className="btn primary" onClick={() => go('start')}><Pencil size={16} /> Read a trace</button>
        <button className="btn ghost" onClick={() => go('examples')}><Layers size={16} /> See examples</button>
      </div>
    </div>
  );
}

/* ---------- Read a trace ---------- */

function StartSection(p) {
  const { form, set } = p;
  const scan = useMemo(() => scanTrace(form.trace), [form.trace]);
  const tooLong = form.trace.length > MAX_TRACE;
  return (
    <div className="page">
      <PageHead
        icon={Pencil}
        eyebrow="Read a trace"
        title="Where did the agent go wrong?"
        lede="Paste the log of one run that went wrong. You get every step laid out, the first step that went wrong, how sure that call is, who usually fixes that kind of problem and a ticket ready to send."
      >
        <div className="steps">
          <Step n="1" icon={ScanSearch} text="A rule-based scan flags errors and loops as you paste" />
          <Step n="2" icon={Sparkles} text="A model splits the run into steps and suggests what went wrong at each" />
          <Step n="3" icon={Scale} text="Printed rules pick the wrong turn and check every quote against your trace" />
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
          <Card icon={Target} title="What should have happened" sub="One or two sentences. The steps are judged against this">
            <TextField label="Name for this run" value={form.name} onChange={(v) => set('name', v)} placeholder="Refund confirmed without a refund" />
            <TextField
              label="What the agent was supposed to do"
              value={form.goal} onChange={(v) => set('goal', v)} area rows={2}
              placeholder="Look up the order, check the return arrived, then refund or explain why not."
            />
          </Card>

          <Card icon={FileText} title="The trace" sub="Any format: JSON, a tracing tool export, console output or plain text">
            <TextField
              label="Paste the run, start to finish"
              hint="Keep the user's message, every tool call and result, and the final reply. Remove personal data first."
              value={form.trace} onChange={(v) => set('trace', v)} area rows={12} mono
              placeholder={'[user] ...\n[tool_call] get_order(order_id="...")\n[tool_result] {...}\n[reply] ...'}
            />
            {tooLong && <div className="notice warn"><TriangleAlert size={16} /> Only the first {MAX_TRACE.toLocaleString('en-GB')} characters go to the model. The scan and quote check still use all of it.</div>}
          </Card>

          <div className="two-cards">
            <Card icon={Flag} title="What went wrong" sub="As the user or tester saw it">
              <Chips options={OUTCOMES} value={form.outcome} onChange={(v) => set('outcome', v)} placeholder="Your own" />
            </Card>
            <Card icon={Route} title="Setup" sub="Helps the model name the actors">
              <Chips options={SETUPS} value={form.setup} onChange={(v) => set('setup', v)} placeholder="Your own" />
            </Card>
          </div>

          <Card icon={KeyRound} title="Model for the step list" sub="It splits and describes. It never picks the wrong turn">
            <div className="chip-row">
              {PROVIDERS.map((pr) => (
                <button key={pr.id} className={`chip ${p.provider === pr.id ? 'on' : ''}`} onClick={() => p.setProvider(pr.id)}>
                  {pr.label} <span className="chip-note">{pr.note}</span>
                </button>
              ))}
            </div>
            {p.provider !== 'muse' && (
              <>
                <TextField label="Your API key" value={p.apiKey} onChange={p.setApiKey} placeholder="Used for this one request, never stored" type="password" />
                <TextField label="Model id (optional)" value={p.model} onChange={p.setModel} placeholder="Leave blank for the default" />
              </>
            )}
            <button className="btn primary wide" onClick={p.runRead} disabled={p.busy}>
              {p.busy ? <Loader2 size={18} className="spin" /> : <Footprints size={18} />}
              {p.busy ? 'Reading the trace' : 'Find the wrong turn'}
            </button>
            {p.error && <div className="error"><TriangleAlert size={16} /> {p.error}</div>}
            <div className="field-hint">Nothing you paste is stored. Traces often hold customer data, so strip names, emails and ids you do not need.</div>
          </Card>
        </div>

        <div className="build-results">
          <div className="sticky-results">
            <div className="panel">
              <div className="panel-title"><ScanSearch size={16} /> The scan, before any model</div>
              <div className="panel-sub">Fixed patterns run on your trace as you paste. No key, no model.</div>
              <div className="scan-kpis">
                <div><b>{scan.lineCount}</b><span>lines</span></div>
                <div className={scan.hits.length ? 'hot' : ''}><b>{scan.hits.length}</b><span>error signals</span></div>
                <div className={scan.repeats.length ? 'hot' : ''}><b>{scan.repeats.length}</b><span>repeated calls</span></div>
              </div>
              {scan.hits.length > 0 && (
                <div className="scan-list">
                  {scan.hits.slice(0, 6).map((h) => (
                    <div key={h.line} className="scan-hit"><span className="ln">L{h.line}</span><code>{h.text.slice(0, 70)}{h.text.length > 70 ? '…' : ''}</code></div>
                  ))}
                  {scan.hits.length > 6 && <div className="panel-sub">and {scan.hits.length - 6} more</div>}
                </div>
              )}
              {scan.repeats.map((r) => (
                <div key={r.key} className="scan-hit loop"><Repeat size={14} /><span>{r.count} identical calls, lines {r.lines.join(', ')}</span></div>
              ))}
              {form.trace.trim() && !scan.hits.length && !scan.repeats.length && (
                <div className="ok-line"><Check size={16} /> Nothing obvious. Quiet failures like a dropped handoff need the step read.</div>
              )}
            </div>
            <div className="panel">
              <div className="panel-title"><Footprints size={16} /> What you get back</div>
              <ul className="icon-list">
                <li><ListOrdered size={16} /><span>Every step with a status and a quote from your trace</span></li>
                <li><Crosshair size={16} /><span>The first step that went wrong, and how sure that is</span></li>
                <li><Hammer size={16} /><span>The layer to fix, who usually fixes it and how to confirm</span></li>
                <li><FlaskConical size={16} /><span>An eval case so it cannot quietly come back</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Step by step ---------- */

function StepsSection({ form, a, parsed, selected, setSelected, setStep, edits, resetSteps, go, loadedExample }) {
  const detailRef = useRef(null);
  if (!a.rows.length) return <Empty icon={ListOrdered} eyebrow="Step by step" go={go} />;
  const sel = a.rows.find((r) => r.id === selected) || a.root || a.rows[0];
  const pick = (id) => {
    setSelected(id);
    setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
  };
  const lines = form.trace.split(/\r?\n/);
  const into = parsed.links.filter((l) => l.to === sel.n);
  const outOf = parsed.links.filter((l) => l.from === sel.n);

  return (
    <div className="page wide">
      <PageHead icon={ListOrdered} eyebrow="Step by step" title={form.name || 'Untitled run'} lede={parsed.summary}>
        {loadedExample && (
          <div className="notice"><Info size={16} /> Worked example. Click any step to see its lines, then change its status or problem and watch the wrong turn move.</div>
        )}
        {edits > 0 && (
          <div className="notice warn">
            <Pencil size={16} /> You changed {edits} {edits === 1 ? 'step' : 'steps'} from the model's suggestion.
            <button className="link" onClick={resetSteps}><RotateCcw size={13} /> Reset</button>
          </div>
        )}
      </PageHead>

      <div className="kpis four">
        <Kpi icon={Crosshair} label="Wrong turn" value={a.root ? `Step ${a.root.n}` : 'None'} sub={a.root ? a.root.problem : 'No step flagged'} />
        <Kpi icon={Gauge} label="Confidence" value={a.root ? CONF[a.conf] : 'n/a'} sub="From printed rules" />
        <Kpi icon={TriangleAlert} label="Steps that went wrong" value={a.candidates.length} sub={`of ${a.rows.length} steps`} />
        <Kpi icon={ScanSearch} label="Unexplained signals" value={a.unaccounted} sub="Scan hits no flagged step covers" />
      </div>

      <section className="grid-card">
        <div className="timeline-head">
          <div className="panel-title"><Footprints size={16} /> The run</div>
          <div className="legend">
            <span><span className="lg-dot st-fine" /> Fine</span>
            <span><span className="lg-dot st-suspect" /> Suspect</span>
            <span><span className="lg-dot st-failed" /> Failed</span>
            <span><Signpost size={13} /> Wrong turn</span>
          </div>
        </div>
        <div className="run">
          {a.rows.map((r) => {
            const Icon = KIND_ICONS[r.kind] || Cog;
            const isRoot = a.root && a.root.n === r.n;
            const after = a.root && r.candidate && r.n > a.root.n;
            const signals = r.scanHits.length + r.repeatHits.length;
            return (
              <button key={r.id} className={`run-step st-${statusClass(r.status)} ${isRoot ? 'root' : ''} ${sel.id === r.id ? 'sel' : ''}`} onClick={() => pick(r.id)}>
                <span className="run-node"><Icon size={15} /></span>
                <span className="run-main">
                  <span className="run-top">
                    <span className="run-n">Step {r.n}</span>
                    <span className="run-kind">{r.kind} · {r.actor}</span>
                    {isRoot && <span className="turn-tag"><Signpost size={12} /> Wrong turn</span>}
                    {after && <span className="after-tag"><CornerDownRight size={12} /> Followed</span>}
                  </span>
                  <span className="run-what">{r.what}</span>
                  <span className="run-meta">
                    <StatusPill status={r.status} />
                    {r.problem !== 'None' && <span className="problem-pill">{r.problem}</span>}
                    {signals > 0 && <span className="sig-pill"><ScanSearch size={12} /> {signals} scan {signals === 1 ? 'hit' : 'hits'}</span>}
                    {!r.verified && r.evidence && <span className="sig-pill warn"><Quote size={12} /> Quote not found</span>}
                  </span>
                </span>
                <span className="run-lines">L{r.from}{r.to > r.from ? `-${r.to}` : ''}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div ref={detailRef} className="detail-grid">
        <section className="card detail">
          <div className="detail-top">
            <div>
              <div className="detail-n">Step {sel.n} of {a.rows.length} · {sel.kind} · {sel.actor}</div>
              <h2 className="detail-name">{sel.what}</h2>
            </div>
            <StatusPill status={sel.status} />
          </div>

          <div className="trace-box">
            <div className="trace-label"><FileText size={13} /> Your trace, lines {sel.from} to {sel.to}</div>
            <pre>
              {lines.slice(Math.max(0, sel.from - 1), sel.to).map((l, i) => {
                const n = sel.from + i;
                const hit = sel.scanHits.some((h) => h.line === n) || sel.repeatHits.some((h) => h.lines.includes(n));
                return <div key={n} className={hit ? 'hit' : ''}><span className="ln">{n}</span>{l || ' '}</div>;
              })}
            </pre>
          </div>

          <div className={`evidence ${sel.verified ? 'ok' : 'bad'}`}>
            {sel.verified ? <BadgeCheck size={16} /> : <CircleAlert size={16} />}
            <div>
              <div className="ev-label">{sel.verified ? 'Quote found in your trace' : 'Quote not found word for word'}</div>
              <code>{sel.evidence || 'No quote given'}</code>
            </div>
          </div>

          <div className="fact-row">
            <div className="field-label">Status</div>
            <div className="field-hint">Fine, or Suspect when it looks wrong, or Failed when the trace proves it</div>
            <Chips options={STATUSES} value={sel.status} onChange={(v) => setStep(sel.id, 'status', v)} placeholder="Your own" small />
          </div>
          <div className="fact-row">
            <div className="field-label">Problem</div>
            <div className="field-hint">A step counts as gone wrong when it is not Fine and has a problem</div>
            <Chips options={PROBLEM_IDS} value={sel.problem} onChange={(v) => setStep(sel.id, 'problem', v)} placeholder="Your own" small />
          </div>
        </section>

        <div className="detail-side">
          {sel.info && (
            <section className="panel">
              <div className="panel-title"><Hammer size={16} /> {sel.problem}</div>
              <p className="panel-text">{sel.info.plain}</p>
              <div className="layer-row"><span className="layer-tag">{sel.info.layer}</span>{sel.info.symptom && <span className="sym-tag">Often a symptom</span>}</div>
            </section>
          )}
          {parsed.should[sel.n] && (
            <section className="panel">
              <div className="panel-title"><Target size={16} /> What should have happened</div>
              <blockquote className="say">{parsed.should[sel.n]}</blockquote>
            </section>
          )}
          {(into.length > 0 || outOf.length > 0) && (
            <section className="panel">
              <div className="panel-title"><Route size={16} /> Knock-on effects</div>
              <div className="link-list">
                {into.map((l, i) => (
                  <button key={`i${i}`} className="link-row" onClick={() => pick(`s${l.from}`)}>
                    <span className="link-tag in">From step {l.from}</span><span>{l.how}</span>
                  </button>
                ))}
                {outOf.map((l, i) => (
                  <button key={`o${i}`} className="link-row" onClick={() => pick(`s${l.to}`)}>
                    <span className="link-tag out">Led to step {l.to}</span><span>{l.how}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
          {(sel.scanHits.length > 0 || sel.repeatHits.length > 0) && (
            <section className="panel">
              <div className="panel-title"><ScanSearch size={16} /> Scan hits in this step</div>
              <div className="scan-list">
                {sel.scanHits.map((h) => (
                  <div key={h.line} className="scan-hit"><span className="ln">L{h.line}</span><span>{h.rules.join(', ')}</span></div>
                ))}
                {sel.repeatHits.map((h) => (
                  <div key={h.key} className="scan-hit loop"><Repeat size={14} /><span>S3, {h.count} identical calls</span></div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- The wrong turn ---------- */

function TurnSection({ form, a, parsed, go, openStep, copyTicket, copied, downloadTicket, error, loadedExample }) {
  if (!a.rows.length) return <Empty icon={Crosshair} eyebrow="The wrong turn" go={go} />;
  const r = a.root;
  const openSignals = a.signals.filter((s) => !s.accounted);
  return (
    <div className="page">
      <PageHead
        icon={Crosshair}
        eyebrow="The wrong turn"
        title={r ? `It went wrong at step ${r.n}` : 'No step flagged as wrong'}
        lede={r ? 'The first step that went wrong explains the rest unless the checks below say otherwise. Fix it there, not where the user noticed it.' : 'Every step is marked Fine. If the run still failed, open the steps and mark the one that looks wrong, or check the scan signals below.'}
      >
        {loadedExample && <div className="notice"><Info size={16} /> Worked example, loaded from a saved model reply. Change any step on the Step by step page and this page follows.</div>}
        <div className="row-btns">
          <button className="btn primary" onClick={copyTicket}>{copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy the ticket'}</button>
          <button className="btn ghost" onClick={downloadTicket}><Download size={16} /> Download as Markdown</button>
          <button className="btn ghost" onClick={() => go('steps')}><ListOrdered size={16} /> See every step</button>
        </div>
        {error && <div className="error"><TriangleAlert size={16} /> {error}</div>}
      </PageHead>

      <section className="hero">
        <div className="hero-strip">
          <RouteStrip rows={a.rows} root={r} onPick={openStep} />
        </div>
        {r ? (
          <div className="hero-body">
            <div className="hero-sign"><Signpost size={30} /></div>
            <div className="hero-main">
              <div className="hero-eyebrow">Step {r.n} · {r.kind} · {r.actor}</div>
              <div className="hero-problem">{r.problem}</div>
              <div className="hero-what">{r.what}</div>
              <div className="hero-pills">
                <ConfPill conf={a.conf} />
                <span className={`reach-pill ${a.reached ? 'yes' : 'no'}`}>{a.reached ? <TriangleAlert size={13} /> : <ShieldCheck size={13} />} {a.reached ? 'Reached the user' : 'Caught before the user'}</span>
                <span className="reach-pill neutral"><CornerDownRight size={13} /> {a.after.length} later {a.after.length === 1 ? 'step' : 'steps'} followed from it</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="hero-body">
            <div className="hero-sign muted"><Check size={30} /></div>
            <div className="hero-main">
              <div className="hero-problem">Nothing flagged</div>
              <div className="hero-what">{a.unaccounted ? `${a.unaccounted} scan signals have no flagged step. Start with those.` : 'The scan found nothing either. The problem may sit outside this trace, such as the data a tool returned.'}</div>
            </div>
          </div>
        )}
      </section>

      {r && (
        <>
          <div className="case-two">
            <Card icon={Quote} title="The evidence" sub={`Trace line ${r.from}${r.to > r.from ? ` to ${r.to}` : ''}`}>
              <div className={`evidence ${r.verified ? 'ok' : 'bad'}`}>
                {r.verified ? <BadgeCheck size={16} /> : <CircleAlert size={16} />}
                <div>
                  <div className="ev-label">{r.verified ? 'Found word for word in your trace' : 'Not found word for word. Check it'}</div>
                  <code>{r.evidence || 'No quote given'}</code>
                </div>
              </div>
              {parsed.should[r.n] && (
                <div className="should"><Target size={15} /><div><b>Should have:</b> {parsed.should[r.n]}</div></div>
              )}
            </Card>
            <Card icon={Wrench} title="Where the fix goes" sub="The layer, and who usually owns it">
              <div className="layer-big">{r.info ? r.info.layer : 'Unclassified'}</div>
              <div className="owner-line"><UserRound size={15} /> {r.info ? r.info.owner : 'A custom problem has no owner on file. Decide who owns it.'}</div>
              {r.info && <p className="panel-text">{r.info.plain}</p>}
            </Card>
          </div>

          <div className="action-grid">
            <div className="action a-fix">
              <div className="action-head"><Hammer size={18} /> The fix</div>
              <p>{r.info ? r.info.fix : 'No playbook for a custom problem. Write the fix into the ticket.'}</p>
            </div>
            <div className="action a-confirm">
              <div className="action-head"><BadgeCheck size={18} /> Confirm the cause first</div>
              <p>{r.info ? r.info.confirm : 'Re-run the same input and watch this step.'}</p>
            </div>
            <div className="action a-eval">
              <div className="action-head"><FlaskConical size={18} /> Eval case to add</div>
              <p>{evalCase(form, parsed, r)}</p>
            </div>
          </div>

          <div className="case-two">
            <Card icon={Gauge} title="Why this confidence" sub="Starts from status and the quote check, then drops for each warning">
              <ul className="check-list-plain">
                <li><span className="rule-id">W1</span><span>The first step that is not Fine and has a problem is the wrong turn. Here that is step {r.n}.</span></li>
                {a.notes.map((n) => (
                  <li key={n.id} className={n.good ? 'good' : n.id === 'C1' ? 'bad' : 'warn'}>
                    <span className="rule-id">{n.id}</span><span>{n.text}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card icon={CornerDownRight} title="What followed from it" sub="Later steps that also went wrong. Fix the wrong turn first, then check these still happen">
              {a.after.length ? (
                <div className="follow-list">
                  {a.after.map((s) => (
                    <button key={s.id} className="follow" onClick={() => openStep(s.id)}>
                      <span className={`follow-n st-${statusClass(s.status)}`}>{s.n}</span>
                      <div><b>{s.problem}</b><div className="follow-what">{s.what}</div></div>
                      <ArrowRight size={15} className="meet-go" />
                    </button>
                  ))}
                </div>
              ) : <div className="ok-line"><Check size={16} /> Nothing else went wrong after it.</div>}
            </Card>
          </div>
        </>
      )}

      <div className="case-two">
        <Card icon={ScanSearch} title="Scan signals" sub="Every error line and loop the rules found, and which step explains it">
          {a.signals.length || a.loops.length ? (
            <div className="scan-list">
              {a.signals.map((s) => (
                <div key={s.line} className={`scan-hit ${s.accounted ? '' : 'open'}`}>
                  <span className="ln">L{s.line}</span>
                  <span>{s.accounted ? <>Explained by step {s.by}</> : <b>Not explained by any flagged step</b>}</span>
                </div>
              ))}
              {a.loops.map((l) => (
                <div key={l.key} className={`scan-hit loop ${l.accounted ? '' : 'open'}`}>
                  <Repeat size={14} /><span>{l.count} identical calls in steps {l.steps.join(', ')}{l.accounted ? ', flagged' : ', not flagged as a loop'}</span>
                </div>
              ))}
            </div>
          ) : <div className="panel-sub">The scan found no error lines or loops. Quiet failures, like a constraint left out of a handoff, only show up when the steps are read.</div>}
          {openSignals.length > 0 && <div className="notice warn"><TriangleAlert size={16} /> Open signals are worth a look before you send the ticket.</div>}
        </Card>
        <Card icon={CircleHelp} title="Questions the trace cannot answer" sub="An answer here can change a step, and so the wrong turn">
          <div className="q-list">
            {parsed.questions.length ? parsed.questions.map((q, i) => (
              <div key={i} className="q"><span className="q-n">{i + 1}</span> {q}</div>
            )) : <div className="panel-sub">No open questions listed.</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------- How it works ---------- */

function HowSection() {
  return (
    <div className="page">
      <PageHead
        icon={BookOpen}
        eyebrow="How it works"
        title="A model reads. Rules decide."
        lede="Which step gets blamed should not depend on the wording of a prompt. The model only splits the run into steps and describes each one. Printed rules pick the wrong turn, check the evidence and set the confidence."
      />
      <div className="how-grid">
        <Card icon={Sparkles} title="What the model does" sub="Muse Glimmer by default, or your own key">
          <ul className="tick-list">
            <li><Check size={16} /> Splits the trace into 4 to 14 steps and gives each its line range</li>
            <li><Check size={16} /> Suggests a status and a problem per step from fixed word lists</li>
            <li><Check size={16} /> Copies a short quote from the trace as evidence for each step</li>
            <li className="no"><X size={16} /> Never names the root cause, the confidence or the fix</li>
          </ul>
        </Card>
        <Card icon={Scale} title="What the rules do" sub="Same steps in, same answer out">
          <ul className="tick-list">
            <li><Check size={16} /> Scan the raw trace for errors and loops, with no model</li>
            <li><Check size={16} /> Check every quote really appears in your trace</li>
            <li><Check size={16} /> Pick the first step that went wrong and set confidence</li>
            <li><Check size={16} /> Re-run instantly when you change a step</li>
          </ul>
        </Card>
      </div>

      <Card icon={ScanSearch} title="The scan" sub="Runs in your browser on the raw text, before and after the model">
        <div className="band-list">
          {SCAN_RULES.map((s) => <div key={s.id} className="rule"><span className="rule-id">{s.id}</span><p><b>{s.label}.</b> {s.text}</p></div>)}
          <div className="rule"><span className="rule-id">C3</span><p><b>Explained or open.</b> A signal is explained when its own step is flagged, or a later flagged step mishandled it (error ignored, result misread, a loop, a failed tool or bad arguments). Open signals before the wrong turn lower confidence.</p></div>
        </div>
      </Card>

      <div className="how-grid">
        <Card icon={Crosshair} title="Picking the wrong turn" sub="One rule, then four checks">
          <div className="band-list">
            <div className="rule"><span className="rule-id">W1</span><p>The first step that is not Fine and has a problem is the wrong turn. Later ones are listed as what followed.</p></div>
            <div className="rule"><span className="rule-id">C1</span><p>The step's quote is searched for in your trace. Found word for word or not.</p></div>
            <div className="rule"><span className="rule-id">C2</span><p>Made up a fact, repeated itself and stopped too early usually follow an earlier mistake. One level lower.</p></div>
            <div className="rule"><span className="rule-id">C3</span><p>An open scan signal before the wrong turn. One level lower.</p></div>
            <div className="rule"><span className="rule-id">C4</span><p>A problem typed by hand has no playbook. One level lower.</p></div>
          </div>
        </Card>
        <Card icon={Gauge} title="Confidence" sub="Start here, then apply C2 to C4. Never below Low">
          <div className="band-list">
            <div className="band"><ConfPill conf={3} /><p>Failed, and the quote is in the trace</p></div>
            <div className="band"><ConfPill conf={2} /><p>Failed without a found quote, or Suspect with one</p></div>
            <div className="band"><ConfPill conf={1} /><p>Suspect, and the quote is not in the trace</p></div>
          </div>
        </Card>
      </div>

      <Card icon={Hammer} title="Twelve problems, each with a layer and a fix" sub="The playbook behind the wrong turn page">
        <div className="pb-grid">
          {PROBLEMS.map((p) => (
            <div key={p.id} className="pb">
              <div className="pb-top"><b>{p.id}</b>{p.symptom && <span className="sym-tag">Often a symptom</span>}</div>
              <div className="layer-tag">{p.layer}</div>
              <p>{p.plain}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="how-grid">
        <Card icon={FileText} title="Where this comes from" sub="So you know how far to trust it">
          <ul className="tick-list">
            <li><Info size={16} /> Reading a run as a list of steps follows how agent tracing tools lay out a trace: each model call, tool call and handoff as its own span.</li>
            <li><Info size={16} /> The twelve problems, their layers and the fixes are my own working list from running conversational and voice agents in production, where the place a customer noticed a failure was rarely where it started. They are not an industry standard.</li>
            <li><Info size={16} /> Step splits, quotes and links are the model's suggestions. The quote check catches invented evidence, not wrong judgement.</li>
          </ul>
        </Card>
        <Card icon={TriangleAlert} title="What it cannot do" sub="Limits worth knowing">
          <ul className="tick-list muted">
            <li><X size={16} /> It only sees what the trace logged. If the prompt or retrieved text is missing from the log, so is the cause.</li>
            <li><X size={16} /> One run is one example. Check whether the same wrong turn shows up across runs before rewriting anything.</li>
            <li><X size={16} /> The owner line is the usual owner, not your org chart.</li>
            <li><X size={16} /> The scan matches words. It will flag a user who writes "error" and miss an error worded politely.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

/* ---------- Examples ---------- */

function ExamplesSection({ loadExample, loadedExample, startBlank }) {
  return (
    <div className="page">
      <PageHead
        icon={Layers}
        eyebrow="Examples"
        title="Three broken runs, three different wrong turns"
        lede="Each loads a saved trace and a saved model reply, then runs through the same rules as a live read. In every one, the place the user noticed the problem is not where it started."
      />
      <div className="ex-grid">
        {EXAMPLES.map((ex) => {
          const p = parseTrace(ex.text);
          const o = analyse(p.steps, p, ex.trace);
          return (
            <button key={ex.id} className={`ex-card ${loadedExample === ex.id ? 'current' : ''}`} onClick={() => loadExample(ex)}>
              <div className="ex-top"><span className="team-tag"><Building2 size={13} /> {ex.team}</span>{loadedExample === ex.id && <span className="ex-current">Loaded</span>}</div>
              <div className="ex-title">{ex.title}</div>
              <div className="ex-blurb">{ex.blurb}</div>
              <RouteStrip rows={o.rows} root={o.root} />
              <div className="ex-stats">
                <span className="turn-tag"><Signpost size={12} /> Step {o.root?.n}: {o.root?.problem}</span>
              </div>
              <div className="ex-stats"><ConfPill conf={o.conf} /></div>
              <div className="ex-open">Open this run <ArrowRight size={14} /></div>
            </button>
          );
        })}
        <button className="ex-card blank" onClick={startBlank}>
          <div className="ex-blank-icon"><Plus size={22} /></div>
          <div className="ex-title">Read your own</div>
          <div className="ex-blurb">Paste a run from your own agent. Reading takes under a minute on the free model.</div>
        </button>
      </div>
    </div>
  );
}

