export const pad = (n) => String(n).padStart(2, '0');

export function time12(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`;
}

export const clockText = (d) => `${d.getHours() % 12 || 12}:${pad(d.getMinutes())}`;
export const ampm = (d) => (d.getHours() >= 12 ? 'PM' : 'AM');
export const longDate = (d) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

export function greeting(d) {
  const h = d.getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function dueLabel(iso, now = new Date()) {
  if (!iso) return 'No due time';
  const d = new Date(iso);
  const t = `${d.getHours() % 12 || 12}:${pad(d.getMinutes())} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (d.toDateString() === now.toDateString()) return d < now ? `Overdue, was ${t}` : `Due ${t}`;
  if (d.toDateString() === tomorrow.toDateString()) return `Due tomorrow ${t}`;
  if (d < now) return `Overdue since ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  return `Due ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${t}`;
}

export function timerText(secs) {
  const s = Math.max(0, Math.round(secs));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`;
}

export function durationLabel(startHHMM, endHHMM) {
  const [sh, sm] = startHHMM.split(':').map(Number);
  const [eh, em] = endHHMM.split(':').map(Number);
  const mins = eh * 60 + em - (sh * 60 + sm);
  if (mins <= 0) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

export const hhmmNow = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const PRIORITY_LABEL = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' };
export const NEXT_PRIORITY = { HIGH: 'MEDIUM', MEDIUM: 'LOW', LOW: 'HIGH' };
