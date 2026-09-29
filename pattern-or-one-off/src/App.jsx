import { useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import ChipGroup from './components/ChipGroup.jsx'
import ProviderSelector from './components/ProviderSelector.jsx'
import ResultCard from './components/ResultCard.jsx'
import { examples } from './data/examples.js'
import { parseResult } from './lib/parseResult.js'
import {
  IconClock,
  IconUsers,
  IconGitCommit,
  IconSparkle,
  IconLoader,
  IconLayers,
} from './icons.jsx'

const OCCURRENCE_OPTIONS = ['First time', '2-3 times before', '4+ times before', 'Not sure']
const TIME_PATTERN_OPTIONS = [
  'No clear pattern',
  'Same time of day',
  'Same user segment',
  'After a specific trigger/action',
  'Following a recent deploy',
  'Not sure',
]
const AFFECTED_OPTIONS = ['One user', 'Small % of users', 'Large % of users', 'Specific segment/cohort']
const CHANGED_OPTIONS = [
  'Recent deploy',
  'Recent config/flag change',
  'Third-party/dependency change',
  'Nothing known changed',
  'Not sure',
]

const emptyForm = {
  symptom: '',
  occurrences: '',
  timePattern: [],
  affected: '',
  changedNearby: '',
  notes: '',
}

export default function App() {
  const [view, setView] = useState('diagnose')
  const [form, setForm] = useState(emptyForm)
  const [provider, setProvider] = useState('muse')
  const [apiKey, setApiKey] = useState('')
  const [occurrenceExtras, setOccurrenceExtras] = useState([])
  const [timeExtras, setTimeExtras] = useState([])
  const [affectedExtras, setAffectedExtras] = useState([])
  const [changedExtras, setChangedExtras] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const canSubmit =
    form.symptom.trim().length > 8 &&
    form.occurrences &&
    form.affected &&
    form.changedNearby &&
    (provider === 'muse' || apiKey.trim().length > 0)

  const updateField = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

  const runExample = (example) => {
    setForm(example.inputs)
    setResult(example.result)
    setError('')
    setView('diagnose')
  }

  const reset = () => {
    setForm(emptyForm)
    setResult(null)
    setError('')
    setApiKey('')
  }

  const submit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, provider, apiKey: provider === 'muse' ? undefined : apiKey }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'The diagnosis service did not respond as expected.')
      }
      const data = await res.json()
      setResult(parseResult(data.text || ''))
    } catch (err) {
      setError(err.message || 'Something went wrong reaching the diagnosis service.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <Sidebar active={view} onNavigate={setView} />

      <main className="main-col">
        {view === 'diagnose' && (
          <div className="view">
            <header className="view-header">
              <h1>Is this a pattern, or a one-off?</h1>
              <p>
                Describe the bug and what you already know about how it's shown up. You'll get a
                verdict, a confidence level, and the cheap checks to run before you decide whether
                it's worth pulling engineering in.
              </p>
            </header>

            {!result && (
              <div className="form-card">
                <div className="field">
                  <div className="field-label">
                    <IconSparkle width={16} height={16} />
                    <span>What broke</span>
                  </div>
                  <textarea
                    className="textarea"
                    rows={3}
                    placeholder="e.g. Checkout button stops responding on mobile Safari after selecting a shipping method"
                    value={form.symptom}
                    onChange={(e) => updateField('symptom')(e.target.value)}
                  />
                </div>

                <ChipGroup
                  label="How many times has this happened before?"
                  icon={IconGitCommit}
                  options={OCCURRENCE_OPTIONS}
                  extraOptions={occurrenceExtras}
                  selected={form.occurrences}
                  onChange={updateField('occurrences')}
                  onAddCustom={(v) => setOccurrenceExtras((x) => [...x, v])}
                />

                <ChipGroup
                  label="Any pattern to when or how it happens?"
                  icon={IconClock}
                  options={TIME_PATTERN_OPTIONS}
                  extraOptions={timeExtras}
                  selected={form.timePattern}
                  onChange={updateField('timePattern')}
                  multi
                  onAddCustom={(v) => setTimeExtras((x) => [...x, v])}
                />

                <ChipGroup
                  label="Who's affected"
                  icon={IconUsers}
                  options={AFFECTED_OPTIONS}
                  extraOptions={affectedExtras}
                  selected={form.affected}
                  onChange={updateField('affected')}
                  onAddCustom={(v) => setAffectedExtras((x) => [...x, v])}
                />

                <ChipGroup
                  label="What's changed nearby recently"
                  icon={IconLayers}
                  options={CHANGED_OPTIONS}
                  extraOptions={changedExtras}
                  selected={form.changedNearby}
                  onChange={updateField('changedNearby')}
                  onAddCustom={(v) => setChangedExtras((x) => [...x, v])}
                />

                <div className="field">
                  <div className="field-label">
                    <span>Anything else worth mentioning</span>
                    <span className="optional-tag">optional</span>
                  </div>
                  <textarea
                    className="textarea"
                    rows={2}
                    placeholder="Ticket dates, platforms, anything a colleague mentioned in passing"
                    value={form.notes}
                    onChange={(e) => updateField('notes')(e.target.value)}
                  />
                </div>

                <ProviderSelector
                  provider={provider}
                  apiKey={apiKey}
                  onProviderChange={setProvider}
                  onApiKeyChange={setApiKey}
                />

                {error && <div className="error-banner">{error}</div>}

                <button className="btn-primary" disabled={!canSubmit || loading} onClick={submit}>
                  {loading ? (
                    <>
                      <IconLoader width={16} height={16} /> Working it out…
                    </>
                  ) : (
                    'Get the verdict'
                  )}
                </button>
                <div className="form-hint">
                  Fill in the symptom, occurrences, who's affected, and what's changed nearby to continue.
                </div>
              </div>
            )}

            {result && <ResultCard result={result} onReset={reset} />}
          </div>
        )}

        {view === 'how' && <HowItWorks />}
        {view === 'examples' && <Examples onRun={runExample} />}
      </main>
    </div>
  )
}

