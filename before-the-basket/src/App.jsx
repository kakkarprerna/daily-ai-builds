import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  ShoppingBasket, ScanLine, BookOpen, Info, Cpu, Tractor, Factory, CircleCheck,
  TriangleAlert, CircleHelp, Camera, Type, Plus, X, ArrowRight, Repeat, KeyRound,
  LoaderCircle, MapPin, History, Scale, ShieldCheck, Search, Utensils, Lock,
  Upload, Database, Sparkles, Tag, Target, Gauge, ListChecks, Ban, Eye,
} from 'lucide-react';
import { EXAMPLES } from './examples.js';
import { parseResult, band, BAND_LABEL } from './parse.js';

/* ---------- options ---------- */

const CATEGORIES = ['Fresh meat & poultry', 'Eggs', 'Dairy', 'Honey & spreads', 'Fruit & veg', 'Bread & bakery', 'Ready meal', 'Snack', 'Drink'];
const REGIONS = ['Spain', 'United Kingdom', 'Ireland', 'France', 'Germany', 'Italy', 'United States', 'India'];
const CLAIMS = ['Organic', 'Free-range', 'Outdoor bred', 'PDO / PGI', 'Grass-fed', 'Local', 'No added sugar', 'Red Tractor'];
const PRICES = ['Budget', 'Mid-range', 'Premium'];
const DIETARY = ['Fewer additives', 'Less sugar', 'Less salt', 'Animal welfare', 'Plant-forward', 'Higher protein', 'Halal', 'Gluten-free'];

const PROVIDERS = [
  { id: 'glimmer', name: 'Muse Glimmer', note: 'Free on this site. Reads typed ingredients.', model: 'Meta Muse Glimmer 30B', byok: false },
  { id: 'anthropic', name: 'Anthropic', note: 'Your key. Reads label photos too.', model: 'claude-sonnet-5', byok: true },
  { id: 'openai', name: 'OpenAI', note: 'Your key. Reads label photos too.', model: 'gpt-5-mini', byok: true },
  { id: 'gemini', name: 'Gemini', note: 'Your key. Reads label photos too.', model: 'gemini-2.5-flash', byok: true },
];

const SECTIONS = [
  { id: 'check', label: 'Check a product', desc: 'Score something before it goes in the basket', icon: ScanLine },
  { id: 'examples', label: 'Worked examples', desc: 'Three products already scored, no key needed', icon: BookOpen },
  { id: 'how', label: 'How it works', desc: 'What the scores mean and where they come from', icon: Info },
  { id: 'model', label: 'Model', desc: 'Free by default, or bring your own key', icon: Cpu },
];

const EMPTY_FORM = {
  product: '', category: '', region: 'Spain', origin: '', price: '',
  claims: [], dietary: [], mode: 'text', ingredients: '',
};

/* ---------- small pieces ---------- */

function ChipRow({ label, hint, icon: Icon, options, value, onChange, multi = false }) {
  const [extra, setExtra] = useState([]);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const selected = multi ? value : [value].filter(Boolean);
  const all = [...options, ...extra, ...selected.filter((s) => !options.includes(s) && !extra.includes(s))];

  const toggle = (opt) => {
    if (multi) onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
    else onChange(value === opt ? '' : opt);
  };
  const commit = () => {
    const v = draft.trim();
    if (v) {
      if (!all.includes(v)) setExtra((e) => [...e, v]);
      if (!selected.includes(v)) toggle(v);
    }
    setDraft('');
    setAdding(false);
  };

  return (
    <div className="field">
      <div className="field-label">
        {Icon && <Icon size={16} />}
        <span>{label}</span>
        {hint && <em>{hint}</em>}
      </div>
      <div className="chips">
        {all.map((opt) => (
          <button type="button" key={opt} className={`chip ${selected.includes(opt) ? 'on' : ''}`} onClick={() => toggle(opt)}>
            {selected.includes(opt) && <CircleCheck size={14} />}
            {opt}
          </button>
        ))}
        {adding ? (
          <span className="chip-add-input">
            <input
              autoFocus
              value={draft}
              placeholder="Type and press Enter"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); commit(); }
                if (e.key === 'Escape') { setAdding(false); setDraft(''); }
              }}
              onBlur={commit}
            />
          </span>
        ) : (
          <button type="button" className="chip chip-add" onClick={() => setAdding(true)}>
            <Plus size={14} /> Add your own
          </button>
        )}
      </div>
    </div>
  );
}

