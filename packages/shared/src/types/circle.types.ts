export type CircleStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'PAUSED';
export type CycleStatus = 'OPEN' | 'DISBURSED' | 'DEFAULTED';

export interface Circle {
  id: string;
  name: string;
  contractId: string | null;
  organizerAddress: string;
  contributionAmount: number;
  escrowAsset: string;
  cycleLengthDays: number;
  totalMembers: number;
  currentCycle: number;
  status: CircleStatus;
  inviteCode: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  members?: CircleMember[];
  cycles?: Cycle[];
}

export interface CircleMember {
  id: string;
  circleId: string;
  walletAddress: string;
  payoutPosition: number;
  joinedAt: string;
  securityDepositPaid: boolean;
}

export interface Cycle {
  id: string;
  circleId: string;
  cycleIndex: number;
  recipientAddress: string;
  deadline: string;
  disbursedAt: string | null;
  disbursementTxHash: string | null;
  status: CycleStatus;
  contributions?: Contribution[];
}

export interface CreateCircleInput {
  name: string;
  contributionAmount: number;
  cycleLengthDays: number;
  escrowAsset: string;
  memberWallets: string[];
  payoutOrder: string[];
}

export interface OnChainCircleConfig {
  organizer: string;
  contribution_amount: bigint;
  escrow_asset: string;
  cycle_length_days: number;
  total_members: number;
  current_cycle: number;
  payout_order: string[];
  status: string;
}
