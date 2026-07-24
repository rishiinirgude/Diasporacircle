import {
  SorobanRpc,
  TransactionBuilder,
  BASE_FEE,
  nativeToScVal,
  scValToNative,
  Operation,
  Address,
  Asset,
  Keypair,
} from '@stellar/stellar-sdk';
import { sorobanRpc, networkPassphrase } from '../config/stellar';
import { StellarService } from './stellar.service';
import { horizonServer } from '../config/stellar';

export class SorobanService {
  /**
   * Build a real XLM payment transaction for a circle contribution.
   * The member pays the contribution amount to the circle organizer's address.
   * This produces a real on-chain testnet transaction without needing a deployed contract instance.
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

  static async submitSignedTransaction(signedXdr: string) {
    try {
      // Try Soroban RPC first, fall back to Horizon
      try {
        const submitResult = await sorobanRpc.sendTransaction(signedXdr);
        const hash = submitResult.hash;

        if (submitResult.status === 'PENDING' || submitResult.status === 'TRY_AGAIN_LATER') {
          const finalResult = await StellarService.pollForTransaction(hash);
          return {
            hash,
            status: finalResult.status,
            success: finalResult.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS,
          };
        }

        return {
          hash,
          status: submitResult.status,
          success: submitResult.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS,
        };
      } catch {
        // Soroban RPC doesn't accept classic transactions — use Horizon
        const result = await horizonServer.submitTransaction(signedXdr as any);
        return {
          hash: result.hash,
          status: 'SUCCESS',
          success: true,
        };
      }
    } catch (err) {
      throw new Error(`Failed to submit transaction: ${err}`);
    }
  }

  static async getCircleConfig(contractId: string) {
    try {
      const account = await StellarService.getAccount(
        process.env.BACKEND_PUBLIC_KEY || ''
      );

      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase,
      })
        .addOperation(
          Operation.invokeContractFunction({
            contract: contractId,
            function: 'get_circle_config',
            args: [],
          })
        )
        .setTimeout(300)
        .build();

      const simResult = await sorobanRpc.simulateTransaction(transaction);

      if (SorobanRpc.Api.isSimulationSuccess(simResult) && simResult.result) {
        const retval = simResult.result.retval;
        return scValToNative(retval);
      }

      throw new Error('Failed to get circle config');
    } catch (err) {
      throw new Error(`Failed to get circle config: ${err}`);
    }
  }
}
