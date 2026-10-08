import React, { useMemo, useRef, useState } from 'react';
import {
  Lightbulb, ClipboardList, ListChecks, Target, Gauge, Rocket, Clock, Users, Euro, Hourglass, FlaskConical, Archive,
  CalendarCheck, Quote, BadgeCheck, TriangleAlert, Copy, Download, KeyRound, Loader2, Info, Check, Plus, X, ArrowRight,
  Layers, BookOpen, Pencil, Sparkles, Scale, TrendingUp, CircleHelp, Flag, Ban, Wrench, Megaphone, Palette, Database,
  Headset, Briefcase, Settings, FileText, RotateCcw, Ruler, Square, SquareCheck, Link2, Zap, Calculator, Footprints, Filter
} from 'lucide-react';
import {
  SOURCES, GOALS, HORIZONS, CAPACITIES, STRENGTHS, REACHES, FITS, EFFORTS, LEVERS, OWNERS, DEFAULT_LIFTS, BUCKETS, RULES,
  REACH_SHARE, EVIDENCE_WEIGHT, EFFORT_DAYS, parsePlan, buildPlan, fmtDays, impactText, money, briefMarkdown
} from './plan.js';
import { EXAMPLES } from './examples.js';

const SECTIONS = [
  { id: 'start', icon: Pencil, label: 'Paste findings', desc: 'Research, feedback or a metric readout, plus your goal' },
  { id: 'insights', icon: Lightbulb, label: 'What we learned', desc: 'Each finding, why it matters and its checked quote' },
  { id: 'plan', icon: ClipboardList, label: 'Action plan', desc: 'Ranked actions, owners, impact and this week’s steps' },
  { id: 'how', icon: BookOpen, label: 'How it works', desc: 'The scoring, the buckets and where numbers come from' },
  { id: 'examples', icon: Layers, label: 'Examples', desc: 'Three worked cases, no key needed' }
];

const BUCKET_ICONS = { now: Rocket, next: CalendarCheck, test: FlaskConical, park: Archive };
const OWNER_ICONS = {
  Product: Briefcase, Engineering: Wrench, Design: Palette, Data: Database, Sales: TrendingUp,
  'Customer success': Headset, Marketing: Megaphone, Operations: Settings
};

const PROVIDERS = [
  { id: 'muse', label: 'Muse Glimmer', note: 'Free, on this site' },
  { id: 'anthropic', label: 'Anthropic', note: 'Your key' },
  { id: 'openai', label: 'OpenAI', note: 'Your key' },
  { id: 'gemini', label: 'Gemini', note: 'Your key' }
];

const MAX_SOURCE = 20000;
const BLANK = {
  name: '', goal: '', goalMetric: GOALS[0], sourceType: SOURCES[0], horizon: HORIZONS[0],
  capacity: 10, revenue: 0, teamHours: 0, source: ''
};
const slug = (s) => (s || 'action-brief').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function fromExample(ex) {
  const p = parsePlan(ex.text);
  return { form: { ...ex.form, source: ex.source }, text: ex.text, insights: p.insights, actions: p.actions };
}

