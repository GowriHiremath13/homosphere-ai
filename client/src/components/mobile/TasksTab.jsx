import { useState } from 'react';
import Icon from '../Icon.jsx';

const PRIORITIES = ['HIGH', 'MEDIUM', 'LOW'];

export default function TasksTab({ tasks, onAdd, onComplete }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try { await onAdd({ title: title.trim(), priority }); setTitle(''); } finally { setBusy(false); }
  };

  const open = tasks.filter((t) => t.status !== 'done');
  const done = tasks.filter((t) => t.status === 'done');

  return (
    <div className="mobile-panel">
      <form onSubmit={submit} className="mobile-add-task">
        <input placeholder="Add a task…" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button type="submit" className="mobile-btn mobile-btn-primary" disabled={busy || !title.trim()}><Icon name="add" size={20} /></button>
      </form>

      <div className="mobile-task-list">
        {open.map((t) => (
          <button key={t.id} className="mobile-task-row" onClick={() => onComplete(t.id, true)}>
            <Icon name="pending" size={22} />
            <span className="mobile-task-title">{t.title}</span>
            <span className={`pill pill-${t.priority.toLowerCase()}`}>{t.priority}</span>
          </button>
        ))}
        {done.length > 0 && <div className="mobile-section-label">Completed</div>}
        {done.map((t) => (
          <button key={t.id} className="mobile-task-row is-done" onClick={() => onComplete(t.id, false)}>
            <Icon name="done" size={22} />
            <span className="mobile-task-title">{t.title}</span>
          </button>
        ))}
        {tasks.length === 0 && <p className="mobile-muted">No tasks yet — add the first one above.</p>}
      </div>
    </div>
  );
}
