import { useState } from "react";

const PAPER = "#F0EAD9";
const PAPER_DARK = "#E6DEC7";
const INK = "#23283B";
const CORAL = "#C94A3B";
const TEAL = "#1E7A6C";
const MUSTARD = "#D2A233";
const NAVY = "#2B3860";

const TEMPLATES = {
  rag: {
    label: "RAG pipeline",
    stages: [
      "Query interpretation",
      "Retrieval",
      "Context assembly",
      "Answer generation",
      "Output guardrails",
    ],
  },
  tool: {
    label: "Tool-use agent",
    stages: [
      "Planning",
      "Tool selection",
      "Tool execution",
      "Observation parsing",
      "Reasoning and reflection",
      "Final synthesis",
    ],
  },
  multi: {
    label: "Multi-agent orchestration",
    stages: [
      "Task routing",
      "Sub-agent delegation",
      "Sub-agent execution",
      "Result aggregation",
      "Orchestrator synthesis",
    ],
  },
  custom: {
    label: "Custom",
    stages: ["Stage 1", "Stage 2", "Stage 3"],
  },
};

const EXAMPLE_STAGES = [
  "Call session initiation",
  "Greeting playback (TTS)",
  "Barge-in / interruption detection",
  "Caller speech transcription (ASR)",
  "Dialogue orchestration (scripted vs generated turn logic)",
  "LLM response generation and TTS output",
];

const EXAMPLE_NOTES = {
  "Greeting playback (TTS)": "Greeting audio stops mid-sentence in the call log, no error logged at that point.",
  "Barge-in / interruption detection": "Preview has no live telephony audio, so this stage never gets exercised there. Possible that call audio noise or silence is triggering a false interruption.",
  "Dialogue orchestration (scripted vs generated turn logic)": "After the interruption point, every turn comes from the LLM path rather than the scripted flow, consistent with the orchestrator treating the greeting as caller-interrupted and handing off early.",
};

const EXAMPLE_FAILURE = "On a live call, the scripted greeting was cut off partway through. Every turn after that point came from agent-generated dialogue instead of the expected scripted flow, which makes it look like a prompt issue. Bot preview testing of the same greeting and flow worked correctly with no interruption. This only shows up in production call logs, not in preview.";

const EXAMPLE_RESULT = {
  summary:
    "A false barge-in triggered by live call audio noise or silence is the most likely root cause, causing the orchestrator to treat the greeting as interrupted and exit the scripted flow prematurely.",
  stages: [
    {
      name: "Call session initiation",
      probability: 3,
      reasoning:
        "Nothing in the failure description points to session setup. The call connects and the greeting starts playing normally, which rules out a failure this early in the pipeline.",
      suggestedTest:
        "Confirm session initiation logs show a clean handshake on the failing call, with no retries or delayed connection events before the greeting starts.",
    },
    {
      name: "Greeting playback (TTS)",
      probability: 12,
      reasoning:
        "The greeting audio does cut off, but the call log shows no TTS error or synthesis failure at that point. The interruption looks like an external signal stopping playback rather than the playback engine failing on its own.",
      suggestedTest:
        "Play the same greeting text through the TTS engine in isolation, outside a live call, and confirm it completes without truncation.",
    },
    {
      name: "Barge-in / interruption detection",
      probability: 72,
      reasoning:
        "The operator note directly identifies that live telephony introduces audio noise or silence that preview never exercises, which explains why the failure is production only. A false positive here would immediately signal the orchestrator to stop playback and treat the caller as having spoken, cutting the greeting mid-sentence and handing off to the LLM path exactly as observed. This stage has the strongest alignment with every symptom and with the environment difference between production and preview.",
      suggestedTest:
        "Enable verbose barge-in event logging on production calls and replay a recorded failing call's audio stream through the barge-in detector in isolation. Check whether an interruption event fires during the greeting with no real caller speech present, and compare the ambient noise or silence levels at the trigger point against the configured sensitivity threshold.",
    },
    {
      name: "Caller speech transcription (ASR)",
      probability: 5,
      reasoning:
        "If ASR were misfiring independently, you would expect garbled or nonsense transcriptions feeding into the LLM turns. The described symptom is a clean handoff to agent-generated dialogue, not a transcription error, which points elsewhere.",
      suggestedTest:
        "Pull the ASR transcript for the moment of interruption and check whether it captured real caller audio or an empty, noise-only segment.",
    },
    {
      name: "Dialogue orchestration (scripted vs generated turn logic)",
      probability: 6,
      reasoning:
        "The orchestrator's behaviour after the interruption, handing off to agent-generated turns, is consistent with it correctly following its own rules once it believes the caller has spoken. That points to it reacting to a bad signal from an earlier stage rather than containing the fault itself.",
      suggestedTest:
        "Trace one failing call end to end and confirm the orchestrator only switches to generated dialogue after receiving an interruption event, not on a timer or independent condition.",
    },
    {
      name: "LLM response generation and TTS output",
      probability: 2,
      reasoning:
        "The generated responses reportedly sound coherent, just unexpected in context. That is consistent with the LLM path working correctly once it has been handed control, not with a fault in generation itself.",
      suggestedTest:
        "Review the actual generated responses on a failing call for coherence and relevance. If they are sound answers to what the system believed the caller said, this stage is likely not at fault.",
    },
  ],
};

