// Splits text into plain and marked segments for the quotes a model returned.
// Matching is case-insensitive and exact; a quote the model paraphrased is
// simply not highlighted (it still appears in the list beside the text).
export function segment(text, marks) {
  const hits = [];
  const lower = (text || '').toLowerCase();
  for (const m of marks) {
    const q = (m.quote || '').trim();
    if (q.length < 3) continue;
    let from = 0;
    let idx = -1;
    // first occurrence that does not overlap an earlier hit
    while ((idx = lower.indexOf(q.toLowerCase(), from)) !== -1) {
      const end = idx + q.length;
      if (!hits.some((h) => idx < h.end && end > h.start)) break;
      from = idx + 1;
    }
    if (idx !== -1) hits.push({ start: idx, end: idx + q.length, ...m });
  }
  hits.sort((a, b) => a.start - b.start);
  const segs = [];
  let pos = 0;
  for (const h of hits) {
    if (h.start > pos) segs.push({ text: text.slice(pos, h.start) });
    segs.push({ text: text.slice(h.start, h.end), mark: h });
    pos = h.end;
  }
  if (pos < (text || '').length) segs.push({ text: text.slice(pos) });
  return { segs, found: hits.length };
}
