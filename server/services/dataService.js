import { prisma } from '../utils/prisma.js';
import { config } from '../utils/config.js';
import { postgresRepo } from './repositories/postgresRepo.js';
import { createMemoryRepo } from './repositories/memoryRepo.js';

let repo = createMemoryRepo();

// `db` is a thin proxy so every service always talks to whichever repository is active.
export const db = {
  get kind() { return repo.kind; },
  get tasks() { return repo.tasks; },
  get schedule() { return repo.schedule; },
  get devices() { return repo.devices; },
  get messages() { return repo.messages; },
  get user() { return repo.user; },
};

export async function connectDatabase() {
  if (!config.databaseUrl) {
    if (config.requireDb) throw new Error('REQUIRE_DB=true but DATABASE_URL is empty');
    console.warn('[db] DATABASE_URL not set - using volatile in-memory store (demo only).');
    return db.kind;
  }
  if (!prisma) {
    if (config.requireDb) throw new Error('PrismaClient is not generated - run `npm run prisma:generate` first.');
    console.warn('[db] PrismaClient is not generated yet. Falling back to in-memory store.');
    console.warn('[db] Run `npm run prisma:generate` (see README) then restart to use PostgreSQL.');
    return db.kind;
  }
  try {
    // Cheap connectivity check - also confirms the schema's tables actually exist
    // (a fresh Postgres DB with no migrations run would fail here with a clear error).
    await prisma.$queryRaw`SELECT 1`;
    await prisma.user.count();
    repo = postgresRepo;
    console.log('[db] Connected to PostgreSQL via Prisma.');
  } catch (err) {
    if (config.requireDb) throw err;
    console.warn(`[db] PostgreSQL unreachable or not migrated (${err.message.split('\n')[0]}). Falling back to in-memory store.`);
    console.warn('[db] Run `npm run prisma:migrate` (see README) then restart to use PostgreSQL.');
  }
  return db.kind;
}

export async function disconnectDatabase() {
  if (prisma) await prisma.$disconnect().catch(() => {});
}

const PRIORITY_WEIGHT = { HIGH: 0, MEDIUM: 1, LOW: 2 };
export function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    const done = Number(a.status === 'done') - Number(b.status === 'done');
    if (done) return done;
    const p = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
    if (p) return p;
    const ad = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const bd = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    return ad - bd;
  });
}
