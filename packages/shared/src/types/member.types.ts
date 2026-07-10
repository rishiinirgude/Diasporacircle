export interface User {
  walletAddress: string;
  displayName?: string;
  phone?: string;
  email?: string;
  country?: string;
  preferredAsset?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  walletAddress: string;
  displayName?: string;
  phone?: string;
  email?: string;
  country?: string;
  preferredAsset?: string;
}
