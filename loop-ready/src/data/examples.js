// Three worked examples with saved model output, so visitors without a key
// can see the whole flow. Companies and JDs are fictional.

export const EXAMPLES = [
  {
    id: 'ai-assistant',
    label: 'AI assistant PM, 7 days',
    blurb: 'B2B SaaS company shipping an LLM assistant. Heavy on evals and AI judgement.',
    input: {
      company: 'Tessellate',
      role: 'Senior Product Manager, AI Assistant',
      days: 7,
      stages: ['Recruiter screen', 'Hiring manager', 'AI / ML product', 'Product sense / design', 'Behavioural', 'Final / executive'],
      background: '',
      jd: `Tessellate builds a knowledge platform used by 4,000 support and operations teams. We are looking for a Senior Product Manager to own Tessellate Assist, the AI assistant that answers employee questions from a company's own documents.

What you will do
- Own the roadmap for Assist, from retrieval quality to the answer experience.
- Define how we measure answer quality and build an evaluation practice with our ML engineers, including offline eval sets and human review.
- Decide when the assistant should answer, ask a clarifying question, or hand off to a human.
- Work with design to make AI uncertainty visible and trustworthy to end users.
- Partner with sales and customer success on enterprise rollouts, including security and data-retention questions.

What we are looking for
- 6+ years in product management, including at least one shipped LLM or ML-powered feature.
- Comfort discussing retrieval-augmented generation, evaluation methods and model trade-offs with engineers.
- Strong product judgement and a record of making calls with incomplete data.
- Clear written communication; we work async across Europe.
- Experience with enterprise B2B customers is a plus.`,
    },
    output: `SUMMARY|A PM who can own answer quality for an enterprise LLM assistant, defining evals and trust in the UX, not just shipping features.
SIGNAL|Evaluation of AI output|build an evaluation practice with our ML engineers
SIGNAL|Answer, clarify or hand off decisions|when the assistant should answer, ask a clarifying question, or hand off
SIGNAL|Trust and visible uncertainty|make AI uncertainty visible and trustworthy
SIGNAL|Technical fluency on RAG|discussing retrieval-augmented generation, evaluation methods
SIGNAL|Judgement under ambiguity|making calls with incomplete data
SIGNAL|Async written communication|Clear written communication; we work async
STAGE|1|Recruiter screen|Fit on seniority, a shipped LLM feature, async working style and salary range.|Low
PREP|1|Write a 60 second pitch that names one shipped LLM or ML feature and the quality metric you owned for it.
PREP|1|Decide your salary range before the call and prepare a short line on location and async preferences.
RES|1|levels-fyi|Gives you a market anchor for a Senior PM range before the salary question comes up.
PRACTICE|1|Walk me through an AI feature you shipped and how you knew it was working.
PRACTICE|1|Why Tessellate, and why now?
TRAP|1|Describing AI work only as "integrating a model" without saying what you measured or decided.
STAGE|2|Hiring manager|Depth on the Assist roadmap: how you would prioritise retrieval quality against answer experience.|Medium
PREP|2|Sketch a first 90 days for Assist: what you would measure first, who you would talk to, one early bet.
PREP|2|Prepare one example of a call you made with incomplete data and what you would do differently.
RES|2|ost|Helps you show how you would connect an answer-quality outcome to customer problems and bets.
RES|2|mit-star|Use the worksheet to shape the incomplete-data story so it lands in under two minutes.
PRACTICE|2|Retrieval is weak but the answer UI is what customers complain about. Where do you start?
PRACTICE|2|How would you set goals for Assist in your first quarter?
TRAP|2|Jumping to features before stating the outcome you are trying to move.
STAGE|3|AI / ML product|Your grasp of evals, RAG trade-offs and the answer, clarify or hand off decision.|High
PREP|3|Draft a three-level eval plan for Assist: automated checks, human review sample, then an online test.
PREP|3|Write a simple decision rule for answer, clarify or hand off, and what signal triggers each.
PREP|3|Be ready to explain in plain words why retrieval failures and generation failures need different fixes.
RES|3|hamel-evals|Matches the JD's ask for offline eval sets plus human review almost exactly.
RES|3|yan-llm-patterns|Covers RAG, guardrails and defensive UX, the vocabulary this round will use.
RES|3|anthropic-agents|Useful for the hand-off question: when a simpler workflow beats a more autonomous agent.
PRACTICE|3|How would you measure whether Assist's answers are good enough to roll out to a new enterprise customer?
PRACTICE|3|The assistant answers confidently but wrongly 5% of the time. What do you do?
TRAP|3|Treating a single accuracy number as enough, with no plan for human review or failure categories.
STAGE|4|Product sense / design|Designing an answer experience that shows uncertainty and earns trust.|Medium
PREP|4|Prepare a quick sketch of how Assist could show sources and confidence without cluttering the answer.
PREP|4|Pick two AI products you use and note how each handles being unsure.
RES|4|pair-guidebook|Directly about explaining AI output and setting user expectations, the JD's trust theme.
RES|4|lenny-product-sense|A refresher on structuring a design answer around user needs first.
PRACTICE|4|Design the experience when Assist is not confident enough to answer.
PRACTICE|4|How would you make an admin trust Assist enough to switch it on for 2,000 employees?
TRAP|4|Designing for the happy path only and skipping the wrong-answer moment.
STAGE|5|Behavioural|Ownership, written communication and working across sales and customer success.|Medium
PREP|5|Prepare four STAR stories: a hard call, a written proposal that changed a decision, an enterprise rollout, a conflict with engineering.
PREP|5|Map each story to a JD line so you can point to the link out loud.
RES|5|mit-star|Worksheet for drafting and trimming the four stories.
PRACTICE|5|Tell me about a time a written document changed a decision.
PRACTICE|5|Tell me about a rollout where a customer's security team pushed back.
TRAP|5|Saying "we" throughout so the interviewer cannot tell what you did.
STAGE|6|Final / executive|Whether you can hold a point of view on where AI assistants are heading and why Tessellate wins.|Medium
PREP|6|Write one paragraph on where workplace AI assistants will be in two years and Tessellate's edge.
PREP|6|Prepare a crisp answer on the biggest risk to Assist and how you would reduce it.
RES|6|stratechery|Helps you form a market view rather than repeating feature lists.
PRACTICE|6|What would make you kill Assist?
PRACTICE|6|Where should Tessellate not use AI?
TRAP|6|Being enthusiastic about AI with no view on its limits or costs.
PLAN|Day 1|Pitch, salary range, and read the evals article end to end.
PLAN|Day 2|Draft the three-level eval plan and the answer, clarify or hand off rule.
PLAN|Day 3|Read the LLM patterns piece; rehearse the 5% wrong answers question out loud.
PLAN|Day 4|Uncertainty UX sketch using the People + AI Guidebook.
PLAN|Day 5|Write and time four STAR stories.
PLAN|Day 6|Market view paragraph and the "what would make you kill it" answer.
PLAN|Day 7|One full mock run, then rest.
ASK|How do you measure Assist's answer quality today, and who owns that number?
ASK|When a customer's security team blocks a rollout, what is the most common reason?
ASK|What would make this hire a success after six months?`,
  },
  {
    id: 'growth-fintech',
    label: 'Growth PM in fintech, 14 days',
    blurb: 'Payments company with a SQL round, a take-home and a panel presentation.',
    input: {
      company: 'Harbourline Payments',
      role: 'Senior Product Manager, Growth & Activation',
      days: 14,
      stages: ['Recruiter screen', 'Analytical / SQL', 'Execution & metrics', 'Take-home / case study', 'Presentation / panel', 'Values / culture fit'],
      background: '',
      jd: `Harbourline Payments helps small businesses across Spain, Portugal and Italy get paid online. We are hiring a Senior Product Manager for Growth & Activation.

The role
- Own activation: the journey from sign-up to a merchant's first successful payment.
- Run an experimentation programme with clear hypotheses, sample sizes and guardrail metrics.
- Write your own SQL to answer questions; you will not wait on an analyst for day-to-day data.
- Work with compliance on onboarding checks (KYC) without hurting conversion.
- Report progress to leadership with a clear narrative and honest numbers.

About you
- 5+ years in product, with at least 2 in growth, onboarding or activation.
- Hands-on SQL and a working knowledge of A/B testing statistics.
- Experience in a regulated industry such as payments, banking or insurance.
- You prioritise with data and can explain trade-offs to non-technical colleagues.
- Fluent English; Spanish, Portuguese or Italian is a plus.`,
    },
    output: `SUMMARY|A hands-on growth PM who can lift sign-up to first payment in a regulated product, using their own SQL and well-run experiments.
SIGNAL|Activation funnel ownership|from sign-up to a merchant's first successful payment
SIGNAL|Experiment rigour|clear hypotheses, sample sizes and guardrail metrics
SIGNAL|Self-serve data|Write your own SQL to answer questions
SIGNAL|Compliance versus conversion|onboarding checks (KYC) without hurting conversion
SIGNAL|Honest reporting|a clear narrative and honest numbers
STAGE|1|Recruiter screen|Growth experience, regulated-industry background, SQL comfort and languages.|Low
PREP|1|Prepare one line each on your growth work, your regulated-industry exposure and your SQL level.
PREP|1|Have a salary range ready for the three countries the company serves.
RES|1|levels-fyi|Anchors your range before the question comes up.
PRACTICE|1|How hands-on is your SQL day to day?
PRACTICE|1|Tell me about a growth result you are proud of.
TRAP|1|Overselling SQL skills that the next round will test live.
STAGE|2|Analytical / SQL|Writing funnel queries live: joins, conversion rates by cohort, time to first payment.|High
PREP|2|Practise funnel and cohort queries daily: sign-ups joined to payments, grouped by week and country.
PREP|2|Rehearse talking while you write, stating assumptions about the tables before you start.
RES|2|thoughtspot-sql|Covers joins, aggregates and window functions, which funnel questions lean on.
RES|2|sqlbolt|Fast warm-up exercises for the days just before the round.
PRACTICE|2|Write a query for the share of merchants who take a first payment within 7 days of sign-up, by country.
PRACTICE|2|Find the onboarding step with the biggest drop-off last month.
TRAP|2|Silently writing SQL without saying how you handle nulls, duplicates or time zones.
STAGE|3|Execution & metrics|Choosing the right activation metric and guardrails, and reading a messy experiment result.|High
PREP|3|Define one activation metric for Harbourline and two guardrails, such as fraud rate and support contacts.
PREP|3|Work through a sample-size example so you can explain power and minimum detectable effect simply.
RES|3|north-star|Helps you argue for one activation metric and the inputs that drive it.
RES|3|evan-ab|Makes the JD's "sample sizes" line concrete; practise with realistic baseline rates.
RES|3|aced-analytics|Drills on metric definition and diagnosing drops, the core of this round.
PRACTICE|3|First-payment rate fell 8% last week. How do you find out why?
PRACTICE|3|Your test lifted sign-ups but fraud flags went up. Ship or not?
TRAP|3|Calling a result a win without checking sample size or guardrails.
STAGE|4|Take-home / case study|Reducing KYC friction without breaking compliance, written up for leadership.|High
PREP|4|Prepare a reusable structure: problem, evidence, options, recommendation, risks, metrics.
PREP|4|List three ways to reduce KYC friction that keep the check itself, such as progressive verification.
RES|4|ost|Lets you show options tied to an outcome instead of one pet solution.
RES|4|intercom-rice|A clear, explainable way to rank the options in your write-up.
RES|4|atlassian-prd|Useful structure if the case asks for a short spec.
PRACTICE|4|Design an onboarding flow that cuts time to first payment by half while meeting KYC rules.
PRACTICE|4|Prioritise five growth bets for the next quarter.
TRAP|4|Proposing to remove compliance steps rather than redesigning around them.
STAGE|5|Presentation / panel|Presenting the case with a clear story and handling challenge from compliance and engineering.|Medium
PREP|5|Cut the case to five slides and rehearse a ten-minute version.
PREP|5|Pre-write answers to the three hardest objections a compliance lead would raise.
RES|5|aced-mocks|A live run with a stranger is the closest thing to a panel.
PRACTICE|5|Why should we believe your numbers?
PRACTICE|5|What would you cut if engineering had half the time?
TRAP|5|Defending every detail instead of showing which assumptions you would test first.
STAGE|6|Values / culture fit|Honesty with numbers, working with compliance, and ownership of misses.|Low
PREP|6|Prepare a story where you reported bad numbers early and what happened next.
PREP|6|Prepare a story of working with a legal or compliance team as a partner.
RES|6|mit-star|For shaping both stories into tight STAR answers.
PRACTICE|6|Tell me about a time a metric you owned went the wrong way.
PRACTICE|6|Tell me about a disagreement with a compliance or legal team.
TRAP|6|Telling only success stories.
PLAN|Days 1-2|Recruiter prep and SQL warm-up; set a daily 30 minute SQL slot.
PLAN|Days 3-5|Funnel and cohort query practice; activation metric and guardrails written down.
PLAN|Days 6-7|Sample-size practice and two metric-drop drills out loud.
PLAN|Days 8-10|Case structure, KYC options and a ranked list of growth bets.
PLAN|Days 11-12|Five-slide deck and objection answers; one peer mock.
PLAN|Days 13-14|Values stories, a final SQL refresh, then rest.
ASK|Which onboarding step loses the most merchants today?
ASK|How do growth and compliance agree on what can be tested?
ASK|What data tools will I have on day one, and how clean is the payments data?`,
  },
  {
    id: 'api-platform',
    label: 'API platform PM, 3 days, with background',
    blurb: 'Integrations role with a technical round. Shows the gap check when a background is added.',
    input: {
      company: 'Orbitly',
      role: 'Senior Product Manager, Integrations & Public API',
      days: 3,
      stages: ['Recruiter screen', 'Hiring manager', 'Technical / system design', 'Cross-functional / stakeholder', 'Offer & negotiation'],
      background: 'Eight years in product management at e-commerce companies, mostly checkout and mobile app features. Ran A/B tests and worked closely with engineering. Have not owned an API or developer-facing product.',
      jd: `Orbitly is a scheduling platform for clinics and salons. Our public API and integrations connect Orbitly to calendars, payment providers and practice-management systems used by 9,000 businesses.

What you will own
- The public REST API: versioning, rate limits, error design and developer documentation.
- The integrations marketplace and the partner programme behind it.
- Reliability goals with engineering, including uptime targets and webhook delivery.
- A roadmap balancing partner requests, internal platform needs and customer-facing features.

What we need
- 5+ years of product management, with experience on platform, API or developer products.
- Enough technical depth to discuss HTTP, authentication, webhooks and rate limiting with engineers.
- Skill at managing partners and internal stakeholders with competing priorities.
- Data-driven: you know how to measure developer adoption and integration health.`,
    },
    output: `SUMMARY|A platform PM who can run a public API and partner marketplace with the technical depth to make reliability and versioning calls.
SIGNAL|API product ownership|versioning, rate limits, error design and developer documentation
SIGNAL|Technical depth|discuss HTTP, authentication, webhooks and rate limiting
SIGNAL|Partner management|integrations marketplace and the partner programme
SIGNAL|Reliability|uptime targets and webhook delivery
SIGNAL|Developer adoption metrics|measure developer adoption and integration health
STAGE|1|Recruiter screen|Platform or API experience, which your background lacks, so framing matters most here.|Medium
PREP|1|Prepare a short bridge: checkout depended on payment provider APIs, so explain the integration decisions you made there.
PREP|1|Have a salary range ready and know the market for platform PM roles.
RES|1|levels-fyi|A quick anchor for the salary question.
PRACTICE|1|Have you owned an API or developer product?
PRACTICE|1|Why move from e-commerce to platform work?
TRAP|1|Claiming API ownership you do not have; name the adjacent work honestly instead.
STAGE|2|Hiring manager|How you would balance partner requests, platform needs and customer features on one roadmap.|Medium
PREP|2|Prepare a simple way to split capacity between partners, platform health and features, with a reason for each share.
PREP|2|List the integration-health metrics you would track in month one.
RES|2|intercom-rice|Gives you a visible way to rank partner requests against internal work.
RES|2|mit-star|Shape your best stakeholder story from checkout work.
PRACTICE|2|A large partner demands an endpoint that only they would use. What do you do?
PRACTICE|2|How would you measure integration health?
TRAP|2|Saying yes to every partner request to look accommodating.
STAGE|3|Technical / system design|HTTP basics, auth, webhooks, rate limiting and versioning, explained clearly to engineers.|High
PREP|3|Learn the core HTTP methods and status codes, and explain 429 and retries in your own words.
PREP|3|Be able to describe how a webhook works, why deliveries fail, and what retries plus idempotency fix.
PREP|3|Prepare a view on API versioning: when to make a breaking change and how to warn partners.
RES|3|mdn-http|The fastest way to get requests, responses and status codes solid.
RES|3|system-design-primer|Its REST, rate limiting and queue sections cover most of the likely questions.
PRACTICE|3|Webhook deliveries to one partner are failing 10% of the time. Walk me through it.
PRACTICE|3|How would you introduce rate limits without breaking existing integrations?
TRAP|3|Bluffing on a term you do not know; say what you would check and with whom.
STAGE|4|Cross-functional / stakeholder|Handling partners and internal teams with competing priorities.|Medium
PREP|4|Prepare one story where you said no to an important stakeholder and kept the relationship.
PREP|4|Draft a short deprecation notice for a breaking API change.
RES|4|atlassian-prd|A clean structure for a partner-facing spec or change note.
PRACTICE|4|Sales promised a partner a feature engineering cannot build this quarter. What now?
PRACTICE|4|How do you keep partners informed about breaking changes?
TRAP|4|Ignoring the partner's commercial pressure and arguing only on technical grounds.
STAGE|5|Offer & negotiation|Agreeing level, pay and growth path for a role where you are stretching.|Low
PREP|5|Decide your walk-away number and what non-salary items matter to you.
PREP|5|Prepare to ask for the level the role is posted at, backed by your eight years of results.
RES|5|haseeb-negotiation|Practical rules for keeping options open during the offer conversation.
RES|5|levels-fyi|Use it to check the number you are given.
PRACTICE|5|What are your salary expectations?
PRACTICE|5|We see you as one level below. How do you respond?
TRAP|5|Accepting a lower level without asking what would move it.
PLAN|Day 1|HTTP and webhooks study, then write the recruiter bridge and salary range.
PLAN|Day 2|Rate limiting and versioning from the primer; rehearse the webhook failure answer out loud.
PLAN|Day 3|Capacity split, integration-health metrics, stakeholder story and one full mock.
GAP|No API or developer product ownership|Frame checkout integrations with payment providers as adjacent API work, and show the reading you have done on versioning and webhooks.
GAP|Platform reliability metrics|Learn uptime, webhook success rate and p95 latency well enough to propose targets.
GAP|Partner programme experience|Use any marketplace or vendor relationships from e-commerce as the bridge story.
ASK|What is the most painful thing partners say about the API today?
ASK|How are breaking changes decided and communicated now?
ASK|Which integration-health metric does leadership look at?`,
  },
];
