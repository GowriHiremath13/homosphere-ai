import { useNow } from '../hooks/useNow.js';
import { clockText, ampm, longDate, greeting } from '../utils/format.js';
import { useTV } from '../context/TVContext.jsx';
import Icon from './Icon.jsx';

export default function HeaderBar({ userName = 'there' }) {
  const now = useNow(1000);
  const { connected, status } = useTV();
  return (
    <header className="header-bar" data-screen="header">
      <div className="header-greeting">
        <h1>{greeting(now)}, {userName}</h1>
        <p>{longDate(now)}</p>
      </div>
      <div className="header-right">
        <div className="header-status" role="status">
          <Icon name={connected ? 'wifi' : 'wifi-off'} size={22} />
          <span>{connected ? 'Connected' : 'Reconnecting…'}</span>
          {status.phoneCount > 0 && (
            <span className="header-phone-pill"><Icon name="phone" size={18} />{status.phoneCount}</span>
          )}
        </div>
        <div className="header-clock">
          <span className="header-clock-time">{clockText(now)}</span>
          <span className="header-clock-ampm">{ampm(now)}</span>
        </div>
      </div>
    </header>
  );
}
