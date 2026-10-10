import { randomBytes, randomInt, createHash, randomUUID } from 'node:crypto';
import { db } from './dataService.js';
import { config } from '../utils/config.js';
import { publicClientUrl } from '../utils/network.js';
import { HttpError, notFound } from '../utils/HttpError.js';
import { getStatus } from '../sockets/presence.js';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
const hash = (token) => createHash('sha256').update(token).digest('hex');

async function newCode() {
  for (let i = 0; i < 10; i += 1) {
    let code = '';
    for (let k = 0; k < 6; k += 1) code += ALPHABET[randomInt(ALPHABET.length)];
    if (!(await db.devices.findByCode(code))) return code;
  }
  throw new HttpError(500, 'CODE_GENERATION_FAILED', 'Could not generate a pairing code');
}

export const buildPairUrl = (code) => `${publicClientUrl()}/mobile?pair=${code}`;

function publicDevice(device) {
  return {
    deviceId: device.deviceId,
    name: device.name,
    pairingCode: device.pairingCode,
    pairingExpiresAt: device.pairingExpiresAt,
    pairUrl: device.pairingCode ? buildPairUrl(device.pairingCode) : null,
  };
}

// TV calls this on boot (and whenever its code expires). Same deviceId => same device, fresh code.
export async function registerTv(requestedId) {
  const deviceId = /^tv_[a-z0-9-]{6,40}$/i.test(requestedId || '') ? requestedId : `tv_${randomUUID().slice(0, 12)}`;
  const existing = await db.devices.get(deviceId);
  const device = await db.devices.upsert(deviceId, {
    name: existing?.name || config.deviceName,
    pairingCode: await newCode(),
    pairingExpiresAt: new Date(Date.now() + config.pairingTtlMs),
  });
  return publicDevice(device);
}

export const rotateCode = registerTv;

export async function pairPhone(code, phoneName) {
  const device = await db.devices.findByCode(code);
  if (!device) throw new HttpError(404, 'INVALID_OR_EXPIRED_CODE', 'That code is wrong or has expired. Check the TV for a new one.');
  const token = randomBytes(24).toString('hex');
  await db.devices.addTokenHash(device.deviceId, hash(token));
  await db.devices.upsert(device.deviceId, { connectedAt: new Date() });
  return { deviceId: device.deviceId, deviceName: device.name, token, phoneName };
}

export async function verifyToken(deviceId, token) {
  if (typeof deviceId !== 'string' || typeof token !== 'string') return false;
  return db.devices.hasTokenHash(deviceId, hash(token));
}

export async function deviceStatus(deviceId) {
  const device = await db.devices.get(deviceId);
  if (!device) throw notFound('Device not found');
  return getStatus(deviceId, { name: device.name, connectedAt: device.connectedAt });
}
