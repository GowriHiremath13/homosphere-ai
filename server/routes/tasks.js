import { Router } from 'express';
import * as c from '../controllers/tasks.controller.js';
import { validate } from '../middleware/validate.js';
import { validateTask } from '../utils/validators.js';

const r = Router();
r.get('/', c.list);
r.post('/', validate((b) => validateTask(b)), c.create);
r.put('/:id', validate((b) => validateTask(b, { partial: true })), c.update);
r.delete('/:id', c.remove);
export default r;
