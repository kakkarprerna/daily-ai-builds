// Words are read aloud by the device's own speech voices. Effects are tiny Web Audio tones.
import { LANGS } from './words.js';

let voices = [];
const listeners = new Set();
function load() {
  try { voices = window.speechSynthesis.getVoices() || []; } catch (e) { voices = []; }
  listeners.forEach((fn) => fn());
}
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  load();
  try { window.speechSynthesis.onvoiceschanged = load; } catch (e) { /* ignore */ }
}
export const onVoices = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

function voiceFor(tag) {
  const t = tag.toLowerCase();
  const norm = (v) => v.lang.replace('_', '-').toLowerCase();
  return voices.find((v) => norm(v) === t) || voices.find((v) => norm(v).startsWith(t.slice(0, 2)));
}
export const hasVoice = (lang) => !!voiceFor(LANGS[lang].tts);

export function say(text, lang, on = true) {
  if (!on || !text || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = LANGS[lang].tts;
    const v = voiceFor(u.lang);
    if (v) u.voice = v;
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  } catch (e) { /* speech unavailable */ }
}

let ac;
export function beep(ok, on = true) {
  if (!on) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const notes = ok ? [660, 880, 1100] : [260, 190];
    const t0 = ac.currentTime;
    notes.forEach((f, i) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      const t = t0 + i * 0.09;
      o.type = ok ? 'triangle' : 'square';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(ok ? 0.16 : 0.05, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g).connect(ac.destination);
      o.start(t);
      o.stop(t + 0.2);
    });
  } catch (e) { /* audio unavailable */ }
}
