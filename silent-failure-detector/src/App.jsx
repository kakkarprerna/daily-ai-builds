import { useMemo, useRef, useState } from 'react';
import {
  Compass,
  ScanSearch,
  Gauge as GaugeIcon,
  Highlighter,
  ListChecks,
  FlaskConical,
  BookOpen,
  Radar,
  ArrowRight,
  CircleCheck,
  CircleHelp,
  TriangleAlert,
  OctagonX,
  Info,
  MessageSquareQuote,
  Wrench,
  Search,
  Scale,
  Ruler,
  Sigma,
  ShieldCheck,
  Eraser,
  Play,
  Loader2,
  Database,
  Brain,
  Hash,
} from 'lucide-react';
import { Shell, Banners, SectionHead, Empty, ChipRow, Pill, Gauge, MethodGrid, IconList, Steps, SettingsPanel, SavedBanner, useSettings, pickOne, addOption } from './kit/ui.jsx';
import { callApi } from './kit/api.js';
import { segment } from './kit/highlight.js';
import { parseAudit, toneScan, BANDS, STATUSES } from './parse.js';
import { EXAMPLES } from './examples.js';

const SECTIONS = [
  { id: 'start', title: 'Start here', desc: 'What a silent failure is', icon: Compass },
  { id: 'audit', title: 'Audit an answer', desc: 'Paste the question and the reply', icon: ScanSearch },
  { id: 'verdict', title: 'Verdict', desc: 'Score, band and what to do', icon: GaugeIcon },
  { id: 'redline', title: 'Redline', desc: 'Claims marked inside the answer', icon: Highlighter },
  { id: 'ledger', title: 'Claims ledger', desc: 'Each claim and what to check', icon: ListChecks },
  { id: 'examples', title: 'Worked examples', desc: 'Three saved audits, no key needed', icon: FlaskConical },
  { id: 'method', title: 'Method', desc: 'The formula and its limits', icon: BookOpen },
  { id: 'settings', title: 'Model & key', desc: 'Pick who does the audit', icon: Radar },
];

const DOMAINS = ['Company facts', 'Finance', 'Health', 'Legal and policy', 'Product docs', 'Statistics'];

export const STATUS_META = {
  Verified: { cls: 'ok', icon: CircleCheck, plain: 'Confident it is accurate' },
  Plausible: { cls: 'quiet', icon: CircleHelp, plain: 'Fits, but the detail is unconfirmed' },
  Unverifiable: { cls: 'warn', icon: TriangleAlert, plain: 'Specific, with nothing to back it' },
  'Fabrication risk': { cls: 'bad', icon: OctagonX, plain: 'Looks invented or wrong' },
};

const BAND_ICON = { ok: CircleCheck, warn: TriangleAlert, bad: OctagonX };

