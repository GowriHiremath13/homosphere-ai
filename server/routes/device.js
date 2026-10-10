import { Router } from 'express';
import * as c from '../controllers/device.controller.js';
import { validate } from '../middleware/validate.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { validateDeviceCode } from '../utils/validators.js';

const r = Router();
r.post('/register', rateLimit({ windowMs: 60_000, max: 30 }), c.register);
r.post('/pair', rateLimit({ windowMs: 60_000, max: 10 }), validate(validateDeviceCode), c.pair);
r.post('/:id/rotate-code', c.rotate);
r.get('/:id/status', c.status);
export default r;
