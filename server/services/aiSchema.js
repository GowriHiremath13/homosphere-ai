import { cleanText, cleanProse } from '../utils/sanitize.js';
import { parseTime, to12hLabel, to24h } from '../utils/time.js';

export const RESPONSE_TYPES = ['plan', 'briefing', 'priorities', 'suggestion', 'text'];
const PRIORITIES = ['HIGH', 'MEDIUM', 'LOW'];

/**
 * Validate + normalise an AI response object. Returns a clean object or null.
 * The frontend only ever sees output of this function (or the text fallback), never raw model output.
 */
export function validateAIResponse(raw, { knownTaskIds = new Set() } = {}) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  if (!RESPONSE_TYPES.includes(raw.type)) return null;

  const title = cleanText(raw.title, 80);
  // "text" answers are genuine open-ended conversation and can be as long as a real answer
  // needs to be (explanations, steps, etc.); the structured types stay shorter by convention
  // (the system prompt asks the model for that), but nothing here artificially truncates them.
  const summary = cleanProse(raw.summary, raw.type === 'text' ? 4000 : 1200);
  if (!title && !summary) return null;

  const rawItems = raw.items === undefined ? [] : raw.items;
  if (!Array.isArray(rawItems)) return null;

  const items = [];
  for (const it of rawItems.slice(0, 12)) {
    if (!it || typeof it !== 'object') continue;
    const task = cleanText(it.task ?? it.title, 160);
    if (!task) continue;
    const item = { task };

    if (it.time !== undefined && it.time !== null && it.time !== '') {
      const t = parseTime(String(it.time));
      if (t) item.time = to12hLabel(to24h(String(it.time)));
      else if (raw.type === 'plan') return null; // plans need real times
      else item.time = cleanText(String(it.time), 24);
    } else if (raw.type === 'plan') {
      return null;
    }

    if (it.priority !== undefined) {
      const p = String(it.priority).toUpperCase();
      if (PRIORITIES.includes(p)) item.priority = p;
      else if (raw.type === 'priorities') return null;
    } else if (raw.type === 'priorities') {
      return null;
    }

    const reason = cleanText(it.reason ?? '', 220);
    if (reason) item.reason = reason;
    if (typeof it.taskId === 'string' && knownTaskIds.has(it.taskId)) item.taskId = it.taskId;
    items.push(item);
  }

  if ((raw.type === 'plan' || raw.type === 'priorities') && items.length === 0) return null;
  return { type: raw.type, title: title || 'HomeSphere', summary, items };
}

export function extractJSON(text) {
  if (typeof text !== 'string') return null;
  const stripped = text.replace(/```(?:json)?/gi, '').trim();
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(stripped.slice(start, end + 1));
  } catch {
    return null;
  }
}

export function textFallback(rawText) {
  // Used when the model didn't return valid structured JSON - which, now that "text" answers
  // are open-ended, is often just a perfectly good plain-prose answer that happened not to be
  // wrapped in JSON. Preserve it as-is (cleaned/capped) rather than mangling it.
  const summary = cleanProse(typeof rawText === 'string' ? rawText : '', 4000);
  return { type: 'text', title: 'HomeSphere', summary: summary || 'I could not put together an answer. Please try again.', items: [] };
}
