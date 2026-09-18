// The model is asked to respond in plain tagged lines (not JSON) because it
// keeps the prompt simple and makes swapping providers cheap: every provider
// can produce this reliably, and a partial or slightly malformed response
// still parses far more gracefully than broken JSON would.

function grab(text, tag) {
  const re = new RegExp(`^${tag}:\\s*(.+)$`, 'im')
  const match = text.match(re)
  return match ? match[1].trim() : ''
}

function normaliseLevel(raw) {
  const v = raw.toLowerCase()
  if (v.includes('red')) return 'red'
  if (v.includes('amber') || v.includes('yellow')) return 'amber'
  return 'green'
}

function normaliseState(raw) {
  const v = (raw || '').toLowerCase()
  if (v.includes('flag')) return 'flag'
  if (v.includes('watch')) return 'watch'
  return 'none'
}

export function parseResult(raw) {
  const confidenceRaw = grab(raw, 'CONFIDENCE').replace('%', '')
  const confidence = Math.max(0, Math.min(100, parseInt(confidenceRaw, 10) || 60))

  return {
    level: normaliseLevel(grab(raw, 'RISK_LEVEL') || 'green'),
    confidence,
    physical: normaliseState(grab(raw, 'PHYSICAL')),
    emotional: normaliseState(grab(raw, 'EMOTIONAL')),
    trust: normaliseState(grab(raw, 'TRUST')),
    summary: grab(raw, 'SUMMARY') || 'No summary returned.',
    reasoning: grab(raw, 'REASONING') || raw.slice(0, 400),
    nextStep: grab(raw, 'NEXT_STEP') || 'Talk it through with someone you trust.',
    whatWouldChange: grab(raw, 'WHAT_WOULD_CHANGE') || 'Not enough detail to say.',
  }
}