export default function App() {
  const first = useMemo(() => fromExample(EXAMPLES[0]), []);
  const [section, setSection] = useState('plan');
  const [form, setForm] = useState(first.form);
  const [loadedExample, setLoadedExample] = useState(EXAMPLES[0].id);
  const [modelText, setModelText] = useState(first.text);
  const [insights, setInsights] = useState(first.insights);
  const [actions, setActions] = useState(first.actions);
  const [lifts, setLifts] = useState(DEFAULT_LIFTS);
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState({});
  const [provider, setProvider] = useState('muse');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const mainRef = useRef(null);

  const parsed = useMemo(() => parsePlan(modelText), [modelText]);
  const plan = useMemo(
    () => buildPlan({ insights, actions, source: form.source, capacity: Number(form.capacity) || 0, revenue: Number(form.revenue) || 0, teamHours: Number(form.teamHours) || 0, lifts }),
    [insights, actions, form.source, form.capacity, form.revenue, form.teamHours, lifts]
  );
  const edits = useMemo(() => {
    let n = 0;
    insights.forEach((i, k) => { const o = parsed.insights[k]; if (o && (o.strength !== i.strength || o.reach !== i.reach)) n += 1; });
    actions.forEach((a, k) => { const o = parsed.actions[k]; if (o && (o.effort !== a.effort || o.fit !== a.fit || o.lever !== a.lever || o.owner !== a.owner)) n += 1; });
    return n;
  }, [insights, actions, parsed]);

  const go = (id) => {
    setSection(id);
    if (mainRef.current) mainRef.current.scrollTo({ top: 0 });
  };
  const set = (k, v) => {
    setLoadedExample(null);
    setForm((f) => ({ ...f, [k]: v }));
  };
  const setInsight = (id, k, v) => setInsights((xs) => xs.map((x) => (x.id === id ? { ...x, [k]: v } : x)));
  const setAction = (id, k, v) => setActions((xs) => xs.map((x) => (x.id === id ? { ...x, [k]: v } : x)));
  const resetEdits = () => {
    setInsights(parsed.insights);
    setActions(parsed.actions);
  };

  const loadExample = (ex) => {
    const s = fromExample(ex);
    setForm(s.form);
    setLoadedExample(ex.id);
    setModelText(s.text);
    setInsights(s.insights);
    setActions(s.actions);
    setSelected(null);
    setDone({});
    setError('');
    go('plan');
  };
  const startBlank = () => {
    setForm(BLANK);
    setLoadedExample(null);
    setModelText('');
    setInsights([]);
    setActions([]);
    setSelected(null);
    setDone({});
    setError('');
    go('start');
  };

  const runPlan = async () => {
    setError('');
    const words = form.source.trim().split(/\s+/).filter(Boolean).length;
    if (words < 40) {
      setError('Paste at least a short paragraph of findings, around 40 words or more, so there is something to work from.');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider, apiKey, model, goal: form.goal, goalMetric: form.goalMetric, sourceType: form.sourceType,
          horizon: form.horizon, source: form.source.slice(0, MAX_SOURCE)
        })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
      const p = parsePlan(data.text);
      if (p.insights.length < 2 || p.actions.length < 2) throw new Error('The model replied, but not in the expected format. Try again or switch provider.');
      setModelText(data.text);
      setInsights(p.insights);
      setActions(p.actions);
      setSelected(null);
      setDone({});
      go('insights');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const brief = () => briefMarkdown(form, parsed, plan);
  const copyBrief = async () => {
    try {
      await navigator.clipboard.writeText(brief());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('Copy failed in this browser. Use download instead.');
    }
  };
  const downloadBrief = () => {
    const blob = new Blob([brief()], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${slug(form.name)}-action-brief.md`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const openAction = (id) => {
    setSelected(id);
    go('plan');
    setTimeout(() => document.getElementById('action-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  const hasPlan = plan.rows.length > 0;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Lightbulb size={20} /></div>
          <div>
            <div className="brand-name">So What?</div>
            <div className="brand-sub">Turn findings into a plan</div>
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
        {hasPlan && (
          <div className="side-plan">
            <div className="side-label">Current plan</div>
            <div className="side-name">{form.name || 'Untitled plan'}</div>
            <div className="side-counts">
              {BUCKETS.map((b) => {
                const Icon = BUCKET_ICONS[b.id];
                return (
                  <div key={b.id} className={`side-count b-${b.id}`}>
                    <Icon size={13} /> <b>{plan.buckets[b.id].length}</b> {b.label}
                  </div>
                );
              })}
            </div>
            <CapacityBar plan={plan} dark />
          </div>
        )}
        <div className="side-foot">A daily AI build by Prerna Kakkar</div>
      </aside>

      <main className="main" ref={mainRef}>
        {section === 'start' && (
          <StartSection
            form={form} set={set} loadedExample={loadedExample} startBlank={startBlank} go={go}
            provider={provider} setProvider={setProvider} apiKey={apiKey} setApiKey={setApiKey}
            model={model} setModel={setModel} busy={busy} error={error} runPlan={runPlan}
          />
        )}
        {section === 'insights' && (hasPlan || plan.insights.length ? (
          <InsightsSection form={form} plan={plan} parsed={parsed} setInsight={setInsight} openAction={openAction} edits={edits} resetEdits={resetEdits} go={go} />
        ) : <Empty icon={Lightbulb} eyebrow="What we learned" go={go} />)}
        {section === 'plan' && (hasPlan ? (
          <PlanSection
            form={form} set={set} plan={plan} parsed={parsed} selected={selected} setSelected={setSelected} setAction={setAction}
            done={done} setDone={setDone} lifts={lifts} setLifts={setLifts} edits={edits} resetEdits={resetEdits}
            copyBrief={copyBrief} copied={copied} downloadBrief={downloadBrief} error={error} loadedExample={loadedExample} go={go}
          />
        ) : <Empty icon={ClipboardList} eyebrow="Action plan" go={go} />)}
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

function AddOwn({ onAdd, placeholder, label = 'Add your own', numeric }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const commit = () => {
    const v = draft.trim();
    if (v) onAdd(numeric ? Math.max(0, Number(v) || 0) : v);
    setAdding(false);
    setDraft('');
  };
  return adding ? (
    <span className="chip-add">
      <input autoFocus inputMode={numeric ? 'decimal' : undefined} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && commit()} placeholder={placeholder} />
      <button className="chip-ok" onClick={commit} aria-label="Add"><Check size={14} /></button>
      <button className="chip-ok" onClick={() => setAdding(false)} aria-label="Cancel"><X size={14} /></button>
    </span>
  ) : (
    <button className="chip dashed" onClick={() => setAdding(true)}><Plus size={14} /> {label}</button>
  );
}

function Chips({ options, value, onChange, placeholder, small, custom = true, render = (o) => o, numeric }) {
  const isCustom = value !== '' && value != null && !options.includes(value);
  return (
    <div className="chip-row">
      {options.map((o) => (
        <button key={o} className={`chip ${small ? 'sm' : ''} ${value === o ? 'on' : ''}`} onClick={() => onChange(o)}>{render(o)}</button>
      ))}
      {isCustom && <button className={`chip ${small ? 'sm' : ''} on`}>{render(value)}</button>}
      {custom && <AddOwn onAdd={onChange} placeholder={placeholder} label={small ? 'Own' : 'Add your own'} numeric={numeric} />}
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

function QuoteCheck({ found }) {
  return found ? (
    <span className="q-check ok"><BadgeCheck size={13} /> Quote found in source</span>
  ) : (
    <span className="q-check miss"><TriangleAlert size={13} /> Quote not found</span>
  );
}

function Dots({ n, of = 3, label }) {
  return (
    <span className="dots" title={label}>
      {Array.from({ length: of }, (_, i) => <span key={i} className={i < n ? 'on' : ''} />)}
    </span>
  );
}

function CapacityBar({ plan, dark }) {
  const cap = plan.capacity || 0;
  const now = plan.buckets.now;
  return (
    <div className={`cap ${dark ? 'dark' : ''}`}>
      <div className="cap-bar" aria-label="Capacity used">
        {now.map((r) => (
          <span key={r.id} className="cap-seg" style={{ width: `${cap ? Math.min(100, (r.days / cap) * 100) : 0}%` }} title={`${r.title}: ${fmtDays(r.days)}`} />
        ))}
      </div>
      <div className="cap-text">{Math.round(plan.used * 10) / 10} of {cap} person-days used</div>
    </div>
  );
}

function Empty({ icon, eyebrow, go }) {
  return (
    <div className="page">
      <PageHead icon={icon} eyebrow={eyebrow} title="Nothing to plan yet" lede="Paste your findings and build a plan first, or open one of the worked examples." />
      <div className="row-btns">
        <button className="btn primary" onClick={() => go('start')}><Pencil size={16} /> Paste findings</button>
        <button className="btn ghost" onClick={() => go('examples')}><Layers size={16} /> See examples</button>
      </div>
    </div>
  );
}

/* ---------- Paste findings ---------- */

function StartSection(p) {
  const { form, set } = p;
  const words = form.source.trim() ? form.source.trim().split(/\s+/).length : 0;
  return (
    <div className="page">
      <PageHead
        icon={Pencil}
        eyebrow="Paste findings"
        title="You have the findings. What do you do on Monday?"
        lede="Paste interview notes, tickets, survey comments or a metric readout. You get the insights that matter for your goal, a ranked set of actions with owners, what each could be worth and the first step for this week."
      >
        <div className="steps">
          <Step n="1" icon={Sparkles} text="A model pulls out insights and proposes actions from fixed word lists" />
          <Step n="2" icon={BadgeCheck} text="Every quote is checked against your material" />
          <Step n="3" icon={Scale} text="Printed rules rank the actions and fill your capacity" />
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
          <Card icon={Target} title="The goal" sub="Actions are judged against this, so be specific">
            <TextField label="Name for this plan" value={form.name} onChange={(v) => set('name', v)} placeholder="Why trials stall" />
            <TextField label="What the team is trying to move" value={form.goal} onChange={(v) => set('goal', v)} area rows={2} placeholder="Lift trial to paid conversion for agencies this quarter." />
            <div className="field">
              <span className="field-label">Measured by</span>
              <Chips options={GOALS} value={form.goalMetric} onChange={(v) => set('goalMetric', v)} placeholder="Your metric" />
            </div>
          </Card>

          <Card icon={FileText} title="The findings" sub="Raw is fine. Bullet notes, quotes, numbers, ticket tags">
            <div className="field">
              <span className="field-label">What kind of material is it?</span>
              <Chips options={SOURCES} value={form.sourceType} onChange={(v) => set('sourceType', v)} placeholder="Your source" />
            </div>
            <TextField
              label="Paste it here"
              hint="Remove names and personal details first. Numbers help: they let an insight count as measured."
              value={form.source} onChange={(v) => set('source', v)} area rows={12}
              placeholder={'Interview notes, 8 users who churned:\n- "..."\n\nProduct data: ...\n\nSupport: ...'}
            />
            <div className="field-foot">
              <span>{words.toLocaleString('en-GB')} words</span>
              {form.source.length > MAX_SOURCE && <span className="warn-text"><TriangleAlert size={13} /> Only the first {MAX_SOURCE.toLocaleString('en-GB')} characters go to the model</span>}
            </div>
          </Card>

          <Card icon={Gauge} title="Your capacity" sub="The plan only puts in Do now what fits">
            <div className="field">
              <span className="field-label">Time frame</span>
              <Chips options={HORIZONS} value={form.horizon} onChange={(v) => set('horizon', v)} placeholder="Your time frame" />
            </div>
            <div className="field">
              <span className="field-label">Person-days the team can give it</span>
              <Chips options={CAPACITIES} value={Number(form.capacity)} onChange={(v) => set('capacity', Number(v))} placeholder="Days" numeric render={(o) => `${o} days`} />
            </div>
          </Card>

          <Card icon={Calculator} title="Baselines (optional)" sub="Turns scores into rough money and time ranges. Leave at 0 to skip">
            <div className="two-fields">
              <TextField label="Monthly revenue in scope (€)" type="number" value={form.revenue || ''} onChange={(v) => set('revenue', Math.max(0, Number(v) || 0))} placeholder="85000" />
              <TextField label="Team hours a week on this work" type="number" value={form.teamHours || ''} onChange={(v) => set('teamHours', Math.max(0, Number(v) || 0))} placeholder="320" />
            </div>
          </Card>
        </div>

        <div className="sticky-results">
          <div className="panel">
            <div className="panel-title"><KeyRound size={16} /> Model</div>
            <div className="panel-sub">The model only reads and proposes. It does not rank or price anything.</div>
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
            <button className="btn primary wide" onClick={p.runPlan} disabled={p.busy}>
              {p.busy ? <><Loader2 size={16} className="spin" /> Reading your findings</> : <><Sparkles size={16} /> Build the plan</>}
            </button>
            {p.error && <div className="error"><TriangleAlert size={16} /> {p.error}</div>}
          </div>
          <div className="panel">
            <div className="panel-title"><ListChecks size={16} /> What you get</div>
            <ul className="icon-list">
              <li><Lightbulb size={16} /> 3 to 7 insights, each with a so what</li>
              <li><Rocket size={16} /> Actions sorted into Do now, Plan next, Test first and Park</li>
              <li><Users size={16} /> An owner, a metric and a stop condition for each</li>
              <li><Euro size={16} /> Rough money or hours ranges, if you add baselines</li>
              <li><CalendarCheck size={16} /> First steps for this week, ready to paste</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- What we learned ---------- */

function InsightsSection({ form, plan, parsed, setInsight, openAction, edits, resetEdits, go }) {
  const used = (id) => plan.rows.filter((r) => r.from.includes(id));
  return (
    <div className="page">
      <PageHead icon={Lightbulb} eyebrow="What we learned" title={form.name || 'Your insights'} lede={parsed.summary}>
        <div className="notice">
          <BadgeCheck size={16} />
          <span><b>{plan.verified} of {plan.insights.length}</b> quotes found word for word in your material. Change how strong or wide a finding is and the plan moves with it.</span>
          {edits > 0 && <button className="link" onClick={resetEdits}><RotateCcw size={13} /> Undo {edits} change{edits === 1 ? '' : 's'}</button>}
        </div>
      </PageHead>

      <div className="insight-list">
        {plan.insights.map((i) => {
          const acts = used(i.id);
          return (
            <section key={i.id} className={`insight ${i.found ? '' : 'unverified'}`}>
              <div className="insight-id">{i.id}</div>
              <div className="insight-main">
                <div className="insight-finding">{i.finding}</div>
                <div className="so-what"><ArrowRight size={15} /> <span><b>So what:</b> {i.soWhat}</span></div>
                <blockquote className="insight-quote"><Quote size={14} /> <span>{i.quote}</span></blockquote>
                <div className="insight-meta">
                  <QuoteCheck found={i.found} />
                  {i.downgraded && <span className="q-check miss">Evidence dropped one level (E2)</span>}
                </div>
                <div className="insight-edit">
                  <div>
                    <div className="mini-label">How strong</div>
                    <Chips small custom={false} options={STRENGTHS} value={i.strength} onChange={(v) => setInsight(i.id, 'strength', v)} />
                  </div>
                  <div>
                    <div className="mini-label">How many it reaches</div>
                    <Chips small custom={false} options={REACHES} value={i.reach} onChange={(v) => setInsight(i.id, 'reach', v)} />
                  </div>
                </div>
              </div>
              <div className="insight-side">
                <div className="mini-label">Acted on by</div>
                {acts.length ? acts.map((r) => {
                  const Icon = BUCKET_ICONS[r.bucket];
                  return (
                    <button key={r.id} className={`used-by b-${r.bucket}`} onClick={() => openAction(r.id)}>
                      <Icon size={14} /> <span>{r.title}</span>
                    </button>
                  );
                }) : <div className="no-act"><CircleHelp size={14} /> No action uses this yet</div>}
              </div>
            </section>
          );
        })}
      </div>

      <div className="row-btns">
        <button className="btn primary" onClick={() => go('plan')}><ClipboardList size={16} /> See the action plan</button>
      </div>
    </div>
  );
}

/* ---------- Action plan ---------- */

function PlanSection(p) {
  const { form, set, plan, parsed, selected, setSelected, setAction, done, setDone, lifts, setLifts } = p;
  const t = plan.totals;
  const nowN = plan.buckets.now.length;
  const sel = plan.rows.find((r) => r.id === selected) || plan.buckets.now[0] || plan.rows[0];
  const hasMoney = Number(form.revenue) > 0;
  const hasHours = Number(form.teamHours) > 0;
  const nowSteps = plan.buckets.now;

  return (
    <div className="page">
      <PageHead icon={ClipboardList} eyebrow={`Action plan · ${form.horizon}`} title={form.name || 'Your action plan'} lede={form.goal}>
        {p.loadedExample && (
          <div className="notice">
            <Info size={16} />
            <span>Worked example with a saved model reply. Change any call below, or <button className="link" onClick={() => p.go('start')}>paste your own findings</button>.</span>
          </div>
        )}
      </PageHead>

      <section className="hero">
        <div className="hero-top">
          <div>
            <div className="hero-eyebrow">The so what, in one line</div>
            <div className="hero-line">
              {nowN ? `${nowN} action${nowN === 1 ? '' : 's'} to start now, using ${fmtDays(plan.used)} of the ${form.capacity} you have.` : 'Nothing qualifies to start now. Look at Test first and Plan next.'}
            </div>
            {nowN > 0 && <div className="hero-sub">Start with <b>{plan.buckets.now[0].title.toLowerCase()}</b>. It scores {plan.buckets.now[0].score}, the highest in the plan.</div>}
          </div>
          <div className="hero-actions">
            <button className="btn light" onClick={p.copyBrief}>{p.copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy brief</>}</button>
            <button className="btn light-ghost" onClick={p.downloadBrief}><Download size={16} /> Download .md</button>
          </div>
        </div>
        <CapacityBar plan={plan} dark />
      </section>

      <div className="kpis">
        <Kpi icon={Rocket} label="Do now" value={nowN} sub={`${plan.buckets.next.length} next · ${plan.buckets.test.length} to test · ${plan.buckets.park.length} parked`} accent />
        <Kpi icon={Clock} label="Capacity used" value={`${Math.round(plan.used * 10) / 10} / ${form.capacity}`} sub="person-days" />
        {hasMoney ? (
          <Kpi icon={Euro} label="Do now, per month" value={t.nowMoney.hi ? `${money(t.nowMoney.lo)} to ${money(t.nowMoney.hi)}` : '€0'} sub={t.nowMoney.w ? `Evidence-weighted ${money(t.nowMoney.w)}` : 'No revenue lever in Do now'} />
        ) : (
          <Kpi icon={Euro} label="Revenue range" value="Not set" sub={<button className="link" onClick={() => p.go('start')}>Add a baseline</button>} />
        )}
        {hasHours ? (
          <Kpi icon={Hourglass} label="Hours back, per week" value={t.nowHours.hi ? `${Math.round(t.nowHours.lo)} to ${Math.round(t.nowHours.hi)}` : '0'} sub={t.nowHours.w ? `Evidence-weighted ${Math.round(t.nowHours.w)} h` : 'No efficiency action in Do now'} />
        ) : (
          <Kpi icon={BadgeCheck} label="Quotes checked" value={`${plan.verified} / ${plan.insights.length}`} sub="found in your material" />
        )}
      </div>

      <div className="board">
        {BUCKETS.map((b) => {
          const Icon = BUCKET_ICONS[b.id];
          const list = plan.buckets[b.id];
          return (
            <section key={b.id} className={`col b-${b.id}`}>
              <div className="col-head">
                <div className="col-title"><Icon size={16} /> {b.label} <span className="col-n">{list.length}</span></div>
                <div className="col-desc">{b.desc}</div>
              </div>
              <div className="col-list">
                {list.length ? list.map((r) => {
                  const OIcon = OWNER_ICONS[r.owner] || Users;
                  return (
                    <button key={r.id} className={`act ${sel && sel.id === r.id ? 'sel' : ''}`} onClick={() => { setSelected(r.id); setTimeout(() => document.getElementById('action-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30); }}>
                      <div className="act-top">
                        <span className="score">{r.score}</span>
                        <span className="act-id">{r.id}</span>
                      </div>
                      <div className="act-title">{r.title}</div>
                      <div className="act-meta">
                        <span><OIcon size={12} /> {r.owner}</span>
                        <span><Clock size={12} /> {r.effort}</span>
                      </div>
                      {r.impact && b.id !== 'park' && <div className="act-impact">{r.impact.kind === 'hours' ? <Hourglass size={12} /> : <Euro size={12} />} {impactText(r.impact, true)}</div>}
                    </button>
                  );
                }) : <div className="col-empty">Nothing here</div>}
              </div>
            </section>
          );
        })}
      </div>

      {sel && <ActionDetail r={sel} plan={plan} setAction={setAction} form={form} lifts={lifts} />}

      <div className="two-cards">
        <Card icon={CalendarCheck} title="This week" sub="First steps from Do now. Tick them off as you go">
          {nowSteps.length ? (
            <ul className="todo">
              {nowSteps.map((r) => {
                const OIcon = OWNER_ICONS[r.owner] || Users;
                const on = !!done[r.id];
                return (
                  <li key={r.id}>
                    <button className={`todo-item ${on ? 'on' : ''}`} onClick={() => setDone((d) => ({ ...d, [r.id]: !d[r.id] }))}>
                      {on ? <SquareCheck size={18} /> : <Square size={18} />}
                      <span>
                        <span className="todo-owner"><OIcon size={12} /> {r.owner}</span>
                        <span className="todo-text">{r.first}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : <div className="no-act"><Info size={14} /> Nothing in Do now yet. Raise the capacity or check Test first.</div>}
        </Card>
        <Card icon={CircleHelp} title="What would change this plan" sub="Gaps in the material, from the model">
          {parsed.gaps.length ? (
            <div className="q-list">
              {parsed.gaps.map((g, i) => <div key={i} className="q"><span className="q-n">{i + 1}</span> {g}</div>)}
            </div>
          ) : <div className="no-act">No gaps listed.</div>}
          {plan.unlinked.length > 0 && (
            <div className="notice warn"><TriangleAlert size={16} /> {plan.unlinked.map((i) => i.id).join(', ')} {plan.unlinked.length === 1 ? 'has' : 'have'} no action yet.</div>
          )}
        </Card>
      </div>

      <Card icon={Ruler} title="Your planning assumptions" sub="Change these and every number above updates">
        <div className="assume-top">
          <div className="field">
            <span className="field-label">Person-days available</span>
            <Chips small options={CAPACITIES} value={Number(form.capacity)} onChange={(v) => set('capacity', Number(v))} placeholder="Days" numeric render={(o) => `${o}`} />
          </div>
          <div className="two-fields">
            <TextField label="Monthly revenue in scope (€)" type="number" value={form.revenue || ''} onChange={(v) => set('revenue', Math.max(0, Number(v) || 0))} placeholder="0" />
            <TextField label="Team hours a week" type="number" value={form.teamHours || ''} onChange={(v) => set('teamHours', Math.max(0, Number(v) || 0))} placeholder="0" />
          </div>
        </div>
        <div className="lift-grid">
          {Object.keys(DEFAULT_LIFTS).map((k) => (
            <div key={k} className="lift">
              <div className="lift-name">{k}</div>
              <div className="lift-inputs">
                <input type="number" min="0" step="0.5" value={lifts[k][0]} onChange={(e) => setLifts((l) => ({ ...l, [k]: [Math.max(0, Number(e.target.value) || 0), l[k][1]] }))} aria-label={`${k} low`} />
                <span>to</span>
                <input type="number" min="0" step="0.5" value={lifts[k][1]} onChange={(e) => setLifts((l) => ({ ...l, [k]: [l[k][0], Math.max(0, Number(e.target.value) || 0)] }))} aria-label={`${k} high`} />
                <span>%</span>
              </div>
              <div className="lift-of">{k === 'Efficiency' ? 'of team hours' : 'of monthly revenue'}</div>
            </div>
          ))}
        </div>
        <div className="notice warn">
          <Info size={16} />
          <span>These ranges are starting assumptions I set for illustration, not industry benchmarks. Replace them with your own past results. Ranges are added up straight, which overstates the total when two actions move the same customers.</span>
        </div>
        {p.edits > 0 && <button className="link" onClick={p.resetEdits}><RotateCcw size={13} /> Undo {p.edits} change{p.edits === 1 ? '' : 's'} to the model's calls</button>}
      </Card>
    </div>
  );
}

function ActionDetail({ r, plan, setAction, form, lifts }) {
  const BIcon = BUCKET_ICONS[r.bucket];
  const bucket = BUCKETS.find((b) => b.id === r.bucket);
  const lift = lifts[r.lever] || DEFAULT_LIFTS[r.lever];
  return (
    <section className="detail" id="action-detail">
      <div className="detail-head">
        <div>
          <div className="detail-id">{r.id} · built on {r.from.join(', ')}</div>
          <h2 className="detail-title">{r.title}</h2>
        </div>
        <span className={`bucket-tag b-${r.bucket}`}><BIcon size={14} /> {bucket.label}</span>
      </div>
      <div className="why"><span className="rule-id">{r.rule}</span> {r.why}</div>

      <div className="action-grid">
        <div className="action a-first">
          <div className="action-head"><Footprints size={16} /> First step this week</div>
          <p>{r.first}</p>
        </div>
        <div className="action a-metric">
          <div className="action-head"><TrendingUp size={16} /> Metric to watch</div>
          <p>{r.metric}</p>
        </div>
        <div className="action a-stop">
          <div className="action-head"><Ban size={16} /> Stop if</div>
          <p>{r.stop}</p>
        </div>
      </div>

      <div className="detail-grid">
        <div className="maths">
          <div className="mini-label">How the score is worked out (S1)</div>
          <div className="eq">
            <span className="term"><b>{r.reachPts}</b><small>Reach · {r.reach}</small></span>
            <span className="op">×</span>
            <span className="term"><b>{r.evidence}</b><small>Evidence</small></span>
            <span className="op">×</span>
            <span className="term"><b>{r.fitPts}</b><small>Fit · {r.fit}</small></span>
            <span className="op">÷</span>
            <span className="term"><b>{r.div}</b><small>Effort · {r.effort}</small></span>
            <span className="op">=</span>
            <span className="term total"><b>{r.score}</b><small>Score</small></span>
          </div>
          {r.impact ? (
            <div className="impact-line">
              {r.impact.kind === 'hours' ? <Hourglass size={15} /> : <Euro size={15} />}
              <span>
                <b>{impactText(r.impact)}</b>
                {r.impact.kind === 'hours'
                  ? ` = ${form.teamHours} h × ${lift[0]} to ${lift[1]}% × ${Math.round(REACH_SHARE[r.reach] * 100)}% reach.`
                  : ` = ${money(form.revenue)} × ${lift[0]} to ${lift[1]}% × ${Math.round(REACH_SHARE[r.reach] * 100)}% reach.`}
                {' '}Evidence-weighted: {r.impact.kind === 'hours' ? `${Math.round(r.impact.weighted)} h` : money(r.impact.weighted)} ({Math.round(EVIDENCE_WEIGHT[r.evidence] * 100)}%).
              </span>
            </div>
          ) : (
            <div className="impact-line muted"><Info size={15} /> <span>Add {r.lever === 'Efficiency' ? 'team hours' : 'monthly revenue'} to see a range for this action.</span></div>
          )}
          <div className="mini-label" style={{ marginTop: 14 }}>Built on</div>
          <div className="built-on">
            {r.linked.map((i) => (
              <div key={i.id} className="built">
                <span className="built-id">{i.id}</span>
                <span>{i.finding}</span>
                <Dots n={i.evidence} label="Evidence" />
              </div>
            ))}
          </div>
        </div>
        <div className="edit-side">
          <div className="mini-label">Disagree? Change the call</div>
          <div className="edit-row"><span>Effort</span><Chips small custom={false} options={EFFORTS} value={r.effort} onChange={(v) => setAction(r.id, 'effort', v)} /></div>
          <div className="edit-row"><span>Goal fit</span><Chips small custom={false} options={FITS} value={r.fit} onChange={(v) => setAction(r.id, 'fit', v)} /></div>
          <div className="edit-row"><span>Lever</span><Chips small custom={false} options={LEVERS} value={r.lever} onChange={(v) => setAction(r.id, 'lever', v)} /></div>
          <div className="edit-row"><span>Owner</span><Chips small options={OWNERS} value={r.owner} onChange={(v) => setAction(r.id, 'owner', v)} placeholder="Team" /></div>
          <div className="edit-note"><Clock size={13} /> {r.effort} counts as {fmtDays(EFFORT_DAYS[r.effort] || 10)} against capacity</div>
        </div>
      </div>
    </section>
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
        lede="Which action comes first should not depend on how a prompt is worded. So the model only reads and proposes. Everything that ranks, fills capacity or puts a number on an action is a printed rule you can check."
      />

      <div className="how-grid">
        <Card icon={Sparkles} title="What the model does" sub="One call, tagged lines back, no JSON">
          <ul className="tick-list">
            <li><Check size={16} /> Pulls out 3 to 7 insights and writes a so what for each against your goal</li>
            <li><Check size={16} /> Picks strength and reach from fixed word lists, with a quote copied from your material</li>
            <li><Check size={16} /> Proposes 3 to 8 actions with lever, effort, owner and goal fit from fixed lists</li>
            <li><Check size={16} /> Writes a first step, a metric and a stop condition for each</li>
            <li><Check size={16} /> Lists what is missing that would change the plan</li>
          </ul>
        </Card>
        <Card icon={Ban} title="What it never does" sub="These all happen in your browser">
          <ul className="tick-list muted">
            <li><X size={16} /> Rank the actions or decide what goes first</li>
            <li><X size={16} /> Decide what fits your capacity</li>
            <li><X size={16} /> Put money or hours on anything</li>
            <li><X size={16} /> Mark its own evidence as checked</li>
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
        <Card icon={Filter} title="The four buckets" sub="Every action lands in exactly one">
          <div className="bucket-list">
            {BUCKETS.map((b) => {
              const Icon = BUCKET_ICONS[b.id];
              return <div key={b.id} className={`bucket-row b-${b.id}`}><span className={`bucket-tag b-${b.id}`}><Icon size={14} /> {b.label}</span><p>{b.desc}</p></div>;
            })}
          </div>
        </Card>
        <Card icon={Euro} title="Where the numbers come from" sub="Read this before quoting a figure">
          <ul className="tick-list">
            <li><Info size={16} /> Money and hours only appear if you enter your own baselines</li>
            <li><Info size={16} /> The lever ranges are starting assumptions I set, not benchmarks. Replace them with your own past results</li>
            <li><Info size={16} /> Ranges add up straight, so overlapping actions overstate the total</li>
            <li><Info size={16} /> Effort counts as half a day, 3, 10 or 30 person-days</li>
          </ul>
        </Card>
      </div>

      <Card icon={Zap} title="Why this split" sub="The same design as Wrong Turn and Who Says Yes? in this repo">
        <p className="panel-text">Turning findings into action goes wrong in two predictable ways: the loudest quote becomes the roadmap, or everything gets planned and nothing fits the week. Checking each quote against the source catches the first. A capacity you set, filled in score order, catches the second. Because every call is a chip you can change, the plan becomes something a team can argue with in a meeting rather than accept or reject whole.</p>
      </Card>
    </div>
  );
}

/* ---------- Examples ---------- */

function ExamplesSection({ loadExample, loadedExample, startBlank }) {
  return (
    <div className="page">
      <PageHead icon={Layers} eyebrow="Examples" title="Three worked cases" lede="Each has the pasted material and a saved model reply, so it runs without a key. The rules treat them exactly like a live read." />
      <div className="ex-grid">
        {EXAMPLES.map((ex) => {
          const p = parsePlan(ex.text);
          const plan = buildPlan({ insights: p.insights, actions: p.actions, source: ex.source, capacity: ex.form.capacity, revenue: ex.form.revenue, teamHours: ex.form.teamHours, lifts: DEFAULT_LIFTS });
          return (
            <button key={ex.id} className={`ex-card ${loadedExample === ex.id ? 'current' : ''}`} onClick={() => loadExample(ex)}>
              <div className="ex-top">
                <span className="team-tag"><Briefcase size={13} /> {ex.team}</span>
                {loadedExample === ex.id && <span className="ex-current">Open now</span>}
              </div>
              <div className="ex-title">{ex.title}</div>
              <div className="ex-blurb">{ex.blurb}</div>
              <div className="ex-stats">
                {BUCKETS.map((b) => {
                  const Icon = BUCKET_ICONS[b.id];
                  return <span key={b.id} className={`ex-stat b-${b.id}`}><Icon size={12} /> {plan.buckets[b.id].length} {b.label.toLowerCase()}</span>;
                })}
              </div>
              <div className="ex-open">Open this plan <ArrowRight size={15} /></div>
            </button>
          );
        })}
        <button className="ex-card blank" onClick={startBlank}>
          <div className="ex-blank-icon"><Plus size={20} /></div>
          <div className="ex-title">Start with your own</div>
          <div className="ex-blurb">Paste your findings, set the goal and capacity, and build a plan.</div>
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
