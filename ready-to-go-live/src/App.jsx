import React, { useMemo, useRef, useState } from 'react';
import {
  Rocket, PenLine, Gauge, ListChecks, Route, FileText, Scale, Layers, Info, TriangleAlert, KeyRound, Loader2, Check, X,
  Plus, Copy, Download, ArrowRight, ShieldCheck, CircleCheck, CircleHelp, Sparkles, Wand2, Users, Target, FlaskConical,
  Plug, Activity, Hourglass, Flag, OctagonAlert, CircleDot, Undo2, Quote, Lightbulb, Bot, Siren, Building2, Languages,
  BarChart3, Zap, MessageSquareText, Eye, Ban, CircleMinus
} from 'lucide-react';
import {
  CHANNELS, VOLUMES, ACTIONS, LANGS, RISK, GATES, CHECKS, VERDICTS, assess, parseReply, checkSignals, applySignal, reportMarkdown
} from './rules.js';
import { EXAMPLES } from './examples.js';

const SECTIONS = [
  { id: 'describe', icon: PenLine, label: 'Describe it', desc: 'The agent, your notes and the readiness answers' },
  { id: 'verdict', icon: Rocket, label: 'Verdict', desc: 'Go, pilot or not yet, and why' },
  { id: 'checks', icon: ListChecks, label: 'Checks', desc: 'Every check by gate, with the fix for each gap' },
  { id: 'plan', icon: Route, label: 'Rollout plan', desc: 'Stages, exit criteria and rollback triggers' },
  { id: 'note', icon: FileText, label: 'Launch note', desc: 'Questions for the customer and a go or no-go note' },
  { id: 'how', icon: Scale, label: 'How it works', desc: 'The printed rules and thresholds' },
  { id: 'examples', icon: Layers, label: 'Examples', desc: 'Three worked launches, no key needed' }
];

const GATE_ICONS = { scope: Target, tests: FlaskConical, systems: Plug, handoff: Users, safety: ShieldCheck, ops: Activity };
const STATUS = {
  pass: { label: 'Pass', icon: CircleCheck, cls: 's-pass' },
  gap: { label: 'Gap', icon: CircleDot, cls: 's-gap' },
  blocker: { label: 'Blocker', icon: OctagonAlert, cls: 's-blocker' },
  na: { label: 'Not applicable', icon: CircleMinus, cls: 's-na' }
};
const VERDICT_ICONS = { notready: Ban, pilot: FlaskConical, watch: Eye, go: Rocket };

const PROVIDERS = [
  { id: 'muse', label: 'Muse Glimmer', note: 'Free, on this site' },
  { id: 'anthropic', label: 'Anthropic', note: 'Your key' },
  { id: 'openai', label: 'OpenAI', note: 'Your key' },
  { id: 'gemini', label: 'Gemini', note: 'Your key' }
];

const BLANK = {
  name: '', customer: '', channel: CHANNELS[0], languages: [], volume: VOLUMES[0], action: ACTIONS[0], notes: '',
  ...Object.fromEntries(CHECKS.map((c) => [c.id, '']))
};

const pl = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const slug = (s) => (s || 'ai-agent').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

