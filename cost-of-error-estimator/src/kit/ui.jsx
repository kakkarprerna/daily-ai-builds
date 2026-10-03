// Shared building blocks for the daily AI builds: fixed sidebar shell,
// section headers, chip rows with "add your own", status pills, a band
// gauge and the Model & key panel.
import { useState } from 'react';
import { Check, Plus, Cpu, KeyRound, Lock, Info, TriangleAlert, X, Loader2, Settings2 } from 'lucide-react';

export const PROVIDERS = [
  { id: 'glimmer', name: 'Muse Glimmer', note: 'Default, free to use here', needsKey: false },
  { id: 'anthropic', name: 'Anthropic', note: 'Your own key', needsKey: true, model: 'claude-sonnet-5-5' },
  { id: 'openai', name: 'OpenAI', note: 'Your own key', needsKey: true, model: 'gpt-5-mini' },
  { id: 'gemini', name: 'Gemini', note: 'Your own key', needsKey: true, model: 'gemini-2.5-flash' },
];

export function useSettings() {
  const [settings, setSettings] = useState({ provider: 'glimmer', model: '', key: '' });
  const provider = PROVIDERS.find((p) => p.id === settings.provider);
  const keyMissing = provider.needsKey && settings.key.trim().length < 10;
  return { settings, setSettings, provider, keyMissing };
}

export function Shell({ brand, sections, section, go, badge, provider, keyMissing, mainRef, children }) {
  const BrandIcon = brand.icon;
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <BrandIcon size={20} />
          </div>
          <div>
            <div className="brand-name">{brand.name}</div>
            <div className="brand-sub">{brand.sub}</div>
          </div>
        </div>
        <nav className="nav">
          {sections.map((s) => {
            const Icon = s.icon;
            const b = badge ? badge(s.id) : null;
            return (
              <button key={s.id} className={`nav-item ${section === s.id ? 'active' : ''}`} onClick={() => go(s.id)}>
                <span className="nav-icon">
                  <Icon size={18} />
                </span>
                <span className="nav-text">
                  <span className="nav-title">
                    {s.title}
                    {b && <span className={`nav-badge ${b.cls || ''}`}>{b.text}</span>}
                  </span>
                  <span className="nav-desc">{s.desc}</span>
                </span>
              </button>
            );
          })}
        </nav>
        <button className="model-chip" onClick={() => go('settings')}>
          <Cpu size={16} />
          <span>
            <span className="model-chip-label">Model</span>
            <span className="model-chip-name">{provider.name}</span>
          </span>
          {keyMissing && <span className="dot-warn" title="Key needed" />}
        </button>
      </aside>
      <main className="main" ref={mainRef}>
        <div className="content">{children}</div>
      </main>
    </div>
  );
}

export function Banners({ error, setError, progress }) {
  return (
    <>
      {error && (
        <div className="alert" role="alert">
          <TriangleAlert size={18} />
          <span>{error}</span>
          <button aria-label="Dismiss" onClick={() => setError('')}>
            <X size={16} />
          </button>
        </div>
      )}
      {progress && (
        <div className="progress" role="status">
          <Loader2 size={18} className="spin" />
          {progress}
        </div>
      )}
    </>
  );
}

export function SectionHead({ icon: Icon, kicker, title, children }) {
  return (
    <header className="section-head">
      <div className="section-icon">
        <Icon size={22} />
      </div>
      <div>
        {kicker && <div className="kicker">{kicker}</div>}
        <h2>{title}</h2>
        {children && <p className="lede">{children}</p>}
      </div>
    </header>
  );
}

export function Empty({ icon: Icon, title, children, action }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon size={26} />
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}

export function ChipRow({ label, options, selected, onToggle, onAdd, hint, single }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const commit = () => {
    const v = draft.trim();
    if (v) onAdd(v);
    setDraft('');
    setAdding(false);
  };
  return (
    <div className="field">
      <div className="field-label">
        {label}
        {hint && <span className="field-hint">{hint}</span>}
      </div>
      <div className="chips" role={single ? 'radiogroup' : 'group'}>
        {options.map((o) => (
          <button key={o} type="button" className={`chip ${selected.includes(o) ? 'on' : ''}`} onClick={() => onToggle(o)} aria-pressed={selected.includes(o)}>
            {selected.includes(o) && <Check size={14} />}
            {o}
          </button>
        ))}
        {onAdd &&
          (adding ? (
            <span className="chip-input">
              <input
                autoFocus
                value={draft}
                placeholder="Type and press Enter"
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commit();
                  if (e.key === 'Escape') setAdding(false);
                }}
                onBlur={commit}
              />
            </span>
          ) : (
            <button type="button" className="chip add" onClick={() => setAdding(true)}>
              <Plus size={14} /> Add your own
            </button>
          ))}
      </div>
    </div>
  );
}

// Chip state helpers: multi-select toggle, single-select, and add-your-own.
export const toggleIn = (setter) => (v) => setter((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]));
export const pickOne = (setter) => (v) => setter((cur) => (cur.includes(v) ? [] : [v]));
export const addOption = (setOpts, setSel, single) => (v) => {
  setOpts((cur) => (cur.includes(v) ? cur : [...cur, v]));
  setSel((cur) => (single ? [v] : cur.includes(v) ? cur : [...cur, v]));
};

