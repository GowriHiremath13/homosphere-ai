import { HttpError } from '../utils/HttpError.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `No route for ${req.method} ${req.path}` } });
}

// Never leaks stack traces or internal messages to clients.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' } });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' } });
  }
  if (err?.name === 'ValidationError' || err?.name === 'CastError') {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid data' } });
  }
  console.error('[error]', err);
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong on the server' } });
}
