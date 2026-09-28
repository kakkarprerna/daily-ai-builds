// Three worked examples with saved results, so the app works for anyone without a key.
// Each saved result is stored in the same tagged-line format the model returns,
// so it runs through the same parser as a live check.

export const EXAMPLES = [
  {
    id: 'honey-spain',
    title: 'Supermarket honey blend',
    region: 'Spain',
    tag: 'Adulteration risk',
    blurb: 'A cheap 1 kg jar of blended honey with a mixed origin line.',
    input: {
      product: 'Miel de flores, 1 kg jar, supermarket own label',
      category: 'Honey & spreads',
      region: 'Spain',
      origin: 'Mezcla de mieles originarias y no originarias de la UE: China, Ucrania, España',
      price: 'Budget',
      claims: [],
      dietary: ['Less sugar'],
      mode: 'text',
      ingredients: 'Miel',
    },
    saved: `PRODUCT: Blended multifloral honey, 1 kg supermarket jar
VERDICT: Cheap blended honey with a Chinese share sits in the group most often found bulked out with syrup in EU checks, so trust is limited.
OVERALL: 41
CERTAINTY: medium
CERTAINTY_WHY: The origins are named, but there are no percentages per country and nothing about how the packer tests its honey.
PRODUCTION: 36
PRODUCTION_WHY: Most of this jar is probably imported bulk honey, and an EU sampling exercise in 2021 and 2022 found close to half of imported honey suspicious for added sugar syrup. The Spanish share helps, but it may be small.
PROCESSING: 60
PROCESSING_WHY: Honey needs little processing, but supermarket blends are usually warmed and finely filtered so they stay runny, which removes pollen and makes the origin harder to test.
BEST: Spanish beekeepers selling raw single-origin honey with the area and harvest on the jar, sometimes under a protected name such as Miel de Granada or Miel de La Alcarria.
WORST: Imported bulk honey stretched with rice or beet syrup, filtered so hard its origin cannot be traced, then blended with real honey to hide it.
THEN_NOW: Spain is still the largest honey producer in the EU, but since the early 2000s supermarket shelves have filled with cheap imported blends priced below what local beekeepers can produce for.
PLACEMENT: Nearer the worst end, mainly because of the price tier and the Chinese share rather than anything proven about this particular jar.
GOOD: The countries of origin are named, which Spanish rules have required on honey blends since 2020.
GOOD: A single ingredient with no added flavourings.
CONCERN: The blend includes Chinese honey, the origin with the highest share of suspicious samples in EU testing.
CONCERN: No percentage per country, so the Spanish part could be a few per cent.
CONCERN: Warming and fine filtering are likely at this price.
UNKNOWN: The exact price per kilo. A very low price would push this score down further.
UNKNOWN: Whether the countries are listed from largest share to smallest.
INGREDIENT: Miel (honey) | watch | Sold as pure honey. The real risk is syrup nobody declared, and only a laboratory test can find it.
CHECK: Look for the countries listed with a percentage beside each one. Newer EU rules ask for this on blends.
CHECK: Compare the price per kilo with a local single-origin jar on the same shelf.
CHECK: Look for a protected designation seal, or a beekeeper's name and town on the label.
DIETARY: Less sugar | Honey is around 80% sugar whatever its origin, so a better jar is more honest rather than lower in sugar.
SWAP: A single-origin Spanish honey from a named beekeeper or a protected area, bought in a smaller jar.`,
  },
  {
    id: 'chicken-uk',
    title: 'Standard chicken breast',
    region: 'United Kingdom',
    tag: 'Animal welfare',
    blurb: 'Everyday British chicken fillets from the standard range.',
    input: {
      product: 'Chicken breast fillets, 650 g, standard range',
      category: 'Fresh meat & poultry',
      region: 'United Kingdom',
      origin: 'British chicken',
      price: 'Mid-range',
      claims: ['Red Tractor'],
      dietary: ['Animal welfare', 'Higher protein'],
      mode: 'text',
      ingredients: 'Chicken breast fillet (100%)',
    },
    saved: `PRODUCT: British chicken breast fillets, standard range
VERDICT: Safe and traceable British chicken, raised in the standard indoor system that sits at the lower welfare end of UK practice.
OVERALL: 56
CERTAINTY: high
CERTAINTY_WHY: Standard British chicken under Red Tractor is well documented and the pack is clear about what is in it.
PRODUCTION: 44
PRODUCTION_WHY: The Red Tractor standard allows fast-growing breeds kept indoors at up to 38 kg of bird per square metre, reaching slaughter weight in roughly five to six weeks. Antibiotic use in UK poultry has dropped sharply over the past decade, which helps.
PROCESSING: 92
PROCESSING_WHY: One ingredient with no added water, salt, phosphates or marinade, so nothing was added between the farm and the pack.
BEST: Free-range or organic birds from slower-growing breeds with more space and outdoor access, such as higher-welfare lines that meet the Better Chicken Commitment or RSPCA Assured standards.
WORST: Fast-growing birds kept at the maximum legal density, with leg and skin problems common, sometimes imported under weaker rules.
THEN_NOW: Since the 1950s, meat chickens have been bred to reach slaughter weight in a fraction of the time, and chicken has gone from a treat to the most eaten meat in the UK.
PLACEMENT: In the middle: well above imported or unassured chicken for traceability, well below higher-welfare lines for how the birds lived.
GOOD: British origin with Red Tractor assurance means the farm is audited and the meat can be traced back to it.
GOOD: Nothing added, so you are paying for chicken rather than water or salt.
GOOD: UK poultry now uses far fewer antibiotics than it did ten years ago.
CONCERN: Standard indoor system with fast-growing breeds.
CONCERN: No breed or stocking density on the pack.
UNKNOWN: Whether this supermarket has signed the Better Chicken Commitment for its own-label chicken.
INGREDIENT: Chicken breast fillet (100%) | fine | A single ingredient with nothing added.
CHECK: Look for free range, RSPCA Assured or higher welfare wording if how the birds lived matters to you.
CHECK: Read the small print for added water or salt. This pack has none, but some cheaper packs do.
CHECK: Search for your supermarket's published progress on the Better Chicken Commitment.
DIETARY: Animal welfare | This is where the pack scores lowest. A free-range or higher-welfare breast costs more but deals with it directly.
DIETARY: Higher protein | A good fit: plain breast is lean, high in protein and has nothing added.
SWAP: Free-range or higher-welfare chicken breast, or higher-welfare thighs at a similar price per kilo.`,
  },
  {
    id: 'bread-us',
    title: 'Budget white sandwich bread',
    region: 'United States',
    tag: 'Additives',
    blurb: 'A soft white loaf with a long ingredient list.',
    input: {
      product: 'Enriched white sandwich bread, 20 oz loaf',
      category: 'Bread & bakery',
      region: 'United States',
      origin: 'Made in USA',
      price: 'Budget',
      claims: [],
      dietary: ['Fewer additives', 'Less sugar'],
      mode: 'text',
      ingredients:
        'Enriched wheat flour (flour, niacin, reduced iron, thiamine mononitrate, riboflavin, folic acid), water, high fructose corn syrup, yeast, soybean oil, salt, wheat gluten, calcium propionate (preservative), monoglycerides, DATEM, calcium sulfate, soy lecithin, azodicarbonamide, potassium bromate',
    },
    saved: `PRODUCT: Enriched white sandwich loaf, budget range
VERDICT: A typical budget US loaf with two flour treatments that the UK and EU do not allow. Legal where it is sold, but far from the best bread on offer.
OVERALL: 29
CERTAINTY: high
CERTAINTY_WHY: The full ingredient list is printed and every item on it is well understood.
PRODUCTION: 52
PRODUCTION_WHY: The wheat, corn and soy behind this loaf are most likely large-scale US commodity crops. Nothing here is unusual for American farming, and nothing points to better practice either.
PROCESSING: 17
PROCESSING_WHY: Fourteen ingredients, including high fructose corn syrup, emulsifiers, a preservative and two flour treatments, potassium bromate and azodicarbonamide, that are not permitted in UK or EU bread.
BEST: Bakery bread made from flour, water, salt and yeast or a sourdough starter, sometimes from regional wheat, with nothing added to keep it soft for weeks.
WORST: Loaves engineered for a long shelf life, with added sweetener and flour treatments that other countries have already removed.
THEN_NOW: From the 1960s, American supermarket bread moved to high-speed factory baking that leans on conditioners and sweeteners to keep loaves soft for weeks.
PLACEMENT: Close to the worst end for processing. The farming side is ordinary rather than poor.
GOOD: Enriched flour puts back some of the B vitamins and iron lost in milling, and the folic acid is a public health measure.
GOOD: The ingredient list is complete and clear.
CONCERN: Potassium bromate is rated a possible cause of cancer by the WHO's cancer agency, is banned in the UK, EU and Canada, and California has banned it from 2027.
CONCERN: Azodicarbonamide is not allowed as a flour treatment in the EU or the UK.
CONCERN: High fructose corn syrup is the third ingredient.
UNKNOWN: Sugar per slice, which sits on the nutrition panel rather than the ingredient list.
INGREDIENT: Enriched wheat flour | fine | Refined white flour with vitamins and iron added back.
INGREDIENT: High fructose corn syrup | watch | Added sweetener that plain bread does not need.
INGREDIENT: Calcium propionate | fine | A common mould inhibitor, allowed in the EU and UK too.
INGREDIENT: Monoglycerides, DATEM, soy lecithin | fine | Emulsifiers that keep the crumb soft. All three are permitted in the EU.
INGREDIENT: Azodicarbonamide | flag | Makes dough easier for machines to handle. Not permitted in EU or UK flour.
INGREDIENT: Potassium bromate | flag | Strengthens dough. Banned in the UK, EU and Canada over cancer concerns.
CHECK: Look for bromate-free or no bromated flour on other loaves on the same shelf. Many US brands have dropped it.
CHECK: Compare sugar per slice on the nutrition panels of two or three loaves.
CHECK: A shorter ingredient list usually means fewer conditioners.
DIETARY: Fewer additives | This loaf carries at least seven additives, two of them flagged, so it is a poor match.
DIETARY: Less sugar | High fructose corn syrup is the third ingredient. A plain bakery loaf usually has no added sugar at all.
SWAP: A bakery or supermarket loaf with five or six ingredients and unbromated flour, or a sourdough.`,
  },
];
