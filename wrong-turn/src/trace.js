// Wrong Turn: rules engine.
// The model splits a trace into steps and suggests a status and a problem for each.
// Everything below is fixed and printed in the app: the scan, the evidence check,
// which step is the wrong turn, the confidence, the layer, the fix and the ticket.

export const KINDS = ['User message', 'Plan', 'Model reasoning', 'Tool call', 'Tool result', 'Retrieval', 'Handoff', 'Reply', 'System'];
export const STATUSES = ['Fine', 'Suspect', 'Failed'];

export const OUTCOMES = ['Wrong answer', 'Did the wrong thing', 'Looped or stalled', 'Stopped early', 'Made something up', 'Ignored an instruction'];
export const SETUPS = ['One agent with tools', 'Agent with a human handoff', 'Several agents', 'Voice agent'];

// Problems the model may suggest. Each one maps to a layer, who usually fixes it,
// a fix and a check that confirms the cause. "symptom" marks problems that usually
// follow an earlier one, which lowers confidence if one of them is the wrong turn.
export const PROBLEMS = [
  {
    id: 'Wrong tool chosen', layer: 'Tool descriptions', owner: 'Whoever writes the agent prompt and tool list. Often fixable without an engineer.',
    plain: 'The agent picked a tool that does not fit the job.',
    fix: 'Rewrite the competing tool descriptions so each says when to use it and when not to, then add this input to your eval set.',
    confirm: 'Run the same input three times after the change. If it picks the right tool every time, the descriptions were the cause.'
  },
  {
    id: 'Bad arguments', layer: 'Tool schema', owner: 'The engineer who owns the tool definition.',
    plain: 'The right tool, called with values in the wrong form or missing.',
    fix: 'State the exact format in the tool schema with an example, and make the tool return an error that names the bad field.',
    confirm: 'Call the tool yourself with the value from the trace, then with the corrected one. If only the corrected one works, this is the cause.'
  },
  {
    id: 'Tool or API failed', layer: 'The tool or API', owner: 'The team that runs the service behind the tool.',
    plain: 'The tool itself broke on a reasonable request.',
    fix: 'Send the request and response from this step to the service owner. On the agent side, make sure the failure reaches the user.',
    confirm: 'Call the tool directly with the same arguments. If it fails outside the agent too, the agent is not the problem.'
  },
  {
    id: 'Error ignored', layer: 'Error handling', owner: 'The engineer who owns the agent loop, with the prompt owner.',
    plain: 'A tool reported a failure and the agent carried on as if it had worked.',
    fix: 'Tell the agent that a tool error means the action did not happen, and give it one allowed response: retry once, ask the user or hand off.',
    confirm: 'Re-run with the tool forced to fail. If the agent still carries on, the handling is missing.'
  },
  {
    id: 'Result misread', layer: 'Prompt', owner: 'The prompt owner. Often fixable without an engineer.',
    plain: 'The tool returned something clear and the agent drew the wrong meaning from it.',
    fix: 'Show the agent what this tool returns in the prompt, including empty and error results, and what each one means.',
    confirm: 'Paste the exact tool result into a fresh run with the same prompt and ask what it means. If it misreads it again, the prompt is the cause.'
  },
  {
    id: 'Missing context', layer: 'Context passing', owner: 'The engineer who builds the agent context.',
    plain: 'The agent lacked a detail it needed, though the detail existed earlier.',
    fix: 'Find where the detail was last present and pass it forward as a named field, not buried in history.',
    confirm: 'Look at what the agent actually had at this step. If the detail is absent, it could not have used it.'
  },
  {
    id: 'Instruction ignored', layer: 'Prompt', owner: 'The prompt owner. Often fixable without an engineer.',
    plain: 'A rule the agent was given was in context and was not followed.',
    fix: 'Move the rule next to the decision it governs, state it plainly with one example, and add this case to your eval set.',
    confirm: 'Re-run five times. Sometimes followed means a priority problem in the prompt; never followed means check the rule is in context at all.'
  },
  {
    id: 'Retrieved wrong source', layer: 'Retrieval', owner: 'Whoever owns the search index or data source.',
    plain: 'The search brought back the wrong material, so everything after it built on the wrong facts.',
    fix: 'Run the same query against the index and read the top results. Wrong results point to indexing or query wording, not the model.',
    confirm: 'If the right document is not in the top results, the model never had a chance.'
  },
  {
    id: 'Handoff dropped context', layer: 'Handoff contract', owner: 'The owners of both agents, together.',
    plain: 'One agent passed work to another and left out something the next one needed.',
    fix: 'Give the handoff a fixed structure with required fields, including any constraint the user stated, and have the receiver read them back.',
    confirm: 'Compare what the user said before the handoff with the handoff message. Anything missing there is invisible to the next agent.'
  },
  {
    id: 'Made up a fact', layer: 'Grounding', owner: 'The prompt owner, with a check in the agent loop.', symptom: true,
    plain: 'The agent stated something no tool result in this run supports.',
    fix: 'Require every factual claim in a reply to come from a tool result in this run, and block replies that confirm an action no tool confirmed.',
    confirm: 'Search the trace for where the claim came from. If no tool result contains it, it was invented.'
  },
  {
    id: 'Repeated itself', layer: 'Loop control', owner: 'The engineer who owns the agent loop.', symptom: true,
    plain: 'The agent made the same call again and again without changing anything.',
    fix: 'Cap identical calls at two, treat permission and not-found errors as not worth retrying, and say what to do when the cap is hit.',
    confirm: 'Count identical calls in the trace. More than two with the same arguments means there is no loop guard.'
  },
  {
    id: 'Stopped too early', layer: 'Loop control', owner: 'The engineer who owns the agent loop.', symptom: true,
    plain: 'The run ended before the job was done, by choice or by a limit.',
    fix: 'Check the stop condition and step limit, and make the agent report what it did not finish when it stops.',
    confirm: 'See whether the last step was the agent choosing to stop or a limit. A limit points to whatever used up the steps before it.'
  }
];
export const PROBLEM_IDS = ['None', ...PROBLEMS.map((p) => p.id)];
const BY_ID = Object.fromEntries(PROBLEMS.map((p) => [p.id, p]));
export const problemInfo = (id) => BY_ID[id] || null;

