/**
 * Wallet hook using @jsr/creit-tech__stellar-wallets-kit (JSR via npm.jsr.io)
 * Pattern: createButton() renders the connect button, STATE_UPDATED gives address
 */
import { useWalletStore } from '../store/wallet.store';
import { analytics } from '../lib/analytics';

interface KitType {
  init(p: object): void;
  createButton(el: HTMLElement): void;
  on(ev: string, cb: (e: { payload?: { address?: string } }) => void): () => void;
  getAddress(): Promise<{ address: string }>;
  signTransaction(xdr: string, opts: { networkPassphrase: string; address: string }): Promise<{ signedTxXdr: string }>;
  disconnect(): void;
}

let kitReady = false;

export async function setupWalletButton(
  container: HTMLElement,
  onAddress: (addr: string) => void,
  onError: (msg: string) => void
) {
  try {
    const { StellarWalletsKit } = await import('@jsr/creit-tech__stellar-wallets-kit/sdk') as { StellarWalletsKit: KitType };
    const { defaultModules } = await import('@jsr/creit-tech__stellar-wallets-kit/modules/utils') as { defaultModules: () => unknown[] };
    const { KitEventType } = await import('@jsr/creit-tech__stellar-wallets-kit/types') as { KitEventType: { STATE_UPDATED: string } };

    if (!kitReady) {
      StellarWalletsKit.init({ modules: defaultModules() });
      kitReady = true;
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
    console.error('Wallet kit error:', err);
    onError('Failed to load wallet kit. Please refresh the page.');
  }
}

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

  const connect = async (): Promise<{ success: boolean; error?: string }> => {
    return { success: false, error: 'Use the wallet kit button.' };
  };

  const disconnect = () => {
    import('@jsr/creit-tech__stellar-wallets-kit/sdk')
      .then((mod) => { (mod as { StellarWalletsKit: KitType }).StellarWalletsKit.disconnect(); })
      .catch(() => {});
    storeDisconnect();
    analytics.track('wallet_disconnected');
  };

  const signTransaction = async (xdr: string): Promise<string> => {
    if (!address) throw new Error('Wallet not connected');
    const { StellarWalletsKit } = await import('@jsr/creit-tech__stellar-wallets-kit/sdk') as { StellarWalletsKit: KitType };
    const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
      networkPassphrase: 'Test SDF Network ; September 2015',
      address,
    });
    return signedTxXdr;
  };

  return {
    address, token, isConnected, isConnecting,
    connect, disconnect, signTransaction,
    isFreighterInstalled: () => true,
    setAddress, setToken, setConnecting,
  };
}
