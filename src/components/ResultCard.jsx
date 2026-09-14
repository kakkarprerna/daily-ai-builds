import { CircleDot, HelpCircle } from 'lucide-react'
import { ownerIcon } from '../lib/ownerIcon.js'

function confidenceTier(pct) {
  if (pct >= 60) return 'good'
  if (pct >= 30) return 'mid'
  return 'low'
}

export function CandidateCard({ candidate, isTop }) {
  const Icon = ownerIcon(candidate.name)
  const tier = confidenceTier(candidate.confidence)
  return (
    <div className={'candidate' + (isTop ? ' top' : '')}>
      <div className="candidate-head">
        <div className="candidate-name">
          <span className="icon-wrap"><Icon size={18} strokeWidth={2.2} /></span>
          {candidate.name}
        </div>
        <span className={'confidence-pill ' + tier}>{candidate.confidence}% likely</span>
      </div>

      {candidate.reasoning?.length > 0 && (
        <>
          <div className="subhead">Why it looks this way</div>
          <ul className="reasoning-list">
            {candidate.reasoning.map((point, i) => (
              <li key={i}><CircleDot size={14} strokeWidth={2.4} />{point}</li>
            ))}
          </ul>
        </>
      )}

      {candidate.questions?.length > 0 && (
        <>
          <div className="subhead">Ask before you route it</div>
          <ul className="question-list">
            {candidate.questions.map((q, i) => (
              <li key={i}><HelpCircle size={14} strokeWidth={2.4} />{q}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

export function DraftMessage({ text }) {
  if (!text) return null
  const copy = () => navigator.clipboard?.writeText(text)
  return (
    <div className="section-gap">
      <div className="subhead">Draft handoff message</div>
      <div className="draft-message">{text}</div>
      <div className="copy-row">
        <button className="copy-btn" onClick={copy}>Copy message</button>
      </div>
    </div>
  )
}
