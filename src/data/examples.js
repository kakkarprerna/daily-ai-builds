export const EXAMPLES = [
  {
    id: 'checkout',
    title: 'Checkout errors after a release',
    brief: {
      surface: 'Web app',
      failure: 'Error response',
      timing: "Right after a deploy",
      affected: 'All users',
      notes: "The card payment step returns a generic error for every checkout since this morning's release. The payment provider's status page shows no incidents.",
    },
    raw: `CANDIDATE: Backend / API (checkout service)
CONFIDENCE: 78
REASONING: The failure started right after a release, which is the single strongest timing signal available. | It affects everyone at checkout rather than one account or segment, which points upstream of the client. | The provider's own status page is clean, which argues against the fault sitting with them.
QUESTIONS: What changed in this morning's release that touches the checkout or payment call? | Does rolling back the release make checkout work again?
---
CANDIDATE: Third-party vendor (payment provider)
CONFIDENCE: 14
REASONING: Payment failures are the classic vendor symptom. | Status pages lag real incidents by minutes to hours, so a clean page doesn't fully rule this out.
QUESTIONS: Has the provider's error code or response body changed shape, not just started failing?
---
CANDIDATE: Infra / platform
CONFIDENCE: 8
REASONING: A deploy can also fail by exhausting a connection pool or hitting a new resource limit rather than a logic bug.
QUESTIONS: Are checkout service error logs showing timeouts or 5xx from infrastructure rather than application-level errors?
---
DRAFT_MESSAGE: Checkout has been failing for every user since this morning's release, generic error at the card payment step.\\nTiming lines up exactly with the deploy and it's affecting everyone, not one account, so this looks like it's on our side rather than the payment provider (their status page is clean).\\nCan someone check what in today's release touches the checkout or payment call, and whether a rollback clears it?`,
  },
  {
    id: 'search',
    title: 'Mobile search returns empty results',
    brief: {
      surface: 'Mobile app',
      failure: 'Missing data',
      timing: 'Suddenly, no known change',
      affected: 'A subset or segment',
      notes: 'Web search still works fine for the same accounts. Both iOS and Android are affected. No app release went out this week.',
    },
    raw: `CANDIDATE: Backend / API (mobile-facing endpoint)
CONFIDENCE: 64
REASONING: Web works for the same accounts, which rules out the underlying data and points at something specific to the mobile path. | Both iOS and Android are affected identically, which is a shared-server signal rather than a client-side bug on either platform. | No app release went out, which argues against a client code change.
QUESTIONS: Is mobile search served by a different endpoint or gateway than web search? | Did anything change server-side this week even without a mobile app release, a feature flag, a cache TTL, a schema field?
---
CANDIDATE: Third-party vendor (search or mobile backend-as-a-service)
CONFIDENCE: 22
REASONING: If mobile search runs through a separate indexing or search-as-a-service vendor that web doesn't use, silent drift there fits the pattern just as well.
QUESTIONS: Does the mobile search path depend on any vendor that the web path doesn't?
---
CANDIDATE: Mobile app (client)
CONFIDENCE: 9
REASONING: Still possible if both platforms share a common library, though no release makes this the least likely fit.
QUESTIONS: Do iOS and Android share a network or search SDK that could have hit a remote kill switch or config change?
---
DRAFT_MESSAGE: Search is returning empty results on both iOS and Android for a subset of accounts, but web search works fine for the exact same accounts.\\nNo mobile release went out this week, and both platforms broke the same way, so this looks like it's on the server side of whatever mobile search calls, not the client.\\nCan you check whether mobile search hits a different endpoint or gateway than web, and whether anything changed there recently, a flag, a cache setting, a field?`,
  },
  {
    id: 'digest',
    title: 'Weekly digest stops for EU users',
    brief: {
      surface: 'Internal tool',
      failure: 'Wrong behaviour',
      timing: 'Suddenly, no known change',
      affected: 'A subset or segment',
      notes: 'US users still get the weekly digest fine. No recent deploy on our side. EU users are routed through a separate region for data residency reasons.',
    },
    raw: `CANDIDATE: Third-party vendor (email delivery, EU region)
CONFIDENCE: 71
REASONING: The affected segment maps exactly onto a known infrastructure split, EU users on a separate routing region, which is a strong and specific match. | US users on the same product are unaffected, which points away from anything in our own send logic. | No deploy on our side removes the most common alternative explanation.
QUESTIONS: Does the EU email region's dashboard or status page show delivery failures or throttling in the same window? | Are EU sends erroring outright, or being accepted and silently dropped?
---
CANDIDATE: Notifications / messaging (send pipeline)
CONFIDENCE: 19
REASONING: Even with a clean vendor, our own EU-region send job or queue could be the thing that's stalled, since it's the piece unique to that region on our side too.
QUESTIONS: Is there a separate scheduled job or queue for EU sends, and is it still running?
---
CANDIDATE: Data pipeline / analytics
CONFIDENCE: 6
REASONING: Less likely, but worth ruling out if the digest is populated by a segmented data feed that could have quietly stopped producing EU rows.
QUESTIONS: Is the digest's underlying data present for EU users this week, or is the list itself empty before it even reaches send?
---
DRAFT_MESSAGE: The weekly digest has stopped reaching EU users while US users are getting it fine, no deploy on our side this week.\\nEU sends run through a separate region for data residency, and that's the one difference between the two groups, so this looks like it's on the email delivery side for that region rather than our send logic.\\nCould you check the EU region's delivery status for this week's send, and whether EU messages are erroring or just going out and disappearing?`,
  },
]
