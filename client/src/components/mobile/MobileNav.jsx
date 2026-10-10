import Icon from '../Icon.jsx';

const TABS = [
  { id: 'status', label: 'Status', icon: 'wifi' },
  { id: 'tasks', label: 'Tasks', icon: 'tasks' },
  { id: 'ai', label: 'Ask AI', icon: 'ai' },
  { id: 'remote', label: 'Remote', icon: 'phone' },
  { id: 'timer', label: 'Timer', icon: 'timer' },
];

export default function MobileNav({ active, onChange }) {
  return (
    <nav className="mobile-tabbar">
      {TABS.map((t) => (
        <button key={t.id} className={`mobile-tab${active === t.id ? ' is-active' : ''}`} onClick={() => onChange(t.id)}>
          <Icon name={t.icon} size={22} />
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
