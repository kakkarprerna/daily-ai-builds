import { useState } from 'react'
import { Plus } from 'lucide-react'

export default function ChipRow({ label, options, selected, onToggle, onAddCustom }) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')

  const submitCustom = () => {
    const value = draft.trim()
    if (value) onAddCustom(value)
    setDraft('')
    setAdding(false)
  }

  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="chip-row">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={'chip' + (selected.includes(opt) ? ' selected' : '')}
            onClick={() => onToggle(opt)}
          >
            {opt}
          </button>
        ))}
        {adding ? (
          <input
            autoFocus
            className="chip-input"
            value={draft}
            placeholder="Type and press enter"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitCustom()
              if (e.key === 'Escape') { setAdding(false); setDraft('') }
            }}
            onBlur={submitCustom}
          />
        ) : (
          <button type="button" className="chip add-chip" onClick={() => setAdding(true)}>
            <Plus size={13} strokeWidth={3} style={{ verticalAlign: -2, marginRight: 4 }} />
            Add
          </button>
        )}
      </div>
    </div>
  )
}
