import React, { useMemo, useRef, useState } from 'react';
import {
  Sprout, UserRoundPlus, Settings2, LayoutTemplate, Upload, PackagePlus, UserPlus, MousePointerClick, Trophy, Repeat,
  CalendarCheck, Share2, Shapes, Map, Filter, TrendingDown, Wrench, FileText, Scale, Layers, Info, TriangleAlert, Loader2,
  Check, X, Plus, Copy, Download, ArrowRight, Wand2, Quote, Lightbulb, Bot, CircleHelp, Trash2, ListChecks, Flag, Gauge,
  Ruler, CircleCheck, OctagonX, Eye, EyeOff, Users, ShieldCheck, ChevronDown, ChevronUp, FlaskConical, Target, Hammer,
  Hourglass, Search, Timer, Magnet, BellRing, Split, Milestone, KeyRound, Footprints, Clock, Sparkles, HandHelping,
  MonitorSmartphone, Goal
} from 'lucide-react';
import {
  SEGMENTS, WINDOWS, WIN_DEFS, WIN_HINT, FIRST_SCREENS, SUPPORT, MODES, WHO, STEP_TYPES, PHASES, SEVERITY, KINDS, VERDICTS,
  RULES_TABLE, CUSTOM_LINE, typeById, typeLabel, assess, parseReply, checkMoments, reportMarkdown, fmtHours, timeLines
} from './rules.js';
import { EXAMPLES } from './examples.js';

const SECTIONS = [
  { id: 'map', icon: Map, label: 'Map activation', desc: 'Your milestones, counts, help in place and notes' },
  { id: 'ladder', icon: TrendingDown, label: 'Where they stall', desc: 'Each milestone, who gets there and how long it takes' },
  { id: 'stuck', icon: Filter, label: 'Stuck points', desc: 'Every finding, ranked, with its reason' },
  { id: 'fixes', icon: Wrench, label: 'Fix plan', desc: 'What to change first and how to test it' },
  { id: 'report', icon: FileText, label: 'Report', desc: 'A write-up to share with the team' },
  { id: 'how', icon: Scale, label: 'How it works', desc: 'The printed rules and alert lines' },
  { id: 'examples', icon: Layers, label: 'Examples', desc: 'Three worked products, no key needed' }
];

const TYPE_ICONS = {
  signup: UserRoundPlus, setup: Settings2, template: LayoutTemplate, import: Upload, install: PackagePlus, invite: UserPlus,
  core: MousePointerClick, win: Trophy, repeat: Repeat, habit: CalendarCheck, share: Share2
};
const iconFor = (type) => TYPE_ICONS[type] || Shapes;
const PHASE_ICONS = { setup: Settings2, win: Trophy, stick: Magnet };
const VERDICT_ICONS = { define: Goal, shorten: OctagonX, stick: Magnet, smooth: Wrench, tune: Gauge };
const SEV_ICONS = { High: OctagonX, Medium: TriangleAlert, Low: Info };

const PROVIDERS = [
  { id: 'muse', label: 'Muse Glimmer', note: 'Free, on this site' },
  { id: 'anthropic', label: 'Anthropic', note: 'Your key' },
  { id: 'openai', label: 'OpenAI', note: 'Your key' },
  { id: 'gemini', label: 'Gemini', note: 'Your key' }
];

const uid = () => Math.random().toString(36).slice(2, 9);
const fmt = (x) => (x === null || x === undefined ? '' : Number(x).toLocaleString('en-GB'));
const pl = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const slug = (s) => (s || 'activation').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
const stepName = (s) => s.label || typeLabel(s);
const num = (x) => x.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
const newStep = (type) => ({ id: uid(), type, label: '', mode: 'Required', who: 'They can do it alone', count: '', hours: '' });

const BLANK = {
  name: '', pitch: '', segment: SEGMENTS[0], window: '7 days', winDef: WIN_DEFS[0], firstScreen: FIRST_SCREENS[1],
  support: ['Welcome email'], notes: '', segments: [],
  steps: [newStep('signup'), newStep('core'), newStep('win'), newStep('repeat')]
};

