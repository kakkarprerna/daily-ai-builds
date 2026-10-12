// Three worked examples, each with a saved second read so the app works without a key.
// Every quote in the saved replies appears word for word in that example's notes; the M1 check runs on them as normal.

const NUDGE_NOTES = `Nudge is a mobile app for creators and Shopify store owners. It reads their analytics and turns the numbers into goal-based notifications, like "post a reel before 7pm to hit this week's follower goal". Creators already have analytics but nobody tells them what to do with it. We spoke to a handful of creators we know and they loved the idea. We think creators of every size will want this, from nano accounts to the big names. We can recruit the first creators by hand through Instagram and grow through word of mouth after that. We will charge a monthly subscription once people are hooked. The team has built analytics pipelines before, so the data side is the easy part. Plan is to build the full app over the next quarter and launch on both app stores.`;

const NUDGE_TEXT = `SUMMARY|A mobile app that turns a creator's or shop owner's analytics into goal-based notifications telling them what to do next.
ASSUMPTION|We can reach them|Creators can be won cheaply, first by hand and then by word of mouth|grow through word of mouth after that|Nothing yet|No channel has been tried, and word of mouth is assumed rather than seen.
ASSUMPTION|The numbers work|Creators will pay a monthly subscription|We will charge a monthly subscription once people are hooked|Nothing yet|No price has been shown to anyone, and being hooked is assumed.
ASSUMPTION|The problem is real|Creators struggle to know what to do with their analytics|nobody tells them what to do with it|Opinions only|This is the team's reading of creators, not something creators were seen doing.
ASSUMPTION|They will choose it|Creators of every size will want goal-based nudges|they loved the idea|Some behaviour|A handful of friendly creators liked the idea when it was described to them.
ASSUMPTION|They will choose it|Even small accounts have enough data for the nudges to be useful|from nano accounts to the big names|Nothing yet|Small accounts have little data, so their nudges may be thin or obvious.
ASSUMPTION|We can build it|The data side is straightforward because the team has done it before|the data side is the easy part|Some behaviour|The team has built analytics pipelines, though not this one.
QUESTION|When did you last change what you posted because of a number in your analytics? What was the number?
QUESTION|What did you do the last time a post did much worse than you expected?
QUESTION|What do you pay for each month to run or grow your account today?
QUESTION|How did you find the last tool you started paying for?`;

const PIPE_NOTES = `Pipeline Doctor is an AI assistant inside our data integration platform. When a pipeline run fails, it reads the logs, the schema change history and the last good run, then tells the data engineer the likely cause and the fix. We ran 12 interviews with data engineers at customer accounts and 9 described losing at least half a day a week to failed runs. Three design partners have signed letters of intent for a paid pilot. Support tickets tagged 'pipeline failure' are our largest category, so we know the problem shows up at scale. Our customer success team can introduce it to existing accounts at renewal. We have not tried an LLM on our real logs yet, and the logs from on-premise customers are often truncated. Pricing would be an add-on per connected pipeline, but we have not worked out the inference cost per diagnosis. Engineers will see the diagnosis in the run history screen they already use.`;

const PIPE_TEXT = `SUMMARY|An AI assistant in a data integration platform that reads a failed pipeline run and tells the engineer the likely cause and fix.
ASSUMPTION|We can build it|A model can find the cause of a failure from the platform's real logs|We have not tried an LLM on our real logs yet|Nothing yet|The whole product depends on diagnosis quality, and it has not been tried on real logs.
ASSUMPTION|We can build it|Truncated on-premise logs still hold enough to diagnose a failure|the logs from on-premise customers are often truncated|Nothing yet|Missing log lines may hide the cause for a whole group of customers.
ASSUMPTION|The numbers work|The inference cost per diagnosis leaves a margin at a per-pipeline price|we have not worked out the inference cost per diagnosis|Nothing yet|Long logs and schema history make each diagnosis expensive to run.
ASSUMPTION|The problem is real|Failed runs cost data engineers real time every week|Support tickets tagged 'pipeline failure' are our largest category|Strong behaviour|Ticket data shows the problem at scale, and interviews describe the time lost.
ASSUMPTION|They will choose it|Customers will pay for diagnosis on top of the platform|Three design partners have signed letters of intent for a paid pilot|Some behaviour|Signed letters are a commitment, though from three friendly accounts.
ASSUMPTION|We can reach them|Customer success can sell it into existing accounts at renewal|introduce it to existing accounts at renewal|Opinions only|The route exists, but nobody has tried selling an add-on through it.
ASSUMPTION|They can use it|Engineers will notice and trust the diagnosis where they already look|in the run history screen they already use|Opinions only|Placement is planned, but trust in an AI diagnosis is untested.
QUESTION|Walk me through the last pipeline failure you fixed. Where did you look first?
QUESTION|How long did the last failed run take to fix, from alert to green?
QUESTION|What did you do the last time a failure came from a source you could not see logs for?`;

