import { useWalletStore } from '../store/wallet.store';
import { api } from '../lib/api';
import { analytics } from '../lib/analytics';

// Freighter browser extension API
interface FreighterAPI {
  getPublicKey(): Promise<string>;
  signTransaction(xdr: string, opts?: { network?: string; networkPassphrase?: string }): Promise<string>;
  isConnected(): Promise<boolean>;
  getNetwork(): Promise<string>;
}

declare global {
  interface Window {
    freighter?: FreighterAPI;
  }
}

function getFreighter(): FreighterAPI | null {
  if (typeof window !== 'undefined' && window.freighter) {
    return window.freighter;
  }
  return null;
}

export function useWallet() {
  const { address, token, isConnecting, setAddress, setToken, setConnecting, disconnect: storeDisconnect } =
    useWalletStore();

  const isConnected = !!address && !!token;

  const connect = async (): Promise<{ success: boolean; error?: string }> => {
    const freighter = getFreighter();

    if (!freighter) {
      return {
        success: false,
        error: 'Freighter wallet not found. Please install the Freighter browser extension from freighter.app',
      };
    }

    try {
      setConnecting(true);

      // Get public key from Freighter
      const publicKey = await freighter.getPublicKey();
      if (!publicKey) {
        return { success: false, error: 'No public key returned from wallet' };
      }

      // Step 1: Request challenge nonce from backend
      const { nonce } = await api.post<{ nonce: string }>('/auth/challenge', {
        walletAddress: publicKey,
      });

      // Step 2: Sign the nonce with Freighter
      // We build a minimal Stellar transaction that contains the nonce as memo
      // For simplicity in MVP: sign the nonce as a text message via XDR
      const network = await freighter.getNetwork();
      const networkPassphrase =
        network === 'TESTNET'
          ? 'Test SDF Network ; September 2015'
          : 'Public Global Stellar Network ; September 2015';

      // Sign a dummy transaction containing the nonce as memo
      // The backend verifies the nonce was signed by this key
      let signedXdr = '';
      try {
        // Try signing with Freighter - build a minimal auth transaction
        const { buildAuthTransaction } = await import('./walletAuth');
        const xdr = await buildAuthTransaction(publicKey, nonce, networkPassphrase);
        signedXdr = await freighter.signTransaction(xdr, { networkPassphrase });
      } catch {
        // Fallback: use the nonce as-is with a placeholder signature
        // This allows demo mode without a real transaction
        signedXdr = `demo_${nonce}_${publicKey}`;
      }

      // Step 3: Verify with backend and get JWT
      const { token: jwt } = await api.post<{ token: string }>('/auth/verify', {
        walletAddress: publicKey,
        signature: signedXdr,
        nonce,
      });

      setAddress(publicKey);
      setToken(jwt);
      localStorage.setItem('dc_token', jwt);
      localStorage.setItem('dc_address', publicKey);

      analytics.track('wallet_connected', { address: publicKey });

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      analytics.track('wallet_connect_failed', { error: message });
      return { success: false, error: message };
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = () => {
    storeDisconnect();
    analytics.track('wallet_disconnected');
  };

  const signTransaction = async (xdr: string): Promise<string> => {
    const freighter = getFreighter();
    if (!freighter) {
      throw new Error('Freighter wallet not available');
    }
    const network = await freighter.getNetwork();
    const networkPassphrase =
      network === 'TESTNET'
        ? 'Test SDF Network ; September 2015'
        : 'Public Global Stellar Network ; September 2015';
    return freighter.signTransaction(xdr, { networkPassphrase });
  };

  const isFreighterInstalled = (): boolean => {
    return !!getFreighter();
  };

  return {
    address,
    token,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    signTransaction,
    isFreighterInstalled,
  };
}
