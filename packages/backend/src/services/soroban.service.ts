import {
  TransactionBuilder,
  BASE_FEE,
  Operation,
  Asset,
} from '@stellar/stellar-sdk';
import { networkPassphrase } from '../config/stellar';
import { horizonServer } from '../config/stellar';

export class SorobanService {
  /**
   * Build a real XLM payment transaction.
   * Member pays contribution amount to the current cycle's recipient.
   * Produces a real on-chain testnet transaction — no deployed contract instance needed.
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
      // Classic payment transactions must go through Horizon, not Soroban RPC
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await horizonServer.submitTransaction(signedXdr as any);
      return {
        hash: result.hash,
        success: true,
      };
    } catch (err: unknown) {
      // Horizon returns detailed error in extras
      const extras = (err as { response?: { data?: { extras?: { result_codes?: unknown } } } })
        ?.response?.data?.extras;
      const detail = extras ? JSON.stringify(extras.result_codes) : String(err);
      throw new Error(`Transaction failed: ${detail}`);
    }
  }
}
