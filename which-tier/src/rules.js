// Which Tier? rules engine.
// Every tier, duty and date in the app comes from this file. The model never sets any of them.
// Sources: Regulation (EU) 2024/1689 (the AI Act) as amended by Regulation (EU) 2026/1744 (the AI Omnibus),
// published 24 July 2026, in force 27 July 2026. Article numbers refer to the AI Act.

export const NOT_SURE = 'Not sure';

/* ---------- Options shown as chips ---------- */

export const ROLES = [
  'Provider: we build it or put our name on it',
  "Deployer: we use someone else's system",
  'Both',
  NOT_SURE
];

export const EU_LINKS = [
  'Offered or sold in the EU',
  'Built outside the EU, output used in the EU',
  'Used inside our organisation in the EU',
  'No EU link',
  NOT_SURE
];

export const EXCLUSIONS = [
  'None',
  'Military, defence or national security only',
  'Research and development only, not on the market',
  'Released under a free and open source licence'
];

export const MARKET = [
  'On the EU market before 2 August 2026',
  'Launched on or after 2 August 2026',
  'Not launched yet'
];

export const PRACTICES = [
  { label: 'Manipulative or deceptive techniques that distort behaviour and risk significant harm', ref: 'Art 5(1)(a)', from: '2025-02-02' },
  { label: 'Exploits vulnerabilities from age, disability or social or economic situation', ref: 'Art 5(1)(b)', from: '2025-02-02' },
  { label: 'Scores people on social behaviour or personal traits, leading to unfair treatment elsewhere', ref: 'Art 5(1)(c)', from: '2025-02-02' },
  { label: 'Predicts someone will commit a crime based only on profiling or personality traits', ref: 'Art 5(1)(d)', from: '2025-02-02' },
  { label: 'Builds face recognition databases by untargeted scraping of images', ref: 'Art 5(1)(e)', from: '2025-02-02' },
  { label: 'Infers the emotions of people at work or in education, not for medical or safety reasons', ref: 'Art 5(1)(f)', from: '2025-02-02' },
  { label: 'Uses biometric data to infer race, political views, union membership, religion or sex life', ref: 'Art 5(1)(g)', from: '2025-02-02' },
  { label: 'Real-time remote biometric identification in public spaces for law enforcement', ref: 'Art 5(1)(h)', from: '2025-02-02' },
  { label: 'Generates realistic sexual images of real people without consent, or of children', ref: 'Art 5 as amended by 2026/1744', from: '2026-12-02' }
];

export const PRODUCTS = [
  'None',
  'Medical device or in vitro diagnostic',
  'Machinery',
  'Toys',
  'Lifts',
  'Radio equipment',
  'Personal protective equipment',
  'Other product law in Annex I, Section A',
  'Vehicles, aircraft, rail or marine (Annex I, Section B)',
  NOT_SURE
];
const SECTION_A = PRODUCTS.slice(1, 8);
const SECTION_B = 'Vehicles, aircraft, rail or marine (Annex I, Section B)';

export const THIRD_PARTY = ['Yes, a notified body checks it', 'No, we self-assess', NOT_SURE];

export const AREAS = {
  'None of these': [],
  Biometrics: [
    'Remote biometric identification (not simple identity verification)',
    'Biometric categorisation by sensitive or protected attributes',
    'Emotion recognition'
  ],
  'Critical infrastructure': [
    'Safety component in digital infrastructure, road traffic, or water, gas, heating or electricity supply'
  ],
  'Education and training': [
    'Deciding admission or placing people in schools or courses',
    'Evaluating learning outcomes or steering how someone learns',
    'Assessing what level of education someone gets or can access',
    'Monitoring students for prohibited behaviour during tests'
  ],
  'Employment and workers': [
    'Recruiting: targeted job ads, screening or filtering applications, evaluating candidates',
    'Decisions on promotion, termination or task allocation, or monitoring and evaluating performance'
  ],
  'Essential services': [
    'Eligibility for public benefits or services, or granting, reducing or revoking them',
    'Creditworthiness or credit score of people (fraud detection excluded)',
    'Risk assessment and pricing for life or health insurance',
    'Evaluating or prioritising emergency calls, dispatch or emergency patient triage'
  ],
  'Law enforcement': [
    'Risk assessments about people, by or for police',
    'Polygraph or similar tools',
    'Evaluating how reliable evidence is',
    'Profiling people in detecting, investigating or prosecuting crime'
  ],
  'Migration, asylum and borders': [
    'Polygraph or similar tools at borders',
    "Assessing a person's security, irregular migration or health risk",
    'Examining asylum, visa or residence applications',
    'Detecting, recognising or identifying people (travel document checks excluded)'
  ],
  'Justice and democracy': [
    'Helping a court research or interpret facts and law, or apply the law',
    'Influencing the outcome of an election or referendum, or how people vote'
  ]
};
export const AREA_NAMES = Object.keys(AREAS);
export const OTHER_USE = 'Something else in this area';
export const AREA_REF = {
  Biometrics: 'Annex III, point 1',
  'Critical infrastructure': 'Annex III, point 2',
  'Education and training': 'Annex III, point 3',
  'Employment and workers': 'Annex III, point 4',
  'Essential services': 'Annex III, point 5',
  'Law enforcement': 'Annex III, point 6',
  'Migration, asylum and borders': 'Annex III, point 7',
  'Justice and democracy': 'Annex III, point 8'
};
export const USE_TO_AREA = Object.fromEntries(
  Object.entries(AREAS).flatMap(([a, uses]) => uses.map((u) => [u, a]))
);

