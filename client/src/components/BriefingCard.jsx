import Icon from './Icon.jsx';
import Panel from './Panel.jsx';
import FocusButton from './FocusButton.jsx';

export default function BriefingCard({ briefing, loading, error, onRefresh }) {
  return (
    <Panel
      title="AI Daily Briefing"
      icon={<Icon name="ai" size={28} />}
      className="panel-briefing"
      action={
        <FocusButton focusId="briefing-refresh" className="icon-btn" onSelect={onRefresh} aria-label="Refresh briefing">
          <Icon name="retry" size={20} />
        </FocusButton>
      }
    >
      {loading && <p className="muted">Preparing your daily briefing…</p>}
      {error && !loading && <p className="muted">{error}</p>}
      {briefing && !loading && !error && (
        <>
          <p className="briefing-summary">{briefing.summary}</p>
          {briefing.items?.length > 0 && (
            <ul className="briefing-list">
              {briefing.items.map((it, i) => (
                <li key={i}><Icon name="high" size={16} />{it.task}{it.reason ? ` — ${it.reason}` : ''}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </Panel>
  );
}
