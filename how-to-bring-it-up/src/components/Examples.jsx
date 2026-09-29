import { useState } from 'react'
import { examples } from '../data/examples.js'
import ResultCard from './ResultCard.jsx'
import ResourceFooter from './ResourceFooter.jsx'
import CommunicationResources from './CommunicationResources.jsx'

export default function Examples() {
  const [openId, setOpenId] = useState(examples[0].id)
  const open = examples.find((e) => e.id === openId)

  return (
    <div>
      <div className="page-kicker">See it in action</div>
      <h2 className="page-title">Four different ways this can start</h2>
      <p className="page-lede">
        The right opener depends on the child's age, how you found out, and how urgent it is. These cover a wide
        range, including the case where nothing is actually wrong.
      </p>

      {examples.map((ex) => (
        <div key={ex.id} className="example-card" onClick={() => setOpenId(ex.id)}>
          <div className="example-card-top">
            <strong>{ex.title}</strong>
            <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="example-tag" style={{ background: 'var(--bg)', color: 'var(--ink-soft)' }}>Age {ex.age}</span>
              <span className={`example-tag ${ex.tag}`}>{ex.tag}</span>
            </span>
          </div>
          <div className="example-card-desc">{ex.blurb}</div>
        </div>
      ))}

      {open && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="result-section">
            <div className="result-section-label">The situation</div>
            <div className="result-section-body">{open.situation}</div>
          </div>
          <div style={{ height: 8 }} />
          <ResultCard result={open.result} />
        </div>
      )}

      <CommunicationResources />
      <ResourceFooter />
    </div>
  )
}
