import Icon from './Icon.jsx';
import Panel from './Panel.jsx';
import FocusButton from './FocusButton.jsx';

const PRIORITY_CLASS = { HIGH: 'pill-high', MEDIUM: 'pill-medium', LOW: 'pill-low' };

export default function TaskListCard({ tasks, onToggle, compact = false }) {
  const open = tasks.filter((t) => t.status !== 'done');
  const items = compact ? open.slice(0, 4) : tasks;
  return (
    <Panel title="Tasks" icon={<Icon name="tasks" size={28} />} className="panel-tasks">
      {items.length === 0 && <p className="muted">No tasks yet. Nice and clear.</p>}
      <ul className="task-mini-list" data-scroll>
        {items.map((t) => (
          <li key={t.id} className={t.status === 'done' ? 'is-done' : ''}>
            <FocusButton focusId={`dash-task-${t.id}`} className="task-mini-btn" onSelect={() => onToggle(t)}>
              <Icon name={t.status === 'done' ? 'done' : 'pending'} size={22} />
              <span className="task-mini-title">{t.title}</span>
              <span className={`pill ${PRIORITY_CLASS[t.priority]}`}>{t.priority}</span>
            </FocusButton>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
