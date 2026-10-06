import { useMemo, useRef, useState } from 'react';
import {
  Scale, Compass, SlidersHorizontal, BookOpen, FlaskConical, Lock, PenLine, Users, Bot, ArrowRight,
  Play, KeyRound, Info, CircleCheck, TriangleAlert, CircleX, CircleHelp, Target, Equal, ArrowLeftRight,
  TrendingUp, Grid3x3, ListOrdered, Sparkles, SearchCheck, Replace, PlusCircle, UserCheck, Plus,
  Database, ShieldCheck, Calculator, FileWarning, Upload, RotateCcw
} from 'lucide-react';
import {
  parseScale, parseGoldenSet, parseJudgeOutput, parseDiagnosis, computeStats, THRESHOLDS, pct
} from './lib.js';
import { EXAMPLES, TEMPLATE, toCsv } from './examples.js';

const NAV = [
  { key: 'start', label: 'Start here', desc: 'What this does, in one minute', icon: Compass },
  { key: 'calibrate', label: 'Calibrate', desc: 'Check your AI judge against people', icon: SlidersHorizontal },
  { key: 'examples', label: 'Examples', desc: 'Three worked cases, no key needed', icon: FlaskConical },
  { key: 'method', label: 'Method', desc: 'Every formula and threshold, printed', icon: BookOpen }
];

const PROVIDERS = [
  { key: 'muse', label: 'Muse Glimmer (free)', needsKey: false },
  { key: 'anthropic', label: 'Anthropic', needsKey: true },
  { key: 'openai', label: 'OpenAI', needsKey: true },
  { key: 'gemini', label: 'Gemini', needsKey: true }
];

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

