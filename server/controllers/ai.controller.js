import { asyncHandler } from '../utils/asyncHandler.js';
import { respond, applyPriorities } from '../services/aiService.js';
import { importPlanItems } from '../services/scheduleService.js';

export const chat = asyncHandler(async (req, res) => {
  const result = await respond(req.body);
  res.json(result);
});

export const plan = asyncHandler(async (req, res) => {
  const result = await respond({ ...req.body, mode: 'plan' });
  let saved = 0;
  if (req.body.save && result.response.type === 'plan') saved = (await importPlanItems(result.response.items)).length;
  res.json({ ...result, savedToPlanner: saved });
});

export const briefing = asyncHandler(async (req, res) => {
  const result = await respond({ ...req.body, mode: 'briefing' });
  res.json(result);
});

export const prioritize = asyncHandler(async (req, res) => {
  const result = await respond({ ...req.body, mode: 'prioritize' });
  let applied = 0;
  if (req.body.apply && result.response.type === 'priorities') applied = await applyPriorities(result.response.items);
  res.json({ ...result, applied });
});
