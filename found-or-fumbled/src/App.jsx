import { useMemo, useRef, useState } from 'react';
import {
  SearchCheck, Compass, Stethoscope, Layers, FlaskConical, BookOpen, Lock, KeyRound, Sparkles, Play, Plus,
  ArrowRight, Info, TriangleAlert, FileWarning, RotateCcw, Upload, Database, Scissors, Search, ListOrdered,
  MessageSquareText, FileQuestion, History, SearchX, ArrowDownWideNarrow, EyeOff, WandSparkles, Ban,
  CircleCheck, CircleX, CircleHelp, CircleAlert, ClipboardCheck, Wrench, ArrowLeftRight, Ticket, Copy, Check,
  Calculator, Bot, ShieldCheck, MessageCircleQuestion, FileText, Gauge, Quote, Ruler, Hash, CalendarClock
} from 'lucide-react';
import {
  STAGES, CODES, PIPE, LEAN_RULES, parseChunks, computeSignals, signalLines, textLean, parseDiagnosis, agreement
} from './lib.js';
import { EXAMPLES, CHUNK_TEMPLATE } from './examples.js';

const NAV = [
  { key: 'start', label: 'Start here', desc: 'What this does, in one minute', icon: Compass },
  { key: 'diagnose', label: 'Diagnose', desc: 'One bad answer in, the broken stage out', icon: Stethoscope },
  { key: 'stages', label: 'The eight stages', desc: 'Every way a RAG answer goes wrong', icon: Layers },
  { key: 'examples', label: 'Examples', desc: 'Three worked cases, no key needed', icon: FlaskConical },
  { key: 'method', label: 'Method', desc: 'Every rule and signal, printed', icon: BookOpen }
];

const PROVIDERS = [
  { key: 'muse', label: 'Muse Glimmer (free)', needsKey: false },
  { key: 'anthropic', label: 'Anthropic', needsKey: true },
  { key: 'openai', label: 'OpenAI', needsKey: true },
  { key: 'gemini', label: 'Gemini', needsKey: true }
];

const STAGE_ICON = {
  GAP: FileQuestion, STALE: History, CHUNK: Scissors, MISS: SearchX, RANK: ArrowDownWideNarrow,
  IGNORED: EyeOff, INVENTED: WandSparkles, REFUSAL: Ban
};
const PIPE_ICON = { kb: Database, chunk: Scissors, retrieve: Search, rank: ListOrdered, gen: MessageSquareText };

const FACT_OPTIONS = {
  inKb: ['Yes', 'No', 'Not sure'],
  changed: ['Yes', 'No', 'Not sure'],
  symptom: ['Wrong fact', 'Out of date', 'Made-up detail', 'Missing part of the answer', 'Refused or deflected'],
  topK: ['3', '5', '10', 'Not sure']
};

function ChipRow({ options, value, onChange, onAdd, addLabel = 'Add your own', placeholder }) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const commit = () => {
    const t = text.trim();
    if (t) { onAdd(t); onChange(t); }
    setText(''); setAdding(false);
  };
  return (
    <div className="chips">
      {options.map((o) => (
        <button key={o} className={`chip ${value === o ? 'on' : ''}`} onClick={() => onChange(o)}>{o}</button>
      ))}
      {onAdd && (adding ? (
        <input
          autoFocus className="chip-input" value={text} placeholder={placeholder}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setAdding(false); }}
          onBlur={commit}
        />
      ) : (
        <button className="chip add" onClick={() => setAdding(true)}><Plus size={14} />{addLabel}</button>
      ))}
    </div>
  );
}

function IconList({ items }) {
  return (
    <ul className="icon-list">
      {items.map(([Ic, text], i) => (
        <li key={i}><span className="li-ic"><Ic size={15} /></span><span>{text}</span></li>
      ))}
    </ul>
  );
}

