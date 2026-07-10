// Simple analytics tracker for monitoring user interactions
interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  track(event: string, properties?: Record<string, any>): void {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      },
      timestamp: Date.now(),
    };

    this.events.push(analyticsEvent);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', event, properties);
    }

    // Send to server (optional)
    this.sendToServer(analyticsEvent);
  }

  private async sendToServer(event: AnalyticsEvent): Promise<void> {
    try {
      // Optional: Send to your backend analytics endpoint
      // await fetch('/api/analytics/track', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event),
      // });
    } catch (err) {
      console.error('Failed to send analytics:', err);
    }
  }

  getEvents(): AnalyticsEvent[] {
    return this.events;
  }

  exportEvents(): string {
    return JSON.stringify(this.events, null, 2);
  }
}

export const analytics = new AnalyticsService();
