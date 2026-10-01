import { useMemo, useRef, useState } from 'react';
import {
  Route, ClipboardList, Library, PlayCircle, Info, Plus, X, ChevronUp, ChevronDown, KeyRound,
  ShieldCheck, Loader2, Sparkles, Quote, CheckCircle2, ExternalLink, MessageCircleQuestion,
  AlertTriangle, CalendarDays, Copy, RotateCcw, Layers, Link2, Target, UserRound, HelpCircle,
  FileText, BookOpen, Wrench, GraduationCap, Newspaper, Search, Lightbulb, ArrowRight, Check, Building2,
} from 'lucide-react';
import { RESOURCES, RESOURCE_BY_ID, STAGE_TYPES, VERIFIED_ON } from './data/resources.js';
import { EXAMPLES } from './data/examples.js';
import { parsePlan, planToText } from './lib/parse.js';

const NAV = [
  { id: 'build', label: 'Build my prep plan', desc: 'Paste a JD and the stages, get a plan', icon: ClipboardList },
  { id: 'library', label: 'Resource library', desc: 'Every link the plan can use, checked by hand', icon: Library },
  { id: 'examples', label: 'Worked examples', desc: 'Three saved plans, no key needed', icon: PlayCircle },
  { id: 'how', label: 'How it works', desc: 'Method, data sources and limits', icon: Info },
];

const PROVIDERS = [
  { id: 'muse', label: 'Muse Glimmer', note: 'Free, on this site' },
  { id: 'anthropic', label: 'Anthropic', note: 'Your key' },
  { id: 'openai', label: 'OpenAI', note: 'Your key' },
  { id: 'gemini', label: 'Gemini', note: 'Your key' },
];
const MODEL_HINT = { anthropic: 'claude-sonnet-5', openai: 'gpt-5-mini', gemini: 'gemini-2.5-flash' };
const DAY_CHIPS = [3, 5, 7, 14, 21];

const TYPE_ICON = {
  Course: GraduationCap, Article: Newspaper, Guide: BookOpen, Practice: Target, Tool: Wrench,
  Book: BookOpen, Reference: FileText, Research: Search, Newsletter: Newspaper,
};

const EMPTY_FORM = { company: '', role: '', jd: '', stages: [], days: 7, background: '' };

