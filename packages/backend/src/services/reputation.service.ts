import { prisma } from '../config/db';
import { ReputationProfile, ReputationTier } from '../types/shared';

function computeTier(score: number): ReputationTier {
  if (score >= 900) return 'PLATINUM';
  if (score >= 600) return 'GOLD';
  if (score >= 300) return 'SILVER';
  if (score >= 100) return 'BRONZE';
  return 'NEW';
}

export class ReputationService {
  static async getProfile(walletAddress: string): Promise<ReputationProfile> {
    // Count circles where this wallet was a member and the circle is COMPLETED or ACTIVE
    const circlesCompleted = await prisma.circle.count({
      where: {
        status: 'COMPLETED',
        members: { some: { walletAddress } },
      },
    });

    // Count all contributions made by this wallet
    const contributions = await prisma.contribution.findMany({
      where: { memberAddress: walletAddress },
    });

    const totalOnTime = contributions.filter((c) => c.isOnTime).length;
    const totalDefaulted = contributions.filter((c) => !c.isOnTime).length;
    const totalLate = 0; // no late distinction in current schema

    const score = ReputationService.computeScoreFromCycles(
      totalOnTime,
      totalLate,
      totalDefaulted,
      circlesCompleted
    );

    const total = totalOnTime + totalDefaulted + totalLate;
    const onTimePercentage = total > 0 ? Math.round((totalOnTime / total) * 100) : 100;

    return {
      walletAddress,
      circlesCompleted,
      totalCyclesOnTime: totalOnTime,
      totalCyclesLate: totalLate,
      totalCyclesDefaulted: totalDefaulted,
      score,
      tier: computeTier(score),
      onTimePercentage,
      // also expose the frontend-expected field names
      totalOnTime,
      totalLate,
      totalDefaulted,
    } as ReputationProfile & { totalOnTime: number; totalLate: number; totalDefaulted: number };
  }

  static computeScoreFromCycles(
    onTime: number,
    late: number,
    defaulted: number,
    circlesCompleted: number
  ): number {
    const total = onTime + late + defaulted;
    if (total === 0) return 0;

    let score = Math.floor((onTime / total) * 1000);

    // Consistency multiplier: min(circles_completed / 5, 1.0)
    const consistencyFactor = Math.min(circlesCompleted / 5, 1.0);
    score = Math.floor(score * consistencyFactor);

    return Math.min(score, 1000);
  }
}
