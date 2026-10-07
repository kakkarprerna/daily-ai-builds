import React, { useMemo, useRef, useState } from 'react';
import {
  PhoneForwarded, PhoneCall, Headset, Bot, UserRound, UserCheck, Hand, Ear, Repeat, HeartPulse, VolumeX, Timer,
  Globe, CreditCard, Moon, ClipboardList, BarChart3, BookOpen, Layers, Pencil, Sparkles, Loader2, Info, Check,
  Plus, X, ArrowRight, TriangleAlert, Gauge, Lock, Users, Database, FileText, Scale, Copy, Download, RotateCcw,
  KeyRound, Plug, ShieldAlert, MessageSquareQuote, Languages, Clock, Monitor, CircleHelp, Zap, Siren
} from 'lucide-react';
import {
  FACTS, FACT_KEYS, FREQ, LANES, COVERAGE, DELIVERY, CONSTRAINTS, BASE_FIELDS,
  analyse, triggers, outOfHours, parseMap, specMarkdown
} from './handoff.js';
import { EXAMPLES } from './examples.js';

const SECTIONS = [
  { id: 'start', icon: Pencil, label: 'Plan a line', desc: 'Describe the calls a voice agent will answer' },
  { id: 'map', icon: PhoneForwarded, label: 'Handoff map', desc: 'Each call moment in its lane, and why' },
  { id: 'triggers', icon: Zap, label: 'Live triggers', desc: 'What makes the agent pass any call over' },
  { id: 'kit', icon: ClipboardList, label: 'Handover kit', desc: 'Context packet, metrics, spec to export' },
  { id: 'how', icon: BookOpen, label: 'How it works', desc: 'Points, rules and what the model does' },
  { id: 'examples', icon: Layers, label: 'Examples', desc: 'Three planned lines, no key needed' }
];

const LANE_ICONS = [Bot, Headset, PhoneForwarded, UserRound];
const TRIGGER_ICONS = { hand: Hand, ear: Ear, loop: Repeat, heart: HeartPulse, mute: VolumeX, silence: Timer, globe: Globe, card: CreditCard };

const LANGUAGE_OPTIONS = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Hindi'];
const SYSTEM_OPTIONS = ['CRM', 'Booking system', 'Order system', 'Payments', 'Helpdesk', 'Knowledge base'];

const PROVIDERS = [
  { id: 'muse', label: 'Muse Glimmer', note: 'Free, on this site' },
  { id: 'anthropic', label: 'Anthropic', note: 'Your key' },
  { id: 'openai', label: 'OpenAI', note: 'Your key' },
  { id: 'gemini', label: 'Gemini', note: 'Your key' }
];

const BLANK = {
  name: '', callers: '', handles: '', coverage: COVERAGE[0], delivery: DELIVERY[0],
  callerLanguages: ['English'], agentLanguages: ['English'], constraints: [], systems: []
};

