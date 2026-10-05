import React, { useMemo, useRef, useState } from 'react';
import {
  MessagesSquare, ClipboardList, BookOpen, SlidersHorizontal, Sparkles, Target, CircleCheck,
  CircleAlert, CircleX, Lightbulb, Repeat2, Wrench, Mail, ArrowRight, Copy, Check, Plus, Trash2,
  Info, ShieldCheck, Telescope, Loader2, KeyRound, ChevronDown, ThumbsUp, Route, Eye, FlaskConical,
  Mic, Clock, Lock,
} from 'lucide-react';
import { EXAMPLES } from './examples.js';
import { parseDebrief, isUsable } from './parse.js';
import { answerSignals, SIGNAL_RULES } from './signals.js';

const OPTIONS = {
  company: ['Startup', 'Scale-up', 'Enterprise', 'Agency or consultancy', 'Public sector'],
  round: ['Recruiter screen', 'Hiring manager', 'Case or technical', 'Panel', 'Final or exec'],
  interviewer: ['Recruiter', 'Hiring manager', 'Peer', 'Senior leader', 'Mixed panel'],
  format: ['Video', 'Phone', 'In person', 'Recorded answers'],
  gut: ['Good', 'Mixed', 'Unsure', 'Not great'],
  felt: ['Nailed it', 'Solid', 'Shaky', 'Blanked'],
  reaction: ['Dug deeper', 'Moved on quickly', 'Seemed satisfied', 'Pushed back', "Couldn't tell"],
};

const PROVIDERS = [
  { id: 'muse', name: 'Muse Glimmer', sub: 'Default, no key needed', model: 'Meta Muse Glimmer 30B' },
  { id: 'anthropic', name: 'Anthropic', sub: 'Your own key', model: 'claude-sonnet-5-5' },
  { id: 'openai', name: 'OpenAI', sub: 'Your own key', model: 'gpt-5-mini' },
  { id: 'gemini', name: 'Gemini', sub: 'Your own key', model: 'gemini-2.5-flash' },
];

const SECTIONS = [
  { id: 'debrief', label: 'Debrief a round', desc: 'Log the questions while they are fresh', icon: MessagesSquare },
  { id: 'examples', label: 'Examples', desc: 'Three finished debriefs to explore', icon: ClipboardList },
  { id: 'how', label: 'How it works', desc: 'What it checks and where it comes from', icon: BookOpen },
  { id: 'settings', label: 'Model settings', desc: 'Default model or bring your own key', icon: SlidersHorizontal },
];

const emptyQ = () => ({ question: '', answer: '', felt: '', reaction: '' });
const emptyForm = () => ({
  role: '', company: '', round: '', interviewer: '', format: '', gut: '', jd: '',
  questions: [emptyQ(), emptyQ()], myQuestions: '', nextSteps: '',
});

