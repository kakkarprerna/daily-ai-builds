// Fixed safety rules that run in the browser, before and alongside the model.
// They don't depend on any AI call, so they work even if the model is down.
// Each rule applies only while the child is under `untilMonths`.

export const AGE_BANDS = [
  { label: '0 to 3 months', min: 0 },
  { label: '3 to 6 months', min: 3 },
  { label: '6 to 12 months', min: 6 },
  { label: '1 to 2 years', min: 12 },
  { label: '2 to 3 years', min: 24 },
];

export const RULES = [
  {
    id: 'honey',
    title: 'Honey before 12 months',
    untilMonths: 12,
    test: /\bhoney\b|\bmiel\b/i,
    note: 'Honey can carry spores that cause infant botulism. No honey at all, even in cooking or on a dummy, until after the first birthday.',
    bodies: 'NHS, AAP, AEP',
  },
  {
    id: 'sleep-position',
    title: 'Tummy or side sleeping',
    untilMonths: 12,
    test: /(sleep\w*|put\w*|lay\w*|nap\w*).{0,30}\b(on (her|his|their|the|its) )?(tummy|front|side|stomach)\b|\b(tummy|front|side)[- ]sleep/i,
    note: 'Babies should go down on their back for every sleep in the first year. Back sleeping lowers the risk of sudden infant death.',
    bodies: 'NHS, AAP, AEP',
  },
  {
    id: 'soft-bedding',
    title: 'Pillows, bumpers or soft toys in the cot',
    untilMonths: 12,
    test: /(pillow|bumper|duvet|quilt|soft toy|stuffed (animal|toy)|teddy).{0,40}(cot|crib|bassinet|moses basket|sleep)|(cot|crib|bassinet|sleep).{0,40}(pillow|bumper|duvet|quilt|soft toy|stuffed|teddy)/i,
    note: 'Keep the sleep space clear: a firm, flat mattress, with no pillows, bumpers, duvets or soft toys in the first year.',
    bodies: 'NHS, AAP',
  },
  {
    id: 'incline',
    title: 'Sleeping on an incline or in a seat',
    untilMonths: 12,
    test: /\b(inclined?|wedge|positioner)\b|sleep\w* in (the |a |her |his )?(car ?seat|swing|bouncer|rocker)/i,
    note: 'Sleep should be on a flat, firm surface. AAP advises against inclined sleepers, wedges and positioners, and against routine sleep in car seats, swings or bouncers.',
    bodies: 'AAP, NHS',
  },
  {
    id: 'cereal-bottle',
    title: 'Cereal in the bottle',
    untilMonths: 12,
    test: /(cereal|baby rice|rice|porridge|oats?|papilla).{0,40}bottle|bottle.{0,40}(cereal|baby rice|porridge|oats?|papilla)/i,
    note: "Cereal in a bottle doesn't reliably help sleep, and it raises the risk of choking and overfeeding. Keep bottles to milk only.",
    bodies: 'AAP, NHS',
  },
  {
    id: 'aspirin',
    title: 'Aspirin for children',
    untilMonths: 36,
    test: /\baspirin|aspirina|acetylsalicylic/i,
    note: "Aspirin isn't given to children under 16 unless a doctor prescribes it, because of a link with Reye's syndrome.",
    bodies: 'NHS',
  },
  {
    id: 'cough-cold',
    title: 'Cough and cold medicines',
    untilMonths: 36,
    test: /(cough|cold|decongestant)\s*(medicine|syrup|remedy|medication|mixture)|\bjarabe\b/i,
    note: 'Over-the-counter cough and cold medicines are not advised for young children. FDA says not under 2, AAP says not under 4, and UK guidance says not under 6.',
    bodies: 'FDA, AAP, MHRA',
  },
  {
    id: 'choking',
    title: 'Choking foods',
    untilMonths: 36,
    test: /\bwhole (grapes?|nuts?|peanuts?|cherry tomato(es)?|olives?)\b|\b(grapes?|nuts|peanuts|cherry tomato(es)?)\b.{0,25}\bwhole\b|\bpopcorn\b|\bhard (sweets?|candy)\b/i,
    note: 'Whole grapes, whole nuts and popcorn are choking hazards. Cut round foods lengthways into quarters, and offer nuts only crushed or as smooth nut butter. NHS advises no whole nuts under 5.',
    bodies: 'NHS, AAP',
  },
  {
    id: 'cows-milk',
    title: "Cow's milk as the main drink",
    untilMonths: 12,
    test: /(cow'?s'? milk|whole milk|leche de vaca).{0,60}(main drink|instead of|replace|swap|switch|bottle)|(main drink|switch|swap).{0,30}(cow'?s'? milk|whole milk)/i,
    note: "Cow's milk can go into cooking from around 6 months, but it shouldn't be the main drink until 12 months.",
    bodies: 'NHS, AAP',
  },
  {
    id: 'salt',
    title: 'Added salt',
    untilMonths: 12,
    test: /(add|adding|bit of|pinch of|little)\s+(salt|stock cube)|\bsalt\b.{0,30}(food|puree|purée|meal|vegetables)/i,
    note: "Don't add salt to a baby's food or cooking water. Stock cubes and gravy are high in salt too.",
    bodies: 'NHS',
  },
  {
    id: 'teething-gel',
    title: 'Numbing gels or alcohol for teething',
    untilMonths: 36,
    test: /(benzocaine|numbing gel|lidocaine|whisk(e)?y|brandy|rum|alcohol).{0,40}(gum|teeth|teething)|(gum|teeth|teething).{0,40}(benzocaine|numbing|lidocaine|whisk|brandy|rum|alcohol)/i,
    note: 'FDA warns against benzocaine teething products for under-2s, and alcohol on the gums is unsafe at any age. A chilled teething ring or gentle gum rubbing is the usual first step.',
    bodies: 'FDA, NHS',
  },
  {
    id: 'necklace',
    title: 'Teething necklaces or bracelets',
    untilMonths: 36,
    test: /(amber|teething|baltic)\s+(necklace|bracelet|anklet|beads)/i,
    note: 'FDA warns that teething necklaces and bracelets can cause strangulation and choking.',
    bodies: 'FDA, AAP',
  },
  {
    id: 'coat-car-seat',
    title: 'Bulky coats in the car seat',
    untilMonths: 36,
    test: /(coat|snowsuit|puffer|padded jacket|pram suit).{0,40}car ?seat|car ?seat.{0,40}(coat|snowsuit|puffer|padded)/i,
    note: "Bulky coats stop the harness fitting snugly. Use thin layers, and lay a blanket over the child once they're buckled in.",
    bodies: 'AAP, RoSPA',
  },
  {
    id: 'walker',
    title: 'Baby walkers',
    untilMonths: 24,
    test: /\bbaby walkers?\b|\bandador\b|\bwalker\b.{0,30}(walk|learn|early)/i,
    note: "AAP advises against baby walkers. They lead to falls and injuries, and they don't help babies learn to walk.",
    bodies: 'AAP',
  },
];

export function matchRules(text, ageLabel) {
  const band = AGE_BANDS.find((b) => b.label === ageLabel);
  const ageMin = band ? band.min : 0; // unknown or custom age: show every rule that matches
  return RULES.filter((r) => ageMin < r.untilMonths && r.test.test(text || ''));
}

// Signs that a child may need help right now. Checked live as the parent types.
const URGENT_PATTERN =
  /not breathing|stopped breathing|struggling to breathe|can'?t breathe|blue (lips|skin|face)|turning blue|seizure|convuls|won'?t wake|hard to wake|floppy|unresponsive|swallowed (a |some )?(button )?(battery|magnet|bleach|detergent|pills?|tablets?|medicine)|rash that (doesn'?t|won'?t) fade|non-?blanching|choking now|is choking|fever.{0,40}(under|less than|younger than) (3|three) months|(newborn|[12]\s*(-|to)?\s*(week|month)s?[- ]old).{0,40}(fever|temperature)/i;

export function looksUrgent(text) {
  return URGENT_PATTERN.test(text || '');
}
