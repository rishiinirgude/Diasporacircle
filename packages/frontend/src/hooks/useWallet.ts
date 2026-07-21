import { useWalletStore } from '../store/wallet.store';
import { analytics } from '../lib/analytics';
import { api } from '../lib/api';

export function useWallet() {
  const {
    address, token, isConnecting,
    setAddress, setToken, setConnecting,
    disconnect: storeDisconnect,
  } = useWalletStore();

  const isConnected = !!address && !!token;

  const connect = async (): Promise<{ success: boolean; error?: string }> => {
    setConnecting(true);
    try {
      // Import freighter-api — this works because @stellar/freighter-api is on npm
      const freighter = await import('@stellar/freighter-api');

      // Check if installed
      let installed = false;
      try {
        const r = await (freighter.isConnected as () => Promise<boolean | { isConnected: boolean }>)();
        installed = typeof r === 'object' ? r.isConnected : Boolean(r);
      } catch { installed = false; }

      if (!installed) {
        return {
          success: false,
          error: 'Freighter is not installed. Install it from freighter.app and refresh the page.',
        };
      }

      // Request permission from user — this opens the Freighter popup
      try {
        const r = await (freighter.setAllowed as () => Promise<boolean | { isAllowed: boolean }>)();
        const allowed = typeof r === 'object' ? r.isAllowed : Boolean(r);
        if (!allowed) {
          return { success: false, error: 'Please approve the connection in Freighter.' };
        }
      } catch {
        // setAllowed may throw but wallet might still be accessible
      }

      // Get public key
      const pk = await (freighter.getPublicKey as () => Promise<string>)();
      if (!pk) {
        return { success: false, error: 'Could not get wallet address. Make sure Freighter is unlocked and set to Testnet.' };
      }

      // Auth — fallback to local token if backend not deployed
      let jwt = `local_${pk}_${Date.now()}`;
      try {
        const { nonce } = await api.post<{ nonce: string }>('/auth/challenge', { walletAddress: pk });
        jwt = (await api.post<{ token: string }>('/auth/verify', {
          walletAddress: pk,
          signature: `demo_${nonce}_${pk}`,
          nonce,
        })).token;
      } catch { /* backend not deployed */ }

      setAddress(pk);
      setToken(jwt);
      localStorage.setItem('dc_token', jwt);
      localStorage.setItem('dc_address', pk);
      analytics.track('wallet_connected', { address: pk });
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Connection failed. Make sure Freighter is installed and unlocked.' };
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = () => { storeDisconnect(); analytics.track('wallet_disconnected'); };

  const signTransaction = async (xdr: string): Promise<string> => {
    if (!address) throw new Error('Wallet not connected');
    const freighter = await import('@stellar/freighter-api');
    const net = await (freighter.getNetwork as () => Promise<string>)();
    const networkPassphrase = net?.includes('TEST') ? 'Test SDF Network ; September 2015' : 'Public Global Stellar Network ; September 2015';
    const r = await (freighter.signTransaction as (xdr: string, opts: object) => Promise<string | { signedTxXdr: string }>)(xdr, { networkPassphrase });
    return typeof r === 'object' ? r.signedTxXdr : r;
  };

  return { address, token, isConnected, isConnecting, connect, disconnect, signTransaction, isFreighterInstalled: () => true };
}
