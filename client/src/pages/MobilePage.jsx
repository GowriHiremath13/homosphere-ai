import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SocketProvider, useSocketCtx } from '../context/SocketContext.jsx';
import { storage } from '../services/storage.js';
import { api } from '../services/api.js';
import PairingScreen from '../components/mobile/PairingScreen.jsx';
import MobileNav from '../components/mobile/MobileNav.jsx';
import StatusTab from '../components/mobile/StatusTab.jsx';
import TasksTab from '../components/mobile/TasksTab.jsx';
import AITab from '../components/mobile/AITab.jsx';
import RemoteTab from '../components/mobile/RemoteTab.jsx';
import TimerTab from '../components/mobile/TimerTab.jsx';
import Icon from '../components/Icon.jsx';

function MobileApp() {
  const { socket, connected, emitAck } = useSocketCtx();
  const [params] = useSearchParams();
  const [session, setSession] = useState(() => {
    const raw = storage.get('hs_phone_session');
    return raw ? JSON.parse(raw) : null;
  });
  const [pairError, setPairError] = useState('');
  const [pairBusy, setPairBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [timer, setTimer] = useState(null);
  const [tab, setTab] = useState('status');
  const [joined, setJoined] = useState(false);

  const doPair = async (code, phoneName) => {
    setPairBusy(true); setPairError('');
    try {
      const r = await api.device.pair(code, phoneName);
      const s = { deviceId: r.deviceId, token: r.token, deviceName: r.deviceName, phoneName };
      storage.set('hs_phone_session', JSON.stringify(s));
      setSession(s);
    } catch (err) {
      setPairError(err.message);
    } finally {
      setPairBusy(false);
    }
  };

  useEffect(() => {
    if (!session || !connected) return undefined;
    let cancelled = false;
    emitAck('phone:join', { deviceId: session.deviceId, token: session.token, name: session.phoneName })
      .then((ack) => {
        if (cancelled) return;
        setJoined(true);
        setStatus(ack.status);
        setTasks(ack.tasks);
      })
      .catch((err) => {
        if (cancelled) return;
        setJoined(false);
        setPairError(err.message);
        storage.remove('hs_phone_session');
        setSession(null);
      });
    return () => { cancelled = true; };
  }, [session, connected, emitAck]);

  useEffect(() => {
    const onStatus = (s) => setStatus(s);
    const onTasks = ({ tasks: t }) => setTasks(t);
    const onTimer = (t) => setTimer(t);
    socket.on('device:status', onStatus);
    socket.on('tasks:updated', onTasks);
    socket.on('timer:state', onTimer);
    return () => {
      socket.off('device:status', onStatus);
      socket.off('tasks:updated', onTasks);
      socket.off('timer:state', onTimer);
    };
  }, [socket]);

  const addTask = (t) => emitAck('phone:task:add', t);
  const completeTask = (id, done) => emitAck('phone:task:complete', { id, done }).catch(() => {});
  const askAI = (message) => emitAck('phone:ai:ask', { message });
  const sendKey = (key) => emitAck('phone:key', { key }).catch(() => {});
  const goto = (screen) => emitAck('phone:goto', { screen }).catch(() => {});
  const timerCommand = (action, seconds) => emitAck('phone:timer', { action, seconds }).catch(() => {});

  if (!session) {
    return <PairingScreen initialCode={params.get('pair') || ''} onPair={doPair} error={pairError} busy={pairBusy} />;
  }

  if (!joined) {
    return (
      <div className="mobile-screen mobile-connecting">
        <Icon name="phone" size={40} />
        <p>{pairError || 'Connecting to HomeSphere TV…'}</p>
        {pairError && (
          <button className="mobile-btn mobile-btn-primary" onClick={() => { storage.remove('hs_phone_session'); setSession(null); }}>
            Pair again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mobile-app">
      <header className="mobile-header">
        <Icon name="phone" size={22} />
        <span>{status?.name || session.deviceName}</span>
        <span className={`mobile-dot ${connected ? 'is-online' : ''}`} />
      </header>
      <div className="mobile-content">
        {tab === 'status' && <StatusTab deviceName={status?.name || session.deviceName} status={status} connected={connected} />}
        {tab === 'tasks' && <TasksTab tasks={tasks} onAdd={addTask} onComplete={completeTask} />}
        {tab === 'ai' && <AITab onAsk={askAI} />}
        {tab === 'remote' && <RemoteTab onKey={sendKey} onGoto={goto} />}
        {tab === 'timer' && <TimerTab timer={timer || status?.timer} onCommand={timerCommand} />}
      </div>
      <MobileNav active={tab} onChange={setTab} />
    </div>
  );
}

export default function MobilePage() {
  const key = useMemo(() => Date.now(), []);
  return (
    <SocketProvider role="phone" key={key}>
      <MobileApp />
    </SocketProvider>
  );
}