/* ---------------- pipeline strip ---------------- */
function Pipeline({ main, also = [], compact }) {
  const mainPipe = main ? STAGES[main].pipe : null;
  const alsoPipes = also.map((c) => STAGES[c].pipe);
  return (
    <div className={`pipe ${compact ? 'compact' : ''}`}>
      {PIPE.map((p, i) => {
        const Ic = PIPE_ICON[p.key];
        const state = p.key === mainPipe ? 'broke' : alsoPipes.includes(p.key) ? 'also' : 'ok';
        return (
          <div className="pipe-step" key={p.key}>
            {i > 0 && <div className={`pipe-line ${state === 'broke' ? 'to-broke' : ''}`} />}
            <div className={`pipe-node ${state}`}>
              <Ic size={compact ? 15 : 18} />
              {state === 'broke' && <span className="pipe-flag"><CircleX size={14} /></span>}
              {state === 'also' && <span className="pipe-flag also"><CircleAlert size={14} /></span>}
            </div>
            <div className="pipe-label">{compact ? p.short : p.label}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Start here ---------------- */
function Start({ go, loadExample }) {
  return (
    <>
      <div className="hero">
        <div className="hero-pipe">
          {['d', 'd', 'x', 'd', 'd'].map((c, i) => <span key={i} className={c}>{c === 'x' ? <Scissors size={16} /> : null}</span>)}
        </div>
        <h2>Your AI assistant gave a wrong answer. Which part broke?</h2>
        <p>Most AI help bots look things up before they answer. When the answer is wrong, the fault can sit in the documents, the search, or the writing. Paste what came back from search and get the most likely stage, the evidence, and checks you can run before calling engineering.</p>
        <div className="row">
          <button className="btn btn-white" onClick={() => loadExample('chunk')}><FlaskConical size={16} />See a worked example</button>
          <button className="btn btn-outline" onClick={() => go('diagnose')}>Diagnose my own<ArrowRight size={16} /></button>
        </div>
      </div>

      <div className="steps3">
        {[
          [MessageCircleQuestion, 'Paste the bad answer', 'The question, what the assistant said, and what it should have said.'],
          [FileText, 'Add what search returned', 'The chunks in rank order. Most tools show them in a debug or trace view.'],
          [Stethoscope, 'Get the broken stage', 'A verdict from eight stages, the evidence, cheap checks and a draft ticket.']
        ].map(([Ic, h, p], i) => (
          <div className="step-card" key={i}>
            <div className="ic"><Ic size={20} /></div>
            <h4>{i + 1}. {h}</h4>
            <p>{p}</p>
          </div>
        ))}
      </div>

      <div className="two">
        <div className="card">
          <div className="card-head"><div className="nav-icon"><Database size={17} /></div><p className="card-title">Where the verdict comes from</p></div>
          <IconList items={[
            [Calculator, 'Word and number checks run in your browser with fixed rules, printed under Method.'],
            [Bot, 'The verdict, evidence and ticket come from the model you pick. The app shows when the two disagree.'],
            [FlaskConical, 'The three examples use invented companies and documents, with saved results.']
          ]} />
        </div>
        <div className="card">
          <div className="card-head"><div className="nav-icon"><ShieldCheck size={17} /></div><p className="card-title">Privacy</p></div>
          <IconList items={[
            [Lock, 'No sign-in and nothing is stored. Closing the tab clears everything.'],
            [Upload, 'Text leaves the browser only when you press Diagnose, and only to the provider you chose.'],
            [KeyRound, 'A key you paste is used for that request and never saved.']
          ]} />
        </div>
      </div>
    </>
  );
}

/* ---------------- Diagnose ---------------- */
function ChunkPreview({ chunks, signals }) {
  if (!chunks.length) return null;
  const clashIds = signals.versionClash ? signals.versionClash.map((c) => c.id) : [];
  return (
    <div className="chunk-list">
      {chunks.map((c, i) => {
        const sc = signals.perChunk[i];
        const isBest = signals.best && signals.best.id === c.id && signals.best.expected > 0;
        return (
          <div className={`chunk ${isBest ? 'best' : ''}`} key={c.id}>
            <div className="chunk-head">
              <span className="chunk-id">{c.id}</span>
              <span className="chunk-src">{c.source || 'No source given'}</span>
              {c.updated && <span className="meta"><CalendarClock size={12} />{c.updated}</span>}
              {c.score && <span className="meta"><Gauge size={12} />{c.score}</span>}
            </div>
            <p className="chunk-text">{c.text}</p>
            <div className="chunk-tags">
              {sc.expected !== null && <span className="ctag"><Ruler size={12} />{Math.round(sc.expected * 100)}% of expected</span>}
              {isBest && <span className="ctag strong"><CircleCheck size={12} />Best match</span>}
              {sc.cutOff && <span className="ctag warn"><Scissors size={12} />Ends mid-sentence</span>}
              {clashIds.includes(c.id) && <span className="ctag warn"><History size={12} />Another version retrieved</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TextLean({ lean, lines }) {
  const Ic = lean ? STAGE_ICON[lean.code] : CircleHelp;
  return (
    <div className="card lean-card">
      <div className="card-head">
        <div className="nav-icon"><Calculator size={17} /></div>
        <div><p className="card-title">What the text alone suggests</p><p className="card-sub">Fixed rules on words and numbers, no model. Updates as you type.</p></div>
      </div>
      <div className="lean-row">
        <div className={`lean-badge ${lean ? '' : 'none'}`}><Ic size={18} />{lean ? STAGES[lean.code].name : 'No clear lean yet'}</div>
        <span className="muted">{lean ? lean.why : 'Add the expected answer and the chunks to get a lean.'}</span>
      </div>
      {lines.length > 0 && (
        <ul className="sig-list">
          {lines.map((l, i) => <li key={i}><Hash size={13} />{l}</li>)}
        </ul>
      )}
    </div>
  );
}

function CopyButton({ text }) {
  const [done, setDone] = useState(false);
  return (
    <button className="btn btn-soft sm" onClick={() => { navigator.clipboard?.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); }}>
      {done ? <><Check size={14} />Copied</> : <><Copy size={14} />Copy ticket</>}
    </button>
  );
}

function Results({ diag, lean }) {
  const v = diag.verdict;
  const st = STAGES[v.code];
  const Ic = STAGE_ICON[v.code];
  const ag = agreement(lean, diag);
  const AgIc = { good: CircleCheck, warn: TriangleAlert, bad: CircleX, neutral: CircleHelp }[ag.tone];
  const claimIc = { Supported: CircleCheck, Contradicted: CircleX, Unsupported: CircleAlert };
  return (
    <>
      <div className="eyebrow" style={{ marginTop: 10 }}>Diagnosis</div>
      <h2 className="h2" style={{ fontSize: 24 }}>Where it most likely broke</h2>

      <div className="verdict-card">
        <div className="verdict-top">
          <div className="verdict-ic"><Ic size={28} /></div>
          <div style={{ flex: 1 }}>
            <div className="row" style={{ gap: 8, marginBottom: 6 }}>
              <span className="band">{st.band} stage</span>
              <span className={`conf ${v.confidence.toLowerCase()}`}>{v.confidence} confidence</span>
            </div>
            <h3>{st.name}</h3>
            <p>{v.line}</p>
          </div>
        </div>
        <Pipeline main={v.code} also={diag.also.map((a) => a.code)} />
        {diag.why && <p className="why">{diag.why}</p>}
        {diag.also.length > 0 && (
          <div className="also-list">
            {diag.also.map((a, i) => {
              const AIc = STAGE_ICON[a.code];
              return <div className="also" key={i}><span className="also-tag"><AIc size={14} />Also: {STAGES[a.code].name}</span><span>{a.line}</span></div>;
            })}
          </div>
        )}
        <div className={`agree ${ag.tone}`}><AgIc size={16} /><b>{ag.label}.</b> {ag.line}</div>
      </div>

      {diag.claims.length > 0 && (
        <div className="card">
          <div className="card-head"><div className="nav-icon"><Quote size={17} /></div><div><p className="card-title">Claim by claim</p><p className="card-sub">Each claim in the answer, traced to a chunk or not.</p></div></div>
          <div className="claims">
            {diag.claims.map((c, i) => {
              const CI = claimIc[c.status];
              return (
                <div className="claim" key={i}>
                  <span className={`status ${c.status.toLowerCase()}`}><CI size={14} />{c.status}</span>
                  <span className="claim-text">{c.text}</span>
                  <span className="ref">{c.ref === 'none' ? 'No chunk' : c.ref}</span>
                </div>
              );
            })}
          </div>
          {diag.evidence.length > 0 && (
            <div className="evidence">
              {diag.evidence.map((e, i) => <div key={i}><span className="id-chip">{e.ref}</span>{e.line}</div>)}
            </div>
          )}
        </div>
      )}

      <div className="two">
        <div className="card">
          <div className="card-head"><div className="nav-icon"><ClipboardCheck size={17} /></div><div><p className="card-title">Cheap checks first</p><p className="card-sub">Things you can confirm without engineering.</p></div></div>
          <div className="checks">
            {diag.checks.map((c, i) => (
              <div className="check" key={i}>
                <span className="step-num sm">{i + 1}</span>
                <div><div className="check-step">{c.step}</div><div className="check-conf"><CircleCheck size={13} />Confirms if: {c.confirms}</div></div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-head"><div className="nav-icon"><Wrench size={17} /></div><div><p className="card-title">Likely fix</p><p className="card-sub">Who owns it and what to change.</p></div></div>
          <div className="fixes">
            {diag.fixes.map((f, i) => <div className="fix" key={i}><span className="owner">{f.owner}</span><span>{f.line}</span></div>)}
          </div>
          {diag.flips.length > 0 && (
            <>
              <div className="mini" style={{ margin: '16px 0 8px' }}>What would change the verdict</div>
              {diag.flips.map((f, i) => <div className="flip" key={i}><ArrowLeftRight size={15} /><span>{f}</span></div>)}
            </>
          )}
        </div>
      </div>

      {diag.ticket && (
        <div className="card ticket">
          <div className="card-head" style={{ justifyContent: 'space-between' }}>
            <div className="row"><div className="nav-icon"><Ticket size={17} /></div><div><p className="card-title">Draft ticket</p><p className="card-sub">Edit before you send it.</p></div></div>
            <CopyButton text={`${diag.ticket.title}\n\n${diag.ticket.body}`} />
          </div>
          <div className="ticket-body"><b>{diag.ticket.title}</b><p>{diag.ticket.body}</p></div>
        </div>
      )}
    </>
  );
}

function Diagnose(p) {
  const { question, setQuestion, answer, setAnswer, expected, setExpected, chunkText, setChunkText, facts, setFacts,
    opts, setOpts, provider, setProvider, apiKey, setApiKey, model, setModel, diag, setDiag, example, setExample } = p;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const chunks = useMemo(() => parseChunks(chunkText), [chunkText]);
  const signals = useMemo(() => computeSignals({ question, answer, expected, chunks, facts }), [question, answer, expected, chunks, facts]);
  const lean = useMemo(() => (chunks.length && answer.trim() ? textLean(signals, facts) : null), [signals, facts, chunks, answer]);
  const lines = useMemo(() => (chunks.length && answer.trim() ? signalLines(signals) : []), [signals, chunks, answer]);

  const prov = PROVIDERS.find((x) => x.key === provider);
  const canRun = question.trim() && answer.trim() && chunks.length > 0 && (!prov.needsKey || apiKey.trim());
  const setFact = (k) => (v) => setFacts((f) => ({ ...f, [k]: v }));
  const addOpt = (k) => (t) => setOpts((o) => ({ ...o, [k]: [...new Set([...o[k], t])] }));

  async function run() {
    setLoading(true); setError(''); setDiag(null); setExample(null);
    try {
      const r = await fetch('/api/diagnose', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey, model, question, answer, expected, facts, chunks, signals: lines })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
      const d = parseDiagnosis(data.text);
      if (!d.verdict) throw new Error('The model replied, but not in the expected line format. Try again or switch provider.');
      setDiag(d);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  function reset() {
    setExample(null); setQuestion(''); setAnswer(''); setExpected(''); setChunkText(''); setDiag(null); setError('');
    setFacts({ inKb: 'Not sure', changed: 'Not sure', symptom: 'Wrong fact', topK: 'Not sure', notes: '' });
  }

  return (
    <>
      <div className="eyebrow">Diagnose</div>
      <h2 className="h2">Find the stage that broke</h2>
      <p className="lead">One bad answer at a time. The text checks update as you type; the model verdict comes when you press Diagnose.</p>

      {example && (
        <div className="note info" style={{ marginBottom: 18, marginTop: 0 }}>
          <FlaskConical size={16} style={{ flexShrink: 0 }} />
          <span>Loaded <b>{example}</b> with its saved diagnosis. Press Diagnose to run it live, or edit anything. <button className="btn btn-ghost" style={{ padding: '4px 12px', marginLeft: 6 }} onClick={reset}><RotateCcw size={13} />Start blank</button></span>
        </div>
      )}

      <div className="card">
        <div className="card-head"><div className="step-num">1</div><div><p className="card-title">The bad answer</p><p className="card-sub">Copy these from the conversation or your logs.</p></div></div>
        <span className="field-label">The user's question</span>
        <input className="input" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g. Can I get a refund on my annual plan after 45 days?" />
        <span className="field-label">What the assistant answered</span>
        <textarea style={{ minHeight: 90 }} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Paste the assistant's reply" />
        <span className="field-label">What it should have said <span className="opt">optional, but it sharpens every check</span></span>
        <textarea style={{ minHeight: 80 }} value={expected} onChange={(e) => setExpected(e.target.value)} placeholder="The correct answer, or what the assistant should have done instead" />
      </div>

      <div className="card">
        <div className="card-head"><div className="step-num">2</div><div><p className="card-title">What search returned</p><p className="card-sub">The chunks in rank order, top result first, separated by a line with three dashes.</p></div></div>
        <div className="row" style={{ marginBottom: 10 }}>
          <button className="btn btn-ghost" onClick={() => setChunkText(CHUNK_TEMPLATE)}><Upload size={14} />Paste the template</button>
          <span className="muted">{chunks.length ? `${chunks.length} chunk${chunks.length > 1 ? 's' : ''} read` : 'Nothing read yet'}</span>
        </div>
        <textarea className="mono-ish" style={{ minHeight: 170 }} value={chunkText} onChange={(e) => setChunkText(e.target.value)} placeholder={'[source: file.md | updated: 2026-01-31 | score: 0.80]\nChunk text\n---\nNext chunk'} />
        <ChunkPreview chunks={chunks} signals={signals} />
      </div>

      <div className="card">
        <div className="card-head"><div className="step-num">3</div><div><p className="card-title">A few facts you know</p><p className="card-sub">Pick "Not sure" freely. The verdict says what to check.</p></div></div>
        <span className="field-label">Is the right answer in the knowledge base at all?</span>
        <ChipRow options={opts.inKb} value={facts.inKb} onChange={setFact('inKb')} onAdd={addOpt('inKb')} placeholder="e.g. In a PDF, not indexed" />
        <span className="field-label">Has the source document changed recently?</span>
        <ChipRow options={opts.changed} value={facts.changed} onChange={setFact('changed')} onAdd={addOpt('changed')} placeholder="e.g. Changed last week" />
        <span className="field-label">What looks wrong?</span>
        <ChipRow options={opts.symptom} value={facts.symptom} onChange={setFact('symptom')} onAdd={addOpt('symptom')} placeholder="e.g. Mixed up two products" />
        <span className="field-label">How many chunks does search return?</span>
        <ChipRow options={opts.topK} value={facts.topK} onChange={setFact('topK')} onAdd={addOpt('topK')} placeholder="e.g. 20" />
        <span className="field-label">Anything else <span className="opt">optional</span></span>
        <input className="input" value={facts.notes} onChange={(e) => setFact('notes')(e.target.value)} placeholder="e.g. Started after Tuesday's content import" />
      </div>

      {chunks.length > 0 && answer.trim() && <TextLean lean={lean} lines={lines} />}

      <div className="card">
        <div className="card-head"><div className="step-num">4</div><div><p className="card-title">Diagnose</p><p className="card-sub">The model reads everything above, plus the text checks.</p></div></div>
        <span className="field-label">Model provider</span>
        <div className="chips">
          {PROVIDERS.map((x) => <button key={x.key} className={`chip ${provider === x.key ? 'on' : ''}`} onClick={() => setProvider(x.key)}>{x.key === 'muse' ? <Sparkles size={13} /> : <KeyRound size={13} />}{x.label}</button>)}
        </div>
        <div className="row" style={{ marginTop: 12, alignItems: 'stretch' }}>
          <input className="input" style={{ flex: 2, minWidth: 220 }} type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
            placeholder={prov.needsKey ? `Your ${prov.label} API key (required)` : 'Optional: your own NVIDIA key'} />
          <input className="input" style={{ flex: 1, minWidth: 160 }} value={model} onChange={(e) => setModel(e.target.value)} placeholder="Model (optional)" />
        </div>
        <p className="muted" style={{ margin: '8px 0 14px' }}>{prov.needsKey ? 'Your key goes with this request only and is not stored.' : "Free to try on the site owner's key. Runs at temperature 0, up to 12 chunks."}</p>
        <button className="btn btn-primary" disabled={!canRun || loading} onClick={run}>
          {loading ? <><span className="loading" />Reading the chunks…</> : <><Play size={15} />Diagnose</>}
        </button>
        {error && <div className="note err"><FileWarning size={16} />{error}</div>}
      </div>

      {diag ? <Results diag={diag} lean={lean} /> : (
        <div className="note info"><Info size={16} />The diagnosis appears here: the broken stage, claim-by-claim evidence, checks to run first, the likely fix and a draft ticket.</div>
      )}
    </>
  );
}

/* ---------------- Stages ---------------- */
function Stages() {
  const groups = ['Content', 'Retrieval', 'Answer'];
  return (
    <>
      <div className="eyebrow">The eight stages</div>
      <h2 className="h2">Every way a looked-up answer goes wrong</h2>
      <p className="lead">An assistant that searches before it answers has five steps. A bad answer starts at one of them, and the fix belongs to a different owner each time.</p>
      <div className="card"><Pipeline compact={false} /></div>
      {groups.map((g) => (
        <div key={g}>
          <div className="mini" style={{ margin: '22px 0 10px' }}>{g === 'Answer' ? 'Answer writing' : g}</div>
          <div className="stage-grid">
            {CODES.filter((c) => STAGES[c].band === g).map((c) => {
              const s = STAGES[c];
              const Ic = STAGE_ICON[c];
              return (
                <div className="stage-card" key={c}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <div className="stage-ic"><Ic size={20} /></div>
                    <span className="owner">{s.owner}</span>
                  </div>
                  <h4>{s.name}</h4>
                  <p>{s.plain}</p>
                  <div className="stage-fix"><Wrench size={13} /><span>{s.fix}</span></div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

/* ---------------- Examples ---------------- */
function Examples({ loadExample }) {
  return (
    <>
      <div className="eyebrow">Examples</div>
      <h2 className="h2">Three bad answers, three different breaks</h2>
      <p className="lead">Each loads with a saved diagnosis, so it works without a key. Companies and documents are invented.</p>
      <div className="ex-grid">
        {EXAMPLES.map((e) => {
          const code = parseDiagnosis(e.diagnosis).verdict.code;
          const Ic = STAGE_ICON[code];
          return (
            <div className="ex-card" key={e.key}>
              <span className="tag dom">{e.domain}</span>
              <h4>{e.title}</h4>
              <p>{e.blurb}</p>
              <Pipeline main={code} compact />
              <span className="tag stage"><Ic size={13} />{STAGES[code].name}</span>
              <button className="btn btn-soft" onClick={() => loadExample(e.key)}><FlaskConical size={15} />Load this example</button>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ---------------- Method ---------------- */
function Method() {
  return (
    <>
      <div className="eyebrow">Method</div>
      <h2 className="h2">How the checks and the verdict work</h2>
      <p className="lead">Two readings run side by side. The text checks use fixed rules in your browser. The verdict comes from a model. When they disagree, the app says so.</p>

      <div className="card">
        <div className="card-head"><div className="nav-icon"><Hash size={17} /></div><p className="card-title">The text checks</p></div>
        <IconList items={[
          [Ruler, <><b>Coverage</b>: the share of words (four letters or more, common words removed) and numbers from the expected answer that appear in a chunk.</>],
          [Hash, <><b>Unsupported numbers</b>: numbers in the answer that appear in no chunk. The strongest sign of an invented detail.</>],
          [Scissors, <><b>Cut-off chunks</b>: a chunk ending in a colon, comma or words like "following" or "including".</>],
          [History, <><b>Version clash</b>: the same source name, ignoring version or year suffixes, retrieved with two different dates.</>],
          [Quote, <><b>Loose sentences</b>: answer sentences sharing less than half their words and numbers with any chunk.</>]
        ]} />
      </div>

      <div className="card">
        <div className="card-head"><div className="nav-icon"><ListOrdered size={17} /></div><p className="card-title">The text lean, first rule that matches wins</p></div>
        <div className="thr">
          {LEAN_RULES.map((r, i) => {
            const Ic = STAGE_ICON[r.code];
            return (
              <div className="thr-row" key={r.code}>
                <span className="tag stage"><b style={{ marginRight: 4 }}>{i + 1}</b><Ic size={13} />{STAGES[r.code].name}</span>
                <span className="muted">{r.rule}</span>
              </div>
            );
          })}
        </div>
        <p className="muted" style={{ marginTop: 12 }}>If no rule matches, the app shows no lean rather than guess. The cut-offs are starting points chosen by hand, and word matching misses synonyms, so the lean is a hint.</p>
      </div>

      <div className="card">
        <div className="card-head"><div className="nav-icon"><Bot size={17} /></div><p className="card-title">The model verdict</p></div>
        <IconList items={[
          [Layers, 'The model picks one of the eight stages, a confidence level and up to two contributing stages.'],
          [Quote, 'It must cite a chunk for every claim it makes about the chunks, and mark each claim in the answer as supported, contradicted or unsupported.'],
          [ClipboardCheck, 'It lists checks a PM can run without engineering, and what would change its mind.'],
          [Sparkles, 'Muse Glimmer on NVIDIA by default, or Anthropic, OpenAI or Gemini with your own key. Temperature 0, replies as tagged lines.']
        ]} />
      </div>

      <div className="card">
        <div className="card-head"><div className="nav-icon"><FileWarning size={17} /></div><p className="card-title">Limits worth knowing</p></div>
        <IconList items={[
          [Search, 'It only sees the chunks you paste. Whether a document exists elsewhere in the knowledge base is something you have to check.'],
          [Ruler, 'Word matching misses paraphrase and other languages. A low coverage score can mean different wording, not missing content.'],
          [CircleHelp, 'One answer is one data point. Run the cheap checks, and try a few similar questions, before calling it a pattern.'],
          [Bot, 'The verdict is a model reading evidence. Treat it as the first lead to confirm.']
        ]} />
      </div>
    </>
  );
}

/* ---------------- App ---------------- */
export default function App() {
  const mainRef = useRef(null);
  const [section, setSection] = useState('start');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [expected, setExpected] = useState('');
  const [chunkText, setChunkText] = useState('');
  const [facts, setFacts] = useState({ inKb: 'Not sure', changed: 'Not sure', symptom: 'Wrong fact', topK: 'Not sure', notes: '' });
  const [opts, setOpts] = useState(FACT_OPTIONS);
  const [provider, setProvider] = useState('muse');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [diag, setDiag] = useState(null);
  const [example, setExample] = useState(null);

  const go = (k) => { setSection(k); if (mainRef.current) mainRef.current.scrollTop = 0; window.scrollTo(0, 0); };

  function loadExample(key) {
    const e = EXAMPLES.find((x) => x.key === key);
    setQuestion(e.question); setAnswer(e.answer); setExpected(e.expected); setChunkText(e.chunks);
    setFacts(e.facts);
    setOpts((o) => {
      const n = { ...o };
      for (const k of Object.keys(FACT_OPTIONS)) if (!n[k].includes(e.facts[k])) n[k] = [...n[k], e.facts[k]];
      return n;
    });
    setDiag(parseDiagnosis(e.diagnosis));
    setExample(e.title);
    go('diagnose');
  }

  const d = {
    question, setQuestion, answer, setAnswer, expected, setExpected, chunkText, setChunkText, facts, setFacts,
    opts, setOpts, provider, setProvider, apiKey, setApiKey, model, setModel, diag, setDiag, example, setExample
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><SearchCheck size={22} /></div>
          <div><h1>Found or Fumbled?</h1><p>Triage for wrong RAG answers</p></div>
        </div>
        {NAV.map(({ key, label, desc, icon: Ic }) => (
          <button key={key} className={`nav-item ${section === key ? 'active' : ''}`} onClick={() => go(key)}>
            <span className="nav-icon"><Ic size={17} /></span>
            <span><div className="nav-label">{label}</div><div className="nav-desc">{desc}</div></span>
          </button>
        ))}
        <div className="side-foot"><Lock size={16} style={{ flexShrink: 0, marginTop: 1 }} /><span>Nothing is stored. Text goes to a model only when you press Diagnose.</span></div>
      </aside>
      <main className="main" ref={mainRef}>
        <div className="main-inner">
          {section === 'start' && <Start go={go} loadExample={loadExample} />}
          {section === 'diagnose' && <Diagnose {...d} />}
          {section === 'stages' && <Stages />}
          {section === 'examples' && <Examples loadExample={loadExample} />}
          {section === 'method' && <Method />}
        </div>
      </main>
    </div>
  );
}
