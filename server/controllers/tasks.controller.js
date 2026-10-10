import { asyncHandler } from '../utils/asyncHandler.js';
import * as tasks from '../services/taskService.js';

export const list = asyncHandler(async (_req, res) => res.json({ tasks: await tasks.listTasks() }));
export const create = asyncHandler(async (req, res) => res.status(201).json({ task: await tasks.createTask(req.body, req.body.createdBy || 'tv') }));
export const update = asyncHandler(async (req, res) => res.json({ task: await tasks.updateTask(req.params.id, req.body, { announce: true }) }));
export const remove = asyncHandler(async (req, res) => { await tasks.deleteTask(req.params.id); res.status(204).end(); });