export const PROFILING = ['Yes, it evaluates or predicts things about individual people', 'No', NOT_SURE];

export const EXEMPTIONS = [
  'None of these',
  'Only a narrow procedural task',
  'Improves the result of work a person already finished',
  'Spots patterns or deviations from past decisions, without replacing human review',
  'A preparatory task for an assessment'
];

export const TRANSPARENCY = [
  { label: 'People chat or talk with it', ref: 'Art 50(1)', who: 'provider' },
  { label: 'Generates or edits synthetic audio, images, video or text', ref: 'Art 50(2)', who: 'provider' },
  { label: 'Recognises emotions or sorts people by biometric data', ref: 'Art 50(3)', who: 'deployer' },
  { label: 'Makes deepfakes of real people, places or events', ref: 'Art 50(4)', who: 'deployer' },
  { label: 'Writes text published to inform the public on matters of public interest', ref: 'Art 50(4)', who: 'deployer' }
];

export const GPAI = [
  'No general-purpose model involved',
  "Built on someone else's model through an API",
  'We train or release our own general-purpose model',
  NOT_SURE
];
export const SYSTEMIC = ['Yes, over 10^25 FLOPs of training compute', 'No', NOT_SURE];

/* ---------- Dates ---------- */

export const DATES = [
  { date: '2024-08-01', title: 'AI Act enters into force', text: 'Regulation (EU) 2024/1689 becomes law. Most duties start later.' },
  { date: '2025-02-02', title: 'Prohibited practices apply', text: 'The banned uses in Article 5 stop being lawful.' },
  { date: '2025-08-02', title: 'General-purpose model duties apply', text: 'Providers of new general-purpose models must meet Article 53, and Article 55 if the model carries systemic risk.' },
  { date: '2026-07-27', title: 'The AI Omnibus enters into force', text: 'Regulation (EU) 2026/1744 moves the high-risk dates and adds two prohibited practices.' },
  { date: '2026-08-02', title: 'Transparency duties apply', text: 'Article 50 applies on schedule. The Omnibus did not move it.' },
  { date: '2026-12-02', title: 'Marking grace period ends', text: 'Generative systems already on the market before 2 August 2026 must mark their output by now. The new prohibitions on sexual deepfakes also apply.' },
  { date: '2027-08-02', title: 'Legacy general-purpose models', text: 'Models placed on the market before 2 August 2025 must comply.' },
  { date: '2027-12-02', title: 'Annex III high-risk duties apply', text: 'Stand-alone high-risk systems: hiring, education, credit, insurance, essential services, law enforcement and the rest of Annex III.' },
  { date: '2028-08-02', title: 'Annex I high-risk duties apply', text: 'AI that is, or is a safety part of, a product under EU product law, such as medical devices, machinery and toys.' }
];

/* ---------- Duties ---------- */

const D = (id, title, text, ref, from, who) => ({ id, title, text, ref, from, who });

const PROHIBITED_DUTIES = [
  D('stop', 'Do not place it on the market or use it', 'The practice is banned in the EU. Redesign the feature so it no longer does it, or withdraw it from EU users.', 'Art 5', null, 'all'),
  D('fine5', 'Fines at the top of the scale', 'Up to EUR 35 million or 7% of worldwide annual turnover, whichever is higher. Lower caps apply to SMEs.', 'Art 99(3)', null, 'all')
];