function band(p) {
  if (p >= 51) return { fill: CORAL, textColor: PAPER, label: "Prime suspect" };
  if (p >= 21) return { fill: MUSTARD, textColor: INK, label: "Uncertain" };
  return { fill: "transparent", textColor: INK, label: "Likely clear", border: true };
}

export default function RootCauseDetector() {
  const [templateKey, setTemplateKey] = useState(null);
  const [stages, setStages] = useState([]);
  const [notes, setNotes] = useState({});
  const [showNotes, setShowNotes] = useState(false);
  const [failureDescription, setFailureDescription] = useState("");
  const [showExplainer, setShowExplainer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [activeStage, setActiveStage] = useState(null);
  const [isExample, setIsExample] = useState(false);
  const [apiKey, setApiKey] = useState("");

  function pickTemplate(key) {
    setTemplateKey(key);
    setStages(TEMPLATES[key].stages.slice());
    setNotes({});
    setResult(null);
    setActiveStage(null);
    setError(null);
    setIsExample(false);
  }

  function loadExample() {
    setTemplateKey("custom");
    setStages(EXAMPLE_STAGES.slice());
    setNotes({ ...EXAMPLE_NOTES });
    setFailureDescription(EXAMPLE_FAILURE);
    setShowNotes(true);
    setError(null);
    setResult(EXAMPLE_RESULT);
    const top = EXAMPLE_RESULT.stages.reduce(
      (bestIdx, s, i, arr) => (s.probability > arr[bestIdx].probability ? i : bestIdx),
      0
    );
    setActiveStage(top);
    setIsExample(true);
  }

  function renameStage(i, value) {
    const next = stages.slice();
    next[i] = value;
    setStages(next);
  }

  function removeStage(i) {
    setStages(stages.filter((_, idx) => idx !== i));
  }

  function addStage() {
    setStages([...stages, `Stage ${stages.length + 1}`]);
  }

  function reset() {
    setTemplateKey(null);
    setStages([]);
    setNotes({});
    setFailureDescription("");
    setResult(null);
    setActiveStage(null);
    setError(null);
    setIsExample(false);
  }

  async function runDiagnosis() {
    if (!failureDescription.trim() || stages.length < 2) return;
    if (!apiKey.trim()) {
      setError("Add your Anthropic API key above to run a live diagnosis, or load the worked example instead.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setActiveStage(null);
    setIsExample(false);

    const stageList = stages
      .map((s, i) => `${i + 1}. ${s}${notes[s] ? ` — operator note: ${notes[s]}` : ""}`)
      .join("\n");

    const prompt = `You are analysing a suspected failure in an AI agent workflow to identify which stage most likely caused it.

Workflow stages, in order, with any operator notes attached:
${stageList}

Failure description from the operator:
"""
${failureDescription.trim()}
"""

Task: estimate how likely each stage is to be the root cause of this failure. Give each stage an integer probability from 0 to 100. Spread the probabilities so they actually differentiate the stages rather than clustering them all near the same value. For every stage, write two to three sentences of reasoning grounded in the description and any notes given, and suggest one concrete diagnostic test an engineer could run to confirm or rule out that stage.

Respond with only valid JSON, no markdown fences, no other text, in exactly this shape:
{"summary": "one sentence synthesis of the likely root cause", "stages": [{"name": "exact stage name", "probability": 0, "reasoning": "text", "suggestedTest": "text"}]}`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey.trim(),
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1500,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!response.ok) {
        const errBody = await response.json().catch(() => null);
        throw new Error(errBody?.error?.message || `Request failed (${response.status})`);
      }
      const data = await response.json();
      const text = (data.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
      const top = parsed.stages.reduce(
        (bestIdx, s, i, arr) => (s.probability > arr[bestIdx].probability ? i : bestIdx),
        0
      );
      setActiveStage(top);
    } catch (err) {
      setError(err.message && err.message !== "Failed to fetch" ? err.message : "Diagnosis failed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const canRun = templateKey && stages.length >= 2 && failureDescription.trim().length > 0;
  const topIndex = result
    ? result.stages.reduce(
        (bestIdx, s, i, arr) => (s.probability > arr[bestIdx].probability ? i : bestIdx),
        0
      )
    : null;

  return (
    <div
      style={{
        fontFamily: "'IBM Plex Sans', sans-serif",
        background: PAPER,
        backgroundImage:
          "repeating-linear-gradient(0deg, rgba(0,0,0,0.025) 0px, rgba(0,0,0,0.025) 1px, transparent 1px, transparent 3px)",
        color: INK,
        minHeight: "100%",
        padding: "32px 20px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Special+Elite&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;600&display=swap');
        .rcd-btn { cursor: pointer; border: 1.5px solid ${INK}; background: transparent; color: ${INK};
          font-family: 'IBM Plex Sans', sans-serif; font-size: 16px; padding: 9px 14px; transition: background 0.15s, color 0.15s; }
        .rcd-btn:hover { background: ${INK}; color: ${PAPER}; }
        .rcd-btn-solid { cursor: pointer; border: none; background: ${NAVY}; color: ${PAPER};
          font-family: 'IBM Plex Sans', sans-serif; font-size: 17px; font-weight: 600; padding: 12px 22px; }
        .rcd-btn-solid:disabled { background: #b9b3a0; cursor: not-allowed; }
        .rcd-btn-example { cursor: pointer; border: 1.5px dashed ${TEAL}; background: transparent; color: ${TEAL};
          font-family: 'IBM Plex Sans', sans-serif; font-size: 15px; font-weight: 500; padding: 9px 14px; }
        .rcd-btn-example:hover { background: ${TEAL}; color: ${PAPER}; }
        .rcd-input { font-family: 'IBM Plex Sans', sans-serif; font-size: 16px; border: none; border-bottom: 1.5px solid ${INK};
          background: transparent; color: ${INK}; padding: 4px 2px; width: 100%; }
        .rcd-input:focus { outline: none; border-bottom-color: ${CORAL}; }
        .rcd-textarea { font-family: 'IBM Plex Sans', sans-serif; font-size: 16px; border: 1.5px solid ${INK};
          background: ${PAPER_DARK}; color: ${INK}; padding: 10px; width: 100%; resize: vertical; }
        .rcd-textarea:focus { outline: none; border-color: ${CORAL}; }
        .rcd-chip { cursor: pointer; text-align: left; flex: 0 0 auto; min-width: 118px;
          font-family: 'IBM Plex Sans', sans-serif; padding: 8px 10px; }
        @keyframes rcd-stamp-in { from { opacity: 0; transform: rotate(-1.2deg) scale(1.2); } to { opacity: 1; transform: rotate(-1.2deg) scale(1); } }
        @keyframes rcd-chip-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        <div style={{ borderBottom: `2px solid ${INK}`, paddingBottom: 16, marginBottom: 24 }}>
          <h1
            style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: 32,
              margin: 0,
              letterSpacing: 0.5,
            }}
          >
            Root Cause Detector
          </h1>
          <p style={{ fontSize: 16, margin: "8px 0 0", maxWidth: 520, lineHeight: 1.5 }}>
            Trace a failure back through an AI agent's pipeline and see which stage most
            likely caused it.
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <button
              className="rcd-btn"
              style={{ fontSize: 14, padding: "6px 10px" }}
              onClick={() => setShowExplainer(!showExplainer)}
            >
              {showExplainer ? "Hide explanation" : "What does this do?"}
            </button>
            <button className="rcd-btn-example" onClick={loadExample}>
              Load a worked example
            </button>
          </div>
          {showExplainer && (
            <p style={{ fontSize: 15, lineHeight: 1.6, marginTop: 10, maxWidth: 560 }}>
              You describe the stages an AI agent's workflow passes through and what went
              wrong when it failed. Claude reads that description and estimates how likely
              each stage is to be the one that caused the failure, with reasoning and a test
              you can run to check. Treat the result as a place to start digging, not a
              verdict. No API key handy? Use "Load a worked example" above to see a full
              case, inputs and diagnosis, from a real voice-agent incident.
            </p>
          )}
        </div>

        <section style={{ marginBottom: 28 }}>
          <label
            style={{
              fontSize: 14,
              color: TEAL,
              fontFamily: "'IBM Plex Mono', monospace",
              display: "block",
              marginBottom: 6,
            }}
          >
            your anthropic api key (for a live diagnosis)
          </label>
          <input
            type="password"
            className="rcd-input"
            placeholder="sk-ant-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{ maxWidth: 360 }}
          />
          <p style={{ fontSize: 13, color: "#6b6656", margin: "6px 0 0" }}>
            Sent directly from your browser to Anthropic for this request only. Not stored,
            not sent anywhere else. Skip this and use "Load a worked example" instead if you
            don't have one handy.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: "'Special Elite', monospace", fontSize: 19, margin: "0 0 10px" }}>
            Step 1: pick the workflow shape
          </h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.entries(TEMPLATES).map(([key, t]) => (
              <button
                key={key}
                className="rcd-btn"
                style={
                  templateKey === key
                    ? { background: NAVY, color: PAPER, borderColor: NAVY }
                    : {}
                }
                onClick={() => pickTemplate(key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>

        {templateKey && (
          <>
            <section style={{ marginBottom: 28 }}>
              <h2 style={{ fontFamily: "'Special Elite', monospace", fontSize: 19, margin: "0 0 10px" }}>
                Step 2: confirm the stages
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {stages.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 14,
                        color: TEAL,
                        width: 18,
                      }}
                    >
                      {i + 1}
                    </span>
                    <input
                      className="rcd-input"
                      value={s}
                      onChange={(e) => renameStage(i, e.target.value)}
                    />
                    <button
                      className="rcd-btn"
                      style={{ padding: "4px 9px", fontSize: 14 }}
                      onClick={() => removeStage(i)}
                    >
                      remove
                    </button>
                  </div>
                ))}
                <button
                  className="rcd-btn"
                  style={{ alignSelf: "flex-start", fontSize: 15 }}
                  onClick={addStage}
                >
                  add a stage
                </button>
              </div>
            </section>

            <section style={{ marginBottom: 28 }}>
              <h2 style={{ fontFamily: "'Special Elite', monospace", fontSize: 19, margin: "0 0 10px" }}>
                Step 3: describe what went wrong
              </h2>
              <textarea
                className="rcd-textarea"
                rows={4}
                placeholder="What did you observe? Include the user's request, what the agent actually returned, and anything that looked off."
                value={failureDescription}
                onChange={(e) => setFailureDescription(e.target.value)}
              />
              <button
                className="rcd-btn"
                style={{ marginTop: 10, fontSize: 15 }}
                onClick={() => setShowNotes(!showNotes)}
              >
                {showNotes ? "hide per-stage notes" : "add per-stage notes (optional)"}
              </button>
              {showNotes && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
                  {stages.map((s, i) => (
                    <div key={i}>
                      <label style={{ fontSize: 14, color: TEAL, fontFamily: "'IBM Plex Mono', monospace" }}>
                        {s}
                      </label>
                      <textarea
                        className="rcd-textarea"
                        rows={2}
                        placeholder="Log excerpt, trace detail, or anything relevant to this stage"
                        value={notes[s] || ""}
                        onChange={(e) => setNotes({ ...notes, [s]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div style={{ marginBottom: 32, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <button className="rcd-btn-solid" disabled={!canRun || loading} onClick={runDiagnosis}>
                {loading ? "Running diagnosis..." : "Run diagnosis"}
              </button>
              <button className="rcd-btn" style={{ fontSize: 15 }} onClick={reset}>
                start over
              </button>
              {isExample && (
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: TEAL }}>
                  showing a worked example, not a live diagnosis
                </span>
              )}
            </div>
          </>
        )}

        {error && <p style={{ color: CORAL, fontSize: 16, marginBottom: 20 }}>{error}</p>}

        {result && (
          <section>
            <div style={{ borderTop: `2px solid ${INK}`, paddingTop: 20, marginBottom: 24 }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: TEAL }}>
                case summary
              </span>
              <p style={{ fontSize: 18, margin: "6px 0 0", lineHeight: 1.5 }}>{result.summary}</p>
            </div>

            <div style={{ position: "relative", marginBottom: 8, maxWidth: 460 }}>
              <div
                onClick={() => setActiveStage(topIndex)}
                style={{
                  cursor: "pointer",
                  background: CORAL,
                  color: PAPER,
                  border: `4px double ${INK}`,
                  padding: "24px 28px",
                  transform: "rotate(-1.2deg)",
                  animation: "rcd-stamp-in 0.4s ease-out",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: -14,
                    right: 4,
                    transform: "rotate(5deg)",
                    background: PAPER,
                    color: CORAL,
                    border: `2px solid ${CORAL}`,
                    padding: "3px 10px",
                    fontFamily: "'Special Elite', monospace",
                    fontSize: 14,
                    letterSpacing: 1,
                  }}
                >
                  prime suspect
                </div>
                <div style={{ fontSize: 15, opacity: 0.9, marginBottom: 6, maxWidth: 340 }}>
                  {result.stages[topIndex].name}
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 48, fontWeight: 600, lineHeight: 1 }}>
                  {result.stages[topIndex].probability}%
                </div>
              </div>
            </div>

            <p style={{ fontSize: 14, color: "#6b6656", margin: "18px 0 10px" }}>
              full pipeline, in order — tap any stage for its case notes
            </p>
            <div style={{ display: "flex", alignItems: "stretch", gap: 2, overflowX: "auto", marginBottom: 24, paddingBottom: 6 }}>
              {result.stages.flatMap((s, i) => {
                const b = band(s.probability);
                const isTop = i === topIndex;
                const chip = (
                  <button
                    key={`chip-${i}`}
                    className="rcd-chip"
                    onClick={() => setActiveStage(activeStage === i ? null : i)}
                    style={{
                      background: b.fill,
                      color: b.textColor,
                      border: b.border ? `1.5px dashed ${INK}` : `1.5px solid ${INK}`,
                      opacity: isTop ? 1 : 0.82,
                      outline: activeStage === i ? `2px solid ${NAVY}` : "none",
                      outlineOffset: 2,
                      animation: "rcd-chip-in 0.3s ease-out",
                      animationDelay: `${i * 0.05}s`,
                      animationFillMode: "backwards",
                    }}
                  >
                    <div style={{ fontSize: 12, opacity: 0.75 }}>{i + 1}</div>
                    <div style={{ fontSize: 13, lineHeight: 1.3, marginBottom: 4 }}>{s.name}</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 18, fontWeight: 600 }}>
                      {s.probability}%
                    </div>
                  </button>
                );
                if (i < result.stages.length - 1) {
                  return [
                    chip,
                    <span key={`arrow-${i}`} style={{ alignSelf: "center", color: "#a89f87", fontSize: 17, padding: "0 2px" }}>
                      ›
                    </span>,
                  ];
                }
                return [chip];
              })}
            </div>

            {activeStage !== null && (
              <div
                style={{
                  border: `1.5px solid ${INK}`,
                  borderTop: `5px solid ${band(result.stages[activeStage].probability).fill === "transparent" ? TEAL : band(result.stages[activeStage].probability).fill}`,
                  padding: 18,
                  background: PAPER_DARK,
                  marginBottom: 24,
                }}
              >
                <h3 style={{ fontFamily: "'Special Elite', monospace", fontSize: 18, margin: "0 0 10px" }}>
                  {result.stages[activeStage].name}
                </h3>
                <p style={{ fontSize: 16, lineHeight: 1.6, margin: "0 0 12px" }}>
                  {result.stages[activeStage].reasoning}
                </p>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: TEAL }}>
                  suggested test
                </span>
                <p style={{ fontSize: 16, lineHeight: 1.6, margin: "4px 0 0" }}>
                  {result.stages[activeStage].suggestedTest}
                </p>
              </div>
            )}
          </section>
        )}

        <div style={{ borderTop: `1px solid ${INK}`, marginTop: 40, paddingTop: 14 }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: "#6b6656", lineHeight: 1.6 }}>
            A live diagnosis calls the Anthropic API directly from your browser using the key
            you provide above. It is a heuristic reading of what you describe, not a verified
            finding. Nothing typed here, key included, is stored once this tab closes. The
            worked example is a saved case, not a live call to Claude.
          </p>
        </div>
      </div>
    </div>
  );
}
