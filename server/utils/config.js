import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, '../../.env') }); // repo root
dotenv.config(); // fallback: ./.env

const env = process.env;
const provider = (env.AI_PROVIDER || 'anthropic').toLowerCase();

export const config = {
  port: Number(env.PORT) || 4000,
  clientUrl: (env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, ''),
  databaseUrl: env.DATABASE_URL || '',
  requireDb: env.REQUIRE_DB === 'true',
  deviceName: env.DEVICE_NAME || 'Living Room TV',
  pairingTtlMs: (Number(env.PAIRING_TTL_MINUTES) || 10) * 60 * 1000,
  demoModeDefault: env.DEMO_MODE ? env.DEMO_MODE === 'true' : !env.AI_API_KEY,
  ai: {
    apiKey: env.AI_API_KEY || '',
    provider,
    model: env.AI_MODEL || (provider === 'openai' ? 'gpt-4o-mini' : 'claude-sonnet-5'),
    baseUrl: env.AI_BASE_URL || '',
    timeoutMs: 25000,
  },
  weather: {
    provider: (env.WEATHER_PROVIDER || 'open-meteo').toLowerCase(),
    locationName: env.WEATHER_LOCATION_NAME || 'Bengaluru, India',
    lat: Number(env.WEATHER_LAT) || 12.9716,
    lon: Number(env.WEATHER_LON) || 77.5946,
  },
};
