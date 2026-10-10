import { config } from '../utils/config.js';
import { HttpError } from '../utils/HttpError.js';
import { isDemo } from './settingsService.js';

// ---- Provider contract: async () => { location, temperatureC, condition, icon, rainProbability, windKph, humidity, source, updatedAt }
// Add a provider by writing one function and registering it in PROVIDERS below.

const mockProvider = async () => ({
  location: config.weather.locationName,
  temperatureC: 27,
  condition: 'Showers likely this evening',
  icon: 'rain',
  rainProbability: 70,
  windKph: 14,
  humidity: 78,
  source: 'mock',
  updatedAt: new Date().toISOString(),
});

// WMO weather codes -> label + icon key used by the client
function describeCode(code) {
  if (code === 0) return ['Clear sky', 'sun'];
  if ([1, 2].includes(code)) return ['Partly cloudy', 'cloud-sun'];
  if (code === 3) return ['Overcast', 'cloud'];
  if ([45, 48].includes(code)) return ['Fog', 'cloud'];
  if ([51, 53, 55, 56, 57].includes(code)) return ['Drizzle', 'rain'];
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return ['Rain', 'rain'];
  if ([71, 73, 75, 77, 85, 86].includes(code)) return ['Snow', 'snow'];
  if ([95, 96, 99].includes(code)) return ['Thunderstorm', 'storm'];
  return ['Unknown', 'cloud'];
}

// Open-Meteo: free, no API key. https://open-meteo.com/en/docs
const openMeteoProvider = async () => {
  const { lat, lon, locationName } = config.weather;
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m` +
    `&hourly=precipitation_probability&forecast_days=2&timezone=auto`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`Open-Meteo responded ${res.status}`);
  const data = await res.json();
  const cur = data.current;
  const nowIso = cur.time;
  const idx = data.hourly.time.findIndex((t) => t >= nowIso);
  const next6 = data.hourly.precipitation_probability.slice(Math.max(idx, 0), Math.max(idx, 0) + 6).filter((n) => n != null);
  const [condition, icon] = describeCode(cur.weather_code);
  return {
    location: locationName,
    temperatureC: Math.round(cur.temperature_2m),
    condition,
    icon,
    rainProbability: next6.length ? Math.max(...next6) : 0,
    windKph: Math.round(cur.wind_speed_10m),
    humidity: Math.round(cur.relative_humidity_2m),
    source: 'open-meteo',
    updatedAt: new Date().toISOString(),
  };
};

const PROVIDERS = { mock: mockProvider, 'open-meteo': openMeteoProvider };

let cache = { at: 0, key: '', value: null };
const TTL = 10 * 60 * 1000;

export async function getWeather({ force = false } = {}) {
  const providerName = isDemo() ? 'mock' : config.weather.provider;
  const provider = PROVIDERS[providerName];
  if (!provider) throw new HttpError(500, 'WEATHER_CONFIG', `Unknown WEATHER_PROVIDER "${providerName}"`);
  if (!force && cache.key === providerName && Date.now() - cache.at < TTL && cache.value) return cache.value;
  try {
    const value = await provider();
    cache = { at: Date.now(), key: providerName, value };
    return value;
  } catch (err) {
    console.error('[weather]', err.message);
    throw new HttpError(502, 'WEATHER_UNAVAILABLE', 'Weather is unavailable right now.');
  }
}
