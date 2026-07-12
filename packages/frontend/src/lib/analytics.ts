// Simple analytics tracker for monitoring user interactions
interface AnalyticsEvent {
  event: string;
  properties?: Record<string, unknown>;
  timestamp?: number;
}

const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL) || 'http://localhost:3001/api';

class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  track(event: string, properties?: Record<string, unknown>): void {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.pathname : '/',
        timestamp: new Date().toISOString(),
      },
      timestamp: Date.now(),
    };

    this.events.push(analyticsEvent);

    // Always log to console
    console.log('[Analytics]', event, properties);

    // Send to server
    this.sendToServer(analyticsEvent);
  }

  private async sendToServer(event: AnalyticsEvent): Promise<void> {
    try {
      await fetch(`${API_BASE}/analytics/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
        // Use keepalive so it completes even if page unloads
        keepalive: true,
      });
    } catch {
      // Non-critical — events still stored locally
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