export default function App() {
  const [section, setSection] = useState('build');
  const [form, setForm] = useState(EMPTY_FORM);
  const [provider, setProvider] = useState({ id: 'muse', key: '', model: '' });
  const [result, setResult] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const mainRef = useRef(null);

  const go = (id) => {
    setSection(id);
    mainRef.current?.scrollTo({ top: 0 });
  };

  async function submit() {
    setError('');
    if (form.jd.trim().length < 200) return setError('Paste the full job description, at least a few paragraphs.');
    if (!form.stages.length) return setError('Add at least one hiring stage.');
    if (provider.id !== 'muse' && !provider.key.trim()) return setError('Add your API key, or switch back to the free model.');
    setLoading(true);
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, provider: provider.id, apiKey: provider.key.trim(), model: provider.model.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!data) throw new Error('No model server is running here. Deploy to Vercel (or run vercel dev) for live plans, or open a worked example.');
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.');
      const parsed = parsePlan(data.text);
      if (!parsed.stages.length) throw new Error('The model replied in an unexpected format. Try again, or switch provider.');
      setResult(parsed);
      setMeta({ ...form, saved: false });
      mainRef.current?.scrollTo({ top: 0 });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function loadExample(ex) {
    setForm(ex.input);
    setResult(parsePlan(ex.output));
    setMeta({ ...ex.input, saved: true });
    go('build');
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Route size={20} /></div>
          <div>
            <div className="brand-name">Loop Ready</div>
            <div className="brand-tag">Interview prep from the JD up</div>
          </div>
        </div>
        <nav className="nav">
          {NAV.map((n) => {
            const Icon = n.icon;
            return (
              <button key={n.id} className={`nav-item ${section === n.id ? 'active' : ''}`} onClick={() => go(n.id)}>
                <span className="nav-icon"><Icon size={18} /></span>
                <span className="nav-text">
                  <span className="nav-label">{n.label}</span>
                  <span className="nav-desc">{n.desc}</span>
                </span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          <div className="foot-row"><ShieldCheck size={15} /> {RESOURCES.length} links verified {VERIFIED_ON}</div>
          <div className="foot-row"><Link2 size={15} /> The model can only pick from them</div>
        </div>
      </aside>

      <main className="main" ref={mainRef}>
        <div className="main-inner">
          {section === 'build' && (result ? (
            <ResultView result={result} meta={meta} onEdit={() => setResult(null)} onReset={() => { setResult(null); setForm(EMPTY_FORM); }} />
          ) : (
            <BuildForm form={form} setForm={setForm} provider={provider} setProvider={setProvider}
              loading={loading} error={error} onSubmit={submit} onExamples={() => go('examples')} />
          ))}
          {section === 'library' && <LibraryView />}
          {section === 'examples' && <ExamplesView onLoad={loadExample} />}
          {section === 'how' && <HowView onStart={() => go('build')} />}
        </div>
      </main>
    </div>
  );
}

/* ---------------- Build form ---------------- */

function BuildForm({ form, setForm, provider, setProvider, loading, error, onSubmit, onExamples }) {
  const [custom, setCustom] = useState('');
  const [customDays, setCustomDays] = useState('');
  const [showBackground, setShowBackground] = useState(Boolean(form.background));
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleStage = (label) =>
    set('stages', form.stages.includes(label) ? form.stages.filter((s) => s !== label) : [...form.stages, label]);
  const move = (i, dir) => {
    const next = [...form.stages];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    set('stages', next);
  };
  const addCustom = () => {
    const v = custom.trim();
    if (v && !form.stages.includes(v)) set('stages', [...form.stages, v]);
    setCustom('');
  };

  return (
    <>
      <header className="page-head">
        <span className="eyebrow"><Sparkles size={14} /> Prep plan builder</span>
        <h1>Know what each round will test, and what to read for it</h1>
        <p>Paste the job description and the stages you have been told about. You get a stage-by-stage plan, a day-by-day schedule and hand-picked resources.</p>
        <button className="link-btn" onClick={onExamples}>Or open a worked example <ArrowRight size={15} /></button>
      </header>

      <section className="card">
        <div className="card-title"><span className="step">1</span> The role</div>
        <div className="grid-2">
          <label className="field"><span>Company</span>
            <input value={form.company} onChange={(e) => set('company', e.target.value)} placeholder="e.g. Harbourline Payments" />
          </label>
          <label className="field"><span>Role title</span>
            <input value={form.role} onChange={(e) => set('role', e.target.value)} placeholder="e.g. Senior Product Manager, Growth" />
          </label>
        </div>
        <label className="field"><span>Job description <em>{form.jd.length.toLocaleString()} / 14,000</em></span>
          <textarea rows={9} value={form.jd} onChange={(e) => set('jd', e.target.value)}
            placeholder="Paste the full JD, including responsibilities and requirements." />
        </label>
      </section>

      <section className="card">
        <div className="card-title"><span className="step">2</span> Hiring stages, in order</div>
        <p className="hint">Tap the stages in the order the recruiter described. Add your own if a round is not listed.</p>
        <div className="chips">
          {STAGE_TYPES.map((s) => {
            const on = form.stages.includes(s.label);
            return (
              <button key={s.id} className={`chip ${on ? 'on' : ''}`} onClick={() => toggleStage(s.label)}>
                {on ? <Check size={14} /> : <Plus size={14} />} {s.label}
              </button>
            );
          })}
        </div>
        <div className="custom-row">
          <input value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCustom()}
            placeholder="Add your own, e.g. Pair session with a designer" />
          <button className="btn ghost" onClick={addCustom}><Plus size={16} /> Add</button>
        </div>
        {form.stages.length > 0 && (
          <ol className="stage-order">
            {form.stages.map((s, i) => (
              <li key={s}>
                <span className="order-n">{i + 1}</span>
                <span className="order-label">{s}</span>
                <span className="order-actions">
                  <button aria-label="Move up" onClick={() => move(i, -1)} disabled={i === 0}><ChevronUp size={16} /></button>
                  <button aria-label="Move down" onClick={() => move(i, 1)} disabled={i === form.stages.length - 1}><ChevronDown size={16} /></button>
                  <button aria-label="Remove" onClick={() => toggleStage(s)}><X size={16} /></button>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="card">
        <div className="card-title"><span className="step">3</span> Time and background</div>
        <div className="field"><span>Days until the first interview</span></div>
        <div className="chips">
          {DAY_CHIPS.map((d) => (
            <button key={d} className={`chip ${form.days === d ? 'on' : ''}`} onClick={() => set('days', d)}>
              <CalendarDays size={14} /> {d} days
            </button>
          ))}
          <span className="chip-input">
            <input type="number" min="1" max="60" value={customDays} placeholder="Other"
              onChange={(e) => { setCustomDays(e.target.value); const n = parseInt(e.target.value, 10); if (n > 0) set('days', Math.min(60, n)); }} />
          </span>
        </div>
        {!showBackground ? (
          <button className="link-btn" onClick={() => setShowBackground(true)}><UserRound size={15} /> Add your background for a gap check (optional)</button>
        ) : (
          <label className="field"><span>Your background <em>optional, used only for this request</em></span>
            <textarea rows={4} value={form.background} onChange={(e) => set('background', e.target.value)}
              placeholder="A few lines: years in product, domains, what you have and have not owned." />
          </label>
        )}
      </section>

      <section className="card">
        <div className="card-title"><span className="step">4</span> Model</div>
        <div className="chips">
          {PROVIDERS.map((p) => (
            <button key={p.id} className={`chip ${provider.id === p.id ? 'on' : ''}`} onClick={() => setProvider({ id: p.id, key: '', model: '' })}>
              {p.label} <small>{p.note}</small>
            </button>
          ))}
        </div>
        {provider.id !== 'muse' && (
          <div className="grid-2">
            <label className="field"><span><KeyRound size={14} /> API key</span>
              <input type="password" value={provider.key} onChange={(e) => setProvider({ ...provider, key: e.target.value })} placeholder="Used for this request only" autoComplete="off" />
            </label>
            <label className="field"><span>Model</span>
              <input value={provider.model} onChange={(e) => setProvider({ ...provider, model: e.target.value })} placeholder={MODEL_HINT[provider.id]} />
            </label>
          </div>
        )}
        <p className="hint"><ShieldCheck size={14} /> Nothing is stored. Your JD and any key are sent once to make the plan and then dropped.</p>
      </section>

      {error && <div className="alert"><AlertTriangle size={16} /> {error}</div>}
      <button className="btn primary big" onClick={onSubmit} disabled={loading}>
        {loading ? <><Loader2 size={18} className="spin" /> Building your plan</> : <><Sparkles size={18} /> Build my prep plan</>}
      </button>
    </>
  );
}

/* ---------------- Result ---------------- */

function ResultView({ result, meta, onEdit, onReset }) {
  const [copied, setCopied] = useState(false);
  const resCount = useMemo(() => new Set(result.stages.flatMap((s) => s.res.map((r) => r.id))).size, [result]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(planToText(result, meta));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked */ }
  };

  return (
    <>
      <header className="result-hero">
        <div className="hero-top">
          <span className="eyebrow light"><Route size={14} /> {meta.saved ? 'Saved worked example' : 'Your prep plan'}</span>
          <div className="hero-actions">
            <button className="btn light" onClick={copy}>{copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy as text</>}</button>
            <button className="btn light" onClick={onEdit}><ClipboardList size={16} /> Edit inputs</button>
            <button className="btn light" onClick={onReset}><RotateCcw size={16} /> Start over</button>
          </div>
        </div>
        <h1>{meta.role || 'Your role'}{meta.company && <span> at {meta.company}</span>}</h1>
        {result.summary && <p>{result.summary}</p>}
        <div className="stats">
          <Stat icon={Layers} value={result.stages.length} label="stages planned" />
          <Stat icon={BookOpen} value={resCount} label="resources picked" />
          <Stat icon={CalendarDays} value={meta.days} label="days to prepare" />
          <Stat icon={ShieldCheck} value={result.dropped} label={result.dropped === 1 ? 'unverified link removed' : 'unverified links removed'} />
        </div>
      </header>

      {result.signals.length > 0 && (
        <section className="block">
          <h2><Target size={20} /> What this JD weighs most</h2>
          <div className="signal-grid">
            {result.signals.map((s, i) => (
              <div key={i} className="signal">
                <div className="signal-theme">{s.theme}</div>
                {s.evidence && <div className="signal-quote"><Quote size={13} /> {s.evidence}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="block">
        <h2><Layers size={20} /> Stage by stage</h2>
        <div className="timeline">
          {result.stages.map((s) => <StageCard key={s.n} stage={s} />)}
        </div>
      </section>

      {result.plan.length > 0 && (
        <section className="block">
          <h2><CalendarDays size={20} /> Day by day</h2>
          <div className="plan-grid">
            {result.plan.map((p, i) => (
              <div key={i} className="plan-tile">
                <div className="plan-when">{p.when}</div>
                <div className="plan-task">{p.task}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {result.gaps.length > 0 && (
        <section className="block">
          <h2><UserRound size={20} /> Gaps against your background</h2>
          <div className="gap-grid">
            {result.gaps.map((g, i) => (
              <div key={i} className="gap">
                <div className="gap-area"><AlertTriangle size={16} /> {g.area}</div>
                <div className="gap-fix">{g.fix}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {result.asks.length > 0 && (
        <section className="block">
          <h2><HelpCircle size={20} /> Questions to ask them</h2>
          <ul className="ask-list">
            {result.asks.map((a, i) => <li key={i}><MessageCircleQuestion size={18} /> {a}</li>)}
          </ul>
        </section>
      )}

      <p className="disclaimer"><Info size={14} /> Stage content is written by the model from your JD. Resources come only from the checked library. Treat company-specific details as things to confirm with the recruiter.</p>
    </>
  );
}

function Stat({ icon: Icon, value, label }) {
  return (
    <div className="stat">
      <Icon size={18} />
      <div><div className="stat-value">{value}</div><div className="stat-label">{label}</div></div>
    </div>
  );
}

function StageCard({ stage }) {
  return (
    <article className="stage">
      <div className="stage-node">{stage.n}</div>
      <div className="stage-body">
        <div className="stage-head">
          <h3>{stage.name}</h3>
          <span className={`effort effort-${stage.effort.toLowerCase()}`}>{stage.effort} prep</span>
        </div>
        {stage.tests && <p className="stage-tests">{stage.tests}</p>}

        {stage.prep.length > 0 && (
          <div className="sub">
            <div className="sub-label">Do</div>
            <ul className="icon-list">
              {stage.prep.map((p, i) => <li key={i}><CheckCircle2 size={17} /> {p}</li>)}
            </ul>
          </div>
        )}

        {stage.res.length > 0 && (
          <div className="sub">
            <div className="sub-label">Read and practise with</div>
            <div className="res-mini-grid">
              {stage.res.map((r) => <ResourceMini key={r.id} id={r.id} why={r.why} />)}
            </div>
          </div>
        )}

        {stage.practice.length > 0 && (
          <div className="sub">
            <div className="sub-label">Likely questions</div>
            <ul className="icon-list q">
              {stage.practice.map((p, i) => <li key={i}><MessageCircleQuestion size={17} /> {p}</li>)}
            </ul>
          </div>
        )}

        {stage.trap.map((t, i) => (
          <div key={i} className="trap"><AlertTriangle size={16} /> <span><strong>Avoid:</strong> {t}</span></div>
        ))}
      </div>
    </article>
  );
}

function ResourceMini({ id, why }) {
  const r = RESOURCE_BY_ID[id];
  const Icon = TYPE_ICON[r.type] || BookOpen;
  return (
    <a className="res-mini" href={r.url} target="_blank" rel="noreferrer">
      <div className="res-mini-top">
        <span className="res-icon"><Icon size={16} /></span>
        <span className="res-meta">{r.type} · {r.cost}</span>
        <ExternalLink size={14} className="res-ext" />
      </div>
      <div className="res-title">{r.title}</div>
      <div className="res-source">{r.source}</div>
      {why && <div className="res-why"><Lightbulb size={13} /> {why}</div>}
    </a>
  );
}

/* ---------------- Library ---------------- */

function LibraryView() {
  const [tag, setTag] = useState('all');
  const [cost, setCost] = useState('all');
  const list = RESOURCES.filter((r) => (tag === 'all' || r.tags.includes(tag)) && (cost === 'all' || r.cost === cost));
  const tagLabel = Object.fromEntries(STAGE_TYPES.map((s) => [s.id, s.label]));
  return (
    <>
      <header className="page-head">
        <span className="eyebrow"><Library size={14} /> Resource library</span>
        <h1>{RESOURCES.length} resources, each opened and checked by hand</h1>
        <p>The model can recommend these and nothing else. If it names an id that is not here, the app drops it and counts it in your plan's stats. Last checked {VERIFIED_ON}.</p>
      </header>
      <div className="filter-row">
        <div className="chips">
          <button className={`chip ${tag === 'all' ? 'on' : ''}`} onClick={() => setTag('all')}>All stages</button>
          {STAGE_TYPES.map((s) => (
            <button key={s.id} className={`chip ${tag === s.id ? 'on' : ''}`} onClick={() => setTag(s.id)}>{s.label}</button>
          ))}
        </div>
        <div className="chips">
          {['all', 'Free', 'Freemium', 'Paid'].map((c) => (
            <button key={c} className={`chip small ${cost === c ? 'on' : ''}`} onClick={() => setCost(c)}>{c === 'all' ? 'Any cost' : c}</button>
          ))}
        </div>
      </div>
      <div className="lib-grid">
        {list.map((r) => {
          const Icon = TYPE_ICON[r.type] || BookOpen;
          return (
            <a key={r.id} className="lib-card" href={r.url} target="_blank" rel="noreferrer">
              <div className="res-mini-top">
                <span className="res-icon"><Icon size={16} /></span>
                <span className="res-meta">{r.type} · {r.cost}</span>
                <ExternalLink size={14} className="res-ext" />
              </div>
              <div className="res-title">{r.title}</div>
              <div className="res-source">{r.source}</div>
              <p className="lib-blurb">{r.blurb}</p>
              <div className="tag-row">{r.tags.slice(0, 4).map((t) => <span key={t} className="tag">{tagLabel[t]}</span>)}</div>
            </a>
          );
        })}
        {list.length === 0 && <p className="hint">Nothing matches both filters. Try another cost option.</p>}
      </div>
    </>
  );
}

/* ---------------- Examples ---------------- */

function ExamplesView({ onLoad }) {
  return (
    <>
      <header className="page-head">
        <span className="eyebrow"><PlayCircle size={14} /> Worked examples</span>
        <h1>Three saved plans you can open without a key</h1>
        <p>Fictional companies and JDs, with model output saved from real runs of the same prompt.</p>
      </header>
      <div className="ex-grid">
        {EXAMPLES.map((ex) => (
          <button key={ex.id} className="ex-card" onClick={() => onLoad(ex)}>
            <div className="ex-company"><Building2 size={15} /> {ex.input.company}</div>
            <div className="ex-role">{ex.input.role}</div>
            <p>{ex.blurb}</p>
            <div className="tag-row">
              <span className="tag"><CalendarDays size={12} /> {ex.input.days} days</span>
              <span className="tag"><Layers size={12} /> {ex.input.stages.length} stages</span>
              {ex.input.background && <span className="tag"><UserRound size={12} /> Gap check</span>}
            </div>
            <span className="ex-open">Open plan <ArrowRight size={15} /></span>
          </button>
        ))}
      </div>
    </>
  );
}

/* ---------------- How it works ---------------- */

function HowView({ onStart }) {
  const steps = [
    { icon: ClipboardList, title: 'You paste the JD and stages', text: 'Plus how many days you have, and your background if you want a gap check.' },
    { icon: Sparkles, title: 'The model reads it against a fixed library', text: 'It quotes the JD for each signal and picks resources by id from the checked list.' },
    { icon: ShieldCheck, title: 'The app checks every pick', text: 'Unknown ids are removed and counted. No URL in your plan comes from the model.' },
  ];
  return (
    <>
      <header className="page-head">
        <span className="eyebrow"><Info size={14} /> How it works</span>
        <h1>Plain method, visible limits</h1>
      </header>
      <div className="how-grid">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="how-card">
              <span className="how-icon"><Icon size={20} /></span>
              <div className="how-title">{s.title}</div>
              <p>{s.text}</p>
            </div>
          );
        })}
      </div>
      <section className="card">
        <div className="card-title"><BookOpen size={18} /> Where the content comes from</div>
        <ul className="icon-list">
          <li><CheckCircle2 size={17} /> <span><strong>Your JD:</strong> the only source for what the role weighs. Each signal shows the phrase it came from.</span></li>
          <li><CheckCircle2 size={17} /> <span><strong>The library:</strong> {RESOURCES.length} resources opened and checked in {VERIFIED_ON}, listed in full in the Resource library.</span></li>
          <li><CheckCircle2 size={17} /> <span><strong>The model:</strong> writes the stage reasoning, questions and schedule. Meta Muse Glimmer by default, or your own Anthropic, OpenAI or Gemini key.</span></li>
        </ul>
      </section>
      <section className="card">
        <div className="card-title"><AlertTriangle size={18} /> Limits</div>
        <ul className="icon-list">
          <li><AlertTriangle size={17} /> It does not know how a specific company interviews. Confirm the format with your recruiter.</li>
          <li><AlertTriangle size={17} /> Practice questions are likely questions, not leaked ones.</li>
          <li><AlertTriangle size={17} /> Links were live when checked. Sites move, so a link can break later.</li>
        </ul>
      </section>
      <button className="btn primary big" onClick={onStart}><Sparkles size={18} /> Build a plan</button>
    </>
  );
}
