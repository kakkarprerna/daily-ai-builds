import { useState } from 'react'
import { EXAMPLES } from '../data/examples.js'
import { parseDiagnosis } from '../lib/parseResponse.js'
import { CandidateCard, DraftMessage } from '../components/ResultCard.jsx'

export default function Examples() {
  const [activeId, setActiveId] = useState(EXAMPLES[0].id)
  const active = EXAMPLES.find((e) => e.id === activeId)
  const parsed = parseDiagnosis(active.raw)

  return (
    <div>
      <span className="eyebrow-badge">Examples</span>
      <div className="page-heading section-gap">
        <h2>Three saved runs</h2>
        <p className="page-lede">
          These are real outputs, saved so you can see the reasoning without
          needing an API key of your own.
        </p>
      </div>

      <div className="section-gap example-tabs">
        {EXAMPLES.map((e) => (
          <button
            key={e.id}
            className={'example-tab' + (e.id === activeId ? ' active' : '')}
            onClick={() => setActiveId(e.id)}
          >
            {e.title}
          </button>
        ))}
      </div>

      <div className="example-brief">
        <strong>{active.brief.surface} · {active.brief.failure} · {active.brief.timing} · {active.brief.affected}</strong>
        <br />
        {active.brief.notes}
      </div>

      <div className="stack">
        {parsed.candidates.map((c, i) => (
          <CandidateCard key={i} candidate={c} isTop={i === 0} />
        ))}
        <DraftMessage text={parsed.draftMessage} />
      </div>
    </div>
  )
}
