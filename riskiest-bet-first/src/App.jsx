import React, { useMemo, useRef, useState } from 'react';
import {
  Crosshair, PenLine, LayoutGrid, Route, FileText, Scale, Layers, Info, TriangleAlert, KeyRound, Loader2, Check, X, Plus,
  Copy, Download, ArrowRight, Sparkles, Wand2, Search, Heart, Megaphone, MousePointerClick, Wrench, Coins, FlaskConical,
  Shapes, Scissors, Hammer, Quote, Lightbulb, Bot, CircleHelp, Trash2, ListChecks, Flag, Gauge, CalendarRange, Euro,
  Ruler, CircleCheck, OctagonX, Eye, Repeat, Users, Clock, MessageSquareText, ShieldCheck, Ghost, ArrowDownWideNarrow, ChevronDown
} from 'lucide-react';
import {
  SEGMENTS, TIMEBOXES, CATEGORIES, IMPACT, EVIDENCE, EVIDENCE_HINT, BANDS, VERDICTS, catById,
  assess, parseReply, checkSuggestions, testOptions, chosenTest, testFor, noteMarkdown
} from './rules.js';
import { EXAMPLES } from './examples.js';

const SECTIONS = [
  { id: 'describe', icon: PenLine, label: 'Describe it', desc: 'The idea, who it is for and your notes' },
  { id: 'bets', icon: ListChecks, label: 'Your bets', desc: 'Every assumption, its impact and evidence' },
  { id: 'board', icon: LayoutGrid, label: 'Bet board', desc: 'The verdict and where each bet sits' },
  { id: 'plan', icon: Route, label: 'Test plan', desc: 'Cheapest test per bet, with pass and kill lines' },
  { id: 'note', icon: FileText, label: 'Decision note', desc: 'Interview questions and a note to share' },
  { id: 'how', icon: Scale, label: 'How it works', desc: 'The printed rules and test library' },
  { id: 'examples', icon: Layers, label: 'Examples', desc: 'Three worked ideas, no key needed' }
];

const CAT_ICONS = { problem: Search, value: Heart, reach: Megaphone, usability: MousePointerClick, feasibility: Wrench, viability: Coins };
const VERDICT_ICONS = { test: FlaskConical, prototype: Shapes, slice: Scissors, build: Hammer };
const BAND_ICONS = { leap: OctagonX, soon: FlaskConical, watch: Eye };

const PROVIDERS = [
  { id: 'muse', label: 'Muse Glimmer', note: 'Free, on this site' },
  { id: 'anthropic', label: 'Anthropic', note: 'Your key' },
  { id: 'openai', label: 'OpenAI', note: 'Your key' },
  { id: 'gemini', label: 'Gemini', note: 'Your key' }
];

const BLANK = { name: '', pitch: '', segment: SEGMENTS[0], timebox: '4 weeks', notes: '', assumptions: [] };

const pl = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const uid = () => Math.random().toString(36).slice(2, 9);
const slug = (s) => (s || 'idea').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

