// Spoken words come from the device's own speech voices; effects are tiny
// Web Audio tones. Both stay silent when sound is switched off.
import { DATA } from '../data.js';

let voices = [];
const listeners = new Set();

function loadVoices() {
  try { voices = window.speechSynthesis.getVoices() || []; } catch (e) { voices = []; }
  listeners.forEach((fn) => fn());
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  try { window.speechSynthesis.onvoiceschanged = loadVoices; } catch (e) { /* ignore */ }
}

export function onVoicesChanged(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function voiceFor(tag) {
  const t = tag.toLowerCase();
  const norm = (v) => v.lang.replace('_', '-').toLowerCase();
  return voices.find((v) => norm(v) === t) || voices.find((v) => norm(v).startsWith(t.slice(0, 2)));
}

export const canListen = (lang) => !!voiceFor(DATA[lang].tts);

export const sayText = (w, lang) => (lang === 'de' && w.art ? `${w.art} ${w.w}` : w.w);

export function speak(w, lang, on) {
  if (!on || !w || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(sayText(w, lang));
    u.lang = DATA[lang].tts;
    const v = voiceFor(u.lang);
    if (v) u.voice = v;
    u.rate = 0.8;
    window.speechSynthesis.speak(u);
  } catch (e) { /* speech unavailable */ }
}

let ac;
export function beep(ok, on) {
  if (!on) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const notes = ok ? [660, 990] : [260, 190];
    const t0 = ac.currentTime;
    notes.forEach((f, i) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      const t = t0 + i * 0.12;
      o.type = ok ? 'triangle' : 'square';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(ok ? 0.18 : 0.06, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      o.connect(g).connect(ac.destination);
      o.start(t);
      o.stop(t + 0.22);
    });
  } catch (e) { /* audio unavailable */ }
}
