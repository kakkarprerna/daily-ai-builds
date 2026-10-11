// Three worked examples with saved model replies, so the app runs without a key.
// Companies, products and people are invented.

export const EXAMPLES = [
  {
    id: 'shortlist',
    team: 'HR tech SaaS',
    title: 'Shortlist Assist at Talentra',
    blurb: 'Ranks job applicants for recruiters. The team hoped the Article 6(3) exemption would apply. The rules and the second read both say it will not.',
    form: {
      name: 'Shortlist Assist',
      description:
        'Shortlist Assist reads every application for a job, compares the CV with the job description and ranks candidates from best to weakest match. Recruiters see the top 20 first and can hide anyone below a score of 60. It also writes a two-line summary of each candidate. It runs on a third-party large language model through an API. Customers are recruitment teams at mid-sized companies in Spain, Portugal and Ireland.',
      role: 'Provider: we build it or put our name on it',
      eu: 'Offered or sold in the EU',
      market: 'On the EU market before 2 August 2026',
      exclusion: 'None',
      practices: [],
      product: 'None',
      thirdParty: 'Not sure',
      area: 'Employment and workers',
      use: 'Recruiting: targeted job ads, screening or filtering applications, evaluating candidates',
      profiling: 'Not sure',
      exemption: 'Improves the result of work a person already finished',
      transparency: [],
      gpai: "Built on someone else's model through an API",
      systemic: 'Not sure'
    },
    text: [
      'SUMMARY|Scores and ranks job applicants against a job description and lets recruiters hide lower-scored candidates, with an AI-written summary of each.',
      'SIGNAL|Profiling|Yes, it evaluates or predicts things about individual people|ranks candidates from best to weakest match|Ranking people on their fit for a job is an automated evaluation of each person, which is profiling.',
      'SIGNAL|Exemption|None of these|can hide anyone below a score of 60|Hiding candidates below a score acts before any recruiter reviews them, so it does not only improve finished human work.',
      'SIGNAL|Use|Recruiting: targeted job ads, screening or filtering applications, evaluating candidates|compares the CV with the job description|Matches the listed recruiting use you chose.',
      'SIGNAL|GPAI|Built on someone else\'s model through an API|runs on a third-party large language model through an API|Matches your answer.',
      'QUESTION|When a recruiter hides candidates below 60, can they still see who was hidden and why?',
      'QUESTION|Do any customers use the ranking for internal promotions as well as hiring?',
      'QUESTION|Does the two-line summary count as synthetic text that needs marking under Article 50(2), or as an assistive editing function?'
    ].join('\n')
  },
  {
    id: 'ana',
    team: 'Energy retail',
    title: 'Ask Ana at Luzera Energía',
    blurb: 'A branded voice and chat agent. Transparency duties apply now, marking has until December, and the second read flags one sentence worth a legal check.',
    form: {
      name: 'Ask Ana',
      description:
        "Ask Ana answers customer calls and web chats for Luzera Energía, a Spanish electricity and gas retailer. It handles meter readings, bill questions and moving home, speaking in a synthetic voice in Spanish, Catalan and English. We configured a vendor's agent platform and it runs under our brand. When a customer has two unpaid bills, Ana offers a payment plan, and accounts it marks as high risk of not paying are passed to the collections team. Live since March 2026.",
      role: 'Both',
      eu: 'Offered or sold in the EU',
      market: 'On the EU market before 2 August 2026',
      exclusion: 'None',
      practices: [],
      product: 'None',
      thirdParty: 'Not sure',
      area: 'None of these',
      use: '',
      profiling: 'Not sure',
      exemption: 'None of these',
      transparency: ['People chat or talk with it', 'Generates or edits synthetic audio, images, video or text'],
      gpai: "Built on someone else's model through an API",
      systemic: 'Not sure'
    },
    text: [
      'SUMMARY|A branded voice and chat agent that serves energy customers, speaks in a synthetic voice and flags accounts at risk of not paying.',
      'SIGNAL|Transparency|People chat or talk with it|answers customer calls and web chats|Matches your answer.',
      'SIGNAL|Transparency|Generates or edits synthetic audio, images, video or text|speaking in a synthetic voice|Matches your answer.',
      'SIGNAL|Use|Creditworthiness or credit score of people (fraud detection excluded)|accounts it marks as high risk of not paying|Scoring whether a person will pay may count as assessing creditworthiness. Worth a legal view before you rule it out.',
      'SIGNAL|Role|Both|it runs under our brand|Matches your answer. Your own brand on the agent makes you its provider.',
      'QUESTION|Does the high risk mark change what a customer is offered, such as deposits, tariffs or whether they can switch?',
      'QUESTION|Who adds the machine-readable marking to the synthetic voice, Luzera or the vendor, and is it ready for 2 December 2026?',
      'QUESTION|Does Ana say it is an AI at the start of every call and chat, in all three languages?'
    ].join('\n')
  },
  {
    id: 'calm',
    team: 'Contact centre software',
    title: 'Calm Meter at Callbright',
    blurb: 'Reads agent stress from voice and webcam during calls. A banned practice since February 2025, whatever the wellbeing intent.',
    form: {
      name: 'Calm Meter',
      description:
        "Calm Meter is a feature in Callbright, our quality tool for contact centres. During calls it analyses the agent's voice and webcam video and shows team leads a live stress and frustration score for each agent, so they can step in or offer a break. Scores are stored and appear in monthly performance reviews. Sold to contact centres across the EU.",
      role: 'Provider: we build it or put our name on it',
      eu: 'Offered or sold in the EU',
      market: 'Launched on or after 2 August 2026',
      exclusion: 'None',
      practices: ['Infers the emotions of people at work or in education, not for medical or safety reasons'],
      product: 'None',
      thirdParty: 'Not sure',
      area: 'Employment and workers',
      use: 'Decisions on promotion, termination or task allocation, or monitoring and evaluating performance',
      profiling: 'Yes, it evaluates or predicts things about individual people',
      exemption: 'None of these',
      transparency: ['Recognises emotions or sorts people by biometric data'],
      gpai: 'No general-purpose model involved',
      systemic: 'Not sure'
    },
    text: [
      "SUMMARY|Infers contact centre agents' stress and frustration from their voice and video during calls, shows it live to team leads and feeds it into performance reviews.",
      'SIGNAL|Prohibited|Infers the emotions of people at work or in education, not for medical or safety reasons|live stress and frustration score for each agent|Inferring emotions of workers is banned unless the purpose is medical or safety, and offering a break is a wellbeing aim.',
      'SIGNAL|Use|Decisions on promotion, termination or task allocation, or monitoring and evaluating performance|appear in monthly performance reviews|Matches your answer.',
      'SIGNAL|Transparency|Recognises emotions or sorts people by biometric data|analyses the agent\'s voice and webcam video|Matches your answer.',
      'QUESTION|Is there a documented medical or safety purpose, or is the aim wellbeing and productivity?',
      'QUESTION|Can the feature be withdrawn from EU customers now, and do stored scores need deleting from past reviews?',
      'QUESTION|Would a redesign that reads only the words of the call, with no voice or video analysis, still meet the customer need?'
    ].join('\n')
  }
];
