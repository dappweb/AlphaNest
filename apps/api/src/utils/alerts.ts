/**
 * 告警服务 - 异常监控和通知
 * 
 * 支持:
 * - Discord Webhook
 * - Telegram Bot
 * - Slack Webhook
 * - PagerDuty
 */

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertChannel = 'discord' | 'telegram' | 'slack' | 'pagerduty';

export interface Alert {
  title: string;
  message: string;
  severity: AlertSeverity;
  source: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface AlertConfig {
  discord?: {
    webhookUrl: string;
    enabled: boolean;
  };
  telegram?: {
    botToken: string;
    chatId: string;
    enabled: boolean;
  };
  slack?: {
    webhookUrl: string;
    enabled: boolean;
  };
  pagerduty?: {
    routingKey: string;
    enabled: boolean;
  };
}

const SEVERITY_COLORS: Record<AlertSeverity, number> = {
  low: 0x3498db,      // Blue
  medium: 0xf39c12,   // Yellow
  high: 0xe74c3c,     // Red
  critical: 0x9b59b6, // Purple
};

const SEVERITY_EMOJI: Record<AlertSeverity, string> = {
  low: 'ℹ️',
  medium: '⚠️',
  high: '🔴',
  critical: '🚨',
};

export class AlertService {
  private config: AlertConfig;

  constructor(config: AlertConfig) {
    this.config = config;
  }

  async send(alert: Alert, channels?: AlertChannel[]): Promise<void> {
    const targetChannels = channels || this.getDefaultChannels(alert.severity);

    const promises = targetChannels.map((channel) => {
      switch (channel) {
        case 'discord':
          return this.sendDiscord(alert);
        case 'telegram':
          return this.sendTelegram(alert);
        case 'slack':
          return this.sendSlack(alert);
        case 'pagerduty':
          return this.sendPagerDuty(alert);
        default:
          return Promise.resolve();
      }
    });

    await Promise.allSettled(promises);
  }

  private getDefaultChannels(severity: AlertSeverity): AlertChannel[] {
    switch (severity) {
      case 'critical':
        return ['discord', 'telegram', 'pagerduty'];
      case 'high':
        return ['discord', 'telegram'];
      case 'medium':
        return ['discord'];
      case 'low':
        return ['discord'];
      default:
        return [];
    }
  }

  private async sendDiscord(alert: Alert): Promise<void> {
    if (!this.config.discord?.enabled || !this.config.discord.webhookUrl) return;

    const embed = {
      title: `${SEVERITY_EMOJI[alert.severity]} ${alert.title}`,
      description: alert.message,
      color: SEVERITY_COLORS[alert.severity],
      fields: [
        { name: 'Severity', value: alert.severity.toUpperCase(), inline: true },
        { name: 'Source', value: alert.source, inline: true },
        { name: 'Time', value: alert.timestamp.toISOString(), inline: true },
      ],
      footer: { text: 'AlphaNest Alert System' },
    };

    if (alert.metadata) {
      embed.fields.push({
        name: 'Details',
        value: '```json\n' + JSON.stringify(alert.metadata, null, 2).slice(0, 1000) + '\n```',
        inline: false,
      });
    }

    await fetch(this.config.discord.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });
  }

  private async sendTelegram(alert: Alert): Promise<void> {
    if (!this.config.telegram?.enabled || !this.config.telegram.botToken) return;

    const text = `${SEVERITY_EMOJI[alert.severity]} <b>${alert.title}</b>

${alert.message}

<b>Severity:</b> ${alert.severity.toUpperCase()}
<b>Source:</b> ${alert.source}
<b>Time:</b> ${alert.timestamp.toISOString()}`;

    await fetch(`https://api.telegram.org/bot${this.config.telegram.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: this.config.telegram.chatId,
        text,
        parse_mode: 'HTML',
      }),
    });
  }

  private async sendSlack(alert: Alert): Promise<void> {
    if (!this.config.slack?.enabled || !this.config.slack.webhookUrl) return;

    const payload = {
      attachments: [
        {
          color: `#${SEVERITY_COLORS[alert.severity].toString(16)}`,
          title: `${SEVERITY_EMOJI[alert.severity]} ${alert.title}`,
          text: alert.message,
          fields: [
            { title: 'Severity', value: alert.severity.toUpperCase(), short: true },
            { title: 'Source', value: alert.source, short: true },
          ],
          footer: 'AlphaNest Alert System',
          ts: Math.floor(alert.timestamp.getTime() / 1000),
        },
      ],
    };

    await fetch(this.config.slack.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  private async sendPagerDuty(alert: Alert): Promise<void> {
    if (!this.config.pagerduty?.enabled || !this.config.pagerduty.routingKey) return;

    const severityMap: Record<AlertSeverity, string> = {
      low: 'info',
      medium: 'warning',
      high: 'error',
      critical: 'critical',
    };

    const payload = {
      routing_key: this.config.pagerduty.routingKey,
      event_action: 'trigger',
      payload: {
        summary: `[${alert.severity.toUpperCase()}] ${alert.title}`,
        source: alert.source,
        severity: severityMap[alert.severity],
        timestamp: alert.timestamp.toISOString(),
        custom_details: {
          message: alert.message,
          ...alert.metadata,
        },
      },
    };

    await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }
}

// Helper functions
export function createAlert(
  title: string,
  message: string,
  severity: AlertSeverity,
  source: string,
  metadata?: Record<string, unknown>
): Alert {
  return {
    title,
    message,
    severity,
    source,
    timestamp: new Date(),
    metadata,
  };
}

// Pre-defined alert templates
export const AlertTemplates = {
  highErrorRate: (errorRate: number, threshold: number) =>
    createAlert(
      'High Error Rate Detected',
      `Error rate (${errorRate.toFixed(2)}%) exceeded threshold (${threshold}%)`,
      'high',
      'error-monitor',
      { errorRate, threshold }
    ),

  rugPullDetected: (tokenAddress: string, liquidityDrop: number) =>
    createAlert(
      'Potential Rug Pull Detected',
      `Token ${tokenAddress} liquidity dropped by ${liquidityDrop.toFixed(2)}%`,
      'critical',
      'rug-detector',
      { tokenAddress, liquidityDrop }
    ),

  whaleTransaction: (wallet: string, amount: string, token: string, type: 'buy' | 'sell') =>
    createAlert(
      `Whale ${type.toUpperCase()} Alert`,
      `Wallet ${wallet.slice(0, 10)}... ${type === 'buy' ? 'bought' : 'sold'} ${amount} ${token}`,
      'medium',
      'whale-monitor',
      { wallet, amount, token, type }
    ),

  apiRateLimitExceeded: (ip: string, endpoint: string) =>
    createAlert(
      'Rate Limit Exceeded',
      `IP ${ip} exceeded rate limit on ${endpoint}`,
      'low',
      'rate-limiter',
      { ip, endpoint }
    ),

  databaseError: (operation: string, error: string) =>
    createAlert(
      'Database Error',
      `Database operation "${operation}" failed: ${error}`,
      'high',
      'database',
      { operation, error }
    ),

  serviceDown: (serviceName: string) =>
    createAlert(
      'Service Down',
      `${serviceName} is not responding`,
      'critical',
      'health-check',
      { serviceName }
    ),
};
