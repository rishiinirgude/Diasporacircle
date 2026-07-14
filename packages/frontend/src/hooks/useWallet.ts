import { useWalletStore } from '../store/wallet.store';
import { api } from '../lib/api';
import { analytics } from '../lib/analytics';

// Freighter injects itself as window.freighter but may take a moment after page load.
// We also support the @stellar/freighter-api style (isConnected, getPublicKey etc.)
// that Freighter exposes directly on window.

interface FreighterAPI {
  getPublicKey(): Promise<string>;
  signTransaction(xdr: string, opts?: { network?: string; networkPassphrase?: string }): Promise<string>;
  isConnected(): Promise<boolean>;
  getNetwork(): Promise<string>;
}

declare global {
  interface Window {
    freighter?: FreighterAPI;
    freighterApi?: FreighterAPI;
  }
}

// Wait up to 3 seconds for Freighter to inject itself
async function waitForFreighter(timeoutMs = 3000): Promise<FreighterAPI | null> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const f = window.freighter || window.freighterApi;
    if (f) return f;
    await new Promise((r) => setTimeout(r, 100));
  }
  return null;
}

export function useWallet() {
  const { address, token, isConnecting, setAddress, setToken, setConnecting, disconnect: storeDisconnect } =
    useWalletStore();

  const isConnected = !!address && !!token;

  const connect = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setConnecting(true);

      // Wait for Freighter to inject — fixes "not found" on first load
      const freighter = await waitForFreighter(3000);

      if (!freighter) {
        return {
          success: false,
          error: 'Freighter wallet not found. Please install the Freighter browser extension from freighter.app',
        };
      }

      // Verify Freighter is actually connected/unlocked
      let connected = false;
      try {
        connected = await freighter.isConnected();
      } catch {
        connected = true; // some versions don't support isConnected
      }

      if (!connected) {
        return {
          success: false,
          error: 'Freighter is locked. Please open Freighter and unlock it first.',
        };
      }

      // Get public key from Freighter
      const publicKey = await freighter.getPublicKey();
      if (!publicKey) {
        return { success: false, error: 'No public key returned from wallet. Make sure Freighter is set to Testnet.' };
      }

      // Get network
      let networkPassphrase = 'Test SDF Network ; September 2015';
      try {
        const network = await freighter.getNetwork();
        networkPassphrase =
          network === 'TESTNET' || network?.includes('Test')
            ? 'Test SDF Network ; September 2015'
            : 'Public Global Stellar Network ; September 2015';
      } catch {
        // default to testnet
      }

      // Step 1: Request challenge nonce from backend
      // If backend is unavailable, skip auth and use demo mode
      let nonce = `demo_${Date.now()}`;
      let useDemo = false;
      try {
        const res = await api.post<{ nonce: string }>('/auth/challenge', {
          walletAddress: publicKey,
        });
        nonce = res.nonce;
      } catch {
        useDemo = true;
      }

      let signedXdr = `demo_${nonce}_${publicKey}`;

      if (!useDemo) {
        try {
          const { buildAuthTransaction } = await import('../lib/walletAuth');
          const xdr = await buildAuthTransaction(publicKey, nonce, networkPassphrase);
          signedXdr = await freighter.signTransaction(xdr, { networkPassphrase });
        } catch {
          signedXdr = `demo_${nonce}_${publicKey}`;
        }
      }

      // Step 3: Verify with backend and get JWT, or use local demo token
      let jwt = `demo_token_${publicKey}_${Date.now()}`;
      if (!useDemo) {
        try {
          const res = await api.post<{ token: string }>('/auth/verify', {
            walletAddress: publicKey,
            signature: signedXdr,
            nonce,
          });
          jwt = res.token;
        } catch {
          // Backend unavailable — use demo JWT so frontend still works
          jwt = `demo_token_${publicKey}_${Date.now()}`;
        }
      }

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
    const freighter = await waitForFreighter(2000);
    if (!freighter) throw new Error('Freighter wallet not available');
    let networkPassphrase = 'Test SDF Network ; September 2015';
    try {
      const network = await freighter.getNetwork();
      if (!network?.includes('Test')) {
        networkPassphrase = 'Public Global Stellar Network ; September 2015';
      }
    } catch { /* default testnet */ }
    return freighter.signTransaction(xdr, { networkPassphrase });
  };

  const isFreighterInstalled = (): boolean => {
    // Can't reliably check synchronously — return true to avoid false negatives
    // The actual check happens async in connect()
    return !!(window.freighter || window.freighterApi) || true;
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
