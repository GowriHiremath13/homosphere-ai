import { db } from './dataService.js';
import { dateAt, todayISO } from '../utils/time.js';
import { broadcast } from './realtime.js';
import { sortTasks } from './dataService.js';

const tomorrowAt = (hhmm) => {
  const d = dateAt(hhmm);
  d.setDate(d.getDate() + 1);
  return d;
};

export async function seedDemoTasks() {
  const rows = [
    { title: 'Finish assignment', description: 'Wrap up and submit the weekly assignment', priority: 'HIGH', dueDate: dateAt('18:00') },
    { title: 'Revise for tomorrow’s exam', description: 'Chapters 4 to 6 and practice questions', priority: 'HIGH', dueDate: dateAt('20:00') },
    { title: 'Buy groceries (outdoor errand)', description: 'Vegetables, milk, bread', priority: 'MEDIUM', dueDate: dateAt('17:00') },
    { title: 'Water the balcony plants', description: '', priority: 'LOW', dueDate: dateAt('17:30') },
    { title: 'Fold the laundry', description: '', priority: 'LOW', dueDate: dateAt('21:00') },
    { title: 'Call the electrician', description: 'Ask about the hallway light', priority: 'MEDIUM', dueDate: tomorrowAt('10:00') },
  ];
  for (const r of rows) await db.tasks.create({ ...r, createdBy: 'demo' });
}

export async function seedDemoSchedule(date = todayISO()) {
  const rows = [
    ['09:30', '10:00', 'Morning stand-up'],
    ['13:00', '13:45', 'Lunch'],
    ['17:00', '18:30', 'Assignment'],
    ['18:30', '19:00', 'Break'],
    ['19:00', '20:30', 'Exam revision'],
    ['20:30', '21:15', 'Dinner'],
  ];
  for (const [startTime, endTime, title] of rows) await db.schedule.create({ title, startTime, endTime, date, source: 'demo' });
}

export async function resetDemoData() {
  await db.tasks.clear();
  await db.schedule.clear();
  await seedDemoTasks();
  await seedDemoSchedule();
  broadcast('tasks:updated', { tasks: sortTasks(await db.tasks.list()) });
  broadcast('schedule:updated', { date: todayISO(), schedule: await db.schedule.listByDate(todayISO()) });
}

export async function seedIfEmpty() {
  if ((await db.tasks.count()) === 0) await seedDemoTasks();
  if ((await db.schedule.countByDate(todayISO())) === 0) await seedDemoSchedule();
}
