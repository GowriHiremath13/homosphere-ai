// localStorage can throw in some WebViews / private modes, so never touch it directly.
const memory = new Map();
export const storage = {
  get(key) {
    try { return window.localStorage.getItem(key); } catch { return memory.get(key) ?? null; }
  },
  set(key, value) {
    try { window.localStorage.setItem(key, value); } catch { memory.set(key, value); }
  },
  remove(key) {
    try { window.localStorage.removeItem(key); } catch { memory.delete(key); }
  },
};
