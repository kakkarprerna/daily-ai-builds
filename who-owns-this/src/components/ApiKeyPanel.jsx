import { useState } from 'react'
import { KeyRound, Check, X } from 'lucide-react'
import { getStoredKey, setStoredKey } from '../lib/apiKey.js'

export default function ApiKeyPanel({ onChange }) {
  const [key, setKey] = useState(getStoredKey())
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const save = () => {
    const trimmed = draft.trim()
    setStoredKey(trimmed)
    setKey(trimmed)
    onChange?.(trimmed)
    setEditing(false)
    setDraft('')
  }

  if (editing) {
    return (
      <div className="key-panel">
        <KeyRound size={16} strokeWidth={2.3} />
        <input
          type="password"
          className="key-input"
          placeholder="sk-ant-…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') save() }}
          autoFocus
        />
        <button className="key-action" onClick={save} aria-label="Save key">
          <Check size={15} strokeWidth={2.8} />
        </button>
        <button
          className="key-action ghost"
          onClick={() => { setEditing(false); setDraft('') }}
          aria-label="Cancel"
        >
          <X size={15} strokeWidth={2.8} />
        </button>
      </div>
    )
  }

  return (
    <div className="key-panel">
      <KeyRound size={16} strokeWidth={2.3} />
      <span className="key-status">
        {key ? 'Using your own Anthropic key' : 'Using the shared demo key'}
        <span className="key-hint"> · stored only in this browser</span>
      </span>
      <button className="key-link" onClick={() => setEditing(true)}>
        {key ? 'Change' : 'Add your key'}
      </button>
      {key && (
        <button
          className="key-link"
          onClick={() => { setStoredKey(''); setKey(''); onChange?.('') }}
        >
          Remove
        </button>
      )}
    </div>
  )
}
