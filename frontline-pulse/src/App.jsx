import React, { useMemo, useRef, useState } from 'react';
import {
  Activity, Radio, Route, Send, BookOpen, Layers, Pencil, Sparkles, BadgeCheck, Scale, Info, TriangleAlert, KeyRound,
  Loader2, ListChecks, Users, Euro, Hourglass, Wrench, Hammer, GraduationCap, Workflow, Megaphone, Tag, Briefcase,
  Settings, Headset, TrendingUp, Quote, ArrowRight, Check, X, Plus, Copy, Download, RotateCcw, Square, SquareCheck,
  CircleHelp, Flag, Eye, ArrowUpRight, Archive, Zap, FileText, Building2, MessageSquareQuote, CalendarClock, Ban,
  Ruler, Filter, Phone, Store, Target
} from 'lucide-react';
import {
  SOURCES, PERIODS, STAGES, SEVERITIES, FIXES, WORKAROUNDS, OWNERS, ROUTE, LANES, RULES, DEFAULT_HOURS, STAGE_PTS,
  SEVERITY_PTS, parsePulse, buildPulse, eur, fieldMessage, digestMarkdown
} from './pulse.js';
import { EXAMPLES } from './examples.js';

const SECTIONS = [
  { id: 'start', icon: Pencil, label: 'Paste notes', desc: 'Sales calls, tickets, CS or field visit notes' },
  { id: 'signals', icon: Radio, label: 'Signals', desc: 'What the field keeps hitting, with checked quotes' },
  { id: 'act', icon: Route, label: 'Who acts', desc: 'Lanes, owners, value at stake and this week’s asks' },
  { id: 'brief', icon: Send, label: 'Field brief', desc: 'What to tell the field now, ready to send' },
  { id: 'how', icon: BookOpen, label: 'How it works', desc: 'The checks, the score and the routing rules' },
  { id: 'examples', icon: Layers, label: 'Examples', desc: 'Three worked cases, no key needed' }
];

const LANE_ICONS = { field: Zap, escalate: ArrowUpRight, log: Archive, watch: Eye };
const FIX_ICONS = { Build: Hammer, Fix: Wrench, Train: GraduationCap, 'Change process': Workflow, Message: Megaphone, Price: Tag };
const OWNER_ICONS = {
  Product: Briefcase, Engineering: Wrench, Enablement: GraduationCap, Operations: Settings, Marketing: Megaphone,
  'Revenue leadership': TrendingUp, 'Customer success': Headset
};
const SOURCE_ICONS = { 'Sales call notes': Phone, 'Customer success notes': Headset, 'Field visit reports': Store };

const PROVIDERS = [
  { id: 'muse', label: 'Muse Glimmer', note: 'Free, on this site' },
  { id: 'anthropic', label: 'Anthropic', note: 'Your key' },
  { id: 'openai', label: 'OpenAI', note: 'Your key' },
  { id: 'gemini', label: 'Gemini', note: 'Your key' }
];

const MAX_SOURCE = 24000;
const BLANK = { name: '', sourceType: SOURCES[0], period: PERIODS[1], context: '', source: '' };
const slug = (s) => (s || 'frontline-pulse').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const fmtH = (h) => `${Math.round(h * 10) / 10} h`;

function fromExample(ex) {
  const p = parsePulse(ex.text);
  return { form: { ...ex.form, source: ex.source }, text: ex.text, signals: p.signals };
}

