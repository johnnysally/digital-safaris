import { STORAGE_KEYS } from "./constants";
import type { Theme } from "../types";

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function safeRemove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

const storage = {
  getAccessToken(): string | null {
    return safeGet(STORAGE_KEYS.ACCESS_TOKEN);
  },
  setAccessToken(token: string): void {
    safeSet(STORAGE_KEYS.ACCESS_TOKEN, token);
  },
  removeAccessToken(): void {
    safeRemove(STORAGE_KEYS.ACCESS_TOKEN);
  },

  getRefreshToken(): string | null {
    return safeGet(STORAGE_KEYS.REFRESH_TOKEN);
  },
  setRefreshToken(token: string): void {
    safeSet(STORAGE_KEYS.REFRESH_TOKEN, token);
  },
  removeRefreshToken(): void {
    safeRemove(STORAGE_KEYS.REFRESH_TOKEN);
  },

  getTheme(): Theme | null {
    const v = safeGet(STORAGE_KEYS.THEME);
    return v === "light" || v === "dark" ? v : null;
  },
  setTheme(theme: Theme): void {
    safeSet(STORAGE_KEYS.THEME, theme);
  },
  removeTheme(): void {
    safeRemove(STORAGE_KEYS.THEME);
  },

  getSidebarCollapsed(): boolean {
    return safeGet(STORAGE_KEYS.SIDEBAR_COLLAPSED) === "true";
  },
  setSidebarCollapsed(collapsed: boolean): void {
    safeSet(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(collapsed));
  },

  get(key: string): string | null {
    return safeGet(key);
  },
  set(key: string, value: string): void {
    safeSet(key, value);
  },
  remove(key: string): void {
    safeRemove(key);
  },

  clearSession(): void {
    safeRemove(STORAGE_KEYS.ACCESS_TOKEN);
    safeRemove(STORAGE_KEYS.REFRESH_TOKEN);
  },

  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(safeRemove);
  },
};

export default storage;