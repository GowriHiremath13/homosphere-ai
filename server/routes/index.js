import { Router } from 'express';
import tasks from './tasks.js';
import schedule from './schedule.js';
import weather from './weather.js';
import ai from './ai.js';
import device from './device.js';
import settings from './settings.js';
import { getSettings } from '../services/settingsService.js';

const api = Router();
api.get('/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString(), settings: getSettings() }));
api.use('/tasks', tasks);
api.use('/schedule', schedule);
api.use('/weather', weather);
api.use('/ai', ai);
api.use('/device', device);
api.use('/', settings);
export default api;
