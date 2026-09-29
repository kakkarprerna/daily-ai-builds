import {
  Rocket, Users, Waves, Fingerprint, TrendingDown, AlertTriangle,
} from 'lucide-react'

const SIGNALS = [
  {
    icon: Rocket,
    title: 'Timing against a known change',
    body: "Sudden failures right after a deploy or config push usually trace back to whatever changed. No known change plus a gradual slide points more towards drift: a vendor, a data volume, or capacity issue rather than a code change.",
  },
  {
    icon: Fingerprint,
    title: 'Which surface it shows up on',
    body: "Failing only on mobile while web is fine points at the mobile client or its API contract. Failing identically everywhere points further back, towards a shared backend, data layer or vendor.",
  },
  {
    icon: Users,
    title: 'Who is affected',
    body: "One account often means account-specific config, permissions or an integration on their side. A segment (one plan tier, one region) points at whatever is different about that segment. Everyone at once points upstream, towards something shared.",
  },
  {
    icon: Waves,
    title: 'The shape of the failure',
    body: "A hard error or timeout points at infra or a broken call. A wrong number that is still a number (a stale total, a missing row) points at a data pipeline. Correct data shown wrong points at the client rendering it.",
  },
  {
    icon: TrendingDown,
    title: 'What changed nearby',
    body: "Anything you already know changed close to when it started (a dependency version, a third-party status page, a schema change) is weighted heavily, since coincidence in timing is one of the stronger signals available from a text description alone.",
  },
]

export default function Method() {
  return (
    <div>
      <span className="eyebrow-badge">Method</span>
      <div className="page-heading section-gap">
        <h2>What it's actually weighing</h2>
        <p className="page-lede">
          The tool sends your description to a language model with instructions
          to reason from the five signal types below. It doesn't run a fixed
          decision tree; it produces its best read of the pattern, the same
          way an experienced engineer would eyeball a report before opening
          any logs.
        </p>
      </div>

      <div className="card section-gap">
        {SIGNALS.map((s, i) => (
          <div className="rule-row" key={i}>
            <span className="icon-wrap"><s.icon size={16} strokeWidth={2.3} /></span>
            <div>
              <h4>{s.title}</h4>
              <p>{s.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="section-gap note-banner">
        <AlertTriangle size={18} strokeWidth={2.2} />
        <div>
          <strong>Where the confidence numbers come from.</strong> They're the
          model's own relative ranking of the candidates against each other,
          not a measured statistic from real incident data. Treat a 70%
          candidate as "worth checking first," not as a probability you can
          quote. The reasoning and questions are what actually carry the
          argument, if they don't hold up, the number shouldn't sway you either.
        </div>
      </div>

      <div className="section-gap note-banner">
        <AlertTriangle size={18} strokeWidth={2.2} />
        <div>
          <strong>Where it goes wrong.</strong> Thin descriptions produce thin
          reasoning; the model will still hand you a ranked list from very
          little to go on, so a short one-line report deserves a short list
          of caveats before you send it anywhere. And it has no memory of your
          specific systems or org chart, "backend" and "data pipeline" are
          generic categories, not your actual team names.
        </div>
      </div>
    </div>
  )
}
