import React, { useMemo, useRef, useState } from 'react';
import {
  DoorOpen, MousePointerClick, ClipboardList, UserCheck, Building2, Lock, MailCheck, Smartphone, MessageCircleQuestion,
  LayoutDashboard, Tags, CreditCard, UserPlus, Plug, KeyRound, Compass, Sparkles, Shapes, Map, Filter, TrendingDown,
  Wrench, FileText, Scale, Layers, Info, TriangleAlert, Loader2, Check, X, Plus, Copy, Download, ArrowRight, Wand2,
  Quote, Lightbulb, Bot, CircleHelp, Trash2, ListChecks, Flag, Gauge, Ruler, CircleCheck, OctagonX, Eye, EyeOff, Users,
  ShieldCheck, ChevronDown, ChevronUp, LogIn, Footprints, FlaskConical, Target, Hammer, Signpost, Hourglass, Search
} from 'lucide-react';
import {
  SEGMENTS, ENTRIES, ENTRY_HINT, MODES, SIGNIN, STEP_TYPES, PHASES, SEVERITY, KINDS, VERDICTS, RULES_TABLE, CUSTOM_LINE,
  typeById, typeLabel, assess, parseReply, checkMoments, reportMarkdown
} from './rules.js';
import { EXAMPLES } from './examples.js';

const SECTIONS = [
  { id: 'map', icon: Map, label: 'Map the flow', desc: 'Your steps, counts, sign-in and notes' },
  { id: 'funnel', icon: TrendingDown, label: 'Where they leave', desc: 'Each step, who moves on and who does not' },
  { id: 'friction', icon: Filter, label: 'Friction found', desc: 'Every finding, ranked, with its reason' },
  { id: 'fixes', icon: Wrench, label: 'Fix plan', desc: 'What to change first and how to test it' },
  { id: 'report', icon: FileText, label: 'Report', desc: 'A write-up to share with the team' },
  { id: 'how', icon: Scale, label: 'How it works', desc: 'The printed rules and alert lines' },
  { id: 'examples', icon: Layers, label: 'Examples', desc: 'Three worked flows, no key needed' }
];

const TYPE_ICONS = {
  landing: MousePointerClick, account: ClipboardList, social: UserCheck, sso: Building2, password: Lock, verify: MailCheck,
  phone: Smartphone, questions: MessageCircleQuestion, workspace: LayoutDashboard, plan: Tags, payment: CreditCard,
  invite: UserPlus, connect: Plug, apikey: KeyRound, tour: Compass, value: Sparkles
};
const iconFor = (type) => TYPE_ICONS[type] || Shapes;
const PHASE_ICONS = { signup: DoorOpen, value: Signpost, signin: LogIn };
const VERDICT_ICONS = { unblock: OctagonX, signin: LogIn, smooth: Wrench, tune: Gauge };
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
const slug = (s) => (s || 'flow').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
const stepName = (s) => s.label || typeLabel(s);

const BLANK = {
  name: '', pitch: '', segment: SEGMENTS[0], entry: ENTRIES[0], signin: ['Email and password', 'Self-serve password reset'], notes: '',
  steps: [
    { id: uid(), type: 'account', label: '', mode: 'Required', fields: '', count: '' },
    { id: uid(), type: 'value', label: '', mode: 'Required', fields: '', count: '' }
  ]
};

