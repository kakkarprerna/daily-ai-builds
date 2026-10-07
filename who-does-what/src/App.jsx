import React, { useMemo, useRef, useState } from 'react';
import {
  Workflow, Route, Bot, User, UserCheck, Eye, Cog, ShieldCheck, ShieldAlert, KeyRound, Rocket,
  CircleHelp, Plug, Download, Copy, Sparkles, Loader2, Info, Layers, BookOpen, Check, Plus, X, ArrowRight,
  TriangleAlert, Gauge, Lock, Users, Database, FileText, Scale, Flag, Pencil, RotateCcw, Hand, Activity
} from 'lucide-react';
import { FACTS, FACT_KEYS, LANES, BANDS, analyse, rollout, parseMap, briefMarkdown } from './lanes.js';
import { EXAMPLES } from './examples.js';

const SECTIONS = [
  { id: 'start', icon: Pencil, label: 'Map a workflow', desc: 'Describe the work as it happens today' },
  { id: 'map', icon: Route, label: 'The map', desc: 'Every step in its lane, and why it landed there' },
  { id: 'guard', icon: ShieldCheck, label: 'Guardrails', desc: 'Approvals, tool access, failure points, rollout' },
  { id: 'how', icon: BookOpen, label: 'How it works', desc: 'The points, the rules and what a model does' },
  { id: 'examples', icon: Layers, label: 'Examples', desc: 'Three mapped workflows, no key needed' }
];

const LANE_ICONS = [Cog, Bot, Eye, UserCheck, User];

const SYSTEM_OPTIONS = ['Helpdesk', 'CRM', 'ERP or finance system', 'Email', 'Calendar', 'Phone system', 'Payments', 'Spreadsheet', 'Internal database'];
const VOLUME_OPTIONS = ['Under 50', '50 to 500', '500 to 5,000', 'Over 5,000'];
const CONSTRAINT_OPTIONS = ['Customers see the output', 'Handles money', 'Personal data', 'Regulated (finance, health, insurance)', 'Out-of-hours cover needed'];

const PROVIDERS = [
  { id: 'muse', label: 'Muse Glimmer', note: 'Free, on this site' },
  { id: 'anthropic', label: 'Anthropic', note: 'Your key' },
  { id: 'openai', label: 'OpenAI', note: 'Your key' },
  { id: 'gemini', label: 'Gemini', note: 'Your key' }
];

const BLANK = { name: '', trigger: '', today: '', process: '', systems: [], volume: '50 to 500', constraints: [] };

