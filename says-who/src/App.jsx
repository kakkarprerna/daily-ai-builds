import { useMemo, useState } from 'react';
import {
  Search, BookOpen, Info, KeyRound, MessageCircleQuestion, ShieldAlert, CheckCircle2,
  XCircle, Quote, Stethoscope, Sparkles, Loader2, Plus, ArrowRight, Users, Globe2,
  Baby, Tag, Lightbulb, CircleHelp, Siren, ScrollText, ExternalLink, FlaskConical, Lock,
} from 'lucide-react';
import { parseResult } from './parse.js';
import { AGE_BANDS, RULES, matchRules, looksUrgent } from './rules.js';
import { EXAMPLES } from './examples.js';

const SOURCES = ['Grandparent or relative', 'Friend', 'Online forum', 'Social media', 'AI chatbot', 'Book', 'Healthcare professional'];
const TOPICS = ['Sleep', 'Feeding', 'Weaning and solids', 'Crying and settling', 'Illness', 'Development', 'Safety', 'Screens', 'Behaviour'];
const COUNTRIES = ['Spain', 'United Kingdom', 'United States', 'Other'];

const PROVIDERS = [
  { id: 'muse', name: 'Muse Glimmer', sub: 'Free default, no key needed', needsKey: false },
  { id: 'anthropic', name: 'Anthropic', sub: 'Bring your own key', needsKey: true },
  { id: 'openai', name: 'OpenAI', sub: 'Bring your own key', needsKey: true },
  { id: 'gemini', name: 'Gemini', sub: 'Bring your own key', needsKey: true },
];

const NAV = [
  { id: 'check', label: 'Check advice', desc: 'Paste a tip and see what health bodies say', icon: Search },
  { id: 'examples', label: 'Examples', desc: 'Three saved checks you can open', icon: BookOpen },
  { id: 'how', label: 'How it works', desc: 'Where answers come from, and the safety rules', icon: Info },
  { id: 'model', label: 'Model & key', desc: 'Free default, or bring your own key', icon: KeyRound },
];

const BODY_LINKS = [
  { name: 'WHO', full: 'World Health Organization', url: 'https://www.who.int' },
  { name: 'NHS', full: 'NHS Start for Life and baby pages', url: 'https://www.nhs.uk/baby/' },
  { name: 'AAP', full: 'American Academy of Pediatrics, HealthyChildren.org', url: 'https://www.healthychildren.org' },
  { name: 'AEP', full: 'Asociación Española de Pediatría, En Familia', url: 'https://enfamilia.aeped.es' },
];

const VERDICT_STYLE = {
  'Well supported': { tone: 'good', icon: CheckCircle2 },
  'Mostly supported': { tone: 'good', icon: CheckCircle2 },
  Mixed: { tone: 'warn', icon: CircleHelp },
  Outdated: { tone: 'warn', icon: ScrollText },
  'Not supported': { tone: 'bad', icon: XCircle },
  Unsafe: { tone: 'bad', icon: ShieldAlert },
};

const STANCE_TONE = { Agrees: 'good', Partly: 'warn', Disagrees: 'bad', 'No clear position': 'neutral' };

const EMPTY = { advice: '', source: '', age: '', topic: '', country: 'Spain', notes: '' };

