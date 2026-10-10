import { db } from './dataService.js';
import { broadcast } from './realtime.js';
import { isDemo } from './settingsService.js';
import { seedDemoSchedule } from './demoData.js';
import { todayISO, to24h, addMinutes, isHHMM } from '../utils/time.js';
import { cleanText } from '../utils/sanitize.js';

export async function listSchedule(date = todayISO()) {
  if (isDemo() && (await db.schedule.countByDate(date)) === 0) await seedDemoSchedule(date);
  return db.schedule.listByDate(date);
}

async function pushSchedule(date) {
  broadcast('schedule:updated', { date, schedule: await db.schedule.listByDate(date) });
}

export async function createEntry(data) {
  const entry = await db.schedule.create(data);
  await pushSchedule(data.date);
  return entry;
}

export async function deleteEntry(id, date = todayISO()) {
  const ok = await db.schedule.remove(id);
  if (ok) await pushSchedule(date);
  return ok;
}

// Turn validated AI plan items ({time, task}) into schedule rows. Replaces earlier AI-generated rows for the day.
export async function importPlanItems(items, date = todayISO()) {
  const rows = items
    .map((it) => ({ title: cleanText(it.task, 120), start: to24h(it.time) }))
    .filter((r) => r.title && r.start && isHHMM(r.start))
    .sort((a, b) => a.start.localeCompare(b.start));
  if (rows.length === 0) return [];
  // Replace earlier AI rows, and demo rows that the new plan overlaps (so the timeline stays readable)
  const existing = await db.schedule.listByDate(date);
  for (const e of existing) {
    if (e.source === 'ai' || (e.source === 'demo' && e.startTime >= rows[0].start)) await db.schedule.remove(e.id);
  }
  const created = [];
  for (let i = 0; i < rows.length; i += 1) {
    const next = rows[i + 1]?.start;
    const end = next && next > rows[i].start ? next : addMinutes(rows[i].start, 60);
    created.push(await db.schedule.create({ title: rows[i].title, startTime: rows[i].start, endTime: end, date, source: 'ai' }));
  }
  await pushSchedule(date);
  return created;
}
