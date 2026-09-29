import {
  IconAlertTriangle,
  IconCheckCircle,
  IconHelpCircle,
  IconArrowRight,
  IconRotate,
} from '../icons.jsx'

const VERDICT_META = {
  Pattern: {
    icon: IconAlertTriangle,
    className: 'verdict-pattern',
    blurb: 'Worth escalating as systemic',
  },
  'One-off': {
    icon: IconCheckCircle,
    className: 'verdict-oneoff',
    blurb: 'Safe to close without a wider dig',
  },
  Unclear: {
    icon: IconHelpCircle,
    className: 'verdict-unclear',
    blurb: 'Not enough to call it yet',
  },
}

export default function ResultCard({ result, onReset }) {
  const meta = VERDICT_META[result.verdict] || VERDICT_META.Unclear
  const Icon = meta.icon

  return (
    <div className="result-card">
      <div className={`verdict-banner ${meta.className}`}>
        <Icon width={26} height={26} />
        <div>
          <div className="verdict-title">{result.verdict}</div>
          <div className="verdict-blurb">{meta.blurb}</div>
        </div>
        <div className="confidence-pill">{result.confidence} confidence</div>
      </div>

      <section className="result-section">
        <h3>Reasoning</h3>
        <p>{result.reasoning}</p>
      </section>

      {result.verdict === 'Pattern' && result.ifPattern && (
        <section className="result-section callout callout-pattern">
          <h3>
            <IconArrowRight width={16} height={16} /> If you escalate
          </h3>
          <p>{result.ifPattern}</p>
        </section>
      )}

      {result.verdict === 'One-off' && result.ifOneoff && (
        <section className="result-section callout callout-oneoff">
          <h3>
            <IconArrowRight width={16} height={16} /> To close it out
          </h3>
          <p>{result.ifOneoff}</p>
        </section>
      )}

      <section className="result-section">
        <h3>Cheap checks before you decide</h3>
        <ul className="checks-list">
          {result.checks?.map((check, i) => (
            <li key={i}>
              <span className="check-index">{i + 1}</span>
              <span>{check}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="result-section flip-section">
        <h3>
          <IconRotate width={16} height={16} /> What would change this verdict
        </h3>
        <p>{result.flip}</p>
      </section>

      <button className="btn-ghost" onClick={onReset}>
        Diagnose another report
      </button>
    </div>
  )
}
