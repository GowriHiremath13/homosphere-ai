import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSocketCtx, getOrCreateDeviceId } from './SocketContext.jsx';
import { api } from '../services/api.js';

const TVCtx = createContext(null);
export const useTV = () => useContext(TVCtx);

const emptyStatus = { tvOnline: true, phones: [], phoneCount: 0, screen: 'dashboard', timer: null };

export function TVProvider({ children }) {
  const { socket, connected, emitAck } = useSocketCtx();
  const deviceIdRef = useRef(getOrCreateDeviceId());
  const [device, setDevice] = useState(null);
  const [settings, setSettings] = useState(null);
  const [status, setStatus] = useState(emptyStatus);
  const [tasks, setTasks] = useState([]);
  const [connectError, setConnectError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const register = async () => {
      try {
        const ack = await emitAck('tv:register', { deviceId: deviceIdRef.current });
        if (cancelled) return;
        setDevice(ack.device);
        setSettings(ack.settings);
        setConnectError(null);
        const t = await api.tasks.list().catch(() => null);
        if (t && !cancelled) setTasks(t.tasks);
      } catch (err) {
        if (!cancelled) setConnectError(err.message);
      }
    };
    if (connected) register();
    // Refresh the pairing code shortly before it expires (10 min TTL by default).
    const interval = setInterval(() => { if (connected) socket.emit('tv:refresh-code', {}, () => {}); }, 9 * 60 * 1000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [connected, emitAck, socket]);

  useEffect(() => {
    const onStatus = (s) => setStatus(s);
    const onTasks = ({ tasks: t }) => setTasks(t);
    const onSettings = ({ settings: s }) => setSettings(s);
    const onCodeRotated = ({ device: d }) => setDevice(d);
    socket.on('device:status', onStatus);
    socket.on('tasks:updated', onTasks);
    socket.on('settings:updated', onSettings);
    socket.on('tv:refresh-code', onCodeRotated);
    return () => {
      socket.off('device:status', onStatus);
      socket.off('tasks:updated', onTasks);
      socket.off('settings:updated', onSettings);
      socket.off('tv:refresh-code', onCodeRotated);
    };
  }, [socket]);

  const setScreen = (screen) => socket.emit('tv:screen', { screen });
  const simulatePhone = () => emitAck('tv:demo:simulate-phone', {});
  const refreshSettings = async () => { const r = await api.settings.get(); setSettings(r.settings); return r.settings; };

  const value = useMemo(
    () => ({ deviceId: deviceIdRef.current, device, settings, status, tasks, connected, connectError, setScreen, simulatePhone, refreshSettings, setSettings }),
    [device, settings, status, tasks, connected, connectError]
  );
  return <TVCtx.Provider value={value}>{children}</TVCtx.Provider>;
}
