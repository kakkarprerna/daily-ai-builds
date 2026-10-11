import React, { useMemo, useRef, useState } from 'react';
import {
  Layers3, PenLine, Scale, ListChecks, CalendarClock, MessageSquareText, BookOpen, Layers, Info, TriangleAlert,
  KeyRound, Loader2, Check, X, Plus, Copy, Download, ArrowRight, Ban, OctagonAlert, ShieldCheck, ShieldAlert,
  Eye, CircleCheck, CircleHelp, Sparkles, Handshake, Wand2, Globe2, Building2, Factory, Users, MessagesSquare,
  Cpu, Gauge, Hourglass, Lightbulb, Repeat2, Briefcase, Target, Flag, FileText, Search, BadgeCheck, CircleDot, Gavel
} from 'lucide-react';
import {
  ROLES, EU_LINKS, EXCLUSIONS, MARKET, PRACTICES, PRODUCTS, THIRD_PARTY, AREAS, AREA_NAMES, OTHER_USE, AREA_REF,
  PROFILING, EXEMPTIONS, TRANSPARENCY, GPAI, SYSTEMIC, DATES, TIERS, RULES, sortSystem, parseReply, checkSignals,
  applySignal, dutyStatus, dayDiff, fmtDate, reportMarkdown
} from './rules.js';
import { EXAMPLES } from './examples.js';

const SECTIONS = [
  { id: 'describe', icon: PenLine, label: 'Describe it', desc: 'The feature, in plain words, and a few answers' },
  { id: 'tier', icon: Layers3, label: 'Tier', desc: 'Where it sits, and the rules that put it there' },
  { id: 'duties', icon: ListChecks, label: 'Duties', desc: 'What you owe, by role, with dates' },
  { id: 'timeline', icon: CalendarClock, label: 'Timeline', desc: 'Which dates have passed and which are next' },
  { id: 'questions', icon: MessageSquareText, label: 'Questions', desc: 'What to settle with legal, and the report' },
  { id: 'how', icon: Scale, label: 'How it works', desc: 'The printed rules and their sources' },
  { id: 'examples', icon: Layers, label: 'Examples', desc: 'Three worked cases, no key needed' }
];

const TIER_ICONS = { out: Globe2, prohibited: Ban, high3: OctagonAlert, high1: Factory, sector: Factory, exempt: ShieldAlert, transparency: Eye, minimal: ShieldCheck };
const LADDER = ['prohibited', 'high3', 'exempt', 'transparency', 'minimal'];
const LADDER_LABEL = { prohibited: 'Prohibited', high3: 'High-risk', exempt: 'Exemption claimed', transparency: 'Transparency', minimal: 'Minimal' };
const LADDER_OF = { high1: 'high3', sector: 'high3', out: null };

const PROVIDERS = [
  { id: 'muse', label: 'Muse Glimmer', note: 'Free, on this site' },
  { id: 'anthropic', label: 'Anthropic', note: 'Your key' },
  { id: 'openai', label: 'OpenAI', note: 'Your key' },
  { id: 'gemini', label: 'Gemini', note: 'Your key' }
];

const BLANK = {
  name: '', description: '', role: 'Not sure', eu: 'Offered or sold in the EU', market: 'Not launched yet', exclusion: 'None',
  practices: [], product: 'None', thirdParty: 'Not sure', area: 'None of these', use: '', profiling: 'Not sure',
  exemption: 'None of these', transparency: [], gpai: 'Not sure', systemic: 'Not sure'
};

const slug = (s) => (s || 'ai-feature').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

