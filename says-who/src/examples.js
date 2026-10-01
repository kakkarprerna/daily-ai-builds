// Three worked examples with saved results, so visitors without a key
// can see the full output. Results are stored as the same tagged lines
// the model returns, and go through the same parser.

export const EXAMPLES = [
  {
    id: 'cereal',
    title: 'Cereal in the bottle',
    blurb: 'A grandparent tip for a 4-month-old who wakes at night',
    verdictHint: 'Not supported',
    input: {
      advice: 'Put a spoonful of baby rice in her last bottle at night and she will sleep through. That is what we did with all of ours.',
      source: 'Grandparent or relative',
      age: '3 to 6 months',
      topic: 'Sleep',
      country: 'Spain',
      notes: 'She wakes twice a night and we are exhausted.',
    },
    saved: `VERDICT: Not supported
CONFIDENCE: High
HEADLINE: Cereal in the bottle is an older tip that health bodies now advise against, and it doesn't reliably help babies sleep longer.
TRUE: Hunger can wake a young baby, so the thinking behind the tip makes sense.
WRONG: Research hasn't shown that cereal in a bottle helps babies sleep through the night.
WRONG: A thickened bottle raises the risk of choking and of taking in more than the baby needs.
WRONG: At 4 months milk is meant to be the whole diet; solids usually start around 6 months, from a spoon, not a bottle.
POSITION: AEP | Disagrees | Recommends milk only until around 6 months, with solids offered separately after that.
POSITION: WHO | Disagrees | Recommends breast milk only for the first 6 months, with no other foods or drinks.
POSITION: NHS | Disagrees | Says not to add cereal or anything else to a baby's bottle.
POSITION: AAP | Disagrees | Advises against cereal in bottles unless a doctor suggests it for a specific reason such as reflux.
WHY: It was common advice a generation ago, and night waking is so exhausting that any fix gets passed on.
SAFER: Keep the bottle to milk only, and talk to your paediatrician or nurse if night feeds feel unmanageable.
ASK: Your baby still seems hungry after full feeds, or isn't gaining weight as expected.
ASK: Feeds often come back up or seem to hurt, as reflux has its own options.
URGENT: no
LIMITS: This compares the tip with published guidance; it doesn't know your baby's health history, and your paediatrician may advise differently for a medical reason.`,
  },
  {
    id: 'solids',
    title: 'Start solids at 4 months',
    blurb: 'A forum claim that earlier solids prevent allergies',
    verdictHint: 'Mixed',
    input: {
      advice: 'Start solids at 4 months. The earlier the better, it stops them getting food allergies.',
      source: 'Online forum',
      age: '3 to 6 months',
      topic: 'Weaning and solids',
      country: 'United Kingdom',
      notes: '',
    },
    saved: `VERDICT: Mixed
CONFIDENCE: Medium
HEADLINE: Most bodies say start solids at around 6 months, though guidance on allergens really has changed, which is where this tip comes from.
TRUE: Giving common allergens such as egg and peanut early in weaning, rather than holding them back, is now encouraged.
TRUE: Babies with severe eczema or an egg allergy may be advised to try peanut earlier, with medical support.
WRONG: "The earlier the better" isn't right; solids before 17 weeks are advised against everywhere.
WRONG: For most babies, the recommended start is around 6 months, once they show signs of being ready.
POSITION: NHS | Partly | Advises starting around 6 months and bringing in allergens one at a time from then; earlier only on a health professional's advice.
POSITION: WHO | Disagrees | Recommends breast milk only to 6 months, then solids alongside milk.
POSITION: AAP | Partly | Recommends around 6 months, notes some babies are ready between 4 and 6 months, and supports early peanut for higher-risk babies after a doctor's check.
POSITION: AEP | Partly | Recommends around 6 months, never before 4 months, and sees no reason to delay allergens.
WHY: Allergy advice genuinely shifted in the last decade, and the change often gets retold as "start everything early".
SAFER: Aim for around 6 months, when your baby can sit up, hold their head steady and bring food to their mouth, and include allergens early in weaning rather than delaying them.
ASK: Your baby has severe eczema or a known food allergy, before you introduce peanut or egg.
ASK: You think your baby is ready well before 6 months.
URGENT: no
LIMITS: Allergy guidance is still evolving, and this check can't assess your baby's own allergy risk.`,
  },
  {
    id: 'screens',
    title: 'No screens before 2',
    blurb: 'An Instagram rule that even rules out video calls',
    verdictHint: 'Mostly supported',
    input: {
      advice: 'No screens at all before age 2. Not even video calls with grandparents, they confuse the brain.',
      source: 'Social media',
      age: '1 to 2 years',
      topic: 'Screens',
      country: 'Spain',
      notes: 'Her grandparents live in India and we video call most evenings.',
    },
    saved: `VERDICT: Mostly supported
CONFIDENCE: Medium
HEADLINE: Keeping screens to a minimum before 2 matches the guidance, but video calls with family are usually treated differently from watching shows.
TRUE: WHO advises against sedentary screen time for 1-year-olds.
TRUE: Very young children learn far more from people and play than from screens.
WRONG: There's no good evidence that video calls "confuse the brain"; a call is two-way, with a real person responding to your child.
POSITION: AEP | Agrees | Its 2024 update recommends no screens before age 6, which is stricter than WHO or AAP.
POSITION: WHO | Agrees | Recommends no sedentary screen time for 1-year-olds, and no more than 1 hour a day from 2 to 4.
POSITION: AAP | Partly | Advises avoiding screens other than video chatting before 18 months, then only high-quality content watched together.
POSITION: NHS | No clear position | UK guidance from the RCPCH sets no fixed limits, and focuses on screens not replacing sleep, play and family time.
WHY: Screen-time headlines spread fast, and the detail about video calls tends to get lost.
SAFER: Keep screens to a minimum before 2; short video calls with family, with you joining in, are treated as an exception in US guidance, while Spain's AEP takes a stricter line overall.
ASK: You're worried about your child's speech or language.
ASK: Screens are becoming the main way to settle your child.
URGENT: no
LIMITS: Bodies here genuinely differ, so this shows where they stand rather than picking a single right answer for your family.`,
  },
];