const LENS_NOTES = `Listing Lens lets a seller take three photos and get a draft listing with title, description, category and a suggested price. Sellers abandon about a third of listings at the description step, according to our funnel data. We put a "Write it for me" button on the listing form for two weeks and 7% of sellers who saw it tapped it, against our 5% bar. In 10 seller interviews, 7 said pricing is harder than writing, and 4 showed us they check sold items on rival sites before setting a price. A two-day spike ran 50 real listings through a vision model: 41 drafts were usable without edits, but suggested prices were off by more than 20% on 18 of them. Sellers find us through the app stores and existing buyers, so reach is not new. Inference costs about 2 cents per listing, and listings with photos already sell faster. We have not tested whether sellers trust a suggested price enough to keep it.`;

const LENS_TEXT = `SUMMARY|A second-hand marketplace feature that turns three photos into a draft listing with a suggested price.
ASSUMPTION|They will choose it|Sellers will keep the price the model suggests|We have not tested whether sellers trust a suggested price enough to keep it|Nothing yet|A wrong price loses the sale or the seller's trust, and keeping it is untested.
ASSUMPTION|They will choose it|Sellers want help with pricing more than with writing|7 said pricing is harder than writing|Some behaviour|Most interviewees named pricing as the harder step.
ASSUMPTION|They will choose it|Sellers want the listing written for them|7% of sellers who saw it tapped it|Some behaviour|The button beat the bar the team set before the test.
ASSUMPTION|We can build it|Model drafts are good enough to publish without edits|41 drafts were usable without edits|Some behaviour|A spike on 50 real listings, so a small sample.
ASSUMPTION|The problem is real|Writing the listing is what stops sellers finishing|Sellers abandon about a third of listings at the description step|Strong behaviour|Funnel data shows the drop at that step.
ASSUMPTION|We can reach them|Existing sellers will see it in the flow they already use|reach is not new|Strong behaviour|It sits in the existing listing form.
ASSUMPTION|They can use it|Sellers can take three photos good enough for the model|take three photos|Nothing yet|Poor light or cluttered photos could weaken every draft.
ASSUMPTION|The numbers work|Sellers who use it list more often|sellers love the feature|Opinions only|More listings would pay for the inference.
QUESTION|Tell me about the last item you listed. How did you decide on the price?
QUESTION|When did you last change a price after listing? What made you change it?
QUESTION|What did you do the last time you started a listing and did not finish it?`;

