import React, { useState, useEffect, useRef } from "react";

/*
  Repro Builder
  -------------
  Turns a vague user complaint into an isolation matrix, a run-by-run
  reproduction script, the questions only the reporter can answer, and a
  verdict: confirmed bug, spec gap, or expected behaviour the user disliked.

  Single-file React component. No dependencies beyond React.
  Calls the Anthropic Messages API directly from the browser using a key the
  viewer pastes in. The key is held in component state only. It is never
  written to storage and goes nowhere except api.anthropic.com.
*/

const MODEL = "claude-sonnet-4-6";

const VERDICTS = {
  "Confirmed bug": { colour: "#EF4A45", ink: "#FFFFFF" },
  "Spec gap": { colour: "#F0A81E", ink: "#1A1440" },
  "Expected behaviour the user disliked": { colour: "#14A97B", ink: "#FFFFFF" },
};


/* ------------------------------------------------------------------ */
/* Saved runs: full results so the tool is legible without an API key  */
/* ------------------------------------------------------------------ */

const EXAMPLES = [
  {
    key: "export",
    tab: "Export on mobile",
    complaint: "The export doesn't work on my phone.",
    context:
      "B2B analytics dashboard. Reported by a customer success manager relaying a client's ops lead. No screenshot. Client is on a Growth plan. Export produces a CSV of the current dashboard view.",
    result: {
      headline:
        "Nothing in the complaint says the export failed. It says the reporter could not find the file afterwards, and those are different problems with different owners.",
      claim: {
        restated:
          "On at least one mobile device, tapping Export on the dashboard does not produce a CSV the reporter can open.",
        undefined_terms: [
          {
            term: "doesn't work",
            why: "Covers four outcomes: the button does nothing, an error appears, a file downloads but will not open, or a file downloads and cannot be located. Each has a different fix and a different owner.",
          },
          {
            term: "my phone",
            why: "Operating system and browser both change download behaviour. iOS Safari, Chrome on iOS and Android Chrome handle a blob download three different ways.",
          },
          {
            term: "the export",
            why: "Two features carry that word: the dashboard CSV and the scheduled email report. The reporter may mean either.",
          },
        ],
        assumptions: [
          "That the failure is in the export code rather than in the handoff to the operating system.",
          "That the reporter chose mobile, rather than being away from a desk with no alternative.",
          "That it fails every time, when the complaint is consistent with a single attempt.",
        ],
      },
      variables: [
        {
          name: "Operating system",
          short: "OS",
          suspicion: "High",
          why: "iOS does not surface downloads the way a desktop does. A CSV lands in Files with no visible confirmation, which looks identical to nothing happening.",
          control: "Keep the browser family fixed while you move between desktop, iOS and Android.",
        },
        {
          name: "Browser",
          short: "Browser",
          suspicion: "High",
          why: "Safari restricts programmatic downloads in contexts other browsers allow. Testing Safari on desktop first separates the browser from the device.",
          control: "Keep the same machine and account while you switch browser.",
        },
        {
          name: "Download trigger method",
          short: "Trigger",
          suspicion: "Medium",
          why: "A blob URL with a synthetic click is blocked by some mobile browsers when the click sits outside the user gesture chain.",
          control: "Read the front end code rather than testing it. One search of the repo answers this.",
        },
        {
          name: "Row count",
          short: "Rows",
          suspicion: "Medium",
          why: "A large export that takes several seconds to build looks like a dead button on a phone, where there is no download bar to watch.",
          control: "Filter to a handful of rows and repeat on the device that failed.",
        },
        {
          name: "Plan entitlement",
          short: "Entitlement",
          suspicion: "Low",
          why: "Export is gated by plan on some tiers. A seat without the entitlement may render the button and silently do nothing.",
          control: "Check the seat in the admin panel before testing anything.",
        },
        {
          name: "Which export",
          short: "Export type",
          suspicion: "Medium",
          why: "If the reporter means the scheduled email report, the phone is irrelevant and the whole script is aimed at the wrong feature.",
          control: "Ask where the button was on screen rather than what it was called.",
        },
      ],
      runs: [
        {
          id: "R0",
          label: "Baseline on desktop Chrome",
          changes_variable: "None",
          changes: "Nothing. This is the known-good reference.",
          holds: "Your own account, the dashboard the reporter uses, default date range.",
          steps: [
            "Open the dashboard the reporter named.",
            "Click Export and choose CSV.",
            "Open the file and check the row count matches what is on screen.",
          ],
          if_it_works:
            "Generation and the file itself are sound. Everything after this is about the client side.",
          if_it_fails:
            "You have a reproduction with no mobile involved. Stop the script and raise it.",
        },
        {
          id: "R1",
          label: "Desktop Safari",
          changes_variable: "Browser",
          changes: "Browser only. Same machine as R0.",
          holds: "Same account, same dashboard, same filters, same date range.",
          steps: [
            "Repeat R0 in Safari on the same machine.",
            "Note whether the download appears and whether anything is shown on screen.",
          ],
          if_it_works:
            "Safari itself is not the problem. Any failure below belongs to the device.",
          if_it_fails:
            "You have isolated it to Safari on any platform, which is a far bigger scope than the complaint suggested and worth raising immediately.",
        },
        {
          id: "R2",
          label: "iOS Safari",
          changes_variable: "Operating system",
          changes: "Operating system only. Same browser family as R1.",
          holds: "Same account, same dashboard, same filters.",
          steps: [
            "Open the same dashboard on an iPhone in Safari.",
            "Tap Export and choose CSV.",
            "Watch the screen for ten seconds and write down exactly what appears.",
            "Open the Files app and look in Downloads.",
          ],
          if_it_works:
            "The file arrives but is hard to find and nothing confirms it. That points at expected behaviour rather than a defect.",
          if_it_fails:
            "Nothing reaches Files. Continue to R3 to separate the browser from the operating system.",
        },
        {
          id: "R3",
          label: "iOS Chrome",
          changes_variable: "Browser",
          changes: "Browser only. Same physical device as R2.",
          holds: "Same account, same dashboard, same filters.",
          steps: [
            "Repeat R2 in Chrome on the same iPhone.",
            "Check Files and the Chrome download list.",
          ],
          if_it_works:
            "Scoped to Safari on iOS. That is a clean, testable boundary and a ticket engineering can act on the same day.",
          if_it_fails:
            "Both iOS browsers fail. Continue to R4 to find out whether iOS is the boundary.",
        },
        {
          id: "R4",
          label: "Android Chrome",
          changes_variable: "Operating system",
          changes: "Operating system only. Same browser as R3.",
          holds: "Same account, same dashboard, same filters.",
          steps: [
            "Repeat the export on an Android phone in Chrome.",
            "Check the notification shade and the Downloads folder.",
          ],
          if_it_works: "The failure is scoped to iOS and the scope is now provable.",
          if_it_fails:
            "All mobile fails and desktop passes. The download trigger does not work under mobile browser rules at all, which is larger than the complaint implied.",
        },
        {
          id: "R5",
          label: "Small export on the failing device",
          changes_variable: "Row count",
          changes: "Row count only. Run this only if the results above were mixed.",
          holds: "The device and browser that failed, same account, same dashboard.",
          steps: [
            "Filter the dashboard to under ten rows.",
            "Export again on the failing device.",
          ],
          if_it_works:
            "Generation time is the variable rather than the platform, which changes the fix entirely.",
          if_it_fails: "Size is not involved. Drop the variable and stop testing.",
        },
      ],
      questions: [
        {
          ask: "When you tapped Export, what happened on screen? Nothing at all, a spinner, a message, or a new tab?",
          when: "Before you test",
          narrows:
            "Separates a dead button from a completed download the reporter could not locate. This one answer removes half the script.",
        },
        {
          ask: "Which button did you tap, and roughly where was it on the screen?",
          when: "Before you test",
          narrows:
            "Tells you whether they mean the dashboard CSV or the scheduled report, without making them guess at a feature name.",
        },
        {
          ask: "iPhone or Android, and were you in Safari or Chrome?",
          when: "Before you test",
          narrows: "Sets your starting device so you are not testing three platforms speculatively.",
        },
        {
          ask: "Did you try more than once, and did it behave the same way each time?",
          when: "Before you test",
          narrows:
            "Distinguishes a consistent failure from a one-off, which changes whether the script is worth running at all.",
        },
        {
          ask: "Have you opened the Files app and looked under Downloads?",
          when: "Only if testing is inconclusive",
          narrows:
            "Ask this after your own R2, when you already know what should be there. Asking it first reads as an accusation.",
        },
      ],
      self_answerable: [
        "Whether the reporter's seat carries the export entitlement, from the admin panel.",
        "Whether the export completed server side, from the job log and the row count.",
        "Whether anyone else on the account exported successfully this week.",
        "Which dashboards the reporter can open, so you test the right one.",
        "Whether the front end uses a blob URL, from one search of the repo.",
      ],
      tree: [
        {
          observation: "R0 and R1 pass. R2 puts a valid CSV in Files with no on-screen confirmation.",
          verdict: "Expected behaviour the user disliked",
          because:
            "The product did what it was built to do. The reporter had no way to know it worked, which is a design complaint rather than a defect.",
        },
        {
          observation: "R0 and R1 pass, R2 and R3 produce no file on iOS, R4 works on Android.",
          verdict: "Confirmed bug",
          because: "A supported platform silently drops the file, on a specific and provable path.",
        },
        {
          observation:
            "R0 passes, every mobile run fails, and mobile is not named as supported in the docs or the plan description.",
          verdict: "Spec gap",
          because:
            "Nobody decided whether mobile export should work. There is no requirement to test against, so a product decision has to come before engineering time.",
        },
        {
          observation: "R1 fails on desktop Safari.",
          verdict: "Confirmed bug",
          because:
            "The mobile framing was a red herring. A supported desktop browser is broken and the blast radius is much larger than reported.",
        },
      ],
      call: {
        verdict: "Expected behaviour the user disliked",
        confidence: "Low",
        reasoning:
          "The phrasing points at a missing confirmation rather than a missing file, which is the most common shape of this complaint on iOS. It is a starting hypothesis, not a finding. R2 either confirms it in about four minutes or moves you onto the bug branch.",
        would_change:
          "A reporter answer of 'a red error appeared', or an empty Files folder after R2, moves this straight to confirmed bug.",
      },
      escalation: {
        alone: [
          "Every run in the script, using a personal phone and a test account.",
          "The entitlement check and the server-side export log.",
          "Reading the download code path to see whether it uses a blob URL.",
        ],
        engineering: [
          {
            item: "Why the download is dropped on iOS specifically, if R2 and R3 both fail.",
            why: "Needs browser instrumentation and a network trace, and the fix belongs to them regardless.",
          },
          {
            item: "Whether a server-generated download URL is a viable alternative.",
            why: "An architecture call with a cost attached, which cannot be answered from the outside.",
          },
        ],
      },
      drafts: {
        reporter_reply:
          "Thanks for flagging this. One quick thing before I take it further: when you tapped Export, did anything appear on screen at all, or did it look like nothing happened? On iPhones the file usually saves quietly into the Files app under Downloads rather than opening, so it is worth a look there. If it is sitting in Files, I will raise the fact that we give you no confirmation, because that is ours to fix. If it is not there, I will get it in front of the team today.",
        handoff_note:
          "CSV export reported as not working on mobile. I have run the dashboard export on desktop Chrome and desktop Safari (both fine, correct row count), then iOS Safari, iOS Chrome and Android Chrome, changing one variable at a time. The reporter's seat has the export entitlement and the server-side job completed. Findings and the exact runs are below, so the platform boundary is already scoped.",
      },
    },
  },
  {
    key: "voice",
    tab: "Voice agent hangups",
    complaint: "The voice agent keeps hanging up on our customers.",
    context:
      "Enterprise inbound support line, multilingual voice agent. Reported by the client's operations lead on a weekly call. Client says it started around a fortnight ago. Roughly 2,000 calls a day across two languages, with a transfer to a human queue for anything the agent cannot resolve.",
    result: {
      headline:
        "Hanging up is what the caller experiences. It could be the agent ending the call, a failed transfer, or a carrier drop, and those three sit with three different teams.",
      claim: {
        restated:
          "On some inbound calls, the line ends before the caller's issue is resolved and before a human picks up.",
        undefined_terms: [
          {
            term: "hanging up",
            why: "From the caller's side, a deliberate hangup, a dropped transfer and a carrier disconnect are indistinguishable. From the system's side they are unrelated failures.",
          },
          {
            term: "keeps",
            why: "No rate is given. Ten calls a day out of two thousand is a different problem from two hundred, and the second would already show in the client's abandon rate.",
          },
          {
            term: "our customers",
            why: "Does not say whether it clusters by language, by call reason, or by time of day.",
          },
        ],
        assumptions: [
          "That the agent is the actor, when the caller cannot tell who ended the call.",
          "That it started a fortnight ago, which may only be when someone noticed.",
          "That it is one failure mode rather than several that look alike from outside.",
        ],
      },
      variables: [
        {
          name: "Disconnect point in the call",
          short: "Disconnect point",
          suspicion: "High",
          why: "A drop during agent speech, during caller silence and during transfer have unrelated causes. This is the most informative variable and it is already in your call logs.",
          control:
            "Group every dropped call in the last fortnight by the last system event before disconnect, before placing any test calls.",
        },
        {
          name: "Silence timeout",
          short: "Silence",
          suspicion: "High",
          why: "A low no-input timeout cuts off a caller who pauses to find an account number, and the system records that as a normal end of call.",
          control: "Read the configured value, then place calls pausing just under and just over it.",
        },
        {
          name: "Transfer path",
          short: "Transfer",
          suspicion: "High",
          why: "If the handoff to the human queue fails, the leg can terminate rather than fall back to a message.",
          control: "Hold the language and the request wording fixed while you test a transfer intent.",
        },
        {
          name: "Queue availability",
          short: "Queue hours",
          suspicion: "Medium",
          why: "Out of hours, a transfer has nowhere to land. Whether that produces a message or a disconnect is the whole question.",
          control: "Repeat the same transfer request outside the client's staffed hours.",
        },
        {
          name: "Language",
          short: "Language",
          suspicion: "Medium",
          why: "Recognition confidence differs by language and accent, and low confidence can push the agent down a fallback that ends the call.",
          control: "Repeat the failing scenario word for word in the second language.",
        },
        {
          name: "Carrier or network",
          short: "Carrier",
          suspicion: "Low",
          why: "Real drops happen, but they would not cluster by call reason or by time of day.",
          control: "Not exercised by this script. Check whether dropped calls share a carrier prefix in the logs.",
        },
      ],
      runs: [
        {
          id: "R0",
          label: "Log baseline before touching the phone",
          changes_variable: "None",
          changes: "Nothing. Desk work, not a call.",
          holds: "Last fourteen days, this client only.",
          steps: [
            "Filter calls that ended without resolution and without a human answering.",
            "Group them by the last system event before disconnect.",
            "Note the daily count and whether it steps up on a specific date.",
          ],
          if_it_works:
            "One event dominates, which tells you which run below to do first and lets you skip the rest.",
          if_it_fails:
            "No clustering. Compare the rate to the previous fortnight before spending any more time.",
        },
        {
          id: "R1",
          label: "Happy path call",
          changes_variable: "None",
          changes: "Nothing. Reference call.",
          holds: "Language one, a common intent the agent resolves fully, no long pauses.",
          steps: [
            "Call the line and resolve one common request end to end.",
            "Note the total duration and how the call ends.",
          ],
          if_it_works: "The core path is healthy, so the failure sits in a branch.",
          if_it_fails: "You reproduced it on the simplest possible call. Stop and escalate now.",
        },
        {
          id: "R2",
          label: "Deliberate silence",
          changes_variable: "Silence timeout",
          changes: "One pause. Everything else as R1.",
          holds: "Same language, same intent, same time of day.",
          steps: [
            "Repeat R1 but stay silent two seconds longer than the configured no-input timeout at the agent's first question.",
            "Note whether it reprompts, transfers or ends the call.",
          ],
          if_it_works: "Silence handling recovers. Move on.",
          if_it_fails:
            "The call ends after one silence. Whether that is a bug or a spec gap depends on what the configured behaviour was meant to be.",
        },
        {
          id: "R3",
          label: "Transfer during staffed hours",
          changes_variable: "Transfer path",
          changes: "Intent only. No pauses.",
          holds: "Same language, business hours, queue staffed.",
          steps: [
            "Call and ask for something you know routes to a human.",
            "Stay on the line and time the handoff.",
          ],
          if_it_works: "Transfers are healthy while the queue is up.",
          if_it_fails:
            "Transfer is the failure point. This is the highest-value finding in the script because it hits every escalated caller.",
        },
        {
          id: "R4",
          label: "Transfer out of hours",
          changes_variable: "Queue availability",
          changes: "Time of day only. Same request as R3.",
          holds: "Same language, same intent, same wording.",
          steps: [
            "Repeat R3 outside the client's staffed hours.",
            "Note whether the caller gets a message, a voicemail option or a disconnect.",
          ],
          if_it_works: "There is a graceful fallback.",
          if_it_fails:
            "Out of hours callers are dropped with no message. Check the spec before calling it a bug.",
        },
        {
          id: "R5",
          label: "Second language",
          changes_variable: "Language",
          changes: "Language only.",
          holds: "Whichever run above failed, repeated word for word.",
          steps: [
            "Run the failing scenario again in the second language.",
            "Note recognition confidence in the log for each turn.",
          ],
          if_it_works:
            "The failure is language specific, which narrows it to that language's prompt or recognition config.",
          if_it_fails:
            "Language independent, so the cause sits in shared call control rather than in either language's setup.",
        },
      ],
      questions: [
        {
          ask: "Do you have a call reference and rough timestamp for two or three of these? Any three will do.",
          when: "Before you test",
          narrows:
            "One real call reference is worth more than the rest of this list, because it takes you straight to the event trail.",
        },
        {
          ask: "Do your callers say the line went dead, or that the assistant said goodbye first?",
          when: "Before you test",
          narrows: "Separates a deliberate end from a drop, which splits the investigation in two.",
        },
        {
          ask: "Is it happening in both languages, or mostly one?",
          when: "Before you test",
          narrows: "Removes an entire branch of the script if the answer is one language.",
        },
        {
          ask: "Did anything change on your side around a fortnight ago, such as queue hours or staffing?",
          when: "Before you test",
          narrows: "The client's own changes are invisible to you and are a common cause of transfer failures.",
        },
        {
          ask: "Roughly how many calls a day are we talking about?",
          when: "Only if testing is inconclusive",
          narrows: "Useful for prioritising, but the rate will not help you find the cause.",
        },
      ],
      self_answerable: [
        "The configured no-input and no-match timeouts, from the client's agent config.",
        "Every deployment and prompt change for this client in the last three weeks.",
        "The dropped call rate for the fortnight before the reported start date.",
        "Which intents route to a human, and the fallback when the queue does not answer.",
        "Recognition confidence on the turn before each disconnect.",
      ],
      tree: [
        {
          observation: "R3 fails. Transfer attempts end the call rather than reaching the queue.",
          verdict: "Confirmed bug",
          because: "The system is meant to connect the caller, on a supported path, with no fallback in place.",
        },
        {
          observation:
            "R2 fails and the config shows a single no-input attempt with hangup as the designed behaviour.",
          verdict: "Spec gap",
          because:
            "The system does exactly what it was configured to do. Nobody decided how many chances a hesitant caller gets, so this needs a decision rather than a fix.",
        },
        {
          observation: "R4 fails and the spec says out of hours calls end with a recorded message.",
          verdict: "Confirmed bug",
          because: "There is a stated requirement and the behaviour does not meet it.",
        },
        {
          observation: "R4 fails and nothing covers out of hours behaviour anywhere.",
          verdict: "Spec gap",
          because: "A missing requirement. Engineering work only starts once someone decides what should happen.",
        },
        {
          observation: "Every run passes and R0 shows the drop rate is unchanged from a month ago.",
          verdict: "Expected behaviour the user disliked",
          because:
            "Callers hang up on automated lines. The client has noticed a normal rate for the first time, and the answer is a conversation about that rate.",
        },
      ],
      call: {
        verdict: "Confirmed bug",
        confidence: "Medium",
        reasoning:
          "A cluster that appears on a specific date and affects callers mid-journey most often traces to the transfer path, and transfer failures produce exactly the caller experience described. R0 confirms or kills this in about twenty minutes of log reading.",
        would_change:
          "If R0 shows the dominant last event is a no-input timeout rather than a transfer attempt, this becomes a spec gap about how many chances a caller gets.",
      },
      escalation: {
        alone: [
          "All of R0, which is log filtering and grouping.",
          "R1 to R5, which are phone calls you can place yourself.",
          "Reading the timeout config and the change log.",
          "Comparing the drop rate to the previous fortnight.",
        ],
        engineering: [
          {
            item: "Why a transfer attempt terminates the leg instead of falling back, if R3 fails.",
            why: "Needs the call control code and the telephony provider logs, neither of which sits in the product surface.",
          },
          {
            item: "Whether recognition confidence thresholds differ between the two languages.",
            why: "The configuration sits below the client-facing layer and changing it affects other clients.",
          },
        ],
      },
      drafts: {
        reporter_reply:
          "Thanks for raising this on the call, I am picking it up now. Two things would speed this up a lot: any three call references with rough timestamps, and whether your team hears the line go dead or hears the assistant say goodbye first. Those point at different causes. Meanwhile I am pulling the last fourteen days of calls that ended without a human answering and grouping them, and I will come back by Thursday either way.",
        handoff_note:
          "Client reports callers being cut off, starting roughly two weeks ago. I have grouped fourteen days of unresolved disconnects by last event before hangup, then placed test calls covering the happy path, a deliberate silence, a transfer in hours, a transfer out of hours, and a repeat in the second language, changing one variable per call. Config values and the change log for the period are attached. The failing path is already isolated.",
      },
    },
  },
  {
    key: "numbers",
    tab: "Numbers do not match",
    complaint: "The follower numbers are wrong for some creators.",
    context:
      "Creator analytics platform with a public API. Reported in a shared Slack channel by an agency customer who checks a handful of creators manually against the social platform. No list of which creators. They pull data through the API into their own reporting sheet.",
    result: {
      headline:
        "Wrong almost certainly means different from what the customer sees somewhere else, and both numbers can be correct while disagreeing.",
      claim: {
        restated:
          "For an unspecified subset of creators, the follower count returned by the platform differs from the count visible on the social network itself.",
        undefined_terms: [
          {
            term: "wrong",
            why: "Could be stale, could be a different definition of the metric, could be genuinely incorrect. Only the third is a defect.",
          },
          {
            term: "some creators",
            why: "Without the list you cannot look for the shared property, and the shared property is the entire answer.",
          },
          {
            term: "the numbers",
            why: "They read through the API into a sheet, so the sheet is a suspect. The value in your database may be fine.",
          },
        ],
        assumptions: [
          "That the social network's figure is the truth, when it rounds and caches too.",
          "That the comparison happened at the same moment, when their sheet may be days old.",
          "That this is a data problem rather than a definition problem.",
        ],
      },
      variables: [
        {
          name: "Read path, API against dashboard",
          short: "Read path",
          suspicion: "Medium",
          why: "If the API and the dashboard read different tables or round differently, the customer's sheet and your screen will legitimately disagree.",
          control: "Query one creator both ways inside the same minute.",
        },
        {
          name: "Snapshot age",
          short: "Snapshot age",
          suspicion: "High",
          why: "On a daily refresh cycle, a fast-growing creator always looks wrong when checked live, and looks wronger the faster they grow. A failed collection also leaves the old value in place with no visible sign.",
          control: "Force a refresh for one creator and re-read, holding everything else fixed.",
        },
        {
          name: "Creator growth rate",
          short: "Growth rate",
          suspicion: "High",
          why: "If only fast growers are affected, the gap is staleness. If a creator flat for a month is also off, staleness is ruled out.",
          control: "Repeat the baseline comparison on one fast grower and one flat creator on the same day.",
        },
        {
          name: "Platform",
          short: "Platform",
          suspicion: "Medium",
          why: "Each network exposes counts differently, and one integration may be lagging while the others are current.",
          control: "Take one creator with accounts on two networks and compare both.",
        },
        {
          name: "Creator account type",
          short: "Account type",
          suspicion: "Medium",
          why: "Private accounts, recent handle changes and profiles switched to professional all move through different collection paths.",
          control: "Not exercised by this script. Sort the affected list by account type once you have it.",
        },
        {
          name: "The customer's own pipeline",
          short: "Their pipeline",
          suspicion: "Low",
          why: "A cached sheet or a weekly scheduled pull produces this exact complaint with nothing wrong on your side.",
          control: "Not exercised by this script. Ask when their sheet last refreshed, after you have checked your own data.",
        },
      ],
      runs: [
        {
          id: "R0",
          label: "One creator, three sources, same minute",
          changes_variable: "None",
          changes: "Nothing. Reference run.",
          holds: "One creator the customer named, or your highest-volume creator if they named none.",
          steps: [
            "Open the creator on the social network and note the count and the time.",
            "Query the same creator through your API and note the value and its last-updated timestamp.",
            "Open the same creator in your dashboard and note that value.",
          ],
          if_it_works: "All three agree, so the complaint is not general and you need the affected list.",
          if_it_fails:
            "You have a reproduction in five minutes, and the gaps between the three values tell you which run to do next.",
        },
        {
          id: "R1",
          label: "API against dashboard",
          changes_variable: "Read path, API against dashboard",
          changes: "Read path only.",
          holds: "Same creator as R0, inside the same minute, nothing else changed.",
          steps: ["Compare the API value and the dashboard value for the same creator."],
          if_it_works: "Both surfaces agree, so the difference sits between your platform and the network.",
          if_it_fails:
            "Your two surfaces disagree with each other, which is a defect regardless of what the network says.",
        },
        {
          id: "R2",
          label: "Forced collection",
          changes_variable: "Snapshot age",
          changes: "Snapshot age only.",
          holds: "Same creator, same read path.",
          steps: ["Force a refresh for that creator.", "Re-read and compare to the live count from R0."],
          if_it_works:
            "The refreshed number matches, so the gap was staleness and the question becomes what cadence was promised.",
          if_it_fails:
            "A freshly collected value still differs, which points at collection or parsing rather than cadence.",
        },
        {
          id: "R3",
          label: "Fast grower against flat creator",
          changes_variable: "Creator growth rate",
          changes: "Creator only.",
          holds: "Same platform, same read path, same day.",
          steps: [
            "Repeat R0 for a creator gaining a few hundred followers a day.",
            "Repeat R0 for a creator whose count has been flat for a month.",
          ],
          if_it_works: "Only the fast grower shows a gap, which confirms staleness rather than incorrectness.",
          if_it_fails: "A flat creator is also off, so growth rate is not the variable.",
        },
        {
          id: "R4",
          label: "Second platform, same creator",
          changes_variable: "Platform",
          changes: "Platform only.",
          holds: "Same creator, same read path, same day.",
          steps: ["Repeat R0 for the same person on their other social account."],
          if_it_works: "One integration is affected and the rest are healthy, which is a clean scope for a ticket.",
          if_it_fails:
            "All platforms are off, so the cause sits in shared storage or the read path rather than in any one integration.",
        },
      ],
      questions: [
        {
          ask: "Could you send five creator handles where the number looked wrong, with the figure you saw and roughly when you checked?",
          when: "Before you test",
          narrows:
            "The shared property across those five is the answer. Without the list you are guessing which creators to test.",
        },
        {
          ask: "Where were you comparing against, the social network itself or another tool?",
          when: "Before you test",
          narrows: "If it is another analytics tool, you are comparing two estimates rather than checking a source.",
        },
        {
          ask: "How far off were they, roughly? A few dozen or a few thousand?",
          when: "Before you test",
          narrows: "Small gaps look like staleness. Large or round-number gaps look like parsing or units.",
        },
        {
          ask: "When does your sheet last pull from our API?",
          when: "Only if testing is inconclusive",
          narrows: "Ask after your own checks, so you are not implying the fault is theirs before you have looked.",
        },
      ],
      self_answerable: [
        "The documented refresh cadence, and whether the API response exposes a last-updated timestamp at all.",
        "Collection job success and failure history for the last seven days.",
        "Whether the API and the dashboard read the same table.",
        "Which creators on the account changed handle or went private recently.",
        "Whether other customers on the same integration have raised anything similar this month.",
      ],
      tree: [
        {
          observation: "R2 brings the number into line and the docs never state a refresh cadence.",
          verdict: "Spec gap",
          because:
            "The system works as built. Nobody wrote down how fresh the data should be, so the customer had no way to know what to expect.",
        },
        {
          observation: "R2 brings it into line and the docs promise hourly updates.",
          verdict: "Confirmed bug",
          because: "There is a stated commitment and collection is not meeting it.",
        },
        {
          observation: "R1 shows the API and the dashboard disagree.",
          verdict: "Confirmed bug",
          because:
            "Two surfaces of the same product giving different answers for the same creator at the same moment is indefensible whatever the network says.",
        },
        {
          observation: "R2 shows a freshly collected value still differs from the live count by a wide margin.",
          verdict: "Confirmed bug",
          because: "Collection or parsing is producing an incorrect value, which is the only genuinely defective version of this.",
        },
        {
          observation: "Every run agrees and the customer's sheet turns out to pull weekly.",
          verdict: "Expected behaviour the user disliked",
          because:
            "Nothing is wrong with the data. The customer built an expectation of live figures the product never offered, and the fix is documentation.",
        },
      ],
      call: {
        verdict: "Spec gap",
        confidence: "Medium",
        reasoning:
          "Complaints shaped as wrong for some creators, from a customer comparing by hand, usually turn out to be freshness rather than incorrectness, and freshness only becomes a dispute when the cadence was never written down. R0 and R2 settle it inside an hour.",
        would_change:
          "An API and dashboard mismatch in R1, or a fresh collection that still differs in R2, both move this to confirmed bug.",
      },
      escalation: {
        alone: [
          "All five runs, using the API and the dashboard directly.",
          "Reading the collection job history and the documented cadence.",
          "Checking whether the API response includes a last-updated field.",
        ],
        engineering: [
          {
            item: "Why a freshly collected value differs from the live count, if R2 fails.",
            why: "Requires reading the collector and the parsing logic for that integration.",
          },
          {
            item: "Whether the API and the dashboard read from the same table.",
            why: "One message gets you an answer, which is cheaper than either of you investigating.",
          },
        ],
      },
      drafts: {
        reporter_reply:
          "Thanks for flagging. Could you send me five handles where the count looked off, with the figure you saw and roughly when you checked? The pattern across those five usually tells us straight away what is happening. Meanwhile I am comparing a few creators against the live counts myself and checking when each record last refreshed. I will come back with either a fix in progress or a clear explanation of what our numbers represent.",
        handoff_note:
          "Agency customer reports follower counts differing from the social networks for an unnamed subset of creators. I have compared live counts, API values and dashboard values for a fast-growing and a flat creator across two platforms, checked the collection history for the past week, and forced a refresh to test staleness. Findings below. If this is cadence rather than a defect it is a documentation job and it will not reach you.",
      },
    },
  },
];

