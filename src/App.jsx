import React, { useMemo, useRef, useState } from 'react';
import {
  FlaskConical, ClipboardList, BookOpen, Lightbulb, Sparkles, Plus, X, Check, Copy,
  Download, Target, ShieldAlert, Compass, Swords, LifeBuoy, Languages, AlertTriangle,
  ChevronDown, Gavel, Telescope, ArrowRight, KeyRound, Cpu, Zap, Phone, FileText, Loader2,
  ListChecks, Scale, Info,
} from 'lucide-react';
import { EXAMPLES } from './examples.js';
import { CATEGORIES, parseKit, kitIsUsable, toCSV, judgePrompt } from './parse.js';

const CAT_ICON = {
  'Core task': Target,
  'Edge case': Compass,
  'Out of scope': ShieldAlert,
  Adversarial: Swords,
  Recovery: LifeBuoy,
  'Language & format': Languages,
};
const EX_ICON = { Zap, Phone, FileText };

const OPTIONS = {
  users: ['Customers', 'Internal staff', 'Developers', 'Patients', 'Students', 'General public'],
  input: ['Free-text chat', 'Voice transcript', 'Documents', 'Structured form', 'Images'],
  output: ['Answers to questions', 'A label or category', 'A summary', 'A drafted message', 'Takes an action'],
  stakes: ['Mild annoyance', 'Money lost', 'Legal or compliance', 'Safety or health'],
  worries: [
    'Invented facts', 'Off-topic drift', 'Refusing valid requests', 'Leaking private data',
    'Prompt injection', 'Bias', 'Wrong language', 'Broken format',
  ],
  languages: ['English', 'Spanish', 'Several languages'],
};

const PROVIDERS = [
  { id: 'muse', label: 'Muse Glimmer', note: 'Free, runs on this site’s key', keyLabel: 'NVIDIA key (optional)' },
  { id: 'anthropic', label: 'Claude', note: 'Your Anthropic key', keyLabel: 'Anthropic API key' },
  { id: 'openai', label: 'OpenAI', note: 'Your OpenAI key', keyLabel: 'OpenAI API key' },
  { id: 'gemini', label: 'Gemini', note: 'Your Gemini key', keyLabel: 'Gemini API key' },
];

const EMPTY_FORM = {
  name: '', description: '', users: [], input: [], output: [], stakes: [],
  worries: [], languages: [], count: 12,
};

const NAV = [
  { id: 'build', label: 'Build a kit', desc: 'Describe your AI feature', icon: FlaskConical },
  { id: 'kit', label: 'Your kit', desc: 'Cases, rubric and export', icon: ClipboardList },
  { id: 'examples', label: 'Examples', desc: 'Three finished kits', icon: Lightbulb },
  { id: 'how', label: 'How it works', desc: 'What an eval is, in plain words', icon: BookOpen },
];

/* ---------- small pieces ---------- */

function ChipRow({ label, hint, options, value, onChange, multi = true }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const selected = Array.isArray(value) ? value : [];
  const all = [...options, ...selected.filter((v) => !options.includes(v))];

  const toggle = (opt) => {
    if (multi) onChange(selected.includes(opt) ? selected.filter((x) => x !== opt) : [...selected, opt]);
    else onChange(selected.includes(opt) ? [] : [opt]);
  };
  const commit = () => {
    const v = draft.trim();
    if (v && !selected.includes(v)) onChange(multi ? [...selected, v] : [v]);
    setDraft('');
    setAdding(false);
  };

  return (
    <div className="field">
      <div className="field-head">
        <span className="field-label">{label}</span>
        {hint && <span className="field-hint">{hint}</span>}
      </div>
      <div className="chips">
        {all.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`chip ${selected.includes(opt) ? 'on' : ''}`}
            onClick={() => toggle(opt)}
          >
            {selected.includes(opt) && <Check size={14} strokeWidth={3} />}
            {opt}
          </button>
        ))}
        {adding ? (
          <span className="chip-add-input">
            <input
              autoFocus
              value={draft}
              placeholder="Type and press Enter"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); commit(); }
                if (e.key === 'Escape') { setAdding(false); setDraft(''); }
              }}
              onBlur={commit}
            />
          </span>
        ) : (
          <button type="button" className="chip chip-add" onClick={() => setAdding(true)}>
            <Plus size={14} strokeWidth={2.5} /> Add your own
          </button>
        )}
      </div>
    </div>
  );
}

