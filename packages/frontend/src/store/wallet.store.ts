import { create } from 'zustand';
import { persist } from 'zustand/middleware';

function isRealJwt(token: string | null): boolean {
  if (!token) return false;
  return token.split('.').length === 3;
}

interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  token: string | null;
  setAddress: (address: string | null) => void;
  setToken: (token: string) => void;
  setConnecting: (connecting: boolean) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      address: null,
      isConnected: false,
      isConnecting: false,
      token: null,
      setAddress: (address) => set({ address, isConnected: !!address }),
      setToken: (token) => set({ token }),
      setConnecting: (isConnecting) => set({ isConnecting }),
      disconnect: () => {
        set({ address: null, token: null, isConnected: false });
        localStorage.removeItem('dc_token');
        localStorage.removeItem('dc_address');
      },
    }),
    {
      name: 'dc_wallet',
      // On rehydration, wipe stale demo tokens so user has to reconnect properly
      onRehydrateStorage: () => (state) => {
        if (state && state.token && !isRealJwt(state.token)) {
          state.token = null;
          state.address = null;
          state.isConnected = false;
          localStorage.removeItem('dc_token');
          localStorage.removeItem('dc_address');
        }
      },
    }
  )
);
