import { addMinutes, to12hLabel, pad } from '../utils/time.js';

const OUTDOOR = /(groceries|outdoor|plants|garden|walk|errand|run\b|post office|car wash|market)/i;

export function detectIntent(message = '') {
  const m = message.toLowerCase();
  if (/(prioriti|organi[sz]e|unfinished|sort my tasks|what should i do first)/.test(m)) return 'prioritize';
  if (/(summar|briefing|my day|how.?s my day)/.test(m)) return 'briefing';
  if (/(plan|schedule|study|timetable|evening)/.test(m)) return 'plan';
  return 'chat';
}

const pending = (ctx) => ctx.tasks.filter((t) => t.status !== 'done');
const wRank = { HIGH: 0, MEDIUM: 1, LOW: 2 };

function classify(task) {
  const text = task.title.toLowerCase();
  const due = task.dueDate ? new Date(task.dueDate) : null;
  const hoursLeft = due ? (due.getTime() - Date.now()) / 36e5 : null;
  if (/(exam|assignment|submit|deadline|bill|doctor)/.test(text) || (hoursLeft !== null && hoursLeft <= 3))
    return ['HIGH', hoursLeft !== null && hoursLeft <= 3 ? 'Due within a few hours' : 'Time-sensitive work with a hard deadline'];
  if (hoursLeft !== null && hoursLeft <= 24) return ['MEDIUM', 'Due today, but not urgent right now'];
  return ['LOW', 'No deadline pressure - fit it in around the bigger items'];
}

