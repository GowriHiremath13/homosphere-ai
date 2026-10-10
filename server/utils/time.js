export const pad = (n) => String(n).padStart(2, '0');

export function todayISO(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isISODate(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(s).getTime());
}

export function isHHMM(s) {
  return typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}

// Accepts "5:00 PM", "5:00pm", "17:00". Returns {h24, min} or null.
export function parseTime(input) {
  const m = /^\s*(\d{1,2}):(\d{2})\s*([AaPp][Mm])?\s*$/.exec(input ?? '');
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  const ap = m[3]?.toUpperCase();
  if (min > 59) return null;
  if (ap) {
    if (h < 1 || h > 12) return null;
    return { h24: (h % 12) + (ap === 'PM' ? 12 : 0), min };
  }
  if (h > 23) return null;
  return { h24: h, min };
}

export function to24h(input) {
  const t = parseTime(input);
  return t ? `${pad(t.h24)}:${pad(t.min)}` : null;
}

export function to12hLabel(hhmm) {
  const t = parseTime(hhmm);
  if (!t) return '';
  const h = t.h24 % 12 || 12;
  return `${h}:${pad(t.min)} ${t.h24 >= 12 ? 'PM' : 'AM'}`;
}

export function addMinutes(hhmm, mins) {
  const t = parseTime(hhmm);
  const total = Math.min(23 * 60 + 59, t.h24 * 60 + t.min + mins);
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

export function dateAt(hhmm, base = new Date()) {
  const t = parseTime(hhmm);
  const d = new Date(base);
  d.setHours(t.h24, t.min, 0, 0);
  return d;
}