export default function App() {
  const today = useMemo(() => new Date(), []);
  const [section, setSection] = useState('board');
  const [form, setForm] = useState(EXAMPLES[0].form);
  const [loadedExample, setLoadedExample] = useState(EXAMPLES[0].id);
  const [modelText, setModelText] = useState(EXAMPLES[0].text);
  const [modelNotes, setModelNotes] = useState(EXAMPLES[0].form.notes);
  const [provider, setProvider] = useState('muse');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const mainRef = useRef(null);

  const a = useMemo(() => assess(form), [form]);
  const parsed = useMemo(() => parseReply(modelText), [modelText]);
  const sugg = useMemo(() => checkSuggestions(parsed, form), [parsed, form]);
  const stale = !!modelText && modelNotes.trim() !== form.notes.trim();
  const fresh = sugg.kept.filter((s) => !s.added).length;

  const go = (id) => {
    setSection(id);
    if (mainRef.current) mainRef.current.scrollTo({ top: 0 });
  };
  const set = (k, v) => {
    setLoadedExample(null);
    setForm((f) => ({ ...f, [k]: v }));
  };
  const setBet = (id, k, v) => {
    setLoadedExample(null);
    setForm((f) => ({ ...f, assumptions: f.assumptions.map((x) => (x.id === id ? { ...x, [k]: v, ...(k === 'evidence' || k === 'category' ? { test: undefined } : {}) } : x)) }));
  };
  const addBet = (b) => {
    setLoadedExample(null);
    setForm((f) => ({ ...f, assumptions: [...f.assumptions, { id: uid(), category: 'problem', belief: '', impact: 'Hurts it', evidence: 'Nothing yet', source: 'you', ...b }] }));
  };
  const removeBet = (id) => {
    setLoadedExample(null);
    setForm((f) => ({ ...f, assumptions: f.assumptions.filter((x) => x.id !== id) }));
  };
  // D1: a suggestion joins the list at "Hurts it". How bad it would be if wrong is the user's call.
  const addSuggestion = (s) => addBet({ category: s.category, belief: s.belief, impact: 'Hurts it', evidence: s.evidence, quote: s.quote, source: 'model' });
  const addAll = () => sugg.kept.filter((s) => !s.added).forEach(addSuggestion);

  const loadExample = (ex) => {
    setForm(ex.form);
    setLoadedExample(ex.id);
    setModelText(ex.text);
    setModelNotes(ex.form.notes);
    setError('');
    go('board');
  };
  const startBlank = () => {
    setForm(BLANK);
    setLoadedExample(null);
    setModelText('');
    setModelNotes('');
    setError('');
    go('describe');
  };

  const read = async () => {
    setError('');
    if (form.notes.trim().length < 60) {
      setError('Write a few sentences about the idea first.');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey, model, name: form.name, pitch: form.pitch, segment: form.segment, notes: form.notes })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
      const p = parseReply(data.text);
      if (!p.summary && !p.assumptions.length) throw new Error('The model replied, but not in the expected format. Try again or switch provider.');
      setModelText(data.text);
      setModelNotes(form.notes);
      go('bets');
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
  const note = () => noteMarkdown(form, a, today, parsed);
  const download = () => {
    const blob = new Blob([note()], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const el = document.createElement('a');
    el.href = url;
    el.download = `${slug(form.name)}-riskiest-bets.md`;
    el.click();
    URL.revokeObjectURL(url);
  };

  const v = VERDICTS[a.verdict];
  const VIcon = VERDICT_ICONS[a.verdict];
  const top = a.all[0];
  const common = { form, a, go, loadedExample, stale };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Crosshair size={20} /></div>
          <div>
            <div className="brand-name">Riskiest Bet First</div>
            <div className="brand-sub">Test the idea before you build it</div>
          </div>
        </div>
        <nav className="nav">
          {SECTIONS.map((s) => (
            <button key={s.id} className={`nav-item ${section === s.id ? 'active' : ''}`} onClick={() => go(s.id)}>
              <s.icon size={18} className="nav-icon" />
              <span className="nav-text">
                <span className="nav-label">{s.label}{s.id === 'bets' && fresh > 0 && <span className="nav-badge">{fresh} new</span>}</span>
                <span className="nav-desc">{s.desc}</span>
              </span>
            </button>
          ))}
        </nav>
        <div className="side-plan">
          <div className="side-label">Current idea</div>
          <div className="side-name">{form.name || 'Untitled idea'}</div>
          <div className={`side-verdict v-${v.tone}`}><VIcon size={14} /> {v.label}</div>
          {top && <div className="side-meta"><Crosshair size={13} /> <span>Riskiest: {top.belief}</span></div>}
          <div className="side-meta"><Gauge size={13} /> {pl(a.leaps.length, 'leap')} of faith · rule {a.rule}</div>
        </div>
        <div className="side-foot">A daily AI build by Prerna Kakkar. Printed rules decide. A model only reads your notes.</div>
      </aside>

      <main className="main" ref={mainRef}>
        {section === 'describe' && (
          <DescribeSection
            {...common} set={set} startBlank={startBlank} provider={provider} setProvider={setProvider}
            apiKey={apiKey} setApiKey={setApiKey} model={model} setModel={setModel} busy={busy} error={error} read={read}
          />
        )}
        {section === 'bets' && (
          <BetsSection {...common} parsed={parsed} sugg={sugg} setBet={setBet} addBet={addBet} removeBet={removeBet} addSuggestion={addSuggestion} addAll={addAll} />
        )}
        {section === 'board' && <BoardSection {...common} />}
        {section === 'plan' && <PlanSection {...common} setBet={setBet} />}
        {section === 'note' && <NoteSection {...common} parsed={parsed} copyText={copyText} copied={copied} download={download} note={note} error={error} />}
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
    <section className={`card ${tone || ''}`}>
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
      {label && <span className="field-label">{label}</span>}
      {hint && <span className="field-hint">{hint}</span>}
      {area ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete="off" />
      )}
    </label>
  );
}

