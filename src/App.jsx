import React, { useState, useEffect, useRef } from "react";

/* ------------------------------------------------------------------ *
 * Data or product?
 * Tells you whether a metric moved because the measurement broke or
 * because people behaved differently, and what to check first.
 * ------------------------------------------------------------------ */

const C = {
  ink: "#241A20",
  body: "#4E4149",
  muted: "#7C6E76",
  hairline: "#E7DCE2",
  page: "#FBF8F9",
  surface: "#FFFFFF",
  plum: "#7C2D5E",
  plumDeep: "#4C1538",
  plumMid: "#A8437F",
  plumSoft: "#F3E4EE",
  plumSofter: "#FAF1F6",
  green: "#2F7D51",
  amber: "#B57614",
  red: "#B3363A",
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

.dop, .dop * { box-sizing: border-box; }
.dop {
  font-family: 'Outfit', ui-sans-serif, system-ui, -apple-system, sans-serif;
  color: ${C.body};
  background: ${C.page};
  height: 100vh;
  display: flex;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}
.dop h1, .dop h2, .dop h3 { color: ${C.ink}; margin: 0; letter-spacing: -0.02em; }
.dop p { margin: 0; line-height: 1.6; }

.dop-rail {
  width: 268px;
  flex: 0 0 268px;
  height: 100vh;
  background: ${C.plumDeep};
  padding: 30px 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 26px;
  overflow: hidden;
}
.dop-navbtn {
  width: 100%;
  text-align: left;
  border: 0;
  border-radius: 16px;
  padding: 13px 15px;
  background: transparent;
  color: rgba(255,255,255,0.72);
  cursor: pointer;
  font-family: inherit;
  transition: background 140ms ease, color 140ms ease;
  display: block;
}
.dop-navbtn:hover { background: rgba(255,255,255,0.08); color: #fff; }
.dop-navbtn[data-on="true"] { background: ${C.plum}; color: #fff; }
.dop-navbtn[data-on="true"] .dop-navsub { color: rgba(255,255,255,0.78); }
.dop-navttl { font-size: 15px; font-weight: 600; line-height: 1.2; }
.dop-navsub { font-size: 12.5px; font-weight: 300; line-height: 1.35; margin-top: 3px; color: rgba(255,255,255,0.5); }
.dop-navbtn:disabled { opacity: 0.42; cursor: not-allowed; }
.dop-navbtn:disabled:hover { background: transparent; color: rgba(255,255,255,0.72); }

.dop-main { flex: 1; height: 100vh; overflow-y: auto; }
.dop-inner { max-width: 780px; padding: 44px 48px 96px; }

.dop-card {
  background: ${C.surface};
  border: 1px solid ${C.hairline};
  border-radius: 22px;
  padding: 26px 28px;
  box-shadow: 0 1px 2px rgba(76,21,56,0.04);
}
.dop-chip {
  border: 1px solid ${C.hairline};
  background: ${C.surface};
  color: ${C.body};
  border-radius: 999px;
  padding: 8px 15px;
  font-size: 14px;
  font-family: inherit;
  font-weight: 400;
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease, color 120ms ease;
}
.dop-chip:hover { border-color: ${C.plumMid}; }
.dop-chip[data-on="true"] {
  background: ${C.plum};
  border-color: ${C.plum};
  color: #fff;
  font-weight: 500;
}
.dop-addchip {
  border: 1px dashed ${C.plumMid};
  background: transparent;
  color: ${C.plum};
  border-radius: 999px;
  padding: 8px 15px;
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
}
.dop-input, .dop-textarea {
  width: 100%;
  border: 1px solid ${C.hairline};
  border-radius: 14px;
  padding: 11px 14px;
  font-family: inherit;
  font-size: 15px;
  color: ${C.ink};
  background: ${C.surface};
  outline: none;
}
.dop-input:focus, .dop-textarea:focus { border-color: ${C.plum}; box-shadow: 0 0 0 3px ${C.plumSoft}; }
.dop-textarea { resize: vertical; min-height: 88px; line-height: 1.55; }
.dop-run {
  border: 0;
  border-radius: 999px;
  background: ${C.plum};
  color: #fff;
  font-family: inherit;
  font-size: 15.5px;
  font-weight: 600;
  padding: 14px 30px;
  cursor: pointer;
  transition: background 140ms ease;
}
.dop-run:hover { background: ${C.plumDeep}; }
.dop-run:disabled { background: ${C.muted}; cursor: not-allowed; }
.dop-ghost {
  border: 1px solid ${C.hairline};
  background: ${C.surface};
  color: ${C.plum};
  border-radius: 999px;
  padding: 10px 20px;
  font-family: inherit;
  font-size: 14.5px;
  font-weight: 500;
  cursor: pointer;
}
.dop-ghost:hover { border-color: ${C.plumMid}; background: ${C.plumSofter}; }

.dop *:focus-visible { outline: 2px solid ${C.plumMid}; outline-offset: 2px; }

.dop-duo { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.dop-tile {
  flex: 0 0 auto;
  width: 32px; height: 32px;
  border-radius: 11px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.dop-row { display: flex; gap: 13px; align-items: flex-start; }
.dop-row + .dop-row { border-top: 1px solid ${C.hairline}; padding-top: 14px; margin-top: 14px; }

@media (max-width: 860px) {
  .dop { flex-direction: column; height: auto; overflow: visible; }
  .dop-rail {
    width: 100%; flex: none; height: auto; flex-direction: row;
    gap: 10px; overflow-x: auto; padding: 16px;
    position: sticky; top: 0; z-index: 10;
  }
  .dop-railhead { display: none; }
  .dop-navbtn { width: auto; min-width: 168px; flex: 0 0 auto; }
  .dop-main { height: auto; overflow: visible; }
  .dop-inner { padding: 28px 20px 72px; }
  .dop-duo { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .dop * { transition: none !important; animation: none !important; }
}
@keyframes dop-pulse { 0%,100% { opacity: 0.35; } 50% { opacity: 1; } }
.dop-pulse { animation: dop-pulse 1.3s ease-in-out infinite; }
`;

/* ---------------------------- form fields ---------------------------- */

const FIELDS = [
  {
    key: "shape",
    label: "How the change looks on the chart",
    help: "The shape tells you more than the size does.",
    mode: "single",
    options: [
      "Dropped overnight and stayed down",
      "Slid gradually over days or weeks",
      "Spiky, comes and goes",
      "Dropped, then recovered on its own",
      "Went to zero completely",
    ],
  },
  {
    key: "scope",
    label: "Where it shows up",
    help: "Pick everything that applies.",
    mode: "multi",
    options: [
      "Every platform",
      "Web only",
      "iOS only",
      "Android only",
      "One browser",
      "One country or language",
      "One customer segment",
      "New users only",
      "Returning users only",
    ],
  },
  {
    key: "changed",
    label: "What changed around the same time",
    help: "Include anything, even if it seems unrelated.",
    mode: "multi",
    options: [
      "App or web release",
      "Analytics or tag change",
      "Consent banner change",
      "Third-party SDK update",
      "Marketing campaign started or ended",
      "Pricing or paywall change",
      "Data pipeline or warehouse job",
      "Nothing we know of",
    ],
  },
  {
    key: "source",
    label: "Where the number comes from",
    help: "Which tool is telling you this.",
    mode: "single",
    options: [
      "Product analytics tool",
      "BI dashboard",
      "Query against the backend database",
      "Ad or app store platform",
      "Spreadsheet export",
    ],
  },
  {
    key: "checked",
    label: "What you have already ruled out",
    help: "Be honest here. It changes the order of the checks you get back.",
    mode: "multi",
    options: [
      "Compared against raw backend counts",
      "Checked a second tool",
      "Compared to the same weekday last week",
      "Checked whether the report definition changed",
      "Asked support whether tickets went up",
      "Nothing yet",
    ],
  },
];

/* ---------------------------- worked examples ---------------------------- */

const EXAMPLES = [
  {
    id: "signup",
    name: "Signups fell 18% overnight",
    blurb: "Web only, right after a release, backend count looks unchanged.",
    form: {
      metric: "Signup completion rate",
      movement: "Down 18%, from 22% to 18%, started Tuesday morning",
      shape: ["Dropped overnight and stayed down"],
      scope: ["Web only"],
      changed: ["App or web release", "Analytics or tag change"],
      source: ["Product analytics tool"],
      checked: ["Nothing yet"],
      notes:
        "Growth is asking whether to roll the release back today. Nobody has looked at the database yet.",
    },
    result: {
      verdict: "Most likely a measurement problem",
      confidence: "High",
      why: [
        "A clean overnight step with no recovery is what a broken or renamed event looks like. Real user behaviour almost never changes by a fixed amount at midnight and then holds perfectly flat.",
        "The drop is on web only, which is also the only surface that got a release. Tags live in the release, so the tracking is as likely to have shipped a change as the product is.",
        "18% of a funnel step disappearing without any complaint from support points at counting rather than experience. If a fifth of people genuinely could not sign up, you would hear about it.",
        "Nothing has been compared against the backend yet, so the number currently has a single source and no corroboration.",
      ],
      checks: [
        {
          title: "Count signups in the database",
          how: "Ask for a row count of accounts created per day for the last fourteen days, split by web and app.",
          rules: "Settles it. If the database agrees with analytics, the drop is real.",
          time: "15 minutes, one Slack message",
        },
        {
          title: "Diff the tracking calls in the release",
          how: "Search the release diff for the signup event name and any change to the analytics initialisation.",
          rules: "Renamed or removed events, and events now firing before consent.",
          time: "20 minutes",
        },
        {
          title: "Check the consent banner",
          how: "Open the signup flow in a fresh private window and watch whether the event fires before you accept cookies.",
          rules: "A consent change that silently stopped collection for a slice of users.",
          time: "10 minutes",
        },
        {
          title: "Look at the step above and below",
          how: "Compare the traffic entering the funnel and the welcome emails actually sent.",
          rules: "Tells you which single step lost its counter, versus the whole funnel moving together.",
          time: "15 minutes",
        },
      ],
      ifArtefact: [
        "Do not roll back. You would be reverting a product change to fix a counting change, and the number would move again for a third reason.",
        "Get the event fixed, then backfill or annotate the gap so nobody reads this week as a real decline in three months' time.",
      ],
      ifReal: [
        "Roll back the release and confirm the rate recovers within a day. That is the cheapest proof you will get.",
        "Pull five session recordings from after the release before the fix ships, so you know which step people abandoned.",
      ],
      escalate: [
        "Bring in engineering only after the database count comes back. Hand them the two numbers side by side, the release diff line, and the exact window in UTC.",
        "If the database count matches the drop, this stops being a data question and becomes a live incident.",
      ],
      flip: [
        "Backend signups fall by roughly the same 18%.",
        "Support tickets about signup errors rise in the same window.",
        "The rate stays down after the tracking is confirmed correct.",
      ],
    },
  },
  {
    id: "retention",
    name: "Day 7 retention has flattened",
    blurb: "Gradual, every platform, no releases in the window.",
    form: {
      metric: "Day 7 retention",
      movement: "Down from 31% to 26% over about five weeks, no single step",
      shape: ["Slid gradually over days or weeks"],
      scope: ["Every platform", "New users only"],
      changed: ["Marketing campaign started or ended", "Nothing we know of"],
      source: ["BI dashboard"],
      checked: [
        "Compared to the same weekday last week",
        "Checked whether the report definition changed",
      ],
      notes:
        "We scaled a paid acquisition campaign about six weeks ago. Retention for users who joined before that is unchanged.",
    },
    result: {
      verdict: "Most likely a real behaviour change",
      confidence: "High",
      why: [
        "A slow slide across every platform is the wrong shape for a tracking break. Broken measurement arrives when code ships, so it steps rather than drifts.",
        "Retention for the older cohort is flat while the new cohort falls. Instrumentation does not know how old an account is, so it cannot break for one group and not the other.",
        "The timing lines up with scaled paid acquisition, which is the most common cause of this exact chart. You are buying users who look the same at signup and behave differently by day seven.",
        "The report definition has already been checked, which removes the other usual explanation.",
      ],
      checks: [
        {
          title: "Split retention by acquisition channel",
          how: "Same chart, one line per channel, cohorted by signup week.",
          rules: "Confirms whether the decline sits entirely in paid, or runs across organic too.",
          time: "30 minutes in the BI tool",
        },
        {
          title: "Hold the mix constant",
          how: "Recalculate the blended number using the channel mix from before the campaign scaled.",
          rules: "Tells you how much of the decline is mix and how much is a genuine drop within channels.",
          time: "45 minutes",
        },
        {
          title: "Compare first-week behaviour between cohorts",
          how: "Look at activation steps completed in the first 48 hours, old cohort against new.",
          rules: "Shows whether the new users are failing to activate or activating and then leaving.",
          time: "1 hour",
        },
        {
          title: "Read the campaign creative and landing page",
          how: "Look at what the ads promise against what the product delivers on day one.",
          rules: "A promise mismatch, which is fixable in marketing rather than product.",
          time: "20 minutes",
        },
      ],
      ifArtefact: [
        "Unlikely here, but if the channel split shows the decline evenly across every channel including direct, go back and check how the dashboard joins signup date to activity date.",
      ],
      ifReal: [
        "Report the blended number and the mix-adjusted number together from now on, or every future conversation restarts this argument.",
        "Decide with marketing whether the campaign is worth its retention cost before you change anything in the product. This may be a channel decision, not a roadmap item.",
      ],
      escalate: [
        "No engineering time needed yet. This is an analytics and marketing conversation.",
        "If the channel split cannot be produced because acquisition source is not stored on the user record, that is the one engineering ask worth making.",
      ],
      flip: [
        "The decline appears in organic and direct at the same rate as paid.",
        "The older cohort starts declining too.",
        "Mix-adjusting removes the entire gap, which would make this an accounting artefact rather than a behaviour change.",
      ],
    },
  },
  {
    id: "checkout",
    name: "Checkout completion is spiky on Safari",
    blurb: "Intermittent, one browser, after a payments SDK update.",
    form: {
      metric: "Checkout completion rate",
      movement: "Swings between normal and roughly half, several times a day",
      shape: ["Spiky, comes and goes"],
      scope: ["Web only", "One browser"],
      changed: ["Third-party SDK update"],
      source: ["Product analytics tool"],
      checked: ["Asked support whether tickets went up"],
      notes:
        "Support has had a handful of reports about the payment window closing itself. Our payments provider pushed a client library update eleven days ago.",
    },
    result: {
      verdict: "Most likely a real behaviour change",
      confidence: "Medium",
      why: [
        "Support tickets describing the same failure are the strongest signal available. Instrumentation faults do not generate complaints, because nothing looks wrong to the user.",
        "One browser plus intermittent timing is the classic shape of a third-party script fighting with browser privacy rules, which apply differently depending on cookie state and session age.",
        "The SDK update gives a specific and testable cause with a date attached.",
        "Confidence is held at medium because the analytics tool is also a third-party script on the same page, so some of the missing conversions may be uncounted rather than failed.",
      ],
      checks: [
        {
          title: "Reproduce it yourself",
          how: "Run the checkout in Safari with cross-site tracking prevention on, in a fresh private window, three or four times.",
          rules: "Turns an intermittent report into something you can show. If it fails once, you have your evidence.",
          time: "20 minutes",
        },
        {
          title: "Compare orders against the analytics number",
          how: "Count completed orders in the payment provider dashboard for the same days.",
          rules: "Separates lost revenue from lost tracking. This is the number that decides how urgent it is.",
          time: "15 minutes",
        },
        {
          title: "Read the SDK release notes",
          how: "Look at what shipped eleven days ago, specifically anything about iframes, redirects or storage.",
          rules: "Often names the problem outright and gives you the migration step.",
          time: "20 minutes",
        },
        {
          title: "Collect the failing sessions",
          how: "Ask support for the browser version and timestamp on every ticket so far.",
          rules: "Narrows it to a version range, which is what the provider will ask for first.",
          time: "30 minutes",
        },
      ],
      ifArtefact: [
        "If the payment dashboard shows normal order volume, you are looking at blocked analytics rather than blocked payments. That is much less urgent, but the funnel needs a server-side count before anyone trusts it again.",
      ],
      ifReal: [
        "This is lost revenue, so it goes to engineering today with the reproduction steps rather than waiting for more analysis.",
        "Open a ticket with the payments provider in parallel. If it is their regression, they will have seen it from other customers.",
      ],
      escalate: [
        "Escalate as soon as you can reproduce it once. Hand over the browser version, the private window steps, the SDK version numbers before and after, and the order count gap.",
        "Do not hand over the analytics chart on its own. It is the weakest evidence you hold here.",
      ],
      flip: [
        "The payment provider dashboard shows no shortfall in orders.",
        "You cannot reproduce it in Safari across several attempts with tracking prevention on.",
        "The spikes line up with your analytics tool's own outage log rather than with checkout traffic.",
      ],
    },
  },
];

/* ---------------------------- model plumbing ---------------------------- */

function parseTagged(text) {
  const out = {
    verdict: "",
    confidence: "",
    why: [],
    checks: [],
    ifArtefact: [],
    ifReal: [],
    escalate: [],
    flip: [],
  };
  text.split("\n").forEach((raw) => {
    const line = raw.trim();
    const m = line.match(/^([A-Z]+):\s*(.*)$/);
    if (!m) return;
    const [, tag, value] = m;
    if (!value) return;
    if (tag === "VERDICT") out.verdict = value;
    else if (tag === "CONFIDENCE") out.confidence = value;
    else if (tag === "WHY") out.why.push(value);
    else if (tag === "CHECK") {
      const parts = value.split("||").map((p) => p.trim());
      out.checks.push({
        title: parts[0] || "",
        how: parts[1] || "",
        // models often echo the field name back; the interface adds its own label
        rules: (parts[2] || "").replace(/^rules?\s*out:?\s*/i, ""),
        time: (parts[3] || "").replace(/^~\s*/, ""),
      });
    } else if (tag === "IFARTEFACT") out.ifArtefact.push(value);
    else if (tag === "IFREAL") out.ifReal.push(value);
    else if (tag === "ESCALATE") out.escalate.push(value);
    else if (tag === "FLIP") out.flip.push(value);
  });
  return out;
}

/* ---------------------------- small pieces ---------------------------- */

const ICONS = {
  lightbulb: (
    <>
      <path d="M9.5 18h5" />
      <path d="M10.5 21h3" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z" />
    </>
  ),
  chartBroken: (
    <>
      <path d="M4 4v16h16" />
      <path d="M7 15l3-4 2.5 2.5" />
      <path d="M15 12l3-4" />
      <path d="M16.5 3.5l3 3M19.5 3.5l-3 3" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 5.5a3 3 0 0 1 0 5.5" />
      <path d="M17.5 20a6 6 0 0 0-2.5-4.6" />
    </>
  ),
  pencil: (
    <>
      <path d="M4 20h4L18.5 9.5a2.8 2.8 0 0 0-4-4L4 16v4z" />
      <path d="M13.5 6.5l4 4" />
    </>
  ),
  gauge: (
    <>
      <path d="M4 18a8 8 0 1 1 16 0" />
      <path d="M12 18l4.2-4.8" />
      <circle cx="12" cy="18" r="1.3" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 13l9 5 9-5" />
    </>
  ),
  book: (
    <>
      <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4z" />
      <path d="M9 8.5h6M9 12.5h6" />
    </>
  ),
  check: <path d="M20 6.5L9.5 17 4.5 12" />,
  point: <path d="M9 5.5l6.5 6.5L9 18.5" />,
  alert: (
    <>
      <path d="M12 3.5l8.5 15.5h-17z" />
      <path d="M12 9.5v4.2" />
      <path d="M12 16.6h.01" />
    </>
  ),
  escalate: (
    <>
      <path d="M12 20V6" />
      <path d="M6 12l6-6 6 6" />
    </>
  ),
  flip: (
    <>
      <path d="M19.5 13a7.5 7.5 0 0 1-13 4.2" />
      <path d="M4.5 11a7.5 7.5 0 0 1 13-4.2" />
      <path d="M17.5 3.5v3.5h-3.5" />
      <path d="M6.5 20.5V17h3.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5v5l3 1.8" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.2" />
      <path d="M20 20l-4.6-4.6" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 3v5.5c0 4-3 7.4-7 9-4-1.6-7-5-7-9V6l7-3z" />
      <path d="M9.2 12l2 2 3.6-3.8" />
    </>
  ),
};

function Icon({ name, size = 20, color, strokeWidth = 1.7 }) {
  const glyph = ICONS[name];
  if (!glyph) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || "currentColor"}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {glyph}
    </svg>
  );
}

function CardHead({ icon, title, tone, tint }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 12 }}>
      <span className="dop-tile" style={{ background: tint || C.plumSoft }}>
        <Icon name={icon} size={18} color={tone || C.plum} />
      </span>
      <h2 style={{ fontSize: 19, fontWeight: 650 }}>{title}</h2>
    </div>
  );
}

function SectionHead({ title, sub }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <h1 style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.15 }}>{title}</h1>
      {sub ? (
        <p style={{ marginTop: 10, fontSize: 16.5, color: C.muted, maxWidth: "62ch" }}>{sub}</p>
      ) : null}
    </div>
  );
}

function ChipRow({ field, selected, custom, onToggle, onAddCustom }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (adding && inputRef.current) inputRef.current.focus();
  }, [adding]);

  const commit = () => {
    const v = draft.trim();
    if (v) onAddCustom(v);
    setDraft("");
    setAdding(false);
  };

  const all = [...field.options, ...custom];

  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ fontSize: 15.5, fontWeight: 600, color: C.ink }}>{field.label}</div>
      <p style={{ fontSize: 14, color: C.muted, marginTop: 3, marginBottom: 12 }}>{field.help}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {all.map((opt) => (
          <button
            key={opt}
            type="button"
            className="dop-chip"
            data-on={selected.includes(opt)}
            onClick={() => onToggle(opt)}
          >
            {opt}
          </button>
        ))}
        {adding ? (
          <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
            <input
              ref={inputRef}
              className="dop-input"
              style={{ width: 200, padding: "7px 13px", borderRadius: 999, fontSize: 14 }}
              value={draft}
              placeholder="Type your own"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") {
                  setDraft("");
                  setAdding(false);
                }
              }}
            />
            <button type="button" className="dop-chip" onClick={commit}>
              Add
            </button>
          </span>
        ) : (
          <button type="button" className="dop-addchip" onClick={() => setAdding(true)}>
            + Add your own
          </button>
        )}
      </div>
    </div>
  );
}

function Bullets({ items, tone, tint, icon }) {
  return (
    <div>
      {(items || []).map((t, i) => (
        <div key={i} className="dop-row">
          <span className="dop-tile" style={{ background: tint || C.plumSoft }}>
            <Icon name={icon || "check"} size={17} color={tone || C.plum} />
          </span>
          <p style={{ fontSize: 15.5, color: C.body, paddingTop: 4 }}>{t}</p>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------- app ---------------------------- */

const BLANK = {
  metric: "",
  movement: "",
  shape: [],
  scope: [],
  changed: [],
  source: [],
  checked: [],
  notes: "",
};

export default function DataOrProduct() {
  const [section, setSection] = useState("start");
  const [form, setForm] = useState(BLANK);
  const [custom, setCustom] = useState({});
  const [result, setResult] = useState(null);
  const [resultSource, setResultSource] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mainRef = useRef(null);

  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [section]);

  const toggle = (field, opt) => {
    setForm((f) => {
      const cur = f[field.key];
      if (field.mode === "single") {
        return { ...f, [field.key]: cur.includes(opt) ? [] : [opt] };
      }
      return {
        ...f,
        [field.key]: cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt],
      };
    });
  };

  const addCustom = (field, value) => {
    setCustom((c) => ({ ...c, [field.key]: [...(c[field.key] || []), value] }));
    setForm((f) => {
      const cur = f[field.key];
      if (field.mode === "single") return { ...f, [field.key]: [value] };
      return { ...f, [field.key]: [...cur, value] };
    });
  };

  const ready = form.metric.trim().length > 1 && form.movement.trim().length > 1;

  const run = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form }),
      });
      if (!res.ok) {
        let detail = "";
        try {
          const body = await res.json();
          detail = body && body.error ? body.error : "";
        } catch (_) {
          detail = "";
        }
        throw new Error(detail || `Request failed with status ${res.status}.`);
      }
      const data = await res.json();
      const parsed = parseTagged(data.text || "");
      if (!parsed.verdict) throw new Error("The reply came back in a shape this app could not read.");
      setResult(parsed);
      setResultSource("live");
      setSection("verdict");
    } catch (e) {
      setError(
        `${e.message} Try running it again. If it keeps failing, open one of the worked examples, which need no connection.`
      );
    } finally {
      setBusy(false);
    }
  };

  const loadExample = (ex) => {
    setForm(ex.form);
    setCustom({});
    setResult(ex.result);
    setResultSource(ex.name);
    setError("");
    setSection("verdict");
  };

  const reset = () => {
    setForm(BLANK);
    setCustom({});
    setResult(null);
    setResultSource("");
    setError("");
    setSection("diagnose");
  };

  const NAV = [
    { id: "start", icon: "lightbulb", title: "Start here", sub: "What this does, in plain words" },
    { id: "diagnose", icon: "pencil", title: "Describe what moved", sub: "Six questions about the change" },
    { id: "verdict", icon: "gauge", title: "Verdict and checks", sub: "The read, and what to check first", locked: !result },
    { id: "examples", icon: "layers", title: "Worked examples", sub: "Three real shapes, already answered" },
    { id: "method", icon: "book", title: "How it decides", sub: "Where the reasoning comes from" },
  ];

  const verdictIcon = !result
    ? "search"
    : /measurement/i.test(result.verdict)
    ? "chartBroken"
    : /behaviour/i.test(result.verdict)
    ? "users"
    : "search";

  const confTone =
    result?.confidence === "High" ? C.green : result?.confidence === "Low" ? C.red : C.amber;

  return (
    <>
      <style>{CSS}</style>
      <div className="dop">
        <nav className="dop-rail">
          <div className="dop-railhead">
            <div style={{ color: "#fff", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>
              Data or product?
            </div>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, marginTop: 6, lineHeight: 1.45 }}>
              Work out whether the number moved or the counting broke.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
            {NAV.map((n) => (
              <button
                key={n.id}
                className="dop-navbtn"
                data-on={section === n.id}
                disabled={n.locked}
                onClick={() => setSection(n.id)}
              >
                <span style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                  <span style={{ flex: "0 0 auto", paddingTop: 1, opacity: section === n.id ? 1 : 0.75 }}>
                    <Icon name={n.icon} size={19} />
                  </span>
                  <span style={{ display: "block" }}>
                    <span className="dop-navttl" style={{ display: "block" }}>
                      {n.title}
                    </span>
                    <span className="dop-navsub" style={{ display: "block" }}>
                      {n.locked ? "Answer the questions first" : n.sub}
                    </span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        </nav>

        <main className="dop-main" ref={mainRef}>
          <div className="dop-inner">
            {section === "start" && (
              <>
                <SectionHead
                  title="Did the number move, or did the counting break?"
                  sub="Two very different problems that look identical on a chart."
                />
                <div className="dop-duo" style={{ marginBottom: 18 }}>
                  <div className="dop-card">
                    <CardHead icon="chartBroken" title="The counting broke" />
                    <p style={{ fontSize: 15.5 }}>
                      An event got renamed, a consent banner blocked a script, a nightly job
                      failed. Users never changed. Rolling back the release would make it worse.
                    </p>
                  </div>
                  <div className="dop-card">
                    <CardHead icon="users" title="People changed" />
                    <p style={{ fontSize: 15.5 }}>
                      The product, the price or the traffic mix moved and users responded. The
                      number is telling the truth, and now speed matters.
                    </p>
                  </div>
                </div>

                <div className="dop-card" style={{ marginBottom: 22 }}>
                  <Bullets
                    items={[
                      "A verdict on which of the two you are looking at, with a confidence level.",
                      "The cheap checks that would settle it, ordered so the most decisive comes first.",
                      "The point where it stops being your problem and becomes engineering's.",
                    ]}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 9,
                    alignItems: "center",
                    marginBottom: 24,
                    color: C.muted,
                    fontSize: 15,
                  }}
                >
                  <Icon name="shield" size={18} color={C.plumMid} />
                  <span>Nothing to connect. You describe what you see, in your own words.</span>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button className="dop-run" onClick={() => setSection("diagnose")}>
                    Describe what moved
                  </button>
                  <button className="dop-ghost" onClick={() => setSection("examples")}>
                    See a worked example instead
                  </button>
                </div>
              </>
            )}

            {section === "diagnose" && (
              <>
                <SectionHead
                  title="Describe what moved"
                  sub="Two sentences and six questions. Rough answers are fine, the shape matters more than the precision."
                />
                <div className="dop-card" style={{ marginBottom: 22 }}>
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 15.5, fontWeight: 600, color: C.ink, marginBottom: 8 }}>
                      Which metric
                    </div>
                    <input
                      className="dop-input"
                      value={form.metric}
                      placeholder="Signup completion rate"
                      onChange={(e) => setForm((f) => ({ ...f, metric: e.target.value }))}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 15.5, fontWeight: 600, color: C.ink, marginBottom: 8 }}>
                      What it did, and when
                    </div>
                    <input
                      className="dop-input"
                      value={form.movement}
                      placeholder="Down 18%, from 22% to 18%, started Tuesday morning"
                      onChange={(e) => setForm((f) => ({ ...f, movement: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="dop-card" style={{ marginBottom: 22 }}>
                  {FIELDS.map((field) => (
                    <ChipRow
                      key={field.key}
                      field={field}
                      selected={form[field.key]}
                      custom={custom[field.key] || []}
                      onToggle={(opt) => toggle(field, opt)}
                      onAddCustom={(v) => addCustom(field, v)}
                    />
                  ))}
                  <div style={{ marginBottom: 4 }}>
                    <div style={{ fontSize: 15.5, fontWeight: 600, color: C.ink }}>
                      Anything else worth knowing
                    </div>
                    <p style={{ fontSize: 14, color: C.muted, marginTop: 3, marginBottom: 12 }}>
                      Who is asking, what people already think happened, what is at stake.
                    </p>
                    <textarea
                      className="dop-textarea"
                      value={form.notes}
                      placeholder="Growth wants to roll the release back today. Nobody has looked at the database yet."
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    />
                  </div>
                </div>

                {error ? (
                  <div
                    className="dop-card"
                    style={{
                      marginBottom: 18,
                      borderColor: C.red,
                      background: "#FDF4F4",
                      padding: "18px 22px",
                    }}
                  >
                    <p style={{ fontSize: 15, color: C.red }}>{error}</p>
                  </div>
                ) : null}

                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <button className="dop-run" disabled={!ready || busy} onClick={run}>
                    {busy ? "Reading the shape…" : "Get the verdict"}
                  </button>
                  {!ready ? (
                    <span style={{ fontSize: 14.5, color: C.muted }}>
                      Fill in the metric and what it did to continue.
                    </span>
                  ) : null}
                  {busy ? <span className="dop-pulse" style={{ fontSize: 14.5, color: C.plum }}>This takes a few seconds</span> : null}
                </div>
              </>
            )}

            {section === "verdict" && result && (
              <>
                <div
                  style={{
                    background: C.plum,
                    borderRadius: 24,
                    padding: "28px 30px",
                    marginBottom: 22,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span
                      className="dop-tile"
                      style={{ background: "rgba(255,255,255,0.16)", width: 34, height: 34 }}
                    >
                      <Icon name={verdictIcon} size={19} color="#fff" />
                    </span>
                    <p style={{ color: "rgba(255,255,255,0.78)", fontSize: 14.5 }}>
                      {form.metric || "Your metric"}
                    </p>
                  </div>
                  <h1 style={{ color: "#fff", fontSize: 30, fontWeight: 700, lineHeight: 1.2 }}>
                    {result.verdict}
                  </h1>
                  <div
                    style={{
                      marginTop: 16,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      background: "rgba(255,255,255,0.15)",
                      borderRadius: 999,
                      padding: "7px 15px",
                    }}
                  >
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: 999,
                        background: confTone,
                        display: "inline-block",
                      }}
                    />
                    <span style={{ color: "#fff", fontSize: 14.5, fontWeight: 500 }}>
                      {result.confidence} confidence
                    </span>
                  </div>
                </div>

                {resultSource && resultSource !== "live" ? (
                  <p style={{ fontSize: 14.5, color: C.muted, marginBottom: 22 }}>
                    Saved result for the worked example: {resultSource}. Nothing was sent anywhere to
                    produce this.
                  </p>
                ) : null}

                <div className="dop-card" style={{ marginBottom: 18 }}>
                  <CardHead icon="lightbulb" title="Why" />
                  <Bullets items={result.why} icon="point" />
                </div>

                <div className="dop-card" style={{ marginBottom: 18 }}>
                  <CardHead icon="check" title="Check these, in this order" />
                  <p style={{ fontSize: 14.5, color: C.muted, marginBottom: 18 }}>
                    Cheapest and most decisive first. You can do all of these without asking anyone
                    to stop what they are doing.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {result.checks.map((c, i) => (
                      <div
                        key={i}
                        style={{
                          border: `1px solid ${C.hairline}`,
                          borderRadius: 16,
                          padding: "16px 18px",
                          background: C.plumSofter,
                        }}
                      >
                        <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                          <span
                            style={{
                              flex: "0 0 auto",
                              width: 24,
                              height: 24,
                              borderRadius: 999,
                              background: C.plum,
                              color: "#fff",
                              fontSize: 13,
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {i + 1}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 16.5, fontWeight: 600, color: C.ink }}>
                              {c.title}
                            </div>
                            {c.how ? (
                              <p style={{ fontSize: 15.5, marginTop: 6 }}>{c.how}</p>
                            ) : null}
                            {c.rules ? (
                              <div
                                style={{
                                  display: "flex",
                                  gap: 8,
                                  marginTop: 10,
                                  alignItems: "flex-start",
                                }}
                              >
                                <span style={{ flex: "0 0 auto", paddingTop: 2 }}>
                                  <Icon name="check" size={16} color={C.plum} />
                                </span>
                                <p style={{ fontSize: 15, color: C.plumDeep }}>
                                  Rules out: {c.rules}
                                </p>
                              </div>
                            ) : null}
                            {c.time ? (
                              <div
                                style={{
                                  display: "flex",
                                  gap: 8,
                                  marginTop: 8,
                                  alignItems: "center",
                                  color: C.muted,
                                }}
                              >
                                <Icon name="clock" size={15} />
                                <p style={{ fontSize: 14 }}>{c.time}</p>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 18, marginBottom: 18 }}>
                  <div className="dop-card">
                    <CardHead icon="chartBroken" title="If the counting broke" />
                    <Bullets items={result.ifArtefact} icon="point" />
                  </div>
                  <div className="dop-card">
                    <CardHead icon="users" title="If people genuinely changed" />
                    <Bullets items={result.ifReal} icon="point" />
                  </div>
                </div>

                <div className="dop-card" style={{ marginBottom: 18 }}>
                  <CardHead icon="escalate" title="When to bring engineering in" />
                  <Bullets items={result.escalate} icon="point" />
                </div>

                <div
                  className="dop-card"
                  style={{ marginBottom: 26, background: C.plumSoft, borderColor: C.plumSoft }}
                >
                  <CardHead icon="flip" title="What would change this verdict" tint="#FFFFFF" />
                  <p style={{ fontSize: 14.5, color: C.plumDeep, marginBottom: 16 }}>
                    If you see any of these, stop and read the situation again.
                  </p>
                  <Bullets items={result.flip} tone={C.plum} tint="#FFFFFF" icon="flip" />
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button className="dop-ghost" onClick={() => setSection("diagnose")}>
                    Edit the description
                  </button>
                  <button className="dop-ghost" onClick={reset}>
                    Start a new one
                  </button>
                </div>
              </>
            )}

            {section === "examples" && (
              <>
                <SectionHead
                  title="Worked examples"
                  sub="Three shapes that come up constantly. Each one loads a filled-in description and a saved verdict, so you can read a full result without a connection."
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {EXAMPLES.map((ex) => (
                    <div key={ex.id} className="dop-card">
                      <CardHead icon="layers" title={ex.name} />
                      <p style={{ fontSize: 15.5, marginBottom: 16 }}>{ex.blurb}</p>
                      <button className="dop-ghost" onClick={() => loadExample(ex)}>
                        Open this one
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {section === "method" && (
              <>
                <SectionHead
                  title="How it decides"
                  sub="Worth reading before you take a verdict into a meeting."
                />
                <div className="dop-card" style={{ marginBottom: 16 }}>
                  <CardHead icon="search" title="Where the answer comes from" />
                  <p style={{ fontSize: 16, marginBottom: 12 }}>
                    A language model reads what you typed and reasons over it. That is the whole
                    mechanism. It has no connection to your analytics tool, your database or your
                    release history, and it cannot see a single one of your numbers.
                  </p>
                  <p style={{ fontSize: 16 }}>
                    So the verdict is a well-informed guess from a description, in the same way a
                    colleague who has debugged a hundred of these would guess before opening
                    anything. The checks are the part that settles it.
                  </p>
                </div>

                <div className="dop-card" style={{ marginBottom: 16 }}>
                  <CardHead icon="lightbulb" title="The patterns it leans on" />
                  <Bullets
                    items={[
                      "A sharp overnight step that then holds flat is the signature of a counting change. Human behaviour rarely moves by a fixed amount at a fixed hour and then stops moving.",
                      "A gradual slide points at behaviour, traffic mix or seasonality, because instrumentation breaks when code ships rather than drifting week by week.",
                      "A drop confined to one platform or browser that matches a release window is suspicious, since tags ship inside releases.",
                      "Matching support tickets are strong evidence the change is real. Broken tracking never generates complaints, because nothing looks wrong to the user.",
                      "A number with one unconfirmed source is weaker than the same number confirmed against the backend, so confidence drops when nothing has been cross-checked.",
                    ]}
                    icon="point"
                  />
                </div>

                <div className="dop-card" style={{ marginBottom: 16 }}>
                  <CardHead icon="alert" title="Where it will be wrong" tone={C.amber} tint="#FBF1DF" />
                  <Bullets
                    items={[
                      "Two things at once. A tracking change and a real drop in the same week will read as whichever one you described more vividly.",
                      "Anything seasonal or specific to your market that you did not mention. It knows nothing about your business calendar.",
                      "Time estimates on the checks assume you can get an answer from the people who own the data. In some organisations the fifteen minute check takes a week.",
                    ]}
                    tone={C.amber}
                    tint="#FBF1DF"
                    icon="alert"
                  />
                </div>

                <div className="dop-card">
                  <CardHead icon="check" title="What to do with the output" />
                  <p style={{ fontSize: 16 }}>
                    Treat the verdict as the hypothesis and the check list as the work. If you take
                    anything into a meeting, take the check you ran and the answer it gave, not the
                    verdict on its own.
                  </p>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