export const EXAMPLES = [
  {
    id: 'nudge',
    sector: 'Creator analytics · my own product',
    title: 'Nudge, run back in time',
    blurb: 'A product we shut down at Ylytic after three months. The notes rebuild the idea as it looked at the start. The tool puts reaching the right creators at the top, which is where it broke.',
    text: NUDGE_TEXT,
    form: {
      name: 'Nudge',
      pitch: 'Analytics turned into goal-based nudges for creators and shop owners',
      segment: 'Small businesses',
      timebox: '4 weeks',
      notes: NUDGE_NOTES,
      assumptions: [
        { id: 'n1', category: 'reach', belief: 'Creators can be won cheaply, first by hand and then by word of mouth', impact: 'Kills the idea', evidence: 'Nothing yet', quote: 'grow through word of mouth after that', source: 'model' },
        { id: 'n2', category: 'viability', belief: 'Creators will pay a monthly subscription', impact: 'Kills the idea', evidence: 'Nothing yet', quote: 'We will charge a monthly subscription once people are hooked', source: 'model' },
        { id: 'n3', category: 'problem', belief: 'Creators struggle to know what to do with their analytics', impact: 'Kills the idea', evidence: 'Opinions only', quote: 'nobody tells them what to do with it', source: 'model' },
        { id: 'n4', category: 'value', belief: 'Creators of every size will want goal-based nudges', impact: 'Kills the idea', evidence: 'Opinions only', quote: 'they loved the idea', source: 'model' },
        { id: 'n5', category: 'usability', belief: 'Creators will act on push notifications rather than mute them', impact: 'Hurts it', evidence: 'Nothing yet', source: 'you' },
        { id: 'n6', category: 'feasibility', belief: 'The data side is straightforward because the team has done it before', impact: 'Hurts it', evidence: 'Some behaviour', quote: 'the data side is the easy part', source: 'model' }
      ]
    }
  },
  {
    id: 'pipeline',
    sector: 'B2B data platform',
    title: 'Pipeline Doctor',
    blurb: 'An AI assistant that diagnoses failed data pipeline runs. Demand has real evidence behind it. Nobody has tried the model on real logs or priced a diagnosis, so the tool says prototype first.',
    text: PIPE_TEXT,
    form: {
      name: 'Pipeline Doctor',
      pitch: 'Tells a data engineer why a pipeline run failed and how to fix it',
      segment: 'Large companies',
      timebox: '4 weeks',
      notes: PIPE_NOTES,
      assumptions: [
        { id: 'p1', category: 'feasibility', belief: 'A model can find the cause of a failure from the platform\'s real logs', impact: 'Kills the idea', evidence: 'Nothing yet', quote: 'We have not tried an LLM on our real logs yet', source: 'model' },
        { id: 'p2', category: 'viability', belief: 'The inference cost per diagnosis leaves a margin at a per-pipeline price', impact: 'Kills the idea', evidence: 'Nothing yet', quote: 'we have not worked out the inference cost per diagnosis', source: 'model' },
        { id: 'p3', category: 'problem', belief: 'Failed runs cost data engineers real time every week', impact: 'Kills the idea', evidence: 'Strong behaviour', quote: "Support tickets tagged 'pipeline failure' are our largest category", source: 'model' },
        { id: 'p4', category: 'value', belief: 'Customers will pay for diagnosis on top of the platform', impact: 'Kills the idea', evidence: 'Some behaviour', quote: 'Three design partners have signed letters of intent for a paid pilot', source: 'model' },
        { id: 'p5', category: 'reach', belief: 'Customer success can sell it into existing accounts at renewal', impact: 'Hurts it', evidence: 'Opinions only', quote: 'introduce it to existing accounts at renewal', source: 'model' },
        { id: 'p6', category: 'usability', belief: 'Engineers will notice and trust the diagnosis where they already look', impact: 'Minor', evidence: 'Opinions only', quote: 'in the run history screen they already use', source: 'model' }
      ]
    }
  },
  {
    id: 'lens',
    sector: 'Second-hand marketplace · GenAI',
    title: 'Listing Lens',
    blurb: 'Three photos in, a draft listing and a price out. A fake door, funnel data and a model spike are already in hand, so the tool says ship a thin slice and test whether sellers keep the price.',
    text: LENS_TEXT,
    form: {
      name: 'Listing Lens',
      pitch: 'Three photos in, a draft listing with a suggested price out',
      segment: 'Consumers',
      timebox: '2 weeks',
      notes: LENS_NOTES,
      assumptions: [
        { id: 'l1', category: 'value', belief: 'Sellers will keep the price the model suggests', impact: 'Hurts it', evidence: 'Nothing yet', test: 'flag-test', quote: 'We have not tested whether sellers trust a suggested price enough to keep it', source: 'model' },
        { id: 'l2', category: 'value', belief: 'Sellers want the listing written for them', impact: 'Kills the idea', evidence: 'Some behaviour', test: 'flag-test', quote: '7% of sellers who saw it tapped it', source: 'model' },
        { id: 'l3', category: 'feasibility', belief: 'Model drafts are good enough to publish without edits', impact: 'Hurts it', evidence: 'Some behaviour', quote: '41 drafts were usable without edits', source: 'model' },
        { id: 'l4', category: 'problem', belief: 'Writing the listing is what stops sellers finishing', impact: 'Kills the idea', evidence: 'Strong behaviour', quote: 'Sellers abandon about a third of listings at the description step', source: 'model' },
        { id: 'l5', category: 'reach', belief: 'Existing sellers will see it in the flow they already use', impact: 'Minor', evidence: 'Strong behaviour', quote: 'reach is not new', source: 'model' },
        { id: 'l6', category: 'viability', belief: 'Inference stays cheap enough per listing', impact: 'Minor', evidence: 'Some behaviour', source: 'you' }
      ]
    }
  }
];
