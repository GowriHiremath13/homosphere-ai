import { asyncHandler } from '../utils/asyncHandler.js';
import * as schedule from '../services/scheduleService.js';
import { isISODate, todayISO } from '../utils/time.js';
import { badRequest, notFound } from '../utils/HttpError.js';

export const list = asyncHandler(async (req, res) => {
  const date = req.query.date || todayISO();
  if (!isISODate(date)) throw badRequest('date must be YYYY-MM-DD');
  res.json({ date, schedule: await schedule.listSchedule(date) });
});
export const create = asyncHandler(async (req, res) => res.status(201).json({ entry: await schedule.createEntry(req.body) }));
export const importItems = asyncHandler(async (req, res) => {
  const created = await schedule.importPlanItems(req.body.items);
  if (created.length === 0) throw badRequest('None of the items had a valid time');
  res.status(201).json({ schedule: created });
});
export const remove = asyncHandler(async (req, res) => {
  if (!(await schedule.deleteEntry(req.params.id))) throw notFound('Schedule entry not found');
  res.status(204).end();
});
