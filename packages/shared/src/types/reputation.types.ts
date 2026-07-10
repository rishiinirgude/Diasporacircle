export interface ReputationProfile {
  walletAddress: string;
  circlesCompleted: number;
  totalCyclesOnTime: number;
  totalCyclesLate: number;
  totalCyclesDefaulted: number;
  score: number;
  tier: ReputationTier;
}

export type ReputationTier = 'NEW' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export function computeTier(score: number): ReputationTier {
  if (score === 0) return 'NEW';
  if (score < 300) return 'BRONZE';
  if (score < 600) return 'SILVER';
  if (score < 850) return 'GOLD';
  return 'PLATINUM';
}
