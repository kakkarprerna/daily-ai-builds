import React, { useState, useMemo, useRef } from "react";
import {
  ArrowDown,
  ArrowRight,
  ClipboardPaste,
  Database,
  Gauge,
  HelpCircle,
  Lock,
  Plug,
  ScanSearch,
  Shuffle,
  Target,
  BookOpen,
  FileText,
  ListChecks,
  Type,
  Grid3x3,
  Settings2,
  Plus,
  Check,
  Copy,
  X,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Palette: one dominant colour (cobalt) used at several levels.       */
/*  Red / amber / green appear only as status signals.                  */
/* ------------------------------------------------------------------ */
const C = {
  bg: "#F3F5FC",
  card: "#FFFFFF",
  line: "#E2E7F7",
  lineSoft: "#EDF0FA",
  ink: "#111B36",
  ink2: "#465278",
  ink3: "#7A85A6",
  brand: "#1C3FD6",
  brandDeep: "#122796",
  brandMid: "#5C79F0",
  brandSoft: "#E7EBFF",
  brandFaint: "#F2F4FF",
  red: "#B4271F",
  redSoft: "#FBEAE8",
  amber: "#9A6410",
  amberSoft: "#FBF1E1",
  green: "#186B45",
  greenSoft: "#E6F3EC",
};

const FONT =
  "Outfit, 'Segoe UI', system-ui, -apple-system, Helvetica, Arial, sans-serif";

const STAGE = {
  build: {
    label: "Blocks the build",
    note: "Engineering cannot start this part without an answer",
    weight: 3,
    fg: C.red,
    bg: C.redSoft,
  },
  test: {
    label: "Blocks sign-off",
    note: "Coding can start, but nobody can agree it is finished",
    weight: 2,
    fg: C.amber,
    bg: C.amberSoft,
  },
  launch: {
    label: "Blocks launch",
    note: "Fine to defer, painful to discover in launch week",
    weight: 1,
    fg: C.green,
    bg: C.greenSoft,
  },
};

/* ------------------------------------------------------------------ */
/*  The rule set. Every probe fires when a trigger is present in the    */
/*  spec and no satisfying phrase is found anywhere in it.              */
/* ------------------------------------------------------------------ */
const PROBES = [
  /* ---------------- Data and state ---------------- */
  {
    id: "data-home",
    area: "Data and state",
    stage: "build",
    question: "Where does this data live, and which system owns it?",
    why: "Nobody can write the first line until the store and the owner are named.",
    answer:
      "Name the store and the owning service, for example: new table in the claims service, one row per notification.",
    triggers:
      /\b(save|saved|saving|store|stored|record|records|history|profile|settings|log|logged|capture)\b/i,
    satisfies:
      /\b(schema|table|column|field|data model|database|stored in|entity|collection|postgres|supabase|new record type)\b/i,
  },
  {
    id: "data-existing",
    area: "Data and state",
    stage: "build",
    question: "What happens to everything that already exists?",
    why: "A change to live behaviour needs a decision on existing rows before anyone touches the code.",
    answer:
      "State whether existing records are backfilled, left on the old behaviour, or migrated on next write.",
    triggers:
      /\b(change|changing|replace|replacing|instead of|today the|currently|existing|rename|move away|deprecat)\w*/i,
    satisfies:
      /\b(backfill|migrat\w+|existing (records|rows|users|customers|data) (will|are|get)|no migration|leave existing)\b/i,
    contexts: ["Change to existing", "Migration"],
  },
  {
    id: "data-empty",
    area: "Data and state",
    stage: "test",
    question: "What does the screen show when there is nothing to show?",
    why: "The empty case is usually the first thing a tester hits and the last thing a spec covers.",
    answer:
      "Write the exact empty state copy and say what action it offers.",
    triggers:
      /\b(list|feed|table|dashboard|results|history|timeline|inbox|report|view of)\b/i,
    satisfies: /\b(empty state|no results|nothing yet|zero state|first[- ]time|blank state)\b/i,
  },
  {
    id: "data-retention",
    area: "Data and state",
    stage: "launch",
    question: "How long is this kept, and who can delete it?",
    why: "Retention is cheap to decide now and expensive to retrofit after the first deletion request.",
    answer:
      "Give a retention period and say whether deletion is user triggered, automatic, or both.",
    triggers:
      /\b(upload|uploaded|personal data|customer data|recording|transcript|document|attachment|message history|audit)\b/i,
    satisfies: /\b(retention|retained for|deleted after|purge|archiv\w+|right to erasure|gdpr)\b/i,
  },

  /* ---------------- Behaviour and edge cases ---------------- */
  {
    id: "edge-failure",
    area: "Behaviour and edge cases",
    stage: "build",
    question: "What happens when this fails?",
    why: "Every call that leaves the process can fail, and the retry decision changes the design.",
    answer:
      "Say what the user sees, whether it retries, how many times, and where the failure is recorded.",
    triggers:
      /\b(send|sends|sent|notify|notification|upload|sync|call|calls|integrat\w+|api|webhook|payment|email|sms|push)\b/i,
    satisfies:
      /\b(fails|failure|error|errors|retry|retries|timeout|time out|fallback|unavailable|degraded)\b/i,
  },
  {
    id: "edge-concurrent",
    area: "Behaviour and edge cases",
    stage: "build",
    question: "What happens when two people do this at the same time?",
    why: "Shared objects need a conflict rule, and choosing one later means reworking the write path.",
    answer:
      "Pick a rule: last write wins, first write locks, or merge, and say what the loser sees.",
    triggers:
      /\b(shared|share|team|collaborat\w+|assign|assigned|multiple users|both|agent and|ops (can|should)|reviewer)\b/i,
    satisfies:
      /\b(concurrent|at the same time|conflict|lock|locked|last (write|speaker|edit|update) wins|version|optimistic|who wins)\b/i,
  },
  {
    id: "edge-partial",
    area: "Behaviour and edge cases",
    stage: "test",
    question: "What happens if someone stops halfway through?",
    why: "Multi step flows need a rule for abandoned work before the data model is fixed.",
    answer:
      "Say whether partial work is saved, discarded, or resumable, and for how long.",
    triggers:
      /\b(flow|steps|step \d|wizard|form|onboarding|sign[- ]?up|multi[- ]step|journey|process)\b/i,
    satisfies: /\b(draft|drafts|resume|abandon\w*|partial|incomplete|save and (return|continue))\b/i,
  },
  {
    id: "edge-limits",
    area: "Behaviour and edge cases",
    stage: "build",
    question: "What are the limits, and what happens at the limit?",
    why: "An unbounded input is a load test waiting to happen in production.",
    answer:
      "Give a maximum count or size, and say what the user sees when they hit it.",
    triggers:
      /\b(upload|bulk|import|batch|list of|search|export|all their|any number|large|many)\b/i,
    satisfies:
      /\b(max|maximum|limit|limited to|up to \d|cap|capped|per page|page size|no more than)\b/i,
  },
  {
    id: "edge-undo",
    area: "Behaviour and edge cases",
    stage: "test",
    question: "Can this be undone, and by whom?",
    why: "Reversibility decides whether a confirmation step is needed, which changes the screens.",
    answer:
      "Say whether the action is reversible, who can reverse it, and within what window.",
    triggers: /\b(delete|remove|cancel|archive|close|revoke|approve|reject|publish|send)\b/i,
    satisfies: /\b(undo|undone|revers\w+|restore|confirm\w* (dialog|step)|cannot be undone|permanent)\b/i,
  },

  /* ---------------- Access and permissions ---------------- */
  {
    id: "perm-who",
    area: "Access and permissions",
    stage: "build",
    question: "Which roles can see this, and which can act on it?",
    why: "Permissions sit in the data query, so they are structural rather than a later toggle.",
    answer:
      "List each role and mark it as view, act, or neither. Say what happens if a role has no access.",
    triggers:
      /\b(admin|manager|ops|agent|broker|user can|users can|team|customer can|internal|staff|supervisor)\b/i,
    satisfies:
      /\b(role|roles|permission|permissions|only .{0,25}(can|may) |access level|rbac|scoped to)\b/i,
  },
  {
    id: "perm-auth",
    area: "Access and permissions",
    stage: "test",
    question: "Is this behind a login, and what does a logged out visitor get?",
    why: "The auth boundary decides routing and caching, and it is rarely stated out loud.",
    answer:
      "Say whether the page is authenticated, and what an unauthenticated visitor sees.",
    triggers: /\b(page|screen|link|view|portal|dashboard|url|shareable)\b/i,
    satisfies: /\b(logged in|log in|signed in|authenticat\w+|public|anonymous|session)\b/i,
  },

  /* ---------------- Dependencies ---------------- */
  {
    id: "dep-third",
    area: "Dependencies",
    stage: "build",
    question: "Who owns the system on the other side of this, and what does it allow?",
    why: "A dependency you do not control sets the ceiling for everything promised around it.",
    answer:
      "Name the system, the team or vendor who owns it, and any rate or quota limits already known.",
    triggers:
      /\b(integrat\w+|third[- ]party|vendor|existing (system|platform)|crm|salesforce|twilio|stripe|their (api|system)|external)\b/i,
    satisfies:
      /\b(rate limit|quota|sandbox|credentials|contract|owned by|their team|api version|sla)\b/i,
    contexts: ["Integration"],
  },
  {
    id: "dep-channel",
    area: "Dependencies",
    stage: "test",
    question: "Which channel carries this, and who writes the words in it?",
    why: "Notification work stalls on copy ownership more often than on the code.",
    answer:
      "Name the channel, say who drafts the copy, and say whether the user can turn it off.",
    triggers: /\b(notify|notified|notification|alert|remind|message them|inform|tell (them|the))\b/i,
    satisfies:
      /\b(email|sms|push|in[- ]app|template|copy (is|will)|opt[- ]out|unsubscribe|preference)\b/i,
  },

  /* ---------------- Non-functional ---------------- */
  {
    id: "nf-speed",
    area: "Non-functional",
    stage: "build",
    question: "How fast is fast enough, in numbers?",
    why: "Speed words map to different architectures, and picking wrong means rebuilding the query layer.",
    answer:
      "Give a target such as: returns in under two seconds for a creator with five million followers.",
    triggers:
      /\b(fast|quick\w*|instant\w*|real[- ]?time|immediate\w*|responsive|snappy|without delay|straight away)\b/i,
    satisfies:
      /\b(\d+\s?(ms|milliseconds|seconds|secs|minutes)|p9[059]|latency of|within \d)\b/i,
  },
  {
    id: "nf-volume",
    area: "Non-functional",
    stage: "build",
    question: "How much data and how many users does this need to hold up under?",
    why: "Volume decides whether this is a live query or a precomputed job.",
    answer:
      "Give the expected number of records, the peak rate, and the largest single case.",
    triggers:
      /\b(scal\w+|large|volume|traffic|all customers|every user|enterprise|heavy|millions|thousands)\b/i,
    satisfies:
      /\b(\d[\d,.]*\s?(k|m|records|rows|users|requests|calls|per (second|minute|hour|day)))\b/i,
  },
  {
    id: "nf-surface",
    area: "Non-functional",
    stage: "test",
    question: "Which devices and browsers are in scope?",
    why: "Scope on this changes the estimate more than most feature decisions do.",
    answer:
      "Name the surfaces in scope and the ones explicitly out of scope for this release.",
    triggers: /\b(screen|page|ui|interface|design|layout|button|view|app)\b/i,
    satisfies:
      /\b(mobile|desktop|responsive|browser|safari|chrome|ios|android|tablet|web only)\b/i,
  },
  {
    id: "nf-locale",
    area: "Non-functional",
    stage: "test",
    question: "Which languages, currencies, and time zones does this cover?",
    why: "Locale reaches into copy, storage, and formatting, so it is not a late addition.",
    answer:
      "List the locales in scope and say who supplies the translated copy.",
    triggers:
      /\b(language|languages|multilingual|copy|message|text|date|time|currency|price|amount|region|market)\b/i,
    satisfies:
      /\b(locale|localis\w+|localiz\w+|translat\w+|i18n|time ?zone|utc|currency of|english|spanish|french|german|portuguese|arabic|hindi)\b/i,
  },

  /* ---------------- Done and measurement ---------------- */
  {
    id: "done-ac",
    area: "Done and measurement",
    stage: "test",
    question: "What are the acceptance criteria?",
    why: "Without them, sign-off becomes an opinion and the ticket bounces between review and rework.",
    answer:
      "Write criteria a tester can pass or fail without asking you anything.",
    always: true,
    satisfies:
      /\b(acceptance criteria|definition of done|given .{0,40}when |success criteria|passes when|test cases)\b/i,
  },
  {
    id: "done-metric",
    area: "Done and measurement",
    stage: "launch",
    question: "What number tells you this worked?",
    why: "A metric named after the build is a metric fitted to the result.",
    answer:
      "Give the metric, its value today, and the value that would count as success.",
    always: true,
    satisfies:
      /\b(\d+\s?%|percent|baseline|from \d.{0,20}to \d|reduce .{0,20}by|increase .{0,20}by|success metric|north star)\b/i,
  },
  {
    id: "done-events",
    area: "Done and measurement",
    stage: "launch",
    question: "Which events need instrumenting, and where do they land?",
    why: "Events added after release cannot answer questions about the weeks before it.",
    answer:
      "List the event names, their properties, and the tool that receives them.",
    always: true,
    satisfies:
      /\b(event|events|instrument\w*|analytics|tracking|track when|amplitude|mixpanel|segment|dashboard of)\b/i,
  },
  {
    id: "done-rollout",
    area: "Done and measurement",
    stage: "launch",
    question: "Who gets this first, and how do you turn it off?",
    why: "A rollout plan decided after the code is written usually means shipping to everyone at once.",
    answer:
      "Name the first group, the flag that controls it, and the signal that would make you roll back.",
    triggers: /\b(ship|launch|release|roll ?out|go live|this quarter|deploy)\b/i,
    satisfies:
      /\b(feature flag|flag|pilot|beta|phased|cohort|rollback|roll back|kill switch|percentage of)\b/i,
  },
];

/* ------------------------------------------------------------------ */
/*  Wording scanner. Phrases that read as agreement in a review and     */
/*  as an open question in an estimate.                                 */
/* ------------------------------------------------------------------ */
const VAGUE = [
  { term: "seamless", hears: "No stated behaviour at all.", fix: "Describe the exact sequence the user sees." },
  { term: "seamlessly", hears: "No stated behaviour at all.", fix: "Describe the exact sequence the user sees." },
  { term: "intuitive", hears: "Design is undecided and will be argued about later.", fix: "Name the pattern, for example: same picker as the filters bar." },
  { term: "user-friendly", hears: "Design is undecided.", fix: "Point at an existing screen to copy." },
  { term: "robust", hears: "Someone will decide the error handling for you.", fix: "List the failures it must survive." },
  { term: "scalable", hears: "Unknown load.", fix: "Give the volume it has to hold at peak." },
  { term: "simple", hears: "Simple for whom, and compared with what.", fix: "Cut it or name the number of steps." },
  { term: "easy", hears: "Simple for whom.", fix: "Cut it or name the number of steps." },
  { term: "quickly", hears: "No latency budget.", fix: "Give a time in seconds." },
  { term: "fast", hears: "No latency budget.", fix: "Give a time in seconds." },
  { term: "real-time", hears: "Could be a websocket or a one minute poll, a very different build.", fix: "State the acceptable delay." },
  { term: "real time", hears: "Could be a websocket or a one minute poll.", fix: "State the acceptable delay." },
  { term: "etc", hears: "The list is open and the estimate is a guess.", fix: "Finish the list or mark the rest out of scope." },
  { term: "and so on", hears: "The list is open.", fix: "Finish the list." },
  { term: "various", hears: "Count unknown.", fix: "Name them." },
  { term: "several", hears: "Count unknown.", fix: "Give the number." },
  { term: "most users", hears: "No segment defined.", fix: "Name the segment and its size." },
  { term: "should be able to", hears: "Permission and entry point both unstated.", fix: "Say who, from where, and under what condition." },
  { term: "tbd", hears: "This is not ready to estimate.", fix: "Answer it or move it out of this release." },
  { term: "tbc", hears: "This is not ready to estimate.", fix: "Answer it or move it out of this release." },
  { term: "handle", hears: "Behaviour hidden behind a verb.", fix: "Say what actually happens." },
  { term: "support", hears: "Behaviour hidden behind a verb.", fix: "Say what the user can do, step by step." },
  { term: "manage", hears: "Behaviour hidden behind a verb.", fix: "List the actions: create, edit, delete." },
  { term: "appropriate", hears: "Someone else decides.", fix: "State the rule." },
  { term: "relevant", hears: "Filter rule undefined.", fix: "State what qualifies." },
  { term: "properly", hears: "Correctness undefined.", fix: "State the expected output." },
  { term: "if necessary", hears: "Condition undefined.", fix: "State the condition." },
  { term: "where applicable", hears: "Condition undefined.", fix: "List the cases where it applies." },
  { term: "flexible", hears: "Configuration surface unknown, often the largest hidden cost.", fix: "List what is configurable and by whom." },
  { term: "optimise", hears: "No target.", fix: "Give the number you want to move." },
  { term: "optimize", hears: "No target.", fix: "Give the number you want to move." },
  { term: "improve", hears: "No baseline.", fix: "Give today's number and the target." },
  { term: "enhance", hears: "No baseline.", fix: "Give today's number and the target." },
  { term: "streamline", hears: "No baseline.", fix: "Say which steps are removed." },
  { term: "better", hears: "No baseline.", fix: "Better than what, by how much." },
  { term: "nice to have", hears: "It will be cut, quietly.", fix: "Move it out of the release or commit to it." },
  { term: "make sure", hears: "Responsibility unassigned.", fix: "Say which part of the system enforces it." },
];

/* ------------------------------------------------------------------ */
/*  Worked examples                                                     */
/* ------------------------------------------------------------------ */
const EXAMPLES = [
  {
    name: "Voice agent barge-in",
    blurb: "Conversational AI feature written the way it usually arrives",
    context: {
      "What is being built": "Change to existing",
      "Who it is for": "External customers",
      "Where it runs": "Voice channel",
    },
    text: `Barge-in for voice agents

Problem: customers try to interrupt the agent and it talks straight over them. It feels unnatural and they hang up.

What we want: the agent should stop quickly when the customer starts speaking, and pick up the conversation where it left off. This should be seamless across all our supported languages and work for every enterprise client.

Ops should be able to see when barge-in happens so they can tune it per client. We want to improve containment.

Aiming to ship this quarter.`,
  },
  {
    name: "Audience overlap endpoint",
    blurb: "API spec for an analytics platform, light on limits",
    context: {
      "What is being built": "New feature",
      "Who it is for": "External customers",
      "Where it runs": "API",
    },
    text: `Audience overlap endpoint

Agencies keep asking us which of two creators share the same audience, and today they export two CSVs and do it by hand.

We will expose an endpoint that takes two creator handles and returns an overlap percentage plus the top shared interests. It should be fast even for large creators.

Existing customers on the growth plan get it automatically. Docs will be updated. Support should be able to see usage.`,
  },
  {
    name: "Claim status notifications",
    blurb: "Insurance workflow spec that depends on a system we do not own",
    context: {
      "What is being built": "Integration",
      "Who it is for": "Both",
      "Where it runs": "Web",
    },
    text: `Claim status notifications

Policyholders ring the contact centre to ask where their claim is. Around a third of calls are just status chasing.

We should notify them whenever the status changes so they stop calling. The message needs to be clear and include the next steps. Brokers should also see the update on their dashboard.

This needs to work with the existing claims platform. Nice to have: let them reply to the notification.`,
  },
  {
    name: "Barge-in, second draft",
    blurb: "The first example after the questions have been answered, for contrast",
    context: {
      "What is being built": "Change to existing",
      "Who it is for": "External customers",
      "Where it runs": "Voice channel",
    },
    text: `Barge-in for voice agents, second draft

Problem: callers interrupt the agent and it talks over them. Calls containing an interrupt end in a hang-up 34% of the time, against 11% across all calls.

Behaviour: when caller speech is detected for 300 ms above the noise floor, agent audio stops within 200 ms and the turn passes to the caller. On resuming, the agent restarts the interrupted sentence rather than continuing mid-sentence.

Scope: voice channel on web, English and Spanish only. Portuguese is out of scope for this release. Desktop and mobile browsers both in scope.

Existing calls: conversations already in flight keep the old behaviour. No migration and no backfill of past calls.

Failure: if the detector errors or times out, the agent falls back to current behaviour and finishes its turn. The failure is recorded against the call.

Limits: capped at 5 interrupts per turn. On the sixth, the agent asks the caller to hold.

Permissions: the client admin role can switch barge-in on or off per client. Ops has view access only. Callers have no control.

Data model: one row per event on the existing call_events table, with client id, turn id and latency. Retention of 90 days, matching call recordings, deleted earlier on request.

Concurrency: a caller and a supervisor can both be on the line. Last speaker wins and the transcript records who triggered it.

Acceptance criteria: given the agent is speaking, when the caller speaks for 300 ms, then agent audio stops within 200 ms and a barge-in event appears on the transcript.

Empty state: the ops view shows "No barge-in events yet" with a link to the tuning guide.

Instrumentation: barge_in_triggered and barge_in_failed events, with client id and latency, sent to Amplitude.

Success metric: hang-up rate on interrupted calls falls from 34% to 15% within six weeks.

Rollout: feature flag per client, three pilot clients first, roll back if the failure rate goes above 2%.`,
  },
];

const CHIP_GROUPS = [
  {
    label: "What is being built",
    options: ["New feature", "Change to existing", "Integration", "Migration", "Data or reporting"],
  },
  {
    label: "Who it is for",
    options: ["Internal users", "External customers", "Both"],
  },
  {
    label: "Where it runs",
    options: ["Web", "Mobile app", "API", "Background job", "Voice channel"],
  },
];

const FLOW = [
  {
    icon: ClipboardPaste,
    title: "Paste the draft",
    body: "A PRD, a ticket, or rough notes. It stays in your browser.",
  },
  {
    icon: ScanSearch,
    title: "It runs the checks",
    body: "Fixed rules matched against your words. No model behind it, no key to enter.",
  },
  {
    icon: ListChecks,
    title: "You get a checklist",
    body: "Open questions ranked by whether they block the build, sign-off, or launch.",
  },
];

const AREA_META = [
  {
    area: "Data and state",
    icon: Database,
    line: "Where it lives, who owns it, and what happens to the records already there.",
  },
  {
    area: "Behaviour and edge cases",
    icon: Shuffle,
    line: "Failure paths, limits, half-finished work, and two people acting at once.",
  },
  {
    area: "Access and permissions",
    icon: Lock,
    line: "Which roles can see it, which can act, and what a logged out visitor gets.",
  },
  {
    area: "Dependencies",
    icon: Plug,
    line: "Systems you do not control, and who writes the words they carry.",
  },
  {
    area: "Non-functional",
    icon: Gauge,
    line: "Speed in numbers, volume at peak, devices in scope, languages covered.",
  },
  {
    area: "Done and measurement",
    icon: Target,
    line: "Acceptance criteria, the metric that moves, and the events behind it.",
  },
];

const GOOD_AT = [
  "Catching the decision you meant to make later and then forgot.",
  "Ranking gaps by what they hold up, so you know what to answer tonight.",
  "Naming wording that passes a review and stalls an estimate.",
  "Handing you a checklist you can paste straight into the ticket.",
];

const CANNOT_DO = [
  "It does not understand your product. It matches words and patterns.",
  "It cannot tell whether the answer you gave is a good one.",
  "It misses anything phrased in words the rules do not know.",
  "It raises questions that do not apply. Dismiss those and move on.",
];

const SECTIONS = [
  { id: "start", name: "Start here", desc: "What this checks and what it cannot", icon: BookOpen },
  { id: "spec", name: "Your spec", desc: "Paste the draft and set the context", icon: FileText },
  { id: "questions", name: "Questions", desc: "Ranked by what each one blocks", icon: ListChecks },
  { id: "wording", name: "Wording", desc: "Phrases that read as unfinished decisions", icon: Type },
  { id: "coverage", name: "Coverage", desc: "Which areas the spec touches", icon: Grid3x3 },
  { id: "method", name: "Method", desc: "Every rule, written out in full", icon: Settings2 },
];

/* ------------------------------------------------------------------ */
/*  Analysis                                                            */
/* ------------------------------------------------------------------ */
function analyse(text, chosen) {
  const clean = text || "";
  const hasText = clean.trim().length > 40;
  if (!hasText) return null;

  const picked = Object.values(chosen).flat();

  const applicable = [];
  const findings = [];

  PROBES.forEach((p) => {
    let evidence = null;
    let isApplicable = false;

    if (p.always) {
      isApplicable = true;
    } else if (p.triggers) {
      const m = clean.match(p.triggers);
      if (m) {
        isApplicable = true;
        evidence = m[0];
      }
    }
    if (!isApplicable && p.contexts && p.contexts.some((c) => picked.includes(c))) {
      isApplicable = true;
      evidence = p.contexts.find((c) => picked.includes(c));
    }
    if (!isApplicable) return;

    applicable.push(p);
    const covered = p.satisfies ? p.satisfies.test(clean) : false;
    if (!covered) findings.push({ ...p, evidence });
  });

  /* custom context options the spec never mentions */
  const customGaps = [];
  Object.entries(chosen).forEach(([label, values]) => {
    const preset = CHIP_GROUPS.find((g) => g.label === label)?.options || [];
    values
      .filter((v) => !preset.includes(v))
      .forEach((v) => {
        const word = v.trim().split(/\s+/)[0];
        if (word.length < 3) return;
        const re = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        if (!re.test(clean)) {
          customGaps.push({
            id: "custom-" + v,
            area: "Your context",
            stage: "build",
            question: `You tagged this as "${v}", but the spec never mentions it. What changes because of it?`,
            why: "Context you hold in your head is the most common source of a rewritten ticket.",
            answer: `Add a line saying how "${v}" changes the behaviour, the data, or who can use it.`,
            evidence: v,
          });
        }
      });
  });

  const all = [...customGaps, ...findings].sort(
    (a, b) => STAGE[b.stage].weight - STAGE[a.stage].weight
  );

  /* wording */
  const lower = clean.toLowerCase();
  const wording = [];
  VAGUE.forEach((v) => {
    const re = new RegExp(`(^|[^a-z])${v.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`, "gi");
    let m;
    const spots = [];
    while ((m = re.exec(lower)) !== null && spots.length < 3) {
      const at = m.index + m[1].length;
      const from = Math.max(0, at - 45);
      const to = Math.min(clean.length, at + v.term.length + 45);
      spots.push({
        before: (from > 0 ? "…" : "") + clean.slice(from, at),
        hit: clean.slice(at, at + v.term.length),
        after: clean.slice(at + v.term.length, to) + (to < clean.length ? "…" : ""),
      });
      if (re.lastIndex === m.index) re.lastIndex++;
    }
    if (spots.length) wording.push({ ...v, spots });
  });

  const areas = {};
  PROBES.forEach((p) => {
    if (!areas[p.area]) areas[p.area] = { total: 0, applicable: 0, answered: 0 };
    areas[p.area].total += 1;
  });
  areas["Your context"] = { total: customGaps.length, applicable: customGaps.length, answered: 0 };
  applicable.forEach((p) => {
    areas[p.area].applicable += 1;
    if (!findings.find((f) => f.id === p.id)) areas[p.area].answered += 1;
  });

  const words = clean.trim().split(/\s+/).length;

  return {
    questions: all,
    wording,
    areas,
    applicable: applicable.length,
    answered: applicable.length - findings.length,
    words,
    blockers: all.filter((q) => q.stage === "build").length,
  };
}

/* Turns a rule's answer test into something readable, so the Method
   section can show what each rule actually looks for. */
function readableTerms(re) {
  if (!re) return "nothing, this rule always raises its question";
  let s = String(re).replace(/^\//, "").replace(/\/[a-z]*$/, "");
  s = s
    .replace(/\\b/g, "")
    .replace(/\\w[+*]?/g, "")
    .replace(/\\d[+*]?/g, "")
    .replace(/\\s\??/g, " ")
    .replace(/\{\d+(,\d+)?\}/g, "")
    .replace(/[\[\]()^$?+*.]/g, "");
  return s
    .split("|")
    .map((t) => t.replace(/\s+/g, " ").trim())
    .filter((t) => t.length > 2 && /^[a-z][a-z ]*$/.test(t))
    .slice(0, 6)
    .join(", ");
}

/* ------------------------------------------------------------------ */
/*  Small pieces                                                        */
/* ------------------------------------------------------------------ */
function Pill({ children, tone = "brand", size = "sm" }) {
  const tones = {
    brand: { bg: C.brandSoft, fg: C.brandDeep },
    red: { bg: C.redSoft, fg: C.red },
    amber: { bg: C.amberSoft, fg: C.amber },
    green: { bg: C.greenSoft, fg: C.green },
    quiet: { bg: C.lineSoft, fg: C.ink2 },
  }[tone];
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${
        size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm"
      }`}
      style={{ background: tones.bg, color: tones.fg }}
    >
      {children}
    </span>
  );
}

function Card({ children, style, className = "" }) {
  return (
    <div
      className={`rounded-3xl ${className}`}
      style={{
        background: C.card,
        border: `1px solid ${C.line}`,
        boxShadow: "0 1px 2px rgba(17,27,54,0.04), 0 8px 24px rgba(17,27,54,0.05)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionHead({ title, sub }) {
  return (
    <div className="mb-8">
      <h2 className="text-3xl font-bold tracking-tight" style={{ color: C.ink }}>
        {title}
      </h2>
      {sub && (
        <p className="mt-2 text-base leading-relaxed" style={{ color: C.ink2, maxWidth: "62ch" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function ChipRow({ group, chosen, onToggle, onAdd }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const values = chosen[group.label] || [];
  const custom = values.filter((v) => !group.options.includes(v));

  const commit = () => {
    const v = draft.trim();
    if (v) onAdd(group.label, v);
    setDraft("");
    setAdding(false);
  };

  return (
    <div className="mb-6">
      <div className="mb-3 text-sm font-semibold" style={{ color: C.ink2 }}>
        {group.label}
      </div>
      <div className="flex flex-wrap gap-2">
        {[...group.options, ...custom].map((opt) => {
          const on = values.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => onToggle(group.label, opt)}
              className="rounded-full px-4 py-2 text-sm font-medium transition-colors"
              style={{
                background: on ? C.brand : C.card,
                color: on ? "#fff" : C.ink2,
                border: `1px solid ${on ? C.brand : C.line}`,
              }}
            >
              {opt}
            </button>
          );
        })}
        {adding ? (
          <span
            className="inline-flex items-center rounded-full pl-4 pr-1 py-1"
            style={{ border: `1px solid ${C.brandMid}`, background: C.card }}
          >
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") {
                  setDraft("");
                  setAdding(false);
                }
              }}
              placeholder="Type and press enter"
              className="bg-transparent text-sm outline-none"
              style={{ color: C.ink, width: 150 }}
            />
            <button onClick={commit} className="rounded-full p-1.5" style={{ background: C.brandSoft }}>
              <Check size={14} color={C.brandDeep} />
            </button>
          </span>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium"
            style={{ border: `1px dashed ${C.brandMid}`, color: C.brand, background: C.brandFaint }}
          >
            <Plus size={14} /> Add your own
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  App                                                                 */
/* ------------------------------------------------------------------ */
export default function Handback() {
  const [section, setSection] = useState("start");
  const [text, setText] = useState("");
  const [chosen, setChosen] = useState({});
  const [copied, setCopied] = useState(false);
  const [loaded, setLoaded] = useState(null);
  const mainRef = useRef(null);

  const result = useMemo(() => analyse(text, chosen), [text, chosen]);

  const go = (id) => {
    setSection(id);
    if (mainRef.current) mainRef.current.scrollTop = 0;
  };

  const toggle = (label, opt) =>
    setChosen((prev) => {
      const cur = prev[label] || [];
      return {
        ...prev,
        [label]: cur.includes(opt) ? cur.filter((v) => v !== opt) : [...cur, opt],
      };
    });

  const add = (label, opt) =>
    setChosen((prev) => {
      const cur = prev[label] || [];
      if (cur.includes(opt)) return prev;
      return { ...prev, [label]: [...cur, opt] };
    });

  const loadExample = (ex) => {
    setText(ex.text);
    setChosen(Object.fromEntries(Object.entries(ex.context).map(([k, v]) => [k, [v]])));
    setLoaded(ex.name);
    go("questions");
  };

  const copyChecklist = () => {
    if (!result) return;
    const lines = [
      "Questions to answer before this spec goes to engineering",
      "",
      ...result.questions.map(
        (q) => `- [ ] (${STAGE[q.stage].label}) ${q.question}\n      Answer with: ${q.answer}`
      ),
    ];
    if (result.wording.length) {
      lines.push("", "Wording to replace:");
      result.wording.forEach((w) => lines.push(`- [ ] "${w.term}" -> ${w.fix}`));
    }
    const payload = lines.join("\n");
    try {
      navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      setCopied(false);
    }
  };

  const badge = result ? result.questions.length : null;

  return (
    <div
      className="flex w-full"
      style={{ height: "100vh", background: C.bg, fontFamily: FONT, color: C.ink }}
    >
      <style>{`
        textarea::placeholder { color: ${C.ink3}; }
        input::placeholder { color: ${C.ink3}; }
        *:focus-visible { outline: 2px solid ${C.brandMid}; outline-offset: 2px; }
      `}</style>

      {/* Sidebar: pinned, full height, its own scroll */}
      <aside
        className="hidden md:flex flex-col shrink-0"
        style={{
          width: 300,
          height: "100vh",
          background: C.card,
          borderRight: `1px solid ${C.line}`,
          overflowY: "auto",
        }}
      >
        <div className="px-7 pt-8 pb-7">
          <div
            className="text-2xl font-extrabold tracking-tight"
            style={{ color: C.brand, letterSpacing: "-0.02em" }}
          >
            Handback
          </div>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: C.ink2 }}>
            The questions engineering will send back, before you send the spec.
          </p>
        </div>

        <nav className="px-4 pb-6 flex flex-col gap-1">
          {SECTIONS.map((s) => {
            const on = section === s.id;
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => go(s.id)}
                className="text-left rounded-2xl px-4 py-3 transition-colors"
                style={{ background: on ? C.brandSoft : "transparent" }}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={17} color={on ? C.brandDeep : C.ink3} />
                  <span
                    className="text-sm font-semibold"
                    style={{ color: on ? C.brandDeep : C.ink }}
                  >
                    {s.name}
                  </span>
                  {s.id === "questions" && badge !== null && (
                    <span
                      className="ml-auto rounded-full px-2 py-0.5 text-xs font-bold"
                      style={{ background: on ? C.brand : C.lineSoft, color: on ? "#fff" : C.ink2 }}
                    >
                      {badge}
                    </span>
                  )}
                </div>
                <div className="mt-1 pl-7 text-xs leading-snug" style={{ color: on ? C.brand : C.ink3 }}>
                  {s.desc}
                </div>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto px-7 py-6" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
          <p className="text-xs leading-relaxed" style={{ color: C.ink3 }}>
            Runs entirely in your browser. No account, no API key, and the text you paste never
            leaves the page.
          </p>
        </div>
      </aside>

      {/* Main: own scroll container */}
      <main ref={mainRef} className="flex-1" style={{ height: "100vh", overflowY: "auto" }}>
        {/* Mobile nav */}
        <div
          className="md:hidden sticky top-0 z-10 flex gap-2 overflow-x-auto px-4 py-3"
          style={{ background: C.card, borderBottom: `1px solid ${C.line}` }}
        >
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => go(s.id)}
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium"
              style={{
                background: section === s.id ? C.brand : C.brandFaint,
                color: section === s.id ? "#fff" : C.brandDeep,
              }}
            >
              {s.name}
            </button>
          ))}
        </div>

        <div className="mx-auto px-6 py-12 md:px-14 md:py-16" style={{ maxWidth: 900 }}>
          {/* ---------------- START ---------------- */}
          {section === "start" && (
            <>
              <div className="mb-12">
                <Pill tone="brand">Spec review, before the review</Pill>
                <h1
                  className="mt-5 text-5xl font-extrabold leading-tight tracking-tight"
                  style={{ color: C.ink, letterSpacing: "-0.03em" }}
                >
                  Find the questions
                  <br />
                  before engineering does.
                </h1>
                <p className="mt-5 text-lg leading-relaxed" style={{ color: C.ink2, maxWidth: "52ch" }}>
                  Paste a draft PRD or ticket. Handback returns the decisions it has not made yet,
                  ranked by how much each one holds up.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    onClick={() => go("spec")}
                    className="rounded-full px-7 py-3.5 text-base font-semibold"
                    style={{ background: C.brand, color: "#fff" }}
                  >
                    Paste a spec
                  </button>
                  <button
                    onClick={() => loadExample(EXAMPLES[0])}
                    className="rounded-full px-7 py-3.5 text-base font-semibold"
                    style={{ background: C.brandSoft, color: C.brandDeep }}
                  >
                    Try a worked example
                  </button>
                </div>
              </div>

              {/* Directional flow */}
              <div className="mb-12 flex flex-col items-stretch gap-3 md:flex-row md:items-center">
                {FLOW.map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <React.Fragment key={f.title}>
                      <Card className="flex-1 p-6">
                        <div
                          className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl"
                          style={{ background: C.brandSoft }}
                        >
                          <Icon size={20} color={C.brandDeep} />
                        </div>
                        <h3 className="text-base font-bold" style={{ color: C.ink }}>
                          {f.title}
                        </h3>
                        <p className="mt-1.5 text-sm leading-relaxed" style={{ color: C.ink2 }}>
                          {f.body}
                        </p>
                      </Card>
                      {i < FLOW.length - 1 && (
                        <div className="flex shrink-0 justify-center md:px-1">
                          <ArrowRight size={20} color={C.brandMid} className="hidden md:block" />
                          <ArrowDown size={20} color={C.brandMid} className="md:hidden" />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* What it checks */}
              <div className="mb-4 flex items-baseline gap-3">
                <h2 className="text-2xl font-bold tracking-tight" style={{ color: C.ink }}>
                  What it checks
                </h2>
                <Pill tone="quiet">{PROBES.length} rules</Pill>
              </div>
              <div className="mb-12 grid gap-4 md:grid-cols-2">
                {AREA_META.map((a) => {
                  const Icon = a.icon;
                  const n = PROBES.filter((p) => p.area === a.area).length;
                  return (
                    <Card key={a.area} className="flex gap-4 p-6">
                      <div
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                        style={{ background: C.brandFaint }}
                      >
                        <Icon size={18} color={C.brand} />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-baseline gap-2">
                          <h3 className="text-base font-bold" style={{ color: C.ink }}>
                            {a.area}
                          </h3>
                          <span className="text-xs font-medium" style={{ color: C.ink3 }}>
                            {n} rules
                          </span>
                        </div>
                        <p className="mt-1 text-sm leading-relaxed" style={{ color: C.ink2 }}>
                          {a.line}
                        </p>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Honest limits */}
              <h2 className="mb-4 text-2xl font-bold tracking-tight" style={{ color: C.ink }}>
                Before you trust it
              </h2>
              <div className="mb-12 grid gap-5 md:grid-cols-2">
                <Card className="p-7">
                  <div className="mb-4 flex items-center gap-2.5">
                    <Check size={18} color={C.green} />
                    <h3 className="text-base font-bold" style={{ color: C.ink }}>
                      What it is good at
                    </h3>
                  </div>
                  <ul className="space-y-3 text-sm leading-relaxed" style={{ color: C.ink2 }}>
                    {GOOD_AT.map((t) => (
                      <li key={t} className="flex gap-2.5">
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: C.brandMid }}
                        />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
                <Card className="p-7">
                  <div className="mb-4 flex items-center gap-2.5">
                    <X size={18} color={C.red} />
                    <h3 className="text-base font-bold" style={{ color: C.ink }}>
                      What it cannot do
                    </h3>
                  </div>
                  <ul className="space-y-3 text-sm leading-relaxed" style={{ color: C.ink2 }}>
                    {CANNOT_DO.map((t) => (
                      <li key={t} className="flex gap-2.5">
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: C.line }}
                        />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => go("method")}
                    className="mt-5 text-sm font-semibold"
                    style={{ color: C.brand }}
                  >
                    Read every rule under Method
                  </button>
                </Card>
              </div>

              {/* Plain language explainer */}
              <Card className="p-8">
                <div className="mb-4 flex items-center gap-2.5">
                  <HelpCircle size={18} color={C.brandDeep} />
                  <h3 className="text-lg font-bold" style={{ color: C.ink }}>
                    New to this? Here is the whole idea
                  </h3>
                </div>
                <p className="text-base leading-relaxed" style={{ color: C.ink2, maxWidth: "62ch" }}>
                  When a spec reaches a development team, they read it looking for the decisions they
                  need before they can start. Anything missing comes back to you as a question, and the
                  work waits. That round trip is the handback this tool is named after.
                </p>
                <ul className="mt-5 space-y-3 text-base leading-relaxed" style={{ color: C.ink2 }}>
                  {["Those questions are predictable. Where does the data live. What happens when it fails. Who is allowed to do it. How fast is fast enough.", "Handback keeps a list of them, checks whether your draft has answered each one, and shows you the rest.", "Twelve open questions does not mean a bad spec. It means an early one."].map(
                    (t) => (
                      <li key={t} className="flex gap-3">
                        <span
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: C.brandMid }}
                        />
                        <span style={{ maxWidth: "60ch" }}>{t}</span>
                      </li>
                    )
                  )}
                </ul>
              </Card>
            </>
          )}

          {/* ---------------- SPEC ---------------- */}
          {section === "spec" && (
            <>
              <SectionHead
                title="Your spec"
                sub="Paste the draft as it stands. Rough notes work better than a tidied version, because the gaps are the point."
              />

              <Card className="p-3 mb-8">
                <textarea
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setLoaded(null);
                  }}
                  placeholder="Paste your PRD, ticket, or notes here."
                  className="w-full resize-y rounded-2xl p-5 text-base leading-relaxed outline-none"
                  style={{ minHeight: 300, background: C.brandFaint, color: C.ink, border: "none" }}
                />
                <div className="flex flex-wrap items-center gap-3 px-3 py-3">
                  <span className="text-sm" style={{ color: C.ink3 }}>
                    {text.trim() ? `${text.trim().split(/\s+/).length} words` : "Nothing pasted yet"}
                    {loaded ? ` · example: ${loaded}` : ""}
                  </span>
                  {text && (
                    <button
                      onClick={() => {
                        setText("");
                        setChosen({});
                        setLoaded(null);
                      }}
                      className="inline-flex items-center gap-1.5 text-sm font-medium"
                      style={{ color: C.ink2 }}
                    >
                      <X size={14} /> Clear
                    </button>
                  )}
                  <button
                    onClick={() => go("questions")}
                    disabled={!result}
                    className="ml-auto rounded-full px-6 py-2.5 text-sm font-semibold"
                    style={{
                      background: result ? C.brand : C.lineSoft,
                      color: result ? "#fff" : C.ink3,
                    }}
                  >
                    See the questions
                  </button>
                </div>
              </Card>

              <Card className="p-8 mb-8">
                <h3 className="text-lg font-bold" style={{ color: C.ink }}>
                  Context
                </h3>
                <p className="mt-2 mb-6 text-sm leading-relaxed" style={{ color: C.ink2 }}>
                  Optional. These switch on extra checks. Anything you add yourself is checked against
                  the text, so if you tag a piece of context the spec never mentions, that becomes a
                  question of its own.
                </p>
                {CHIP_GROUPS.map((g) => (
                  <ChipRow key={g.label} group={g} chosen={chosen} onToggle={toggle} onAdd={add} />
                ))}
              </Card>

              <h3 className="mb-1 text-lg font-bold" style={{ color: C.ink }}>
                Or start from a worked example
              </h3>
              <p className="mb-5 text-sm" style={{ color: C.ink2 }}>
                Three specs written the way they usually arrive, plus the first one again after its questions have been answered.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {EXAMPLES.map((ex) => (
                  <Card key={ex.name} className="flex flex-col p-6">
                    <h4 className="text-base font-bold leading-snug" style={{ color: C.ink }}>
                      {ex.name}
                    </h4>
                    <p className="mt-2 flex-1 text-sm leading-relaxed" style={{ color: C.ink2 }}>
                      {ex.blurb}
                    </p>
                    <button
                      onClick={() => loadExample(ex)}
                      className="mt-5 rounded-full px-5 py-2 text-sm font-semibold"
                      style={{ background: C.brandSoft, color: C.brandDeep }}
                    >
                      Load it
                    </button>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* ---------------- QUESTIONS ---------------- */}
          {section === "questions" && (
            <>
              <SectionHead
                title="Questions"
                sub="Each one is a decision your draft has not made yet. The rank is about what the gap holds up, not about how important the topic is."
              />

              {!result ? (
                <Card className="p-10 text-center">
                  <p className="text-base" style={{ color: C.ink2 }}>
                    Nothing to check yet. Paste a spec of at least a few sentences, or load one of the
                    worked examples.
                  </p>
                  <button
                    onClick={() => go("spec")}
                    className="mt-6 rounded-full px-6 py-2.5 text-sm font-semibold"
                    style={{ background: C.brand, color: "#fff" }}
                  >
                    Go to your spec
                  </button>
                </Card>
              ) : (
                <>
                  <Card className="mb-8 p-8">
                    <div className="flex flex-wrap items-end gap-8">
                      <div>
                        <div
                          className="text-6xl font-extrabold leading-none"
                          style={{ color: C.brand, letterSpacing: "-0.04em" }}
                        >
                          {result.questions.length}
                        </div>
                        <div className="mt-2 text-sm font-medium" style={{ color: C.ink2 }}>
                          open questions
                        </div>
                      </div>
                      <div className="flex-1" style={{ minWidth: 260 }}>
                        <p className="text-base leading-relaxed" style={{ color: C.ink2 }}>
                          {result.blockers > 0
                            ? `${result.blockers} of them would stop a developer starting. The rest can be answered while the work is in flight.`
                            : "None of them would stop a developer starting. This draft is in good shape to hand over."}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Pill tone="quiet">
                            {result.answered} of {result.applicable} checks already answered
                          </Pill>
                          <Pill tone="quiet">{result.words} words</Pill>
                        </div>
                      </div>
                      <button
                        onClick={copyChecklist}
                        className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
                        style={{ background: copied ? C.brandSoft : C.brand, color: copied ? C.brandDeep : "#fff" }}
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? "Copied" : "Copy as checklist"}
                      </button>
                    </div>
                  </Card>

                  {result.questions.length === 0 && (
                    <Card className="p-10">
                      <p className="text-base" style={{ color: C.ink2 }}>
                        Every check this tool knows about is already answered somewhere in the text.
                        That is a good sign and not a guarantee. The rules under Method are the whole
                        of what it looked for.
                      </p>
                    </Card>
                  )}

                  <div className="space-y-4">
                    {result.questions.map((q, i) => {
                      const st = STAGE[q.stage];
                      return (
                        <Card key={q.id + i} className="overflow-hidden">
                          <div className="flex">
                            <div style={{ width: 6, background: st.fg, flexShrink: 0 }} />
                            <div className="flex-1 p-7">
                              <div className="mb-3 flex flex-wrap items-center gap-2">
                                <span
                                  className="rounded-full px-3 py-1 text-xs font-semibold"
                                  style={{ background: st.bg, color: st.fg }}
                                >
                                  {st.label}
                                </span>
                                <Pill tone="quiet">{q.area}</Pill>
                              </div>
                              <h3
                                className="text-xl font-bold leading-snug"
                                style={{ color: C.ink, maxWidth: "52ch" }}
                              >
                                {q.question}
                              </h3>
                              <p
                                className="mt-3 text-base leading-relaxed"
                                style={{ color: C.ink2, maxWidth: "62ch" }}
                              >
                                {q.why}
                              </p>
                              <div
                                className="mt-5 rounded-2xl p-5"
                                style={{ background: C.brandFaint, border: `1px solid ${C.lineSoft}` }}
                              >
                                <div className="text-xs font-semibold" style={{ color: C.brandDeep }}>
                                  A good answer looks like
                                </div>
                                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: C.ink2 }}>
                                  {q.answer}
                                </p>
                              </div>
                              {q.evidence && (
                                <p className="mt-4 text-xs" style={{ color: C.ink3 }}>
                                  Raised because your text contains "{q.evidence}" and nothing that
                                  answers this.
                                </p>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}

          {/* ---------------- WORDING ---------------- */}
          {section === "wording" && (
            <>
              <SectionHead
                title="Wording"
                sub="Words that pass a review because everyone nods at them, then turn into an estimate nobody can give."
              />
              {!result ? (
                <Card className="p-10 text-center">
                  <p className="text-base" style={{ color: C.ink2 }}>
                    Paste a spec first and this fills in.
                  </p>
                  <button
                    onClick={() => go("spec")}
                    className="mt-6 rounded-full px-6 py-2.5 text-sm font-semibold"
                    style={{ background: C.brand, color: "#fff" }}
                  >
                    Go to your spec
                  </button>
                </Card>
              ) : result.wording.length === 0 ? (
                <Card className="p-10">
                  <p className="text-base" style={{ color: C.ink2 }}>
                    None of the {VAGUE.length} phrases on the watch list appear in your text. Worth
                    saying that this only checks a list, so precise-sounding wording can still hide a
                    decision.
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {result.wording.map((w) => (
                    <Card key={w.term} className="p-7">
                      <div className="flex flex-wrap items-baseline gap-3">
                        <h3 className="text-xl font-bold" style={{ color: C.ink }}>
                          {w.term}
                        </h3>
                        <Pill tone="quiet">
                          {w.spots.length} {w.spots.length === 1 ? "use" : "uses"}
                        </Pill>
                      </div>
                      <p className="mt-3 text-base leading-relaxed" style={{ color: C.ink2 }}>
                        <span style={{ color: C.ink, fontWeight: 600 }}>What gets read: </span>
                        {w.hears}
                      </p>
                      <p className="mt-2 text-base leading-relaxed" style={{ color: C.ink2 }}>
                        <span style={{ color: C.ink, fontWeight: 600 }}>Replace with: </span>
                        {w.fix}
                      </p>
                      <div className="mt-5 space-y-2">
                        {w.spots.map((s, i) => (
                          <div
                            key={i}
                            className="rounded-2xl px-5 py-3 text-sm leading-relaxed"
                            style={{ background: C.brandFaint, color: C.ink2 }}
                          >
                            {s.before}
                            <span
                              className="rounded px-1 font-semibold"
                              style={{ background: C.brandSoft, color: C.brandDeep }}
                            >
                              {s.hit}
                            </span>
                            {s.after}
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ---------------- COVERAGE ---------------- */}
          {section === "coverage" && (
            <>
              <SectionHead
                title="Coverage"
                sub="Which areas your spec touches, and how many of the checks in each one it has already answered."
              />
              {!result ? (
                <Card className="p-10 text-center">
                  <p className="text-base" style={{ color: C.ink2 }}>
                    Paste a spec first and this fills in.
                  </p>
                  <button
                    onClick={() => go("spec")}
                    className="mt-6 rounded-full px-6 py-2.5 text-sm font-semibold"
                    style={{ background: C.brand, color: "#fff" }}
                  >
                    Go to your spec
                  </button>
                </Card>
              ) : (
                <div className="space-y-4">
                  {Object.entries(result.areas)
                    .filter(([, v]) => v.total > 0)
                    .map(([area, v]) => {
                      const pct = v.applicable ? Math.round((v.answered / v.applicable) * 100) : null;
                      return (
                        <Card key={area} className="p-7">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <h3 className="text-lg font-bold" style={{ color: C.ink }}>
                              {area}
                            </h3>
                            <span className="text-sm font-medium" style={{ color: C.ink2 }}>
                              {v.applicable === 0
                                ? "Not raised by this spec"
                                : `${v.answered} of ${v.applicable} answered`}
                            </span>
                          </div>
                          <div
                            className="mt-4 h-2.5 w-full overflow-hidden rounded-full"
                            style={{ background: C.lineSoft }}
                          >
                            <div
                              style={{
                                width: `${pct === null ? 0 : pct}%`,
                                height: "100%",
                                background: C.brand,
                                borderRadius: 999,
                              }}
                            />
                          </div>
                          {v.applicable === 0 && (
                            <p className="mt-3 text-sm" style={{ color: C.ink3 }}>
                              Nothing in your text triggered these checks. If the area does apply,
                              your spec has not said so in words the rules recognise.
                            </p>
                          )}
                        </Card>
                      );
                    })}
                </div>
              )}
            </>
          )}

          {/* ---------------- METHOD ---------------- */}
          {section === "method" && (
            <>
              <SectionHead
                title="Method"
                sub="There is no model behind this and no scoring you cannot see. Below is every rule it runs, in the order it runs them."
              />

              <Card className="p-8 mb-8">
                <h3 className="text-lg font-bold" style={{ color: C.ink }}>
                  How a question gets raised
                </h3>
                <div className="mt-4 space-y-4 text-base leading-relaxed" style={{ color: C.ink2 }}>
                  <p>
                    Each rule has a trigger and an answer test. The trigger decides whether the rule
                    applies to your spec, usually by looking for a word that implies the situation. The
                    answer test looks for any sign that you have already covered it. If the trigger
                    matches and the answer test does not, the question is raised.
                  </p>
                  <p>
                    Three rules always apply, whatever you paste: acceptance criteria, the success
                    metric, and instrumentation. Ranking is fixed per rule and set by which stage the
                    missing answer holds up, so it does not change with your text.
                  </p>
                  <p>
                    Where the rules come from: recurring clarification requests in spec review, plus
                    the standard readiness checks used before a ticket is picked up. They are a
                    starting list, not an industry standard, and they are opinionated about what
                    matters.
                  </p>
                </div>
              </Card>

              <div className="mb-8 flex flex-wrap gap-3">
                {Object.entries(STAGE).map(([k, s]) => (
                  <div
                    key={k}
                    className="rounded-2xl px-5 py-4"
                    style={{ background: s.bg, border: `1px solid ${C.lineSoft}`, maxWidth: 260 }}
                  >
                    <div className="text-sm font-bold" style={{ color: s.fg }}>
                      {s.label}
                    </div>
                    <p className="mt-1 text-sm leading-snug" style={{ color: C.ink2 }}>
                      {s.note}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {PROBES.map((p) => (
                  <Card key={p.id} className="p-6">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Pill tone="quiet">{p.area}</Pill>
                      <span className="text-xs font-semibold" style={{ color: STAGE[p.stage].fg }}>
                        {STAGE[p.stage].label}
                      </span>
                    </div>
                    <h4 className="text-base font-bold leading-snug" style={{ color: C.ink }}>
                      {p.question}
                    </h4>
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: C.ink2 }}>
                      Applies when: {p.always ? "always" : "your text mentions any of the trigger words"}
                      {p.contexts ? `, or you tag the spec as ${p.contexts.join(" or ")}` : ""}.
                    </p>
                    <p className="mt-1 text-sm leading-relaxed" style={{ color: C.ink2 }}>
                      Counted as answered when: your text mentions terms such as{" "}
                      {readableTerms(p.satisfies)}.
                    </p>
                  </Card>
                ))}
              </div>

              <Card className="mt-8 p-8">
                <h3 className="text-lg font-bold" style={{ color: C.ink }}>
                  Wording watch list
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: C.ink2 }}>
                  {VAGUE.length} phrases, matched whole word only, with up to three uses shown per
                  phrase.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {VAGUE.map((v) => (
                    <Pill key={v.term} tone="quiet">
                      {v.term}
                    </Pill>
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
