import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createSocket } from '../services/socket.js';
import { storage } from '../services/storage.js';

const SocketCtx = createContext(null);
export const useSocketCtx = () => useContext(SocketCtx);

// Shared connection lifecycle for both /tv and /mobile. `role` decides the join handshake.
export function SocketProvider({ role, children }) {
  const socketRef = useRef(null);
  if (!socketRef.current) socketRef.current = createSocket();
  const socket = socketRef.current;

  const [connected, setConnected] = useState(socket.connected);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onNotify = (n) => {
      setNotifications((prev) => [...prev.slice(-3), n]);
      setTimeout(() => setNotifications((prev) => prev.filter((x) => x.id !== n.id)), 6000);
    };
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('notification', onNotify);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('notification', onNotify);
    };
  }, [socket]);

  // Intentionally no socket.close() on unmount: in dev, React.StrictMode mounts every
  // component twice to catch missing-cleanup bugs. socket.io's .close() is a deliberate
  // client-side disconnect that does NOT auto-reconnect, so closing here on that synthetic
  // first unmount permanently kills the one shared socket before the real UI ever uses it.
  // This socket is meant to live for the whole tab session; the browser tears it down
  // naturally on navigation/close.

  const dismissNotification = useCallback((id) => setNotifications((p) => p.filter((n) => n.id !== id)), []);

  const emitAck = useCallback(
    (event, payload) =>
      new Promise((resolve, reject) => {
        socket.emit(event, payload, (ack) => {
          if (ack?.ok) resolve(ack);
          else reject(new Error(ack?.error?.message || 'Request failed'));
        });
      }),
    [socket]
  );

  const value = useMemo(() => ({ socket, connected, role, notifications, dismissNotification, emitAck }), [socket, connected, role, notifications, dismissNotification, emitAck]);
  return <SocketCtx.Provider value={value}>{children}</SocketCtx.Provider>;
}

export function getOrCreateDeviceId() {
  let id = storage.get('hs_device_id');
  if (!id) {
    id = `tv_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
    storage.set('hs_device_id', id);
  }
  return id;
}
