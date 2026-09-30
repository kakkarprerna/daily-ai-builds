import React, { useMemo, useRef, useState } from "react";
import {
  Layers, BookOpen, Sparkles, Plus, X, ArrowUp, ArrowDown, Trash2, Wand2, Loader2, Copy, Check,
  ArrowLeft, TrendingUp, Flag, MessagesSquare, Ruler, Database, OctagonX, Lightbulb, ArrowRight,
  AlertTriangle, Target, KeyRound, Cpu, ShieldCheck, ScanSearch, ListChecks, FileText, Route,
  CircleCheck, CircleAlert, CircleX, Info, Milestone, FolderOpen, PenLine,
} from "lucide-react";
import { EXAMPLES } from "./examples.js";
import { parsePlan, checkWording, planToMarkdown } from "./parse.js";

const PRODUCT_TYPES = ["B2B SaaS", "Consumer app", "API or platform", "Conversational AI", "Internal tool"];
const RISKS = [
  { value: "Cautious", note: "Higher bars, smaller exposure" },
  { value: "Balanced", note: "Sensible middle" },
  { value: "Fast", note: "Lower bars, clear rollback" },
];
const SOURCES = ["Product analytics", "Support tickets", "Sales CRM", "Surveys", "Call logs", "Interviews", "None yet"];
const STAGE_PRESETS = ["Discovery", "Validation", "Prototype test", "Alpha", "Private beta", "Beta", "Controlled rollout", "General availability", "Scale"];
const PROVIDERS = [
  { id: "muse", label: "Muse Glimmer", note: "Free demo, no key needed", keyLabel: "NVIDIA key (optional)" },
  { id: "anthropic", label: "Anthropic", note: "Your own key", keyLabel: "Anthropic API key" },
  { id: "openai", label: "OpenAI", note: "Your own key", keyLabel: "OpenAI API key" },
  { id: "gemini", label: "Gemini", note: "Your own key", keyLabel: "Gemini API key" },
];

const NAV = [
  { id: "build", label: "Build criteria", desc: "Describe your stages, get checkable finish lines", icon: Layers },
  { id: "how", label: "How it works", desc: "The method, the model and the limits", icon: BookOpen },
  { id: "examples", label: "Examples", desc: "Three saved plans, no key needed", icon: Sparkles },
];

