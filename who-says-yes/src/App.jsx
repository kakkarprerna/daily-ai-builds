import React, { useMemo, useRef, useState } from 'react';
import {
  Vote, Pencil, Map as MapIcon, Route, ClipboardCheck, BookOpen, Layers, Sparkles, Scale, Info, Check, Plus, X,
  ArrowRight, TriangleAlert, Lock, Users, FileText, Copy, Download, RotateCcw, KeyRound, Loader2, ShieldCheck,
  Handshake, PencilRuler, Megaphone, Mail, Gavel, Target, MessageCircleQuestion, Ear, CircleHelp, Gauge, Flag,
  Building2, CalendarClock, UserRound, ShieldAlert, Lightbulb, CornerDownRight, Waypoints, Ban
} from 'lucide-react';
import {
  FACTS, FACT_KEYS, PLAYS, STANCES, ASKS, TIMING, POSITION, CONSTRAINTS,
  parseMap, analyse, rounds, planMarkdown
} from './buyin.js';
import { EXAMPLES } from './examples.js';

const SECTIONS = [
  { id: 'start', icon: Pencil, label: 'Map a decision', desc: 'Describe the proposal and the people around it' },
  { id: 'map', icon: MapIcon, label: 'Buy-in map', desc: 'Everyone placed by their say and their stance' },
  { id: 'order', icon: Route, label: 'Order of approach', desc: 'Who to meet first, and why that order' },
  { id: 'ready', icon: ClipboardCheck, label: 'Ready to ask?', desc: 'The verdict, open questions and the plan' },
  { id: 'how', icon: BookOpen, label: 'How it works', desc: 'Points, rules and what the model does' },
  { id: 'examples', icon: Layers, label: 'Examples', desc: 'Three mapped decisions, no key needed' }
];

const PLAY_ICONS = [ShieldCheck, Handshake, PencilRuler, Megaphone, Mail];
const ROUND_ICONS = { shield: ShieldCheck, pencil: PencilRuler, megaphone: Megaphone, handshake: Handshake, lock: Lock, gavel: Gavel, mail: Mail };

const PROVIDERS = [
  { id: 'muse', label: 'Muse Glimmer', note: 'Free, on this site' },
  { id: 'anthropic', label: 'Anthropic', note: 'Your key' },
  { id: 'openai', label: 'OpenAI', note: 'Your key' },
  { id: 'gemini', label: 'Gemini', note: 'Your key' }
];

const BLANK = { name: '', proposal: '', people: '', ask: ASKS[0], timing: TIMING[1], position: POSITION[0], constraints: [] };

