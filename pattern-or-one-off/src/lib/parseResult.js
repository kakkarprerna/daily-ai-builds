// The serverless function asks the model to reply in simple tagged lines
// rather than JSON — easier to parse reliably and cheap to swap providers.
// Expected shape:
// VERDICT: Pattern | One-off | Unclear
// CONFIDENCE: High | Medium | Low
// REASONING: one paragraph, single line
// CHECK: one cheap thing to check (repeated for each check)
// IF_PATTERN: guidance shown only when verdict is Pattern
// IF_ONEOFF: guidance shown only when verdict is One-off
// FLIP: what new information would change the verdict

export function parseResult(raw) {
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean)
  const result = {
    verdict: 'Unclear',
    confidence: 'Medium',
    reasoning: '',
    checks: [],
    ifPattern: '',
    ifOneoff: '',
    flip: '',
  }

  for (const line of lines) {
    const match = line.match(/^([A-Z_]+):\s*(.*)$/)
    if (!match) continue
    const [, tag, value] = match

    switch (tag) {
      case 'VERDICT': {
        const v = value.trim().toLowerCase()
        if (v.startsWith('pattern')) result.verdict = 'Pattern'
        else if (v.startsWith('one')) result.verdict = 'One-off'
        else result.verdict = 'Unclear'
        break
      }
      case 'CONFIDENCE': {
        const c = value.trim().toLowerCase()
        if (c.startsWith('high')) result.confidence = 'High'
        else if (c.startsWith('low')) result.confidence = 'Low'
        else result.confidence = 'Medium'
        break
      }
      case 'REASONING':
        result.reasoning = value.trim()
        break
      case 'CHECK':
        if (value.trim()) result.checks.push(value.trim())
        break
      case 'IF_PATTERN':
        result.ifPattern = value.trim()
        break
      case 'IF_ONEOFF':
        result.ifOneoff = value.trim()
        break
      case 'FLIP':
        result.flip = value.trim()
        break
      default:
        break
    }
  }

  return result
}
