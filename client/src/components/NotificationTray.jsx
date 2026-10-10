import { useSocketCtx } from '../context/SocketContext.jsx';
import Icon from './Icon.jsx';

const ICONS = { success: 'check', task: 'tasks', info: 'wifi', error: 'warning' };

export default function NotificationTray() {
  const { notifications, dismissNotification } = useSocketCtx();
  if (!notifications.length) return null;
  return (
    <div className="toast-stack" aria-live="polite">
      {notifications.map((n) => (
        <div key={n.id} className={`toast toast-${n.kind || 'info'}`} onClick={() => dismissNotification(n.id)}>
          <Icon name={ICONS[n.kind] || 'wifi'} size={20} />
          <span>{n.text}</span>
        </div>
      ))}
    </div>
  );
}