export default function App() {
  const today = useMemo(() => new Date(), []);
  const [section, setSection] = useState('tier');
  const [form, setForm] = useState(EXAMPLES[0].form);
  const [loadedExample, setLoadedExample] = useState(EXAMPLES[0].id);
  const [modelText, setModelText] = useState(EXAMPLES[0].text);
  const [modelDesc, setModelDesc] = useState(EXAMPLES[0].form.description);
  const [provider, setProvider] = useState('muse');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const mainRef = useRef(null);

  const result = useMemo(() => sortSystem(form), [form]);
  const parsed = useMemo(() => parseReply(modelText), [modelText]);
  const signals = useMemo(() => checkSignals(parsed, form), [parsed, form]);
  const stale = !!modelText && modelDesc.trim() !== form.description.trim();

  const go = (id) => {
    setSection(id);
    if (mainRef.current) mainRef.current.scrollTo({ top: 0 });
  };
  const set = (k, v) => {
    setLoadedExample(null);
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === 'area') next.use = '';
      return next;
    });
  };
  const apply = (s) => {
    setLoadedExample(null);
    setForm((f) => applySignal(f, s));
  };
  const loadExample = (ex) => {
    setForm(ex.form);
    setLoadedExample(ex.id);
    setModelText(ex.text);
    setModelDesc(ex.form.description);
    setError('');
    go('tier');
  };
  const startBlank = () => {
    setForm(BLANK);
    setLoadedExample(null);
    setModelText('');
    setModelDesc('');
    setError('');
    go('describe');
  };

  const read = async () => {
    setError('');
    if (form.description.trim().length < 40) {
      setError('Describe the feature in at least a couple of sentences first.');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey, model, description: form.description, answers: form })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
      const p = parseReply(data.text);
      if (!p.summary && !p.signals.length) throw new Error('The model replied, but not in the expected format. Try again or switch provider.');
      setModelText(data.text);
      setModelDesc(form.description);
      go('tier');
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
  const report = () => reportMarkdown(form, result, today, parsed);
  const download = () => {
    const blob = new Blob([report()], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug(form.name)}-which-tier.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const t = TIERS[result.tier];
  const TIcon = TIER_ICONS[result.tier];
  const toCheck = signals.kept.filter((s) => !s.agrees).length;
  const common = { form, result, today, go, loadedExample, stale };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Layers3 size={20} /></div>
          <div>
            <div className="brand-name">Which Tier?</div>
            <div className="brand-sub">Sort an AI feature under the EU AI Act</div>
          </div>
        </div>
        <nav className="nav">
          {SECTIONS.map((s) => (
            <button key={s.id} className={`nav-item ${section === s.id ? 'active' : ''}`} onClick={() => go(s.id)}>
              <s.icon size={18} className="nav-icon" />
              <span className="nav-text">
                <span className="nav-label">{s.label}{s.id === 'tier' && toCheck > 0 && <span className="nav-badge">{toCheck}</span>}</span>
                <span className="nav-desc">{s.desc}</span>
              </span>
            </button>
          ))}
        </nav>
        <div className="side-plan">
          <div className="side-label">Current feature</div>
          <div className="side-name">{form.name || 'Untitled feature'}</div>
          <div className={`side-verdict t-${t.tone}`}><TIcon size={14} /> {t.short}</div>
          <div className="side-meta"><Gauge size={13} /> {result.confidence} · rule {result.rule}</div>
        </div>
        <div className="side-foot">A daily AI build by Prerna Kakkar. A first sort, not legal advice.</div>
      </aside>

      <main className="main" ref={mainRef}>
        {section === 'describe' && (
          <DescribeSection
            {...common} set={set} startBlank={startBlank} provider={provider} setProvider={setProvider}
            apiKey={apiKey} setApiKey={setApiKey} model={model} setModel={setModel} busy={busy} error={error} read={read}
          />
        )}
        {section === 'tier' && <TierSection {...common} signals={signals} parsed={parsed} apply={apply} />}
        {section === 'duties' && <DutiesSection {...common} />}
        {section === 'timeline' && <TimelineSection {...common} />}
        {section === 'questions' && <QuestionsSection {...common} parsed={parsed} copyText={copyText} copied={copied} download={download} report={report} error={error} />}
        {section === 'how' && <HowSection />}
        {section === 'examples' && <ExamplesSection loadExample={loadExample} loadedExample={loadedExample} startBlank={startBlank} today={today} />}
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
    <button className="chip dashed" onClick={() => setAdding(true)}><Plus size={14} /> Add your own</button>
  );
}

function Chips({ options, value, onChange, placeholder = 'Your answer', wrap }) {
  const isCustom = value && !options.includes(value);
  return (
    <div className={`chip-row ${wrap ? 'stack' : ''}`}>
      {options.map((o) => (
        <button key={o} className={`chip ${value === o ? 'on' : ''}`} onClick={() => onChange(o)}>{value === o && <Check size={13} />}{o}</button>
      ))}
      {isCustom && <button className="chip on custom"><Check size={13} />{value}</button>}
      <AddOwn onAdd={onChange} placeholder={placeholder} />
    </div>
  );
}

