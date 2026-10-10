import { Router } from 'express';
import * as c from '../controllers/settings.controller.js';
const r = Router();
r.get('/settings', c.getSettings);
r.put('/settings', c.updateSettings);
r.get('/user', c.getUser);
r.put('/user', c.updateUser);
r.post('/demo/reset', c.resetDemo);
export default r;
