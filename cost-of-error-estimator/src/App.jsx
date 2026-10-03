import { useMemo, useRef, useState } from 'react';
import {
  Compass,
  SlidersHorizontal,
  BarChart3,
  FlaskConical,
  BookOpen,
  Settings2,
  ArrowRight,
  Plus,
  Trash2,
  Play,
  Loader2,
  Eraser,
  Info,
  Target,
  Coins,
  CalendarDays,
  Layers,
  TriangleAlert,
  Eye,
  ListChecks,
  Wand2,
  ShieldCheck,
  Brain,
  Sigma,
  Calculator,
  PiggyBank,
  Scale,
  Receipt,
  Building2,
  Users,
  Hash,
} from 'lucide-react';
import { Shell, Banners, SectionHead, Empty, ChipRow, Pill, Conf, MethodGrid, IconList, Steps, SettingsPanel, SavedBanner, useSettings, pickOne, addOption } from './kit/ui.jsx';
import { callApi } from './kit/api.js';
import { parseEstimate, rank, money } from './parse.js';
import { EXAMPLES } from './examples.js';

const SECTIONS = [
  { id: 'start', title: 'Start here', desc: 'What this works out, in a minute', icon: Compass },
  { id: 'setup', title: 'Your product', desc: 'Context and the ways it fails', icon: SlidersHorizontal },
  { id: 'ranking', title: 'Ranking', desc: 'Monthly cost of each failure, ranked', icon: BarChart3 },
  { id: 'whatif', title: 'What if we fix it?', desc: 'Savings from a guardrail', icon: Calculator },
  { id: 'examples', title: 'Worked examples', desc: 'Three saved estimates, no key needed', icon: FlaskConical },
  { id: 'method', title: 'Method', desc: 'Where the figures come from', icon: BookOpen },
  { id: 'settings', title: 'Model & key', desc: 'Pick who makes the estimate', icon: Settings2 },
];

const PRODUCTS = ['Support chatbot', 'Voice agent', 'Sales assistant', 'Returns assistant', 'Internal copilot', 'Booking assistant'];
const CURRENCIES = ['EUR', 'USD', 'GBP'];
const SYMBOL = { EUR: '€', USD: '$', GBP: '£' };
const blankCat = () => ({ name: '', frequency: '', description: '' });