const slug = (s) => (s || 'voice-line').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function App() {
  const first = EXAMPLES[0];
  const [section, setSection] = useState('map');
  const [form, setForm] = useState(first.form);
  const [loadedExample, setLoadedExample] = useState(first.id);
  const [mapText, setMapText] = useState(first.text);
  const [moments, setMoments] = useState(() => parseMap(first.text).moments);
  const [selected, setSelected] = useState('m2');
  const [provider, setProvider] = useState('muse');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const mainRef = useRef(null);

  const map = useMemo(() => parseMap(mapText), [mapText]);
  const a = useMemo(() => analyse(moments, form), [moments, form]);
  const edits = useMemo(() => {
    let n = 0;
    moments.forEach((m, i) => [...FACT_KEYS, 'frequency'].forEach((k) => { if (map.moments[i] && map.moments[i][k] !== m[k]) n += 1; }));
    return n;
  }, [moments, map]);

  const go = (id) => {
    setSection(id);
    if (mainRef.current) mainRef.current.scrollTo({ top: 0 });
  };
  const set = (k, v) => {
    setLoadedExample(null);
    setForm((f) => ({ ...f, [k]: v }));
  };
  const setFact = (id, k, v) => setMoments((ms) => ms.map((m) => (m.id === id ? { ...m, [k]: v } : m)));
  const resetFacts = () => setMoments(map.moments);

  const loadExample = (ex) => {
    setForm(ex.form);
    setLoadedExample(ex.id);
    setMapText(ex.text);
    setMoments(parseMap(ex.text).moments);
    setSelected('m2');
    setError('');
    go('map');
  };
  const startBlank = () => {
    setForm(BLANK);
    setLoadedExample(null);
    setMapText('');
    setMoments([]);
    setSelected(null);
    setError('');
    go('start');
  };

  const runPlan = async () => {
    setError('');
    if (form.handles.trim().length < 60) {
      setError('Describe what callers ring about and what the agent can do, in a few sentences.');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey, model, ...form })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
      const parsed = parseMap(data.text);
      if (parsed.moments.length < 2) throw new Error('The model replied, but not in the expected format. Try again or switch provider.');
      setMapText(data.text);
      setMoments(parsed.moments);
      setSelected('m1');
      go('map');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const spec = () => specMarkdown(form, map, a);
  const copySpec = async () => {
    try {
      await navigator.clipboard.writeText(spec());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('Copy failed in this browser. Use download instead.');
    }
  };
  const downloadSpec = () => {
    const blob = new Blob([spec()], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${slug(form.name)}-handoff-spec.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><PhoneForwarded size={20} /></div>
          <div>
            <div className="brand-name">Pass the Call</div>
            <div className="brand-sub">When a voice agent hands over</div>
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
            <div className="side-verdict-label">Current line</div>
            <div className="side-name">{form.name || 'Untitled line'}</div>
            <LaneBar counts={a.counts} total={a.rows.length} dark />
            <div className="side-verdict-line">About {a.share}% of calls reach a person</div>
          </div>
        )}
        <div className="side-foot">A daily AI build by Prerna Kakkar</div>
      </aside>

      <main className="main" ref={mainRef}>
        {section === 'start' && (
          <StartSection
            form={form} set={set} loadedExample={loadedExample} startBlank={startBlank} go={go} a={a}
            provider={provider} setProvider={setProvider} apiKey={apiKey} setApiKey={setApiKey}
            model={model} setModel={setModel} busy={busy} error={error} runPlan={runPlan}
          />
        )}
        {section === 'map' && (
          <MapSection
            form={form} a={a} map={map} selected={selected} setSelected={setSelected} setFact={setFact}
            edits={edits} resetFacts={resetFacts} go={go} loadedExample={loadedExample}
          />
        )}
        {section === 'triggers' && <TriggerSection form={form} a={a} go={go} />}
        {section === 'kit' && (
          <KitSection form={form} a={a} map={map} go={go} copySpec={copySpec} copied={copied} downloadSpec={downloadSpec} error={error} />
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
  const Icon = LANE_ICONS[lane];
  return (
    <span className={`lane-pill lane-${lane} ${size || ''}`}>
      <Icon size={size === 'sm' ? 12 : 14} /> {LANES[lane].label}
    </span>
  );
}

function LaneBar({ counts, total, dark }) {
  return (
    <div className={`lane-bar ${dark ? 'dark' : ''}`} aria-label="Call moments per lane">
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
      <PageHead icon={icon} eyebrow={eyebrow} title="Nothing planned yet" lede="Describe a phone line first, or open one of the worked examples." />
      <div className="row-btns">
        <button className="btn primary" onClick={() => go('start')}><Pencil size={16} /> Plan a line</button>
        <button className="btn ghost" onClick={() => go('examples')}><Layers size={16} /> See examples</button>
      </div>
    </div>
  );
}

/* ---------- Plan a line ---------- */

function StartSection(p) {
  const { form, set, a } = p;
  return (
    <div className="page">
      <PageHead
        icon={Pencil}
        eyebrow="Plan a line"
        title="When should your voice agent pass the call?"
        lede="Describe the calls a voice agent will answer. You get each call moment in one of four handoff lanes, the live triggers that apply to every call, and the facts a person needs so the caller never repeats themselves."
      >
        <div className="steps">
          <Step n="1" icon={Pencil} text="Describe who calls, why, and what the agent can do" />
          <Step n="2" icon={Sparkles} text="A model splits it into call moments and suggests five facts each" />
          <Step n="3" icon={Scale} text="Printed rules set each lane. Change a fact and watch it move" />
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
          <Card icon={PhoneCall} title="The line" sub="Write it the way you would brief a new team lead">
            <TextField label="Name" value={form.name} onChange={(v) => set('name', v)} placeholder="Rider support line" />
            <TextField label="Who calls" value={form.callers} onChange={(v) => set('callers', v)} placeholder="Riders, often calling from the street" />
            <TextField
              label="What they ring about, and who can fix it"
              hint="Name what the agent can do with its systems and what only the team can do. Exceptions matter most."
              value={form.handles} onChange={(v) => set('handles', v)} area rows={7}
              placeholder="Riders ring about a late driver, a wrong fare, a lost item... The agent can look up trips and raise a report. Refunds over the limit are done by the team."
            />
          </Card>

          <div className="two-cards">
            <Card icon={Clock} title="Human cover" sub="When people are there to take calls">
              <Chips options={COVERAGE} value={form.coverage} onChange={(v) => set('coverage', v)} placeholder="Your hours" />
            </Card>
            <Card icon={Monitor} title="How calls reach a person" sub="Decides what the person sees on pickup">
              <Chips options={DELIVERY} value={form.delivery} onChange={(v) => set('delivery', v)} placeholder="Your set-up" />
            </Card>
          </div>

          <div className="two-cards">
            <Card icon={Languages} title="Languages callers use" sub="Everyone who rings, not only the main one">
              <MultiChips options={LANGUAGE_OPTIONS} value={form.callerLanguages} onChange={(v) => set('callerLanguages', v)} placeholder="Another language" />
            </Card>
            <Card icon={Bot} title="Languages the agent speaks" sub="Well enough to run a whole call">
              <MultiChips options={LANGUAGE_OPTIONS} value={form.agentLanguages} onChange={(v) => set('agentLanguages', v)} placeholder="Another language" />
            </Card>
          </div>

          <div className="two-cards">
            <Card icon={Plug} title="Systems the agent can use" sub="Helps judge what it can finish">
              <MultiChips options={SYSTEM_OPTIONS} value={form.systems} onChange={(v) => set('systems', v)} placeholder="Another system" />
            </Card>
            <Card icon={ShieldAlert} title="Constraints" sub="Each one switches on a rule">
              <MultiChips options={CONSTRAINTS} value={form.constraints} onChange={(v) => set('constraints', v)} placeholder="Another constraint" />
            </Card>
          </div>

          <Card icon={KeyRound} title="Model for the call moments" sub="It describes the moments and suggests facts. It never picks a lane">
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
            <button className="btn primary wide" onClick={p.runPlan} disabled={p.busy}>
              {p.busy ? <Loader2 size={18} className="spin" /> : <PhoneForwarded size={18} />}
              {p.busy ? 'Planning the handoffs' : 'Plan the handoffs'}
            </button>
            {p.error && <div className="error"><TriangleAlert size={16} /> {p.error}</div>}
          </Card>
        </div>

        <div className="build-results">
          <div className="sticky-results">
            <div className="panel">
              <div className="panel-title"><Layers size={16} /> The four lanes</div>
              <div className="panel-sub">Darker means a person comes in sooner.</div>
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
                <div className="panel-title"><PhoneForwarded size={16} /> Current plan</div>
                <div className="panel-sub">{form.name || 'Untitled line'}, {a.rows.length} call moments</div>
                <LaneBar counts={a.counts} total={a.rows.length} />
                <div className="shape-line">About <b>{a.share}%</b> of calls reach a person, weighted by how often each moment comes up.</div>
                <button className="btn ghost wide small" onClick={() => p.go('map')}>Open the map <ArrowRight size={16} /></button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Handoff map ---------- */

function MapSection({ form, a, map, selected, setSelected, setFact, edits, resetFacts, go, loadedExample }) {
  const detailRef = useRef(null);
  if (!a.rows.length) return <Empty icon={PhoneForwarded} eyebrow="Handoff map" go={go} />;
  const sel = a.rows.find((r) => r.id === selected) || a.rows[0];
  const pick = (id) => {
    setSelected(id);
    setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
  };
  const line = map.lines.find((l) => l.moment === sel.n);
  const signals = map.signals.filter((s) => s.moment === sel.n);
  const own = map.fields.filter((f) => f.moment === sel.n);

  return (
    <div className="page wide">
      <PageHead icon={PhoneForwarded} eyebrow="Handoff map" title={form.name || 'Untitled line'} lede={map.summary}>
        {loadedExample && (
          <div className="notice"><Info size={16} /> Worked example. Click any call moment to see why it landed in its lane, then change a fact and watch it move.</div>
        )}
        {edits > 0 && (
          <div className="notice warn">
            <Pencil size={16} /> You changed {edits} {edits === 1 ? 'fact' : 'facts'} from the model's suggestion.
            <button className="link" onClick={resetFacts}><RotateCcw size={13} /> Reset</button>
          </div>
        )}
      </PageHead>

      <div className="kpis four">
        <Kpi icon={Gauge} label="Calls reaching a person" value={`~${a.share}%`} sub="Weighted by frequency. Not a forecast" />
        <Kpi icon={Bot} label="Agent closes" value={`${a.counts[0] + a.counts[1]} of ${a.rows.length}`} sub="Moments in the first two lanes" />
        <Kpi icon={PhoneForwarded} label="Warm transfers" value={a.counts[2]} sub="Agent gathers first, person never re-asks" />
        <Kpi icon={Siren} label="Straight over" value={a.counts[3]} sub="One line of capture, then a person" />
      </div>

      <section className="board-card">
        <div className="board" role="table" aria-label="Call moments by lane">
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
                      <span className="sc-sys"><Activity2 freq={r.frequency} /> {r.frequency}</span>
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
          <span><Lock size={13} /> A hard rule moved it to a later lane</span>
          <span><Pencil size={13} /> A fact you typed scores as the middle of its range</span>
        </div>
      </section>

      <div ref={detailRef} className="detail-grid">
        <section className="card detail">
          <div className="detail-top">
            <div>
              <div className="detail-n">Call moment {sel.n} of {a.rows.length}</div>
              <h2 className="detail-name">{sel.name}</h2>
              {sel.want && <p className="detail-what">Caller wants: {sel.want}</p>}
            </div>
            <LanePill lane={sel.lane} />
          </div>
          <div className="fact-grid">
            {FACT_KEYS.map((k) => (
              <FactRow key={k} k={k} value={sel[k]} pts={sel.parts.find((p) => p.key === k)} onChange={(v) => setFact(sel.id, k, v)} />
            ))}
            <div className="fact-row">
              <div className="fact-head">
                <div>
                  <div className="field-label">How often it comes up</div>
                  <div className="field-hint">No points. Only weights the share of calls reaching a person</div>
                </div>
              </div>
              <div className="chip-row">
                {FREQ.map((f) => (
                  <button key={f} className={`chip sm ${sel.frequency === f ? 'on' : ''}`} onClick={() => setFact(sel.id, 'frequency', f)}>{f}</button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="detail-side">
          <section className="panel">
            <div className="panel-title"><Scale size={16} /> Why this lane</div>
            <div className="score-meter">
              <div className="sm-track">
                <span className="sm-band lane-0" style={{ flex: 3 }} />
                <span className="sm-band lane-1" style={{ flex: 3 }} />
                <span className="sm-band lane-2" style={{ flex: 4 }} />
                <span className="sm-band lane-3" style={{ flex: 4 }} />
                <span className="sm-mark" style={{ left: `${(Math.min(sel.score, 13) + 0.5) / 14 * 100}%` }}>{sel.score}</span>
              </div>
              <div className="sm-scale"><span>0</span><span>3</span><span>6</span><span>10+</span></div>
            </div>
            <ul className="hit-list">
              {sel.hits.map((h, i) => (
                <li key={i} className={h.raised ? 'raised' : ''}>
                  {h.raised || h.also ? <Lock size={14} /> : <Scale size={14} />}
                  <span><b>{h.id}</b> {h.text}</span>
                </li>
              ))}
            </ul>
            <div className="lane-desc">{LANES[sel.lane].desc}</div>
          </section>

          {line && sel.lane >= 1 && (
            <section className="panel">
              <div className="panel-title"><MessageSquareQuote size={16} /> What the agent says</div>
              <blockquote className="say">{line.text}</blockquote>
              <div className="panel-sub">Model draft. Read it aloud before it goes live.</div>
            </section>
          )}
          {line && sel.lane === 0 && (
            <section className="panel">
              <div className="panel-title"><MessageSquareQuote size={16} /> Closing line</div>
              <blockquote className="say">{line.text}</blockquote>
            </section>
          )}

          {signals.length > 0 && (
            <section className="panel">
              <div className="panel-title"><Zap size={16} /> Hand over early if</div>
              <div className="signal-list">
                {signals.map((s, i) => <div key={i} className="signal"><ArrowRight size={14} /> {s.text}</div>)}
              </div>
              <div className="panel-sub">Specific to this moment. The <button className="link" onClick={() => go('triggers')}>live triggers</button> apply on top.</div>
            </section>
          )}
        </div>
      </div>

      {sel.lane >= 2 && <ScreenPop form={form} row={sel} own={own} />}
    </div>
  );
}

function Activity2({ freq }) {
  const n = freq === 'Common' ? 3 : freq === 'Rare' ? 1 : 2;
  return (
    <span className="freq" aria-hidden="true">
      {[0, 1, 2].map((i) => <span key={i} className={i < n ? 'on' : ''} />)}
    </span>
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
          <button key={o.id} className={`chip sm ${value === o.id ? 'on' : ''}`} onClick={() => onChange(o.id)} title={o.note || ''}>
            {o.id} <span className="chip-note">{o.pts}</span>
          </button>
        ))}
        {!known && value && <button className="chip sm on">{value} <span className="chip-note">custom</span></button>}
        <AddOwn onAdd={onChange} placeholder="Your own" label="Own" />
      </div>
    </div>
  );
}

function ScreenPop({ form, row, own }) {
  const noScreen = form.delivery === 'Live transfer, no screen';
  const callback = form.delivery === 'Callback only' || form.coverage === 'Callbacks only';
  return (
    <section className="pop-wrap">
      <div className="pop-intro">
        <div className="panel-title"><Monitor size={16} /> What the person sees on pickup</div>
        <p className="panel-sub">
          {noScreen
            ? 'Your set-up has no screen, so the agent reads these lines to the person before connecting the caller. Keep it under 20 seconds.'
            : callback
              ? 'Your set-up books a callback, so this travels with the callback request.'
              : 'A preview of the context packet for this moment. Fields in the first block travel with every handover.'}
        </p>
      </div>
      <div className="pop">
        <div className="pop-bar">
          <span className="pop-dot" /><span className="pop-dot" /><span className="pop-dot" />
          <span className="pop-title">{callback ? 'Callback request' : 'Incoming transfer'} · {form.name || 'Voice line'}</span>
        </div>
        <div className="pop-head">
          <div>
            <div className="pop-moment">{row.name}</div>
            <div className="pop-reason">Passed by lane: {LANES[row.lane].label}</div>
          </div>
          <LanePill lane={row.lane} size="sm" />
        </div>
        <div className="pop-grid">
          <div>
            <div className="pop-label">Every handover</div>
            {BASE_FIELDS.map((f) => (
              <div key={f.field} className="pop-row"><span>{f.field}</span><i>{f.note}</i></div>
            ))}
          </div>
          <div>
            <div className="pop-label">For this moment</div>
            {own.length ? own.map((f, i) => (
              <div key={i} className="pop-row">
                <span>{f.field}</span>
                <em className={f.need === 'Required' ? 'req' : 'use'}>{f.need}</em>
              </div>
            )) : <div className="pop-row"><i>No moment fields suggested. Add them with the team.</i></div>}
            <div className="pop-rule"><Lock size={13} /> The person does not ask again for anything above.</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Live triggers ---------- */

function TriggerSection({ form, a, go }) {
  if (!a.rows.length) return <Empty icon={Zap} eyebrow="Live triggers" go={go} />;
  const T = triggers(form, a);
  const ooh = outOfHours(form);
  return (
    <div className="page">
      <PageHead
        icon={Zap}
        eyebrow="Live triggers"
        title="What passes any call, whatever the moment"
        lede="Lanes cover what a caller rings about. These triggers cover what happens during the call. They are fixed rules, switched on and worded by your settings."
      />
      <div className="trigger-grid">
        {T.map((t) => {
          const Icon = TRIGGER_ICONS[t.icon] || Zap;
          return (
            <div key={t.id} className="trigger">
              <div className="trigger-top">
                <span className="trigger-icon"><Icon size={18} /></span>
                <div>
                  <div className="trigger-id">{t.id}</div>
                  <div className="trigger-name">{t.name}</div>
                </div>
              </div>
              <div className="trigger-row"><span className="t-tag when">When</span> {t.when}</div>
              <div className="trigger-row"><span className="t-tag then">Then</span> {t.then}</div>
              <div className="trigger-why"><Info size={13} /> {t.why}</div>
            </div>
          );
        })}
      </div>

      <Card icon={Moon} title="When nobody is in" sub={ooh.applies ? `Your cover: ${ooh.cov}. Each lane changes like this` : 'Your line is staffed around the clock, so every lane works the same at night'}>
        <div className="ooh">
          <div className="ooh-head"><span>Lane</span><span>In hours</span><span>Out of hours</span></div>
          {ooh.rows.map((r) => (
            <div key={r.lane} className={`ooh-row ${r.inHours !== r.out ? 'changed' : ''}`}>
              <span><LanePill lane={r.lane} size="sm" /></span>
              <span>{r.inHours}</span>
              <span>{r.out}</span>
            </div>
          ))}
        </div>
        {ooh.applies && a.counts[3] > 0 && (
          <div className="notice warn"><TriangleAlert size={16} /> {a.counts[3]} straight-over {a.counts[3] === 1 ? 'moment has' : 'moments have'} nobody to go to at night. Agree the urgent number with the team before launch.</div>
        )}
      </Card>
    </div>
  );
}

/* ---------- Handover kit ---------- */

const METRICS = [
  { icon: PhoneForwarded, name: 'Transfer rate by moment', how: 'Compare each moment against its lane. An "Agent resolves" moment transferring often means a fact is wrong or a path is missing.' },
  { icon: Repeat, name: 'Repeat questions after transfer', how: 'Sample recordings and count questions the person asked that the packet already held. The target is none.' },
  { icon: Timer, name: 'Drop-off while waiting', how: 'Callers who hang up between the agent’s handover line and a person picking up. Rising numbers mean the line promises more than the queue can keep.' },
  { icon: Clock, name: 'Quick human closes', how: 'Transfers a person settles in under a minute. A pattern here means the agent could own that moment.' },
  { icon: Ear, name: 'Transfers from T2 and T5', how: 'Calls passed for not understanding. Listen to them: noise and accents show up here first.' },
  { icon: Moon, name: 'Callbacks kept', how: 'Share of booked callbacks made at the time promised. Missed ones undo the agent’s good work.' }
];

function KitSection({ form, a, map, go, copySpec, copied, downloadSpec, error }) {
  if (!a.rows.length) return <Empty icon={ClipboardList} eyebrow="Handover kit" go={go} />;
  const passed = a.rows.filter((r) => r.lane >= 2);
  return (
    <div className="page">
      <PageHead
        icon={ClipboardList}
        eyebrow="Handover kit"
        title="What travels with the call"
        lede="The context packet, the numbers to watch once it is live, and the open questions. Export it all as one spec for engineering and the contact centre lead."
      >
        <div className="row-btns">
          <button className="btn primary" onClick={copySpec}>{copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy the handoff spec'}</button>
          <button className="btn ghost" onClick={downloadSpec}><Download size={16} /> Download as Markdown</button>
        </div>
        {error && <div className="error"><TriangleAlert size={16} /> {error}</div>}
      </PageHead>

      <div className="case-two">
        <Card icon={FileText} title="Every packet carries" sub="Fixed. Sent with every handover, whichever lane or trigger">
          <div className="packet-list">
            {BASE_FIELDS.map((f, i) => (
              <div key={f.field} className="packet">
                <span className="packet-n">{i + 1}</span>
                <div><div className="packet-name">{f.field}</div><div className="packet-note">{f.note}</div></div>
              </div>
            ))}
          </div>
        </Card>
        <Card icon={Database} title="Captured per moment" sub={`For the ${passed.length} moments that reach a person`}>
          {passed.length ? passed.map((r) => {
            const own = map.fields.filter((f) => f.moment === r.n);
            return (
              <div key={r.id} className="cap">
                <div className="cap-head"><LanePill lane={r.lane} size="sm" /> <b>{r.n}. {r.name}</b></div>
                {r.lane === 3 && <div className="cap-note">Straight over: capture only the required fields that take one question.</div>}
                <div className="cap-fields">
                  {own.length ? own.map((f, i) => <span key={i} className={`cap-f ${f.need === 'Required' ? 'req' : ''}`}>{f.need === 'Required' && <Check size={12} />} {f.field}</span>) : <span className="cap-f">None suggested</span>}
                </div>
              </div>
            );
          }) : <div className="ok-line"><Check size={16} /> No moment reaches a person by its lane. Only the live triggers pass calls.</div>}
        </Card>
      </div>

      <Card icon={BarChart3} title="What to watch once it is live" sub="No targets printed here. Set your own baseline during the first weeks">
        <div className="metric-grid">
          {METRICS.map((m) => (
            <div key={m.name} className="metric">
              <span className="metric-icon"><m.icon size={17} /></span>
              <div><div className="metric-name">{m.name}</div><div className="metric-how">{m.how}</div></div>
            </div>
          ))}
        </div>
      </Card>

      <Card icon={CircleHelp} title="Questions for the contact centre lead" sub="Answers here can change a fact, and so a lane">
        <div className="q-list">
          {map.questions.length ? map.questions.map((q, i) => (
            <div key={i} className="q"><span className="q-n">{i + 1}</span> {q}</div>
          )) : <div className="panel-sub">No open questions listed.</div>}
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
        lede="When a caller gets a person should not depend on the wording of a prompt. The model only describes the call moments. Printed rules decide the lane and the triggers."
      />
      <div className="how-grid">
        <Card icon={Sparkles} title="What the model does" sub="Muse Glimmer by default, or your own key">
          <ul className="tick-list">
            <li><Check size={16} /> Splits your line into 4 to 8 call moments</li>
            <li><Check size={16} /> Suggests five facts per moment from fixed word lists</li>
            <li><Check size={16} /> Drafts handover lines, early signals, fields to capture and open questions</li>
            <li className="no"><X size={16} /> Never picks a lane, a trigger or an out-of-hours outcome</li>
          </ul>
        </Card>
        <Card icon={Scale} title="What the rules do" sub="Same facts in, same answer out">
          <ul className="tick-list">
            <li><Check size={16} /> Add up points for the five facts and map the total to a lane</li>
            <li><Check size={16} /> Apply four hard rules that only ever bring a person in sooner</li>
            <li><Check size={16} /> Switch live triggers on from your cover, languages and constraints</li>
            <li><Check size={16} /> Re-run instantly when you change a fact</li>
          </ul>
        </Card>
      </div>

      <Card icon={Gauge} title="Points per fact" sub="Higher means a mistake costs more or the call is harder to handle by voice">
        <div className="pts-grid">
          {FACT_KEYS.map((k) => (
            <div key={k} className="pts-col">
              <div className="pts-title">{FACTS[k].label}</div>
              {FACTS[k].options.map((o) => (
                <div key={o.id} className="pts-row"><span>{o.id}</span><b>{o.pts}</b></div>
              ))}
            </div>
          ))}
        </div>
        <div className="field-hint">A fact you type yourself has no weight of its own, so it scores as the middle of that fact's range and the moment is marked.</div>
      </Card>

      <div className="how-grid">
        <Card icon={Layers} title="From points to a lane" sub="Before the hard rules">
          <div className="band-list">
            <div className="band"><LanePill lane={0} size="sm" /><p>0 to 2 points</p></div>
            <div className="band"><LanePill lane={1} size="sm" /><p>3 to 5 points</p></div>
            <div className="band"><LanePill lane={2} size="sm" /><p>6 to 9 points</p></div>
            <div className="band"><LanePill lane={3} size="sm" /><p>10 points or more</p></div>
          </div>
        </Card>
        <Card icon={Lock} title="Hard rules" sub="They only ever bring a person in sooner">
          <div className="band-list">
            <div className="rule"><span className="rule-id">R1</span><p>Safety or wellbeing at stake. Straight to a person.</p></div>
            <div className="rule"><span className="rule-id">R2</span><p>Agent cannot finish it. Warm transfer at least, straight over if callers are upset.</p></div>
            <div className="rule"><span className="rule-id">R3</span><p>Money behind a strong identity check that the agent cannot complete alone. Warm transfer at least.</p></div>
            <div className="rule"><span className="rule-id">R4</span><p>Regulated line, upset caller, agent cannot fully finish. Warm transfer at least.</p></div>
          </div>
        </Card>
      </div>

      <div className="how-grid">
        <Card icon={FileText} title="Where this comes from" sub="So you know how far to trust it">
          <ul className="tick-list">
            <li><Info size={16} /> The facts, points and lanes are my own working method from deploying voice agents for enterprise clients, including multilingual lines with thousands of calls a day. They are not an industry standard.</li>
            <li><Info size={16} /> The noise guard (T5) comes from a real deployment, where road noise and hold music during the opening message were read as interruptions and broke calls that were going fine.</li>
            <li><Info size={16} /> The "never ask again" packet follows common contact centre practice for warm transfers. The card rule (T8) reflects the general principle of keeping card numbers out of recordings; check the detail with your payments team.</li>
          </ul>
        </Card>
        <Card icon={TriangleAlert} title="What it cannot do" sub="Limits worth knowing">
          <ul className="tick-list muted">
            <li><X size={16} /> It does not check your legal duties, such as rules on vulnerable customers or disclosing that a caller is talking to an AI. Ask your compliance team.</li>
            <li><X size={16} /> The share of calls reaching a person is a rough weighting from Common, Occasional and Rare. Use your own call data once you have it.</li>
            <li><X size={16} /> It does not size the human queue. A plan that passes 40% of calls needs the people to take them.</li>
            <li><X size={16} /> Moments the description leaves out are invisible to it. Listen to real calls before trusting the map.</li>
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
        title="Three phone lines from three industries"
        lede="Each loads a saved breakdown and runs it through the same rules as a live plan, so you can see everything without a key."
      />
      <div className="ex-grid">
        {EXAMPLES.map((ex) => {
          const m = parseMap(ex.text);
          const o = analyse(m.moments, ex.form);
          return (
            <button key={ex.id} className={`ex-card ${loadedExample === ex.id ? 'current' : ''}`} onClick={() => loadExample(ex)}>
              <div className="ex-top"><span className="team-tag"><Users size={13} /> {ex.team}</span>{loadedExample === ex.id && <span className="ex-current">Loaded</span>}</div>
              <div className="ex-title">{ex.title}</div>
              <div className="ex-blurb">{ex.blurb}</div>
              <LaneBar counts={o.counts} total={o.rows.length} />
              <div className="ex-stats">
                <span><Gauge size={14} /> ~{o.share}% reach a person</span>
                <span><Clock size={14} /> {ex.form.coverage}</span>
              </div>
              <div className="ex-open">Open this plan <ArrowRight size={14} /></div>
            </button>
          );
        })}
        <button className="ex-card blank" onClick={startBlank}>
          <div className="ex-blank-icon"><Plus size={22} /></div>
          <div className="ex-title">Plan your own</div>
          <div className="ex-blurb">Describe a phone line from your own team. Planning takes under a minute on the free model.</div>
        </button>
      </div>
    </div>
  );
}
