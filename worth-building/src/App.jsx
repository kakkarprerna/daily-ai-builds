import React, { useMemo, useRef, useState } from 'react';
import {
  Calculator, SlidersHorizontal, FileText, BookOpen, Layers, Sparkles, Check, TriangleAlert, Plus, Copy,
  KeyRound, Users, Target, ShieldAlert, OctagonX, ArrowRight, Lightbulb, Gauge, Wallet, CalendarClock,
  TrendingUp, Scale, FlaskConical, Route, ClipboardCheck, Loader2, Database, Info, X
} from 'lucide-react';
import { runAll, eur, pct, paybackText, figureSheet, SCENARIOS, DRIVERS } from './calc.js';
import { parseNarrative, checkFigures } from './narrative.js';
import { EXAMPLES } from './examples.js';

const SECTIONS = [
  { id: 'build', icon: Calculator, label: 'Build a case', desc: 'Enter the idea and its numbers, see payback live' },
  { id: 'scenarios', icon: SlidersHorizontal, label: 'Scenarios', desc: 'Conservative to optimistic, and what moves it most' },
  { id: 'case', icon: FileText, label: 'The written case', desc: 'A case per approver, with checks and stop rules' },
  { id: 'how', icon: BookOpen, label: 'How it works', desc: 'Every formula, where numbers come from, limits' },
  { id: 'examples', icon: Layers, label: 'Examples', desc: 'Three worked cases, no key needed' }
];

const AUDIENCE_OPTIONS = ['Finance', 'Engineering lead', 'Head of Product', 'Operations lead', 'Legal and compliance', 'CEO or founder'];

const PROVIDERS = [
  { id: 'muse', label: 'Muse Glimmer', note: 'Free, on this site' },
  { id: 'anthropic', label: 'Anthropic', note: 'Your key' },
  { id: 'openai', label: 'OpenAI', note: 'Your key' },
  { id: 'gemini', label: 'Gemini', note: 'Your key' }
];

const SOURCE_LABELS = { measured: 'Measured', benchmark: 'Benchmark', guess: 'Guess' };

const BLANK = {
  name: '', idea: '', problem: '', users: '', alternative: '', audiences: ['Finance'],
  volume: 5000, minsSaved: 3, hourly: 30, redeploy: 50, peak: 70, rampMonths: 3,
  aiCostPerTask: 0.02, reviewRate: 10, reviewMins: 2, errorRate: 2, costPerError: 10,
  buildCost: 50000, runFixed: 1500, revenueBase: 0, upliftPct: 0, avoidedMonthly: 0, horizon: 24,
  sources: {}
};

const FIELDS = {
  volume: { label: 'Tasks per month', hint: 'Tickets, invoices, calls or documents the feature would touch', unit: 'per month', step: 100 },
  minsSaved: { label: 'Minutes saved per task', hint: 'Net of the time spent checking the AI output', unit: 'min', step: 0.5 },
  hourly: { label: 'Loaded hourly cost', hint: 'Salary plus employer costs. Ask finance for the loaded rate', unit: '€/h', step: 1 },
  redeploy: { label: 'Share of saved time put to use', hint: 'Saved minutes only count as money if they go somewhere', unit: '%', chips: [25, 50, 75, 100] },
  peak: { label: 'Peak adoption', hint: 'Share of tasks that go through the feature once it settles', unit: '%', chips: [40, 60, 75, 90] },
  rampMonths: { label: 'Months to reach peak', hint: 'Adoption grows in a straight line until then', unit: 'months', chips: [1, 3, 6, 9] },
  aiCostPerTask: { label: 'AI cost per task', hint: 'Model and API fees for one task, from the provider price page', unit: '€', step: 0.01 },
  reviewRate: { label: 'Share of outputs a person reviews', hint: 'Quality checks on top of normal use', unit: '%', step: 1 },
  reviewMins: { label: 'Minutes per review', hint: 'Time for one quality check', unit: 'min', step: 0.5 },
  errorRate: { label: 'Error rate', hint: 'Share of outputs that are wrong and get through', unit: '%', step: 0.5 },
  costPerError: { label: 'Cost of one error', hint: 'Rework, a callback, a refund or a write-off', unit: '€', step: 1 },
  buildCost: { label: 'One-off build cost', hint: 'People time to build and launch, plus any set-up fees', unit: '€', step: 1000 },
  runFixed: { label: 'Fixed monthly running cost', hint: 'Licences, hosting, monitoring and upkeep', unit: '€/month', step: 100 },
  avoidedMonthly: { label: 'Monthly cost avoided', hint: 'A contract, a tool or overtime you can actually stop paying', unit: '€/month', step: 500 },
  revenueBase: { label: 'Monthly revenue affected', hint: 'Revenue from the flow the feature changes', unit: '€/month', step: 1000 },
  upliftPct: { label: 'Revenue uplift', hint: 'Expected lift at full rollout', unit: '%', step: 0.5 }
};

const SOURCE_FIELDS = Object.keys(FIELDS);