export default function App() {
  const [section, setSection] = useState('debrief');
  const [form, setForm] = useState(emptyForm);
  const [result, setResult] = useState(null); // { input, debrief, source }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState('muse');
  const [userKey, setUserKey] = useState('');
  const [model, setModel] = useState('');
  const mainRef = useRef(null);

  const go = (id) => {
    setSection(id);
    if (mainRef.current) mainRef.current.scrollTop = 0;
  };

  const filledQs = form.questions.filter((q) => q.question.trim() || q.answer.trim());
  const canRun = filledQs.length > 0 && !loading;

  async function run() {
    setError('');
    setLoading(true);
    setResult(null);
    const payload = { ...form, questions: filledQs };
    try {
      const res = await fetch('/api/debrief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload, provider, userKey: provider === 'muse' ? '' : userKey, model }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      const debrief = parseDebrief(data.text);
      if (!isUsable(debrief)) throw new Error('The model replied in an unexpected shape. Try again, or switch model in Model settings.');
      setResult({ input: payload, debrief, source: PROVIDERS.find((p) => p.id === provider).name });
      setTimeout(() => document.getElementById('result-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function openExample(ex) {
    setForm(JSON.parse(JSON.stringify(ex.input)));
    setResult({ input: ex.input, debrief: parseDebrief(ex.result), source: 'Saved example' });
    setError('');
    go('debrief');
    setTimeout(() => document.getElementById('result-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Mic size={20} strokeWidth={2.4} /></div>
          <div>
            <div className="brand-name">How Did That Go?</div>
            <div className="brand-sub">Post-interview debrief</div>
          </div>
        </div>
        <nav className="nav">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <button key={s.id} className={`nav-item ${section === s.id ? 'active' : ''}`} onClick={() => go(s.id)}>
                <span className="nav-icon"><Icon size={18} /></span>
                <span className="nav-text">
                  <span className="nav-label">{s.label}</span>
                  <span className="nav-desc">{s.desc}</span>
                </span>
              </button>
            );
          })}
        </nav>
        <div className="side-foot">
          <div className="side-pill"><Lock size={14} /> Nothing is saved or stored</div>
          <div className="side-model">Model: {PROVIDERS.find((p) => p.id === provider).name}</div>
        </div>
      </aside>

      <main className="main" ref={mainRef}>
        {section === 'debrief' && (
          <DebriefView
            form={form} setForm={setForm} run={run} canRun={canRun} loading={loading}
            error={error} result={result} reset={() => { setForm(emptyForm()); setResult(null); setError(''); }}
            go={go} openExample={openExample} provider={provider}
          />
        )}
        {section === 'examples' && <ExamplesView openExample={openExample} />}
        {section === 'how' && <HowView />}
        {section === 'settings' && (
          <SettingsView
            provider={provider} setProvider={setProvider} userKey={userKey} setUserKey={setUserKey}
            model={model} setModel={setModel}
          />
        )}
      </main>
    </div>
  );
}

/* ---------- Debrief ---------- */

function DebriefView({ form, setForm, run, canRun, loading, error, result, reset, go, openExample, provider }) {
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setQ = (i, k, v) => setForm((f) => ({ ...f, questions: f.questions.map((q, j) => (j === i ? { ...q, [k]: v } : q)) }));
  const addQ = () => setForm((f) => (f.questions.length >= 12 ? f : { ...f, questions: [...f.questions, emptyQ()] }));
  const delQ = (i) => setForm((f) => ({ ...f, questions: f.questions.length > 1 ? f.questions.filter((_, j) => j !== i) : [emptyQ()] }));

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-text">
          <span className="eyebrow"><Sparkles size={14} /> Daily AI build</span>
          <h1>Debrief your interview while it is still fresh</h1>
          <p>Note the questions you were asked and what you said. See what each one was really testing, where your answer fell short, and what to fix before the next round.</p>
          <div className="hero-steps">
            <Step icon={ClipboardList} n="1" text="Log the questions" />
            <Step icon={Target} n="2" text="See what each one probed" />
            <Step icon={Wrench} n="3" text="Fix it for next round" />
          </div>
        </div>
        <button className="hero-try" onClick={() => go('examples')}>
          <Eye size={16} /> See an example first <ArrowRight size={16} />
        </button>
      </header>

      <section className="card">
        <CardTitle icon={Route} title="The round" sub="A few taps. Add your own option if none fit." />
        <div className="field">
          <label>Role you interviewed for</label>
          <input value={form.role} onChange={(e) => set('role', e.target.value)} placeholder="e.g. Senior Product Manager, payments" />
        </div>
        <ChipRow label="Company type" options={OPTIONS.company} value={form.company} onChange={(v) => set('company', v)} />
        <ChipRow label="Round" options={OPTIONS.round} value={form.round} onChange={(v) => set('round', v)} />
        <ChipRow label="Who interviewed you" options={OPTIONS.interviewer} value={form.interviewer} onChange={(v) => set('interviewer', v)} />
        <ChipRow label="Format" options={OPTIONS.format} value={form.format} onChange={(v) => set('format', v)} />
        <details className="jd">
          <summary><ChevronDown size={16} /> Paste the job description <span className="opt">optional, sharpens the debrief</span></summary>
          <textarea rows={5} value={form.jd} onChange={(e) => set('jd', e.target.value)} placeholder="Paste the key requirements or the whole posting" />
        </details>
      </section>

      <section className="card">
        <CardTitle icon={MessagesSquare} title="What they asked" sub="Your own words are fine. Rough notes work." />
        <div className="qlist">
          {form.questions.map((q, i) => (
            <div className="qcard" key={i}>
              <div className="qhead">
                <span className="qnum">Q{i + 1}</span>
                <button className="icon-btn" onClick={() => delQ(i)} aria-label={`Remove question ${i + 1}`}><Trash2 size={16} /></button>
              </div>
              <input className="qinput" value={q.question} onChange={(e) => setQ(i, 'question', e.target.value)} placeholder="The question, as best you remember it" />
              <textarea rows={3} value={q.answer} onChange={(e) => setQ(i, 'answer', e.target.value)} placeholder="What you said, in a few sentences. Include examples and numbers if you used any." />
              <ChipRow small label="How it felt" options={OPTIONS.felt} value={q.felt} onChange={(v) => setQ(i, 'felt', v)} />
              <ChipRow small label="Their reaction" options={OPTIONS.reaction} value={q.reaction} onChange={(v) => setQ(i, 'reaction', v)} />
            </div>
          ))}
        </div>
        <button className="add-btn" onClick={addQ} disabled={form.questions.length >= 12}><Plus size={16} /> Add another question</button>
      </section>

      <section className="card">
        <CardTitle icon={Clock} title="Wrapping up" sub="Optional, but it helps with next steps and your follow-up note." />
        <ChipRow label="Your gut feel overall" options={OPTIONS.gut} value={form.gut} onChange={(v) => set('gut', v)} />
        <div className="two">
          <div className="field">
            <label>Questions you asked them</label>
            <textarea rows={2} value={form.myQuestions} onChange={(e) => set('myQuestions', e.target.value)} placeholder="Leave empty if you did not ask any" />
          </div>
          <div className="field">
            <label>What they said about next steps</label>
            <textarea rows={2} value={form.nextSteps} onChange={(e) => set('nextSteps', e.target.value)} placeholder="e.g. Will hear within a week, next is a case round" />
          </div>
        </div>
      </section>

      <div className="run-bar">
        <button className="btn-primary" onClick={run} disabled={!canRun}>
          {loading ? <><Loader2 size={18} className="spin" /> Reading your round</> : <><Sparkles size={18} /> Debrief this round</>}
        </button>
        <button className="btn-ghost" onClick={reset}>Start fresh</button>
        <span className="run-note">
          {provider === 'muse' ? 'Runs on Muse Glimmer. No key needed.' : 'Uses your own key for this one request.'}
        </span>
      </div>

      {error && <div className="error"><CircleAlert size={18} /> {error}</div>}
      {result && <Results result={result} />}
      {!result && !loading && (
        <div className="empty">
          <Lightbulb size={18} /> Not ready to type? <button className="link" onClick={() => openExample(EXAMPLES[0])}>Load a worked example</button> to see what you get back.
        </div>
      )}
    </div>
  );
}

function Step({ icon: Icon, n, text }) {
  return (
    <div className="step">
      <span className="step-icon"><Icon size={16} /></span>
      <span className="step-n">{n}</span>
      <span>{text}</span>
    </div>
  );
}

function CardTitle({ icon: Icon, title, sub }) {
  return (
    <div className="card-title">
      <span className="ct-icon"><Icon size={18} /></span>
      <div>
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
      </div>
    </div>
  );
}

function ChipRow({ label, options, value, onChange, small }) {
  const [extra, setExtra] = useState([]);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const all = useMemo(() => {
    const base = [...options, ...extra];
    if (value && !base.includes(value)) base.push(value);
    return base;
  }, [options, extra, value]);
  const commit = () => {
    const v = draft.trim();
    if (v) {
      if (!all.includes(v)) setExtra((e) => [...e, v]);
      onChange(v);
    }
    setDraft('');
    setAdding(false);
  };
  return (
    <div className={`chiprow ${small ? 'small' : ''}`}>
      <span className="chip-label">{label}</span>
      <div className="chips">
        {all.map((o) => (
          <button key={o} className={`chip ${value === o ? 'on' : ''}`} onClick={() => onChange(value === o ? '' : o)}>
            {value === o && <Check size={13} strokeWidth={3} />} {o}
          </button>
        ))}
        {adding ? (
          <span className="chip-add-wrap">
            <input
              autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setAdding(false); }}
              onBlur={commit} placeholder="Type and press Enter"
            />
          </span>
        ) : (
          <button className="chip chip-add" onClick={() => setAdding(true)}><Plus size={13} /> Your own</button>
        )}
      </div>
    </div>
  );
}

