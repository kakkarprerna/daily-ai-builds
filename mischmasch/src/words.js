// The word bank. Every word here was written in by hand and checked; nothing in this
// file comes from a model.
//
// Level: 3º Primaria at a bilingual school in Spain. English and Spanish are his school
// languages, so they get longer words to spell. German (Paul, Lisa & Co Starter) and
// Chinese (Kuaile Hanyu 1) are both in their first year, so they stay at starter level.
//
// Words marked big: true are stretch words. They are only ever asked in English or
// Spanish; their German and Chinese appear as clues and in the word bank, never as
// something to spell or pick.
//
// Each word has one picture: an emoji (pic), a number (num) or a colour swatch (sw).
// es and de carry their article where the word is a noun. py is pinyin with tone marks,
// one syllable per character, separated by spaces. ph marks a phrase.

export const LANGS = {
  en: { name: 'English', short: 'EN', flag: '🇬🇧', tts: 'en-GB', cheer: 'Great!' },
  es: { name: 'Español', short: 'ES', flag: '🇪🇸', tts: 'es-ES', cheer: '¡Muy bien!' },
  de: { name: 'Deutsch', short: 'DE', flag: '🇩🇪', tts: 'de-DE', cheer: 'Super!' },
  zh: { name: '中文', short: '中文', flag: '🇨🇳', tts: 'zh-CN', cheer: '太棒了!' },
};
export const LANG_IDS = ['en', 'es', 'de', 'zh'];

export const TOPICS = [
  { id: 'hello', name: 'Hello', icon: '👋' },
  { id: 'numbers', name: 'Numbers', icon: '🔢' },
  { id: 'colours', name: 'Colours', icon: '🎨' },
  { id: 'people', name: 'People', icon: '👨‍👩‍👦' },
  { id: 'animals', name: 'Animals', icon: '🐼' },
  { id: 'food', name: 'Food', icon: '🍎' },
  { id: 'school', name: 'School', icon: '🎒' },
  { id: 'body', name: 'Body', icon: '✋' },
  { id: 'play', name: 'Sport & music', icon: '⚽' },
  { id: 'nature', name: 'World around us', icon: '🌍' },
  { id: 'travel', name: 'Getting around', icon: '🚲' },
];

const W = (t, id, look, en, es, de, zh, py, more = {}) => ({ t, id, ...look, en, es, de, zh, py, ...more });