const HIGH_PROVIDER = [
  D('risk', 'Risk management system', 'Identify, test and reduce foreseeable risks to health, safety and rights, across the whole life of the system.', 'Art 9', null, 'provider'),
  D('data', 'Data governance', 'Training, validation and test data must be relevant, representative and checked for bias.', 'Art 10', null, 'provider'),
  D('docs', 'Technical documentation', 'Write it before the system goes on the market and keep it current.', 'Art 11, Annex IV', null, 'provider'),
  D('logs', 'Automatic logs', 'The system must record events so its behaviour can be traced.', 'Art 12', null, 'provider'),
  D('instr', 'Instructions for deployers', 'Tell deployers what it is for, how accurate it is, its limits and how to oversee it.', 'Art 13', null, 'provider'),
  D('human', 'Human oversight by design', 'Build in the means for a person to understand, monitor, override or stop it.', 'Art 14', null, 'provider'),
  D('robust', 'Accuracy, robustness and cybersecurity', 'Declare accuracy levels and keep them steady, including against attacks.', 'Art 15', null, 'provider'),
  D('qms', 'Quality management system', 'Written policies and procedures covering design, testing, data and change control.', 'Art 17', null, 'provider'),
  D('ca', 'Conformity assessment and CE marking', 'Assess conformity before launch, sign an EU declaration of conformity and affix the CE mark.', 'Art 43, 47, 48', null, 'provider'),
  D('reg', 'Register in the EU database', 'Register the system before placing it on the market.', 'Art 49', null, 'provider'),
  D('pmm', 'Post-market monitoring and incidents', 'Monitor it in use and report serious incidents to the market surveillance authority.', 'Art 72, 73', null, 'provider')
];

const HIGH_DEPLOYER = [
  D('use', 'Use it as instructed', 'Follow the provider instructions and take the technical and organisational steps they call for.', 'Art 26(1)', null, 'deployer'),
  D('over', 'Assign human oversight', 'Give oversight to people with the competence, training and authority to do it.', 'Art 26(2)', null, 'deployer'),
  D('input', 'Relevant input data', 'Where you control the input data, make sure it fits the intended purpose.', 'Art 26(4)', null, 'deployer'),
  D('mon', 'Monitor and keep logs', 'Watch how it performs, tell the provider about risks, and keep its logs for at least six months.', 'Art 26(5), 26(6)', null, 'deployer'),
  D('work', 'Tell workers first', 'Before using it at work, inform workers and their representatives.', 'Art 26(7)', null, 'deployer'),
  D('inform', 'Tell the people it decides about', 'People subject to decisions it helps make must be told a high-risk system is being used.', 'Art 26(11)', null, 'deployer'),
  D('explain', 'Explain decisions on request', 'People affected by a decision based on its output can ask for a clear explanation.', 'Art 86', null, 'deployer')
];

const FRIA = D('fria', 'Fundamental rights impact assessment', 'Required before use for public bodies, private bodies providing public services, and anyone using it for credit scoring or life and health insurance pricing.', 'Art 27', null, 'deployer');

const EXEMPT_DUTIES = [
  D('doc63', 'Document why it is not high-risk', 'Write down the assessment before it goes on the market and give it to the authority if asked.', 'Art 6(4)', null, 'provider'),
  D('reg63', 'Register it anyway', 'Systems in an Annex III area that rely on this exemption still go in the EU database.', 'Art 49(2)', null, 'provider')
];

const TRANSPARENCY_DUTIES = {
  'People chat or talk with it': D('t1', 'Tell people they are dealing with AI', 'Design it so people know they are interacting with an AI system, unless that is obvious to a reasonable person.', 'Art 50(1)', '2026-08-02', 'provider'),
  'Generates or edits synthetic audio, images, video or text': D('t2', 'Mark synthetic output', 'Output must be marked in a machine-readable format and detectable as AI generated.', 'Art 50(2)', '2026-08-02', 'provider'),
  'Recognises emotions or sorts people by biometric data': D('t3', 'Inform the people exposed', 'Tell people when emotion recognition or biometric categorisation is used on them, and process their data lawfully.', 'Art 50(3)', '2026-08-02', 'deployer'),
  'Makes deepfakes of real people, places or events': D('t4', 'Disclose deepfakes', 'Say that the content was generated or changed by AI. Clearly artistic or satirical work needs a lighter disclosure.', 'Art 50(4)', '2026-08-02', 'deployer'),
  'Writes text published to inform the public on matters of public interest': D('t5', 'Disclose AI-written public interest text', 'Say the text was AI generated, unless a person reviewed it and someone holds editorial responsibility.', 'Art 50(4)', '2026-08-02', 'deployer')
};

const GPAI_OWN = [
  D('g1', 'Technical documentation for the model', 'Keep documentation for the AI Office and national authorities.', 'Art 53(1)(a)', '2025-08-02', 'provider'),
  D('g2', 'Information for downstream providers', 'Give companies building on the model what they need to meet their own duties.', 'Art 53(1)(b)', '2025-08-02', 'provider'),
  D('g3', 'Copyright policy', 'Put a policy in place to respect EU copyright law, including opt-outs from text and data mining.', 'Art 53(1)(c)', '2025-08-02', 'provider'),
  D('g4', 'Training content summary', 'Publish a summary of the content used to train the model, using the AI Office template.', 'Art 53(1)(d)', '2025-08-02', 'provider')
];
const GPAI_SYSTEMIC = D('g5', 'Systemic risk duties', 'Evaluate and adversarially test the model, assess and reduce systemic risks, report serious incidents and keep cybersecurity strong.', 'Art 55', '2025-08-02', 'provider');
const GPAI_DOWNSTREAM = D('g6', 'Ask the model provider for documentation', 'General-purpose model duties sit with the model provider. You are owed the information you need to meet your own duties.', 'Art 53(1)(b)', '2025-08-02', 'provider');