/* ---------- Results ---------- */

const READ_META = {
  Strong: { cls: 'good', icon: CircleCheck },
  Mixed: { cls: 'warn', icon: CircleAlert },
  'Needs work': { cls: 'bad', icon: CircleX },
};
const LANDED_META = {
  Landed: { cls: 'good', icon: CircleCheck },
  Partly: { cls: 'warn', icon: CircleAlert },
  Missed: { cls: 'bad', icon: CircleX },
};

function Results({ result }) {
  const { input, debrief: d, source } = result;
  const [copied, setCopied] = useState(false);
  const meta = READ_META[d.read?.label] || READ_META.Mixed;
  const ReadIcon = meta.icon;
  const noteText = d.note.join('\n\n');
  const counts = Object.values(d.questions).reduce((acc, q) => { acc[q.landed] = (acc[q.landed] || 0) + 1; return acc; }, {});

  const copy = async () => {
    try { await navigator.clipboard.writeText(noteText); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ }
  };

  return (
    <div className="results" id="result-top">
      <div className="read">
        <div className="read-main">
          <span className="read-kicker">How the round likely read</span>
          <div className={`read-badge ${meta.cls}`}><ReadIcon size={20} /> {d.read?.label}</div>
          <p className="read-summary">{d.read?.summary}</p>
          <div className="read-meta">
            <span className="pill-soft"><Info size={13} /> {d.read?.confidence || 'Medium'} confidence</span>
            <span className="pill-soft"><FlaskConical size={13} /> {source}</span>
          </div>
        </div>
        <div className="tally">
          {['Landed', 'Partly', 'Missed'].map((k) => {
            const M = LANDED_META[k];
            const I = M.icon;
            return (
              <div className={`tally-item ${M.cls}`} key={k}>
                <I size={18} />
                <span className="tally-n">{counts[k] || 0}</span>
                <span className="tally-l">{k}</span>
              </div>
            );
          })}
        </div>
      </div>

      {d.strengths.length > 0 && (
        <section className="card">
          <CardTitle icon={ThumbsUp} title="What likely worked" />
          <div className="tiles">
            {d.strengths.map((s, i) => (
              <div className="tile" key={i}><span className="tile-icon"><CircleCheck size={16} /></span><p>{s}</p></div>
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <CardTitle icon={Target} title="Question by question" sub="What each one was testing, and how your answer would have read" />
        <div className="qresults">
          {input.questions.map((q, i) => {
            const r = d.questions[i + 1] || {};
            const lm = LANDED_META[r.landed] || LANDED_META.Partly;
            const LI = lm.icon;
            const sig = answerSignals(q.answer);
            return (
              <details className="qr" key={i} open={i === 0}>
                <summary>
                  <span className="qnum">Q{i + 1}</span>
                  <span className="qr-q">{q.question || 'Question not recorded'}</span>
                  <span className={`landed ${lm.cls}`}><LI size={14} /> {r.landed || 'Partly'}</span>
                  <ChevronDown size={18} className="qr-chev" />
                </summary>
                <div className="qr-body">
                  <div className="qr-tags">
                    {q.felt && <span className="tag">Felt: {q.felt}</span>}
                    {q.reaction && <span className="tag">Reaction: {q.reaction}</span>}
                  </div>
                  <div className="qr-grid">
                    <Block icon={Telescope} title="What it was probing" text={r.probe} />
                    <Block icon={LI} title="How it landed" text={r.landedWhy} tone={lm.cls} />
                    <Block icon={CircleAlert} title="The gap" text={r.gap} />
                    <Block icon={Lightbulb} title="A stronger version" text={r.better} accent />
                  </div>
                  <div className="signals">
                    <span className="signals-title">Signals in your notes</span>
                    {SIGNAL_RULES.map((s) => (
                      <span key={s.id} className={`sig ${sig[s.id] ? 'yes' : 'no'}`} title={s.rule}>
                        {sig[s.id] ? <Check size={12} strokeWidth={3} /> : <span className="sig-dot" />} {s.label}
                      </span>
                    ))}
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </section>

      {d.patterns.length > 0 && (
        <section className="card">
          <CardTitle icon={Repeat2} title="Patterns across your answers" />
          <div className="tiles">
            {d.patterns.map((p, i) => (
              <div className="tile tile-strong" key={i}><span className="tile-icon"><Repeat2 size={16} /></span><p>{p}</p></div>
            ))}
          </div>
        </section>
      )}

      {d.fixes.length > 0 && (
        <section className="card">
          <CardTitle icon={Wrench} title="Fix before the next round" sub="In priority order" />
          <ol className="fixes">
            {d.fixes.map((f, i) => (
              <li key={i}>
                <span className="fix-n">{i + 1}</span>
                <div><h3>{f.title}</h3><p>{f.detail}</p></div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="split">
        {d.note.length > 0 && (
          <section className="card note-card">
            <div className="note-head">
              <CardTitle icon={Mail} title="Follow-up note" sub="Send within a day. Edit the brackets." />
              <button className="btn-small" onClick={copy}>{copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}</button>
            </div>
            <div className="note">{d.note.map((p, i) => <p key={i}>{p}</p>)}</div>
          </section>
        )}
        {d.next.length > 0 && (
          <section className="card">
            <CardTitle icon={ArrowRight} title="The next round will probably test" />
            <ul className="next">
              {d.next.map((n, i) => <li key={i}><span className="next-icon"><Target size={15} /></span>{n}</li>)}
            </ul>
          </section>
        )}
      </div>

      {d.limits.length > 0 && (
        <div className="limits">
          <ShieldCheck size={18} />
          <div><strong>What this debrief cannot know.</strong> {d.limits.join(' ')}</div>
        </div>
      )}
    </div>
  );
}

function Block({ icon: Icon, title, text, tone, accent }) {
  return (
    <div className={`block ${accent ? 'accent' : ''}`}>
      <div className={`block-title ${tone || ''}`}><Icon size={15} /> {title}</div>
      <p>{text || 'Not returned for this question.'}</p>
    </div>
  );
}

/* ---------- Examples ---------- */

function ExamplesView({ openExample }) {
  return (
    <div className="page">
      <header className="section-head">
        <h1>Worked examples</h1>
        <p>Three rounds, already debriefed. Open one to see the full output, then change anything and run it again.</p>
      </header>
      <div className="ex-grid">
        {EXAMPLES.map((ex) => {
          const meta = READ_META[ex.tone];
          const I = meta.icon;
          return (
            <button className="ex-card" key={ex.id} onClick={() => openExample(ex)}>
              <div className="ex-top">
                <span className={`read-badge sm ${meta.cls}`}><I size={14} /> {ex.tone}</span>
                <span className="ex-count">{ex.input.questions.length} questions</span>
              </div>
              <h3>{ex.title}</h3>
              <p>{ex.blurb}</p>
              <div className="ex-tags">
                <span>{ex.input.round}</span><span>{ex.input.format}</span><span>{ex.input.company}</span>
              </div>
              <span className="ex-open">Open debrief <ArrowRight size={15} /></span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- How it works ---------- */

function HowView() {
  return (
    <div className="page">
      <header className="section-head">
        <h1>How it works</h1>
        <p>The short version first, then the detail for anyone who wants it.</p>
      </header>

      <section className="card">
        <CardTitle icon={Lightbulb} title="In plain words" />
        <div className="tiles">
          <div className="tile"><span className="tile-icon"><Target size={16} /></span><p>Every interview question is checking for something. "Tell me about a failure" is really asking whether you own your mistakes.</p></div>
          <div className="tile"><span className="tile-icon"><MessagesSquare size={16} /></span><p>You note what you were asked and what you said. An AI model, briefed as an experienced interview coach, reads it against the role and the round.</p></div>
          <div className="tile"><span className="tile-icon"><Wrench size={16} /></span><p>You get what each question was testing, how your answer probably came across, and what to change next time.</p></div>
        </div>
      </section>

      <section className="card">
        <CardTitle icon={Check} title="Signals in your notes" sub="Fixed checks run in your browser. No AI involved." />
        <div className="rules">
          {SIGNAL_RULES.map((s) => (
            <div className="rule" key={s.id}><span className="rule-name">{s.label}</span><p>{s.rule}</p></div>
          ))}
        </div>
        <p className="small-print">These look at your notes, not your actual answer. Use them as a nudge to remember what you left out, never as a score.</p>
      </section>

      <section className="card">
        <CardTitle icon={Info} title="Where the debrief comes from" />
        <ul className="plain-list">
          <li><span className="pl-icon"><Sparkles size={15} /></span>The debrief is written by an AI model, by default Meta Muse Glimmer 30B. It works only from what you typed. It has no access to the company, the interviewer or other candidates.</li>
          <li><span className="pl-icon"><Telescope size={15} /></span>The model is told to ground every judgement in your own notes, to treat the interviewer's reaction as a weak signal, and never to predict the outcome.</li>
          <li><span className="pl-icon"><ClipboardList size={15} /></span>The three worked examples are invented rounds. Their debriefs were written in the same format the model returns, so they show the real output shape.</li>
          <li><span className="pl-icon"><CircleAlert size={15} /></span>It is a coach's read, not a verdict. Two experienced interviewers can hear the same answer differently.</li>
        </ul>
      </section>

      <section className="card">
        <CardTitle icon={Lock} title="Privacy" />
        <ul className="plain-list">
          <li><span className="pl-icon"><ShieldCheck size={15} /></span>No sign-in, no database. Your notes go to the model for one request and are not saved by this app.</li>
          <li><span className="pl-icon"><KeyRound size={15} /></span>If you use your own key, it is passed through for that single request and never stored or logged.</li>
          <li><span className="pl-icon"><Info size={15} /></span>Leave out names of interviewers or confidential details you were told. The debrief works fine without them.</li>
        </ul>
      </section>
    </div>
  );
}

/* ---------- Settings ---------- */

function SettingsView({ provider, setProvider, userKey, setUserKey, model, setModel }) {
  const p = PROVIDERS.find((x) => x.id === provider);
  return (
    <div className="page">
      <header className="section-head">
        <h1>Model settings</h1>
        <p>The default works without a key. Switch if you want to compare models or use your own account.</p>
      </header>
      <section className="card">
        <CardTitle icon={Sparkles} title="Choose a model" />
        <div className="prov-grid">
          {PROVIDERS.map((x) => (
            <button key={x.id} className={`prov ${provider === x.id ? 'on' : ''}`} onClick={() => { setProvider(x.id); setModel(''); }}>
              <span className="prov-name">{provider === x.id && <Check size={14} strokeWidth={3} />} {x.name}</span>
              <span className="prov-sub">{x.sub}</span>
            </button>
          ))}
        </div>
        {provider !== 'muse' && (
          <div className="two">
            <div className="field">
              <label><KeyRound size={14} /> Your {p.name} API key</label>
              <input type="password" value={userKey} onChange={(e) => setUserKey(e.target.value)} placeholder="Kept in this tab only" autoComplete="off" />
            </div>
            <div className="field">
              <label>Model name</label>
              <input value={model} onChange={(e) => setModel(e.target.value)} placeholder={p.model} />
            </div>
          </div>
        )}
        <div className="limits soft">
          <ShieldCheck size={18} />
          <div>{provider === 'muse'
            ? 'Runs on Meta Muse Glimmer 30B through NVIDIA, on the app owner\'s key. Nothing for you to set up.'
            : 'Your key stays in this browser tab, is sent with your request, used once, and never stored. Closing the tab clears it.'}</div>
        </div>
      </section>
    </div>
  );
}
