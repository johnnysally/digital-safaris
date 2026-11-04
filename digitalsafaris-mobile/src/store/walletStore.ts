import { create } from 'zustand';
import { walletApi } from '../api';
import type { CustomerWallet } from '../types';

interface WalletState {
  wallet: CustomerWallet | null;
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  setWallet: (wallet: CustomerWallet | null) => void;
  clear: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  wallet: null,
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const wallet = await walletApi.get();
      set({ wallet, loading: false });
    } catch {
      set({ error: 'Could not load wallet', loading: false });
    }
  },

  setWallet: (wallet) => set({ wallet }),

  clear: () => set({ wallet: null, loading: false, error: null }),
}));