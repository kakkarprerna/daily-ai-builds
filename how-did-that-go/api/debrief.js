// Serverless function for How Did That Go?
// The system prompt and the default API key live here, never in the browser bundle.
// Default provider: Meta Muse Glimmer 30B on NVIDIA's free OpenAI-shaped endpoint,
// using the owner's key (LLM_BASE_URL / LLM_MODEL / LLM_API_KEY).
// Visitors can bring their own key for Anthropic, OpenAI or Gemini. That key is
// used for the single request and is never stored or logged.

const SYSTEM_PROMPT = `You are an experienced interview coach helping a candidate debrief straight after an interview round. You have sat on hundreds of hiring panels and you know what interviewers listen for at each stage.

You will receive the role, the round, who interviewed them, the format, an optional job description, and a log of the questions they were asked with their own summary of what they said, how it felt, and how the interviewer reacted.

Your job:
1. Work out what each question was really probing (the competency or risk the interviewer was checking).
2. Judge how well the candidate's answer, as they recorded it, would have landed against that probe. Ground every judgement in something they actually wrote. Do not invent details of their answer.
3. Name the specific gap, and describe what a stronger answer would have included, in a way they can reuse in the next round.
4. Spot patterns across answers.
5. Give ordered fixes for the next round, a short follow-up note they can send, and what the next round will probably test.

Rules:
- Be honest and specific. Kind in tone, never vague. No generic interview advice that ignores what they wrote.
- Never claim to know the outcome or what the interviewer thought. Speak in terms of how an answer would likely read.
- Treat the interviewer's reaction as a weak signal, not proof. Moving on quickly can mean satisfied or unconvinced.
- If the job description is given, tie probes and fixes to its requirements. If not, reason from the role and round.
- The follow-up note must be under 110 words, warm, professional, and may briefly add one point the candidate missed. It must not grovel or re-sell the whole CV. Use [Name] as the placeholder for the interviewer.
- British English. No em dashes or en dashes. No markdown, no bullets, no numbering outside the format below.

Output format. Plain text, one item per line, fields separated by a vertical bar |. Use exactly these line types and nothing else:

READ|<Strong or Mixed or Needs work>|<High or Medium or Low confidence>|<one sentence on how the round as a whole likely read>
STRENGTH|<something that likely worked, tied to a specific answer>
Q|<question number>|PROBE|<what this question was really checking, one sentence>
Q|<question number>|LANDED|<Landed or Partly or Missed>|<one sentence why, citing what they said>
Q|<question number>|GAP|<the specific missing piece>
Q|<question number>|BETTER|<what a stronger answer would include, concrete, two sentences at most>
PATTERN|<a pattern across two or more answers>
FIX|<short action title>|<why it matters and how to do it, one or two sentences>
NOTE|<one paragraph of the follow-up note; repeat NOTE lines for each paragraph>
NEXT|<something the next round will probably test, given this round>
LIMIT|<one thing this debrief cannot know>

Give 2 or 3 STRENGTH lines, all four Q line types for every question, 1 to 3 PATTERN lines, 3 to 5 FIX lines in priority order, 2 or 3 NOTE lines, 2 to 4 NEXT lines and 1 or 2 LIMIT lines. Start your reply with the READ line.`;

function buildUserMessage(p) {
  const lines = [];
  lines.push(`Role: ${p.role || 'Not given'}`);
  lines.push(`Company type: ${p.company || 'Not given'}`);
  lines.push(`Round: ${p.round || 'Not given'}`);
  lines.push(`Interviewer: ${p.interviewer || 'Not given'}`);
  lines.push(`Format: ${p.format || 'Not given'}`);
  lines.push(`Candidate's overall gut feel: ${p.gut || 'Not given'}`);
  lines.push('');
  lines.push('Job description:');
  lines.push(p.jd && p.jd.trim() ? p.jd.trim().slice(0, 6000) : 'Not provided');
  lines.push('');
  lines.push('Questions asked:');
  (p.questions || []).forEach((q, i) => {
    lines.push(`Question ${i + 1}: ${q.question || '(not recorded)'}`);
    lines.push(`What I said: ${q.answer || '(not recorded)'}`);
    lines.push(`How it felt: ${q.felt || 'Not given'}`);
    lines.push(`Their reaction: ${q.reaction || 'Not given'}`);
    lines.push('');
  });
  lines.push(`Questions I asked them: ${p.myQuestions || 'None recorded'}`);
  lines.push(`What they said about next steps: ${p.nextSteps || 'Nothing said'}`);
  return lines.join('\n');
}

const DEFAULT_MODELS = {
  anthropic: 'claude-sonnet-5-5',
  openai: 'gpt-5-mini',
  gemini: 'gemini-2.5-flash',
};

async function callOpenAIShaped(baseUrl, apiKey, model, user) {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      max_tokens: 2400,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: user },
      ],
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `Model request failed (${res.status})`);
  return data?.choices?.[0]?.message?.content || '';
}

async function callAnthropic(apiKey, model, user) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2400,
      temperature: 0.3,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: user }],
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `Anthropic request failed (${res.status})`);
  return (data?.content || []).map((b) => b.text || '').join('');
}

async function callGemini(apiKey, model, user) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 2400 },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `Gemini request failed (${res.status})`);
  return (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST' });
    return;
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { payload, provider = 'muse', userKey = '', model = '' } = body;
    if (!payload || !Array.isArray(payload.questions) || payload.questions.length === 0) {
      res.status(400).json({ error: 'Add at least one question you were asked.' });
      return;
    }
    if (payload.questions.length > 12) {
      res.status(400).json({ error: 'Up to 12 questions per debrief.' });
      return;
    }
    const user = buildUserMessage(payload);
    let text = '';

    if (provider === 'muse') {
      const baseUrl = process.env.LLM_BASE_URL || 'https://integrate.api.nvidia.com/v1';
      const key = process.env.LLM_API_KEY;
      const m = process.env.LLM_MODEL;
      if (!key || !m) throw new Error('The default model is not configured on this deployment. Pick a provider and use your own key.');
      text = await callOpenAIShaped(baseUrl, key, m, user);
    } else {
      if (!userKey) throw new Error('Paste your own API key for this provider in Model settings.');
      const m = model || DEFAULT_MODELS[provider];
      if (provider === 'anthropic') text = await callAnthropic(userKey, m, user);
      else if (provider === 'openai') text = await callOpenAIShaped('https://api.openai.com/v1', userKey, m, user);
      else if (provider === 'gemini') text = await callGemini(userKey, m, user);
      else throw new Error('Unknown provider');
    }

    if (!text.trim()) throw new Error('The model returned an empty reply. Try again.');
    res.status(200).json({ text });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Something went wrong' });
  }
}
