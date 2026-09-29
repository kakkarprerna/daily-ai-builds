import { useState } from 'react'
import { Compass, Loader2, AlertCircle } from 'lucide-react'
import ChipRow from '../components/ChipRow.jsx'
import ApiKeyPanel from '../components/ApiKeyPanel.jsx'
import { CandidateCard, DraftMessage } from '../components/ResultCard.jsx'
import { parseDiagnosis } from '../lib/parseResponse.js'
import { getStoredKey } from '../lib/apiKey.js'

const FIELDS = [
  {
    key: 'surface',
    label: 'Where was it noticed?',
    options: ['Web app', 'Mobile app', 'API / integration', 'Internal tool'],
  },
  {
    key: 'failure',
    label: 'What kind of failure?',
    options: ['Timeout', 'Error response', 'Data mismatch', 'UI glitch', 'Missing data', 'Wrong behaviour'],
  },
  {
    key: 'timing',
    label: 'When did it start?',
    options: ['Right after a deploy', 'After a config or settings change', 'Gradually, over time', 'Suddenly, no known change'],
  },
  {
    key: 'affected',
    label: "Who's affected?",
    options: ['All users', 'One customer or account', 'A subset or segment', 'Only internal users'],
  },
]

const emptySelections = FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: [] }), {})

export default function Diagnose() {
  const [options, setOptions] = useState(
    FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: f.options }), {})
  )
  const [selections, setSelections] = useState(emptySelections)
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | done | error
  const [result, setResult] = useState(null)
  const [userKey, setUserKey] = useState(getStoredKey())

  const toggle = (key, value) => {
    setSelections((prev) => {
      const set = new Set(prev[key])
      set.has(value) ? set.delete(value) : set.add(value)
      return { ...prev, [key]: Array.from(set) }
    })
  }

  const addCustom = (key, value) => {
    setOptions((prev) => (prev[key].includes(value) ? prev : { ...prev, [key]: [...prev[key], value] }))
    setSelections((prev) => (prev[key].includes(value) ? prev : { ...prev, [key]: [...prev[key], value] }))
  }

  const hasEnough =
    Object.values(selections).some((arr) => arr.length > 0) || notes.trim().length > 12

  const submit = async () => {
    setStatus('loading')
    setResult(null)
    try {
      const headers = { 'Content-Type': 'application/json' }
      if (userKey) headers['x-user-api-key'] = userKey

      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers,
        body: JSON.stringify({ selections, notes }),
      })
      if (!res.ok) throw new Error('Request failed')
      const data = await res.json()
      const parsed = parseDiagnosis(data.text)
      if (!parsed.candidates.length) throw new Error('Could not read a result')
      setResult(parsed)
      setStatus('done')
    } catch (err) {
      setStatus('error')
    }
  }

  return (
    <div>
      <span className="eyebrow-badge">Diagnose</span>
      <div className="page-heading section-gap">
        <h2>Describe what's happening</h2>
        <p className="page-lede">
          Pick what applies, add anything the presets don't cover, and drop
          in whatever detail you have. A one-line report still works, more
          detail just sharpens the reasoning.
        </p>
      </div>

      <ApiKeyPanel onChange={setUserKey} />

      <div className="card section-gap stack">
        {FIELDS.map((f) => (
          <ChipRow
            key={f.key}
            label={f.label}
            options={options[f.key]}
            selected={selections[f.key]}
            onToggle={(v) => toggle(f.key, v)}
            onAddCustom={(v) => addCustom(f.key, v)}
          />
        ))}

        <div>
          <label className="field-label">Anything else worth noting?</label>
          <textarea
            className="notes"
            placeholder="Error messages, what you've already ruled out, anything that changed around the same time…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div>
          <button className="btn-primary" disabled={!hasEnough || status === 'loading'} onClick={submit}>
            {status === 'loading' ? (
              <>
                <Loader2 size={16} className="spin" strokeWidth={2.6} />
                Working it out
              </>
            ) : (
              <>
                <Compass size={16} strokeWidth={2.6} />
                Find the likely owner
              </>
            )}
          </button>
        </div>
      </div>

      {status === 'error' && (
        <div className="section-gap note-banner">
          <AlertCircle size={18} strokeWidth={2.2} />
          <div>
            Couldn't reach the model just now. If the shared demo key has run
            out for the day, adding your own key above will fix it, or check{' '}
            <a href="/examples">Examples</a> to see it working on saved runs.
          </div>
        </div>
      )}

      {status === 'done' && result && (
        <div className="section-gap stack">
          {result.candidates.map((c, i) => (
            <CandidateCard key={i} candidate={c} isTop={i === 0} />
          ))}
          <DraftMessage text={result.draftMessage} />
        </div>
      )}
    </div>
  )
}
