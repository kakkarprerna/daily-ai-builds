import { useMemo, useRef, useState } from 'react';
import {
  Compass,
  Columns2,
  ListChecks,
  Trophy,
  Rows3,
  FlaskConical,
  BookOpen,
  Settings2,
  ArrowRight,
  Play,
  Square,
  Loader2,
  Plus,
  Trash2,
  Info,
  Scale,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  TriangleAlert,
  Minus,
  Shuffle,
  MessageSquare,
  StickyNote,
  Gavel,
  Brain,
  Sigma,
  Repeat,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { Shell, Banners, SectionHead, Empty, ChipRow, Pill, MethodGrid, IconList, Steps, SettingsPanel, SavedBanner, useSettings, toggleIn, addOption } from './kit/ui.jsx';
import { callApi, sleep } from './kit/api.js';
import { parseJudge, combine, scoreboard } from './judge.js';
import { EXAMPLES } from './examples.js';

const SECTIONS = [
  { id: 'start', title: 'Start here', desc: 'What this compares, in a minute', icon: Compass },
  { id: 'prompts', title: 'Prompts & rubric', desc: 'Variant A, variant B, what counts', icon: Columns2 },
  { id: 'tests', title: 'Test set', desc: 'The messages both prompts answer', icon: ListChecks },
  { id: 'board', title: 'Scoreboard', desc: 'Winner, scores and the order check', icon: Trophy },
  { id: 'cases', title: 'Case by case', desc: 'Both replies and the judge\'s reason', icon: Rows3 },
  { id: 'examples', title: 'Worked examples', desc: 'Three saved comparisons, no key needed', icon: FlaskConical },
  { id: 'method', title: 'Method', desc: 'How judging works and its limits', icon: BookOpen },
  { id: 'settings', title: 'Model & key', desc: 'Pick who answers and judges', icon: Settings2 },
];

const DEFAULT_CRITERIA = ['Accuracy', 'Policy compliance', 'Tone', 'Conciseness'];
let nid = 0;
const caseId = () => `c${nid++}`;
const blankCase = () => ({ id: caseId(), prompt: '', notes: '', enabled: true });

const WIN_META = {
  A: { cls: 'brand', icon: Trophy, label: 'A wins' },
  B: { cls: 'brand', icon: Trophy, label: 'B wins' },
  Tie: { cls: 'quiet', icon: Minus, label: 'Tie' },
  Split: { cls: 'warn', icon: Shuffle, label: 'Order-sensitive' },
};

const f1 = (v) => (v == null ? 'n/a' : v.toFixed(1));

export default function App() {
  const [section, setSection] = useState('start');
  const mainRef = useRef(null);
  const stopRef = useRef(false);
  const { settings, setSettings, provider, keyMissing } = useSettings();

  const [variantA, setVariantA] = useState('');
  const [variantB, setVariantB] = useState('');
  const [critOpts, setCritOpts] = useState(['Accuracy', 'Policy compliance', 'Tone', 'Conciseness', 'Completeness', 'Empathy', 'Clarity']);
  const [criteria, setCriteria] = useState(DEFAULT_CRITERIA);
  const [cases, setCases] = useState([blankCase(), blankCase(), blankCase()]);
  const [biasCheck, setBiasCheck] = useState(true);
  const [results, setResults] = useState({});
  const [judgedCriteria, setJudgedCriteria] = useState(DEFAULT_CRITERIA);
  const [saved, setSaved] = useState(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(null);

  const board = useMemo(() => scoreboard(cases, results, judgedCriteria), [cases, results, judgedCriteria]);
  const enabled = cases.filter((c) => c.enabled && c.prompt.trim());

  const go = (id) => {
    setSection(id);
    if (mainRef.current) mainRef.current.scrollTop = 0;
    window.scrollTo?.(0, 0);
  };

  const loadExample = (ex) => {
    setVariantA(ex.variantA);
    setVariantB(ex.variantB);
    setCritOpts((o) => [...new Set([...o, ...ex.criteria])]);
    setCriteria(ex.criteria);
    setJudgedCriteria(ex.criteria);
    setCases(ex.cases.map((c) => ({ id: c.id, prompt: c.prompt, notes: c.notes || '', enabled: true })));
    const res = {};
    ex.cases.forEach((c) => {
      const runs = [parseJudge(c.ab, 'AB', ex.criteria), parseJudge(c.ba, 'BA', ex.criteria)];
      res[c.id] = { status: 'done', a: c.a, b: c.b, combined: combine(runs, ex.criteria) };
    });
    setResults(res);
    setBiasCheck(true);
    setSaved(ex.title);
    setOpen(null);
    setError('');
    go('board');
  };

  const setCase = (id, patch) => setCases((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const runOne = async (c) => {
    setResults((r) => ({ ...r, [c.id]: { status: 'running' } }));
    try {
      const [ra, rb] = await Promise.all([
        callApi('respond', { system: variantA, message: c.prompt }, settings),
        callApi('respond', { system: variantB, message: c.prompt }, settings),
      ]);
      setResults((r) => ({ ...r, [c.id]: { status: 'running', a: ra.reply, b: rb.reply } }));
      const judgeOnce = async (order) => {
        const [first, second] = order === 'AB' ? [ra.reply, rb.reply] : [rb.reply, ra.reply];
        const { report } = await callApi('judge', { message: c.prompt, notes: c.notes, criteria, first, second }, settings);
        const parsed = parseJudge(report, order, criteria);
        if (!parsed) throw new Error(`The judge's reply could not be read (order ${order}). Raw reply: ${report.slice(0, 200)}`);
        return parsed;
      };
      const runs = [await judgeOnce('AB')];
      if (biasCheck) {
        await sleep(300);
        runs.push(await judgeOnce('BA'));
      }
      setResults((r) => ({ ...r, [c.id]: { status: 'done', a: ra.reply, b: rb.reply, combined: combine(runs, criteria) } }));
      return null;
    } catch (e) {
      setResults((r) => ({ ...r, [c.id]: { ...r[c.id], status: 'error', error: e.message } }));
      return e;
    }
  };

  const runAll = async () => {
    setError('');
    if (!variantA.trim() || !variantB.trim()) return setError('Write both system prompts under Prompts & rubric.');
    if (!criteria.length) return setError('Pick at least one rubric criterion.');
    if (!enabled.length) return setError('Add at least one test message.');
    if (keyMissing) return setError(`Add your ${provider.name} key in Model & key first.`);
    stopRef.current = false;
    setRunning(true);
    setSaved(null);
    setResults({});
    setJudgedCriteria(criteria);
    go('cases');
    let fails = 0;
    for (let i = 0; i < enabled.length; i++) {
      if (stopRef.current) break;
      setProgress(`Case ${i + 1} of ${enabled.length}: answering under A and B, then judging${biasCheck ? ' in both orders' : ''}`);
      const err = await runOne(enabled[i]);
      if (err && ++fails >= 2 && i < 2) {
        setError(`Stopped after repeated errors: ${err.message}`);
        break;
      }
      await sleep(400);
    }
    setRunning(false);
    setProgress('');
    go('board');
  };

  const verdict = (() => {
    if (!board.n) return null;
    if (board.winsA === board.winsB) return { cls: 'warn', title: 'No clear winner', line: 'The two prompts won the same number of cases. Look at the criteria where they differ.' };
    const w = board.winsA > board.winsB ? 'A' : 'B';
    const lead = Math.abs(board.winsA - board.winsB);
    return {
      cls: lead >= Math.ceil(board.n / 3) ? 'ok' : 'warn',
      title: `Variant ${w} is better`,
      line: lead >= Math.ceil(board.n / 3) ? `It won ${w === 'A' ? board.winsA : board.winsB} of ${board.n} cases.` : `A narrow lead: ${board.winsA} to ${board.winsB}. Add cases before deciding.`,
    };
  })();

  const badge = (id) => {
    if (id === 'tests') return { text: enabled.length };
    if (id === 'board' && board.n) return { text: `A ${board.winsA} · B ${board.winsB}` };
    if (id === 'cases' && board.split) return { text: `${board.split} split`, cls: 'warn' };
    return null;
  };

  const noResult = (
    <Empty
      icon={Trophy}
      title="No comparison yet"
      action={
        <div className="row" style={{ justifyContent: 'center' }}>
          <button className="btn primary" onClick={() => go('examples')}>
            <FlaskConical size={18} /> Load a worked example
          </button>
          <button className="btn ghost" onClick={() => go('prompts')}>
            Set up a comparison
          </button>
        </div>
      }
    >
      Write two prompts and a few test messages, or open a saved comparison.
    </Empty>
  );

  const runBar = (
    <div className="run-bar">
      <span className="row" style={{ gap: 10 }}>
        <button className={`switch ${biasCheck ? 'on' : ''}`} aria-label="Check position bias" onClick={() => setBiasCheck((v) => !v)} />
        Judge twice, swapping order
      </span>
      <div className="row">
        {running && (
          <button className="btn ghost small" onClick={() => (stopRef.current = true)}>
            <Square size={14} /> Stop
          </button>
        )}
        <button className="btn primary" onClick={runAll} disabled={running}>
          {running ? <Loader2 size={18} className="spin" /> : <Play size={18} />} Run {enabled.length || ''} cases
        </button>
      </div>
    </div>
  );

  return (
    <Shell
      brand={{ name: 'A/B Eval Dashboard', sub: 'Which prompt is actually better?', icon: Scale }}
      sections={SECTIONS}
      section={section}
      go={go}
      badge={badge}
      provider={provider}
      keyMissing={keyMissing}
      mainRef={mainRef}
    >
      <Banners error={error} setError={setError} progress={running ? progress : ''} />

      {section === 'start' && (
        <section>
          <div className="hero">
            <div className="hero-text">
              <div className="kicker">For anyone choosing between two prompts</div>
              <h1>Which prompt is actually better?</h1>
              <p>
                Reading two drafts and picking the one that feels nicer is a weak way to ship. Run both on the same messages, let a judge model score them against your rubric,
                and check the verdict holds when the order is swapped.
              </p>
              <div className="row">
                <button className="btn primary" onClick={() => go('examples')}>
                  <FlaskConical size={18} /> See a worked example
                </button>
                <button className="btn ghost" onClick={() => go('prompts')}>
                  Compare my prompts <ArrowRight size={18} />
                </button>
              </div>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <div className="hv-card" style={{ width: '44%', top: 18, left: 0, transform: 'rotate(-3deg)' }}>
                <span className="vtag">A</span>
                <span className="hv-line" />
                <span className="hv-line short" />
                <b style={{ fontSize: 22, color: 'var(--p-700)' }}>4.5</b>
              </div>
              <div className="hv-card" style={{ width: '44%', top: 40, right: 0, transform: 'rotate(3deg)' }}>
                <span className="vtag b">B</span>
                <span className="hv-line" />
                <span className="hv-line short" />
                <b style={{ fontSize: 22, color: 'var(--ink-3)' }}>3.1</b>
              </div>
              <span className="hv-pill solid" style={{ bottom: 6, left: '22%' }}>
                <ArrowLeftRight size={15} /> Holds when swapped
              </span>
            </div>
          </div>
          <Steps
            items={[
              { icon: Columns2, t: 'Write both prompts', d: 'The version you run today and the one you are considering, plus a rubric.' },
              { icon: ListChecks, t: 'Add test messages', d: 'Real situations, with an optional note telling the judge what to watch for.' },
              { icon: Trophy, t: 'Read the scoreboard', d: 'Wins, average scores per criterion, and which cases flipped with the order.' },
            ]}
          />
          <div className="card soft">
            <h3 className="card-title">
              <Info size={18} /> Where the results come from
            </h3>
            <IconList
              items={[
                { icon: MessageSquare, text: <><b>Replies</b> come from the chosen model answering each message under prompt A and prompt B.</> },
                { icon: Gavel, text: <><b>Scores and winners</b> come from the same model acting as judge, seeing both replies and your rubric. It is an opinion, so the order check exists to test it.</> },
                { icon: Sigma, text: <><b>Totals and averages</b> are worked out in your browser from the judge's scores.</> },
              ]}
            />
          </div>
        </section>
      )}

      {section === 'prompts' && (
        <section>
          <SectionHead icon={Columns2} kicker="Step 1" title="Prompts & rubric">
            Two versions of the same assistant, and the qualities you want the judge to score.
          </SectionHead>
          <div className="two-col">
            {[
              ['A', variantA, setVariantA, 'The current prompt, or the first option'],
              ['B', variantB, setVariantB, 'The challenger'],
            ].map(([k, v, set, hint]) => (
              <div className="card" key={k} style={{ marginBottom: 0 }}>
                <div className="row" style={{ marginBottom: 12 }}>
                  <span className={`vtag ${k === 'B' ? 'b' : ''}`}>{k}</span>
                  <div>
                    <b>Variant {k}</b>
                    <div className="small-text muted">{hint}</div>
                  </div>
                </div>
                <textarea rows={9} aria-label={`Variant ${k}`} value={v} onChange={(e) => set(e.target.value)} placeholder="Paste the system prompt" />
              </div>
            ))}
          </div>
          <div className="card" style={{ marginTop: 18 }}>
            <ChipRow label="Rubric" hint="Each scored 1 to 5 for both replies" options={critOpts} selected={criteria} onToggle={toggleIn(setCriteria)} onAdd={addOption(setCritOpts, setCriteria)} />
          </div>
          {runBar}
        </section>
      )}

      {section === 'tests' && (
        <section>
          <SectionHead icon={ListChecks} kicker="Step 2" title="Test set">
            Messages real users send, especially the awkward ones. A note tells the judge what a good answer must or must not do.
          </SectionHead>
          <div className="rows" style={{ marginBottom: 14 }}>
            {cases.map((c, i) => (
              <div className="rowcard" key={c.id}>
                <button className={`switch ${c.enabled ? 'on' : ''}`} aria-label={c.enabled ? 'Switch off' : 'Switch on'} onClick={() => setCase(c.id, { enabled: !c.enabled })} style={{ marginTop: 10 }} />
                <div className="rowcard-body" style={{ gap: 8 }}>
                  <input type="text" aria-label={`Test ${i + 1}`} value={c.prompt} onChange={(e) => setCase(c.id, { prompt: e.target.value })} placeholder={`Test message ${i + 1}`} />
                  <input type="text" aria-label={`Note for test ${i + 1}`} value={c.notes} onChange={(e) => setCase(c.id, { notes: e.target.value })} placeholder="Optional note for the judge, e.g. Must not promise a refund" />
                </div>
                <button className="icon-btn" aria-label="Remove" onClick={() => setCases((cs) => cs.filter((x) => x.id !== c.id))} disabled={cases.length === 1}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <button className="chip add" onClick={() => setCases((cs) => (cs.length >= 12 ? cs : [...cs, blankCase()]))} disabled={cases.length >= 12}>
            <Plus size={14} /> Add a test {cases.length >= 12 && '(12 maximum)'}
          </button>
          {runBar}
        </section>
      )}

      {section === 'board' && (
        <section>
          <SectionHead icon={Trophy} kicker="Step 3" title="Scoreboard">
            Who won, by how much, on which criteria, and whether the verdict survived swapping the order.
          </SectionHead>
          <SavedBanner title={saved} />
          {!board.n ? (
            noResult
          ) : (
            <>
              <div className={`verdict ${verdict.cls}`}>
                <div className="verdict-icon">{verdict.cls === 'ok' ? <Trophy size={30} /> : <TriangleAlert size={30} />}</div>
                <div>
                  <div className="verdict-top">
                    <h3>{verdict.title}</h3>
                    <Pill cls="brand">
                      A {f1(board.meanA)} · B {f1(board.meanB)} average
                    </Pill>
                  </div>
                  <p className="verdict-line">{verdict.line}</p>
                  {board.split > 0 && <p>{board.split} case{board.split > 1 ? 's' : ''} changed winner when the order was swapped, so it is left out of both tallies.</p>}
                </div>
              </div>
              <div className="stats">
                <div className="stat">
                  <span className="vtag">A</span>
                  <b>{board.winsA}</b>
                  <span>wins for A</span>
                </div>
                <div className="stat">
                  <span className="vtag b">B</span>
                  <b>{board.winsB}</b>
                  <span>wins for B</span>
                </div>
                <div className="stat">
                  <Minus size={18} />
                  <b>{board.ties}</b>
                  <span>ties</span>
                </div>
                <div className={`stat ${board.split ? 'warn' : ''}`}>
                  <Shuffle size={18} />
                  <b>{board.split}</b>
                  <span>order-sensitive</span>
                </div>
              </div>
              <div className="two-col">
                <div className="card">
                  <h3 className="card-title">
                    <Target size={18} /> Average score per criterion
                  </h3>
                  {board.perCrit.map(({ c, a, b }) => (
                    <div className="crit" key={c}>
                      <div className="meter-top">
                        <span>{c}</span>
                        <span>
                          A {f1(a)} · B {f1(b)}
                        </span>
                      </div>
                      <div className="pair">
                        <span className="pair-bar a" style={{ width: `${((a || 0) / 5) * 100}%` }} />
                        <span className="pair-bar b" style={{ width: `${((b || 0) / 5) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <h3 className="card-title">
                    <ArrowLeftRight size={18} /> Order check
                  </h3>
                  {board.twoRuns ? (
                    <>
                      <p className="small-text" style={{ color: 'var(--ink-2)', marginBottom: 14 }}>
                        Each pair was judged twice, once with A shown first and once with B first. A judge that favours whatever it reads first would make the winner follow the slot.
                      </p>
                      <div className="rows">
                        <div className="row between">
                          <span className="small-text">
                            <b>A shown first</b>
                          </span>
                          <span className="small-text">
                            A {board.abOrder.A} · B {board.abOrder.B}
                          </span>
                        </div>
                        <div className="row between">
                          <span className="small-text">
                            <b>B shown first</b>
                          </span>
                          <span className="small-text">
                            A {board.baOrder.A} · B {board.baOrder.B}
                          </span>
                        </div>
                      </div>
                      <p className="note" style={{ marginTop: 14 }}>
                        {board.split === 0 ? (
                          <>
                            <CircleCheck size={15} /> Every case kept its winner when swapped. The verdict follows the content.
                          </>
                        ) : (
                          <>
                            <Shuffle size={15} /> {board.split} of {board.twoRuns} cases flipped. Read those under Case by case before trusting the margin.
                          </>
                        )}
                      </p>
                    </>
                  ) : (
                    <p className="note">
                      <Info size={15} /> This run judged each pair once. Switch on "Judge twice, swapping order" to check the judge isn't favouring a slot.
                    </p>
                  )}
                </div>
              </div>
              <button className="btn ghost" onClick={() => go('cases')}>
                <Rows3 size={18} /> See each case
              </button>
            </>
          )}
        </section>
      )}

      {section === 'cases' && (
        <section>
          <SectionHead icon={Rows3} title="Case by case">
            Open a case to read both replies, the scores and the judge's reason.
          </SectionHead>
          <SavedBanner title={saved} />
          {!Object.keys(results).length ? (
            noResult
          ) : (
            <div className="rows">
              {cases
                .filter((c) => results[c.id])
                .map((c) => {
                  const res = results[c.id];
                  const cm = res.combined;
                  const m = cm ? WIN_META[cm.winner] : null;
                  const isOpen = open === c.id;
                  return (
                    <div className={`rowcard ${cm?.winner === 'Split' ? 'warn' : ''}`} key={c.id} style={{ flexDirection: 'column', gap: 12 }}>
                      <div className="row between" style={{ width: '100%', flexWrap: 'nowrap', alignItems: 'flex-start' }}>
                        <div className="rowcard-body">
                          <b>{c.prompt}</b>
                          {c.notes && (
                            <span className="small-text muted row" style={{ gap: 6 }}>
                              <StickyNote size={13} /> {c.notes}
                            </span>
                          )}
                        </div>
                        <div className="row" style={{ flexWrap: 'nowrap' }}>
                          {res.status === 'running' && <Pill cls="brand">running</Pill>}
                          {res.status === 'error' && <Pill cls="bad">error</Pill>}
                          {cm && (
                            <>
                              <span className="small-text muted" style={{ whiteSpace: 'nowrap' }}>
                                {f1(cm.avgA)} vs {f1(cm.avgB)}
                              </span>
                              <Pill cls={m.cls} icon={m.icon}>
                                {m.label}
                              </Pill>
                            </>
                          )}
                          {res.status !== 'running' && (
                            <button className="icon-btn" aria-label={isOpen ? 'Hide' : 'Show'} onClick={() => setOpen(isOpen ? null : c.id)}>
                              {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                          )}
                        </div>
                      </div>
                      {isOpen && (
                        <div style={{ width: '100%' }}>
                          {res.error && <p className="small-text" style={{ color: 'var(--bad)', marginBottom: 10 }}>{res.error}</p>}
                          {res.a && (
                            <div className="two-col">
                              {[
                                ['A', res.a, cm?.scoresA],
                                ['B', res.b, cm?.scoresB],
                              ].map(([k, text, scores]) => (
                                <div className={`reply ${k === 'B' ? 'b' : ''} ${cm?.winner === k ? 'won' : ''}`} key={k}>
                                  <div className="row between" style={{ marginBottom: 8 }}>
                                    <span className="row" style={{ gap: 8 }}>
                                      <span className={`vtag ${k === 'B' ? 'b' : ''}`}>{k}</span>
                                      <b className="small-text">Reply under variant {k}</b>
                                    </span>
                                    {cm?.winner === k && <Trophy size={16} color="var(--p-600)" />}
                                  </div>
                                  <p className="small-text" style={{ whiteSpace: 'pre-wrap', color: 'var(--ink-2)' }}>
                                    {text}
                                  </p>
                                  {scores && (
                                    <div className="chips" style={{ marginTop: 10 }}>
                                      {judgedCriteria.map((cr) => (
                                        <span className="chip static" key={cr}>
                                          {cr} {f1(scores[cr])}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {cm && (
                            <div className="rows" style={{ marginTop: 12 }}>
                              {cm.runs.map((r) => (
                                <p className="note" key={r.order}>
                                  <Gavel size={15} />
                                  <span>
                                    <b>{r.order === 'AB' ? 'A shown first' : 'B shown first'}:</b> {r.winner === 'Tie' ? 'tie' : `${r.winner} wins`}. {r.reason}
                                  </span>
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </section>
      )}

      {section === 'examples' && (
        <section>
          <SectionHead icon={FlaskConical} kicker="No key needed" title="Worked examples">
            Saved comparisons, each judged in both orders. Load one, then open the Scoreboard and the cases.
          </SectionHead>
          <div className="examples">
            {EXAMPLES.map((ex) => {
              const res = {};
              ex.cases.forEach((c) => (res[c.id] = { combined: combine([parseJudge(c.ab, 'AB', ex.criteria), parseJudge(c.ba, 'BA', ex.criteria)], ex.criteria) }));
              const b = scoreboard(ex.cases, res, ex.criteria);
              return (
                <button className="example" key={ex.id} onClick={() => loadExample(ex)}>
                  <div className="example-top">
                    <span className="chip static">{ex.cases.length} cases</span>
                    <Pill cls="brand" icon={Trophy}>
                      A {b.winsA} · B {b.winsB}
                    </Pill>
                  </div>
                  <h3>{ex.title}</h3>
                  <p>{ex.blurb}</p>
                  <div className="example-foot">
                    <span>{b.split ? `${b.split} order-sensitive` : 'Holds when swapped'}</span>
                    <ArrowRight size={18} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {section === 'method' && (
        <section>
          <SectionHead icon={BookOpen} title="Method">
            How each case is run and judged, and what an LLM judge can get wrong.
          </SectionHead>
          <MethodGrid
            items={[
              { icon: MessageSquare, t: 'Two replies', d: 'Each test message is answered twice by the chosen model: once with variant A as the system prompt, once with B, at a low temperature.' },
              { icon: Gavel, t: 'One judge', d: 'The same model, as judge, sees the message, your note, the rubric and both replies labelled Response 1 and 2. It scores each 1 to 5 per criterion and picks a winner or a tie.' },
              { icon: ArrowLeftRight, t: 'Order check', d: 'With the switch on, the pair is judged again with the order swapped. If the winner changes, the case is marked order-sensitive and left out of both tallies. Scores are averaged over the two runs.' },
              { icon: Sigma, t: 'Scoreboard', d: 'Wins per variant, average score across all criteria and cases, and the average per criterion, worked out in your browser.' },
            ]}
          />
          <div className="two-col">
            <div className="card">
              <h3 className="card-title">
                <TriangleAlert size={18} /> Limits
              </h3>
              <IconList
                tight
                items={[
                  { icon: Brain, text: 'An LLM judge can weigh a criterion like "Tone" differently from you. Read a few cases before trusting the totals.' },
                  { icon: Repeat, text: 'Scores vary from run to run even when the winner holds. A margin of 4.5 against 3.1 one time can be 4.1 against 3.4 the next.' },
                  { icon: Scale, text: 'The judge is the same model that wrote the replies. Using your own key for a different provider as judge is a sensible next step for important decisions.' },
                ]}
              />
            </div>
            <div className="card">
              <h3 className="card-title">
                <ShieldCheck size={18} /> Calls and limits
              </h3>
              <IconList
                tight
                items={[
                  { icon: Info, text: 'Each case makes three or four model calls. They run one case at a time with a pause between, and retry on rate limits, which was the main failure in the first version.' },
                  { icon: ShieldCheck, text: 'Nothing is stored. Prompts and replies pass through this site\'s server function and are discarded.' },
                ]}
              />
            </div>
          </div>
        </section>
      )}

      {section === 'settings' && <SettingsPanel settings={settings} setSettings={setSettings} provider={provider} intro="The chosen model answers under both prompts and acts as the judge." />}
    </Shell>
  );
}
