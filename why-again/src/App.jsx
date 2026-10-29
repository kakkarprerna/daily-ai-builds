import React, { useMemo, useRef, useState } from 'react';
import {
  Repeat2, Inbox, Gauge, Shapes, CircleDot, Send, Scale, BookOpen, Wrench, Workflow, LifeBuoy, Eye, Users, RotateCcw, Quote,
  Target, UserCheck, Ticket, Bot, ShieldCheck, Copy, Download, Check, X, Plus, Loader2, Sparkles, Info, TriangleAlert, OctagonX,
  CircleCheck, CircleDashed, ArrowRight, FileText, Percent, Activity, Euro, Building2, MessageSquare, CalendarRange, Hash,
  FileSpreadsheet, ListChecks, Filter, Circle, ScanSearch
} from 'lucide-react';
import {
  PRODUCT_TYPES, CHANNELS, WINDOWS, LANES, CONF, VERDICTS, QUESTIONS, RULES, analyse, handoffNote, toMarkdown, toCsv, parseModel
} from './rules.js';
import { EXAMPLES } from './examples.js';

const SECTIONS = [
  { id: 'tickets', icon: Inbox, label: 'Your tickets', desc: 'Paste tickets and a little context' },
  { id: 'verdict', icon: Gauge, label: 'Verdict', desc: 'How much is repeat work' },
  { id: 'patterns', icon: Shapes, label: 'Patterns', desc: 'Each cause, its lane and the fix' },
  { id: 'oneoffs', icon: CircleDot, label: 'One-offs', desc: 'Tickets that fit no pattern' },
  { id: 'handoff', icon: Send, label: 'Handoff', desc: 'A note for each owning team' },
  { id: 'how', icon: Scale, label: 'How it works', desc: 'Every rule, printed' },
  { id: 'examples', icon: BookOpen, label: 'Examples', desc: 'Three ticket sets, no key needed' }
];

const LANE_ICONS = { product: Wrench, process: Workflow, help: LifeBuoy, look: Eye };
const VERDICT_ICONS = { thin: CircleDashed, none: CircleDashed, high: OctagonX, mid: TriangleAlert, low: CircleCheck };
const PROVIDERS = [
  { id: 'muse', label: 'Muse Glimmer', note: 'Free, on this site' },
  { id: 'anthropic', label: 'Anthropic', note: 'Your key' },
  { id: 'openai', label: 'OpenAI', note: 'Your key' },
  { id: 'gemini', label: 'Gemini', note: 'Your key' }
];
const BLANK = { product: '', type: 'B2B SaaS', channel: 'Email', window: 'Last 30 days', monthly: '', cost: '', tickets: '' };
const slug = (s) => (s || 'support-tickets').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
const sig = (f) => f.tickets.trim();
const pct = (x) => `${Math.round(x * 100)}%`;
const fmt = (n) => n.toLocaleString('en-GB');

