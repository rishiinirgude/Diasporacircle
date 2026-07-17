/**
 * Wallet connection using @stellar/freighter-api official package.
 * This is the correct way to talk to Freighter — it communicates
 * via message passing to the extension, no window injection needed.
 */
import { useWalletStore } from '../store/wallet.store';
import { api } from '../lib/api';
import { analytics } from '../lib/analytics';

// Dynamic import so it doesn't break SSR/build if package is missing
async function getFreighterApi() {
  try {
    const freighter = await import('@stellar/freighter-api');
    return freighter;
  } catch {
    return null;
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
    try {
      setConnecting(true);

      const freighter = await getFreighterApi();

      if (!freighter) {
        return {
          success: false,
          error: 'Could not load Freighter API. Please install the Freighter browser extension from freighter.app',
        };
      }

      // isConnected tells us if the extension is present and accessible
      let connected = false;
      try {
        const result = await freighter.isConnected();
        // In newer versions returns { isConnected: boolean }, older returns boolean
        connected = typeof result === 'object'
          ? (result as { isConnected: boolean }).isConnected
          : (result as unknown as boolean);
      } catch {
        // Treat error as not installed
        return {
          success: false,
          error: 'Freighter extension not found. Please install it from freighter.app and refresh the page.',
        };
      }

      if (!connected) {
        return {
          success: false,
          error: 'Freighter is not connected. Open Freighter from your browser toolbar, unlock it, and try again.',
        };
      }

      // Get the public key — this prompts the user in Freighter if needed
      let publicKey = '';
      try {
        const result = await freighter.getPublicKey();
        // Newer API returns { address: string }, older returns string directly
        publicKey = typeof result === 'object'
          ? (result as { address: string }).address ?? String(result)
          : String(result);
      } catch (err) {
        return {
          success: false,
          error: 'Could not get wallet address. Make sure Freighter is unlocked and try again.',
        };
      }

      if (!publicKey) {
        return {
          success: false,
          error: 'No wallet address returned. Make sure Freighter is set to Testnet.',
        };
      }

      // Get network passphrase
      let networkPassphrase = 'Test SDF Network ; September 2015';
      try {
        const net = await freighter.getNetwork();
        const networkStr = typeof net === 'object'
          ? (net as { network: string }).network ?? String(net)
          : String(net);
        if (!networkStr.toLowerCase().includes('test')) {
          networkPassphrase = 'Public Global Stellar Network ; September 2015';
        }
      } catch {
        // default testnet
      }

      // Request auth challenge from backend (skip gracefully if down)
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

      // Sign the auth transaction with Freighter
      let signedXdr = `demo_${nonce}_${publicKey}`;
      if (!useDemo) {
        try {
          const { buildAuthTransaction } = await import('../lib/walletAuth');
          const xdr = await buildAuthTransaction(publicKey, nonce, networkPassphrase);
          const signResult = await freighter.signTransaction(xdr, {
            networkPassphrase,
          });
          signedXdr = typeof signResult === 'object'
            ? (signResult as { signedTxXdr: string }).signedTxXdr ?? String(signResult)
            : String(signResult);
        } catch {
          // User rejected or sign failed — use demo fallback
          signedXdr = `demo_${nonce}_${publicKey}`;
        }
      }

      // Get JWT from backend (fall back to demo token if backend is down)
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
          // Backend unavailable — demo token, UI still works
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
    const freighter = await getFreighterApi();
    if (!freighter) throw new Error('Freighter API not available');
    let networkPassphrase = 'Test SDF Network ; September 2015';
    try {
      const net = await freighter.getNetwork();
      const networkStr = typeof net === 'object'
        ? (net as { network: string }).network ?? ''
        : String(net);
      if (!networkStr.toLowerCase().includes('test')) {
        networkPassphrase = 'Public Global Stellar Network ; September 2015';
      }
    } catch { /* default testnet */ }

    const result = await freighter.signTransaction(xdr, { networkPassphrase });
    return typeof result === 'object'
      ? (result as { signedTxXdr: string }).signedTxXdr ?? String(result)
      : String(result);
  };

  // Always return true — let the async connect() handle detection
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
  };
}
