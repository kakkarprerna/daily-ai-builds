// Sentence-level diff between two prompts, computed in the browser. No AI involved.

export function segment(text) {
  return (text || '')
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+(?=[A-Z0-9¿¡"'(])/))
    .map((s) => s.trim())
    .filter(Boolean);
}

const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();

export function diffPrompts(a, b) {
  const A = segment(a);
  const B = segment(b);
  const n = A.length;
  const m = B.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = norm(A[i]) === norm(B[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (norm(A[i]) === norm(B[j])) {
      out.push({ type: 'same', text: B[j] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: 'removed', text: A[i++] });
    } else {
      out.push({ type: 'added', text: B[j++] });
    }
  }
  while (i < n) out.push({ type: 'removed', text: A[i++] });
  while (j < m) out.push({ type: 'added', text: B[j++] });
  return out;
}

export function diffStats(parts, a, b) {
  const words = (t) => (t || '').split(/\s+/).filter(Boolean).length;
  return {
    added: parts.filter((p) => p.type === 'added').length,
    removed: parts.filter((p) => p.type === 'removed').length,
    same: parts.filter((p) => p.type === 'same').length,
    wordsA: words(a),
    wordsB: words(b),
  };
}
