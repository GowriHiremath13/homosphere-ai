import { PrismaClient } from '@prisma/client';
import { config } from './config.js';

// Singleton pattern recommended by Prisma for Node.js: `node --watch` (our dev script) reloads
// this module on every file change, and without caching the instance on `global`, each reload
// would open a fresh pool of Postgres connections that's never closed, exhausting the DB's
// connection limit within a few edits. Caching on `global` survives module reloads.
const g = globalThis;

// `new PrismaClient()` throws SYNCHRONOUSLY (not just on first query) if `prisma generate`
// hasn't been run yet - and since this module is imported at server startup, an uncaught
// throw here would crash the whole process before it ever got a chance to fall back to the
// in-memory store. We catch it here instead: `prisma` is `null` until generated, and
// dataService.js's connectDatabase() treats that exactly like "database unreachable".
let client = g.__homesphere_prisma__ ?? null;
if (!client) {
  try {
    client = new PrismaClient();
    if (process.env.NODE_ENV !== 'production') g.__homesphere_prisma__ = client;
  } catch (err) {
    // Only worth warning about if the user actually configured a database - otherwise this
    // is just the expected zero-config demo path and the warning would be pure noise.
    if (config.databaseUrl) {
      console.warn('[prisma] PrismaClient is not generated yet:', err.message.split('\n')[0]);
      console.warn('[prisma] Run `npm run prisma:generate` (see README) to enable PostgreSQL.');
    }
    client = null;
  }
}

export const prisma = client;
