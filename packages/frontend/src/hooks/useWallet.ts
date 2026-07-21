/**
 * Wallet hook using @creit-tech/stellar-wallets-kit v2 (JSR package)
 * Pattern from: https://github.com/jamesbachini/Stellar-Wallets-Kit-Boilerplate
 *
 * The kit renders its own button via createButton(domElement).
 * We listen to KitEventType.STATE_UPDATED to get the address.
 * This is the only pattern that reliably opens the wallet modal.
 */
import { useEffect, useRef } from 'react';
import { useWalletStore } from '../store/wallet.store';
import { analytics } from '../lib/analytics';

// Kit types
interface KitInstance {
  init(params: object): void;
  createButton(el: HTMLElement, opts?: object): void;
  on(event: string, cb: (e: { payload?: { address?: string } }) => void): () => void;
  getAddress(): Promise<{ address: string }>;
  signTransaction(xdr: string, opts: { networkPassphrase: string; address: string }): Promise<{ signedTxXdr: string }>;
  disconnect(): void;
}

let kitInitialized = false;

export async function initKit(): Promise<KitInstance> {
  const mod = await import('@creit-tech/stellar-wallets-kit/sdk');
  const { defaultModules } = await import('@creit-tech/stellar-wallets-kit/modules/utils');
  const { KitEventType } = await import('@creit-tech/stellar-wallets-kit/types');

  const StellarWalletsKit = (mod as { StellarWalletsKit: KitInstance }).StellarWalletsKit;

  if (!kitInitialized) {
    StellarWalletsKit.init({ modules: defaultModules() });
    kitInitialized = true;
  }

  return StellarWalletsKit;
}

export { };

export function useWallet() {
  const {
    address,
    token,
    isConnecting,
    setAddress,
    setToken,
    setConnecting,
    disconnect: storeDisconnect,
  } = useWalletStore();

  const isConnected = !!address && !!token;

  // Called from Onboarding to mount the kit button into a DOM element
  const mountKitButton = async (container: HTMLElement, onAddress: (addr: string) => void) => {
    try {
      const mod = await import('@creit-tech/stellar-wallets-kit/sdk');
      const { defaultModules } = await import('@creit-tech/stellar-wallets-kit/modules/utils');
      const { KitEventType } = await import('@creit-tech/stellar-wallets-kit/types');
      const StellarWalletsKit = (mod as { StellarWalletsKit: KitInstance }).StellarWalletsKit;

      if (!kitInitialized) {
        StellarWalletsKit.init({ modules: defaultModules() });
        kitInitialized = true;
      }

      StellarWalletsKit.createButton(container);

      const unsub = StellarWalletsKit.on(KitEventType.STATE_UPDATED, (event) => {
        const addr = event?.payload?.address;
        if (addr) {
          onAddress(addr);
          unsub();
        }
      });
    } catch (err) {
      console.error('Failed to mount wallet kit button:', err);
    }
  };

  const disconnect = () => {
    import('@creit-tech/stellar-wallets-kit/sdk').then((mod) => {
      const StellarWalletsKit = (mod as { StellarWalletsKit: KitInstance }).StellarWalletsKit;
      try { StellarWalletsKit.disconnect(); } catch { /* ignore */ }
    }).catch(() => {});
    storeDisconnect();
    analytics.track('wallet_disconnected');
  };

  const signTransaction = async (xdr: string): Promise<string> => {
    if (!address) throw new Error('Wallet not connected');
    const mod = await import('@creit-tech/stellar-wallets-kit/sdk');
    const StellarWalletsKit = (mod as { StellarWalletsKit: KitInstance }).StellarWalletsKit;
    const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
      networkPassphrase: 'Test SDF Network ; September 2015',
      address,
    });
    return signedTxXdr;
  };

  const connect = async (): Promise<{ success: boolean; error?: string }> => {
    // connect() is not used directly — the kit button handles this
    // This is kept for compatibility with existing code
    return { success: false, error: 'Use the wallet kit button to connect.' };
  };

  const isFreighterInstalled = (): boolean => true;

  return {
    address,
    token,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    signTransaction,
    isFreighterInstalled,
    mountKitButton,
    setAddress,
    setToken,
    setConnecting,
  };
}