function HowItWorks() {
  return (
    <div className="view">
      <header className="view-header">
        <h1>How the verdict gets made</h1>
        <p>Four things do most of the work. None of them require reading any code.</p>
      </header>

      <div className="how-grid">
        <div className="how-card">
          <IconGitCommit width={22} height={22} />
          <h3>Repeat count</h3>
          <p>A first-time report and a fourth report carry very different weight, even with identical symptoms.</p>
        </div>
        <div className="how-card">
          <IconClock width={22} height={22} />
          <h3>Shape of the timing</h3>
          <p>Random timing looks like noise. A recurring window, trigger, or segment looks like a mechanism.</p>
        </div>
        <div className="how-card">
          <IconUsers width={22} height={22} />
          <h3>Who it hits</h3>
          <p>One person points at their setup. A slice of users on the same path points at the product.</p>
        </div>
        <div className="how-card">
          <IconLayers width={22} height={22} />
          <h3>What moved nearby</h3>
          <p>A deploy or config change in the same window is the strongest single signal there is.</p>
        </div>
      </div>

      <div className="how-note">
        <p>
          The tool weighs these against each other rather than scoring them separately — a single report
          right after a deploy can outweigh four unrelated reports with nothing nearby. The confidence
          level reflects how much of this picture you've actually got, not just the verdict itself. When
          the inputs pull in different directions, you'll get "Unclear" and a note on what's missing,
          rather than a guess dressed up as a verdict.
        </p>
      </div>
    </div>
  )
}

function Examples({ onRun }) {
  return (
    <div className="view">
      <header className="view-header">
        <h1>Worked examples</h1>
        <p>Three saved reports with their verdicts, so you can see how this reads before running your own.</p>
      </header>

      <div className="examples-grid">
        {examples.map((ex) => (
          <button key={ex.id} className="example-card" onClick={() => onRun(ex)}>
            <div className={`example-verdict verdict-tag-${ex.result.verdict.toLowerCase().replace(/\s|-/g, '')}`}>
              {ex.result.verdict}
            </div>
            <h3>{ex.label}</h3>
            <p>{ex.inputs.symptom}</p>
            <span className="example-cta">View the full diagnosis →</span>
          </button>
        ))}
      </div>
    </div>
  )
}
