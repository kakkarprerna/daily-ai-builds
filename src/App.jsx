import React, { useState } from 'react';
import {
  ScanLine,
  BookOpen,
  FlaskConical,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  Plus,
  X,
  Sparkles,
  Info,
} from 'lucide-react';

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
.sg { font-family: 'Space Grotesk', sans-serif; }
.in { font-family: 'Inter', sans-serif; }
.sc-shell { display: flex; height: 100vh; }
.sc-sidebar { width: 288px; flex-shrink: 0; height: 100vh; position: sticky; top: 0; overflow-y: auto; }
.sc-nav { display: flex; flex-direction: column; gap: 4px; }
.sc-main { flex: 1; overflow-y: auto; height: 100vh; }
@media (max-width: 768px) {
  .sc-shell { flex-direction: column; height: auto; min-height: 100vh; }
  .sc-sidebar { width: 100%; height: auto; position: relative; }
  .sc-nav { flex-direction: row; overflow-x: auto; }
  .sc-main { height: auto; }
}
`;

const BUILD_TYPES = ['Personal tool', 'Internal team tool', 'Customer-facing feature', 'Not sure yet'];
const TOOL_OPTIONS = ['Claude', 'Cursor', 'Lovable', 'v0', 'Bolt', 'ChatGPT', 'Windsurf'];
const SKIP_OPTIONS = ['Tests', 'Code review', 'Error handling', 'Security review', 'Load testing', 'Dependency audit', 'Accessibility check', 'Documentation'];
const OWNER_OPTIONS = ['Just me', 'Small team', 'Will hand to engineering', 'Unclear'];
const PROVIDERS = [
  { id: 'muse', label: 'Muse Glimmer' },
  { id: 'anthropic', label: 'Anthropic Claude' },
  { id: 'openai', label: 'OpenAI GPT' },
  { id: 'gemini', label: 'Google Gemini' },
];
const KEY_REQUIRED = ['anthropic', 'openai', 'gemini'];

const SEVERITY_STYLES = {
  high: { border: 'border-red-500', chip: 'bg-red-100 text-red-700', label: 'High' },
  medium: { border: 'border-amber-500', chip: 'bg-amber-100 text-amber-700', label: 'Medium' },
  low: { border: 'border-emerald-500', chip: 'bg-emerald-100 text-emerald-700', label: 'Low' },
};

function getVerdictStyle(verdict = '') {
  const v = verdict.toLowerCase();
  if (v.includes('review')) return { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800', Icon: ShieldAlert };
  if (v.includes('monitor')) return { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-800', Icon: AlertTriangle };
  if (v.includes('as-is')) return { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-800', Icon: CheckCircle2 };
  return { bg: 'bg-stone-50', border: 'border-stone-300', text: 'text-stone-800', Icon: Info };
}

const EXAMPLES = [
  {
    id: 'personal',
    label: 'Personal habit tracker',
    description: 'A daily habit tracker for myself, no logins, no shared data, runs in one browser tab.',
    result: {
      verdict: 'Ship as-is',
      risks: [
        { severity: 'low', title: 'No data backup', why: 'If local storage clears, the history is gone. Fine for a personal tool, annoying if you got attached to the streak.' },
        { severity: 'low', title: 'No input validation', why: 'A stray click could log a bad entry, but you are the only user and the only one it affects.' },
      ],
      questions: ['Is there anything here you would be genuinely upset to lose permanently?'],
      flips: ['If you ever add a second user or sync across devices, error handling stops being optional.'],
    },
  },
  {
    id: 'internal',
    label: 'Team OKR dashboard',
    description: 'A shared dashboard six of us use weekly to track OKR status, built on Lovable and Supabase.',
    result: {
      verdict: 'Ship with monitoring',
      risks: [
        { severity: 'medium', title: 'No error handling on failed writes', why: 'If a save silently fails, someone updates their OKR and it never persists. Nobody notices until the numbers look stale.' },
        { severity: 'medium', title: 'No code review on the data model', why: 'Who can edit whose records went unchecked. Fine at six people, risky if the team doubles.' },
        { severity: 'low', title: 'No load testing', why: 'Six concurrent users is not a real load test, but it is also not a real risk yet.' },
      ],
      questions: [
        'What happens right now if a write to Supabase fails, does anyone see it?',
        'Who can currently edit records that are not theirs?',
      ],
      flips: ['If this grows past your team, or shows up in a board update, get a real review before that happens, not after.'],
    },
  },
  {
    id: 'customer',
    label: 'Customer signup form',
    description: 'A public signup form built on Bolt to hit a launch date, collects email and payment intent. Engineering will take it over eventually.',
    result: {
      verdict: 'Needs review before shipping',
      risks: [
        { severity: 'high', title: 'No input validation on a public form', why: 'Anything reachable by the public without validation is a target, not a maybe.' },
        { severity: 'high', title: 'Payment intent with no security review', why: 'Anything touching payment data raises the stakes on every other shortcut on this list.' },
        { severity: 'medium', title: 'No rate limiting', why: 'A public form with no limit invites spam submissions, and cleaning that up later is expensive.' },
      ],
      questions: [
        'Has anyone with security context looked at how payment intent data is stored and transmitted?',
        'What stops someone from submitting this form a thousand times in a minute?',
        'Who is on call the week this launches?',
      ],
      flips: ['None of this should wait for engineering to take it over eventually. Payment data moves the review forward, not back.'],
    },
  },
];

function Chips({ options, selected, multi, onToggle, custom, onAddCustom, onRemoveCustom }) {
  const [draft, setDraft] = useState('');
  const isSelected = (opt) => (multi ? selected.includes(opt) : selected === opt);
  const submitDraft = () => {
    const val = draft.trim();
    if (val) {
      onAddCustom(val);
      setDraft('');
    }
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {[...options, ...custom].map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={`sg inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
              isSelected(opt)
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-stone-700 border-stone-300 hover:border-indigo-400'
            }`}
          >
            {opt}
            {custom.includes(opt) && (
              <X
                className="w-3.5 h-3.5 opacity-70 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveCustom(opt);
                }}
              />
            )}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), submitDraft())}
          placeholder="Add your own"
          className="in text-sm px-3 py-1.5 rounded-full border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 flex-1 max-w-xs"
        />
        <button
          type="button"
          onClick={submitDraft}
          className="p-1.5 rounded-full border border-stone-300 hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <Plus className="w-4 h-4 text-stone-600" />
        </button>
      </div>
    </div>
  );
}

function ResultView({ result, onReset, showReset = true }) {
  const { bg, border, text, Icon } = getVerdictStyle(result.verdict);
  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border p-6 ${bg} ${border}`}>
        <div className="flex items-center gap-3">
          <Icon className={`w-6 h-6 ${text}`} />
          <p className={`sg text-xl font-semibold ${text}`}>{result.verdict}</p>
        </div>
        {result.previewNote && <p className="in text-xs text-stone-500 mt-2">{result.previewNote}</p>}
      </div>

      {result.risks?.length > 0 && (
        <div>
          <h3 className="sg text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">What is likely hiding</h3>
          <div className="space-y-3">
            {result.risks.map((risk, i) => {
              const s = SEVERITY_STYLES[risk.severity] || SEVERITY_STYLES.medium;
              return (
                <div key={i} className={`bg-white rounded-xl border-l-4 ${s.border} border-y border-r border-stone-200 p-4`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`sg text-xs font-semibold px-2 py-0.5 rounded-full ${s.chip}`}>{s.label}</span>
                    <p className="sg font-semibold text-stone-800">{risk.title}</p>
                  </div>
                  <p className="in text-sm text-stone-600">{risk.why}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {result.questions?.length > 0 && (
        <div>
          <h3 className="sg text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Ask an engineer before you ship</h3>
          <div className="space-y-2">
            {result.questions.map((q, i) => (
              <div key={i} className="flex gap-2.5 items-start bg-white rounded-xl border border-stone-200 p-3">
                <HelpCircle className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                <p className="in text-sm text-stone-700">{q}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.flips?.length > 0 && (
        <div>
          <h3 className="sg text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">What would change this verdict</h3>
          <div className="space-y-2">
            {result.flips.map((f, i) => (
              <div key={i} className="flex gap-2.5 items-start bg-white rounded-xl border border-stone-200 p-3">
                <Sparkles className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                <p className="in text-sm text-stone-700">{f}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showReset && (
        <button
          type="button"
          onClick={onReset}
          className="sg text-sm font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1.5"
        >
          <RefreshCw className="w-4 h-4" /> Scan another build
        </button>
      )}
    </div>
  );
}

function buildPrompt({ buildType, tools, skipped, owner, description }) {
  return `You are auditing a "vibe coded" software build for a product manager who directed an AI coding tool rather than writing the code by hand. Given the details below, return a structured debt scan.

Build type: ${buildType || 'Not specified'}
Tools used: ${tools.length ? tools.join(', ') : 'Not specified'}
Steps skipped: ${skipped.length ? skipped.join(', ') : 'None reported'}
Who owns it going forward: ${owner || 'Not specified'}
Description: ${description || 'Not provided'}

Reason about what is genuinely likely to be hiding given what was skipped and the stakes implied by the build type and description. Only include risks that follow from what was actually skipped and described, do not pad the list with generic advice that would apply to any build.

Respond in exactly this tagged-line format, nothing else, no preamble and no markdown:
VERDICT: <one of: Ship as-is | Ship with monitoring | Needs review before shipping>
RISK: <high|medium|low> | <short risk title> | <one sentence on why it matters, grounded in the specifics given>
(repeat RISK for 2 to 4 risks, most severe first)
QUESTION: <one question a PM should ask an engineer before shipping or handing this off>
(repeat QUESTION for 1 to 3 lines)
FLIP: <one condition that would change the verdict>
(repeat FLIP for 1 to 2 lines)`;
}

function parseTagged(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const out = { verdict: '', risks: [], questions: [], flips: [] };
  for (const line of lines) {
    if (line.startsWith('VERDICT:')) {
      out.verdict = line.replace('VERDICT:', '').trim();
    } else if (line.startsWith('RISK:')) {
      const parts = line.replace('RISK:', '').split('|').map((p) => p.trim());
      if (parts.length >= 3) out.risks.push({ severity: parts[0].toLowerCase(), title: parts[1], why: parts[2] });
    } else if (line.startsWith('QUESTION:')) {
      out.questions.push(line.replace('QUESTION:', '').trim());
    } else if (line.startsWith('FLIP:')) {
      out.flips.push(line.replace('FLIP:', '').trim());
    }
  }
  return out;
}

export default function ShipCheck() {
  const [section, setSection] = useState('scan');
  const [buildType, setBuildType] = useState('');
  const [tools, setTools] = useState([]);
  const [customTools, setCustomTools] = useState([]);
  const [skipped, setSkipped] = useState([]);
  const [customSkipped, setCustomSkipped] = useState([]);
  const [owner, setOwner] = useState('');
  const [description, setDescription] = useState('');
  const [provider, setProvider] = useState('muse');
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeExample, setActiveExample] = useState(null);

  const toggleMulti = (value, setValue) => (opt) => {
    setValue(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  };

  const resetForm = () => {
    setResult(null);
    setStatus('idle');
    setErrorMsg('');
  };

  async function runScan(prompt) {
    // Try the deployed serverless endpoint first, works once this is on Vercel with api/scan.js
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey: apiKey || undefined, prompt }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.text) return { text: data.text, note: null };
      }
    } catch (e) {
      // no backend reachable, most likely previewing this in chat
    }

    // No backend reachable, most likely previewing this in chat.
    // A visitor-pasted Anthropic key can run directly in-browser.
    if (provider === 'anthropic' && apiKey) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] }),
      });
      if (!response.ok) throw new Error('request-failed');
      const data = await response.json();
      const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
      return { text, note: null };
    }

    // Every other case: this sandbox can only reach Anthropic directly, so preview with
    // Claude and say plainly what will actually run once this is deployed.
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!response.ok) throw new Error('request-failed');
    const data = await response.json();
    const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
    const label = PROVIDERS.find((p) => p.id === provider)?.label;
    const note = apiKey
      ? `Previewed with Claude here in chat. Runs on ${label} with your key once deployed.`
      : `Previewed with Claude here in chat. Runs on ${label} with the shared key once deployed.`;
    return { text, note };
  }

  async function handleScan() {
    setStatus('loading');
    setErrorMsg('');
    try {
      const prompt = buildPrompt({ buildType, tools, skipped, owner, description });
      const { text, note } = await runScan(prompt);
      const parsed = parseTagged(text);
      if (!parsed.verdict) throw new Error('unparseable');
      parsed.previewNote = note;
      setResult(parsed);
      setStatus('done');
    } catch (err) {
      setErrorMsg('Could not complete the scan. Try again in a moment.');
      setStatus('error');
    }
  }

  const navItems = [
    { id: 'scan', label: 'Scan a build', desc: 'Check what is hiding in something you vibe-coded', Icon: ScanLine },
    { id: 'how', label: 'How it works', desc: 'Why vibe coding creates a different kind of debt', Icon: BookOpen },
    { id: 'examples', label: 'Examples', desc: 'See three scans, no API key needed', Icon: FlaskConical },
  ];

  const canScan = description.trim().length > 0 && status !== 'loading' && (!KEY_REQUIRED.includes(provider) || apiKey.trim().length > 0);

  return (
    <div className="sc-shell in bg-stone-50 text-stone-800">
      <style>{STYLE}</style>

      <aside className="sc-sidebar bg-white border-r border-stone-200">
        <div className="p-6 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <ScanLine className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
            </div>
            <p className="sg font-bold text-lg text-stone-900">Ship Check</p>
          </div>
          <p className="in text-xs text-stone-500 mt-1">Vibe coding debt scanner</p>
        </div>
        <nav className="sc-nav px-3 py-3">
          {navItems.map(({ id, label, desc, Icon }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={`text-left rounded-xl px-3 py-2.5 flex items-start gap-2.5 flex-shrink-0 w-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
                section === id ? 'bg-indigo-50 border border-indigo-200' : 'border border-transparent hover:bg-stone-50'
              }`}
              style={{ minWidth: 200 }}
            >
              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${section === id ? 'text-indigo-600' : 'text-stone-400'}`} />
              <span>
                <span className={`sg block text-sm font-semibold ${section === id ? 'text-indigo-900' : 'text-stone-700'}`}>{label}</span>
                <span className="in block text-xs text-stone-500 mt-0.5">{desc}</span>
              </span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="sc-main">
        <div className="max-w-2xl mx-auto px-6 py-10">
          {section === 'scan' && (
            <div>
              <h1 className="sg text-2xl font-bold text-stone-900 mb-1">Scan a build</h1>
              <p className="in text-stone-500 mb-6">Tell it what got skipped. It tells you what that probably costs later.</p>

              <div className="flex gap-3 items-start bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-8">
                <Info className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                <p className="in text-sm text-indigo-900">This reads what you describe, not your actual code. Being honest about what got skipped is what makes it useful.</p>
              </div>

              {status !== 'done' && (
                <div className="space-y-6">
                  <div>
                    <label className="sg block text-sm font-semibold text-stone-700 mb-2">Which AI runs the scan?</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {PROVIDERS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setProvider(p.id)}
                          className={`sg text-sm font-medium px-4 py-2 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
                            provider === p.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-stone-700 border-stone-300 hover:border-indigo-400'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2">
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder={provider === 'muse' ? 'Your own NVIDIA key (optional)' : `Your ${PROVIDERS.find((p) => p.id === provider)?.label} API key`}
                        className="in text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 w-full max-w-sm"
                      />
                      <p className="in text-xs text-stone-500 mt-1">
                        {provider === 'muse' ? 'Optional, uses the shared key if left blank.' : 'Required for this provider. Sent with this request only, never stored.'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="sg block text-sm font-semibold text-stone-700 mb-2">What is it?</label>
                    <Chips options={BUILD_TYPES} selected={buildType} multi={false} onToggle={(o) => setBuildType(o === buildType ? '' : o)} custom={[]} onAddCustom={(v) => setBuildType(v)} onRemoveCustom={() => {}} />
                  </div>

                  <div>
                    <label className="sg block text-sm font-semibold text-stone-700 mb-2">What did you build it with?</label>
                    <Chips options={TOOL_OPTIONS} selected={tools} multi={true} onToggle={toggleMulti(tools, setTools)} custom={customTools} onAddCustom={(v) => { setCustomTools([...customTools, v]); setTools([...tools, v]); }} onRemoveCustom={(v) => { setCustomTools(customTools.filter((x) => x !== v)); setTools(tools.filter((x) => x !== v)); }} />
                  </div>

                  <div>
                    <label className="sg block text-sm font-semibold text-stone-700 mb-2">What got skipped?</label>
                    <Chips options={SKIP_OPTIONS} selected={skipped} multi={true} onToggle={toggleMulti(skipped, setSkipped)} custom={customSkipped} onAddCustom={(v) => { setCustomSkipped([...customSkipped, v]); setSkipped([...skipped, v]); }} onRemoveCustom={(v) => { setCustomSkipped(customSkipped.filter((x) => x !== v)); setSkipped(skipped.filter((x) => x !== v)); }} />
                  </div>

                  <div>
                    <label className="sg block text-sm font-semibold text-stone-700 mb-2">Who owns it going forward?</label>
                    <Chips options={OWNER_OPTIONS} selected={owner} multi={false} onToggle={(o) => setOwner(o === owner ? '' : o)} custom={[]} onAddCustom={(v) => setOwner(v)} onRemoveCustom={() => {}} />
                  </div>

                  <div>
                    <label className="sg block text-sm font-semibold text-stone-700 mb-2">Describe it in a sentence or two</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder="A signup form that collects email and stores it in a spreadsheet, built to hit a launch date."
                      className="in w-full text-sm rounded-xl border border-stone-300 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>

                  {errorMsg && <p className="in text-sm text-red-600">{errorMsg}</p>}

                  <button
                    type="button"
                    onClick={handleScan}
                    disabled={!canScan}
                    className={`sg font-semibold px-6 py-3 rounded-full inline-flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
                      canScan ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                    }`}
                  >
                    {status === 'loading' ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Reading through it
                      </>
                    ) : (
                      'Scan for debt'
                    )}
                  </button>
                </div>
              )}

              {status === 'done' && result && <ResultView result={result} onReset={resetForm} />}
            </div>
          )}

          {section === 'how' && (
            <div className="space-y-8">
              <div>
                <h1 className="sg text-2xl font-bold text-stone-900 mb-1">How it works</h1>
                <p className="in text-stone-500">The short version, before you scan anything.</p>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4.5 h-4.5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="sg font-semibold text-stone-800 mb-1">What vibe coding debt actually is</h2>
                  <p className="in text-sm text-stone-600">Vibe coding means describing what you want and letting AI write it, rather than writing every line yourself. Skipping the steps that used to slow engineers down, tests, review, security checks, does not make those risks disappear. It just moves them later, usually to whoever inherits the tool once it starts to matter.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <ScanLine className="w-4.5 h-4.5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="sg font-semibold text-stone-800 mb-1">Why it matters for PMs specifically</h2>
                  <p className="in text-sm text-stone-600">The old test for technical enough was whether you could write code. Vibe coding breaks that test. You can ship something functional without touching a line, and what matters now is knowing exactly which corners you cut, and being able to say so before someone else finds out for you.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <Info className="w-4.5 h-4.5 text-stone-500" />
                </div>
                <div>
                  <h2 className="sg font-semibold text-stone-800 mb-1">What this scan does and does not do</h2>
                  <p className="in text-sm text-stone-600">It reads what you tell it, not your actual code. It cannot catch a bug it does not know about. Treat it as a structured way to think through what you skipped, not a substitute for someone actually looking at the thing.</p>
                </div>
              </div>
            </div>
          )}

          {section === 'examples' && (
            <div>
              <h1 className="sg text-2xl font-bold text-stone-900 mb-1">Examples</h1>
              <p className="in text-stone-500 mb-6">Three scans, already run, no key required.</p>

              {!activeExample ? (
                <div className="space-y-3">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => setActiveExample(ex.id)}
                      className="w-full text-left bg-white rounded-xl border border-stone-200 p-4 hover:border-indigo-300 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    >
                      <p className="sg font-semibold text-stone-800">{ex.label}</p>
                      <p className="in text-sm text-stone-500 mt-1">{ex.description}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div>
                  {(() => {
                    const ex = EXAMPLES.find((e) => e.id === activeExample);
                    return (
                      <div>
                        <button
                          onClick={() => setActiveExample(null)}
                          className="sg text-sm font-semibold text-indigo-600 hover:text-indigo-800 mb-4 inline-block"
                        >
                          Back to examples
                        </button>
                        <div className="bg-white rounded-xl border border-stone-200 p-4 mb-6">
                          <p className="sg font-semibold text-stone-800 mb-1">{ex.label}</p>
                          <p className="in text-sm text-stone-500">{ex.description}</p>
                        </div>
                        <ResultView result={ex.result} showReset={false} />
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
