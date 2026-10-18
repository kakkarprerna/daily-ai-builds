import React from 'react';
import { Volume2 } from 'lucide-react';
import { LANGS } from './words.js';
import { split, pinyin } from './game.js';
import { say } from './sound.js';

export function Pic({ w }) {
  if (w.num != null) return <span className="pic"><span className="num">{w.num}</span></span>;
  if (w.sw) return <span className="pic"><span className="sw" style={{ background: w.sw }} /></span>;
  return <span className="pic" aria-hidden="true">{w.pic}</span>;
}

export function Flag({ lang, label = false }) {
  const L = LANGS[lang];
  return (
    <span className="badge" title={L.name}>
      <span aria-hidden="true">{L.flag}</span>
      <span className={lang === 'zh' ? 'hz' : ''}>{label ? L.name : L.short}</span>
    </span>
  );
}

// A word in one language, with its article picked out and pinyin for Chinese.
export function Word({ w, lang, showPy = true }) {
  if (lang === 'zh') {
    return (
      <span>
        <span className="hz">{w.zh}</span>
        {showPy && <span className="py">{pinyin(w)}</span>}
      </span>
    );
  }
  const { art, w: word } = split(w, lang);
  return <span>{art && <span className="art">{art} </span>}{word}</span>;
}

export function Speak({ w, lang, on, small = false }) {
  return (
    <button
      type="button"
      className={`iconbtn speak ${small ? 'small' : ''}`}
      aria-label={`Hear it in ${LANGS[lang].name}`}
      onClick={(e) => { e.stopPropagation(); say(w[lang], lang, on); }}
    >
      <Volume2 size={small ? 15 : 18} />
    </button>
  );
}
