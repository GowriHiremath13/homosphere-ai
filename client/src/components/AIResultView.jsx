import Icon from './Icon.jsx';

const TYPE_ICON = { plan: 'clock', briefing: 'ai', priorities: 'high', suggestion: 'rain', text: 'ai' };

export default function AIResultView({ result }) {
  if (!result) return null;
  const { type, title, summary, items = [] } = result;
  return (
    <div className="ai-result" data-scroll>
      <div className="ai-result-title"><Icon name={TYPE_ICON[type] || 'ai'} size={26} /><h3>{title}</h3></div>
      <p className="ai-result-summary">{summary}</p>
      {items.length > 0 && (
        <ul className="ai-result-items">
          {items.map((it, i) => (
            <li key={i}>
              {it.time && <span className="ai-item-time">{it.time}</span>}
              {it.priority && <span className={`pill pill-${it.priority.toLowerCase()}`}>{it.priority}</span>}
              <span className="ai-item-task">{it.task}</span>
              {it.reason && <span className="ai-item-reason">{it.reason}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
