import {
  TransactionBuilder,
  BASE_FEE,
  Operation,
  Asset,
  Transaction,
} from '@stellar/stellar-sdk';
import { networkPassphrase } from '../config/stellar';
import { horizonServer } from '../config/stellar';

export class SorobanService {
  /**
   * Build a real XLM payment transaction for a circle contribution.
   * Member pays the contribution amount to the cycle recipient.
   */
  static async buildContributeTransaction(
    memberPublicKey: string,
    recipientPublicKey: string,
    amountXlm: string
  ): Promise<string> {
    try {
      const account = await horizonServer.loadAccount(memberPublicKey);

      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase,
      })
        .addOperation(
          Operation.payment({
            destination: recipientPublicKey,
            asset: Asset.native(),
            amount: amountXlm,
          })
        )
        .setTimeout(300)
        .build();

      return transaction.toXDR();
    } catch (err) {
      throw new Error(`Failed to build contribute transaction: ${err}`);
    }
  }

  static async submitSignedTransaction(signedXdr: string): Promise<{ hash: string; success: boolean }> {
    try {
      // Parse XDR back to Transaction object — Horizon SDK requires an object, not a string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tx = new Transaction(signedXdr, networkPassphrase) as any;
      const result = await horizonServer.submitTransaction(tx);
      return { hash: result.hash, success: true };
    } catch (err: unknown) {
      const horizonErr = err as {
        response?: { data?: { extras?: { result_codes?: unknown }; detail?: string } };
        message?: string;
      };
      const resultCodes = horizonErr?.response?.data?.extras?.result_codes;
      const detail = horizonErr?.response?.data?.detail;
      const msg = resultCodes
        ? JSON.stringify(resultCodes)
        : detail || horizonErr?.message || String(err);
      throw new Error(`Transaction failed: ${msg}`);
    }
  }
}