export default function App() {
  const [section, setSection] = useState('build');
  const [form, setForm] = useState(EXAMPLES[0].form);
  const [loadedExample, setLoadedExample] = useState(EXAMPLES[0].id);
  const [narrativeText, setNarrativeText] = useState(EXAMPLES[0].narrative);
  const [narrativeFor, setNarrativeFor] = useState(JSON.stringify(EXAMPLES[0].form));
  const [provider, setProvider] = useState('muse');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const mainRef = useRef(null);

  const out = useMemo(() => runAll(form), [form]);
  const stale = narrativeText && narrativeFor !== JSON.stringify(form);
  const validateFirst = useMemo(
    () => out.sensitivity.slice(0, 6).filter((d) => (form.sources?.[d.key] || 'guess') !== 'measured').slice(0, 4),
    [out, form.sources]
  );

  const go = (id) => {
    setSection(id);
    if (mainRef.current) mainRef.current.scrollTo({ top: 0 });
  };

  const set = (k, v) => {
    setLoadedExample(null);
    setForm((f) => ({ ...f, [k]: v }));
  };
  const setSource = (k, v) => {
    setLoadedExample(null);
    setForm((f) => ({ ...f, sources: { ...f.sources, [k]: v } }));
  };

  const loadExample = (ex) => {
    setForm(ex.form);
    setLoadedExample(ex.id);
    setNarrativeText(ex.narrative);
    setNarrativeFor(JSON.stringify(ex.form));
    setError('');
    go('build');
  };

  const startBlank = () => {
    setForm(BLANK);
    setLoadedExample(null);
    setNarrativeText('');
    setNarrativeFor('');
    setError('');
    go('build');
  };

  const writeCase = async () => {
    setError('');
    if (!form.name.trim() || !form.idea.trim()) {
      setError('Add a name and a line on what the feature does first.');
      return;
    }
    setBusy(true);
    try {
      const inputLines = SOURCE_FIELDS.filter((k) => Number(out.inputs[k]) > 0).map(
        (k) => `${FIELDS[k].label}: ${fmtInput(k, out.inputs[k])} (${SOURCE_LABELS[form.sources?.[k] || 'guess']})`
      );
      const r = await fetch('/api/case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider, apiKey, model,
          name: form.name, idea: form.idea, problem: form.problem, users: form.users,
          alternative: form.alternative, audiences: form.audiences,
          inputLines, figures: figureSheet(out),
          validateFirst: validateFirst.map((d) => `${d.label}, entered as ${SOURCE_LABELS[form.sources?.[d.key] || 'guess'].toLowerCase()}`)
        })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
      if (!parseNarrative(data.text).summary) throw new Error('The model replied, but not in the expected format. Try again or switch provider.');
      setNarrativeText(data.text);
      setNarrativeFor(JSON.stringify(form));
      go('case');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const narrative = useMemo(() => parseNarrative(narrativeText), [narrativeText]);
  const figCheck = useMemo(() => checkFigures(narrativeText, out), [narrativeText, out]);

  const copyCase = async () => {
    const text = caseAsText(form, out, narrative);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('Copy failed in this browser. Select the text instead.');
    }
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><TrendingUp size={20} /></div>
          <div>
            <div className="brand-name">Worth Building?</div>
            <div className="brand-sub">Business cases for AI features</div>
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
        <div className="side-verdict">
          <div className="side-verdict-label">Current verdict</div>
          <VerdictPill v={out.verdict} />
          <div className="side-verdict-line">{form.name || 'Untitled feature'}</div>
        </div>
        <div className="side-foot">A daily AI build by Prerna Kakkar</div>
      </aside>

      <main className="main" ref={mainRef}>
        {section === 'build' && (
          <BuildSection
            form={form} set={set} setSource={setSource} out={out} validateFirst={validateFirst}
            loadedExample={loadedExample} startBlank={startBlank}
            provider={provider} setProvider={setProvider} apiKey={apiKey} setApiKey={setApiKey}
            model={model} setModel={setModel} busy={busy} error={error} writeCase={writeCase}
            hasCase={!!narrativeText} stale={stale} go={go}
          />
        )}
        {section === 'scenarios' && <ScenarioSection out={out} form={form} />}
        {section === 'case' && (
          <CaseSection
            form={form} out={out} narrative={narrative} hasCase={!!narrativeText} stale={stale}
            figCheck={figCheck} copyCase={copyCase} copied={copied} go={go} writeCase={writeCase} busy={busy} error={error}
          />
        )}
        {section === 'how' && <HowSection />}
        {section === 'examples' && <ExamplesSection loadExample={loadExample} loadedExample={loadedExample} startBlank={startBlank} />}
      </main>
    </div>
  );
}

function fmtInput(k, v) {
  const u = FIELDS[k].unit;
  if (u === '%') return `${round(v)}%`;
  if (u.startsWith('€')) return `${eur(v)}${u.replace('€', '')}`;
  return `${round(v)} ${u}`;
}

function round(v) {
  return Math.round(v * 100) / 100;
}

/* ---------- Build ---------- */