export const WORDS = [
  // Hello (phrases: used in matching and language spotting, never spelled)
  W('hello', 'hello', { pic: '👋' }, 'hello', 'hola', 'hallo', '你好', 'nǐ hǎo', { ph: true }),
  W('hello', 'goodbye', { pic: '🙋' }, 'goodbye', 'adiós', 'tschüss', '再见', 'zài jiàn', { ph: true }),
  W('hello', 'thanks', { pic: '🙏' }, 'thank you', 'gracias', 'danke', '谢谢', 'xiè xie', { ph: true }),
  W('hello', 'please', { pic: '🤲' }, 'please', 'por favor', 'bitte', '请', 'qǐng', { ph: true }),
  W('hello', 'yes', { pic: '👍' }, 'yes', 'sí', 'ja', '是', 'shì', { ph: true }),
  W('hello', 'no', { pic: '👎' }, 'no', 'no', 'nein', '不', 'bù', { ph: true }),

  // Numbers
  W('numbers', 'n1', { num: 1 }, 'one', 'uno', 'eins', '一', 'yī'),
  W('numbers', 'n2', { num: 2 }, 'two', 'dos', 'zwei', '二', 'èr'),
  W('numbers', 'n3', { num: 3 }, 'three', 'tres', 'drei', '三', 'sān'),
  W('numbers', 'n4', { num: 4 }, 'four', 'cuatro', 'vier', '四', 'sì'),
  W('numbers', 'n5', { num: 5 }, 'five', 'cinco', 'fünf', '五', 'wǔ'),
  W('numbers', 'n6', { num: 6 }, 'six', 'seis', 'sechs', '六', 'liù'),
  W('numbers', 'n7', { num: 7 }, 'seven', 'siete', 'sieben', '七', 'qī'),
  W('numbers', 'n8', { num: 8 }, 'eight', 'ocho', 'acht', '八', 'bā'),
  W('numbers', 'n9', { num: 9 }, 'nine', 'nueve', 'neun', '九', 'jiǔ'),
  W('numbers', 'n10', { num: 10 }, 'ten', 'diez', 'zehn', '十', 'shí'),

  // Colours
  W('colours', 'red', { sw: '#e23b3b' }, 'red', 'rojo', 'rot', '红色', 'hóng sè'),
  W('colours', 'blue', { sw: '#2f6fe0' }, 'blue', 'azul', 'blau', '蓝色', 'lán sè'),
  W('colours', 'green', { sw: '#2a9d4b' }, 'green', 'verde', 'grün', '绿色', 'lǜ sè'),
  W('colours', 'yellow', { sw: '#f5c816' }, 'yellow', 'amarillo', 'gelb', '黄色', 'huáng sè'),
  W('colours', 'black', { sw: '#1d1d1f' }, 'black', 'negro', 'schwarz', '黑色', 'hēi sè'),
  W('colours', 'white', { sw: '#ffffff' }, 'white', 'blanco', 'weiß', '白色', 'bái sè'),
  W('colours', 'orange', { sw: '#f08a1c' }, 'orange', 'naranja', 'orange', '橙色', 'chéng sè'),
  W('colours', 'pink', { sw: '#f27fb2' }, 'pink', 'rosa', 'rosa', '粉色', 'fěn sè'),

  // People
  W('people', 'mum', { pic: '👩' }, 'mum', 'la mamá', 'die Mama', '妈妈', 'mā ma'),
  W('people', 'dad', { pic: '👨' }, 'dad', 'el papá', 'der Papa', '爸爸', 'bà ba'),
  W('people', 'baby', { pic: '👶' }, 'baby', 'el bebé', 'das Baby', '宝宝', 'bǎo bao'),
  W('people', 'friend', { pic: '🧑‍🤝‍🧑' }, 'friend', 'el amigo', 'der Freund', '朋友', 'péng you'),
  W('people', 'teacher', { pic: '🧑‍🏫' }, 'teacher', 'el profesor', 'der Lehrer', '老师', 'lǎo shī'),
  W('people', 'pupil', { pic: '🧒' }, 'pupil', 'el alumno', 'der Schüler', '学生', 'xué sheng'),
  W('people', 'birthday', { pic: '🎉' }, 'birthday', 'el cumpleaños', 'der Geburtstag', '生日', 'shēng rì', { big: true }),

  // Animals
  W('animals', 'cat', { pic: '🐱' }, 'cat', 'el gato', 'die Katze', '猫', 'māo'),
  W('animals', 'dog', { pic: '🐶' }, 'dog', 'el perro', 'der Hund', '狗', 'gǒu'),
  W('animals', 'fish', { pic: '🐟' }, 'fish', 'el pez', 'der Fisch', '鱼', 'yú'),
  W('animals', 'bird', { pic: '🐦' }, 'bird', 'el pájaro', 'der Vogel', '鸟', 'niǎo'),
  W('animals', 'horse', { pic: '🐴' }, 'horse', 'el caballo', 'das Pferd', '马', 'mǎ'),
  W('animals', 'cow', { pic: '🐮' }, 'cow', 'la vaca', 'die Kuh', '牛', 'niú'),
  W('animals', 'pig', { pic: '🐷' }, 'pig', 'el cerdo', 'das Schwein', '猪', 'zhū'),
  W('animals', 'sheep', { pic: '🐑' }, 'sheep', 'la oveja', 'das Schaf', '羊', 'yáng'),
  W('animals', 'duck', { pic: '🦆' }, 'duck', 'el pato', 'die Ente', '鸭子', 'yā zi'),
  W('animals', 'rabbit', { pic: '🐰' }, 'rabbit', 'el conejo', 'das Kaninchen', '兔子', 'tù zi'),
  W('animals', 'mouse', { pic: '🐭' }, 'mouse', 'el ratón', 'die Maus', '老鼠', 'lǎo shǔ'),
  W('animals', 'lion', { pic: '🦁' }, 'lion', 'el león', 'der Löwe', '狮子', 'shī zi'),
  W('animals', 'tiger', { pic: '🐯' }, 'tiger', 'el tigre', 'der Tiger', '老虎', 'lǎo hǔ'),
  W('animals', 'elephant', { pic: '🐘' }, 'elephant', 'el elefante', 'der Elefant', '大象', 'dà xiàng'),
  W('animals', 'monkey', { pic: '🐒' }, 'monkey', 'el mono', 'der Affe', '猴子', 'hóu zi'),
  W('animals', 'panda', { pic: '🐼' }, 'panda', 'el panda', 'der Panda', '熊猫', 'xióng māo'),
  W('animals', 'butterfly', { pic: '🦋' }, 'butterfly', 'la mariposa', 'der Schmetterling', '蝴蝶', 'hú dié', { big: true }),
  W('animals', 'spider', { pic: '🕷️' }, 'spider', 'la araña', 'die Spinne', '蜘蛛', 'zhī zhū', { big: true }),
  W('animals', 'octopus', { pic: '🐙' }, 'octopus', 'el pulpo', 'der Oktopus', '章鱼', 'zhāng yú', { big: true }),
  W('animals', 'crocodile', { pic: '🐊' }, 'crocodile', 'el cocodrilo', 'das Krokodil', '鳄鱼', 'è yú', { big: true }),
  W('animals', 'giraffe', { pic: '🦒' }, 'giraffe', 'la jirafa', 'die Giraffe', '长颈鹿', 'cháng jǐng lù', { big: true }),
  W('animals', 'penguin', { pic: '🐧' }, 'penguin', 'el pingüino', 'der Pinguin', '企鹅', 'qǐ é', { big: true }),
  W('animals', 'dinosaur', { pic: '🦕' }, 'dinosaur', 'el dinosaurio', 'der Dinosaurier', '恐龙', 'kǒng lóng', { big: true }),

  // Food
  W('food', 'apple', { pic: '🍎' }, 'apple', 'la manzana', 'der Apfel', '苹果', 'píng guǒ'),
  W('food', 'banana', { pic: '🍌' }, 'banana', 'el plátano', 'die Banane', '香蕉', 'xiāng jiāo'),
  W('food', 'bread', { pic: '🍞' }, 'bread', 'el pan', 'das Brot', '面包', 'miàn bāo'),
  W('food', 'milk', { pic: '🥛' }, 'milk', 'la leche', 'die Milch', '牛奶', 'niú nǎi'),
  W('food', 'water', { pic: '💧' }, 'water', 'el agua', 'das Wasser', '水', 'shuǐ'),
  W('food', 'egg', { pic: '🥚' }, 'egg', 'el huevo', 'das Ei', '鸡蛋', 'jī dàn'),
  W('food', 'rice', { pic: '🍚' }, 'rice', 'el arroz', 'der Reis', '米饭', 'mǐ fàn'),
  W('food', 'cake', { pic: '🍰' }, 'cake', 'la tarta', 'der Kuchen', '蛋糕', 'dàn gāo'),
  W('food', 'cheese', { pic: '🧀' }, 'cheese', 'el queso', 'der Käse', '奶酪', 'nǎi lào'),
  W('food', 'tea', { pic: '🍵' }, 'tea', 'el té', 'der Tee', '茶', 'chá'),
  W('food', 'icecream', { pic: '🍦' }, 'ice cream', 'el helado', 'das Eis', '冰淇淋', 'bīng qí lín'),

  // School
  W('school', 'book', { pic: '📕' }, 'book', 'el libro', 'das Buch', '书', 'shū'),
  W('school', 'pencil', { pic: '✏️' }, 'pencil', 'el lápiz', 'der Bleistift', '铅笔', 'qiān bǐ'),
  W('school', 'school', { pic: '🏫' }, 'school', 'el colegio', 'die Schule', '学校', 'xué xiào'),
  W('school', 'schoolbag', { pic: '🎒' }, 'schoolbag', 'la mochila', 'die Schultasche', '书包', 'shū bāo'),
  W('school', 'table', { pic: '🟫' }, 'table', 'la mesa', 'der Tisch', '桌子', 'zhuō zi'),
  W('school', 'chair', { pic: '🪑' }, 'chair', 'la silla', 'der Stuhl', '椅子', 'yǐ zi'),
  W('school', 'scissors', { pic: '✂️' }, 'scissors', 'las tijeras', 'die Schere', '剪刀', 'jiǎn dāo', { big: true }),
  W('school', 'library', { pic: '🏛️' }, 'library', 'la biblioteca', 'die Bibliothek', '图书馆', 'tú shū guǎn', { big: true }),

  // Body
  W('body', 'hand', { pic: '✋' }, 'hand', 'la mano', 'die Hand', '手', 'shǒu'),
  W('body', 'eye', { pic: '👁️' }, 'eye', 'el ojo', 'das Auge', '眼睛', 'yǎn jing'),
  W('body', 'ear', { pic: '👂' }, 'ear', 'la oreja', 'das Ohr', '耳朵', 'ěr duo'),
  W('body', 'mouth', { pic: '👄' }, 'mouth', 'la boca', 'der Mund', '嘴', 'zuǐ'),
  W('body', 'nose', { pic: '👃' }, 'nose', 'la nariz', 'die Nase', '鼻子', 'bí zi'),
  W('body', 'foot', { pic: '🦶' }, 'foot', 'el pie', 'der Fuß', '脚', 'jiǎo'),

  // Sport & music
  W('play', 'football', { pic: '⚽' }, 'football', 'el fútbol', 'der Fußball', '足球', 'zú qiú'),
  W('play', 'ball', { pic: '🔴' }, 'ball', 'la pelota', 'der Ball', '球', 'qiú'),
  W('play', 'chess', { pic: '♟️' }, 'chess', 'el ajedrez', 'das Schach', '国际象棋', 'guó jì xiàng qí'),
  W('play', 'swimming', { pic: '🏊' }, 'swimming', 'la natación', 'das Schwimmen', '游泳', 'yóu yǒng'),
  W('play', 'tennis', { pic: '🎾' }, 'tennis', 'el tenis', 'das Tennis', '网球', 'wǎng qiú'),
  W('play', 'music', { pic: '🎵' }, 'music', 'la música', 'die Musik', '音乐', 'yīn yuè'),
  W('play', 'piano', { pic: '🎹' }, 'piano', 'el piano', 'das Klavier', '钢琴', 'gāng qín'),
  W('play', 'guitar', { pic: '🎸' }, 'guitar', 'la guitarra', 'die Gitarre', '吉他', 'jí tā'),

  // Nature
  W('nature', 'sun', { pic: '☀️' }, 'sun', 'el sol', 'die Sonne', '太阳', 'tài yáng'),
  W('nature', 'moon', { pic: '🌙' }, 'moon', 'la luna', 'der Mond', '月亮', 'yuè liang'),
  W('nature', 'star', { pic: '⭐' }, 'star', 'la estrella', 'der Stern', '星星', 'xīng xing'),
  W('nature', 'rain', { pic: '🌧️' }, 'rain', 'la lluvia', 'der Regen', '雨', 'yǔ'),
  W('nature', 'snow', { pic: '❄️' }, 'snow', 'la nieve', 'der Schnee', '雪', 'xuě'),
  W('nature', 'tree', { pic: '🌳' }, 'tree', 'el árbol', 'der Baum', '树', 'shù'),
  W('nature', 'flower', { pic: '🌸' }, 'flower', 'la flor', 'die Blume', '花', 'huā'),
  W('nature', 'sea', { pic: '🌊' }, 'sea', 'el mar', 'das Meer', '海', 'hǎi'),
  W('nature', 'house', { pic: '🏠' }, 'house', 'la casa', 'das Haus', '房子', 'fáng zi'),
  W('nature', 'rainbow', { pic: '🌈' }, 'rainbow', 'el arcoíris', 'der Regenbogen', '彩虹', 'cǎi hóng', { big: true }),
  W('nature', 'volcano', { pic: '🌋' }, 'volcano', 'el volcán', 'der Vulkan', '火山', 'huǒ shān', { big: true }),
  W('nature', 'mountain', { pic: '⛰️' }, 'mountain', 'la montaña', 'der Berg', '山', 'shān', { big: true }),
  W('nature', 'river', { pic: '🏞️' }, 'river', 'el río', 'der Fluss', '河', 'hé', { big: true }),
  W('nature', 'island', { pic: '🏝️' }, 'island', 'la isla', 'die Insel', '岛', 'dǎo', { big: true }),
  W('nature', 'desert', { pic: '🏜️' }, 'desert', 'el desierto', 'die Wüste', '沙漠', 'shā mò', { big: true }),
  W('nature', 'forest', { pic: '🌲' }, 'forest', 'el bosque', 'der Wald', '森林', 'sēn lín', { big: true }),
  W('nature', 'planet', { pic: '🪐' }, 'planet', 'el planeta', 'der Planet', '行星', 'xíng xīng', { big: true }),
  W('nature', 'umbrella', { pic: '☂️' }, 'umbrella', 'el paraguas', 'der Regenschirm', '雨伞', 'yǔ sǎn', { big: true }),

  // Getting around
  W('travel', 'car', { pic: '🚗' }, 'car', 'el coche', 'das Auto', '汽车', 'qì chē'),
  W('travel', 'bus', { pic: '🚌' }, 'bus', 'el autobús', 'der Bus', '公共汽车', 'gōng gòng qì chē'),
  W('travel', 'train', { pic: '🚆' }, 'train', 'el tren', 'der Zug', '火车', 'huǒ chē'),
  W('travel', 'plane', { pic: '✈️' }, 'plane', 'el avión', 'das Flugzeug', '飞机', 'fēi jī'),
  W('travel', 'bike', { pic: '🚲' }, 'bike', 'la bicicleta', 'das Fahrrad', '自行车', 'zì xíng chē'),
  W('travel', 'boat', { pic: '⛵' }, 'boat', 'el barco', 'das Schiff', '船', 'chuán'),
  W('nature', 'castle', { pic: '🏰' }, 'castle', 'el castillo', 'die Burg', '城堡', 'chéng bǎo', { big: true }),
];
