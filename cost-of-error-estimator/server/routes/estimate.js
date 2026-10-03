// Estimates a per-incident cost range for each AI failure category. The
// monthly exposure and the ranking are worked out in the browser.
import { complete, clip, HttpError } from '../providers.js';

const SYSTEM = `You are a careful AI-product risk analyst helping a product manager decide where to spend evaluation and guardrail effort.

You get a product's business context and a numbered list of AI failure categories with how often each happens per month. For each category, estimate a realistic cost PER INCIDENT (not per month) as a low and high figure in the stated currency.

Ground every figure in the context given: staff time to fix it at a plausible loaded hourly rate, refunds or credits, repeat contacts, the share of affected customers likely to leave multiplied by their value, and regulatory or legal exposure only where the failure plausibly triggers it. If the user gives a cost per human contact or a customer value, use those numbers. Be conservative rather than dramatic: the high figure is a bad but realistic incident, not the worst case imaginable.

Confidence: High when the cost is mostly staff time or a known refund, Medium when it depends on churn, Low when it depends on rare legal or regulatory outcomes.

Reply with tagged lines only, one per line, no markdown, no JSON, nothing before or after:
COST: <category number> | <low, whole number, no symbols> | <high, whole number, no symbols> | <High|Medium|Low> | <two or three cost drivers separated by semicolons> | <one sentence rationale, under 25 words>
ASSUMPTION: <an assumption you made that the user should check>
WATCH: <a cost your figures leave out that could matter, such as brand damage or regulatory action>
SUMMARY: <under 35 words: which failure matters most and why, in plain language>

One COST line per category. Two to four ASSUMPTION lines. One or two WATCH lines. Write in British English.`;

export default async function estimate({ body, key, env }) {
  const context = clip(body.context, 2000, 'The product context');
  const product = clip(body.product, 150, 'The product type');
  const currency = ['EUR', 'USD', 'GBP'].includes(body.currency) ? body.currency : 'USD';
  const contactCost = clip(String(body.contactCost ?? ''), 20, 'Cost per contact');
  const customerValue = clip(String(body.customerValue ?? ''), 20, 'Customer value');
  const cats = Array.isArray(body.categories) ? body.categories.slice(0, 8) : [];
  if (!cats.length) throw new HttpError(400, 'Add at least one failure category.');

  const list = cats
    .map((c, i) => {
      const name = clip(c.name, 120, `Category ${i + 1} name`);
      const desc = clip(c.description, 400, `Category ${i + 1} description`);
      const freq = Math.max(0, Math.min(1e6, Number(c.frequency) || 0));
      if (!name.trim()) throw new HttpError(400, `Category ${i + 1} needs a name.`);
      return `${i + 1}. ${name} | about ${freq} per month | ${desc || 'no description'}`;
    })
    .join('\n');

  const report = await complete({
    env,
    provider: body.provider,
    model: body.model,
    key,
    system: SYSTEM,
    user: `CURRENCY: ${currency}
PRODUCT TYPE: ${product || 'not stated'}
BUSINESS CONTEXT: ${context || 'not stated'}
COST OF ONE HUMAN SUPPORT CONTACT: ${contactCost || 'not given'}
AVERAGE YEARLY VALUE OF A CUSTOMER: ${customerValue || 'not given'}

FAILURE CATEGORIES
${list}`,
    maxTokens: 1200,
    temperature: 0.2,
  });
  if (!report) throw new HttpError(502, 'The model returned an empty reply. Try again, or switch provider in Model & key.');
  return { report };
}
