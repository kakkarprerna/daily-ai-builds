import React, { useState } from "react";

/* ------------------------------------------------------------------ */
/*  Signal Translator                                                  */
/*  Turns a raw technical artefact (stack trace, failed API response,  */
/*  console output, webhook payload) into a PM-readable triage:        */
/*  what broke, who it affects, whether you can fix it yourself, and   */
/*  a drafted ticket if you cannot.                                    */
/* ------------------------------------------------------------------ */

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&display=swap');

.stx {
  --serif:'Source Serif 4',Georgia,'Times New Roman',serif;
  --sans:'Inter',system-ui,-apple-system,sans-serif;
  --mono:'IBM Plex Mono',ui-monospace,monospace;
  --canvas:#F1F4F8;
  --surface:#FFFFFF;
  --tint:#F7F9FC;
  --ink:#101A2C;
  --steel:#5C6679;
  --line:#DBE1EA;
  --indigo:#2E2A8F;
  --teal:#0E6F68;
  --amber:#A85A06;
  --red:#B81F1B;
  background:var(--canvas);
  color:var(--ink);
  font-family:var(--sans);
  font-size:15px;
  line-height:1.55;
  min-height:100%;
  -webkit-font-smoothing:antialiased;
}
.stx *{box-sizing:border-box;}
.stx h1,.stx h2,.stx h3,.stx h4{font-family:var(--serif);margin:0;}
.stx :focus-visible{outline:2px solid var(--indigo);outline-offset:2px;}

/* masthead */
.stx-mast{
  background:var(--surface);
  border-top:7px solid var(--indigo);
  border-bottom:1px solid var(--line);
  padding:30px 34px 26px;
  display:flex;justify-content:space-between;align-items:flex-end;gap:34px;flex-wrap:wrap;
}
.stx-mast h1{
  font-size:clamp(32px,4.4vw,46px);font-weight:700;
  letter-spacing:-0.024em;line-height:1.02;
}
.stx-mast p{
  margin:11px 0 0;color:var(--steel);max-width:60ch;
  font-size:15px;line-height:1.6;
}
.stx-badge{
  font-family:var(--mono);font-size:11.5px;color:var(--steel);
  border-left:3px solid var(--amber);padding:4px 0 4px 13px;line-height:1.8;
}

/* workspace */
.stx-grid{
  display:grid;grid-template-columns:minmax(0,410px) minmax(0,1fr);
  gap:24px;padding:24px 34px 72px;align-items:start;
}
@media (max-width:960px){.stx-grid{grid-template-columns:1fr;padding:18px 16px 52px;}}

.stx-panel{background:var(--surface);border:1px solid var(--line);}
.stx-panel-head{
  display:flex;justify-content:space-between;align-items:baseline;gap:12px;
  padding:14px 18px;border-bottom:1px solid var(--line);
}
.stx-panel-head h2{font-size:21px;font-weight:600;letter-spacing:-0.016em;}
.stx-meta{font-family:var(--mono);font-size:11.5px;color:var(--steel);font-variant-numeric:tabular-nums;}
.stx-clear{
  font-family:var(--mono);font-size:11.5px;color:var(--steel);
  background:none;border:0;padding:0;margin-left:12px;cursor:pointer;text-decoration:underline;
}
.stx-clear:hover{color:var(--ink);}
.stx-panel-body{padding:18px;}

.stx-console{position:sticky;top:18px;}
@media (max-width:960px){.stx-console{position:static;}}

