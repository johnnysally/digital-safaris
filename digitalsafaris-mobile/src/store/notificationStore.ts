import { create } from 'zustand';
import { notificationApi } from '../api';
import type { Notification } from '../types';

interface NotificationState {
  items: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;

  load: (params?: Record<string, unknown>) => Promise<void>;
  loadUnreadCount: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  clear: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  unreadCount: 0,
  loading: false,
  error: null,

  load: async (params) => {
    set({ loading: true, error: null });
    try {
      const res = await notificationApi.list(params);
      set({ items: res.data ?? [], loading: false });
    } catch {
      set({ error: 'Could not load notifications', loading: false });
    }
  },

  loadUnreadCount: async () => {
    try {
      const res = await notificationApi.unreadCount();
      set({ unreadCount: res.count });
    } catch {}
  },

  markRead: async (id) => {
    try {
      await notificationApi.markRead(id);
      const items = get().items.map((n) =>
        n._id === id ? { ...n, isRead: true } : n
      );
      const unreadCount = Math.max(0, get().unreadCount - 1);
      set({ items, unreadCount });
    } catch {}
  },

  markAllRead: async () => {
    try {
      await notificationApi.markAllRead();
      const items = get().items.map((n) => ({ ...n, isRead: true }));
      set({ items, unreadCount: 0 });
    } catch {}
  },

  remove: async (id) => {
    try {
      await notificationApi.remove(id);
      const items = get().items.filter((n) => n._id !== id);
      set({ items });
    } catch {}
  },

  clear: () => set({ items: [], unreadCount: 0, loading: false, error: null }),
}));