/* ---------------- Start here ---------------- */
function Start({ go, loadExample }) {
  const cells = 'd....m.d.....d.m....d...d'.split('');
  return (
    <>
      <div className="hero">
        <div className="hero-grid">{cells.map((c, i) => <span key={i} className={c === 'd' ? 'd' : c === 'm' ? 'm' : ''} />)}</div>
        <h2>Does your AI judge agree with your people?</h2>
        <p>Teams use one AI model to grade another. Before anyone trusts those grades, someone has to check them against scores people gave. This lab does that check and tells you which rubric line is causing the gap.</p>
        <div className="row">
          <button className="btn btn-white" onClick={() => loadExample('telco')}><FlaskConical size={16} />See a worked example</button>
          <button className="btn btn-outline" onClick={() => go('calibrate')}>Start with my own data<ArrowRight size={16} /></button>
        </div>
      </div>

      <div className="steps3">
        {[
          [PenLine, 'Write the rubric', 'The scoring guide your people already use, level by level.'],
          [Users, 'Paste a golden set', 'Items people have scored by hand. Ten is the floor, twenty is better.'],
          [Bot, 'Compare and diagnose', 'See agreement, which way the judge leans, and the wording behind each miss.']
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
          <div className="card-head"><div className="nav-icon"><Database size={17} /></div><p className="card-title">Where the numbers come from</p></div>
          <IconList items={[
            [Calculator, 'Agreement figures are worked out in your browser from your own scores, with the formulas printed under Method.'],
            [Bot, 'Judge scores and the rubric diagnosis come from the model you pick. Treat the diagnosis as a lead to check.'],
            [FlaskConical, 'The three examples use invented items written for this demo, with saved results.']
          ]} />
        </div>
        <div className="card">
          <div className="card-head"><div className="nav-icon"><ShieldCheck size={17} /></div><p className="card-title">Privacy</p></div>
          <IconList items={[
            [Lock, 'No sign-in and nothing is stored. Closing the tab clears everything.'],
            [Upload, 'Your text leaves the browser only when you press Run or Diagnose, and only to the provider you chose.'],
            [KeyRound, 'A key you paste is used for that request and never saved.']
          ]} />
        </div>
      </div>
    </>
  );
}

/* ---------------- Results ---------------- */
function Verdict({ v }) {
  const Ic = { good: CircleCheck, warn: TriangleAlert, bad: CircleX, neutral: CircleHelp }[v.tone];
  return (
    <div className={`verdict ${v.tone}`}>
      <div className="verdict-ic"><Ic size={28} /></div>
      <div><h3>{v.label}</h3><p>{v.line}</p></div>
    </div>
  );
}

function Heatmap({ stats, min }) {
  const K = stats.K;
  const max = Math.max(1, ...stats.matrix.flat());
  const cols = `34px repeat(${K}, minmax(0, 1fr))`;
  return (
    <div>
      <div className="mini" style={{ textAlign: 'center', marginBottom: 4 }}>Judge score</div>
      <div className="heat" style={{ gridTemplateColumns: cols }}>
        <div />
        {Array.from({ length: K }, (_, j) => <div key={j} className="heat-head">{j + min}</div>)}
        {stats.matrix.map((row, i) => (
          <FragmentRow key={i} row={row} i={i} min={min} max={max} />
        ))}
      </div>
      <div className="mini" style={{ marginTop: 6 }}>Rows: human score. Diagonal: agreement.</div>
    </div>
  );
}
function FragmentRow({ row, i, min, max }) {
  return (
    <>
      <div className="heat-head">{i + min}</div>
      {row.map((c, j) => {
        const a = c / max;
        const diag = i === j;
        const bg = c === 0 ? '#f6f2ee' : `rgba(242, 107, 29, ${0.18 + a * 0.82})`;
        return (
          <div key={j} className="heat-cell" style={{ background: bg, color: a > 0.5 ? '#fff' : 'var(--b900)', outline: diag ? '2px solid var(--b700)' : 'none', outlineOffset: -2 }}>
            {c || ''}
          </div>
        );
      })}
    </>
  );
}

function Results({ stats, items, scale, diag, onDiagnose, diagLoading, diagError, canRun }) {
  const range = scale.max - scale.min;
  const biasPos = Math.max(0, Math.min(100, 50 + (stats.bias / Math.max(1, range / 2)) * 50));
  const lean = Math.abs(stats.bias) < 0.15 ? 'No clear lean' : stats.bias > 0 ? 'Judge is more lenient' : 'Judge is stricter';
  const disagreements = items
    .filter((x) => x.human !== null && x.judge !== null && x.judge !== x.human)
    .sort((a, b) => Math.abs(b.judge - b.human) - Math.abs(a.judge - a.human));

  return (
    <>
      <div className="eyebrow" style={{ marginTop: 10 }}>Results</div>
      <h2 className="h2" style={{ fontSize: 24 }}>How the judge compares</h2>
      <Verdict v={stats.verdict} />

      <div className="tiles">
        <div className="tile"><div className="t-top"><Target size={15} />Weighted kappa</div><div className="t-val">{stats.kappa === null ? 'n/a' : stats.kappa.toFixed(2)}</div><div className="t-sub">Agreement beyond chance. 1 is perfect, 0 is a coin toss.</div></div>
        <div className="tile"><div className="t-top"><Equal size={15} />Exact match</div><div className="t-val">{pct(stats.exact)}</div><div className="t-sub">Same score as your people.</div></div>
        <div className="tile"><div className="t-top"><ArrowLeftRight size={15} />Close match</div><div className="t-val">{pct(stats.close)}</div><div className="t-sub">{stats.tol ? 'Within one point.' : 'Exact only on short scales.'}</div></div>
        <div className="tile"><div className="t-top"><TrendingUp size={15} />Average lean</div><div className="t-val">{stats.bias > 0 ? '+' : ''}{stats.bias.toFixed(2)}</div><div className="t-sub">Judge minus human, per item.</div></div>
      </div>

      <div className="two">
        <div className="card">
          <div className="card-head"><div className="nav-icon"><TrendingUp size={17} /></div><div><p className="card-title">Which way it leans</p><p className="card-sub">{lean}</p></div></div>
          <div className="bias-track"><div className="bias-mid" /><div className="bias-dot" style={{ left: `${biasPos}%` }} /></div>
          <div className="bias-labels"><span>Stricter</span><span>Agrees</span><span>More lenient</span></div>
          <div className="split-bar">
            <div style={{ width: `${(stats.lower / stats.n) * 100}%`, background: '#7d93ad' }} />
            <div style={{ width: `${(stats.same / stats.n) * 100}%`, background: 'var(--b200)' }} />
            <div style={{ width: `${(stats.higher / stats.n) * 100}%`, background: 'var(--b500)' }} />
          </div>
          <div className="split-legend">
            <span><i className="dot" style={{ background: '#7d93ad' }} />{stats.lower} scored lower</span>
            <span><i className="dot" style={{ background: 'var(--b200)' }} />{stats.same} matched</span>
            <span><i className="dot" style={{ background: 'var(--b500)' }} />{stats.higher} scored higher</span>
          </div>
          <div className="mini" style={{ margin: '20px 0 8px' }}>When people gave… the judge averaged</div>
          <div className="lvl-list">
            {stats.perLevel.filter(Boolean).map((l) => {
              const d = l.judgeMean - l.level;
              return (
                <div className="lvl" key={l.level}>
                  <span className="score-pill">{l.level}</span>
                  <div className="lvl-bar"><div style={{ width: `${((l.judgeMean - scale.min) / Math.max(1, range)) * 100}%` }} /></div>
                  <b>{l.judgeMean.toFixed(1)}</b>
                  <span className={`gap-tag ${Math.abs(d) < 0.05 ? '' : d > 0 ? 'up' : 'down'}`} style={{ minWidth: 44, textAlign: 'center' }}>{Math.abs(d) < 0.05 ? 'same' : `${d > 0 ? '+' : ''}${d.toFixed(1)}`}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card">
          <div className="card-head"><div className="nav-icon"><Grid3x3 size={17} /></div><div><p className="card-title">Where the scores land</p><p className="card-sub">Each cell counts items for a human and judge pair.</p></div></div>
          <Heatmap stats={stats} min={scale.min} />
        </div>
      </div>

      <div className="card">
        <div className="card-head"><div className="nav-icon"><ListOrdered size={17} /></div><div><p className="card-title">Every disagreement, biggest first</p><p className="card-sub">{disagreements.length} of {stats.n} items differ.</p></div></div>
        {disagreements.length === 0 ? <p className="muted">No disagreements. Check the golden set has enough hard cases before celebrating.</p> : (
          <div className="dis-list">
            {disagreements.map((x) => {
              const d = x.judge - x.human;
              return (
                <div className="dis" key={x.id}>
                  <div className="dis-scores">
                    <div className="dis-pair"><span className="score-pill">{x.human}</span><ArrowRight size={14} /><span className="score-pill" style={{ background: 'var(--b500)', color: '#fff' }}>{x.judge}</span></div>
                    <div className="mini">human → judge</div>
                    <span className={`gap-tag ${d > 0 ? 'up' : 'down'}`}>{d > 0 ? '+' : ''}{d}</span>
                  </div>
                  <div>
                    <h5>{x.id}{x.input ? `: ${x.input.slice(0, 110)}${x.input.length > 110 ? '…' : ''}` : ''}</h5>
                    <p><b>Response:</b> {x.response.slice(0, 220)}{x.response.length > 220 ? '…' : ''}</p>
                    {x.reason && <p className="reason"><b>Judge said:</b> {x.reason}</p>}
                    {x.note && <p><b>Human note:</b> {x.note}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <div className="nav-icon"><SearchCheck size={17} /></div>
          <div style={{ flex: 1 }}><p className="card-title">Why they disagree</p><p className="card-sub">The model reads the misses against your rubric and points to the wording behind them.</p></div>
          <button className="btn btn-soft" disabled={!canRun || diagLoading || disagreements.length === 0} onClick={onDiagnose}>
            {diagLoading ? 'Reading the misses…' : <><Sparkles size={15} />{diag ? 'Diagnose again' : 'Diagnose the rubric'}</>}
          </button>
        </div>
        {diagError && <div className="note err"><FileWarning size={16} />{diagError}</div>}
        {!diag && !diagError && <p className="muted">Run this once the numbers are in. It sends the rubric, the disagreeing items and the statistics to your chosen model.</p>}
        {diag && <Diagnosis d={diag} />}
      </div>
    </>
  );
}

function Diagnosis({ d }) {
  return (
    <>
      {d.summary && <div className="note info"><Info size={16} style={{ flexShrink: 0 }} />{d.summary}</div>}
      {d.ambiguities.length > 0 && (
        <div className="diag-block">
          <h4><SearchCheck size={17} color="var(--b600)" />Wording the judge reads differently</h4>
          {d.ambiguities.map((a, i) => (
            <div className="diag-item" key={i}>
              <div className="q">“{a.phrase}”</div>
              <div>{a.how}</div>
              <div>{a.ids.map((id) => <span className="id-chip" key={id}>{id}</span>)}</div>
            </div>
          ))}
        </div>
      )}
      {d.rewrites.length > 0 && (
        <div className="diag-block">
          <h4><Replace size={17} color="var(--b600)" />Suggested rubric changes</h4>
          {d.rewrites.map((r, i) => (
            <div className="diag-item rewrite" key={i}>
              {/new line/i.test(r.from) ? <span className="id-chip" style={{ justifySelf: 'start' }}>New line</span> : <span className="old">{r.from}</span>}
              <ArrowRight size={16} color="var(--b600)" />
              <span className="new">{r.to}</span>
            </div>
          ))}
        </div>
      )}
      {d.addCases.length > 0 && (
        <div className="diag-block">
          <h4><PlusCircle size={17} color="var(--b600)" />Items to add to the golden set</h4>
          {d.addCases.map((c, i) => (
            <div className="diag-item" key={i}><div className="q">{c.item}</div><div>Tests: {c.tests}</div></div>
          ))}
        </div>
      )}
      {d.humanChecks.length > 0 && (
        <div className="diag-block">
          <h4><UserCheck size={17} color="var(--b600)" />Human labels worth a second look</h4>
          {d.humanChecks.map((c, i) => (
            <div className="diag-item" key={i}><span className="id-chip">{c.id}</span> {c.why}</div>
          ))}
        </div>
      )}
    </>
  );
}

/* ---------------- Calibrate ---------------- */
function Calibrate(p) {
  const {
    criterion, setCriterion, criteria, setCriteria, scaleLabel, setScaleLabel, scales, setScales,
    rubric, setRubric, csv, setCsv, source, setSource, provider, setProvider, apiKey, setApiKey,
    model, setModel, judged, setJudged, diag, setDiag, example, setExample
  } = p;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagError, setDiagError] = useState('');

  const scale = parseScale(scaleLabel) || { min: 1, max: 5 };
  const parsed = useMemo(() => parseGoldenSet(csv), [csv]);
  const items = useMemo(() => parsed.items.map((it) => {
    if (source === 'have') return it;
    const j = judged[it.id];
    return { ...it, judge: j ? j.score : null, reason: j ? j.reason : '' };
  }), [parsed, judged, source]);
  const stats = useMemo(() => computeStats(items, scale.min, scale.max), [items, scale.min, scale.max]);
  const prov = PROVIDERS.find((x) => x.key === provider);
  const canRun = rubric.trim() && parsed.items.length > 0 && (!prov.needsKey || apiKey.trim());

  async function call(mode, payloadItems, extra = {}) {
    const r = await fetch('/api/judge', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, provider, apiKey, model, rubric, criterion, scaleMin: scale.min, scaleMax: scale.max, items: payloadItems, ...extra })
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
    return data.text || '';
  }

  async function runJudge() {
    setLoading(true); setError(''); setDiag(null); setDiagError(''); setExample(null);
    try {
      const text = await call('score', parsed.items.slice(0, 25).map(({ id, input, response }) => ({ id, input, response })));
      const out = parseJudgeOutput(text, scale.min, scale.max);
      const got = Object.keys(out).length;
      if (!got) throw new Error('The model replied, but not in the expected line format. Try again or switch provider.');
      setJudged(out);
      if (got < parsed.items.length) setError(`The judge returned scores for ${got} of ${parsed.items.length} items. The rest are left out of the numbers.`);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  async function runDiagnose() {
    setDiagLoading(true); setDiagError('');
    try {
      const scored = items.filter((x) => x.human !== null && x.judge !== null);
      const dis = scored.filter((x) => x.human !== x.judge);
      const agree = scored.filter((x) => x.human === x.judge).slice(0, 3);
      const text = await call('diagnose', [...dis, ...agree].slice(0, 25), {
        stats: { n: stats.n, kappa: stats.kappa?.toFixed(2), exact: pct(stats.exact), close: pct(stats.close), bias: stats.bias.toFixed(2) }
      });
      const d = parseDiagnosis(text);
      if (!d.summary && !d.ambiguities.length && !d.rewrites.length) throw new Error('The model replied, but not in the expected line format. Try again or switch provider.');
      setDiag(d);
    } catch (e) { setDiagError(e.message); }
    setDiagLoading(false);
  }

  function reset() {
    setExample(null); setCsv(''); setRubric(''); setJudged({}); setDiag(null); setError('');
  }

  return (
    <>
      <div className="eyebrow">Calibrate</div>
      <h2 className="h2">Check your judge against people</h2>
      <p className="lead">Three steps. The numbers appear as soon as there are judge scores to compare.</p>

      {example && (
        <div className="note info" style={{ marginBottom: 18, marginTop: 0 }}>
          <FlaskConical size={16} style={{ flexShrink: 0 }} />
          <span>Loaded the <b>{example}</b> example with saved judge scores and diagnosis. Press Run the judge to score it live, or edit anything below. <button className="btn btn-ghost" style={{ padding: '4px 12px', marginLeft: 6 }} onClick={reset}><RotateCcw size={13} />Start blank</button></span>
        </div>
      )}

      <div className="card">
        <div className="card-head"><div className="step-num">1</div><div><p className="card-title">The rubric</p><p className="card-sub">What is being judged, the scale, and what each level means.</p></div></div>
        <span className="field-label">What is being judged</span>
        <ChipRow options={criteria} value={criterion} onChange={setCriterion} onAdd={(t) => setCriteria((c) => [...new Set([...c, t])])} placeholder="e.g. Tone of voice" />
        <span className="field-label">Scale</span>
        <ChipRow options={scales} value={scaleLabel} onChange={setScaleLabel} onAdd={(t) => parseScale(t) && setScales((s) => [...new Set([...s, t])])} addLabel="Custom scale" placeholder="e.g. 0-10" />
        <span className="field-label">Level descriptions</span>
        <textarea value={rubric} onChange={(e) => setRubric(e.target.value)} placeholder={'5 = ...\n4 = ...\n3 = ...\n2 = ...\n1 = ...'} />
      </div>

      <div className="card">
        <div className="card-head"><div className="step-num">2</div><div><p className="card-title">The golden set</p><p className="card-sub">Paste from a spreadsheet. Columns: id, input, response, human, note. Add judge and judge_reason if you already have judge scores.</p></div></div>
        <div className="row" style={{ marginBottom: 10 }}>
          <button className="btn btn-ghost" onClick={() => setCsv(TEMPLATE)}><Upload size={14} />Paste the template</button>
          <span className="muted">{parsed.items.length ? `${parsed.items.length} items read` : 'Nothing read yet'}</span>
        </div>
        <textarea className="mono-ish" style={{ minHeight: 160 }} value={csv} onChange={(e) => setCsv(e.target.value)} placeholder="id,input,response,human,note" />
        {csv.trim() && parsed.problems.map((pr, i) => <div className="note warn" key={i}><TriangleAlert size={16} />{pr}</div>)}
        {parsed.items.length > 0 && (
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>id</th><th>Input</th><th>Response</th><th>Human</th><th>Judge</th></tr></thead>
              <tbody>
                {items.slice(0, 25).map((x) => (
                  <tr key={x.id}>
                    <td><b>{x.id}</b></td>
                    <td className="clip"><div>{x.input}</div></td>
                    <td className="clip"><div>{x.response}</div></td>
                    <td><span className="score-pill">{x.human ?? '?'}</span></td>
                    <td>{x.judge !== null ? <span className="score-pill" style={{ background: 'var(--b500)', color: '#fff' }}>{x.judge}</span> : <span className="muted">-</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-head"><div className="step-num">3</div><div><p className="card-title">Judge scores</p><p className="card-sub">Let a model score the set now, or use judge scores already in your data.</p></div></div>
        <ChipRow
          options={['Run the judge now', 'Use judge scores in my data']}
          value={source === 'run' ? 'Run the judge now' : 'Use judge scores in my data'}
          onChange={(v) => setSource(v === 'Run the judge now' ? 'run' : 'have')}
        />
        {source === 'have' && !parsed.hasJudge && parsed.items.length > 0 && <div className="note warn"><TriangleAlert size={16} />No judge column found. Add a column headed "judge".</div>}
        {source === 'run' && (
          <>
            <span className="field-label">Model provider</span>
            <div className="chips">
              {PROVIDERS.map((x) => <button key={x.key} className={`chip ${provider === x.key ? 'on' : ''}`} onClick={() => setProvider(x.key)}>{x.key === 'muse' ? <Sparkles size={13} /> : <KeyRound size={13} />}{x.label}</button>)}
            </div>
            <div className="row" style={{ marginTop: 12, alignItems: 'stretch' }}>
              <input className="input" style={{ flex: 2, minWidth: 220 }} type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                placeholder={prov.needsKey ? `Your ${prov.label} API key (required)` : 'Optional: your own NVIDIA key'} />
              <input className="input" style={{ flex: 1, minWidth: 160 }} value={model} onChange={(e) => setModel(e.target.value)} placeholder="Model (optional)" />
            </div>
            <p className="muted" style={{ margin: '8px 0 14px' }}>{prov.needsKey ? 'Your key goes with this request only and is not stored.' : 'Free to try on the site owner\'s key. Runs at temperature 0, up to 25 items.'}</p>
            <button className="btn btn-primary" disabled={!canRun || loading} onClick={runJudge}>
              {loading ? <><span className="loading" />Scoring {Math.min(25, parsed.items.length)} items…</> : <><Play size={15} />Run the judge</>}
            </button>
          </>
        )}
        {error && <div className="note err"><FileWarning size={16} />{error}</div>}
      </div>

      {stats ? (
        <Results stats={stats} items={items} scale={scale} diag={diag} onDiagnose={runDiagnose} diagLoading={diagLoading} diagError={diagError} canRun={canRun} />
      ) : (
        <div className="note info"><Info size={16} />Results appear here once items have both a human score and a judge score.</div>
      )}
    </>
  );
}

/* ---------------- Examples ---------------- */
function Examples({ loadExample }) {
  return (
    <>
      <div className="eyebrow">Examples</div>
      <h2 className="h2">Three judges, three verdicts</h2>
      <p className="lead">Each one loads with saved judge scores and a saved diagnosis, so it works without a key. The items are invented for this demo.</p>
      <div className="ex-grid">
        {EXAMPLES.map((e) => {
          const sc = parseScale(e.scale);
          const st = computeStats(e.items, sc.min, sc.max);
          return (
            <div className="ex-card" key={e.key}>
              <span className="tag dom">{e.domain}</span>
              <h4>{e.title}</h4>
              <p>{e.blurb}</p>
              <span className={`tag ${st.verdict.tone}`}>{st.verdict.label} · kappa {st.kappa.toFixed(2)}</span>
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
  const T = THRESHOLDS;
  return (
    <>
      <div className="eyebrow">Method</div>
      <h2 className="h2">How the verdict is worked out</h2>
      <p className="lead">The numbers and the verdict use fixed formulas with no model involved. Only the judge scores and the diagnosis come from a model.</p>

      <div className="card">
        <div className="card-head"><div className="nav-icon"><Calculator size={17} /></div><p className="card-title">The four numbers</p></div>
        <IconList items={[
          [Target, <><b>Weighted kappa</b> (quadratic, Cohen 1968). Agreement after removing what chance alone would produce, with bigger misses penalised more. <div className="formula">kappa = 1 − Σ w·observed ÷ Σ w·expected, where w = (i − j)² ÷ (levels − 1)²</div></>],
          [Equal, <><b>Exact match</b>: share of items where the judge gave the same score as the human.</>],
          [ArrowLeftRight, <><b>Close match</b>: within one point on scales with four or more levels; exact only on shorter scales, where one point is a big jump.</>],
          [TrendingUp, <><b>Average lean</b>: mean of judge minus human. Positive means the judge is more lenient than your people.</>]
        ]} />
      </div>

      <div className="card">
        <div className="card-head"><div className="nav-icon"><Scale size={17} /></div><p className="card-title">Verdict thresholds</p></div>
        <div className="thr">
          <div className="thr-row"><span className="tag neutral" style={{ background: 'var(--b50)', color: 'var(--b700)' }}>Too few items to tell</span><span className="muted">Fewer than {T.minItems} items with both scores.</span></div>
          <div className="thr-row"><span className="tag good">Trust it, with spot checks</span><span className="muted">Kappa at least {T.trust.kappa}, close match at least {pct(T.trust.close)}, and average lean within ±{T.trust.bias}.</span></div>
          <div className="thr-row"><span className="tag warn">Usable after rubric fixes</span><span className="muted">Kappa at least {T.usable.kappa} and close match at least {pct(T.usable.close)}.</span></div>
          <div className="thr-row"><span className="tag bad">Recalibrate before you rely on it</span><span className="muted">Anything below that.</span></div>
        </div>
        <p className="muted" style={{ marginTop: 12 }}>The kappa cut-offs follow the common reading that 0.6 is substantial and 0.8 is near-complete agreement. They are a starting point; a launch gate may need stricter ones.</p>
      </div>

      <div className="card">
        <div className="card-head"><div className="nav-icon"><FileWarning size={17} /></div><p className="card-title">Limits worth knowing</p></div>
        <IconList items={[
          [ListOrdered, 'Ten items gives a rough read. Twenty to fifty, with hard cases on purpose, gives one you can defend.'],
          [Grid3x3, 'If nearly every human score is the same level, kappa can come out low even when the judge mostly agrees. Check the heatmap.'],
          [UserCheck, 'Human labels can be wrong too. Where two people disagree with each other, sort that out before blaming the judge.'],
          [Bot, 'The judge runs at temperature 0 but can still vary between runs and providers. Re-run before you sign anything off.'],
          [Sparkles, 'The diagnosis is a model reading your rubric. Use it to find candidate fixes, then re-run the judge to see whether they work.']
        ]} />
      </div>
    </>
  );
}

/* ---------------- App ---------------- */
export default function App() {
  const mainRef = useRef(null);
  const [section, setSection] = useState('start');
  const [criteria, setCriteria] = useState(['Policy accuracy', 'Faithfulness to the transcript', 'Call resolution', 'Helpfulness', 'Tone']);
  const [criterion, setCriterion] = useState('Helpfulness');
  const [scales, setScales] = useState(['1-3', '1-4', '1-5']);
  const [scaleLabel, setScaleLabel] = useState('1-5');
  const [rubric, setRubric] = useState('');
  const [csv, setCsv] = useState('');
  const [source, setSource] = useState('run');
  const [provider, setProvider] = useState('muse');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [judged, setJudged] = useState({});
  const [diag, setDiag] = useState(null);
  const [example, setExample] = useState(null);

  const go = (k) => { setSection(k); if (mainRef.current) mainRef.current.scrollTop = 0; window.scrollTo(0, 0); };

  function loadExample(key) {
    const e = EXAMPLES.find((x) => x.key === key);
    setCriteria((c) => [...new Set([...c, e.criterion])]);
    setCriterion(e.criterion);
    setScales((s) => [...new Set([...s, e.scale])]);
    setScaleLabel(e.scale);
    setRubric(e.rubric);
    setCsv(toCsv(e.items, false));
    setSource('run');
    const j = {};
    e.items.forEach((it) => { j[it.id] = { score: it.judge, reason: it.reason }; });
    setJudged(j);
    setDiag(parseDiagnosis(e.diagnosis));
    setExample(e.title);
    go('calibrate');
  }

  const cal = {
    criterion, setCriterion, criteria, setCriteria, scaleLabel, setScaleLabel, scales, setScales,
    rubric, setRubric, csv, setCsv, source, setSource, provider, setProvider, apiKey, setApiKey,
    model, setModel, judged, setJudged, diag, setDiag, example, setExample
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Scale size={22} /></div>
          <div><h1>Judge Calibration Lab</h1><p>Check the grader before the grades</p></div>
        </div>
        {NAV.map(({ key, label, desc, icon: Ic }) => (
          <button key={key} className={`nav-item ${section === key ? 'active' : ''}`} onClick={() => go(key)}>
            <span className="nav-icon"><Ic size={17} /></span>
            <span><div className="nav-label">{label}</div><div className="nav-desc">{desc}</div></span>
          </button>
        ))}
        <div className="side-foot"><Lock size={16} style={{ flexShrink: 0, marginTop: 1 }} /><span>Nothing is stored. Text goes to a model only when you press Run or Diagnose.</span></div>
      </aside>
      <main className="main" ref={mainRef}>
        <div className="main-inner">
          {section === 'start' && <Start go={go} loadExample={loadExample} />}
          {section === 'calibrate' && <Calibrate {...cal} />}
          {section === 'examples' && <Examples loadExample={loadExample} />}
          {section === 'method' && <Method />}
        </div>
      </main>
    </div>
  );
}
