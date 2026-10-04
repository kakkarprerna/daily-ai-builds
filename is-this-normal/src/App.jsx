import React, { useMemo, useRef, useState } from 'react';
import {
  Baby, Stethoscope, BookOpen, Library, Sparkles, Plus, Check, X, KeyRound,
  ShieldCheck, Footprints, MessagesSquare, CircleAlert, CircleCheck, Eye,
  Lightbulb, Building2, HelpCircle, Info, Siren, ArrowRight, RotateCcw,
  Quote, Lock, Scale, Loader2, ChevronRight, Phone,
} from 'lucide-react';
import { EXAMPLES } from './examples.js';
import {
  parseResult, applyOverrides, urgentScan, WHO_TO_ASK, EMERGENCY_NUMBERS,
} from './rules.js';

const ICONS = { Footprints, MessagesSquare, CircleAlert };

const AGES = ['0 to 6 months', '6 to 12 months', '12 to 18 months', '18 to 24 months', '2 years', '3 years', '4 years', '5 years', '6 to 8 years', '9 to 12 years'];
const AREAS = ['Movement', 'Speech and language', 'Social and play', 'Behaviour and feelings', 'Sleep', 'Eating', 'Toilet training', 'Learning and attention'];
const DURATIONS = ['A few days', 'A few weeks', 'One to three months', 'A few months', 'As long as I can remember'];
const DIRECTIONS = ['Slowly getting better', 'Staying the same', 'Getting worse', 'Comes and goes'];
const CHANGES = ['New sibling', 'House move', 'Moved country', 'New nursery or school', 'New language at home or nursery', 'Recent illness', 'Family stress'];
const COUNTRIES = ['Spain', 'UK', 'US', 'Other'];

const PROVIDERS = [
  { id: 'glimmer', label: 'Muse Glimmer', note: 'Default. No key needed.' },
  { id: 'anthropic', label: 'Anthropic', note: 'Your key' },
  { id: 'openai', label: 'OpenAI', note: 'Your key' },
  { id: 'gemini', label: 'Gemini', note: 'Your key' },
];

const NAV = [
  { id: 'check', label: 'Check a moment', desc: 'Describe what you noticed', icon: Stethoscope },
  { id: 'examples', label: 'Examples', desc: 'Three saved checks, no key', icon: Sparkles },
  { id: 'how', label: 'How it works', desc: 'What it does and does not do', icon: BookOpen },
  { id: 'sources', label: 'Sources', desc: 'The guidance behind every answer', icon: Library },
];

const EMPTY = {
  age: '', area: '', noticed: '', duration: '', direction: '',
  regression: false, changes: [], languages: '', country: 'Spain',
};

function ChipRow({ label, hint, options, value, onChange, multi = false }) {
  const [extra, setExtra] = useState([]);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const all = [...options, ...extra];
  const isOn = (o) => (multi ? value.includes(o) : value === o);
  const toggle = (o) => {
    if (multi) onChange(isOn(o) ? value.filter((v) => v !== o) : [...value, o]);
    else onChange(isOn(o) ? '' : o);
  };
  const commit = () => {
    const v = draft.trim();
    if (v) {
      if (!all.includes(v)) setExtra([...extra, v]);
      if (!isOn(v)) toggle(v);
    }
    setDraft('');
    setAdding(false);
  };
  return (
    <div className="field">
      <div className="field-label">{label}{hint && <span className="hint">{hint}</span>}</div>
      <div className="chips">
        {all.map((o) => (
          <button type="button" key={o} className={`chip ${isOn(o) ? 'on' : ''}`} onClick={() => toggle(o)}>
            {isOn(o) && <Check size={14} />} {o}
          </button>
        ))}
        {adding ? (
          <span className="chip-input">
            <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } if (e.key === 'Escape') setAdding(false); }}
              placeholder="Type your own" />
            <button type="button" onClick={commit} aria-label="Add"><Check size={14} /></button>
            <button type="button" onClick={() => setAdding(false)} aria-label="Cancel"><X size={14} /></button>
          </span>
        ) : (
          <button type="button" className="chip add" onClick={() => setAdding(true)}><Plus size={14} /> Add your own</button>
        )}
      </div>
    </div>
  );
}

const VERDICT_STYLE = {
  'Typical': { cls: 'v-ok', icon: CircleCheck, line: 'Within the range the guidance describes' },
  'Worth watching': { cls: 'v-watch', icon: Eye, line: 'Inside the range, with something to keep an eye on' },
  'Check with a professional': { cls: 'v-check', icon: Stethoscope, line: 'Worth booking an appointment' },
};