export default function App() {
  const [section, setSection] = useState('start');
  const mainRef = useRef(null);
  const { settings, setSettings, provider, keyMissing } = useSettings();

  const [domainOptions, setDomainOptions] = useState(DOMAINS);
  const [domain, setDomain] = useState([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [auditedAnswer, setAuditedAnswer] = useState('');
  const [reportText, setReportText] = useState('');
  const [saved, setSaved] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showRaw, setShowRaw] = useState(false);

  const r = useMemo(() => parseAudit(reportText), [reportText]);
  const tone = useMemo(() => toneScan(auditedAnswer), [auditedAnswer]);
  const marks = useMemo(
    () => [
      ...r.claims.map((c, i) => ({ quote: c.quote, cls: STATUS_META[c.status].cls, n: i + 1, status: c.status })),
      ...r.hedges.map((h) => ({ quote: h, cls: 'brand', hedge: true })),
    ],
    [r]
  );
  const red = useMemo(() => segment(auditedAnswer, marks), [auditedAnswer, marks]);

  const go = (id) => {
    setSection(id);
    if (mainRef.current) mainRef.current.scrollTop = 0;
    window.scrollTo?.(0, 0);
  };

  const loadExample = (ex) => {
    setDomainOptions((cur) => (cur.includes(ex.domain) ? cur : [...cur, ex.domain]));
    setDomain([ex.domain]);
    setQuestion(ex.question);
    setAnswer(ex.answer);
    setAuditedAnswer(ex.answer);
    setReportText(ex.report);
    setSaved(ex.title);
    setError('');
    go('verdict');
  };

  const clearAll = () => {
    setQuestion('');
    setAnswer('');
    setAuditedAnswer('');
    setReportText('');
    setSaved(null);
    setDomain([]);
    go('audit');
  };

  const runAudit = async () => {
    setError('');
    if (!answer.trim()) return setError('Paste the AI answer you want to audit.');
    if (keyMissing) return setError(`Add your ${provider.name} key in Model & key first.`);
    setBusy(true);
    try {
      const { report } = await callApi('audit', { question, answer, domain: domain.join(', ') }, settings);
      const parsed = parseAudit(report);
      if (!parsed.ok) {
        setReportText(report);
        setAuditedAnswer(answer);
        throw new Error('The model replied, but not in the expected format. Try again, or switch provider. Its raw reply is under Verdict.');
      }
      setReportText(report);
      setAuditedAnswer(answer);
      setSaved(null);
      go('verdict');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const counts = STATUSES.map((s) => ({ s, n: r.claims.filter((c) => c.status === s).length }));

  const badge = (id) => {
    if (id === 'verdict' && r.band) return { text: r.score, cls: r.band.cls };
    if (id === 'redline' && r.claims.length) return { text: r.claims.length };
    if (id === 'ledger' && r.claims.length) {
      const risky = r.claims.filter((c) => c.status === 'Fabrication risk' || c.status === 'Unverifiable').length;
      return risky ? { text: `${risky} to check`, cls: 'warn' } : { text: 'all clear', cls: 'ok' };
    }
    return null;
  };

  const noResult = (
    <Empty
      icon={ScanSearch}
      title="No audit yet"
      action={
        <div className="row" style={{ justifyContent: 'center' }}>
          <button className="btn primary" onClick={() => go('examples')}>
            <FlaskConical size={18} /> Load a worked example
          </button>
          <button className="btn ghost" onClick={() => go('audit')}>
            Audit an answer
          </button>
        </div>
      }
    >
      Paste an answer under Audit an answer, or load one of the saved examples to see a full report.
    </Empty>
  );

  return (
    <Shell
      brand={{ name: 'Silent Failure Detector', sub: 'Confidently wrong, caught early', icon: Radar }}
      sections={SECTIONS}
      section={section}
      go={go}
      badge={badge}
      provider={provider}
      keyMissing={keyMissing}
      mainRef={mainRef}
    >
      <Banners error={error} setError={setError} progress={busy ? 'Reading the answer, pulling out each claim and rating it' : ''} />

      {section === 'start' && (
        <section>
          <div className="hero">
            <div className="hero-text">
              <div className="kicker">For anyone shipping AI answers</div>
              <h1>Is the AI more sure than it should be?</h1>
              <p>
                Errors and refusals are easy to spot. The answer that sounds certain and is wrong gets through, because nothing flags it. Paste an AI answer and see which
                claims carry more certainty than the evidence behind them.
              </p>
              <div className="row">
                <button className="btn primary" onClick={() => go('examples')}>
                  <FlaskConical size={18} /> See a worked example
                </button>
                <button className="btn ghost" onClick={() => go('audit')}>
                  Audit an answer <ArrowRight size={18} />
                </button>
              </div>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <div className="hv-card" style={{ width: '82%', top: 10, left: 0, transform: 'rotate(-2deg)' }}>
                <span className="hv-line" />
                <span className="hv-line mark" style={{ width: '70%' }} />
                <span className="hv-line" />
                <span className="hv-line short" />
                <span className="hv-line mark" style={{ width: '45%' }} />
              </div>
              <span className="hv-pill solid" style={{ top: 150, left: '6%' }}>
                <GaugeIcon size={15} /> Score 87
              </span>
              <span className="hv-pill bad" style={{ bottom: 6, right: '4%' }}>
                <OctagonX size={15} /> Route to a human
              </span>
            </div>
          </div>

          <Steps
            items={[
              { icon: MessageSquareQuote, t: 'Paste the answer', d: 'The question asked and what the AI replied.' },
              { icon: Highlighter, t: 'See each claim', d: 'Every checkable claim is pulled out, rated and marked in the text.' },
              { icon: GaugeIcon, t: 'Get an action', d: 'One score tells you to serve it, spot-check it, or send it to a person.' },
            ]}
          />

          <div className="card soft">
            <h3 className="card-title">
              <Info size={18} /> Where the results come from
            </h3>
            <IconList
              items={[
                { icon: Brain, text: <><b>Claim ratings and the tone rating</b> come from a language model reading your text. It checks against what it learned in training, with no live lookup.</> },
                { icon: Sigma, text: <><b>The score</b> is a fixed formula worked out in your browser from those two ratings, printed under Method.</> },
                { icon: Hash, text: <><b>The tone check</b> on the Verdict page is a simple word count in your browser, with no AI, so you can sanity-check the tone rating.</> },
              ]}
            />
          </div>
        </section>
      )}

      {section === 'audit' && (
        <section>
          <SectionHead icon={ScanSearch} kicker="Step 1" title="Audit an answer">
            Paste what the user asked and what the AI said. The question helps the audit judge whether each claim is even relevant.
          </SectionHead>
          <div className="card">
            <ChipRow
              label="What is it about?"
              hint="Optional, helps the audit"
              options={domainOptions}
              selected={domain}
              onToggle={pickOne(setDomain)}
              onAdd={addOption(setDomainOptions, setDomain, true)}
              single
            />
            <div className="field">
              <label className="field-label" htmlFor="q">
                <Search size={15} /> The question
              </label>
              <textarea id="q" rows={2} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What the user asked" />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="a">
                <MessageSquareQuote size={15} /> The AI's answer
              </label>
              <textarea id="a" rows={8} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Paste the full reply, exactly as it was shown" />
              <span className="count">{answer.length.toLocaleString('en-GB')} / 8,000</span>
            </div>
          </div>
          <div className="run-bar">
            <span>{answer.trim() ? 'Ready to audit' : 'Paste an answer to begin'}</span>
            <div className="row">
              {(question || answer) && (
                <button className="btn ghost small" onClick={clearAll}>
                  <Eraser size={16} /> Clear
                </button>
              )}
              <button className="btn primary" onClick={runAudit} disabled={busy}>
                {busy ? <Loader2 size={18} className="spin" /> : <Play size={18} />} Audit this answer
              </button>
            </div>
          </div>
        </section>
      )}

      {section === 'verdict' && (
        <section>
          <SectionHead icon={GaugeIcon} kicker="Step 2" title="Verdict">
            How assertive the answer sounds, how much of it holds up, and what that means for shipping it.
          </SectionHead>
          <SavedBanner title={saved} onClear={clearAll} />
          {!r.ok ? (
            <>
              {noResult}
              {reportText && (
                <>
                  <button className="link-btn" onClick={() => setShowRaw((v) => !v)}>
                    {showRaw ? 'Hide' : 'Show'} the model's raw reply
                  </button>
                  {showRaw && <pre className="raw">{reportText}</pre>}
                </>
              )}
            </>
          ) : (
            <>
              <div className={`verdict ${r.band.cls}`}>
                <div className="verdict-icon">{(() => { const I = BAND_ICON[r.band.cls]; return <I size={30} />; })()}</div>
                <div>
                  <div className="verdict-top">
                    <h3>{r.band.label}</h3>
                    <Pill cls={r.band.cls}>Score {r.score} of 100</Pill>
                  </div>
                  <p className="verdict-line">{r.band.line}</p>
                  <p>{r.summary}</p>
                </div>
              </div>

              <div className="score-row">
                <Gauge score={r.score} bands={BANDS.map((b) => ({ from: b.from, to: b.to, cls: b.cls }))} caption="Silent failure score" />
                <div className="card" style={{ marginBottom: 0 }}>
                  <h3 className="card-title">
                    <Scale size={18} /> The two ratings behind it
                  </h3>
                  <div className="meter">
                    <div className="meter-top">
                      <span>How sure it sounds</span>
                      <span>{r.confidence}</span>
                    </div>
                    <div className="meter-track">
                      <div className="meter-fill" style={{ width: `${r.confidence}%` }} />
                    </div>
                    {r.tone && <p>{r.tone}</p>}
                  </div>
                  <div className="meter">
                    <div className="meter-top">
                      <span>How much can be backed up</span>
                      <span>{r.verifiability}</span>
                    </div>
                    <div className="meter-track">
                      <div className="meter-fill light" style={{ width: `${r.verifiability}%` }} />
                    </div>
                    <p>
                      {r.confidence} × (100 − {r.verifiability}) ÷ 100 = <b>{r.score}</b>
                    </p>
                  </div>
                </div>
              </div>

              <div className="stats">
                {counts.map(({ s, n }) => {
                  const m = STATUS_META[s];
                  return (
                    <div className={`stat ${n ? m.cls : ''}`} key={s}>
                      <m.icon size={18} />
                      <b>{n}</b>
                      <span>{s}</span>
                    </div>
                  );
                })}
              </div>

              <div className="two-col">
                <div className="card">
                  <h3 className="card-title">
                    <Hash size={18} /> Tone check, no AI
                  </h3>
                  <p className="muted small-text" style={{ marginBottom: 12 }}>
                    A plain word count in your browser, to sanity-check the "how sure it sounds" rating.
                  </p>
                  <div className="rows">
                    <div className="row">
                      <Pill cls="brand">{tone.hedges.length} doubt words</Pill>
                      <span className="small-text muted">{tone.hedges.join(', ') || 'none found'}</span>
                    </div>
                    <div className="row">
                      <Pill cls="brand">{tone.sure.length} certainty words</Pill>
                      <span className="small-text muted">{tone.sure.join(', ') || 'none found'}</span>
                    </div>
                    <div className="row">
                      <Pill cls="brand">{tone.figures} figures</Pill>
                      <span className="small-text muted">numbers, dates and amounts stated</span>
                    </div>
                  </div>
                </div>
                <div className="card flip">
                  <h3 className="card-title">
                    <Wrench size={18} /> What to change
                  </h3>
                  {r.fixes.length ? r.fixes.map((f, i) => <p key={i}>{f}</p>) : <p>No change suggested.</p>}
                </div>
              </div>
              <div className="row">
                <button className="btn ghost" onClick={() => go('redline')}>
                  <Highlighter size={18} /> See the redline
                </button>
                <button className="btn ghost" onClick={() => go('ledger')}>
                  <ListChecks size={18} /> Open the claims ledger
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {section === 'redline' && (
        <section>
          <SectionHead icon={Highlighter} title="Redline">
            The answer as the user saw it, with every rated claim marked. The colour tells you how far to trust that phrase.
          </SectionHead>
          <SavedBanner title={saved} />
          {!r.ok ? (
            noResult
          ) : (
            <>
              <div className="legend">
                {STATUSES.map((s) => {
                  const m = STATUS_META[s];
                  return (
                    <Pill key={s} cls={m.cls} icon={m.icon}>
                      {s}
                    </Pill>
                  );
                })}
                <Pill cls="brand">Hedge</Pill>
              </div>
              <div className="card">
                {question && (
                  <p className="muted small-text" style={{ marginBottom: 12 }}>
                    <b>Asked:</b> {question}
                  </p>
                )}
                <div className="transcript">
                  {red.segs.map((s, i) =>
                    s.mark ? (
                      <mark key={i} className={s.mark.cls} title={s.mark.hedge ? 'Hedge' : `Claim ${s.mark.n}: ${s.mark.status}`}>
                        {s.text}
                        {!s.mark.hedge && <sup> {s.mark.n}</sup>}
                      </mark>
                    ) : (
                      <span key={i}>{s.text}</span>
                    )
                  )}
                </div>
              </div>
              {red.found < marks.length && (
                <p className="note">
                  <Info size={15} /> {marks.length - red.found} claim{marks.length - red.found === 1 ? ' was' : 's were'} paraphrased by the model, so {marks.length - red.found === 1 ? 'it is' : 'they are'} in the
                  ledger but not marked here.
                </p>
              )}
            </>
          )}
        </section>
      )}

      {section === 'ledger' && (
        <section>
          <SectionHead icon={ListChecks} title="Claims ledger">
            Each claim on its own line, riskiest first, with what a reviewer should check.
          </SectionHead>
          <SavedBanner title={saved} />
          {!r.ok ? (
            noResult
          ) : r.claims.length === 0 ? (
            <Empty icon={CircleCheck} title="No checkable claims">
              The answer makes no specific factual claims, so there is nothing that could be silently wrong.
            </Empty>
          ) : (
            <div className="rows">
              {[...r.claims]
                .map((c, i) => ({ ...c, n: i + 1 }))
                .sort((a, b) => STATUSES.indexOf(b.status) - STATUSES.indexOf(a.status))
                .map((c) => {
                  const m = STATUS_META[c.status];
                  return (
                    <div className={`rowcard ${m.cls}`} key={c.n}>
                      <span className="il-icon">{c.n}</span>
                      <div className="rowcard-body">
                        <div className="row between">
                          <span className="quote">“{c.quote}”</span>
                          <Pill cls={m.cls} icon={m.icon}>
                            {c.status}
                          </Pill>
                        </div>
                        <p>
                          <b>Check:</b> {c.check || m.plain}
                        </p>
                      </div>
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
            Saved audits you can open straight away. Load one, then look through Verdict, Redline and the ledger.
          </SectionHead>
          <div className="examples">
            {EXAMPLES.map((ex) => {
              const er = parseAudit(ex.report);
              const I = BAND_ICON[er.band.cls];
              return (
                <button className="example" key={ex.id} onClick={() => loadExample(ex)}>
                  <div className="example-top">
                    <span className="chip static">{ex.domain}</span>
                    <Pill cls={er.band.cls} icon={I}>
                      {er.band.label}
                    </Pill>
                  </div>
                  <h3>{ex.title}</h3>
                  <p>{ex.blurb}</p>
                  <div className="example-foot">
                    <span>
                      Score {er.score} · {er.claims.length} claims
                    </span>
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
            How the score is built, and what it cannot tell you.
          </SectionHead>
          <MethodGrid
            items={[
              { icon: Search, t: 'Pull out the claims', d: 'The model copies every checkable claim from the answer word for word: figures, dates, names, statistics, causes. Opinions and general advice are left out.' },
              { icon: ShieldCheck, t: 'Rate each one', d: 'Verified, Plausible, Unverifiable or Fabrication risk, with a short note on what a reviewer should check. Verifiability is the share rated Verified or Plausible.' },
              { icon: Ruler, t: 'Rate the tone separately', d: 'How assertive the wording is, from 0 (open about doubt) to 100 (flat statements, no caveats), judged without regard to accuracy.' },
              { icon: Sigma, t: 'Combine them', d: 'Score = tone × (100 − verifiability) ÷ 100. Sure and checkable scores low. Sure and uncheckable scores high. Hedged and uncheckable stays low, because the doubt is visible to the reader.' },
            ]}
          />
          <div className="card">
            <h3 className="card-title">
              <GaugeIcon size={18} /> Bands and actions
            </h3>
            <div className="rows">
              {BANDS.map((b) => {
                const I = BAND_ICON[b.cls];
                return (
                  <div className={`rowcard ${b.cls}`} key={b.label}>
                    <span className="il-icon">
                      <I size={16} />
                    </span>
                    <div className="rowcard-body">
                      <b>
                        {b.from} to {b.to === 100 ? 100 : b.to - 1}: {b.label}
                      </b>
                      <p>{b.line}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="two-col">
            <div className="card">
              <h3 className="card-title">
                <TriangleAlert size={18} /> Limits
              </h3>
              <IconList
                tight
                items={[
                  { icon: Database, text: 'The model checks claims against its training, not a live source. Treat the result as triage, not a fact-check.' },
                  { icon: Brain, text: 'The judging model can be wrong itself, in both directions. A Verified rating is a reason to check less, not a guarantee.' },
                  { icon: Highlighter, text: 'Marking depends on the model quoting the answer exactly. Paraphrased claims still appear in the ledger.' },
                ]}
              />
            </div>
            <div className="card">
              <h3 className="card-title">
                <ShieldCheck size={18} /> Privacy
              </h3>
              <IconList
                tight
                items={[
                  { icon: Info, text: 'Your text is sent once to the chosen model through this site\'s server function, then discarded. Nothing is stored.' },
                  { icon: ShieldCheck, text: 'The audit prompt and the default key live on the server, not in the page.' },
                ]}
              />
            </div>
          </div>
        </section>
      )}

      {section === 'settings' && <SettingsPanel settings={settings} setSettings={setSettings} provider={provider} intro="The chosen model reads the answer, rates each claim and rates the tone." />}
    </Shell>
  );
}
