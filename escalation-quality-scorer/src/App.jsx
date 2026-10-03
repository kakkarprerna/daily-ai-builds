import { useMemo, useRef, useState } from 'react';
import {
  Compass,
  ClipboardPaste,
  Gauge as GaugeIcon,
  PackageCheck,
  Repeat,
  NotebookPen,
  FlaskConical,
  BookOpen,
  ArrowLeftRight,
  ArrowRight,
  CircleCheck,
  CircleDashed,
  CircleX,
  TriangleAlert,
  OctagonX,
  Info,
  Clock,
  Siren,
  Wrench,
  Copy,
  Check,
  Play,
  Loader2,
  Eraser,
  MessagesSquare,
  UserRound,
  Bot,
  Sigma,
  ListChecks,
  ShieldCheck,
  Brain,
  Database,
  Minus,
  Hourglass,
} from 'lucide-react';
import { Shell, Banners, SectionHead, Empty, ChipRow, Pill, Gauge, MethodGrid, IconList, Steps, SettingsPanel, SavedBanner, useSettings, pickOne, addOption } from './kit/ui.jsx';
import { callApi } from './kit/api.js';
import { segment } from './kit/highlight.js';
import { parseScore, BANDS, PENALTY } from './parse.js';
import { EXAMPLES } from './examples.js';

const SECTIONS = [
  { id: 'start', title: 'Start here', desc: 'What this checks, in a minute', icon: Compass },
  { id: 'input', title: 'Paste a handoff', desc: 'Transcript and the note the AI wrote', icon: ClipboardPaste },
  { id: 'score', title: 'Handoff score', desc: 'Score, timing and urgency', icon: GaugeIcon },
  { id: 'facts', title: 'What reached the human', desc: 'Each fact: carried, partial, missing', icon: PackageCheck },
  { id: 'repeats', title: 'Asked twice', desc: 'Questions the customer had answered', icon: Repeat },
  { id: 'note', title: 'Better note', desc: 'A handoff the agent can act on', icon: NotebookPen },
  { id: 'examples', title: 'Worked examples', desc: 'Three saved reviews, no key needed', icon: FlaskConical },
  { id: 'method', title: 'Method', desc: 'The formula and its limits', icon: BookOpen },
  { id: 'settings', title: 'Model & key', desc: 'Pick who does the review', icon: ArrowLeftRight },
];

const CHANNELS = ['Chat', 'Voice', 'Email', 'Messaging app'];
const SECTORS = ['Telco', 'Banking', 'SaaS', 'Travel', 'Utilities', 'Retail'];

const FACT_META = {
  Carried: { cls: 'ok', icon: CircleCheck },
  Partial: { cls: 'warn', icon: CircleDashed },
  Missing: { cls: 'bad', icon: CircleX },
};
const TIMING_META = { Early: { cls: 'warn', icon: Hourglass }, Appropriate: { cls: 'ok', icon: Clock }, Late: { cls: 'bad', icon: Hourglass } };
const URGENCY_META = { Flagged: { cls: 'ok', icon: Siren }, 'Not flagged': { cls: 'bad', icon: Siren }, 'None to flag': { cls: 'quiet', icon: Minus } };
const BAND_ICON = { ok: CircleCheck, warn: TriangleAlert, bad: OctagonX };

function Transcript({ text, marks }) {
  const { segs } = segment(text, marks);
  // Render line by line so speaker labels can be styled.
  const out = [];
  let key = 0;
  segs.forEach((s) => {
    const pieces = s.text.split('\n');
    pieces.forEach((piece, i) => {
      if (i > 0) out.push(<br key={key++} />);
      if (!piece) return;
      if (s.mark) out.push(<mark key={key++} className={s.mark.cls}>{piece}</mark>);
      else {
        const m = piece.match(/^(\s*)(AI|Agent|Bot|Assistant|Customer|User|Caller)(\s*:)(.*)$/i);
        if (m) {
          const isBot = /^(ai|agent|bot|assistant)$/i.test(m[2]);
          out.push(
            <span key={key++}>
              <b className={isBot ? 'spk bot' : 'spk cust'}>{m[2]}</b>
              {m[3].replace(':', '')}
              {m[4]}
            </span>
          );
        } else out.push(<span key={key++}>{piece}</span>);
      }
    });
  });
  return <div className="transcript">{out}</div>;
}

