import { useState } from 'react'
import { IconPlus } from '../icons.jsx'

export default function ChipGroup({
  label,
  icon: Icon,
  options,
  extraOptions,
  selected,
  onChange,
  multi = false,
  onAddCustom,
}) {
  const [adding, setAdding] = useState(false)
  const [customValue, setCustomValue] = useState('')
  const allOptions = extraOptions ? [...options, ...extraOptions] : options

  const isSelected = (opt) => (multi ? selected.includes(opt) : selected === opt)

  const toggle = (opt) => {
    if (multi) {
      if (selected.includes(opt)) {
        onChange(selected.filter((s) => s !== opt))
      } else {
        onChange([...selected, opt])
      }
    } else {
      onChange(opt)
    }
  }

  const submitCustom = () => {
    const value = customValue.trim()
    if (!value) {
      setAdding(false)
      return
    }
    onAddCustom(value)
    toggle(value)
    setCustomValue('')
    setAdding(false)
  }

  return (
    <div className="field">
      <div className="field-label">
        {Icon && <Icon width={16} height={16} />}
        <span>{label}</span>
      </div>
      <div className="chip-row">
        {allOptions.map((opt) => (
          <button
            type="button"
            key={opt}
            className={`chip ${isSelected(opt) ? 'chip-active' : ''}`}
            onClick={() => toggle(opt)}
          >
            {opt}
          </button>
        ))}

        {adding ? (
          <input
            autoFocus
            className="chip-input"
            value={customValue}
            placeholder="Type and press enter"
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitCustom()
              if (e.key === 'Escape') {
                setAdding(false)
                setCustomValue('')
              }
            }}
            onBlur={submitCustom}
          />
        ) : (
          <button type="button" className="chip chip-add" onClick={() => setAdding(true)}>
            <IconPlus width={14} height={14} />
            Add
          </button>
        )}
      </div>
    </div>
  )
}
