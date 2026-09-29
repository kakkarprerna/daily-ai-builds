import { Link } from 'react-router-dom'
import { ArrowRight, RefreshCcw, Route, MessageSquareText } from 'lucide-react'

export default function Home() {
  return (
    <div>
      <span className="eyebrow-badge">Daily AI build · PM workflow diagnosis</span>
      <div className="page-heading section-gap">
        <h2>Route the bug before you escalate it</h2>
        <p className="page-lede">
          Bug reports rarely say who should fix them. This reads the symptoms
          you already have and points to the system that's most likely
          responsible, so the ticket lands with the right team the first time.
        </p>
      </div>

      <div className="card section-gap stack">
        <div className="rule-row">
          <span className="icon-wrap"><RefreshCcw size={16} strokeWidth={2.3} /></span>
          <div>
            <h4>Why this exists</h4>
            <p>
              A vague bug bounces between frontend, backend and a vendor before
              anyone confirms whose problem it is. Each hop costs a day. This
              gives you a first guess, grounded in the pattern of the symptoms,
              so you can route it with a reason attached instead of a shrug.
            </p>
          </div>
        </div>
        <div className="rule-row">
          <span className="icon-wrap"><Route size={16} strokeWidth={2.3} /></span>
          <div>
            <h4>What you get</h4>
            <p>
              A ranked shortlist of likely owners, why each one fits the
              symptoms you described, and the two or three questions that
              would confirm or rule it out fastest.
            </p>
          </div>
        </div>
        <div className="rule-row">
          <span className="icon-wrap"><MessageSquareText size={16} strokeWidth={2.3} /></span>
          <div>
            <h4>What it isn't</h4>
            <p>
              Not a diagnosis, and not a replacement for whoever actually owns
              the system. It's a heuristic aid built to save one round trip,
              not the final word. See the <Link to="/method">Method</Link> page
              for exactly what it's weighing.
            </p>
          </div>
        </div>
      </div>

      <div className="section-gap" style={{ display: 'flex', gap: 12 }}>
        <Link to="/diagnose" className="btn-primary">
          Diagnose an issue <ArrowRight size={16} strokeWidth={2.4} />
        </Link>
        <Link to="/examples" className="btn-ghost">See a worked example</Link>
      </div>
    </div>
  )
}
