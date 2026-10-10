import { db } from './dataService.js';
import { config } from '../utils/config.js';

let cache = null;

async function ensureUser() {
  let user = await db.user.get();
  if (!user) {
    user = await db.user.save({ name: 'Alex', preferences: { demoMode: config.demoModeDefault } });
  }
  return user;
}

export async function loadSettings() {
  const user = await ensureUser();
  cache = { demoMode: user.preferences?.demoMode ?? config.demoModeDefault, aiConfigured: Boolean(config.ai.apiKey) };
  return getSettings();
}

export const isDemo = () => (cache ? cache.demoMode : config.demoModeDefault);

export function getSettings() {
  return {
    demoMode: isDemo(),
    aiConfigured: Boolean(config.ai.apiKey),
    weatherProvider: config.weather.provider,
    storage: db.kind,
    deviceName: config.deviceName,
  };
}

export async function setDemoMode(enabled) {
  const user = await ensureUser();
  await db.user.save({ preferences: { ...(user.preferences || {}), demoMode: Boolean(enabled) } });
  cache = { ...(cache || {}), demoMode: Boolean(enabled) };
  return getSettings();
}

export async function getUser() { return ensureUser(); }

export async function updateUser(patch) {
  const user = await ensureUser();
  const next = {};
  if (patch.name) next.name = patch.name;
  if (patch.preferences) next.preferences = { ...(user.preferences || {}), ...patch.preferences };
  const saved = await db.user.save(next);
  if (patch.preferences && 'demoMode' in patch.preferences) cache = { ...(cache || {}), demoMode: Boolean(patch.preferences.demoMode) };
  return saved;
}