function Ring({ score }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const b = band(score);
  return (
    <div className={`ring ring-${b}`}>
      <svg viewBox="0 0 128 128" aria-hidden="true">
        <circle cx="64" cy="64" r={r} className="ring-track" />
        <circle cx="64" cy="64" r={r} className="ring-value" strokeDasharray={c} strokeDashoffset={c * (1 - (score || 0) / 100)} />
      </svg>
      <div className="ring-text">
        <strong>{score ?? '?'}</strong>
        <span>of 100</span>
      </div>
    </div>
  );
}

function ScoreBar({ icon: Icon, title, sub, score, why }) {
  const b = band(score);
  return (
    <div className="card score-card">
      <div className="score-head">
        <span className="icon-tile"><Icon size={20} /></span>
        <div>
          <h4>{title}</h4>
          <p>{sub}</p>
        </div>
        <span className={`score-num t-${b}`}>{score}</span>
      </div>
      <div className="bar"><span className={`bar-fill f-${b}`} style={{ width: `${score}%` }} /></div>
      <p className="why">{why}</p>
    </div>
  );
}

function SignalList({ items, kind }) {
  if (!items.length) return null;
  const meta = {
    good: { icon: CircleCheck, title: 'In its favour' },
    concern: { icon: TriangleAlert, title: 'Worth worrying about' },
    unknown: { icon: CircleHelp, title: 'Would change the score' },
  }[kind];
  const Icon = meta.icon;
  return (
    <div className={`card signal signal-${kind}`}>
      <h4><Icon size={18} /> {meta.title}</h4>
      <ul>
        {items.map((t, i) => (
          <li key={i}><span className="dot"><Icon size={14} /></span><span>{t}</span></li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- result ---------- */

function Result({ result, input, source }) {
  if (!result.readable) {
    return (
      <div className="card result-unreadable">
        <Camera size={22} />
        <div>
          <h3>The label was hard to read</h3>
          <p>{result.verdict || 'Try a closer, flatter photo in good light, or type the ingredients instead.'}</p>
        </div>
      </div>
    );
  }
  const b = band(result.overall);
  const marker = Math.max(3, Math.min(97, result.overall ?? 50));

  return (
    <div className="result">
      <div className="card hero">
        <Ring score={result.overall} />
        <div className="hero-body">
          <div className="hero-tags">
            <span className={`pill pill-${b}`}>{BAND_LABEL[b]}</span>
            <span className="pill pill-soft"><Eye size={13} /> {result.certainty.charAt(0).toUpperCase() + result.certainty.slice(1)} certainty</span>
            {input?.region && <span className="pill pill-soft"><MapPin size={13} /> {input.region}</span>}
          </div>
          <h3>{result.product || input?.product}</h3>
          <p className="verdict">{result.verdict}</p>
          {result.certaintyWhy && <p className="muted small">{result.certaintyWhy}</p>}
        </div>
      </div>

      <div className="two">
        <ScoreBar icon={Tractor} title="Production" sub="How it was farmed or sourced" score={result.production} why={result.productionWhy} />
        <ScoreBar icon={Factory} title="Processing" sub="What happened between farm and pack" score={result.processing} why={result.processingWhy} />
      </div>

      <div className="card yardstick">
        <h4><Scale size={18} /> Against the regional yardstick</h4>
        <div className="scale">
          <div className="scale-track"><span className="scale-marker" style={{ left: `${marker}%` }}><ShoppingBasket size={14} /></span></div>
          <div className="scale-ends"><span>Worst common practice</span><span>Best practice today</span></div>
        </div>
        <div className="ends">
          <div className="end end-worst"><Ban size={16} /><p>{result.worst}</p></div>
          <div className="end end-best"><ShieldCheck size={16} /><p>{result.best}</p></div>
        </div>
        {result.placement && <p className="placement"><Target size={16} /> {result.placement}</p>}
        {result.thenNow && <p className="then-now"><History size={16} /> {result.thenNow}</p>}
      </div>

      <div className="three">
        <SignalList items={result.good} kind="good" />
        <SignalList items={result.concerns} kind="concern" />
        <SignalList items={result.unknowns} kind="unknown" />
      </div>

      {result.ingredients.length > 0 && (
        <div className="card">
          <h4><ListChecks size={18} /> Ingredients worth a comment</h4>
          <div className="ing-list">
            {result.ingredients.map((ing, i) => (
              <div className="ing" key={i}>
                <span className={`ing-status s-${ing.status}`}>{ing.status}</span>
                <div><strong>{ing.name}</strong><p>{ing.note}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="two">
        {result.checks.length > 0 && (
          <div className="card">
            <h4><Search size={18} /> Check before you buy</h4>
            <ol className="steps">
              {result.checks.map((c, i) => (<li key={i}><span className="step-num">{i + 1}</span><span>{c}</span></li>))}
            </ol>
          </div>
        )}
        {result.dietary.length > 0 && (
          <div className="card">
            <h4><Utensils size={18} /> Your dietary focus</h4>
            <div className="diet-list">
              {result.dietary.map((d, i) => (
                <div className="diet" key={i}><span className="pill pill-soft">{d.focus}</span><p>{d.note}</p></div>
              ))}
            </div>
          </div>
        )}
      </div>

      {result.swap && (
        <div className="card swap">
          <span className="icon-tile light"><Repeat size={20} /></span>
          <div><h4>A better thing to look for</h4><p>{result.swap}</p></div>
        </div>
      )}

      <p className="source-note">
        <Database size={14} />
        {source}. Scores are a model's judgement from general knowledge of farming and food rules in {input?.region || 'the region'}, not a lab test of this pack. Always read the pack yourself for allergens.
      </p>
    </div>
  );
}

/* ---------- photo helper ---------- */

function shrinkImage(file, maxSide = 1400) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      URL.revokeObjectURL(url);
      resolve({ preview: dataUrl, data: dataUrl.split(',')[1], mediaType: 'image/jpeg' });
    };
    img.onerror = () => reject(new Error('That file could not be opened as an image.'));
    img.src = url;
  });
}

/* ---------- pages ---------- */

function CheckPage({ form, setForm, onRun, loading, error, outcome, image, setImage, provider }) {
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const fileRef = useRef(null);
  const resultRef = useRef(null);

  useEffect(() => {
    if (outcome && resultRef.current) resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [outcome]);

  const canRun = form.product.trim() && (form.mode === 'photo' ? image : form.ingredients.trim());

  return (
    <div className="page">
      <header className="page-head">
        <span className="eyebrow"><Sparkles size={14} /> Daily AI build</span>
        <h1>Before the Basket</h1>
        <p>Two scores for anything you are about to buy: how it was produced, and how it was processed, measured against the best and worst practice where you live.</p>
      </header>

      <div className="how-strip">
        <div><span className="icon-tile light"><Tag size={18} /></span><p><strong>Describe it</strong>Name, label and where you are</p></div>
        <ArrowRight size={18} className="strip-arrow" />
        <div><span className="icon-tile light"><Scale size={18} /></span><p><strong>It gets judged</strong>Against local best and worst</p></div>
        <ArrowRight size={18} className="strip-arrow" />
        <div><span className="icon-tile light"><Gauge size={18} /></span><p><strong>You decide</strong>Scores, checks and a better swap</p></div>
      </div>

      <form className="card form" onSubmit={(e) => { e.preventDefault(); if (canRun && !loading) onRun(); }}>
        <div className="field">
          <label className="field-label" htmlFor="product"><ShoppingBasket size={16} /><span>What are you buying?</span></label>
          <input id="product" className="text" placeholder="e.g. Free-range eggs, dozen, supermarket own label" value={form.product} onChange={(e) => set('product')(e.target.value)} />
        </div>

        <ChipRow label="Kind of product" icon={Tag} options={CATEGORIES} value={form.category} onChange={set('category')} />
        <ChipRow label="Where you will eat it" hint="sets the yardstick" icon={MapPin} options={REGIONS} value={form.region} onChange={set('region')} />

        <div className="split">
          <div className="field">
            <label className="field-label" htmlFor="origin"><MapPin size={16} /><span>Origin on the pack</span><em>optional</em></label>
            <input id="origin" className="text" placeholder="e.g. Product of Spain, or a blend of countries" value={form.origin} onChange={(e) => set('origin')(e.target.value)} />
          </div>
          <ChipRow label="Price tier" hint="optional" options={PRICES} value={form.price} onChange={set('price')} />
        </div>

        <ChipRow label="Claims or marks on the pack" hint="pick any" icon={ShieldCheck} options={CLAIMS} value={form.claims} onChange={set('claims')} multi />

        <div className="field">
          <div className="field-label"><ListChecks size={16} /><span>The label</span></div>
          <div className="seg">
            <button type="button" className={form.mode === 'text' ? 'on' : ''} onClick={() => set('mode')('text')}><Type size={15} /> Type ingredients</button>
            <button type="button" className={form.mode === 'photo' ? 'on' : ''} onClick={() => set('mode')('photo')}><Camera size={15} /> Photo of label</button>
          </div>
          {form.mode === 'text' ? (
            <textarea className="text" rows={4} placeholder="Copy the ingredient list as printed, in any language" value={form.ingredients} onChange={(e) => set('ingredients')(e.target.value)} />
          ) : (
            <div className="photo">
              {image ? (
                <div className="photo-preview">
                  <img src={image.preview} alt="Label to be checked" />
                  <button type="button" className="icon-btn" onClick={() => setImage(null)} aria-label="Remove photo"><X size={16} /></button>
                </div>
              ) : (
                <button type="button" className="drop" onClick={() => fileRef.current?.click()}>
                  <Upload size={22} />
                  <strong>Add a photo of the ingredients</strong>
                  <span>Flat, close and in good light works best</span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) setImage(await shrinkImage(f));
                  e.target.value = '';
                }}
              />
              {provider === 'glimmer' && (
                <p className="note"><Info size={14} /> The free model reads text only. For photos, switch to your own key under Model.</p>
              )}
            </div>
          )}
        </div>

        <ChipRow label="Dietary focus" hint="optional, pick any" icon={Utensils} options={DIETARY} value={form.dietary} onChange={set('dietary')} multi />

        <div className="form-foot">
          <button type="submit" className="btn-primary" disabled={!canRun || loading}>
            {loading ? <><LoaderCircle size={18} className="spin" /> Judging…</> : <>Score it <ArrowRight size={18} /></>}
          </button>
          <span className="muted small"><Lock size={13} /> Nothing is saved. No sign-in.</span>
        </div>
        {error && <div className="error"><TriangleAlert size={16} /> {error}</div>}
      </form>

      <div ref={resultRef}>
        {outcome && <Result result={outcome.result} input={outcome.input} source={outcome.source} />}
      </div>
    </div>
  );
}

function ExamplesPage({ onOpen }) {
  return (
    <div className="page">
      <header className="page-head">
        <span className="eyebrow"><BookOpen size={14} /> Worked examples</span>
        <h1>Three products, already scored</h1>
        <p>Each one shows a different reason a product can lose points. Open one to see the full result.</p>
      </header>
      <div className="ex-grid">
        {EXAMPLES.map((ex) => {
          const r = parseResult(ex.saved);
          const b = band(r.overall);
          return (
            <button key={ex.id} className="card ex-card" onClick={() => onOpen(ex)}>
              <div className="ex-top">
                <span className="pill pill-soft"><MapPin size={13} /> {ex.region}</span>
                <span className={`ex-score t-${b}`}>{r.overall}</span>
              </div>
              <h3>{ex.title}</h3>
              <p>{ex.blurb}</p>
              <div className="ex-bars">
                <div><Tractor size={14} /><span className="mini"><i className={`f-${band(r.production)}`} style={{ width: `${r.production}%` }} /></span><b>{r.production}</b></div>
                <div><Factory size={14} /><span className="mini"><i className={`f-${band(r.processing)}`} style={{ width: `${r.processing}%` }} /></span><b>{r.processing}</b></div>
              </div>
              <div className="ex-foot"><span className="pill pill-olive">{ex.tag}</span><span className="open">Open <ArrowRight size={15} /></span></div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function HowPage() {
  return (
    <div className="page">
      <header className="page-head">
        <span className="eyebrow"><Info size={14} /> How it works</span>
        <h1>What the scores mean</h1>
        <p>Food production has changed a lot in a few decades. This tool asks one question: compared with how this is made well, and badly, where you live, where does this product sit?</p>
      </header>

      <div className="how-grid">
        <div className="card how-card"><span className="icon-tile"><Tractor size={20} /></span><h4>Production</h4><p>How the raw ingredients were farmed or raised. Animal welfare, breed, feed, sprays, origin and how easy it is to trace.</p></div>
        <div className="card how-card"><span className="icon-tile"><Factory size={20} /></span><h4>Processing</h4><p>What happened after the farm. Additives and whether your region allows them, added sugar or water, heating and filtering.</p></div>
        <div className="card how-card"><span className="icon-tile"><Gauge size={20} /></span><h4>Overall</h4><p>How comfortable a careful shopper could be. It leans on whichever side matters more for that product.</p></div>
      </div>

      <div className="card">
        <h4><Scale size={18} /> Reading a score</h4>
        <div className="bands">
          <div><span className="band-sw f-good" /> <strong>70 and above</strong> Buy with confidence</div>
          <div><span className="band-sw f-mid" /> <strong>45 to 69</strong> Buy with care</div>
          <div><span className="band-sw f-low" /> <strong>Below 45</strong> Think twice</div>
        </div>
      </div>

      <div className="two">
        <div className="card">
          <h4><Database size={18} /> Where the judgement comes from</h4>
          <ul className="icon-list">
            <li><Cpu size={16} /><span>An AI model's general knowledge of farming practice and food rules in the region you pick.</span></li>
            <li><Tag size={16} /><span>What you type or photograph from the pack. Nothing is looked up about the brand.</span></li>
            <li><BookOpen size={16} /><span>The worked examples were written by a model and checked by hand against public rules.</span></li>
          </ul>
        </div>
        <div className="card">
          <h4><TriangleAlert size={18} /> What it cannot do</h4>
          <ul className="icon-list">
            <li><Ban size={16} /><span>Test a real pack. Fraud like syrup in honey only shows up in a laboratory.</span></li>
            <li><Ban size={16} /><span>Give medical or nutrition advice. Always read allergens on the pack itself.</span></li>
            <li><Ban size={16} /><span>Know every local farm. Certainty drops when the label says little.</span></li>
          </ul>
        </div>
      </div>

      <div className="card privacy">
        <span className="icon-tile light"><Lock size={20} /></span>
        <div><h4>Private by design</h4><p>No sign-in and no storage. A check is sent once to the model you chose and forgotten. If you paste your own key, it stays in this browser tab and is passed along for that request only.</p></div>
      </div>
    </div>
  );
}

function ModelPage({ settings, setSettings }) {
  const cur = PROVIDERS.find((p) => p.id === settings.provider);
  return (
    <div className="page">
      <header className="page-head">
        <span className="eyebrow"><Cpu size={14} /> Model</span>
        <h1>Choose who does the judging</h1>
        <p>The free model works straight away for typed ingredients. Bring your own key to use another provider or to read label photos.</p>
      </header>
      <div className="prov-grid">
        {PROVIDERS.map((p) => (
          <button key={p.id} className={`card prov ${settings.provider === p.id ? 'on' : ''}`} onClick={() => setSettings((s) => ({ ...s, provider: p.id }))}>
            <div className="prov-top"><span className="icon-tile light">{p.byok ? <KeyRound size={18} /> : <Sparkles size={18} />}</span>{settings.provider === p.id && <CircleCheck size={20} className="prov-check" />}</div>
            <h4>{p.name}</h4>
            <p>{p.note}</p>
          </button>
        ))}
      </div>
      {cur.byok && (
        <div className="card form">
          <div className="field">
            <label className="field-label" htmlFor="key"><KeyRound size={16} /><span>{cur.name} API key</span></label>
            <input id="key" className="text" type="password" autoComplete="off" placeholder="Paste your key" value={settings.keys[cur.id] || ''} onChange={(e) => setSettings((s) => ({ ...s, keys: { ...s.keys, [cur.id]: e.target.value } }))} />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="model"><Cpu size={16} /><span>Model name</span><em>optional</em></label>
            <input id="model" className="text" placeholder={cur.model} value={settings.models[cur.id] || ''} onChange={(e) => setSettings((s) => ({ ...s, models: { ...s.models, [cur.id]: e.target.value } }))} />
          </div>
          <p className="note"><Lock size={14} /> The key lives only in this tab's memory. Close the tab and it is gone.</p>
        </div>
      )}
    </div>
  );
}

/* ---------- app ---------- */

export default function App() {
  const [section, setSection] = useState('check');
  const [form, setForm] = useState(EMPTY_FORM);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [outcome, setOutcome] = useState(null);
  const [settings, setSettings] = useState({ provider: 'glimmer', keys: {}, models: {} });
  const mainRef = useRef(null);

  const provider = useMemo(() => PROVIDERS.find((p) => p.id === settings.provider), [settings.provider]);

  const go = (id) => {
    setSection(id);
    mainRef.current?.scrollTo({ top: 0 });
  };

  const openExample = (ex) => {
    setForm({ ...EMPTY_FORM, ...ex.input });
    setImage(null);
    setError('');
    setOutcome({ result: parseResult(ex.saved), input: ex.input, source: 'Saved worked example' });
    go('check');
  };

  const run = async () => {
    setLoading(true);
    setError('');
    setOutcome(null);
    const input = { ...form };
    try {
      const body = { ...input, provider: settings.provider };
      if (form.mode === 'photo' && image) body.image = { data: image.data, mediaType: image.mediaType };
      if (provider.byok) {
        body.apiKey = settings.keys[provider.id] || '';
        body.model = settings.models[provider.id] || '';
      }
      const r = await fetch('/api/analyse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => null);
      if (!j) throw new Error('Could not reach the checking service. Live checks run on the deployed site.');
      if (!r.ok) throw new Error(j.error || 'Something went wrong.');
      const result = parseResult(j.text);
      if (!result.ok) throw new Error('The model answered in a shape this page could not read. Try again, or pick another model.');
      const modelName = provider.byok ? settings.models[provider.id] || provider.model : provider.model;
      setOutcome({ result, input, source: `Judged live by ${modelName}` });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark"><ShoppingBasket size={20} /></span>
          <div><strong>Before the Basket</strong><span>Trust score for your shopping</span></div>
        </div>
        <nav>
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <button key={s.id} className={`nav ${section === s.id ? 'on' : ''}`} onClick={() => go(s.id)}>
                <Icon size={18} />
                <span><strong>{s.label}</strong><em>{s.desc}</em></span>
              </button>
            );
          })}
        </nav>
        <button className="side-model" onClick={() => go('model')}>
          <span className="icon-tile light small">{provider.byok ? <KeyRound size={15} /> : <Sparkles size={15} />}</span>
          <span><em>Judging with</em><strong>{provider.name}</strong></span>
        </button>
      </aside>

      <main className="main" ref={mainRef}>
        {section === 'check' && (
          <CheckPage form={form} setForm={setForm} onRun={run} loading={loading} error={error} outcome={outcome} image={image} setImage={setImage} provider={settings.provider} />
        )}
        {section === 'examples' && <ExamplesPage onOpen={openExample} />}
        {section === 'how' && <HowPage />}
        {section === 'model' && <ModelPage settings={settings} setSettings={setSettings} />}
      </main>
    </div>
  );
}
