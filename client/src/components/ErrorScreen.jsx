import Icon from './Icon.jsx';
import FocusButton from './FocusButton.jsx';

export default function ErrorScreen({ title = 'Unable to connect to HomeSphere.', detail, onRetry }) {
  return (
    <div className="error-screen" data-screen="error">
      <Icon name="warning" size={64} />
      <h2>{title}</h2>
      {detail && <p>{detail}</p>}
      <FocusButton focusId="error-retry" autoFocus className="btn btn-primary" onSelect={onRetry}>
        <Icon name="retry" size={22} /> Retry
      </FocusButton>
    </div>
  );
}
