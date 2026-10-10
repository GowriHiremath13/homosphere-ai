import { Router } from 'express';
import * as c from '../controllers/schedule.controller.js';
import { validate } from '../middleware/validate.js';
import { validateSchedule, validateImportItems } from '../utils/validators.js';

const r = Router();
r.get('/', c.list);
r.post('/', validate(validateSchedule), c.create);
r.post('/import', validate(validateImportItems), c.importItems);
r.delete('/:id', c.remove);
export default r;