/* ------------------------------------------------------------------ */

function buildPrompt(complaint, context) {
  return `You are helping a product manager turn a vague user complaint into a reproduction script they can run alone, before pulling an engineer in.

THE COMPLAINT AS REPORTED:
${complaint}

WHAT ELSE IS KNOWN:
${context || "Nothing beyond the complaint itself."}

Rules for the plan:
- Every run changes exactly one variable from the run before it, and states what it holds constant. Set changes_variable to the exact name of that variable, copied from the variables list. Use "None" for baseline runs.
- R0 is always a baseline on a known-good configuration, so later runs have a reference.
- Order the runs so that each one changes a single variable relative to the previous run. Never change two things at once, even if that means an extra cheap run.
- Say what each outcome means, so the PM knows what to conclude rather than just what to click.
- Some variables will not be exercised by any run. Keep them in the list and say in control how else to check them.
- Only recommend asking the reporter things the PM cannot find out alone. Anything in logs, admin panels, config, code or documentation goes in self_answerable.
- The verdict tree maps observable outcomes to exactly one of: "Confirmed bug", "Spec gap", "Expected behaviour the user disliked".
- Spec gap means the system behaves as built but nobody decided what it should do. Expected behaviour the user disliked means it does what it was designed to do and the reporter wanted something else. Confirmed bug means there is a stated or obvious expectation and the behaviour does not meet it.
- The call is a starting hypothesis from the wording of the complaint. Be honest about confidence and say what would overturn it.

Write in British English. Do not use em dashes or en dashes. No marketing language. Be specific to this complaint rather than generic.

Respond with JSON only. No preamble, no markdown fences. Use exactly this shape:
{
  "headline": "one sentence on what the complaint actually claims once the vagueness is stripped out",
  "claim": {
    "restated": "the complaint rewritten as a falsifiable statement",
    "undefined_terms": [{"term": "", "why": ""}],
    "assumptions": [""]
  },
  "variables": [{"name": "", "short": "two or three words for a table column", "suspicion": "High|Medium|Low", "why": "", "control": ""}],
  "runs": [{"id": "R0", "label": "", "changes_variable": "exact variable name or None", "changes": "", "holds": "", "steps": [""], "if_it_works": "", "if_it_fails": ""}],
  "questions": [{"ask": "", "when": "Before you test|Only if testing is inconclusive", "narrows": ""}],
  "self_answerable": [""],
  "tree": [{"observation": "", "verdict": "Confirmed bug|Spec gap|Expected behaviour the user disliked", "because": ""}],
  "call": {"verdict": "", "confidence": "Low|Medium|High", "reasoning": "", "would_change": ""},
  "escalation": {"alone": [""], "engineering": [{"item": "", "why": ""}]},
  "drafts": {"reporter_reply": "", "handoff_note": ""}
}

Between four and six variables, four to six runs, three to five questions, four to five tree branches.`;
}

