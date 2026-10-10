import { db } from '../services/dataService.js';
import { broadcast, toDevice, notify } from '../services/realtime.js';
import * as devices from '../services/deviceService.js';
import * as tasks from '../services/taskService.js';
import { respond } from '../services/aiService.js';
import { getSettings, isDemo } from '../services/settingsService.js';
import { validateTask, validateAIRequest } from '../utils/validators.js';
import { badRequest, HttpError } from '../utils/HttpError.js';
import { cleanText } from '../utils/sanitize.js';
import * as presence from './presence.js';

const SCREENS = ['dashboard', 'tasks', 'planner', 'ai', 'timer', 'settings'];
const KEYS = ['up', 'down', 'left', 'right', 'select', 'back'];

async function pushStatus(deviceId) {
  const device = await db.devices.get(deviceId);
  toDevice(deviceId, 'device:status', presence.getStatus(deviceId, { name: device?.name, demoMode: isDemo() }));
}

async function runAI({ message, mode, source }) {
  broadcast('ai:thinking', { message, mode, source });
  try {
    const result = await respond({ message, mode, source });
    broadcast('ai:response', { request: message, from: source, ...result });
    return result;
  } catch (err) {
    const friendly = err instanceof HttpError && err.status < 500 ? err.message : err.message || 'The AI could not answer right now.';
    broadcast('ai:error', { message: friendly, code: err.code || 'AI_ERROR' });
    throw err;
  }
}

// Wrap a handler: acks {ok:true,...} or {ok:false,error}; never leaks internals.
const handle = (fn) => async (payload, ack) => {
  try {
    const result = (await fn(payload ?? {})) || {};
    if (typeof ack === 'function') ack({ ok: true, ...result });
  } catch (err) {
    const known = err instanceof HttpError && err.status < 500;
    if (!known) console.error('[socket]', err);
    if (typeof ack === 'function') ack({ ok: false, error: { code: err.code || 'ERROR', message: known ? err.message : 'Something went wrong' } });
  }
};

export function initSockets(io) {
  io.on('connection', (socket) => {
    const requireRole = (role) => {
      if (socket.data.role !== role || !socket.data.deviceId) throw new HttpError(401, 'NOT_JOINED', 'Connect to a TV first');
      return socket.data.deviceId;
    };

    // ---------------- TV ----------------
    socket.on('tv:register', handle(async ({ deviceId }) => {
      const device = await devices.registerTv(deviceId);
      socket.data = { role: 'tv', deviceId: device.deviceId };
      socket.join('household');
      socket.join(`device:${device.deviceId}`);
      presence.addTv(device.deviceId, socket.id);
      await pushStatus(device.deviceId);
      return { device, settings: getSettings() };
    }));

    socket.on('tv:refresh-code', handle(async () => {
      const id = requireRole('tv');
      const device = await devices.rotateCode(id);
      return { device };
    }));

    socket.on('tv:screen', handle(async ({ screen }) => {
      const id = requireRole('tv');
      if (!SCREENS.includes(screen)) throw badRequest('Unknown screen');
      presence.setScreen(id, screen);
      await pushStatus(id);
    }));

    socket.on('tv:timer', handle(async ({ timer }) => {
      const id = requireRole('tv');
      if (!timer || typeof timer !== 'object') throw badRequest('timer is required');
      const safe = {
        duration: Number(timer.duration) || 0,
        remaining: Number(timer.remaining) || 0,
        running: Boolean(timer.running),
        endAt: timer.endAt ? Number(timer.endAt) : null,
        finished: Boolean(timer.finished),
      };
      presence.setTimer(id, safe);
      toDevice(id, 'timer:state', safe);
    }));

    // Demo mode: pretend a phone connected, added a task and asked the AI something.
    socket.on('tv:demo:simulate-phone', handle(async () => {
      const id = requireRole('tv');
      if (!isDemo()) throw badRequest('Turn on Demo Mode to simulate a phone');
      presence.setSimulated(id, 1);
      await pushStatus(id);
      notify('Demo phone connected', 'success');
      setTimeout(() => tasks.createTask({ title: 'Pick up the parcel', priority: 'MEDIUM', description: 'Added from the demo phone' }, 'phone').catch(() => {}), 1500);
      setTimeout(() => runAI({ message: 'What should I do before the rain?', mode: 'chat', source: 'phone' }).catch(() => {}), 4000);
    }));

    // ---------------- Phone ----------------
    socket.on('phone:join', handle(async ({ deviceId, token, name }) => {
      if (!(await devices.verifyToken(deviceId, token))) {
        throw new HttpError(401, 'INVALID_SESSION', 'This phone is no longer paired. Scan the QR code again.');
      }
      const phoneName = cleanText(name, 40) || 'Phone';
      socket.data = { role: 'phone', deviceId, phoneName };
      socket.join('household');
      socket.join(`device:${deviceId}`);
      presence.addPhone(deviceId, socket.id, phoneName);
      const device = await db.devices.get(deviceId);
      await pushStatus(deviceId);
      notify(`${phoneName} connected`, 'success');
      return {
        deviceName: device?.name || 'Living Room TV',
        status: presence.getStatus(deviceId, { name: device?.name, demoMode: isDemo() }),
        tasks: await tasks.listTasks(),
        settings: getSettings(),
      };
    }));

    socket.on('phone:task:add', handle(async (payload) => {
      requireRole('phone');
      const task = await tasks.createTask(validateTask(payload), 'phone');
      return { task };
    }));

    socket.on('phone:task:complete', handle(async ({ id, done = true }) => {
      requireRole('phone');
      const task = await tasks.updateTask(String(id), { status: done ? 'done' : 'pending' }, { announce: true });
      return { task };
    }));

    socket.on('phone:ai:ask', handle(async (payload) => {
      requireRole('phone');
      const req = validateAIRequest({ ...payload, source: 'phone' });
      const result = await runAI({ message: req.message, mode: req.mode, source: 'phone' });
      return result;
    }));

    socket.on('phone:timer', handle(async ({ action, seconds }) => {
      const id = requireRole('phone');
      if (!['start', 'pause', 'reset', 'set'].includes(action)) throw badRequest('Unknown timer action');
      const secs = Number(seconds);
      if (['start', 'set'].includes(action) && seconds !== undefined && !(secs >= 1 && secs <= 14400)) throw badRequest('Seconds must be between 1 and 14400');
      toDevice(id, 'timer:command', { action, seconds: Number.isFinite(secs) ? secs : undefined });
    }));

    socket.on('phone:key', handle(async ({ key }) => {
      const id = requireRole('phone');
      if (!KEYS.includes(key)) throw badRequest('Unknown key');
      toDevice(id, 'remote:key', { key });
    }));

    socket.on('phone:goto', handle(async ({ screen }) => {
      const id = requireRole('phone');
      if (!SCREENS.includes(screen)) throw badRequest('Unknown screen');
      toDevice(id, 'tv:navigate', { screen });
    }));

    socket.on('phone:status', handle(async () => {
      const id = requireRole('phone');
      const device = await db.devices.get(id);
      return { status: presence.getStatus(id, { name: device?.name, demoMode: isDemo() }) };
    }));

    // ---------------- Disconnect ----------------
    socket.on('disconnect', async () => {
      const { role, deviceId, phoneName } = socket.data || {};
      if (!deviceId) return;
      if (role === 'tv') presence.removeTv(deviceId, socket.id);
      if (role === 'phone') {
        presence.removePhone(deviceId, socket.id);
        notify(`${phoneName || 'Phone'} disconnected`, 'info');
      }
      await pushStatus(deviceId).catch(() => {});
    });
  });
}
