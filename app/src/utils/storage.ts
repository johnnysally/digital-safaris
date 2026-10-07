import { STORAGE_KEYS } from "./constants";

const isBrowser = typeof window !== "undefined";

const get = (key: string): string | null => {
  if (!isBrowser) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const set = (key: string, value: string): void => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
};

const remove = (key: string): void => {
  if (!isBrowser) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
};

const storage = {
  getAccessToken: () => get(STORAGE_KEYS.ACCESS_TOKEN),
  setAccessToken: (t: string) => set(STORAGE_KEYS.ACCESS_TOKEN, t),

  getRefreshToken: () => get(STORAGE_KEYS.REFRESH_TOKEN),
  setRefreshToken: (t: string) => set(STORAGE_KEYS.REFRESH_TOKEN, t),

  getTheme: () => get(STORAGE_KEYS.THEME),
  setTheme: (t: string) => set(STORAGE_KEYS.THEME, t),

  clearSession: () => {
    remove(STORAGE_KEYS.ACCESS_TOKEN);
    remove(STORAGE_KEYS.REFRESH_TOKEN);
  },
};

export default storage;