export function Pill({ cls = 'quiet', icon: Icon, children }) {
  return (
    <span className={`pill ${cls}`}>
      {Icon && <Icon size={13} />} {children}
    </span>
  );
}

export function Conf({ level }) {
  const n = { High: 3, Medium: 2, Low: 1 }[level] || 0;
  if (!n) return null;
  return (
    <span className="conf" title={`${level} confidence`}>
      {[1, 2, 3].map((i) => (
        <i key={i} className={i <= n ? 'on' : ''} />
      ))}
      {level} confidence
    </span>
  );
}

// Semicircle gauge. bands: [{ from, to, cls: 'ok' | 'warn' | 'bad' }]
export function Gauge({ score, bands, caption }) {
  const R = 80;
  const CX = 100;
  const CY = 100;
  const L = Math.PI * R;
  const s = score == null ? 0 : Math.max(0, Math.min(100, score));
  const a = (s / 100) * Math.PI;
  const tipX = CX - 66 * Math.cos(a);
  const tipY = CY - 66 * Math.sin(a);
  return (
    <div className="gauge">
      <svg viewBox="0 0 200 118" role="img" aria-label={`${caption}: ${score ?? 'no score'} out of 100`}>
        {bands.map((b) => (
          <path
            key={b.from}
            d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
            fill="none"
            className={`gauge-band ${b.cls}`}
            strokeWidth="16"
            strokeDasharray={`${((b.to - b.from) / 100) * L} ${L}`}
            strokeDashoffset={-((b.from / 100) * L)}
            opacity={score == null ? 0.25 : 0.9}
          />
        ))}
        {score != null && (
          <>
            <line x1={CX} y1={CY} x2={tipX} y2={tipY} className="gauge-needle" strokeWidth="4" strokeLinecap="round" />
            <circle cx={CX} cy={CY} r="7" className="gauge-hub" />
          </>
        )}
      </svg>
      <div className="gauge-num">{score ?? 'n/a'}</div>
      <div className="gauge-cap">{caption}</div>
    </div>
  );
}

export function MethodGrid({ items }) {
  return (
    <div className="method">
      {items.map((m) => (
        <div className="method-step" key={m.t}>
          <span className="il-icon big">
            <m.icon size={20} />
          </span>
          <div>
            <h3>{m.t}</h3>
            <p>{m.d}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function IconList({ items, tight }) {
  return (
    <ul className={`icon-list ${tight ? 'tight' : ''}`}>
      {items.map((it, i) => (
        <li key={i}>
          <span className="il-icon">
            <it.icon size={16} />
          </span>
          <span>{it.text}</span>
        </li>
      ))}
    </ul>
  );
}

export function Steps({ items }) {
  return (
    <div className="steps">
      {items.map((s, i) => (
        <div className="step" key={s.t}>
          <div className="step-num">{i + 1}</div>
          <s.icon size={22} className="step-icon" />
          <h3>{s.t}</h3>
          <p>{s.d}</p>
        </div>
      ))}
    </div>
  );
}

export function SettingsPanel({ settings, setSettings, provider, intro }) {
  return (
    <section>
      <SectionHead icon={Settings2} title="Model & key">
        {intro}
      </SectionHead>
      <div className="providers">
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            className={`provider ${settings.provider === p.id ? 'on' : ''}`}
            onClick={() => setSettings((s) => ({ ...s, provider: p.id, model: p.model || '' }))}
          >
            <span className="provider-icon">{settings.provider === p.id ? <Check size={18} /> : <Cpu size={18} />}</span>
            <b>{p.name}</b>
            <span>{p.note}</span>
          </button>
        ))}
      </div>
      {provider.needsKey ? (
        <div className="card">
          <div className="field">
            <label className="field-label" htmlFor="key">
              <KeyRound size={15} /> {provider.name} API key
            </label>
            <input
              id="key"
              type="password"
              autoComplete="off"
              value={settings.key}
              placeholder="Paste your key"
              onChange={(e) => setSettings((s) => ({ ...s, key: e.target.value }))}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="model">
              Model name
            </label>
            <input id="model" value={settings.model} onChange={(e) => setSettings((s) => ({ ...s, model: e.target.value }))} />
            <span className="muted small-text">Change this if your account uses a different model.</span>
          </div>
          <p className="note">
            <Lock size={15} /> Kept in this tab only. Sent with each request through this site's server function to {provider.name}, never stored or logged.
          </p>
        </div>
      ) : (
        <div className="card soft">
          <p className="note">
            <Info size={15} /> Runs on Meta's Muse Glimmer through NVIDIA's free endpoint, on this site's own key. No key needed from you. If it is busy, switch to a provider above with your own key.
          </p>
        </div>
      )}
    </section>
  );
}

export function SavedBanner({ title, onClear }) {
  if (!title) return null;
  return (
    <div className="saved-banner">
      <Info size={16} />
      <span>
        Showing the saved worked example <b>{title}</b>. Nothing was sent to a model.
      </span>
      {onClear && (
        <button className="link-inline" onClick={onClear}>
          Start fresh
        </button>
      )}
    </div>
  );
}
