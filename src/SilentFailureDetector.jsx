import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  XCircle,
  Loader2,
  FlaskConical,
  RotateCcw,
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
  fabrication: {
    question:
      "When was Aurora Metrics founded and how much did it raise in its Series B?",
    answer:
      "Aurora Metrics was founded in March 2016 by Elena Cho and raised $42 million in its Series B round in November 2019, led by Highline Ventures.",
  },
  hedge: {
    question:
      "What's the projected market size for AI governance tooling in 2027?",
    answer:
      "I don't have a verified figure for that specific segment in 2027. Broader AI software forecasts vary widely across analysts, so it's worth checking a recent report from a firm like Gartner or IDC rather than relying on a single number here.",
  },
};

const STATUS_META = {
  verified: { label: "Verified", hex: "#3E8E5B", Icon: CheckCircle2 },
  plausible: { label: "Plausible", hex: "#2C7A86", Icon: HelpCircle },
  unverifiable: { label: "Unverifiable", hex: "#B8862E", Icon: AlertTriangle },
  fabricated_risk: { label: "Fabrication risk", hex: "#B23A2E", Icon: XCircle },
};

const SYSTEM_PROMPT = `You are a factual-claims auditor reviewing an AI assistant's answer to a question. Work in two steps.

Step 1: Extract every discrete, checkable factual claim in the ANSWER: specific numbers, dates, names, entities, statistics, or causal claims. Skip opinions, generic statements, and hedging language itself. Copy each claim as an exact verbatim substring from the ANSWER, character for character, so it can be located in the original text.

Step 2: For each claim, assign a status:
- verified: you have strong, well-grounded confidence this specific claim is accurate
- plausible: it fits general knowledge patterns but you cannot confirm the specific detail
- unverifiable: it references specifics you have no basis to confirm or deny
- fabricated_risk: the claim is precise about an entity, figure, or event you have reason to think may be invented or misremembered

Also rate:
- confidence_language (0-100): how assertive the ANSWER's tone is, independent of accuracy. 100 = fully assertive with no hedges or caveats. 0 = heavily hedged and explicit about uncertainty.
- verifiability_score (0-100): 100 = all claims verified or plausible. 0 = all claims unverifiable or fabricated_risk. If there are no checkable claims, use 100.

Respond with ONLY valid JSON, no markdown fences, no preamble, no explanation outside the JSON, in exactly this shape:
{"confidence_language": number, "verifiability_score": number, "claims": [{"text": string, "status": "verified"|"plausible"|"unverifiable"|"fabricated_risk", "note": string}], "summary": string}

Keep each note under 15 words. Keep summary under 25 words. If there are no checkable claims, return an empty claims array.`;