export default function App() {
  const today = useMemo(() => new Date(), []);
  const [section, setSection] = useState('verdict');
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
  const [applied, setApplied] = useState([]);
  const mainRef = useRef(null);

  const a = useMemo(() => assess(form), [form]);
  const parsed = useMemo(() => parseReply(modelText), [modelText]);
  const signals = useMemo(() => checkSignals(parsed, form), [parsed, form]);
  const stale = !!modelText && modelNotes.trim() !== form.notes.trim();

  const go = (id) => {
    setSection(id);
    if (mainRef.current) mainRef.current.scrollTo({ top: 0 });
  };
  const set = (k, v) => {
    setLoadedExample(null);
    setForm((f) => ({ ...f, [k]: v }));
  };
  const apply = (s) => {
    setLoadedExample(null);
    setApplied((x) => [...x, { label: s.topic, from: s.current || 'not answered', to: s.value }]);
    setForm((f) => applySignal(f, s));
  };
  const loadExample = (ex) => {
    setForm(ex.form);
    setLoadedExample(ex.id);
    setModelText(ex.text);
    setModelNotes(ex.form.notes);
    setApplied([]);
    setError('');
    go('verdict');
  };
  const startBlank = () => {
    setForm(BLANK);
    setLoadedExample(null);
    setModelText('');
    setModelNotes('');
    setApplied([]);
    setError('');
    go('describe');
  };

  const read = async () => {
    setError('');
    if (form.notes.trim().length < 60) {
      setError('Write a few sentences of rollout notes first.');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey, model, notes: form.notes, answers: form })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
      const p = parseReply(data.text);
      if (!p.summary && !p.signals.length) throw new Error('The model replied, but not in the expected format. Try again or switch provider.');
      setModelText(data.text);
      setModelNotes(form.notes);
      setApplied([]);
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
  const report = () => reportMarkdown(form, a, today, parsed);
  const download = () => {
    const blob = new Blob([report()], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const el = document.createElement('a');
    el.href = url;
    el.download = `${slug(form.name)}-go-live-note.md`;
    el.click();
    URL.revokeObjectURL(url);
  };

  const v = VERDICTS[a.verdict];
  const VIcon = VERDICT_ICONS[a.verdict];
  const toCheck = signals.kept.filter((s) => !s.agrees).length;
  const common = { form, a, go, loadedExample, stale };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Rocket size={20} /></div>
          <div>
            <div className="brand-name">Ready to Go Live?</div>
            <div className="brand-sub">Launch check for an AI agent</div>
          </div>
        </div>
        <nav className="nav">
          {SECTIONS.map((s) => (
            <button key={s.id} className={`nav-item ${section === s.id ? 'active' : ''}`} onClick={() => go(s.id)}>
              <s.icon size={18} className="nav-icon" />
              <span className="nav-text">
                <span className="nav-label">{s.label}{s.id === 'verdict' && toCheck > 0 && <span className="nav-badge">{toCheck}</span>}</span>
                <span className="nav-desc">{s.desc}</span>
              </span>
            </button>
          ))}
        </nav>
        <div className="side-plan">
          <div className="side-label">Current launch</div>
          <div className="side-name">{form.name || 'Untitled agent'}{form.customer ? ` · ${form.customer}` : ''}</div>
          <div className={`side-verdict v-${v.tone}`}><VIcon size={14} /> {v.short}</div>
          <div className="side-meter"><span style={{ width: `${a.score}%` }} /></div>
          <div className="side-meta"><Gauge size={13} /> {a.score}/100 · {a.risk.level} risk · rule {a.rule}</div>
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
        {section === 'verdict' && <VerdictSection {...common} signals={signals} parsed={parsed} apply={apply} applied={applied} />}
        {section === 'checks' && <ChecksSection {...common} />}
        {section === 'plan' && <PlanSection {...common} />}
        {section === 'note' && <NoteSection {...common} parsed={parsed} copyText={copyText} copied={copied} download={download} report={report} error={error} />}
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

function TextField({ label, hint, value, onChange, placeholder, area, rows = 2, type = 'text', suffix }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {hint && <span className="field-hint">{hint}</span>}
      {area ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} />
      ) : (
        <span className={suffix ? 'with-suffix' : ''}>
          <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete="off" inputMode={suffix ? 'decimal' : undefined} />
          {suffix && <span className="suffix">{suffix}</span>}
        </span>
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

function Chips({ options, value, onChange, placeholder = 'Your answer', status }) {
  const isCustom = value && !options.includes(value);
  return (
    <div className="chip-row">
      {options.map((o) => (
        <button key={o} className={`chip ${value === o ? `on ${status ? STATUS[status].cls : ''}` : ''}`} onClick={() => onChange(o)}>{value === o && <Check size={13} />}{o}</button>
      ))}
      {isCustom && <button className={`chip on custom ${status ? STATUS[status].cls : ''}`}><Check size={13} />{value}</button>}
      <AddOwn onAdd={onChange} placeholder={placeholder} />
    </div>
  );
}

function MultiChips({ options, value = [], onChange, placeholder = 'Your own' }) {
  const toggle = (o) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  const customs = value.filter((x) => !options.includes(x));
  return (
    <div className="chip-row">
      {options.map((o) => (
        <button key={o} className={`chip multi ${value.includes(o) ? 'on' : ''}`} onClick={() => toggle(o)}>
          <span className="box">{value.includes(o) && <Check size={12} />}</span>{o}
        </button>
      ))}
      {customs.map((c) => (
        <button key={c} className="chip multi on custom" onClick={() => toggle(c)}><span className="box"><Check size={12} /></span>{c}</button>
      ))}
      <AddOwn onAdd={(x) => !value.includes(x) && onChange([...value, x])} placeholder={placeholder} />
    </div>
  );
}

function StatusPill({ status }) {
  const s = STATUS[status];
  return <span className={`pill ${s.cls}`}><s.icon size={13} /> {s.label}</span>;
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
          <span>Worked example with a saved second read. <button className="link" onClick={() => go('describe')}>Change any answer</button> and the rules run again at once.</span>
        </div>
      )}
      {stale && (
        <div className="notice warn">
          <TriangleAlert size={16} />
          <span>Your notes changed after the model read them. The verdict is current. <button className="link" onClick={() => go('describe')}>Read them again</button> to refresh the second read.</span>
        </div>
      )}
    </>
  );
}

