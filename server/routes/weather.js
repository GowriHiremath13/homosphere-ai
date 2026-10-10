import { Router } from 'express';
import * as c from '../controllers/weather.controller.js';
const r = Router();
r.get('/', c.get);
export default r;
