import { randomUUID } from 'node:crypto';

let io = null;
export const setIO = (instance) => { io = instance; };

// Every authenticated TV/phone socket joins the "household" room.
export const broadcast = (event, payload) => io?.to('household').emit(event, payload);
export const toDevice = (deviceId, event, payload) => io?.to(`device:${deviceId}`).emit(event, payload);
export const notify = (text, kind = 'info') =>
  broadcast('notification', { id: randomUUID(), text, kind, at: Date.now() });
