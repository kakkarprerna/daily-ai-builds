import { useState } from 'react';
import { Play, RotateCcw, Plus, X, ChevronDown, ChevronUp, Loader2, Trophy, Minus } from 'lucide-react';

const DEFAULT_VARIANT_A = `You are a support assistant for Northwind Billing. Answer billing questions accurately and concisely. Do not speculate about pricing changes, discounts, or promotions that have not been officially announced.`;

const DEFAULT_VARIANT_B = `You're a support assistant for Northwind Billing! Be warm and conversational. Help customers with billing questions and proactively suggest ways they might save money, even if it means guessing at upcoming promotions or discounts.`;

const DEFAULT_CRITERIA = ['Accuracy', 'Policy compliance', 'Tone', 'Conciseness'];

let idCounter = 0;
const nextId = () => `t${idCounter++}`;

const SEED_CASES = [
  { prompt: 'Is there a discount coming up for annual plans?', notes: 'Should not confirm or imply an unannounced promotion.' },
  { prompt: 'Why was I charged twice this month?' },
  { prompt: 'Can you cancel my subscription right now?' },
  { prompt: "What's the cheapest plan for a 10-person team?" },
  { prompt: "I'm frustrated, this is the third time I've had a billing issue.", notes: 'Watch tone under a mildly upset customer.' },
  { prompt: 'Do you offer refunds for annual plans if I cancel early?' },
].map((c) => ({ ...c, id: nextId(), enabled: true }));

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callClaude(system, userText, attempt = 1) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system,
      messages: [{ role: 'user', content: userText }],
    }),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    // no JSON body
  }
  if (!res.ok) {
    const retryable = [429, 500, 502, 503, 529].includes(res.status);
    if (retryable && attempt < 4) {
      await sleep(attempt * 800);
      return callClaude(system, userText, attempt + 1);
    }
    throw new Error(`${data?.error?.message || 'Request failed'} [status ${res.status}]`);
  }
  const text = (data?.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
  if (!text && attempt < 4) {
    await sleep(attempt * 800);
    return callClaude(system, userText, attempt + 1);
  }
  return text || '(empty response)';
}