// Problems that count as "handling" an earlier error signal (used by rule C3).
const HANDLES = ['Error ignored', 'Result misread', 'Repeated itself', 'Tool or API failed', 'Bad arguments'];

export const CONF = ['', 'Low', 'Medium', 'High'];

/* ---------- Parsing the model's tagged lines ---------- */

const clean = (s) => String(s ?? '').trim();

export function parseTrace(text) {
  const out = { summary: '', steps: [], should: {}, links: [], questions: [] };
  String(text || '').split(/\r?\n/).forEach((raw) => {
    const parts = raw.split('|').map(clean);
    const tag = parts[0]?.toUpperCase();
    if (tag === 'SUMMARY' && parts[1]) out.summary = parts[1];
    else if (tag === 'STEP' && parts.length >= 8) {
      const n = parseInt(parts[1], 10);
      const m = /(\d+)\s*-\s*(\d+)|(\d+)/.exec(parts[2] || '');
      if (!n || out.steps.some((s) => s.n === n)) return;
      const from = m ? parseInt(m[1] || m[3], 10) : 0;
      const to = m ? parseInt(m[2] || m[3], 10) : 0;
      out.steps.push({
        id: `s${n}`, n, from, to: Math.max(from, to),
        kind: KINDS.includes(parts[3]) ? parts[3] : parts[3] || 'System',
        actor: parts[4] || 'Agent',
        what: parts[5] || '',
        status: STATUSES.includes(parts[6]) ? parts[6] : 'Suspect',
        problem: parts[7] || 'None',
        evidence: parts.slice(8).join(' ').replace(/^["'“]|["'”]$/g, '')
      });
    } else if (tag === 'SHOULD' && parts[2]) out.should[parseInt(parts[1], 10)] = parts[2];
    else if (tag === 'LINK' && parts.length >= 3) {
      const from = parseInt(parts[1], 10);
      const to = parseInt(parts[2], 10);
      if (from && to && from !== to) out.links.push({ from, to, how: parts[3] || '' });
    } else if (tag === 'QUESTION' && parts[1]) out.questions.push(parts[1]);
  });
  out.steps.sort((a, b) => a.n - b.n);
  return out;
}

/* ---------- The scan: no model, run on your raw trace ---------- */

const ERR_RE = /\b(error|errors|exception|traceback|failed|failure|timed out|timeout|forbidden|unauthori[sz]ed|denied|not found|rate.?limit(ed)?|invalid)\b/i;
const HTTP_RE = /\b(status|code|http)["':=\s]{0,4}(4\d\d|5\d\d)\b|\b(4\d\d|5\d\d)\s+(error|not found|forbidden|unauthori[sz]ed|bad request|too many requests|internal server error|service unavailable)\b/i;
const CALL_RE = /\b(call|calls|calling|tool|invoke|invoking)\b|[a-z_]+\(/i;

export const SCAN_RULES = [
  { id: 'S1', label: 'Error words', text: 'A line contains error, exception, failed, timeout, forbidden, not found, rate limit or invalid.' },
  { id: 'S2', label: 'Error status codes', text: 'A line carries an HTTP 4xx or 5xx status next to a word like status, code or an error name.' },
  { id: 'S3', label: 'Repeated calls', text: 'The same tool call line appears three or more times once timestamps and step numbers are stripped.' }
];

function normaliseCall(line) {
  return line
    .toLowerCase()
    .replace(/\d{4}-\d{2}-\d{2}[t ]\d{2}:\d{2}(:\d{2})?(\.\d+)?z?/g, '')
    .replace(/\b\d{1,2}:\d{2}(:\d{2})?(\.\d+)?\b/g, '')
    .replace(/^\W*(step|turn|#)?\s*\d+[\w-]*\s*[|:\].)-]\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function scanTrace(raw) {
  const lines = String(raw || '').split(/\r?\n/);
  const hits = [];
  const seen = new Map();
  lines.forEach((line, i) => {
    const n = i + 1;
    const t = line.trim();
    if (!t) return;
    const words = ERR_RE.test(t);
    const code = HTTP_RE.test(t);
    if (words || code) hits.push({ line: n, rules: [words && 'S1', code && 'S2'].filter(Boolean), text: t });
    if (CALL_RE.test(t) && t.length > 12) {
      const key = normaliseCall(t);
      if (key.length > 8) seen.set(key, [...(seen.get(key) || []), n]);
    }
  });
  const repeats = [...seen.entries()].filter(([, ls]) => ls.length >= 3).map(([key, ls]) => ({ key, lines: ls, count: ls.length }));
  return { lineCount: lines.filter((l) => l.trim()).length, hits, repeats };
}

/* ---------- Evidence check ---------- */

const norm = (s) => String(s || '').toLowerCase().replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim();

export function evidenceFound(raw, quote) {
  const q = norm(quote).replace(/^\.+|\.+$/g, '');
  if (q.length < 6) return false;
  return norm(raw).includes(q);
}

/* ---------- Analysis ---------- */

export function analyse(steps, parsed, raw) {
  const scan = scanTrace(raw);
  const stepOf = (line) => steps.find((s) => line >= s.from && line <= s.to);
  const isCandidate = (s) => s.problem && s.problem !== 'None' && s.status !== 'Fine';
  const candidates = steps.filter(isCandidate);

  const rows = steps.map((s) => ({
    ...s,
    candidate: isCandidate(s),
    verified: evidenceFound(raw, s.evidence),
    info: problemInfo(s.problem),
    scanHits: scan.hits.filter((h) => h.line >= s.from && h.line <= s.to),
    repeatHits: scan.repeats.filter((r) => r.lines.some((l) => l >= s.from && l <= s.to))
  }));

  // C3: each error signal is accounted for if its own step is flagged, or a flagged step at or after it handles it.
  const signals = scan.hits.map((h) => {
    const st = stepOf(h.line);
    const handler = st && (isCandidate(st) ? st : candidates.find((c) => c.n >= st.n && HANDLES.includes(c.problem)));
    return { ...h, step: st ? st.n : null, accounted: Boolean(handler), by: handler ? handler.n : null };
  });
  const loops = scan.repeats.map((r) => {
    const ns = [...new Set(r.lines.map((l) => stepOf(l)?.n).filter(Boolean))];
    const flagged = ns.some((n) => rows.find((x) => x.n === n)?.problem === 'Repeated itself');
    return { ...r, steps: ns, accounted: flagged };
  });

  const root = rows.find((r) => r.candidate) || null;
  const notes = [];
  let conf = 0;
  if (root) {
    const failed = root.status === 'Failed';
    conf = failed && root.verified ? 3 : failed || root.verified ? 2 : 1;
    notes.push({
      id: 'C1', good: root.verified,
      text: root.verified
        ? 'The quote the model gave for this step appears word for word in your trace.'
        : 'The quote the model gave for this step does not appear in your trace. Read the step yourself before trusting it.'
    });
    if (!root.info) {
      conf -= 1;
      notes.push({ id: 'C4', text: 'This problem was typed by hand, so it has no playbook and no layer. Confidence drops one level.' });
    } else if (root.info.symptom) {
      conf -= 1;
      notes.push({ id: 'C2', text: `${root.problem} usually follows an earlier mistake. Read the steps before step ${root.n} once more.` });
    }
    const earlier = signals.filter((s) => !s.accounted && s.step && s.step < root.n);
    if (earlier.length) {
      conf -= 1;
      notes.push({ id: 'C3', text: `The scan found an error signal before the wrong turn that nothing explains (line ${earlier.map((e) => e.line).join(', ')}). It may be the real start.` });
    }
    conf = Math.max(1, conf);
  }

  const after = root ? rows.filter((r) => r.candidate && r.n > root.n) : [];
  const replies = rows.filter((r) => r.kind === 'Reply');
  const reached = replies.some((r) => r.status !== 'Fine');
  const unaccounted = signals.filter((s) => !s.accounted).length + loops.filter((l) => !l.accounted).length;

  return { rows, root, conf, notes, after, reached, signals, loops, scan, unaccounted, candidates: rows.filter((r) => r.candidate) };
}

/* ---------- Ticket ---------- */

export function evalCase(form, parsed, r) {
  const first = (r && parsed.steps.find((s) => s.kind === 'User message')) || null;
  const input = first ? `the opening message from this trace, which ${first.what.charAt(0).toLowerCase()}${first.what.slice(1).replace(/\.$/, '')}` : 'the same input as this trace';
  const pass = (r && parsed.should[r.n]) || form.goal || 'the agent does what was intended';
  const p = pass.replace(/\.$/, '');
  return `Input: ${input}. Passes when, at step ${r ? r.n : '?'}, the agent does this: ${p.charAt(0).toLowerCase()}${p.slice(1)}.`;
}

export function ticketMarkdown(form, parsed, a) {
  const L = [];
  const r = a.root;
  L.push(`# Agent failure: ${r ? `wrong turn at step ${r.n} (${r.problem})` : 'no wrong turn found'}`);
  L.push('');
  if (form.goal) L.push(`**What the agent should have done:** ${form.goal}`);
  if (form.outcome) L.push(`**What went wrong, as reported:** ${form.outcome}`);
  if (form.setup) L.push(`**Setup:** ${form.setup}`);
  if (parsed.summary) L.push(`**Summary:** ${parsed.summary}`);
  L.push('');
  if (r) {
    L.push('## The wrong turn');
    L.push(`- Step ${r.n}, ${r.kind.toLowerCase()} by ${r.actor}: ${r.what}`);
    L.push(`- Problem: ${r.problem}. ${r.info ? r.info.plain : ''}`);
    if (r.evidence) L.push(`- Evidence (trace line ${r.from}${r.to > r.from ? `-${r.to}` : ''}): \`${r.evidence}\` ${r.verified ? '(found in trace)' : '(not found word for word, check it)'}`);
    if (parsed.should[r.n]) L.push(`- What should have happened: ${parsed.should[r.n]}`);
    L.push(`- Confidence: ${CONF[a.conf]}`);
    L.push(`- Layer: ${r.info ? r.info.layer : 'Unclassified'}. Usually fixed by: ${r.info ? r.info.owner : 'unclear'}`);
    L.push('');
    L.push('## Fix and how to confirm it');
    L.push(`- Fix: ${r.info ? r.info.fix : 'No playbook for a custom problem. Describe the fix here.'}`);
    L.push(`- Confirm: ${r.info ? r.info.confirm : 'Re-run the same input and check this step.'}`);
    L.push(`- Eval case to add: ${evalCase(form, parsed, r)}`);
    L.push('');
    if (a.after.length) {
      L.push('## What followed from it');
      a.after.forEach((s) => L.push(`- Step ${s.n}: ${s.problem}. ${s.what}`));
      L.push(`- Reached the user: ${a.reached ? 'yes' : 'no'}`);
      L.push('');
    }
  }
  if (a.notes.length) {
    L.push('## Checks');
    a.notes.forEach((n) => L.push(`- ${n.id}: ${n.text}`));
    L.push('');
  }
  if (parsed.questions.length) {
    L.push('## Open questions');
    parsed.questions.forEach((q) => L.push(`- ${q}`));
    L.push('');
  }
  L.push('_Drafted with Wrong Turn, a daily AI build by Prerna Kakkar._');
  return L.join('\n');
}