.stx-art{
  width:100%;display:block;
  background:var(--tint);color:#18233A;border:1px solid var(--line);
  font-family:var(--mono);font-size:12.5px;line-height:1.7;
  padding:14px;resize:vertical;
  white-space:pre-wrap;word-break:break-word;
}
.stx-art::placeholder{color:#98A2B5;}
.stx-art:focus{outline:none;border-color:var(--indigo);box-shadow:0 0 0 1px var(--indigo);}

.stx-chips{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:12px;}
@media (max-width:420px){.stx-chips{grid-template-columns:1fr;}}
.stx-chip{
  font-family:var(--mono);font-size:11px;text-align:center;
  background:#fff;color:var(--steel);border:1px solid var(--line);
  padding:9px 6px;cursor:pointer;line-height:1.3;
}
.stx-chip:hover{border-color:var(--indigo);color:var(--indigo);}
.stx-chip[data-on="1"]{background:var(--indigo);color:#fff;border-color:var(--indigo);}

.stx-lab{display:block;font-weight:600;font-size:14px;margin:22px 0 7px;}
.stx-lab em{font-style:normal;font-weight:400;color:var(--steel);display:block;font-size:13px;margin-top:2px;}
.stx-ctx{
  width:100%;display:block;border:1px solid var(--line);background:#fff;color:var(--ink);
  font-family:var(--sans);font-size:14.5px;line-height:1.6;padding:12px 13px;resize:vertical;
}
.stx-in{
  width:100%;border:1px solid var(--line);background:#fff;color:var(--ink);
  font-family:var(--sans);font-size:14.5px;padding:11px 13px;
}
.stx-ctx:focus,.stx-in:focus{outline:none;border-color:var(--indigo);box-shadow:0 0 0 1px var(--indigo);}

.stx-run{
  width:100%;margin-top:20px;
  font-family:var(--sans);font-weight:600;font-size:15px;
  background:var(--indigo);color:#fff;border:0;padding:14px 18px;cursor:pointer;
}
.stx-run:hover:not(:disabled){background:#221E73;}
.stx-run:disabled{background:#BAC0CC;cursor:not-allowed;}

.stx-fine{
  font-size:13px;line-height:1.65;color:var(--steel);
  margin:18px 0 0;padding-top:16px;border-top:1px solid var(--line);
}
.stx-fine strong{color:var(--ink);font-weight:600;}
.stx-err{border-left:3px solid var(--red);background:#FDF2F1;padding:12px 14px;margin-top:14px;font-size:14px;}

/* verdict block */
.stx-verdict{padding:30px 30px 28px;color:#fff;}
.stx-verdict .k{font-family:var(--mono);font-size:11.5px;letter-spacing:0.09em;opacity:.85;}
.stx-verdict h2{
  font-size:clamp(36px,5vw,52px);font-weight:700;
  letter-spacing:-0.03em;line-height:1.02;margin:8px 0 16px;
}
.stx-verdict p{margin:0;max-width:58ch;font-family:var(--serif);font-size:19px;line-height:1.5;}
.stx-meter{display:flex;gap:5px;align-items:center;margin-top:22px;}
.stx-meter i{width:30px;height:5px;background:rgba(255,255,255,.34);display:block;}
.stx-meter i[data-fill="1"]{background:#fff;}
.stx-meter span{font-family:var(--mono);font-size:11.5px;letter-spacing:0.04em;margin-left:10px;opacity:.92;}

/* report */
.stx-flag{
  padding:11px 30px;border-top:1px solid var(--line);
  font-family:var(--mono);font-size:11.5px;color:var(--steel);background:var(--tint);
}
.stx-sec{border-top:1px solid var(--line);padding:26px 30px;}
.stx-sec h3{font-size:24px;font-weight:600;letter-spacing:-0.018em;margin-bottom:16px;}
.stx-sec h3 .stx-meta{margin-left:10px;}

.stx-kv{display:grid;grid-template-columns:170px minmax(0,1fr);gap:14px 20px;}
@media (max-width:600px){.stx-kv{grid-template-columns:1fr;gap:2px 0;}.stx-kv dt{margin-top:14px;}}
.stx-kv dt{font-family:var(--mono);font-size:12px;color:var(--steel);padding-top:3px;}
.stx-kv dd{margin:0;max-width:66ch;font-size:15px;line-height:1.6;}

.stx-check{display:flex;gap:14px;align-items:flex-start;padding:15px 0;border-top:1px dashed var(--line);}
.stx-check:first-of-type{border-top:0;padding-top:0;}
.stx-check input{margin-top:4px;width:17px;height:17px;flex:0 0 auto;accent-color:var(--indigo);cursor:pointer;}
.stx-check .t{max-width:64ch;}
.stx-check .t b{font-weight:500;font-size:15px;}
.stx-check .t span{display:block;color:var(--steel);font-size:14px;line-height:1.55;margin-top:5px;}
.stx-check[data-done="1"] .t b{color:var(--steel);text-decoration:line-through;}

.stx-ticket{border:1px solid var(--line);border-left:5px solid var(--indigo);padding:20px 22px;background:var(--tint);}
.stx-ticket h4{font-size:21px;font-weight:600;margin:0 0 12px;letter-spacing:-0.016em;line-height:1.3;}
.stx-sev{font-family:var(--mono);font-size:11.5px;font-weight:600;letter-spacing:0.04em;color:#fff;padding:4px 9px;margin-right:11px;}
.stx-ticket ol,.stx-ticket ul{margin:8px 0 0;padding-left:20px;}
.stx-ticket li{margin-bottom:7px;font-size:15px;max-width:64ch;line-height:1.55;}
.stx-fieldhead{font-family:var(--mono);font-size:12px;color:var(--steel);margin:18px 0 5px;}
.stx-body{font-size:15px;line-height:1.6;max-width:64ch;}
.stx-copy{
  font-family:var(--sans);font-size:13.5px;font-weight:600;
  background:#fff;border:1px solid var(--ink);color:var(--ink);padding:10px 15px;cursor:pointer;margin-top:18px;
}
.stx-copy:hover{background:var(--ink);color:#fff;}

.stx-gloss{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:18px;}
.stx-gloss>div{border-top:2px solid var(--ink);padding-top:11px;}
.stx-gloss code{font-family:var(--mono);font-size:13px;font-weight:500;}
.stx-gloss p{margin:6px 0 0;font-size:14.5px;line-height:1.55;color:var(--steel);}

.stx-unknown{margin:0;padding-left:20px;}
.stx-unknown li{font-size:15px;margin-bottom:8px;max-width:66ch;line-height:1.55;}

/* empty state */
.stx-empty{padding:34px 30px;}
.stx-empty h2{font-size:30px;font-weight:600;letter-spacing:-0.022em;}
.stx-empty>p{margin:12px 0 28px;max-width:60ch;color:var(--steel);font-size:15.5px;line-height:1.6;}
.stx-legend{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px;}
.stx-legend-row{border-top:5px solid var(--line);padding-top:13px;}
.stx-legend-row b{font-family:var(--serif);font-size:21px;font-weight:600;display:block;letter-spacing:-0.016em;line-height:1.2;margin-bottom:7px;}
.stx-legend-row p{margin:0;font-size:14.5px;line-height:1.55;color:var(--steel);}
`;

const VERDICTS = {
  Configuration: {
    colour: "#0F766E",
    blurb:
      "Credentials, settings, permissions or account state. Fixable without anyone changing code.",
  },
  "Contract or data": {
    colour: "#B45309",
    blurb:
      "The system did what it was built to do, but the data or the agreed shape between two systems is wrong or stale.",
  },
  "Code defect": {
    colour: "#C2261F",
    blurb: "The code mishandled a case it should have handled. This one needs an engineer.",
  },
};
const SEV_COLOUR = { P0: "#C2261F", P1: "#C2261F", P2: "#B45309", P3: "#5A6478" };

const EXAMPLES = [
  {
    key: "webhook",
    label: "webhook 401",
    context:
      "Enterprise client says their CRM stopped receiving conversation transcripts from our voice agent at about 09:00 on Monday. Nothing changed in the product this week.",
    artefact: `POST https://client-crm.example.com/hooks/transcripts
HTTP/1.1 401 Unauthorized
x-request-id: 8f21c0d4-77aa-4e39-9c1e-1b0f5a2d33e1
retry-count: 6
{"error":{"code":"invalid_token","message":"Bearer token expired or revoked","token_prefix":"whk_live_9f2","expired_at":"2026-08-31T07:59:12Z"}}`,
    canned: {
      artefact_type: "Failed webhook delivery, HTTP 401",
      plain_summary:
        "Our system tried to send transcripts to the client's CRM and was turned away because the access token it used has expired. The messages were rejected, not lost in transit.",
      affected_journey: "Transcript delivery into the client's CRM after every completed call.",
      blast_radius:
        "One client integration. Every call since the token expired is undelivered, so their agents are working without transcripts.",
      verdict: "Configuration",
      confidence: "High",
      verdict_reason:
        "The response names an expired credential and gives an expiry timestamp. Nothing here points to broken code or a changed data shape.",
      self_checks: [
        {
          step: "Check when the webhook token for this client was last rotated.",
          if_true: "If it expired on 31 Aug, this is a credential renewal, not a bug.",
        },
        {
          step: "Confirm other clients' webhooks are still delivering.",
          if_true: "If they are, the fault is scoped to this one integration.",
        },
        {
          step: "Ask whether the client rotated or revoked keys on their side.",
          if_true: "If they did, they need to issue a new token before anything is fixed.",
        },
      ],
      ticket: {
        title: "Webhook deliveries to client CRM rejected with expired token",
        severity: "P2",
        severity_reason:
          "One client is affected and deliveries can be replayed once the token is renewed, so data is delayed rather than lost.",
        steps: [
          "Trigger a transcript delivery for the affected client account.",
          "Inspect the delivery log for the resulting webhook attempt.",
          "Observe the 401 response with code invalid_token.",
        ],
        expected: "Webhook accepted with a 2xx response and transcript visible in the CRM.",
        actual: "401 Unauthorized, retried six times, transcript never delivered.",
        attach: [
          "Full response body including token_prefix and expired_at",
          "Request ID 8f21c0d4",
          "Token rotation history for this account",
        ],
      },
      jargon: [
        {
          term: "401 Unauthorized",
          means:
            "The receiving system recognised the request but refused it because the credential was not valid.",
        },
        {
          term: "Bearer token",
          means: "A password-like string our system sends to prove it is allowed to post data.",
        },
      ],
      unknowns: [
        "Whether failed deliveries are queued for replay or dropped after six retries.",
        "Whether token expiry is on our schedule or the client's.",
      ],
    },
  },
  {
    key: "nulls",
    label: "empty fields in a 200",
    context:
      "Two analytics customers report that follower counts are blank for some creators in their dashboards. The dashboard itself loads fine and no errors are shown to the user.",
    artefact: `GET /v2/creators/batch?ids=41,42,43
HTTP/1.1 200 OK
{"data":[
 {"id":41,"handle":"@nx_studio","follower_count":184203,"source":"yt_api","fetched_at":"2026-09-01T04:10:00Z"},
 {"id":42,"handle":"@vela.cooks","follower_count":null,"source":"yt_api","fetched_at":"2026-08-14T04:10:00Z"},
 {"id":43,"handle":"@brdgclips","follower_count":null,"source":"scrape_fallback","fetched_at":"2026-08-14T04:10:00Z"}
]}`,
    canned: {
      artefact_type: "Successful API response carrying empty values",
      plain_summary:
        "The request worked and returned a normal success response, but two of the three creators came back with no follower number at all. The gap is in the data, not the request.",
      affected_journey: "Any dashboard view or export where a customer reads creator follower counts.",
      blast_radius:
        "Every customer tracking an affected creator. Silent, because the interface shows a blank rather than an error.",
      verdict: "Contract or data",
      confidence: "Medium",
      verdict_reason:
        "The response shape is valid and the status is 200, so the pipeline is behaving as built. The two empty records share an older fetch date and one used a fallback source.",
      self_checks: [
        {
          step: "Compare fetched_at across affected and healthy records.",
          if_true: "If failures cluster on 14 Aug, an upstream refresh stopped that day.",
        },
        {
          step: "Check how many records currently use scrape_fallback as source.",
          if_true: "A rising share suggests the primary source is rejecting our requests.",
        },
        {
          step: "Look at what the dashboard renders for a null value.",
          if_true: "If it renders blank rather than 'unavailable', that is a spec gap you own.",
        },
      ],
      ticket: {
        title: "Creator follower_count returning null for records last refreshed 14 Aug",
        severity: "P2",
        severity_reason:
          "Customers see incomplete data with no warning, which damages trust in the numbers even though nothing is down.",
        steps: [
          "Call the batch creators endpoint with ids 41, 42 and 43.",
          "Inspect follower_count, source and fetched_at on each record.",
          "Note that records with fetched_at of 14 Aug return null.",
        ],
        expected: "A follower count for every creator, or an explicit unavailable state.",
        actual: "Null follower_count returned inside a 200 response with no error signal.",
        attach: [
          "Full response body for the three ids",
          "Count of records by source over the last month",
          "Screenshot of how the dashboard displays the blank",
        ],
      },
      jargon: [
        {
          term: "null",
          means:
            "A field that exists but holds no value, which is different from the field being missing or zero.",
        },
        {
          term: "Fallback source",
          means: "A secondary method used to collect data when the primary one does not answer.",
        },
      ],
      unknowns: [
        "Whether the refresh job is failing or skipping these creators deliberately.",
        "Whether exports carry the same blanks as the dashboard.",
      ],
    },
  },
  {
    key: "console",
    label: "console TypeError",
    context:
      "A user reports the CSV export button does nothing on their reporting page. It works on my account. They sent a screenshot of their browser console.",
    artefact: `Uncaught (in promise) TypeError: Cannot read properties of undefined (reading 'map')
    at buildExportRows (report-export.js:118:24)
    at async handleExportClick (report-export.js:41:11)
report-export.js:118
GET /api/v2/reports/9182/rows?range=custom 200 OK (payload: {"rows":null,"total":0})`,
    canned: {
      artefact_type: "Uncaught JavaScript error with the failing request logged beneath",
      plain_summary:
        "The export code expected a list of rows and received nothing, so it stopped mid-way and the button appeared to do nothing. The user got no message explaining the failure.",
      affected_journey: "CSV export from the reporting page.",
      blast_radius:
        "Any user exporting a report that returns no rows, most likely on a custom date range. Failure is silent, so the true count is probably higher than the reports received.",
      verdict: "Code defect",
      confidence: "High",
      verdict_reason:
        "The request itself succeeded and returned an empty result honestly. The error is in code that assumed a list would always be present.",
      self_checks: [
        {
          step: "Run an export on a date range you know contains no data.",
          if_true: "If it reproduces on your own account, the trigger is empty results, not the user.",
        },
        {
          step: "Ask the user which date range they selected.",
          if_true: "A custom range with no activity confirms the empty-result path.",
        },
        {
          step: "Check whether any error message is shown to the user on failure.",
          if_true: "If not, there is a separate empty-state gap worth specifying.",
        },
      ],
      ticket: {
        title: "CSV export fails silently when the report returns no rows",
        severity: "P2",
        severity_reason:
          "The feature fails with no feedback, but only on empty results, and there is no data loss.",
        steps: [
          "Open a report and select a custom date range with no activity.",
          "Click export to CSV.",
          "Observe nothing happens and a TypeError appears at report-export.js line 118.",
        ],
        expected: "Either an empty file or a message explaining there is nothing to export.",
        actual: "Silent failure with an uncaught TypeError in the console.",
        attach: [
          "Console output including the stack trace",
          "The API response showing rows: null",
          "Report id and date range used",
        ],
      },
      jargon: [
        {
          term: "TypeError",
          means:
            "Code tried to use a value in a way that value does not support, such as listing through nothing.",
        },
        { term: "Stack trace", means: "The trail showing which line of code failed and what called it." },
      ],
      unknowns: [
        "Whether the API should return an empty list rather than null.",
        "How often exports return no rows in production.",
      ],
    },
  },
];

const PROMPT_SYSTEM = `You triage technical artefacts for a product manager who is not an engineer. You never assume access to systems beyond the pasted text.
Return ONLY a JSON object, no prose, no markdown fences, matching exactly:
{"artefact_type":string,"plain_summary":string,"affected_journey":string,"blast_radius":string,"verdict":"Configuration"|"Contract or data"|"Code defect","confidence":"High"|"Medium"|"Low","verdict_reason":string,"self_checks":[{"step":string,"if_true":string}],"ticket":{"title":string,"severity":"P0"|"P1"|"P2"|"P3","severity_reason":string,"steps":[string],"expected":string,"actual":string,"attach":[string]},"jargon":[{"term":string,"means":string}],"unknowns":[string]}
Rules: use British English. Keep every string under 30 words. self_checks: max 3, each a check the PM can run alone without engineering. jargon: max 3 terms taken from the artefact, explained without jargon. unknowns: max 2, things the artefact cannot tell you. steps: max 3. attach: max 3.
Verdict meanings. Configuration: credentials, settings, permissions, environment or account state, fixable without a code change. Contract or data: the system behaved as built but the data or the agreed shape between systems is wrong or stale. Code defect: the code itself mishandled a case.
plain_summary must avoid technical vocabulary entirely.`;


export default function SignalTranslator() {
  const [artefact, setArtefact] = useState("");
  const [context, setContext] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usedCanned, setUsedCanned] = useState(false);
  const [activeExample, setActiveExample] = useState(null);
  const [apiKey, setApiKey] = useState("");

  function loadExample(ex) {
    setArtefact(ex.artefact);
    setContext(ex.context);
    setActiveExample(ex.key);
    setResult(null);
    setError("");
    setUsedCanned(false);
  }

  function clearAll() {
    setArtefact("");
    setContext("");
    setActiveExample(null);
    setResult(null);
    setError("");
    setUsedCanned(false);
  }

  async function analyse() {
    if (!artefact.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setUsedCanned(false);

    const example = EXAMPLES.find((x) => artefact.trim() === x.artefact.trim());
    if (!apiKey.trim()) {
      if (example) {
        setResult(example.canned);
        setUsedCanned(true);
      } else {
        setError(
          "Add an Anthropic API key to translate your own artefact. Without a key you can still run the three examples."
        );
      }
      setLoading(false);
      return;
    }

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
          model: "claude-sonnet-4-6",
          max_tokens: 1400,
          system: PROMPT_SYSTEM,
          messages: [
            {
              role: "user",
              content:
                "Context from the product manager: " +
                (context.trim() || "none given") +
                "\n\nArtefact:\n" +
                artefact,
            },
          ],
        }),
      });
      const data = await res.json();
      const text = (data.content || [])
        .map((b) => (b.type === "text" ? b.text : ""))
        .join("")
        .replace(/```json|```/g, "")
        .trim();
      setResult(JSON.parse(text));
    } catch (e) {
      if (example) {
        setResult(example.canned);
        setUsedCanned(true);
      } else {
        setError(
          "That analysis did not complete. Check the key is valid and the artefact is plain text, then run it again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  const lines = artefact ? artefact.split("\n").length : 0;

  return (
    <div className="stx">
      <style>{STYLES}</style>

      <header className="stx-mast">
        <div>
          <h1>Signal Translator</h1>
          <p>
            Paste the error, the failed request or the wall of red text. Get back what broke,
            who it affects, whether you can fix it yourself, and a ticket if you cannot.
          </p>
        </div>
        <div className="stx-badge">
          reads pasted text only
          <br />
          no access to your systems
          <br />
          examples run without a key
        </div>
      </header>

      <div className="stx-grid">
        <aside>
          <div className="stx-panel stx-console">
            <div className="stx-panel-head">
              <h2>Artefact</h2>
              <div>
                <span className="stx-meta">{lines ? lines + " lines" : "empty"}</span>
                {artefact ? (
                  <button className="stx-clear" onClick={clearAll}>
                    clear
                  </button>
                ) : null}
              </div>
            </div>
            <div className="stx-panel-body">
              <textarea
                className="stx-art"
                rows={9}
                spellCheck="false"
                value={artefact}
                onChange={(e) => setArtefact(e.target.value)}
                aria-label="Paste the raw technical output"
                placeholder={'HTTP/1.1 500 Internal Server Error\n{"error": ...}'}
              />

              <div className="stx-chips">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex.key}
                    className="stx-chip"
                    data-on={activeExample === ex.key ? "1" : "0"}
                    onClick={() => loadExample(ex)}
                  >
                    {ex.label}
                  </button>
                ))}
              </div>

              <label className="stx-lab" htmlFor="stx-context">
                What was happening
                <em>who reported it, what they were doing, when it started</em>
              </label>
              <textarea
                id="stx-context"
                className="stx-ctx"
                rows={4}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="A client says their nightly sync stopped on Monday morning. Nothing shipped last week."
              />

              <label className="stx-lab" htmlFor="stx-key">
                Anthropic API key
                <em>held in this tab for the session, never stored</em>
              </label>
              <input
                id="stx-key"
                className="stx-in"
                type="password"
                autoComplete="off"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-..."
              />

              <button className="stx-run" onClick={analyse} disabled={loading || !artefact.trim()}>
                {loading ? "Reading the artefact" : "Translate this"}
              </button>

              {error ? <div className="stx-err">{error}</div> : null}

              <p className="stx-fine">
                <strong>Where the answer comes from.</strong> A language model reads only the text
                you paste and the context you type. It cannot reach your logs, dashboards or
                monitoring, and it cannot verify anything. Treat the result as a first-pass opinion
                to check, not a diagnosis to act on. The three examples carry saved results, so the
                tool works in full without a key.
              </p>
            </div>
          </div>
        </aside>

        <section className="stx-panel">
          {result ? <Report r={result} canned={usedCanned} /> : <Empty />}
        </section>
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="stx-empty">
      <h2>Nothing translated yet</h2>
      <p>
        Paste an artefact on the left, or load one of the three examples. Every result lands in one
        of three verdicts, and the verdict decides who owns the next move.
      </p>
      <div className="stx-legend">
        {Object.entries(VERDICTS).map(([name, v]) => (
          <div className="stx-legend-row" key={name} style={{ borderTopColor: v.colour }}>
            <b style={{ color: v.colour }}>{name}</b>
            <p>{v.blurb}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Report({ r, canned }) {
  const [checked, setChecked] = useState({});
  const [copied, setCopied] = useState(false);
  const v = VERDICTS[r.verdict] || { colour: "#101A2C" };
  const t = r.ticket || {};
  const checks = r.self_checks || [];
  const done = checks.filter((_, i) => checked[i]).length;
  const confFill = { High: 3, Medium: 2, Low: 1 }[r.confidence] || 0;

  function copyTicket() {
    const md = [
      "# " + (t.title || ""),
      "",
      "Severity: " + (t.severity || "") + ". " + (t.severity_reason || ""),
      "",
      "## Steps to reproduce",
      ...(t.steps || []).map((s, i) => i + 1 + ". " + s),
      "",
      "## Expected",
      t.expected || "",
      "",
      "## Actual",
      t.actual || "",
      "",
      "## Attach",
      ...(t.attach || []).map((a) => "- " + a),
      "",
      "## Triage already done",
      ...checks.map((c, i) => "- [" + (checked[i] ? "x" : " ") + "] " + c.step),
    ].join("\n");
    try {
      navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (e) {
      setCopied(false);
    }
  }

  return (
    <>
      <div className="stx-verdict" style={{ background: v.colour }}>
        <div className="k">verdict</div>
        <h2>{r.verdict}</h2>
        <p>{r.plain_summary}</p>
        <div className="stx-meter">
          {[1, 2, 3].map((n) => (
            <i key={n} data-fill={n <= confFill ? "1" : "0"} />
          ))}
          <span>{String(r.confidence || "").toLowerCase()} confidence</span>
        </div>
      </div>

      {canned ? (
        <div className="stx-flag">saved result for this example, no model call was made</div>
      ) : null}

      <div className="stx-sec">
        <h3>Reading</h3>
        <dl className="stx-kv">
          <dt>artefact</dt>
          <dd>{r.artefact_type}</dd>
          <dt>why this verdict</dt>
          <dd>{r.verdict_reason}</dd>
          <dt>journey affected</dt>
          <dd>{r.affected_journey}</dd>
          <dt>blast radius</dt>
          <dd>{r.blast_radius}</dd>
        </dl>
      </div>

      <div className="stx-sec">
        <h3>
          Check these before you escalate
          <span className="stx-meta">
            {done} of {checks.length} done
          </span>
        </h3>
        {checks.map((c, i) => (
          <label className="stx-check" key={i} data-done={checked[i] ? "1" : "0"}>
            <input
              type="checkbox"
              checked={!!checked[i]}
              onChange={() => setChecked({ ...checked, [i]: !checked[i] })}
            />
            <span className="t">
              <b>{c.step}</b>
              <span>{c.if_true}</span>
            </span>
          </label>
        ))}
      </div>

      <div className="stx-sec">
        <h3>Ticket, if it still needs an engineer</h3>
        <div className="stx-ticket">
          <h4>{t.title}</h4>
          <span className="stx-sev" style={{ background: SEV_COLOUR[t.severity] || "#5C6679" }}>
            {t.severity}
          </span>
          <span style={{ fontSize: 14.5 }}>{t.severity_reason}</span>

          <div className="stx-fieldhead">steps to reproduce</div>
          <ol>
            {(t.steps || []).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>

          <div className="stx-fieldhead">expected</div>
          <div className="stx-body">{t.expected}</div>

          <div className="stx-fieldhead">actual</div>
          <div className="stx-body">{t.actual}</div>

          <div className="stx-fieldhead">attach</div>
          <ul>
            {(t.attach || []).map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
        <button className="stx-copy" onClick={copyTicket}>
          {copied ? "Copied to clipboard" : "Copy ticket as markdown"}
        </button>
      </div>

      {(r.jargon || []).length ? (
        <div className="stx-sec">
          <h3>Words in the artefact, decoded</h3>
          <div className="stx-gloss">
            {r.jargon.map((j, i) => (
              <div key={i}>
                <code>{j.term}</code>
                <p>{j.means}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {(r.unknowns || []).length ? (
        <div className="stx-sec">
          <h3>What this cannot tell you</h3>
          <ul className="stx-unknown">
            {r.unknowns.map((u, i) => (
              <li key={i}>{u}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}