/* ------------------------------------------------------------------ */

const NAV = [
  { id: "start", label: "Start", line: "Paste the complaint and build the script", needsResult: false },
  { id: "method", label: "How it works", line: "Why each run moves one thing only", needsResult: false },
  { id: "verdict", label: "Verdict", line: "The call, and what would overturn it", needsResult: true },
  { id: "claim", label: "The claim", line: "What is actually being claimed", needsResult: true },
  { id: "matrix", label: "Isolation matrix", line: "Which variable each run moves", needsResult: true },
  { id: "script", label: "Run script", line: "The runs in order, with readings", needsResult: true },
  { id: "questions", label: "Ask the reporter", line: "Only what you cannot find alone", needsResult: true },
  { id: "tree", label: "Outcome to verdict", line: "How each result maps to an answer", needsResult: true },
  { id: "owners", label: "Who does what", line: "What you can confirm without engineering", needsResult: true },
  { id: "drafts", label: "Drafts", line: "A reply to send and a handoff note", needsResult: true },
];

const ACCENTS = [
  "#2B0F73",
  "#3A1897",
  "#4922BC",
  "#5B34E6",
  "#6C4AF0",
  "#7D60F5",
  "#8E76F8",
  "#9C88FA",
  "#A897FB",
  "#B4A6FC",
];

