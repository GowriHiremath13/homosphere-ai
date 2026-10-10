import Icon from '../Icon.jsx';

const SCREENS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'planner', label: 'Planner' },
  { id: 'ai', label: 'AI Assistant' },
  { id: 'timer', label: 'Timer' },
  { id: 'settings', label: 'Settings' },
];

export default function RemoteTab({ onKey, onGoto }) {
  return (
    <div className="mobile-panel mobile-remote">
      <p className="mobile-sub">Control the TV like a remote.</p>
      <div className="dpad">
        <button className="dpad-btn dpad-up" onClick={() => onKey('up')}><Icon name="up" size={26} /></button>
        <button className="dpad-btn dpad-left" onClick={() => onKey('left')}><Icon name="arrowLeft" size={26} /></button>
        <button className="dpad-btn dpad-center" onClick={() => onKey('select')}>OK</button>
        <button className="dpad-btn dpad-right" onClick={() => onKey('right')}><Icon name="arrowRight" size={26} /></button>
        <button className="dpad-btn dpad-down" onClick={() => onKey('down')}><Icon name="down" size={26} /></button>
      </div>
      <button className="mobile-btn mobile-btn-ghost mobile-back-btn" onClick={() => onKey('back')}>
        <Icon name="back" size={22} /> Back
      </button>
      <div className="mobile-goto-grid">
        {SCREENS.map((s) => (
          <button key={s.id} className="mobile-goto-btn" onClick={() => onGoto(s.id)}>{s.label}</button>
        ))}
      </div>
    </div>
  );
}