function CopyButton({ text, label = 'Copy' }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-ghost"
      onClick={() => {
        const ok = () => { setDone(true); setTimeout(() => setDone(false), 1600); };
        const fallback = () => {
          const t = document.createElement('textarea');
          t.value = text; document.body.appendChild(t); t.select();
          try { document.execCommand('copy'); ok(); } catch (e) { /* ignore */ }
          t.remove();
        };
        if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(ok, fallback);
        else fallback();
      }}
    >
      {done ? <Check size={16} /> : <Copy size={16} />} {done ? 'Copied' : label}
    </button>
  );
}

function download(name, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function slug(s) {
  return (s || 'eval-kit').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'eval-kit';
}

/* ---------- sections ---------- */

function BuildSection({ form, setForm, provider, setProvider, apiKey, setApiKey, onGenerate, loading, error, onExample }) {
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const prov = PROVIDERS.find((p) => p.id === provider);
  const ready = form.description.trim().length >= 20;

  return (
    <div className="section">
      <header className="hero">
        <div className="hero-badge"><FlaskConical size={16} /> Eval Starter Kit</div>
        <h1>Know how your AI feature fails before your users do.</h1>
        <p>Describe the feature. Get a set of test cases with pass and fail rules, ready to run by hand or hand to a model judge.</p>
        <div className="hero-steps">
          <span><span className="step-n">1</span> Describe it</span>
          <ArrowRight size={16} />
          <span><span className="step-n">2</span> Get test cases</span>
          <ArrowRight size={16} />
          <span><span className="step-n">3</span> Run and grade</span>
        </div>
      </header>

      <div className="card">
        <div className="card-title"><Sparkles size={18} /> The feature</div>
        <div className="field">
          <div className="field-head"><span className="field-label">Name</span></div>
          <input className="text" value={form.name} onChange={(e) => set('name')(e.target.value)} placeholder="e.g. Returns assistant" />
        </div>
        <div className="field">
          <div className="field-head">
            <span className="field-label">What it does</span>
            <span className="field-hint">Two or three sentences. What it can see and do matters most.</span>
          </div>
          <textarea
            className="text"
            rows={4}
            value={form.description}
            onChange={(e) => set('description')(e.target.value)}
            placeholder="e.g. A chat assistant on our shop that answers order questions, starts returns and hands over to an agent. It can look up an order after the customer gives the order number and email."
          />
        </div>
        <ChipRow label="Who uses it" options={OPTIONS.users} value={form.users} onChange={set('users')} />
        <ChipRow label="What goes in" options={OPTIONS.input} value={form.input} onChange={set('input')} />
        <ChipRow label="What comes out" options={OPTIONS.output} value={form.output} onChange={set('output')} />
      </div>

      <div className="card">
        <div className="card-title"><AlertTriangle size={18} /> The risks</div>
        <ChipRow label="Cost of a wrong answer" hint="Sets which cases count as launch blockers" options={OPTIONS.stakes} value={form.stakes} onChange={set('stakes')} />
        <ChipRow label="What worries you" hint="The kit leans towards these" options={OPTIONS.worries} value={form.worries} onChange={set('worries')} />
        <ChipRow label="Languages" options={OPTIONS.languages} value={form.languages} onChange={set('languages')} />
        <div className="field">
          <div className="field-head"><span className="field-label">How many cases</span></div>
          <div className="chips">
            {[8, 12, 16].map((n) => (
              <button key={n} type="button" className={`chip ${form.count === n ? 'on' : ''}`} onClick={() => set('count')(n)}>
                {form.count === n && <Check size={14} strokeWidth={3} />}{n} cases
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title"><Cpu size={18} /> The model that writes your kit</div>
        <div className="providers">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`provider ${provider === p.id ? 'on' : ''}`}
              onClick={() => { setProvider(p.id); setApiKey(''); }}
            >
              <span className="provider-name">{p.label}</span>
              <span className="provider-note">{p.note}</span>
            </button>
          ))}
        </div>
        <div className="field">
          <div className="field-head">
            <span className="field-label"><KeyRound size={14} /> {prov.keyLabel}</span>
            <span className="field-hint">Sent once with your request, never stored.</span>
          </div>
          <input
            className="text"
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={provider === 'muse' ? 'Leave blank to use the free model' : 'Paste your key'}
          />
        </div>
      </div>

      {error && (
        <div className="alert"><AlertTriangle size={18} /> <span>{error}</span></div>
      )}

      <div className="actions">
        <button type="button" className="btn btn-primary btn-lg" disabled={!ready || loading} onClick={onGenerate}>
          {loading ? <Loader2 size={18} className="spin" /> : <Sparkles size={18} />}
          {loading ? 'Writing your test cases…' : 'Build my eval kit'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => onExample(EXAMPLES[0])}>
          <Lightbulb size={16} /> Or open a finished example
        </button>
      </div>
      {!ready && <p className="muted small">Add a short description of what the feature does to continue.</p>}
    </div>
  );
}

