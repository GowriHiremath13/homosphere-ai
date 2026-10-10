import { NavLink } from 'react-router-dom';
import Icon from './Icon.jsx';
import FocusButton from './FocusButton.jsx';

const ITEMS = [
  { to: '/tv/dashboard', label: 'Dashboard', icon: 'calendar' },
  { to: '/tv/tasks', label: 'Tasks', icon: 'tasks' },
  { to: '/tv/planner', label: 'Planner', icon: 'clock' },
  { to: '/tv/ai', label: 'AI Assistant', icon: 'ai' },
  { to: '/tv/timer', label: 'Timer', icon: 'timer' },
  { to: '/tv/settings', label: 'Settings', icon: 'settings' },
];

export default function NavRail() {
  return (
    <nav className="nav-rail" aria-label="Main navigation">
      {ITEMS.map((item) => (
        <NavLink key={item.to} to={item.to} end className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}>
          {({ isActive }) => (
            <FocusButton focusId={`nav-${item.to}`} className="nav-btn" aria-current={isActive ? 'page' : undefined}>
              <Icon name={item.icon} size={26} />
              <span>{item.label}</span>
            </FocusButton>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
