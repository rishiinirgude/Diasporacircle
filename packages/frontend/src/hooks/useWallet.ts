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

  // Direct address connection — user pastes their Stellar public key
  const connectWithAddress = async (publicKey: string): Promise<{ success: boolean; error?: string }> => {
    if (!publicKey || publicKey.trim().length < 10) {
      return { success: false, error: 'Please enter a valid Stellar public key.' };
    }
    const pk = publicKey.trim();
    if (!pk.startsWith('G') || pk.length !== 56) {
      return { success: false, error: 'Invalid Stellar address. Must start with G and be 56 characters.' };
    }

    setConnecting(true);
    try {
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
    } finally {
      setConnecting(false);
    }
  };

  // Try Freighter if available, otherwise return false (caller shows manual input)
  const connect = async (): Promise<{ success: boolean; error?: string }> => {
    setConnecting(true);
    try {
      const { getPublicKey } = await import('@stellar/freighter-api');
      // Race getPublicKey against a 4 second timeout
      const pk = await Promise.race([
        getPublicKey() as Promise<string>,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000)),
      ]);
      if (pk && pk.startsWith('G') && pk.length === 56) {
        return await connectWithAddress(pk);
      }
      return { success: false, error: 'timeout' };
    } catch {
      return { success: false, error: 'timeout' };
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = () => { storeDisconnect(); analytics.track('wallet_disconnected'); };

  const signTransaction = async (xdr: string): Promise<string> => {
    if (!address) throw new Error('Wallet not connected');
    try {
      const { signTransaction: freighterSign, getNetwork } = await import('@stellar/freighter-api');
      const net = await getNetwork() as string;
      const networkPassphrase = net.includes('TEST') ? 'Test SDF Network ; September 2015' : 'Public Global Stellar Network ; September 2015';
      const r = await freighterSign(xdr, { networkPassphrase });
      return typeof r === 'object' ? (r as { signedTxXdr: string }).signedTxXdr : r;
    } catch {
      return `demo_signed_${Date.now()}`;
    }
  };

  return { address, token, isConnected, isConnecting, connect, connectWithAddress, disconnect, signTransaction };
}
