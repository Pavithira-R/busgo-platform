/**
 * localStorage that never throws: private windows and blocked site data
 * make it unavailable, and the site must still work (just without
 * remembering things between visits).
 */
export const storage = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Not available: nothing to remember.
    }
  },
  remove(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Not available: nothing to forget.
    }
  },
};
