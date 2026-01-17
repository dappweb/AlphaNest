/**
 * Discord Webhook Service
 */

export class DiscordService {
  private webhookUrl: string;

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }

  /**
   * 发送鲸鱼警报
   */
  async sendWhaleAlert(data: {
    wallet: string;
    token: string;
    tokenSymbol: string;
    type: 'buy' | 'sell' | 'transfer';
    amount: number;
    amountUsd: number;
    txHash: string;
  }): Promise<boolean> {
    const embed = {
      title: '🐋 Whale Alert',
      color: data.type === 'buy' ? 0x2ecc71 : data.type === 'sell' ? 0xe74c3c : 0x3498db,
      fields: [
        { name: 'Token', value: data.tokenSymbol, inline: true },
        { name: 'Action', value: data.type.toUpperCase(), inline: true },
        { name: 'Amount', value: `$${data.amountUsd.toLocaleString()}`, inline: true },
        { name: 'Wallet', value: `${data.wallet.slice(0, 8)}...${data.wallet.slice(-6)}`, inline: false },
      ],
      timestamp: new Date().toISOString(),
      url: `https://solscan.io/tx/${data.txHash}`,
      footer: {
        text: 'AlphaNest',
      },
    };

    return this.sendWebhook({ embeds: [embed] });
  }

  /**
   * 发送狙击 Bot 通知
   */
  async sendSniperNotification(data: {
    sniperId: string;
    targetToken: string;
    txHash: string;
    status: 'executed' | 'failed';
    message?: string;
  }): Promise<boolean> {
    const embed = {
      title: data.status === 'executed' ? '🎯 Sniper Executed!' : '🎯 Sniper Failed',
      color: data.status === 'executed' ? 0x2ecc71 : 0xe74c3c,
      fields: [
        { name: 'Sniper ID', value: data.sniperId, inline: true },
        { name: 'Target Token', value: `${data.targetToken.slice(0, 8)}...`, inline: true },
        { name: 'Status', value: data.status.toUpperCase(), inline: true },
      ],
      timestamp: new Date().toISOString(),
      url: `https://solscan.io/tx/${data.txHash}`,
      footer: {
        text: 'AlphaNest',
      },
    };

    if (data.message) {
      embed.description = data.message;
    }

    return this.sendWebhook({ embeds: [embed] });
  }

  /**
   * 发送通用通知
   */
  async sendNotification(title: string, message: string, color?: number): Promise<boolean> {
    const embed = {
      title,
      description: message,
      color: color || 0x3498db,
      timestamp: new Date().toISOString(),
      footer: {
        text: 'AlphaNest',
      },
    };

    return this.sendWebhook({ embeds: [embed] });
  }

  /**
   * 发送 Webhook 消息
   */
  private async sendWebhook(payload: any): Promise<boolean> {
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'AlphaNest',
          avatar_url: 'https://alphanest-web-9w8.pages.dev/icons/icon-192x192.png',
          ...payload,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Discord webhook error:', error);
      return false;
    }
  }
}