export default function App() {
  const [view, setView] = useState('check');
  const [form, setForm] = useState(EMPTY);
  const [custom, setCustom] = useState({ source: [], age: [], topic: [], country: [] });
  const [provider, setProvider] = useState('muse');
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [savedFrom, setSavedFrom] = useState(null);

  const urgentLive = useMemo(() => looksUrgent(`${form.advice} ${form.notes}`), [form.advice, form.notes]);
  const ruleHits = useMemo(() => matchRules(`${form.advice} ${form.notes}`, form.age), [form.advice, form.notes, form.age]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const addCustom = (key, value) => {
    setCustom((c) => (c[key].includes(value) ? c : { ...c, [key]: [...c[key], value] }));
    set(key, value);
  };

  async function runCheck() {
    const chosen = PROVIDERS.find((p) => p.id === provider);
    if (chosen.needsKey && !apiKey.trim()) {
      setError(`Add your ${chosen.name} key under Model & key, or switch back to the free default.`);
      return;
    }
    setStatus('loading');
    setError('');
    setResult(null);
    setSavedFrom(null);
    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, provider, apiKey: chosen.needsKey ? apiKey.trim() : '' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setResult(parseResult(data.text));
      setStatus('done');
    } catch (e) {
      setError(e.message || 'Something went wrong. Try again in a moment.');
      setStatus('idle');
    }
  }

  function openExample(ex) {
    setForm(ex.input);
    setResult(parseResult(ex.saved));
    setSavedFrom(ex.title);
    setError('');
    setStatus('done');
    setView('check');
  }

  function reset() {
    setForm(EMPTY);
    setResult(null);
    setSavedFrom(null);
    setError('');
    setStatus('idle');
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><MessageCircleQuestion size={22} /></div>
          <div>
            <div className="brand-name">Says Who?</div>
            <div className="brand-sub">Baby and toddler advice, checked</div>
          </div>
        </div>
        <nav className="nav">
          {NAV.map((n) => {
            const Icon = n.icon;
            return (
              <button key={n.id} className={`nav-item ${view === n.id ? 'active' : ''}`} onClick={() => setView(n.id)}>
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
          <Lock size={14} />
          <span>No sign-in. Nothing you type is stored.</span>
        </div>
      </aside>

      <main className="main">
        <div className="main-inner">
          {view === 'check' && (
            <CheckView
              form={form} set={set} custom={custom} addCustom={addCustom}
              urgentLive={urgentLive} ruleHits={ruleHits}
              status={status} error={error} result={result} savedFrom={savedFrom}
              runCheck={runCheck} reset={reset}
              providerName={PROVIDERS.find((p) => p.id === provider).name}
              goModel={() => setView('model')}
            />
          )}
          {view === 'examples' && <ExamplesView openExample={openExample} />}
          {view === 'how' && <HowView />}
          {view === 'model' && (
            <ModelView provider={provider} setProvider={setProvider} apiKey={apiKey} setApiKey={setApiKey} />
          )}
        </div>
      </main>
    </div>
  );
}

/* ---------- Check ---------- */

function CheckView({ form, set, custom, addCustom, urgentLive, ruleHits, status, error, result, savedFrom, runCheck, reset, providerName, goModel }) {
  const canRun = form.advice.trim().length >= 8 && status !== 'loading';
  return (
    <>
      <header className="page-head">
        <span className="eyebrow"><Sparkles size={14} /> For parents of 0 to 3s</span>
        <h1>Heard a tip? See what the health bodies actually say.</h1>
        <p className="lede">Paste advice from a relative, a forum or an AI chatbot. Says Who? compares it with WHO, NHS, AAP and Spain's AEP, and shows where they agree.</p>
      </header>

      {urgentLive && <UrgentBanner />}

      <section className="card form-card">
        <label className="field-label" htmlFor="advice"><Quote size={16} /> The advice</label>
        <textarea
          id="advice"
          rows={4}
          placeholder="e.g. Give her a little water when it's hot, she's only 3 months but she must be thirsty."
          value={form.advice}
          onChange={(e) => set('advice', e.target.value)}
          maxLength={1500}
        />

        <ChipRow icon={Users} label="Where you heard it" options={[...SOURCES, ...custom.source]} value={form.source} onPick={(v) => set('source', v)} onAdd={(v) => addCustom('source', v)} />
        <ChipRow icon={Baby} label="Child's age" options={[...AGE_BANDS.map((b) => b.label), ...custom.age]} value={form.age} onPick={(v) => set('age', v)} onAdd={(v) => addCustom('age', v)} />
        <ChipRow icon={Tag} label="Topic (optional)" options={[...TOPICS, ...custom.topic]} value={form.topic} onPick={(v) => set('topic', v)} onAdd={(v) => addCustom('topic', v)} />
        <ChipRow icon={Globe2} label="Where you live" options={[...COUNTRIES, ...custom.country]} value={form.country} onPick={(v) => set('country', v)} onAdd={(v) => addCustom('country', v)} />

        <label className="field-label" htmlFor="notes"><Lightbulb size={16} /> Anything else (optional)</label>
        <input id="notes" className="text-input" placeholder="e.g. She was born 5 weeks early" value={form.notes} onChange={(e) => set('notes', e.target.value)} maxLength={600} />

        <div className="actions">
          <button className="btn primary" disabled={!canRun} onClick={runCheck}>
            {status === 'loading' ? <Loader2 className="spin" size={18} /> : <Search size={18} />}
            {status === 'loading' ? 'Checking' : 'Check this advice'}
          </button>
          {(form.advice || result) && <button className="btn ghost" onClick={reset}>Start again</button>}
          <button className="model-pill" onClick={goModel}><KeyRound size={14} /> {providerName}</button>
        </div>
        {error && <div className="error"><XCircle size={16} /> {error}</div>}
      </section>

      {ruleHits.length > 0 && <RuleHits hits={ruleHits} />}

      {status === 'loading' && (
        <section className="card loading-card">
          <Loader2 className="spin" size={22} />
          <div>
            <strong>Comparing with WHO, NHS, AAP and AEP</strong>
            <span>This usually takes 10 to 20 seconds.</span>
          </div>
        </section>
      )}

      {result && <ResultView result={result} savedFrom={savedFrom} />}
    </>
  );
}

function ChipRow({ icon: Icon, label, options, value, onPick, onAdd }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const commit = () => {
    const v = draft.trim();
    if (v) onAdd(v);
    setDraft('');
    setAdding(false);
  };
  return (
    <div className="chip-block">
      <div className="field-label"><Icon size={16} /> {label}</div>
      <div className="chips">
        {options.map((o) => (
          <button key={o} className={`chip ${value === o ? 'on' : ''}`} onClick={() => onPick(value === o ? '' : o)}>{o}</button>
        ))}
        {adding ? (
          <span className="chip-add-input">
            <input
              autoFocus value={draft} maxLength={50} placeholder="Type and press Enter"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setAdding(false); }}
              onBlur={commit}
            />
          </span>
        ) : (
          <button className="chip add" onClick={() => setAdding(true)}><Plus size={14} /> Add your own</button>
        )}
      </div>
    </div>
  );
}

function UrgentBanner({ note }) {
  return (
    <section className="urgent">
      <Siren size={22} />
      <div>
        <strong>If your child seems unwell right now, don't wait for this check.</strong>
        <span>{note || 'Call 112 in Spain and the EU, 999 in the UK or 911 in the US, or your local emergency number.'}</span>
      </div>
    </section>
  );
}

function RuleHits({ hits }) {
  return (
    <section className="card rules-card">
      <div className="section-title"><ShieldAlert size={18} /> Safety rules this touches</div>
      <p className="muted small">Fixed checks that run without any AI model. They match words in what you typed, so treat them as a prompt to read, not a verdict.</p>
      <div className="rule-list">
        {hits.map((r) => (
          <div key={r.id} className="rule">
            <div className="rule-head"><ShieldAlert size={16} /> {r.title}</div>
            <p>{r.note}</p>
            <span className="rule-src">{r.bodies}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ResultView({ result, savedFrom }) {
  const style = VERDICT_STYLE[result.verdict] || VERDICT_STYLE.Mixed;
  const VIcon = style.icon;
  const confLevel = { High: 3, Medium: 2, Low: 1 }[result.confidence] || 1;
  return (
    <section className="result">
      {result.urgent && <UrgentBanner note={result.urgentNote} />}

      <div className={`verdict-card tone-${style.tone}`}>
        <div className="verdict-top">
          <span className="verdict-icon"><VIcon size={26} /></span>
          <div>
            <div className="verdict-label">Verdict</div>
            <div className="verdict-text">{result.verdict}</div>
          </div>
          <div className="conf">
            <div className="conf-label">Confidence</div>
            <div className="conf-bars">{[1, 2, 3].map((i) => <span key={i} className={i <= confLevel ? 'on' : ''} />)}</div>
            <div className="conf-text">{result.confidence}</div>
          </div>
        </div>
        {result.headline && <p className="headline">{result.headline}</p>}
        {savedFrom && <span className="saved-badge"><BookOpen size={13} /> Saved example: {savedFrom}</span>}
      </div>

      <div className="split">
        <ListCard title="What holds up" icon={CheckCircle2} tone="good" items={result.trueParts} empty="Nothing in this tip lines up with the guidance." />
        <ListCard title="What doesn't" icon={XCircle} tone="bad" items={result.wrongParts} empty="No problems found with this tip." />
      </div>

      {result.positions.length > 0 && (
        <div className="card">
          <div className="section-title"><Users size={18} /> Where each body stands</div>
          <div className="positions">
            {result.positions.map((p, i) => (
              <div key={i} className="position">
                <div className="position-head">
                  <span className="body-badge">{p.body}</span>
                  <span className={`stance tone-${STANCE_TONE[p.stance]}`}>{p.stance}</span>
                </div>
                <p>{p.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.safer && (
        <div className="card safer">
          <div className="section-title"><Quote size={18} /> How current guidance would put it</div>
          <p className="safer-text">{result.safer}</p>
        </div>
      )}

      <div className="split">
        {result.why && (
          <div className="card">
            <div className="section-title"><MessageCircleQuestion size={18} /> Why you hear it</div>
            <p>{result.why}</p>
          </div>
        )}
        {result.ask.length > 0 && (
          <ListCard title="Ask your paediatrician if" icon={Stethoscope} tone="brand" items={result.ask} />
        )}
      </div>

      <div className="disclosure">
        <FlaskConical size={16} />
        <p>
          <strong>Where this comes from.</strong> An AI model compares the tip with what it knows of published guidance from WHO, NHS, AAP and AEP. It doesn't look pages up live, so it can be out of date or wrong. {result.limits} This is a starting point for a conversation with your paediatrician or nurse, never a replacement for one.
        </p>
      </div>
    </section>
  );
}

function ListCard({ title, icon: Icon, tone, items, empty }) {
  return (
    <div className="card">
      <div className="section-title"><Icon size={18} /> {title}</div>
      {items.length === 0 ? (
        <p className="muted">{empty}</p>
      ) : (
        <ul className="icon-list">
          {items.map((t, i) => (
            <li key={i}><span className={`li-icon tone-${tone}`}><Icon size={15} /></span><span>{t}</span></li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------- Examples ---------- */

function ExamplesView({ openExample }) {
  return (
    <>
      <header className="page-head">
        <span className="eyebrow"><BookOpen size={14} /> Worked examples</span>
        <h1>Three tips, already checked</h1>
        <p className="lede">Open one to see the full result. These are saved, so they work without a model or a key.</p>
      </header>
      <div className="example-grid">
        {EXAMPLES.map((ex) => {
          const style = VERDICT_STYLE[ex.verdictHint];
          const VIcon = style.icon;
          return (
            <button key={ex.id} className="card example" onClick={() => openExample(ex)}>
              <span className={`stance tone-${style.tone}`}><VIcon size={13} /> {ex.verdictHint}</span>
              <h3>{ex.title}</h3>
              <p className="example-quote">"{ex.input.advice}"</p>
              <div className="example-meta">
                <span><Users size={13} /> {ex.input.source}</span>
                <span><Baby size={13} /> {ex.input.age}</span>
                <span><Globe2 size={13} /> {ex.input.country}</span>
              </div>
              <span className="example-open">Open this check <ArrowRight size={15} /></span>
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ---------- How it works ---------- */

function HowView() {
  const steps = [
    { icon: Quote, title: 'You paste a tip', text: 'Add who said it, your child’s age and where you live.' },
    { icon: ShieldAlert, title: 'Fixed rules run first', text: 'Fourteen known safety rules check your words in the browser, with no AI.' },
    { icon: Users, title: 'A model compares', text: 'It sets the tip against WHO, NHS, AAP and AEP, and flags where they differ.' },
    { icon: Stethoscope, title: 'You take it further', text: 'You get a clearer version of the advice and what to ask your paediatrician.' },
  ];
  return (
    <>
      <header className="page-head">
        <span className="eyebrow"><Info size={14} /> How it works</span>
        <h1>Four steps, nothing stored</h1>
      </header>

      <div className="steps">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="card step">
              <span className="step-num">{i + 1}</span>
              <span className="step-icon"><Icon size={20} /></span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="section-title"><Globe2 size={18} /> The bodies it compares against</div>
        <div className="body-links">
          {BODY_LINKS.map((b) => (
            <a key={b.name} href={b.url} target="_blank" rel="noreferrer" className="body-link">
              <span className="body-badge">{b.name}</span>
              <span>{b.full}</span>
              <ExternalLink size={14} />
            </a>
          ))}
        </div>
        <p className="muted small">The model answers from what it learned about these bodies' published guidance. It doesn't fetch their pages live, so check the source for anything you plan to act on.</p>
      </div>

      <div className="card">
        <div className="section-title"><ShieldAlert size={18} /> The fixed safety rules</div>
        <p className="muted small">Each rule matches words in your text and applies only below a set age. They run in your browser and never call a model.</p>
        <div className="rule-table">
          {RULES.map((r) => (
            <div key={r.id} className="rule-row">
              <span className="rule-row-title">{r.title}</span>
              <span className="rule-row-age">until {r.untilMonths >= 36 ? '3 years+' : `${r.untilMonths} months`}</span>
              <span className="rule-row-src">{r.bodies}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="section-title"><XCircle size={18} /> What it won't do</div>
        <ul className="icon-list">
          {['Diagnose a symptom or tell you what is wrong', 'Give medicine doses', 'Replace your paediatrician, nurse or health visitor', 'Keep anything you type'].map((t) => (
            <li key={t}><span className="li-icon tone-bad"><XCircle size={15} /></span><span>{t}</span></li>
          ))}
        </ul>
      </div>
    </>
  );
}

/* ---------- Model ---------- */

function ModelView({ provider, setProvider, apiKey, setApiKey }) {
  const chosen = PROVIDERS.find((p) => p.id === provider);
  return (
    <>
      <header className="page-head">
        <span className="eyebrow"><KeyRound size={14} /> Model & key</span>
        <h1>Pick the model that runs your check</h1>
        <p className="lede">The free default works with no key. If you'd rather use another provider, paste your own key below.</p>
      </header>
      <div className="provider-grid">
        {PROVIDERS.map((p) => (
          <button key={p.id} className={`card provider ${provider === p.id ? 'on' : ''}`} onClick={() => setProvider(p.id)}>
            <span className="provider-name">{p.name}</span>
            <span className="muted small">{p.sub}</span>
            {provider === p.id && <CheckCircle2 className="provider-tick" size={18} />}
          </button>
        ))}
      </div>
      {chosen.needsKey && (
        <div className="card">
          <label className="field-label" htmlFor="key"><KeyRound size={16} /> Your {chosen.name} key</label>
          <input id="key" type="password" className="text-input" placeholder="Paste your key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} autoComplete="off" />
          <p className="muted small">Your key is kept in this tab only. It passes through the app's server for each check and is never saved or logged.</p>
        </div>
      )}
    </>
  );
}
