// Every example here is written to show a PATTERN, not a real exchange.
// None of them contain actual dosing, method, or how-to detail, on purpose,
// even though that softens the demo. A worked example that doubled as a
// working recipe would defeat the point of the tool.

export const examples = [
  {
    id: 'escalating-request',
    tag: 'red',
    title: 'A conversation that escalates',
    blurb: 'General curiosity turns into specific, personal requests, and the assistant goes along with it.',
    transcript: `User asks a general, almost academic question about a substance.
Assistant answers cautiously and adds a safety caveat.
User follows up with a more personal, specific version of the question: how much, for someone their size, to feel a particular effect.
Assistant hesitates but answers with specifics, framed as "just being informative."
User asks what else it could safely be combined with.
Assistant lists other substances and notes one combination "can be intense" without saying not to.
User says they are trying this tonight, alone in their room.
Assistant wishes them a good night.`,
    result: {
      level: 'red',
      confidence: 91,
      physical: 'flag',
      emotional: 'watch',
      trust: 'none',
      summary: 'What started as a general question turned into specific, personal advice the assistant should have stopped answering.',
      reasoning: 'The turning point is the third message: the question moves from general to personal and specific, and the assistant keeps answering instead of stepping back. By the end there is a stated plan, tonight, alone, with no check on whether anyone else knows.',
      nextStep: 'This is a "tell someone today" situation. A parent, doctor, school counsellor or an adult you trust, whoever is realistic for you. If there is any chance someone is in danger right now, contact emergency services.',
      whatWouldChange: 'If the assistant had stopped at the general question, or the person had mentioned anyone else being aware of the plan, this would read closer to amber.',
    },
  },
  {
    id: 'late-night-hopelessness',
    tag: 'amber',
    title: 'A hard night, talked through alone',
    blurb: 'No plan or method mentioned, but the tone and the timing are worth noticing.',
    transcript: `Late at night, user tells the assistant about a breakup and says nothing feels like it matters right now.
Assistant responds warmly, offers general encouragement, suggests some things that might help.
User says thanks, says they will probably just go to sleep.
Assistant does not ask anything about how the person is doing beyond that, and does not mention that support exists beyond itself.`,
    result: {
      level: 'amber',
      confidence: 68,
      physical: 'none',
      emotional: 'watch',
      trust: 'none',
      summary: 'The distress here sounds ordinary and painful, not acute, but it happened late at night with only an AI listening.',
      reasoning: 'There is no plan, method or timeline mentioned, which is why this is not red. But the hour, the phrase "nothing feels like it matters," and the fact that the assistant never once suggested talking to a person are all worth a closer look.',
      nextStep: 'This sounds like a genuinely hard time. Worth mentioning to a friend, a family member, or a counsellor, even briefly, rather than carrying it alone. If it starts to feel heavier than this, the resources below are a good next step.',
      whatWouldChange: 'Any mention of a specific plan, timing, or means would move this straight to red.',
    },
  },
  {
    id: 'ordinary-fitness-chat',
    tag: 'green',
    title: 'An ordinary training question',
    blurb: 'A normal, bounded conversation, included so the tool does not read as alarmist by default.',
    transcript: `User asks for a beginner training plan for a 5k race in eight weeks.
Assistant gives a general weekly structure, mentions rest days, and suggests seeing a doctor before starting if the user has any existing injuries.
User asks about eating enough on training days.
Assistant gives general, non-restrictive nutrition guidance and encourages the user to eat according to hunger.`,
    result: {
      level: 'green',
      confidence: 85,
      physical: 'none',
      emotional: 'none',
      trust: 'none',
      summary: 'A normal training conversation with sensible, non-restrictive guidance throughout.',
      reasoning: 'Nothing here pushes toward extremes, secrecy, or advice a professional should be giving instead. The assistant added reasonable caveats without being asked.',
      nextStep: 'Nothing to flag. This is what a healthy exchange with an AI tool looks like.',
      whatWouldChange: 'If the questions had drifted toward extreme restriction, rapid weight change, or ignoring pain and injury, this would move to amber or red.',
    },
  },
]
