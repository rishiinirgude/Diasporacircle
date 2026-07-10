import {
  Keypair,
  SorobanRpc,
  TransactionBuilder,
  BASE_FEE,
  nativeToScVal,
  scValToNative,
  xdr,
} from '@stellar/stellar-sdk';
import { sorobanRpc, networkPassphrase } from '../config/stellar';
import { StellarService } from './stellar.service';

export class SorobanService {
  static async buildContributeTransaction(
    memberPublicKey: string,
    contractId: string,
    cycleIndex: number
  ): Promise<string> {
    try {
      const account = await StellarService.getAccount(memberPublicKey);
      const contractAddress = nativeToScVal.contractAddress(contractId);
      const memberAddress = nativeToScVal.contractAddress(memberPublicKey);
      const cycleIndexVal = nativeToScVal.u32(cycleIndex);

      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase,
      })
        .addOperation({
          type: 'invokeHostFunction',
          hostFunction: SorobanRpc.Operation.invokeContractFunction(
            contractId,
            'contribute',
            [memberAddress, cycleIndexVal]
          ),
          auth: [],
        } as any)
        .setTimeout(300)
        .build();

      const simResult = await sorobanRpc.simulateTransaction(transaction);

      if (SorobanRpc.isSimulationSuccess(simResult)) {
        const assembled = SorobanRpc.assembleTransaction(transaction, simResult);
        return assembled.toXDR();
      } else {
        throw new Error(`Simulation failed: ${simResult.error}`);
      }
    } catch (err) {
      throw new Error(`Failed to build contribute transaction: ${err}`);
    }
  }

  static async submitSignedTransaction(signedXdr: string) {
    try {
      const submitResult = await StellarService.submitTransaction(signedXdr);

      if (submitResult.status === SorobanRpc.TransactionStatus.PENDING) {
        const finalResult = await StellarService.pollForTransaction(submitResult.hash);
        return {
          hash: submitResult.hash,
          status: finalResult.status,
          success:
            finalResult.status === SorobanRpc.TransactionStatus.SUCCESS,
        };
      }

      return {
        hash: submitResult.hash,
        status: submitResult.status,
        success: submitResult.status === SorobanRpc.TransactionStatus.SUCCESS,
      };
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
        .addOperation({
          type: 'invokeHostFunction',
          hostFunction: SorobanRpc.Operation.invokeContractFunction(
            contractId,
            'get_circle_config',
            []
          ),
          auth: [],
        } as any)
        .setTimeout(300)
        .build();

      const simResult = await sorobanRpc.simulateTransaction(transaction);

      if (SorobanRpc.isSimulationSuccess(simResult) && simResult.result) {
        const resultBuf = Buffer.from(simResult.result.retval, 'base64');
        return scValToNative(xdr.ScVal.fromXDR(resultBuf));
      }

      throw new Error('Failed to get circle config');
    } catch (err) {
      throw new Error(`Failed to get circle config: ${err}`);
    }
  }
}
