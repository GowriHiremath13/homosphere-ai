import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FOCUSABLE, focusById, focusInitial, moveFocus } from '../utils/spatialNavigation.js';
import { runBackHandler } from '../utils/backStack.js';
import { useSocketCtx } from '../context/SocketContext.jsx';

// Key names + legacy keyCodes seen on TV platforms. Fire TV / Vega values are UNVERIFIED - see docs/FRICTION_LOG.md.
const KEY_MAP = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  Enter: 'select', Escape: 'back', Backspace: 'back', GoBack: 'back', BrowserBack: 'back', XF86Back: 'back',
};
const CODE_MAP = { 38: 'up', 40: 'down', 37: 'left', 39: 'right', 13: 'select', 23: 'select', 27: 'back', 8: 'back', 4: 'back', 461: 'back', 10009: 'back' };

/**
 * useTVNavigation({ rootRef })
 *  - Arrow keys  -> spatial focus movement
 *  - Enter       -> click the focused element
 *  - Escape/Back -> close modal (if any), else previous TV screen
 *  - Recovers focus if the focused element disappears (screen change, deleted item, closed modal)
 *  - Also drives the same actions when relayed from a paired phone over Socket.IO
 *    ('remote:key' for D-pad presses, 'tv:navigate' for the phone's screen shortcuts).
 */
export function useTVNavigation({ rootRef, enabled = true }) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathRef = useRef(location.pathname);
  pathRef.current = location.pathname;
  const { socket } = useSocketCtx();

  // Shared by both the physical keydown handler and the phone-relayed socket events,
  // so a remote tap behaves exactly like the matching key press.
  const performAction = useCallback((action) => {
    const root = rootRef.current;
    if (!root) return;

    if (action === 'select') {
      const el = document.activeElement;
      if (el && el.matches && el.matches(FOCUSABLE)) el.click();
      else focusInitial(root);
      return;
    }
    if (action === 'back') {
      if (runBackHandler()) return;
      if (pathRef.current !== '/tv/dashboard') {
        if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
        else navigate('/tv/dashboard', { replace: true });
      }
      return;
    }
    moveFocus(action, root);
  }, [navigate, rootRef]);

  useEffect(() => {
    if (!enabled) return undefined;
    const onKeyDown = (e) => {
      const action = KEY_MAP[e.key] || CODE_MAP[e.keyCode];
      if (!action) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      e.preventDefault();
      performAction(action);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, performAction]);

  // Phone-controller remote: D-pad taps and "go to screen" shortcuts arrive here as socket events.
  useEffect(() => {
    if (!enabled) return undefined;
    const onRemoteKey = ({ key }) => performAction(key);
    // A phone "jump to screen" shortcut should look exactly like the matching Nav Rail
    // button being selected by the D-pad - including the focus glow landing on that
    // button, not wherever focus happened to be before. The Nav Rail itself never
    // unmounts between /tv/* screens, so its button is always focusable immediately.
    const onNavigate = ({ screen }) => {
      navigate(`/tv/${screen}`);
      focusById(`nav-/tv/${screen}`);
    };
    socket.on('remote:key', onRemoteKey);
    socket.on('tv:navigate', onNavigate);
    return () => {
      socket.off('remote:key', onRemoteKey);
      socket.off('tv:navigate', onNavigate);
    };
  }, [enabled, socket, performAction, navigate]);

  // Focus recovery
  useEffect(() => {
    const root = rootRef.current;
    if (!enabled || !root) return undefined;
    let timer;
    const check = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const a = document.activeElement;
        if (!a || a === document.body || !root.contains(a) || !a.matches(FOCUSABLE)) focusInitial(root);
      }, 80);
    };
    const mo = new MutationObserver(check);
    mo.observe(root, { childList: true, subtree: true });
    check();
    return () => { mo.disconnect(); clearTimeout(timer); };
  }, [enabled, rootRef]);
}
