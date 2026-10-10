import { db, sortTasks } from './dataService.js';
import { broadcast, notify } from './realtime.js';
import { notFound } from '../utils/HttpError.js';

export async function listTasks() {
  return sortTasks(await db.tasks.list());
}

async function pushTasks() {
  broadcast('tasks:updated', { tasks: await listTasks() });
}

export async function createTask(data, createdBy = 'tv', { announce = true } = {}) {
  const task = await db.tasks.create({ ...data, createdBy });
  await pushTasks();
  if (announce) notify(`New task from ${createdBy === 'phone' ? 'phone' : createdBy}: ${task.title}`, 'task');
  return task;
}

export async function updateTask(id, patch, { announce = false } = {}) {
  const task = await db.tasks.update(id, patch);
  if (!task) throw notFound('Task not found');
  await pushTasks();
  if (announce && patch.status === 'done') notify(`Completed: ${task.title}`, 'success');
  return task;
}

export async function deleteTask(id) {
  const ok = await db.tasks.remove(id);
  if (!ok) throw notFound('Task not found');
  await pushTasks();
}

export async function toggleComplete(id) {
  const task = await db.tasks.get(id);
  if (!task) throw notFound('Task not found');
  return updateTask(id, { status: task.status === 'done' ? 'pending' : 'done' }, { announce: true });
}

export async function completeTask(id) {
  return updateTask(id, { status: 'done' }, { announce: true });
}
