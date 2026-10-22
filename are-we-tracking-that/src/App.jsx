import React, { useMemo, useRef, useState } from 'react';
import {
  ClipboardList, Gauge, MessageCircleQuestion, Filter, Wrench, Scale, Layers, Sparkles, KeyRound, Loader2, Check, X, Plus, Copy,
  Download, Info, TriangleAlert, OctagonX, CircleCheck, CircleDashed, ShieldAlert, Tag, Fingerprint, Link2, Brush, ListChecks,
  Database, FileSpreadsheet, ScanSearch, Activity, CircleHelp, Split, Ruler, Bot, Quote, ArrowRight, Ban, PenLine, Target,
  Table2, FileText, Route, Eye, Clock, CircleSlash, ArrowDown, Workflow
} from 'lucide-react';
import {
  FLOWS, TOOLS, CONVENTIONS, IDENTITY, SEVERITY, VERDICTS, RULES, audit, patchedRows, toCsv, toMarkdown, parseModel
} from './rules.js';
import { EXAMPLES } from './examples.js';

const SECTIONS = [
  { id: 'plan', icon: ClipboardList, label: 'Your plan', desc: 'Events, steps and questions' },
  { id: 'verdict', icon: Gauge, label: 'Verdict', desc: 'Can you measure it?' },
  { id: 'questions', icon: MessageCircleQuestion, label: 'Questions', desc: 'Each one, mapped to events' },
  { id: 'funnel', icon: Filter, label: 'Funnel', desc: 'Every step, covered or not' },
  { id: 'fixes', icon: Wrench, label: 'Fix list', desc: 'Add, rename, remove, export' },
  { id: 'how', icon: Scale, label: 'How it works', desc: 'Every rule, printed' },
  { id: 'examples', icon: Layers, label: 'Examples', desc: 'Three plans, no key needed' }
];

const VERDICT_ICONS = [CircleCheck, TriangleAlert, OctagonX, CircleDashed];
const SEV_ICONS = [OctagonX, TriangleAlert, Brush];
const RULE_ICONS = {
  R1: Bot, R2: Bot, R3: Bot, S1: Filter, Q1: MessageCircleQuestion, Q2: MessageCircleQuestion, P1: Fingerprint, G1: Ruler, G2: Ruler, G3: Ban,
  F1: CircleHelp, F2: CircleHelp, I1: Link2, I2: Link2, A1: Target, D1: Split, N1: PenLine, N2: Eye, N3: Clock, N4: Copy, V: Scale
};
const STATUS = [
  { label: 'No', tone: 'bad', icon: CircleSlash },
  { label: 'Partly', tone: 'warn', icon: TriangleAlert },
  { label: 'Yes', tone: 'ok', icon: CircleCheck }
];
const PROVIDERS = [
  { id: 'muse', label: 'Muse Glimmer', note: 'Free, on this site' },
  { id: 'anthropic', label: 'Anthropic', note: 'Your key' },
  { id: 'openai', label: 'OpenAI', note: 'Your key' },
  { id: 'gemini', label: 'Gemini', note: 'Your key' }
];

const BLANK = { product: '', flow: 'Sign-up and activation', tool: 'Amplitude', convention: 'snake_case', identity: 'Anonymous, then identified', steps: '', questions: '', plan: '' };
const slug = (s) => (s || 'tracking-plan').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
const sig = (f) => [f.plan, f.questions, f.steps].map((x) => x.trim()).join('\u0000');

