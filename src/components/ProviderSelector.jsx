import { IconKey, IconSparkle } from '../icons.jsx'

const PROVIDERS = [
  { id: 'muse', label: 'Muse Glimmer', needsKey: false },
  { id: 'anthropic', label: 'Anthropic', needsKey: true },
  { id: 'openai', label: 'OpenAI', needsKey: true },
  { id: 'gemini', label: 'Gemini', needsKey: true },
]

export default function ProviderSelector({ provider, apiKey, onProviderChange, onApiKeyChange }) {
  const active = PROVIDERS.find((p) => p.id === provider) || PROVIDERS[0]

  return (
    <div className="field">
      <div className="field-label">
        <IconSparkle width={16} height={16} />
        <span>Model provider</span>
      </div>
      <div className="chip-row">
        {PROVIDERS.map((p) => (
          <button
            type="button"
            key={p.id}
            className={`chip ${provider === p.id ? 'chip-active' : ''}`}
            onClick={() => onProviderChange(p.id)}
          >
            {p.label}
            {!p.needsKey && <span className="chip-tag">free</span>}
          </button>
        ))}
      </div>

      {active.needsKey && (
        <div className="key-input-row">
          <IconKey width={16} height={16} />
          <input
            type="password"
            className="key-input"
            placeholder={`Your ${active.label} API key`}
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
          />
        </div>
      )}
      <div className="provider-hint">
        {active.needsKey
          ? `Sent straight through to ${active.label} for this request only — never stored.`
          : 'Runs on the free Muse Glimmer demo, no key needed from you.'}
      </div>
    </div>
  )
}