export default function App() {
  const now = useMemo(() => new Date(), []);
  const [section, setSection] = useState('verdict');
  const [form, setForm] = useState({ ...BLANK, ...EXAMPLES[0].form });
  const [loadedExample, setLoadedExample] = useState(EXAMPLES[0].id);
  const [modelText, setModelText] = useState(EXAMPLES[0].text);
  const [groupedOf, setGroupedOf] = useState(sig(EXAMPLES[0].form));
  const [provider, setProvider] = useState('muse');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const mainRef = useRef(null);

  const r = useMemo(() => analyse(form, modelText), [form, modelText]);
  const stale = !!modelText && groupedOf !== sig(form);

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
    setGroupedOf(sig(ex.form));
    setError('');
    go('verdict');
  };
  const startBlank = () => {
    setForm({ ...BLANK });
    setLoadedExample(null);
    setModelText('');
    setGroupedOf('');
    setError('');
    go('tickets');
  };

  const group = async () => {
    setError('');
    if (r.tickets.length < 2) return setError('Paste at least two tickets, one per line.');
    setBusy(true);
    try {
      const res = await fetch('/api/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey, model, ...form })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      if (!parseModel(data.text).list.length) throw new Error('The model replied, but found no groups in the expected format. Try again or switch provider.');
      setModelText(data.text);
      setGroupedOf(sig(form));
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

  const V = VERDICTS[r.verdict];
  const VIcon = VERDICT_ICONS[r.verdict];
  const common = { form, r, go, loadedExample, stale };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Repeat2 size={21} /></div>
          <div>
            <div className="brand-name">Why Again?</div>
            <div className="brand-sub">Repeat contact finder</div>
          </div>
        </div>
        <nav className="nav">
          {SECTIONS.map((s) => (
            <button key={s.id} className={`nav-item ${section === s.id ? 'active' : ''}`} onClick={() => go(s.id)}>
              <s.icon size={18} className="nav-icon" />
              <span className="nav-text">
                <span className="nav-label">
                  {s.label}
                  {s.id === 'patterns' && r.groups.length > 0 && <span className="nav-badge">{r.groups.length}</span>}
                  {s.id === 'oneoffs' && r.hasModel && r.oneOffs.length > 0 && <span className="nav-badge">{r.oneOffs.length}</span>}
                </span>
                <span className="nav-desc">{s.desc}</span>
              </span>
            </button>
          ))}
        </nav>
        <div className="side-plan">
          <div className="side-label">This set</div>
          <div className="side-name">{form.product || 'Untitled ticket set'}</div>
          <div className={`side-verdict v-${V.tone}`}><VIcon size={14} /> {V.label}</div>
          <div className="side-meta"><Ticket size={13} /> {r.tickets.length} tickets, {form.window.toLowerCase()}</div>
          <div className="side-meta"><RotateCcw size={13} /> {r.hasModel ? `${r.repeatContacts} came back about the same thing` : `${r.stats.returning} customers wrote more than once`}</div>
        </div>
        <div className="side-foot">A daily AI build by Prerna Kakkar</div>
      </aside>

      <main className="main" ref={mainRef}>
        {section === 'tickets' && (
          <TicketsSection {...common} set={set} provider={provider} setProvider={setProvider} apiKey={apiKey} setApiKey={setApiKey}
            model={model} setModel={setModel} busy={busy} error={error} group={group} />
        )}
        {section === 'verdict' && <VerdictSection {...common} />}
        {section === 'patterns' && <PatternsSection {...common} />}
        {section === 'oneoffs' && <OneOffsSection {...common} />}
        {section === 'handoff' && (
          <HandoffSection {...common} copied={copied} error={error} copyText={copyText}
            copyMd={() => copyText(toMarkdown(form, r, now), 'md')}
            downloadMd={() => download(toMarkdown(form, r, now), `${slug(form.product)}-why-again.md`, 'text/markdown')}
            downloadCsv={() => download(toCsv(r), `${slug(form.product)}-tickets-by-pattern.csv`, 'text/csv')} />
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

function TextField({ label, hint, value, onChange, placeholder, area, rows = 3, className = '', type = 'text' }) {
  return (
    <label className="field">
      {label && <span className="field-label">{label}</span>}
      {hint && <span className="field-hint">{hint}</span>}
      {area ? (
        <textarea className={className} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} spellCheck={false} />
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

function Chips({ label, options, value, onChange, placeholder }) {
  const isCustom = value && !options.includes(value);
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="chip-row">
        {options.map((o) => (
          <button key={o} className={`chip sm ${value === o ? 'on' : ''}`} onClick={() => onChange(o)}>{value === o && <Check size={12} />}{o}</button>
        ))}
        {isCustom && <button className="chip sm on custom"><Check size={12} />{value}</button>}
        <AddOwn onAdd={onChange} placeholder={placeholder} />
      </div>
    </div>
  );
}

function Pill({ tone, icon: Icon, children }) {
  return <span className={`pill t-${tone}`}>{Icon && <Icon size={12} />}{children}</span>;
}

function LaneChip({ lane }) {
  const Icon = LANE_ICONS[lane];
  return <span className={`lane-chip l-${lane}`}><Icon size={13} /> {LANES[lane].label}</span>;
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

function Bullets({ items, icon: Icon = ArrowRight, tone }) {
  return (
    <ul className={`bullets ${tone ? `t-${tone}` : ''}`}>
      {items.map((x, i) => <li key={i}><span className="b-ico"><Icon size={13} /></span><span>{x}</span></li>)}
    </ul>
  );
}

function Notices({ loadedExample, stale, go, r }) {
  return (
    <>
      {loadedExample && (
        <div className="notice"><Info size={16} /><span>Worked example with a saved model reply. Invented company and tickets. <button className="link" onClick={() => go('tickets')}>Paste your own</button></span></div>
      )}
      {stale && (
        <div className="notice warn"><TriangleAlert size={16} /><span>The tickets changed since they were grouped. Counts are live, the groups are not. <button className="link" onClick={() => go('tickets')}>Group again</button></span></div>
      )}
      {!r.hasModel && (
        <div className="notice"><CircleDashed size={16} /><span>Not grouped yet. <button className="link" onClick={() => go('tickets')}>Group your tickets</button></span></div>
      )}
    </>
  );
}

/* ---------- Your tickets ---------- */

function TicketsSection(p) {
  const { form, r, set } = p;
  const V = VERDICTS[r.verdict];
  const VIcon = VERDICT_ICONS[r.verdict];
  const noCustomer = r.tickets.length > 0 && r.stats.withCustomer < r.tickets.length;
  return (
    <div className="page">
      <PageHead icon={Inbox} eyebrow="Your tickets" title="Why do they keep writing in?"
        lede="Paste a batch of support tickets. See which causes keep coming back, who should fix each one, and how many contacts that would stop.">
        <div className="steps">
          <Step n={1} icon={Inbox} text="Paste tickets, one per line" />
          <Step n={2} icon={Bot} text="A model groups them by cause" />
          <Step n={3} icon={Scale} text="Rules check, count and route" />
        </div>
      </PageHead>

      <div className="build-grid">
        <div>
          <Card icon={Building2} title="Context" sub="Helps the model read the tickets. Volume and cost are optional and only feed the estimate.">
            <TextField label="Product" value={form.product} onChange={(v) => set('product', v)} placeholder="For example: invoicing app for freelancers" />
            <Chips label="Product type" options={PRODUCT_TYPES} value={form.type} onChange={(v) => set('type', v)} placeholder="Your type" />
            <div className="three">
              <Chips label="Channel" options={CHANNELS} value={form.channel} onChange={(v) => set('channel', v)} placeholder="Your channel" />
              <Chips label="Period" options={WINDOWS} value={form.window} onChange={(v) => set('window', v)} placeholder="Your period" />
            </div>
            <div className="three">
              <TextField label="Tickets per month (optional)" type="number" value={form.monthly} onChange={(v) => set('monthly', v)} placeholder="For example 400" />
              <TextField label="Cost per contact in € (optional)" type="number" value={form.cost} onChange={(v) => set('cost', v)} placeholder="For example 8" />
            </div>
          </Card>

          <Card icon={Ticket} title="Tickets" sub="One per line: ID | customer | date | message. A spreadsheet paste with tabs works too. Remove names, emails and phone numbers first.">
            <TextField area rows={12} className="tickets-input" value={form.tickets} onChange={(v) => set('tickets', v)}
              placeholder={'T-101 | Acme Ltd | 2026-10-02 | Export to PDF fails on invoices over 50 lines\nT-102 | Brightside | 2026-10-03 | How do I add a second VAT number?'} />
            <div className="readback">
              <span className="rb"><Hash size={13} /> {r.tickets.length} tickets read</span>
              <span className="rb"><Users size={13} /> {r.stats.customers} customers</span>
              <span className="rb"><RotateCcw size={13} /> {r.stats.returning} wrote more than once</span>
              {noCustomer && <span className="rb warn"><TriangleAlert size={13} /> {r.tickets.length - r.stats.withCustomer} without a customer, so repeats there can't be counted</span>}
              {r.tickets.length > 0 && r.tickets.length < 8 && <span className="rb warn"><TriangleAlert size={13} /> Under 8 tickets, no verdict</span>}
            </div>
          </Card>

          <Card icon={Sparkles} title="Group by cause" sub="The free model runs on this site. Or use your own key, which is sent for this one request and never stored.">
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
            <button className="btn primary big" onClick={p.group} disabled={p.busy}>
              {p.busy ? <><Loader2 size={17} className="spin" /> Grouping</> : <><Sparkles size={17} /> Find the repeats</>}
            </button>
            {p.error && <div className="error"><TriangleAlert size={15} /> {p.error}</div>}
          </Card>
        </div>

        <aside className="build-side">
          <div className={`live v-${V.tone}`}>
            <div className="live-label"><Activity size={14} /> This set</div>
            <div className="live-verdict"><VIcon size={20} /> {V.label}</div>
            <div className="live-grid">
              <div><b>{r.tickets.length}</b><span>tickets</span></div>
              <div><b>{r.groups.length}</b><span>patterns</span></div>
              <div><b>{r.hasModel ? pct(r.share) : '·'}</b><span>fixable</span></div>
              <div><b>{r.hasModel ? r.repeatContacts : '·'}</b><span>came back</span></div>
            </div>
            <div className="live-note">{r.hasModel && !p.stale ? 'From the latest grouping.' : 'Counts only until you group.'}</div>
            <button className="btn ghost" onClick={() => p.go('verdict')}>See the verdict <ArrowRight size={15} /></button>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ---------- Verdict ---------- */

function VerdictSection(p) {
  const { r, go } = p;
  const V = VERDICTS[r.verdict];
  const VIcon = VERDICT_ICONS[r.verdict];
  const total = r.tickets.length || 1;
  const oneOffCount = r.oneOffs.length + r.byLane.look;
  return (
    <div className="page">
      <PageHead icon={Gauge} eyebrow="Verdict" title="How much of this is repeat work?" />
      <Notices {...p} />

      <div className={`hero v-${V.tone}`} style={{ marginTop: 16 }}>
        <div className="hero-icon"><VIcon size={30} /></div>
        <div>
          <div className="hero-label">{V.label}</div>
          <div className="hero-line">
            {r.hasModel && r.verdict !== 'thin'
              ? <>{pct(r.share)} of these tickets come from {r.groups.filter((g) => g.lane !== 'look').length} causes you can fix once. {r.repeatContacts} were customers writing again about the same thing.</>
              : V.line}
          </div>
        </div>
      </div>

      <div className="kpis">
        <Kpi icon={Ticket} label="Tickets read" value={r.tickets.length} sub={`${r.stats.customers} customers`} />
        <Kpi icon={Shapes} label="Patterns" value={r.groups.length} sub="2 or more tickets each" tone="mid" />
        <Kpi icon={Percent} label="Fixable share" value={r.hasModel ? pct(r.share) : '·'} sub={`${r.fixable} tickets`} tone={r.hasModel ? V.tone === 'na' ? null : V.tone : null} />
        <Kpi icon={RotateCcw} label="Came back about the same thing" value={r.hasModel ? r.repeatContacts : '·'} sub="Contacts that should not exist" tone="mid" />
        <Kpi icon={CircleDot} label="One-offs" value={r.hasModel ? oneOffCount : '·'} sub="No shared cause found" />
      </div>

      {r.summary && (
        <div className="summary"><Bot size={18} /><div><span>Model's summary</span>{r.summary}</div></div>
      )}

      {r.hasModel && (
        <Card icon={Filter} title="Where the tickets go" sub="Each ticket in its fix lane. One-offs are the hatched part.">
          <div className="lane-bar">
            {['product', 'process', 'help', 'look'].map((k) => r.byLane[k] > 0 && <div key={k} className={`l-${k}`} style={{ width: `${(r.byLane[k] / total) * 100}%` }} title={`${LANES[k].label}: ${r.byLane[k]}`} />)}
            {r.oneOffs.length > 0 && <div className="l-oneoff" style={{ width: `${(r.oneOffs.length / total) * 100}%` }} title={`One-offs: ${r.oneOffs.length}`} />}
          </div>
          <div className="lane-key">
            {['product', 'process', 'help', 'look'].map((k) => r.byLane[k] > 0 && <span key={k}><i className={`l-${k}`} /> {LANES[k].label} {r.byLane[k]}</span>)}
            {r.oneOffs.length > 0 && <span><i className="l-oneoff" /> One-offs {r.oneOffs.length}</span>}
          </div>
        </Card>
      )}

      {r.estimate && (
        <Card icon={Euro} title="What fixing these could stop" sub={`From ${r.tickets.length} tickets and your monthly volume of ${fmt(Number(p.form.monthly))}. The low end assumes fixes only half work.`}>
          <div className="est">
            <div><b>{fmt(r.estimate.low)} to {fmt(r.estimate.high)}</b><span>contacts a month</span></div>
            <div><b>{r.estimate.costHigh ? `€${fmt(r.estimate.costLow)} to €${fmt(r.estimate.costHigh)}` : 'Add a cost'}</b><span>{r.estimate.costHigh ? 'support cost a month' : 'per contact to see money'}</span></div>
          </div>
          {r.tickets.length < 30 && <div className="field-hint"><Info size={13} /> A sample of {r.tickets.length} is small. Treat this as a direction, and rerun on a larger export before quoting it.</div>}
        </Card>
      )}

      {r.groups.length > 0 && (
        <Card icon={ListChecks} title="Fix first" sub="Ranked by tickets, with customers who came back counted double." right={<button className="link small" onClick={() => go('patterns')}>All patterns <ArrowRight size={13} /></button>}>
          <div className="trail">
            {r.groups.slice(0, 3).map((g) => (
              <div key={g.name} className="trail-row">
                <span className="q-num">{g.rank}</span>
                <span className="trail-title">{g.name}</span>
                <LaneChip lane={g.lane} />
                <Pill tone={CONF[g.conf].tone}>{CONF[g.conf].label}</Pill>
              </div>
            ))}
          </div>
        </Card>
      )}

      {r.checks.length > 0 && (
        <Card icon={ShieldCheck} title="What the checks caught" sub="The model's reply, corrected against your tickets." tone="warn">
          <Bullets items={r.checks.map((c) => <><span className="rule-tag s1">{c.rule}</span>{c.text}</>)} icon={ShieldCheck} tone="warn" />
        </Card>
      )}
    </div>
  );
}

/* ---------- Patterns ---------- */

function PatternsSection(p) {
  const { r } = p;
  return (
    <div className="page">
      <PageHead icon={Shapes} eyebrow="Patterns" title="Each cause, ranked" lede="Darker ticket IDs are customers who wrote more than once about this cause." />
      <Notices {...p} />
      <div style={{ marginTop: 16 }}>
        {r.groups.length === 0 && <div className="empty card-pad"><CircleDashed size={16} /> No patterns yet.</div>}
        {r.groups.map((g) => <GroupCard key={g.name} g={g} />)}
      </div>
    </div>
  );
}

function GroupCard({ g }) {
  const perCust = new Map();
  g.tickets.forEach((t) => t.cust && perCust.set(t.cust, (perCust.get(t.cust) || 0) + 1));
  const pointLabels = ['4 or more tickets', '3 or more customers', 'Someone came back about it', 'Quote found in the tickets'];
  return (
    <section className="gcard">
      <div className="gcard-head">
        <div className="g-rank">{g.rank}</div>
        <div className="g-title">{g.name}<div className="g-sub">Lane set by rule {g.laneRule}</div></div>
        <LaneChip lane={g.lane} />
        <Pill tone={CONF[g.conf].tone}>{CONF[g.conf].label} confidence</Pill>
      </div>
      <div className="g-body">
        <div>
          <div className="g-stats">
            <div className="g-stat"><b>{g.tickets.length}</b><span>tickets</span></div>
            <div className="g-stat"><b>{g.customers}</b><span>customers</span></div>
            <div className="g-stat"><b>{g.cameBack}</b><span>came back</span></div>
          </div>
          {g.quote
            ? <div className="quote"><Quote size={16} /><div>{g.quote}<small>{g.quoteFrom}, checked against the ticket</small></div></div>
            : <div className="quote missing"><TriangleAlert size={16} /><div>No quote could be checked against these tickets.</div></div>}
          <div className="signals">
            {QUESTIONS.map((q) => {
              const on = g.ans?.[q.key];
              return <div key={q.key} className={`sig ${on ? 'on' : ''}`} title={q.text}>{on ? <CircleCheck size={14} /> : <Circle size={14} />}{q.name}</div>;
            })}
          </div>
          <div className="pts">
            {g.points.map((on, i) => <div key={i} className={`pt ${on ? 'on' : ''}`}>{on ? <Check size={13} /> : <X size={13} />} {pointLabels[i]}</div>)}
          </div>
        </div>
        <div>
          <KV icon={Wrench} k="Change that would stop it" v={g.fix || 'Not given'} />
          <KV icon={UserCheck} k="Owner" v={g.owner} />
          <KV icon={Target} k="Proof it worked" v={g.proof || 'Not given'} />
          <KV icon={Ticket} k="Tickets" v={
            <div className="tix">{g.tickets.map((t) => <span key={t.id} className={`tix-id ${perCust.get(t.cust) > 1 ? 'back' : ''}`} title={`${t.customer || 'No customer'}: ${t.text}`}>{t.id}</span>)}</div>
          } />
        </div>
      </div>
    </section>
  );
}

function KV({ icon: Icon, k, v }) {
  return (
    <div className="kv">
      <span className="kv-ico"><Icon size={14} /></span>
      <div><div className="kv-k">{k}</div><div className="kv-v">{v}</div></div>
    </div>
  );
}

/* ---------- One-offs ---------- */

function OneOffsSection(p) {
  const { r } = p;
  const look = r.groups.filter((g) => g.lane === 'look');
  return (
    <div className="page">
      <PageHead icon={CircleDot} eyebrow="One-offs" title="Tickets that fit no pattern" lede="Worth a read. A one-off today can be the first ticket of next month's pattern." />
      <Notices {...p} />
      <div style={{ marginTop: 16 }}>
        {r.hasModel && r.oneOffs.length === 0 && look.length === 0 && <div className="empty card-pad"><CircleCheck size={16} /> Every ticket landed in a pattern.</div>}
        {r.hasModel && r.oneOffs.map((t) => (
          <div key={t.id} className="oneoff">
            <span className="tix-id">{t.id}</span>
            <div><b>{t.customer || 'No customer'}</b>{t.date ? ` · ${t.date}` : ''}<br />{t.text}</div>
          </div>
        ))}
        {look.length > 0 && (
          <Card icon={Eye} title="Patterns that need a look" sub="None of the four signals fired, so no lane was set (rule L6).">
            <Bullets items={look.map((g) => `${g.name}: ${g.tickets.map((t) => t.id).join(', ')}`)} icon={Eye} />
          </Card>
        )}
      </div>
    </div>
  );
}

/* ---------- Handoff ---------- */

function HandoffSection(p) {
  const { r, form } = p;
  return (
    <div className="page">
      <PageHead icon={Send} eyebrow="Handoff" title="A note for each owner" lede="Written by rules from the counts and the checked quote, so every figure in a note matches the pattern card." />
      <Notices {...p} />
      <div className="actions" style={{ marginBottom: 18 }}>
        <button className="btn primary" onClick={p.copyMd} disabled={!r.hasModel}>{p.copied === 'md' ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy the report</>}</button>
        <button className="btn" onClick={p.downloadMd} disabled={!r.hasModel}><FileText size={15} /> Report as Markdown</button>
        <button className="btn" onClick={p.downloadCsv} disabled={!r.tickets.length}><FileSpreadsheet size={15} /> Tickets by pattern, CSV</button>
      </div>
      {p.error && <div className="error"><TriangleAlert size={15} /> {p.error}</div>}
      {r.groups.filter((g) => g.lane !== 'look').map((g) => {
        const note = handoffNote(form, g);
        return (
          <Card key={g.name} icon={LANE_ICONS[g.lane]} title={`${g.rank}. ${g.name}`} sub={`To ${g.owner} · ${LANES[g.lane].label}`}
            right={<button className="btn" onClick={() => p.copyText(note, g.name)}>{p.copied === g.name ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy</>}</button>}>
            <pre className="note-box">{note}</pre>
          </Card>
        );
      })}
    </div>
  );
}

/* ---------- How it works ---------- */

function HowSection() {
  const groups = [...new Set(RULES.map((x) => x.group))];
  const icons = { 'Reading tickets': Ticket, 'Checking the model': ShieldCheck, 'Choosing the lane': Filter, 'Confidence and order': ListChecks, 'Verdict and estimate': Gauge };
  return (
    <div className="page">
      <PageHead icon={Scale} eyebrow="How it works" title="The model reads. Rules decide." lede="Spotting that two tickets share a cause needs reading. Counting, routing and ranking should give the same answer every time." />
      <div className="tiles">
        <div className="tile"><Bot size={20} /><b>Model</b><span>Groups tickets by cause, quotes one phrase and answers four yes or no questions.</span></div>
        <div className="tile"><ShieldCheck size={20} /><b>Checks</b><span>Unknown IDs, double placements and quotes not in the tickets are caught.</span></div>
        <div className="tile"><Scale size={20} /><b>Rules</b><span>Lane, confidence, rank, verdict and estimate. No model involved.</span></div>
      </div>
      <Card icon={MessageSquare} title="The four questions the model answers" sub="Its only judgement call per group. The lane follows from the answers.">
        <div className="rules">
          {QUESTIONS.map((q) => <div key={q.key} className="rule-row"><span className="rule-tag-lg">{q.key.toUpperCase()}</span><span className="rule-text"><b>{q.name}.</b> {q.text}</span></div>)}
        </div>
      </Card>
      <Card icon={Filter} title="The four lanes">
        <div className="rules">
          {Object.values(LANES).map((l) => <div key={l.id} className="rule-row"><LaneChip lane={l.id} /><span className="rule-text">{l.desc}</span></div>)}
        </div>
      </Card>
      {groups.map((gname) => (
        <Card key={gname} icon={icons[gname] || Scale} title={gname}>
          <div className="rules">
            {RULES.filter((x) => x.group === gname).map((x) => (
              <div key={x.id} className="rule-row"><span className="rule-tag-lg">{x.id}</span><span className="rule-text">{x.text}</span></div>
            ))}
          </div>
        </Card>
      ))}
      <Card icon={Info} title="Where this comes from, and its limits">
        <Bullets icon={Info} items={[
          'The lanes come from a simple question support leads ask of any repeat contact: is it the product, our process, or something people could have read? Nothing here is an industry benchmark.',
          'A customer only counts as coming back if the same name appears on two tickets in the paste. Tickets from a longer period find more repeats.',
          'The monthly estimate assumes your paste looks like a typical month. The low end allows for fixes that only partly work.',
          'Tickets go to the model you pick for one request and are not stored. Remove names, emails and phone numbers before pasting.'
        ]} />
      </Card>
    </div>
  );
}

/* ---------- Examples ---------- */

function ExamplesSection({ loadExample, loadedExample, startBlank }) {
  return (
    <div className="page">
      <PageHead icon={BookOpen} eyebrow="Examples" title="Three invented ticket sets" lede="Each has a saved model reply, so it opens without a key. The rules run live. The second one has two mistakes for the checks to catch." />
      <div className="ex-grid">
        {EXAMPLES.map((ex) => {
          const r = analyse(ex.form, ex.text);
          const V = VERDICTS[r.verdict];
          const VIcon = VERDICT_ICONS[r.verdict];
          return (
            <section key={ex.id} className={`ex ${loadedExample === ex.id ? 'on' : ''}`}>
              <div className="ex-top"><span className="ex-tag">{ex.tag}</span><span className="ex-tool">{ex.form.channel}</span></div>
              <h2>{ex.title}</h2>
              <p>{ex.blurb}</p>
              <div className={`side-verdict inline v-${V.tone}`}><VIcon size={14} /> {V.label}</div>
              <div className="ex-meta"><span><Ticket size={13} /> {r.tickets.length} tickets</span><span><Shapes size={13} /> {r.groups.length} patterns</span><span><CalendarRange size={13} /> {ex.form.window.replace('Last ', '')}</span></div>
              <button className="btn primary" onClick={() => loadExample(ex)}>{loadedExample === ex.id ? <><Check size={15} /> Loaded</> : <>Open <ArrowRight size={15} /></>}</button>
            </section>
          );
        })}
      </div>
      <button className="btn ghost dark" onClick={startBlank}><ScanSearch size={15} /> Start with your own tickets</button>
    </div>
  );
}
