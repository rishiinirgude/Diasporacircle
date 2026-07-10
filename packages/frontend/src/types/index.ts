// Local type definitions for DiasporaCircle frontend
// These are used instead of importing from @diasporacircle/shared to avoid monorepo complexity

export interface Circle {
  id: string;
  name: string;
  organizerAddress: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  contributionAmount: number;
  escrowAsset: string;
  cycleLengthDays: number;
  totalMembers: number;
  currentCycle: number;
  contractId?: string;
  inviteCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CircleMember {
  walletAddress: string;
  displayName?: string;
  payoutPosition: number;
  securityDepositPaid: boolean;
  joinedAt: string;
}

export interface Cycle {
  cycleIndex: number;
  recipientAddress: string;
  deadline: string;
  status: 'OPEN' | 'DISBURSED' | 'DEFAULTED';
  contributions: Contribution[];
}

export interface Contribution {
  id: string;
  circleId: string;
  cycleIndex: number;
  memberAddress: string;
  amount: number;
  asset: string;
  txHash: string;
  paidAt: string;
  isOnTime: boolean;
}

export interface User {
  walletAddress: string;
  displayName?: string;
  phone?: string;
  email?: string;
  country?: string;
  createdAt: string;
}

export type ReputationTier = 'NEW' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface ReputationProfile {
  walletAddress: string;
  tier: ReputationTier;
  score: number;
  circlesCompleted: number;
  totalOnTime: number;
  totalLate: number;
  totalDefaulted: number;
  onTimePercentage: number;
  joinedAt: string;
}

export interface CreateCircleInput {
  name: string;
  contributionAmount: number;
  cycleLengthDays: number;
  escrowAsset: string;
  memberWallets: string[];
  payoutOrder: string[];
}
