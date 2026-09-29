import { CheckCircle2, AlertTriangle, OctagonAlert } from 'lucide-react'

const LEVEL_META = {
  green: { icon: CheckCircle2, title: 'This looks okay' },
  amber: { icon: AlertTriangle, title: 'Worth a second look' },
  red: { icon: OctagonAlert, title: 'Please loop someone in' },
}

const SIGNAL_LABELS = {
  physical: 'Physical safety',
  emotional: 'Emotional signals',
  trust: 'Trust & boundaries',
}

const STATE_LABELS = {
  none: 'Nothing noticed',
  watch: 'Worth watching',
  flag: 'Flagged',
}

function stateClass(state) {
  if (state === 'flag') return 'flag'
  if (state === 'watch') return 'watch'
  return 'none'
}

export default function ResultCard({ result }) {
  const meta = LEVEL_META[result.level] || LEVEL_META.green
  const Icon = meta.icon

  return (
    <div>
      <div className={`result-banner ${result.level}`}>
        <div className="result-banner-icon">
          <Icon size={22} strokeWidth={2.2} />
        </div>
        <div>
          <div className="result-banner-title">{meta.title}</div>
          <div className="result-banner-sub">How sure this read is: {result.confidence}%</div>
        </div>
      </div>

      <div className="signal-grid">
        {['physical', 'emotional', 'trust'].map((key) => (
          <div key={key} className={`signal-card ${stateClass(result[key])}`}>
            <div className="signal-card-label">{SIGNAL_LABELS[key]}</div>
            <div className="signal-card-state">{STATE_LABELS[result[key]] || 'Nothing noticed'}</div>
          </div>
        ))}
      </div>

      <div className="result-section">
        <div className="result-section-label">In short</div>
        <div className="result-section-body">{result.summary}</div>
      </div>

      <div className="result-section">
        <div className="result-section-label">Why it reads this way</div>
        <div className="result-section-body">{result.reasoning}</div>
      </div>

      <div className="result-section">
        <div className="result-section-label">What might help next</div>
        <div className="result-section-body">{result.nextStep}</div>
      </div>

      <div className="result-section">
        <div className="result-section-label">What would change this reading</div>
        <div className="result-section-body">{result.whatWouldChange}</div>
      </div>
    </div>
  )
}