const blankInput = () => ({
  name: "",
  summary: "",
  productType: "B2B SaaS",
  risk: "Balanced",
  sources: ["Product analytics"],
  stages: [
    { id: uid(), name: "Discovery", goal: "", draft: "" },
    { id: uid(), name: "Beta", goal: "", draft: "" },
    { id: uid(), name: "General availability", goal: "", draft: "" },
  ],
});

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function App() {
  const [view, setView] = useState("build");
  const [input, setInput] = useState(blankInput);
  const [provider, setProvider] = useState("muse");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null); // { input, plan, source }
  const mainRef = useRef(null);

  const go = (v) => {
    setView(v);
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openExample = (ex, mode) => {
    const loaded = { ...ex.input, stages: ex.input.stages.map((s) => ({ ...s, id: uid() })) };
    setInput(loaded);
    setError("");
    setResult(mode === "result" ? { input: loaded, plan: parsePlan(ex.saved), source: "Saved example" } : null);
    go("build");
  };

  const run = async () => {
    setError("");
    const stages = input.stages.filter((s) => s.name.trim());
    if (!input.name.trim()) return setError("Give the initiative a name first.");
    if (!stages.length) return setError("Add at least one stage.");
    if (provider !== "muse" && !apiKey.trim()) return setError(`Paste your ${PROVIDERS.find((p) => p.id === provider).label} key, or switch to Muse Glimmer.`);
    setLoading(true);
    try {
      const payload = { ...input, stages };
      const r = await fetch("/api/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey, model, input: payload }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
      const plan = parsePlan(data.text);
      if (!plan.stages.length) throw new Error("The model answered in a format the app could not read. Try again, or try another provider.");
      setResult({ input: payload, plan, source: PROVIDERS.find((p) => p.id === provider).label });
      mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Milestone size={20} /></div>
          <div>
            <div className="brand-name">Exit Criteria Builder</div>
            <div className="brand-sub">Daily AI Builds</div>
          </div>
        </div>
        <nav className="nav">
          {NAV.map((n) => {
            const Icon = n.icon;
            return (
              <button key={n.id} className={`nav-item ${view === n.id ? "active" : ""}`} onClick={() => go(n.id)}>
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
          <ShieldCheck size={15} />
          <span>No sign-in. Nothing you type is stored.</span>
        </div>
      </aside>

      <main className="main" ref={mainRef}>
        <div className="main-inner">
          {view === "build" && (
            result ? (
              <ResultView result={result} onBack={() => setResult(null)} />
            ) : (
              <BuildForm
                input={input} setInput={setInput}
                provider={provider} setProvider={setProvider}
                apiKey={apiKey} setApiKey={setApiKey}
                model={model} setModel={setModel}
                loading={loading} error={error} onRun={run}
                onReset={() => { setInput(blankInput()); setError(""); }}
                onExamples={() => go("examples")}
              />
            )
          )}
          {view === "how" && <HowView onStart={() => go("build")} />}
          {view === "examples" && <ExamplesView onOpen={openExample} />}
        </div>
      </main>
    </div>
  );
}

/* ---------- Build form ---------- */

function BuildForm({ input, setInput, provider, setProvider, apiKey, setApiKey, model, setModel, loading, error, onRun, onReset, onExamples }) {
  const set = (patch) => setInput((prev) => ({ ...prev, ...patch }));
  const setStage = (id, patch) => set({ stages: input.stages.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  const move = (i, d) => {
    const next = [...input.stages];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    set({ stages: next });
  };
  const addStage = (name) => {
    if (input.stages.length >= 7) return;
    set({ stages: [...input.stages, { id: uid(), name, goal: "", draft: "" }] });
  };
  const prov = PROVIDERS.find((p) => p.id === provider);

  return (
    <>
      <header className="hero">
        <div className="eyebrow"><Route size={14} /> Roadmap in stages</div>
        <h1>Give every stage a finish line you can check</h1>
        <p>List your stages and what each one should prove. You get measurable exit criteria, a stop condition and sharper wording for any criteria you already drafted.</p>
        <div className="hero-steps">
          <Step icon={PenLine} title="Describe" text="Initiative, stages, goals" />
          <Step icon={ScanSearch} title="Check" text="Draft wording scanned as you type" />
          <Step icon={ListChecks} title="Get" text="Criteria, stops, rewrites, gaps" />
        </div>
        <button className="link-btn" onClick={onExamples}><FolderOpen size={15} /> Or open a saved example</button>
      </header>

      <section className="card">
        <SectionTitle icon={Target} title="The initiative" note="What you are building and for whom" />
        <label className="field">
          <span>Name</span>
          <input value={input.name} maxLength={120} placeholder="e.g. Automatic payment reminders" onChange={(e) => set({ name: e.target.value })} />
        </label>
        <label className="field">
          <span>What it is, in two or three sentences</span>
          <textarea rows={3} maxLength={600} value={input.summary} placeholder="Who it is for, the problem it solves, anything that constrains the rollout" onChange={(e) => set({ summary: e.target.value })} />
        </label>
        <ChipField label="Product type" options={PRODUCT_TYPES} value={input.productType} onChange={(v) => set({ productType: v })} />
        <ChipField
          label="Risk appetite"
          options={RISKS.map((r) => r.value)}
          notes={Object.fromEntries(RISKS.map((r) => [r.value, r.note]))}
          value={input.risk}
          onChange={(v) => set({ risk: v })}
        />
        <ChipField label="Data you can actually get" multi options={SOURCES} value={input.sources} onChange={(v) => set({ sources: v })} />
      </section>

      <section className="card">
        <SectionTitle icon={Layers} title="Stages, in order" note="Up to seven. Drafts are optional, one per line." />
        <div className="chip-row compact">
          {STAGE_PRESETS.map((p) => (
            <button key={p} className="chip ghost" onClick={() => addStage(p)} disabled={input.stages.length >= 7}>
              <Plus size={13} /> {p}
            </button>
          ))}
          <CustomAdd placeholder="Own stage" onAdd={addStage} />
        </div>

        <ol className="stage-list">
          {input.stages.map((s, i) => (
            <li key={s.id} className="stage-edit">
              <div className="stage-edit-head">
                <span className="stage-num">{i + 1}</span>
                <input className="stage-name" value={s.name} maxLength={60} onChange={(e) => setStage(s.id, { name: e.target.value })} />
                <div className="stage-tools">
                  <button className="icon-btn" aria-label="Move up" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp size={16} /></button>
                  <button className="icon-btn" aria-label="Move down" onClick={() => move(i, 1)} disabled={i === input.stages.length - 1}><ArrowDown size={16} /></button>
                  <button className="icon-btn danger" aria-label="Remove stage" onClick={() => set({ stages: input.stages.filter((x) => x.id !== s.id) })}><Trash2 size={16} /></button>
                </div>
              </div>
              <label className="field">
                <span>What this stage should prove</span>
                <input value={s.goal} maxLength={300} placeholder="e.g. Reminders get invoices paid sooner" onChange={(e) => setStage(s.id, { goal: e.target.value })} />
              </label>
              <label className="field">
                <span>Your draft exit criteria (optional)</span>
                <textarea rows={2} value={s.draft} placeholder={"e.g. Beta is stable\nCustomers like it"} onChange={(e) => setStage(s.id, { draft: e.target.value })} />
              </label>
              <WordingCheck draft={s.draft} />
            </li>
          ))}
        </ol>
        {!input.stages.length && <p className="empty">Add a stage from the chips above.</p>}
      </section>

      <section className="card">
        <SectionTitle icon={Cpu} title="Model" note="Muse Glimmer runs free on this site. Other providers use your key." />
        <div className="provider-grid">
          {PROVIDERS.map((p) => (
            <button key={p.id} className={`provider ${provider === p.id ? "on" : ""}`} onClick={() => setProvider(p.id)}>
              <span className="provider-label">{p.label}</span>
              <span className="provider-note">{p.note}</span>
            </button>
          ))}
        </div>
        <div className="two-col">
          <label className="field">
            <span><KeyRound size={13} /> {prov.keyLabel}</span>
            <input type="password" autoComplete="off" value={apiKey} placeholder={provider === "muse" ? "Leave blank to use the free demo" : "Used for this request only, never stored"} onChange={(e) => setApiKey(e.target.value)} />
          </label>
          <label className="field">
            <span>Model id (optional)</span>
            <input value={model} placeholder="Leave blank for the default" onChange={(e) => setModel(e.target.value)} />
          </label>
        </div>
      </section>

      {error && <div className="alert"><AlertTriangle size={18} /> {error}</div>}

      <div className="actions">
        <button className="btn primary" onClick={onRun} disabled={loading}>
          {loading ? <><Loader2 size={18} className="spin" /> Drafting criteria for {input.stages.length} stage{input.stages.length === 1 ? "" : "s"}</> : <><Wand2 size={18} /> Build exit criteria</>}
        </button>
        <button className="btn ghost" onClick={onReset} disabled={loading}>Start over</button>
      </div>
    </>
  );
}

function Step({ icon: Icon, title, text }) {
  return (
    <div className="step">
      <span className="step-icon"><Icon size={18} /></span>
      <span><strong>{title}</strong><br />{text}</span>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, note }) {
  return (
    <div className="section-title">
      <span className="section-icon"><Icon size={18} /></span>
      <div>
        <h2>{title}</h2>
        {note && <p>{note}</p>}
      </div>
    </div>
  );
}

function ChipField({ label, options, value, onChange, multi = false, notes = {} }) {
  const [extra, setExtra] = useState([]);
  const all = [...options, ...extra.filter((e) => !options.includes(e))];
  const selected = multi ? value : [value];
  const toggle = (opt) => {
    if (!multi) return onChange(opt);
    if (opt === "None yet") return onChange(["None yet"]);
    const base = value.filter((v) => v !== "None yet");
    onChange(base.includes(opt) ? base.filter((v) => v !== opt) : [...base, opt]);
  };
  const add = (text) => {
    setExtra((e) => (e.includes(text) ? e : [...e, text]));
    if (multi) onChange([...value.filter((v) => v !== "None yet" && v !== text), text]);
    else onChange(text);
  };
  return (
    <div className="field">
      <span>{label}</span>
      <div className="chip-row">
        {all.map((o) => (
          <button key={o} className={`chip ${selected.includes(o) ? "on" : ""}`} onClick={() => toggle(o)}>
            {selected.includes(o) && <Check size={13} />}
            {o}
            {notes[o] && <em>{notes[o]}</em>}
          </button>
        ))}
        <CustomAdd placeholder="Add your own" onAdd={add} />
      </div>
    </div>
  );
}

function CustomAdd({ placeholder, onAdd }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const submit = () => {
    const t = text.trim().slice(0, 60);
    if (t) onAdd(t);
    setText("");
    setOpen(false);
  };
  if (!open) {
    return (
      <button className="chip dashed" onClick={() => setOpen(true)}>
        <Plus size={13} /> {placeholder}
      </button>
    );
  }
  return (
    <span className="chip-input">
      <input
        autoFocus value={text} maxLength={60} placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") setOpen(false); }}
      />
      <button onClick={submit} aria-label="Add"><Check size={14} /></button>
      <button onClick={() => setOpen(false)} aria-label="Cancel"><X size={14} /></button>
    </span>
  );
}

function WordingCheck({ draft }) {
  const checks = useMemo(
    () => String(draft || "").split(/\n+/).map((l) => l.trim()).filter(Boolean).map(checkWording),
    [draft]
  );
  if (!checks.length) return null;
  return (
    <div className="wording">
      <div className="wording-head"><ScanSearch size={14} /> Wording check <span className="muted">(runs in your browser, no AI)</span></div>
      {checks.map((c, i) => (
        <div key={i} className="wording-row">
          <Verdict v={c.score} small />
          <span className="wording-text">{c.text}</span>
          <div className="issue-row">
            {c.issues.map((iss) => <span key={iss.code} className="issue">{iss.label}</span>)}
          </div>
        </div>
      ))}
    </div>
  );
}

function Verdict({ v, small }) {
  const map = {
    Measurable: { cls: "ok", Icon: CircleCheck },
    Vague: { cls: "warn", Icon: CircleAlert },
    Unmeasurable: { cls: "bad", Icon: CircleX },
  };
  const { cls, Icon } = map[v] || map.Vague;
  return <span className={`verdict ${cls} ${small ? "small" : ""}`}><Icon size={small ? 13 : 15} /> {v}</span>;
}

/* ---------- Result ---------- */

const KIND = {
  Leading: { Icon: TrendingUp, text: "Leading", tip: "Predicts the outcome early" },
  Lagging: { Icon: Flag, text: "Lagging", tip: "Confirms the outcome after the fact" },
  Qualitative: { Icon: MessagesSquare, text: "Qualitative", tip: "Structured evidence with a count" },
};

function ResultView({ result, onBack }) {
  const { input, plan, source } = result;
  const [copied, setCopied] = useState(false);
  const totals = {
    crit: plan.stages.reduce((n, s) => n + s.criteria.length, 0),
    stops: plan.stages.filter((s) => s.stop).length,
    drafts: plan.stages.reduce((n, s) => n + s.drafts.length, 0),
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(planToMarkdown(input, plan));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked */ }
  };

  return (
    <>
      <div className="result-bar">
        <button className="btn ghost" onClick={onBack}><ArrowLeft size={16} /> Edit inputs</button>
        <button className="btn primary" onClick={copy}>{copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy as Markdown</>}</button>
      </div>

      <header className="result-head card tinted">
        <div className="eyebrow"><FileText size={14} /> Exit criteria plan · {source}</div>
        <h1>{input.name}</h1>
        {plan.summary && <p>{plan.summary}</p>}
        <div className="badge-row">
          <span className="badge">{input.productType}</span>
          <span className="badge">{input.risk} risk appetite</span>
          <span className="badge">{plan.stages.length} stages</span>
        </div>
        <div className="stat-row">
          <Stat n={totals.crit} label="exit criteria" icon={ListChecks} />
          <Stat n={totals.stops} label="stop conditions" icon={OctagonX} />
          <Stat n={totals.drafts} label="drafts rewritten" icon={PenLine} />
        </div>
      </header>

      <div className="path">
        {plan.stages.map((s, i) => (
          <React.Fragment key={s.num}>
            <a className="path-step" href={`#stage-${s.num}`}><span>{s.num}</span>{s.name}</a>
            {i < plan.stages.length - 1 && <ArrowRight size={16} className="path-arrow" />}
          </React.Fragment>
        ))}
      </div>

      {plan.stages.map((s) => (
        <section key={s.num} id={`stage-${s.num}`} className="card stage-card">
          <div className="stage-head">
            <span className="stage-big">{s.num}</span>
            <div>
              <h2>{s.name}</h2>
              <p className="goal"><Target size={14} /> {s.goal}</p>
            </div>
          </div>

          <div className="crit-grid">
            {s.criteria.map((c, i) => {
              const K = KIND[c.kind] || KIND.Qualitative;
              return (
                <div key={i} className="crit">
                  <div className="crit-top">
                    <span className="kind" title={K.tip}><K.Icon size={13} /> {K.text}</span>
                  </div>
                  <div className="crit-metric">{c.metric}</div>
                  <div className="threshold">{c.threshold}</div>
                  <div className="crit-meta"><Ruler size={14} /><span>{c.how}</span></div>
                  <div className="crit-meta"><Database size={14} /><span>{c.source}</span></div>
                </div>
              );
            })}
          </div>

          {s.stop && (
            <div className="stop">
              <OctagonX size={18} />
              <div><strong>Stop or pivot if</strong><p>{s.stop}</p></div>
            </div>
          )}

          {s.drafts.length > 0 && (
            <div className="drafts">
              <div className="mini-title"><PenLine size={14} /> Your drafts, rewritten</div>
              {s.drafts.map((d, i) => (
                <div key={i} className="draft">
                  <div className="draft-before"><Verdict v={d.verdict} small /><span>{d.original}</span></div>
                  <ArrowRight size={16} className="draft-arrow" />
                  <div className="draft-after">{d.rewrite}</div>
                </div>
              ))}
            </div>
          )}

          {s.assumption && (
            <div className="assume">
              <Lightbulb size={16} />
              <div><strong>Check against your baseline</strong><p>{s.assumption}</p></div>
            </div>
          )}
        </section>
      ))}

      {plan.gaps.length > 0 && (
        <section className="card gaps">
          <SectionTitle icon={ScanSearch} title="Gaps across the plan" note="Things no single stage covers" />
          <ul className="icon-list">
            {plan.gaps.map((g, i) => <li key={i}><AlertTriangle size={16} /><span>{g}</span></li>)}
          </ul>
        </section>
      )}

      <div className="disclose">
        <Info size={16} />
        <p>Thresholds are starting points suggested by an AI model from what you entered. They are not industry benchmarks and no study sits behind them. Set each one against your own baseline before you commit to it.</p>
      </div>
    </>
  );
}

function Stat({ n, label, icon: Icon }) {
  return (
    <div className="stat">
      <Icon size={18} />
      <span className="stat-n">{n}</span>
      <span className="stat-l">{label}</span>
    </div>
  );
}

/* ---------- How it works ---------- */

function HowView({ onStart }) {
  return (
    <>
      <header className="hero slim">
        <div className="eyebrow"><BookOpen size={14} /> How it works</div>
        <h1>A stage is done when the evidence says so</h1>
        <p>Dates and demos tell you work happened. Exit criteria tell you whether it worked.</p>
      </header>

      <section className="card">
        <SectionTitle icon={CircleCheck} title="What a good exit criterion has" />
        <div className="tile-grid">
          <Tile icon={Ruler} title="A metric" text="Something you can count" />
          <Tile icon={Target} title="A threshold" text="The number that means pass" />
          <Tile icon={Database} title="A source" text="Where the number comes from" />
          <Tile icon={CircleX} title="A way to fail" text="It could come back false" />
        </div>
        <div className="compare">
          <div className="compare-bad"><CircleX size={16} /> Beta is stable</div>
          <ArrowRight size={16} />
          <div className="compare-good"><CircleCheck size={16} /> Under 1% of scheduled reminders fail to send across the beta</div>
        </div>
      </section>

      <section className="card">
        <SectionTitle icon={Route} title="What happens when you press build" />
        <ol className="flow">
          <li><span><ScanSearch size={16} /></span><div><strong>Wording check in your browser</strong><p>Your drafts are scanned for missing numbers, vague words, activities and dates. Fixed rules, no AI.</p></div></li>
          <li><span><Cpu size={16} /></span><div><strong>One model call</strong><p>Your inputs go to the model you picked, through this site's server. The instructions ask for 2 to 4 criteria per stage, a stop condition, rewrites and one assumption.</p></div></li>
          <li><span><ListChecks size={16} /></span><div><strong>Parsed into the plan</strong><p>The model replies in tagged lines, which the app turns into the cards you see.</p></div></li>
        </ol>
      </section>

      <section className="card">
        <SectionTitle icon={Info} title="Where the numbers come from" />
        <ul className="icon-list">
          <li><Lightbulb size={16} /><span>Thresholds are the model's suggestions, shaped by your risk appetite. They are not benchmarks.</span></li>
          <li><Database size={16} /><span>Criteria only lean on the data sources you ticked, plus interviews or a manual count.</span></li>
          <li><ShieldCheck size={16} /><span>No sign-in and no database. Keys you paste are used for one request and never saved.</span></li>
          <li><Cpu size={16} /><span>Muse Glimmer runs free on this site. Anthropic, OpenAI and Gemini need your own key.</span></li>
        </ul>
      </section>

      <div className="actions"><button className="btn primary" onClick={onStart}><Wand2 size={18} /> Build criteria</button></div>
    </>
  );
}

function Tile({ icon: Icon, title, text }) {
  return (
    <div className="tile">
      <span className="tile-icon"><Icon size={18} /></span>
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

/* ---------- Examples ---------- */

function ExamplesView({ onOpen }) {
  return (
    <>
      <header className="hero slim">
        <div className="eyebrow"><Sparkles size={14} /> Examples</div>
        <h1>Three saved plans</h1>
        <p>Open one to see the full result without a key, or load its inputs and run it yourself.</p>
      </header>
      <div className="example-grid">
        {EXAMPLES.map((ex) => (
          <article key={ex.id} className="card example">
            <span className="badge">{ex.tag}</span>
            <h2>{ex.input.name}</h2>
            <p>{ex.blurb}</p>
            <div className="mini-path">
              {ex.input.stages.map((s, i) => (
                <React.Fragment key={i}>
                  <span>{s.name}</span>
                  {i < ex.input.stages.length - 1 && <ArrowRight size={12} />}
                </React.Fragment>
              ))}
            </div>
            <div className="meta-row"><span>{ex.input.risk} risk</span><span>{ex.input.stages.filter((s) => s.draft).length} drafts to fix</span></div>
            <div className="example-actions">
              <button className="btn primary" onClick={() => onOpen(ex, "result")}><FileText size={16} /> Open saved plan</button>
              <button className="btn ghost" onClick={() => onOpen(ex, "inputs")}><PenLine size={16} /> Load inputs</button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
