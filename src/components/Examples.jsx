import { useState } from 'react'
import { examples } from '../data/examples.js'
import ResultCard from './ResultCard.jsx'
import ResourceFooter from './ResourceFooter.jsx'

export default function Examples() {
  const [openId, setOpenId] = useState(examples[0].id)
  const open = examples.find((e) => e.id === openId)

  return (
    <div>
      <div className="page-kicker">See it in action</div>
      <h2 className="page-title">Three ways a conversation can go</h2>
      <p className="page-lede">
        These are written to show a pattern, not a real exchange. None of them include an actual method, dose or
        how-to, on purpose, since a worked example that doubled as a working recipe would defeat the point.
      </p>

      {examples.map((ex) => (
        <div key={ex.id} className="example-card" onClick={() => setOpenId(ex.id)}>
          <div className="example-card-top">
            <strong>{ex.title}</strong>
            <span className={`example-tag ${ex.tag}`}>{ex.tag}</span>
          </div>
          <div className="example-card-desc">{ex.blurb}</div>
        </div>
      ))}

      {open && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="result-section">
            <div className="result-section-label">What was described</div>
            <div className="result-section-body" style={{ whiteSpace: 'pre-line' }}>{open.transcript}</div>
          </div>
          <div style={{ height: 8 }} />
          <ResultCard result={open.result} />
        </div>
      )}

      <ResourceFooter />
    </div>
  )
}
