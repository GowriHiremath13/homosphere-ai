import { randomUUID } from 'node:crypto';

// Volatile fallback with the same interface as postgresRepo. Used when no PostgreSQL database is reachable (demo / offline).
const clone = (o) => (o == null ? o : JSON.parse(JSON.stringify(o)));
const stamp = () => new Date().toISOString();

export function createMemoryRepo() {
  const s = { tasks: [], schedule: [], devices: [], messages: [], user: null };

  return {
    kind: 'memory',
    tasks: {
      list: async () => clone([...s.tasks].reverse()),
      get: async (id) => clone(s.tasks.find((t) => t.id === id) || null),
      create: async (data) => {
        const t = { id: randomUUID(), description: '', priority: 'MEDIUM', status: 'pending', dueDate: null, createdBy: 'tv', ...data, createdAt: stamp(), updatedAt: stamp() };
        if (t.dueDate instanceof Date) t.dueDate = t.dueDate.toISOString();
        s.tasks.push(t);
        return clone(t);
      },
      update: async (id, patch) => {
        const t = s.tasks.find((x) => x.id === id);
        if (!t) return null;
        Object.assign(t, patch, { updatedAt: stamp() });
        if (t.dueDate instanceof Date) t.dueDate = t.dueDate.toISOString();
        return clone(t);
      },
      remove: async (id) => {
        const before = s.tasks.length;
        s.tasks = s.tasks.filter((t) => t.id !== id);
        return s.tasks.length < before;
      },
      count: async () => s.tasks.length,
      clear: async () => { s.tasks = []; },
    },
    schedule: {
      listByDate: async (date) => clone(s.schedule.filter((e) => e.date === date).sort((a, b) => a.startTime.localeCompare(b.startTime))),
      create: async (data) => {
        const e = { id: randomUUID(), source: 'user', ...data, createdAt: stamp(), updatedAt: stamp() };
        s.schedule.push(e);
        return clone(e);
      },
      remove: async (id) => {
        const before = s.schedule.length;
        s.schedule = s.schedule.filter((e) => e.id !== id);
        return s.schedule.length < before;
      },
      removeBySource: async (date, source) => { s.schedule = s.schedule.filter((e) => !(e.date === date && e.source === source)); },
      countByDate: async (date) => s.schedule.filter((e) => e.date === date).length,
      clear: async () => { s.schedule = []; },
    },
    devices: {
      get: async (deviceId) => clone(s.devices.find((d) => d.deviceId === deviceId) || null),
      findByCode: async (code) => clone(s.devices.find((d) => d.pairingCode === code && new Date(d.pairingExpiresAt) > new Date()) || null),
      upsert: async (deviceId, patch) => {
        let d = s.devices.find((x) => x.deviceId === deviceId);
        if (!d) { d = { id: randomUUID(), deviceId, name: 'Living Room TV', tokenHashes: [], connectedAt: null }; s.devices.push(d); }
        Object.assign(d, patch);
        const { tokenHashes, ...pub } = clone(d);
        return pub;
      },
      addTokenHash: async (deviceId, hash) => {
        const d = s.devices.find((x) => x.deviceId === deviceId);
        if (d && !d.tokenHashes.includes(hash)) d.tokenHashes.push(hash);
      },
      hasTokenHash: async (deviceId, hash) => Boolean(s.devices.find((x) => x.deviceId === deviceId)?.tokenHashes.includes(hash)),
    },
    messages: {
      add: async (data) => { const m = { id: randomUUID(), timestamp: stamp(), ...data }; s.messages.push(m); return clone(m); },
      recent: async (limit = 6) => clone(s.messages.slice(-limit)),
    },
    user: {
      get: async () => clone(s.user),
      save: async (data) => { s.user = { id: s.user?.id || randomUUID(), ...s.user, ...data }; return clone(s.user); },
    },
  };
}