export default function App() {
  const [section, setSection] = useState('start');
  const mainRef = useRef(null);
  const { settings, setSettings, provider, keyMissing } = useSettings();

  const [channelOpts, setChannelOpts] = useState(CHANNELS);
  const [channel, setChannel] = useState([]);
  const [sectorOpts, setSectorOpts] = useState(SECTORS);
  const [sector, setSector] = useState([]);
  const [transcript, setTranscript] = useState('');
  const [note, setNote] = useState('');
  const [reviewed, setReviewed] = useState({ transcript: '', note: '' });
  const [reportText, setReportText] = useState('');
  const [saved, setSaved] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const r = useMemo(() => parseScore(reportText), [reportText]);

  const go = (id) => {
    setSection(id);
    if (mainRef.current) mainRef.current.scrollTop = 0;
    window.scrollTo?.(0, 0);
  };

  const loadExample = (ex) => {
    setChannelOpts((c) => (c.includes(ex.channel) ? c : [...c, ex.channel]));
    setSectorOpts((c) => (c.includes(ex.sector) ? c : [...c, ex.sector]));
    setChannel([ex.channel]);
    setSector([ex.sector]);
    setTranscript(ex.transcript);
    setNote(ex.note);
    setReviewed({ transcript: ex.transcript, note: ex.note });
    setReportText(ex.report);
    setSaved(ex.title);
    setError('');
    go('score');
  };

  const clearAll = () => {
    setTranscript('');
    setNote('');
    setReviewed({ transcript: '', note: '' });
    setReportText('');
    setSaved(null);
    setChannel([]);
    setSector([]);
    go('input');
  };

  const run = async () => {
    setError('');
    if (transcript.trim().length < 40) return setError('Paste the conversation between the AI agent and the customer.');
    if (keyMissing) return setError(`Add your ${provider.name} key in Model & key first.`);
    setBusy(true);
    try {
      const { report } = await callApi('score', { transcript, note, channel: channel.join(', '), sector: sector.join(', ') }, settings);
      setReportText(report);
      setReviewed({ transcript, note });
      setSaved(null);
      if (!parseScore(report).ok) throw new Error('The model replied, but not in the expected format. Try again, or switch provider. Its raw reply is under Handoff score.');
      go('score');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const copyNote = async () => {
    try {
      await navigator.clipboard.writeText(r.note.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setError('Could not copy. Select the text and copy it by hand.');
    }
  };

  const badge = (id) => {
    if (id === 'score' && r.band) return { text: r.score, cls: r.band.cls };
    if (id === 'facts' && r.ok) return r.missing ? { text: `${r.missing} missing`, cls: 'bad' } : { text: 'all there', cls: 'ok' };
    if (id === 'repeats' && r.ok) return r.repeats.length ? { text: r.repeats.length, cls: 'bad' } : { text: '0', cls: 'ok' };
    return null;
  };

  const noResult = (
    <>
      <Empty
        icon={ArrowLeftRight}
        title="No handoff reviewed yet"
        action={
          <div className="row" style={{ justifyContent: 'center' }}>
            <button className="btn primary" onClick={() => go('examples')}>
              <FlaskConical size={18} /> Load a worked example
            </button>
            <button className="btn ghost" onClick={() => go('input')}>
              Paste a handoff
            </button>
          </div>
        }
      >
        Paste a transcript and the note the AI wrote, or open one of the saved examples.
      </Empty>
      {reportText && (
        <>
          <button className="link-btn" onClick={() => setShowRaw((v) => !v)}>
            {showRaw ? 'Hide' : 'Show'} the model's raw reply
          </button>
          {showRaw && <pre className="raw">{reportText}</pre>}
        </>
      )}
    </>
  );

  return (
    <Shell
      brand={{ name: 'Escalation Quality Scorer', sub: 'What survived the handoff', icon: ArrowLeftRight }}
      sections={SECTIONS}
      section={section}
      go={go}
      badge={badge}
      provider={provider}
      keyMissing={keyMissing}
      mainRef={mainRef}
    >
      <Banners error={error} setError={setError} progress={busy ? 'Reading the conversation and checking the note against it' : ''} />

      {section === 'start' && (
        <section>
          <div className="hero">
            <div className="hero-text">
              <div className="kicker">For support and conversational AI teams</div>
              <h1>Did anything useful survive the handoff?</h1>
              <p>
                An escalation either happens or it doesn't, so it's easy to count. What's hard to see is whether the human agent got what the AI already knew. Paste a transcript and
                the handoff note to find out, and get a better note back.
              </p>
              <div className="row">
                <button className="btn primary" onClick={() => go('examples')}>
                  <FlaskConical size={18} /> See a worked example
                </button>
                <button className="btn ghost" onClick={() => go('input')}>
                  Paste a handoff <ArrowRight size={18} />
                </button>
              </div>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <div className="hv-card" style={{ width: '56%', top: 8, left: 0, transform: 'rotate(-3deg)' }}>
                <span className="row small-text" style={{ fontWeight: 700, color: 'var(--p-700)' }}>
                  <Bot size={16} /> AI collected
                </span>
                <span className="hv-line" />
                <span className="hv-line" />
                <span className="hv-line" />
                <span className="hv-line short" />
              </div>
              <div className="hv-card" style={{ width: '50%', top: 70, right: 0, transform: 'rotate(2deg)' }}>
                <span className="row small-text" style={{ fontWeight: 700, color: 'var(--p-700)' }}>
                  <UserRound size={16} /> Human received
                </span>
                <span className="hv-line mark" style={{ width: '50%' }} />
              </div>
              <span className="hv-pill bad" style={{ bottom: 4, left: '10%' }}>
                <Repeat size={15} /> Asked twice
              </span>
            </div>
          </div>
          <Steps
            items={[
              { icon: ClipboardPaste, t: 'Paste the handoff', d: 'The bot conversation and the note it left for the human agent.' },
              { icon: PackageCheck, t: 'See what got through', d: 'Each fact the agent needs, marked carried, partial or missing.' },
              { icon: NotebookPen, t: 'Take a better note', d: 'A rewritten note built only from what the customer said.' },
            ]}
          />
          <div className="card soft">
            <h3 className="card-title">
              <Info size={18} /> Where the results come from
            </h3>
            <IconList
              items={[
                { icon: Brain, text: <><b>Facts, repeats, timing and urgency</b> come from a language model reading the transcript and note you paste. It sees nothing else, no CRM and no account history.</> },
                { icon: Sigma, text: <><b>The score</b> is a fixed formula worked out in your browser from those facts and repeats, printed under Method.</> },
              ]}
            />
          </div>
        </section>
      )}

      {section === 'input' && (
        <section>
          <SectionHead icon={ClipboardPaste} kicker="Step 1" title="Paste a handoff">
            Use "AI:" and "Customer:" at the start of each turn if you can. Leave the note empty if the bot didn't write one.
          </SectionHead>
          <div className="card">
            <div className="two-col">
              <ChipRow label="Channel" options={channelOpts} selected={channel} onToggle={pickOne(setChannel)} onAdd={addOption(setChannelOpts, setChannel, true)} single />
              <ChipRow label="Sector" hint="Optional" options={sectorOpts} selected={sector} onToggle={pickOne(setSector)} onAdd={addOption(setSectorOpts, setSector, true)} single />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="t">
                <MessagesSquare size={15} /> Conversation transcript
              </label>
              <textarea id="t" rows={12} value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder={'AI: Hi, how can I help?\nCustomer: ...'} />
              <span className="count">{transcript.length.toLocaleString('en-GB')} / 12,000</span>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="n">
                <NotebookPen size={15} /> Handoff note the AI wrote
              </label>
              <textarea id="n" rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What the human agent saw when the chat landed in their queue" />
            </div>
          </div>
          <div className="run-bar">
            <span>{transcript.trim() ? 'Ready to review' : 'Paste a transcript to begin'}</span>
            <div className="row">
              {(transcript || note) && (
                <button className="btn ghost small" onClick={clearAll}>
                  <Eraser size={16} /> Clear
                </button>
              )}
              <button className="btn primary" onClick={run} disabled={busy}>
                {busy ? <Loader2 size={18} className="spin" /> : <Play size={18} />} Score this handoff
              </button>
            </div>
          </div>
        </section>
      )}

      {section === 'score' && (
        <section>
          <SectionHead icon={GaugeIcon} kicker="Step 2" title="Handoff score">
            How much of what the human agent needed made it across, minus a penalty for every question the customer had to answer twice.
          </SectionHead>
          <SavedBanner title={saved} onClear={clearAll} />
          {!r.ok ? (
            noResult
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
                <Gauge score={r.score} bands={BANDS} caption="Handoff quality" />
                <div className="card" style={{ marginBottom: 0 }}>
                  <h3 className="card-title">
                    <Sigma size={18} /> How the score adds up
                  </h3>
                  <div className="meter">
                    <div className="meter-top">
                      <span>Context transfer</span>
                      <span>{r.context}</span>
                    </div>
                    <div className="meter-track">
                      <div className="meter-fill" style={{ width: `${r.context}%` }} />
                    </div>
                    <p>
                      {r.carried} carried + {r.partial} partial × ½, out of {r.facts.length} facts the agent needed
                    </p>
                  </div>
                  <div className="meter">
                    <div className="meter-top">
                      <span>Repeated questions</span>
                      <span>−{r.repeats.length * PENALTY}</span>
                    </div>
                    <div className="meter-track">
                      <div className="meter-fill light" style={{ width: `${Math.min(100, r.repeats.length * PENALTY)}%` }} />
                    </div>
                    <p>
                      {r.repeats.length} × {PENALTY} points. {r.context} − {r.repeats.length * PENALTY} = <b>{r.score}</b>
                    </p>
                  </div>
                </div>
              </div>
              <div className="two-col">
                {[
                  { title: 'Escalation timing', v: r.timing, meta: TIMING_META },
                  { title: 'Urgency passed on', v: r.urgency, meta: URGENCY_META },
                ].map(({ title, v, meta }) => {
                  if (!v) return null;
                  const m = meta[v.label];
                  return (
                    <div className={`rowcard ${m.cls}`} key={title}>
                      <span className="il-icon">
                        <m.icon size={16} />
                      </span>
                      <div className="rowcard-body">
                        <div className="row between">
                          <b>{title}</b>
                          <Pill cls={m.cls}>{v.label}</Pill>
                        </div>
                        <p>{v.why}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="card flip" style={{ marginTop: 18 }}>
                <h3 className="card-title">
                  <Wrench size={18} /> What to fix
                </h3>
                <ul className="icon-list">
                  {r.fixes.map((f, i) => (
                    <li key={i} style={{ color: '#fff' }}>
                      <span className="il-icon" style={{ background: 'rgba(255,255,255,0.16)', borderColor: 'transparent', color: '#fff' }}>
                        {i + 1}
                      </span>
                      <span style={{ fontSize: 15 }}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </section>
      )}

      {section === 'facts' && (
        <section>
          <SectionHead icon={PackageCheck} title="What reached the human">
            Every fact a human agent needs to carry on without re-asking, and whether the note passed it on.
          </SectionHead>
          <SavedBanner title={saved} />
          {!r.ok ? (
            noResult
          ) : (
            <>
              <div className="stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {[
                  ['Carried', r.carried],
                  ['Partial', r.partial],
                  ['Missing', r.missing],
                ].map(([k, n]) => {
                  const m = FACT_META[k];
                  return (
                    <div className={`stat ${n ? m.cls : ''}`} key={k}>
                      <m.icon size={18} />
                      <b>{n}</b>
                      <span>{k}</span>
                    </div>
                  );
                })}
              </div>
              <div className="rows">
                {[...r.facts]
                  .sort((a, b) => ['Missing', 'Partial', 'Carried'].indexOf(a.state) - ['Missing', 'Partial', 'Carried'].indexOf(b.state))
                  .map((f, i) => {
                    const m = FACT_META[f.state];
                    return (
                      <div className={`rowcard ${m.cls}`} key={i}>
                        <span className="il-icon">
                          <m.icon size={16} />
                        </span>
                        <div className="rowcard-body">
                          <div className="row between">
                            <b>{f.fact}</b>
                            <Pill cls={m.cls}>{f.state}</Pill>
                          </div>
                          <p>{f.detail}</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </>
          )}
        </section>
      )}

      {section === 'repeats' && (
        <section>
          <SectionHead icon={Repeat} title="Asked twice">
            Every time the bot asked for something the customer had already given. This is the moment a customer stops trusting the bot.
          </SectionHead>
          <SavedBanner title={saved} />
          {!r.ok ? (
            noResult
          ) : (
            <>
              {r.repeats.length === 0 ? (
                <div className="card soft">
                  <p className="note">
                    <CircleCheck size={16} /> The bot never asked for something it already had.
                  </p>
                </div>
              ) : (
                <div className="rows" style={{ marginBottom: 18 }}>
                  {r.repeats.map((q, i) => (
                    <div className="rowcard bad" key={i}>
                      <span className="il-icon">
                        <Repeat size={16} />
                      </span>
                      <div className="rowcard-body">
                        <span className="quote">“{q.quote}”</span>
                        <p>
                          <b>Already given:</b> {q.already}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <h3 className="sub">
                <MessagesSquare size={18} /> The conversation
              </h3>
              <div className="card">
                <Transcript text={reviewed.transcript} marks={r.repeats.map((q) => ({ quote: q.quote, cls: 'bad' }))} />
              </div>
            </>
          )}
        </section>
      )}

      {section === 'note' && (
        <section>
          <SectionHead icon={NotebookPen} title="Better note">
            The same handoff rewritten so the agent can reply straight away. Built only from what is in the transcript.
          </SectionHead>
          <SavedBanner title={saved} />
          {!r.ok ? (
            noResult
          ) : (
            <div className="two-col">
              <div className="card">
                <h3 className="card-title">
                  <Bot size={18} /> What the bot wrote
                </h3>
                <p className="transcript" style={{ fontSize: 14 }}>
                  {reviewed.note.trim() || <span className="muted">No note at all.</span>}
                </p>
              </div>
              <div className="card" style={{ borderColor: 'var(--p-300)' }}>
                <div className="row between" style={{ marginBottom: 14 }}>
                  <h3 className="card-title" style={{ margin: 0 }}>
                    <ListChecks size={18} /> Suggested note
                  </h3>
                  <button className="btn ghost small" onClick={copyNote}>
                    {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <ul className="checklist">
                  {r.note.map((l, i) => (
                    <li key={i}>
                      <span className="il-icon" style={{ width: 24, height: 24, fontSize: 12, fontWeight: 800 }}>
                        {i + 1}
                      </span>
                      <span style={{ color: 'var(--ink)' }}>{l}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>
      )}

      {section === 'examples' && (
        <section>
          <SectionHead icon={FlaskConical} kicker="No key needed" title="Worked examples">
            Saved reviews you can open straight away. Load one, then look through every section.
          </SectionHead>
          <div className="examples">
            {EXAMPLES.map((ex) => {
              const er = parseScore(ex.report);
              const I = BAND_ICON[er.band.cls];
              return (
                <button className="example" key={ex.id} onClick={() => loadExample(ex)}>
                  <div className="example-top">
                    <span className="chip static">
                      {ex.channel} · {ex.sector}
                    </span>
                    <Pill cls={er.band.cls} icon={I}>
                      {er.band.label}
                    </Pill>
                  </div>
                  <h3>{ex.title}</h3>
                  <p>{ex.blurb}</p>
                  <div className="example-foot">
                    <span>
                      Score {er.score} · {er.repeats.length} asked twice
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
            How a handoff is scored, and what the score leaves out.
          </SectionHead>
          <MethodGrid
            items={[
              { icon: ListChecks, t: 'List what the agent needs', d: 'From the transcript: the issue in specific terms, identifiers the customer gave, what was already tried, the outcome they want, and any frustration or deadline.' },
              { icon: PackageCheck, t: 'Check the note', d: 'Each fact is Carried (the agent would not need to ask), Partial (hinted, still needs checking) or Missing.' },
              { icon: Repeat, t: 'Find the repeats', d: 'Every question the bot asked for something already given, quoted exactly so it can be marked in the transcript.' },
              { icon: Sigma, t: 'Score it', d: `Context transfer = (carried + ½ partial) ÷ all facts × 100. Then subtract ${PENALTY} per repeated question. Timing and urgency are shown as separate checks, since they are yes-or-no rather than a scale.` },
            ]}
          />
          <div className="card">
            <h3 className="card-title">
              <GaugeIcon size={18} /> Bands
            </h3>
            <div className="rows">
              {[...BANDS].reverse().map((b) => {
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
                  { icon: Database, text: 'The review sees only what you paste. A real agent may also see the CRM record, which could fill some gaps.' },
                  { icon: Sigma, text: `The ${PENALTY}-point penalty is a judgement call, not a validated weight. Tune it against your own transcripts before using the score for targets.` },
                  { icon: Brain, text: 'The list of needed facts is the model\'s judgement, so two runs can list slightly different facts. Use it for QA sampling, not as an audit of one agent.' },
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
                  { icon: Info, text: 'Remove names, phone numbers and account numbers before pasting real transcripts.' },
                  { icon: ShieldCheck, text: 'Text goes once to the chosen model through this site\'s server function, then is discarded. Nothing is stored.' },
                ]}
              />
            </div>
          </div>
        </section>
      )}

      {section === 'settings' && <SettingsPanel settings={settings} setSettings={setSettings} provider={provider} intro="The chosen model reads the transcript and the note, and writes the review and the better note." />}
    </Shell>
  );
}
