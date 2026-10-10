import Icon from '../Icon.jsx';
import { timerText } from '../../utils/format.js';

const PRESETS = [60, 300, 600, 1500];

export default function TimerTab({ timer, onCommand }) {
  const remaining = timer?.remaining ?? 0;
  const duration = timer?.duration ?? 300;
  const running = Boolean(timer?.running);

  return (
    <div className="mobile-panel mobile-timer">
      <div className="mobile-timer-display">{timerText(remaining)}</div>
      <div className="mobile-timer-presets">
        {PRESETS.map((s) => (
          <button key={s} className={`mobile-chip${duration === s ? ' is-active' : ''}`} onClick={() => onCommand('set', s)}>{s / 60} min</button>
        ))}
      </div>
      <div className="mobile-timer-controls">
        <button className="mobile-btn mobile-btn-primary" onClick={() => onCommand(running ? 'pause' : 'start')}>
          <Icon name={running ? 'pause' : 'play'} size={22} /> {running ? 'Pause' : 'Start'}
        </button>
        <button className="mobile-btn mobile-btn-ghost" onClick={() => onCommand('reset')}>
          <Icon name="reset" size={22} /> Reset
        </button>
      </div>
      {timer?.finished && <p className="mobile-timer-finished">Time's up on the TV!</p>}
    </div>
  );
}