export default function App() {
  const today = useMemo(() => new Date(), []);
  const [section, setSection] = useState('ladder');
  const [form, setForm] = useState(EXAMPLES[0].form);
  const [loadedExample, setLoadedExample] = useState(EXAMPLES[0].id);
  const [modelText, setModelText] = useState(EXAMPLES[0].text);
  const [modelNotes, setModelNotes] = useState(EXAMPLES[0].form.notes);
  const [dismissed, setDismissed] = useState({});
  const [provider, setProvider] = useState('muse');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const mainRef = useRef(null);

  const parsed = useMemo(() => parseReply(modelText), [modelText]);
  const checked = useMemo(() => checkMoments(parsed, form), [parsed, form]);
  const a = useMemo(() => assess(form, checked.kept, dismissed), [form, checked, dismissed]);
  const stale = !!modelText && modelNotes.trim() !== form.notes.trim();

  const go = (id) => {
    setSection(id);
    if (mainRef.current) mainRef.current.scrollTo({ top: 0 });
  };
  const edit = (fn) => {
    setLoadedExample(null);
    setForm(fn);
  };
  const set = (k, v) => edit((f) => ({ ...f, [k]: v }));
  const setStep = (id, k, v) => edit((f) => ({ ...f, steps: f.steps.map((s) => (s.id === id ? { ...s, [k]: v } : s)) }));
  const addStep = (type) => edit((f) => {
    const s = newStep(type);
    const steps = [...f.steps];
    const wIdx = steps.findIndex((x) => x.type === 'win');
    const isAfter = ['repeat', 'habit', 'share'].includes(type);
    if (!isAfter && type !== 'win' && wIdx >= 0) steps.splice(wIdx, 0, s);
    else steps.push(s);
    return { ...f, steps };
  });
  const moveStep = (id, dir) => edit((f) => {
    const i = f.steps.findIndex((s) => s.id === id);
    const j = i + dir;
    if (j < 0 || j >= f.steps.length) return f;
    const steps = [...f.steps];
    [steps[i], steps[j]] = [steps[j], steps[i]];
    return { ...f, steps };
  });
  const removeStep = (id) => edit((f) => ({ ...f, steps: f.steps.filter((s) => s.id !== id) }));
  const setSeg = (id, k, v) => edit((f) => ({ ...f, segments: f.segments.map((s) => (s.id === id ? { ...s, [k]: v } : s)) }));
  const addSeg = () => edit((f) => ({ ...f, segments: [...(f.segments || []), { id: uid(), name: '', rate: '' }].slice(0, 6) }));
  const removeSeg = (id) => edit((f) => ({ ...f, segments: f.segments.filter((s) => s.id !== id) }));
  const toggleHide = (key) => setDismissed((d) => ({ ...d, [key]: !d[key] }));

  const loadExample = (ex) => {
    setForm(ex.form);
    setLoadedExample(ex.id);
    setModelText(ex.text);
    setModelNotes(ex.form.notes);
    setDismissed({});
    setError('');
    go('ladder');
  };
  const startBlank = () => {
    setForm({ ...BLANK, steps: BLANK.steps.map((s) => ({ ...s, id: uid() })) });
    setLoadedExample(null);
    setModelText('');
    setModelNotes('');
    setDismissed({});
    setError('');
    go('map');
  };

  const read = async () => {
    setError('');
    if (form.notes.trim().length < 60) {
      setError('Write a few sentences first: what new users see, what support hears, where people stall or stop coming back.');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider, apiKey, model, name: form.name, pitch: form.pitch, segment: form.segment, window: form.window,
          winDef: form.winDef, firstScreen: form.firstScreen, support: form.support,
          steps: form.steps.map((s) => ({ type: s.type, label: s.label, mode: s.mode, who: s.who })), notes: form.notes
        })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
      const p = parseReply(data.text);
      if (!p.summary && !p.moments.length) throw new Error('The model replied, but not in the expected format. Try again or switch provider.');
      setModelText(data.text);
      setModelNotes(form.notes);
      setDismissed({});
      go('stuck');
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
  const report = () => reportMarkdown(form, a, today, parsed);
  const download = () => {
    const blob = new Blob([report()], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const el = document.createElement('a');
    el.href = url;
    el.download = `${slug(form.name)}-activation-gap-review.md`;
    el.click();
    URL.revokeObjectURL(url);
  };

  const v = VERDICTS[a.verdict];
  const VIcon = VERDICT_ICONS[a.verdict];
  const L = a.lad;
  const common = { form, a, go, loadedExample, stale };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Sprout size={20} /></div>
          <div>
            <div className="brand-name">Then What?</div>
            <div className="brand-sub">Find where new users stall after sign-up</div>
          </div>
        </div>
        <nav className="nav">
          {SECTIONS.map((s) => (
            <button key={s.id} className={`nav-item ${section === s.id ? 'active' : ''}`} onClick={() => go(s.id)}>
              <s.icon size={18} className="nav-icon" />
              <span className="nav-text">
                <span className="nav-label">{s.label}{s.id === 'stuck' && a.ranked.length > 0 && <span className="nav-badge">{a.ranked.length}</span>}</span>
                <span className="nav-desc">{s.desc}</span>
              </span>
            </button>
          ))}
        </nav>
        <div className="side-plan">
          <div className="side-label">Current product</div>
          <div className="side-name">{form.name || 'Untitled product'}</div>
          <div className={`side-verdict v-${v.tone}`}><VIcon size={14} /> {v.label}</div>
          {L.activation !== null && <div className="side-meta"><Trophy size={13} /> {L.activation}% reach the first win</div>}
          {L.timeToWin !== null && <div className="side-meta"><Timer size={13} /> {fmtHours(L.timeToWin)} to the first win</div>}
          {L.biggest && <div className="side-meta"><TrendingDown size={13} /> <span>Biggest gap: before {stepName(L.biggest.step)}, {fmt(L.biggest.lost)} lost</span></div>}
        </div>
        <div className="side-foot">A daily AI build by Prerna Kakkar. Printed rules decide. A model only reads your notes.</div>
      </aside>

      <main className="main" ref={mainRef}>
        {section === 'map' && (
          <MapSection
            {...common} set={set} setStep={setStep} addStep={addStep} moveStep={moveStep} removeStep={removeStep} startBlank={startBlank}
            setSeg={setSeg} addSeg={addSeg} removeSeg={removeSeg}
            provider={provider} setProvider={setProvider} apiKey={apiKey} setApiKey={setApiKey} model={model} setModel={setModel}
            busy={busy} error={error} read={read}
          />
        )}
        {section === 'ladder' && <LadderSection {...common} />}
        {section === 'stuck' && <StuckSection {...common} parsed={parsed} checked={checked} toggleHide={toggleHide} />}
        {section === 'fixes' && <FixSection {...common} parsed={parsed} />}
        {section === 'report' && <ReportSection report={report} copyText={copyText} copied={copied} download={download} error={error} />}
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

function TextField({ label, hint, value, onChange, placeholder, area, rows = 2, type = 'text', inputMode }) {
  return (
    <label className="field">
      {label && <span className="field-label">{label}</span>}
      {hint && <span className="field-hint">{hint}</span>}
      {area ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} />
      ) : (
        <input type={type} inputMode={inputMode} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete="off" />
      )}
    </label>
  );
}

function AddOwn({ onAdd, placeholder, small, label = 'Add your own' }) {
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
    <button className={`chip dashed ${small ? 'sm' : ''}`} onClick={() => setAdding(true)}><Plus size={small ? 13 : 14} /> {label}</button>
  );
}

