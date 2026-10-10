import { asyncHandler } from '../utils/asyncHandler.js';
import * as devices from '../services/deviceService.js';

export const register = asyncHandler(async (req, res) => res.status(201).json({ device: await devices.registerTv(req.body?.deviceId) }));
export const rotate = asyncHandler(async (req, res) => res.json({ device: await devices.rotateCode(req.params.id) }));
export const pair = asyncHandler(async (req, res) => res.status(201).json(await devices.pairPhone(req.body.code, req.body.phoneName)));
export const status = asyncHandler(async (req, res) => res.json({ status: await devices.deviceStatus(req.params.id) }));
