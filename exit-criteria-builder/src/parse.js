// Parses the tagged-line output from the model into a structured plan.
export function parsePlan(text) {
  const plan = { summary: "", stages: [], gaps: [] };
  const byNum = new Map();
  const stageFor = (n) => {
    const key = String(n).trim();
    if (!byNum.has(key)) {
      const s = { num: key, name: `Stage ${key}`, goal: "", criteria: [], stop: "", drafts: [], assumption: "" };
      byNum.set(key, s);
      plan.stages.push(s);
    }
    return byNum.get(key);
  };

  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.replace(/^[\s*\-•`]+/, "").trim();
    if (!line.includes("|")) continue;
    const parts = line.split("|").map((p) => p.trim());
    const tag = parts[0].toUpperCase();
    switch (tag) {
      case "SUMMARY":
        plan.summary = parts.slice(1).join(" ");
        break;
      case "STAGE": {
        const s = stageFor(parts[1]);
        s.name = parts[2] || s.name;
        s.goal = parts.slice(3).join(" ");
        break;
      }
      case "CRIT": {
        const s = stageFor(parts[1]);
        s.criteria.push({
          metric: parts[2] || "",
          threshold: parts[3] || "",
          how: parts[4] || "",
          source: parts[5] || "",
          kind: normaliseKind(parts[6]),
        });
        break;
      }
      case "STOP":
        stageFor(parts[1]).stop = parts.slice(2).join(" ");
        break;
      case "DRAFT":
        stageFor(parts[1]).drafts.push({
          original: parts[2] || "",
          verdict: normaliseVerdict(parts[3]),
          rewrite: parts.slice(4).join(" "),
        });
        break;
      case "ASSUME":
        stageFor(parts[1]).assumption = parts.slice(2).join(" ");
        break;
      case "GAP":
        plan.gaps.push(parts.slice(1).join(" "));
        break;
      default:
        break;
    }
  }
  plan.stages.sort((a, b) => Number(a.num) - Number(b.num));
  return plan;
}

function normaliseKind(k = "") {
  const v = k.toLowerCase();
  if (v.startsWith("lead")) return "Leading";
  if (v.startsWith("lag")) return "Lagging";
  return "Qualitative";
}

function normaliseVerdict(v = "") {
  const x = v.toLowerCase();
  if (x.startsWith("meas")) return "Measurable";
  if (x.startsWith("unm") || x.startsWith("not")) return "Unmeasurable";
  return "Vague";
}

// Deterministic wording check, run in the browser on draft criteria before any model call.
const VAGUE_WORDS = [
  "good", "better", "great", "stable", "enough", "most", "many", "happy", "like", "likes", "love",
  "positive", "smooth", "successful", "success", "works", "working", "robust", "seamless", "intuitive",
  "significant", "improved", "improve", "quickly", "fast", "solid", "healthy", "ready", "strong",
];
const ACTIVITY_WORDS = ["finish", "finished", "complete", "completed", "done", "ship", "shipped", "launch", "launched", "build", "built", "deliver", "delivered"];
const DATE_PATTERN = /\b(by|before|end of|eo[qm])\b.*\b(q[1-4]|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}\/\d{1,2})/i;

export function checkWording(criterion) {
  const text = criterion.trim();
  const lower = text.toLowerCase();
  const words = lower.match(/[a-z']+/g) || [];
  const issues = [];
  const withoutDates = text.replace(/\bq[1-4]\b/gi, "").replace(/\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/g, "").replace(/\b(19|20)\d{2}\b/g, "");
  if (!/\d/.test(withoutDates)) issues.push({ code: "number", label: "No number or threshold" });
  const vague = [...new Set(words.filter((w) => VAGUE_WORDS.includes(w)))];
  if (vague.length) issues.push({ code: "vague", label: `Vague word${vague.length > 1 ? "s" : ""}: ${vague.join(", ")}` });
  const activity = [...new Set(words.filter((w) => ACTIVITY_WORDS.includes(w)))];
  if (activity.length) issues.push({ code: "activity", label: "Describes an activity, not an outcome" });
  if (DATE_PATTERN.test(text)) issues.push({ code: "date", label: "A date is a deadline, not evidence" });
  const hasSource = /(analytics|survey|nps|csat|ticket|crm|log|dashboard|interview|dashboard|funnel|events?)/i.test(text);
  if (!hasSource) issues.push({ code: "source", label: "No data source named" });
  const hard = issues.some((i) => i.code === "number");
  const score = issues.length === 0 ? "Measurable" : hard ? "Unmeasurable" : "Vague";
  return { text, issues, score };
}

export function planToMarkdown(input, plan) {
  const out = [`# Exit criteria: ${input.name}`, "", plan.summary, ""];
  plan.stages.forEach((s) => {
    out.push(`## ${s.num}. ${s.name}`, "", `Goal: ${s.goal}`, "", "| Metric | Threshold | How to measure | Source | Kind |", "|---|---|---|---|---|");
    s.criteria.forEach((c) => out.push(`| ${c.metric} | ${c.threshold} | ${c.how} | ${c.source} | ${c.kind} |`));
    out.push("", `Stop condition: ${s.stop}`);
    if (s.drafts.length) {
      out.push("", "Draft criteria rewritten:");
      s.drafts.forEach((d) => out.push(`- ${d.original} (${d.verdict}) becomes: ${d.rewrite}`));
    }
    if (s.assumption) out.push("", `Check this assumption: ${s.assumption}`);
    out.push("");
  });
  if (plan.gaps.length) {
    out.push("## Gaps across the plan", "");
    plan.gaps.forEach((g) => out.push(`- ${g}`));
  }
  out.push("", "Thresholds are starting points suggested by an AI model, not industry benchmarks. Set them against your own baseline.");
  return out.join("\n");
}
