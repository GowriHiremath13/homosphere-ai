import { io } from 'socket.io-client';

// Same-origin by default (Vite proxies /socket.io in dev; Express serves everything in production).
export function createSocket() {
  return io(import.meta.env.VITE_SERVER_URL || undefined, {
    reconnectionDelay: 800,
    reconnectionDelayMax: 5000,
  });
}
