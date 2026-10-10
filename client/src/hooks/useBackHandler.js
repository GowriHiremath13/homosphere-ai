import { useEffect, useRef } from 'react';
import { pushBackHandler } from '../utils/backStack.js';

// useBackHandler(() => closeModal(), isOpen): Back/Escape calls this first while active.
export function useBackHandler(handler, active = true) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => (active ? pushBackHandler(ref) : undefined), [active]);
}