export default function App() {
  const today = useMemo(() => new Date(), []);
  const [section, setSection] = useState('funnel');
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
  const set = (k, v) => {
    setLoadedExample(null);
    setForm((f) => ({ ...f, [k]: v }));
  };
  const setStep = (id, k, v) => {
    setLoadedExample(null);
    setForm((f) => ({ ...f, steps: f.steps.map((s) => (s.id === id ? { ...s, [k]: v } : s)) }));
  };
  const addStep = (type) => {
    setLoadedExample(null);
    setForm((f) => {
      const s = { id: uid(), type, label: '', mode: 'Required', fields: '', count: '' };
      const vIdx = f.steps.findIndex((x) => x.type === 'value');
      const steps = [...f.steps];
      if (type !== 'value' && vIdx >= 0) steps.splice(vIdx, 0, s);
      else steps.push(s);
      return { ...f, steps };
    });
  };
  const moveStep = (id, dir) => {
    setLoadedExample(null);
    setForm((f) => {
      const i = f.steps.findIndex((s) => s.id === id);
      const j = i + dir;
      if (j < 0 || j >= f.steps.length) return f;
      const steps = [...f.steps];
      [steps[i], steps[j]] = [steps[j], steps[i]];
      return { ...f, steps };
    });
  };
  const removeStep = (id) => {
    setLoadedExample(null);
    setForm((f) => ({ ...f, steps: f.steps.filter((s) => s.id !== id) }));
  };
  const toggleHide = (key) => setDismissed((d) => ({ ...d, [key]: !d[key] }));

  const loadExample = (ex) => {
    setForm(ex.form);
    setLoadedExample(ex.id);
    setModelText(ex.text);
    setModelNotes(ex.form.notes);
    setDismissed({});
    setError('');
    go('funnel');
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
      setError('Write a few sentences about the flow first: what people see, what support hears, where they get stuck.');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider, apiKey, model, name: form.name, pitch: form.pitch, segment: form.segment, entry: form.entry,
          signin: form.signin, steps: form.steps.map((s) => ({ type: s.type, label: s.label, mode: s.mode })), notes: form.notes
        })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
      const p = parseReply(data.text);
      if (!p.summary && !p.moments.length) throw new Error('The model replied, but not in the expected format. Try again or switch provider.');
      setModelText(data.text);
      setModelNotes(form.notes);
      setDismissed({});
      go('friction');
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
    el.download = `${slug(form.name)}-front-door-review.md`;
    el.click();
    URL.revokeObjectURL(url);
  };

  const v = VERDICTS[a.verdict];
  const VIcon = VERDICT_ICONS[a.verdict];
  const common = { form, a, go, loadedExample, stale };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><DoorOpen size={20} /></div>
          <div>
            <div className="brand-name">Front Door</div>
            <div className="brand-sub">Find where sign-up loses people</div>
          </div>
        </div>
        <nav className="nav">
          {SECTIONS.map((s) => (
            <button key={s.id} className={`nav-item ${section === s.id ? 'active' : ''}`} onClick={() => go(s.id)}>
              <s.icon size={18} className="nav-icon" />
              <span className="nav-text">
                <span className="nav-label">{s.label}{s.id === 'friction' && a.ranked.length > 0 && <span className="nav-badge">{a.ranked.length}</span>}</span>
                <span className="nav-desc">{s.desc}</span>
              </span>
            </button>
          ))}
        </nav>
        <div className="side-plan">
          <div className="side-label">Current flow</div>
          <div className="side-name">{form.name || 'Untitled flow'}</div>
          <div className={`side-verdict v-${v.tone}`}><VIcon size={14} /> {v.label}</div>
          {a.fl.biggest && <div className="side-meta"><TrendingDown size={13} /> <span>Biggest leak: {stepName(a.fl.biggest.step)}, {fmt(a.fl.biggest.lost)} lost</span></div>}
          {a.fl.overall !== null && <div className="side-meta"><Target size={13} /> {a.fl.overall}% reach first value</div>}
          <div className="side-meta"><Footprints size={13} /> {a.vIdx >= 0 ? `${pl(a.beforeCount, 'step')} before value` : 'No first value step yet'}</div>
        </div>
        <div className="side-foot">A daily AI build by Prerna Kakkar. Printed rules decide. A model only reads your notes.</div>
      </aside>

      <main className="main" ref={mainRef}>
        {section === 'map' && (
          <MapSection
            {...common} set={set} setStep={setStep} addStep={addStep} moveStep={moveStep} removeStep={removeStep} startBlank={startBlank}
            provider={provider} setProvider={setProvider} apiKey={apiKey} setApiKey={setApiKey} model={model} setModel={setModel}
            busy={busy} error={error} read={read}
          />
        )}
        {section === 'funnel' && <FunnelSection {...common} />}
        {section === 'friction' && <FrictionSection {...common} parsed={parsed} checked={checked} toggleHide={toggleHide} />}
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
  return <span className={`cat-tag ${step.type === 'value' ? 'core' : ''}`}><Icon size={12} /> {typeLabel(step)}</span>;
}