/* ---------- Tiers ---------- */

export const TIERS = {
  out: { label: 'Out of scope', short: 'Out of scope', tone: 'ok', line: 'On these answers, the AI Act does not reach this system.' },
  prohibited: { label: 'Prohibited practice', short: 'Prohibited', tone: 'bad', line: 'This use is banned in the EU. No compliance work makes it lawful.' },
  high3: { label: 'High-risk (Annex III)', short: 'High-risk', tone: 'warn', line: 'The full high-risk regime applies. The heaviest duties start on 2 December 2027.' },
  high1: { label: 'High-risk (product safety)', short: 'High-risk', tone: 'warn', line: 'High-risk as part of a regulated product. Duties start on 2 August 2028, assessed with the product.' },
  sector: { label: 'Sector rules route', short: 'Sector route', tone: 'warn', line: 'AI in vehicles, aircraft, rail and marine reaches the AI Act through that sector type-approval law. Check with the sector regulator.' },
  exempt: { label: 'Annex III, exemption claimed', short: 'Exemption claimed', tone: 'warn', line: 'It sits in a high-risk area but may escape the high-risk duties under Article 6(3). That claim has to be written down and registered.' },
  transparency: { label: 'Transparency duties', short: 'Transparency', tone: 'brand', line: 'Not high-risk, but people must be told they are dealing with AI or AI-made content. These duties apply now.' },
  minimal: { label: 'Minimal risk', short: 'Minimal', tone: 'ok', line: 'No mandatory AI Act duties on these answers. Voluntary codes of conduct are encouraged.' }
};

export const RULES = [
  { id: 'R1', text: 'No EU link, or a military, defence or national security only use, or research not yet on the market: Out of scope (Art 2). A free and open source licence only removes duties for systems that are not prohibited, high-risk or covered by Article 50.' },
  { id: 'R2', text: 'Any practice from the Article 5 list: Prohibited. This beats every other rule.' },
  { id: 'R3', text: 'A product in Annex I, Section A that needs a notified body check: High-risk (product safety), from 2 August 2028 (Art 6(1)). Not sure about the check makes the result provisional.' },
  { id: 'R4', text: 'A product in Annex I, Section B (vehicles, aircraft, rail, marine): Sector rules route (Art 2(2)).' },
  { id: 'R5', text: 'A listed Annex III use that profiles people: High-risk (Annex III), with no exemption possible (Art 6(3), last subparagraph).' },
  { id: 'R6', text: 'A listed Annex III use with no profiling and one of the four Article 6(3) conditions: Exemption claimed. Without a condition: High-risk (Annex III), from 2 December 2027.' },
  { id: 'R7', text: 'Something else in an Annex III area does not make it high-risk on its own. It is listed as an open question.' },
  { id: 'R8', text: 'Any Article 50 situation adds transparency duties. They sit on top of high-risk duties, or set the tier to Transparency when nothing higher applies.' },
  { id: 'R9', text: 'Your own general-purpose model adds Article 53 duties, and Article 55 if training used more than 10^25 FLOPs. Building on someone else\'s model adds a right to their documentation.' },
  { id: 'R10', text: 'Nothing above applies: Minimal risk.' },
  { id: 'C1', text: 'Confidence counts the deciding answers left as Not sure or typed in by hand: none is Firm, one is Provisional, two or more is Open.' },
  { id: 'M1', text: 'A model reads the description and may suggest a different answer for a question. Its quote must appear in the description and its suggestion must be one of the listed options. If either fails, it does not count.' },
  { id: 'M2', text: 'A suggestion never changes an answer by itself. You apply it with one click, and the rules run again.' }
];

/* ---------- Helpers ---------- */

const isProvider = (role) => role === ROLES[0] || role === 'Both';
const isDeployer = (role) => role === ROLES[1] || role === 'Both';
const roleUnclear = (role) => !ROLES.slice(0, 3).includes(role);
const dayMs = 86400000;

export function dayDiff(iso, today) {
  const a = Date.UTC(...iso.split('-').map((n, i) => (i === 1 ? Number(n) - 1 : Number(n))));
  const t = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((a - t) / dayMs);
}

export function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function dutyStatus(from, today) {
  if (!from) return { state: 'now', text: 'Applies now' };
  const n = dayDiff(from, today);
  if (n <= 0) return { state: 'now', text: `In force since ${fmtDate(from)}` };
  return { state: 'soon', text: `Applies from ${fmtDate(from)}`, days: n };
}

/* ---------- The sort ---------- */