export default function App() {
  const first = EXAMPLES[0];
  const [section, setSection] = useState('map');
  const [form, setForm] = useState(first.form);
  const [loadedExample, setLoadedExample] = useState(first.id);
  const [mapText, setMapText] = useState(first.text);
  const [steps, setSteps] = useState(() => parseMap(first.text).steps);
  const [selected, setSelected] = useState('s1');
  const [provider, setProvider] = useState('muse');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const mainRef = useRef(null);

  const map = useMemo(() => parseMap(mapText), [mapText]);
  const a = useMemo(() => analyse(steps), [steps]);
  const edits = useMemo(() => {
    let n = 0;
    steps.forEach((s, i) => FACT_KEYS.forEach((k) => { if (map.steps[i] && map.steps[i][k] !== s[k]) n += 1; }));
    return n;
  }, [steps, map]);

  const go = (id) => {
    setSection(id);
    if (mainRef.current) mainRef.current.scrollTo({ top: 0 });
  };

  const set = (k, v) => {
    setLoadedExample(null);
    setForm((f) => ({ ...f, [k]: v }));
  };

  const setFact = (id, k, v) => setSteps((ss) => ss.map((s) => (s.id === id ? { ...s, [k]: v } : s)));
  const resetFacts = () => setSteps(map.steps);

  const loadExample = (ex) => {
    setForm(ex.form);
    setLoadedExample(ex.id);
    setMapText(ex.text);
    setSteps(parseMap(ex.text).steps);
    setSelected('s1');
    setError('');
    go('map');
  };

  const startBlank = () => {
    setForm(BLANK);
    setLoadedExample(null);
    setMapText('');
    setSteps([]);
    setSelected(null);
    setError('');
    go('start');
  };

  const runMap = async () => {
    setError('');
    if (form.process.trim().length < 60) {
      setError('Describe how the work is done today in a few sentences first.');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey, model, ...form })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
      const parsed = parseMap(data.text);
      if (parsed.steps.length < 2) throw new Error('The model replied, but not in the expected format. Try again or switch provider.');
      setMapText(data.text);
      setSteps(parsed.steps);
      setSelected('s1');
      go('map');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const brief = () => briefMarkdown(form, map, a);
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
    link.download = `${(form.name || 'workflow').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-agent-brief.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Workflow size={20} /></div>
          <div>
            <div className="brand-name">Who Does What?</div>
            <div className="brand-sub">Map a workflow for an AI agent</div>
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
            <div className="side-verdict-label">Current map</div>
            <div className="side-name">{form.name || 'Untitled workflow'}</div>
            <LaneBar counts={a.counts} total={a.rows.length} dark />
            <div className="side-verdict-line">{a.unattended} of {a.rows.length} steps run without a person</div>
          </div>
        )}
        <div className="side-foot">A daily AI build by Prerna Kakkar</div>
      </aside>

      <main className="main" ref={mainRef}>
        {section === 'start' && (
          <StartSection
            form={form} set={set} loadedExample={loadedExample} startBlank={startBlank} go={go} a={a}
            provider={provider} setProvider={setProvider} apiKey={apiKey} setApiKey={setApiKey}
            model={model} setModel={setModel} busy={busy} error={error} runMap={runMap}
          />
        )}
        {section === 'map' && (
          <MapSection
            form={form} a={a} map={map} selected={selected} setSelected={setSelected} setFact={setFact}
            edits={edits} resetFacts={resetFacts} go={go} loadedExample={loadedExample}
          />
        )}
        {section === 'guard' && (
          <GuardSection form={form} a={a} map={map} go={go} copyBrief={copyBrief} copied={copied} downloadBrief={downloadBrief} error={error} />
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

function Chips({ options, value, onChange, placeholder }) {
  const isCustom = value && !options.includes(value);
  return (
    <div className="chip-row">
      {options.map((o) => (
        <button key={o} className={`chip ${value === o ? 'on' : ''}`} onClick={() => onChange(o)}>{o}</button>
      ))}
      {isCustom && <button className="chip on">{value}</button>}
      <AddOwn onAdd={onChange} placeholder={placeholder} />
    </div>
  );
}

function MultiChips({ options, value, onChange, placeholder }) {
  const all = [...options, ...value.filter((v) => !options.includes(v))];
  const toggle = (o) => onChange(value.includes(o) ? value.filter((v) => v !== o) : [...value, o]);
  return (
    <div className="chip-row">
      {all.map((o) => (
        <button key={o} className={`chip ${value.includes(o) ? 'on' : ''}`} onClick={() => toggle(o)}>
          {value.includes(o) && <Check size={14} />} {o}
        </button>
      ))}
      <AddOwn onAdd={(v) => !value.includes(v) && onChange([...value, v])} placeholder={placeholder} />
    </div>
  );
}

function LanePill({ lane, size }) {
  const L = LANES[lane];
  const Icon = LANE_ICONS[lane];
  return (
    <span className={`lane-pill lane-${lane} ${size || ''}`}>
      <Icon size={size === 'sm' ? 12 : 14} /> {L.label}
    </span>
  );
}

function LaneBar({ counts, total, dark }) {
  return (
    <div className={`lane-bar ${dark ? 'dark' : ''}`} aria-label="Steps per lane">
      {counts.map((c, i) => c > 0 && (
        <span key={i} className={`lane-seg lane-${i}`} style={{ flex: c }} title={`${LANES[i].label}: ${c}`}>{c}</span>
      ))}
      {total === 0 && <span className="lane-seg empty" style={{ flex: 1 }} />}
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

/* ---------- Map a workflow ---------- */

function StartSection(p) {
  const { form, set, a } = p;
  return (
    <div className="page">
      <PageHead
        icon={Pencil}
        eyebrow="Map a workflow"
        title="Which steps should an AI agent take on?"
        lede="Describe a piece of work the way it happens today. You get back each step in one of five lanes, from plain rules to a person deciding, with the reason for each and a plan to roll it out."
      >
        <div className="steps">
          <Step n="1" icon={Pencil} text="Describe the work as it happens now" />
          <Step n="2" icon={Sparkles} text="A model splits it into steps and suggests five facts for each" />
          <Step n="3" icon={Scale} text="Fixed rules set each lane. Change any fact and see it move" />
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
          <Card icon={Workflow} title="The workflow" sub="Write it the way you would explain it to a new starter">
            <TextField label="Name" value={form.name} onChange={(v) => set('name', v)} placeholder="Refund requests" />
            <TextField label="What starts it" value={form.trigger} onChange={(v) => set('trigger', v)} placeholder="A customer emails asking for a refund" />
            <TextField label="Who does it today" value={form.today} onChange={(v) => set('today', v)} placeholder="Five support agents, team lead for exceptions" />
            <TextField
              label="How it is done today"
              hint="Name the systems, the decisions and the exceptions. The more you say about exceptions, the better the map."
              value={form.process} onChange={(v) => set('process', v)} area rows={7}
              placeholder="An agent reads the email and finds the order. They check it against the return window..."
            />
          </Card>

          <Card icon={Plug} title="Systems involved" sub="Helps the map name the tools and the access each needs">
            <MultiChips options={SYSTEM_OPTIONS} value={form.systems} onChange={(v) => set('systems', v)} placeholder="Another system" />
          </Card>

          <div className="two-cards">
            <Card icon={Activity} title="Volume" sub="Cases per week">
              <Chips options={VOLUME_OPTIONS} value={form.volume} onChange={(v) => set('volume', v)} placeholder="Your volume" />
            </Card>
            <Card icon={ShieldAlert} title="Known constraints" sub="Anything a mistake would touch">
              <MultiChips options={CONSTRAINT_OPTIONS} value={form.constraints} onChange={(v) => set('constraints', v)} placeholder="Another constraint" />
            </Card>
          </div>

          <Card icon={KeyRound} title="Model for the step breakdown" sub="It splits the steps and suggests facts. It never picks a lane">
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
            <button className="btn primary wide" onClick={p.runMap} disabled={p.busy}>
              {p.busy ? <Loader2 size={18} className="spin" /> : <Route size={18} />}
              {p.busy ? 'Mapping the workflow' : 'Map the workflow'}
            </button>
            {p.error && <div className="error"><TriangleAlert size={16} /> {p.error}</div>}
          </Card>
        </div>

        <div className="build-results">
          <div className="sticky-results">
            <div className="panel">
              <div className="panel-title"><Layers size={16} /> The five lanes</div>
              <div className="panel-sub">Darker means more human. Every step lands in one.</div>
              <div className="lane-list">
                {LANES.map((L) => {
                  const Icon = LANE_ICONS[L.id];
                  return (
                    <div key={L.id} className="lane-li">
                      <span className={`lane-dot lane-${L.id}`}><Icon size={14} /></span>
                      <div>
                        <div className="lane-li-name">{L.label}</div>
                        <div className="lane-li-who">{L.who}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {a.rows.length > 0 && (
              <div className="panel">
                <div className="panel-title"><Route size={16} /> Current map</div>
                <div className="panel-sub">{form.name || 'Untitled workflow'}, {a.rows.length} steps</div>
                <LaneBar counts={a.counts} total={a.rows.length} />
                <div className="shape-line"><ShapeTag shape={a.shape} /> {a.shape.line}</div>
                <button className="btn ghost wide small" onClick={() => p.go('map')}>Open the map <ArrowRight size={16} /></button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ShapeTag({ shape }) {
  return <span className={`shape-tag sh-${shape.key}`}>{shape.label}</span>;
}

/* ---------- The map ---------- */

function MapSection({ form, a, map, selected, setSelected, setFact, edits, resetFacts, go, loadedExample }) {
  const detailRef = useRef(null);
  if (!a.rows.length) {
    return (
      <div className="page">
        <PageHead icon={Route} eyebrow="The map" title="Nothing mapped yet" lede="Describe a workflow first, or open one of the worked examples." />
        <div className="row-btns">
          <button className="btn primary" onClick={() => go('start')}><Pencil size={16} /> Map a workflow</button>
          <button className="btn ghost" onClick={() => go('examples')}><Layers size={16} /> See examples</button>
        </div>
      </div>
    );
  }
  const sel = a.rows.find((r) => r.id === selected) || a.rows[0];
  const pick = (id) => {
    setSelected(id);
    setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
  };

  return (
    <div className="page wide">
      <PageHead icon={Route} eyebrow="The map" title={form.name || 'Untitled workflow'} lede={map.summary}>
        {loadedExample && (
          <div className="notice"><Info size={16} /> Worked example. Click any step to see why it landed in its lane, then change a fact and watch it move.</div>
        )}
        {edits > 0 && (
          <div className="notice warn">
            <Pencil size={16} /> You changed {edits} {edits === 1 ? 'fact' : 'facts'} from the model's suggestion.
            <button className="link" onClick={resetFacts}><RotateCcw size={13} /> Reset</button>
          </div>
        )}
      </PageHead>

      <div className="kpis four">
        <Kpi icon={Gauge} label="Shape" value={<ShapeTag shape={a.shape} />} sub={a.shape.line} />
        <Kpi icon={Bot} label="No person in the loop" value={`${a.unattended} of ${a.rows.length}`} sub="Steps in the first three lanes" />
        <Kpi icon={UserCheck} label="Approval points" value={a.gates.length} sub="Back-to-back approvals share one screen" />
        <Kpi icon={Cog} label="Need no model" value={a.counts[0]} sub="A plain rule does these better" />
      </div>

      <section className="board-card">
        <div className="board" role="table" aria-label="Steps by lane">
          <div className="board-head" role="row">
            <div className="bh-n" />
            {LANES.map((L) => {
              const Icon = LANE_ICONS[L.id];
              return (
                <div key={L.id} className={`bh-lane bh-${L.id}`} role="columnheader">
                  <span className={`lane-dot lane-${L.id}`}><Icon size={14} /></span>
                  <span className="bh-label">{L.short}</span>
                </div>
              );
            })}
          </div>
          {a.rows.map((r, i) => (
            <div key={r.id} className="board-row" role="row">
              <div className={`br-n ${i === a.rows.length - 1 ? 'last' : ''}`}><span>{r.n}</span></div>
              {LANES.map((L) => (
                <div key={L.id} className={`br-cell ${L.id === r.lane ? 'has' : ''}`}>
                  {L.id === r.lane && (
                    <button className={`step-card lane-${r.lane} ${sel.id === r.id ? 'sel' : ''}`} onClick={() => pick(r.id)}>
                      <span className="sc-lane">{LANES[r.lane].label}</span>
                      <span className="sc-name">{r.name}</span>
                      <span className="sc-sys"><Database size={11} /> {r.system || 'No system named'}</span>
                      {r.hits.some((h) => h.raised) && <span className="sc-flag"><Lock size={11} /> Rule raised it</span>}
                      {r.custom && <span className="sc-flag"><Pencil size={11} /> Custom fact</span>}
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="board-key">
          <span><Lock size={13} /> A hard rule moved it up a lane</span>
          <span><Pencil size={13} /> A fact you typed yourself scores as middle of its range</span>
        </div>
      </section>

      <div ref={detailRef} className="detail-grid">
        <section className="card detail">
          <div className="detail-top">
            <div>
              <div className="detail-n">Step {sel.n} of {a.rows.length}</div>
              <h2 className="detail-name">{sel.name}</h2>
              {sel.what && <p className="detail-what">{sel.what}</p>}
            </div>
            <LanePill lane={sel.lane} />
          </div>
          <div className="fact-grid">
            {FACT_KEYS.map((k) => (
              <FactRow key={k} k={k} value={sel[k]} pts={sel.parts.find((p) => p.key === k)} onChange={(v) => setFact(sel.id, k, v)} />
            ))}
          </div>
        </section>

        <div className="detail-side">
          <section className="panel">
            <div className="panel-title"><Scale size={16} /> Why this lane</div>
            <div className="score-meter">
              <div className="sm-track">
                {BANDS.map((b, i) => <span key={i} className={`sm-band lane-${b.lane}`} />)}
                <span className="sm-mark" style={{ left: `${(Math.min(sel.score, 12) + 0.5) / 13 * 100}%` }}>{sel.score}</span>
              </div>
              <div className="sm-scale"><span>0</span><span>3</span><span>6</span><span>9+</span></div>
            </div>
            <ul className="hit-list">
              {sel.hits.map((h, i) => (
                <li key={i} className={h.raised ? 'raised' : ''}>
                  {h.raised || h.also ? <Lock size={14} /> : h.id === 'R0' ? <Cog size={14} /> : <Scale size={14} />}
                  <span><b>{h.id}</b> {h.text}</span>
                </li>
              ))}
            </ul>
            <div className="lane-desc">{LANES[sel.lane].desc}</div>
          </section>
          <section className="panel">
            <div className="panel-title"><ShieldAlert size={16} /> How this step fails</div>
            {map.fails.filter((f) => f.step === sel.n).length ? (
              <div className="mini-list">
                {map.fails.filter((f) => f.step === sel.n).map((f, i) => <FailItem key={i} f={f} />)}
              </div>
            ) : (
              <div className="panel-sub">No failure mode listed for this step. See all of them in <button className="link" onClick={() => go('guard')}>Guardrails</button>.</div>
            )}
          </section>
        </div>
      </div>
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

function FactRow({ k, value, pts, onChange }) {
  const f = FACTS[k];
  const known = f.options.some((o) => o.id === value);
  return (
    <div className="fact-row">
      <div className="fact-head">
        <div>
          <div className="field-label">{f.label}</div>
          <div className="field-hint">{f.hint}</div>
        </div>
        <span className="pts">{pts?.pts ?? 0} {(pts?.pts ?? 0) === 1 ? 'pt' : 'pts'}</span>
      </div>
      <div className="chip-row">
        {f.options.map((o) => (
          <button key={o.id} className={`chip sm ${value === o.id ? 'on' : ''}`} onClick={() => onChange(o.id)}>
            {o.label} <span className="chip-note">{o.pts}</span>
          </button>
        ))}
        {!known && value && <button className="chip sm on">{value} <span className="chip-note">custom</span></button>}
        <AddOwn onAdd={onChange} placeholder="Your own" label="Own" />
      </div>
    </div>
  );
}

function FailItem({ f }) {
  return (
    <div className="fail">
      <div className="fail-how"><TriangleAlert size={14} /> {f.how}</div>
      <div className="fail-row"><span className="fail-tag notice-tag"><Eye size={11} /> You notice</span> {f.notice}</div>
      <div className="fail-row"><span className="fail-tag guard-tag"><ShieldCheck size={11} /> Guard</span> {f.guard}</div>
    </div>
  );
}

/* ---------- Guardrails ---------- */

function GuardSection({ form, a, map, go, copyBrief, copied, downloadBrief, error }) {
  if (!a.rows.length) {
    return (
      <div className="page">
        <PageHead icon={ShieldCheck} eyebrow="Guardrails" title="Nothing mapped yet" lede="Map a workflow or open an example to see its guardrails." />
        <button className="btn primary" onClick={() => go('start')}><Pencil size={16} /> Map a workflow</button>
      </div>
    );
  }
  const phases = rollout(a);
  const byN = Object.fromEntries(a.rows.map((r) => [r.n, r]));
  const writeTools = map.tools.filter((t) => t.access === 'Read and write').length;

  return (
    <div className="page">
      <PageHead
        icon={ShieldCheck}
        eyebrow="Guardrails"
        title="What has to be true before it goes live"
        lede="Approval points and the rollout come from the lanes, with fixed rules. Failure modes, tool access and the open questions come from the model, so check them with the people who do the work."
      >
        <div className="row-btns">
          <button className="btn primary" onClick={copyBrief}>{copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy the agent brief'}</button>
          <button className="btn ghost" onClick={downloadBrief}><Download size={16} /> Download as Markdown</button>
        </div>
        {error && <div className="error"><TriangleAlert size={16} /> {error}</div>}
      </PageHead>

      <div className="case-two">
        <Card icon={UserCheck} title="Approval points" sub="Where a person signs off before anything leaves">
          {a.gates.length ? (
            <div className="check-list">
              {a.gates.map((g, i) => (
                <div key={i} className="check-item">
                  <div className="check-n">{i + 1}</div>
                  <div>
                    <div className="check-what">{g.map((r, j) => (j ? r.name.charAt(0).toLowerCase() + r.name.slice(1) : r.name)).join(', then ')}</div>
                    <div className="check-how">Step{g.length > 1 ? 's' : ''} {g.map((r) => r.n).join(' and ')}. {g.length > 1 ? 'One approval screen covers both, so the person sees the whole action at once.' : 'The person sees the draft and the facts behind it before approving.'}</div>
                    <div className="hit-tags">{g.flatMap((r) => r.hits.filter((h) => h.raised)).map((h, j) => <span key={j} className="mini-tag"><Lock size={11} /> {h.id}</span>)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="ok-line"><Check size={16} /> No step needs a person to approve it.</div>
          )}
          {a.counts[4] > 0 && (
            <div className="person-box">
              <div className="person-title"><Hand size={15} /> A person decides</div>
              {a.rows.filter((r) => r.lane === 4).map((r) => <div key={r.id} className="person-step">{r.n}. {r.name}</div>)}
              <div className="person-note">The agent gathers the facts and drafts options here. It does not decide.</div>
            </div>
          )}
        </Card>

        <Card icon={KeyRound} title="Tool access" sub={`Least access that works. ${writeTools} of ${map.tools.length} need write access`}>
          {map.tools.length ? (
            <div className="tool-list">
              {map.tools.map((t, i) => (
                <div key={i} className="tool">
                  <div className="tool-name"><Database size={15} /> {t.system}</div>
                  <span className={`access ${t.access === 'Read only' ? 'ro' : 'rw'}`}>{t.access === 'Read only' ? <Eye size={12} /> : <Pencil size={12} />} {t.access}</span>
                  <div className="tool-steps">Steps {t.steps}</div>
                </div>
              ))}
            </div>
          ) : <div className="panel-sub">No tools listed.</div>}
        </Card>
      </div>

      <Card icon={ShieldAlert} title="How it fails, and the guard" sub="Specific to this workflow. Each one names the signal a team would see">
        <div className="fail-grid">
          {map.fails.map((f, i) => (
            <div key={i} className="fail-card">
              <div className="fail-step">
                {byN[f.step] ? <LanePill lane={byN[f.step].lane} size="sm" /> : null}
                <span>Step {f.step}{byN[f.step] ? `: ${byN[f.step].name}` : ''}</span>
              </div>
              <FailItem f={f} />
            </div>
          ))}
        </div>
      </Card>

      <Card icon={Rocket} title="Rollout" sub="Three phases built from the lanes. Each has a condition to move on">
        <div className="phase-grid">
          {phases.map((ph, i) => (
            <div key={i} className={`phase ph-${i}`}>
              <div className="phase-when">{ph.when}</div>
              <div className="phase-title">{ph.title}</div>
              <p className="phase-line">{ph.line}</p>
              {ph.steps.length > 0 && (
                <ul className="phase-steps">{ph.steps.map((s) => <li key={s}><ArrowRight size={13} /> {s}</li>)}</ul>
              )}
              {ph.also?.map((x) => <div key={x} className="phase-also">{x}</div>)}
              <div className="phase-exit"><Flag size={13} /> {ph.exit}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card icon={CircleHelp} title="Questions for the process owner" sub="Answers here can change a fact, and so a lane">
        <div className="q-list">
          {map.questions.map((q, i) => (
            <div key={i} className="q"><span className="q-n">{i + 1}</span> {q}</div>
          ))}
        </div>
      </Card>
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
        title="A model describes. Rules decide."
        lede="Deciding how much freedom to give an agent should not change with the wording of a prompt. So the model only describes the steps, and printed rules decide the lane."
      />

      <div className="how-grid">
        <Card icon={Sparkles} title="What the model does" sub="Muse Glimmer by default, or your own key">
          <ul className="tick-list">
            <li><Check size={16} /> Splits your description into 4 to 10 steps, one action each</li>
            <li><Check size={16} /> Suggests five facts per step from a fixed list of words</li>
            <li><Check size={16} /> Lists how steps fail, the tools touched and open questions</li>
            <li className="no"><X size={16} /> Never picks a lane, an approval point or a rollout phase</li>
          </ul>
        </Card>
        <Card icon={Scale} title="What the rules do" sub="Same facts in, same answer out">
          <ul className="tick-list">
            <li><Check size={16} /> Add up points for the five facts</li>
            <li><Check size={16} /> Map the total to a lane, then apply three hard overrides</li>
            <li><Check size={16} /> Group back-to-back approvals and build the rollout</li>
            <li><Check size={16} /> Re-run instantly when you change a fact</li>
          </ul>
        </Card>
      </div>

      <Card icon={Gauge} title="Points per fact" sub="Higher means a mistake costs more or is harder to catch">
        <div className="pts-grid">
          {FACT_KEYS.map((k) => (
            <div key={k} className="pts-col">
              <div className="pts-title">{FACTS[k].label}</div>
              {FACTS[k].options.map((o) => (
                <div key={o.id} className="pts-row"><span>{o.label}</span><b>{o.pts}</b></div>
              ))}
            </div>
          ))}
        </div>
        <div className="field-hint">A fact you type yourself has no weight of its own, so it scores as the middle of that fact's range and the step is marked.</div>
      </Card>

      <div className="how-grid">
        <Card icon={Layers} title="From points to a lane" sub="Checked in this order">
          <div className="band-list">
            <div className="band"><LanePill lane={0} size="sm" /><p><b>R0.</b> No judgement, structured fields and no text to write. A rule does it, whatever the points.</p></div>
            <div className="band"><LanePill lane={1} size="sm" /><p>0 to 2 points</p></div>
            <div className="band"><LanePill lane={2} size="sm" /><p>3 to 5 points</p></div>
            <div className="band"><LanePill lane={3} size="sm" /><p>6 to 8 points</p></div>
            <div className="band"><LanePill lane={4} size="sm" /><p>9 points or more</p></div>
          </div>
        </Card>
        <Card icon={Lock} title="Hard overrides" sub="They only ever add oversight">
          <div className="band-list">
            <div className="rule"><span className="rule-id">R1</span><p>Moves money. A person approves each one, at least.</p></div>
            <div className="rule"><span className="rule-id">R2</span><p>Cannot be undone, needs some or high judgement and reaches beyond the team. A person approves each one, at least.</p></div>
            <div className="rule"><span className="rule-id">R3</span><p>High judgement on regulated or personal data. A person decides.</p></div>
          </div>
        </Card>
      </div>

      <div className="how-grid">
        <Card icon={FileText} title="Where this comes from" sub="So you know how far to trust it">
          <ul className="tick-list">
            <li><Info size={16} /> The facts, points and bands are my own working method from deploying voice agents and chatbots for enterprise clients. They are not an industry standard.</li>
            <li><Info size={16} /> The lanes follow common human-in-the-loop practice: approvals on irreversible and financial actions, least tool access, and a shadow phase before going live.</li>
            <li><Info size={16} /> Failure modes, tools and questions are the model's suggestions from your description. Treat them as a first draft for the people who do the work.</li>
          </ul>
        </Card>
        <Card icon={TriangleAlert} title="What it cannot do" sub="Limits worth knowing">
          <ul className="tick-list muted">
            <li><X size={16} /> It does not check legal duties. For high-risk uses under the EU AI Act, human oversight rules apply. Ask your legal team.</li>
            <li><X size={16} /> Points add up step by step, so it misses risk that only appears when two steps fail together.</li>
            <li><X size={16} /> It does not cost anything out. Pair it with a business case before you build.</li>
            <li><X size={16} /> The map is only as good as the description. Unmentioned exceptions are invisible to it.</li>
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
        title="Three workflows from three teams"
        lede="Each loads a saved breakdown and runs it through the same rules as a live map, so you can see the whole thing without a key."
      />
      <div className="ex-grid">
        {EXAMPLES.map((ex) => {
          const m = parseMap(ex.text);
          const o = analyse(m.steps);
          return (
            <button key={ex.id} className={`ex-card ${loadedExample === ex.id ? 'current' : ''}`} onClick={() => loadExample(ex)}>
              <div className="ex-top"><span className="team-tag"><Users size={13} /> {ex.team}</span>{loadedExample === ex.id && <span className="ex-current">Loaded</span>}</div>
              <div className="ex-title">{ex.title}</div>
              <div className="ex-blurb">{ex.blurb}</div>
              <LaneBar counts={o.counts} total={o.rows.length} />
              <div className="ex-stats">
                <span><Bot size={14} /> {o.unattended} of {o.rows.length} without a person</span>
                <span><UserCheck size={14} /> {o.gates.length} approval {o.gates.length === 1 ? 'point' : 'points'}</span>
              </div>
              <div className="ex-open">Open this map <ArrowRight size={14} /></div>
            </button>
          );
        })}
        <button className="ex-card blank" onClick={startBlank}>
          <div className="ex-blank-icon"><Plus size={22} /></div>
          <div className="ex-title">Map your own</div>
          <div className="ex-blurb">Describe a workflow from your own team. Mapping takes under a minute on the free model.</div>
        </button>
      </div>
    </div>
  );
}
