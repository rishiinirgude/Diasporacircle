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
        include: {
          members: true,
          cycles: { where: { status: 'OPEN' }, orderBy: { cycleIndex: 'asc' }, take: 1 },
        },
      });

      // Recipient is the current cycle's recipient, or the organizer as fallback
      const currentCycleData = circle.cycles[0];
      const recipientAddress = currentCycleData?.recipientAddress || circle.organizerAddress;

      // Build a real XLM payment transaction
      const xdr = await SorobanService.buildContributeTransaction(
        memberAddress,
        recipientAddress,
        circle.contributionAmount.toFixed(7)
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
    circleId: string,
    memberAddress: string,
    cycleIndex: number
  ): Promise<ContributionSubmitResponse> {
    try {
      const result = await SorobanService.submitSignedTransaction(signedXdr);

      if (!result.success) {
        throw new Error('Transaction failed on-chain');
      }

      // Find the open cycle for this circle
      const cycle = await prisma.cycle.findFirst({
        where: { circleId, cycleIndex, status: 'OPEN' },
      });

      if (cycle) {
        // Record contribution in DB
        await prisma.contribution.create({
          data: {
            cycleId: cycle.id,
            memberAddress,
            amount: (await prisma.circle.findUnique({ where: { id: circleId } }))?.contributionAmount || 0,
            asset: 'native',
            txHash: result.hash,
            isOnTime: true,
          },
        });
      }

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
