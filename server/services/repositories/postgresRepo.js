import { prisma } from '../../utils/prisma.js';

// Single-household app: every row belongs to the one "primary" User, created lazily on first
// use. Cached after the first lookup so we're not hitting the DB on every single create() call.
let primaryUserId = null;
async function ensurePrimaryUserId() {
  if (primaryUserId) return primaryUserId;
  let user = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!user) user = await prisma.user.create({ data: { name: 'Alex', preferences: {} } });
  primaryUserId = user.id;
  return primaryUserId;
}

// Prisma throws (rather than returning null) when update/delete targets a missing row.
// These helpers normalise that back to the null/false the service layer already expects
// (matching how the in-memory repo behaves for the same case).
const MISSING_RECORD = 'P2025';
async function safeUpdate(model, where, data) {
  try {
    return await prisma[model].update({ where, data });
  } catch (err) {
    if (err.code === MISSING_RECORD) return null;
    throw err;
  }
}
async function safeDelete(model, where) {
  try {
    await prisma[model].delete({ where });
    return true;
  } catch (err) {
    if (err.code === MISSING_RECORD) return false;
    throw err;
  }
}

// Strip the internal FK (and, for devices, the token hashes) before anything reaches a
// controller/socket handler. Enum values already match the app's own string constants
// (e.g. "pending", "HIGH", "ai"), so no relabeling is needed going the other way.
function omit(obj, keys) {
  if (!obj) return null;
  const out = { ...obj };
  for (const k of keys) delete out[k];
  return out;
}
const taskJSON = (t) => omit(t, ['userId']);
const scheduleJSON = (e) => omit(e, ['userId']);
const deviceJSON = (d) => omit(d, ['userId', 'tokenHashes']);
const messageJSON = (m) => omit(m, ['userId']);

export const postgresRepo = {
  kind: 'postgresql',

  tasks: {
    list: async () => (await prisma.task.findMany({ orderBy: { createdAt: 'desc' } })).map(taskJSON),
    get: async (id) => taskJSON(await prisma.task.findUnique({ where: { id } })),
    create: async (data) => {
      const userId = await ensurePrimaryUserId();
      return taskJSON(await prisma.task.create({ data: { ...data, userId } }));
    },
    update: async (id, patch) => taskJSON(await safeUpdate('task', { id }, patch)),
    remove: async (id) => safeDelete('task', { id }),
    count: () => prisma.task.count(),
    clear: () => prisma.task.deleteMany({}),
  },

  schedule: {
    listByDate: async (date) =>
      (await prisma.schedule.findMany({ where: { date }, orderBy: { startTime: 'asc' } })).map(scheduleJSON),
    create: async (data) => {
      const userId = await ensurePrimaryUserId();
      return scheduleJSON(await prisma.schedule.create({ data: { ...data, userId } }));
    },
    remove: async (id) => safeDelete('schedule', { id }),
    removeBySource: (date, source) => prisma.schedule.deleteMany({ where: { date, source } }),
    countByDate: (date) => prisma.schedule.count({ where: { date } }),
    clear: () => prisma.schedule.deleteMany({}),
  },

  devices: {
    get: async (deviceId) => deviceJSON(await prisma.device.findUnique({ where: { deviceId } })),
    findByCode: async (code) =>
      deviceJSON(await prisma.device.findFirst({ where: { pairingCode: code, pairingExpiresAt: { gt: new Date() } } })),
    upsert: async (deviceId, patch) => {
      const userId = await ensurePrimaryUserId();
      return deviceJSON(
        await prisma.device.upsert({
          where: { deviceId },
          create: { deviceId, name: 'Living Room TV', userId, ...patch },
          update: patch,
        })
      );
    },
    addTokenHash: async (deviceId, hash) => {
      const device = await prisma.device.findUnique({ where: { deviceId }, select: { tokenHashes: true } });
      if (device?.tokenHashes?.includes(hash)) return; // already present, avoid unbounded growth
      await prisma.device.update({ where: { deviceId }, data: { tokenHashes: { push: hash } } });
    },
    hasTokenHash: async (deviceId, hash) => {
      const device = await prisma.device.findUnique({ where: { deviceId }, select: { tokenHashes: true } });
      return Boolean(device?.tokenHashes?.includes(hash));
    },
  },

  messages: {
    add: async (data) => {
      const userId = await ensurePrimaryUserId();
      return messageJSON(await prisma.aiConversation.create({ data: { ...data, userId } }));
    },
    recent: async (limit = 6) =>
      (await prisma.aiConversation.findMany({ orderBy: { timestamp: 'desc' }, take: limit })).reverse().map(messageJSON),
  },

  user: {
    get: async () => {
      const id = await ensurePrimaryUserId();
      return prisma.user.findUnique({ where: { id } });
    },
    save: async (data) => {
      const id = await ensurePrimaryUserId();
      return prisma.user.update({ where: { id }, data });
    },
  },
};
