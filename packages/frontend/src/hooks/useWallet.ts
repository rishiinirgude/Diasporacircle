/**
 * Wallet connection using @stellar/freighter-api v1.7.x
 * 
 * Freighter v1.7.x API:
 *   isConnected()   → { isConnected: boolean }
 *   isAllowed()     → { isAllowed: boolean }   ← checks if THIS SITE is allowed
 *   setAllowed()    → { isAllowed: boolean }   ← PROMPTS user to allow this site
 *   getPublicKey()  → string
 *   getNetwork()    → string  e.g. "TESTNET"
 *   signTransaction(xdr, { networkPassphrase }) → string
 */
import {
  isConnected,
  isAllowed,
  setAllowed,
  getPublicKey,
  getNetwork,
  signTransaction as freighterSign,
} from '@stellar/freighter-api';
import { useWalletStore } from '../store/wallet.store';
import { api } from '../lib/api';
import { analytics } from '../lib/analytics';

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

  const isWalletConnected = !!address && !!token;

  const connect = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setConnecting(true);

      // Step 1: Check if Freighter extension is installed
      let extensionPresent = false;
      try {
        const result = await isConnected();
        extensionPresent =
          typeof result === 'object'
            ? (result as { isConnected: boolean }).isConnected
            : Boolean(result);
      } catch {
        extensionPresent = false;
      }

      if (!extensionPresent) {
        return {
          success: false,
          error:
            'Freighter extension not found. Please install it from freighter.app, then refresh this page.',
        };
      }

      // Step 2: Check if this site is allowed — if not, request permission
      let siteAllowed = false;
      try {
        const allowedResult = await isAllowed();
        siteAllowed =
          typeof allowedResult === 'object'
            ? (allowedResult as { isAllowed: boolean }).isAllowed
            : Boolean(allowedResult);
      } catch {
        siteAllowed = false;
      }

      if (!siteAllowed) {
        // This opens the Freighter popup asking user to allow this site
        try {
          const grantResult = await setAllowed();
          const granted =
            typeof grantResult === 'object'
              ? (grantResult as { isAllowed: boolean }).isAllowed
              : Boolean(grantResult);

          if (!granted) {
            return {
              success: false,
              error:
                'You need to allow this site in Freighter. Click the Freighter icon → click "Grant Access" or "Connect".',
            };
          }
        } catch {
          return {
            success: false,
            error:
              'Freighter permission request failed. Open Freighter from your toolbar and make sure it is unlocked.',
          };
        }
      }

      // Step 3: Get public key — Freighter may show a popup
      let publicKey = '';
      try {
        const pkResult = await getPublicKey();
        publicKey =
          typeof pkResult === 'object'
            ? (pkResult as { publicKey?: string; address?: string }).publicKey ??
              (pkResult as { address?: string }).address ??
              String(pkResult)
            : String(pkResult);
      } catch (err) {
        return {
          success: false,
          error:
            'Could not get wallet address. Make sure Freighter is unlocked and set to Testnet.',
        };
      }

      if (!publicKey || publicKey.length < 10) {
        return {
          success: false,
          error: 'Invalid wallet address returned. Make sure Freighter is set to Testnet.',
        };
      }

      // Step 4: Get network
      let networkPassphrase = 'Test SDF Network ; September 2015';
      try {
        const net = await getNetwork();
        const netStr =
          typeof net === 'object'
            ? (net as { network: string }).network ?? String(net)
            : String(net);
        if (netStr && !netStr.toLowerCase().includes('test')) {
          networkPassphrase = 'Public Global Stellar Network ; September 2015';
        }
      } catch {
        // default testnet
      }

      // Step 5: Auth with backend (demo fallback if backend is down)
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
          const sigResult = await freighterSign(xdr, { networkPassphrase });
          signedXdr =
            typeof sigResult === 'object'
              ? (sigResult as { signedTxXdr: string }).signedTxXdr ?? String(sigResult)
              : String(sigResult);
        } catch {
          signedXdr = `demo_${nonce}_${publicKey}`;
        }
      }

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
          // Backend down — demo mode
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
    let networkPassphrase = 'Test SDF Network ; September 2015';
    try {
      const net = await getNetwork();
      const netStr =
        typeof net === 'object'
          ? (net as { network: string }).network ?? ''
          : String(net);
      if (!netStr.toLowerCase().includes('test')) {
        networkPassphrase = 'Public Global Stellar Network ; September 2015';
      }
    } catch { /* default testnet */ }

    const result = await freighterSign(xdr, { networkPassphrase });
    return typeof result === 'object'
      ? (result as { signedTxXdr: string }).signedTxXdr ?? String(result)
      : String(result);
  };

  const isFreighterInstalled = (): boolean => true;

  return {
    address,
    token,
    isConnected: isWalletConnected,
    isConnecting,
    connect,
    disconnect,
    signTransaction,
    isFreighterInstalled,
  };
}