export default function App() {
  const first = useMemo(() => fromExample(EXAMPLES[0]), []);
  const [section, setSection] = useState('act');
  const [form, setForm] = useState(first.form);
  const [loadedExample, setLoadedExample] = useState(EXAMPLES[0].id);
  const [modelText, setModelText] = useState(first.text);
  const [signals, setSignals] = useState(first.signals);
  const [hours, setHours] = useState(DEFAULT_HOURS);
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState({});
  const [provider, setProvider] = useState('muse');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const mainRef = useRef(null);

  const parsed = useMemo(() => parsePulse(modelText), [modelText]);
  const pulse = useMemo(() => buildPulse({ signals, source: form.source, hours }), [signals, form.source, hours]);
  const edits = useMemo(() => {
    let n = 0;
    signals.forEach((s, k) => {
      const o = parsed.signals[k];
      if (o && (o.stage !== s.stage || o.severity !== s.severity || o.fix !== s.fix || o.workaround !== s.workaround || s.owner)) n += 1;
    });
    return n;
  }, [signals, parsed]);

  const go = (id) => {
    setSection(id);
    if (mainRef.current) mainRef.current.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  };
  const set = (k, v) => {
    setLoadedExample(null);
    setForm((f) => ({ ...f, [k]: v }));
  };
  const setSignal = (id, k, v) => setSignals((xs) => xs.map((x) => (x.id === id ? { ...x, [k]: v } : x)));
  const resetEdits = () => setSignals(parsed.signals);

  const loadExample = (ex) => {
    const s = fromExample(ex);
    setForm(s.form);
    setLoadedExample(ex.id);
    setModelText(s.text);
    setSignals(s.signals);
    setSelected(null);
    setDone({});
    setError('');
    go('act');
  };
  const startBlank = () => {
    setForm(BLANK);
    setLoadedExample(null);
    setModelText('');
    setSignals([]);
    setSelected(null);
    setDone({});
    setError('');
    go('start');
  };

  const runPulse = async () => {
    setError('');
    const words = form.source.trim().split(/\s+/).filter(Boolean).length;
    if (words < 60) {
      setError('Paste a few notes, around 60 words or more, that name the accounts they came from.');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider, apiKey, model, sourceType: form.sourceType, period: form.period, context: form.context,
          source: form.source.slice(0, MAX_SOURCE)
        })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
      const p = parsePulse(data.text);
      if (p.signals.length < 2 || !p.signals.some((s) => s.mentions.length)) throw new Error('The model replied, but not in the expected format. Try again or switch provider.');
      setModelText(data.text);
      setSignals(p.signals);
      setSelected(null);
      setDone({});
      go('signals');
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
  const downloadDigest = () => {
    const blob = new Blob([digestMarkdown(form, parsed, pulse)], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${slug(form.name)}-frontline-pulse.md`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const openSignal = (id) => {
    setSelected(id);
    go('signals');
    setTimeout(() => document.getElementById(`sig-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  const hasPulse = pulse.rows.length > 0;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Activity size={20} /></div>
          <div>
            <div className="brand-name">Frontline Pulse</div>
            <div className="brand-sub">Field notes into owned fixes</div>
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
        {hasPulse && (
          <div className="side-plan">
            <div className="side-label">Current pulse</div>
            <div className="side-name">{form.name || 'Untitled pulse'}</div>
            <div className="side-counts">
              {LANES.map((l) => {
                const Icon = LANE_ICONS[l.id];
                return (
                  <div key={l.id} className={`side-count l-${l.id}`}>
                    <Icon size={13} /> <b>{pulse.lanes[l.id].length}</b> {l.label}
                  </div>
                );
              })}
            </div>
            <div className="side-stake"><Euro size={14} /> {eur(pulse.valueAtStake)} a year at stake</div>
          </div>
        )}
        <div className="side-foot">A daily AI build by Prerna Kakkar</div>
      </aside>

      <main className="main" ref={mainRef}>
        {section === 'start' && (
          <StartSection
            form={form} set={set} loadedExample={loadedExample} startBlank={startBlank} go={go}
            provider={provider} setProvider={setProvider} apiKey={apiKey} setApiKey={setApiKey}
            model={model} setModel={setModel} busy={busy} error={error} runPulse={runPulse}
          />
        )}
        {section === 'signals' && (hasPulse ? (
          <SignalsSection form={form} pulse={pulse} parsed={parsed} setSignal={setSignal} selected={selected} edits={edits} resetEdits={resetEdits} go={go} loadedExample={loadedExample} />
        ) : <Empty icon={Radio} eyebrow="Signals" go={go} />)}
        {section === 'act' && (hasPulse ? (
          <ActSection
            form={form} pulse={pulse} parsed={parsed} openSignal={openSignal} done={done} setDone={setDone}
            hours={hours} setHours={setHours} edits={edits} resetEdits={resetEdits} go={go} loadedExample={loadedExample}
            downloadDigest={downloadDigest}
          />
        ) : <Empty icon={Route} eyebrow="Who acts" go={go} />)}
        {section === 'brief' && (hasPulse ? (
          <BriefSection form={form} pulse={pulse} parsed={parsed} copyText={copyText} copied={copied} downloadDigest={downloadDigest} error={error} />
        ) : <Empty icon={Send} eyebrow="Field brief" go={go} />)}
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

function TextField({ label, hint, value, onChange, placeholder, area, rows = 2, type = 'text' }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {hint && <span className="field-hint">{hint}</span>}
      {area ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} />
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

function Chips({ options, value, onChange, placeholder, small, custom = true, icons }) {
  const isCustom = value !== '' && value != null && !options.includes(value);
  return (
    <div className="chip-row">
      {options.map((o) => {
        const Icon = icons && icons[o];
        return (
          <button key={o} className={`chip ${small ? 'sm' : ''} ${value === o ? 'on' : ''}`} onClick={() => onChange(o)}>
            {Icon && <Icon size={small ? 12 : 14} />} {o}
          </button>
        );
      })}
      {isCustom && <button className={`chip ${small ? 'sm' : ''} on`}>{value}</button>}
      {custom && <AddOwn onAdd={onChange} placeholder={placeholder} label={small ? 'Own' : 'Add your own'} />}
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

function LaneTag({ lane }) {
  const meta = LANES.find((l) => l.id === lane);
  const Icon = LANE_ICONS[lane];
  return <span className={`lane-tag l-${lane}`}><Icon size={14} /> {meta.label}</span>;
}

function Empty({ icon, eyebrow, go }) {
  return (
    <div className="page">
      <PageHead icon={icon} eyebrow={eyebrow} title="No pulse yet" lede="Paste your notes and read them first, or open one of the worked examples." />
      <div className="row-btns">
        <button className="btn primary" onClick={() => go('start')}><Pencil size={16} /> Paste notes</button>
        <button className="btn ghost" onClick={() => go('examples')}><Layers size={16} /> See examples</button>
      </div>
    </div>
  );
}

function ExampleNotice({ loadedExample, go }) {
  if (!loadedExample) return null;
  return (
    <div className="notice">
      <Info size={16} />
      <span>Worked example with a saved model reply. Change any call, or <button className="link" onClick={() => go('start')}>paste your own notes</button>.</span>
    </div>
  );
}

/* ---------- Paste notes ---------- */

function StartSection(p) {
  const { form, set } = p;
  const words = form.source.trim() ? form.source.trim().split(/\s+/).length : 0;
  return (
    <div className="page">
      <PageHead
        icon={Pencil}
        eyebrow="Paste notes"
        title="The field already knows what is broken."
        lede="Paste notes from sales calls, support tickets, customer success or shop visits. You get the problems that keep coming up, how many accounts and how much money each one touches, who owns the fix and what to tell the field today."
      >
        <div className="steps">
          <Step n="1" icon={Sparkles} text="A model groups the notes into signals, picking labels from fixed lists" />
          <Step n="2" icon={BadgeCheck} text="Every quote and every figure is checked against your notes" />
          <Step n="3" icon={Route} text="Printed rules count, score and route each signal to an owner" />
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
          <Card icon={Target} title="What these notes cover" sub="Context helps the model group the right things together">
            <TextField label="Name for this pulse" value={form.name} onChange={(v) => set('name', v)} placeholder="Iberia mid-market deals" />
            <TextField label="What the team sells" value={form.context} onChange={(v) => set('context', v)} placeholder="Expense management software for companies with 100 to 2,000 staff" />
            <div className="field">
              <span className="field-label">Period covered</span>
              <Chips options={PERIODS} value={form.period} onChange={(v) => set('period', v)} placeholder="Your period" />
            </div>
          </Card>

          <Card icon={FileText} title="The notes" sub="Raw is fine. Name the account on each note, and its deal or order value if you know it">
            <div className="field">
              <span className="field-label">Where are they from?</span>
              <Chips options={SOURCES} value={form.sourceType} onChange={(v) => set('sourceType', v)} placeholder="Your source" icons={SOURCE_ICONS} />
            </div>
            <TextField
              label="Paste them here"
              hint="Remove people's personal details first. Account names and values stay: they are what gets counted."
              value={form.source} onChange={(v) => set('source', v)} area rows={14}
              placeholder={'Costa Azul Hoteles (deal €72k ARR) - Marta, 12 Sep\nIT will not approve without single sign-on. "..."\n\nFaro Seguros (deal €90k ARR) - Iván, 23 Sep\n...'}
            />
            <div className="field-foot">
              <span>{words.toLocaleString('en-GB')} words</span>
              {form.source.length > MAX_SOURCE && <span className="warn-text"><TriangleAlert size={13} /> Only the first {MAX_SOURCE.toLocaleString('en-GB')} characters go to the model</span>}
            </div>
          </Card>
        </div>

        <div className="sticky-results">
          <div className="panel">
            <div className="panel-title"><KeyRound size={16} /> Model</div>
            <div className="panel-sub">The model only groups and labels. It does not count, add up money, score or route anything.</div>
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
            <button className="btn primary wide" onClick={p.runPulse} disabled={p.busy}>
              {p.busy ? <><Loader2 size={16} className="spin" /> Reading your notes</> : <><Sparkles size={16} /> Take the pulse</>}
            </button>
            {p.error && <div className="error"><TriangleAlert size={16} /> {p.error}</div>}
          </div>
          <div className="panel">
            <div className="panel-title"><ListChecks size={16} /> What you get</div>
            <ul className="icon-list">
              <li><Radio size={16} /> 3 to 7 signals, each with the accounts behind it</li>
              <li><Euro size={16} /> Yearly value at stake, counted from your own figures</li>
              <li><Route size={16} /> An owner and a lane: fix this week, escalate, log or watch</li>
              <li><Hourglass size={16} /> Hours the field spends on workarounds</li>
              <li><Send size={16} /> A message telling the field what to say now</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Signals ---------- */

function SignalsSection({ form, pulse, parsed, setSignal, selected, edits, resetEdits, go, loadedExample }) {
  return (
    <div className="page">
      <PageHead icon={Radio} eyebrow={`Signals · ${form.sourceType}`} title={form.name || 'What the field is saying'} lede={parsed.summary}>
        <div className="notice">
          <BadgeCheck size={16} />
          <span><b>{pulse.mentionsOk} of {pulse.mentionsAll}</b> quotes found word for word in your notes. A mention whose quote is missing does not count. Change any label and the routing moves with it.</span>
          {edits > 0 && <button className="link" onClick={resetEdits}><RotateCcw size={13} /> Undo {edits} change{edits === 1 ? '' : 's'}</button>}
        </div>
        <ExampleNotice loadedExample={loadedExample} go={go} />
      </PageHead>

      <div className="sig-list">
        {pulse.rows.map((r) => <SignalCard key={r.id} r={r} setSignal={setSignal} selected={selected === r.id} />)}
      </div>

      <div className="row-btns">
        <button className="btn primary" onClick={() => go('act')}><Route size={16} /> See who acts</button>
        <button className="btn ghost" onClick={() => go('brief')}><Send size={16} /> Field brief</button>
      </div>
    </div>
  );
}

function SignalCard({ r, setSignal, selected }) {
  const FixIcon = FIX_ICONS[r.fix] || Wrench;
  return (
    <section id={`sig-${r.id}`} className={`sig l-${r.lane} ${selected ? 'sel' : ''}`}>
      <div className="sig-head">
        <div className="sig-id">{r.id}</div>
        <div className="sig-titles">
          <h2 className="sig-name">{r.name}</h2>
          <p className="sig-what">{r.what}</p>
        </div>
        <LaneTag lane={r.lane} />
      </div>

      <div className="sig-stats">
        <span className="stat"><Building2 size={14} /> <b>{r.n}</b> account{r.n === 1 ? '' : 's'}</span>
        <span className="stat"><Euro size={14} /> <b>{r.value ? eur(r.value) : '€0'}</b> a year</span>
        <span className="stat"><FixIcon size={14} /> {r.fix} → <b>{r.owner}</b></span>
        {r.hours > 0 && <span className="stat"><Hourglass size={14} /> <b>{fmtH(r.hours)}</b> of workarounds</span>}
        <span className="stat score-stat">Score <b>{r.score}</b></span>
      </div>

      <div className="eq">
        <span className="term"><b>{r.n}</b><small>Accounts</small></span>
        <span className="op">×</span>
        <span className="term"><b>{r.sevPts}</b><small>{r.severity}</small></span>
        <span className="op">×</span>
        <span className="term"><b>{r.stagePts}</b><small>{r.stage}</small></span>
        <span className="op">=</span>
        <span className="term total"><b>{r.score}</b><small>Score</small></span>
        <span className="why"><span className="rule-id">{r.rule}</span> {r.why}</span>
      </div>

      {r.flag && <div className="flag"><Flag size={15} /> {r.flag}</div>}
      {r.move && <div className="move"><CircleHelp size={15} /> {r.move}</div>}

      <div className="sig-grid">
        <div>
          <div className="mini-label">Mentions</div>
          <div className="mentions">
            {r.mentions.map((m, i) => (
              <div key={i} className={`mention ${m.found ? '' : 'miss'}`}>
                <div className="mention-top">
                  <span className="acc"><Building2 size={13} /> {m.account}</span>
                  {m.parsed && (
                    <span className={`val ${m.valueOk ? 'ok' : 'miss'}`}>
                      {m.valueOk ? <Check size={12} /> : <X size={12} />} {m.value}{m.parsed.monthly && m.valueOk ? ` = ${eur(m.parsed.yearly)} a year` : ''}
                    </span>
                  )}
                </div>
                <div className="mention-quote"><Quote size={13} /> <span>{m.quote}</span></div>
                <span className={`q-check ${m.found ? 'ok' : 'miss'}`}>
                  {m.found ? <><BadgeCheck size={12} /> Quote found in notes</> : <><TriangleAlert size={12} /> Quote not found, not counted (M1)</>}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="sig-side">
          <div className="ask-box">
            <div className="action-head"><ArrowRight size={15} /> The ask to {r.owner}</div>
            <p>{r.ask}</p>
          </div>
          <div className="reply-box">
            <div className="action-head"><MessageSquareQuote size={15} /> Tell the field now</div>
            <p>{r.reply}</p>
          </div>
        </div>
      </div>

      <div className="sig-edit">
        <div className="mini-label">Disagree? Change the call</div>
        <div className="edit-grid">
          <div className="edit-row"><span>Stage</span><Chips small custom={false} options={STAGES} value={r.stage} onChange={(v) => setSignal(r.id, 'stage', v)} /></div>
          <div className="edit-row"><span>Severity</span><Chips small custom={false} options={SEVERITIES} value={r.severity} onChange={(v) => setSignal(r.id, 'severity', v)} /></div>
          <div className="edit-row"><span>Fix</span><Chips small custom={false} options={FIXES} value={r.fix} onChange={(v) => setSignal(r.id, 'fix', v)} icons={FIX_ICONS} /></div>
          <div className="edit-row"><span>Workaround each time</span><Chips small custom={false} options={WORKAROUNDS} value={r.workaround} onChange={(v) => setSignal(r.id, 'workaround', v)} /></div>
          <div className="edit-row wide"><span>Owner {r.owner === ROUTE[r.fix] ? '(routed by R1)' : '(your choice)'}</span><Chips small options={OWNERS} value={r.owner} onChange={(v) => setSignal(r.id, 'owner', v)} placeholder="Team" icons={OWNER_ICONS} /></div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Who acts ---------- */

function ActSection(p) {
  const { form, pulse, openSignal, done, setDone, hours, setHours } = p;
  const L = pulse.lanes;
  const top = L.field[0] || L.escalate[0];
  const maxScore = Math.max(1, ...pulse.rows.map((r) => r.score));
  const owners = Object.keys(pulse.owners);
  const asks = owners.flatMap((o) => pulse.owners[o]).sort((a, b) => LANES.findIndex((l) => l.id === a.lane) - LANES.findIndex((l) => l.id === b.lane));

  let line;
  if (!L.field.length && !L.escalate.length) line = 'Nothing is strong enough to act on yet. The signals below are worth listening for.';
  else {
    const parts = [];
    if (L.field.length) parts.push(`${L.field.length} fix${L.field.length === 1 ? '' : 'es'} the business can make this week`);
    if (L.escalate.length) parts.push(`${L.escalate.length} to take to the roadmap`);
    line = `${parts.join(' and ')}, covering ${eur(pulse.valueAtStake)} a year across ${pulse.accountsActed} account${pulse.accountsActed === 1 ? '' : 's'}.`;
    line = line.charAt(0).toUpperCase() + line.slice(1);
  }

  return (
    <div className="page">
      <PageHead icon={Route} eyebrow={`Who acts · ${form.period}`} title={form.name || 'Who acts on what'} lede={form.context}>
        <ExampleNotice loadedExample={p.loadedExample} go={p.go} />
      </PageHead>

      <section className="hero">
        <div className="hero-top">
          <div>
            <div className="hero-eyebrow">The pulse, in one line</div>
            <div className="hero-line">{line}</div>
            {top && <div className="hero-sub">{top.lane === 'field' ? 'Start this week with' : 'Start with'} <b>{top.name.toLowerCase()}</b>: {top.n} accounts, owned by {top.owner}, score {top.score}.</div>}
          </div>
          <div className="hero-actions">
            <button className="btn light" onClick={() => p.go('brief')}><Send size={16} /> Field brief</button>
            <button className="btn light-ghost" onClick={p.downloadDigest}><Download size={16} /> Digest .md</button>
          </div>
        </div>
        <div className="pulse-strip" aria-label="Signal scores">
          {pulse.rows.map((r) => (
            <button key={r.id} className={`strip-row l-${r.lane}`} onClick={() => openSignal(r.id)}>
              <span className="strip-name">{r.name}</span>
              <span className="strip-track"><span className="strip-bar" style={{ width: `${Math.max(4, (r.score / maxScore) * 100)}%` }} /></span>
              <span className="strip-score">{r.score}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="kpis">
        <Kpi icon={Euro} label="Value at stake" value={eur(pulse.valueAtStake)} sub={`a year, ${pulse.accountsActed} accounts counted once (V3)`} accent />
        <Kpi icon={Zap} label="Fix this week" value={L.field.length} sub={`${L.escalate.length} to escalate · ${L.log.length} logged · ${L.watch.length} watched`} />
        <Kpi icon={Hourglass} label="Workaround time" value={fmtH(pulse.hours)} sub={`in these notes, ${fmtH(pulse.hoursField)} of it fixable this week`} />
        <Kpi icon={BadgeCheck} label="Quotes checked" value={`${pulse.mentionsOk} / ${pulse.mentionsAll}`} sub={`${pulse.accountsHeard} accounts heard from`} />
      </div>

      <div className="board">
        {LANES.map((l) => {
          const Icon = LANE_ICONS[l.id];
          const list = L[l.id];
          return (
            <section key={l.id} className={`col l-${l.id}`}>
              <div className="col-head">
                <div className="col-title"><Icon size={16} /> {l.label} <span className="col-n">{list.length}</span></div>
                <div className="col-desc"><CalendarClock size={12} /> {l.due}. {l.desc}</div>
              </div>
              <div className="col-list">
                {list.length ? list.map((r) => {
                  const OIcon = OWNER_ICONS[r.owner] || Users;
                  return (
                    <button key={r.id} className="act" onClick={() => openSignal(r.id)}>
                      <div className="act-top"><span className="score">{r.score}</span><span className="act-id">{r.id}</span></div>
                      <div className="act-title">{r.name}</div>
                      <div className="act-meta">
                        <span><OIcon size={12} /> {r.owner}</span>
                        <span><Building2 size={12} /> {r.n}</span>
                      </div>
                      {r.value > 0 && <div className="act-impact"><Euro size={12} /> {eur(r.value)} a year</div>}
                      {r.flag && <div className="act-flag"><Flag size={12} /> Call this week</div>}
                    </button>
                  );
                }) : <div className="col-empty">Nothing here</div>}
              </div>
            </section>
          );
        })}
      </div>

      <div className="section-title"><Users size={18} /> Asks by owner</div>
      <div className="owner-grid">
        {owners.length ? owners.map((o) => {
          const OIcon = OWNER_ICONS[o] || Users;
          const list = pulse.owners[o];
          const val = list.reduce((t, r) => t + r.value, 0);
          return (
            <section key={o} className="owner">
              <div className="owner-head">
                <div className="owner-icon"><OIcon size={18} /></div>
                <div>
                  <div className="owner-name">{o}</div>
                  <div className="owner-sub">{list.length} ask{list.length === 1 ? '' : 's'}{val ? ` · ${eur(val)} a year behind them` : ''}</div>
                </div>
              </div>
              {list.map((r) => (
                <div key={r.id} className={`owner-ask l-${r.lane}`}>
                  <div className="owner-ask-top"><LaneTag lane={r.lane} /> <span className="due"><CalendarClock size={12} /> {r.due}</span></div>
                  <p>{r.ask}</p>
                  <button className="link small" onClick={() => openSignal(r.id)}>{r.n} accounts · see the evidence <ArrowRight size={12} /></button>
                </div>
              ))}
            </section>
          );
        }) : <div className="no-act"><Info size={14} /> No signal is strong enough to give anyone an ask yet.</div>}
      </div>

      <div className="two-cards">
        <Card icon={ListChecks} title="This week" sub="Every ask in lane order. Tick them off as owners say yes">
          {asks.length ? (
            <ul className="todo">
              {asks.map((r) => {
                const OIcon = OWNER_ICONS[r.owner] || Users;
                const on = !!done[r.id];
                return (
                  <li key={r.id}>
                    <button className={`todo-item ${on ? 'on' : ''}`} onClick={() => setDone((d) => ({ ...d, [r.id]: !d[r.id] }))}>
                      {on ? <SquareCheck size={18} /> : <Square size={18} />}
                      <span>
                        <span className="todo-owner"><OIcon size={12} /> {r.owner} · {r.due}</span>
                        <span className="todo-text">{r.ask}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : <div className="no-act"><Info size={14} /> Nothing to ask for yet.</div>}
        </Card>
        <Card icon={CircleHelp} title="What the notes do not tell us" sub="Gaps from the model that could change the routing">
          {p.parsed.gaps.length ? (
            <div className="q-list">
              {p.parsed.gaps.map((g, i) => <div key={i} className="q"><span className="q-n">{i + 1}</span> {g}</div>)}
            </div>
          ) : <div className="no-act">No gaps listed.</div>}
        </Card>
      </div>

      <Card icon={Ruler} title="Workaround hours" sub="How long the field loses each time a workaround comes up. Change it and the totals update (T1)">
        <div className="lift-grid">
          {['Minutes', 'Hours'].map((k) => (
            <div key={k} className="lift">
              <div className="lift-name">{k}</div>
              <div className="lift-inputs">
                <input type="number" min="0" step="0.25" value={hours[k]} onChange={(e) => setHours((h) => ({ ...h, [k]: Math.max(0, Number(e.target.value) || 0) }))} aria-label={`${k} in hours`} />
                <span>hours each time</span>
              </div>
            </div>
          ))}
        </div>
        <div className="notice warn">
          <Info size={16} />
          <span>These are starting assumptions I set for illustration, not measured figures. The hours count only checked mentions, so the real total is higher if more of the field hit the same problem without writing it down.</span>
        </div>
        {p.edits > 0 && <button className="link" onClick={p.resetEdits}><RotateCcw size={13} /> Undo {p.edits} change{p.edits === 1 ? '' : 's'} to the model's calls</button>}
      </Card>
    </div>
  );
}

/* ---------- Field brief ---------- */

function BriefSection({ form, pulse, parsed, copyText, copied, downloadDigest, error }) {
  const msg = fieldMessage(form, pulse);
  const live = pulse.rows.filter((r) => r.lane !== 'watch');
  return (
    <div className="page">
      <PageHead
        icon={Send}
        eyebrow="Field brief"
        title="Close the loop with the people who told you."
        lede="Notes stop arriving when nobody hears back. This message tells the field what to say now and who is working on what. The digest is the full routing for the Monday meeting."
      />

      <div className="brief-grid">
        <section className="brief-card">
          <div className="brief-head">
            <div className="panel-title"><MessageSquareQuote size={16} /> Message to the field</div>
            <button className="btn primary sm" onClick={() => copyText(msg, 'msg')}>{copied === 'msg' ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy</>}</button>
          </div>
          <pre className="brief-text">{msg}</pre>
        </section>

        <div className="brief-side">
          <div className="panel">
            <div className="panel-title"><FileText size={16} /> Full digest</div>
            <div className="panel-sub">Every signal with its lane, owner, accounts, checked quotes and asks, as Markdown for Notion, Linear, Jira or an email.</div>
            <div className="row-btns tight">
              <button className="btn primary sm" onClick={() => copyText(digestMarkdown(form, parsed, pulse), 'digest')}>{copied === 'digest' ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy digest</>}</button>
              <button className="btn ghost sm" onClick={downloadDigest}><Download size={15} /> Download .md</button>
            </div>
            {error && <div className="error"><TriangleAlert size={16} /> {error}</div>}
          </div>
          <div className="panel">
            <div className="panel-title"><MessageSquareQuote size={16} /> Say this, signal by signal</div>
            <div className="reply-list">
              {live.length ? live.map((r) => (
                <div key={r.id} className={`reply-item l-${r.lane}`}>
                  <div className="reply-name"><LaneTag lane={r.lane} /> {r.name}</div>
                  <p>{r.reply}</p>
                </div>
              )) : <div className="no-act">Nothing to tell the field yet.</div>}
            </div>
          </div>
        </div>
      </div>

      <div className="notice warn">
        <Info size={16} />
        <span>Field replies are written by the model from your notes. Check any fact in them, such as a date, a margin or where data is hosted, before sending.</span>
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
        title="A model listens. Rules route."
        lede="Who fixes what, and how urgently, should not depend on which rep wrote the most vivid note. So the model only groups and labels. Counting, money, scores and owners are printed rules you can check."
      />

      <div className="how-grid">
        <Card icon={Sparkles} title="What the model does" sub="One call, tagged lines back, no JSON">
          <ul className="tick-list">
            <li><Check size={16} /> Groups the notes into 3 to 7 signals and names each one</li>
            <li><Check size={16} /> Picks stage, severity, fix and workaround time from fixed word lists</li>
            <li><Check size={16} /> Lists every mention with its account, its value as written and an exact quote</li>
            <li><Check size={16} /> Writes the ask to the owner and what the field should say now</li>
            <li><Check size={16} /> Lists what the notes do not say</li>
          </ul>
        </Card>
        <Card icon={Ban} title="What it never does" sub="These all happen in your browser">
          <ul className="tick-list muted">
            <li><X size={16} /> Count accounts or add up money</li>
            <li><X size={16} /> Score, rank or decide the lane</li>
            <li><X size={16} /> Choose the owner</li>
            <li><X size={16} /> Mark its own quotes or figures as checked</li>
          </ul>
        </Card>
      </div>

      <Card icon={Scale} title="The rules" sub="Applied in this order, every time">
        <div className="rule-list">
          {RULES.map((r) => (
            <div key={r.id} className="rule"><span className="rule-id">{r.id}</span><p>{r.text}</p></div>
          ))}
        </div>
      </Card>

      <div className="how-grid">
        <Card icon={Filter} title="The four lanes" sub="Every signal lands in exactly one">
          <div className="bucket-list">
            {LANES.map((l) => (
              <div key={l.id} className="bucket-row"><LaneTag lane={l.id} /><p><b>{l.due}.</b> {l.desc}</p></div>
            ))}
          </div>
        </Card>
        <Card icon={Euro} title="Where the numbers come from" sub="Read this before quoting a figure">
          <ul className="tick-list">
            <li><Info size={16} /> Every value is a figure written in your notes. Nothing is estimated</li>
            <li><Info size={16} /> Monthly figures are multiplied by 12. Deal values are taken as yearly</li>
            <li><Info size={16} /> Totals count each account once, at its highest value</li>
            <li><Info size={16} /> Workaround hours use starting assumptions you can change, not measurements</li>
          </ul>
        </Card>
      </div>

      <Card icon={Zap} title="Why this split" sub="The same design as So What? and Wrong Turn in this repo">
        <p className="panel-text">Field feedback goes wrong in two quiet ways. The loudest rep's account becomes the roadmap, and the same three problems get raised for months because nobody owns them and nobody tells the field what happened. Checking every quote and figure against the notes keeps the counts honest. Routing by the kind of fix, not by who shouted, gives every signal an owner and a date. The field brief closes the loop, so the notes keep coming.</p>
      </Card>
    </div>
  );
}

/* ---------- Examples ---------- */

function ExamplesSection({ loadExample, loadedExample, startBlank }) {
  return (
    <div className="page">
      <PageHead icon={Layers} eyebrow="Examples" title="Three worked cases" lede="Each has the pasted notes and a saved model reply, so it runs without a key. The rules treat them exactly like a live read." />
      <div className="ex-grid">
        {EXAMPLES.map((ex) => {
          const p = parsePulse(ex.text);
          const q = buildPulse({ signals: p.signals, source: ex.source });
          return (
            <button key={ex.id} className={`ex-card ${loadedExample === ex.id ? 'current' : ''}`} onClick={() => loadExample(ex)}>
              <div className="ex-top">
                <span className="team-tag"><Briefcase size={13} /> {ex.team}</span>
                {loadedExample === ex.id && <span className="ex-current">Open now</span>}
              </div>
              <div className="ex-title">{ex.title}</div>
              <div className="ex-blurb">{ex.blurb}</div>
              <div className="ex-stats">
                <span className="ex-stat strong"><Euro size={12} /> {eur(q.valueAtStake)} at stake</span>
                {LANES.map((l) => {
                  const Icon = LANE_ICONS[l.id];
                  return <span key={l.id} className={`ex-stat l-${l.id}`}><Icon size={12} /> {q.lanes[l.id].length} {l.label.toLowerCase()}</span>;
                })}
              </div>
              <div className="ex-open">Open this pulse <ArrowRight size={15} /></div>
            </button>
          );
        })}
        <button className="ex-card blank" onClick={startBlank}>
          <div className="ex-blank-icon"><Plus size={20} /></div>
          <div className="ex-title">Start with your own</div>
          <div className="ex-blurb">Paste your notes, say what they cover, and take the pulse.</div>
          <div className="ex-open">Start blank <ArrowRight size={15} /></div>
        </button>
      </div>
      <div className="notice">
        <Info size={16} />
        <span>Companies, people and numbers in the examples are invented.</span>
      </div>
    </div>
  );
}
