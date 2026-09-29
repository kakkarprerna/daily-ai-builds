import { useState } from 'react'
import { Lock, Loader2, Sparkles } from 'lucide-react'
import ResultCard from './ResultCard.jsx'
import ResourceFooter from './ResourceFooter.jsx'
import CommunicationResources from './CommunicationResources.jsx'
import { parseResult } from '../lib/parseResult.js'

const AGE_BANDS = ['Under 8', '8 to 12', '13 to 15', '16 to 18']
const FOUND_OUT = ['Saw their screen or device', 'They told you themselves', 'A friend, teacher or another parent mentioned it', 'Not sure yet']
const WORRY = ['Physical safety', 'Emotional wellbeing', 'Who they are trusting', 'Not sure yet']

const PROVIDERS = [
  { id: 'muse', label: 'Free, built in', needsKey: false },
  { id: 'anthropic', label: 'Anthropic (your key)', needsKey: true },
  { id: 'openai', label: 'OpenAI (your key)', needsKey: true },
  { id: 'gemini', label: 'Gemini (your key)', needsKey: true },
]

export default function CheckPage() {
  const [situation, setSituation] = useState('')
  const [age, setAge] = useState('')
  const [foundOut, setFoundOut] = useState('')
  const [worry, setWorry] = useState('')
  const [provider, setProvider] = useState('muse')
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const activeProvider = PROVIDERS.find((p) => p.id === provider)
  const canSubmit = situation.trim().length > 15 && age && (!activeProvider.needsKey || apiKey.trim().length > 0)

  async function handleSubmit() {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation, age, foundOut, worry, provider, apiKey: activeProvider.needsKey ? apiKey : undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong on that read.')
      setResult(parseResult(data.raw))
    } catch (e) {
      setError(e.message || 'Could not complete that read. Try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-kicker">Get a way to open it</div>
      <h2 className="page-title">Describe what you noticed.</h2>
      <p className="page-lede">
        No sign in, no names needed, nothing saved. Just enough detail for a way in that will not put them on the defensive.
      </p>

      <div className="notice privacy" style={{ marginBottom: 24 }}>
        <Lock size={18} strokeWidth={2.2} />
        <div>
          What you write is sent only to the AI model you pick below, to generate this. It is not stored,
          logged, or linked to you or your child in any way.
        </div>
      </div>

      <div className="card">
        <label className="field-label">What happened, or what you have noticed</label>
        <textarea
          className="transcript-input"
          placeholder="For example: I found messages on their phone about a topic that worried me, and I haven't said anything yet..."
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
        />

        <div style={{ height: 20 }} />

        <label className="field-label">How old are they</label>
        <div className="chip-row" style={{ marginBottom: 20 }}>
          {AGE_BANDS.map((t) => (
            <button
              key={t}
              className={`chip${age === t ? ' selected' : ''}`}
              onClick={() => setAge(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: -12, marginBottom: 20 }}>
          What works as an opener changes a lot between a curious 9 year old and a guarded 16 year old.
        </p>

        <label className="field-label">How did you find out (optional)</label>
        <div className="chip-row" style={{ marginBottom: 20 }}>
          {FOUND_OUT.map((t) => (
            <button
              key={t}
              className={`chip${foundOut === t ? ' selected' : ''}`}
              onClick={() => setFoundOut(foundOut === t ? '' : t)}
            >
              {t}
            </button>
          ))}
        </div>

        <label className="field-label">What worries you most (optional)</label>
        <div className="chip-row" style={{ marginBottom: 20 }}>
          {WORRY.map((t) => (
            <button
              key={t}
              className={`chip${worry === t ? ' selected' : ''}`}
              onClick={() => setWorry(worry === t ? '' : t)}
            >
              {t}
            </button>
          ))}
        </div>

        <label className="field-label">Run this using</label>
        <div className="provider-row">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              className={`chip${provider === p.id ? ' selected' : ''}`}
              onClick={() => setProvider(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {activeProvider.needsKey && (
          <input
            className="key-input"
            style={{ marginBottom: 20 }}
            type="password"
            placeholder={`Paste your ${activeProvider.label.split(' ')[0]} API key`}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        )}

        <button className="btn-primary" disabled={!canSubmit || loading} onClick={handleSubmit}>
          {loading ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
          {loading ? 'Thinking it through' : 'Get a way to open it'}
        </button>

        {error && <p style={{ color: 'var(--red)', fontSize: 13.5, marginTop: 14 }}>{error}</p>}
      </div>

      {result && (
        <div style={{ marginTop: 28 }}>
          <ResultCard result={result} />
        </div>
      )}

      <CommunicationResources />
      <ResourceFooter />
    </div>
  )
}
