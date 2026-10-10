import { config } from '../utils/config.js';
import { HttpError } from '../utils/HttpError.js';
import { cleanText } from '../utils/sanitize.js';
import { todayISO, pad } from '../utils/time.js';
import { db } from './dataService.js';
import { isDemo } from './settingsService.js';
import { getWeather } from './weatherService.js';
import { listTasks, updateTask } from './taskService.js';
import { listSchedule } from './scheduleService.js';
import { detectIntent, demoRespond } from './demoAI.js';
import { validateAIResponse, extractJSON, textFallback } from './aiSchema.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SYSTEM_PROMPT = `You are HomeSphere, a helpful AI assistant built into a shared household TV dashboard.
Reply with ONE JSON object and nothing else (no markdown fences, no text outside the JSON) in this shape:
{"type":"plan|briefing|priorities|suggestion|text","title":"short heading, max 60 chars","summary":"the actual answer","items":[{"time":"5:00 PM","task":"...","priority":"HIGH|MEDIUM|LOW","reason":"...","taskId":"..."}]}

Choosing a type:
- "plan": the person wants a schedule for the rest of today. Every item needs "time" (h:mm AM/PM) and "task", times ascending and realistic, include breaks/meals. Keep "summary" to 1-2 sentences.
- "priorities": the person wants their unfinished household tasks ranked. One item per UNFINISHED task with "task", "priority", and a short "reason"; copy "taskId" from CONTEXT exactly. Keep "summary" to 1-2 sentences.
- "briefing": a short daily briefing combining weather, tasks and schedule. Keep "summary" to 2-4 sentences; items optional (max 4).
- "suggestion": a practical household tip grounded in CONTEXT (e.g. weather + an outdoor task). Keep "summary" short; items optional.
- "text": EVERYTHING ELSE - general knowledge questions, explanations, advice, how-tos, definitions, math, writing help, casual conversation, or anything not specifically about this household's own tasks/schedule/weather. For "text", answer exactly as a knowledgeable, helpful general-purpose assistant would in any normal conversation: use your full general knowledge, be as complete and accurate as the question deserves, and do NOT limit yourself to CONTEXT. "summary" holds the full answer - plain text, short paragraphs and "- " bullet lines are fine, no markdown symbols like # or **. Leave "items" empty unless a short structured list genuinely helps.

Grounding rule - applies ONLY to "plan", "priorities", "briefing", and "suggestion", never to "text":
state only facts that actually appear in CONTEXT about this household's weather, tasks, or schedule. Never invent a task, a time, or a forecast number for these types. If weather.source is "mock", it's demo data - don't present it as a real forecast.

Keep at most 8 items in any list.`;

const MODE_HINT = {
  plan: 'Return type "plan": a realistic schedule for the rest of today based on the request, tasks and existing schedule.',
  prioritize: 'Return type "priorities": classify every unfinished task as HIGH, MEDIUM or LOW with a reason.',
  briefing: 'Return type "briefing": a short daily briefing combining weather, tasks and schedule.',
  chat: 'Choose the most useful type for the request.',
};

async function buildContext() {
  const [tasks, schedule, weather] = await Promise.all([
    listTasks(),
    listSchedule(),
    getWeather().catch(() => null),
  ]);
  const now = new Date();
  return {
    now: now.toString(),
    nowHHMM: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
    today: todayISO(now),
    tasks: tasks.map((t) => ({ id: t.id, title: t.title, priority: t.priority, status: t.status, dueDate: t.dueDate })),
    schedule: schedule.map((e) => ({ title: e.title, startTime: e.startTime, endTime: e.endTime })),
    weather: weather && {
      location: weather.location, temperatureC: weather.temperatureC, condition: weather.condition,
      rainProbability: weather.rainProbability, windKph: weather.windKph, source: weather.source,
    },
  };
}

async function callLLM(system, user) {
  const { provider, apiKey, model, baseUrl, timeoutMs } = config.ai;
  const signal = AbortSignal.timeout(timeoutMs);
  let res;
  if (provider === 'openai') {
    res = await fetch(`${baseUrl || 'https://api.openai.com/v1'}/chat/completions`, {
      method: 'POST',
      signal,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, temperature: 0.4, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
    });
  } else {
    res = await fetch(`${baseUrl || 'https://api.anthropic.com'}/v1/messages`, {
      method: 'POST',
      signal,
      headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model, max_tokens: 1200, temperature: 0.4, system, messages: [{ role: 'user', content: user }] }),
    });
  }
  if (!res.ok) {
    console.error('[ai] provider error', res.status, (await res.text()).slice(0, 300));
    throw new HttpError(502, 'AI_PROVIDER_ERROR', 'The AI service could not answer right now. Please try again.');
  }
  const data = await res.json();
  return provider === 'openai' ? data.choices?.[0]?.message?.content : data.content?.find((c) => c.type === 'text')?.text;
}

export async function respond({ message, mode = 'chat', source = 'tv' }) {
  const intent = mode === 'chat' ? detectIntent(message) : mode;
  const ctx = await buildContext();
  const knownTaskIds = new Set(ctx.tasks.map((t) => t.id));
  const prompt = message || (intent === 'briefing' ? 'Generate my daily briefing.' : 'Help me with my day.');

  let response;
  let origin = 'llm';
  let fallback = false;

  if (isDemo()) {
    origin = 'demo';
    await sleep(900); // lets the TV loading state be seen in a demo video
    response = validateAIResponse(demoRespond(intent, prompt, ctx), { knownTaskIds }) || textFallback('Demo response unavailable.');
  } else {
    if (!config.ai.apiKey) {
      throw new HttpError(503, 'AI_NOT_CONFIGURED', 'AI is not set up yet. Turn on Demo Mode in Settings or add AI_API_KEY on the server.');
    }
    const history = (await db.messages.recent(6)).map((m) => `${m.role}: ${m.message}`).join('\n');
    const user = `${MODE_HINT[intent] || MODE_HINT.chat}\n\nCONTEXT:\n${JSON.stringify({ ...ctx, nowHHMM: undefined })}\n\n${history ? `RECENT CONVERSATION:\n${history}\n\n` : ''}REQUEST: ${prompt}`;
    let raw;
    try {
      raw = await callLLM(SYSTEM_PROMPT, user);
    } catch (err) {
      if (err instanceof HttpError) throw err;
      console.error('[ai] request failed:', err.message);
      throw new HttpError(502, 'AI_UNREACHABLE', 'Could not reach the AI service. Check the connection and try again.');
    }
    const parsed = validateAIResponse(extractJSON(raw), { knownTaskIds });
    if (parsed) response = parsed;
    else {
      fallback = true; // structured output failed validation -> show plain text instead of breaking the UI
      response = textFallback(raw);
    }
  }

  if (intent !== 'briefing') {
    await db.messages.add({ role: 'user', message: cleanText(prompt, 500), source });
    await db.messages.add({ role: 'assistant', message: cleanText(`${response.title}: ${response.summary}`, 900), source: 'system' });
  }
  return { response, source: origin, fallback, intent };
}

export async function applyPriorities(items = []) {
  let applied = 0;
  for (const it of items) {
    if (it.taskId && it.priority) {
      try { await updateTask(it.taskId, { priority: it.priority }); applied += 1; } catch { /* task may have been deleted */ }
    }
  }
  return applied;
}