export function sortSystem(f) {
  const steps = [];
  const open = [];
  const flips = [];
  const notes = [];
  let tier = null;
  let rule = null;

  const custom = (val, list) => val && !list.includes(val);
  let unsure = 0;
  const unsureOn = (cond, q) => { if (cond) { unsure += 1; open.push(q); } };

  unsureOn(roleUnclear(f.role), 'Are you the provider, the deployer or both? Putting your own name or trademark on a system, or substantially changing it, makes you its provider (Art 25).');
  unsureOn(f.eu === NOT_SURE || custom(f.eu, EU_LINKS), 'Is the system offered in the EU, used by your organisation in the EU, or is its output used in the EU?');

  // R1 scope
  if (f.eu === 'No EU link') {
    tier = 'out'; rule = 'R1';
    steps.push({ id: 'R1', hit: true, text: 'No EU link, so the AI Act does not apply (Art 2(1)).' });
  } else if (['Military, defence or national security only', 'Research and development only, not on the market'].includes(f.exclusion)) {
    tier = 'out'; rule = 'R1';
    steps.push({ id: 'R1', hit: true, text: `${f.exclusion}: excluded under Art 2(3) or 2(6).` });
    flips.push('Any civilian or commercial use, or putting it on the market, brings it back into scope.');
  } else {
    steps.push({ id: 'R1', hit: false, text: 'It has an EU link and no exclusion applies.' });
  }

  // R2 prohibited
  const practices = (f.practices || []);
  const listed = PRACTICES.filter((p) => practices.includes(p.label));
  const customPractices = practices.filter((p) => !PRACTICES.some((x) => x.label === p));
  customPractices.forEach((p) => open.push(`You added "${p}". It has no built-in rule, so check it against Article 5 with legal.`));
  if (!tier && listed.length) {
    tier = 'prohibited'; rule = 'R2';
    steps.push({ id: 'R2', hit: true, text: `Matches ${listed.map((p) => p.ref).join(', ')}.` });
    flips.push('Removing the banned behaviour from the design is the only way out of this tier. Then sort the redesigned feature again.');
    if (listed.some((p) => p.ref === 'Art 5(1)(f)')) notes.push('Emotion inference at work or in education is allowed only for medical or safety reasons. A wellbeing or productivity purpose does not count.');
    if (listed.some((p) => p.ref === 'Art 5(1)(h)')) notes.push('Real-time identification for police has narrow exceptions, such as searching for specific victims, and needs prior authorisation. Those exceptions are for law enforcement bodies only.');
  } else if (!tier) {
    steps.push({ id: 'R2', hit: false, text: 'No Article 5 practice selected.' });
  }

  // R3 and R4 product route
  const product = f.product || 'None';
  unsureOn(product === NOT_SURE || custom(product, PRODUCTS), 'Is the AI part of, or a safety component of, a product covered by EU product safety law (Annex I)?');
  if (!tier && SECTION_A.includes(product)) {
    if (f.thirdParty === THIRD_PARTY[0]) {
      tier = 'high1'; rule = 'R3';
      steps.push({ id: 'R3', hit: true, text: `${product} that needs a notified body check: high-risk under Art 6(1).` });
    } else if (f.thirdParty === THIRD_PARTY[1]) {
      steps.push({ id: 'R3', hit: false, text: `${product}, but self-assessed, so not high-risk through Art 6(1). Annex III is still checked.` });
      flips.push('If the product law requires a notified body for this product class, it becomes high-risk under Art 6(1).');
    } else {
      unsure += 1;
      open.push(`Does the ${product.toLowerCase()} need a third-party conformity assessment under its own law? That decides Art 6(1).`);
      tier = 'high1'; rule = 'R3';
      steps.push({ id: 'R3', hit: true, text: `${product}, notified body check unknown. Treated as high-risk until confirmed.` });
    }
  } else if (!tier && product === SECTION_B) {
    tier = 'sector'; rule = 'R4';
    steps.push({ id: 'R4', hit: true, text: 'Annex I, Section B product: the sector type-approval rules carry the AI Act requirements (Art 2(2)).' });
  } else if (!tier) {
    steps.push({ id: 'R3', hit: false, text: product === 'None' ? 'No regulated product route.' : 'Product route not known yet, so not applied.' });
  }

  // R5 to R7 Annex III
  const area = f.area || 'None of these';
  const uses = AREAS[area];
  const listedUse = uses && uses.includes(f.use);
  const prof = f.profiling;
  if (!uses) {
    unsure += 1;
    open.push(`You added the area "${area}". Annex III is a closed list, so check whether it fits one of the eight areas.`);
  }
  if (uses && area !== 'None of these' && !listedUse) {
    open.push(`${area} is an Annex III area, but the use "${f.use || 'not chosen'}" is not one of the listed uses. Check the exact Annex III wording with legal (R7).`);
    if (!tier) steps.push({ id: 'R7', hit: true, text: `${area}, but not a listed use, so not high-risk on this ground alone.` });
    flips.push(`If the use turns out to match an ${AREA_REF[area]} use, it becomes high-risk from 2 December 2027.`);
  }
  if (listedUse) {
    unsureOn(prof === NOT_SURE || custom(prof, PROFILING), 'Does it profile people, meaning automated evaluation or prediction of things like their work performance, reliability, behaviour or interests?');
  }
  const exemption = f.exemption && f.exemption !== EXEMPTIONS[0];
  if (listedUse && !tier) {
    if (prof === PROFILING[0]) {
      tier = 'high3'; rule = 'R5';
      steps.push({ id: 'R5', hit: true, text: `${AREA_REF[area]}, and it profiles people, so no exemption is possible.` });
      flips.push('Only a different purpose, outside the listed Annex III use, would take it out of high-risk. Removing profiling alone would open the Article 6(3) test.');
    } else if (exemption && prof === 'No') {
      tier = 'exempt'; rule = 'R6';
      steps.push({ id: 'R6', hit: true, text: `${AREA_REF[area]}, no profiling, and "${f.exemption.toLowerCase()}" under Art 6(3).` });
      flips.push('If it starts to replace or materially shape the human decision, or starts profiling, the exemption falls away and it is high-risk.');
      notes.push('Article 6(3) is read narrowly. The Commission guidelines on classification give examples, and the authority can ask for your assessment.');
    } else {
      tier = 'high3'; rule = 'R6';
      steps.push({ id: 'R6', hit: true, text: `${AREA_REF[area]}${exemption ? ', exemption claimed but profiling not ruled out' : ', no Article 6(3) condition'}: high-risk.` });
      flips.push('If it only does a narrow procedural or preparatory task and does not profile people, Article 6(3) may take it out of high-risk.');
    }
  } else if (listedUse && tier) {
    steps.push({ id: 'R5', hit: false, text: `Also in ${AREA_REF[area]}, but a higher rule already applies.` });
  } else if (!listedUse && area === 'None of these' && !tier) {
    steps.push({ id: 'R5', hit: false, text: 'Not in an Annex III area.' });
  }

  // R8 transparency
  const tr = f.transparency || [];
  const trListed = TRANSPARENCY.filter((t) => tr.includes(t.label));
  tr.filter((t) => !TRANSPARENCY.some((x) => x.label === t)).forEach((t) => open.push(`You added "${t}". It has no built-in rule, so check it against Article 50.`));
  if (trListed.length && tier === 'prohibited') {
    steps.push({ id: 'R8', hit: false, text: 'Article 50 would also apply, but the ban comes first.' });
  } else if (trListed.length) {
    if (!tier) { tier = 'transparency'; rule = 'R8'; }
    steps.push({ id: 'R8', hit: true, text: `Article 50 applies: ${[...new Set(trListed.map((t) => t.ref))].join(', ')}.` });
  } else {
    steps.push({ id: 'R8', hit: false, text: 'No Article 50 situation selected.' });
  }

  // R9 GPAI
  const gpai = f.gpai || GPAI[0];
  unsureOn(gpai === NOT_SURE || custom(gpai, GPAI), 'Does it use a general-purpose model, and do you train or release one yourselves?');
  if (gpai === GPAI[2]) {
    steps.push({ id: 'R9', hit: true, text: 'You provide a general-purpose model, so Article 53 applies to the model itself.' });
    if (f.systemic === SYSTEMIC[0]) steps.push({ id: 'R9', hit: true, text: 'Training compute above 10^25 FLOPs: presumed systemic risk, Article 55 applies.' });
    if (f.systemic === NOT_SURE) open.push('Was training compute above 10^25 FLOPs? Above that the model is presumed to carry systemic risk (Art 51).');
  } else if (gpai === GPAI[1]) {
    steps.push({ id: 'R9', hit: true, text: "Built on someone else's general-purpose model: their duties, your right to their documentation." });
  }

  if (!tier) { tier = 'minimal'; rule = 'R10'; steps.push({ id: 'R10', hit: true, text: 'No higher rule applies.' }); }

  if (f.exclusion === 'Released under a free and open source licence') {
    if (['minimal'].includes(tier)) notes.push('Open source release: the AI Act does not apply to this system (Art 2(12)).');
    else notes.push('Open source release does not help here. The exemption does not cover prohibited, high-risk or Article 50 systems.');
  }

  // Duties
  const prov = isProvider(f.role) || roleUnclear(f.role);
  const dep = isDeployer(f.role) || roleUnclear(f.role);
  const groups = [];
  if (tier === 'prohibited') groups.push({ title: 'Because it is prohibited', from: earliest(listed.map((p) => p.from)), duties: PROHIBITED_DUTIES.map((d) => ({ ...d, from: earliest(listed.map((p) => p.from)) })) });
  if (tier === 'high3' || tier === 'high1') {
    const from = tier === 'high3' ? '2027-12-02' : '2028-08-02';
    if (prov) groups.push({ title: 'High-risk duties for the provider', from, duties: HIGH_PROVIDER.map((d) => ({ ...d, from })) });
    if (dep) {
      const list = HIGH_DEPLOYER.map((d) => ({ ...d, from }));
      if (tier === 'high3' && area !== 'Critical infrastructure') list.push({ ...FRIA, from });
      groups.push({ title: 'High-risk duties for the deployer', from, duties: list });
    }
    groups.push({ title: 'If you break them', from, duties: [D('fine3', 'Fines', 'Up to EUR 15 million or 3% of worldwide annual turnover, whichever is higher.', 'Art 99(4)', from, 'all')] });
    if (f.market === MARKET[0] || f.market === MARKET[1]) notes.push('Systems already on the market before the high-risk date are caught when they go through a significant design change after it (Art 111(2)). Systems used by public authorities must comply by 2 August 2030 regardless.');
  }
  if (tier === 'exempt' && !prov) notes.push('As a deployer of a system the provider says is not high-risk, you have no high-risk duties. Ask the provider for their Article 6(4) assessment and check it is registered.');
  if (tier === 'exempt' && prov) groups.push({ title: 'To rely on the Article 6(3) exemption', from: '2027-12-02', duties: EXEMPT_DUTIES.map((d) => ({ ...d, from: '2027-12-02' })) });
  if (tier === 'sector') groups.push({ title: 'Sector route', from: null, duties: [D('sec', 'Follow the sector type-approval rules', 'The AI Act requirements reach these products through implementing acts under the sector law. Ask the sector regulator which apply and when.', 'Art 2(2), 102 to 109', null, 'all')] });

  if (trListed.length && tier !== 'prohibited' && tier !== 'out') {
    const ds = trListed.map((t) => {
      const d = { ...TRANSPARENCY_DUTIES[t.label] };
      if (t.ref === 'Art 50(2)' && f.market === MARKET[0]) d.from = '2026-12-02';
      return d;
    }).filter((d) => (d.who === 'provider' ? prov : dep));
    const skipped = trListed.filter((t) => (t.who === 'provider' ? !prov : !dep));
    skipped.forEach((t) => notes.push(`${t.ref} is a ${t.who} duty. Check the ${t.who} meets it, since it shapes what you can say to users.`));
    if (ds.length) groups.push({ title: 'Transparency duties', from: '2026-08-02', duties: ds });
    if (trListed.some((t) => t.ref === 'Art 50(2)')) {
      if (f.market === MARKET[0]) notes.push('Your generative system was on the market before 2 August 2026, so output marking has a grace period to 2 December 2026. The other Article 50 duties have applied since 2 August 2026.');
      else notes.push('Generative systems launched on or after 2 August 2026 get no grace period for marking output.');
    }
    groups.push({ title: 'If you break them', from: '2026-08-02', duties: [D('fine50', 'Fines', 'Up to EUR 15 million or 3% of worldwide annual turnover, whichever is higher.', 'Art 99(4)', '2026-08-02', 'all')] });
  }

  if (gpai === GPAI[2] && tier !== 'out') {
    const list = [...GPAI_OWN];
    if (f.systemic === SYSTEMIC[0]) list.push(GPAI_SYSTEMIC);
    groups.push({ title: 'General-purpose model duties', from: '2025-08-02', duties: list });
    notes.push('Models placed on the market before 2 August 2025 have until 2 August 2027.');
  } else if (gpai === GPAI[1] && tier !== 'out' && tier !== 'minimal') {
    groups.push({ title: 'Building on a general-purpose model', from: '2025-08-02', duties: [GPAI_DOWNSTREAM] });
  }

  if (tier === 'minimal') flips.push('Adding a chat interface, generated content, or a use from Annex III would move it up a tier.');
  if (tier === 'transparency') flips.push('Using it to decide on hiring, credit, insurance, education, public benefits or another Annex III use would make it high-risk.');

  const confidence = unsure === 0 ? 'Firm' : unsure === 1 ? 'Provisional' : 'Open';

  // Next date that matters for this result
  const allFrom = groups.flatMap((g) => g.duties.map((d) => d.from)).filter(Boolean);
  return { tier, rule, steps, open, flips, notes, groups, confidence, unsure, allFrom, trListed, listed };
}