function AddOwn({ onAdd, placeholder, small }) {
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
    <button className={`chip dashed ${small ? 'sm' : ''}`} onClick={() => setAdding(true)}><Plus size={small ? 13 : 14} /> Add your own</button>
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

function CatChips({ value, onChange }) {
  return (
    <div className="chip-row">
      {CATEGORIES.map((c) => {
        const Icon = CAT_ICONS[c.id];
        return (
          <button key={c.id} title={c.ask} className={`chip sm ${value === c.id ? 'on' : ''}`} onClick={() => onChange(c.id)}><Icon size={13} />{c.label}</button>
        );
      })}
    </div>
  );
}

function BandPill({ band, score }) {
  const b = BANDS[band];
  const Icon = BAND_ICONS[band];
  return <span className={`pill t-${b.tone}`}><Icon size={13} /> {b.label}{score !== undefined ? ` · ${score}` : ''}</span>;
}

function CatTag({ id }) {
  const c = catById(id) || CATEGORIES[0];
  const Icon = CAT_ICONS[c.id];
  return <span className={`cat-tag ${c.core ? 'core' : ''}`}><Icon size={12} /> {c.label}</span>;
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

function Notices({ loadedExample, stale, go }) {
  return (
    <>
      {loadedExample && (
        <div className="notice">
          <Info size={16} />
          <span>Worked example with a saved second read. <button className="link" onClick={() => go('bets')}>Change any bet</button> and the rules run again at once.</span>
        </div>
      )}
      {stale && (
        <div className="notice warn">
          <TriangleAlert size={16} />
          <span>Your notes changed after the model read them. The verdict is current. <button className="link" onClick={() => go('describe')}>Read them again</button> to refresh the suggestions.</span>
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
        <div className="hero-score-n">{a.leaps.length}</div>
        <div className="hero-score-l">{a.leaps.length === 1 ? 'leap of faith' : 'leaps of faith'}</div>
      </div>
    </div>
  );
}

/* ---------- Describe it ---------- */

function DescribeSection(p) {
  const { form, set, a } = p;
  return (
    <div className="page">
      <PageHead
        icon={PenLine}
        eyebrow="Describe it"
        title="Find the bet that could sink your idea, and test it first."
        lede="Describe the idea and paste your notes. A model lists what the notes take for granted. Printed rules score every bet, put the riskiest first and pick the cheapest test for each."
      >
        <div className="steps">
          <Step n="1" icon={PenLine} text="Describe the idea and paste your notes" />
          <Step n="2" icon={Sparkles} text="A model lists the assumptions, quoting your notes" />
          <Step n="3" icon={Scale} text="Printed rules rank them and plan the tests" />
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
          <Card icon={Lightbulb} title="The idea" sub="What it is and who it is for">
            <div className="two">
              <TextField label="Name" value={form.name} onChange={(x) => set('name', x)} placeholder="Listing Lens" />
              <TextField label="In one line" value={form.pitch} onChange={(x) => set('pitch', x)} placeholder="Three photos in, a draft listing out" />
            </div>
            <div className="q-block">
              <span className="field-label">Who it is for</span>
              <span className="field-hint">This changes some tests. Large companies get buyer interviews instead of a fake door, for example.</span>
              <Chips options={SEGMENTS} value={form.segment} onChange={(x) => set('segment', x)} placeholder="Your segment" />
            </div>
            <div className="q-block">
              <span className="field-label">Time box for testing</span>
              <span className="field-hint">Tests that do not fit move to "after this time box".</span>
              <Chips options={TIMEBOXES} value={form.timebox} onChange={(x) => set('timebox', x)} placeholder="e.g. 3 weeks" />
            </div>
            <TextField
              label="Idea notes" area rows={8} value={form.notes} onChange={(x) => set('notes', x)}
              hint="Paste the pitch, a one-pager or a plain description: what it does, who wants it, how you will reach them, what you know and what you have not tried. The model quotes these words back."
              placeholder="What it does, who has the problem, what evidence you have, how people will find it, how it makes money, what you have not tested..."
            />
          </Card>
        </div>

        <div className="sticky-results">
          <div className={`panel live v-${VERDICTS[a.verdict].tone}`}>
            <div className="panel-title"><Scale size={16} /> Verdict, live</div>
            <div className="panel-sub">Printed rules, in your browser, no key.</div>
            <Verdict a={a} compact />
            <div className="live-meta">
              <span><OctagonX size={13} /> {pl(a.leaps.length, 'leap')}</span>
              <span><FlaskConical size={13} /> {a.soon.length} to test soon</span>
              <span><ListChecks size={13} /> {pl(a.list.length, 'bet')}</span>
            </div>
            <button className="link small" onClick={() => p.go('board')}>See the board <ArrowRight size={12} /></button>
          </div>
          <div className="panel">
            <div className="panel-title"><KeyRound size={16} /> Find the assumptions</div>
            <div className="panel-sub">A model reads your notes and suggests bets. It never scores or ranks them.</div>
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
              {p.busy ? <><Loader2 size={16} className="spin" /> Reading your notes</> : <><Wand2 size={16} /> Find my assumptions</>}
            </button>
            {p.error && <div className="error"><TriangleAlert size={16} /> {p.error}</div>}
          </div>
          <div className="panel">
            <div className="panel-title"><ListChecks size={16} /> What you get</div>
            <ul className="icon-list">
              <li><Crosshair size={16} /> Your bets ranked, riskiest first</li>
              <li><FlaskConical size={16} /> A verdict on whether to build yet</li>
              <li><Ruler size={16} /> The cheapest test per bet, with pass and kill lines</li>
              <li><CalendarRange size={16} /> A plan that fits your time box</li>
              <li><CircleHelp size={16} /> Interview questions about past behaviour</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Your bets ---------- */

function BetCard({ x, setBet, removeBet, open, toggle }) {
  const sc = x;
  return (
    <div className={`bet t-${BANDS[sc.band].tone}`}>
      <div className="bet-top">
        <span className="rank">{sc.rank}</span>
        <div className="bet-titles">
          <textarea className="bet-belief" rows={Math.max(1, Math.ceil((x.untitled ? '' : x.belief).length / 52))} value={x.untitled ? '' : x.belief} onChange={(e) => setBet(x.id, 'belief', e.target.value.replace(/\n/g, ' '))} placeholder="Something that must be true for the idea to work" />
          <div className="bet-meta">
            <CatTag id={x.category} />
            <span className={`src ${x.source === 'model' ? 'model' : ''}`}>{x.source === 'model' ? <><Sparkles size={11} /> From your notes</> : <><PenLine size={11} /> Yours</>}</span>
            {sc.typed && <span className="src warn"><Info size={11} /> Typed answer, rule A1</span>}
          </div>
        </div>
        <BandPill band={sc.band} score={sc.score} />
        <button className="icon-btn" onClick={toggle} aria-label={open ? 'Collapse' : 'Edit'}><ChevronDown size={16} className={open ? 'flip' : ''} /></button>
        <button className="icon-btn" onClick={() => removeBet(x.id)} aria-label="Remove"><Trash2 size={15} /></button>
      </div>
      {x.quote && <blockquote><Quote size={13} /> {x.quote}</blockquote>}
      <div className="bet-grid">
        <div className="q-block">
          <span className="field-label">If it is wrong</span>
          <Chips options={IMPACT} value={x.impact} onChange={(v) => setBet(x.id, 'impact', v)} small placeholder="Your words" />
        </div>
        <div className="q-block">
          <span className="field-label">Evidence so far</span>
          <Chips options={EVIDENCE} value={x.evidence} onChange={(v) => setBet(x.id, 'evidence', v)} small hints={EVIDENCE_HINT} placeholder="What you have" />
        </div>
      </div>
      {open && (
        <div className="q-block">
          <span className="field-label">Category</span>
          <CatChips value={x.category} onChange={(v) => setBet(x.id, 'category', v)} />
        </div>
      )}
    </div>
  );
}

function BetsSection({ form, a, go, loadedExample, stale, parsed, sugg, setBet, addBet, removeBet, addSuggestion, addAll }) {
  const [open, setOpen] = useState({});
  const real = a.all.filter((x) => !x.ghost);
  const fresh = sugg.kept.filter((s) => !s.added);
  const hasModel = !!(parsed.summary || parsed.assumptions.length);
  return (
    <div className="page">
      <PageHead icon={ListChecks} eyebrow="Your bets" title="What has to be true for this to work?" lede="Set how bad it would be if each bet were wrong, and what evidence you have. Scores and the ranking update as you go.">
        <Notices loadedExample={loadedExample} stale={stale} go={go} />
      </PageHead>

      <div className="cols wide-left">
        <div className="col">
          {a.ghosts.length > 0 && (
            <div className="ghosts">
              {a.ghosts.map((g) => {
                const c = catById(g.category);
                const Icon = CAT_ICONS[c.id];
                return (
                  <div key={g.id} className="ghost">
                    <Ghost size={16} />
                    <span><b>{c.label}:</b> nothing written down. Rule C1 counts it as a leap of faith.</span>
                    <button className="btn small" onClick={() => addBet({ category: c.id, impact: 'Kills the idea', evidence: 'Nothing yet' })}><Icon size={14} /> Write it down</button>
                  </div>
                );
              })}
            </div>
          )}
          {real.length === 0 && (
            <div className="empty"><ListChecks size={22} /><div>No bets yet. Add your own below, or <button className="link" onClick={() => go('describe')}>let a model read your notes</button>.</div></div>
          )}
          <div className="bets">
            {real.map((x) => (
              <BetCard key={x.id} x={x} setBet={setBet} removeBet={removeBet} open={!!open[x.id] || x.untitled} toggle={() => setOpen((o) => ({ ...o, [x.id]: !o[x.id] }))} />
            ))}
          </div>
          <div className="add-row">
            <span className="field-label">Add a bet</span>
            <div className="chip-row">
              {CATEGORIES.map((c) => {
                const Icon = CAT_ICONS[c.id];
                return <button key={c.id} className="chip sm" onClick={() => addBet({ category: c.id })}><Plus size={13} /><Icon size={13} /> {c.label}</button>;
              })}
            </div>
          </div>
          {a.thin && real.length > 0 && <div className="notice warn"><TriangleAlert size={16} /><span>Most ideas rest on six to ten bets. With {real.length}, the verdict may look safer than it is.</span></div>}
        </div>

        <div className="col">
          <Card icon={Sparkles} title="From your notes" sub="Each quote is checked against the notes before it shows here">
            {!hasModel ? (
              <div className="empty"><MessageSquareText size={22} /><div>No suggestions yet. <button className="link" onClick={() => go('describe')}>Paste your notes and run it</button>, or open an example.</div></div>
            ) : (
              <>
                {parsed.summary && <p className="summary"><Bot size={15} /> {parsed.summary}</p>}
                {fresh.length > 1 && <button className="btn small" onClick={addAll}><Plus size={14} /> Add all {fresh.length}</button>}
                {fresh.length === 0 && <div className="agree"><CircleCheck size={14} /> Every checked suggestion is in your list.</div>}
                {fresh.map((s, i) => (
                  <div key={i} className="signal">
                    <div className="signal-top"><CatTag id={s.category} /></div>
                    <div className="signal-belief">{s.belief}</div>
                    <blockquote><Quote size={13} /> {s.quote}</blockquote>
                    <div className="signal-why">{s.why}</div>
                    <div className="signal-ev"><Ruler size={13} /> Evidence: <b>{s.evidence}</b>{s.capped && <span className="capped"> · model said {s.suggested}, capped by rule E1 because the quote reports what people said, not what they did</span>}</div>
                    <button className="btn small" onClick={() => addSuggestion(s)}><Plus size={14} /> Add to my bets</button>
                  </div>
                ))}
                {sugg.kept.filter((s) => s.added && s.capped).map((s, i) => (
                  <div key={`c${i}`} className="dropped"><ShieldCheck size={14} /> In your list: “{s.quote}”. The model called it {s.suggested}. Rule E1 capped it at {s.evidence}.</div>
                ))}
                {sugg.dropped.length > 0 && (
                  <div className="dropped"><Info size={14} /> {pl(sugg.dropped.length, 'suggestion')} dropped by rule M1: {sugg.dropped.map((d) => `“${d.quote}” (${d.reason.toLowerCase()})`).join('; ')}.</div>
                )}
              </>
            )}
          </Card>
          <Card icon={Ruler} title="How to judge evidence">
            <ul className="icon-list">
              {EVIDENCE.map((e) => <li key={e}><Ruler size={16} /> <span><b>{e}.</b> {EVIDENCE_HINT[e]}.</span></li>)}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------- Bet board ---------- */

function BoardSection({ form, a, go, loadedExample, stale }) {
  const impacts = ['Kills the idea', 'Hurts it', 'Minor'];
  const evid = EVIDENCE;
  const at = (imp, ev) => a.all.filter((x) => (IMPACT.includes(x.impact) ? x.impact : 'Kills the idea') === imp && (EVIDENCE.includes(x.evidence) ? x.evidence : 'Opinions only') === ev);
  const pts = { 'Kills the idea': 3, 'Hurts it': 2, Minor: 1 };
  const unc = { 'Nothing yet': 4, 'Opinions only': 3, 'Some behaviour': 2, 'Strong behaviour': 1 };
  const bandOf = (s) => (s >= 9 ? 'leap' : s >= 6 ? 'soon' : 'watch');
  const topThree = a.all.slice(0, 3);
  return (
    <div className="page">
      <PageHead icon={LayoutGrid} eyebrow="Bet board" title={form.name || 'Untitled idea'} lede={form.pitch}>
        <Notices loadedExample={loadedExample} stale={stale} go={go} />
      </PageHead>

      <Verdict a={a} />

      <div className="kpis">
        <Kpi icon={OctagonX} label="Leaps of faith" value={a.leaps.length} sub="Could kill it, nothing behind them" tone={a.leaps.length ? 'bad' : ''} />
        <Kpi icon={FlaskConical} label="Test soon" value={a.soon.length} sub="Score 6 to 8" tone={a.soon.length ? 'warn' : ''} />
        <Kpi icon={Eye} label="Watch" value={a.watch.length} sub="Keep a metric on them" />
        <Kpi icon={CalendarRange} label="Plan" value={`${a.plan.runs.filter((r) => r.inBox).length}/${a.plan.runs.length}`} sub={`Tests that fit in ${form.timebox}`} />
      </div>

      <div className="cols">
        <div className="col">
          <Card icon={LayoutGrid} title="Where each bet sits" sub="Numbers are ranks. Top left is where ideas die">
            <div className="matrix">
              <div className="mx-corner" />
              {evid.map((e) => <div key={e} className="mx-col">{e}</div>)}
              {impacts.map((imp) => (
                <React.Fragment key={imp}>
                  <div className="mx-row">{imp}</div>
                  {evid.map((e) => {
                    const s = pts[imp] * unc[e];
                    const here = at(imp, e);
                    return (
                      <div key={e} className={`mx-cell b-${bandOf(s)}`}>
                        <span className="mx-score">{s}</span>
                        <div className="mx-dots">
                          {here.map((x) => <span key={x.id} className={`dot ${x.ghost ? 'ghost' : ''}`} title={x.belief}>{x.rank}</span>)}
                        </div>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
            <div className="mx-axis"><ArrowRight size={13} /> Less uncertain as you move right</div>
            <div className="legend">
              {Object.entries(BANDS).map(([k, b]) => <span key={k} className={`lg b-${k}`}><i /> {b.label}</span>)}
            </div>
          </Card>
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
        </div>
        <div className="col">
          <Card icon={ArrowDownWideNarrow} title="Riskiest first" sub="Rule R3: leaps first, then the problem, demand and reach before the rest">
            <div className="ranked">
              {a.all.map((x) => {
                const t = chosenTest(x, form.segment);
                return (
                  <div key={x.id} className={`ranked-row ${x.rank <= 3 ? 'top' : ''} ${x.ghost ? 'ghosted' : ''}`}>
                    <span className="rank">{x.rank}</span>
                    <div className="ranked-main">
                      <div className="ranked-belief">{x.belief}</div>
                      <div className="bet-meta"><CatTag id={x.category} /><span className="muted">{x.impact} · {x.evidence}</span></div>
                      {x.score >= 6 && t && <div className="ranked-test"><FlaskConical size={13} /> {t.name}</div>}
                    </div>
                    <BandPill band={x.band} score={x.score} />
                  </div>
                );
              })}
            </div>
            {topThree.length > 0 && <button className="link small" onClick={() => go('plan')}>See the tests <ArrowRight size={12} /></button>}
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------- Test plan ---------- */

function PlanSection({ form, a, go, loadedExample, stale, setBet }) {
  const { plan } = a;
  const width = Math.max(plan.box, plan.total) || 1;
  return (
    <div className="page">
      <PageHead
        icon={Route} eyebrow="Test plan"
        title={plan.runs.length ? 'Cheapest test first, with the kill line agreed up front' : 'Nothing needs a test right now'}
        lede={`Rule S1 runs the tests one after another in rank order inside your ${form.timebox} time box (${plan.box} working days). Write the pass and kill lines into the plan before each test starts, so nobody moves them afterwards.`}
      >
        <Notices loadedExample={loadedExample} stale={stale} go={go} />
      </PageHead>

      {plan.runs.length > 0 && (
        <div className="timeline card">
          <div className="tl-head"><CalendarRange size={16} /> {plan.used} of {plan.box} working days used{plan.later.length ? ` · ${pl(plan.later.length, 'test')} after this time box` : ''}</div>
          <div className="tl-track">
            <div className="tl-box" style={{ width: `${(plan.box / width) * 100}%` }}><span>Time box</span></div>
            {plan.runs.map((r, i) => (
              <div key={i} className={`tl-run ${r.inBox ? '' : 'out'}`} style={{ left: `${((r.start - 1) / width) * 100}%`, width: `${(r.test.days / width) * 100}%` }} title={r.test.name}>
                <span>{i + 1}</span>
              </div>
            ))}
          </div>
          <div className="tl-scale"><span>Day 1</span><span>Day {width}</span></div>
        </div>
      )}

      <div className="runs">
        {plan.runs.map((r, i) => {
          const c = catById(r.category);
          const Icon = CAT_ICONS[c.id];
          const opts = testOptions(r.category, form.segment);
          const bet = r.bets[0];
          const ruleDefault = testFor(bet.category, EVIDENCE.includes(bet.evidence) ? bet.evidence : 'Opinions only', form.segment);
          return (
            <section key={i} className={`run ${r.inBox ? '' : 'later'}`}>
              <div className="run-top">
                <span className="run-n">{i + 1}</span>
                <div className="run-titles">
                  <div className="run-name">{r.test.name}{r.test.swapped && <span className="swap-tag"><Repeat size={11} /> swapped, rule T2</span>}</div>
                  <div className="run-when"><Clock size={13} /> Days {r.start} to {r.end}{r.inBox ? '' : ' · after this time box'} · <Icon size={13} /> {c.label}</div>
                </div>
              </div>
              <div className="run-bets">
                {r.bets.map((b) => <div key={b.id} className="run-bet"><span className="rank sm">{b.rank}</span> {b.belief}</div>)}
              </div>
              <p className="run-how">{r.test.how}</p>
              <div className="run-facts">
                <div><Euro size={14} /><span>Cost</span><b>{r.test.cost}</b></div>
                <div><Ruler size={14} /><span>Measure</span><b>{r.test.measure}</b></div>
              </div>
              <div className="lines">
                <div className="line pass"><CircleCheck size={16} /><div><span>Pass</span><b>{r.test.pass}</b></div></div>
                <div className="line kill"><OctagonX size={16} /><div><span>Kill</span><b>{r.test.kill}</b></div></div>
              </div>
              {opts.length > 1 && !bet.ghost && (
                <div className="swap">
                  <span className="field-hint">Swap the test</span>
                  <div className="chip-row">
                    {opts.map((o) => {
                      const on = r.test.id === o.id;
                      return (
                        <button key={o.id} className={`chip sm ${on ? 'on' : ''}`} onClick={() => r.bets.forEach((b) => setBet(b.id, 'test', o.id === ruleDefault?.id ? undefined : o.id))}>
                          {on && <Check size={12} />}{o.name}{o.id === ruleDefault?.id && <span className="chip-note">rule pick</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {a.watch.length > 0 && (
        <Card icon={Eye} title="Watch, no test yet" sub="Rule T1: bets under 6 get a metric to keep an eye on, not a test">
          <ul className="icon-list">
            {a.watch.map((x) => <li key={x.id}><Eye size={16} /> <span>{x.belief} <span className="muted">· {x.impact.toLowerCase()} if wrong, {x.evidence.toLowerCase()}</span></span></li>)}
          </ul>
        </Card>
      )}
    </div>
  );
}

/* ---------- Decision note ---------- */

function NoteSection({ a, parsed, copyText, copied, download, note, error }) {
  const text = note();
  return (
    <div className="page">
      <PageHead icon={FileText} eyebrow="Decision note" title="Questions for users, and a note for the team" lede="The note carries the verdict, every bet ranked and the full test plan. Paste it into an email, Notion, Confluence or a ticket." />
      <div className="cols">
        <div className="col">
          <Card icon={CircleHelp} title="Ask about the past" sub="From the second read. About what people did, never what they would do">
            {parsed.questions.length ? (
              <ul className="q-list">
                {parsed.questions.map((q, i) => <li key={i}><CircleHelp size={15} /> {q}</li>)}
              </ul>
            ) : (
              <div className="empty"><CircleHelp size={20} /><div>Run the second read on Describe it to get interview questions drawn from your notes.</div></div>
            )}
          </Card>
          <Card icon={Users} title="Before each test" sub="Agree these with whoever signs off the build">
            <ul className="icon-list">
              <li><Ruler size={16} /> The pass and kill lines, in writing</li>
              <li><Users size={16} /> Who runs the test and who reads the result</li>
              <li><Flag size={16} /> What you will do on a kill: drop the idea, change it, or test again with a reason</li>
            </ul>
          </Card>
        </div>
        <div className="col">
          <Card
            icon={FileText} title="Riskiest bets note" sub="Markdown"
            right={<div className="btn-row"><button className="btn small" onClick={() => copyText(text, 'note')}>{copied === 'note' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}</button><button className="btn small" onClick={download}><Download size={14} /> Download</button></div>}
          >
            <pre className="report">{text}</pre>
            {error && <div className="error"><TriangleAlert size={16} /> {error}</div>}
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------- How it works ---------- */

const RULES_TABLE = [
  ['R1', 'Score = impact if wrong (Kills the idea 3, Hurts it 2, Minor 1) × uncertainty (Nothing yet 4, Opinions only 3, Some behaviour 2, Strong behaviour 1). The highest possible is 12'],
  ['R2', 'A score of 9 or more is a leap of faith: it could kill the idea and nothing or only opinions back it. 6 to 8 is test soon. Under 6 is watch'],
  ['R3', 'Rank: leaps first, then test soon, then watch. Inside each band the problem, demand and reach come before use, building and numbers, then the higher score'],
  ['C1', 'A core category (the problem, demand or reach) with nothing written down counts as a leap of faith'],
  ['V1', 'Any leap of faith about the problem, demand or reach: Test before you build'],
  ['V2', 'Leaps of faith only about use, building or numbers: Prototype first'],
  ['V3', 'No leaps, but bets scoring 6 to 8: Build a thin slice'],
  ['V4', 'Nothing scores 6 or more: Build it'],
  ['T1', 'Each bet scoring 6 or more gets a test from the printed library, chosen by its category, its evidence and who the idea is for. Bets under 6 get a metric to watch'],
  ['T2', 'You can swap a test for another in the same category. The pass and kill lines come with it'],
  ['S1', 'Tests run one after another in rank order. Those that end after the time box move to later'],
  ['S2', 'Two bets that need the same test share one run of it'],
  ['M1', 'A model suggestion shows only if its quote is in your notes and its category and evidence are listed options'],
  ['E1', 'If the model rates a quote as behaviour but the quote only reports what people said, liked or would do, the evidence is capped at Opinions only'],
  ['D1', 'A suggestion joins your list at Hurts it. How bad it would be if wrong is your call'],
  ['A1', 'A typed-in impact counts as Kills the idea and typed-in evidence as Opinions only. A typed-in segment uses the small business tests, and a typed-in time box counts five working days a week']
];

function HowSection() {
  return (
    <div className="page">
      <PageHead icon={Scale} eyebrow="How it works" title="Rules decide. A model reads." lede="Whether to build should come out the same way for the same evidence, so every score, the ranking, the verdict and every test come from printed rules. The model does the one thing rules cannot: read a page of notes and spot what they quietly take for granted." />
      <div className="cols">
        <div className="col">
          <Card icon={Scale} title="The rules">
            <div className="rule-table">
              {RULES_TABLE.map(([r, t]) => <div key={r} className="rule-row"><span className="trail-rule">{r}</span><span>{t}</span></div>)}
            </div>
          </Card>
        </div>
        <div className="col">
          <Card icon={LayoutGrid} title="Six kinds of bet" sub="The first three are core: rule C1 and V1 treat them first">
            <div className="cat-list">
              {CATEGORIES.map((c) => {
                const Icon = CAT_ICONS[c.id];
                return (
                  <div key={c.id} className="cat-row">
                    <span className={`cat-icon ${c.core ? 'core' : ''}`}><Icon size={16} /></span>
                    <div><b>{c.label}</b>{c.core && <span className="core-tag">core</span>}<div className="muted">{c.ask}</div></div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card icon={Lightbulb} title="Where it comes from">
            <ul className="icon-list">
              <li><Crosshair size={16} /> Nudge, a product we shut down at Ylytic after three months. The idea was fine for one tier of creators, and that tier was too expensive to reach</li>
              <li><Users size={16} /> The lesson I took from it: talk to 50 to 100 real users before writing a roadmap for a consumer product</li>
              <li><Shapes size={16} /> Common product discovery practice: value, usability, feasibility and viability risk, assumption mapping and asking about past behaviour rather than opinions</li>
            </ul>
          </Card>
          <Card icon={TriangleAlert} title="What it cannot do">
            <p className="panel-text">It ranks the bets you give it, so a bet nobody writes down stays invisible, apart from the three core categories rule C1 checks for. The pass and kill lines are starting points to agree as a team, not industry standards. It does not run the tests, and a passed test lowers the risk without removing it.</p>
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
      <PageHead icon={Layers} eyebrow="Examples" title="Three ideas, three verdicts" lede="Each loads with a saved second read, so it works without a key. Pipeline Doctor and Listing Lens are invented." />
      <div className="examples">
        {EXAMPLES.map((ex) => {
          const r = assess(ex.form);
          const v = VERDICTS[r.verdict];
          const VIcon = VERDICT_ICONS[r.verdict];
          return (
            <div key={ex.id} className={`example ${loadedExample === ex.id ? 'on' : ''}`}>
              <div className="example-sector">{ex.sector}</div>
              <div className="example-title">{ex.title}</div>
              <div className={`side-verdict v-${v.tone} inline`}><VIcon size={14} /> {v.label}</div>
              <p>{ex.blurb}</p>
              <div className="example-meta"><Crosshair size={13} /> Riskiest: {r.all[0]?.belief}</div>
              <button className="btn primary" onClick={() => loadExample(ex)}>{loadedExample === ex.id ? <><Check size={15} /> Loaded</> : <>Open it <ArrowRight size={15} /></>}</button>
            </div>
          );
        })}
      </div>
      <div className="notice"><PenLine size={16} /><span>Have your own idea? <button className="link" onClick={startBlank}>Start blank</button>.</span></div>
    </div>
  );
}
