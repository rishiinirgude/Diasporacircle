import { StrKey } from '@stellar/stellar-sdk';
import { horizonServer } from '../config/stellar';

export class StellarService {
  static async getAccount(publicKey: string) {
    try {
      return await horizonServer.loadAccount(publicKey);
    } catch (err) {
      throw new Error(`Failed to load account: ${err}`);
    }
  }

  static validatePublicKey(key: string): boolean {
    try {
      return StrKey.isValidEd25519PublicKey(key);
    } catch {
      return false;
    }
  }
}
