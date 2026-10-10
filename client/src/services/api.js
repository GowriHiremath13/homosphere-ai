const BASE = import.meta.env.VITE_API_BASE || '';

export class ApiError extends Error {
  constructor(message, code = 'ERROR', status = 0) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request(method, path, body) {
  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers: body !== undefined ? { 'content-type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Unable to connect to HomeSphere.', 'NETWORK', 0);
  }
  if (res.status === 204) return null;
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON error page */ }
  if (!res.ok) throw new ApiError(data?.error?.message || 'Something went wrong. Please try again.', data?.error?.code || 'ERROR', res.status);
  return data;
}

export const api = {
  tasks: {
    list: () => request('GET', '/tasks'),
    create: (t) => request('POST', '/tasks', t),
    update: (id, patch) => request('PUT', `/tasks/${id}`, patch),
    remove: (id) => request('DELETE', `/tasks/${id}`),
  },
  schedule: {
    list: (date) => request('GET', `/schedule${date ? `?date=${date}` : ''}`),
    importItems: (items) => request('POST', '/schedule/import', { items }),
  },
  weather: (refresh) => request('GET', `/weather${refresh ? '?refresh=1' : ''}`),
  ai: {
    chat: (body) => request('POST', '/ai/chat', body),
    plan: (body) => request('POST', '/ai/plan', body),
    briefing: (body = {}) => request('POST', '/ai/briefing', body),
    prioritize: (body = {}) => request('POST', '/ai/prioritize', body),
  },
  device: {
    register: (deviceId) => request('POST', '/device/register', { deviceId }),
    rotate: (id) => request('POST', `/device/${id}/rotate-code`, {}),
    pair: (code, phoneName) => request('POST', '/device/pair', { code, phoneName }),
    status: (id) => request('GET', `/device/${id}/status`),
  },
  settings: {
    get: () => request('GET', '/settings'),
    update: (patch) => request('PUT', '/settings', patch),
  },
  user: { get: () => request('GET', '/user') },
  demoReset: () => request('POST', '/demo/reset', {}),
};