function Chips({ options, value, onChange, placeholder = 'Your answer', own = true, small, hints }) {
  const isCustom = value && !options.includes(value);
  return (
    <div className="chip-row">
      {options.map((o) => (
        <button key={o} title={hints?.[o]} className={`chip ${small ? 'sm' : ''} ${value === o ? 'on' : ''}`} onClick={() => onChange(o)}>{value === o && <Check size={13} />}{o}</button>
      ))}
      {isCustom && <button className={`chip ${small ? 'sm' : ''} on custom`}><Check size={13} />{value}</button>}
      {own && <AddOwn onAdd={onChange} placeholder={placeholder} small={small} />}
    </div>
  );
}

function MultiChips({ options, value, onChange, placeholder }) {
  const all = [...options, ...value.filter((x) => !options.includes(x))];
  const toggle = (o) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  return (
    <div className="chip-row">
      {all.map((o) => (
        <button key={o} className={`chip sm ${value.includes(o) ? 'on' : ''} ${options.includes(o) ? '' : 'custom'}`} onClick={() => toggle(o)}>{value.includes(o) && <Check size={12} />}{o}</button>
      ))}
      <AddOwn small onAdd={(x) => !value.includes(x) && onChange([...value, x])} placeholder={placeholder} />
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

function Kpi({ icon: Icon, label, value, sub, tone }) {
  return (
    <div className={`kpi ${tone || ''}`}>
      <div className="kpi-label"><Icon size={14} /> {label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

function SevPill({ sev, score }) {
  const Icon = SEV_ICONS[sev];
  return <span className={`pill t-${SEVERITY[sev].tone}`}><Icon size={13} /> {sev}{score !== undefined ? ` · ${score}` : ''}</span>;
}

function PhaseTag({ phase }) {
  const Icon = PHASE_ICONS[phase];
  return <span className="cat-tag"><Icon size={12} /> {PHASES[phase].label}</span>;
}

function TypeTag({ step }) {
  const Icon = iconFor(step.type);
  return <span className={`cat-tag ${step.type === 'win' ? 'core' : ''}`}><Icon size={12} /> {typeLabel(step)}</span>;
}

function Notices({ loadedExample, stale, go }) {
  return (
    <>
      {loadedExample && (
        <div className="notice">
          <Info size={16} />
          <span>Worked example with a saved read of its notes. <button className="link" onClick={() => go('map')}>Change any milestone</button> and the rules run again at once.</span>
        </div>
      )}
      {stale && (
        <div className="notice warn">
          <TriangleAlert size={16} />
          <span>Your notes changed after the model read them. The rule findings are current. <button className="link" onClick={() => go('map')}>Read the notes again</button> to refresh the stuck moments.</span>
        </div>
      )}
    </>
  );
}

function Verdict({ a, compact }) {
  const v = VERDICTS[a.verdict];
  const VIcon = VERDICT_ICONS[a.verdict];
  if (compact) return <div className={`live-verdict v-${v.tone}`}><VIcon size={20} /> {v.label}</div>;
  return (
    <div className={`hero v-${v.tone}`}>
      <div className="hero-icon"><VIcon size={30} /></div>
      <div className="hero-text">
        <div className="hero-label">{v.label}</div>
        <div className="hero-line">{v.line}</div>
      </div>
      <div className="hero-score">
        <div className="hero-score-n">{a.lad.activation !== null ? `${a.lad.activation}%` : a.ranked.length}</div>
        <div className="hero-score-l">{a.lad.activation !== null ? 'reach the first win' : a.ranked.length === 1 ? 'finding' : 'findings'}</div>
      </div>
    </div>
  );
}

/* ---------- Map activation ---------- */

function StepRow({ s, i, total, setStep, moveStep, removeStep, open, toggle }) {
  const Icon = iconFor(s.type);
  const custom = !typeById(s.type);
  const first = i === 0;
  return (
    <div className={`flow-step ${s.type === 'win' ? 'is-value' : ''}`}>
      <div className="flow-top">
        <span className="flow-n"><Icon size={16} /></span>
        <div className="flow-titles">
          <input className="flow-label" value={s.label} onChange={(e) => setStep(s.id, 'label', e.target.value)} placeholder={typeLabel(s)} />
          <div className="bet-meta">
            <span className="muted">Milestone {i + 1}</span>
            <TypeTag step={s} />
            {custom && <span className="src warn"><Info size={11} /> Your own type, rule A1</span>}
          </div>
        </div>
        <button className="icon-btn" onClick={() => moveStep(s.id, -1)} disabled={i === 0} aria-label="Move up"><ChevronUp size={16} /></button>
        <button className="icon-btn" onClick={() => moveStep(s.id, 1)} disabled={i === total - 1} aria-label="Move down"><ChevronDown size={16} /></button>
        <button className="icon-btn" onClick={toggle} aria-label="Change type" title="Change the milestone type"><Shapes size={15} /></button>
        <button className="icon-btn" onClick={() => removeStep(s.id)} aria-label="Remove"><Trash2 size={15} /></button>
      </div>
      <div className="flow-grid four">
        {!first && (
          <div className="q-block">
            <span className="field-label">Needed before moving on?</span>
            <Chips options={MODES} value={s.mode || 'Required'} onChange={(x) => setStep(s.id, 'mode', x)} small own={false} />
          </div>
        )}
        {!first && (
          <div className="q-block">
            <span className="field-label">Who has to act?</span>
            <Chips options={WHO} value={s.who || WHO[0]} onChange={(x) => setStep(s.id, 'who', x)} small own={false} />
          </div>
        )}
        <TextField label="People who reach it" inputMode="numeric" value={s.count} onChange={(x) => setStep(s.id, 'count', x.replace(/[^\d]/g, ''))} placeholder="optional" />
        {!first && <TextField label="Median hours after sign-up" inputMode="decimal" value={s.hours} onChange={(x) => setStep(s.id, 'hours', num(x))} placeholder="optional" />}
      </div>
      {open && (
        <div className="q-block">
          <span className="field-label">Milestone type</span>
          <div className="chip-row">
            {STEP_TYPES.map((t) => {
              const TI = iconFor(t.id);
              return <button key={t.id} title={t.hint} className={`chip sm ${s.type === t.id ? 'on' : ''}`} onClick={() => setStep(s.id, 'type', t.id)}><TI size={13} />{t.label}</button>;
            })}
            {custom && <button className="chip sm on custom"><Check size={12} />{s.type}</button>}
            <AddOwn small onAdd={(x) => setStep(s.id, 'type', x)} placeholder="Your milestone type" />
          </div>
          {!first && s.type !== 'signup' && (
            <div className="line-field">
              <TextField label="Alert line, %" hint={`Flag the milestone when fewer than this share of people at the one before get here. Default ${typeById(s.type)?.line ?? CUSTOM_LINE}%.`} inputMode="numeric" value={s.line ?? ''} onChange={(x) => setStep(s.id, 'line', x.replace(/[^\d]/g, '').slice(0, 3))} placeholder={String(typeById(s.type)?.line ?? CUSTOM_LINE)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MapSection(p) {
  const { form, set, a } = p;
  const [open, setOpen] = useState({});
  const hasWin = form.steps.some((s) => s.type === 'win');
  return (
    <div className="page">
      <PageHead
        icon={Map}
        eyebrow="Map activation"
        title="Find where new users stall after sign-up, and what to fix first."
        lede="List the milestones from sign-up to the first win and beyond, add counts and times if you have them, and paste what you know about the first week."
      >
        <div className="steps">
          <Step n="1" icon={Milestone} text="Map the milestones and add counts" />
          <Step n="2" icon={Sparkles} text="A model points at stuck moments in your notes" />
          <Step n="3" icon={Scale} text="Printed rules rank fixes and plan tests" />
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
          <Card icon={Lightbulb} title="The product" sub="Who signs up and what counts as activated">
            <div className="two">
              <TextField label="Name" value={form.name} onChange={(x) => set('name', x)} placeholder="Rota Kit" />
              <TextField label="What it does" value={form.pitch} onChange={(x) => set('pitch', x)} placeholder="Staff rotas for restaurants" />
            </div>
            <div className="q-block">
              <span className="field-label">Who signs up</span>
              <span className="field-hint">Sales-assisted accounts get longer time lines, rule T1.</span>
              <Chips options={SEGMENTS} value={form.segment} onChange={(x) => set('segment', x)} placeholder="Your segment" />
            </div>
            <div className="q-block">
              <span className="field-label">What counts as activated today?</span>
              <span className="field-hint">Rules D1 and D2 check this first.</span>
              <Chips options={WIN_DEFS} value={form.winDef} onChange={(x) => set('winDef', x)} hints={WIN_HINT} placeholder="Your definition" />
            </div>
            <div className="q-block">
              <span className="field-label">Activation window</span>
              <Chips options={WINDOWS} value={form.window} onChange={(x) => set('window', x)} placeholder="e.g. 21 days" />
            </div>
          </Card>

          <Card icon={Milestone} title="The milestones, in order" sub="From sign-up to the first win, then the next use. Counts and times are optional">
            {!hasWin && (
              <div className="notice warn"><TriangleAlert size={16} /><span>No first win on the ladder. Rule D1 flags it: add the moment the product first proves its value.</span></div>
            )}
            <div className="flow-list">
              {form.steps.map((s, i) => (
                <StepRow
                  key={s.id} s={s} i={i} total={form.steps.length} setStep={p.setStep} moveStep={p.moveStep} removeStep={p.removeStep}
                  open={!!open[s.id]} toggle={() => setOpen((o) => ({ ...o, [s.id]: !o[s.id] }))}
                />
              ))}
            </div>
            <div className="add-row">
              <span className="field-label">Add a milestone</span>
              <div className="chip-row">
                {STEP_TYPES.filter((t) => (t.id !== 'win' || !hasWin) && t.id !== 'signup').map((t) => {
                  const TI = iconFor(t.id);
                  return <button key={t.id} title={t.hint} className="chip sm" onClick={() => p.addStep(t.id)}><Plus size={12} /><TI size={13} /> {t.label}</button>;
                })}
                <AddOwn small onAdd={p.addStep} placeholder="Your milestone type" label="Your own milestone" />
              </div>
            </div>
          </Card>

          <Card icon={HandHelping} title="Help in place" sub="What new users see first and what reaches them in week one">
            <div className="q-block">
              <span className="field-label">First screen after sign-up</span>
              <Chips options={FIRST_SCREENS} value={form.firstScreen} onChange={(x) => set('firstScreen', x)} placeholder="Describe it" />
            </div>
            <div className="q-block">
              <span className="field-label">Help and nudges. Pick all that apply</span>
              <span className="field-hint">A welcome email alone does not count as a nudge, rule N1.</span>
              <MultiChips options={SUPPORT} value={form.support} onChange={(x) => set('support', x)} placeholder="e.g. Webinar" />
            </div>
          </Card>

          <Card icon={Split} title="Segments" sub="Optional. Activation rate by plan, source, role or company size">
            {(form.segments || []).map((s) => (
              <div key={s.id} className="seg-edit">
                <TextField label="Segment" value={s.name} onChange={(x) => p.setSeg(s.id, 'name', x)} placeholder="e.g. Agencies" />
                <TextField label="Activate, %" inputMode="decimal" value={s.rate} onChange={(x) => p.setSeg(s.id, 'rate', num(x).slice(0, 5))} placeholder="22" />
                <button className="icon-btn" onClick={() => p.removeSeg(s.id)} aria-label="Remove segment"><Trash2 size={15} /></button>
              </div>
            ))}
            <div className="chip-row"><button className="chip sm dashed" onClick={p.addSeg}><Plus size={12} /> Add a segment</button></div>
          </Card>

          <Card icon={Quote} title="Activation notes" sub="The model quotes these words back">
            <TextField
              area rows={9} value={form.notes} onChange={(x) => set('notes', x)}
              hint="Paste support tickets, interview notes, survey answers, what you saw in session recordings or the copy on the first screens. The more specific, the better."
              placeholder="What new users see first, what support hears in week one, where people say they got stuck, why they stopped coming back..."
            />
          </Card>
        </div>

        <div className="sticky-results">
          <div className={`panel live v-${VERDICTS[a.verdict].tone}`}>
            <div className="panel-title"><Scale size={16} /> Verdict, live</div>
            <div className="panel-sub">Printed rules, in your browser, no key.</div>
            <Verdict a={a} compact />
            <div className="live-meta">
              <span><OctagonX size={13} /> {a.bySev.High} high</span>
              <span><TriangleAlert size={13} /> {a.bySev.Medium} medium</span>
              <span><Info size={13} /> {a.bySev.Low} low</span>
            </div>
            <button className="link small" onClick={() => p.go('stuck')}>See the findings <ArrowRight size={12} /></button>
          </div>
          <div className="panel">
            <div className="panel-title"><KeyRound size={16} /> Read the notes</div>
            <div className="panel-sub">A model points at moments people stall, quoting your notes. It never scores or ranks them.</div>
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
            <button className="btn primary wide" onClick={p.read} disabled={p.busy}>
              {p.busy ? <><Loader2 size={16} className="spin" /> Reading your notes</> : <><Wand2 size={16} /> Find the stuck moments</>}
            </button>
            {p.error && <div className="error"><TriangleAlert size={16} /> {p.error}</div>}
          </div>
          <div className="panel">
            <div className="panel-title"><ListChecks size={16} /> What you get</div>
            <ul className="icon-list">
              <li><TrendingDown size={16} /> Where people stall, milestone by milestone</li>
              <li><Timer size={16} /> Where the time to the first win goes</li>
              <li><Filter size={16} /> Every stuck point, ranked, with its rule</li>
              <li><FlaskConical size={16} /> A test per fix, with what to measure and watch</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Where they stall ---------- */

function LadderSection({ form, a, go, loadedExample, stale }) {
  const L = a.lad;
  const max = Math.max(...L.rows.map((r) => r.count || 0), 1);
  const timed = L.wIdx > 0 ? L.rows.slice(1, L.wIdx + 1).filter((r) => r.hop !== null) : [];
  const maxHop = Math.max(...timed.map((r) => r.hop), 1);
  const slowest = timed.length ? timed.reduce((x, y) => (y.hop > x.hop ? y : x)) : null;
  const segs = (form.segments || []).filter((s) => s.name && String(s.rate).trim() !== '').map((s) => ({ ...s, r: Number(s.rate) }));
  const best = segs.length ? Math.max(...segs.map((s) => s.r)) : 0;
  const tl = timeLines(form.segment);
  let lastPhase = null;
  const phaseOfRow = (r) => (r.i === 0 ? null : L.wIdx >= 0 && r.i > L.wIdx ? 'stick' : 'before');
  return (
    <div className="page">
      <PageHead icon={TrendingDown} eyebrow="Where they stall" title={form.name || 'Untitled product'} lede={form.pitch}>
        <Notices loadedExample={loadedExample} stale={stale} go={go} />
      </PageHead>

      <Verdict a={a} />

      <div className="kpis">
        <Kpi icon={Trophy} label="Reach the first win" value={L.activation !== null ? `${L.activation}%` : 'n/a'} sub={L.activation !== null ? `Of sign-ups, ${form.window} window` : 'Add counts to see it'} tone={L.activation !== null && L.activation < 25 ? 'bad' : ''} />
        <Kpi icon={Timer} label="Time to first win" value={fmtHours(L.timeToWin)} sub={L.timeToWin !== null ? 'Median, for those who get there' : 'Add times to see it'} tone={L.timeToWin !== null && L.timeToWin > tl.medium ? 'warn' : ''} />
        <Kpi icon={Magnet} label="Come back after it" value={L.stick !== null ? `${L.stick}%` : 'n/a'} sub={L.stick !== null ? `Reach ${stepName(L.rows[L.sIdx].step)}` : 'Add a second-use milestone'} tone={L.stick !== null && L.stick < 40 ? 'bad' : ''} />
        <Kpi icon={Footprints} label="Required before the win" value={a.reqBetween} sub="Milestones between sign-up and the win" tone={a.reqBetween > 3 ? 'warn' : ''} />
      </div>

      <Card icon={TrendingDown} title="The ladder, milestone by milestone" sub="Bar = people who reach it. Above each, the share who get there from the milestone before, against its alert line">
        {!L.hasCounts && (
          <div className="notice"><Info size={16} /><span>No counts yet. The findings still stand on the rules alone (rule G3). <button className="link" onClick={() => go('map')}>Add counts</button> from your analytics to see the gaps.</span></div>
        )}
        <div className="funnel">
          {L.rows.map((r, i) => {
            const Icon = iconFor(r.step.type);
            const width = r.count !== null ? Math.max(4, (r.count / max) * 100) : 0;
            const isBig = L.biggest && L.biggest.i === r.i;
            const ph = phaseOfRow(r);
            const header = ph && ph !== lastPhase ? (ph === 'stick' ? 'After the first win' : 'On the way to the first win') : null;
            if (ph) lastPhase = ph;
            return (
              <div key={r.step.id} className="fn-row">
                {header && <div className="phase-line">{ph === 'stick' ? <Magnet size={13} /> : <Trophy size={13} />} {header}</div>}
                {i > 0 && (
                  <div className={`fn-drop ${r.gap ? 'leak' : ''} ${isBig ? 'big' : ''}`}>
                    {r.reach !== null ? (
                      <>
                        {r.gap ? <TriangleAlert size={13} /> : <CircleCheck size={13} />}
                        <b>{r.reach}%</b> get here · {fmt(r.lost)} stall · line {r.line}%
                        {isBig && <span className="big-tag">Biggest gap</span>}
                      </>
                    ) : (
                      <span className="muted">Line {r.line}%. Add counts here and at the milestone before to check it</span>
                    )}
                  </div>
                )}
                <div className="fn-head">
                  <span className="fn-icon"><Icon size={15} /></span>
                  <span className="fn-name">{i + 1}. {stepName(r.step)}</span>
                  {i > 0 && (r.step.mode || 'Required') === 'Optional' && <span className="src">Optional</span>}
                  {i > 0 && r.step.who === 'Needs someone else' && <span className="src warn"><Users size={11} /> Needs someone else</span>}
                  <span className="fn-count">{r.count !== null ? fmt(r.count) : 'no count'}{r.share !== null && i > 0 ? <span className="muted"> · {r.share}%</span> : null}</span>
                </div>
                <div className="fn-track"><div className={`fn-bar ${r.step.type === 'win' ? 'win' : ph === 'stick' ? 'stick' : ''}`} style={{ width: `${width}%` }} /></div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="cols">
        <Card icon={Hourglass} title="Where the time goes" sub="Median hours added at each milestone on the way to the first win">
          {timed.length ? (
            <div className="time-strip">
              {timed.map((r) => {
                const Icon = iconFor(r.step.type);
                const slow = slowest && slowest.i === r.i && r.hop > tl.hop;
                return (
                  <div key={r.step.id} className="ts-row">
                    <div className="ts-name"><Icon size={14} /><span>{stepName(r.step)}</span></div>
                    <div className="ts-track"><div className={`ts-bar ${slow ? 'slow' : ''}`} style={{ width: `${Math.max(3, (r.hop / maxHop) * 100)}%` }} /></div>
                    <div className="ts-val">+{fmtHours(r.hop)}</div>
                  </div>
                );
              })}
              <div className="muted small-note"><Clock size={13} /> Total to the first win: {fmtHours(L.timeToWin)}. Time lines: over {fmtHours(tl.medium)} is medium, over {fmtHours(tl.high)} is high (rule T1).</div>
            </div>
          ) : (
            <div className="empty"><Timer size={20} /><div>Add median hours after sign-up to each milestone up to the first win to see where the wait sits.</div></div>
          )}
        </Card>
        <Card icon={Split} title="Segments" sub="Each segment's activation rate against the best one (rule SG1)">
          {segs.length >= 2 ? (
            <div className="seg-list">
              {segs.map((s) => {
                const ratio = best > 0 ? s.r / best : 1;
                const tone = ratio < 0.4 ? 'bad' : ratio < 0.6 ? 'warn' : '';
                return (
                  <div key={s.id} className="seg-row">
                    <div className="seg-head"><Users size={14} /> {s.name}{tone && <span className={`src ${tone === 'bad' ? 'bad' : 'warn'}`}>{Math.round(ratio * 100)}% of the best</span>}<span className="seg-rate">{s.r}%</span></div>
                    <div className="ts-track"><div className={`ts-bar ${tone ? 'slow' : ''}`} style={{ width: `${Math.max(3, Math.min(100, s.r))}%` }} /></div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty"><Split size={20} /><div>Add two or more segments on <button className="link" onClick={() => go('map')}>Map activation</button> to compare who activates.</div></div>
          )}
        </Card>
      </div>

      <div className="cols">
        <Card icon={Flag} title="Rule trail" sub="Only these rules set the verdict">
          <div className="trail">
            {a.trail.map((t, i) => (
              <div key={i} className={`trail-row ${t.fired ? 'fired' : ''}`}>
                <span className="trail-rule">{t.rule}</span>
                <span>{t.text}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card icon={ListChecks} title="Top three to fix" sub="Full list on Stuck points">
          <div className="ranked">
            {a.ranked.slice(0, 3).map((f) => (
              <div key={f.key} className="ranked-row top">
                <span className="rank">{f.rank}</span>
                <div className="ranked-main">
                  <div className="ranked-belief">{f.title}</div>
                  <div className="bet-meta"><PhaseTag phase={f.phase} />{f.stepIdx !== null && <span className="muted">Milestone {f.stepIdx + 1}</span>}</div>
                </div>
                <SevPill sev={f.sev} score={f.score} />
              </div>
            ))}
            {!a.ranked.length && <div className="empty"><CircleCheck size={20} /><div>Nothing to fix. Keep counting each milestone.</div></div>}
          </div>
          {a.ranked.length > 0 && <button className="link small" onClick={() => go('fixes')}>See the fix plan <ArrowRight size={12} /></button>}
        </Card>
      </div>
    </div>
  );
}

/* ---------- Stuck points ---------- */

function Finding({ f, form, toggleHide, hidden }) {
  const step = f.stepIdx !== null ? form.steps[f.stepIdx] : null;
  return (
    <div className={`bet t-${SEVERITY[f.sev].tone} ${hidden ? 'hidden-f' : ''}`}>
      <div className="bet-top">
        {!hidden && <span className="rank">{f.rank}</span>}
        <div className="bet-titles">
          <div className="f-title">{f.title}</div>
          <div className="bet-meta">
            <PhaseTag phase={f.phase} />
            {step && <span className="cat-tag"><Milestone size={12} /> Milestone {f.stepIdx + 1}: {stepName(step)}</span>}
            <span className={`src ${f.model ? 'model' : ''}`}>{f.model ? <><Sparkles size={11} /> From your notes · {f.kind}</> : f.unexplained ? <><TrendingDown size={11} /> From your counts · G4</> : <><Scale size={11} /> Rule {f.id}</>}</span>
            {!f.model && f.noted && <span className="src model"><Quote size={11} /> Seen in your notes +1{f.raised ? `, raised by ${f.raised}` : ''}</span>}
            {f.gapPts > 0 && <span className="src warn"><TrendingDown size={11} /> Gap here +{f.gapPts + f.bigPts}</span>}
          </div>
        </div>
        <SevPill sev={f.sev} score={hidden ? undefined : f.score} />
        <button className="icon-btn" onClick={() => toggleHide(f.key)} aria-label={hidden ? 'Show' : 'Hide'} title={hidden ? 'Bring it back' : 'Hide it (rule R3)'}>{hidden ? <Eye size={15} /> : <EyeOff size={15} />}</button>
      </div>
      {(f.quotes || []).map((q, i) => <blockquote key={i}><Quote size={13} /> {q}</blockquote>)}
      <div className="signal-why">{f.why}</div>
    </div>
  );
}

function StuckSection({ form, a, go, loadedExample, stale, parsed, checked, toggleHide }) {
  const [phase, setPhase] = useState('all');
  const list = a.ranked.filter((f) => phase === 'all' || f.phase === phase);
  const hasModel = !!(parsed.summary || parsed.moments.length);
  return (
    <div className="page">
      <PageHead icon={Filter} eyebrow="Stuck points" title="Where new users stall, worst first" lede="Rules check the shape of the ladder. A model reads your notes and every quote is checked against them. Hide anything that does not apply and the verdict updates.">
        <Notices loadedExample={loadedExample} stale={stale} go={go} />
      </PageHead>

      <div className="phase-strip">
        <button className={`phase-tile ${phase === 'all' ? 'on' : ''}`} onClick={() => setPhase('all')}>
          <ListChecks size={18} /><span className="pt-n">{a.ranked.length}</span><span className="pt-l">All findings</span>
        </button>
        {Object.entries(PHASES).map(([id, ph]) => {
          const Icon = PHASE_ICONS[id];
          return (
            <button key={id} className={`phase-tile ${phase === id ? 'on' : ''}`} onClick={() => setPhase(id)}>
              <Icon size={18} /><span className="pt-n">{a.byPhase[id].length}</span><span className="pt-l">{ph.label}</span>
            </button>
          );
        })}
      </div>

      <div className="cols wide-left">
        <div className="col">
          <div className="bets">
            {list.map((f) => <Finding key={f.key} f={f} form={form} toggleHide={toggleHide} />)}
            {!list.length && <div className="empty"><CircleCheck size={22} /><div>Nothing here. {phase !== 'all' && <button className="link" onClick={() => setPhase('all')}>Show every phase</button>}</div></div>}
          </div>
          {a.hidden.length > 0 && (
            <>
              <div className="sub-head"><EyeOff size={14} /> Hidden by you</div>
              <div className="bets">{a.hidden.map((f) => <Finding key={f.key} f={f} form={form} toggleHide={toggleHide} hidden />)}</div>
            </>
          )}
        </div>
        <div className="col">
          <Card icon={Sparkles} title="Read of your notes" sub="Each quote checked against the notes before it counts">
            {!hasModel ? (
              <div className="empty"><Bot size={22} /><div>No read yet. <button className="link" onClick={() => go('map')}>Paste your notes and run it</button>, or open an example.</div></div>
            ) : (
              <>
                {parsed.summary && <p className="summary"><Bot size={15} /> {parsed.summary}</p>}
                <div className="agree"><ShieldCheck size={14} /> {pl(checked.kept.length, 'moment')} passed rules M1 and M2. Those that match a rule finding join it as evidence (rule M4).</div>
                {checked.dropped.length > 0 && (
                  <div className="dropped"><Info size={14} /> {pl(checked.dropped.length, 'moment')} dropped: {checked.dropped.map((d) => `"${d.quote}" (${d.reason.toLowerCase()})`).join('; ')}.</div>
                )}
              </>
            )}
          </Card>
          <Card icon={Scale} title="How severity is set" sub="Rule M3 for notes, the D, P, T, N, H and SG rules for the ladder">
            <ul className="icon-list">
              {KINDS.map((k) => {
                const Icon = SEV_ICONS[k.sev];
                return <li key={k.id}><Icon size={16} /> <span><b>{k.id}</b> is {k.sev.toLowerCase()}. <span className="muted">{k.ask}.</span></span></li>;
              })}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------- Fix plan ---------- */

function FixSection({ form, a, go, loadedExample, stale, parsed }) {
  const [showAll, setShowAll] = useState(false);
  const list = showAll ? a.ranked : a.ranked.slice(0, 5);
  return (
    <div className="page">
      <PageHead
        icon={Wrench} eyebrow="Fix plan"
        title={a.ranked.length ? 'Change one thing at a time, and measure it' : 'Nothing to fix right now'}
        lede="Each fix comes with the change to test, the number that says whether it worked, and the number to watch so the fix does not break something else. Run them in order, one at a time, so you can tell which change did what."
      >
        <Notices loadedExample={loadedExample} stale={stale} go={go} />
      </PageHead>

      <div className="runs single">
        {list.map((f) => {
          const step = f.stepIdx !== null ? form.steps[f.stepIdx] : null;
          return (
            <section key={f.key} className="run">
              <div className="run-top">
                <span className="run-n">{f.rank}</span>
                <div className="run-titles">
                  <div className="run-name">{f.title}</div>
                  <div className="run-when"><SevPill sev={f.sev} /> <PhaseTag phase={f.phase} />{step && <span className="muted">Milestone {f.stepIdx + 1}: {stepName(step)}</span>}</div>
                </div>
              </div>
              <div className="fix-line"><Hammer size={16} /><div><span>Fix</span><b>{f.lib.fix}</b></div></div>
              <div className="run-facts three">
                <div><FlaskConical size={14} /><span>Test</span><b>{f.lib.change}</b></div>
                <div><Ruler size={14} /><span>Measure</span><b>{f.lib.metric}</b></div>
                <div><Eye size={14} /><span>Watch</span><b>{f.lib.guard}</b></div>
              </div>
            </section>
          );
        })}
      </div>
      {a.ranked.length > 5 && (
        <button className="btn small center" onClick={() => setShowAll((x) => !x)}>{showAll ? 'Show the top five' : `Show all ${a.ranked.length}`}</button>
      )}

      <div className="cols">
        <Card icon={Search} title="Check in your data first" sub="From the read of your notes. Answer these before you change anything big">
          {parsed.questions.length ? (
            <ul className="q-list">{parsed.questions.map((q, i) => <li key={i}><CircleHelp size={15} /> {q}</li>)}</ul>
          ) : (
            <div className="empty"><CircleHelp size={20} /><div>Run the read on Map activation to get questions drawn from your notes.</div></div>
          )}
        </Card>
        <Card icon={Hourglass} title="Before each test" sub="Agree these with design, engineering and whoever owns the number">
          <ul className="icon-list">
            <li><Target size={16} /> The activation event you are judging against, written down</li>
            <li><Users size={16} /> Enough sign-ups in each group to tell the difference, or a before-and-after window with nothing else shipping</li>
            <li><Eye size={16} /> The watch number, and the level that stops the test early</li>
            <li><BellRing size={16} /> Who reads the result, and when</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

/* ---------- Report ---------- */

function ReportSection({ report, copyText, copied, download, error }) {
  const text = report();
  return (
    <div className="page">
      <PageHead icon={FileText} eyebrow="Report" title="A review to share with the team" lede="It carries the verdict, the ladder with its counts and times, every fix in order with its test, and the questions to check. Paste it into an email, Notion, Confluence or a ticket." />
      <Card
        icon={FileText} title="Activation gap review" sub="Markdown"
        right={<div className="btn-row"><button className="btn small" onClick={() => copyText(text, 'report')}>{copied === 'report' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}</button><button className="btn small" onClick={download}><Download size={14} /> Download</button></div>}
      >
        <pre className="report">{text}</pre>
        {error && <div className="error"><TriangleAlert size={16} /> {error}</div>}
      </Card>
    </div>
  );
}

/* ---------- How it works ---------- */

function HowSection() {
  return (
    <div className="page">
      <PageHead icon={Scale} eyebrow="How it works" title="Rules decide. A model reads." lede="The same ladder should get the same verdict every time, so every finding, score, ranking, fix and test comes from printed rules. The model does the one thing rules cannot: read a page of tickets and interview notes and point at the moments people stall." />
      <div className="cols">
        <div className="col">
          <Card icon={Scale} title="The rules">
            <div className="rule-table">
              {RULES_TABLE.map(([r, t]) => <div key={r} className="rule-row"><span className="trail-rule">{r}</span><span>{t}</span></div>)}
            </div>
          </Card>
        </div>
        <div className="col">
          <Card icon={Ruler} title="Alert lines" sub="Flag a milestone when fewer than this share of people at the one before get there">
            <div className="line-grid">
              {STEP_TYPES.filter((t) => t.line !== null).map((t) => {
                const Icon = iconFor(t.id);
                return <div key={t.id} className="line-cell"><Icon size={14} /><span>{t.label}</span><b>{t.line}%</b></div>;
              })}
              <div className="line-cell"><Shapes size={14} /><span>Your own type</span><b>{CUSTOM_LINE}%</b></div>
            </div>
          </Card>
          <Card icon={Info} title="Where the numbers come from">
            <ul className="icon-list">
              <li><Ruler size={16} /> The alert lines and time lines are starting points I set from running onboarding and customer success for SaaS products. They are not published benchmarks. Your own history is a better line</li>
              <li><Users size={16} /> The worked examples, their counts and their times are invented to show how the tool reads a ladder</li>
              <li><Lightbulb size={16} /> The rules follow common activation practice: one agreed first win tied to a real result, value before setup, one person able to get there alone, and a reason to come back afterwards</li>
            </ul>
          </Card>
          <Card icon={MonitorSmartphone} title="What it cannot do">
            <p className="panel-text">It sees only the milestones, counts, times and notes you give it. It cannot see your product, so a problem nobody wrote down stays invisible unless it shows up as a gap. Counts from different tools, date ranges or cohorts can make a milestone look worse than it is, and a median time hides a long tail. It does not run the tests, and a fix that lifts one segment can hurt another.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------- Examples ---------- */

function ExamplesSection({ loadExample, loadedExample, startBlank }) {
  return (
    <div className="page">
      <PageHead icon={Layers} eyebrow="Examples" title="Three products, three verdicts" lede="Each loads with a saved read of its notes, so it works without a key. All three products are invented." />
      <div className="examples">
        {EXAMPLES.map((ex) => {
          const r = assess(ex.form, checkMoments(parseReply(ex.text), ex.form).kept);
          const v = VERDICTS[r.verdict];
          const VIcon = VERDICT_ICONS[r.verdict];
          return (
            <div key={ex.id} className={`example ${loadedExample === ex.id ? 'on' : ''}`}>
              <div className="example-sector">{ex.sector}</div>
              <div className="example-title">{ex.title}</div>
              <div className={`side-verdict v-${v.tone} inline`}><VIcon size={14} /> {v.label}</div>
              <p>{ex.blurb}</p>
              <div className="example-meta"><Trophy size={13} /> {r.lad.activation}% reach the first win · {fmtHours(r.lad.timeToWin)}</div>
              <button className="btn primary" onClick={() => loadExample(ex)}>{loadedExample === ex.id ? <><Check size={15} /> Loaded</> : <>Open it <ArrowRight size={15} /></>}</button>
            </div>
          );
        })}
      </div>
      <div className="notice"><Map size={16} /><span>Have your own product? <button className="link" onClick={startBlank}>Start blank</button>.</span></div>
    </div>
  );
}