function startCursor() {
  const now = new Date();
  let mins = now.getHours() * 60 + now.getMinutes() + 15;
  mins = Math.ceil(mins / 30) * 30;
  if (mins < 17 * 60) mins = 17 * 60; // "evening" starts at 5 PM
  if (mins > 21 * 60) mins = 21 * 60;
  return `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
}

function eveningPlan(ctx) {
  const open = [...pending(ctx)].sort((a, b) => wRank[a.priority] - wRank[b.priority]);
  let cursor = startCursor();
  const items = [];
  const push = (task, mins) => {
    if (cursor >= '23:00') return;
    items.push({ time: to12hLabel(cursor), task });
    cursor = addMinutes(cursor, mins);
  };
  const high = open.filter((t) => t.priority === 'HIGH');
  const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);
  const rest = open.filter((t) => t.priority !== 'HIGH' && (!t.dueDate || new Date(t.dueDate) <= endOfToday)).slice(0, 2);
  high.slice(0, 2).forEach((t, i) => { push(t.title, 90); if (i === 0) push('Break', 30); });
  rest.forEach((t) => push(t.title, 30));
  if (cursor < '20:30') cursor = '20:30';
  push('Dinner', 45);
  push('Wind down', 30);
  return {
    type: 'plan',
    title: 'Your evening plan',
    summary: high.length
      ? `You have ${high.length} high-priority task${high.length > 1 ? 's' : ''} tonight. Deep work comes first, then lighter chores, then dinner.`
      : 'A light evening: a few small tasks, dinner, and time to unwind.',
    items,
  };
}

function studyPlan() {
  let cursor = startCursor();
  const blocks = [
    ['Focus block 1: revise key topics', 50],
    ['Short break', 10],
    ['Focus block 2: practice questions', 50],
    ['Break and snack', 15],
    ['Focus block 3: recap and flashcards', 40],
    ['Pack your bag and wind down', 30],
  ];
  const items = blocks.map(([task, mins]) => {
    const row = { time: to12hLabel(cursor), task };
    cursor = addMinutes(cursor, mins);
    return row;
  });
  return { type: 'plan', title: 'Study schedule', summary: 'Three focused blocks with breaks in between. Use the Timer screen for each 25-50 minute block.', items };
}

function prioritize(ctx) {
  const open = pending(ctx);
  if (open.length === 0) return { type: 'text', title: 'All clear', summary: 'You have no unfinished tasks. Enjoy the evening.', items: [] };
  const items = open
    .map((t) => { const [priority, reason] = classify(t); return { taskId: t.id, task: t.title, priority, reason }; })
    .sort((a, b) => wRank[a.priority] - wRank[b.priority]);
  const high = items.filter((i) => i.priority === 'HIGH').length;
  return {
    type: 'priorities',
    title: 'Task priorities',
    summary: `${open.length} unfinished task${open.length > 1 ? 's' : ''}, ${high} high priority. Start from the top.`,
    items,
  };
}

function rainSuggestion(ctx) {
  const w = ctx.weather;
  const outdoor = pending(ctx).filter((t) => OUTDOOR.test(t.title));
  if (!w) return { type: 'text', title: 'Weather unavailable', summary: 'I do not have weather data right now, so I cannot suggest anything about the rain.', items: [] };
  const src = w.source === 'mock' ? 'the demo forecast' : 'the current forecast';
  if (outdoor.length && w.rainProbability >= 40) {
    return {
      type: 'suggestion',
      title: 'Before the rain',
      summary: `Rain chance is ${w.rainProbability}% in ${src}. Consider completing the outdoor task before the rain.`,
      items: outdoor.map((t) => ({ task: t.title, reason: 'Outdoors - do this first while it is dry' })),
    };
  }
  return {
    type: 'suggestion',
    title: 'Weather check',
    summary: outdoor.length
      ? `Rain chance is only ${w.rainProbability}% in ${src}, so your outdoor tasks can wait.`
      : `You have no outdoor tasks pending. Rain chance is ${w.rainProbability}% in ${src}.`,
    items: [],
  };
}

function briefing(ctx) {
  const open = pending(ctx);
  const high = open.filter((t) => t.priority === 'HIGH');
  const w = ctx.weather;
  const next = ctx.schedule.find((e) => e.startTime > ctx.nowHHMM);
  const parts = [];
  if (w) parts.push(`${w.temperatureC}°C, ${w.condition.toLowerCase()}, ${w.rainProbability}% chance of rain.`);
  parts.push(`${open.length} open task${open.length === 1 ? '' : 's'}${high.length ? `, ${high.length} high priority` : ''}.`);
  if (next) parts.push(`Next on the schedule: ${next.title} at ${to12hLabel(next.startTime)}.`);
  const items = high.slice(0, 3).map((t) => ({ task: t.title, reason: 'High priority' }));
  if (w && w.rainProbability >= 50 && open.some((t) => OUTDOOR.test(t.title))) {
    items.push({ task: 'Do outdoor errands before the rain', reason: `Rain chance ${w.rainProbability}%` });
  }
  return { type: 'briefing', title: 'Your daily briefing', summary: parts.join(' '), items: items.slice(0, 4) };
}

function summarizeDay(ctx) {
  const done = ctx.tasks.filter((t) => t.status === 'done').length;
  const open = pending(ctx).length;
  return {
    type: 'briefing',
    title: 'Your day so far',
    summary: `${done} task${done === 1 ? '' : 's'} done, ${open} still open. ${ctx.schedule.length} item${ctx.schedule.length === 1 ? '' : 's'} on today’s schedule.`,
    items: pending(ctx).slice(0, 3).map((t) => ({ task: t.title })),
  };
}

export function demoRespond(intent, message, ctx) {
  const m = message.toLowerCase();
  if (intent === 'briefing') return /summar|my day/.test(m) ? summarizeDay(ctx) : briefing(ctx);
  if (intent === 'prioritize') return prioritize(ctx);
  if (intent === 'plan') return /(study|exam|revis)/.test(m) && !/evening/.test(m) ? studyPlan() : eveningPlan(ctx);
  if (/(rain|weather|umbrella|outdoor)/.test(m)) return rainSuggestion(ctx);
  return {
    type: 'text',
    title: 'HomeSphere',
    summary: 'In Demo Mode I can plan your evening, prioritise your tasks, build a study schedule, or check what to do before the rain - all from your actual household data, no AI key needed. For open-ended questions like this one, add an AI_API_KEY in Settings (or your .env) to unlock full conversational answers.',
    items: [],
  };
}
