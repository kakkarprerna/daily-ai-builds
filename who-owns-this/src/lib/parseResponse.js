// Parses the tagged-line format the serverless function asks the model to
// return. Kept as plain text (not JSON) so the underlying model/provider can
// change without breaking the parser — see /method for why.
//
// Expected shape:
// CANDIDATE: <name>
// CONFIDENCE: <0-100>
// REASONING: <point> | <point> | <point>
// QUESTIONS: <question> | <question>
// ---
// (repeat)
// DRAFT_MESSAGE: <text, \n for line breaks>

export function parseDiagnosis(raw) {
  if (!raw || typeof raw !== 'string') return { candidates: [], draftMessage: '' }

  const [blockSection, draftSection] = raw.split(/DRAFT_MESSAGE:/i)
  const blocks = blockSection
    .split(/^---$/m)
    .map((b) => b.trim())
    .filter(Boolean)

  const candidates = blocks.map((block) => {
    const get = (tag) => {
      const m = block.match(new RegExp(`${tag}:\\s*(.*)`, 'i'))
      return m ? m[1].trim() : ''
    }
    const name = get('CANDIDATE')
    const confidence = parseInt(get('CONFIDENCE').replace(/[^0-9]/g, ''), 10) || 0
    const reasoning = get('REASONING').split('|').map((s) => s.trim()).filter(Boolean)
    const questions = get('QUESTIONS').split('|').map((s) => s.trim()).filter(Boolean)
    return { name, confidence, reasoning, questions }
  }).filter((c) => c.name)

  candidates.sort((a, b) => b.confidence - a.confidence)

  const draftMessage = (draftSection || '').trim().replace(/\\n/g, '\n')

  return { candidates, draftMessage }
}
