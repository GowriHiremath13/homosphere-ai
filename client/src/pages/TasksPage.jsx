import { useEffect, useRef } from 'react';
import { useTV } from '../context/TVContext.jsx';
import { api } from '../services/api.js';
import Icon from '../components/Icon.jsx';
import FocusButton from '../components/FocusButton.jsx';
import { dueLabel, PRIORITY_LABEL, NEXT_PRIORITY } from '../utils/format.js';

const PRIORITY_CLASS = { HIGH: 'pill-high', MEDIUM: 'pill-medium', LOW: 'pill-low' };

export default function TasksPage() {
  const { tasks, setScreen } = useTV();
  const firstRef = useRef(true);
  useEffect(() => { setScreen('tasks'); }, [setScreen]);

  const toggle = (t) => api.tasks.update(t.id, { status: t.status === 'done' ? 'pending' : 'done' }).catch(() => {});
  const cyclePriority = (t) => api.tasks.update(t.id, { priority: NEXT_PRIORITY[t.priority] }).catch(() => {});
  const remove = (t) => api.tasks.remove(t.id).catch(() => {});

  const sorted = [...tasks].sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done'));

  return (
    <div className="screen" data-screen="tasks">
      <h2 className="screen-title"><Icon name="tasks" size={32} /> Tasks</h2>
      {sorted.length === 0 && <p className="muted">No tasks yet. Add one from the paired phone.</p>}
      <div className="task-grid" data-scroll>
        {sorted.map((t, i) => {
          const autoFocus = firstRef.current && i === 0;
          if (autoFocus) firstRef.current = false;
          return (
            <div key={t.id} className={`task-card${t.status === 'done' ? ' is-done' : ''}`}>
              <div className="task-card-top">
                <span className={`pill ${PRIORITY_CLASS[t.priority]}`}>{PRIORITY_LABEL[t.priority]}</span>
                <span className="task-card-due">{dueLabel(t.dueDate)}</span>
              </div>
              <h3 className="task-card-title">{t.title}</h3>
              {t.description && <p className="task-card-desc">{t.description}</p>}
              <div className="task-card-actions">
                <FocusButton focusId={`task-complete-${t.id}`} autoFocus={autoFocus} className="btn btn-primary" onSelect={() => toggle(t)}>
                  <Icon name={t.status === 'done' ? 'reset' : 'check'} size={22} />
                  {t.status === 'done' ? 'Mark pending' : 'Mark complete'}
                </FocusButton>
                <FocusButton focusId={`task-priority-${t.id}`} className="btn btn-ghost" onSelect={() => cyclePriority(t)}>
                  <Icon name="arrowRight" size={20} /> Priority
                </FocusButton>
                <FocusButton focusId={`task-delete-${t.id}`} className="btn btn-danger" onSelect={() => remove(t)}>
                  <Icon name="trash" size={20} /> Delete
                </FocusButton>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
