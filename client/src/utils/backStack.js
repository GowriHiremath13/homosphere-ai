// Screens/modals register a handler; Back runs the most recent one before any route navigation.
const stack = [];
export function pushBackHandler(ref) {
  stack.push(ref);
  return () => { const i = stack.indexOf(ref); if (i >= 0) stack.splice(i, 1); };
}
export function runBackHandler() {
  const top = stack[stack.length - 1];
  if (!top) return false;
  top.current?.();
  return true;
}
