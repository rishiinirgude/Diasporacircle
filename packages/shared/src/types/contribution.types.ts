export interface Contribution {
  id: string;
  cycleId: string;
  memberAddress: string;
  amount: number;
  asset: string;
  txHash: string;
  paidAt: string;
  isOnTime: boolean;
}

export interface ContributionPrepareResponse {
  xdr: string;
  cycleIndex: number;
  amountFormatted: string;
}

export interface ContributionSubmitResponse {
  txHash: string;
  explorerUrl: string;
}