function BuildSection(p) {
  const { form, set, setSource, out, validateFirst } = p;
  return (
    <div className="page">
      <header className="page-head">
        <div className="eyebrow"><Calculator size={14} /> Build a case</div>
        <h1>Is this AI feature worth the money?</h1>
        <p className="lede">Enter the idea and your best numbers. The figures update as you type and use fixed formulas, with no model involved. A model then writes the case around them for each person who signs it off.</p>
        <div className="steps">
          <Step n="1" icon={Wallet} text="Your numbers, tagged by how sure you are" />
          <Step n="2" icon={Gauge} text="Payback, net value and scenarios, worked out in the browser" />
          <Step n="3" icon={FileText} text="A written case, figure-checked against the sheet" />
        </div>
        {p.loadedExample && (
          <div className="notice">
            <Info size={16} />
            <span>Showing a worked example. Change any field to make it your own, or <button className="link" onClick={p.startBlank}>start blank</button>.</span>
          </div>
        )}
      </header>

      <div className="build-grid">
        <div className="build-form">
          <Card icon={Lightbulb} title="The feature" sub="What it is and the problem it solves">
            <TextField label="Name" value={form.name} onChange={(v) => set('name', v)} placeholder="Reply Draft" />
            <TextField label="What it does" value={form.idea} onChange={(v) => set('idea', v)} area placeholder="Drafts a first reply to each ticket for an agent to edit and send" />
            <TextField label="Problem today" value={form.problem} onChange={(v) => set('problem', v)} area placeholder="Agents write most replies from scratch and handling time keeps rising" />
            <TextField label="Who uses it" value={form.users} onChange={(v) => set('users', v)} placeholder="60 tier-one support agents" />
            <TextField label="Simpler option you considered" value={form.alternative} onChange={(v) => set('alternative', v)} placeholder="Optional. A non-AI way to get some of the value" />
          </Card>

          <Card icon={Users} title="Who signs it off" sub="Each one gets their own pitch, objection and answer">
            <MultiChips options={AUDIENCE_OPTIONS} value={form.audiences} onChange={(v) => set('audiences', v)} />
          </Card>

          <Card icon={Gauge} title="Volume and time" sub="Where most cases are won or lost">
            <SourceKey />
            {['volume', 'minsSaved', 'hourly', 'redeploy'].map((k) => (
              <NumField key={k} k={k} form={form} set={set} setSource={setSource} />
            ))}
          </Card>

          <Card icon={CalendarClock} title="Adoption" sub="How many tasks go through it, and how fast">
            {['peak', 'rampMonths'].map((k) => <NumField key={k} k={k} form={form} set={set} setSource={setSource} />)}
          </Card>

          <Card icon={Wallet} title="Costs" sub="Build, running, review and the price of mistakes">
            {['buildCost', 'runFixed', 'aiCostPerTask', 'reviewRate', 'reviewMins', 'errorRate', 'costPerError'].map((k) => (
              <NumField key={k} k={k} form={form} set={set} setSource={setSource} />
            ))}
          </Card>

          <Card icon={TrendingUp} title="Other value" sub="Optional. Leave at zero if it does not apply">
            {['avoidedMonthly', 'revenueBase', 'upliftPct'].map((k) => <NumField key={k} k={k} form={form} set={set} setSource={setSource} />)}
          </Card>

          <Card icon={CalendarClock} title="Horizon" sub="How far ahead the case looks">
            <Chips options={[12, 24, 36]} value={form.horizon} onChange={(v) => set('horizon', v)} suffix=" months" />
          </Card>

          <Card icon={KeyRound} title="Model for the written case" sub="The figures never depend on this">
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
            <button className="btn primary wide" onClick={p.writeCase} disabled={p.busy}>
              {p.busy ? <Loader2 size={18} className="spin" /> : <Sparkles size={18} />}
              {p.busy ? 'Writing the case' : p.hasCase && !p.stale ? 'Rewrite the case' : 'Write the case'}
            </button>
            {p.error && <div className="error"><TriangleAlert size={16} /> {p.error}</div>}
            {p.hasCase && !p.stale && (
              <button className="btn ghost wide" onClick={() => p.go('case')}>Open the written case <ArrowRight size={16} /></button>
            )}
          </Card>
        </div>

        <div className="build-results">
          <div className="sticky-results">
            <ResultsPanel out={out} validateFirst={validateFirst} form={form} go={p.go} />
          </div>
        </div>
      </div>
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

function ResultsPanel({ out, validateFirst, form, go }) {
  const r = out.results.base;
  const h = out.inputs.horizon;
  return (
    <div className="results">
      <div className={`verdict-card v-${out.verdict.key}`}>
        <div className="verdict-top">
          <VerdictIcon k={out.verdict.key} />
          <div>
            <div className="verdict-label">{out.verdict.label}</div>
            <div className="verdict-line">{out.verdict.line}</div>
          </div>
        </div>
      </div>
      <div className="kpis">
        <Kpi icon={CalendarClock} label="Payback" value={r.paybackMonth ? `Month ${r.paybackMonth}` : 'Not yet'} sub={r.paybackMonth ? `of ${h}` : `inside ${h} months`} />
        <Kpi icon={Wallet} label={`Net over ${h} months`} value={eur(r.netValue)} sub="after build and running" />
        <Kpi icon={TrendingUp} label="Return on money in" value={pct(r.roi)} sub="net value / total spend" />
        <Kpi icon={Gauge} label="Monthly net at peak" value={eur(r.steadyNet)} sub={`${eur(r.steadyBenefit)} in, ${eur(r.steadyCost)} out`} />
      </div>
      <div className="panel">
        <div className="panel-title"><Route size={16} /> Cumulative cash by scenario</div>
        <CashChart out={out} />
        <div className="legend">
          <span><i className="lg lg-opt" /> Optimistic</span>
          <span><i className="lg lg-base" /> Base</span>
          <span><i className="lg lg-con" /> Conservative</span>
        </div>
      </div>
      <div className="panel">
        <div className="panel-title"><Scale size={16} /> One month at peak adoption</div>
        <Breakdown row={r} out={out} />
      </div>
      <div className="panel">
        <div className="panel-title"><FlaskConical size={16} /> Check these first</div>
        <p className="panel-sub">The inputs that move the result most and are not measured yet.</p>
        {validateFirst.length === 0 ? (
          <div className="ok-line"><Check size={16} /> The biggest drivers are all measured.</div>
        ) : (
          <ul className="icon-list">
            {validateFirst.map((d) => (
              <li key={d.key}>
                <span className={`src-dot s-${form.sources?.[d.key] || 'guess'}`} />
                <span className="il-main">{d.label}</span>
                <span className="il-side">±{eur(Math.abs(d.high))} on net</span>
              </li>
            ))}
          </ul>
        )}
        <button className="btn ghost small" onClick={() => go('scenarios')}>See every scenario <ArrowRight size={14} /></button>
      </div>
    </div>
  );
}

function VerdictIcon({ k }) {
  if (k === 'strong') return <div className="v-icon"><Check size={20} /></div>;
  if (k === 'workable') return <div className="v-icon"><Scale size={20} /></div>;
  if (k === 'weak') return <div className="v-icon"><TriangleAlert size={20} /></div>;
  return <div className="v-icon"><OctagonX size={20} /></div>;
}

function VerdictPill({ v }) {
  return <span className={`pill v-${v.key}`}>{v.label}</span>;
}

function Kpi({ icon: Icon, label, value, sub }) {
  return (
    <div className="kpi">
      <div className="kpi-label"><Icon size={14} /> {label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}

function CashChart({ out }) {
  const W = 420, H = 190, pad = { l: 46, r: 10, t: 12, b: 24 };
  const series = ['optimistic', 'base', 'conservative'].map((k) => ({
    k,
    pts: [{ m: 0, v: -applyBuild(out, k) }, ...out.results[k].rows.map((r) => ({ m: r.m, v: r.cumulative }))]
  }));
  const all = series.flatMap((s) => s.pts.map((p) => p.v));
  let min = Math.min(0, ...all), max = Math.max(0, ...all);
  if (max === min) max = min + 1;
  const hzn = out.inputs.horizon;
  const x = (m) => pad.l + (m / hzn) * (W - pad.l - pad.r);
  const y = (v) => pad.t + ((max - v) / (max - min)) * (H - pad.t - pad.b);
  const ticks = [min, 0, max].filter((v, i, a) => a.indexOf(v) === i);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Cumulative cash by scenario">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className={t === 0 ? 'zero' : 'grid'} />
          <text x={pad.l - 6} y={y(t) + 4} className="axis" textAnchor="end">{eur(t)}</text>
        </g>
      ))}
      {[0, Math.round(hzn / 2), hzn].map((m) => (
        <text key={m} x={x(m)} y={H - 6} className="axis" textAnchor="middle">{m === 0 ? 'Start' : `M${m}`}</text>
      ))}
      {series.map((s) => (
        <path key={s.k} className={`line l-${s.k}`} d={s.pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.m).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ')} />
      ))}
      {out.results.base.paybackMonth && (
        <circle cx={x(out.results.base.paybackMonth)} cy={y(out.results.base.rows[out.results.base.paybackMonth - 1].cumulative)} r="4.5" className="pay-dot" />
      )}
    </svg>
  );
}