/* ---------- Describe it ---------- */

function DescribeSection(p) {
  const { form, set, a } = p;
  const v = VERDICTS[a.verdict];
  const VIcon = VERDICT_ICONS[a.verdict];
  const rowOf = (id) => a.rows.find((r) => r.id === id);
  return (
    <div className="page">
      <PageHead
        icon={PenLine}
        eyebrow="Describe it"
        title="Check an AI agent is ready for real customers before the launch date arrives."
        lede="Answer the readiness questions and paste your rollout notes. Printed rules give a verdict and a staged rollout plan as you answer. A model reads your notes and flags answers they contradict."
      >
        <div className="steps">
          <Step n="1" icon={PenLine} text="Describe the agent and paste your notes" />
          <Step n="2" icon={Scale} text="Printed rules mark each check and set the verdict" />
          <Step n="3" icon={Sparkles} text="A model checks your answers against your notes" />
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
          <Card icon={Bot} title="The agent" sub="What it is, where it runs and what it can change">
            <div className="two">
              <TextField label="Agent name" value={form.name} onChange={(x) => set('name', x)} placeholder="Clara" />
              <TextField label="Customer" value={form.customer} onChange={(x) => set('customer', x)} placeholder="Solenia Energía" />
            </div>
            <div className="q-block">
              <span className="field-label">Channel</span>
              <Chips options={CHANNELS} value={form.channel} onChange={(x) => set('channel', x)} placeholder="Your channel" />
            </div>
            <div className="q-block">
              <span className="field-label">Launch languages</span>
              <MultiChips options={LANGS} value={form.languages} onChange={(x) => set('languages', x)} placeholder="Another language" />
            </div>
            <div className="q-block">
              <span className="field-label">Expected volume</span>
              <Chips options={VOLUMES} value={form.volume} onChange={(x) => set('volume', x)} placeholder="Your volume" />
            </div>
            <div className="q-block">
              <span className="field-label">What the agent can do</span>
              <span className="field-hint">This sets the risk level, and the risk level sets every threshold.</span>
              <Chips options={ACTIONS} value={form.action} onChange={(x) => set('action', x)} placeholder="Describe the action" />
            </div>
            <TextField
              label="Rollout notes" area rows={6} value={form.notes} onChange={(x) => set('notes', x)}
              hint="Paste the handover doc, kickoff notes or a plain description. The model quotes these words back, so the more concrete the better."
              placeholder="What it does, which systems it touches, how it was tested, who takes handoffs, when it launches..."
            />
          </Card>

          {GATES.map((g, gi) => {
            const Icon = GATE_ICONS[g.id];
            const checks = CHECKS.filter((c) => c.gate === g.id && (!c.voiceOnly || a.voice));
            return (
              <Card key={g.id} icon={Icon} title={`${gi + 1}. ${g.label}`} sub={`${checks.length} checks`}>
                {checks.map((c) => {
                  const r = rowOf(c.id);
                  return (
                    <div className="q-block" key={c.id}>
                      <div className="q-head">
                        <span className="q-num">{c.rule}</span>
                        <span className="field-label">{c.label}</span>
                        {r && <StatusPill status={r.status} />}
                      </div>
                      {c.hint && <div className="field-hint">{c.hint}</div>}
                      {c.numeric ? (
                        <div className="num-row">
                          <TextField label="" value={form[c.id]} onChange={(x) => set(c.id, x)} placeholder="Leave blank if not measured" suffix="%" />
                          <span className="num-target">
                            <Target size={13} /> {c.id === 'success' ? `${a.risk.minSuccess}% or above` : `${a.risk.maxCritical}% or below`} at {a.risk.level.toLowerCase()} risk
                          </span>
                        </div>
                      ) : (
                        <Chips options={c.options} value={form[c.id]} onChange={(x) => set(c.id, x)} status={r?.status} />
                      )}
                    </div>
                  );
                })}
              </Card>
            );
          })}
        </div>

        <div className="sticky-results">
          <div className={`panel live v-${v.tone}`}>
            <div className="panel-title"><Scale size={16} /> Verdict, live</div>
            <div className="panel-sub">Printed rules, in your browser, no key.</div>
            <div className={`live-verdict v-${v.tone}`}><VIcon size={20} /> {v.label}</div>
            <div className="meter"><span style={{ width: `${a.score}%` }} /></div>
            <div className="live-meta">
              <span><Gauge size={13} /> {a.score}/100</span>
              <span><Zap size={13} /> {a.risk.level} risk</span>
              <span><OctagonAlert size={13} /> {pl(a.blockers.length, 'blocker')}</span>
              <span><CircleDot size={13} /> {pl(a.gaps.length, 'gap')}</span>
            </div>
            <button className="link small" onClick={() => p.go('verdict')}>See why <ArrowRight size={12} /></button>
          </div>
          <div className="panel">
            <div className="panel-title"><KeyRound size={16} /> Second read</div>
            <div className="panel-sub">A model checks your answers against your notes. It never sets the verdict.</div>
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
              {p.busy ? <><Loader2 size={16} className="spin" /> Reading your notes</> : <><Wand2 size={16} /> Check my answers</>}
            </button>
            {p.error && <div className="error"><TriangleAlert size={16} /> {p.error}</div>}
          </div>
          <div className="panel">
            <div className="panel-title"><ListChecks size={16} /> What you get</div>
            <ul className="icon-list">
              <li><Rocket size={16} /> A verdict, and each rule that led there</li>
              <li><OctagonAlert size={16} /> Blockers and gaps, each with a fix and an owner</li>
              <li><Route size={16} /> A staged rollout with exit criteria</li>
              <li><Siren size={16} /> Rollback triggers to set alerts on</li>
              <li><FileText size={16} /> A go or no-go note to share</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Verdict ---------- */

function IssueList({ rows, kind, go }) {
  if (!rows.length) return null;
  return (
    <div className="issues">
      {rows.map((r) => (
        <div key={r.id} className={`issue ${kind}`}>
          <div className="issue-top">
            <StatusPill status={r.status} />
            <span className="issue-label">{r.label}</span>
            <span className="owner"><Building2 size={12} /> {r.owner}</span>
          </div>
          <div className="issue-now">Now: {r.value || 'not answered'}{r.custom ? ' (typed in, scored as a gap until confirmed)' : ''}</div>
          <div className="issue-fix"><Lightbulb size={14} /> {r.fixText}</div>
        </div>
      ))}
      <button className="link small" onClick={() => go('checks')}>All checks by gate <ArrowRight size={12} /></button>
    </div>
  );
}

function VerdictSection({ form, a, go, loadedExample, stale, signals, parsed, apply, applied }) {
  const v = VERDICTS[a.verdict];
  const VIcon = VERDICT_ICONS[a.verdict];
  const checks = signals.kept.filter((s) => !s.agrees);
  const agrees = signals.kept.filter((s) => s.agrees);
  const hasModel = !!(parsed.summary || parsed.signals.length);
  return (
    <div className="page">
      <PageHead icon={Rocket} eyebrow="Verdict" title={`${form.name || 'This agent'}${form.customer ? ` for ${form.customer}` : ''}`}>
        <Notices loadedExample={loadedExample} stale={stale} go={go} />
      </PageHead>

      <div className={`hero v-${v.tone}`}>
        <div className="hero-icon"><VIcon size={30} /></div>
        <div className="hero-text">
          <div className="hero-label">{v.label}</div>
          <div className="hero-line">{v.line}</div>
        </div>
        <div className="hero-score">
          <div className="hero-score-n">{a.score}</div>
          <div className="hero-score-l">readiness out of 100</div>
        </div>
      </div>

      <div className="kpis">
        <Kpi icon={Zap} label="Risk" value={a.risk.level} sub={a.risk.line} />
        <Kpi icon={OctagonAlert} label="Blockers" value={a.blockers.length} sub="Stop any real traffic" tone={a.blockers.length ? 'bad' : ''} />
        <Kpi icon={CircleDot} label="Gaps" value={a.gaps.length} sub="Close during the first stage" tone={a.gaps.length ? 'warn' : ''} />
        <Kpi icon={CircleCheck} label="Passed" value={`${a.passes.length}/${a.live.length}`} sub="Applicable checks" />
      </div>

      <div className="cols">
        <div className="col">
          <Card icon={Flag} title="Rule trail" sub="The score is shown for context. Only these rules set the verdict">
            <div className="trail">
              {a.trail.map((t, i) => (
                <div key={i} className={`trail-row ${t.fired ? 'fired' : ''}`}>
                  <span className="trail-rule">{t.rule}</span>
                  <span>{t.text}</span>
                </div>
              ))}
            </div>
          </Card>
          {a.blockers.length > 0 && (
            <Card icon={OctagonAlert} title="Blockers" sub="Each one stops the launch on its own" tone="tone-bad">
              <IssueList rows={a.blockers} kind="bad" go={go} />
            </Card>
          )}
          {a.gaps.length > 0 && (
            <Card icon={CircleDot} title={a.verdict === 'watch' ? 'Watch items' : 'Gaps'} sub="Not enough to stop a staged launch on their own" tone="tone-warn">
              <IssueList rows={a.gaps} kind="warn" go={go} />
            </Card>
          )}
        </div>

        <div className="col">
          <Card icon={Sparkles} title="Second read" sub="A model compared your answers with your notes. Each quote is checked against the notes">
            {!hasModel ? (
              <div className="empty">
                <MessageSquareText size={22} />
                <div>No second read yet. <button className="link" onClick={() => go('describe')}>Paste your notes and run it</button>, or open an example.</div>
              </div>
            ) : (
              <>
                {parsed.summary && <p className="summary"><Bot size={15} /> {parsed.summary}</p>}
                {applied.length > 0 && (
                  <div className="applied">
                    {applied.map((x, i) => (
                      <div key={i}><Undo2 size={13} /> Applied: {x.label}, from “{x.from}” to “{x.to}”</div>
                    ))}
                  </div>
                )}
                {checks.length > 0 && <div className="sub-head">Your notes point elsewhere ({checks.length})</div>}
                {checks.map((s, i) => (
                  <div key={i} className="signal">
                    <div className="signal-top"><TriangleAlert size={15} /> <b>{s.topic}</b></div>
                    <div className="signal-change"><span className="was">{s.current || 'not answered'}</span> <ArrowRight size={13} /> <span className="now">{s.value}</span></div>
                    <blockquote><Quote size={13} /> {s.quote}</blockquote>
                    <div className="signal-why">{s.why}</div>
                    <button className="btn small" onClick={() => apply(s)}><Check size={14} /> Apply and re-run the rules</button>
                  </div>
                ))}
                {signals.risks.length > 0 && <div className="sub-head">Not covered by the form</div>}
                {signals.risks.map((r, i) => (
                  <div key={i} className="signal risk">
                    <blockquote><Quote size={13} /> {r.quote}</blockquote>
                    <div className="signal-why">{r.why}</div>
                  </div>
                ))}
                {agrees.length > 0 && <div className="sub-head">Confirmed by your notes ({agrees.length})</div>}
                {agrees.map((s, i) => (
                  <div key={i} className="agree"><CircleCheck size={14} /> <span><b>{s.topic}:</b> {s.value}. <i>“{s.quote}”</i></span></div>
                ))}
                {(signals.dropped.length > 0 || signals.droppedRisks > 0) && (
                  <div className="dropped">
                    <Info size={14} /> {signals.dropped.length + signals.droppedRisks} suggestion{signals.dropped.length + signals.droppedRisks > 1 ? 's' : ''} dropped because the quote was not in your notes or the answer was not a listed option.
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------- Checks ---------- */

function ChecksSection({ a, go, loadedExample, stale }) {
  return (
    <div className="page">
      <PageHead icon={ListChecks} eyebrow="Checks" title="Every check, by gate" lede={`Thresholds are set for ${a.risk.level.toLowerCase()} risk. Change what the agent can do on Describe it and they move.`}>
        <Notices loadedExample={loadedExample} stale={stale} go={go} />
      </PageHead>
      <div className="gate-strip">
        {a.gates.map((g) => {
          const Icon = GATE_ICONS[g.id];
          return (
            <a key={g.id} href={`#gate-${g.id}`} className={`gate-tile ${g.blockers ? 'bad' : g.gaps ? 'warn' : 'ok'}`}>
              <Icon size={16} />
              <span className="gate-name">{g.short}</span>
              <span className="gate-score">{g.score === null ? 'n/a' : g.score}</span>
              <span className="meter thin"><span style={{ width: `${g.score || 0}%` }} /></span>
            </a>
          );
        })}
      </div>
      {a.gates.map((g) => {
        const Icon = GATE_ICONS[g.id];
        return (
          <div id={`gate-${g.id}`} key={g.id}>
            <Card icon={Icon} title={g.label} sub={`${pl(g.blockers, 'blocker')} · ${pl(g.gaps, 'gap')}`} right={<span className="gate-badge">{g.score === null ? 'n/a' : `${g.score}/100`}</span>}>
              <div className="check-list">
                {g.rows.map((r) => (
                  <div key={r.id} className={`check-row ${STATUS[r.status].cls}`}>
                    <div className="check-main">
                      <span className="q-num">{r.rule}</span>
                      <div>
                        <div className="check-label">{r.label}</div>
                        <div className="check-value">{r.status === 'na' ? 'Not used for this channel or setup' : r.value || 'Not answered'}</div>
                      </div>
                      <StatusPill status={r.status} />
                    </div>
                    {(r.status === 'gap' || r.status === 'blocker') && <div className="issue-fix"><Lightbulb size={14} /> {r.fixText} <span className="owner"><Building2 size={12} /> {r.owner}</span></div>}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Rollout plan ---------- */

function PlanSection({ a, go, loadedExample, stale }) {
  const { plan, risk } = a;
  return (
    <div className="page">
      <PageHead icon={Route} eyebrow="Rollout plan" title={a.verdict === 'notready' ? 'No real traffic yet' : 'Step up only when the numbers hold'} lede={`Set by rule P1 for a ${VERDICTS[a.verdict].label.toLowerCase()} verdict at ${risk.level.toLowerCase()} risk. Each stage needs its exit criteria met before the next one starts.`}>
        <Notices loadedExample={loadedExample} stale={stale} go={go} />
      </PageHead>
      <div className="stages">
        {plan.stages.map((s, i) => (
          <div key={i} className="stage">
            <div className="stage-top">
              <span className="stage-n">{i + 1}</span>
              <span className="stage-name">{s.name}</span>
              <span className="stage-traffic">{s.traffic}</span>
            </div>
            <div className="traffic-bar"><span style={{ width: s.traffic }} /></div>
            <div className="stage-scope"><Users size={14} /> {s.scope}</div>
            {s.days && <div className="stage-scope"><Hourglass size={14} /> At least {s.days} days</div>}
            {s.exit.length > 0 && (
              <>
                <div className="sub-head">Move on when</div>
                <ul className="tick-list">
                  {s.exit.map((e, j) => <li key={j}><CircleCheck size={14} /> {e}</li>)}
                </ul>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="cols">
        <div className="col">
          <Card icon={Siren} title="Roll back if" sub="Set an alert on each one before the first stage starts" tone="tone-bad">
            <ul className="tick-list bad">
              {plan.triggers.map((t, i) => <li key={i}><Undo2 size={14} /> {t}</li>)}
            </ul>
          </Card>
        </div>
        <div className="col">
          <Card icon={BarChart3} title={`Thresholds at ${risk.level.toLowerCase()} risk`} sub={risk.why}>
            <div className="thresholds">
              <div><span>Critical failures</span><b>{risk.maxCritical}% or below</b></div>
              <div><span>Task success</span><b>{risk.minSuccess}% or above</b></div>
              <div><span>Test set</span><b>{risk.minCases}+ cases</b></div>
              <div><span>Reviewed per stage</span><b>{risk.perStage} conversations</b></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------- Launch note ---------- */

function NoteSection({ a, parsed, copyText, copied, download, report, error }) {
  const text = report();
  return (
    <div className="page">
      <PageHead icon={FileText} eyebrow="Launch note" title="Questions for the customer, and a note to share" lede="The note carries the verdict, blockers, gaps, rollout plan and every check. Paste it into an email, Notion, Confluence or a ticket." />
      <div className="cols">
        <div className="col">
          <Card icon={CircleHelp} title="Settle these before launch" sub="From the second read">
            {parsed.questions.length ? (
              <ul className="q-list">
                {parsed.questions.map((q, i) => <li key={i}><CircleHelp size={15} /> {q}</li>)}
              </ul>
            ) : (
              <div className="empty"><CircleHelp size={20} /><div>Run the second read on Describe it to get questions drawn from your notes.</div></div>
            )}
          </Card>
          <Card icon={Users} title="Who owns what" sub="Blockers and gaps by owner">
            {['Us', 'Customer', 'Both'].map((o) => {
              const rows = [...a.blockers, ...a.gaps].filter((r) => r.owner === o);
              return (
                <div key={o} className="owner-row">
                  <span className="owner-name">{o === 'Us' ? 'Our team' : o === 'Customer' ? 'Customer' : 'Together'}</span>
                  <span className="owner-items">{rows.length ? rows.map((r) => <StatusPill key={r.id} status={r.status} />) : <span className="muted">Nothing open</span>}</span>
                  <span className="owner-count">{rows.length}</span>
                </div>
              );
            })}
          </Card>
        </div>
        <div className="col">
          <Card
            icon={FileText} title="Go or no-go note" sub="Markdown"
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
  ['R1', 'Risk comes from what the agent can do. Answers only is Low, unless volume is over 5,000 a day, which makes it Medium. Updating records is Medium. Moving money, changing contracts or giving health, legal or money guidance is High'],
  ['T1 to T6', 'Test evidence is judged against the risk level. Scripted-only tests block a voice or high-risk launch. Unmeasured success or failure rates block a medium or high-risk launch'],
  ['C1 to C3', 'Connected systems must be tested end to end, with a defined response when one is down. Saying no systems are connected for C2 while C1 names one counts as a gap. The knowledge base needs a pinned version and an owner'],
  ['H1 to H3', 'Every conversation needs a route to a person. A callback alone blocks a high-risk launch'],
  ['D1 to D4', 'AI disclosure at the start is required (EU AI Act Article 50, in force since 2 August 2026). Recording, personal data and out-of-scope requests are checked'],
  ['O1 to O5', 'Monitoring, daily reading of conversations, a tested off switch, a briefed frontline team and named cover on both sides'],
  ['V1', 'Any blocker: Not ready'],
  ['V2', 'No blockers, but four or more gaps, or any gap in test evidence or handoff: Pilot first'],
  ['V3', 'No blockers and one to three gaps elsewhere: Go live, with watch items'],
  ['V4', 'Every applicable check passed: Go live'],
  ['P1', 'The rollout plan follows the verdict and risk: stage sizes, minimum days per stage, exit criteria and rollback triggers are printed, never generated'],
  ['M1', 'A model suggestion counts only if its quote is in your notes and its answer is a listed option. Nothing changes until you apply it'],
  ['A1', 'A typed-in answer cannot be scored against the printed options, so it counts as a gap until you pick a listed one']
];

function HowSection() {
  return (
    <div className="page">
      <PageHead icon={Scale} eyebrow="How it works" title="Rules decide. A model reads." lede="A launch decision has to come out the same way every time for the same evidence, so every status, the verdict and the rollout plan come from printed rules. The model does the one thing rules cannot: read a page of notes and notice where they disagree with the boxes someone ticked." />
      <div className="cols">
        <div className="col">
          <Card icon={Scale} title="The rules">
            <div className="rule-table">
              {RULES_TABLE.map(([r, t]) => <div key={r} className="rule-row"><span className="trail-rule">{r}</span><span>{t}</span></div>)}
            </div>
          </Card>
        </div>
        <div className="col">
          <Card icon={BarChart3} title="Thresholds by risk" sub="Starting points to agree with the customer, not industry standards">
            <table className="t">
              <thead><tr><th /><th>Low</th><th>Medium</th><th>High</th></tr></thead>
              <tbody>
                <tr><td>Critical failures, at most</td>{Object.values(RISK).map((r) => <td key={r.label}>{r.maxCritical}%</td>)}</tr>
                <tr><td>Task success, at least</td>{Object.values(RISK).map((r) => <td key={r.label}>{r.minSuccess}%</td>)}</tr>
                <tr><td>Test set, at least</td>{Object.values(RISK).map((r) => <td key={r.label}>{r.minCases}</td>)}</tr>
                <tr><td>Reviewed per stage</td>{Object.values(RISK).map((r) => <td key={r.label}>{r.perStage}</td>)}</tr>
              </tbody>
            </table>
          </Card>
          <Card icon={Lightbulb} title="Where the checks come from">
            <ul className="icon-list">
              <li><Users size={16} /> The five-stage enterprise rollouts of voice and chat agents I worked on at Jinn Live</li>
              <li><Languages size={16} /> Scripted demos that passed and then broke on real regional accents, holds and road noise</li>
              <li><Plug size={16} /> A stale knowledge base copy that produced confident wrong answers once every 10 to 15 calls</li>
              <li><ShieldCheck size={16} /> EU AI Act Article 50 for disclosure, and GDPR for recording and transcripts</li>
            </ul>
          </Card>
          <Card icon={TriangleAlert} title="What it cannot do">
            <p className="panel-text">It judges the answers you give, so a generous answer gives a generous verdict. It does not test the agent itself, read your transcripts or replace legal review of recording and data processing. The thresholds are defaults to agree with the customer, and some sectors need stricter ones.</p>
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
      <PageHead icon={Layers} eyebrow="Examples" title="Three launches, three verdicts" lede="Each loads with a saved second read, so it works without a key. Companies and agents are invented." />
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
              <div className="example-meta"><Gauge size={13} /> {r.score}/100 · {r.risk.level} risk · {pl(r.blockers.length, 'blocker')} · {pl(r.gaps.length, 'gap')}</div>
              <button className="btn primary" onClick={() => loadExample(ex)}>{loadedExample === ex.id ? <><Check size={15} /> Loaded</> : <>Open it <ArrowRight size={15} /></>}</button>
            </div>
          );
        })}
      </div>
      <div className="notice"><PenLine size={16} /><span>Have your own launch? <button className="link" onClick={startBlank}>Start blank</button>.</span></div>
    </div>
  );
}
