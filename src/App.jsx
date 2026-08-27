import React, { useState } from 'react';
import { Plus, Trash2, Loader2, Stamp, RotateCcw, Info, Key, Eye, EyeOff } from 'lucide-react';

const CONFIDENCE_STYLES = {
  high: { color: '#1F6F5C', label: 'HIGH CONFIDENCE' },
  medium: { color: '#B8862E', label: 'MEDIUM CONFIDENCE' },
  low: { color: '#C0392B', label: 'LOW CONFIDENCE' },
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const DEFAULT_CONTEXT =
  "B2B SaaS customer support chatbot for a mid-market platform. About 8,000 monthly active users, $4,800 average annual contract value, support team of 6.";

const DEFAULT_CATEGORIES = [
  {
    id: uid(),
    name: 'Confidently wrong refund answer',
    frequency: 40,
    description:
      "Bot states the wrong refund policy with full confidence; a human agent has to step in after the customer complains.",
  },
  {
    id: uid(),
    name: 'Missed escalation',
    frequency: 25,
    description:
      "Bot doesn't recognise repeated frustration and never hands off to a human agent.",
  },
  {
    id: uid(),
    name: 'Hallucinated integration status',
    frequency: 15,
    description:
      "Bot tells an enterprise user a feature or integration is live when it isn't, which turns into a support escalation.",
  },
];

export default function App() {
  const [context, setContext] = useState(DEFAULT_CONTEXT);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [results, setResults] = useState(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [error, setError] = useState(null);
  const [showIntro, setShowIntro] = useState(true);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('coe_api_key') || '');
  const [showKey, setShowKey] = useState(false);
  const [openedDate] = useState(() =>
    new Date()
      .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      .toUpperCase()
  );

  function updateCategory(id, field, value) {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
    setResults(null);
  }

  function addCategory() {
    setCategories((prev) => [...prev, { id: uid(), name: '', frequency: 1, description: '' }]);
    setResults(null);
  }

  function removeCategory(id) {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setResults(null);
  }

  function saveApiKey(value) {
    setApiKey(value);
    if (value) {
      localStorage.setItem('coe_api_key', value);
    } else {
      localStorage.removeItem('coe_api_key');
    }
  }

  function resetLedger() {
    setContext(DEFAULT_CONTEXT);
    setCategories(DEFAULT_CATEGORIES);
    setResults(null);
    setError(null);
  }

  async function estimateExposure() {
    setError(null);
    if (!apiKey.trim()) {
      setError('Add your Anthropic API key above before stamping the ledger.');
      return;
    }
    const validCategories = categories.filter((c) => c.name.trim());
    if (!validCategories.length) {
      setError('Add at least one failure category with a name before stamping the ledger.');
      return;
    }
    setIsEstimating(true);
    setResults(null);

    const systemPrompt = `You are a conservative AI-product risk actuary helping a product manager prioritise where to invest in evaluation and guardrails. Given a product's business context and a list of AI failure categories, estimate the realistic USD cost PER INCIDENT for each category (not a monthly total). Ground every estimate in the stated business context. Be conservative rather than dramatic. Respond with ONLY a JSON array, no markdown fences, no prose before or after, matching exactly this schema:
[{"id": "string matching the given id", "cost_low": number, "cost_high": number, "confidence": "high" | "medium" | "low", "drivers": ["short phrase", "short phrase"], "rationale": "one sentence, under 20 words"}]`;

    const userPrompt = `Business context:
${context}

Failure categories:
${validCategories
  .map(
    (c) =>
      `- id: ${c.id} | name: ${c.name} | est. frequency: ${c.frequency || 0}/month | description: ${
        c.description || 'n/a'
      }`
  )
  .join('\n')}`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey.trim(),
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          // Update this if Anthropic renames or retires the model.
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error('bad key');
        throw new Error('bad response');
      }

      const data = await response.json();
      const text = (data.content || [])
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('\n');

      const cleaned = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      const merged = validCategories.map((c) => {
        const match = parsed.find((p) => p.id === c.id) || {};
        const low = Number(match.cost_low) || 0;
        const high = Number(match.cost_high) || 0;
        const midpoint = (low + high) / 2;
        const monthlyExposure = midpoint * (Number(c.frequency) || 0);
        return {
          ...c,
          costLow: low,
          costHigh: high,
          confidence: match.confidence || 'medium',
          drivers: match.drivers || [],
          rationale: match.rationale || '',
          monthlyExposure,
        };
      });

      merged.sort((a, b) => b.monthlyExposure - a.monthlyExposure);
      setResults(merged);
    } catch (err) {
      if (err.message === 'bad key') {
        setError('That API key was rejected. Check it at console.anthropic.com and try again.');
      } else {
        setError('Could not estimate exposure — the response may not have parsed cleanly. Try again.');
      }
    } finally {
      setIsEstimating(false);
    }
  }

  const total = results ? results.reduce((sum, r) => sum + r.monthlyExposure, 0) : 0;
  const fmt = (n) => '$' + Math.round(n).toLocaleString('en-US');

  return (
    <div className="coe-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Special+Elite&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

        .coe-root {
          background: linear-gradient(180deg, #f6f2e6 0%, #ece4d0 100%);
          min-height: 100%;
          padding: 56px 20px;
          font-family: 'IBM Plex Sans', sans-serif;
          box-sizing: border-box;
        }
        .coe-root * { box-sizing: border-box; }

        .coe-page {
          max-width: 900px;
          margin: 0 auto;
          background: #fbf8ef;
          border-radius: 10px;
          box-shadow: 0 24px 60px rgba(60,50,20,0.16), 0 1px 0 rgba(255,255,255,0.6) inset;
          overflow: hidden;
          position: relative;
          color: #23241f;
        }

        .coe-banner {
          background: linear-gradient(125deg, #24816c 0%, #14453a 100%);
          padding: 34px 46px 30px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          flex-wrap: wrap;
        }
        .coe-eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11.5px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #e8c77f;
          margin-bottom: 9px;
          animation: coe-fadein 0.5s ease both;
        }
        .coe-title {
          font-family: 'Special Elite', monospace;
          font-size: 36px;
          color: #fbf8ef;
          margin: 0 0 10px;
          letter-spacing: 0.01em;
          animation: coe-fadein 0.5s ease 0.06s both;
        }
        .coe-subtitle {
          font-size: 14.5px;
          line-height: 1.65;
          color: rgba(251,248,239,0.82);
          max-width: 520px;
          margin: 0;
          animation: coe-fadein 0.5s ease 0.12s both;
        }
        .coe-opened-tag {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10.5px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #e8c77f;
          border: 1px solid rgba(232,199,127,0.55);
          border-radius: 20px;
          padding: 7px 13px;
          white-space: nowrap;
          animation: coe-fadein 0.5s ease 0.18s both;
        }
        .coe-opened-tag b { color: #fbf8ef; }

        @keyframes coe-fadein {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .coe-eyebrow, .coe-title, .coe-subtitle, .coe-opened-tag { animation: none; }
        }

        .coe-body {
          background:
            repeating-linear-gradient(
              to bottom,
              transparent 0px,
              transparent 30px,
              rgba(31,111,92,0.06) 31px
            ),
            #fbf8ef;
          padding: 34px 46px 40px;
        }

        .coe-intro {
          background: rgba(31,111,92,0.07);
          border: 1px solid rgba(31,111,92,0.28);
          border-left: 4px solid #1f6f5c;
          border-radius: 6px;
          padding: 18px 20px 16px;
          margin-bottom: 28px;
        }
        .coe-intro-title {
          display: flex;
          align-items: center;
          gap: 7px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11.5px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #1f6f5c;
          margin-bottom: 12px;
        }
        .coe-intro ol {
          margin: 0 0 14px;
          padding-left: 18px;
          font-size: 13.5px;
          line-height: 1.65;
          color: #33352d;
        }
        .coe-intro li { margin-bottom: 5px; }
        .coe-intro-note {
          font-size: 12.5px;
          line-height: 1.6;
          color: #4a4a3f;
          margin: 0;
        }
        .coe-intro-note strong { color: #23241f; }
        .coe-intro-toggle {
          background: none;
          border: none;
          color: #1f6f5c;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          margin-top: 12px;
          padding: 0;
          text-decoration: underline;
        }
        .coe-intro-reopen {
          display: inline-block;
          margin-bottom: 22px;
          background: none;
          border: none;
          color: #1f6f5c;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          text-decoration: underline;
          padding: 0;
        }
        .coe-data-badge {
          display: inline-flex;
          align-items: center;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10.5px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #8a7f68;
        }

        .coe-rule {
          border: none;
          border-top: 1px solid rgba(28,31,29,0.16);
          margin: 28px 0;
        }

        .coe-field-label {
          display: block;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10.5px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #8a7f68;
          margin-bottom: 8px;
        }
        .coe-key-row {
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid rgba(28,31,29,0.22);
          padding-bottom: 10px;
          margin-bottom: 8px;
        }
        .coe-key-icon { color: #8a7f68; flex-shrink: 0; }
        .coe-key-input {
          flex: 1;
          background: transparent;
          border: none;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13.5px;
          color: #23241f;
          padding: 3px 2px;
        }
        .coe-key-input:focus-visible { outline: 2px solid #b8862e; outline-offset: 3px; }
        .coe-key-toggle {
          background: none;
          border: none;
          color: #8a7f68;
          cursor: pointer;
          padding: 2px;
          flex-shrink: 0;
        }
        .coe-key-toggle:hover { color: #23241f; }
        .coe-key-toggle:focus-visible { outline: 2px solid #8a7f68; }
        .coe-key-note {
          font-size: 12px;
          line-height: 1.6;
          color: #8a7f68;
          margin: 0 0 24px;
        }
        .coe-key-note a { color: #1f6f5c; }
        .coe-key-forget {
          background: none;
          border: none;
          color: #c0392b;
          font-size: 12px;
          text-decoration: underline;
          cursor: pointer;
          padding: 0;
          font-family: 'IBM Plex Sans', sans-serif;
        }

        .coe-context {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(28,31,29,0.22);
          font-family: 'IBM Plex Sans', sans-serif;
          font-size: 14.5px;
          line-height: 1.55;
          color: #23241f;
          padding: 4px 2px 12px;
          resize: vertical;
          min-height: 54px;
        }
        .coe-context:focus-visible {
          outline: 2px solid #b8862e;
          outline-offset: 3px;
        }

        .coe-cat-headrow {
          display: grid;
          grid-template-columns: 1.1fr 90px 1.9fr 28px;
          gap: 14px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10.5px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #8a7f68;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(28,31,29,0.22);
        }
        .coe-cat-row {
          display: grid;
          grid-template-columns: 1.1fr 90px 1.9fr 28px;
          gap: 14px;
          align-items: start;
          padding: 13px 8px;
          margin: 0 -8px;
          border-bottom: 1px solid rgba(28,31,29,0.1);
          border-radius: 6px;
          transition: background 0.15s ease;
        }
        .coe-cat-row:hover { background: rgba(31,111,92,0.05); }
        .coe-cat-row input,
        .coe-cat-row textarea {
          width: 100%;
          background: transparent;
          border: none;
          font-family: 'IBM Plex Sans', sans-serif;
          font-size: 13.5px;
          color: #23241f;
          padding: 3px 2px;
          resize: none;
        }
        .coe-cat-row input[type='number'] {
          font-family: 'IBM Plex Mono', monospace;
        }
        .coe-cat-row input:focus-visible,
        .coe-cat-row textarea:focus-visible {
          outline: 2px solid #b8862e;
          outline-offset: 2px;
          background: rgba(184,134,46,0.1);
        }
        .coe-remove-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #c0392b;
          opacity: 0.55;
          padding: 4px;
          margin-top: 2px;
        }
        .coe-remove-btn:hover { opacity: 1; }
        .coe-remove-btn:focus-visible { outline: 2px solid #c0392b; border-radius: 2px; }

        .coe-add-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          border-top: 1px dashed rgba(184,134,46,0.65);
          width: 100%;
          padding-top: 13px;
          margin-top: 4px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #b8862e;
          cursor: pointer;
        }
        .coe-add-btn:hover { color: #93691f; }
        .coe-add-btn:focus-visible { outline: 2px solid #b8862e; }

        .coe-actions {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px 20px;
          margin-top: 32px;
        }
        .coe-stamp-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(135deg, #e0b364 0%, #b8862e 100%);
          color: #23241f;
          border: none;
          padding: 15px 26px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          border-radius: 6px;
          box-shadow: 0 8px 18px rgba(184,134,46,0.35), inset 0 1px 0 rgba(255,255,255,0.4);
          transition: transform 0.08s ease, box-shadow 0.15s ease, background 0.15s ease;
        }
        .coe-stamp-btn:hover:not(:disabled) { background: linear-gradient(135deg, #e8bd70, #c2913a); }
        .coe-stamp-btn:active:not(:disabled) {
          transform: translateY(2px) scale(0.98);
          box-shadow: 0 3px 8px rgba(184,134,46,0.35), inset 0 1px 0 rgba(255,255,255,0.4);
        }
        .coe-stamp-btn:disabled { opacity: 0.6; cursor: default; }
        .coe-stamp-btn:focus-visible { outline: 2px solid #1f6f5c; outline-offset: 2px; }

        .coe-reset-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: #8a7f68;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
        }
        .coe-reset-btn:hover { color: #23241f; }
        .coe-reset-btn:focus-visible { outline: 2px solid #8a7f68; }

        .coe-spin { animation: coe-spin 0.9s linear infinite; }
        @keyframes coe-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .coe-error {
          margin-top: 18px;
          border: 1px dashed #c0392b;
          color: #c0392b;
          border-radius: 6px;
          font-size: 13px;
          padding: 10px 14px;
          font-family: 'IBM Plex Sans', sans-serif;
        }

        .coe-results-head {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11.5px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #8a7f68;
          margin-bottom: 6px;
        }

        .coe-result-row {
          display: grid;
          grid-template-columns: 1.7fr 1fr 1fr;
          gap: 16px;
          align-items: start;
          padding: 20px 8px;
          margin: 0 -8px;
          border-bottom: 1px solid rgba(28,31,29,0.1);
          border-radius: 6px;
          opacity: 0;
          animation: coe-rise 0.45s ease forwards;
        }
        @keyframes coe-rise {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .coe-result-row { animation: none; opacity: 1; }
        }

        .coe-result-name {
          font-weight: 700;
          font-size: 15px;
          margin-bottom: 4px;
        }
        .coe-result-rationale {
          font-size: 12.5px;
          font-style: italic;
          color: #5c5a4d;
          line-height: 1.5;
          margin-bottom: 9px;
        }
        .coe-drivers {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #8a7f68;
          margin-bottom: 10px;
        }

        .coe-bar-track {
          height: 6px;
          width: 100%;
          max-width: 220px;
          background: rgba(28,31,29,0.08);
          border-radius: 4px;
          overflow: hidden;
        }
        .coe-bar-fill {
          height: 100%;
          border-radius: 4px;
        }

        .coe-result-range {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13.5px;
          color: #23241f;
        }
        .coe-result-range-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #8a7f68;
          margin-bottom: 4px;
        }

        .coe-confidence-tag {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-top: 10px;
          border-radius: 20px;
          padding: 4px 12px 4px 10px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.07em;
        }

        .coe-exposure {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 19px;
          font-weight: 700;
          color: #c0392b;
          text-align: right;
        }
        .coe-exposure-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #8a7f68;
          text-align: right;
          margin-bottom: 4px;
        }

        .coe-total-plate {
          background: linear-gradient(125deg, #c0392b 0%, #7d2419 100%);
          padding: 28px 46px 32px;
          display: flex;
          align-items: center;
          gap: 22px;
        }
        .coe-seal {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: rgba(251,248,239,0.16);
          border: 1.5px solid rgba(251,248,239,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fbf8ef;
          flex-shrink: 0;
        }
        .coe-total-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #f4cdc4;
          margin-bottom: 2px;
        }
        .coe-total-amount {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 52px;
          font-weight: 700;
          color: #fbf8ef;
          line-height: 1;
        }

        .coe-footnote {
          margin-top: 30px;
          font-size: 11.5px;
          line-height: 1.65;
          color: #8a7f68;
          font-style: italic;
        }

        @media (max-width: 640px) {
          .coe-banner { padding: 28px 24px 24px; }
          .coe-body { padding: 28px 24px 32px; }
          .coe-title { font-size: 26px; }
          .coe-total-plate { padding: 24px 24px 28px; }
          .coe-total-amount { font-size: 38px; }
          .coe-seal { width: 46px; height: 46px; }
          .coe-cat-headrow { display: none; }
          .coe-cat-row {
            grid-template-columns: 1fr 28px;
            grid-template-areas: "name remove" "freq remove" "desc desc";
            row-gap: 4px;
          }
          .coe-cat-row > input:nth-of-type(1) { grid-area: name; }
          .coe-cat-row > input:nth-of-type(2) { grid-area: freq; }
          .coe-cat-row > textarea { grid-area: desc; }
          .coe-remove-btn { grid-area: remove; }
          .coe-result-row { grid-template-columns: 1fr; }
          .coe-exposure, .coe-exposure-label, .coe-result-range { text-align: left; }
        }
      `}</style>

      <div className="coe-page">
        <div className="coe-banner">
          <div>
            <div className="coe-eyebrow">General Ledger — Product Risk Office</div>
            <h1 className="coe-title">Cost-of-Error Estimator</h1>
            <p className="coe-subtitle">
              List what your AI product gets wrong and how often. Each category is estimated and ranked
              by monthly exposure, so you know where eval and guardrail investment actually pays off.
            </p>
          </div>
          <div className="coe-opened-tag">
            Opened <b>{openedDate}</b>
          </div>
        </div>

        <div className="coe-body">
          {showIntro ? (
            <div className="coe-intro">
              <div className="coe-intro-title">
                <Info size={13} /> First time here? Start with this
              </div>
              <ol>
                <li>Describe your product below in a sentence or two — who uses it, and roughly how many.</li>
                <li>List the ways your AI gets things wrong, and how often each happens in a typical month.</li>
                <li>
                  Click <strong>Estimate exposure</strong>. Claude reads what you entered and estimates
                  what each mistake probably costs, then ranks them so you can see what's worth fixing
                  first.
                </li>
              </ol>
              <p className="coe-intro-note">
                <strong>Where the numbers come from:</strong> they are not pulled from your real support
                tickets, billing, or CRM data. Claude (Anthropic's AI) estimates each cost based only on
                the context and categories you type in below. Use this to compare failures against each
                other and decide what to fix first — not as an audited financial figure.
              </p>
              <button type="button" className="coe-intro-toggle" onClick={() => setShowIntro(false)}>
                Hide this
              </button>
            </div>
          ) : (
            <button type="button" className="coe-intro-reopen" onClick={() => setShowIntro(true)}>
              How does this work?
            </button>
          )}

          <label className="coe-field-label" htmlFor="coe-key">
            Anthropic API key
          </label>
          <div className="coe-key-row">
            <Key size={15} className="coe-key-icon" />
            <input
              id="coe-key"
              type={showKey ? 'text' : 'password'}
              className="coe-key-input"
              placeholder="sk-ant-…"
              value={apiKey}
              onChange={(e) => saveApiKey(e.target.value)}
            />
            <button
              type="button"
              className="coe-key-toggle"
              onClick={() => setShowKey((v) => !v)}
              aria-label={showKey ? 'Hide key' : 'Show key'}
            >
              {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <p className="coe-key-note">
            Stored only in this browser (localStorage), sent only to Anthropic's API. Get a key at{' '}
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">
              console.anthropic.com
            </a>
            . {apiKey && (
              <button type="button" className="coe-key-forget" onClick={() => saveApiKey('')}>
                Forget key
              </button>
            )}
          </p>

          <label className="coe-field-label" htmlFor="coe-context">
            Account / product context
          </label>
          <textarea
            id="coe-context"
            className="coe-context"
            value={context}
            onChange={(e) => {
              setContext(e.target.value);
              setResults(null);
            }}
            rows={2}
          />

          <hr className="coe-rule" />

          <div className="coe-cat-headrow">
            <span>Failure category</span>
            <span>Freq / mo</span>
            <span>Description</span>
            <span />
          </div>
          {categories.map((c) => (
            <div className="coe-cat-row" key={c.id}>
              <input
                type="text"
                placeholder="e.g. Wrong pricing quoted"
                value={c.name}
                onChange={(e) => updateCategory(c.id, 'name', e.target.value)}
              />
              <input
                type="number"
                min="0"
                value={c.frequency}
                onChange={(e) => updateCategory(c.id, 'frequency', e.target.value)}
              />
              <textarea
                rows={1}
                placeholder="What happens, and who it affects"
                value={c.description}
                onChange={(e) => updateCategory(c.id, 'description', e.target.value)}
              />
              <button
                type="button"
                className="coe-remove-btn"
                onClick={() => removeCategory(c.id)}
                aria-label={`Remove ${c.name || 'this category'}`}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <button type="button" className="coe-add-btn" onClick={addCategory}>
            <Plus size={14} /> Add failure category
          </button>

          <div className="coe-actions">
            <button
              type="button"
              className="coe-stamp-btn"
              onClick={estimateExposure}
              disabled={isEstimating}
            >
              {isEstimating ? <Loader2 size={16} className="coe-spin" /> : <Stamp size={16} />}
              {isEstimating ? 'Stamping ledger…' : 'Estimate exposure'}
            </button>
            <button type="button" className="coe-reset-btn" onClick={resetLedger}>
              <RotateCcw size={13} /> Reset ledger
            </button>
            <span className="coe-data-badge">AI-estimated, not real data</span>
          </div>

          {error && <div className="coe-error">{error}</div>}

          {results && (
            <>
              <hr className="coe-rule" />
              <div className="coe-results-head">Ledger — ranked by monthly exposure</div>
              {results.map((r, i) => {
                const style = CONFIDENCE_STYLES[r.confidence] || CONFIDENCE_STYLES.medium;
                const pct = total > 0 ? Math.max(4, (r.monthlyExposure / total) * 100) : 0;
                return (
                  <div className="coe-result-row" style={{ animationDelay: `${i * 0.07}s` }} key={r.id}>
                    <div>
                      <div className="coe-result-name">{r.name}</div>
                      {r.rationale && <div className="coe-result-rationale">{r.rationale}</div>}
                      {r.drivers.length > 0 && (
                        <div className="coe-drivers">{r.drivers.join(' · ')}</div>
                      )}
                      <div className="coe-bar-track">
                        <div
                          className="coe-bar-fill"
                          style={{ width: `${pct}%`, background: style.color }}
                        />
                      </div>
                      <div
                        className="coe-confidence-tag"
                        style={{ color: style.color, background: `${style.color}1a` }}
                      >
                        <Stamp size={11} /> {style.label}
                      </div>
                    </div>
                    <div>
                      <div className="coe-result-range-label">Cost / incident</div>
                      <div className="coe-result-range">
                        {fmt(r.costLow)}–{fmt(r.costHigh)}
                      </div>
                    </div>
                    <div>
                      <div className="coe-exposure-label">Monthly exposure</div>
                      <div className="coe-exposure">{fmt(r.monthlyExposure)}</div>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {!results && (
            <p className="coe-footnote">
              How the total is worked out: (low + high cost per incident) ÷ 2, multiplied by how often
              that incident happens per month. Every figure on this page is Claude's estimate from what
              you typed in, not a number pulled from your real systems — treat it as a way to prioritise,
              not an audited report.
            </p>
          )}
        </div>

        {results && (
          <>
            <div className="coe-total-plate">
              <div className="coe-seal">
                <Stamp size={22} />
              </div>
              <div>
                <div className="coe-total-label">Total Monthly Exposure</div>
                <div className="coe-total-amount">{fmt(total)}</div>
              </div>
            </div>
            <div className="coe-body" style={{ paddingTop: 22 }}>
              <p className="coe-footnote" style={{ marginTop: 0 }}>
                How the total is worked out: (low + high cost per incident) ÷ 2, multiplied by how often
                that incident happens per month. Every figure on this page is Claude's estimate from what
                you typed in, not a number pulled from your real systems — treat it as a way to
                prioritise, not an audited report.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
