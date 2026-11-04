import { create } from 'zustand';
import { authApi } from '../api';
import storage from '../utils/storage';
import type { Customer } from '../types';

interface AuthState {
  customer: Customer | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  bootstrap: () => Promise<void>;
  login: (payload: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setCustomer: (customer: Customer | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  customer: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  bootstrap: async () => {
    try {
      const access = await storage.getAccessToken();
      const refresh = await storage.getRefreshToken();
      if (!access) {
        set({ isLoading: false });
        return;
      }
      const data = await authApi.me();
      set({
        customer: data.customer,
        accessToken: access,
        refreshToken: refresh,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      await storage.clearSession();
      set({
        customer: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  login: async ({ email, password }) => {
    const data = await authApi.login({ email, password });
    await storage.setAccessToken(data.accessToken);
    if (data.refreshToken) await storage.setRefreshToken(data.refreshToken);
    set({
      customer: data.customer,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? null,
      isAuthenticated: true,
    });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {}
    await storage.clearSession();
    set({
      customer: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  refresh: async () => {
    const rt = await storage.getRefreshToken();
    if (!rt) throw new Error('No refresh token');
    const data = await authApi.refresh({ refreshToken: rt });
    await storage.setAccessToken(data.accessToken);
    if (data.refreshToken) await storage.setRefreshToken(data.refreshToken);
    set({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? get().refreshToken,
    });
  },

  setCustomer: (customer) => set({ customer }),
}));