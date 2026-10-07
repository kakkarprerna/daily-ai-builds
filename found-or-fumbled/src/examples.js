// Three worked examples with saved model results, so the app works without an API key.
// Companies, documents and figures are invented for this demo. Each shows a failure pattern
// I have seen in real assistant work: an old file still indexed, a rule cut in half by
// chunking, and an answer that fills a gap with a confident number.

export const EXAMPLES = [
  {
    key: 'stale',
    title: 'Health insurer: the retired waiting period',
    domain: 'Insurance help bot',
    blurb: 'A member asks when dental cover starts. The bot quotes 6 months. The policy changed to 3 months in July, but the old guide is still indexed.',
    question: 'How long do I have to wait before my dental cover starts?',
    answer: 'Dental cover starts after a 6-month waiting period from your policy start date. Check-ups and cleanings are included from day one.',
    expected: 'The waiting period for dental treatment is 3 months from the policy start date. Check-ups and cleanings are covered from day one.',
    facts: { inKb: 'Yes', changed: 'Yes', symptom: 'Out of date', topK: '3', notes: '' },
    chunks: `[source: dental-cover-guide.pdf | updated: 2025-02-14 | score: 0.88]
Dental cover: waiting periods. Routine check-ups and cleanings are covered from day one. All other dental treatment, including fillings and extractions, has a waiting period of 6 months from the policy start date.
---
[source: faq-claims.html | updated: 2026-05-02 | score: 0.74]
How do I claim for dental treatment? Ask your dentist for an itemised invoice and upload it in the app within 30 days of treatment.
---
[source: dental-cover-guide-2026.pdf | updated: 2026-07-01 | score: 0.81]
Dental cover from 1 July 2026: routine check-ups and cleanings are covered from day one. The waiting period for all other dental treatment is now 3 months from the policy start date.`,
    diagnosis: `VERDICT|STALE|High|An old version of the dental cover guide is still indexed, and the assistant answered from it instead of the July 2026 version.
WHY|C1 and C3 come from the same guide but give different waiting periods: 6 months in the February 2025 version and 3 months in the July 2026 version. C1 ranked first, and the answer repeats its 6-month figure. Nothing in the answer is invented; it is faithful to the wrong document.
ALSO|RANK|The current version, C3, was retrieved but ranked below the old one, so ranking did nothing to favour the newer text.
CLAIM|Dental cover starts after a 6-month waiting period|Contradicted|C3
CLAIM|Check-ups and cleanings are included from day one|Supported|C1
EVIDENCE|C1|Dated February 2025 and states a 6-month waiting period.
EVIDENCE|C3|Dated July 2026, from the same guide, and states the waiting period is now 3 months.
EVIDENCE|ANSWER|Repeats the 6-month figure from C1 and never mentions the newer text.
CHECK|Search the knowledge base admin for every file named dental-cover-guide|Two versions come back, and the 2025 one is still live
CHECK|Ask the assistant the same question three times in different words|It keeps saying 6 months, so the old file wins every time rather than by chance
CHECK|Ask the content owner whether the 2025 guide should have been retired on 1 July|They confirm it should have been removed
FIX|Content|Remove the 2025 guide from the index and add a retirement step to the policy change checklist.
FIX|Search|Store the effective date on every chunk and prefer the newest version when two chunks come from the same document.
FLIP|If the 2025 guide still applies to policies sold before July 2026, the answer is incomplete rather than stale, and the fix moves to the prompt: ask for the policy start date first (IGNORED).
TICKET|Dental bot quotes the retired 6-month waiting period|The help assistant told a member that dental treatment has a 6-month waiting period. Since 1 July 2026 it is 3 months. Both versions of the dental cover guide are indexed, and the 2025 version ranked first (C1, score 0.88) above the 2026 version (C3, score 0.81). Suspected stage: stale source. Suggested fix: retire the 2025 file and prefer the newest effective date when chunks come from the same document.`
  },
  {
    key: 'chunk',
    title: 'SaaS billing: the refund rule cut in half',
    domain: 'Billing help bot',
    blurb: 'A customer 45 days into an annual plan asks about a refund and gets a yes. The condition that makes it a no sits in a chunk that never came back.',
    question: "I'm on an annual plan and it's been 45 days. Can I still get a refund?",
    answer: "Yes. Annual plans can be refunded pro rata, so you'll get back the unused months. Contact billing to start the refund.",
    expected: 'After the first 30 days, annual plans are refunded pro rata only if the service had a documented outage longer than 24 hours in the past 90 days. Otherwise there is no refund.',
    facts: { inKb: 'Yes', changed: 'No', symptom: 'Missing part of the answer', topK: '3', notes: '' },
    chunks: `[source: billing-terms.md | updated: 2026-03-10 | score: 0.84]
Refunds on annual plans. Annual plans can be cancelled at any time and are refunded in full within the first 30 days. After 30 days, annual plans can be refunded pro rata in the following case:
---
[source: billing-faq.md | updated: 2026-04-22 | score: 0.77]
How do I contact billing? Email billing@brightmetric.example or open a ticket from Settings, then Billing. Refunds are processed within 10 working days.
---
[source: monthly-plans.md | updated: 2026-03-10 | score: 0.71]
Monthly plans. Monthly plans can be cancelled at any time. No refunds are given for partial months.`,
    diagnosis: `VERDICT|CHUNK|High|The refund rule was cut in half when the billing terms were split, so the assistant saw the start of the rule but not its condition.
WHY|C1 ends at "in the following case:" and stops, so the condition sits in the next chunk of billing-terms.md, which was not retrieved. The assistant read "refunded pro rata" in C1 and turned it into a general yes. Neither C2 nor C3 covers annual refunds after 30 days.
ALSO|INVENTED|"You'll get back the unused months" goes further than C1, which never says the refund is automatic.
CLAIM|Annual plans can be refunded pro rata|Supported|C1
CLAIM|You'll get back the unused months|Unsupported|none
CLAIM|Contact billing to start the refund|Supported|C2
EVIDENCE|C1|Ends mid-sentence at "in the following case:" so the condition is missing.
EVIDENCE|C2|Explains how to contact billing but says nothing about who qualifies.
CHECK|Open billing-terms.md and read the sentence after "in the following case:"|It names the outage condition, and it begins a new chunk
CHECK|Ask the assistant "When are annual plans refunded after 30 days?"|C1 comes back again without the next chunk, which points at the split
CHECK|Look up the chunk size in the indexing settings|A fixed size with little or no overlap between chunks
FIX|Search|Split documents at headings and keep a list with the sentence that introduces it, or add a few sentences of overlap between chunks.
FIX|Prompt|When a chunk ends mid-sentence, have the assistant say it needs to check rather than finishing the rule itself.
FLIP|If the next chunk of billing-terms.md was retrieved but ranked below the others, the verdict moves to RANK.
TICKET|Refund bot drops the outage condition on annual plans|A customer 45 days into an annual plan was told they can get a pro rata refund. The terms allow that only after a documented outage over 24 hours. The retrieved chunk of billing-terms.md (C1) ends at "in the following case:" and the condition sits in the next chunk, which was not retrieved. Suspected stage: chunking. Suggested fix: split at headings and keep lists with their lead-in sentence, or add overlap between chunks.`
  },
  {
    key: 'invented',
    title: 'Telco roaming: 60 minutes from nowhere',
    domain: 'Telco support bot',
    blurb: 'A customer asks if the Zone 2 day pass includes calls. The bot says yes, 60 minutes. No chunk mentions calls on that pass at all.',
    question: 'Does the Zone 2 day pass include calls back to Spain?',
    answer: 'Yes. The Zone 2 day pass includes 60 minutes of calls back to Spain and 1 GB of data for €9.99 a day.',
    expected: 'The knowledge base only covers data on the Zone 2 day pass. The assistant should say it cannot confirm calls and point the customer to the roaming team.',
    facts: { inKb: 'No', changed: 'No', symptom: 'Made-up detail', topK: '3', notes: '' },
    chunks: `[source: roaming-zones.md | updated: 2026-06-15 | score: 0.82]
Zone 2 day pass. Available in Morocco, Turkey, Switzerland and the UK. Costs €9.99 per day and includes 1 GB of data. The pass activates the first time you use data abroad that day.
---
[source: roaming-eu.md | updated: 2026-06-15 | score: 0.76]
Roaming in the EU. Calls, texts and data in EU countries come out of your Spanish allowance at no extra cost, under EU roaming rules.
---
[source: roaming-faq.md | updated: 2026-02-03 | score: 0.69]
How do I turn roaming on? Open the app, go to Line settings and switch on Roaming. You can also call 1717 from your Ondanet line.`,
    diagnosis: `VERDICT|INVENTED|High|The assistant made up a calls allowance for the Zone 2 day pass that no chunk mentions.
WHY|C1 describes the Zone 2 day pass and lists data only: 1 GB for €9.99 a day. The answer copies those figures correctly and then adds 60 minutes of calls, which appears nowhere in C1, C2 or C3. C2 talks about calls, but only for EU roaming, which may have nudged the model.
ALSO|GAP|The knowledge base does not say whether calls are included on the Zone 2 pass, so the right answer was to say so and point to the roaming team.
CLAIM|Includes 60 minutes of calls back to Spain|Unsupported|none
CLAIM|Includes 1 GB of data|Supported|C1
CLAIM|Costs €9.99 a day|Supported|C1
EVIDENCE|C1|Covers the Zone 2 pass and names data only, no calls.
EVIDENCE|C2|Mentions calls, but under EU roaming rules, which do not apply in Zone 2 countries.
EVIDENCE|ANSWER|The number 60 appears in no chunk.
CHECK|Search the knowledge base for "Zone 2" together with "calls"|Nothing comes back that covers calls on the day pass
CHECK|Ask the roaming product owner what the pass includes|They confirm calls are not part of it, or that the content is missing
CHECK|Ask the assistant five similar questions about Zone 2 extras|It adds other allowances the pass does not have, which shows a pattern rather than a one-off
FIX|Prompt|Require every number and allowance in an answer to come from a chunk, and when a feature is not mentioned, have the assistant say it cannot confirm it.
FIX|Content|Add one line to roaming-zones.md stating what the Zone 2 pass does not include.
FLIP|If an internal price sheet that is not indexed does list 60 minutes of calls, this becomes a knowledge gap (GAP) rather than an invented answer.
TICKET|Roaming bot invents 60 minutes of calls on the Zone 2 pass|A customer asked whether the Zone 2 day pass includes calls back to Spain and was told it includes 60 minutes. No retrieved chunk mentions calls for Zone 2; C1 lists 1 GB of data for €9.99 a day only. The figure 60 appears in no chunk. Suspected stage: invented detail, with a content gap behind it. Suggested fix: require numbers to come from chunks, and add what the pass excludes to roaming-zones.md.`
  }
];

export const CHUNK_TEMPLATE = `[source: file-name.md | updated: 2026-01-31 | score: 0.80]
Paste the text of the top-ranked chunk here.
---
[source: another-file.md | updated: 2026-03-15 | score: 0.74]
Paste the second chunk here. The bracket line is optional.`;
