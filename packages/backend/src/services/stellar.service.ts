import {
  Keypair,
  SorobanRpc,
  xdr,
  nativeToScVal,
  scValToNative,
  Address as StellarAddress,
  StrKey,
  TransactionBuilder,
  BASE_FEE,
} from '@stellar/stellar-sdk';
import { horizonServer, sorobanRpc, networkPassphrase } from '../config/stellar';

export class StellarService {
  static async getAccount(publicKey: string) {
    try {
      return await horizonServer.loadAccount(publicKey);
    } catch (err) {
      throw new Error(`Failed to load account: ${err}`);
    }
  }

  static async submitTransaction(signedXdr: string) {
    try {
      const result = await sorobanRpc.sendTransaction(signedXdr);
      return result;
    } catch (err) {
      throw new Error(`Failed to submit transaction: ${err}`);
    }
  }

  static async getTransactionStatus(hash: string) {
    try {
      return await sorobanRpc.getTransaction(hash);
    } catch (err) {
      throw new Error(`Failed to get transaction status: ${err}`);
    }
  }

  static async pollForTransaction(hash: string, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const result = await this.getTransactionStatus(hash);
        if (result.status !== SorobanRpc.TransactionStatus.PENDING) {
          return result;
        }
      } catch (err) {
        // Continue polling
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    throw new Error('Transaction polling timeout');
  }

  static validatePublicKey(key: string): boolean {
    try {
      return StrKey.isValidEd25519PublicKey(key);
    } catch {
      return false;
    }
  }
}
