import { useEffect } from 'react';
import { useWalletStore } from '../store/wallet.store';
import { api } from '../lib/api';

export function useWallet() {
  const { address, token, isConnecting, setAddress, setToken, disconnect } =
    useWalletStore();

  const isConnected = !!address && !!token;

  const connect = async () => {
    try {
      // This would use Freighter/Stellar Wallets Kit in production
      // For MVP, just for structure
      console.log('Wallet connection initiated');
    } catch (err) {
      console.error('Connection failed:', err);
    }
  };

  const signTransaction = async (xdr: string): Promise<string> => {
    // Would use wallet SDK to sign
    return '';
  };

  return {
    address,
    token,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    signTransaction,
  };
}
