import Icon from '../Icon.jsx';

export default function StatusTab({ deviceName, status, connected }) {
  return (
    <div className="mobile-panel">
      <div className={`mobile-connected-badge ${connected ? 'is-online' : 'is-offline'}`}>
        <Icon name={connected ? 'wifi' : 'wifi-off'} size={22} />
        {connected ? 'CONNECTED TO HOMESPHERE TV' : 'RECONNECTING…'}
      </div>
      <div className="mobile-card">
        <div className="mobile-card-label">Device name</div>
        <div className="mobile-card-value">{deviceName || 'Living Room TV'}</div>
      </div>
      <div className="mobile-card">
        <div className="mobile-card-label">TV screen</div>
        <div className="mobile-card-value" style={{ textTransform: 'capitalize' }}>{status?.screen || 'dashboard'}</div>
      </div>
      <div className="mobile-card">
        <div className="mobile-card-label">TV power</div>
        <div className="mobile-card-value">{status?.tvOnline ? 'Online' : 'Offline'}</div>
      </div>
    </div>
  );
}