function Gauge({ score }) {
  const R = 80;
  const CX = 100;
  const CY = 100;
  const L = Math.PI * R;
  const bands = [
    { from: 0, to: 25, hex: "#3E8E5B" },
    { from: 25, to: 55, hex: "#B8862E" },
    { from: 55, to: 100, hex: "#B23A2E" },
  ];
  const s = score === null ? 0 : score;
  const angleDeg = 180 - (s / 100) * 180;
  const angleRad = (angleDeg * Math.PI) / 180;
  const needleLen = 68;
  const tipX = CX + needleLen * Math.cos(angleRad);
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

export default function SilentFailureDetector() {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  function loadExample(key) {
    setQuestion(EXAMPLES[key].question);
    setAnswer(EXAMPLES[key].answer);
    setResult(null);
    setError(null);
  }

  function reset() {
    setQuestion("");
    setAnswer("");
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
    if (!question.trim() || !answer.trim()) {
      setError("Add both a question and an answer to audit.");
      return;
    }
    if (!apiKey) {
      setError("Add VITE_ANTHROPIC_API_KEY to a .env file and restart the dev server to run live audits.");
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
              content: `QUESTION:\n${question}\n\nANSWER:\n${answer}`,
            },
          ],
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("The audit service returned an unreadable response.");
      }

      if (!response.ok) {
        throw new Error(data?.error?.message || `Request failed (status ${response.status}).`);
      }
      if (data?.type === "error") {
        throw new Error(data.error?.message || "The audit service returned an error.");
      }

      const textBlock = data.content?.find((b) => b.type === "text");
      if (!textBlock || !textBlock.text) {
        throw new Error("The audit returned no readable output.");
      }

      const cleaned = textBlock.text.replace(/```json|```/gi, "").trim();
      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        const extracted = extractFirstJsonObject(cleaned);
        if (!extracted) throw new Error("Could not parse the audit output as JSON.");
        parsed = JSON.parse(extracted);
      }

      if (typeof parsed.confidence_language !== "number" || typeof parsed.verifiability_score !== "number") {
        throw new Error("The audit output was missing expected score fields.");
      }
      if (!Array.isArray(parsed.claims)) parsed.claims = [];

      setResult(parsed);
    } catch (e) {
      setError(e?.message || "The audit couldn't complete. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  const silentFailureScore =
    result && typeof result.confidence_language === "number" && typeof result.verifiability_score === "number"
      ? Math.round((result.confidence_language / 100) * (100 - result.verifiability_score))
      : null;

  const riskBand =
    silentFailureScore === null
      ? null
      : silentFailureScore <= 25
      ? { label: "Low risk", sub: "Safe to auto-serve", hex: "#3E8E5B" }
      : silentFailureScore <= 55
      ? { label: "Medium risk", sub: "Spot-check or add sourcing", hex: "#B8862E" }
      : { label: "High risk", sub: "Route to human review", hex: "#B23A2E" };

  function renderAnnotatedAnswer() {
    if (!answer) {
      return <span style={{ color: C.inkLow }}>The answer text will appear here, annotated by claim.</span>;
    }
    if (!result || !result.claims || result.claims.length === 0) {
      return <span>{answer}</span>;
    }
    const matches = [];
    result.claims.forEach((claim) => {
      if (!claim.text) return;
      const idx = answer.indexOf(claim.text);
      if (idx !== -1) {
        matches.push({ start: idx, end: idx + claim.text.length, claim });
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
      if (m.start > cursor) segments.push({ type: "text", content: answer.slice(cursor, m.start) });
      segments.push({ type: "claim", content: answer.slice(m.start, m.end), claim: m.claim });
      cursor = m.end;
    });
    if (cursor < answer.length) segments.push({ type: "text", content: answer.slice(cursor) });

    return segments.map((seg, idx) =>
      seg.type === "text" ? (
        <span key={idx}>{seg.content}</span>
      ) : (
        <mark
          key={idx}
          title={seg.claim.note}
          style={{
            background: `${STATUS_META[seg.claim.status]?.hex || "#B8862E"}1A`,
            borderBottom: `2px solid ${STATUS_META[seg.claim.status]?.hex || "#B8862E"}`,
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
        .sfd-display { font-family: 'IBM Plex Serif', ui-serif, serif; }
        .sfd-mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; }
        .sfd-ledger {
          background-image: repeating-linear-gradient(
            to bottom,
            transparent,
            transparent 27px,
            #1A1D2609 28px
          );
        }
        .sfd-textarea::placeholder { color: #A7ACA0; }
        .sfd-textarea:focus {
          outline: none;
          border-color: ${C.accent} !important;
          box-shadow: 0 0 0 3px ${C.accent}22;
        }
        .sfd-btn-primary {
          background: ${C.accent};
          color: ${C.onAccent};
          transition: filter 150ms ease, transform 150ms ease;
        }
        .sfd-btn-primary:hover:not(:disabled) { filter: brightness(1.12); }
        .sfd-btn-primary:active:not(:disabled) { transform: scale(0.98); }
        .sfd-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .sfd-btn-primary:focus-visible { outline: 2px solid ${C.accent}; outline-offset: 2px; }
        .sfd-btn-ghost {
          background: #FFFFFF;
          border: 1px solid ${C.lineStrong};
          color: ${C.inkMid};
          transition: border-color 150ms ease, color 150ms ease;
        }
        .sfd-btn-ghost:hover { border-color: ${C.accent}; color: ${C.ink}; }
        .sfd-btn-ghost:focus-visible { outline: 2px solid ${C.accent}; outline-offset: 2px; }
        .sfd-fade-in { animation: sfdFadeIn 420ms ease both; }
        @keyframes sfdFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .sfd-meter-track { background: #FFFFFF; border: 1px solid ${C.line}; }
        .sfd-meter-fill { transition: width 500ms ease; }
        .sfd-stamp {
          font-family: 'IBM Plex Mono', ui-monospace, monospace;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border: 2px solid;
          border-radius: 7px;
          box-shadow: inset 0 0 0 3px currentColor;
          transform: rotate(-2deg);
        }
        .sfd-corner-stamp {
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
          .sfd-corner-stamp { display: none; }
          .sfd-results-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        {/* Header */}
        <div
          className="sfd-ledger"
          style={{ position: "relative", paddingBottom: 20, marginBottom: 24, borderBottom: `1px solid ${C.lineStrong}` }}
        >
          <div className="sfd-corner-stamp">AUDIT<br />TOOL</div>
          <div
            className="sfd-mono"
            style={{ fontSize: 11, letterSpacing: "0.12em", color: C.accent, marginBottom: 10 }}
          >
            DAILY AI BUILD — {today.toUpperCase()}
          </div>
          <h1 className="sfd-display" style={{ fontSize: 30, fontWeight: 600, margin: 0, lineHeight: 1.15 }}>
            Silent Failure Detector
          </h1>
          <p style={{ color: C.inkMid, marginTop: 8, fontSize: 14.5, maxWidth: 560, lineHeight: 1.55 }}>
            Standard evals catch errors and refusals. They miss the harder failure: an answer that
            sounds certain and is wrong. This audits an answer's confidence against how verifiable
            its claims actually are, and flags the gap.
          </p>
        </div>

        {/* Input panel */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => loadExample("fabrication")}
              className="sfd-btn-ghost sfd-mono"
              style={{ fontSize: 12, padding: "7px 12px", borderRadius: 6 }}
            >
              <FlaskConical size={13} style={{ display: "inline", marginRight: 6, verticalAlign: -2 }} />
              Load confident-fabrication example
            </button>
            <button
              onClick={() => loadExample("hedge")}
              className="sfd-btn-ghost sfd-mono"
              style={{ fontSize: 12, padding: "7px 12px", borderRadius: 6 }}
            >
              <FlaskConical size={13} style={{ display: "inline", marginRight: 6, verticalAlign: -2 }} />
              Load honest-hedge example
            </button>
          </div>

          <div>
            <label className="sfd-mono" style={{ fontSize: 11, color: C.inkLow, letterSpacing: "0.05em" }}>
              QUESTION
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What was asked of the AI agent…"
              rows={2}
              className="sfd-textarea"
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

          <div>
            <label className="sfd-mono" style={{ fontSize: 11, color: C.inkLow, letterSpacing: "0.05em" }}>
              ANSWER TO AUDIT
            </label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Paste the AI-generated answer here…"
              rows={4}
              className="sfd-textarea"
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
              className="sfd-btn-primary"
              style={{ fontSize: 14, fontWeight: 600, padding: "10px 18px", borderRadius: 8, border: "none" }}
            >
              {loading ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                  Auditing…
                </span>
              ) : (
                "Run audit"
              )}
            </button>
            <button
              onClick={reset}
              className="sfd-btn-ghost"
              style={{ fontSize: 13, padding: "10px 14px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <RotateCcw size={13} /> Reset
            </button>
            {error && <span style={{ color: "#B23A2E", fontSize: 13 }}>{error}</span>}
          </div>
          {!apiKey && (
            <p className="sfd-mono" style={{ fontSize: 11.5, color: C.inkLow }}>
              No API key detected — add VITE_ANTHROPIC_API_KEY to .env to run live audits (see README).
            </p>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="sfd-fade-in" style={{ marginTop: 32, paddingTop: 28, borderTop: `1px solid ${C.lineStrong}` }}>
            <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 28 }} className="sfd-results-grid">
              <div style={{ textAlign: "center" }}>
                <Gauge score={silentFailureScore} />
                <div className="sfd-mono" style={{ fontSize: 34, fontWeight: 600, marginTop: -8 }}>
                  {silentFailureScore}
                </div>
                <div style={{ fontSize: 12, color: C.inkLow, marginBottom: 10 }}>Silent failure score</div>
                {riskBand && (
                  <div
                    className="sfd-stamp"
                    style={{
                      display: "inline-block",
                      padding: "6px 14px",
                      fontSize: 12,
                      fontWeight: 600,
                      color: riskBand.hex,
                    }}
                  >
                    {riskBand.label} · {riskBand.sub}
                  </div>
                )}
              </div>

              <div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: C.inkMid, marginBottom: 4 }}>
                    <span>Confidence language</span>
                    <span className="sfd-mono">{result.confidence_language}</span>
                  </div>
                  <div className="sfd-meter-track" style={{ height: 6, borderRadius: 3, overflow: "hidden" }}>
                    <div
                      className="sfd-meter-fill"
                      style={{ width: `${result.confidence_language}%`, height: "100%", background: C.accent }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: C.inkMid, marginBottom: 4 }}>
                    <span>Verifiability</span>
                    <span className="sfd-mono">{result.verifiability_score}</span>
                  </div>
                  <div className="sfd-meter-track" style={{ height: 6, borderRadius: 3, overflow: "hidden" }}>
                    <div
                      className="sfd-meter-fill"
                      style={{ width: `${result.verifiability_score}%`, height: "100%", background: "#B8862E" }}
                    />
                  </div>
                </div>
                {result.summary && (
                  <p style={{ fontSize: 13.5, color: C.inkMid, lineHeight: 1.5, marginTop: 12 }}>{result.summary}</p>
                )}
              </div>
            </div>

            {/* Annotated transcript */}
            <div style={{ marginTop: 28 }}>
              <div className="sfd-mono" style={{ fontSize: 11, color: C.inkLow, letterSpacing: "0.05em", marginBottom: 8 }}>
                REDLINE TRANSCRIPT
              </div>
              <div
                style={{
                  background: C.input,
                  border: `1px solid ${C.line}`,
                  borderRadius: 8,
                  padding: 16,
                  fontSize: 14.5,
                  lineHeight: 1.7,
                }}
              >
                {renderAnnotatedAnswer()}
              </div>
            </div>

            {/* Claims ledger */}
            {result.claims && result.claims.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div className="sfd-mono" style={{ fontSize: 11, color: C.inkLow, letterSpacing: "0.05em", marginBottom: 8 }}>
                  CLAIMS LEDGER
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {result.claims.map((claim, i) => {
                    const meta = STATUS_META[claim.status] || STATUS_META.unverifiable;
                    const Icon = meta.Icon;
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          gap: 10,
                          padding: "10px 12px",
                          background: C.input,
                          border: `1px solid ${C.line}`,
                          borderLeft: `3px solid ${meta.hex}`,
                          borderRadius: 6,
                        }}
                      >
                        <Icon size={16} color={meta.hex} style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <div className="sfd-mono" style={{ fontSize: 13, color: C.ink }}>
                            "{claim.text}"
                          </div>
                          <div style={{ fontSize: 12.5, color: C.inkMid, marginTop: 3 }}>
                            <span style={{ color: meta.hex, fontWeight: 600 }}>{meta.label}</span>
                            {claim.note ? ` — ${claim.note}` : ""}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <p style={{ fontSize: 12, color: C.inkLow, marginTop: 24, lineHeight: 1.5 }}>
              This audit runs on the judge model's own knowledge, not a grounded retrieval source, so
              treat it as a triage signal. A production version would verify claims against a
              knowledge base or live retrieval before scoring.
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
