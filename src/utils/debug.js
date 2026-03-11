// Reusable debug helper for the app
// Usage: import { isDebug, debug } from '@/utils/debug';
// debug('message', payload)

export const isDebug = () => {
  // Vite exposes env vars as import.meta.env
  try {
    return import.meta.env.VITE_DEBUG === "true";
  } catch (err) {
    void err;
    return false;
  }
};

export const debug = (...args) => {
  if (isDebug()) {
    // Use console.debug if available, otherwise fallback to console.log
    if (console.debug) console.debug(...args);
    else console.log(...args);
  }
};

export default { isDebug, debug };
