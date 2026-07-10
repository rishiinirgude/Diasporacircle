import { ReputationProfile, ReputationTier, computeTier } from '@diasporacircle/shared';

export class ReputationService {
  static async getProfile(walletAddress: string): Promise<ReputationProfile> {
    // In a full implementation, this would query the on-chain reputation contract
    // For MVP, return a default profile
    const profile: ReputationProfile = {
      walletAddress,
      circlesCompleted: 0,
      totalCyclesOnTime: 0,
      totalCyclesLate: 0,
      totalCyclesDefaulted: 0,
      score: 0,
      tier: 'NEW' as ReputationTier,
    };

    return profile;
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

    // Apply consistency multiplier: min(circles_completed / 5, 1.0)
    const consistencyFactor = Math.min(circlesCompleted / 5, 1.0);
    score = Math.floor(score * consistencyFactor);

    return Math.min(score, 1000);
  }
}