const slug = (s) => (s || 'decision').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function App() {
  const first = EXAMPLES[0];
  const firstMap = parseMap(first.text);
  const [section, setSection] = useState('map');
  const [form, setForm] = useState(first.form);
  const [loadedExample, setLoadedExample] = useState(first.id);
  const [mapText, setMapText] = useState(first.text);
  const [people, setPeople] = useState(firstMap.people);
  const [selected, setSelected] = useState('s2');
  const [provider, setProvider] = useState('muse');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const mainRef = useRef(null);

  const map = useMemo(() => parseMap(mapText), [mapText]);
  const a = useMemo(() => analyse(people, map.sways, form), [people, map, form]);
  const edits = useMemo(() => {
    let n = 0;
    people.forEach((p, i) => FACT_KEYS.forEach((k) => { if (map.people[i] && map.people[i][k] !== p[k]) n += 1; }));
    return n;
  }, [people, map]);

  const go = (id) => {
    setSection(id);
    if (mainRef.current) mainRef.current.scrollTo({ top: 0 });
  };
  const set = (k, v) => {
    setLoadedExample(null);
    setForm((f) => ({ ...f, [k]: v }));
  };
  const setFact = (id, k, v) => setPeople((ps) => ps.map((p) => (p.id === id ? { ...p, [k]: v } : p)));
  const resetFacts = () => setPeople(map.people);

  const loadExample = (ex) => {
    setForm(ex.form);
    setLoadedExample(ex.id);
    setMapText(ex.text);
    setPeople(parseMap(ex.text).people);
    setSelected('s2');
    setError('');
    go('map');
  };
  const startBlank = () => {
    setForm(BLANK);
    setLoadedExample(null);
    setMapText('');
    setPeople([]);
    setSelected(null);
    setError('');
    go('start');
  };

  const runMap = async () => {
    setError('');
    if (form.proposal.trim().length < 40 || form.people.trim().length < 60) {
      setError('Describe the proposal and the people around it, in a few sentences each.');
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
      if (parsed.people.length < 2) throw new Error('The model replied, but not in the expected format. Try again or switch provider.');
      setMapText(data.text);
      setPeople(parsed.people);
      setSelected('s1');
      go('map');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const plan = () => planMarkdown(form, map, a);
  const copyPlan = async () => {
    try {
      await navigator.clipboard.writeText(plan());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('Copy failed in this browser. Use download instead.');
    }
  };
  const downloadPlan = () => {
    const blob = new Blob([plan()], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${slug(form.name)}-buy-in-plan.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Vote size={20} /></div>
          <div>
            <div className="brand-name">Who Says Yes?</div>
            <div className="brand-sub">A buy-in plan for any proposal</div>
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
            <div className="side-verdict-label">Current decision</div>
            <div className="side-name">{form.name || 'Untitled decision'}</div>
            <span className={`verdict-pill v-${a.verdict.level} on-dark`}>{a.verdict.label}</span>
            <PlayBar counts={a.counts} total={a.rows.length} dark />
            <div className="side-verdict-line">{a.weighted}% weighted support</div>
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
        {section === 'order' && <OrderSection a={a} map={map} go={go} setSelected={setSelected} />}
        {section === 'ready' && (
          <ReadySection form={form} a={a} map={map} go={go} copyPlan={copyPlan} copied={copied} downloadPlan={downloadPlan} error={error} />
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

function PlayPill({ play, size }) {
  const Icon = PLAY_ICONS[play];
  return (
    <span className={`lane-pill play-${play} ${size || ''}`}>
      <Icon size={size === 'sm' ? 12 : 14} /> {PLAYS[play].label}
    </span>
  );
}

function PlayBar({ counts, total, dark }) {
  return (
    <div className={`lane-bar ${dark ? 'dark' : ''}`} aria-label="People per play">
      {counts.map((c, i) => c > 0 && (
        <span key={i} className={`lane-seg play-${i}`} style={{ flex: c }} title={`${PLAYS[i].label}: ${c}`}>{c}</span>
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
      <PageHead icon={icon} eyebrow={eyebrow} title="Nothing mapped yet" lede="Describe a proposal and the people around it first, or open one of the worked examples." />
      <div className="row-btns">
        <button className="btn primary" onClick={() => go('start')}><Pencil size={16} /> Map a decision</button>
        <button className="btn ghost" onClick={() => go('examples')}><Layers size={16} /> See examples</button>
      </div>
    </div>
  );
}

function StanceDots({ stance }) {
  const i = STANCES.indexOf(stance);
  return (
    <span className="stance-dots" aria-label={`Stance: ${stance}`}>
      {STANCES.map((s, k) => <span key={s} className={k === i ? 'on' : k < 2 ? 'neg' : k > 2 ? 'pos' : ''} />)}
    </span>
  );
}

/* ---------- Map a decision ---------- */

function StartSection(p) {
  const { form, set, a } = p;
  return (
    <div className="page">
      <PageHead
        icon={Pencil}
        eyebrow="Map a decision"
        title="Who has to say yes, and in what order?"
        lede="Describe what you are proposing and what you know about the people around it. You get everyone on one map, a play for each person, the order to meet them in, and a straight answer on whether you are ready to ask."
      >
        <div className="steps">
          <Step n="1" icon={Pencil} text="Describe the proposal and the people involved" />
          <Step n="2" icon={Sparkles} text="A model lists the people and suggests five facts each" />
          <Step n="3" icon={Scale} text="Printed rules set each play and the order. Change a fact and watch it move" />
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
          <Card icon={Lightbulb} title="The proposal" sub="What you want agreed, in the words you would use in the meeting">
            <TextField label="Name" value={form.name} onChange={(v) => set('name', v)} placeholder="Usage-based pricing" />
            <TextField
              label="What you are proposing"
              hint="Include the size of the first step. A pilot and a full rollout get different reactions."
              value={form.proposal} onChange={(v) => set('proposal', v)} area rows={4}
              placeholder="Move new customers to usage-based pricing from next quarter, with a minimum monthly commitment..."
            />
          </Card>

          <Card icon={Users} title="The people around it" sub="Who decides, who is affected, and anything you have heard">
            <TextField
              label="What you know about them"
              hint="Roles are enough. Say who backs it, who is worried and why, and who listens to whom."
              value={form.people} onChange={(v) => set('people', v)} area rows={7}
              placeholder="The CEO asked for this. Sales leadership is worried about commission. The CTO says metering is not built yet..."
            />
          </Card>

          <div className="two-cards">
            <Card icon={Target} title="Kind of ask" sub="Shapes who usually needs to approve">
              <Chips options={ASKS} value={form.ask} onChange={(v) => set('ask', v)} placeholder="Your own" />
            </Card>
            <Card icon={CalendarClock} title="When it needs deciding" sub="A tight date switches on a rule">
              <Chips options={TIMING} value={form.timing} onChange={(v) => set('timing', v)} placeholder="Your date" />
            </Card>
          </div>

          <div className="two-cards">
            <Card icon={UserRound} title="Your position" sub="Changes how you get in the room">
              <Chips options={POSITION} value={form.position} onChange={(v) => set('position', v)} placeholder="Your own" />
            </Card>
            <Card icon={ShieldAlert} title="Constraints" sub="Each one adds a fixed step before the decision">
              <MultiChips options={CONSTRAINTS} value={form.constraints} onChange={(v) => set('constraints', v)} placeholder="Another constraint" />
            </Card>
          </div>

          <Card icon={KeyRound} title="Model for the people list" sub="It lists people and suggests facts. It never picks a play or the order">
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
              {p.busy ? <Loader2 size={18} className="spin" /> : <MapIcon size={18} />}
              {p.busy ? 'Mapping the people' : 'Map who says yes'}
            </button>
            {p.error && <div className="error"><TriangleAlert size={16} /> {p.error}</div>}
            <div className="field-hint">Nothing you type is stored. Use roles rather than names if the proposal is sensitive.</div>
          </Card>
        </div>

        <div className="build-results">
          <div className="sticky-results">
            <div className="panel">
              <div className="panel-title"><Layers size={16} /> The five plays</div>
              <div className="panel-sub">Every person gets one. Darker means more of your time.</div>
              <div className="lane-list">
                {PLAYS.map((L) => {
                  const Icon = PLAY_ICONS[L.id];
                  return (
                    <div key={L.id} className="lane-li">
                      <span className={`lane-dot play-${L.id}`}><Icon size={14} /></span>
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
                <div className="panel-title"><MapIcon size={16} /> Current map</div>
                <div className="panel-sub">{form.name || 'Untitled decision'}, {a.rows.length} people</div>
                <PlayBar counts={a.counts} total={a.rows.length} />
                <div className="shape-line"><span className={`verdict-pill v-${a.verdict.level}`}>{a.verdict.label}</span></div>
                <button className="btn ghost wide small" onClick={() => p.go('map')}>Open the map <ArrowRight size={16} /></button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Buy-in map ---------- */

function MapSection({ form, a, map, selected, setSelected, setFact, edits, resetFacts, go, loadedExample }) {
  const detailRef = useRef(null);
  if (!a.rows.length) return <Empty icon={MapIcon} eyebrow="Buy-in map" go={go} />;
  const sel = a.rows.find((r) => r.id === selected) || a.rows[0];
  const pick = (id) => {
    setSelected(id);
    setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
  };
  const ask = map.asks.find((x) => x.n === sel.n);
  const worries = map.worries.filter((w) => w.n === sel.n);
  const byN = Object.fromEntries(a.rows.map((r) => [r.n, r]));
  const bands = [
    { id: 'strong', label: 'Strong say', sub: 'Power 4 to 6', rows: a.rows.filter((r) => r.high) },
    { id: 'light', label: 'Lighter say', sub: 'Power 1 to 3', rows: a.rows.filter((r) => !r.high) }
  ];
  const custom = (r) => !STANCES.includes(r.stance);

  return (
    <div className="page wide">
      <PageHead icon={MapIcon} eyebrow="Buy-in map" title={form.name || 'Untitled decision'} lede={map.summary}>
        {loadedExample && (
          <div className="notice"><Info size={16} /> Worked example. Click anyone to see why they got their play, then change a fact and watch the map, the order and the verdict move.</div>
        )}
        {edits > 0 && (
          <div className="notice warn">
            <Pencil size={16} /> You changed {edits} {edits === 1 ? 'fact' : 'facts'} from the model's suggestion.
            <button className="link" onClick={resetFacts}><RotateCcw size={13} /> Reset</button>
          </div>
        )}
      </PageHead>

      <div className="kpis four">
        <Kpi icon={Flag} label="Verdict" value={<span className={`kv kv-${a.verdict.level}`}>{a.verdict.label}</span>} sub="From printed rules" />
        <Kpi icon={Gauge} label="Weighted support" value={`${a.weighted}%`} sub="Stance weighted by each person's power" />
        <Kpi icon={Gavel} label="Decision power on side" value={`${a.deciderOnSide}%`} sub={`${a.deciders.length} people sign off or can block`} />
        <Kpi icon={Handshake} label="To win over" value={a.counts[1]} sub="One to ones before the decision" />
      </div>

      <section className="grid-card">
        <div className="sg" role="table" aria-label="People by say and stance">
          <div className="sg-head" role="row">
            <div className="sg-corner" />
            {STANCES.map((s, i) => (
              <div key={s} className={`sg-col sg-col-${i}`} role="columnheader">{s}</div>
            ))}
          </div>
          {bands.map((b) => (
            <div key={b.id} className={`sg-row sg-${b.id}`} role="row">
              <div className="sg-band">
                <div className="sg-band-label">{b.label}</div>
                <div className="sg-band-sub">{b.sub}</div>
              </div>
              {STANCES.map((s) => (
                <div key={s} className="sg-cell" role="cell" data-stance={s}>
                  {b.rows.filter((r) => r.stance === s || (custom(r) && s === 'Unknown')).map((r) => {
                    const Icon = PLAY_ICONS[r.play];
                    return (
                      <button key={r.id} className={`p-card play-${r.play} ${sel.id === r.id ? 'sel' : ''}`} onClick={() => pick(r.id)}>
                        <span className="pc-top"><Icon size={13} /> {PLAYS[r.play].short}</span>
                        <span className="pc-name">{r.name}</span>
                        <span className="pc-meta">{r.role}</span>
                        {r.flags.length > 0 && <span className="pc-flag">{r.flags.some((f) => f.kind === 'block') ? <Ban size={11} /> : <TriangleAlert size={11} />} {r.flags.map((f) => f.id).join(' ')}</span>}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="board-key">
          <span><ArrowRight size={13} /> Further right means closer to backing it</span>
          <span><TriangleAlert size={13} /> A hard rule raised a warning</span>
          <span><Ban size={13} /> A blocker</span>
        </div>
      </section>

      <div ref={detailRef} className="detail-grid">
        <section className="card detail">
          <div className="detail-top">
            <div>
              <div className="detail-n">Person {sel.n} of {a.rows.length}</div>
              <h2 className="detail-name">{sel.name}</h2>
              {sel.cares && <p className="detail-what">Cares about: {sel.cares}</p>}
            </div>
            <PlayPill play={sel.play} />
          </div>
          <div className="fact-grid">
            {FACT_KEYS.map((k) => (
              <FactRow key={k} k={k} value={sel[k]} onChange={(v) => setFact(sel.id, k, v)} />
            ))}
          </div>
        </section>

        <div className="detail-side">
          <section className="panel">
            <div className="panel-title"><Scale size={16} /> Why this play</div>
            <div className="power-meter">
              <div className="pm-row"><span>Power</span><div className="pm-track">{[1, 2, 3, 4, 5, 6].map((i) => <span key={i} className={i <= sel.power ? 'on' : ''} />)}</div><b>{sel.power}/6</b></div>
              <div className="pm-row"><span>Stance</span><StanceDots stance={sel.stance} /><b>{sel.stance}</b></div>
            </div>
            <ul className="hit-list">
              {sel.hits.map((h, i) => (
                <li key={i}><Scale size={14} /><span><b>{h.id}</b> {h.text}</span></li>
              ))}
              {sel.flags.map((f) => (
                <li key={f.id} className={f.kind === 'block' ? 'raised' : 'flag'}>
                  {f.kind === 'block' ? <Ban size={14} /> : <TriangleAlert size={14} />}
                  <span><b>{f.id}</b> {f.text}</span>
                </li>
              ))}
            </ul>
            <div className="lane-desc">{PLAYS[sel.play].desc}</div>
          </section>

          {ask && (
            <section className="panel">
              <div className="panel-title"><Target size={16} /> What to ask them for</div>
              <blockquote className="say">{ask.text}</blockquote>
              <div className="panel-sub">Model draft. Make it something they can say yes to in one meeting.</div>
            </section>
          )}

          {(sel.listensTo.length > 0 || sel.swaysOut.length > 0) && (
            <section className="panel">
              <div className="panel-title"><Waypoints size={16} /> Who sways whom</div>
              <div className="link-list">
                {sel.listensTo.map((s, i) => (
                  <div key={`in${i}`} className="link-row">
                    <span className="link-tag in"><Ear size={12} /> Listens to</span>
                    <div><b>{byN[s.from]?.name}</b> <span className="link-stance">({byN[s.from]?.stance.toLowerCase()})</span>{s.how && <div className="link-how">{s.how}</div>}</div>
                  </div>
                ))}
                {sel.swaysOut.map((s, i) => (
                  <div key={`out${i}`} className="link-row">
                    <span className="link-tag out"><Megaphone size={12} /> Sways</span>
                    <div><b>{byN[s.to]?.name}</b> <span className="link-stance">({byN[s.to]?.stance.toLowerCase()})</span>{s.how && <div className="link-how">{s.how}</div>}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {worries.length > 0 && (
        <section className="worry-wrap">
          <div className="panel-title"><MessageCircleQuestion size={16} /> What {sel.name} is likely to say, and your answer</div>
          <div className="worry-grid">
            {worries.map((w, i) => (
              <div key={i} className="worry">
                <div className="worry-q"><span className="w-tag">They say</span>{w.worry}</div>
                {w.answer && <div className="worry-a"><CornerDownRight size={15} /><span><span className="w-tag a">You bring</span>{w.answer}</span></div>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function FactRow({ k, value, onChange }) {
  const f = FACTS[k];
  const known = f.options.some((o) => o.id === value);
  const showPts = k !== 'access';
  return (
    <div className="fact-row">
      <div className="fact-head">
        <div>
          <div className="field-label">{f.label}</div>
          <div className="field-hint">{f.hint}</div>
        </div>
      </div>
      <div className="chip-row">
        {f.options.map((o) => (
          <button key={o.id} className={`chip sm ${value === o.id ? 'on' : ''}`} onClick={() => onChange(o.id)} title={o.note || ''}>
            {o.id} {showPts && <span className="chip-note">{o.pts > 0 && k === 'stance' ? `+${o.pts}` : o.pts}</span>}
          </button>
        ))}
        {!known && value && <button className="chip sm on">{value} <span className="chip-note">custom</span></button>}
        <AddOwn onAdd={onChange} placeholder="Your own" label="Own" />
      </div>
    </div>
  );
}

/* ---------- Order of approach ---------- */

function OrderSection({ a, map, go, setSelected }) {
  if (!a.rows.length) return <Empty icon={Route} eyebrow="Order of approach" go={go} />;
  const R = rounds(a);
  const open = (id) => { setSelected(id); go('map'); };
  return (
    <div className="page">
      <PageHead
        icon={Route}
        eyebrow="Order of approach"
        title="Who to meet first, and why"
        lede="The order comes from fixed rules: cover first, then the people who shape it, then the voices that carry it, then the one to ones, and only then the decision."
      >
        {a.notes.map((n, i) => <div key={i} className="notice warn"><TriangleAlert size={16} /> {n}</div>)}
      </PageHead>
      <div className="timeline">
        {R.map((r) => {
          const Icon = ROUND_ICONS[r.icon] || Route;
          return (
            <section key={r.id} className={`round ${r.decision ? 'decision' : ''} ${r.gates ? 'gates' : ''}`}>
              <div className="round-rail"><span className="round-n">{r.step}</span></div>
              <div className="round-body">
                <div className="round-head">
                  <span className="round-icon"><Icon size={18} /></span>
                  <div>
                    <div className="round-title">{r.title}</div>
                    <div className="round-why">{r.why}</div>
                  </div>
                </div>
                {r.gates ? (
                  <div className="gate-list">
                    {r.gates.map((g) => (
                      <div key={g.id} className="gate"><Lock size={15} /><div><b>{g.name}</b><div>{g.text}</div></div></div>
                    ))}
                  </div>
                ) : r.people.length ? (
                  <div className="meet-list">
                    {r.people.map((p, i) => {
                      const ask = map.asks.find((x) => x.n === p.n);
                      return (
                        <button key={p.id} className="meet" onClick={() => open(p.id)}>
                          <span className={`meet-n play-${p.play}`}>{String.fromCharCode(97 + i)}</span>
                          <div className="meet-main">
                            <div className="meet-name">{p.name} <PlayPill play={p.play} size="sm" /> {r.decision && <span className={`stance-tag s-${p.support > 0 ? 'pos' : p.support < 0 ? 'neg' : 'mid'}`}>{p.stance}</span>}</div>
                            {ask && !r.decision && <div className="meet-ask"><Target size={13} /> {ask.text}</div>}
                            {p.play === 1 && p.allies.length > 0 && <div className="meet-after"><Megaphone size={13} /> After {p.allies.map((x) => x.person.name).join(' and ')} has raised it with them</div>}
                            {p.flags.filter((f) => f.id === 'R1' || f.id === 'R3').map((f) => <div key={f.id} className="meet-flag"><TriangleAlert size={13} /> {f.text}</div>)}
                          </div>
                          <ArrowRight size={16} className="meet-go" />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="round-empty"><Info size={15} /> {r.empty}</div>
                )}
                {r.decision && <div className={`verdict-line v-${a.verdict.level}`}><Flag size={15} /> <b>{a.verdict.label}.</b> {a.verdict.text}</div>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Ready to ask? ---------- */

function ReadySection({ form, a, map, go, copyPlan, copied, downloadPlan, error }) {
  if (!a.rows.length) return <Empty icon={ClipboardCheck} eyebrow="Ready to ask?" go={go} />;
  const moves = a.rows.filter((r) => (r.role === 'Signs off' || r.role === 'Can block') && r.support <= 0);
  return (
    <div className="page">
      <PageHead
        icon={ClipboardCheck}
        eyebrow="Ready to ask?"
        title="Should you ask for the decision yet?"
        lede="The verdict only looks at the people who sign off or can block. Everyone else changes how you get there, not whether you are there."
      >
        <div className="row-btns">
          <button className="btn primary" onClick={copyPlan}>{copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy the buy-in plan'}</button>
          <button className="btn ghost" onClick={downloadPlan}><Download size={16} /> Download as Markdown</button>
        </div>
        {error && <div className="error"><TriangleAlert size={16} /> {error}</div>}
      </PageHead>

      <section className={`verdict-hero v-${a.verdict.level}`}>
        <div className="vh-icon">{a.verdict.level === 2 ? <Check size={26} /> : a.verdict.level === 0 ? <Ban size={26} /> : <Route size={26} />}</div>
        <div>
          <div className="vh-label">{a.verdict.label}</div>
          <div className="vh-text">{a.verdict.text}</div>
        </div>
        <div className="vh-meters">
          <Meter label="Weighted support" value={a.weighted} />
          <Meter label="Decision power on side" value={a.deciderOnSide} />
        </div>
      </section>

      <div className="case-two">
        <Card icon={Gavel} title="The people who decide" sub="Sign off or can block">
          <div className="decider-list">
            {a.deciders.length ? a.deciders.map((d) => (
              <div key={d.id} className="decider">
                <div className="decider-top"><b>{d.name}</b><span className={`stance-tag s-${d.support > 0 ? 'pos' : d.support < 0 ? 'neg' : 'mid'}`}>{d.stance}</span></div>
                <div className="decider-sub">{d.role} · power {d.power} of 6</div>
                <StanceDots stance={d.stance} />
              </div>
            )) : <div className="panel-sub">Nobody on the map signs off or can block.</div>}
          </div>
        </Card>
        <Card icon={Route} title="What would move the verdict" sub="Each one, moved to open or backing, changes the answer">
          {moves.length ? (
            <div className="q-list">
              {moves.map((m) => {
                const w = map.worries.find((x) => x.n === m.n);
                return (
                  <div key={m.id} className="q"><span className="q-n"><Handshake size={13} /></span><div><b>{m.name}</b>{w ? <div className="move-w">Answer: {w.answer || w.worry}</div> : null}</div></div>
                );
              })}
            </div>
          ) : <div className="ok-line"><Check size={16} /> Everyone who decides is already open or backing it.</div>}
        </Card>
      </div>

      {a.gates.length > 0 && (
        <Card icon={Lock} title="Fixed steps from your constraints" sub="Finish these before the decision meeting">
          <div className="gate-list">
            {a.gates.map((g) => <div key={g.id} className="gate"><Lock size={15} /><div><b>{g.name}</b><div>{g.text}</div></div></div>)}
          </div>
        </Card>
      )}

      <Card icon={CircleHelp} title="Questions to answer first" sub="An answer here can change a fact, and so a play">
        <div className="q-list">
          {map.questions.length ? map.questions.map((q, i) => (
            <div key={i} className="q"><span className="q-n">{i + 1}</span> {q}</div>
          )) : <div className="panel-sub">No open questions listed.</div>}
        </div>
      </Card>
    </div>
  );
}

function Meter({ label, value }) {
  return (
    <div className="meter">
      <div className="meter-top"><span>{label}</span><b>{value}%</b></div>
      <div className="meter-track"><span style={{ width: `${Math.max(2, value)}%` }} /></div>
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
        lede="Who you meet first should not depend on the wording of a prompt. The model only lists the people and suggests facts. Printed rules set every play, the order and the verdict."
      />
      <div className="how-grid">
        <Card icon={Sparkles} title="What the model does" sub="Muse Glimmer by default, or your own key">
          <ul className="tick-list">
            <li><Check size={16} /> Lists the 4 to 9 people or groups that matter</li>
            <li><Check size={16} /> Suggests five facts per person from fixed word lists</li>
            <li><Check size={16} /> Drafts likely worries, answers, asks and who sways whom</li>
            <li className="no"><X size={16} /> Never picks a play, the order or the verdict</li>
          </ul>
        </Card>
        <Card icon={Scale} title="What the rules do" sub="Same facts in, same plan out">
          <ul className="tick-list">
            <li><Check size={16} /> Add say and weight into a power score out of 6</li>
            <li><Check size={16} /> Combine power, stance and impact into one of five plays</li>
            <li><Check size={16} /> Order the meetings and raise warnings with five hard rules</li>
            <li><Check size={16} /> Re-run instantly when you change a fact</li>
          </ul>
        </Card>
      </div>

      <Card icon={Gauge} title="Points per fact" sub="Power is part in the decision plus weight in the room. Four or more is a strong say">
        <div className="pts-grid four">
          {['role', 'influence', 'stance', 'impact'].map((k) => (
            <div key={k} className="pts-col">
              <div className="pts-title">{FACTS[k].label}</div>
              {FACTS[k].options.map((o) => (
                <div key={o.id} className="pts-row"><span>{o.id}</span><b>{o.pts > 0 && k === 'stance' ? `+${o.pts}` : o.pts}</b></div>
              ))}
            </div>
          ))}
        </div>
        <div className="field-hint">A fact you type yourself has no weight of its own, so it scores as the middle of that fact's range. Your route to someone has no points; it only triggers rule R3.</div>
      </Card>

      <div className="how-grid">
        <Card icon={Layers} title="From facts to a play" sub="Checked top to bottom, first match wins">
          <div className="band-list">
            <div className="band"><PlayPill play={0} size="sm" /><p>Strong say, stance above zero</p></div>
            <div className="band"><PlayPill play={1} size="sm" /><p>Strong say, stance zero or below</p></div>
            <div className="band"><PlayPill play={2} size="sm" /><p>Lighter say, heavy change to their work</p></div>
            <div className="band"><PlayPill play={3} size="sm" /><p>Lighter say, on side, sways someone</p></div>
            <div className="band"><PlayPill play={4} size="sm" /><p>Everyone else</p></div>
          </div>
        </Card>
        <Card icon={Lock} title="Hard rules" sub="They add warnings and can hold the verdict back">
          <div className="band-list">
            <div className="rule"><span className="rule-id">R1</span><p>Signs off or can block, and against. A blocker; the verdict cannot read Ready.</p></div>
            <div className="rule"><span className="rule-id">R2</span><p>Signs off, stance unknown. Find out before anything else.</p></div>
            <div className="rule"><span className="rule-id">R3</span><p>Strong say, no route in. Names who can introduce you, if anyone on side sways them.</p></div>
            <div className="rule"><span className="rule-id">R4</span><p>Heavy change to their work and not on side. Involve them before the plan is fixed.</p></div>
            <div className="rule"><span className="rule-id">R5</span><p>Little formal say, high weight, not on side. Preview it with them first.</p></div>
          </div>
        </Card>
      </div>

      <div className="how-grid">
        <Card icon={Flag} title="The verdict" sub="Only the people who sign off or can block count">
          <div className="band-list">
            <div className="band"><span className="verdict-pill v-0">Not ready to ask</span><p>Any blocker, or anyone who signs off is doubtful or against</p></div>
            <div className="band"><span className="verdict-pill v-1">Getting there</span><p>Anyone who decides is still unknown or doubtful</p></div>
            <div className="band"><span className="verdict-pill v-2">Ready to ask</span><p>Everyone who decides is open or backing it</p></div>
          </div>
        </Card>
        <Card icon={Route} title="The order" sub="Seven rounds, empty ones say so">
          <ul className="tick-list">
            <li><ShieldCheck size={16} /> Sponsors first, strongest say first</li>
            <li><PencilRuler size={16} /> Co-design next, least supportive first, so their concerns shape it</li>
            <li><Megaphone size={16} /> Messengers who sway someone you need to win over go first</li>
            <li><Handshake size={16} /> One to ones: unknown, then doubtful, then against</li>
            <li><Lock size={16} /> Gates from your constraints, then the decision, then everyone else</li>
          </ul>
        </Card>
      </div>

      <div className="how-grid">
        <Card icon={FileText} title="Where this comes from" sub="So you know how far to trust it">
          <ul className="tick-list">
            <li><Info size={16} /> The two axes build on the power and interest grid taught in project management courses such as the PMP, and the stance scale follows the same idea as the stakeholder engagement assessment in the PMI's guidance.</li>
            <li><Info size={16} /> The plays, the points and the order are my own working method from leading cross-functional work without formal authority at two startups. They are not an industry standard.</li>
            <li><Info size={16} /> The note on works councils is general background on EU practice, not legal advice. Check with HR or employment counsel.</li>
          </ul>
        </Card>
        <Card icon={TriangleAlert} title="What it cannot do" sub="Limits worth knowing">
          <ul className="tick-list muted">
            <li><X size={16} /> It only knows what you type. Stances are your guesses; the map is only as good as them.</li>
            <li><X size={16} /> It does not write the pitch or the deck. It tells you who hears it, in what order, and what they will push on.</li>
            <li><X size={16} /> People missing from your description are missing from the map. Ask your sponsor who else should be on it.</li>
            <li><X size={16} /> Weighted support is a summary of your inputs, not a forecast of the vote.</li>
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
        title="Three proposals, three kinds of resistance"
        lede="Each loads a saved people list and runs it through the same rules as a live map, so you can see everything without a key."
      />
      <div className="ex-grid">
        {EXAMPLES.map((ex) => {
          const m = parseMap(ex.text);
          const o = analyse(m.people, m.sways, ex.form);
          return (
            <button key={ex.id} className={`ex-card ${loadedExample === ex.id ? 'current' : ''}`} onClick={() => loadExample(ex)}>
              <div className="ex-top"><span className="team-tag"><Building2 size={13} /> {ex.team}</span>{loadedExample === ex.id && <span className="ex-current">Loaded</span>}</div>
              <div className="ex-title">{ex.title}</div>
              <div className="ex-blurb">{ex.blurb}</div>
              <PlayBar counts={o.counts} total={o.rows.length} />
              <div className="ex-stats">
                <span className={`verdict-pill v-${o.verdict.level}`}>{o.verdict.label}</span>
                <span><Users size={14} /> {o.rows.length} people</span>
              </div>
              <div className="ex-open">Open this map <ArrowRight size={14} /></div>
            </button>
          );
        })}
        <button className="ex-card blank" onClick={startBlank}>
          <div className="ex-blank-icon"><Plus size={22} /></div>
          <div className="ex-title">Map your own</div>
          <div className="ex-blurb">Describe a proposal from your own team. Mapping takes under a minute on the free model.</div>
        </button>
      </div>
    </div>
  );
}
