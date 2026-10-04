// Three worked examples with saved results, so anyone can see the app work without a key.
// Results are stored in the same tagged-line format the model returns.

export const EXAMPLES = [
  {
    id: 'words',
    title: 'Few words in a three-language home',
    blurb: '20 months, around eight words across Spanish, English and Hindi.',
    icon: 'MessagesSquare',
    form: {
      age: '18 to 24 months',
      area: 'Speech and language',
      noticed: 'She is 20 months and says about eight words, some in Spanish from nursery and some in English and Hindi from home. She understands a lot, points at what she wants and follows simple instructions like "bring your shoes". Her cousin the same age talks much more.',
      duration: 'A few months',
      direction: 'Slowly getting better',
      regression: false,
      changes: ['New language at home or nursery'],
      languages: 'Spanish, English, Hindi',
      country: 'Spain',
    },
    saved: `VERDICT: Worth watching
CONFIDENCE: Medium
SUMMARY: Eight words across three languages at 20 months sits inside what the guidance describes, and her understanding and pointing are strong signs. The next useful marker is whether she starts joining two words together by around her second birthday.
RANGE: Most children say at least three words besides "mama" and "dada" by 18 months, and put two words together by about 24 months.
SAYS: CDC | By 18 months most children try to say three or more words besides "mama" or "dada", and by 2 years most say at least two words together, such as "more milk".
SAYS: ASHA | Children learning more than one language reach language milestones in the same broad timeframe, and their words should be counted across all languages together.
SAYS: NHS | Understanding usually runs well ahead of speaking at this age, and pointing to show you things is an important early communication skill.
SAYS: AEP | Learning several languages from birth does not cause speech delay, though children may mix languages for a while.
WHY: Counted across Spanish, English and Hindi, she is past the 18 month marker for words.
WHY: Following instructions and pointing to ask for things show her understanding and communication are on track, which matters more at this age than the word count alone.
WHY: It sits at "worth watching" because the two-word stage is only a few months away and is the clearer signal.
TRY: Name what she points at in whichever language comes naturally to you, then pause and give her time to try it.
TRY: Keep each adult to the language they speak most comfortably, rather than switching to help her.
TRY: Keep a simple list of every word she uses in any language for two or three weeks. Most parents undercount.
WATCH: Whether she starts joining two words, such as "more water" or "papá go", in any language by around 24 months.
WATCH: Whether her list of words keeps growing month to month.
CHECK: If she is not joining two words together in any language by about 24 months.
CHECK: If she stops pointing, stops responding to her name, or loses words she used to say.
ASK: Should her words be counted across all three languages when you assess her?
ASK: Would a hearing check be useful, given her speech is coming along slowly?
LIMIT: This check cannot assess her hearing, which is one of the first things a professional would look at for slower speech.`,
  },
  {
    id: 'walking',
    title: 'Not walking at 14 months',
    blurb: 'Crawls fast, pulls up and cruises, but no steps alone yet.',
    icon: 'Footprints',
    form: {
      age: '12 to 18 months',
      area: 'Movement',
      noticed: 'He is 14 months and not walking yet. He crawls very fast, pulls himself up on the sofa and walks along the furniture holding on, but sits down as soon as we let go of his hands. Everyone at the toddler group seems to be walking.',
      duration: 'A few weeks',
      direction: 'Slowly getting better',
      regression: false,
      changes: [],
      languages: 'English',
      country: 'UK',
    },
    saved: `VERDICT: Typical
CONFIDENCE: High
SUMMARY: Not walking alone at 14 months is very common, and pulling up and cruising along furniture are exactly the steps that come before it. He is well inside the range the guidance describes.
RANGE: Children start walking alone anywhere from about 8 to 18 months, with many taking first steps between 12 and 15 months.
SAYS: WHO | The WHO motor milestone study found healthy children begin walking alone across a wide window of roughly 8 to 18 months.
SAYS: NHS | Most babies take their first steps between 12 and 18 months, and parents should speak to a health visitor if a child is not walking by 18 months.
SAYS: CDC | By 15 months most children take a few steps on their own, and by 18 months most walk without holding on.
WHY: Cruising along furniture means his balance and leg strength are developing in the usual order.
WHY: Fast crawling and pulling to stand are both signs his movement skills are progressing.
WHY: At 14 months he is still well before the 18 month point the NHS uses as its prompt to check.
TRY: Give him safe space to cruise between two pieces of furniture, then slowly widen the gap.
TRY: Let him go barefoot indoors, which helps balance more than shoes.
TRY: Skip baby walkers. Health bodies advise against them for safety, and they do not speed up walking.
WATCH: Whether he begins standing alone for a few seconds over the coming weeks.
WATCH: Whether he uses both legs and both arms equally when crawling and cruising.
CHECK: If he is not walking alone by 18 months.
CHECK: If he seems to favour one side of his body, or stops pulling up or cruising.
ASK: Is his muscle tone and leg strength what you would expect for his age?
ASK: Is there anything about how he moves that you would like to see again in a month?
LIMIT: This check cannot see how he moves, which is what a health visitor would look at first.`,
  },
  {
    id: 'lost-words',
    title: 'Stopped using words he had',
    blurb: '2 and a half, used two-word phrases, now rarely speaks.',
    icon: 'CircleAlert',
    form: {
      age: '2 years',
      area: 'Speech and language',
      noticed: 'He is 2 and a half. Six months ago he had about 30 words and said things like "more juice" and "daddy car". Over the last two months he has stopped using most of them and mostly points or leads us by the hand. He also seems less interested in playing with us.',
      duration: 'One to three months',
      direction: 'Getting worse',
      regression: true,
      changes: [],
      languages: 'English',
      country: 'US',
    },
    saved: `VERDICT: Check with a professional
CONFIDENCE: High
SUMMARY: Losing words and phrases he used to say is something every major child health body says should be looked at by a professional, and soon. This does not tell you what is behind it, but it is worth booking an appointment rather than waiting.
RANGE: Children's vocabulary normally keeps growing through the second and third year. Losing words or skills at any age is outside the typical pattern.
SAYS: CDC | Parents should act early and talk to their child's doctor if a child loses skills they once had, at any age.
SAYS: AAP | Any loss of speech, babbling or social skills at any age is a reason to have a child evaluated promptly.
SAYS: NHS | A child losing skills they previously had, such as words or ways of playing, should be seen by a GP or health visitor.
WHY: He had around 30 words and two-word phrases, and has lost most of them over two months.
WHY: Pointing and leading you by the hand instead of speaking, alongside less interest in playing together, is a change in how he connects with you that a professional should see.
WHY: Loss of a skill is treated as a reason to check regardless of age, so this verdict is fixed by the rules, not only by the model.
TRY: Write down the words and phrases he used to say and roughly when, while you still remember them clearly.
TRY: Note when you first noticed the change and anything happening around then, such as illness or ear infections.
TRY: Keep talking, singing and playing with him as usual. Nothing you did caused this.
WATCH: Whether he loses any other skills, such as eye contact, responding to his name, or play he used to enjoy.
WATCH: Any signs of illness, ear pain or hearing changes.
CHECK: Book an appointment with his pediatrician now and describe the loss of words specifically.
CHECK: Under 3s can be evaluated for free through Early Intervention without waiting for a referral.
ASK: Can we have a hearing test and a developmental screening at this visit?
ASK: Should we contact Early Intervention while we wait for any further appointments?
LIMIT: This check cannot say why he has lost words. Only an in-person assessment can do that.`,
  },
];
