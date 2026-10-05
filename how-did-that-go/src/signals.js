// Answer signals: simple, fixed checks run in the browser on the notes you typed.
// No model involved. Every rule is printed in the How it works section.

const RESULT_WORDS = /\b(increas|reduc|grew|growth|cut|sav|launch|shipp|improv|doubl|halv|won|retain|churn|revenue|conversion|adoption|nps|csat|on time|ahead of)/i;
const NUMBER = /(\d+(\.\d+)?\s?%|\b\d{2,}\b|\b\d+x\b|€|£|\$)/;
const EXAMPLE_WORDS = /\b(when i|at (my|a|the)|for example|for instance|once|last (year|quarter)|in my (last|previous|current)|we had|there was a time)\b/i;

export const SIGNAL_RULES = [
  { id: 'result', label: 'Result mentioned', rule: 'Your note contains a number, percentage or currency, or an outcome word such as increased, reduced, launched or retained.' },
  { id: 'example', label: 'Real example', rule: 'Your note points to a specific situation, for example "at my last company", "once", "when I" or "for instance".' },
  { id: 'ownership', label: 'Your part is clear', rule: 'You used "I" at least as often as "we". Interviewers need to hear what you did, not only what the team did.' },
  { id: 'depth', label: 'Enough detail', rule: 'Your note is at least 25 words. Very short notes often mean a thin answer, or simply a rushed note, so treat this one lightly.' },
];

export function answerSignals(answer) {
  const a = String(answer || '');
  const words = a.trim() ? a.trim().split(/\s+/).length : 0;
  const iCount = (a.match(/\bI\b|\bI'(m|ve|d)\b|\bmy\b/g) || []).length;
  const weCount = (a.match(/\bwe\b|\bwe'(re|ve|d)\b|\bour\b|\bteam\b/gi) || []).length;
  return {
    result: NUMBER.test(a) || RESULT_WORDS.test(a),
    example: EXAMPLE_WORDS.test(a),
    ownership: words > 0 && iCount >= weCount && iCount > 0,
    depth: words >= 25,
  };
}