export default function App() {
  const [section, setSection] = useState('start');
  const mainRef = useRef(null);
  const { settings, setSettings, provider, keyMissing } = useSettings();

  const [productOpts, setProductOpts] = useState(PRODUCTS);
  const [product, setProduct] = useState([]);
  const [currency, setCurrency] = useState(['EUR']);
  const [context, setContext] = useState('');
  const [contactCost, setContactCost] = useState('');
  const [customerValue, setCustomerValue] = useState('');
  const [cats, setCats] = useState([blankCat(), blankCat()]);
  const [reportText, setReportText] = useState('');
  const [estimatedFor, setEstimatedFor] = useState(0);
  const [saved, setSaved] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [whatIf, setWhatIf] = useState({ idx: null, pct: 60, cost: '' });

  const cur = currency[0] || 'EUR';
  const est = useMemo(() => parseEstimate(reportText), [reportText]);
  const ranked = useMemo(() => rank(cats, est.costs), [cats, est]);
  const stale = est.ok && estimatedFor !== cats.length;
  const fmt = (n) => money(n, cur);

  const go = (id) => {
    setSection(id);
    if (mainRef.current) mainRef.current.scrollTop = 0;
    window.scrollTo?.(0, 0);
  };

  const setCat = (i, patch) => setCats((cs) => cs.map((c, k) => (k === i ? { ...c, ...patch } : c)));
  const addCat = () => setCats((cs) => (cs.length >= 8 ? cs : [...cs, blankCat()]));
  const removeCat = (i) => {
    setCats((cs) => cs.filter((_, k) => k !== i));
    if (est.ok) {
      setReportText('');
      setSaved(null);
    }
  };

  const loadExample = (ex) => {
    setProductOpts((o) => (o.includes(ex.product) ? o : [...o, ex.product]));
    setProduct([ex.product]);
    setCurrency([ex.currency]);
    setContext(ex.context);
    setContactCost(ex.contactCost);
    setCustomerValue(ex.customerValue);
    setCats(ex.categories.map((c) => ({ ...c })));
    setReportText(ex.report);
    setEstimatedFor(ex.categories.length);
    setSaved(ex.title);
    setWhatIf({ idx: null, pct: 60, cost: '' });
    setError('');
    go('ranking');
  };

  const clearAll = () => {
    setProduct([]);
    setContext('');
    setContactCost('');
    setCustomerValue('');
    setCats([blankCat(), blankCat()]);
    setReportText('');
    setSaved(null);
    go('setup');
  };

  const run = async () => {
    setError('');
    const valid = cats.filter((c) => c.name.trim());
    if (!valid.length) return setError('Add at least one failure category with a name.');
    if (valid.length !== cats.length) return setError('Every category needs a name. Remove the empty ones or fill them in.');
    if (keyMissing) return setError(`Add your ${provider.name} key in Model & key first.`);
    setBusy(true);
    try {
      const { report } = await callApi(
        'estimate',
        { context, product: product.join(', '), currency: cur, contactCost, customerValue, categories: cats },
        settings
      );
      if (!parseEstimate(report).ok) throw new Error('The model replied, but not in the expected format. Try again, or switch provider.');
      setReportText(report);
      setEstimatedFor(cats.length);
      setSaved(null);
      setWhatIf({ idx: null, pct: 60, cost: '' });
      go('ranking');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const top = ranked.rows[0];
  const maxMid = Math.max(1, ...ranked.rows.map((r) => r.monthHigh));
  const wiRow = ranked.rows.find((r) => r.idx === (whatIf.idx ?? top?.idx));
  const wiSave = wiRow ? wiRow.monthMid * (whatIf.pct / 100) : 0;
  const wiCost = Math.max(0, Number(whatIf.cost) || 0);
  const wiNet = wiSave - wiCost;

  const badge = (id) => {
    if (id === 'ranking' && est.ok && top) return { text: `${fmt(ranked.total)}/mo` };
    if (id === 'setup') {
      const n = cats.filter((c) => c.name.trim()).length;
      return n ? { text: `${n} failures` } : null;
    }
    return null;
  };

  const noResult = (
    <Empty
      icon={BarChart3}
      title="No estimate yet"
      action={
        <div className="row" style={{ justifyContent: 'center' }}>
          <button className="btn primary" onClick={() => go('examples')}>
            <FlaskConical size={18} /> Load a worked example
          </button>
          <button className="btn ghost" onClick={() => go('setup')}>
            Describe your product
          </button>
        </div>
      }
    >
      Describe your product and list how it fails, or open a saved example.
    </Empty>
  );

  return (
    <Shell
      brand={{ name: 'Cost-of-Error Estimator', sub: 'Which AI failure to fix first', icon: BarChart3 }}
      sections={SECTIONS}
      section={section}
      go={go}
      badge={badge}
      provider={provider}
      keyMissing={keyMissing}
      mainRef={mainRef}
    >
      <Banners error={error} setError={setError} progress={busy ? 'Estimating a cost range for each failure' : ''} />

      {section === 'start' && (
        <section>
          <div className="hero">
            <div className="hero-text">
              <div className="kicker">For PMs deciding where guardrails go</div>
              <h1>Which AI failure should you fix first?</h1>
              <p>
                The failure you see most often is rarely the one costing most. List the ways your AI gets things wrong and roughly how often. You get a cost per incident, a
                monthly total for each, and a ranking that tells you where evaluation and guardrail work will pay back.
              </p>
              <div className="row">
                <button className="btn primary" onClick={() => go('examples')}>
                  <FlaskConical size={18} /> See a worked example
                </button>
                <button className="btn ghost" onClick={() => go('setup')}>
                  Estimate mine <ArrowRight size={18} />
                </button>
              </div>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <div className="hv-card" style={{ width: '92%', top: 14, left: 0, gap: 14 }}>
                {[92, 34, 22, 12].map((w, i) => (
                  <div key={i} className="row" style={{ flexWrap: 'nowrap' }}>
                    <span style={{ width: 22, fontWeight: 800, fontSize: 13, color: 'var(--p-700)' }}>{i + 1}</span>
                    <span className="hv-line" style={{ width: `${w}%`, height: 14, background: i === 0 ? 'var(--p-600)' : 'var(--p-200)' }} />
                  </div>
                ))}
              </div>
              <span className="hv-pill solid" style={{ bottom: 10, right: '4%' }}>
                <Target size={15} /> Fix this first
              </span>
            </div>
          </div>
          <Steps
            items={[
              { icon: Building2, t: 'Describe the product', d: 'Who uses it, what a customer is worth, what a support contact costs.' },
              { icon: ListChecks, t: 'List the failures', d: 'Each way the AI gets it wrong, and roughly how often a month.' },
              { icon: BarChart3, t: 'Read the ranking', d: 'Monthly cost per failure, biggest first, then test a fix.' },
            ]}
          />
          <div className="card soft">
            <h3 className="card-title">
              <Info size={18} /> Where the figures come from
            </h3>
            <IconList
              items={[
                { icon: Brain, text: <><b>Cost per incident</b> is a range estimated by a language model from the context you give. It is not pulled from your support or billing data.</> },
                { icon: Sigma, text: <><b>Monthly totals, ranking and savings</b> are plain arithmetic in your browser: frequency × cost, so you can change a frequency and see the effect at once.</> },
                { icon: Scale, text: <>Use it to <b>prioritise</b>, not as an audited number. The assumptions it made are listed under Ranking so you can check them.</> },
              ]}
            />
          </div>
        </section>
      )}

      {section === 'setup' && (
        <section>
          <SectionHead icon={SlidersHorizontal} kicker="Step 1" title="Your product">
            The more real numbers you give, the more grounded the estimate. Frequencies can be rough: an order of magnitude is enough to rank.
          </SectionHead>
          <div className="card">
            <ChipRow label="What kind of AI product?" options={productOpts} selected={product} onToggle={pickOne(setProduct)} onAdd={addOption(setProductOpts, setProduct, true)} single />
            <ChipRow label="Currency" options={CURRENCIES} selected={currency} onToggle={(v) => setCurrency([v])} single />
            <div className="field">
              <label className="field-label" htmlFor="ctx">
                <Building2 size={15} /> Business context
              </label>
              <textarea id="ctx" rows={3} value={context} onChange={(e) => setContext(e.target.value)} placeholder="Who uses it, how many, what they pay, team size, markets" />
            </div>
            <div className="two-col">
              <div className="field">
                <label className="field-label" htmlFor="cc">
                  <Receipt size={15} /> Cost of one human support contact <span className="field-hint">optional, {SYMBOL[cur]}</span>
                </label>
                <input id="cc" type="number" min="0" step="0.5" value={contactCost} onChange={(e) => setContactCost(e.target.value)} placeholder="e.g. 4.50" />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="cv">
                  <Users size={15} /> Yearly value of a customer <span className="field-hint">optional, {SYMBOL[cur]}</span>
                </label>
                <input id="cv" type="number" min="0" value={customerValue} onChange={(e) => setCustomerValue(e.target.value)} placeholder="e.g. 780" />
              </div>
            </div>
          </div>

          <h3 className="sub">
            <TriangleAlert size={18} /> How it gets things wrong
          </h3>
          <div className="rows" style={{ marginBottom: 14 }}>
            {cats.map((c, i) => (
              <div className="rowcard" key={i}>
                <span className="il-icon">{i + 1}</span>
                <div className="rowcard-body" style={{ gap: 10 }}>
                  <div className="cat-grid">
                    <input type="text" aria-label={`Failure ${i + 1} name`} value={c.name} onChange={(e) => setCat(i, { name: e.target.value })} placeholder="Name the failure, e.g. Wrong refund policy" />
                    <div className="freq">
                      <input type="number" min="0" aria-label={`Failure ${i + 1} per month`} value={c.frequency} onChange={(e) => setCat(i, { frequency: e.target.value })} placeholder="0" />
                      <span>a month</span>
                    </div>
                  </div>
                  <textarea rows={2} aria-label={`Failure ${i + 1} description`} value={c.description} onChange={(e) => setCat(i, { description: e.target.value })} placeholder="What happens, and what it leads to" />
                </div>
                <button className="icon-btn" aria-label={`Remove failure ${i + 1}`} onClick={() => removeCat(i)} disabled={cats.length === 1}>
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
          <button className="chip add" onClick={addCat} disabled={cats.length >= 8}>
            <Plus size={14} /> Add a failure {cats.length >= 8 && '(8 maximum)'}
          </button>

          <div className="run-bar">
            <span>{cats.filter((c) => c.name.trim()).length} failures listed</span>
            <div className="row">
              <button className="btn ghost small" onClick={clearAll}>
                <Eraser size={16} /> Clear
              </button>
              <button className="btn primary" onClick={run} disabled={busy}>
                {busy ? <Loader2 size={18} className="spin" /> : <Play size={18} />} Estimate the cost
              </button>
            </div>
          </div>
        </section>
      )}

      {section === 'ranking' && (
        <section>
          <SectionHead icon={BarChart3} kicker="Step 2" title="Ranking">
            Monthly cost of each failure at the middle of its range, biggest first. Change a frequency here and everything updates.
          </SectionHead>
          <SavedBanner title={saved} onClear={clearAll} />
          {!est.ok ? (
            noResult
          ) : (
            <>
              {stale && (
                <div className="alert" style={{ background: 'var(--warn-bg)', color: 'var(--warn)' }}>
                  <TriangleAlert size={18} />
                  <span>You added a failure since this estimate. Run it again from Your product to include it.</span>
                </div>
              )}
              {top && (
                <div className="verdict ok" style={{ borderLeftColor: 'var(--p-600)' }}>
                  <div className="verdict-icon" style={{ background: 'var(--p-100)', color: 'var(--p-700)' }}>
                    <Target size={30} />
                  </div>
                  <div>
                    <div className="verdict-top">
                      <h3>Fix first: {top.name}</h3>
                      <Pill cls="brand">{Math.round(top.share * 100)}% of the total</Pill>
                    </div>
                    <p className="verdict-line">
                      About {fmt(top.monthMid)} a month, from {top.freq} {top.freq === 1 ? "incident" : "incidents"} at {fmt(top.low)} to {fmt(top.high)} each.
                    </p>
                    <p>{est.summary}</p>
                  </div>
                </div>
              )}
              <div className="stats">
                <div className="stat">
                  <Coins size={18} />
                  <b>{fmt(ranked.total)}</b>
                  <span>a month, midpoint</span>
                </div>
                <div className="stat">
                  <Layers size={18} />
                  <b style={{ fontSize: 18 }}>
                    {fmt(ranked.totalLow)} to {fmt(ranked.totalHigh)}
                  </b>
                  <span>monthly range</span>
                </div>
                <div className="stat">
                  <CalendarDays size={18} />
                  <b>{fmt(ranked.total * 12)}</b>
                  <span>a year at this rate</span>
                </div>
                <div className="stat">
                  <Hash size={18} />
                  <b>{ranked.rows.reduce((s, r) => s + r.freq, 0).toLocaleString('en-GB')}</b>
                  <span>incidents a month</span>
                </div>
              </div>

              <div className="rows">
                {ranked.rows.map((r, k) => (
                  <div className={`rowcard ${k === 0 ? 'top' : ''}`} key={r.idx}>
                    <span className="il-icon big" style={k === 0 ? { background: 'var(--p-600)', color: '#fff' } : {}}>
                      {k + 1}
                    </span>
                    <div className="rowcard-body" style={{ gap: 8 }}>
                      <div className="row between">
                        <b style={{ fontSize: 16 }}>{r.name}</b>
                        <b style={{ fontSize: 18, color: 'var(--p-700)' }}>{fmt(r.monthMid)}/mo</b>
                      </div>
                      <div className="bar" title={`${fmt(r.monthLow)} to ${fmt(r.monthHigh)} a month`}>
                        <span className="bar-range" style={{ left: `${(r.monthLow / maxMid) * 100}%`, width: `${Math.max(0.5, ((r.monthHigh - r.monthLow) / maxMid) * 100)}%` }} />
                        <span className="bar-mid" style={{ width: `${(r.monthMid / maxMid) * 100}%` }} />
                      </div>
                      <div className="row small-text" style={{ color: 'var(--ink-2)', gap: 14 }}>
                        <span className="freq inline">
                          <input
                            type="number"
                            min="0"
                            aria-label={`${r.name} per month`}
                            value={cats[r.idx - 1].frequency}
                            onChange={(e) => setCat(r.idx - 1, { frequency: e.target.value })}
                          />
                          <span>a month ×</span>
                        </span>
                        <span>
                          {fmt(r.low)} to {fmt(r.high)} each
                        </span>
                        <span>{Math.round(r.share * 100)}% of total</span>
                        <Conf level={r.confidence} />
                      </div>
                      <div className="chips">
                        {r.drivers.map((d) => (
                          <span className="chip static" key={d}>
                            {d}
                          </span>
                        ))}
                      </div>
                      {r.rationale && <p>{r.rationale}</p>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="two-col" style={{ marginTop: 18 }}>
                <div className="card">
                  <h3 className="card-title">
                    <ListChecks size={18} /> Assumptions to check
                  </h3>
                  <ul className="checklist">
                    {est.assumptions.map((a, i) => (
                      <li key={i}>
                        <span className="box" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="card">
                  <h3 className="card-title">
                    <Eye size={18} /> Not in these figures
                  </h3>
                  <IconList tight items={est.watch.map((w) => ({ icon: TriangleAlert, text: w }))} />
                </div>
              </div>
              <button className="btn primary" onClick={() => go('whatif')}>
                <Calculator size={18} /> Test a fix
              </button>
            </>
          )}
        </section>
      )}

      {section === 'whatif' && (
        <section>
          <SectionHead icon={Calculator} title="What if we fix it?">
            Pick a failure, say what share of incidents a guardrail or eval would stop, and what it costs to run. Plain arithmetic, no AI.
          </SectionHead>
          <SavedBanner title={saved} />
          {!est.ok || !wiRow ? (
            noResult
          ) : (
            <>
              <div className="card">
                <ChipRow
                  label="Which failure?"
                  options={ranked.rows.map((r) => r.name)}
                  selected={[wiRow.name]}
                  onToggle={(name) => setWhatIf((w) => ({ ...w, idx: ranked.rows.find((r) => r.name === name).idx }))}
                  single
                />
                <div className="field">
                  <label className="field-label" htmlFor="pct">
                    <ShieldCheck size={15} /> Share of incidents the fix would stop <span className="field-hint">{whatIf.pct}%</span>
                  </label>
                  <input id="pct" type="range" min="0" max="100" step="5" value={whatIf.pct} onChange={(e) => setWhatIf((w) => ({ ...w, pct: Number(e.target.value) }))} />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="gc">
                    <Wand2 size={15} /> Monthly cost of running the fix <span className="field-hint">optional, {SYMBOL[cur]}: extra model calls, review time</span>
                  </label>
                  <input id="gc" type="number" min="0" value={whatIf.cost} onChange={(e) => setWhatIf((w) => ({ ...w, cost: e.target.value }))} placeholder="0" />
                </div>
              </div>
              <div className="stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="stat">
                  <PiggyBank size={18} />
                  <b>{fmt(wiSave)}</b>
                  <span>saved a month</span>
                </div>
                <div className={`stat ${wiNet < 0 ? 'bad' : 'ok'}`}>
                  <Scale size={18} />
                  <b>{fmt(wiNet)}</b>
                  <span>net, after running cost</span>
                </div>
                <div className="stat">
                  <CalendarDays size={18} />
                  <b>{fmt(wiNet * 12)}</b>
                  <span>net a year</span>
                </div>
              </div>
              <div className="card">
                <h3 className="card-title">
                  <BarChart3 size={18} /> Total monthly cost, before and after
                </h3>
                {[
                  ['Today', ranked.total],
                  ['With the fix', ranked.total - wiSave + wiCost],
                ].map(([label, v]) => (
                  <div className="meter" key={label}>
                    <div className="meter-top">
                      <span>{label}</span>
                      <span>{fmt(v)}</span>
                    </div>
                    <div className="meter-track">
                      <div className={`meter-fill ${label === 'Today' ? 'light' : ''}`} style={{ width: `${Math.min(100, (v / Math.max(1, ranked.total)) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {section === 'examples' && (
        <section>
          <SectionHead icon={FlaskConical} kicker="No key needed" title="Worked examples">
            Saved estimates you can open straight away. Load one, then try changing a frequency on the Ranking page.
          </SectionHead>
          <div className="examples">
            {EXAMPLES.map((ex) => {
              const er = rank(ex.categories, parseEstimate(ex.report).costs);
              return (
                <button className="example" key={ex.id} onClick={() => loadExample(ex)}>
                  <div className="example-top">
                    <span className="chip static">{ex.product}</span>
                    <Pill cls="brand" icon={Coins}>
                      {money(er.total, ex.currency)}/mo
                    </Pill>
                  </div>
                  <h3>{ex.title}</h3>
                  <p>{ex.blurb}</p>
                  <div className="example-foot">
                    <span>Fix first: {er.rows[0].name}</span>
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
            Where each figure comes from, and how far to trust it.
          </SectionHead>
          <MethodGrid
            items={[
              { icon: Brain, t: 'Cost per incident', d: 'A model estimates a low and high cost for one incident from your context: staff time, refunds or credits, repeat contacts, likely churn times customer value, and legal exposure only where it plausibly applies.' },
              { icon: Sigma, t: 'Monthly exposure', d: 'Frequency × the midpoint of the range, worked out in your browser. The range on each bar is frequency × low to frequency × high.' },
              { icon: BarChart3, t: 'Ranking', d: 'Sorted by monthly exposure at the midpoint. A rare, expensive failure can outrank a frequent, cheap one, which is usually the point.' },
              { icon: Calculator, t: 'What if', d: 'Saving = monthly exposure × the share of incidents stopped, minus the fix\'s running cost. No model involved.' },
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
                  { icon: Brain, text: 'Estimates come from the context you type, not real cost data. Check the listed assumptions against your own numbers.' },
                  { icon: Scale, text: 'Low-confidence costs (legal, regulatory) can swing by an order of magnitude. Treat them as a reason to look closer, not a forecast.' },
                  { icon: Eye, text: 'Brand damage and lost future sales are mostly outside the figures. They are flagged under "Not in these figures".' },
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
                  { icon: Info, text: 'Your inputs go once to the chosen model through this site\'s server function, then are discarded.' },
                  { icon: ShieldCheck, text: 'The prompt and the default key stay on the server. If you use your own key, it is sent for that request only.' },
                ]}
              />
            </div>
          </div>
        </section>
      )}

      {section === 'settings' && <SettingsPanel settings={settings} setSettings={setSettings} provider={provider} intro="The chosen model estimates the cost range for each failure. Everything else is arithmetic in your browser." />}
    </Shell>
  );
}