export default function ReproBuilder() {
  const [complaint, setComplaint] = useState("");
  const [context, setContext] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [result, setResult] = useState(null);
  const [source, setSource] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [active, setActive] = useState("start");
  const paneRef = useRef(null);

  const available = NAV.filter((n) => !n.needsResult || result);

  function loadExample(ex) {
    setComplaint(ex.complaint);
    setContext(ex.context);
    setResult(ex.result);
    setSource(ex.tab);
    setError("");
    setActive("verdict");
  }

  function select(id) {
    setActive(id);
  }

  function goNext() {
    const i = available.findIndex((n) => n.id === active);
    if (i > -1 && i < available.length - 1) select(available[i + 1].id);
  }

  async function run() {
    if (!complaint.trim()) {
      setError("Paste the complaint first, in the reporter's own words if you have them.");
      return;
    }
    if (!apiKey.trim()) {
      setError("This needs your own Anthropic key. Open a saved run to see the output without one.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    setSource(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey.trim(),
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 4000,
          messages: [{ role: "user", content: buildPrompt(complaint, context) }],
        }),
      });
      if (!res.ok) {
        const detail = await res.text();
        throw new Error(
          res.status === 401
            ? "The key was rejected. Check it and try again."
            : "Request failed, status " + res.status + ". " + detail.slice(0, 180)
        );
      }
      const data = await res.json();
      const text = (data.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      setResult(JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim()));
      setSource("Just now");
      setActive("verdict");
    } catch (e) {
      setError(
        e instanceof SyntaxError
          ? "The response came back in a shape this page could not read. Run it again."
          : e.message
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const el = paneRef.current;
    if (el) el.scrollTop = 0;
    if (!el || el.scrollHeight <= el.clientHeight) window.scrollTo(0, 0);
  }, [active]);

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !loading) run();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const verdictColour = result ? (VERDICTS[result.call?.verdict] || VERDICTS["Spec gap"]) : null;
  const current = NAV.find((n) => n.id === active) || NAV[0];
  const nextItem = (() => {
    const i = available.findIndex((n) => n.id === active);
    return i > -1 && i < available.length - 1 ? available[i + 1] : null;
  })();

  return (
    <div className="rb">
      <style>{CSS}</style>

      <div className="rb-page">
        <header className="rb-top">
          <span className="rb-logo-mark" aria-hidden="true">
            <span />
            <span />
          </span>
          <span>
            <span className="rb-logo-name">Repro Builder</span>
            <span className="rb-logo-sub">Isolation testing for product managers</span>
          </span>
        </header>

        <div className="rb-shell">
          <nav className="rb-nav">
            {result && (
              <div className="rb-nav-verdict" style={{ background: verdictColour.colour, color: verdictColour.ink }}>
                <span>Current call</span>
                <strong>{result.call?.verdict}</strong>
              </div>
            )}
            <ul>
              {NAV.map((n, i) => {
                const locked = n.needsResult && !result;
                return (
                  <li key={n.id}>
                    <button
                      className={"rb-nav-item" + (active === n.id ? " rb-nav-on" : "") + (locked ? " rb-nav-off" : "")}
                      style={{ "--accent": ACCENTS[i] }}
                      onClick={() => !locked && select(n.id)}
                      disabled={locked}
                    >
                      <span className="rb-nav-bar" />
                      <span className="rb-nav-text">
                        <span className="rb-nav-label">{n.label}</span>
                        <span className="rb-nav-line">{locked ? "Build a script to open this" : n.line}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <main className="rb-pane" ref={paneRef} style={{ "--accent": ACCENTS[NAV.findIndex((n) => n.id === active)] }}>
            <div className="rb-pane-head">
              <h2>{current.label}</h2>
              <p>{current.line}</p>
            </div>

            {active === "start" && (
              <StartSection
                complaint={complaint}
                setComplaint={setComplaint}
                context={context}
                setContext={setContext}
                apiKey={apiKey}
                setApiKey={setApiKey}
                loading={loading}
                error={error}
                run={run}
                loadExample={loadExample}
                source={source}
              />
            )}
            {active === "method" && <MethodSection />}
            {result && active === "verdict" && <VerdictSection result={result} source={source} />}
            {result && active === "claim" && <ClaimSection claim={result.claim} headline={result.headline} />}
            {result && active === "matrix" && <MatrixSection result={result} />}
            {result && active === "script" && <ScriptSection runs={result.runs || []} />}
            {result && active === "questions" && <QuestionsSection result={result} />}
            {result && active === "tree" && <TreeSection tree={result.tree || []} />}
            {result && active === "owners" && <OwnersSection escalation={result.escalation} />}
            {result && active === "drafts" && <DraftsSection drafts={result.drafts} />}

            {nextItem && (
              <button className="rb-next" onClick={goNext}>
                Next: {nextItem.label}
              </button>
            )}
            <footer className="rb-foot">
              Written from the text of the complaint alone, with no access to your
              product, your logs or your users. Everything it produces is a hypothesis to
              test rather than a finding. The saved runs are fixed text written by hand,
              so the page is readable without a key.
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function StartSection(p) {
  return (
    <>
      <div className="rb-hero">
        <h3>A vague bug report is three guesses in one sentence.</h3>
        <p>
          Paste what the reporter actually said. You get a test script that moves one
          variable at a time, the questions worth asking them, and the verdict the
          evidence supports.
        </p>
      </div>

      <label className="rb-label" htmlFor="rb-complaint">
        The complaint, word for word
      </label>
      <textarea
        id="rb-complaint"
        className="rb-field rb-field-lead"
        rows={2}
        value={p.complaint}
        placeholder="The export doesn't work on my phone."
        onChange={(e) => p.setComplaint(e.target.value)}
      />

      <label className="rb-label" htmlFor="rb-context">
        What you already know
      </label>
      <textarea
        id="rb-context"
        className="rb-field"
        rows={3}
        value={p.context}
        placeholder="Who reported it and how. What the feature does. Plan or account type. Anything that changed recently."
        onChange={(e) => p.setContext(e.target.value)}
      />

      <div className="rb-actions">
        <input
          className="rb-field rb-keyfield"
          type="password"
          value={p.apiKey}
          placeholder="Your Anthropic API key"
          aria-label="Anthropic API key"
          onChange={(e) => p.setApiKey(e.target.value)}
        />
        <button className="rb-cta" onClick={p.run} disabled={p.loading}>
          {p.loading ? "Building" : "Build script"}
        </button>
      </div>
      <p className="rb-fine">
        The key is held in this tab only. It is never stored and goes nowhere except
        api.anthropic.com.
      </p>
      {p.error && <div className="rb-alert">{p.error}</div>}

      <div className="rb-saved">
        <span className="rb-saved-label">No key? Open a saved run</span>
        <div className="rb-chips">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.key}
              className={"rb-chip" + (p.source === ex.tab ? " rb-chip-on" : "")}
              onClick={() => p.loadExample(ex)}
            >
              {ex.tab}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

const DEFS = {
  "Confirmed bug":
    "There was a clear expectation, stated or obvious, and the product missed it. The only one of the three that starts life as an engineering task.",
  "Spec gap":
    "The product behaves exactly as built because nobody decided what it should do. A decision has to come before any code, and that decision is yours rather than theirs.",
  "Expected behaviour the user disliked":
    "It works as designed and the reporter wanted something else. Real signal, worth recording, but a ticket would waste everyone's week.",
};

function MethodSection() {
  const demoVars = ["Account", "Browser", "OS", "Data size"];
  const demoRuns = [
    { id: "R0", label: "Baseline", changed: -1 },
    { id: "R1", label: "One change", changed: 1 },
    { id: "R2", label: "One change", changed: 2 },
    { id: "R3", label: "One change", changed: 3 },
  ];
  return (
    <>
      <p className="rb-lede">
        Change one thing between runs and the result means something. Change two and it
        means nothing.
      </p>
      <p className="rb-p">
        Every plan is built as a matrix. Rows are test runs, columns are the variables in
        play, and exactly one cell is filled per row. If two runs differ only by the
        browser and only the second fails, you have learned something real about the
        browser.
      </p>

      <div className="rb-mx-wrap">
        <table className="rb-matrix">
          <thead>
            <tr>
              <th className="rb-mx-corner">Run</th>
              {demoVars.map((v) => (
                <th key={v} className="rb-mx-col">
                  {v}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {demoRuns.map((r) => (
              <tr key={r.id}>
                <th className="rb-mx-row">
                  <span className="rb-mx-id">{r.id}</span>
                  <span className="rb-mx-label">{r.label}</span>
                </th>
                {demoVars.map((v, i) => (
                  <td key={v}>
                    <span className={i === r.changed ? "rb-cell rb-cell-on" : "rb-cell rb-cell-held"} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Legend />

      <h3 className="rb-h3">The three answers</h3>
      <div className="rb-defs">
        {Object.keys(VERDICTS).map((k) => (
          <article key={k} className="rb-def">
            <span className="rb-def-tag" style={{ background: VERDICTS[k].colour, color: VERDICTS[k].ink }}>
              {k}
            </span>
            <p>{DEFS[k]}</p>
          </article>
        ))}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

function VerdictSection({ result, source }) {
  const v = VERDICTS[result.call?.verdict] || VERDICTS["Spec gap"];
  return (
    <>
      <div className="rb-verdict" style={{ background: v.colour, color: v.ink }}>
        <div className="rb-verdict-top">
          <span className="rb-verdict-eyebrow">Starting hypothesis</span>
          <span className="rb-verdict-conf">{result.call?.confidence} confidence</span>
        </div>
        <h3>{result.call?.verdict}</h3>
        <p>{result.call?.reasoning}</p>
        <div className="rb-verdict-flip">
          <strong>What would overturn it</strong>
          <span>{result.call?.would_change}</span>
        </div>
      </div>
      <p className="rb-headline">{result.headline}</p>
      {source && <p className="rb-fine">Source: {source}</p>}
    </>
  );
}

function ClaimSection({ claim, headline }) {
  return (
    <>
      <p className="rb-restated">{claim?.restated}</p>
      <p className="rb-p rb-p-top">{headline}</p>
      <h3 className="rb-h3">Words doing too much work</h3>
      <div className="rb-terms">
        {(claim?.undefined_terms || []).map((t, i) => (
          <div key={i} className="rb-term">
            <span className="rb-term-word">{t.term}</span>
            <p>{t.why}</p>
          </div>
        ))}
      </div>
      <h3 className="rb-h3">Assumptions baked into the report</h3>
      <ul className="rb-list">
        {(claim?.assumptions || []).map((a, i) => (
          <li key={i}>{a}</li>
        ))}
      </ul>
    </>
  );
}

function MatrixSection({ result }) {
  const variables = result.variables || [];
  const runs = result.runs || [];
  const names = variables.map((v) => v.name);
  const exercised = variables.map((v) => runs.some((r) => r.changes_variable === v.name));
  const unexercised = variables.filter((v, i) => !exercised[i]);
  return (
    <>
      <div className="rb-mx-wrap">
        <table className="rb-matrix">
          <thead>
            <tr>
              <th className="rb-mx-corner">Run</th>
              {variables.map((v) => (
                <th key={v.name} className="rb-mx-col" title={v.name}>
                  {v.short || v.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => {
              const idx = names.indexOf(r.changes_variable);
              return (
                <tr key={r.id}>
                  <th className="rb-mx-row">
                    <span className="rb-mx-id">{r.id}</span>
                    <span className="rb-mx-label">{r.label}</span>
                  </th>
                  {variables.map((v, i) => (
                    <td key={v.name}>
                      <span
                        className={
                          i === idx
                            ? "rb-cell rb-cell-on"
                            : exercised[i]
                            ? "rb-cell rb-cell-held"
                            : "rb-cell rb-cell-off"
                        }
                        title={
                          i === idx
                            ? "Changed in " + r.id
                            : exercised[i]
                            ? "Held constant in " + r.id
                            : "Not exercised by this script"
                        }
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Legend />
      {unexercised.length > 0 && (
        <p className="rb-note">
          Not exercised by any run: {unexercised.map((v) => v.short || v.name).join(", ")}.
          Check those another way, as described below.
        </p>
      )}
      <h3 className="rb-h3">The variables in play</h3>
      <div className="rb-vars">
        {variables.map((v, i) => (
          <article key={i} className="rb-var">
            <div className="rb-var-top">
              <h4>{v.name}</h4>
              <span className={"rb-pill rb-pill-" + String(v.suspicion).toLowerCase()}>
                {v.suspicion} suspicion
              </span>
            </div>
            <p>{v.why}</p>
            <p className="rb-var-control">
              <strong>Control</strong> {v.control}
            </p>
          </article>
        ))}
      </div>
    </>
  );
}

function ScriptSection({ runs }) {
  return (
    <ol className="rb-runs">
      {runs.map((r, i) => (
        <li key={i} className="rb-run">
          <div className="rb-run-top">
            <span className="rb-run-id">{r.id}</span>
            <h4>{r.label}</h4>
          </div>
          <div className="rb-run-meta">
            <p>
              <strong>Changes</strong> {r.changes}
            </p>
            <p>
              <strong>Holds fixed</strong> {r.holds}
            </p>
          </div>
          <ol className="rb-steps">
            {(r.steps || []).map((s, j) => (
              <li key={j}>
                <span className="rb-step-n">{j + 1}</span>
                {s}
              </li>
            ))}
          </ol>
          <div className="rb-reading">
            <div className="rb-read rb-read-pass">
              <span>If it works</span>
              <p>{r.if_it_works}</p>
            </div>
            <div className="rb-read rb-read-fail">
              <span>If it fails</span>
              <p>{r.if_it_fails}</p>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function QuestionsSection({ result }) {
  return (
    <>
      <div className="rb-qs">
        {(result.questions || []).map((q, i) => (
          <article key={i} className="rb-q">
            <p className="rb-ask">{q.ask}</p>
            <span className="rb-when">{q.when}</span>
            <p className="rb-narrows">{q.narrows}</p>
          </article>
        ))}
      </div>
      <h3 className="rb-h3">Do not ask, go and look</h3>
      <ul className="rb-list">
        {(result.self_answerable || []).map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </>
  );
}

function TreeSection({ tree }) {
  return (
    <div className="rb-tree">
      {tree.map((b, i) => {
        const v = VERDICTS[b.verdict] || VERDICTS["Spec gap"];
        return (
          <article key={i} className="rb-branch">
            <p className="rb-obs">{b.observation}</p>
            <span className="rb-vtag" style={{ background: v.colour, color: v.ink }}>
              {b.verdict}
            </span>
            <p className="rb-because">{b.because}</p>
          </article>
        );
      })}
    </div>
  );
}

function OwnersSection({ escalation }) {
  return (
    <div className="rb-split">
      <div className="rb-half">
        <h3 className="rb-h3">You can confirm this alone</h3>
        <ul className="rb-list">
          {(escalation?.alone || []).map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      </div>
      <div className="rb-half rb-half-eng">
        <h3 className="rb-h3">This genuinely needs engineering</h3>
        <ul className="rb-eng">
          {(escalation?.engineering || []).map((e, i) => (
            <li key={i}>
              <strong>{e.item}</strong>
              <span>{e.why}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DraftsSection({ drafts }) {
  return (
    <>
      <CopyBlock label="Reply to the reporter" text={drafts?.reporter_reply} />
      <CopyBlock label="Note for engineering, if it gets there" text={drafts?.handoff_note} />
    </>
  );
}

/* ------------------------------------------------------------------ */

function Legend() {
  return (
    <div className="rb-legend">
      <span>
        <i className="rb-cell rb-cell-on" />
        Changed
      </span>
      <span>
        <i className="rb-cell rb-cell-held" />
        Held constant
      </span>
      <span>
        <i className="rb-cell rb-cell-off" />
        Not exercised
      </span>
    </div>
  );
}

function CopyBlock({ label, text }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div className="rb-draft">
      <div className="rb-draft-top">
        <span>{label}</span>
        <button className="rb-copy" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p>{text}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.rb {
  --bg: #F4F2FB;
  --card: #FFFFFF;
  --ink: #1B1145;
  --body: #4E4A6B;
  --dim: #8C88A8;
  --p-900: #2B0F73;
  --p-700: #4922BC;
  --p-600: #5B34E6;
  --p-400: #8E76F8;
  --p-200: #D8CDFA;
  --p-100: #EBE4FE;
  --p-50: #F7F4FF;
  --red: #EF4A45;
  --amber: #F0A81E;
  --green: #14A97B;
  --r-lg: 24px;
  --r-md: 16px;
  --r-sm: 12px;
  --sh: 0 10px 30px rgba(27, 17, 69, 0.06);
  --accent: #5B34E6;
  background: var(--bg);
  color: var(--body);
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 15px;
  line-height: 1.6;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.rb *, .rb *::before, .rb *::after { box-sizing: border-box; }
.rb h2, .rb h3, .rb h4 { color: var(--ink); letter-spacing: -0.02em; margin: 0; }
.rb button:focus-visible, .rb textarea:focus-visible, .rb input:focus-visible {
  outline: 3px solid var(--p-600); outline-offset: 2px;
}
.rb-page {
  max-width: 1080px; width: 100%; margin: 0 auto; padding: 20px 20px 20px;
  flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column;
}

/* header */
.rb-top { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; flex: 0 0 auto; }
.rb-logo-mark {
  width: 40px; height: 40px; border-radius: 13px; background: var(--p-600);
  display: flex; align-items: center; justify-content: center; gap: 4px; flex: 0 0 auto;
}
.rb-logo-mark span { width: 6px; border-radius: 3px; background: rgba(255,255,255,0.5); }
.rb-logo-mark span:first-child { height: 11px; }
.rb-logo-mark span:last-child { height: 20px; background: #fff; }
.rb-logo-name { display: block; font-weight: 800; font-size: 1.05rem; color: var(--ink); }
.rb-logo-sub { display: block; font-size: 0.8rem; color: var(--dim); }

/* shell */
.rb-shell { display: flex; align-items: stretch; gap: 20px; flex: 1 1 auto; min-height: 0; }
.rb-nav { flex: 0 0 262px; width: 262px; overflow-y: auto; padding-right: 2px; }
.rb-pane {
  flex: 1 1 auto; min-width: 0; min-height: 0; overflow-y: auto;
  background: var(--card); border-radius: var(--r-lg);
  padding: 28px 30px; box-shadow: var(--sh);
}

/* nav */
.rb-nav-verdict { border-radius: var(--r-md); padding: 13px 16px; margin-bottom: 14px; }
.rb-nav-verdict span { display: block; font-size: 0.72rem; font-weight: 700; opacity: 0.8; }
.rb-nav-verdict strong { display: block; font-size: 0.92rem; font-weight: 800; line-height: 1.35; margin-top: 2px; }
.rb-nav ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.rb-nav-item {
  display: flex; align-items: stretch; gap: 11px; width: 100%; text-align: left;
  font-family: inherit; background: none; border: none; border-radius: var(--r-md);
  padding: 10px 12px; cursor: pointer;
}
.rb-nav-bar { flex: 0 0 4px; border-radius: 3px; background: var(--p-200); }
.rb-nav-label { display: block; font-size: 0.9rem; font-weight: 700; color: var(--ink); }
.rb-nav-line { display: block; font-size: 0.76rem; color: var(--dim); line-height: 1.4; margin-top: 1px; }
.rb-nav-item:hover { background: var(--p-50); }
.rb-nav-on { background: var(--p-50); }
.rb-nav-on .rb-nav-bar { background: var(--accent); }
.rb-nav-on .rb-nav-label { color: var(--accent); }
.rb-nav-off { cursor: default; opacity: 0.45; }
.rb-nav-off:hover { background: none; }

/* pane head */
.rb-pane-head { border-bottom: 1px solid var(--p-100); padding-bottom: 16px; margin-bottom: 22px; }
.rb-pane-head h2 { font-size: 1.35rem; font-weight: 800; color: var(--accent); }
.rb-pane-head p { margin: 3px 0 0; font-size: 0.9rem; color: var(--dim); }

/* start */
.rb-hero {
  background: linear-gradient(135deg, var(--p-600) 0%, var(--p-900) 100%);
  border-radius: var(--r-md); padding: 24px 26px; color: #fff; margin-bottom: 24px;
}
.rb-hero h3 { color: #fff; font-size: 1.22rem; font-weight: 800; line-height: 1.3; max-width: 24ch; }
.rb-hero p { margin: 10px 0 0; font-size: 0.92rem; color: rgba(255,255,255,0.82); max-width: 58ch; }
.rb-label { display: block; font-size: 0.8rem; font-weight: 700; color: var(--ink); margin-bottom: 7px; }
.rb-field {
  width: 100%; font-family: inherit; font-size: 0.92rem; line-height: 1.5; color: var(--ink);
  background: var(--p-50); border: 1px solid var(--p-100); border-radius: var(--r-sm);
  padding: 12px 15px; resize: vertical; margin-bottom: 18px;
}
.rb-field::placeholder { color: #A9A4C4; }
.rb-field-lead { font-weight: 600; }
.rb-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.rb-keyfield { flex: 1 1 200px; margin-bottom: 0; }
.rb-cta {
  font-family: inherit; font-size: 0.92rem; font-weight: 700; color: #fff;
  background: var(--p-600); border: none; border-radius: 999px; padding: 12px 28px; cursor: pointer;
}
.rb-cta:hover { background: var(--p-700); }
.rb-cta:disabled { background: var(--p-200); color: #fff; cursor: default; }
.rb-fine { font-size: 0.78rem; color: var(--dim); margin: 12px 0 0; max-width: 62ch; }
.rb-alert {
  margin-top: 14px; background: #FDECEB; color: #B62F2A; border-radius: var(--r-sm);
  padding: 11px 14px; font-size: 0.87rem; font-weight: 600;
}
.rb-saved { margin-top: 26px; border-top: 1px solid var(--p-100); padding-top: 18px; }
.rb-saved-label { display: block; font-size: 0.8rem; font-weight: 700; color: var(--ink); margin-bottom: 10px; }
.rb-chips { display: flex; gap: 8px; flex-wrap: wrap; }
.rb-chip {
  font-family: inherit; font-size: 0.84rem; font-weight: 600; color: var(--p-700);
  background: var(--p-50); border: 1px solid var(--p-100); border-radius: 999px;
  padding: 8px 17px; cursor: pointer;
}
.rb-chip:hover { border-color: var(--p-400); }
.rb-chip-on { background: var(--p-600); color: #fff; border-color: var(--p-600); }

/* shared type */
.rb-lede { font-size: 1.08rem; font-weight: 600; color: var(--ink); margin: 0 0 12px; max-width: 54ch; }
.rb-p { font-size: 0.94rem; margin: 0 0 22px; max-width: 66ch; }
.rb-p-top { margin-top: 16px; }
.rb-h3 { font-size: 0.82rem; font-weight: 700; color: var(--dim); margin: 28px 0 13px; }
.rb-list { margin: 0; padding-left: 20px; }
.rb-list li { margin-bottom: 9px; max-width: 68ch; font-size: 0.93rem; }
.rb-note { font-size: 0.86rem; color: var(--dim); margin: 16px 0 0; max-width: 64ch; }
.rb-headline {
  font-size: 1.15rem; font-weight: 700; color: var(--ink); line-height: 1.45;
  max-width: 48ch; margin: 22px 0 0;
}

/* verdict */
.rb-verdict { border-radius: var(--r-md); padding: 24px 26px; }
.rb-verdict-top { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.rb-verdict-eyebrow, .rb-verdict-conf {
  font-size: 0.74rem; font-weight: 700; background: rgba(255,255,255,0.22);
  border-radius: 999px; padding: 5px 13px;
}
.rb-verdict-conf { margin-left: auto; }
.rb-verdict h3 { color: inherit; font-size: 1.5rem; font-weight: 800; margin-bottom: 10px; }
.rb-verdict p { margin: 0; font-size: 0.94rem; opacity: 0.93; max-width: 64ch; }
.rb-verdict-flip {
  margin-top: 18px; background: rgba(255,255,255,0.18); border-radius: var(--r-sm);
  padding: 13px 16px; font-size: 0.9rem;
}
.rb-verdict-flip strong { display: block; font-size: 0.75rem; opacity: 0.85; margin-bottom: 3px; }

/* claim */
.rb-restated {
  font-size: 1.02rem; font-weight: 600; color: var(--ink); margin: 0;
  background: var(--p-50); border-left: 4px solid var(--accent);
  border-radius: var(--r-sm); padding: 17px 20px; max-width: 64ch;
}
.rb-terms { display: flex; flex-direction: column; gap: 15px; }
.rb-term-word {
  display: inline-block; font-size: 0.84rem; font-weight: 700; color: var(--p-700);
  background: var(--p-100); border-radius: 999px; padding: 4px 13px; margin-bottom: 6px;
}
.rb-term p { margin: 0; font-size: 0.92rem; max-width: 68ch; }

/* matrix */
.rb-mx-wrap { overflow-x: auto; padding-bottom: 6px; }
.rb-matrix { border-collapse: separate; border-spacing: 5px; }
.rb-mx-corner, .rb-mx-col {
  font-size: 0.74rem; font-weight: 700; color: var(--dim); text-align: left;
  padding: 0 0 4px 2px; white-space: nowrap; vertical-align: bottom;
}
.rb-mx-row { text-align: left; padding-right: 14px; white-space: nowrap; vertical-align: middle; }
.rb-mx-id { display: block; font-size: 0.82rem; font-weight: 800; color: var(--ink); }
.rb-mx-label { display: block; font-size: 0.72rem; font-weight: 500; color: var(--dim); }
.rb-matrix td { padding: 0; }
.rb-cell { display: block; width: 74px; height: 30px; border-radius: 9px; }
.rb-cell-on { background: var(--p-600); }
.rb-cell-held { background: var(--p-100); }
.rb-cell-off {
  background: repeating-linear-gradient(45deg, #F6F4FE, #F6F4FE 5px, #E6E0FA 5px, #E6E0FA 7px);
}
.rb-legend { display: flex; flex-wrap: wrap; gap: 18px; margin-top: 14px; }
.rb-legend span { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: var(--dim); font-weight: 600; }
.rb-legend i { width: 26px; height: 14px; border-radius: 5px; }

/* variables */
.rb-vars { display: flex; flex-direction: column; gap: 12px; }
.rb-var { background: var(--p-50); border-radius: var(--r-md); padding: 17px 19px; }
.rb-var-top { display: flex; align-items: center; gap: 12px; margin-bottom: 7px; flex-wrap: wrap; }
.rb-var-top h4 { font-size: 0.98rem; font-weight: 700; }
.rb-var p { margin: 0; font-size: 0.91rem; max-width: 66ch; }
.rb-var-control { margin-top: 9px !important; color: var(--dim); }
.rb-var-control strong { color: var(--ink); }
.rb-pill {
  margin-left: auto; font-size: 0.72rem; font-weight: 700; border-radius: 999px;
  padding: 4px 12px; white-space: nowrap;
}
.rb-pill-high { background: var(--p-900); color: #fff; }
.rb-pill-medium { background: var(--p-200); color: var(--p-900); }
.rb-pill-low { background: #EDEBF6; color: var(--dim); }

/* runs */
.rb-runs { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 14px; }
.rb-run { background: var(--p-50); border-radius: var(--r-md); padding: 20px 22px; }
.rb-run-top { display: flex; align-items: center; gap: 11px; margin-bottom: 12px; }
.rb-run-id {
  font-size: 0.78rem; font-weight: 800; color: #fff; background: var(--p-600);
  border-radius: 999px; padding: 4px 13px;
}
.rb-run-top h4 { font-size: 1.02rem; font-weight: 700; }
.rb-run-meta p { margin: 0 0 5px; font-size: 0.9rem; max-width: 66ch; }
.rb-run-meta strong { color: var(--ink); }
.rb-steps { list-style: none; margin: 14px 0 16px; padding: 0; }
.rb-steps li { display: flex; gap: 10px; font-size: 0.91rem; margin-bottom: 8px; max-width: 64ch; }
.rb-step-n {
  flex: 0 0 auto; width: 21px; height: 21px; border-radius: 50%; background: var(--p-200);
  color: var(--p-900); font-size: 0.72rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center; margin-top: 2px;
}
.rb-reading { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.rb-read { border-radius: var(--r-sm); padding: 13px 15px; background: #fff; }
.rb-read span { font-size: 0.76rem; font-weight: 700; }
.rb-read p { margin: 5px 0 0; font-size: 0.88rem; }
.rb-read-pass span { color: var(--green); }
.rb-read-fail span { color: var(--red); }

/* questions */
.rb-qs { display: flex; flex-direction: column; gap: 13px; }
.rb-q { background: var(--p-50); border-radius: var(--r-md); padding: 17px 19px; }
.rb-ask { font-size: 1rem; font-weight: 700; color: var(--ink); margin: 0 0 9px; max-width: 56ch; }
.rb-when {
  display: inline-block; font-size: 0.72rem; font-weight: 700; color: var(--p-700);
  background: var(--p-100); border-radius: 999px; padding: 4px 12px;
}
.rb-narrows { font-size: 0.89rem; margin: 9px 0 0; max-width: 66ch; }

/* tree */
.rb-tree { display: flex; flex-direction: column; gap: 14px; }
.rb-branch { background: var(--p-50); border-radius: var(--r-md); padding: 17px 19px; }
.rb-obs { font-size: 0.94rem; font-weight: 600; color: var(--ink); margin: 0 0 10px; max-width: 66ch; }
.rb-vtag { display: inline-block; font-size: 0.74rem; font-weight: 700; border-radius: 999px; padding: 5px 13px; }
.rb-because { font-size: 0.89rem; margin: 10px 0 0; max-width: 66ch; }

/* owners */
.rb-split { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.rb-half { background: var(--p-50); border-radius: var(--r-md); padding: 18px 20px; }
.rb-half .rb-h3 { margin-top: 0; color: var(--p-700); }
.rb-half-eng .rb-h3 { color: var(--p-900); }
.rb-eng { list-style: none; margin: 0; padding: 0; }
.rb-eng li { margin-bottom: 13px; }
.rb-eng strong { display: block; font-size: 0.92rem; color: var(--ink); }
.rb-eng span { display: block; font-size: 0.86rem; margin-top: 2px; }

/* drafts */
.rb-draft { background: var(--p-50); border-radius: var(--r-md); padding: 16px 18px; margin-bottom: 14px; }
.rb-draft-top { display: flex; align-items: center; margin-bottom: 9px; }
.rb-draft-top span { font-size: 0.8rem; font-weight: 700; color: var(--ink); }
.rb-copy {
  margin-left: auto; font-family: inherit; font-size: 0.76rem; font-weight: 700; color: var(--p-700);
  background: #fff; border: 1px solid var(--p-100); border-radius: 999px; padding: 5px 15px; cursor: pointer;
}
.rb-copy:hover { background: var(--p-100); }
.rb-draft p { margin: 0; font-size: 0.91rem; max-width: 70ch; white-space: pre-wrap; }

/* defs */
.rb-defs { display: flex; flex-direction: column; gap: 13px; }
.rb-def { background: var(--p-50); border-radius: var(--r-md); padding: 16px 18px; }
.rb-def-tag {
  display: inline-block; font-size: 0.76rem; font-weight: 700; border-radius: 999px;
  padding: 5px 14px; margin-bottom: 9px;
}
.rb-def p { margin: 0; font-size: 0.91rem; max-width: 66ch; }

/* next */
.rb-next {
  margin-top: 28px; font-family: inherit; font-size: 0.86rem; font-weight: 700;
  color: var(--p-700); background: var(--p-50); border: 1px solid var(--p-100);
  border-radius: 999px; padding: 10px 22px; cursor: pointer;
}
.rb-next:hover { background: var(--p-100); }

.rb-foot {
  font-size: 0.8rem; color: var(--dim); max-width: 74ch;
  margin: 30px 0 0; padding-top: 18px; border-top: 1px solid var(--p-100);
}

@media (max-width: 860px) {
  .rb { height: auto; overflow: visible; padding-bottom: 40px; }
  .rb-page { padding: 18px 14px 0; display: block; }
  .rb-shell { display: block; }
  .rb-nav { overflow-y: visible; }
  .rb-pane { overflow-y: visible; min-height: 0; }
  .rb-shell { flex-direction: column; }
  .rb-nav { flex: 1 1 auto; width: 100%; }
  .rb-nav ul { flex-direction: row; overflow-x: auto; gap: 8px; padding-bottom: 6px; }
  .rb-nav li { flex: 0 0 auto; }
  .rb-nav-item { background: #fff; padding: 10px 14px; }
  .rb-nav-line { display: none; }
  .rb-pane { padding: 22px 18px; width: 100%; }
  .rb-reading, .rb-split { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  .rb * { transition: none !important; animation: none !important; scroll-behavior: auto !important; }
}
`;
