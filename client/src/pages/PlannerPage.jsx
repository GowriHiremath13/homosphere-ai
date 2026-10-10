import { useEffect, useState } from 'react';
import { useTV } from '../context/TVContext.jsx';
import { useSocketCtx } from '../context/SocketContext.jsx';
import { api } from '../services/api.js';
import Icon from '../components/Icon.jsx';
import FocusButton from '../components/FocusButton.jsx';
import { time12, durationLabel } from '../utils/format.js';

export default function PlannerPage() {
  const { setScreen } = useTV();
  const { socket } = useSocketCtx();
  const [schedule, setSchedule] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setScreen('planner'); }, [setScreen]);
  useEffect(() => {
    api.schedule.list().then((r) => setSchedule(r.schedule)).catch(() => {});
    const onSchedule = ({ schedule: s }) => setSchedule(s);
    socket.on('schedule:updated', onSchedule);
    return () => socket.off('schedule:updated', onSchedule);
  }, [socket]);

  const generate = async () => {
    setBusy(true); setError('');
    try {
      await api.ai.plan({ message: 'Plan the rest of my day.', save: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen" data-screen="planner">
      <div className="screen-header-row">
        <h2 className="screen-title"><Icon name="clock" size={32} /> Planner</h2>
        <FocusButton focusId="planner-generate" autoFocus className="btn btn-primary" onSelect={generate}>
          <Icon name="ai" size={20} /> {busy ? 'Generating…' : 'Let AI plan my day'}
        </FocusButton>
      </div>
      {error && <p className="error-text">{error}</p>}
      {schedule.length === 0 ? (
        <p className="muted">No schedule yet today. Generate one with AI or add items from the paired phone.</p>
      ) : (
        <ol className="timeline" data-scroll>
          {schedule.map((e) => (
            <li key={e.id} className={`timeline-item${e.source === 'ai' ? ' is-ai' : ''}`}>
              <div className="timeline-time">{time12(e.startTime)}</div>
              <div className="timeline-line" aria-hidden="true" />
              <div className="timeline-content">
                <div className="timeline-title">{e.title}{e.source === 'ai' && <Icon name="ai" size={16} />}</div>
                <div className="timeline-duration">{durationLabel(e.startTime, e.endTime)}</div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
