export interface AnchorInfo {
  domain: string;
  displayName: string;
  transferServerUrl: string;
}

export interface DepositUrl {
  url: string;
  id: string;
}

const ANCHOR_CONFIGS: Record<string, AnchorInfo> = {
  testanchor: {
    domain: 'testanchor.stellar.org',
    displayName: 'Test Anchor',
    transferServerUrl: 'https://api.testanchor.stellar.org',
  },
};

export class AnchorService {
  static getSupportedAnchors(): AnchorInfo[] {
    return Object.values(ANCHOR_CONFIGS);
  }

  static async getDepositUrl(
    anchorDomain: string,
    assetCode: string,
    _jwtToken: string
  ): Promise<DepositUrl> {
    try {
      const config = ANCHOR_CONFIGS[anchorDomain];
      if (!config) {
        throw new Error(`Unsupported anchor: ${anchorDomain}`);
      }

      const url = new URL(
        '/sep24/transactions/deposit/interactive',
        config.transferServerUrl
      );
      url.searchParams.append('asset_code', assetCode);

      // Return deposit URL - in production, this would complete a full SEP-24 flow
      return {
        url: url.toString(),
        id: Math.random().toString(36).substring(7),
      };
    } catch (err) {
      throw new Error(`Failed to get deposit URL: ${err}`);
    }
  }
}