function MultiChips({ options, value = [], onChange, placeholder = 'Your own' }) {
  const toggle = (o) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  const customs = value.filter((v) => !options.includes(v));
  return (
    <div className="chip-row stack">
      {options.map((o) => (
        <button key={o} className={`chip multi ${value.includes(o) ? 'on' : ''}`} onClick={() => toggle(o)}>
          <span className="box">{value.includes(o) && <Check size={12} />}</span>{o}
        </button>
      ))}
      {customs.map((c) => (
        <button key={c} className="chip multi on custom" onClick={() => toggle(c)}><span className="box"><Check size={12} /></span>{c}</button>
      ))}
      <AddOwn onAdd={(v) => !value.includes(v) && onChange([...value, v])} placeholder={placeholder} />
    </div>
  );
}

function Q({ n, label, hint, children }) {
  return (
    <div className="q-block">
      <div className="q-head"><span className="q-num">{n}</span><span className="field-label">{label}</span></div>
      {hint && <div className="field-hint">{hint}</div>}
      {children}
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

function Notices({ loadedExample, stale, go }) {
  return (
    <>
      {loadedExample && (
        <div className="notice">
          <Info size={16} />
          <span>Worked example with a saved second read. <button className="link" onClick={() => go('describe')}>Change any answer</button> and the rules run again at once.</span>
        </div>
      )}
      {stale && (
        <div className="notice warn">
          <TriangleAlert size={16} />
          <span>The description changed after the model read it. The tier is current. <button className="link" onClick={() => go('describe')}>Read it again</button> to refresh the second read.</span>
        </div>
      )}
    </>
  );
}

function nextDate(result, today) {
  const future = result.allFrom.filter((d) => dayDiff(d, today) > 0).sort();
  return future[0] || null;
}

/* ---------- Describe it ---------- */

function DescribeSection(p) {
  const { form, set, result } = p;
  const t = TIERS[result.tier];
  const TIcon = TIER_ICONS[result.tier];
  const uses = AREAS[form.area];
  const inArea = uses && form.area !== 'None of these';
  return (
    <div className="page">
      <PageHead
        icon={PenLine}
        eyebrow="Describe it"
        title="Find out which AI Act tier your feature is in before you plan the roadmap around it."
        lede="Describe the feature and answer a few questions. Printed rules sort it, list what you owe with dates, and a model reads your description to catch answers that do not fit."
      >
        <div className="steps">
          <Step n="1" icon={PenLine} text="Describe the feature and tick what applies" />
          <Step n="2" icon={Scale} text="Printed rules set the tier as you answer" />
          <Step n="3" icon={Sparkles} text="A model checks your answers against your words" />
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
          <Card icon={FileText} title="The feature" sub="Say what it does, who it affects and what decisions it touches">
            <TextField label="Name" value={form.name} onChange={(v) => set('name', v)} placeholder="Shortlist Assist" />
            <TextField
              label="What it does, in plain words" area rows={6} value={form.description} onChange={(v) => set('description', v)}
              hint="The model quotes these words back, so be concrete: what goes in, what comes out, who sees it, what happens next."
              placeholder="It reads every application for a job, ranks candidates and lets recruiters hide anyone below a score..."
            />
          </Card>

          <Card icon={Users} title="You and the market" sub="Who you are in the chain and where it is used">
            <Q n="1" label="Your role" hint="Putting your name or brand on a system makes you its provider, even if a vendor built it.">
              <Chips options={ROLES} value={form.role} onChange={(v) => set('role', v)} />
            </Q>
            <Q n="2" label="Link to the EU">
              <Chips options={EU_LINKS} value={form.eu} onChange={(v) => set('eu', v)} />
            </Q>
            <Q n="3" label="When it reached the market">
              <Chips options={MARKET} value={form.market} onChange={(v) => set('market', v)} />
            </Q>
            <Q n="4" label="Any of these exclusions?">
              <Chips options={EXCLUSIONS} value={form.exclusion} onChange={(v) => set('exclusion', v)} />
            </Q>
          </Card>

          <Card icon={Ban} title="Banned practices" sub="Article 5. Tick anything the feature does, even in part">
            <MultiChips options={PRACTICES.map((x) => x.label)} value={form.practices} onChange={(v) => set('practices', v)} placeholder="Describe the practice" />
          </Card>

          <Card icon={Factory} title="Regulated products" sub="Annex I. Is the AI part of a product with its own EU safety law?">
            <Chips options={PRODUCTS} value={form.product} onChange={(v) => set('product', v)} />
            {PRODUCTS.slice(1, 8).includes(form.product) && (
              <Q n="" label="Does that product need a notified body to check it?">
                <Chips options={THIRD_PARTY} value={form.thirdParty} onChange={(v) => set('thirdParty', v)} />
              </Q>
            )}
          </Card>

          <Card icon={Target} title="High-risk uses" sub="Annex III. Pick the area, then the closest use">
            <Chips options={AREA_NAMES} value={form.area} onChange={(v) => set('area', v)} placeholder="Your area" />
            {inArea && (
              <>
                <Q n="" label={`The use in ${form.area.toLowerCase()} (${AREA_REF[form.area]})`}>
                  <Chips options={[...uses, OTHER_USE]} value={form.use} onChange={(v) => set('use', v)} wrap placeholder="Describe the use" />
                </Q>
                <Q n="" label="Does it profile people?" hint="Automated evaluation or prediction of things like performance, reliability, behaviour, interests or fit.">
                  <Chips options={PROFILING} value={form.profiling} onChange={(v) => set('profiling', v)} />
                </Q>
                <Q n="" label="Does it only do one of these? (Article 6(3))" hint="If yes, and it does not profile people, it may fall outside high-risk.">
                  <Chips options={EXEMPTIONS} value={form.exemption} onChange={(v) => set('exemption', v)} wrap />
                </Q>
              </>
            )}
          </Card>

          <Card icon={MessagesSquare} title="Transparency situations" sub="Article 50. Tick each that applies">
            <MultiChips options={TRANSPARENCY.map((x) => x.label)} value={form.transparency} onChange={(v) => set('transparency', v)} placeholder="Another situation" />
          </Card>

          <Card icon={Cpu} title="General-purpose models" sub="Articles 51 to 55">
            <Chips options={GPAI} value={form.gpai} onChange={(v) => set('gpai', v)} />
            {form.gpai === GPAI[2] && (
              <Q n="" label="Training compute above 10^25 FLOPs?">
                <Chips options={SYSTEMIC} value={form.systemic} onChange={(v) => set('systemic', v)} />
              </Q>
            )}
          </Card>
        </div>

        <div className="sticky-results">
          <div className={`panel live t-${t.tone}`}>
            <div className="panel-title"><Scale size={16} /> Tier, live</div>
            <div className="panel-sub">Printed rules, in your browser, no key.</div>
            <div className={`live-tier t-${t.tone}`}><TIcon size={20} /> {t.label}</div>
            <div className="live-meta">
              <span><Gauge size={13} /> {p.result.confidence}</span>
              <span><Flag size={13} /> Rule {p.result.rule}</span>
              <span><CircleHelp size={13} /> {p.result.open.length} open</span>
            </div>
            <button className="link small" onClick={() => p.go('tier')}>See why <ArrowRight size={12} /></button>
          </div>
          <div className="panel">
            <div className="panel-title"><KeyRound size={16} /> Second read</div>
            <div className="panel-sub">A model checks your answers against your description. It never sets the tier.</div>
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
              {p.busy ? <><Loader2 size={16} className="spin" /> Reading your description</> : <><Wand2 size={16} /> Check my answers</>}
            </button>
            {p.error && <div className="error"><TriangleAlert size={16} /> {p.error}</div>}
          </div>
          <div className="panel">
            <div className="panel-title"><ListChecks size={16} /> What you get</div>
            <ul className="icon-list">
              <li><Layers3 size={16} /> The tier, and each rule that led there</li>
              <li><ListChecks size={16} /> Duties for your role, each with its article</li>
              <li><Hourglass size={16} /> Which duties apply now and which start later</li>
              <li><Repeat2 size={16} /> What would move it up or down a tier</li>
              <li><MessageSquareText size={16} /> Questions for legal, and a report to share</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Tier ---------- */

function Ladder({ tier }) {
  const at = LADDER_OF[tier] !== undefined ? LADDER_OF[tier] : tier;
  return (
    <div className="ladder">
      {LADDER.map((k) => (
        <div key={k} className={`rung r-${k} ${at === k ? 'on' : ''}`}>
          <span className="rung-dot" />{LADDER_LABEL[k]}
        </div>
      ))}
    </div>
  );
}

function TierSection({ form, result, today, go, loadedExample, stale, signals, parsed, apply }) {
  const t = TIERS[result.tier];
  const TIcon = TIER_ICONS[result.tier];
  const nd = nextDate(result, today);
  const dutyCount = result.groups.reduce((n, g) => n + g.duties.filter((d) => !d.id.startsWith('fine')).length, 0);
  const checks = signals.kept.filter((s) => !s.agrees);
  const agrees = signals.kept.filter((s) => s.agrees);
  const hasModel = !!(parsed.summary || parsed.signals.length);
  return (
    <div className="page">
      <PageHead icon={Layers3} eyebrow="Tier" title={form.name || 'Your AI feature'}>
        <Notices loadedExample={loadedExample} stale={stale} go={go} />
      </PageHead>

      <section className={`verdict t-${t.tone}`}>
        <div className="verdict-icon"><TIcon size={26} /></div>
        <div className="verdict-body">
          <div className="verdict-eyebrow">Tier <span className="rule-id light">{result.rule}</span> <span className="rule-id light">{result.confidence}</span></div>
          <div className="verdict-label">{t.label}</div>
          <div className="verdict-line">{t.line}</div>
        </div>
        <div className="verdict-actions">
          <button className="btn light" onClick={() => go('duties')}><ListChecks size={16} /> See the duties</button>
          <button className="btn light-ghost" onClick={() => go('questions')}><MessageSquareText size={16} /> Questions</button>
        </div>
      </section>

      <Ladder tier={result.tier} />

      <div className="kpis">
        <Kpi icon={Gauge} label="Confidence" value={result.confidence} sub={result.unsure ? `${result.unsure} deciding answer${result.unsure === 1 ? '' : 's'} unsure` : 'every deciding answer given'} accent />
        <Kpi icon={Hourglass} label="Next date" value={nd ? `${dayDiff(nd, today)} days` : 'None ahead'} sub={nd ? fmtDate(nd) : 'everything that applies is in force'} />
        <Kpi icon={ListChecks} label="Duties" value={dutyCount} sub="for your role, fines not counted" />
        <Kpi icon={Sparkles} label="Second read" value={hasModel ? `${checks.length} to check` : 'Not run'} sub={hasModel ? `${agrees.length} agree with you` : 'run it from Describe it'} />
      </div>

      <div className="tier-grid">
        <div>
          <div className="section-title"><Scale size={18} /> How the rules got here</div>
          <div className="trail">
            {result.steps.map((s, i) => (
              <div key={i} className={`trail-step ${s.hit ? 'hit' : ''}`}>
                <span className="trail-dot">{s.hit ? <CircleDot size={14} /> : <Check size={12} />}</span>
                <span className="rule-id">{s.id}</span>
                <p>{s.text}</p>
              </div>
            ))}
          </div>

          {result.flips.length > 0 && (
            <Card icon={Repeat2} title="What would change the tier" sub="Design choices that move it up or down">
              <div className="flip-list">
                {result.flips.map((f, i) => <div key={i} className="flip"><ArrowRight size={15} /> <span>{f}</span></div>)}
              </div>
            </Card>
          )}
          {result.notes.length > 0 && (
            <Card icon={Lightbulb} title="Worth knowing" sub="Details from the text that affect this result">
              <div className="flip-list">
                {result.notes.map((f, i) => <div key={i} className="flip"><Info size={15} /> <span>{f}</span></div>)}
              </div>
            </Card>
          )}
        </div>

        <div className="sticky-side">
          <div className="panel">
            <div className="panel-title"><Sparkles size={16} /> Second read</div>
            {hasModel ? (
              <>
                {parsed.summary && <p className="summary">{parsed.summary}</p>}
                {checks.length === 0 && <div className="no-act"><CircleCheck size={14} /> The model found nothing in your description that contradicts your answers.</div>}
                {checks.map((s, i) => (
                  <div key={i} className="signal check">
                    <div className="signal-top"><TriangleAlert size={14} /> Check your {s.topic.toLowerCase()} answer</div>
                    <div className="signal-q">“{s.quote}”</div>
                    <p>{s.why}</p>
                    <div className="signal-swap">
                      <span className="was">{s.multi ? 'Not ticked' : (s.current || 'No answer')}</span>
                      <ArrowRight size={13} />
                      <span className="sugg">{s.value}</span>
                    </div>
                    <button className="btn primary sm" onClick={() => apply(s)}><Check size={14} /> Apply and sort again</button>
                  </div>
                ))}
                {agrees.length > 0 && (
                  <div className="agree-list">
                    <div className="mini-label"><Handshake size={13} /> Agrees with your answers</div>
                    {agrees.map((s, i) => <div key={i} className="agree"><Check size={13} /> <span><b>{s.topic}:</b> “{s.quote}”</span></div>)}
                  </div>
                )}
                {signals.dropped.length > 0 && (
                  <div className="agree-list">
                    <div className="mini-label"><Ban size={13} /> Not counted (M1)</div>
                    {signals.dropped.map((s, i) => <div key={i} className="agree muted"><X size={13} /> <span>{s.topic}: {s.reason.toLowerCase()}</span></div>)}
                  </div>
                )}
              </>
            ) : (
              <div className="no-act"><Info size={14} /> Not run yet. The tier above comes from your answers alone. <button className="link" onClick={() => go('describe')}>Run the second read</button></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Duties ---------- */

function DutiesSection({ form, result, today, go, loadedExample, stale }) {
  const [filter, setFilter] = useState('All');
  const t = TIERS[result.tier];
  const groups = result.groups.map((g) => ({
    ...g,
    duties: g.duties.filter((d) => {
      const st = dutyStatus(d.from, today).state;
      return filter === 'All' || (filter === 'In force now' ? st === 'now' : st === 'soon');
    })
  })).filter((g) => g.duties.length);
  return (
    <div className="page">
      <PageHead icon={ListChecks} eyebrow={`Duties · ${t.label}`} title="What you owe, and from when." lede={`For ${form.role.split(':')[0].toLowerCase() === 'not sure' ? 'every role, since yours is not set' : form.role.split(':')[0].toLowerCase()}. Each duty names its article so legal can check the source.`}>
        <Notices loadedExample={loadedExample} stale={stale} go={go} />
      </PageHead>
      <div className="chip-row">
        {['All', 'In force now', 'Starts later'].map((x) => <button key={x} className={`chip ${filter === x ? 'on' : ''}`} onClick={() => setFilter(x)}>{x}</button>)}
      </div>
      {result.groups.length === 0 && (
        <div className="card"><div className="no-act"><CircleCheck size={16} /> No mandatory AI Act duties on these answers. Voluntary codes of conduct are encouraged (Art 95).</div></div>
      )}
      {groups.map((g, gi) => (
        <section key={gi} className="duty-group">
          <div className="section-title"><Gavel size={18} /> {g.title}</div>
          <div className="duty-grid">
            {g.duties.map((d) => {
              const st = dutyStatus(d.from, today);
              const fine = d.id.startsWith('fine');
              return (
                <div key={d.id} className={`duty ${fine ? 'fine' : ''}`}>
                  <div className="duty-top">
                    <span className="duty-ref">{d.ref}</span>
                    <span className={`status st-${st.state}`}>{st.state === 'now' ? <CircleCheck size={12} /> : <Hourglass size={12} />} {st.state === 'now' ? 'In force' : `In ${st.days} days`}</span>
                  </div>
                  <div className="duty-title">{d.title}</div>
                  <p>{d.text}</p>
                  <div className="duty-when">{st.text}</div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

/* ---------- Timeline ---------- */

function TimelineSection({ form, result, today }) {
  const mine = new Set(result.allFrom);
  const items = [...DATES];
  const idx = items.findIndex((d) => dayDiff(d.date, today) > 0);
  return (
    <div className="page">
      <PageHead icon={CalendarClock} eyebrow="Timeline" title="Where today sits in the AI Act calendar." lede={`Dates as amended by the AI Omnibus. The ones that start a duty for ${form.name || 'this feature'} are marked.`} />
      <div className="timeline">
        {items.map((d, i) => {
          const past = dayDiff(d.date, today) <= 0;
          const hit = mine.has(d.date);
          return (
            <React.Fragment key={d.date}>
              {i === idx && (
                <div className="tl-today"><span className="tl-today-dot" /> Today, {today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              )}
              <div className={`tl ${past ? 'past' : 'future'} ${hit ? 'mine' : ''}`}>
                <div className="tl-dot">{past ? <Check size={12} /> : <Hourglass size={12} />}</div>
                <div className="tl-body">
                  <div className="tl-date">{fmtDate(d.date)} {!past && <span className="tl-in">in {dayDiff(d.date, today)} days</span>} {hit && <span className="tl-mine"><Target size={12} /> Starts a duty for you</span>}</div>
                  <div className="tl-title">{d.title}</div>
                  <p>{d.text}</p>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        {idx === -1 && <div className="tl-today"><span className="tl-today-dot" /> Today</div>}
      </div>
      <div className="notice"><Info size={16} /><span>Regulation (EU) 2026/1744 also leaves room to move dates again. Check the Commission's AI Act pages before a plan relies on one.</span></div>
    </div>
  );
}

/* ---------- Questions ---------- */

function QuestionsSection({ form, result, parsed, copyText, copied, download, report, error }) {
  const all = [...result.open.map((q) => ({ q, from: 'rules' })), ...parsed.questions.map((q) => ({ q, from: 'model' }))];
  const text = all.map((x, i) => `${i + 1}. ${x.q}`).join('\n');
  return (
    <div className="page">
      <PageHead icon={MessageSquareText} eyebrow="Questions" title="Settle these before anyone quotes the tier." lede="Questions from the rules come from answers left unsure or typed in by hand. Questions from the model come from your description." />
      <div className="brief-grid">
        <section className="brief-card">
          <div className="brief-head">
            <div className="panel-title"><CircleHelp size={16} /> {all.length} open question{all.length === 1 ? '' : 's'}</div>
            {all.length > 0 && <button className="btn primary sm" onClick={() => copyText(text, 'q')}>{copied === 'q' ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy</>}</button>}
          </div>
          {all.length ? (
            <div className="q-list">
              {all.map((x, i) => (
                <div key={i} className="qq">
                  <span className="q-n">{i + 1}</span>
                  <span className="qq-text">{x.q}</span>
                  <span className={`src src-${x.from}`}>{x.from === 'rules' ? <><Scale size={12} /> Rules</> : <><Sparkles size={12} /> Model</>}</span>
                </div>
              ))}
            </div>
          ) : <div className="no-act"><CircleCheck size={14} /> Nothing open. Every deciding answer is set and no second read has raised a question.</div>}
        </section>
        <div className="brief-side">
          <div className="panel">
            <div className="panel-title"><Download size={16} /> Report for legal or the team</div>
            <div className="panel-sub">The tier, every answer, the rule trail, duties with dates and these questions, as Markdown for Notion, Confluence, Jira or an email.</div>
            <div className="row-btns tight">
              <button className="btn primary sm" onClick={() => copyText(report(), 'rep')}>{copied === 'rep' ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy report</>}</button>
              <button className="btn ghost sm" onClick={download}><Download size={15} /> Download .md</button>
            </div>
            {error && <div className="error"><TriangleAlert size={16} /> {error}</div>}
          </div>
          <div className="panel">
            <div className="panel-title"><Briefcase size={16} /> Who to take it to</div>
            <ul className="icon-list">
              <li><Gavel size={16} /> Legal or the DPO, for the tier and any exemption claim</li>
              <li><Building2 size={16} /> The vendor, for their documentation and marking</li>
              <li><Users size={16} /> Works council or HR, before any use at work</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="notice warn"><Info size={16} /><span>A first sort for a product conversation, not legal advice. The final call on any tier belongs with legal counsel.</span></div>
    </div>
  );
}

/* ---------- How it works ---------- */

function HowSection() {
  return (
    <div className="page">
      <PageHead
        icon={Scale}
        eyebrow="How it works"
        title="Rules sort. A model reads."
        lede="Whether a feature is banned or high-risk should come out the same way every time, so a fixed set of printed rules decides the tier. The model only reads your description and points out answers that do not fit it."
      />
      <div className="how-grid">
        <Card icon={Sparkles} title="What the model does" sub="One call, tagged lines back">
          <ul className="tick-list">
            <li><Check size={16} /> Says what the feature does in one sentence</li>
            <li><Check size={16} /> Suggests a different answer where your words point to one</li>
            <li><Check size={16} /> Quotes the exact words behind each suggestion</li>
            <li><Check size={16} /> Writes questions for the team or legal</li>
          </ul>
        </Card>
        <Card icon={Ban} title="What it never does" sub="These happen in your browser">
          <ul className="tick-list muted">
            <li><X size={16} /> Set the tier or the confidence</li>
            <li><X size={16} /> Change an answer without your click</li>
            <li><X size={16} /> Choose duties or dates</li>
            <li><X size={16} /> Count a quote that is not in your description</li>
          </ul>
        </Card>
      </div>
      <Card icon={Search} title="The rules" sub="R rules sort, C sets confidence, M rules check the model">
        <div className="rule-list">
          {RULES.map((r) => <div key={r.id} className="rule"><span className="rule-id">{r.id}</span><p>{r.text}</p></div>)}
        </div>
      </Card>
      <div className="how-grid">
        <Card icon={BookOpen} title="Where the rules come from" sub="Read the source before relying on a result">
          <ul className="tick-list">
            <li><BadgeCheck size={16} /> Regulation (EU) 2024/1689, the AI Act: Articles 2, 5, 6, 25 to 27, 50, 53, 55, 86, 99, 111 and Annexes I and III</li>
            <li><BadgeCheck size={16} /> Regulation (EU) 2026/1744, the AI Omnibus, published 24 July 2026: the new high-risk dates, the marking grace period and two new prohibitions</li>
            <li><BadgeCheck size={16} /> Labels are shortened. The legal text is longer and has exceptions not shown here</li>
          </ul>
        </Card>
        <Card icon={Info} title="What it cannot do" sub="Read this before trusting a clean result">
          <ul className="tick-list">
            <li><Info size={16} /> It sorts on your answers. A wrong answer gives a wrong tier</li>
            <li><Info size={16} /> It does not cover GDPR, product liability, sector law or national rules</li>
            <li><Info size={16} /> Commission guidelines and standards keep arriving and can shift borderline cases</li>
            <li><Info size={16} /> It is not legal advice</li>
          </ul>
        </Card>
      </div>
      <Card icon={Briefcase} title="Why this exists" sub="Same split as What It Counts and Who Does What? in this repo">
        <p className="panel-text">On enterprise AI products I saw the AI Act come up late, usually as one question in a security questionnaire, after the roadmap was set. By then a ranking feature or an emotion score was already half built. The tier is a product decision as much as a legal one, because a few design choices move a feature up or down. This puts that conversation at the start, with the articles named so legal can check the reasoning instead of starting from nothing.</p>
      </Card>
    </div>
  );
}

/* ---------- Examples ---------- */

function ExamplesSection({ loadExample, loadedExample, startBlank, today }) {
  return (
    <div className="page">
      <PageHead icon={Layers} eyebrow="Examples" title="Three worked cases" lede="Each has the answers and a saved second read, so it runs without a key. The rules run live on each one." />
      <div className="ex-grid">
        {EXAMPLES.map((ex) => {
          const r = sortSystem(ex.form);
          const t = TIERS[r.tier];
          const Icon = TIER_ICONS[r.tier];
          const c = checkSignals(parseReply(ex.text), ex.form);
          const n = c.kept.filter((s) => !s.agrees).length;
          return (
            <button key={ex.id} className={`ex-card ${loadedExample === ex.id ? 'current' : ''}`} onClick={() => loadExample(ex)}>
              <div className="ex-top">
                <span className="team-tag"><Briefcase size={13} /> {ex.team}</span>
                {loadedExample === ex.id && <span className="ex-current">Open now</span>}
              </div>
              <div className="ex-title">{ex.title}</div>
              <div className="ex-blurb">{ex.blurb}</div>
              <div className="ex-stats">
                <span className={`ex-stat t-${t.tone}`}><Icon size={12} /> {t.short}</span>
                <span className="ex-stat"><Gauge size={12} /> {r.confidence}</span>
                <span className="ex-stat"><Sparkles size={12} /> {n} to check</span>
              </div>
              <div className="ex-open">Open this case <ArrowRight size={15} /></div>
            </button>
          );
        })}
        <button className="ex-card blank" onClick={startBlank}>
          <div className="ex-blank-icon"><Plus size={20} /></div>
          <div className="ex-title">Sort your own</div>
          <div className="ex-blurb">Describe a feature and answer the questions. The tier updates as you go.</div>
          <div className="ex-open">Start blank <ArrowRight size={15} /></div>
        </button>
      </div>
      <div className="notice"><Info size={16} /><span>Companies, products and people in the examples are invented.</span></div>
    </div>
  );
}
