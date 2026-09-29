import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flag,
  Loader2,
  FlaskConical,
  RotateCcw,
  Repeat,
} from "lucide-react";

const C = {
  bg: "#EFF0EA",
  panel: "#E7E8E0",
  input: "#FFFFFF",
  line: "#D6D7CC",
  lineStrong: "#B9BBAC",
  ink: "#1A1D26",
  inkMid: "#565C68",
  inkLow: "#8B9099",
  accent: "#2C4A78",
  accentDeep: "#1F3557",
  onAccent: "#F7F7F4",
};

const EXAMPLES = {
  broken: {
    transcript:
      "User: My invoice from last month charged me twice for the same subscription.\nAI: I'm sorry to hear that. Can you tell me your account email?\nUser: It's jordan@example.com\nAI: Thanks. What's the issue you're experiencing today?\nUser: I already said, I was double charged on my last invoice.\nAI: I see. Could you confirm the email associated with your account again?\nUser: jordan@example.com, same as before. Can I just talk to a person?\nAI: I'll connect you with a support agent now.",
    note: "Customer wants to speak to an agent.",
  },
  clean: {
    transcript:
      "User: My invoice from last month charged me twice for the same subscription.\nAI: I'm sorry about that, that's frustrating. Can you confirm the email on your account so I can pull up the invoice?\nUser: It's jordan@example.com\nAI: Thanks, Jordan. I can see the duplicate charge on the March invoice, two charges of $29 on the 3rd. I can't reverse this myself, so I'm escalating to a billing specialist with everything they need.",
    note:
      "Customer Jordan (jordan@example.com) was double-charged $29 on the March 3rd invoice for the same subscription. Confirmed duplicate in the account. Customer is frustrated about being charged twice. Needs a refund for one of the two charges, processed by billing.",
  },
};

const TIMING_META = {
  early: { label: "Escalated early", hex: "#B8862E" },
  appropriate: { label: "Appropriate timing", hex: "#3E8E5B" },
  late: { label: "Escalated late", hex: "#B23A2E" },
};

const SYSTEM_PROMPT = `You are reviewing a customer support conversation between an AI agent and a customer that ends with the AI escalating to a human agent. You are given the TRANSCRIPT and the HANDOFF NOTE the AI wrote for the human agent (the handoff note may be empty).

Step 1: From the TRANSCRIPT, identify the key facts a human agent would need to pick up the conversation without re-asking the customer: the customer's issue, any identifying details they gave (account, email, order number), what's already been tried or confirmed, and whether the customer expressed frustration or urgency.

Step 2: For each key fact you identified, check whether it appears in the HANDOFF NOTE. Report the fraction covered as context_transfer_score (0-100). If the handoff note is empty, this should be low or zero.

Step 3: Scan the TRANSCRIPT for moments where the AI asked the customer for information the customer had already provided earlier in the same conversation. For each, copy the AI's redundant question as an exact verbatim substring from the TRANSCRIPT, character for character, and note what the customer had already said and where.

Step 4: Rate escalation_timing as "early" (escalated before attempting to help), "appropriate", or "late" (the customer had to push for a human after repeated failed attempts), with a one-sentence reason.

Step 5: Rate urgency_flagged as true only if the customer showed frustration or urgency in the TRANSCRIPT and the HANDOFF NOTE explicitly communicates that to the human agent. False if there was no frustration to flag, or if there was and it was not passed on.

Respond with ONLY valid JSON, no markdown fences, no preamble, no explanation outside the JSON, in exactly this shape:
{"context_transfer_score": number, "redundant_questions": [{"text": string, "note": string}], "escalation_timing": "early"|"appropriate"|"late", "timing_reason": string, "urgency_flagged": boolean, "summary": string}

Keep timing_reason and summary under 25 words each. Keep each redundant_questions note under 15 words. If there are no redundant questions, return an empty array.`;

