import { useCallback, useEffect, useRef, useState } from 'react';
import { useTV } from '../context/TVContext.jsx';
import { useSocketCtx } from '../context/SocketContext.jsx';
import Icon from '../components/Icon.jsx';
import FocusButton from '../components/FocusButton.jsx';
import { timerText } from '../utils/format.js';

const PRESETS = [
  { label: '1 min', seconds: 60 },
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
  { label: '25 min', seconds: 1500 },
];

export default function TimerPage() {
  const { setScreen } = useTV();
  const { socket } = useSocketCtx();
  const [duration, setDuration] = useState(300);
  const [remaining, setRemaining] = useState(300);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const endAtRef = useRef(null);
  const tickRef = useRef(null);

  useEffect(() => { setScreen('timer'); }, [setScreen]);

  const publish = useCallback((patch) => {
    socket.emit('tv:timer', { timer: { duration, remaining, running, endAt: endAtRef.current, finished, ...patch } });
  }, [socket, duration, remaining, running, finished]);

  useEffect(() => {
    if (!running) { clearInterval(tickRef.current); return undefined; }
    tickRef.current = setInterval(() => {
      const left = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        setRunning(false); setFinished(true);
        publish({ remaining: 0, running: false, finished: true });
      }
    }, 250);
    return () => clearInterval(tickRef.current);
  }, [running, publish]);

  useEffect(() => {
    const onCommand = ({ action, seconds }) => {
      if (action === 'set') { setPreset(seconds); return; }
      if (action === 'start') start();
      if (action === 'pause') pause();
      if (action === 'reset') reset();
    };
    socket.on('timer:command', onCommand);
    return () => socket.off('timer:command', onCommand);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, duration, remaining]);

  const setPreset = (secs) => {
    setDuration(secs); setRemaining(secs); setRunning(false); setFinished(false); endAtRef.current = null;
    publish({ duration: secs, remaining: secs, running: false, endAt: null, finished: false });
  };
  const start = () => {
    if (remaining <= 0) return;
    endAtRef.current = Date.now() + remaining * 1000;
    setRunning(true); setFinished(false);
    publish({ running: true, endAt: endAtRef.current, finished: false });
  };
  const pause = () => {
    endAtRef.current = null; setRunning(false);
    publish({ running: false, endAt: null });
  };
  const reset = () => {
    endAtRef.current = null; setRunning(false); setFinished(false); setRemaining(duration);
    publish({ running: false, endAt: null, remaining: duration, finished: false });
  };

  const pct = duration > 0 ? ((duration - remaining) / duration) * 100 : 0;

  return (
    <div className="screen timer-screen" data-screen="timer">
      <h2 className="screen-title"><Icon name="timer" size={32} /> Timer</h2>
      <div className="timer-display-wrap">
        <div className={`timer-display${finished ? ' is-finished' : ''}`}>
          <svg viewBox="0 0 200 200" className="timer-ring">
            <circle cx="100" cy="100" r="90" className="timer-ring-track" />
            <circle cx="100" cy="100" r="90" className="timer-ring-progress" style={{ strokeDashoffset: 565 - (565 * pct) / 100 }} />
          </svg>
          <div className="timer-time">{timerText(remaining)}</div>
        </div>
        {finished && <p className="timer-finished-text">Time's up!</p>}
      </div>
      <div className="timer-presets">
        {PRESETS.map((p) => (
          <FocusButton key={p.seconds} focusId={`timer-preset-${p.seconds}`} autoFocus={p.seconds === 300} className={`btn btn-ghost${duration === p.seconds ? ' is-selected' : ''}`} onSelect={() => setPreset(p.seconds)}>
            {p.label}
          </FocusButton>
        ))}
      </div>
      <div className="timer-controls">
        <FocusButton focusId="timer-toggle" className="btn btn-primary btn-lg" onSelect={running ? pause : start}>
          <Icon name={running ? 'pause' : 'play'} size={28} /> {running ? 'Pause' : 'Start'}
        </FocusButton>
        <FocusButton focusId="timer-reset" className="btn btn-ghost btn-lg" onSelect={reset}>
          <Icon name="reset" size={26} /> Reset
        </FocusButton>
      </div>
    </div>
  );
}
