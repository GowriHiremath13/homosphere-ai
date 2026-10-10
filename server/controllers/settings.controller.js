import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest } from '../utils/HttpError.js';
import { cleanText } from '../utils/sanitize.js';
import * as settings from '../services/settingsService.js';
import { resetDemoData, seedIfEmpty } from '../services/demoData.js';
import { broadcast } from '../services/realtime.js';

export const getSettings = asyncHandler(async (_req, res) => res.json({ settings: settings.getSettings() }));

export const updateSettings = asyncHandler(async (req, res) => {
  if (typeof req.body?.demoMode !== 'boolean') throw badRequest('demoMode must be true or false');
  const next = await settings.setDemoMode(req.body.demoMode);
  if (next.demoMode) await seedIfEmpty();
  broadcast('settings:updated', { settings: next });
  res.json({ settings: next });
});

export const getUser = asyncHandler(async (_req, res) => res.json({ user: await settings.getUser() }));

export const updateUser = asyncHandler(async (req, res) => {
  const name = cleanText(req.body?.name, 60);
  if (!name) throw badRequest('name is required');
  res.json({ user: await settings.updateUser({ name }) });
});

export const resetDemo = asyncHandler(async (_req, res) => {
  await resetDemoData();
  res.json({ ok: true });
});
