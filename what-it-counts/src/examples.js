// Three worked examples with saved model replies, so the app runs without a key.
// Companies, people and numbers are invented.

export const EXAMPLES = [
  {
    id: 'active',
    team: 'Analytics SaaS · customer success',
    title: 'Active customers in September',
    blurb: 'A weekly metric that counts sessions instead of customers, lets every trial account skip the filters and drops the last day of the month.',
    form: {
      question: 'How many customers were active in September 2026?',
      dialect: 'PostgreSQL',
      use: 'Weekly metrics',
      author: 'Daniel'
    },
    query: `-- Active customers, September
SELECT
  COUNT(*) AS active_customers
FROM accounts a
LEFT JOIN sessions s
  ON s.account_id = a.id
WHERE a.plan <> 'internal'
  AND s.started_at BETWEEN '2026-09-01' AND '2026-09-30'
  AND a.status = 'active' OR a.status = 'trial';`,
    text: `SUMMARY|Counts September session rows for accounts that are not on the internal plan and are active, and then adds every trial account's sessions whatever their date.
GRAIN|Before counting, one row is one session joined to its account, so a busy account appears many times.
MATCH|Partly|You asked for customers, but COUNT(*) counts sessions, and the OR line lets trial accounts in from any date.
STEP|1|FROM accounts a|Starts from the list of accounts.
STEP|2|LEFT JOIN sessions s|Attaches every session each account had, one row per session.
STEP|3|ON s.account_id = a.id|Matches sessions to accounts by account ID.
STEP|4|WHERE a.plan <> 'internal'|Removes accounts on the internal plan.
STEP|5|s.started_at BETWEEN '2026-09-01' AND '2026-09-30'|Keeps sessions from 1 September up to midnight at the start of 30 September.
STEP|6|AND a.status = 'active' OR a.status = 'trial'|Meant to keep active and trial accounts. Because SQL reads AND before OR, any trial account passes without the lines above.
STEP|7|COUNT(*) AS active_customers|Counts the rows left and calls the result active customers.
TRAP|Rows not people|COUNT(*) AS active_customers|This counts sessions. An account with 40 sessions in September adds 40.
TRAP|AND/OR order|AND a.status = 'active' OR a.status = 'trial'|Trial accounts skip the date and plan filters, so their sessions from any month are counted.
TRAP|Date edge|BETWEEN '2026-09-01' AND '2026-09-30'|If started_at holds a time, sessions on 30 September after midnight are left out.
TRAP|Rows dropped|LEFT JOIN sessions s|The date filter on sessions turns this into a plain join. Accounts with no sessions disappear, which suits an active count, but the LEFT JOIN suggests something else was meant.
QUESTION|Is a customer the same as an account here, or can one customer own several accounts?
QUESTION|Should trial accounts count as customers in this metric at all?
QUESTION|What does a session need to include to count as activity, such as a real action rather than a login?
TERM|LEFT JOIN|Keep every row from the first table, even when nothing matches in the second.
TERM|COUNT(*)|Count rows, whatever is in them.
TERM|BETWEEN|A range that includes both ends, compared exactly as written.`
  },
  {
    id: 'revenue',
    team: 'Subscription SaaS · board pack',
    title: 'Revenue by plan after the price change',
    blurb: 'A board slide that adds each order total once per line item, keeps only the top five plans and removes four customers nobody can explain.',
    form: {
      question: 'What was revenue by plan in Q3 2026, after the June price change?',
      dialect: 'BigQuery',
      use: 'Board or investor deck',
      author: 'Lucía'
    },
    query: `SELECT
  p.plan_name,
  SUM(o.order_total) AS revenue_eur
FROM \`billing.orders\` o
JOIN \`billing.order_items\` i ON i.order_id = o.order_id
JOIN \`billing.plans\` p ON p.plan_id = i.plan_id
WHERE o.created_at >= '2026-07-01'
  AND o.created_at <= '2026-09-30'
  AND o.customer_id NOT IN (1042, 1077, 2210, 3318)
GROUP BY p.plan_name
ORDER BY revenue_eur DESC
LIMIT 5;`,
    text: `SUMMARY|Adds up order totals from July to September by plan, after joining each order to its line items, and shows the five plans with the most.
GRAIN|Before adding up, one row is one order line item, so an order with three items appears three times.
MATCH|Partly|It groups Q3 revenue by plan, but each order total is repeated once per item and only five plans are kept.
STEP|1|FROM \`billing.orders\` o|Starts from orders.
STEP|2|JOIN \`billing.order_items\` i ON i.order_id = o.order_id|Attaches each order's line items, one row per item.
STEP|3|JOIN \`billing.plans\` p ON p.plan_id = i.plan_id|Looks up the plan name for each item.
STEP|4|WHERE o.created_at >= '2026-07-01'|Keeps orders from 1 July.
STEP|5|AND o.created_at <= '2026-09-30'|Up to midnight at the start of 30 September.
STEP|6|AND o.customer_id NOT IN (1042, 1077, 2210, 3318)|Leaves out four customers by ID.
STEP|7|SUM(o.order_total) AS revenue_eur|Adds up the order total on every remaining row.
STEP|8|GROUP BY p.plan_name|One result row per plan.
STEP|9|LIMIT 5|Shows only the five plans with the most revenue.
TRAP|Double counting|SUM(o.order_total) AS revenue_eur|order_total belongs to the order, but there is one row per item, so an order with three items is added three times.
TRAP|Rows dropped|LIMIT 5|Only five plans are shown, so the slide will not add up to Q3 revenue if there are more plans.
TRAP|Hardcoded filter|NOT IN (1042, 1077, 2210, 3318)|Four customer IDs are removed with no reason given. If they are test accounts, the list may be out of date.
QUESTION|Is revenue meant to be order totals, or item amounts after discounts and refunds?
QUESTION|Can one order include items from more than one plan? If so, how should its revenue be split?
QUESTION|Who are customers 1042, 1077, 2210 and 3318?
TERM|JOIN|Combine rows from two tables where the condition matches. One row can match many.
TERM|SUM|Add up a column over the rows in each group.
TERM|LIMIT|Return only the first few rows of the result.`
  },
  {
    id: 'containment',
    team: 'Conversational AI · voice agent',
    title: 'Containment rate for a voice agent',
    blurb: 'A go or no-go figure that comes out as 0 because of whole-number division, averages quiet days with busy ones and can lose every call to one empty test ID.',
    form: {
      question: 'What share of September calls did the voice agent resolve without a person?',
      dialect: 'PostgreSQL',
      use: 'A decision',
      author: 'Arjun'
    },
    query: `WITH daily AS (
  SELECT
    DATE(c.started_at) AS call_day,
    COUNT(*) FILTER (WHERE c.ended_by = 'agent') / COUNT(*) AS contained_rate
  FROM calls c
  WHERE c.started_at >= DATE '2026-09-01'
    AND c.started_at < DATE '2026-10-01'
    AND c.caller_id NOT IN (SELECT caller_id FROM test_callers)
  GROUP BY 1
)
SELECT AVG(contained_rate) AS containment
FROM daily;`,
    text: `SUMMARY|Works out, for each day in September, the share of calls the agent ended, then averages those daily shares into one figure.
GRAIN|In the first step one row is one day. The final answer is a single number.
MATCH|Partly|It aims at the right share, but in PostgreSQL the division returns 0 for every day, and calls the agent ended can include callers who gave up.
STEP|1|WITH daily AS (|Builds a temporary table of daily figures first.
STEP|2|DATE(c.started_at) AS call_day|Turns each call's start time into a calendar day, in the database time zone.
STEP|3|COUNT(*) FILTER (WHERE c.ended_by = 'agent')|Counts that day's calls that the agent ended.
STEP|4|/ COUNT(*) AS contained_rate|Divides by all calls that day.
STEP|5|c.started_at >= DATE '2026-09-01'|Keeps calls from 1 September.
STEP|6|AND c.started_at < DATE '2026-10-01'|Up to the end of 30 September.
STEP|7|AND c.caller_id NOT IN (SELECT caller_id FROM test_callers)|Leaves out callers on the test list.
STEP|8|SELECT AVG(contained_rate) AS containment|Averages the 30 daily shares into one figure.
TRAP|Integer division|/ COUNT(*) AS contained_rate|Both counts are whole numbers, so PostgreSQL drops the decimals. 412 out of 530 becomes 0.
TRAP|Null trap|NOT IN (SELECT caller_id FROM test_callers)|If any caller_id in test_callers is empty, NOT IN keeps no calls at all.
TRAP|Wrong average|AVG(contained_rate)|A quiet Sunday with 40 calls weighs as much as a Monday with 900.
TRAP|Time zone|DATE(c.started_at)|Days are cut at midnight in the database time zone, usually UTC, not the callers' local time.
QUESTION|Does ended_by = 'agent' include callers who hung up before getting an answer? If so, it counts give-ups as resolved.
QUESTION|Should the share be total contained calls over total calls, rather than an average of days?
QUESTION|Can caller_id be empty in test_callers?
TERM|WITH|Names a temporary result that the rest of the query can use.
TERM|FILTER|Counts only the rows that meet the condition in brackets.
TERM|NOT IN|Keeps rows whose value is not in the list. Fails if the list holds an empty value.`
  }
];