function CaseCard({ c, open, onToggle }) {
  const Icon = CAT_ICON[c.category] || Target;
  return (
    <div className={`case ${open ? 'open' : ''}`}>
      <button type="button" className="case-head" onClick={onToggle}>
        <span className="case-icon"><Icon size={18} /></span>
        <span className="case-main">
          <span className="case-meta">
            <span className="case-id">{c.id}</span>
            <span className={`pri pri-${c.priority}`}>{c.priority}</span>
            <span className="case-cat">{c.category}</span>
          </span>
          <span className="case-title">{c.title}</span>
        </span>
        <ChevronDown size={18} className="chev" />
      </button>
      {open && (
        <div className="case-body">
          <div className="case-input">
            <span className="mini-label">Send this</span>
            <p>{c.input}</p>
          </div>
          <div className="case-grid">
            <div className="rule">
              <span className="rule-icon"><Target size={16} /></span>
              <div><span className="mini-label">Expected</span><p>{c.expected}</p></div>
            </div>
            <div className="rule pass">
              <span className="rule-icon"><Check size={16} strokeWidth={3} /></span>
              <div><span className="mini-label">Pass if</span><p>{c.passIf}</p></div>
            </div>
            <div className="rule fail">
              <span className="rule-icon"><X size={16} strokeWidth={3} /></span>
              <div><span className="mini-label">Fail if</span><p>{c.failIf}</p></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KitSection({ kit, meta, onGoBuild }) {
  const [cat, setCat] = useState('All');
  const [pri, setPri] = useState('All');
  const [openId, setOpenId] = useState(null);

  if (!kit) {
    return (
      <div className="section">
        <div className="empty">
          <ClipboardList size={40} />
          <h2>No kit yet</h2>
          <p>Build one from your own feature or open a finished example.</p>
          <button type="button" className="btn btn-primary" onClick={onGoBuild}><Sparkles size={16} /> Build a kit</button>
        </div>
      </div>
    );
  }

  const counts = CATEGORIES.map((c) => ({ c, n: kit.cases.filter((x) => x.category === c).length }));
  const max = Math.max(1, ...counts.map((x) => x.n));
  const p0 = kit.cases.filter((x) => x.priority === 'P0').length;
  const covered = counts.filter((x) => x.n > 0).length;
  const shown = kit.cases.filter((x) => (cat === 'All' || x.category === cat) && (pri === 'All' || x.priority === pri));
  const judge = judgePrompt(kit, meta.name);
  const file = slug(meta.name);

  return (
    <div className="section">
      <header className="kit-head">
        <div className="kit-source">
          {meta.source === 'example' ? <><Lightbulb size={14} /> Saved example</> : <><Sparkles size={14} /> Generated with {meta.providerLabel}</>}
        </div>
        <h1>{meta.name || 'Your eval kit'}</h1>
        {kit.summary && <p className="lead">{kit.summary}</p>}
      </header>

      <div className="stats">
        <div className="stat stat-solid"><span className="stat-n">{kit.cases.length}</span><span className="stat-l">test cases</span></div>
        <div className="stat"><span className="stat-n">{p0}</span><span className="stat-l">launch blockers (P0)</span></div>
        <div className="stat"><span className="stat-n">{covered}/6</span><span className="stat-l">categories covered</span></div>
      </div>

      {kit.risk && (
        <div className="callout">
          <span className="callout-icon"><Target size={20} /></span>
          <div><span className="mini-label">Test this first</span><p>{kit.risk}</p></div>
        </div>
      )}

      <div className="card">
        <div className="card-title"><ListChecks size={18} /> Where the cases sit</div>
        <div className="bars">
          {counts.map(({ c, n }) => {
            const Icon = CAT_ICON[c];
            return (
              <button key={c} type="button" className={`bar-row ${cat === c ? 'on' : ''}`} onClick={() => setCat(cat === c ? 'All' : c)}>
                <span className="bar-label"><Icon size={15} /> {c}</span>
                <span className="bar-track"><span className="bar-fill" style={{ width: `${(n / max) * 100}%` }} /></span>
                <span className="bar-n">{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="filters">
        <div className="chips">
          {['All', ...CATEGORIES].map((c) => (
            <button key={c} type="button" className={`chip chip-sm ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
        <div className="chips">
          {['All', 'P0', 'P1', 'P2'].map((p) => (
            <button key={p} type="button" className={`chip chip-sm ${pri === p ? 'on' : ''}`} onClick={() => setPri(p)}>{p === 'All' ? 'Any priority' : p}</button>
          ))}
        </div>
      </div>

      <div className="cases">
        {shown.map((c) => (
          <CaseCard key={c.id} c={c} open={openId === c.id} onToggle={() => setOpenId(openId === c.id ? null : c.id)} />
        ))}
        {shown.length === 0 && <p className="muted">No cases match these filters.</p>}
      </div>

      <div className="card">
        <div className="card-title"><Gavel size={18} /> Rules for the model judge</div>
        <ul className="ticks">
          {kit.judge.map((j, i) => (
            <li key={i}><span className="tick"><Scale size={14} /></span><span>{j}</span></li>
          ))}
        </ul>
        <details className="judge-details">
          <summary>See the full judge prompt</summary>
          <pre>{judge}</pre>
        </details>
        <div className="row-actions"><CopyButton text={judge} label="Copy judge prompt" /></div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-title"><Telescope size={18} /> What this kit misses</div>
          <ul className="ticks">
            {kit.gaps.map((g, i) => (
              <li key={i}><span className="tick"><Info size={14} /></span><span>{g}</span></li>
            ))}
          </ul>
        </div>
        {kit.next && (
          <div className="card card-solid">
            <div className="card-title"><ArrowRight size={18} /> Next step</div>
            <p>{kit.next}</p>
          </div>
        )}
      </div>

      <div className="card export">
        <div>
          <div className="card-title"><Download size={18} /> Take it with you</div>
          <p className="muted small">The CSV has empty result and notes columns so you can grade as you go in a spreadsheet.</p>
        </div>
        <div className="row-actions">
          <button type="button" className="btn btn-primary" onClick={() => download(`${file}.csv`, toCSV(kit), 'text/csv')}><Download size={16} /> CSV</button>
          <button type="button" className="btn btn-ghost" onClick={() => download(`${file}.json`, JSON.stringify({ feature: meta.name, ...kit }, null, 2), 'application/json')}><Download size={16} /> JSON</button>
        </div>
      </div>
    </div>
  );
}

function ExamplesSection({ onOpen }) {
  return (
    <div className="section">
      <header className="kit-head">
        <h1>Finished examples</h1>
        <p className="lead">Three kits built with this tool, saved so you can see the output without an API key. Open one to browse it, or load its description into the builder and change it.</p>
      </header>
      <div className="ex-grid">
        {EXAMPLES.map((ex) => {
          const Icon = EX_ICON[ex.icon] || Lightbulb;
          const kit = parseKit(ex.output);
          const p0 = kit.cases.filter((c) => c.priority === 'P0').length;
          return (
            <div key={ex.key} className="ex-card">
              <span className="ex-icon"><Icon size={22} /></span>
              <h3>{ex.label}</h3>
              <p>{ex.blurb}</p>
              <div className="ex-tags">
                <span className="tag">{kit.cases.length} cases</span>
                <span className="tag">{p0} blockers</span>
              </div>
              <div className="ex-actions">
                <button type="button" className="btn btn-primary" onClick={() => onOpen(ex, 'kit')}><ClipboardList size={16} /> Open kit</button>
                <button type="button" className="btn btn-ghost" onClick={() => onOpen(ex, 'build')}>Edit inputs</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HowSection() {
  const cats = [
    ['Core task', 'The job it exists to do, done well.'],
    ['Edge case', 'Typos, vague requests, odd formats.'],
    ['Out of scope', 'Things it should decline or redirect.'],
    ['Adversarial', 'Someone trying to misuse it.'],
    ['Recovery', 'A tool breaks or the user says it was wrong.'],
    ['Language & format', 'Language switches, length, layout.'],
  ];
  return (
    <div className="section">
      <header className="kit-head">
        <h1>How it works</h1>
        <p className="lead">An eval is a list of messages you send to your AI feature, each with a rule for what a good reply looks like. You run them before launch and after every change, so you see what broke.</p>
      </header>

      <div className="how-steps">
        <div className="how-step"><span className="how-n">1</span><div><h3>You describe the feature</h3><p>What it does, who uses it, and what worries you.</p></div></div>
        <div className="how-step"><span className="how-n">2</span><div><h3>A model writes the cases</h3><p>Each one has a test message, the expected behaviour, and clear pass and fail conditions.</p></div></div>
        <div className="how-step"><span className="how-n">3</span><div><h3>You run them</h3><p>Send each message to your feature. Grade by hand, or paste the judge prompt into another model.</p></div></div>
      </div>

      <div className="card">
        <div className="card-title"><ListChecks size={18} /> Six kinds of case</div>
        <div className="cat-grid">
          {cats.map(([c, d]) => {
            const Icon = CAT_ICON[c];
            return (
              <div key={c} className="cat-tile"><span className="cat-icon"><Icon size={18} /></span><div><strong>{c}</strong><p>{d}</p></div></div>
            );
          })}
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-title"><Target size={18} /> Priorities</div>
          <ul className="ticks">
            <li><span className="pri pri-P0">P0</span><span>Would stop launch: safety, privacy, money, invented facts.</span></li>
            <li><span className="pri pri-P1">P1</span><span>Would erode trust or create support tickets.</span></li>
            <li><span className="pri pri-P2">P2</span><span>Polish.</span></li>
          </ul>
        </div>
        <div className="card">
          <div className="card-title"><Info size={18} /> Where the output comes from</div>
          <ul className="ticks">
            <li><span className="tick"><Cpu size={14} /></span><span>Cases are written by the model you pick, from your description only.</span></li>
            <li><span className="tick"><ShieldAlert size={14} /></span><span>Nothing is run against your real system. Treat the kit as a first draft to edit.</span></li>
            <li><span className="tick"><KeyRound size={14} /></span><span>Nothing is stored. Keys go with one request and are dropped.</span></li>
            <li><span className="tick"><Lightbulb size={14} /></span><span>Examples use fictional companies and saved model output.</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ---------- app ---------- */

export default function App() {
  const [section, setSection] = useState('build');
  const [form, setForm] = useState(EMPTY_FORM);
  const [provider, setProvider] = useState('muse');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [kit, setKit] = useState(null);
  const [meta, setMeta] = useState({});
  const mainRef = useRef(null);

  const go = (id) => {
    setSection(id);
    mainRef.current?.scrollTo({ top: 0 });
  };

  const openExample = (ex, target = 'kit') => {
    setForm({ ...EMPTY_FORM, ...ex.form });
    setKit(parseKit(ex.output));
    setMeta({ name: ex.form.name, source: 'example' });
    setError('');
    go(target);
  };

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form, provider, apiKey }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 404) throw new Error('Live generation runs on the deployed site. Open an example to see a finished kit.');
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.');
      const parsed = parseKit(data.text);
      if (!kitIsUsable(parsed)) throw new Error('The model replied in a shape this tool could not read. Try again, or pick another model.');
      setKit(parsed);
      setMeta({ name: form.name, source: 'live', providerLabel: PROVIDERS.find((p) => p.id === provider).label });
      go('kit');
    } catch (e) {
      setError(
        e.message === 'Failed to fetch'
          ? 'Could not reach the server. The examples still work offline.'
          : e.message
      );
    } finally {
      setLoading(false);
    }
  };

  const nav = useMemo(() => NAV, []);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark"><FlaskConical size={20} /></span>
          <div>
            <div className="brand-name">Eval Starter Kit</div>
            <div className="brand-sub">Test cases for AI features</div>
          </div>
        </div>
        <nav>
          {nav.map((n) => {
            const Icon = n.icon;
            return (
              <button key={n.id} type="button" className={`nav-item ${section === n.id ? 'on' : ''}`} onClick={() => go(n.id)}>
                <span className="nav-icon"><Icon size={18} /></span>
                <span className="nav-text">
                  <span className="nav-label">
                    {n.label}
                    {n.id === 'kit' && kit && <span className="nav-count">{kit.cases.length}</span>}
                  </span>
                  <span className="nav-desc">{n.desc}</span>
                </span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          <span>Part of the daily AI builds series</span>
        </div>
      </aside>

      <main className="main" ref={mainRef}>
        {section === 'build' && (
          <BuildSection
            form={form} setForm={setForm} provider={provider} setProvider={setProvider}
            apiKey={apiKey} setApiKey={setApiKey} onGenerate={generate} loading={loading}
            error={error} onExample={(ex) => openExample(ex, 'kit')}
          />
        )}
        {section === 'kit' && <KitSection kit={kit} meta={meta} onGoBuild={() => go('build')} />}
        {section === 'examples' && <ExamplesSection onOpen={openExample} />}
        {section === 'how' && <HowSection />}
      </main>
    </div>
  );
}