function applyBuild(out, k) {
  return out.inputs.buildCost * SCENARIOS[k].build;
}

function Breakdown({ row }) {
  const last = row.rows[row.rows.length - 1];
  const items = [
    { label: 'Time saved', v: last.timeValue, side: 'in' },
    { label: 'Cost avoided', v: last.avoidedValue, side: 'in' },
    { label: 'Revenue lift', v: last.revenueValue, side: 'in' },
    { label: 'AI fees', v: last.aiCost, side: 'out' },
    { label: 'Fixed running', v: last.cost - last.aiCost - last.reviewCost - last.errorCost, side: 'out' },
    { label: 'Human review', v: last.reviewCost, side: 'out' },
    { label: 'Errors', v: last.errorCost, side: 'out' }
  ].filter((i) => i.v > 0.5);
  const max = Math.max(...items.map((i) => i.v), 1);
  return (
    <div className="bars">
      {items.map((i) => (
        <div key={i.label} className="bar-row">
          <div className="bar-label">{i.label}</div>
          <div className="bar-track"><div className={`bar ${i.side}`} style={{ width: `${(i.v / max) * 100}%` }} /></div>
          <div className="bar-val">{i.side === 'out' ? '-' : '+'}{eur(i.v)}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Inputs ---------- */

function Card({ icon: Icon, title, sub, children }) {
  return (
    <section className="card">
      <div className="card-head">
        <div className="card-icon"><Icon size={18} /></div>
        <div>
          <h2>{title}</h2>
          {sub && <div className="card-sub">{sub}</div>}
        </div>
      </div>
      <div className="card-body">{children}</div>
    </section>
  );
}

function TextField({ label, value, onChange, placeholder, area, type = 'text' }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {area ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={2} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete="off" />
      )}
    </label>
  );
}

function SourceKey() {
  return (
    <div className="source-key">
      <span>Tag each number:</span>
      <span><i className="src-dot s-measured" /> Measured</span>
      <span><i className="src-dot s-benchmark" /> Benchmark</span>
      <span><i className="src-dot s-guess" /> Guess</span>
    </div>
  );
}

function NumField({ k, form, set, setSource }) {
  const f = FIELDS[k];
  const src = form.sources?.[k] || 'guess';
  return (
    <div className="num-field">
      <div className="num-top">
        <div>
          <div className="field-label">{f.label}</div>
          <div className="field-hint">{f.hint}</div>
        </div>
        <div className="src-toggle" role="group" aria-label={`How sure is ${f.label}`}>
          {Object.keys(SOURCE_LABELS).map((s) => (
            <button key={s} className={`src-btn ${src === s ? 'on' : ''} s-${s}`} onClick={() => setSource(k, s)} title={SOURCE_LABELS[s]}>
              {SOURCE_LABELS[s]}
            </button>
          ))}
        </div>
      </div>
      {f.chips ? (
        <Chips options={f.chips} value={form[k]} onChange={(v) => set(k, v)} suffix={f.unit === '%' ? '%' : ` ${f.unit}`} custom />
      ) : (
        <div className="num-input">
          <input type="number" inputMode="decimal" min="0" step={f.step} value={form[k]} onChange={(e) => set(k, e.target.value === '' ? '' : Number(e.target.value))} />
          <span className="unit">{f.unit}</span>
        </div>
      )}
    </div>
  );
}

function Chips({ options, value, onChange, suffix = '', custom }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const isCustom = !options.includes(Number(value));
  const commit = () => {
    const v = Number(draft);
    if (Number.isFinite(v) && v > 0) onChange(v);
    setAdding(false);
    setDraft('');
  };
  return (
    <div className="chip-row">
      {options.map((o) => (
        <button key={o} className={`chip ${Number(value) === o ? 'on' : ''}`} onClick={() => onChange(o)}>{o}{suffix}</button>
      ))}
      {custom && isCustom && !adding && <button className="chip on">{value}{suffix}</button>}
      {custom && (adding ? (
        <span className="chip-add">
          <input autoFocus type="number" inputMode="decimal" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && commit()} placeholder="Your value" />
          <button className="chip-ok" onClick={commit} aria-label="Add"><Check size={14} /></button>
          <button className="chip-ok" onClick={() => setAdding(false)} aria-label="Cancel"><X size={14} /></button>
        </span>
      ) : (
        <button className="chip dashed" onClick={() => setAdding(true)}><Plus size={14} /> Own value</button>
      ))}
    </div>
  );
}

function MultiChips({ options, value, onChange }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const all = [...options, ...value.filter((v) => !options.includes(v))];
  const toggle = (o) => onChange(value.includes(o) ? value.filter((v) => v !== o) : [...value, o]);
  const commit = () => {
    const v = draft.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setAdding(false);
    setDraft('');
  };
  return (
    <div className="chip-row">
      {all.map((o) => (
        <button key={o} className={`chip ${value.includes(o) ? 'on' : ''}`} onClick={() => toggle(o)}>
          {value.includes(o) && <Check size={14} />} {o}
        </button>
      ))}
      {adding ? (
        <span className="chip-add">
          <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && commit()} placeholder="Another approver" />
          <button className="chip-ok" onClick={commit} aria-label="Add"><Check size={14} /></button>
          <button className="chip-ok" onClick={() => setAdding(false)} aria-label="Cancel"><X size={14} /></button>
        </span>
      ) : (
        <button className="chip dashed" onClick={() => setAdding(true)}><Plus size={14} /> Add your own</button>
      )}
    </div>
  );
}

/* ---------- Scenarios ---------- */

function ScenarioSection({ out, form }) {
  const h = out.inputs.horizon;
  const top = out.sensitivity.slice(0, 8);
  const maxSwing = Math.max(...top.map((d) => Math.max(Math.abs(d.low), Math.abs(d.high))), 1);
  return (
    <div className="page">
      <header className="page-head">
        <div className="eyebrow"><SlidersHorizontal size={14} /> Scenarios</div>
        <h1>How sure is the answer?</h1>
        <p className="lede">Three versions of the same case, then each input moved down and up by a quarter to see which ones the result rests on.</p>
      </header>
      <div className="scen-grid">
        {Object.entries(SCENARIOS).map(([k, s]) => {
          const r = out.results[k];
          return (
            <div key={k} className={`scen-card sc-${k}`}>
              <div className="scen-name">{s.label}</div>
              <div className="scen-big">{eur(r.netValue)}</div>
              <div className="scen-sub">net over {h} months</div>
              <ul className="scen-stats">
                <li><CalendarClock size={14} /> Payback {paybackText(r, h)}</li>
                <li><TrendingUp size={14} /> Return {pct(r.roi)}</li>
                <li><Gauge size={14} /> {eur(r.steadyNet)} a month at peak</li>
              </ul>
              <div className="scen-note">{s.note}</div>
            </div>
          );
        })}
      </div>

      <section className="card">
        <div className="card-head">
          <div className="card-icon"><Target size={18} /></div>
          <div>
            <h2>What the result rests on</h2>
            <div className="card-sub">Change in net value over {h} months when one input moves 25% down or up, everything else held</div>
          </div>
        </div>
        <div className="tornado">
          {top.map((d) => {
            const src = form.sources?.[d.key] || 'guess';
            return (
              <div key={d.key} className="t-row">
                <div className="t-label">
                  <span className={`src-dot s-${src}`} title={SOURCE_LABELS[src]} />
                  {d.label}
                </div>
                <div className="t-track">
                  <div className="t-mid" />
                  <TBar v={d.low} max={maxSwing} />
                  <TBar v={d.high} max={maxSwing} />
                </div>
                <div className="t-val">±{eur(Math.max(Math.abs(d.low), Math.abs(d.high)))}</div>
              </div>
            );
          })}
        </div>
        <div className="legend">
          <span><i className="lg lg-up" /> Raises net value</span>
          <span><i className="lg lg-down" /> Lowers net value</span>
          <span><i className="src-dot s-guess" /> Guess</span>
          <span><i className="src-dot s-benchmark" /> Benchmark</span>
          <span><i className="src-dot s-measured" /> Measured</span>
        </div>
        <p className="panel-sub">A guess near the top of this list is where to spend the first week. A measured input near the top is good news.</p>
      </section>
    </div>
  );
}

function TBar({ v, max }) {
  const w = (Math.abs(v) / max) * 50;
  const style = v >= 0 ? { left: '50%', width: `${w}%` } : { right: '50%', width: `${w}%` };
  return <div className={`t-bar ${v >= 0 ? 'up' : 'down'}`} style={style} />;
}

/* ---------- Written case ---------- */

function CaseSection({ form, out, narrative, hasCase, stale, figCheck, copyCase, copied, go, writeCase, busy, error }) {
  const h = out.inputs.horizon;
  if (!hasCase) {
    return (
      <div className="page">
        <header className="page-head">
          <div className="eyebrow"><FileText size={14} /> The written case</div>
          <h1>No written case yet</h1>
          <p className="lede">Fill in the feature and its numbers, then press Write the case. Or open an example to see a finished one.</p>
          <div className="row-btns">
            <button className="btn primary" onClick={() => go('build')}><Calculator size={16} /> Build a case</button>
            <button className="btn ghost" onClick={() => go('examples')}><Layers size={16} /> Examples</button>
          </div>
        </header>
      </div>
    );
  }
  return (
    <div className="page">
      <header className="page-head">
        <div className="eyebrow"><FileText size={14} /> The written case</div>
        <h1>{form.name || 'Untitled feature'}</h1>
        <div className="case-meta">
          <VerdictPill v={out.verdict} />
          <span className="meta-chip"><CalendarClock size={14} /> Payback {paybackText(out.results.base, h)}</span>
          <span className="meta-chip"><Wallet size={14} /> {eur(out.results.base.netValue)} over {h} months</span>
        </div>
        <div className="row-btns">
          <button className="btn primary" onClick={copyCase}>{copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy as text'}</button>
          {stale && <button className="btn ghost" onClick={writeCase} disabled={busy}>{busy ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />} Rewrite for the new numbers</button>}
        </div>
        {stale && <div className="notice warn"><TriangleAlert size={16} /> The inputs changed after this case was written. The figures in the header are current; the text below may not be.</div>}
        {error && <div className="error"><TriangleAlert size={16} /> {error}</div>}
        <div className={`notice ${figCheck.unknown.length ? 'warn' : 'good'}`}>
          {figCheck.unknown.length ? <TriangleAlert size={16} /> : <ClipboardCheck size={16} />}
          {figCheck.unknown.length
            ? <>Figure check: {figCheck.unknown.length} figure{figCheck.unknown.length > 1 ? 's' : ''} in the text {figCheck.unknown.length > 1 ? 'are' : 'is'} not on the sheet ({figCheck.unknown.join(', ')}). Check before sending.</>
            : <>Figure check: all {figCheck.checked} figures in the text match the calculated sheet.</>}
        </div>
      </header>

      <section className="case-hero">
        <div className="case-block">
          <div className="cb-label"><Sparkles size={14} /> Summary</div>
          <p>{narrative.summary}</p>
        </div>
        <div className="case-two">
          <div className="case-block soft">
            <div className="cb-label"><Lightbulb size={14} /> The problem</div>
            <p>{narrative.problem}</p>
          </div>
          <div className="case-block soft">
            <div className="cb-label"><Target size={14} /> The ask</div>
            <p>{narrative.ask}</p>
          </div>
        </div>
      </section>

      {narrative.audiences.length > 0 && (
        <section className="card">
          <div className="card-head"><div className="card-icon"><Users size={18} /></div><div><h2>Pitch per approver</h2><div className="card-sub">Lead with what they care about, and have the answer ready</div></div></div>
          <div className="aud-grid">
            {narrative.audiences.map((a, i) => (
              <div key={i} className="aud-card">
                <div className="aud-who">{a.who}</div>
                <div className="aud-cares">Cares about: {a.cares}</div>
                <div className="aud-row"><span className="aud-tag lead">Lead with</span><p>{a.lead}</p></div>
                <div className="aud-row"><span className="aud-tag obj">They will ask</span><p>{a.objection}</p></div>
                <div className="aud-row"><span className="aud-tag ans">Your answer</span><p>{a.answer}</p></div>
              </div>
            ))}
          </div>
        </section>
      )}

      {narrative.validate.length > 0 && (
        <section className="card">
          <div className="card-head"><div className="card-icon"><FlaskConical size={18} /></div><div><h2>Check before you commit</h2><div className="card-sub">The cheapest real test for each assumption, and who runs it</div></div></div>
          <div className="check-list">
            {narrative.validate.map((v, i) => (
              <div key={i} className="check-item">
                <div className="check-n">{i + 1}</div>
                <div>
                  <div className="check-what">{v.what}</div>
                  <div className="check-how">{v.check}</div>
                  <div className="check-owner"><Users size={12} /> {v.owner}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="case-two">
        {narrative.risks.length > 0 && (
          <section className="card">
            <div className="card-head"><div className="card-icon"><ShieldAlert size={18} /></div><div><h2>Risks</h2></div></div>
            <div className="mini-list">
              {narrative.risks.map((r, i) => (
                <div key={i} className="mini-item"><div className="mini-main">{r.risk}</div><div className="mini-sub"><Check size={12} /> {r.mitigation}</div></div>
              ))}
            </div>
          </section>
        )}
        {narrative.kills.length > 0 && (
          <section className="card">
            <div className="card-head"><div className="card-icon"><OctagonX size={18} /></div><div><h2>Stop if</h2></div></div>
            <div className="mini-list">
              {narrative.kills.map((k, i) => <div key={i} className="mini-item"><div className="mini-main">{k}</div></div>)}
            </div>
          </section>
        )}
      </div>

      {narrative.alternatives.length > 0 && (
        <section className="card">
          <div className="card-head"><div className="card-icon"><Route size={18} /></div><div><h2>The option without AI</h2></div></div>
          <div className="mini-list">
            {narrative.alternatives.map((a, i) => (
              <div key={i} className="mini-item"><div className="mini-main">{a.option}</div><div className="mini-sub"><ArrowRight size={12} /> {a.wins}</div></div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function caseAsText(form, out, n) {
  const h = out.inputs.horizon;
  const r = out.results;
  const lines = [
    `${form.name || 'Untitled feature'}: business case`,
    '',
    `Verdict: ${out.verdict.label}`,
    `Payback: ${paybackText(r.base, h)} (conservative ${paybackText(r.conservative, h)}, optimistic ${paybackText(r.optimistic, h)})`,
    `Net value over ${h} months: ${eur(r.base.netValue)} (conservative ${eur(r.conservative.netValue)}, optimistic ${eur(r.optimistic.netValue)})`,
    `Return on money in: ${pct(r.base.roi)}`,
    '',
    'Summary', n.summary, '',
    'Problem', n.problem, '',
    'Ask', n.ask, ''
  ];
  if (n.audiences.length) {
    lines.push('By approver');
    for (const a of n.audiences) lines.push(`${a.who}. Lead with: ${a.lead} They will ask: ${a.objection} Answer: ${a.answer}`);
    lines.push('');
  }
  if (n.validate.length) {
    lines.push('Check before committing');
    n.validate.forEach((v, i) => lines.push(`${i + 1}. ${v.what}: ${v.check} (${v.owner})`));
    lines.push('');
  }
  if (n.risks.length) {
    lines.push('Risks');
    for (const x of n.risks) lines.push(`* ${x.risk}. Mitigation: ${x.mitigation}`);
    lines.push('');
  }
  if (n.kills.length) {
    lines.push('Stop if');
    for (const k of n.kills) lines.push(`* ${k}`);
    lines.push('');
  }
  if (n.alternatives.length) {
    lines.push('Option without AI');
    for (const a of n.alternatives) lines.push(`* ${a.option}. Wins when: ${a.wins}`);
    lines.push('');
  }
  lines.push('Figures calculated with fixed formulas in Worth Building?. Narrative drafted by a model and figure-checked against the sheet.');
  return lines.join('\n');
}

/* ---------- How it works ---------- */

function HowSection() {
  return (
    <div className="page">
      <header className="page-head">
        <div className="eyebrow"><BookOpen size={14} /> How it works</div>
        <h1>Where every number comes from</h1>
        <p className="lede">The maths runs in your browser with the formulas below. The model only writes words, and a check flags any figure it adds that is not on the sheet.</p>
      </header>

      <div className="how-grid">
        <section className="card">
          <div className="card-head"><div className="card-icon"><Calculator size={18} /></div><div><h2>The monthly model</h2><div className="card-sub">Worked out for every month of the horizon</div></div></div>
          <div className="formula-list">
            <Formula name="Progress" f="min(1, month ÷ months to reach peak)" />
            <Formula name="Tasks handled" f="tasks per month × peak adoption × progress" />
            <Formula name="Time value" f="tasks handled × minutes saved ÷ 60 × hourly cost × share put to use" />
            <Formula name="Other value" f="(cost avoided + revenue × uplift) × progress" />
            <Formula name="AI fees" f="tasks handled × AI cost per task" />
            <Formula name="Review" f="tasks handled × review share × minutes per review ÷ 60 × hourly cost" />
            <Formula name="Errors" f="tasks handled × error rate × cost of one error" />
            <Formula name="Net" f="time value + other value − fixed running − AI fees − review − errors" />
            <Formula name="Cumulative" f="− build cost + net for each month so far" />
            <Formula name="Payback" f="first month the cumulative figure reaches zero" />
            <Formula name="Return" f="net value ÷ (build cost + all running costs)" />
          </div>
        </section>

        <section className="card">
          <div className="card-head"><div className="card-icon"><Scale size={18} /></div><div><h2>Verdict bands</h2><div className="card-sub">Fixed, checked in this order</div></div></div>
          <div className="band-list">
            <div className="band"><span className="pill v-none">No case</span><p>Still loses money each month at full adoption.</p></div>
            <div className="band"><span className="pill v-strong">Strong case</span><p>Pays back by month 6 and returns at least 100%.</p></div>
            <div className="band"><span className="pill v-workable">Workable case</span><p>Pays back inside the horizon.</p></div>
            <div className="band"><span className="pill v-weak">Weak case</span><p>Profitable each month at peak, but the build cost is not recovered in time.</p></div>
          </div>
        </section>

        <section className="card">
          <div className="card-head"><div className="card-icon"><SlidersHorizontal size={18} /></div><div><h2>Scenarios and sensitivity</h2></div></div>
          <div className="mini-list">
            {Object.values(SCENARIOS).map((s) => (
              <div key={s.label} className="mini-item"><div className="mini-main">{s.label}</div><div className="mini-sub">{s.note}</div></div>
            ))}
            <div className="mini-item"><div className="mini-main">Sensitivity</div><div className="mini-sub">Each of {DRIVERS.length} inputs moves 25% down then up with the rest held, and the change in net value is ranked by size.</div></div>
          </div>
        </section>

        <section className="card">
          <div className="card-head"><div className="card-icon"><Database size={18} /></div><div><h2>Where the numbers come from</h2><div className="card-sub">All of them are yours. Nothing is looked up or assumed by the app</div></div></div>
          <div className="mini-list">
            <Source name="Tasks per month" where="Ticketing, CRM or finance system reports" />
            <Source name="Minutes saved" where="A timed pilot on real work, with and without the feature" />
            <Source name="Loaded hourly cost" where="Finance, who can give the loaded rate for the role" />
            <Source name="AI cost per task" where="The provider's price page, times the typical tokens per task" />
            <Source name="Error rate" where="An evaluation set run before launch" />
            <Source name="Build cost" where="Engineering estimate in people weeks, times the weekly cost" />
          </div>
        </section>

        <section className="card">
          <div className="card-head"><div className="card-icon"><Sparkles size={18} /></div><div><h2>What the model does</h2></div></div>
          <ul className="tick-list">
            <li><Check size={16} /> Receives the figure sheet and your description, and writes the summary, a pitch per approver, checks, risks, stop rules and a non-AI option</li>
            <li><Check size={16} /> Is told to quote only figures from the sheet. A figure check then scans every euro amount, percentage and month in the text</li>
            <li><Check size={16} /> Runs on Meta Muse Glimmer by default, free on this site. Bring your own key for Anthropic, OpenAI or Gemini. Keys are used for one request and not stored</li>
          </ul>
        </section>

        <section className="card">
          <div className="card-head"><div className="card-icon"><TriangleAlert size={18} /></div><div><h2>What it leaves out</h2></div></div>
          <ul className="tick-list muted">
            <li><Info size={16} /> No discounting, tax or depreciation. Finance can add these once the case passes this first test</li>
            <li><Info size={16} /> Adoption grows in a straight line, which is simpler than real rollouts</li>
            <li><Info size={16} /> Sensitivity moves one input at a time, so it misses inputs that fail together</li>
            <li><Info size={16} /> Saved time only counts at the share you say is put to use. That share is the most argued number in most AI cases</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function Formula({ name, f }) {
  return <div className="formula"><span className="f-name">{name}</span><code>{f}</code></div>;
}

function Source({ name, where }) {
  return <div className="mini-item"><div className="mini-main">{name}</div><div className="mini-sub"><ArrowRight size={12} /> {where}</div></div>;
}

/* ---------- Examples ---------- */

function ExamplesSection({ loadExample, loadedExample, startBlank }) {
  return (
    <div className="page">
      <header className="page-head">
        <div className="eyebrow"><Layers size={14} /> Examples</div>
        <h1>Three cases, three verdicts</h1>
        <p className="lede">Each loads its numbers and a saved written case, so you can see the whole thing without a key.</p>
      </header>
      <div className="ex-grid">
        {EXAMPLES.map((ex) => {
          const o = runAll(ex.form);
          return (
            <button key={ex.id} className={`ex-card ${loadedExample === ex.id ? 'current' : ''}`} onClick={() => loadExample(ex)}>
              <div className="ex-top"><VerdictPill v={o.verdict} />{loadedExample === ex.id && <span className="ex-current">Loaded</span>}</div>
              <div className="ex-title">{ex.title}</div>
              <div className="ex-blurb">{ex.blurb}</div>
              <div className="ex-stats">
                <span><CalendarClock size={14} /> {o.results.base.paybackMonth ? `Month ${o.results.base.paybackMonth}` : 'No payback'}</span>
                <span><Wallet size={14} /> {eur(o.results.base.netValue)}</span>
              </div>
              <div className="ex-open">Open this case <ArrowRight size={14} /></div>
            </button>
          );
        })}
        <button className="ex-card blank" onClick={startBlank}>
          <div className="ex-blank-icon"><Plus size={22} /></div>
          <div className="ex-title">Start blank</div>
          <div className="ex-blurb">Sensible starting numbers, all tagged as guesses until you say otherwise.</div>
        </button>
      </div>
    </div>
  );
}
