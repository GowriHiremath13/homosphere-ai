import { Router } from 'express';
import * as c from '../controllers/ai.controller.js';
import { validate } from '../middleware/validate.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { validateAIRequest } from '../utils/validators.js';

const r = Router();
r.use(rateLimit({ windowMs: 60_000, max: 40 }));
r.post('/chat', validate((b) => validateAIRequest(b)), c.chat);
r.post('/plan', validate((b) => validateAIRequest(b, { defaultMode: 'plan', requireMessage: false })), c.plan);
r.post('/briefing', validate((b) => validateAIRequest(b, { defaultMode: 'briefing', requireMessage: false })), c.briefing);
r.post('/prioritize', validate((b) => validateAIRequest(b, { defaultMode: 'prioritize', requireMessage: false })), c.prioritize);
export default r;
