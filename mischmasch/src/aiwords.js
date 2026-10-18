// New word sets made by a model, and the checks every line has to pass before a child sees it.
// The model writes tagged lines; anything that fails a check is dropped and listed for the grown-up.

export const SET_TOPICS = [
  { name: 'Space', icon: '🚀' },
  { name: 'Clothes', icon: '👕' },
  { name: 'At the beach', icon: '🏖️' },
  { name: 'Dinosaurs', icon: '🦖' },
  { name: 'In the kitchen', icon: '🍳' },
  { name: 'Toys', icon: '🧸' },
  { name: 'Jungle', icon: '🌴' },
  { name: 'Weather', icon: '⛅' },
];

const HAN = /^\p{Script=Han}{1,4}$/u;
const PY = /^[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]+$/i;
const EMOJI = /\p{Extended_Pictographic}/u;
const WORDISH = /^[\p{L}][\p{L}' -]{0,23}$/u;

export function parseSet(text, bankWords) {
  const words = [];
  const dropped = [];
  let unsuitable = '';
  const seen = new Set(bankWords.map((w) => w.en.toLowerCase()));
  for (const raw of String(text || '').split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('UNSUITABLE|')) { unsuitable = line.slice(11).trim() || 'The model said this topic is not suitable.'; continue; }
    if (!line.startsWith('WORD|')) continue;
    const f = line.split('|').map((x) => x.trim());
    const why = check(f, seen);
    if (why) { dropped.push({ line: f.slice(1).join(' · ').slice(0, 120), why }); continue; }
    const [, pic, en, esArt, es, deArt, de0, zh, py] = f;
    const de = deArt !== '-' && de0 ? de0[0].toUpperCase() + de0.slice(1) : de0;
    seen.add(en.toLowerCase());
    words.push({
      pic, en,
      es: esArt === '-' ? es : `${esArt} ${es}`,
      de: deArt === '-' ? de : `${deArt} ${de}`,
      zh, py: py.toLowerCase().replace(/\s+/g, ' '),
    });
    if (words.length >= 10) break;
  }
  return { words, dropped, unsuitable };
}

function check(f, seen) {
  if (f.length !== 9) return 'Wrong number of parts';
  const [, pic, en, esArt, es, deArt, de, zh, py] = f;
  if (!EMOJI.test(pic) || pic.length > 12) return 'No picture';
  if (!WORDISH.test(en) || !WORDISH.test(es) || !WORDISH.test(de)) return 'A word has odd characters';
  if (!['el', 'la', 'los', 'las', '-'].includes(esArt)) return 'Spanish article is not el, la, los or las';
  if (!['der', 'die', 'das', '-'].includes(deArt)) return 'German article is not der, die or das';
  if (!HAN.test(zh)) return 'Chinese is not 1 to 4 characters';
  const syl = py.toLowerCase().split(/\s+/).filter(Boolean);
  if (syl.length !== [...zh].length) return 'Pinyin does not match the characters';
  if (!syl.every((s) => PY.test(s))) return 'Pinyin has odd characters';
  if (seen.has(en.toLowerCase())) return 'Already in the word bank';
  return '';
}

// Turn a set into words the games can use.
export function setWords(set) {
  return set.words.map((w, i) => ({ ...w, id: `${set.id}-${i}`, t: set.id, ai: set.made === 'ai' }));
}

// Three example sets, written in and checked by hand, so the screen can be tried without a key.
const X = (pic, en, es, de, zh, py) => ({ pic, en, es, de, zh, py });
export const EXAMPLE_SETS = [
  {
    id: 'ex-space', name: 'Space', icon: '🚀', made: 'example',
    words: [
      X('🚀', 'rocket', 'el cohete', 'die Rakete', '火箭', 'huǒ jiàn'),
      X('🧑‍🚀', 'astronaut', 'el astronauta', 'der Astronaut', '宇航员', 'yǔ háng yuán'),
      X('☄️', 'comet', 'el cometa', 'der Komet', '彗星', 'huì xīng'),
      X('🌍', 'Earth', 'la Tierra', 'die Erde', '地球', 'dì qiú'),
      X('👽', 'alien', 'el extraterrestre', 'der Außerirdische', '外星人', 'wài xīng rén'),
      X('🔭', 'telescope', 'el telescopio', 'das Teleskop', '望远镜', 'wàng yuǎn jìng'),
      X('🛰️', 'satellite', 'el satélite', 'der Satellit', '卫星', 'wèi xīng'),
      X('🌌', 'space', 'el espacio', 'der Weltraum', '太空', 'tài kōng'),
    ],
  },
  {
    id: 'ex-clothes', name: 'Clothes', icon: '👕', made: 'example',
    words: [
      X('👒', 'hat', 'el sombrero', 'der Hut', '帽子', 'mào zi'),
      X('👟', 'shoe', 'el zapato', 'der Schuh', '鞋', 'xié'),
      X('🧦', 'sock', 'el calcetín', 'die Socke', '袜子', 'wà zi'),
      X('👗', 'dress', 'el vestido', 'das Kleid', '连衣裙', 'lián yī qún'),
      X('🧥', 'coat', 'el abrigo', 'der Mantel', '大衣', 'dà yī'),
      X('👖', 'trousers', 'el pantalón', 'die Hose', '裤子', 'kù zi'),
      X('🧣', 'scarf', 'la bufanda', 'der Schal', '围巾', 'wéi jīn'),
      X('🧤', 'glove', 'el guante', 'der Handschuh', '手套', 'shǒu tào'),
    ],
  },
  {
    id: 'ex-beach', name: 'At the beach', icon: '🏖️', made: 'example',
    words: [
      X('🏖️', 'sand', 'la arena', 'der Sand', '沙子', 'shā zi'),
      X('🐚', 'shell', 'la concha', 'die Muschel', '贝壳', 'bèi ké'),
      X('🦀', 'crab', 'el cangrejo', 'die Krabbe', '螃蟹', 'páng xiè'),
      X('🌊', 'wave', 'la ola', 'die Welle', '海浪', 'hǎi làng'),
      X('🪣', 'bucket', 'el cubo', 'der Eimer', '水桶', 'shuǐ tǒng'),
      X('🕶️', 'sunglasses', 'las gafas de sol', 'die Sonnenbrille', '太阳镜', 'tài yáng jìng'),
      X('🐬', 'dolphin', 'el delfín', 'der Delfin', '海豚', 'hǎi tún'),
      X('🌟', 'starfish', 'la estrella de mar', 'der Seestern', '海星', 'hǎi xīng'),
    ],
  },
];
