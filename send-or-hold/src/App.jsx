import React, { useMemo, useRef, useState } from 'react';
import {
  Inbox, Route, MessageSquareText, NotebookPen, SlidersHorizontal, Scale, Layers, Send, Eye, Hand, Siren, Info, TriangleAlert,
  Loader2, Check, X, Plus, Copy, Download, ArrowRight, Wand2, Quote, Bot, KeyRound, ListChecks, ShieldCheck, House, CalendarDays,
  Clock, Languages, Sparkles, BookOpen, CircleCheck, Hash, Ban, Moon, Luggage, Lightbulb, MessageCircleQuestion, Flag, CircleHelp,
  BellRing, Phone, Megaphone, KeyRound as Key, MapPin, Wifi, PawPrint, Euro, CalendarRange, Wrench, MessagesSquare, Heart, Gauge,
  FileText, Ear, ChevronRight
} from 'lucide-react';
import {
  CHANNELS, STAGES, TIMES, LANGS, CALENDAR, AUTONOMY, PROMISES, LANES, ASKS, SIGNALS, SAFETY_WORDS, RULES_TABLE,
  parseReply, checkRead, assess, hostNote, scriptFor, askById, signalById, safetyHits
} from './rules.js';
import { EXAMPLES } from './examples.js';

const SECTIONS = [
  { id: 'inbox', icon: Inbox, label: 'Inbox', desc: 'Guest message and house facts' },
  { id: 'route', icon: Route, label: 'Routing', desc: 'Send, check, decide or act' },
  { id: 'reply', icon: MessageSquareText, label: 'Reply', desc: 'What the guest gets, checked' },
  { id: 'note', icon: NotebookPen, label: 'Host note', desc: 'What the host has to decide' },
  { id: 'rules', icon: SlidersHorizontal, label: 'Co-host rules', desc: 'What it may send alone' },
  { id: 'how', icon: Scale, label: 'How it works', desc: 'Every rule, printed' },
  { id: 'examples', icon: Layers, label: 'Examples', desc: 'Three guests, no key needed' }
];

const LANE_ICONS = [Send, Eye, Hand, Siren];
const ASK_ICONS = {
  access: Key, house: Wifi, local: MapPin, booking: CalendarDays, thanks: Heart, timing: Luggage, money: Euro,
  change: CalendarRange, guests: PawPrint, problem: Wrench, other: MessageCircleQuestion
};
const SIGNAL_ICONS = { safety: Siren, lockout: Key, upset: Megaphone, party: MessagesSquare, offplatform: Ban, person: Phone, legal: ShieldCheck };

const PROVIDERS = [
  { id: 'muse', label: 'Muse Glimmer', note: 'Free, on this site' },
  { id: 'anthropic', label: 'Anthropic', note: 'Your key' },
  { id: 'openai', label: 'OpenAI', note: 'Your key' },
  { id: 'gemini', label: 'Gemini', note: 'Your key' }
];

const pl = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const slug = (s) => (s || 'guest-message').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

const BLANK = {
  property: '', channel: 'Airbnb', stage: 'In the stay', time: 'Daytime', calendar: ['Free nights either side'],
  message: '', facts: '', autonomy: 'balanced', promises: PROMISES.map((p) => p.id), hostLangs: ['English', 'Spanish'], watchWords: []
};

