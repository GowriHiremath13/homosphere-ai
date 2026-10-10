import Icon from './Icon.jsx';
import Panel from './Panel.jsx';
import { time12 } from '../utils/format.js';

export default function ScheduleCard({ schedule, compact = false }) {
  const items = compact ? schedule.slice(0, 5) : schedule;
  return (
    <Panel title="Today's Schedule" icon={<Icon name="calendar" size={28} />} className="panel-schedule">
      {items.length === 0 && <p className="muted">Nothing scheduled yet.</p>}
      <ul className="schedule-list" data-scroll>
        {items.map((e) => (
          <li key={e.id} className={`schedule-item${e.source === 'ai' ? ' is-ai' : ''}`}>
            <span className="schedule-time">{time12(e.startTime)}</span>
            <span className="schedule-title">{e.title}</span>
            {e.source === 'ai' && <Icon name="ai" size={16} />}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