function earliest(list) {
  return list.filter(Boolean).sort()[0] || null;
}

/* ---------- Model reply ---------- */

export const TOPICS = {
  Role: ROLES.slice(0, 3),
  'EU link': EU_LINKS.slice(0, 4),
  Prohibited: PRACTICES.map((p) => p.label),
  Product: PRODUCTS.slice(0, 9),
  Use: Object.values(AREAS).flat(),
  Profiling: PROFILING.slice(0, 2),
  Exemption: EXEMPTIONS,
  Transparency: TRANSPARENCY.map((t) => t.label),
  GPAI: GPAI.slice(0, 3)
};

const norm = (s) => String(s || '').toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();

export function parseReply(text) {
  const out = { summary: '', signals: [], questions: [] };
  String(text || '').split('\n').forEach((raw) => {
    const line = raw.trim().replace(/^[-*]\s*/, '');
    const parts = line.split('|').map((p) => p.trim());
    const tag = parts[0]?.toUpperCase();
    if (tag === 'SUMMARY' && parts[1]) out.summary = parts[1];
    else if (tag === 'SIGNAL' && parts.length >= 5) out.signals.push({ topic: parts[1], value: parts[2], quote: parts[3], why: parts.slice(4).join(' ') });
    else if (tag === 'QUESTION' && parts[1]) out.questions.push(parts[1]);
  });
  return out;
}

