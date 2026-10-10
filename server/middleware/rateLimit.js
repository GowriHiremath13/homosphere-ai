import { HttpError } from '../utils/HttpError.js';

// Minimal sliding-window limiter (per IP). Enough to stop pairing-code guessing on a LAN.
export function rateLimit({ windowMs = 60_000, max = 30 } = {}) {
  const hits = new Map();
  setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [ip, arr] of hits) {
      const fresh = arr.filter((t) => t > cutoff);
      if (fresh.length) hits.set(ip, fresh); else hits.delete(ip);
    }
  }, windowMs).unref();

  return (req, _res, next) => {
    const now = Date.now();
    const arr = (hits.get(req.ip) || []).filter((t) => now - t < windowMs);
    arr.push(now);
    hits.set(req.ip, arr);
    if (arr.length > max) return next(new HttpError(429, 'RATE_LIMITED', 'Too many attempts. Please wait a moment.'));
    return next();
  };
}