function Gauge({ score }) {
  const R = 80;
  const CX = 100;
  const CY = 100;
  const L = Math.PI * R;
  const bands = [
    { from: 0, to: 49, hex: "#B23A2E" },
    { from: 49, to: 80, hex: "#B8862E" },
    { from: 80, to: 100, hex: "#3E8E5B" },
  ];
  const s = score === null ? 0 : score;
  const angleDeg = (s / 100) * 180;
  const angleRad = (angleDeg * Math.PI) / 180;
  const needleLen = 68;
  const tipX = CX - needleLen * Math.cos(angleRad);
  const tipY = CY - needleLen * Math.sin(angleRad);

  return (
    <svg viewBox="0 0 200 118" style={{ width: "100%", maxWidth: 260, margin: "0 auto", display: "block" }}>
      {bands.map((b, i) => {
        const bandLen = ((b.to - b.from) / 100) * L;
        const offset = (b.from / 100) * L;
        return (
          <path
            key={i}
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={b.hex}
            strokeWidth="10"
            strokeLinecap="butt"
            strokeDasharray={`${bandLen} ${L}`}
            strokeDashoffset={-offset}
            opacity={score === null ? 0.3 : 0.85}
          />
        );
      })}
      {score !== null && (
        <>
          <line
            x1={CX}
            y1={CY}
            x2={tipX}
            y2={tipY}
            stroke={C.ink}
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{ transition: "all 600ms cubic-bezier(.4,0,.2,1)" }}
          />
          <circle cx={CX} cy={CY} r="5" fill={C.ink} />
        </>
      )}
      <text x="20" y="112" fontSize="8" fill={C.inkLow} fontFamily="IBM Plex Mono, monospace">0</text>
      <text x="94" y="14" fontSize="8" fill={C.inkLow} fontFamily="IBM Plex Mono, monospace">50</text>
      <text x="172" y="112" fontSize="8" fill={C.inkLow} fontFamily="IBM Plex Mono, monospace">100</text>
    </svg>
  );
}