const FIELD = { Role: 'role', 'EU link': 'eu', Prohibited: 'practices', Product: 'product', Use: 'use', Profiling: 'profiling', Exemption: 'exemption', Transparency: 'transparency', GPAI: 'gpai' };
const MULTI = ['Prohibited', 'Transparency'];

export function checkSignals(parsed, form) {
  const desc = norm(form.description);
  const kept = [];
  const dropped = [];
  parsed.signals.forEach((s) => {
    const topic = Object.keys(TOPICS).find((t) => norm(t) === norm(s.topic));
    const value = topic && TOPICS[topic].find((v) => norm(v) === norm(s.value));
    const found = s.quote && desc.includes(norm(s.quote));
    if (!topic || !value) { dropped.push({ ...s, reason: 'The suggestion is not one of the listed answers' }); return; }
    if (!found) { dropped.push({ ...s, reason: 'The quote is not in your description' }); return; }
    const current = form[FIELD[topic]];
    const agrees = MULTI.includes(topic) ? (current || []).includes(value) : current === value;
    kept.push({ ...s, topic, value, field: FIELD[topic], multi: MULTI.includes(topic), agrees, current });
  });
  return { kept, dropped };
}

export function applySignal(form, s) {
  if (s.multi) {
    const list = form[s.field] || [];
    return { ...form, [s.field]: list.includes(s.value) ? list : [...list, s.value] };
  }
  if (s.field === 'use') return { ...form, use: s.value, area: USE_TO_AREA[s.value] };
  return { ...form, [s.field]: s.value };
}