export default function App() {
  const now = useMemo(() => new Date(), []);
  const [section, setSection] = useState('verdict');
  const [form, setForm] = useState({ ...BLANK, ...EXAMPLES[0].form });
  const [loadedExample, setLoadedExample] = useState(EXAMPLES[0].id);
  const [modelText, setModelText] = useState(EXAMPLES[0].text);
  const [mappedOf, setMappedOf] = useState(sig(EXAMPLES[0].form));
  const [provider, setProvider] = useState('muse');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const mainRef = useRef(null);

  const a = useMemo(() => audit(form, modelText), [form, modelText]);
  const stale = !!modelText && mappedOf !== sig(form);

  const go = (id) => {
    setSection(id);
    if (mainRef.current) mainRef.current.scrollTo({ top: 0 });
  };
  const set = (k, v) => {
    setLoadedExample(null);
    setForm((f) => ({ ...f, [k]: v }));
  };
  const loadExample = (ex) => {
    setForm({ ...BLANK, ...ex.form });
    setLoadedExample(ex.id);
    setModelText(ex.text);
    setMappedOf(sig(ex.form));
    setError('');
    go('verdict');
  };
  const startBlank = () => {
    setForm({ ...BLANK });
    setLoadedExample(null);
    setModelText('');
    setMappedOf('');
    setError('');
    go('plan');
  };

  const map = async () => {
    setError('');
    if (form.plan.trim().length < 10) return setError('Paste your tracking plan first.');
    if (!form.questions.trim() && !form.steps.trim()) return setError('Add at least one question or funnel step.');
    setBusy(true);
    try {
      const r = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey, model, ...form })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
      const p = parseModel(data.text);
      if (!p.questions.length && !p.steps.length) throw new Error('The model replied, but not in the expected format. Try again or switch provider.');
      setModelText(data.text);
      setMappedOf(sig(form));
      go('verdict');
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
  const download = (text, name, type) => {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const el = document.createElement('a');
    el.href = url;
    el.download = name;
    el.click();
    URL.revokeObjectURL(url);
  };

  const V = VERDICTS[a.verdict];
  const VIcon = VERDICT_ICONS[a.verdict];
  const common = { form, a, go, loadedExample, stale, startBlank };
  const fixCount = a.by[0] + a.by[1];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><ScanSearch size={20} /></div>
          <div>
            <div className="brand-name">Are We Tracking That?</div>
            <div className="brand-sub">Tracking plan audit</div>
          </div>
        </div>
        <nav className="nav">
          {SECTIONS.map((s) => (
            <button key={s.id} className={`nav-item ${section === s.id ? 'active' : ''}`} onClick={() => go(s.id)}>
              <s.icon size={18} className="nav-icon" />
              <span className="nav-text">
                <span className="nav-label">{s.label}{s.id === 'fixes' && fixCount > 0 && <span className="nav-badge">{fixCount}</span>}</span>
                <span className="nav-desc">{s.desc}</span>
              </span>
            </button>
          ))}
        </nav>
        <div className="side-plan">
          <div className="side-label">This plan</div>
          <div className="side-name">{form.product || 'Untitled plan'}</div>
          <div className={`side-verdict v-${V.tone}`}><VIcon size={14} /> {V.label}</div>
          <div className="side-meta"><Database size={13} /> {a.events.length} events in {form.tool}</div>
          <div className="side-meta"><Workflow size={13} /> {form.flow}</div>
          {!a.hasModel && <div className="side-meta"><CircleDashed size={13} /> Plan rules only so far</div>}
        </div>
        <div className="side-foot">A daily AI build by Prerna Kakkar</div>
      </aside>

      <main className="main" ref={mainRef}>
        {section === 'plan' && (
          <PlanSection {...common} set={set} provider={provider} setProvider={setProvider} apiKey={apiKey} setApiKey={setApiKey}
            model={model} setModel={setModel} busy={busy} error={error} map={map} />
        )}
        {section === 'verdict' && <VerdictSection {...common} />}
        {section === 'questions' && <QuestionsSection {...common} />}
        {section === 'funnel' && <FunnelSection {...common} />}
        {section === 'fixes' && (
          <FixesSection {...common} error={error} copied={copied}
            copyMd={() => copyText(toMarkdown(form, a, now), 'md')}
            downloadMd={() => download(toMarkdown(form, a, now), `${slug(form.product)}-tracking-audit.md`, 'text/markdown')}
            downloadCsv={() => download(toCsv(patchedRows(a)), `${slug(form.product)}-tracking-plan-fixed.csv`, 'text/csv')} />
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

function Card({ icon: Icon, title, sub, children, right, tone }) {
  return (
    <section className={`card ${tone ? `tone-${tone}` : ''}`}>
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

function TextField({ label, hint, value, onChange, placeholder, area, rows = 3, mono, type = 'text' }) {
  return (
    <label className="field">
      {label && <span className="field-label">{label}</span>}
      {hint && <span className="field-hint">{hint}</span>}
      {area ? (
        <textarea className={mono ? 'plan-input' : ''} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} spellCheck={!mono} />
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
    <button className="chip sm dashed" onClick={() => setAdding(true)}><Plus size={13} /> Add your own</button>
  );
}

function Chips({ options, value, onChange, placeholder, own = true }) {
  const isCustom = value && !options.includes(value);
  return (
    <div className="chip-row">
      {options.map((o) => (
        <button key={o} className={`chip sm ${value === o ? 'on' : ''}`} onClick={() => onChange(o)}>{value === o && <Check size={12} />}{o}</button>
      ))}
      {isCustom && <button className="chip sm on custom"><Check size={12} />{value}</button>}
      {own && <AddOwn onAdd={onChange} placeholder={placeholder} />}
    </div>
  );
}

function Pill({ tone, icon: Icon, children }) {
  return <span className={`pill t-${tone}`}>{Icon && <Icon size={12} />}{children}</span>;
}

function Kpi({ icon: Icon, label, value, sub, tone }) {
  return (
    <div className={`kpi ${tone ? `t-${tone}` : ''}`}>
      <div className="kpi-label"><Icon size={14} /> {label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
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

function Notices({ loadedExample, stale, go, a }) {
  return (
    <>
      {loadedExample && (
        <div className="notice"><Info size={16} /><span>Worked example with a saved map. <button className="link" onClick={() => go('plan')}>Edit the plan</button> and the rules rerun as you type.</span></div>
      )}
      {stale && (
        <div className="notice warn"><TriangleAlert size={16} /><span>The plan, steps or questions changed since the last map. Plan rules are live, the map is not. <button className="link" onClick={() => go('plan')}>Map again</button></span></div>
      )}
      {!a.hasModel && (
        <div className="notice"><CircleDashed size={16} /><span>Plan rules only. Questions and steps are not mapped yet. <button className="link" onClick={() => go('plan')}>Map them</button></span></div>
      )}
    </>
  );
}

function EventChip({ name, ok = true }) {
  return <span className={`ev ${ok ? '' : 'ev-miss'}`}>{ok ? <Tag size={12} /> : <X size={12} />}{name}</span>;
}

function Bullets({ items, icon: Icon = ArrowRight, tone }) {
  return (
    <ul className={`bullets ${tone ? `t-${tone}` : ''}`}>
      {items.map((x, i) => <li key={i}><span className="b-ico"><Icon size={13} /></span><span>{x}</span></li>)}
    </ul>
  );
}

/* ---------- Your plan ---------- */

function PlanSection(p) {
  const { form, set, a } = p;
  const V = VERDICTS[a.verdict];
  const VIcon = VERDICT_ICONS[a.verdict];
  return (
    <div className="page">
      <PageHead icon={ClipboardList} eyebrow="Your plan" title="Can your tracking plan answer your questions?"
        lede="Paste the events and list what you need to know after launch. Printed rules check the plan. A model maps each question to events, and every name it gives is checked.">
        <div className="steps">
          <Step n="1" icon={Table2} text="Paste the plan" />
          <Step n="2" icon={MessageCircleQuestion} text="List your questions" />
          <Step n="3" icon={Wrench} text="Get the fix list" />
        </div>
        {p.loadedExample && (
          <div className="notice"><Info size={16} /><span>Worked example. <button className="link" onClick={p.startBlank}>Start blank</button> or <button className="link" onClick={() => p.go('examples')}>pick another</button></span></div>
        )}
      </PageHead>

      <div className="build-grid">
        <div className="build-form">
          <Card icon={Workflow} title="Product and flow" sub="Sets which rules apply">
            <TextField label="Product" value={form.product} onChange={(x) => set('product', x)} placeholder="Tallyo invoicing" />
            <div className="q-block"><span className="field-label">Flow</span><Chips options={FLOWS} value={form.flow} onChange={(x) => set('flow', x)} placeholder="e.g. Referral" /></div>
            <div className="q-block"><span className="field-label">Analytics tool</span><Chips options={TOOLS} value={form.tool} onChange={(x) => set('tool', x)} placeholder="e.g. Heap" /></div>
            <div className="q-block"><span className="field-label">Naming convention</span><Chips options={CONVENTIONS} value={form.convention} onChange={(x) => set('convention', x)} own={false} /></div>
            <div className="q-block"><span className="field-label">How users are identified</span><Chips options={IDENTITY} value={form.identity} onChange={(x) => set('identity', x)} own={false} /></div>
          </Card>

          <div className="two">
            <Card icon={Filter} title="Funnel steps" sub="One per line, in order">
              <TextField area rows={6} value={form.steps} onChange={(x) => set('steps', x)} placeholder={'Lands on sign-up page\nStarts sign-up\nVerifies email'} />
            </Card>
            <Card icon={MessageCircleQuestion} title="Questions" sub="What you will be asked after launch">
              <TextField area rows={6} value={form.questions} onChange={(x) => set('questions', x)} placeholder={'Where do people drop before verifying?\nWhich channel converts best?'} />
            </Card>
          </div>

          <Card icon={Table2} title="Tracking plan" sub="One event per line: event | properties | when it fires">
            <TextField area mono rows={9} value={form.plan} onChange={(x) => set('plan', x)} placeholder={'signup_started | method, utm_source | First form step is submitted\nemail_verified | | Verification link succeeds'} />
            <div className="field-hint"><FileSpreadsheet size={13} /> Rows pasted from a sheet (tab-separated) and CSV with an "event" header also work.</div>
          </Card>

          <ReadBack a={a} />

          <Card icon={Bot} title="Map questions to events" sub="Muse Glimmer runs free here. Or bring your own key">
            <div className="provider-row">
              {PROVIDERS.map((x) => (
                <button key={x.id} className={`provider ${p.provider === x.id ? 'on' : ''}`} onClick={() => p.setProvider(x.id)}>
                  <span className="provider-name">{p.provider === x.id && <Check size={13} />}{x.label}</span>
                  <span className="provider-note">{x.note}</span>
                </button>
              ))}
            </div>
            {p.provider !== 'muse' && (
              <div className="two">
                <TextField label="API key" type="password" value={p.apiKey} onChange={p.setApiKey} placeholder="Used for one request, never stored" />
                <TextField label="Model (optional)" value={p.model} onChange={p.setModel} placeholder="Provider default" />
              </div>
            )}
            <button className="btn primary big" onClick={p.map} disabled={p.busy}>
              {p.busy ? <><Loader2 size={17} className="spin" /> Mapping</> : <><Sparkles size={17} /> Map and audit</>}
            </button>
            {p.error && <div className="error"><TriangleAlert size={15} /> {p.error}</div>}
          </Card>
        </div>

        <aside className="build-side">
          <div className={`live v-${V.tone}`}>
            <div className="live-label"><Activity size={14} /> Live check</div>
            <div className="live-verdict"><VIcon size={20} /> {V.label}</div>
            <div className="live-grid">
              <div><b>{a.events.length}</b><span>events read</span></div>
              {SEVERITY.map((s) => <div key={s.id}><b>{a.by[s.id]}</b><span>{[['blocker', 'blockers'], ['gap', 'gaps'], ['tidy-up', 'tidy-ups']][s.id][a.by[s.id] === 1 ? 0 : 1]}</span></div>)}
            </div>
            <div className="live-note">{a.hasModel && !p.stale ? 'Plan rules and the latest map.' : 'Plan rules only until you map.'}</div>
            <button className="btn ghost" onClick={() => p.go('fixes')}>See the fix list <ArrowRight size={15} /></button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ReadBack({ a }) {
  if (!a.events.length) return null;
  return (
    <Card icon={ListChecks} title="What we read" sub={`${a.events.length} events. Check the split looks right`}>
      <div className="table-wrap">
        <table className="tbl">
          <thead><tr><th>Event</th><th>Properties</th><th>When it fires</th><th>Rules</th></tr></thead>
          <tbody>
            {a.events.map((e, i) => (
              <tr key={i}>
                <td><EventChip name={e.name} /></td>
                <td className="props">{e.props.length ? e.props.map((x) => <span key={x} className="prop">{x}</span>) : <span className="muted">None</span>}</td>
                <td className={e.trigger ? '' : 'muted'}>{e.trigger || 'Not described'}</td>
                <td>{(a.flagged[e.name] || []).length ? [...new Set(a.flagged[e.name])].map((r) => <span key={r} className={`rule-tag s${RULES.find((x) => x.id === r)?.sev ?? 2}`}>{r}</span>) : <Check size={15} className="ok-ico" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ---------- Verdict ---------- */

function VerdictSection(p) {
  const { a, go } = p;
  const V = VERDICTS[a.verdict];
  const VIcon = VERDICT_ICONS[a.verdict];
  const yes = a.qs.filter((q) => q.status === 2).length;
  const part = a.qs.filter((q) => q.status === 1).length;
  const covered = a.steps.filter((s) => s.events.length).length;
  return (
    <div className="page">
      <PageHead icon={Gauge} eyebrow="Verdict" title={p.form.product || 'Your tracking plan'} lede={`${p.form.flow} · ${p.form.tool} · ${a.events.length} events`}>
        <Notices {...p} />
      </PageHead>

      <div className={`hero v-${V.tone}`}>
        <div className="hero-icon"><VIcon size={30} /></div>
        <div className="hero-text">
          <div className="hero-label">{V.label}</div>
          <div className="hero-line">{V.line}</div>
        </div>
      </div>

      <div className="kpis">
        <Kpi icon={MessageCircleQuestion} label="Questions answerable" value={a.hasModel ? `${yes} of ${a.qs.length}` : 'Not yet'} sub={a.hasModel ? `${part} partly` : 'Not mapped yet'} tone={a.hasModel ? (yes === a.qs.length ? 'ok' : 'warn') : null} />
        <Kpi icon={Filter} label="Steps covered" value={a.hasModel ? `${covered} of ${a.steps.length}` : 'Not yet'} sub={a.hasModel ? 'with an event behind them' : 'Not mapped yet'} tone={a.hasModel ? (covered === a.steps.length ? 'ok' : 'bad') : null} />
        {SEVERITY.map((s) => <Kpi key={s.id} icon={SEV_ICONS[s.id]} label={s.label} value={a.by[s.id]} tone={a.by[s.id] ? s.tone : null} />)}
      </div>

      {a.hasModel && a.m.summary && (
        <div className="summary"><Quote size={18} /><div><span>Model's read</span>{a.m.summary}</div></div>
      )}

      {a.hasModel && a.steps.length > 0 && (
        <Card icon={Filter} title="Funnel at a glance" sub="Grey means no event behind the step" right={<button className="link small" onClick={() => go('funnel')}>Open <ArrowRight size={13} /></button>}>
          <div className="strip">
            {a.steps.map((s) => (
              <div key={s.n} className={`strip-step ${s.events.length ? 'on' : 'off'}`}>
                <span className="strip-n">{s.n}</span>
                <span className="strip-t">{s.text}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card icon={Route} title="Why this verdict" sub="Every rule that fired, worst first" right={<button className="link small" onClick={() => go('fixes')}>Fix list <ArrowRight size={13} /></button>}>
        {a.findings.length === 0 ? (
          <div className="empty">{a.events.length ? <><CircleCheck size={18} /> No rule fired.</> : <><Info size={18} /> Paste a plan on Your plan to start.</>}</div>
        ) : (
          <div className="trail">
            {a.findings.map((f, i) => {
              const S = SEVERITY[f.sev];
              const I = RULE_ICONS[f.rule] || Info;
              return (
                <div key={i} className={`trail-row t-${S.tone}`}>
                  <span className="trail-ico"><I size={15} /></span>
                  <span className="rule-tag-lg">{f.rule}</span>
                  <span className="trail-title">{f.title}</span>
                  <Pill tone={S.tone}>{S.short}</Pill>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ---------- Questions ---------- */

function QuestionsSection(p) {
  const { a } = p;
  const dropped = a.checked?.dropped || [];
  return (
    <div className="page">
      <PageHead icon={MessageCircleQuestion} eyebrow="Questions" title="Can each question be answered?" lede="The model names the events and properties. The check keeps only what is in your plan, and can only lower an answer.">
        <Notices {...p} />
      </PageHead>
      {a.qs.length === 0 && <div className="empty card-pad"><Info size={18} /> No questions yet. Add them on Your plan.</div>}
      {a.qs.map((q) => {
        const S = q.status == null ? null : STATUS[q.status];
        return (
          <section key={q.n} className={`qcard ${S ? `t-${S.tone}` : ''}`}>
            <div className="qcard-head">
              <span className="q-num">Q{q.n}</span>
              <span className="qcard-text">{q.text}</span>
              {S ? <Pill tone={S.tone} icon={S.icon}>{S.label}</Pill> : <Pill tone="na" icon={CircleDashed}>Not mapped</Pill>}
            </div>
            {q.mapped && (
              <div className="qcard-body">
                <div className="q-row"><span className="q-key">Events</span><div className="ev-row">{q.events.length ? q.events.map((e) => <EventChip key={e} name={e} />) : <span className="muted">None in the plan</span>}</div></div>
                {q.needs.length > 0 && (
                  <div className="q-row"><span className="q-key">Needs</span><div className="ev-row">{q.needs.map((n) => (
                    <span key={n.prop} className={`need ${n.on ? 'ok' : 'miss'}`}>{n.on ? <Check size={12} /> : <X size={12} />}{n.prop}<em>{n.on ? `on ${n.on}` : 'not in plan'}</em></span>
                  ))}</div></div>
                )}
                {q.status < 2 && q.missing && <div className="q-missing"><CircleHelp size={15} /> {q.missing}</div>}
                {q.lowered && <div className="q-lowered"><ArrowDown size={14} /> The model said {STATUS[q.modelStatus].label.toLowerCase()}. The check lowered it (R3).</div>}
              </div>
            )}
          </section>
        );
      })}
      {dropped.length > 0 && (
        <Card icon={Ban} title="Names the check dropped" sub="The model named these, but they are not in your plan (R1)" tone="warn">
          <Bullets items={dropped.map((d) => `${d.where}: ${d.name}`)} icon={X} tone="warn" />
        </Card>
      )}
    </div>
  );
}

/* ---------- Funnel ---------- */

function FunnelSection(p) {
  const { a } = p;
  return (
    <div className="page">
      <PageHead icon={Filter} eyebrow="Funnel" title="Every step, covered or not" lede="A step with no event breaks the funnel: everyone who passes it is invisible.">
        <Notices {...p} />
      </PageHead>
      {a.steps.length === 0 && <div className="empty card-pad"><Info size={18} /> No steps yet. Add them on Your plan.</div>}
      <div className="funnel">
        {a.steps.map((s, i) => {
          const tone = !s.mapped ? 'na' : s.events.length ? 'ok' : 'bad';
          return (
            <div key={s.n} className={`f-step t-${tone}`}>
              <div className="f-rail"><span className="f-dot">{s.n}</span>{i < a.steps.length - 1 && <span className="f-line" />}</div>
              <div className="f-card">
                <div className="f-head">
                  <span className="f-title">{s.text}</span>
                  {tone === 'ok' && <Pill tone="ok" icon={CircleCheck}>Covered</Pill>}
                  {tone === 'bad' && <Pill tone="bad" icon={OctagonX}>No event</Pill>}
                  {tone === 'na' && <Pill tone="na" icon={CircleDashed}>Not mapped</Pill>}
                </div>
                {s.events.length > 0 && <div className="ev-row">{s.events.map((e) => <EventChip key={e} name={e} />)}</div>}
                {s.note && !/^covered\.?$/i.test(s.note.trim()) && <div className="f-note">{s.note}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Fixes ---------- */

function FixesSection(p) {
  const { a } = p;
  const rows = patchedRows(a);
  const adds = rows.filter((r) => r.status === 'Add');
  const changes = rows.filter((r) => r.status !== 'Keep' && r.status !== 'Add');
  return (
    <div className="page">
      <PageHead icon={Wrench} eyebrow="Fix list" title="What to change before engineering builds it" lede="Worst first. The fixed plan downloads as a CSV you can paste back into your sheet.">
        <div className="actions">
          <button className="btn primary" onClick={p.downloadCsv}><FileSpreadsheet size={16} /> Fixed plan (CSV)</button>
          <button className="btn" onClick={p.copyMd}>{p.copied === 'md' ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy for a ticket</>}</button>
          <button className="btn" onClick={p.downloadMd}><Download size={16} /> Audit (Markdown)</button>
        </div>
        {p.error && <div className="error"><TriangleAlert size={15} /> {p.error}</div>}
        <Notices {...p} />
      </PageHead>

      {(adds.length > 0 || changes.length > 0) && (
        <Card icon={Table2} title="Changes to the plan" sub={`${adds.length} to add, ${changes.length} to change`}>
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr><th>Change</th><th>Event</th><th>Properties</th><th>Why</th></tr></thead>
              <tbody>
                {[...adds, ...changes].map((r, i) => (
                  <tr key={i}>
                    <td><span className={`chg c-${r.status.toLowerCase()}`}>{r.status}</span></td>
                    <td><EventChip name={r.name} /></td>
                    <td className="props">{r.props.map((x) => <span key={x} className="prop">{x}</span>)}</td>
                    <td className="why">{r.note || (r.status === 'Describe' ? 'Write when it fires (N3)' : '')}{r.status === 'Add' && r.trigger ? <div className="muted">Fires: {r.trigger}</div> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {SEVERITY.map((s) => {
        const fs = a.findings.filter((f) => f.sev === s.id);
        if (!fs.length) return null;
        const SIcon = SEV_ICONS[s.id];
        return (
          <div key={s.id} className="sev-group">
            <div className={`sev-head t-${s.tone}`}><SIcon size={16} /> {s.label} <span>{fs.length}</span></div>
            {fs.map((f, i) => {
              const I = RULE_ICONS[f.rule] || Info;
              return (
                <section key={i} className={`fix t-${s.tone}`}>
                  <div className="fix-ico"><I size={18} /></div>
                  <div className="fix-body">
                    <div className="fix-title"><span className="rule-tag-lg">{f.rule}</span>{f.title}</div>
                    <p>{f.detail}</p>
                    <Bullets items={f.items} icon={s.id === 0 ? X : ArrowRight} tone={s.tone} />
                  </div>
                </section>
              );
            })}
          </div>
        );
      })}
      {a.findings.length === 0 && <div className="empty card-pad">{a.events.length ? <><CircleCheck size={18} /> Nothing to fix. Ready to build.</> : <><Info size={18} /> Paste a plan on Your plan to start.</>}</div>}
    </div>
  );
}

/* ---------- How it works ---------- */

function HowSection() {
  const groups = [...new Set(RULES.map((r) => r.group))];
  return (
    <div className="page">
      <PageHead icon={Scale} eyebrow="How it works" title="The model maps. Rules decide." lede="Matching a question to an event needs reading. The verdict should not: the same plan gets the same verdict every time." />
      <div className="tiles">
        <div className="tile"><Table2 size={20} /><b>Plan rules</b><span>Naming, personal data, tool limits and duplicates. No model, live as you type.</span></div>
        <div className="tile"><Bot size={20} /><b>Model map</b><span>Each step and question to events, plus what to add. Tagged lines, not JSON.</span></div>
        <div className="tile"><ShieldAlert size={20} /><b>Check</b><span>Names not in your plan are dropped. Answers can only go down.</span></div>
      </div>
      {groups.map((g) => (
        <Card key={g} icon={RULE_ICONS[RULES.find((r) => r.group === g).id] || Scale} title={g}>
          <div className="rules">
            {RULES.filter((r) => r.group === g).map((r) => (
              <div key={r.id} className="rule-row">
                <span className="rule-tag-lg">{r.id}</span>
                <span className="rule-text">{r.text}</span>
                {r.sev != null && <Pill tone={SEVERITY[r.sev].tone}>{SEVERITY[r.sev].short}</Pill>}
              </div>
            ))}
          </div>
        </Card>
      ))}
      <Card icon={Info} title="Where the rules come from">
        <Bullets items={[
          'GA4 limits are from Google\'s published collection limits: 40 characters for event and parameter names, 25 parameters per event, and a list of reserved names and prefixes.',
          'The personal data rule follows the general GDPR advice to keep identifiers out of third-party analytics. It matches property names, so it can miss a field named something unusual.',
          'Timestamps and user IDs are sent by every tool, so they are never counted as missing.',
          'Nothing you paste is stored. The plan goes to the model you pick for one request.'
        ]} icon={Info} />
      </Card>
    </div>
  );
}

/* ---------- Examples ---------- */

function ExamplesSection({ loadExample, loadedExample, startBlank }) {
  return (
    <div className="page">
      <PageHead icon={Layers} eyebrow="Examples" title="Three invented plans" lede="Each has a saved map, so it opens without a key. The rules run live." />
      <div className="ex-grid">
        {EXAMPLES.map((ex) => {
          const a = audit(ex.form, ex.text);
          const V = VERDICTS[a.verdict];
          const VIcon = VERDICT_ICONS[a.verdict];
          return (
            <section key={ex.id} className={`ex ${loadedExample === ex.id ? 'on' : ''}`}>
              <div className="ex-top"><span className="ex-tag">{ex.tag}</span><span className="ex-tool">{ex.form.tool}</span></div>
              <h2>{ex.title}</h2>
              <p>{ex.blurb}</p>
              <div className={`side-verdict inline v-${V.tone}`}><VIcon size={14} /> {V.label}</div>
              <div className="ex-meta"><span><Database size={13} /> {a.events.length} events</span><span><MessageCircleQuestion size={13} /> {a.qs.length} questions</span></div>
              <button className="btn primary" onClick={() => loadExample(ex)}>{loadedExample === ex.id ? <><Check size={15} /> Loaded</> : <>Open <ArrowRight size={15} /></>}</button>
            </section>
          );
        })}
      </div>
      <button className="btn ghost dark" onClick={startBlank}><FileText size={15} /> Start with a blank plan</button>
    </div>
  );
}
