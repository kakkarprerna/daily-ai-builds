import { Heart, AlertTriangle, OctagonAlert, CheckCircle2, MessageCircle, ShieldAlert, Ear, LifeBuoy } from 'lucide-react'

const LEVEL_META = {
  none: { icon: CheckCircle2, title: 'No conversation needed right now' },
  calm: { icon: Heart, title: 'A calm, low-stakes conversation' },
  steady: { icon: AlertTriangle, title: 'Worth a real conversation soon' },
  urgent: { icon: OctagonAlert, title: 'This needs to happen today' },
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
  const meta = LEVEL_META[result.level] || LEVEL_META.calm
  const Icon = meta.icon
  const isNone = result.level === 'none'

  return (
    <div>
      <div className={`result-banner ${result.level}`}>
        <div className="result-banner-icon">
          <Icon size={22} strokeWidth={2.2} />
        </div>
        <div>
          <div className="result-banner-title">{meta.title}</div>
          <div className="result-banner-sub">How well this fits: {result.confidence}%</div>
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

      {!isNone && (
        <>
          <div className="result-section">
            <div className="result-section-label">
              <MessageCircle size={14} style={{ verticalAlign: -2, marginRight: 4 }} />
              A way to open it
            </div>
            <div className="script-line">"{result.opener}"</div>
          </div>

          <div className="result-section">
            <div className="result-section-label">
              <ShieldAlert size={14} style={{ verticalAlign: -2, marginRight: 4 }} />
              What to avoid
            </div>
            <div className="avoid-list">
              {result.avoid.map((a, i) => (
                <div className="avoid-item" key={i}>
                  <AlertTriangle size={15} strokeWidth={2.2} />
                  <span>{a}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="result-section">
            <div className="result-section-label">If they shut down</div>
            <div className="result-section-body">{result.ifShutsDown}</div>
          </div>

          <div className="result-section">
            <div className="result-section-label">
              <Ear size={14} style={{ verticalAlign: -2, marginRight: 4 }} />
              What to listen for
            </div>
            <div className="result-section-body">{result.listenFor}</div>
          </div>
        </>
      )}

      <div className="result-section">
        <div className="result-section-label">
          <LifeBuoy size={14} style={{ verticalAlign: -2, marginRight: 4 }} />
          {isNone ? 'Worth knowing' : 'When this needs more than you'}
        </div>
        <div className="result-section-body">{result.whenToGetHelp}</div>
      </div>
    </div>
  )
}
