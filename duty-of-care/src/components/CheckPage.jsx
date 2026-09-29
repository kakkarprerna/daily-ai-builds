import { useState } from 'react'
import { Lock, Loader2, Sparkles } from 'lucide-react'
import ResultCard from './ResultCard.jsx'
import ResourceFooter from './ResourceFooter.jsx'
import { parseResult } from '../lib/parseResult.js'

const TOOLS = ['ChatGPT', 'Claude', 'Perplexity', 'Character.AI', 'Another AI tool', 'Not sure']

const PROVIDERS = [
  { id: 'muse', label: 'Free, built in', needsKey: false },
  { id: 'anthropic', label: 'Anthropic (your key)', needsKey: true },
  { id: 'openai', label: 'OpenAI (your key)', needsKey: true },
  { id: 'gemini', label: 'Gemini (your key)', needsKey: true },
]

export default function CheckPage() {
  const [transcript, setTranscript] = useState('')
  const [tool, setTool] = useState('')
  const [provider, setProvider] = useState('muse')
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const activeProvider = PROVIDERS.find((p) => p.id === provider)
  const canSubmit = transcript.trim().length > 20 && (!activeProvider.needsKey || apiKey.trim().length > 0)

  async function handleSubmit() {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, tool, provider, apiKey: activeProvider.needsKey ? apiKey : undefined }),
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
      <div className="page-kicker">Check a conversation</div>
      <h2 className="page-title">Paste it in. Get a private read.</h2>
      <p className="page-lede">
        Describe or paste how an AI conversation went, yours or one you are worried about for someone else.
        No sign in, no name, nothing saved.
      </p>

      <div className="notice privacy" style={{ marginBottom: 24 }}>
        <Lock size={18} strokeWidth={2.2} />
        <div>
          What you paste is sent only to the AI model you pick below, to generate this read. It is not stored,
          logged, or linked to you in any way. Close this tab and it is gone.
        </div>
      </div>

      <div className="card">
        <label className="field-label">What happened</label>
        <textarea
          className="transcript-input"
          placeholder="You can paste an actual conversation, or just describe how it went. For example: it started with a normal question about X, then the AI started suggesting Y, and by the end it was saying Z..."
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
        />

        <div style={{ height: 20 }} />

        <label className="field-label">Which AI tool, if you know (optional)</label>
        <div className="chip-row" style={{ marginBottom: 20 }}>
          {TOOLS.map((t) => (
            <button
              key={t}
              className={`chip${tool === t ? ' selected' : ''}`}
              onClick={() => setTool(tool === t ? '' : t)}
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
          {loading ? 'Reading it through' : 'Check this conversation'}
        </button>

        {error && (
          <p style={{ color: 'var(--red)', fontSize: 13.5, marginTop: 14 }}>{error}</p>
        )}
      </div>

      {result && (
        <div style={{ marginTop: 28 }}>
          <ResultCard result={result} />
        </div>
      )}

      <ResourceFooter />
    </div>
  )
}
