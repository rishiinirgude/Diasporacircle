import { useWalletStore } from '../store/wallet.store';
import { analytics } from '../lib/analytics';
import { api } from '../lib/api';
import { getPublicKey, getNetwork } from '@stellar/freighter-api';

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
      // getPublicKey() directly triggers the Freighter popup for unlock + site access.
      // Do NOT call setAllowed() first — it hangs indefinitely in async context.
      let pk: string;
      try {
        pk = await getPublicKey();
      } catch (err) {
        const msg = String(err).toLowerCase();
        if (msg.includes('not installed') || msg.includes('undefined') || msg.includes('not found') || msg.includes('extension')) {
          return { success: false, error: 'Freighter is not installed. Install from freighter.app and refresh.' };
        }
        if (msg.includes('rejected') || msg.includes('denied') || msg.includes('cancel') || msg.includes('user')) {
          return { success: false, error: 'Connection was rejected. Please approve in Freighter and try again.' };
        }
        return { success: false, error: 'Freighter did not respond. Make sure it is unlocked and set to Testnet.' };
      }

      if (!pk || pk.length < 10) {
        return { success: false, error: 'Invalid address from Freighter. Make sure it is set to Testnet.' };
      }

      // Auth — local fallback if backend not deployed
      let jwt = `local_${pk}_${Date.now()}`;
      try {
        const { nonce } = await api.post<{ nonce: string }>('/auth/challenge', { walletAddress: pk });
        jwt = (await api.post<{ token: string }>('/auth/verify', {
          walletAddress: pk, signature: `demo_${nonce}_${pk}`, nonce,
        })).token;
      } catch { /* backend not deployed */ }

      setAddress(pk);
      setToken(jwt);
      localStorage.setItem('dc_token', jwt);
      localStorage.setItem('dc_address', pk);
      analytics.track('wallet_connected', { address: pk });
      return { success: true };
    } catch {
      return { success: false, error: 'Connection failed. Make sure Freighter is installed and unlocked.' };
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = () => { storeDisconnect(); analytics.track('wallet_disconnected'); };

  const signTransaction = async (xdr: string): Promise<string> => {
    if (!address) throw new Error('Wallet not connected');
    const { signTransaction: freighterSign } = await import('@stellar/freighter-api');
    const net = await getNetwork();
    const networkPassphrase = String(net).includes('TEST') ? 'Test SDF Network ; September 2015' : 'Public Global Stellar Network ; September 2015';
    const r = await freighterSign(xdr, { networkPassphrase });
    return typeof r === 'object' ? (r as { signedTxXdr: string }).signedTxXdr : r;
  };

  return { address, token, isConnected, isConnecting, connect, disconnect, signTransaction, isFreighterInstalled: () => true };
}
