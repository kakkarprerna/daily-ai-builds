function grab(text, tag) {
  const re = new RegExp(`^${tag}:\\s*(.+)$`, 'im')
  const match = text.match(re)
  return match ? match[1].trim() : ''
}

function normaliseLevel(raw) {
  const v = raw.toLowerCase()
  if (v.includes('urgent')) return 'urgent'
  if (v.includes('steady')) return 'steady'
  if (v.includes('none') || v.includes('no action') || v.includes('no intervention')) return 'none'
  return 'calm'
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

  const avoid = [1, 2, 3]
    .map((n) => grab(raw, `AVOID_${n}`))
    .filter(Boolean)

  return {
    level: normaliseLevel(grab(raw, 'LEVEL') || 'calm'),
    confidence,
    physical: normaliseState(grab(raw, 'CATEGORY_PHYSICAL')),
    emotional: normaliseState(grab(raw, 'CATEGORY_EMOTIONAL')),
    trust: normaliseState(grab(raw, 'CATEGORY_TRUST')),
    summary: grab(raw, 'SUMMARY') || 'No summary returned.',
    opener: grab(raw, 'OPENER') || 'Could you tell me a bit about what has been going on?',
    avoid: avoid.length ? avoid : ['Leading with anger before you know the full picture.'],
    ifShutsDown: grab(raw, 'IF_SHUTS_DOWN') || 'Give it space and come back to it gently in a day or two.',
    listenFor: grab(raw, 'LISTEN_FOR') || 'Not enough detail to say.',
    whenToGetHelp: grab(raw, 'WHEN_TO_GET_HELP') || 'Trust your judgement, and involve a professional if you are ever unsure.',
  }
}
