// Inline types replacing @diasporacircle/shared workspace dependency
// This allows the backend to be deployed standalone without monorepo tooling

export type CircleStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'PAUSED';
export type ReputationTier = 'NEW' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface Circle {
  id: string;
  name: string;
  organizerAddress: string;
  status: CircleStatus;
  contributionAmount: number;
  escrowAsset: string;
  cycleLengthDays: number;
  totalMembers: number;
  currentCycle: number;
  contractId?: string;
  inviteCode?: string;
  createdAt: Date;
  updatedAt: Date;
  members?: CircleMember[];
  cycles?: Cycle[];
}

export interface CircleMember {
  id: string;
  circleId: string;
  walletAddress: string;
  payoutPosition: number;
  securityDepositPaid: boolean;
  securityDepositTxHash?: string;
  joinedAt: Date;
}

export interface Cycle {
  id: string;
  circleId: string;
  cycleIndex: number;
  recipientAddress: string;
  deadline: Date;
  status: 'OPEN' | 'DISBURSED' | 'DEFAULTED';
  disbursedAt?: Date;
  disbursementTxHash?: string;
  contributions?: Contribution[];
}

export interface Contribution {
  id: string;
  cycleId: string;
  memberAddress: string;
  amount: number;
  asset: string;
  txHash: string;
  paidAt: Date;
  isOnTime: boolean;
}

export interface User {
  walletAddress: string;
  displayName?: string;
  phone?: string;
  email?: string;
  country?: string;
  createdAt: Date;
}

export interface CreateCircleInput {
  name: string;
  contributionAmount: number;
  cycleLengthDays: number;
  escrowAsset: string;
  memberWallets: string[];
  payoutOrder: string[];
}

export interface ReputationProfile {
  walletAddress: string;
  circlesCompleted: number;
  totalCyclesOnTime: number;
  totalCyclesLate: number;
  totalCyclesDefaulted: number;
  score: number;
  tier: ReputationTier;
  onTimePercentage?: number;
}

export interface ContributionSubmitResponse {
  txHash: string;
  explorerUrl: string;
}

export function computeTier(score: number): ReputationTier {
  if (score >= 900) return 'PLATINUM';
  if (score >= 600) return 'GOLD';
  if (score >= 300) return 'SILVER';
  if (score >= 100) return 'BRONZE';
  return 'NEW';
}
