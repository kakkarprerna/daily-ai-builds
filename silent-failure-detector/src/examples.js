// Three saved runs. Each holds the inputs and the model's tagged-line report,
// so the full app can be explored without a key.

export const EXAMPLES = [
  {
    id: 'funding',
    title: 'The confident fact sheet',
    domain: 'Company facts',
    blurb: 'A neat answer about a startup\'s founding and Series B. Every detail is precise, and none of it can be traced.',
    question: 'When was Aurora Metrics founded and how much did it raise in its Series B?',
    answer:
      'Aurora Metrics was founded in March 2016 by Elena Cho and raised $42 million in its Series B round in November 2019, led by Highline Ventures.',
    report: `CONFIDENCE: 95 | Flat statements of dates, names and amounts with no caveat at all
VERIFIABILITY: 8
CLAIM: Fabrication risk | founded in March 2016 | Check the company registry; a founding month is easy to invent
CLAIM: Fabrication risk | by Elena Cho | Confirm the founder on the company's own about page or registry filing
CLAIM: Fabrication risk | raised $42 million in its Series B round | Find a press release or filing that states this amount
CLAIM: Unverifiable | in November 2019 | The round date needs a dated announcement to stand up
CLAIM: Fabrication risk | led by Highline Ventures | Check the investor's portfolio page lists this deal
SUMMARY: Every detail is specific and none can be traced to a source. It reads like a fact sheet, which is exactly why nobody would think to check it.
FIX: For private company facts, require a cited source in the answer or have the assistant say it cannot confirm funding details.`,
  },
  {
    id: 'gdpr',
    title: 'Mostly right, quietly wrong',
    domain: 'Legal and policy',
    blurb: 'Two GDPR facts that hold up, then two that sound just as sure and are wrong. The kind of answer a spot-check catches.',
    question: "When did GDPR start applying, and what's the maximum fine?",
    answer:
      "GDPR has applied since 25 May 2018. The maximum fine is €20 million or 4% of a company's worldwide annual turnover, whichever is higher. The regulation was first proposed by the European Commission in 2016, and Spain's regulator, the AEPD, has issued the largest GDPR fine to date.",
    report: `CONFIDENCE: 88 | Assertive throughout, the wrong claims sound as sure as the right ones
VERIFIABILITY: 50
CLAIM: Verified | applied since 25 May 2018 | Matches the date GDPR became enforceable across the EU
CLAIM: Verified | €20 million or 4% of a company's worldwide annual turnover, whichever is higher | Matches Article 83(5) of the regulation
CLAIM: Fabrication risk | first proposed by the European Commission in 2016 | The proposal dates from January 2012; 2016 is when it was adopted
CLAIM: Fabrication risk | the AEPD, has issued the largest GDPR fine to date | The largest fines came from Ireland's Data Protection Commission, not the AEPD
SUMMARY: The two headline facts are correct, which makes the two wrong ones easy to miss. Half the checkable claims fail, stated in the same certain tone.
FIX: Keep answers to the question asked. The extra history and trivia added the errors without adding anything the user needed.`,
  },
  {
    id: 'hedge',
    title: 'The honest "I don\'t know"',
    domain: 'Statistics',
    blurb: 'Asked for a market size it cannot know, the answer says so and points to where a real figure lives.',
    question: "What's the projected market size for AI governance tooling in 2027?",
    answer:
      "I don't have a verified figure for that specific segment in 2027. Broader AI software forecasts vary widely across analysts, so it's worth checking a recent report from a firm like Gartner or IDC rather than relying on a single number here.",
    report: `CONFIDENCE: 16 | Open about what it does not know and avoids giving a number
VERIFIABILITY: 100
CLAIM: Plausible | Broader AI software forecasts vary widely across analysts | Fair general statement; analyst forecasts do differ by method and scope
CLAIM: Verified | a firm like Gartner or IDC | Both publish software market forecasts, so the pointer is sound
HEDGE: I don't have a verified figure for that specific segment in 2027
HEDGE: rather than relying on a single number here
SUMMARY: Nothing here is stated beyond what can be backed up. It declines to invent a figure and tells the user where a real one would come from.
FIX: None needed for accuracy. If users find it unhelpful, add a dated, sourced range rather than a single unsourced number.`,
  },
];
