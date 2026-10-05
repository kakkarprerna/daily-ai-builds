// Three worked examples with saved results, so visitors without a key can see the full output.
// The saved results were written in the same tagged-line format the model returns
// and go through the same parser as a live reply.

export const EXAMPLES = [
  {
    id: 'pm-hm',
    title: 'Senior PM, hiring manager round',
    blurb: 'B2B payments scale-up. Good on stakeholders, wobbly on the failure story and "why us".',
    tone: 'Mixed',
    input: {
      role: 'Senior Product Manager, merchant onboarding',
      company: 'Scale-up',
      round: 'Hiring manager',
      interviewer: 'Hiring manager',
      format: 'Video',
      gut: 'Mixed',
      jd: 'Own the merchant onboarding journey end to end. Reduce time to first payment. Work with risk, compliance and sales. Experience running experiments and defining success metrics. Comfortable saying no and managing senior stakeholders.',
      questions: [
        {
          question: 'Tell me about a time you said no to a senior stakeholder.',
          answer: 'At my last company the sales VP wanted a custom export for one big client. I showed him the roadmap and the cost of the build, and offered a CSV workaround. He agreed to wait a quarter and the client stayed. I set up a monthly review with sales after that.',
          felt: 'Solid',
          reaction: 'Dug deeper',
        },
        {
          question: 'How do you prioritise your roadmap?',
          answer: 'I use RICE. Reach, impact, confidence, effort. I explained each part and said I score things with the team every quarter.',
          felt: 'Solid',
          reaction: 'Moved on quickly',
        },
        {
          question: 'Tell me about a launch that did not go well.',
          answer: 'We launched a reporting dashboard and adoption was low. The market was not ready for it and customers were busy. We eventually deprioritised it.',
          felt: 'Shaky',
          reaction: 'Pushed back',
        },
        {
          question: 'Why do you want to work here?',
          answer: 'Payments is an interesting space and the company is growing fast. I like the product.',
          felt: 'Shaky',
          reaction: "Couldn't tell",
        },
      ],
      myQuestions: 'What does success look like in the first six months?',
      nextSteps: 'Will hear within a week. Next round would be a case study with the CPO.',
    },
    result: `READ|Mixed|Medium|One answer clearly showed the stakeholder judgement the role asks for, but the failure story and the motivation answer were thin enough to leave the hiring manager with open questions.
STRENGTH|The stakeholder answer had a real situation, a trade-off you made visible with cost, a workaround, and a lasting change in how you worked with sales, which is close to what the job description asks for.
STRENGTH|Asking what success looks like in six months was a good closing question for a hiring manager and shows you think in outcomes.
Q|1|PROBE|Whether you can protect the roadmap without damaging a senior relationship or losing revenue.
Q|1|LANDED|Landed|You named the stakeholder, the request, how you reframed it with cost, the workaround and the result that the client stayed.
Q|1|GAP|The follow-up questions suggest they wanted to hear how you judged the deal risk before saying no.
Q|1|BETTER|Add one line on how you sized the risk, for example the client's revenue share and what the export would have displaced. That turns a good story into evidence of commercial judgement.
Q|2|PROBE|Whether you make prioritisation calls with judgement and data, or recite a framework.
Q|2|LANDED|Partly|You described RICE accurately but gave no example of a call it helped you make, which is likely why they moved on.
Q|2|GAP|A real decision where the framework changed what you built, or where you overrode it and why.
Q|2|BETTER|Open with one concrete trade-off, such as choosing a faster onboarding step over a requested feature, and show the inputs you weighed. Mention the framework as the tool, not the answer.
Q|3|PROBE|Self-awareness: whether you own a failure, understand the root cause and changed how you work.
Q|3|LANDED|Missed|Saying the market was not ready and customers were busy places the cause outside you, and the pushback suggests the interviewer noticed.
Q|3|GAP|Your own part in it, what signal you missed earlier, and what you now do differently.
Q|3|BETTER|Name the decision you would change, such as building before validating demand with a handful of customers, and the habit you adopted afterwards. Finish with a later launch where that habit paid off.
Q|4|PROBE|Whether your interest is specific to this company and role, or would apply to any payments firm.
Q|4|LANDED|Missed|Interesting space and fast growth could describe dozens of companies, so it gives no reason to pick you over a candidate who did their homework.
Q|4|GAP|A specific link between their product, the onboarding problem and your experience.
Q|4|BETTER|Pick one thing you noticed in their onboarding flow or a recent announcement and connect it to a problem you have solved before. Keep it to three sentences.
PATTERN|Your strongest answer had a concrete situation and result, while the weaker ones stayed general. Specific examples are what is separating your good answers from your average ones.
PATTERN|Where something went wrong, you described outside causes before your own decisions, which can read as low ownership even if that is not what you meant.
FIX|Rebuild the failure story|Rewrite it around one decision you own, what you learned and a later example where you applied it. Practise it aloud until it runs under two minutes.
FIX|Prepare a specific "why us"|Spend twenty minutes in their product's sign-up flow and write down two things you would explore. Use one in the next round.
FIX|Attach an example to every framework|For prioritisation, metrics and discovery, prepare one real decision for each so you never answer with theory alone.
FIX|Prepare for onboarding metrics|The job description stresses time to first payment, so expect the CPO case to test how you would define and move that metric.
NOTE|Hi [Name], thank you for the conversation today. I enjoyed hearing how the team thinks about getting merchants to their first payment faster.
NOTE|On the launch question, I would add one thing: the real lesson for me was to validate demand with a few customers before building, and I have run discovery that way since. Happy to go into detail in the next round.
NOTE|Best regards
NEXT|A case on reducing time to first payment, likely asking you to define the metric, find the drop-off points and prioritise fixes.
NEXT|How you would work with risk and compliance when a faster onboarding step adds risk.
NEXT|Experiment design: how you would test a change and know whether it worked.
LIMIT|This debrief only sees your own notes on what you said, which tend to be shorter and tidier than the real answers.
LIMIT|It cannot know how other candidates performed or what the hiring manager already decided.`,
  },
  {
    id: 'ux-panel',
    title: 'UX designer, portfolio panel',
    blurb: 'Healthtech startup. Strong walkthrough, then blanked on how success was measured.',
    tone: 'Strong',
    input: {
      role: 'Product Designer',
      company: 'Startup',
      round: 'Panel',
      interviewer: 'Mixed panel',
      format: 'In person',
      gut: 'Good',
      jd: '',
      questions: [
        {
          question: 'Walk us through a project in your portfolio.',
          answer: 'I walked them through the appointment booking redesign for a clinic chain. I explained the research with 12 patients, the three concepts I tested and the final flow. Booking completion went up from 61% to 78% after launch. I led the research and the design myself.',
          felt: 'Nailed it',
          reaction: 'Seemed satisfied',
        },
        {
          question: 'How did you measure success on the second project?',
          answer: 'I blanked a bit. I said the client was happy and we got good feedback, but I did not have numbers.',
          felt: 'Blanked',
          reaction: 'Dug deeper',
        },
        {
          question: 'What do you do when developers push back on a design?',
          answer: 'I sit with them early and ask what the constraint is. Once I cut an animation that would have taken a week and we found a simpler version together. I share Figma files in progress so there are no surprises.',
          felt: 'Solid',
          reaction: 'Seemed satisfied',
        },
      ],
      myQuestions: 'How big is the design team and who would I work with day to day?',
      nextSteps: 'Nothing specific said.',
    },
    result: `READ|Strong|Medium|Two of three answers were specific and evidence-backed, and the one weak moment on measurement is common and recoverable if you address it.
STRENGTH|Your portfolio walkthrough had research numbers, tested concepts, a measured result and clear ownership, which is exactly what a panel listens for.
STRENGTH|The developer answer showed a real compromise with a cost attached, which signals you can ship with engineers rather than hand over files.
Q|1|PROBE|Whether you follow a sound process and can tie design work to a business result.
Q|1|LANDED|Landed|You gave the research size, the concepts tested, a before and after completion rate and said what you personally led.
Q|1|GAP|Little missing; at most, what you learned from the concepts that did not win.
Q|1|BETTER|Add one sentence on why the rejected concepts lost, since that shows how you make design decisions from evidence.
Q|2|PROBE|Whether you think about outcomes on every project or only when numbers happen to be available.
Q|2|LANDED|Missed|Client happiness and good feedback are not measures, and the panel dug deeper because they wanted to see how you would have defined success.
Q|2|GAP|A success measure, even a planned one, and why numbers were missing.
Q|2|BETTER|If no data was collected, say so and name what you would have tracked, such as task completion or support tickets. Then say how you now agree success measures with clients before starting.
Q|3|PROBE|Whether you collaborate with engineering and can trade off scope without losing the design intent.
Q|3|LANDED|Landed|You gave a concrete example with a time cost, a joint solution and a working habit that prevents surprises.
Q|3|GAP|What the simpler version kept from the original intent.
Q|3|BETTER|Say what the user still got from the simpler animation. It shows you protected the experience, not only the timeline.
PATTERN|Your answers are strongest when you lead with a specific project, and you did that in two out of three questions.
PATTERN|Measurement is the one area where you seem less prepared, which matters at a healthtech startup where outcomes are often scrutinised.
FIX|Prepare a measurement line for every portfolio project|For each case study, write down what was measured or what you would have measured. Thirty minutes now prevents another blank.
FIX|Use the follow-up note to recover|A short line naming the success measure for the second project shows reflection without reopening the whole answer.
FIX|Add a "what I would change" slide|Panels often ask this next, and having it ready signals maturity.
NOTE|Hi [Name], thank you to you and the panel for your time today. I really enjoyed the conversation about how the team works with clinicians.
NOTE|I wanted to add one point on the second project. We did not track metrics there, which I would do differently now. The measure I would have used is repeat bookings within 90 days, and I now agree success measures with clients at kick-off.
NOTE|Looking forward to hearing from you.
NEXT|A design exercise or take-home, likely on a patient-facing flow, where they will watch how you frame the problem before sketching.
NEXT|Accessibility and regulation in healthcare design, since patients vary widely in age and digital confidence.
NEXT|How you measure success, given the gap in this round.
LIMIT|It cannot see your portfolio itself, only how you described it.
LIMIT|Nothing was said about next steps, so the timeline and the next stage are guesses based on what is typical.`,
  },
  {
    id: 'csm-screen',
    title: 'CSM, recruiter screen',
    blurb: 'Enterprise SaaS. Long intro, salary number given too early, unclear notice period.',
    tone: 'Needs work',
    input: {
      role: 'Customer Success Manager, enterprise accounts',
      company: 'Enterprise',
      round: 'Recruiter screen',
      interviewer: 'Recruiter',
      format: 'Phone',
      gut: 'Unsure',
      jd: 'Manage a book of enterprise accounts. Drive renewals and expansion. Run QBRs with executive sponsors. Track health scores and churn risk. Spanish and English required.',
      questions: [
        {
          question: 'Tell me about yourself.',
          answer: 'I started in sales support, then moved to account management, then a startup, then customer success. I talked about every role and the tools I used. It probably went on for five minutes.',
          felt: 'Shaky',
          reaction: 'Moved on quickly',
        },
        {
          question: 'Why are you leaving your current role?',
          answer: 'The company is restructuring and there is no growth path. I said I wanted bigger accounts.',
          felt: 'Solid',
          reaction: 'Seemed satisfied',
        },
        {
          question: 'What are your salary expectations?',
          answer: 'I gave a number straight away, a bit lower than I wanted because I was nervous.',
          felt: 'Shaky',
          reaction: "Couldn't tell",
        },
        {
          question: 'What is your notice period?',
          answer: 'I said I was not sure, maybe one month or two.',
          felt: 'Shaky',
          reaction: 'Moved on quickly',
        },
      ],
      myQuestions: '',
      nextSteps: 'If it goes ahead, a call with the hiring manager next week.',
    },
    result: `READ|Needs work|Medium|The recruiter has what they need to decide on fit, but a long introduction, an early low salary figure and an unclear notice period make you look less prepared than you are.
STRENGTH|Your reason for leaving was honest, brief and forward-looking, and wanting bigger accounts matches an enterprise role.
STRENGTH|Your career path from sales support to customer success is relevant, even if it came out too long.
Q|1|PROBE|Whether you can give a clear, relevant summary in about a minute and point it at this role.
Q|1|LANDED|Partly|The content was relevant, but five minutes of every role and tool buries the point, which fits the recruiter moving on quickly.
Q|1|GAP|A short headline linking your experience to enterprise renewals and expansion.
Q|1|BETTER|Use three beats in under ninety seconds: who you are now, one proof point such as accounts or renewals you owned, and why this role is the next step. Leave the tools for later questions.
Q|2|PROBE|Whether you are leaving for good reasons and are not a flight risk or a source of drama.
Q|2|LANDED|Landed|Restructuring and no growth path are neutral reasons, and you turned it towards what you want next.
Q|2|GAP|A link to something specific about this company's accounts.
Q|2|BETTER|Add a line on why their enterprise customer base fits what you want, so the answer points to them rather than away from your current employer.
Q|3|PROBE|Whether you are within budget, and how well you negotiate.
Q|3|LANDED|Partly|A number keeps you in the process, but giving a low one first under pressure may cap the offer.
Q|3|GAP|A researched range and a way to ask for their band first.
Q|3|BETTER|Ask what range is budgeted for the role, then give a range based on market data with your target near the bottom. If pushed, say you are flexible depending on the full package.
Q|4|PROBE|When you could realistically start, so they can plan the hiring timeline.
Q|4|LANDED|Missed|Not knowing your own notice period reads as unprepared, even though it is a small detail.
Q|4|GAP|The exact notice period from your contract.
Q|4|BETTER|Check your contract and give one clear answer, with any flexibility you might be able to negotiate.
PATTERN|The basics recruiters always ask about, such as the introduction, salary and notice, were the weakest parts, while the harder question went well. Preparation, not ability, is the issue.
PATTERN|You did not ask the recruiter any questions, which is a missed chance to learn about the team and show interest.
FIX|Check your notice period today|Find it in your contract and send it to the recruiter in your follow-up note so the gap is closed before the next round.
FIX|Write a ninety second introduction|Draft it around enterprise renewals and expansion, time it aloud, and use it at the start of the hiring manager call.
FIX|Research the salary range|Look at salary data for enterprise CSM roles in your market so you can discuss the full package with confidence later.
FIX|Prepare two questions for every round|For the hiring manager, ask how they measure account health and what the biggest churn risk in the book is right now.
NOTE|Hi [Name], thank you for the call today and for explaining the role. I am excited about working with enterprise accounts and running QBRs with executive sponsors.
NOTE|To confirm the detail I was not sure about, my notice period is [X weeks]. I look forward to speaking with the hiring manager.
NEXT|How you would run a QBR with an executive sponsor and what you would present.
NEXT|A churn risk example: an account that went quiet and what you did about it.
NEXT|Expansion: how you have identified and closed upsell opportunities.
NEXT|A short check of your Spanish, since the role requires both languages.
LIMIT|Salary norms differ by country and company, so this cannot tell you whether your figure was actually low.
LIMIT|Recruiter screens are often a simple yes or no on fit, so the outcome may depend on factors outside your answers.`,
  },
];