export default function App() {
  const now = useMemo(() => new Date(), []);
  const [section, setSection] = useState('route');
  const [form, setForm] = useState({ ...BLANK, ...EXAMPLES[0].form });
  const [loadedExample, setLoadedExample] = useState(EXAMPLES[0].id);
  const [modelText, setModelText] = useState(EXAMPLES[0].text);
  const [readOf, setReadOf] = useState({ message: EXAMPLES[0].form.message, facts: EXAMPLES[0].form.facts });
  const [provider, setProvider] = useState('muse');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [picked, setPicked] = useState({});
  const mainRef = useRef(null);

  const parsed = useMemo(() => parseReply(modelText), [modelText]);
  const checked = useMemo(() => checkRead(parsed, form), [parsed, form]);
  const a = useMemo(() => assess(form, parsed, checked), [form, parsed, checked]);
  const stale = !!modelText && (readOf.message.trim() !== form.message.trim() || readOf.facts.trim() !== form.facts.trim());

  const go = (id) => {
    setSection(id);
    if (mainRef.current) mainRef.current.scrollTo({ top: 0 });
  };
  const edit = (fn) => {
    setLoadedExample(null);
    setForm(fn);
  };
  const set = (k, v) => edit((f) => ({ ...f, [k]: v }));

  const loadExample = (ex) => {
    setForm({ ...BLANK, ...ex.form });
    setLoadedExample(ex.id);
    setModelText(ex.text);
    setReadOf({ message: ex.form.message, facts: ex.form.facts });
    setPicked({});
    setError('');
    go('route');
  };
  const startBlank = () => {
    setForm({ ...BLANK, autonomy: form.autonomy, promises: form.promises, hostLangs: form.hostLangs, watchWords: form.watchWords });
    setLoadedExample(null);
    setModelText('');
    setReadOf({ message: '', facts: '' });
    setPicked({});
    setError('');
    go('inbox');
  };

  const read = async () => {
    setError('');
    if (form.message.trim().length < 10) {
      setError('Paste the guest message first.');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider, apiKey, model, property: form.property, channel: form.channel, stage: form.stage, time: form.time,
          facts: form.facts, message: form.message
        })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
      const p = parseReply(data.text);
      if (!p.asks.length && !p.reply.length) throw new Error('The model replied, but not in the expected format. Try again or switch provider.');
      setModelText(data.text);
      setReadOf({ message: form.message, facts: form.facts });
      setPicked({});
      go('route');
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
  const note = () => hostNote(form, a, parsed, now, picked);
  const download = () => {
    const blob = new Blob([note()], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const el = document.createElement('a');
    el.href = url;
    el.download = `${slug(form.property)}-host-note.md`;
    el.click();
    URL.revokeObjectURL(url);
  };

  const L = LANES[a.lane];
  const LIcon = LANE_ICONS[a.lane];
  const common = { form, a, parsed, go, loadedExample, stale };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><MessagesSquare size={20} /></div>
          <div>
            <div className="brand-name">Send or Hold?</div>
            <div className="brand-sub">Who answers the guest</div>
          </div>
        </div>
        <nav className="nav">
          {SECTIONS.map((s) => (
            <button key={s.id} className={`nav-item ${section === s.id ? 'active' : ''}`} onClick={() => go(s.id)}>
              <s.icon size={18} className="nav-icon" />
              <span className="nav-text">
                <span className="nav-label">{s.label}{s.id === 'note' && a.decisions.length > 0 && <span className="nav-badge">{a.decisions.length}</span>}</span>
                <span className="nav-desc">{s.desc}</span>
              </span>
            </button>
          ))}
        </nav>
        <div className="side-plan">
          <div className="side-label">This message</div>
          <div className="side-name">{form.property || 'Untitled property'}</div>
          <div className={`side-verdict v-${L.tone}`}><LIcon size={14} /> {L.label}</div>
          <div className="side-meta"><MessagesSquare size={13} /> {form.channel}, {form.stage.toLowerCase()}</div>
          <div className="side-meta"><Gauge size={13} /> {AUTONOMY.find((x) => x.id === form.autonomy)?.label} Co-host</div>
        </div>
        <div className="side-foot">A daily AI build by Prerna Kakkar</div>
      </aside>

      <main className="main" ref={mainRef}>
        {section === 'inbox' && (
          <InboxSection
            {...common} set={set} startBlank={startBlank}
            provider={provider} setProvider={setProvider} apiKey={apiKey} setApiKey={setApiKey} model={model} setModel={setModel}
            busy={busy} error={error} read={read}
          />
        )}
        {section === 'route' && <RouteSection {...common} checked={checked} />}
        {section === 'reply' && <ReplySection {...common} copyText={copyText} copied={copied} />}
        {section === 'note' && <NoteSection {...common} note={note} copyText={copyText} copied={copied} download={download} picked={picked} setPicked={setPicked} error={error} />}
        {section === 'rules' && <RulesSection form={form} set={set} a={a} />}
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

function Chips({ options, value, onChange, placeholder = 'Your answer', own = true, small, icons }) {
  const isCustom = value && !options.includes(value);
  return (
    <div className="chip-row">
      {options.map((o) => {
        const I = icons?.[o];
        return <button key={o} className={`chip ${small ? 'sm' : ''} ${value === o ? 'on' : ''}`} onClick={() => onChange(o)}>{value === o ? <Check size={13} /> : I ? <I size={13} /> : null}{o}</button>;
      })}
      {isCustom && <button className={`chip ${small ? 'sm' : ''} on custom`}><Check size={13} />{value}</button>}
      {own && <AddOwn onAdd={onChange} placeholder={placeholder} small={small} />}
    </div>
  );
}

function MultiChips({ options, value, onChange, placeholder, labels }) {
  const all = [...options, ...value.filter((x) => !options.includes(x))];
  const toggle = (o) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  return (
    <div className="chip-row">
      {all.map((o) => (
        <button key={o} className={`chip sm ${value.includes(o) ? 'on' : ''} ${options.includes(o) ? '' : 'custom'}`} onClick={() => toggle(o)}>{value.includes(o) && <Check size={12} />}{labels?.[o] || o}</button>
      ))}
      {placeholder && <AddOwn small onAdd={(x) => !value.includes(x) && onChange([...value, x])} placeholder={placeholder} />}
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

function Notices({ loadedExample, stale, go }) {
  return (
    <>
      {loadedExample && (
        <div className="notice">
          <Info size={16} />
          <span>Worked example. <button className="link" onClick={() => go('inbox')}>Edit it</button> or <button className="link" onClick={() => go('rules')}>change the Co-host rules</button></span>
        </div>
      )}
      {stale && (
        <div className="notice warn">
          <TriangleAlert size={16} />
          <span>The message or facts changed since the last read. <button className="link" onClick={() => go('inbox')}>Read again</button></span>
        </div>
      )}
    </>
  );
}

function LaneHero({ a }) {
  const L = LANES[a.lane];
  const Icon = LANE_ICONS[a.lane];
  const fired = a.trail.filter((t) => t.fired).length;
  return (
    <div className={`hero v-${L.tone}`}>
      <div className="hero-icon"><Icon size={30} /></div>
      <div className="hero-text">
        <div className="hero-label">{L.label}</div>
        <div className="hero-line">{L.line}</div>
      </div>
      <div className="hero-score">
        <div className="hero-score-n">{fired}</div>
        <div className="hero-score-l">{fired === 1 ? 'rule fired' : 'rules fired'}</div>
      </div>
    </div>
  );
}

function LaneTrack({ lane }) {
  return (
    <div className="lane-track">
      {LANES.map((l) => {
        const Icon = LANE_ICONS[l.id];
        return (
          <div key={l.id} className={`lane-tile t-${l.tone} ${lane === l.id ? 'on' : ''} ${l.id < lane ? 'past' : ''}`}>
            <Icon size={18} />
            <span>{l.label}</span>
            {lane === l.id && <b>This message</b>}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Inbox ---------- */

function InboxSection(p) {
  const { form, set, a } = p;
  const L = LANES[a.lane];
  const LIcon = LANE_ICONS[a.lane];
  const live = safetyHits(form.message);
  return (
    <div className="page">
      <PageHead
        icon={Inbox}
        eyebrow="Inbox"
        title="Can the Co-host answer this alone?"
        lede="Paste a guest message and your house facts. A model drafts the reply. Printed rules decide who sends it."
      >
        <div className="steps">
          <Step n="1" icon={Inbox} text="Paste the message" />
          <Step n="2" icon={Sparkles} text="Model reads and drafts" />
          <Step n="3" icon={Scale} text="Rules pick the lane" />
        </div>
        {p.loadedExample && (
          <div className="notice">
            <Info size={16} />
            <span>Worked example. <button className="link" onClick={p.startBlank}>Start blank</button> or <button className="link" onClick={() => p.go('examples')}>pick another</button></span>
          </div>
        )}
      </PageHead>

      <div className="build-grid">
        <div className="build-form">
          <Card icon={MessagesSquare} title="The guest message" sub="Exactly as it arrived">
            <div className="two">
              <TextField label="Property" value={form.property} onChange={(x) => set('property', x)} placeholder="Casa Azahar, Málaga" />
              <div className="q-block">
                <span className="field-label">When it arrived</span>
                <Chips options={TIMES} value={form.time} onChange={(x) => set('time', x)} own={false} small icons={{ 'Night, 23:00 to 08:00': Moon }} />
              </div>
            </div>
            <div className="q-block">
              <span className="field-label">Booked through</span>
              <Chips options={CHANNELS} value={form.channel} onChange={(x) => set('channel', x)} small placeholder="e.g. Expedia" />
            </div>
            <div className="q-block">
              <span className="field-label">Booking stage</span>
              <Chips options={STAGES} value={form.stage} onChange={(x) => set('stage', x)} small own={false} />
            </div>
            <TextField area rows={6} value={form.message} onChange={(x) => set('message', x)} placeholder="Hi! What time can we check in on Friday?" />
            {live.length > 0 && (
              <div className="notice bad"><Siren size={16} /><span>Safety phrase found: {live.map((w) => `"${w}"`).join(', ')}. This goes to Act now whatever the model says (rule S0).</span></div>
            )}
          </Card>

          <Card icon={CalendarDays} title="Calendar around the stay" sub="Matters for early and late requests">
            <MultiChips options={CALENDAR} value={form.calendar || []} onChange={(x) => set('calendar', x)} placeholder="Something else on the calendar" />
          </Card>

          <Card icon={BookOpen} title="House facts" sub="Everything the Co-host is allowed to say">
            <TextField
              area rows={8} value={form.facts} onChange={(x) => set('facts', x)}
              hint="Paste your house manual: check-in, wifi, parking, rules, appliances. The draft may only state what is here."
              placeholder={'Check-in from 16:00, check-out by 11:00.\nWifi: CasaAzahar_5G, password naranja2024.'}
            />
          </Card>
        </div>

        <div className="sticky-results">
          <div className={`panel live v-${L.tone}`}>
            <div className="panel-title"><Route size={16} /> Lane, live</div>
            <div className="panel-sub">Rules only. Updates as you type</div>
            <div className={`live-verdict v-${L.tone}`}><LIcon size={20} /> {L.label}</div>
            <button className="link small" onClick={() => p.go('route')}>See why <ArrowRight size={12} /></button>
          </div>
          <div className="panel">
            <div className="panel-title"><KeyRound size={16} /> Read and draft</div>
            <div className="panel-sub">Quotes the message, never picks the lane</div>
            <div className="chip-row">
              {PROVIDERS.map((x) => (
                <button key={x.id} className={`chip sm ${p.provider === x.id ? 'on' : ''}`} onClick={() => p.setProvider(x.id)}>
                  {x.label} <span className="chip-note">{x.note}</span>
                </button>
              ))}
            </div>
            {p.provider !== 'muse' ? (
              <div className="key-fields">
                <TextField label="Your API key" type="password" value={p.apiKey} onChange={p.setApiKey} placeholder="Never stored" />
                <TextField label="Model (optional)" value={p.model} onChange={p.setModel} placeholder="Default if blank" />
              </div>
            ) : (
              <div className="key-fields">
                <TextField label="Your NVIDIA key (optional)" type="password" value={p.apiKey} onChange={p.setApiKey} placeholder="Blank uses this site's key" />
              </div>
            )}
            <button className="btn primary wide" onClick={p.read} disabled={p.busy}>
              {p.busy ? <><Loader2 size={16} className="spin" /> Reading the message</> : <><Wand2 size={16} /> Read and route</>}
            </button>
            {p.error && <div className="error"><TriangleAlert size={16} /> {p.error}</div>}
          </div>
          <div className="panel">
            <div className="panel-title"><ListChecks size={16} /> What you get</div>
            <ul className="icon-list">
              <li><Route size={16} /> One of four lanes, with the rules behind it</li>
              <li><MessageSquareText size={16} /> A draft checked line by line</li>
              <li><NotebookPen size={16} /> A host note with choices</li>
              <li><Lightbulb size={16} /> What to add to your house facts</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Routing ---------- */

function AskRow({ x, promises }) {
  const k = askById(x.kind);
  const Icon = ASK_ICONS[x.kind] || MessageCircleQuestion;
  return (
    <div className="ask">
      <div className="ask-icon"><Icon size={16} /></div>
      <div className="ask-main">
        <div className="ask-what">{x.what}</div>
        <div className="bet-meta"><span className="cat-tag">{k.label}</span>{k.promise && promises.includes(k.promise) && <span className="src warn"><Hand size={11} /> Needs the host</span>}</div>
        <blockquote><Quote size={13} /> {x.quote}</blockquote>
      </div>
    </div>
  );
}

function RouteSection({ form, a, parsed, go, loadedExample, stale, checked }) {
  const fired = a.trail.filter((t) => t.fired);
  const quiet = a.trail.filter((t) => !t.fired);
  return (
    <div className="page">
      <PageHead icon={Route} eyebrow="Routing" title={form.property || 'Untitled property'} lede={parsed.summary || 'No read yet. The safety word list still runs on its own.'}>
        <Notices loadedExample={loadedExample} stale={stale} go={go} />
      </PageHead>

      <LaneHero a={a} />
      <LaneTrack lane={a.lane} />

      {a.notes.map((n) => (
        <div key={n.rule} className={`notice ${n.rule === 'N1' ? 'bad' : 'warn'}`}>
          {n.rule === 'N1' ? <Phone size={16} /> : n.rule === 'T1' ? <Luggage size={16} /> : <Moon size={16} />}
          <span><b>{n.rule}</b> {n.text}</span>
        </div>
      ))}
      {a.caughtByListOnly && (
        <div className="notice bad"><Siren size={16} /><span>The word list caught a safety phrase the model did not flag. This is why S0 runs on its own.</span></div>
      )}

      <div className="kpis">
        <Kpi icon={MessageCircleQuestion} label="Asks" value={a.asks.length} sub="Quoted from the message" />
        <Kpi icon={Flag} label="Signals" value={a.signals.length + (a.hits.length && !a.signals.some((s) => s.kind === 'safety' || s.kind === 'lockout') ? 1 : 0)} sub="Including the word list" tone={a.lane === 3 ? 'bad' : a.signals.length ? 'warn' : ''} />
        <Kpi icon={BookOpen} label="Facts used" value={a.facts.length} sub="Found in your house facts" />
        <Kpi icon={CircleHelp} label="Gaps" value={parsed.gaps.length} sub="Facts you could add" tone={parsed.gaps.length ? 'warn' : ''} />
      </div>

      <div className="cols wide-left">
        <div className="col">
          <Card icon={MessageCircleQuestion} title="What the guest wants" sub="Every quote checked against the message">
            {a.asks.length ? a.asks.map((x, i) => <AskRow key={i} x={x} promises={form.promises || []} />) : <div className="empty"><Bot size={20} /><div>No read yet. <button className="link" onClick={() => go('inbox')}>Run it</button></div></div>}
          </Card>
          {(a.signals.length > 0 || a.hits.length > 0) && (
            <Card icon={Flag} title="How it reads" sub="Signals from the model and the word list" tone={a.lane === 3 ? 'bad' : 'warn'}>
              {a.hits.length > 0 && (
                <div className="signal-row bad">
                  <Siren size={16} />
                  <div><b>Safety word list</b><div className="muted">Matched {a.hits.map((h) => `"${h}"`).join(', ')}</div></div>
                </div>
              )}
              {a.signals.map((s, i) => {
                const Icon = SIGNAL_ICONS[s.kind] || Flag;
                const sig = signalById(s.kind);
                return (
                  <div key={i} className={`signal-row ${sig.lane === 3 ? 'bad' : 'warn'}`}>
                    <Icon size={16} />
                    <div>
                      <b>{sig.label}</b>
                      <blockquote><Quote size={13} /> {s.quote}</blockquote>
                      <div className="signal-why">{s.why}</div>
                    </div>
                  </div>
                );
              })}
            </Card>
          )}
          {parsed.gaps.length > 0 && (
            <Card icon={Lightbulb} title="Add to your house facts" sub="So the next guest gets an answer alone">
              <ul className="q-list">{parsed.gaps.map((g, i) => <li key={i}><Plus size={15} /> {g}</li>)}</ul>
            </Card>
          )}
        </div>
        <div className="col">
          <Card icon={Scale} title="Rule trail" sub="The highest lane wins">
            <div className="trail">
              {fired.map((t, i) => (
                <div key={i} className={`trail-row fired l-${LANES[t.lane].tone}`}>
                  <span className="trail-rule">{t.rule}</span>
                  <span>{t.text} <span className="lane-mini">{LANES[t.lane].label}</span></span>
                </div>
              ))}
              {!fired.length && <div className="agree"><CircleCheck size={14} /> No rule held this message back.</div>}
            </div>
            <details className="quiet">
              <summary>{pl(quiet.length, 'rule')} passed</summary>
              <div className="trail">
                {quiet.map((t, i) => <div key={i} className="trail-row"><span className="trail-rule">{t.rule}</span><span>{t.text}</span></div>)}
              </div>
            </details>
          </Card>
          <Card icon={ShieldCheck} title="Quote check" sub="Rules Q1 to Q3">
            <div className="agree"><ShieldCheck size={14} /> {pl(a.asks.length + a.signals.length, 'quote')} found in the message, {pl(a.facts.length, 'fact')} found in your house facts</div>
            {checked.dropped.length > 0 ? (
              <div className="dropped"><Info size={14} /> Dropped: {checked.dropped.map((d) => `"${d.quote}" (${d.reason.toLowerCase()})`).join('; ')}.</div>
            ) : (
              <div className="muted">Nothing dropped.</div>
            )}
          </Card>
        </div>
      </div>
      <button className="btn primary center" onClick={() => go(a.lane >= 2 ? 'note' : 'reply')}>{a.lane >= 2 ? 'Open the host note' : 'See the reply'} <ArrowRight size={15} /></button>
    </div>
  );
}

/* ---------- Reply ---------- */

function markLine(line, a) {
  // Highlight stray numbers (D2) and offer words (D1) inside a draft line.
  const marks = [...a.strays.map((s) => ({ s, k: 'num' })), ...a.offers.map((o) => ({ s: o.word, k: 'offer' }))].filter((m) => m.s);
  if (!marks.length) return line;
  const re = new RegExp(`(${marks.map((m) => m.s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  return line.split(re).map((part, i) => {
    const m = marks.find((x) => x.s.toLowerCase() === part.toLowerCase());
    return m ? <mark key={i} className={`mk-${m.k}`}>{part}</mark> : <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

function ReplySection({ form, a, parsed, go, loadedExample, stale, copyText, copied }) {
  const L = LANES[a.lane];
  const LIcon = LANE_ICONS[a.lane];
  const draft = parsed.reply.join('\n');
  const hold = parsed.hold.join('\n');
  const script = a.lane === 3 ? scriptFor(a, parsed) : '';
  const out = a.lane === 3 ? script : a.lane === 2 ? hold : draft;
  const outTitle = a.lane === 3 ? 'Fixed safety message' : a.lane === 2 ? 'Holding reply' : 'The reply';
  const outSub = a.lane === 3 ? 'Printed in the app, never written by the model' : a.lane === 2 ? 'Goes now, while the host decides' : a.lane === 1 ? 'Goes after a person reads it' : 'Goes out alone';
  return (
    <div className="page">
      <PageHead icon={MessageSquareText} eyebrow="Reply" title="What the guest gets" lede="The lane decides which text goes out. Every line of the draft is checked.">
        <Notices loadedExample={loadedExample} stale={stale} go={go} />
      </PageHead>

      <div className={`send-card t-${L.tone}`}>
        <div className="send-head">
          <span className={`side-verdict v-${L.tone} inline`}><LIcon size={14} /> {L.label}</span>
          <div className="send-titles"><b>{outTitle}</b><span>{outSub}</span></div>
          {out && <button className="btn small" onClick={() => copyText(out, 'out')}>{copied === 'out' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}</button>}
        </div>
        {out ? <div className="bubble">{out}</div> : <div className="empty"><Bot size={20} /><div>No read yet. <button className="link" onClick={() => go('inbox')}>Run it</button></div></div>}
        {a.lane === 3 && <div className="notice bad"><Phone size={16} /><span>Then the host phones the guest. The model's draft below is shown for reference and is not sent.</span></div>}
      </div>

      <div className="cols wide-left">
        <div className="col">
          <Card icon={FileText} title="The model's draft, line by line" sub={a.lane >= 2 ? 'Not sent as it stands' : 'In the guest’s language'} right={draft && <button className="btn small" onClick={() => copyText(draft, 'draft')}>{copied === 'draft' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}</button>}>
            {parsed.reply.length ? (
              <ol className="draft-lines">
                {parsed.reply.map((line, i) => {
                  const bad = a.strays.some((s) => line.includes(s)) || a.offers.some((o) => line.toLowerCase().includes(o.word.toLowerCase()));
                  return (
                    <li key={i} className={bad ? 'flag' : ''}>
                      <span className="dl-n">{i + 1}</span>
                      <span className="dl-text">{markLine(line, a)}</span>
                      {bad ? <TriangleAlert size={15} className="dl-icon warn" /> : <Check size={15} className="dl-icon ok" />}
                    </li>
                  );
                })}
              </ol>
            ) : (
              <div className="empty"><Bot size={20} /><div>No draft yet.</div></div>
            )}
            {hold && a.lane < 2 && (
              <div className="hold-alt"><Clock size={14} /> <span><b>Holding reply, if needed:</b> {hold}</span></div>
            )}
          </Card>
        </div>
        <div className="col">
          <Card icon={ShieldCheck} title="Draft checks" sub="Rules D1 and D2">
            <div className={`check-line ${a.offers.length ? 'bad' : 'ok'}`}>
              {a.offers.length ? <Ban size={16} /> : <CircleCheck size={16} />}
              <div><b>Offers</b><span>{a.offers.length ? `Offers ${a.offers.map((o) => `"${o.word}"`).join(', ')}, which you have not allowed` : 'Promises nothing on your never-promise list'}</span></div>
            </div>
            <div className={`check-line ${a.strays.length ? 'warn' : 'ok'}`}>
              {a.strays.length ? <Hash size={16} /> : <CircleCheck size={16} />}
              <div><b>Numbers</b><span>{a.strays.length ? `${a.strays.join(', ')} not in your facts or the message` : 'Every time, code and number is in your facts or the message'}</span></div>
            </div>
            <div className="check-line ok">
              <BookOpen size={16} />
              <div><b>Facts used</b><span>{a.facts.length ? pl(a.facts.length, 'house fact') : 'None quoted'}</span></div>
            </div>
          </Card>
          <Card icon={Languages} title="Language" sub="The draft follows the guest">
            <div className="muted">{parsed.lang ? `Written in ${parsed.lang}. You read ${(form.hostLangs || []).join(', ') || 'no languages set'}.` : 'No read yet.'}</div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------- Host note ---------- */

function NoteSection({ form, a, parsed, go, loadedExample, stale, note, copyText, copied, download, picked, setPicked, error }) {
  const text = note();
  return (
    <div className="page">
      <PageHead icon={NotebookPen} eyebrow="Host note" title={a.decisions.length ? `${pl(a.decisions.length, 'decision')} for the host` : 'Nothing to decide'} lede="Everything the host needs in one place, so nobody asks the guest twice.">
        <Notices loadedExample={loadedExample} stale={stale} go={go} />
      </PageHead>

      {a.decisions.length > 0 ? (
        <div className="decisions">
          {a.decisions.map((d, i) => (
            <section key={d.key} className={`decision ${d.kind === 'Signal' ? 'sig' : ''}`}>
              <div className="run-top">
                <span className="run-n">{i + 1}</span>
                <div className="run-titles">
                  <div className="run-name">{d.title}</div>
                  <div className="run-when"><span className="cat-tag">{d.kind}</span></div>
                </div>
              </div>
              <blockquote><Quote size={13} /> {d.quote}</blockquote>
              <div className="chip-row">
                {d.options.map((o) => (
                  <button key={o} className={`chip sm ${picked[d.key] === o ? 'on' : ''}`} onClick={() => setPicked((pk) => ({ ...pk, [d.key]: pk[d.key] === o ? undefined : o }))}>{picked[d.key] === o ? <Check size={12} /> : <ChevronRight size={12} />}{o}</button>
                ))}
                <AddOwn small onAdd={(o) => setPicked((pk) => ({ ...pk, [d.key]: o }))} placeholder="Your call" label="Something else" />
              </div>
              {picked[d.key] && !d.options.includes(picked[d.key]) && <div className="muted">Your call: {picked[d.key]}</div>}
            </section>
          ))}
        </div>
      ) : (
        <div className="notice"><CircleCheck size={16} /><span>No decision needed. {a.lane === 0 ? 'The Co-host can send the reply alone.' : 'A quick read of the draft is enough.'}</span></div>
      )}
      {a.notes.map((n) => <div key={n.rule} className="notice warn"><BellRing size={16} /><span><b>{n.rule}</b> {n.text}</span></div>)}

      <Card
        icon={FileText} title="Host note" sub="Markdown, for WhatsApp, email or your team"
        right={<div className="btn-row"><button className="btn small" onClick={() => copyText(text, 'note')}>{copied === 'note' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}</button><button className="btn small" onClick={download}><Download size={14} /> Download</button></div>}
      >
        <pre className="report">{text}</pre>
        {error && <div className="error"><TriangleAlert size={16} /> {error}</div>}
      </Card>
    </div>
  );
}

/* ---------- Co-host rules ---------- */

function RulesSection({ form, set, a }) {
  const L = LANES[a.lane];
  const LIcon = LANE_ICONS[a.lane];
  const labels = Object.fromEntries(PROMISES.map((p) => [p.id, p.label]));
  return (
    <div className="page">
      <PageHead icon={SlidersHorizontal} eyebrow="Co-host rules" title="What may the Co-host send alone?" lede="Set it once. The lane on the current message updates as you change it.">
        <div className={`live-strip v-${L.tone}`}><LIcon size={16} /> Current message: <b>{L.label}</b></div>
      </PageHead>

      <Card icon={Gauge} title="How much it does alone" sub="Safety and host-only asks are held on every setting">
        <div className="autonomy">
          {AUTONOMY.map((x) => (
            <button key={x.id} className={`auto-tile ${form.autonomy === x.id ? 'on' : ''}`} onClick={() => set('autonomy', x.id)}>
              <span className="auto-top">{form.autonomy === x.id ? <CircleCheck size={18} /> : <Gauge size={18} />} {x.label}</span>
              <span className="auto-hint">{x.hint}</span>
            </button>
          ))}
        </div>
      </Card>

      <div className="cols">
        <Card icon={Hand} title="Never promise without me" sub="Asks like these go to Host decides">
          <MultiChips options={PROMISES.map((p) => p.id)} value={form.promises || []} onChange={(x) => set('promises', x)} labels={labels} />
          <div className="field-hint">Turn one off and the Co-host may answer it, as long as your house facts cover it.</div>
        </Card>
        <Card icon={Ear} title="Watch words in the draft" sub="Any of these in a draft means Host decides">
          <MultiChips options={[]} value={form.watchWords || []} onChange={(x) => set('watchWords', x)} placeholder="e.g. upgrade" />
          {!(form.watchWords || []).length && <div className="field-hint">None yet. Add words you never want sent unchecked, such as a neighbour's name or "deposit".</div>}
        </Card>
      </div>
      <Card icon={Languages} title="Languages you read" sub="Other languages go to Host checks, unless Hands-off">
        <MultiChips options={LANGS} value={form.hostLangs || []} onChange={(x) => set('hostLangs', x)} placeholder="e.g. Italian" />
      </Card>
    </div>
  );
}

/* ---------- How it works ---------- */

function HowSection() {
  return (
    <div className="page">
      <PageHead icon={Scale} eyebrow="How it works" title="A model drafts. Rules decide who sends." lede="The same message and settings get the same lane every time." />
      <div className="lane-grid">
        {LANES.map((l) => {
          const Icon = LANE_ICONS[l.id];
          return (
            <div key={l.id} className={`lane-card t-${l.tone}`}>
              <div className="lane-card-top"><Icon size={18} /> {l.label}</div>
              <p>{l.line}</p>
            </div>
          );
        })}
      </div>
      <div className="cols">
        <div className="col">
          <Card icon={Scale} title="The rules">
            <div className="rule-table">
              {RULES_TABLE.map(([r, t]) => <div key={r} className="rule-row"><span className="trail-rule">{r}</span><span>{t}</span></div>)}
            </div>
          </Card>
        </div>
        <div className="col">
          <Card icon={Siren} title="Safety word list" sub="Rule S0, English, Spanish, German and French">
            <div className="word-cloud">{SAFETY_WORDS.map((w) => <span key={w}>{w}</span>)}</div>
          </Card>
          <Card icon={ListChecks} title="What the model may label" sub="Anything else is dropped">
            <div className="kind-grid">
              {ASKS.map((k) => {
                const Icon = ASK_ICONS[k.id];
                return <div key={k.id} className="kind-cell"><Icon size={14} /><span>{k.label}</span></div>;
              })}
              {SIGNALS.map((k) => {
                const Icon = SIGNAL_ICONS[k.id];
                return <div key={k.id} className={`kind-cell sig l${k.lane}`}><Icon size={14} /><span>{k.label}</span></div>;
              })}
            </div>
          </Card>
          <Card icon={Info} title="Where the judgement comes from">
            <ul className="icon-list">
              <li><House size={16} /> The lanes and lists are mine, from hosting my own holiday rentals and from building AI agents with human handoff</li>
              <li><Phone size={16} /> 112 is the EU emergency number. Check what applies where your property is</li>
              <li><Layers size={16} /> Example properties, guests and places are invented</li>
            </ul>
          </Card>
          <Card icon={TriangleAlert} title="What it cannot do">
            <p className="panel-text">It reads one message, not the thread. The word list is narrow on purpose and can still over-fire: a smoke alarm with a flat battery goes to Act now. It never replaces your judgement, your platform's rules or a call to 112.</p>
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
      <PageHead icon={Layers} eyebrow="Examples" title="Three guests, three lanes" lede="Invented properties with saved reads. No key needed." />
      <div className="examples">
        {EXAMPLES.map((ex) => {
          const form = { ...BLANK, ...ex.form };
          const p = parseReply(ex.text);
          const r = assess(form, p, checkRead(p, form));
          const L = LANES[r.lane];
          const LIcon = LANE_ICONS[r.lane];
          return (
            <div key={ex.id} className={`example ${loadedExample === ex.id ? 'on' : ''}`}>
              <div className="example-sector">{ex.sector}</div>
              <div className="example-title">{ex.title}</div>
              <div className={`side-verdict v-${L.tone} inline`}><LIcon size={14} /> {L.label}</div>
              <p>{ex.blurb}</p>
              <div className="example-meta"><House size={13} /> {ex.form.property} · {ex.form.channel}</div>
              <button className="btn primary" onClick={() => loadExample(ex)}>{loadedExample === ex.id ? <><Check size={15} /> Loaded</> : <>Open it <ArrowRight size={15} /></>}</button>
            </div>
          );
        })}
      </div>
      <div className="notice"><Inbox size={16} /><span><button className="link" onClick={startBlank}>Start blank</button> with your own guest message</span></div>
    </div>
  );
}
