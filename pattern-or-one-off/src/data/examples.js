export const examples = [
  {
    id: 'checkout-safari',
    label: 'Checkout button unresponsive',
    inputs: {
      symptom:
        "Checkout 'Place order' button becomes unresponsive on mobile Safari after selecting a shipping method. No error shown, the page just stops responding to taps.",
      occurrences: '2-3 times before',
      timePattern: ['Same time of day', 'Following a recent deploy'],
      affected: 'Small % of users',
      changedNearby: 'Recent deploy',
      notes:
        'Three support tickets across three separate days, all in the evening CET. All from iOS Safari.',
    },
    result: {
      verdict: 'Pattern',
      confidence: 'High',
      reasoning:
        "This has come up two to three times already, always in the same evening window, on the same platform, and it started lining up with a recent deploy. A single narrow signature repeating this consistently is rarely coincidence — it usually means a code path a deploy touched or exposed, not a one-off user issue.",
      checks: [
        'Line up the three ticket timestamps against the deploy history to confirm the correlation',
        "Check whether the shipping-method selector attaches any Safari-specific event listener",
        "See whether the evening timing lines up with a shipping carrier's API response time rather than the deploy itself",
      ],
      ifPattern:
        'Escalate as a likely regression in shipping-method selection on iOS Safari. Loop in whoever owns the checkout front end, and hand over the three ticket dates alongside the deploy log.',
      flip:
        'If the earlier two reports turn out to trace back to the same user or the same device, this drops from a platform pattern to a coincidence — worth confirming before escalating.',
    },
  },
  {
    id: 'profile-picture',
    label: 'Profile picture not updating',
    inputs: {
      symptom:
        'User uploaded a new profile picture, saw the upload succeed, but their profile still shows the old picture.',
      occurrences: 'First time',
      timePattern: ['No clear pattern'],
      affected: 'One user',
      changedNearby: 'Nothing known changed',
      notes:
        'User is on a slow home wifi connection and mentioned the page had been open in a second tab at the same time.',
    },
    result: {
      verdict: 'One-off',
      confidence: 'Medium',
      reasoning:
        "One report, nothing changed nearby, and there's a believable client-side explanation already on the table: a stale second tab or a slow connection interrupting the re-fetch. Nothing here points past this one session.",
      checks: [
        'Ask the user to hard-refresh or clear cache and check again',
        'Confirm server-side that the file and the database record both updated',
        'Ask if the old picture still shows in a fresh incognito window',
      ],
      ifOneoff:
        'Close it out with a cache-refresh instruction. Worth a light note in case a second report lands, but nothing to escalate yet.',
      flip:
        'A second, unrelated user reporting the same symptom within a few days would be enough to reopen this as a possible pattern.',
    },
  },
  {
    id: 'search-zero-results',
    label: 'Search returns zero results',
    inputs: {
      symptom:
        'Search returns zero results when a date range filter is combined with a category filter, even though matching listings clearly exist.',
      occurrences: '4+ times before',
      timePattern: ['After a specific trigger/action', 'Following a recent deploy'],
      affected: 'Large % of users',
      changedNearby: 'Recent config/flag change',
      notes:
        "Started right after last week's search-index config change. Reproducible every time both filters are combined.",
    },
    result: {
      verdict: 'Pattern',
      confidence: 'High',
      reasoning:
        "A reproducible trigger, a high report count, a large share of users affected, and a known config change in the same window — this is about as close to confirmed as a pre-engineering read can get.",
      checks: [
        'Reproduce on a test account with both filters combined and confirm it fails every time',
        "Check last week's search-index config diff for anything touching combined-filter queries",
        'Confirm whether single-filter searches (date only, or category only) still return correctly',
      ],
      ifPattern:
        'Treat this as confirmed rather than merely likely. Escalate directly with the reproduction steps and the config change date, no need to gather more instances first.',
      flip:
        'If single-filter searches also started failing at the same time, the cause is broader than the combined-filter path — worth flagging that distinction when escalating.',
    },
  },
]