/* ---------- Export ---------- */

export function reportMarkdown(form, r, today, model) {
  const t = TIERS[r.tier];
  const L = [];
  L.push(`# ${form.name || 'AI feature'}: ${t.label}`);
  L.push('');
  L.push(`Sorted with Which Tier? on ${today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}. Confidence: ${r.confidence}. Rule ${r.rule}.`);
  L.push('');
  L.push(`> ${t.line}`);
  L.push('');
  if (form.description) { L.push('## The system'); L.push(''); L.push(form.description); L.push(''); }
  L.push('## Answers');
  L.push('');
  L.push(`- Role: ${form.role}`);
  L.push(`- EU link: ${form.eu}`);
  L.push(`- Market: ${form.market}`);
  L.push(`- Exclusion: ${form.exclusion}`);
  L.push(`- Prohibited practices: ${(form.practices || []).join('; ') || 'none'}`);
  L.push(`- Regulated product: ${form.product}${SECTION_A.includes(form.product) ? ` (notified body: ${form.thirdParty})` : ''}`);
  L.push(`- Annex III: ${form.area}${form.area !== 'None of these' ? `, ${form.use}` : ''}`);
  if (form.area !== 'None of these') L.push(`- Profiling: ${form.profiling}; Article 6(3) condition: ${form.exemption}`);
  L.push(`- Transparency: ${(form.transparency || []).join('; ') || 'none'}`);
  L.push(`- General-purpose model: ${form.gpai}`);
  L.push('');
  L.push('## How the tier was reached');
  L.push('');
  r.steps.forEach((s) => L.push(`- ${s.id}${s.hit ? ' (applied)' : ''}: ${s.text}`));
  L.push('');
  r.groups.forEach((g) => {
    L.push(`## ${g.title}`);
    L.push('');
    g.duties.forEach((d) => L.push(`- **${d.title}** (${d.ref}). ${d.text} ${dutyStatus(d.from, today).text}.`));
    L.push('');
  });
  if (r.notes.length) { L.push('## Notes'); L.push(''); r.notes.forEach((n) => L.push(`- ${n}`)); L.push(''); }
  if (r.flips.length) { L.push('## What would change the tier'); L.push(''); r.flips.forEach((n) => L.push(`- ${n}`)); L.push(''); }
  const qs = [...r.open, ...((model && model.questions) || [])];
  if (qs.length) { L.push('## Open questions for legal or the team'); L.push(''); qs.forEach((q) => L.push(`- ${q}`)); L.push(''); }
  L.push('---');
  L.push('A first sort for a product conversation, not legal advice. Based on Regulation (EU) 2024/1689 as amended by Regulation (EU) 2026/1744.');
  return L.join('\n');
}