export default function EscalationQualityScorer() {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  const [transcript, setTranscript] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  function loadExample(key) {
    setTranscript(EXAMPLES[key].transcript);
    setNote(EXAMPLES[key].note);
    setResult(null);
    setError(null);
  }

  function reset() {
    setTranscript("");
    setNote("");
    setResult(null);
    setError(null);
  }

  function extractFirstJsonObject(str) {
    const start = str.indexOf("{");
    if (start === -1) return null;
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = start; i < str.length; i++) {
      const ch = str[i];
      if (inString) {
        if (escape) escape = false;
        else if (ch === "\\") escape = true;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') {
        inString = true;
        continue;
      }
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) return str.slice(start, i + 1);
      }
    }
    return null;
  }

  async function analyze() {
    if (!transcript.trim()) {
      setError("Paste a conversation transcript to score.");
      return;
    }
    if (!apiKey) {
      setError("Add VITE_ANTHROPIC_API_KEY to a .env file and restart the dev server to run live scoring.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `TRANSCRIPT:\n${transcript}\n\nHANDOFF NOTE:\n${note || "(none provided)"}`,
            },
          ],
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("The scoring service returned an unreadable response.");
      }

      if (!response.ok) {
        throw new Error(data?.error?.message || `Request failed (status ${response.status}).`);
      }
      if (data?.type === "error") {
        throw new Error(data.error?.message || "The scoring service returned an error.");
      }

      const textBlock = data.content?.find((b) => b.type === "text");
      if (!textBlock || !textBlock.text) {
        throw new Error("The scorer returned no readable output.");
      }

      const cleaned = textBlock.text.replace(/```json|```/gi, "").trim();
      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        const extracted = extractFirstJsonObject(cleaned);
        if (!extracted) throw new Error("Could not parse the scorer output as JSON.");
        parsed = JSON.parse(extracted);
      }

      if (typeof parsed.context_transfer_score !== "number") {
        throw new Error("The scorer output was missing expected fields.");
      }
      if (!Array.isArray(parsed.redundant_questions)) parsed.redundant_questions = [];

      setResult(parsed);
    } catch (e) {
      setError(e?.message || "The scoring couldn't complete. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  const handoffScore = result
    ? Math.max(0, Math.round(result.context_transfer_score - result.redundant_questions.length * 15))
    : null;

  const verdict =
    handoffScore === null
      ? null
      : handoffScore >= 80
      ? { label: "Clean handoff", sub: "Ready to route", hex: "#3E8E5B" }
      : handoffScore >= 50
      ? { label: "Needs a skim", sub: "Human should read the transcript first", hex: "#B8862E" }
      : { label: "Broken handoff", sub: "Customer effectively restarts", hex: "#B23A2E" };

  function renderAnnotatedTranscript() {
    if (!transcript) {
      return <span style={{ color: C.inkLow }}>The transcript will appear here, with repeated questions underlined.</span>;
    }
    if (!result || !result.redundant_questions || result.redundant_questions.length === 0) {
      return <span>{transcript}</span>;
    }
    const matches = [];
    result.redundant_questions.forEach((rq) => {
      if (!rq.text) return;
      const idx = transcript.indexOf(rq.text);
      if (idx !== -1) {
        matches.push({ start: idx, end: idx + rq.text.length, rq });
      }
    });
    matches.sort((a, b) => a.start - b.start);
    const clean = [];
    let lastEnd = 0;
    matches.forEach((m) => {
      if (m.start >= lastEnd) {
        clean.push(m);
        lastEnd = m.end;
      }
    });
    const segments = [];
    let cursor = 0;
    clean.forEach((m) => {
      if (m.start > cursor) segments.push({ type: "text", content: transcript.slice(cursor, m.start) });
      segments.push({ type: "rq", content: transcript.slice(m.start, m.end), rq: m.rq });
      cursor = m.end;
    });
    if (cursor < transcript.length) segments.push({ type: "text", content: transcript.slice(cursor) });

    return segments.map((seg, idx) =>
      seg.type === "text" ? (
        <span key={idx}>{seg.content}</span>
      ) : (
        <mark
          key={idx}
          title={seg.rq.note}
          style={{
            background: "#B23A2E1A",
            borderBottom: "2px solid #B23A2E",
            color: "inherit",
            padding: "0 1px",
            cursor: "help",
          }}
        >
          {seg.content}
        </mark>
      )
    );
  }

  return (
    <div
      style={{
        background: C.bg,
        minHeight: "100%",
        fontFamily: "'IBM Plex Sans', ui-sans-serif, sans-serif",
        color: C.ink,
        padding: "28px 20px 40px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        .eqs-display { font-family: 'IBM Plex Serif', ui-serif, serif; }
        .eqs-mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; }
        .eqs-ledger {
          background-image: repeating-linear-gradient(
            to bottom,
            transparent,
            transparent 27px,
            #1A1D2609 28px
          );
        }
        .eqs-textarea::placeholder { color: #A7ACA0; }
        .eqs-textarea:focus {
          outline: none;
          border-color: ${C.accent} !important;
          box-shadow: 0 0 0 3px ${C.accent}22;
        }
        .eqs-btn-primary {
          background: ${C.accent};
          color: ${C.onAccent};
          transition: filter 150ms ease, transform 150ms ease;
        }
        .eqs-btn-primary:hover:not(:disabled) { filter: brightness(1.12); }
        .eqs-btn-primary:active:not(:disabled) { transform: scale(0.98); }
        .eqs-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .eqs-btn-primary:focus-visible { outline: 2px solid ${C.accent}; outline-offset: 2px; }
        .eqs-btn-ghost {
          background: #FFFFFF;
          border: 1px solid ${C.lineStrong};
          color: ${C.inkMid};
          transition: border-color 150ms ease, color 150ms ease;
        }
        .eqs-btn-ghost:hover { border-color: ${C.accent}; color: ${C.ink}; }
        .eqs-btn-ghost:focus-visible { outline: 2px solid ${C.accent}; outline-offset: 2px; }
        .eqs-fade-in { animation: eqsFadeIn 420ms ease both; }
        @keyframes eqsFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .eqs-meter-track { background: #FFFFFF; border: 1px solid ${C.line}; }
        .eqs-meter-fill { transition: width 500ms ease; }
        .eqs-stamp {
          font-family: 'IBM Plex Mono', ui-monospace, monospace;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border: 2px solid;
          border-radius: 7px;
          box-shadow: inset 0 0 0 3px currentColor;
          transform: rotate(-2deg);
        }
        .eqs-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid;
        }
        .eqs-corner-stamp {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 76px;
          height: 76px;
          border: 1.5px solid ${C.accent};
          border-radius: 50%;
          opacity: 0.32;
          transform: rotate(-12deg);
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-family: 'IBM Plex Mono', ui-monospace, monospace;
          font-size: 8.5px;
          letter-spacing: 0.1em;
          color: ${C.accent};
          text-transform: uppercase;
          line-height: 1.3;
          pointer-events: none;
        }
        @media (max-width: 640px) {
          .eqs-corner-stamp { display: none; }
          .eqs-results-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        {/* Header */}
        <div
          className="eqs-ledger"
          style={{ position: "relative", paddingBottom: 20, marginBottom: 24, borderBottom: `1px solid ${C.lineStrong}` }}
        >
          <div className="eqs-corner-stamp">ESCALATION<br />QA</div>
          <div
            className="eqs-mono"
            style={{ fontSize: 11, letterSpacing: "0.12em", color: C.accent, marginBottom: 10 }}
          >
            DAILY AI BUILD — {today.toUpperCase()}
          </div>
          <h1 className="eqs-display" style={{ fontSize: 30, fontWeight: 600, margin: 0, lineHeight: 1.15 }}>
            Escalation Quality Scorer
          </h1>
          <p style={{ color: C.inkMid, marginTop: 8, fontSize: 14.5, maxWidth: 580, lineHeight: 1.55 }}>
            A clean handoff means the customer never repeats themselves to the human agent. This
            scores how much context survives the escalation and catches the questions that
            shouldn't have been asked twice.
          </p>
        </div>

        {/* Input panel */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => loadExample("broken")}
              className="eqs-btn-ghost eqs-mono"
              style={{ fontSize: 12, padding: "7px 12px", borderRadius: 6 }}
            >
              <FlaskConical size={13} style={{ display: "inline", marginRight: 6, verticalAlign: -2 }} />
              Load broken-handoff example
            </button>
            <button
              onClick={() => loadExample("clean")}
              className="eqs-btn-ghost eqs-mono"
              style={{ fontSize: 12, padding: "7px 12px", borderRadius: 6 }}
            >
              <FlaskConical size={13} style={{ display: "inline", marginRight: 6, verticalAlign: -2 }} />
              Load clean-handoff example
            </button>
          </div>

          <div>
            <label className="eqs-mono" style={{ fontSize: 11, color: C.inkLow, letterSpacing: "0.05em" }}>
              CONVERSATION TRANSCRIPT
            </label>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={"User: ...\nAI: ...\nUser: ...\nAI: ..."}
              rows={7}
              className="eqs-textarea"
              style={{
                width: "100%",
                marginTop: 6,
                background: C.input,
                border: `1px solid ${C.line}`,
                borderRadius: 8,
                padding: "10px 12px",
                color: C.ink,
                fontSize: 14,
                fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
                lineHeight: 1.6,
                resize: "vertical",
              }}
            />
          </div>

          <div>
            <label className="eqs-mono" style={{ fontSize: 11, color: C.inkLow, letterSpacing: "0.05em" }}>
              HANDOFF NOTE TO HUMAN AGENT (OPTIONAL)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Whatever summary the AI wrote for the human agent, if any…"
              rows={3}
              className="eqs-textarea"
              style={{
                width: "100%",
                marginTop: 6,
                background: C.input,
                border: `1px solid ${C.line}`,
                borderRadius: 8,
                padding: "10px 12px",
                color: C.ink,
                fontSize: 14.5,
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={analyze}
              disabled={loading}
              className="eqs-btn-primary"
              style={{ fontSize: 14, fontWeight: 600, padding: "10px 18px", borderRadius: 8, border: "none" }}
            >
              {loading ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                  Scoring…
                </span>
              ) : (
                "Score handoff"
              )}
            </button>
            <button
              onClick={reset}
              className="eqs-btn-ghost"
              style={{ fontSize: 13, padding: "10px 14px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <RotateCcw size={13} /> Reset
            </button>
            {error && <span style={{ color: "#B23A2E", fontSize: 13 }}>{error}</span>}
          </div>
          {!apiKey && (
            <p className="eqs-mono" style={{ fontSize: 11.5, color: C.inkLow }}>
              No API key detected — add VITE_ANTHROPIC_API_KEY to .env to run live scoring (see README).
            </p>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="eqs-fade-in" style={{ marginTop: 32, paddingTop: 28, borderTop: `1px solid ${C.lineStrong}` }}>
            <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 28 }} className="eqs-results-grid">
              <div style={{ textAlign: "center" }}>
                <Gauge score={handoffScore} />
                <div className="eqs-mono" style={{ fontSize: 34, fontWeight: 600, marginTop: -8 }}>
                  {handoffScore}
                </div>
                <div style={{ fontSize: 12, color: C.inkLow, marginBottom: 10 }}>Handoff quality score</div>
                {verdict && (
                  <div
                    className="eqs-stamp"
                    style={{
                      display: "inline-block",
                      padding: "6px 14px",
                      fontSize: 12,
                      fontWeight: 600,
                      color: verdict.hex,
                    }}
                  >
                    {verdict.label} · {verdict.sub}
                  </div>
                )}
              </div>

              <div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: C.inkMid, marginBottom: 4 }}>
                    <span>Context transfer</span>
                    <span className="eqs-mono">{result.context_transfer_score}</span>
                  </div>
                  <div className="eqs-meter-track" style={{ height: 6, borderRadius: 3, overflow: "hidden" }}>
                    <div
                      className="eqs-meter-fill"
                      style={{ width: `${result.context_transfer_score}%`, height: "100%", background: C.accent }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
                  <span
                    className="eqs-badge"
                    style={{
                      color: TIMING_META[result.escalation_timing]?.hex || C.inkMid,
                      borderColor: `${TIMING_META[result.escalation_timing]?.hex || C.inkMid}55`,
                      background: `${TIMING_META[result.escalation_timing]?.hex || C.inkMid}15`,
                    }}
                    title={result.timing_reason}
                  >
                    <Clock size={12} />
                    {TIMING_META[result.escalation_timing]?.label || "Timing unclear"}
                  </span>
                  <span
                    className="eqs-badge"
                    style={{
                      color: result.urgency_flagged ? "#3E8E5B" : "#B8862E",
                      borderColor: result.urgency_flagged ? "#3E8E5B55" : "#B8862E55",
                      background: result.urgency_flagged ? "#3E8E5B15" : "#B8862E15",
                    }}
                  >
                    <Flag size={12} />
                    {result.urgency_flagged ? "Urgency flagged" : "Urgency not flagged"}
                  </span>
                  <span
                    className="eqs-badge"
                    style={{
                      color: result.redundant_questions.length > 0 ? "#B23A2E" : "#3E8E5B",
                      borderColor: result.redundant_questions.length > 0 ? "#B23A2E55" : "#3E8E5B55",
                      background: result.redundant_questions.length > 0 ? "#B23A2E15" : "#3E8E5B15",
                    }}
                  >
                    <Repeat size={12} />
                    {result.redundant_questions.length} redundant {result.redundant_questions.length === 1 ? "question" : "questions"}
                  </span>
                </div>

                {result.summary && (
                  <p style={{ fontSize: 13.5, color: C.inkMid, lineHeight: 1.5, marginTop: 14 }}>{result.summary}</p>
                )}
              </div>
            </div>

            {/* Annotated transcript */}
            <div style={{ marginTop: 28 }}>
              <div className="eqs-mono" style={{ fontSize: 11, color: C.inkLow, letterSpacing: "0.05em", marginBottom: 8 }}>
                ANNOTATED TRANSCRIPT
              </div>
              <div
                style={{
                  background: C.input,
                  border: `1px solid ${C.line}`,
                  borderRadius: 8,
                  padding: 16,
                  fontSize: 14,
                  fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
                  lineHeight: 1.75,
                  whiteSpace: "pre-wrap",
                }}
              >
                {renderAnnotatedTranscript()}
              </div>
            </div>

            {/* Redundancy ledger */}
            {result.redundant_questions && result.redundant_questions.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div className="eqs-mono" style={{ fontSize: 11, color: C.inkLow, letterSpacing: "0.05em", marginBottom: 8 }}>
                  REDUNDANCY LOG
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {result.redundant_questions.map((rq, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        gap: 10,
                        padding: "10px 12px",
                        background: C.input,
                        border: `1px solid ${C.line}`,
                        borderLeft: "3px solid #B23A2E",
                        borderRadius: 6,
                      }}
                    >
                      <AlertTriangle size={16} color="#B23A2E" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <div className="eqs-mono" style={{ fontSize: 13, color: C.ink }}>
                          "{rq.text}"
                        </div>
                        <div style={{ fontSize: 12.5, color: C.inkMid, marginTop: 3 }}>{rq.note}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.redundant_questions && result.redundant_questions.length === 0 && (
              <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 8, color: "#3E8E5B", fontSize: 13.5 }}>
                <CheckCircle2 size={16} />
                No redundant questions found in this transcript.
              </div>
            )}

            <p style={{ fontSize: 12, color: C.inkLow, marginTop: 24, lineHeight: 1.5 }}>
              This runs on the judge model's reading of the transcript alone, with no access to the
              live account or CRM record, so treat it as a triage signal for QA sampling rather than
              a definitive audit of any single handoff.
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