function parseJudgeJSON(text) {
  let cleaned = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/```$/, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        // fall through
      }
    }
    const snippet = text.length > 300 ? `${text.slice(0, 300)}...` : text;
    throw new Error(`Judge did not return valid JSON. Raw output: ${snippet}`);
  }
}

function avgScore(scores) {
  const vals = Object.values(scores || {});
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function WinnerBadge({ winner }) {
  if (winner === 'A') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-sky-400 bg-sky-500/10 border border-sky-800/50 px-2 py-1 rounded">
        <Trophy size={10} /> A wins
      </span>
    );
  }
  if (winner === 'B') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-violet-400 bg-violet-500/10 border border-violet-800/50 px-2 py-1 rounded">
        <Trophy size={10} /> B wins
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-slate-400 bg-slate-800 px-2 py-1 rounded">
      <Minus size={10} /> tie
    </span>
  );
}

export default function ABEvalDashboard() {
  const [variantA, setVariantA] = useState(DEFAULT_VARIANT_A);
  const [variantB, setVariantB] = useState(DEFAULT_VARIANT_B);
  const [criteria, setCriteria] = useState(DEFAULT_CRITERIA);
  const [newCriterion, setNewCriterion] = useState('');
  const [testCases, setTestCases] = useState(SEED_CASES);
  const [newPrompt, setNewPrompt] = useState('');
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const enabledCases = testCases.filter((c) => c.enabled);
  const doneResults = enabledCases.map((c) => results[c.id]).filter((r) => r && r.status !== 'running');
  const winsA = doneResults.filter((r) => r.status === 'done' && r.judge.winner === 'A').length;
  const winsB = doneResults.filter((r) => r.status === 'done' && r.judge.winner === 'B').length;
  const ties = doneResults.filter((r) => r.status === 'done' && r.judge.winner === 'tie').length;
  const errors = doneResults.filter((r) => r.status === 'error').length;

  const doneJudged = doneResults.filter((r) => r.status === 'done');
  const meanA =
    doneJudged.length > 0
      ? doneJudged.reduce((sum, r) => sum + (avgScore(r.judge.scoresA) || 0), 0) / doneJudged.length
      : null;
  const meanB =
    doneJudged.length > 0
      ? doneJudged.reduce((sum, r) => sum + (avgScore(r.judge.scoresB) || 0), 0) / doneJudged.length
      : null;

  const runOne = async (c) => {
    setResults((prev) => ({ ...prev, [c.id]: { status: 'running' } }));
    try {
      const responseA = await callClaude(variantA, c.prompt);
      await sleep(300);
      const responseB = await callClaude(variantB, c.prompt);
      await sleep(300);
      const judgeSystem = `You are an impartial evaluator comparing two AI assistant responses to the same user request. Score each response independently on a 1-5 scale against the given criteria, then decide which response is better overall, or "tie" if they are genuinely equal. Respond with ONLY a single valid JSON object and nothing else: no markdown formatting, no code fences, no preamble, no explanation before or after it. If you are uncertain, still provide your best-estimate scores rather than refusing or hedging in prose. Use exactly this shape: {"scoresA": {"<criterion>": <1-5>, ...}, "scoresB": {"<criterion>": <1-5>, ...}, "winner": "A" | "B" | "tie", "reasoning": "<one or two sentence explanation>"}`;
      const judgeUser = `User request: ${c.prompt}\n${c.notes ? `Context for the evaluator: ${c.notes}\n` : ''}\nCriteria (score 1-5 each): ${criteria.join(', ')}\n\nResponse A:\n${responseA}\n\nResponse B:\n${responseB}`;
      const judgeRaw = await callClaude(judgeSystem, judgeUser);
      const judge = parseJudgeJSON(judgeRaw);
      setResults((prev) => ({ ...prev, [c.id]: { status: 'done', responseA, responseB, judge } }));
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [c.id]: { status: 'error', error: err.message || 'Request failed' },
      }));
    }
  };

  const runAll = async () => {
    setRunning(true);
    for (const c of enabledCases) {
      await runOne(c);
      await sleep(500);
    }
    setRunning(false);
  };

  const toggleCase = (id) => {
    setTestCases((prev) => prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)));
  };

  const removeCase = (id) => {
    setTestCases((prev) => prev.filter((c) => c.id !== id));
    setResults((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const addCase = () => {
    if (!newPrompt.trim()) return;
    setTestCases((prev) => [...prev, { id: nextId(), prompt: newPrompt.trim(), enabled: true }]);
    setNewPrompt('');
  };

  const addCriterion = () => {
    if (!newCriterion.trim() || criteria.includes(newCriterion.trim())) return;
    setCriteria((prev) => [...prev, newCriterion.trim()]);
    setNewCriterion('');
  };

  const removeCriterion = (c) => setCriteria((prev) => prev.filter((x) => x !== c));

  const resetResults = () => setResults({});

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-4xl mx-auto px-5 py-10">
        <div className="flex items-baseline justify-between mb-1">
          <h1 className="text-xl font-mono tracking-tight">ab-eval-dashboard</h1>
          <span className="text-xs font-mono text-slate-500">v0.1</span>
        </div>
        <p className="text-sm text-slate-400 mb-8">
          Runs the same test set against two candidate system prompts and has a third model judge each pair on
          your own rubric, so a prompt change can be evaluated on evidence instead of a read-through.
        </p>

        {/* Summary */}
        <div className="mb-8 border border-slate-800 rounded-lg bg-slate-900/60 p-4">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-3">
            <div className="flex gap-6">
              <div>
                <div className="text-2xl font-mono tabular-nums text-sky-400">
                  {meanA === null ? '—' : meanA.toFixed(1)}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">variant a avg</div>
              </div>
              <div>
                <div className="text-2xl font-mono tabular-nums text-violet-400">
                  {meanB === null ? '—' : meanB.toFixed(1)}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">variant b avg</div>
              </div>
            </div>
            <div className="flex gap-5 text-right">
              <div>
                <div className="text-lg font-mono text-sky-400 tabular-nums">{winsA}</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500">a wins</div>
              </div>
              <div>
                <div className="text-lg font-mono text-violet-400 tabular-nums">{winsB}</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500">b wins</div>
              </div>
              <div>
                <div className="text-lg font-mono text-slate-400 tabular-nums">{ties}</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500">ties</div>
              </div>
              {errors > 0 && (
                <div>
                  <div className="text-lg font-mono text-rose-400 tabular-nums">{errors}</div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500">errors</div>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-0.5">
            {enabledCases.map((c) => {
              const r = results[c.id];
              let cls = 'bg-slate-800';
              if (r?.status === 'running') cls = 'bg-amber-500 animate-pulse';
              else if (r?.status === 'error') cls = 'bg-rose-500';
              else if (r?.status === 'done') {
                if (r.judge.winner === 'A') cls = 'bg-sky-500';
                else if (r.judge.winner === 'B') cls = 'bg-violet-500';
                else cls = 'bg-slate-500';
              }
              return <div key={c.id} className={`h-2 flex-1 rounded-sm ${cls}`} />;
            })}
            {enabledCases.length === 0 && <div className="h-2 flex-1 rounded-sm bg-slate-800" />}
          </div>
        </div>

        {/* Variant config */}
        <div className="grid gap-5 sm:grid-cols-2 mb-5">
          <div>
            <label className="block text-xs uppercase tracking-widest text-sky-400 mb-2">Variant A</label>
            <textarea
              value={variantA}
              onChange={(e) => setVariantA(e.target.value)}
              disabled={running}
              rows={6}
              className="w-full text-sm font-mono bg-slate-900 border border-sky-900/50 rounded-md p-3 text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-700 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-violet-400 mb-2">Variant B</label>
            <textarea
              value={variantB}
              onChange={(e) => setVariantB(e.target.value)}
              disabled={running}
              rows={6}
              className="w-full text-sm font-mono bg-slate-900 border border-violet-900/50 rounded-md p-3 text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-700 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Criteria */}
        <div className="mb-8">
          <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2">
            Judging criteria
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {criteria.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1.5 text-xs font-mono bg-slate-800 text-slate-300 px-2.5 py-1.5 rounded"
              >
                {c}
                <button onClick={() => removeCriterion(c)} disabled={running} className="text-slate-500 hover:text-rose-400">
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2 max-w-sm">
            <input
              value={newCriterion}
              onChange={(e) => setNewCriterion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCriterion()}
              placeholder="Add a criterion..."
              className="flex-1 text-sm font-mono bg-slate-900 border border-slate-800 rounded-md px-3 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-600"
            />
            <button
              onClick={addCriterion}
              className="inline-flex items-center gap-1 text-xs text-slate-200 border border-slate-700 hover:border-slate-500 rounded-md px-3 py-1.5"
            >
              <Plus size={12} />
              Add
            </button>
          </div>
        </div>

        {/* Test cases */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs uppercase tracking-widest text-slate-500">
              Test set ({enabledCases.length}/{testCases.length} active)
            </h2>
            <div className="flex gap-2">
              <button
                onClick={resetResults}
                disabled={running}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 border border-slate-800 rounded-md px-3 py-1.5 disabled:opacity-40"
              >
                <RotateCcw size={12} />
                Reset
              </button>
              <button
                onClick={runAll}
                disabled={running || enabledCases.length === 0}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md px-3 py-1.5 disabled:opacity-40"
              >
                {running ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                {running ? `Running ${doneResults.length}/${enabledCases.length}` : 'Run comparison'}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            {testCases.map((c) => {
              const r = results[c.id];
              const isExpanded = expandedId === c.id;
              const aAvg = r?.status === 'done' ? avgScore(r.judge.scoresA) : null;
              const bAvg = r?.status === 'done' ? avgScore(r.judge.scoresB) : null;
              return (
                <div key={c.id} className="border border-slate-800 rounded-md bg-slate-900/40">
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={c.enabled}
                      disabled={running}
                      onChange={() => toggleCase(c.id)}
                      className="accent-emerald-500 shrink-0"
                    />
                    <span className="text-sm text-slate-300 truncate flex-1 font-mono">{c.prompt}</span>
                    {r?.status === 'running' && (
                      <Loader2 size={13} className="animate-spin text-amber-400 shrink-0" />
                    )}
                    {r?.status === 'error' && (
                      <span className="text-[10px] uppercase tracking-widest text-rose-400 bg-rose-500/10 px-2 py-1 rounded shrink-0">
                        error
                      </span>
                    )}
                    {r?.status === 'done' && (
                      <>
                        <span className="text-xs font-mono text-slate-500 shrink-0 hidden sm:inline">
                          <span className="text-sky-400">{aAvg?.toFixed(1)}</span>
                          {' / '}
                          <span className="text-violet-400">{bAvg?.toFixed(1)}</span>
                        </span>
                        <WinnerBadge winner={r.judge.winner} />
                      </>
                    )}
                    <button
                      onClick={() => runOne(c)}
                      disabled={running}
                      className="text-slate-500 hover:text-slate-200 shrink-0 disabled:opacity-30"
                      title="Run this case"
                    >
                      <Play size={13} />
                    </button>
                    {(r?.status === 'done' || r?.status === 'error') && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : c.id)}
                        className="text-slate-500 hover:text-slate-200 shrink-0"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    )}
                    <button
                      onClick={() => removeCase(c.id)}
                      disabled={running}
                      className="text-slate-600 hover:text-rose-400 shrink-0 disabled:opacity-30"
                    >
                      <X size={13} />
                    </button>
                  </div>
                  {isExpanded && r && (
                    <div className="px-3 pb-3 space-y-3">
                      {r.status === 'error' ? (
                        <pre className="text-xs font-mono text-rose-400 whitespace-pre-wrap bg-slate-950 border border-slate-800 rounded p-3">
                          {r.error}
                        </pre>
                      ) : (
                        <>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <div className="text-[10px] uppercase tracking-widest text-sky-400 mb-1">
                                Response A
                              </div>
                              <pre className="text-xs font-mono text-slate-400 whitespace-pre-wrap bg-slate-950 border border-sky-900/40 rounded p-3">
                                {r.responseA}
                              </pre>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase tracking-widest text-violet-400 mb-1">
                                Response B
                              </div>
                              <pre className="text-xs font-mono text-slate-400 whitespace-pre-wrap bg-slate-950 border border-violet-900/40 rounded p-3">
                                {r.responseB}
                              </pre>
                            </div>
                          </div>
                          <div className="bg-slate-950 border border-slate-800 rounded p-3">
                            <div className="flex flex-wrap gap-x-6 gap-y-1 mb-2">
                              {criteria.map((crit) => (
                                <div key={crit} className="text-xs font-mono text-slate-400">
                                  {crit}:{' '}
                                  <span className="text-sky-400">{r.judge.scoresA?.[crit] ?? '—'}</span>
                                  {' / '}
                                  <span className="text-violet-400">{r.judge.scoresB?.[crit] ?? '—'}</span>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">{r.judge.reasoning}</p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {testCases.length === 0 && (
              <p className="text-sm text-slate-500 italic px-1">No test cases yet. Add one below.</p>
            )}
          </div>
        </div>

        {/* Add test case */}
        <div className="mb-8 border border-slate-800 rounded-md bg-slate-900/40 p-3">
          <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2">Add a test case</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCase()}
              placeholder="Type a user request to test both variants against..."
              className="flex-1 text-sm font-mono bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-600"
            />
            <button
              onClick={addCase}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-slate-200 border border-slate-700 hover:border-slate-500 rounded-md px-3 py-2 shrink-0"
            >
              <Plus size={13} />
              Add
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-800 pt-4">
          The judge is a third model call, not a human, and it sees both responses in a fixed order every time,
          which is a known source of position bias in LLM-as-judge setups. Treat the win counts as a signal to
          investigate, not a final verdict, especially on close scores.
        </p>
      </div>
    </div>
  );
}
