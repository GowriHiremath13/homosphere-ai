import { badRequest } from './HttpError.js';
import { cleanText } from './sanitize.js';
import { isHHMM, isISODate, todayISO, addMinutes } from './time.js';

export const PRIORITIES = ['HIGH', 'MEDIUM', 'LOW'];
export const STATUSES = ['pending', 'in_progress', 'done'];
export const AI_MODES = ['chat', 'plan', 'briefing', 'prioritize'];

const isObject = (v) => v && typeof v === 'object' && !Array.isArray(v);

export function validateTask(body, { partial = false } = {}) {
  if (!isObject(body)) throw badRequest('Request body must be a JSON object');
  const out = {};
  if (!partial || body.title !== undefined) {
    const title = cleanText(body.title, 120);
    if (!title) throw badRequest('Task title is required');
    out.title = title;
  }
  if (body.description !== undefined) out.description = cleanText(body.description, 500);
  if (body.priority !== undefined) {
    const p = String(body.priority).toUpperCase();
    if (!PRIORITIES.includes(p)) throw badRequest('Priority must be HIGH, MEDIUM or LOW');
    out.priority = p;
  }
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) throw badRequest('Status must be pending, in_progress or done');
    out.status = body.status;
  }
  if (body.dueDate !== undefined) {
    if (body.dueDate === null || body.dueDate === '') out.dueDate = null;
    else {
      const d = new Date(body.dueDate);
      if (Number.isNaN(d.getTime())) throw badRequest('dueDate must be a valid date');
      out.dueDate = d;
    }
  }
  if (partial && Object.keys(out).length === 0) throw badRequest('Nothing to update');
  return out;
}

export function validateSchedule(body) {
  if (!isObject(body)) throw badRequest('Request body must be a JSON object');
  const title = cleanText(body.title, 120);
  if (!title) throw badRequest('Schedule title is required');
  if (!isHHMM(body.startTime)) throw badRequest('startTime must be HH:MM (24h)');
  const endTime = body.endTime ?? addMinutes(body.startTime, 60);
  if (!isHHMM(endTime)) throw badRequest('endTime must be HH:MM (24h)');
  const date = body.date ?? todayISO();
  if (!isISODate(date)) throw badRequest('date must be YYYY-MM-DD');
  return { title, startTime: body.startTime, endTime, date, source: 'user' };
}

export function validateAIRequest(body, { defaultMode = 'chat', requireMessage = true } = {}) {
  if (!isObject(body)) throw badRequest('Request body must be a JSON object');
  const message = cleanText(body.message ?? body.prompt ?? '', 500);
  if (requireMessage && !message) throw badRequest('A message is required');
  const mode = body.mode ?? defaultMode;
  if (!AI_MODES.includes(mode)) throw badRequest(`mode must be one of ${AI_MODES.join(', ')}`);
  return {
    message,
    mode,
    source: body.source === 'phone' ? 'phone' : 'tv',
    save: body.save === true,
    apply: body.apply === true,
  };
}

export function validateDeviceCode(body) {
  if (!isObject(body)) throw badRequest('Request body must be a JSON object');
  const code = cleanText(body.code, 10).toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) throw badRequest('Pairing code must be 6 letters or digits');
  return { code, phoneName: cleanText(body.phoneName, 40) || 'Phone' };
}

export function validateImportItems(body) {
  if (!isObject(body) || !Array.isArray(body.items) || body.items.length === 0) {
    throw badRequest('items must be a non-empty array');
  }
  return { items: body.items.slice(0, 12) };
}
