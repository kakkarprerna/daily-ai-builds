// Small shared pieces: a word's picture and the word itself.
export function Pic({ w }) {
  if (w.sw) return <span className="swatch" style={{ background: w.sw }} />;
  if (w.num != null) return <span className="digit">{w.num}</span>;
  return <span className="emoji">{w.pic}</span>;
}

export function Word({ w, lang, noArt }) {
  if (lang === 'zh') {
    return (
      <span>
        <span className="hz">{w.w}</span>
        <span className="py">{w.py}</span>
      </span>
    );
  }
  return (
    <span>
      {w.art && !noArt && <><span className={`art a-${w.art}`}>{w.art}</span>{' '}</>}
      {w.w}
    </span>
  );
}

export function answerText(w, lang) {
  const word = lang === 'zh' ? `${w.w} (${w.py})` : w.art ? `${w.art} ${w.w}` : w.w;
  return `${word} = ${w.en}`;
}