function Notices({ loadedExample, stale, go }) {
  return (
    <>
      {loadedExample && (
        <div className="notice">
          <Info size={16} />
          <span>Worked example with a saved read of its notes. <button className="link" onClick={() => go('map')}>Change any step</button> and the rules run again at once.</span>
        </div>
      )}
      {stale && (
        <div className="notice warn">
          <TriangleAlert size={16} />
          <span>Your notes changed after the model read them. The rule findings are current. <button className="link" onClick={() => go('map')}>Read the notes again</button> to refresh the moments.</span>
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
        <div className="hero-score-n">{a.fl.overall !== null ? `${a.fl.overall}%` : a.ranked.length}</div>
        <div className="hero-score-l">{a.fl.overall !== null ? 'reach first value' : a.ranked.length === 1 ? 'finding' : 'findings'}</div>
      </div>
    </div>
  );
}

/* ---------- Map the flow ---------- */

function StepRow({ s, i, total, setStep, moveStep, removeStep, open, toggle }) {
  const Icon = iconFor(s.type);
  const custom = !typeById(s.type);
  return (
    <div className={`flow-step ${s.type === 'value' ? 'is-value' : ''}`}>
      <div className="flow-top">
        <span className="flow-n"><Icon size={16} /></span>
        <div className="flow-titles">
          <input className="flow-label" value={s.label} onChange={(e) => setStep(s.id, 'label', e.target.value)} placeholder={typeLabel(s)} />
          <div className="bet-meta">
            <span className="muted">Step {i + 1}</span>
            <TypeTag step={s} />
            {custom && <span className="src warn"><Info size={11} /> Your own type, rule A1</span>}
          </div>
        </div>
        <button className="icon-btn" onClick={() => moveStep(s.id, -1)} disabled={i === 0} aria-label="Move up"><ChevronUp size={16} /></button>
        <button className="icon-btn" onClick={() => moveStep(s.id, 1)} disabled={i === total - 1} aria-label="Move down"><ChevronDown size={16} /></button>
        <button className="icon-btn" onClick={toggle} aria-label="Change type" title="Change the step type"><Shapes size={15} /></button>
        <button className="icon-btn" onClick={() => removeStep(s.id)} aria-label="Remove"><Trash2 size={15} /></button>
      </div>
      <div className="flow-grid">
        <div className="q-block">
          <span className="field-label">Can people skip it?</span>
          <Chips options={MODES} value={s.mode || 'Required'} onChange={(x) => setStep(s.id, 'mode', x)} small own={false} />
        </div>
        <TextField label="Fields or questions" inputMode="numeric" value={s.fields} onChange={(x) => setStep(s.id, 'fields', x.replace(/[^\d]/g, ''))} placeholder="e.g. 5" />
        <TextField label="People who reach it" inputMode="numeric" value={s.count} onChange={(x) => setStep(s.id, 'count', x.replace(/[^\d]/g, ''))} placeholder="optional" />
      </div>
      {open && (
        <div className="q-block">
          <span className="field-label">Step type</span>
          <div className="chip-row">
            {STEP_TYPES.map((t) => {
              const TI = iconFor(t.id);
              return <button key={t.id} title={t.hint} className={`chip sm ${s.type === t.id ? 'on' : ''}`} onClick={() => setStep(s.id, 'type', t.id)}><TI size={13} />{t.label}</button>;
            })}
            {custom && <button className="chip sm on custom"><Check size={12} />{s.type}</button>}
            <AddOwn small onAdd={(x) => setStep(s.id, 'type', x)} placeholder="Your step type" />
          </div>
          {s.type !== 'value' && (
            <div className="line-field">
              <TextField label="Alert line, %" hint={`Flag the step when fewer than this share move on. Default ${typeById(s.type)?.line ?? CUSTOM_LINE}%.`} inputMode="numeric" value={s.line ?? ''} onChange={(x) => setStep(s.id, 'line', x.replace(/[^\d]/g, '').slice(0, 3))} placeholder={String(typeById(s.type)?.line ?? CUSTOM_LINE)} />
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
  const hasValue = form.steps.some((s) => s.type === 'value');
  return (
    <div className="page">
      <PageHead
        icon={Map}
        eyebrow="Map the flow"
        title="Find where your sign-up loses people, and what to fix first."
        lede="List the steps from the sign-up button to the first moment the product works for someone, add counts if you have them, and paste what you know about the flow."
      >
        <div className="steps">
          <Step n="1" icon={Footprints} text="Map the steps and add counts" />
          <Step n="2" icon={Sparkles} text="A model points at struggles in your notes" />
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
          <Card icon={Lightbulb} title="The product" sub="Who signs up and how they start">
            <div className="two">
              <TextField label="Name" value={form.name} onChange={(x) => set('name', x)} placeholder="Ledgerly" />
              <TextField label="What it does" value={form.pitch} onChange={(x) => set('pitch', x)} placeholder="Invoices for freelancers" />
            </div>
            <div className="q-block">
              <span className="field-label">Who signs up</span>
              <span className="field-hint">Teams and enterprise trials get the single sign-on check, rule F12.</span>
              <Chips options={SEGMENTS} value={form.segment} onChange={(x) => set('segment', x)} placeholder="Your segment" />
            </div>
            <div className="q-block">
              <span className="field-label">How people start</span>
              <Chips options={ENTRIES} value={form.entry} onChange={(x) => set('entry', x)} hints={ENTRY_HINT} placeholder="Your start" />
            </div>
          </Card>

          <Card icon={Footprints} title="The steps, in order" sub="From the sign-up button to first value. Counts are optional">
            {!hasValue && (
              <div className="notice warn"><TriangleAlert size={16} /><span>No first value step. Rule F8 flags it: add the moment the product first does its job for someone.</span></div>
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
              <span className="field-label">Add a step</span>
              <div className="chip-row">
                {STEP_TYPES.filter((t) => t.id !== 'value' || !hasValue).map((t) => {
                  const TI = iconFor(t.id);
                  return <button key={t.id} title={t.hint} className="chip sm" onClick={() => p.addStep(t.id)}><Plus size={12} /><TI size={13} /> {t.label}</button>;
                })}
                <AddOwn small onAdd={p.addStep} placeholder="Your step type" label="Your own step" />
              </div>
            </div>
          </Card>

          <Card icon={LogIn} title="Coming back" sub="How returning people sign in. Pick all that apply">
            <MultiChips options={SIGNIN} value={form.signin} onChange={(x) => set('signin', x)} placeholder="e.g. GitHub" />
          </Card>

          <Card icon={Quote} title="Flow notes" sub="The model quotes these words back">
            <TextField
              area rows={9} value={form.notes} onChange={(x) => set('notes', x)}
              hint="Paste screen copy, error messages, support tickets, interview notes or what you saw in session recordings. The more specific, the better."
              placeholder="What each screen says, what support hears every week, where people say they got stuck, what breaks..."
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
            <button className="link small" onClick={() => p.go('friction')}>See the findings <ArrowRight size={12} /></button>
          </div>
          <div className="panel">
            <div className="panel-title"><KeyRound size={16} /> Read the notes</div>
            <div className="panel-sub">A model points at moments people struggle, quoting your notes. It never scores or ranks them.</div>
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
              {p.busy ? <><Loader2 size={16} className="spin" /> Reading your notes</> : <><Wand2 size={16} /> Find the struggles</>}
            </button>
            {p.error && <div className="error"><TriangleAlert size={16} /> {p.error}</div>}
          </div>
          <div className="panel">
            <div className="panel-title"><ListChecks size={16} /> What you get</div>
            <ul className="icon-list">
              <li><TrendingDown size={16} /> Where people leave, step by step</li>
              <li><Filter size={16} /> Every friction point, ranked, with its rule</li>
              <li><FlaskConical size={16} /> A test per fix, with what to measure and watch</li>
              <li><Search size={16} /> Questions to check in your data</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Where they leave ---------- */

function FunnelSection({ form, a, go, loadedExample, stale }) {
  const { fl } = a;
  const max = Math.max(...fl.rows.map((r) => r.count || 0), 1);
  return (
    <div className="page">
      <PageHead icon={TrendingDown} eyebrow="Where they leave" title={form.name || 'Untitled flow'} lede={form.pitch}>
        <Notices loadedExample={loadedExample} stale={stale} go={go} />
      </PageHead>

      <Verdict a={a} />

      <div className="kpis">
        <Kpi icon={Target} label="Reach first value" value={fl.overall !== null ? `${fl.overall}%` : 'n/a'} sub={fl.overall !== null ? 'Of people at step 1' : 'Add counts to see it'} tone={fl.overall !== null && fl.overall < 30 ? 'bad' : ''} />
        <Kpi icon={TrendingDown} label="Biggest leak" value={fl.biggest ? fmt(fl.biggest.lost) : 'n/a'} sub={fl.biggest ? `After ${stepName(fl.biggest.step)}` : 'Add counts to see it'} tone={fl.biggest ? 'warn' : ''} />
        <Kpi icon={Footprints} label="Steps before value" value={a.vIdx >= 0 ? a.beforeCount : '?'} sub={`${a.requiredBefore} required`} tone={a.beforeCount > 5 ? 'warn' : ''} />
        <Kpi icon={ClipboardList} label="Fields before value" value={a.fieldsBefore} sub="On required steps" />
      </div>

      <Card icon={TrendingDown} title="The flow, step by step" sub="Bar = people who reach the step. Under each, the share who move on, against its alert line">
        {!fl.hasCounts && (
          <div className="notice"><Info size={16} /><span>No counts yet. The findings still stand on the rules alone (rule L3). <button className="link" onClick={() => go('map')}>Add counts</button> from your analytics to see the leaks.</span></div>
        )}
        <div className="funnel">
          {fl.rows.map((r, i) => {
            const Icon = iconFor(r.step.type);
            const width = r.count !== null ? Math.max(4, (r.count / max) * 100) : 0;
            const isBig = fl.biggest && fl.biggest.i === r.i;
            return (
              <div key={r.step.id} className="fn-row">
                <div className="fn-head">
                  <span className="fn-icon"><Icon size={15} /></span>
                  <span className="fn-name">{i + 1}. {stepName(r.step)}</span>
                  {(r.step.mode || 'Required') === 'Skippable' && <span className="src">Skippable</span>}
                  <span className="fn-count">{r.count !== null ? fmt(r.count) : 'no count'}{r.share !== null && i > 0 ? <span className="muted"> · {r.share}%</span> : null}</span>
                </div>
                <div className="fn-track"><div className={`fn-bar ${r.step.type === 'value' ? 'value' : ''}`} style={{ width: `${width}%` }} /></div>
                {i < fl.rows.length - 1 && (
                  <div className={`fn-drop ${r.leak ? 'leak' : ''} ${isBig ? 'big' : ''}`}>
                    {r.kept !== null ? (
                      <>
                        {r.leak ? <TriangleAlert size={13} /> : <CircleCheck size={13} />}
                        <b>{r.kept}%</b> move on · {fmt(r.lost)} leave · line {r.line}%
                        {isBig && <span className="big-tag">Biggest leak</span>}
                      </>
                    ) : (
                      <span className="muted">Line {r.line}%. Add counts here and at the next step to check it</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

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
        <Card icon={ListChecks} title="Top three to fix" sub="Full list on Friction found">
          <div className="ranked">
            {a.ranked.slice(0, 3).map((f) => (
              <div key={f.key} className="ranked-row top">
                <span className="rank">{f.rank}</span>
                <div className="ranked-main">
                  <div className="ranked-belief">{f.title}</div>
                  <div className="bet-meta"><PhaseTag phase={f.phase} />{f.stepIdx !== null && <span className="muted">Step {f.stepIdx + 1}</span>}</div>
                </div>
                <SevPill sev={f.sev} score={f.score} />
              </div>
            ))}
            {!a.ranked.length && <div className="empty"><CircleCheck size={20} /><div>Nothing to fix. Keep counting each step.</div></div>}
          </div>
          {a.ranked.length > 0 && <button className="link small" onClick={() => go('fixes')}>See the fix plan <ArrowRight size={12} /></button>}
        </Card>
      </div>
    </div>
  );
}

/* ---------- Friction found ---------- */

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
            {step && <span className="cat-tag"><Footprints size={12} /> Step {f.stepIdx + 1}: {stepName(step)}</span>}
            <span className={`src ${f.model ? 'model' : ''}`}>{f.model ? <><Sparkles size={11} /> From your notes · {f.kind}</> : f.unexplained ? <><TrendingDown size={11} /> From your counts · L4</> : <><Scale size={11} /> Rule {f.id}</>}</span>
            {!f.model && f.noted && <span className="src model"><Quote size={11} /> Seen in your notes +1{f.raised ? `, raised by ${f.raised}` : ''}</span>}
            {f.leakPts > 0 && <span className="src warn"><TrendingDown size={11} /> Step leaks +{f.leakPts + f.bigPts}</span>}
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

function FrictionSection({ form, a, go, loadedExample, stale, parsed, checked, toggleHide }) {
  const [phase, setPhase] = useState('all');
  const list = a.ranked.filter((f) => phase === 'all' || f.phase === phase);
  const hasModel = !!(parsed.summary || parsed.moments.length);
  return (
    <div className="page">
      <PageHead icon={Filter} eyebrow="Friction found" title="Where people struggle, worst first" lede="Rules check the shape of the flow. A model reads your notes and every quote is checked against them. Hide anything that does not apply and the verdict updates.">
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
                <div className="agree"><ShieldCheck size={14} /> {pl(checked.kept.length, 'moment')} passed rules M1 and M2. Those on a step a rule already flags join that finding as evidence (rule M4).</div>
                {checked.dropped.length > 0 && (
                  <div className="dropped"><Info size={14} /> {pl(checked.dropped.length, 'moment')} dropped: {checked.dropped.map((d) => `"${d.quote}" (${d.reason.toLowerCase()})`).join('; ')}.</div>
                )}
              </>
            )}
          </Card>
          <Card icon={Scale} title="How severity is set" sub="Rule M3 for notes, the F and S rules for the flow">
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
        lede="Each fix comes with the change to test, the number that says whether it worked, and the number to watch so the fix does not break something else. Run them in order, one per step, so you can tell which change did what."
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
                  <div className="run-when"><SevPill sev={f.sev} /> <PhaseTag phase={f.phase} />{step && <span className="muted">Step {f.stepIdx + 1}: {stepName(step)}</span>}</div>
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
            <div className="empty"><CircleHelp size={20} /><div>Run the read on Map the flow to get questions drawn from your notes.</div></div>
          )}
        </Card>
        <Card icon={Hourglass} title="Before each test" sub="Agree these with design, engineering and whoever owns the number">
          <ul className="icon-list">
            <li><Ruler size={16} /> The number that decides it, and how big a change counts</li>
            <li><Users size={16} /> Enough sign-ups in each group to tell the difference, or a before-and-after window with nothing else shipping</li>
            <li><Eye size={16} /> The watch number, and the level that stops the test early</li>
            <li><Flag size={16} /> Who reads the result and decides</li>
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
      <PageHead icon={FileText} eyebrow="Report" title="A review to share with the team" lede="It carries the verdict, the flow with its counts, every fix in order with its test, and the questions to check. Paste it into an email, Notion, Confluence or a ticket." />
      <Card
        icon={FileText} title="Front door review" sub="Markdown"
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
      <PageHead icon={Scale} eyebrow="How it works" title="Rules decide. A model reads." lede="The same flow should get the same verdict every time, so every finding, score, ranking, fix and test comes from printed rules. The model does the one thing rules cannot: read a page of tickets and notes and point at the moments people struggle." />
      <div className="cols">
        <div className="col">
          <Card icon={Scale} title="The rules">
            <div className="rule-table">
              {RULES_TABLE.map(([r, t]) => <div key={r} className="rule-row"><span className="trail-rule">{r}</span><span>{t}</span></div>)}
            </div>
          </Card>
        </div>
        <div className="col">
          <Card icon={Ruler} title="Alert lines" sub="Flag a step when fewer than this share move on">
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
              <li><Ruler size={16} /> The alert lines are starting points I set from running onboarding and customer success for SaaS products. They are not published benchmarks. Your own history is a better line</li>
              <li><Users size={16} /> The worked examples and their counts are invented to show how the tool reads a flow</li>
              <li><Lightbulb size={16} /> The F and S rules follow common sign-up practice: value before effort, ask only what changes the next screen, and always give people a way back in</li>
            </ul>
          </Card>
          <Card icon={TriangleAlert} title="What it cannot do">
            <p className="panel-text">It sees only the steps, counts and notes you give it. It cannot see your screens, so a problem nobody wrote down stays invisible unless it shows up as a leak. Counts from different tools or date ranges can make a step look worse than it is. It does not run the tests, and a fix that wins in one segment can lose in another.</p>
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
      <PageHead icon={Layers} eyebrow="Examples" title="Three flows, three verdicts" lede="Each loads with a saved read of its notes, so it works without a key. All three products are invented." />
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
              <div className="example-meta"><Target size={13} /> {r.fl.overall}% reach first value · {pl(ex.form.steps.length, 'step')}</div>
              <button className="btn primary" onClick={() => loadExample(ex)}>{loadedExample === ex.id ? <><Check size={15} /> Loaded</> : <>Open it <ArrowRight size={15} /></>}</button>
            </div>
          );
        })}
      </div>
      <div className="notice"><Map size={16} /><span>Have your own flow? <button className="link" onClick={startBlank}>Start blank</button>.</span></div>
    </div>
  );
}
