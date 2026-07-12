import { prisma } from '../config/db';
import { ContributionSubmitResponse } from '../types/shared';
import { SorobanService } from './soroban.service';

export class ContributionService {
  static async prepareContribution(
    circleId: string,
    memberAddress: string
  ): Promise<{ xdr: string; cycleIndex: number; amountFormatted: string }> {
    try {
      const circle = await prisma.circle.findUniqueOrThrow({
        where: { id: circleId },
      });

      if (!circle.contractId) {
        throw new Error('Circle has no deployed contract');
      }

      const xdr = await SorobanService.buildContributeTransaction(
        memberAddress,
        circle.contractId,
        circle.currentCycle
      );

      return {
        xdr,
        cycleIndex: circle.currentCycle,
        amountFormatted: `${circle.contributionAmount} ${circle.escrowAsset}`,
      };
    } catch (err) {
      throw new Error(`Failed to prepare contribution: ${err}`);
    }
  }

  static async submitContribution(
    signedXdr: string,
    cycleId: string,
    memberAddress: string,
    amount: number,
    asset: string
  ): Promise<ContributionSubmitResponse> {
    try {
      const result = await SorobanService.submitSignedTransaction(signedXdr);

      if (!result.success) {
        throw new Error('Transaction failed on-chain');
      }

      // Record contribution
      await prisma.contribution.create({
        data: {
          cycleId,
          memberAddress,
          amount,
          asset,
          txHash: result.hash,
          isOnTime: true,
        },
      });

      const explorerUrl = `https://stellar.expert/explorer/testnet/tx/${result.hash}`;

      return {
        txHash: result.hash,
        explorerUrl,
      };
    } catch (err) {
      throw new Error(`Failed to submit contribution: ${err}`);
    }
  }
}
