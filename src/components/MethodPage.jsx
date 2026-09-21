import { PulseIcon, TargetIcon, UsersIcon, SmileIcon, LifeBuoyIcon } from "./Icons";

export default function MethodPage() {
  return (
    <div className="method-page">
      <div className="page-intro">
        <h2>How this works</h2>
        <p>
          Pulse Check turns the account signals a CS team already tracks into
          one health score, using a fixed formula rather than a black box.
          Nothing here is a machine learning model or an AI guess. Every
          number below is arithmetic you could redo on paper, so a rep can
          always trace a score back to the inputs that produced it.
        </p>
      </div>

      <section className="method-section">
        <h3>
          <PulseIcon /> Product adoption <span className="weight-tag">25% of overall</span>
        </h3>
        <p>Average of three signals, each on a 0 to 100 scale:</p>
        <ul>
          <li>Active users (%), used as is</li>
          <li>Core features active (%), used as is</li>
          <li>
            Usage trend, converted to a score of 100 minus 1.5 points for every
            1% of decline, floored at 0 (flat or growing usage scores 100)
          </li>
        </ul>
      </section>

      <section className="method-section">
        <h3>
          <TargetIcon /> Business outcomes <span className="weight-tag">25% of overall</span>
        </h3>
        <p>Average of two signals:</p>
        <ul>
          <li>Success milestones achieved, as a percentage of the total agreed</li>
          <li>ROI demonstrated, scored None = 20, Partial = 60, Full = 100</li>
        </ul>
      </section>

      <section className="method-section">
        <h3>
          <UsersIcon /> Engagement <span className="weight-tag">20% of overall</span>
        </h3>
        <p>Weighted blend of three signals, each scored Weak = 20, Medium = 60, Strong = 100:</p>
        <ul>
          <li>Champion strength, weighted 25%</li>
          <li>Executive sponsor engagement, weighted 35%</li>
          <li>Meeting attendance (%), weighted 40%</li>
        </ul>
        <p className="method-note">
          Executive sponsorship outweighs the champion relationship on
          purpose: a single champion can leave the company overnight, so an
          account that depends entirely on one person is carrying risk the
          raw scores should reflect.
        </p>
      </section>

      <section className="method-section">
        <h3>
          <SmileIcon /> Sentiment <span className="weight-tag">15% of overall</span>
        </h3>
        <p>Weighted blend of two signals:</p>
        <ul>
          <li>CSAT (out of 5), converted to a 0 to 100 scale, weighted 45%</li>
          <li>NPS (-100 to 100), converted to a 0 to 100 scale, weighted 55%</li>
        </ul>
        <p className="method-note">
          NPS is weighted slightly higher than CSAT because it speaks to
          advocacy and renewal intent, not just satisfaction with one
          interaction.
        </p>
      </section>

      <section className="method-section">
        <h3>
          <LifeBuoyIcon /> Support <span className="weight-tag">15% of overall</span>
        </h3>
        <p>
          Starts at 100 and subtracts 12 points per open critical issue and 5
          points per other open issue, floored at 0.
        </p>
      </section>

      <section className="method-section">
        <h3>Overall score and colour bands</h3>
        <p>
          The overall score is the weighted average of the five category
          scores above (25 / 25 / 20 / 15 / 15).
        </p>
        <div className="band-legend">
          <span className="band-chip band-green">🟢 74 to 100, healthy</span>
          <span className="band-chip band-yellow">🟡 56 to 73, watch</span>
          <span className="band-chip band-red">🔴 0 to 55, at risk</span>
        </div>
      </section>

      <section className="method-section">
        <h3>Top risks and next best action</h3>
        <p>
          Each category checks its own inputs against a fixed set of
          thresholds (for example, any open critical issue, a champion rated
          Weak, or NPS under a set floor). Every threshold that trips gets a
          severity score; the three highest-severity items become the top
          risks shown. The next best action comes from a short decision
          table: it checks outcomes and engagement first, then support, then
          adoption, then sentiment, and falls back to a routine check-in when
          nothing is seriously off.
        </p>
      </section>
    </div>
  );
}
