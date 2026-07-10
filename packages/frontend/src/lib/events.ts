import { Circle, Contribution } from '@diasporacircle/shared';

/**
 * Track user events for analytics
 */
export class EventTracker {
  static trackWalletConnected(address: string): void {
    console.log('[Event] Wallet connected:', address);
    // Send to analytics service
  }

  static trackCircleCreated(circle: Circle): void {
    console.log('[Event] Circle created:', {
      circleId: circle.id,
      memberCount: circle.totalMembers,
      contributionAmount: circle.contributionAmount,
    });
  }

  static trackCircleJoined(circleId: string): void {
    console.log('[Event] Circle joined:', circleId);
  }

  static trackContributionPrepared(circleId: string, cycleIndex: number): void {
    console.log('[Event] Contribution prepared:', { circleId, cycleIndex });
  }

  static trackContributionSubmitted(
    txHash: string,
    amount: number,
    asset: string
  ): void {
    console.log('[Event] Contribution submitted:', { txHash, amount, asset });
  }

  static trackCircleStarted(circleId: string, memberCount: number): void {
    console.log('[Event] Circle started:', { circleId, memberCount });
  }

  static trackUserError(errorType: string, message: string): void {
    console.error('[Error Event]', errorType, message);
  }
}
