import os from 'node:os';
import { config } from './config.js';

export function getLanIp() {
  for (const list of Object.values(os.networkInterfaces())) {
    for (const nic of list || []) {
      if (nic.family === 'IPv4' && !nic.internal) return nic.address;
    }
  }
  return null;
}

// The QR code must contain a URL the PHONE can reach, so swap localhost for the LAN IP.
export function publicClientUrl() {
  try {
    const u = new URL(config.clientUrl);
    if (['localhost', '127.0.0.1', '::1'].includes(u.hostname)) {
      const ip = getLanIp();
      if (ip) u.hostname = ip;
    }
    return u.toString().replace(/\/$/, '');
  } catch {
    return config.clientUrl;
  }
}

export function allowedOrigins() {
  const ip = getLanIp();
  const list = new Set([config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173', publicClientUrl()]);
  if (ip) {
    list.add(`http://${ip}:5173`);
    list.add(`http://${ip}:${config.port}`);
  }
  list.add(`http://localhost:${config.port}`);
  return [...list];
}