function Section({ icon: Icon, title, items, variant }) {
  if (!items || !items.length) return null;
  return (
    <div className={`rcard ${variant || ''}`}>
      <div className="rcard-head"><span className="ricon"><Icon size={18} /></span>{title}</div>
      <ul className="vlist">
        {items.map((t, i) => (
          <li key={i}><span className="vnum">{i + 1}</span><span>{t}</span></li>
        ))}
      </ul>
    </div>
  );
}

function Result({ result, form, onReset, fromExample }) {
  const v = VERDICT_STYLE[result.verdict] || VERDICT_STYLE['Worth watching'];
  const VIcon = v.icon;
  const who = WHO_TO_ASK[form.country] || WHO_TO_ASK.Other;
  return (
    <div className="result">
      {fromExample && <div className="ribbon"><Sparkles size={14} /> Saved worked example. No model was called.</div>}
      <div className={`verdict ${v.cls}`}>
        <div className="verdict-top">
          <span className="verdict-icon"><VIcon size={26} /></span>
          <div>
            <div className="verdict-label">{result.verdict}</div>
            <div className="verdict-line">{v.line}</div>
          </div>
          {result.confidence && <span className="conf">{result.confidence} confidence</span>}
        </div>
        {result.summary && <p className="verdict-summary">{result.summary}</p>}
        {result.range && (
          <div className="range"><Scale size={16} /><span><b>Typical range.</b> {result.range}</span></div>
        )}
        {result.overridden && (
          <div className="override"><ShieldCheck size={16} /> You said your child lost a skill they had. The rules set this verdict to "Check with a professional" whatever the model returned.</div>
        )}
      </div>

      {result.says.length > 0 && (
        <div className="rcard">
          <div className="rcard-head"><span className="ricon"><Quote size={18} /></span>What the official bodies say</div>
          <div className="says">
            {result.says.map((s, i) => (
              <div className="say" key={i}><span className="say-body">{s.body}</span><p>{s.text}</p></div>
            ))}
          </div>
        </div>
      )}

      <Section icon={Lightbulb} title="Why this verdict" items={result.why} />
      <div className="two">
        <Section icon={Baby} title="Try at home" items={result.tryList} />
        <Section icon={Eye} title="Watch for" items={result.watch} />
      </div>
      <Section icon={Stethoscope} title="Book an appointment if" items={result.check} variant="emph" />

      <div className="two">
        <div className="rcard">
          <div className="rcard-head"><span className="ricon"><Building2 size={18} /></span>Who to ask in {form.country === 'Other' ? 'your country' : form.country}</div>
          <ul className="vlist">{who.map((t, i) => <li key={i}><span className="vnum"><ChevronRight size={14} /></span><span>{t}</span></li>)}</ul>
        </div>
        <Section icon={HelpCircle} title="Questions to bring" items={result.ask} />
      </div>

      <Section icon={Info} title="What this check cannot tell you" items={result.limits} variant="muted" />

      <button className="btn ghost" onClick={onReset}><RotateCcw size={16} /> Check something else</button>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('check');
  const [form, setForm] = useState(EMPTY);
  const [provider, setProvider] = useState('glimmer');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [fromExample, setFromExample] = useState(false);
  const mainRef = useRef(null);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const urgent = useMemo(() => urgentScan(form.noticed), [form.noticed]);
  const ready = form.age && form.area && form.noticed.trim().length >= 8;

  const go = (id) => { setView(id); mainRef.current?.scrollTo({ top: 0 }); };

  async function submit(e) {
    e.preventDefault();
    if (!ready) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form, provider, apiKey: provider === 'glimmer' ? '' : apiKey, model }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Something went wrong.');
      const parsed = parseResult(d.text);
      if (!parsed.summary && !parsed.why.length) throw new Error('The model replied in an unexpected format. Please try again.');
      setResult(applyOverrides(parsed, form));
      setFromExample(false);
      mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function loadExample(ex) {
    setForm(ex.form);
    setResult(applyOverrides(parseResult(ex.saved), ex.form));
    setFromExample(true);
    setError('');
    go('check');
  }

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">
          <span className="logo">?</span>
          <div><div className="brand-name">Is This Normal?</div><div className="brand-sub">A calm check for parents</div></div>
        </div>
        <nav>
          {NAV.map((n) => (
            <button key={n.id} className={`nav ${view === n.id ? 'on' : ''}`} onClick={() => go(n.id)}>
              <span className="nav-icon"><n.icon size={18} /></span>
              <span><span className="nav-label">{n.label}</span><span className="nav-desc">{n.desc}</span></span>
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <Lock size={14} /> Nothing is stored. No sign-in.
        </div>
      </aside>

      <main className="main" ref={mainRef}>
        {view === 'check' && (
          <div className="page">
            {!result && (
              <>
                <header className="hero">
                  <span className="eyebrow"><Baby size={14} /> For parents of children aged 0 to 12</span>
                  <h1>See what child health guidance says about what you've noticed.</h1>
                  <p>Describe it in your own words. You'll see what official child health bodies say is typical for that age, what to try, and when it's worth asking a professional.</p>
                </header>

                <form className="card form" onSubmit={submit}>
                  <ChipRow label="How old is your child?" options={AGES} value={form.age} onChange={set('age')} />
                  <ChipRow label="What is it about?" options={AREAS} value={form.area} onChange={set('area')} />

                  <div className="field">
                    <div className="field-label">What have you noticed?<span className="hint">Your own words. Specifics help.</span></div>
                    <textarea rows={5} value={form.noticed} onChange={(e) => set('noticed')(e.target.value)} maxLength={2000}
                      placeholder="For example: he is 2 and still not putting two words together, but understands everything we say and loves books." />
                  </div>

                  {urgent && (
                    <div className="urgent">
                      <Siren size={20} />
                      <div><b>This sounds like it may need help now.</b> If your child is having trouble breathing, a seizure, is hard to wake or has swallowed something harmful, call {EMERGENCY_NUMBERS[form.country] || EMERGENCY_NUMBERS.Other} straight away. This app is not for emergencies.</div>
                    </div>
                  )}

                  <label className="regress">
                    <input type="checkbox" checked={form.regression} onChange={(e) => set('regression')(e.target.checked)} />
                    <span className="box"><Check size={14} /></span>
                    <span><b>They used to do this and have stopped.</b> Tick this if your child has lost a skill they once had.</span>
                  </label>

                  <div className="two">
                    <ChipRow label="How long?" options={DURATIONS} value={form.duration} onChange={set('duration')} />
                    <ChipRow label="Which way is it going?" options={DIRECTIONS} value={form.direction} onChange={set('direction')} />
                  </div>
                  <ChipRow label="Anything changed recently?" hint="Pick any" options={CHANGES} value={form.changes} onChange={set('changes')} multi />

                  <div className="two">
                    <div className="field">
                      <div className="field-label">Languages at home<span className="hint">Optional</span></div>
                      <input className="text" value={form.languages} onChange={(e) => set('languages')(e.target.value)} placeholder="e.g. Spanish, English, Hindi" />
                    </div>
                    <ChipRow label="Where do you live?" hint="For who to ask" options={COUNTRIES} value={form.country} onChange={(v) => set('country')(v || 'Other')} />
                  </div>

                  <details className="provider">
                    <summary><KeyRound size={16} /> Model: {PROVIDERS.find((p) => p.id === provider).label}<span className="hint">Change</span></summary>
                    <div className="chips">
                      {PROVIDERS.map((p) => (
                        <button type="button" key={p.id} className={`chip ${provider === p.id ? 'on' : ''}`} onClick={() => setProvider(p.id)}>
                          {provider === p.id && <Check size={14} />} {p.label} <span className="chip-note">{p.note}</span>
                        </button>
                      ))}
                    </div>
                    {provider !== 'glimmer' && (
                      <div className="two">
                        <input className="text" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={`Your ${PROVIDERS.find((p) => p.id === provider).label} API key`} />
                        <input className="text" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Model (optional, sensible default used)" />
                      </div>
                    )}
                    <p className="fine">Your key is sent once with this request and is never stored or logged.</p>
                  </details>

                  {error && <div className="error"><CircleAlert size={18} /> {error}</div>}

                  <div className="actions">
                    <button className="btn" type="submit" disabled={!ready || loading}>
                      {loading ? <><Loader2 className="spin" size={18} /> Checking the guidance</> : <>See what the guidance says <ArrowRight size={18} /></>}
                    </button>
                    <button className="btn ghost" type="button" onClick={() => go('examples')}><Sparkles size={16} /> Try an example</button>
                  </div>
                  {!ready && <p className="fine">Pick an age and an area, and describe what you noticed.</p>}
                </form>
              </>
            )}
            {result && <Result result={result} form={form} fromExample={fromExample} onReset={() => { setResult(null); setForm(EMPTY); }} />}
          </div>
        )}

        {view === 'examples' && (
          <div className="page">
            <header className="hero small">
              <h1>Three saved checks</h1>
              <p>Each one opens a real result, so you can see how it works without a key. One of each verdict.</p>
            </header>
            <div className="ex-grid">
              {EXAMPLES.map((ex) => {
                const I = ICONS[ex.icon];
                const verdict = parseResult(ex.saved).verdict;
                return (
                  <button key={ex.id} className="ex" onClick={() => loadExample(ex)}>
                    <span className="ex-icon"><I size={22} /></span>
                    <span className="ex-title">{ex.title}</span>
                    <span className="ex-blurb">{ex.blurb}</span>
                    <span className={`ex-verdict ${VERDICT_STYLE[verdict].cls}`}>{verdict}</span>
                    <span className="ex-go">Open <ArrowRight size={14} /></span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {view === 'how' && (
          <div className="page">
            <header className="hero small">
              <h1>How it works</h1>
              <p>Short version: it compares what you describe with published guidance and tells you where it sits.</p>
            </header>
            <div className="steps">
              {[
                { i: MessagesSquare, t: 'You describe it', d: 'Age, area and what you noticed, in your own words.' },
                { i: Library, t: 'It checks the guidance', d: 'A model compares it with CDC, WHO, NHS, AAP, AEP and ASHA guidance and names each source it uses.' },
                { i: ShieldCheck, t: 'Fixed rules run too', d: 'Lost skills always mean "check". Emergency words trigger an urgent banner. These never depend on the model.' },
                { i: CircleCheck, t: 'You get a verdict', d: 'Typical, worth watching, or check with a professional, plus what to try and who to ask.' },
              ].map((s, n) => (
                <div className="step" key={n}><span className="step-n">{n + 1}</span><span className="ricon"><s.i size={18} /></span><div><b>{s.t}</b><p>{s.d}</p></div></div>
              ))}
            </div>
            <div className="two">
              <div className="rcard">
                <div className="rcard-head"><span className="ricon"><CircleCheck size={18} /></span>What it does</div>
                <ul className="ticks">
                  <li><Check size={16} /> Places what you noticed against published age ranges</li>
                  <li><Check size={16} /> Counts words across every language at home</li>
                  <li><Check size={16} /> Tells you who to ask in Spain, the UK or the US</li>
                </ul>
              </div>
              <div className="rcard">
                <div className="rcard-head"><span className="ricon"><X size={18} /></span>What it never does</div>
                <ul className="ticks no">
                  <li><X size={16} /> Diagnose, or name a condition</li>
                  <li><X size={16} /> Replace your paediatrician or health visitor</li>
                  <li><X size={16} /> Store anything you type</li>
                </ul>
              </div>
            </div>
            <div className="callout"><Phone size={18} /> In an emergency call 112 in Spain, 999 in the UK or 911 in the US.</div>
          </div>
        )}

        {view === 'sources' && (
          <div className="page">
            <header className="hero small">
              <h1>Sources</h1>
              <p>Answers may only draw on these bodies, and must name them. Ranges are guides. Every child develops at their own pace.</p>
            </header>
            <div className="src-grid">
              {[
                ['CDC', 'Learn the Signs. Act Early.', 'US milestones, revised in 2022 to show what most children (75 percent or more) do by each age.', 'https://www.cdc.gov/act-early/'],
                ['WHO', 'Motor development study', 'Windows of achievement for six gross motor milestones in healthy children across five countries.', 'https://www.who.int/tools/child-growth-standards'],
                ['NHS', 'Baby and toddler development', 'UK guidance on milestones and when to talk to a health visitor or GP.', 'https://www.nhs.uk/conditions/baby/babys-development/'],
                ['AAP', 'HealthyChildren.org', 'The American Academy of Pediatrics\' parent site on development and screening.', 'https://www.healthychildren.org/'],
                ['AEP', 'En Familia', 'The Asociación Española de Pediatría\'s guidance for families in Spain.', 'https://enfamilia.aeped.es/'],
                ['ASHA', 'Learning more than one language', 'Guidance on how bilingual and multilingual children develop language.', 'https://www.asha.org/public/speech/development/learning-two-languages/'],
              ].map(([b, t, d, u]) => (
                <a className="src" key={b} href={u} target="_blank" rel="noreferrer">
                  <span className="src-body">{b}</span><b>{t}</b><p>{d}</p><span className="ex-go">Visit <ArrowRight size={14} /></span>
                </a>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
