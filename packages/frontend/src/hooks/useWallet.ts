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

  /**
   * Full auth flow:
   * 1. Get public key from Freighter
   * 2. Get nonce from backend
   * 3. Sign nonce with Freighter
   * 4. Verify with backend → get real JWT
   */
  const connect = async (): Promise<{ success: boolean; error?: string }> => {
    setConnecting(true);
    try {
      // Step 1: get public key from Freighter
      const { getPublicKey } = await import('@stellar/freighter-api');
      let pk: string;
      try {
        pk = await Promise.race([
          getPublicKey() as Promise<string>,
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
        ]);
      } catch {
        return { success: false, error: 'timeout' };
      }

      if (!pk || !pk.startsWith('G') || pk.length !== 56) {
        return { success: false, error: 'timeout' };
      }

      return await _authenticateAddress(pk, true);
    } catch {
      return { success: false, error: 'timeout' };
    } finally {
      setConnecting(false);
    }
  };

  /**
   * Manual address connect — uses demo signature accepted by backend in testnet mode
   */
  const connectWithAddress = async (publicKey: string): Promise<{ success: boolean; error?: string }> => {
    if (!publicKey || !publicKey.trim().startsWith('G') || publicKey.trim().length !== 56) {
      return { success: false, error: 'Invalid Stellar address. Must start with G and be 56 characters.' };
    }
    setConnecting(true);
    try {
      return await _authenticateAddress(publicKey.trim(), false);
    } finally {
      setConnecting(false);
    }
  };

  /**
   * Core auth: challenge → sign → verify → JWT
   */
  const _authenticateAddress = async (
    pk: string,
    useFreighter: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Get nonce from backend
      const { nonce } = await api.post<{ nonce: string }>('/auth/challenge', { walletAddress: pk });

      let signature: string;

      if (useFreighter) {
        // Sign nonce as a Stellar transaction via Freighter
        const { signMessage } = await import('@stellar/freighter-api');
        try {
          // signMessage signs arbitrary bytes — sign the nonce hex string
          const result = await signMessage(nonce, { networkPassphrase: 'Test SDF Network ; September 2015' }) as unknown;
          if (result && typeof result === 'object' && 'signedMessage' in result) {
            signature = (result as { signedMessage: string }).signedMessage;
          } else if (typeof result === 'string') {
            signature = result;
          } else {
            // Fall back to demo signature if signMessage not supported
            signature = `demo_${nonce}_${pk}`;
          }
        } catch {
          // Older Freighter doesn't have signMessage — use demo pattern
          signature = `demo_${nonce}_${pk}`;
        }
      } else {
        // Manual address mode — use demo signature accepted by backend
        signature = `demo_${nonce}_${pk}`;
      }

      // Verify with backend → real JWT
      const { token: jwt } = await api.post<{ token: string }>('/auth/verify', {
        walletAddress: pk,
        signature,
        nonce,
      });

      setAddress(pk);
      setToken(jwt);
      localStorage.setItem('dc_token', jwt);
      localStorage.setItem('dc_address', pk);
      analytics.track('wallet_connected', { address: pk, method: useFreighter ? 'freighter' : 'manual' });
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      return { success: false, error: msg };
    }
  };

  const disconnect = () => {
    storeDisconnect();
    analytics.track('wallet_disconnected');
  };

  /**
   * Sign a transaction XDR with Freighter
   */
  const signTransaction = async (xdr: string): Promise<string> => {
    if (!address) throw new Error('Wallet not connected');
    const { signTransaction: freighterSign, getNetwork } = await import('@stellar/freighter-api');
    const net = await getNetwork() as string;
    const networkPassphrase = net.includes('TEST')
      ? 'Test SDF Network ; September 2015'
      : 'Public Global Stellar Network ; September 2015';
    const result = await freighterSign(xdr, { networkPassphrase }) as unknown;
    if (result && typeof result === 'object' && 'signedTxXdr' in result) {
      return (result as { signedTxXdr: string }).signedTxXdr;
    }
    if (typeof result === 'string') return result;
    throw new Error('Freighter did not return a signed transaction');
  };

  return { address, token, isConnected, isConnecting, connect, connectWithAddress, disconnect, signTransaction };
}
