// In-memory presence: who is connected to which TV right now.
const devices = new Map();

const ensure = (deviceId) => {
  if (!devices.has(deviceId)) {
    devices.set(deviceId, { tv: new Set(), phones: new Map(), screen: 'dashboard', timer: null, lastSeen: null, simulatedPhones: 0 });
  }
  return devices.get(deviceId);
};

export const addTv = (deviceId, socketId) => { const d = ensure(deviceId); d.tv.add(socketId); d.lastSeen = Date.now(); };
export const removeTv = (deviceId, socketId) => { const d = ensure(deviceId); d.tv.delete(socketId); d.lastSeen = Date.now(); };
export const addPhone = (deviceId, socketId, name) => ensure(deviceId).phones.set(socketId, { name, joinedAt: Date.now() });
export const removePhone = (deviceId, socketId) => ensure(deviceId).phones.delete(socketId);
export const setScreen = (deviceId, screen) => { ensure(deviceId).screen = screen; };
export const setTimer = (deviceId, timer) => { ensure(deviceId).timer = timer; };
export const setSimulated = (deviceId, n) => { ensure(deviceId).simulatedPhones = n; };

export function getStatus(deviceId, extra = {}) {
  const d = ensure(deviceId);
  const phones = [...d.phones.values()].map((p) => ({ name: p.name, joinedAt: p.joinedAt }));
  for (let i = 0; i < d.simulatedPhones; i += 1) phones.push({ name: 'Demo phone', joinedAt: Date.now(), simulated: true });
  return {
    deviceId,
    tvOnline: d.tv.size > 0,
    screen: d.screen,
    phones,
    phoneCount: phones.length,
    timer: d.timer,
    lastSeen: d.lastSeen,
    ...extra,
  };
}
