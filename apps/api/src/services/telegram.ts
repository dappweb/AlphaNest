/**
 * Telegram Bot 通知服务
 * 
 * 功能:
 * - 鲸鱼预警推送
 * - Dev 新发币通知
 * - 价格异动提醒
 * - 保险理赔通知
 */

interface TelegramMessage {
  chat_id: string | number;
  text: string;
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  disable_web_page_preview?: boolean;
  reply_markup?: TelegramKeyboard;
}

interface TelegramKeyboard {
  inline_keyboard?: TelegramInlineButton[][];
}

interface TelegramInlineButton {
  text: string;
  url?: string;
  callback_data?: string;
}

export class TelegramService {
  private botToken: string;
  private apiUrl: string;

  constructor(botToken: string) {
    this.botToken = botToken;
    this.apiUrl = `https://api.telegram.org/bot${botToken}`;
  }

  async sendMessage(message: TelegramMessage): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      return result.ok;
    } catch (error) {
      console.error('Telegram send error:', error);
      return false;
    }
  }

  // 鲸鱼预警通知
  async sendWhaleAlert(
    chatId: string | number,
    data: {
      tokenName: string;
      tokenSymbol: string;
      type: 'buy' | 'sell';
      amount: string;
      amountUsd: string;
      walletAddress: string;
      txHash: string;
      chain: string;
    }
  ): Promise<boolean> {
    const emoji = data.type === 'buy' ? '🐋🟢' : '🐋🔴';
    const action = data.type === 'buy' ? 'bought' : 'sold';

    const text = `${emoji} <b>Whale Alert!</b>

<b>${data.tokenName}</b> ($${data.tokenSymbol})
Chain: ${data.chain}

💰 Amount: ${data.amount} ($${data.amountUsd})
📍 Action: ${action.toUpperCase()}
👛 Wallet: <code>${data.walletAddress.slice(0, 6)}...${data.walletAddress.slice(-4)}</code>

🔗 <a href="https://basescan.org/tx/${data.txHash}">View Transaction</a>`;

    return this.sendMessage({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
  }

  // Dev 新发币通知
  async sendDevLaunchAlert(
    chatId: string | number,
    data: {
      devAddress: string;
      devAlias?: string;
      devScore: number;
      tokenName: string;
      tokenSymbol: string;
      tokenAddress: string;
      chain: string;
      initialLiquidity: string;
    }
  ): Promise<boolean> {
    const devName = data.devAlias || `${data.devAddress.slice(0, 6)}...${data.devAddress.slice(-4)}`;
    const scoreEmoji = data.devScore >= 80 ? '💎' : data.devScore >= 60 ? '🥇' : '⚠️';

    const text = `🚀 <b>New Token Launch!</b>

<b>${data.tokenName}</b> ($${data.tokenSymbol})
Chain: ${data.chain}

👤 Developer: ${devName}
${scoreEmoji} Dev Score: ${data.devScore}/100
💧 Initial Liquidity: $${data.initialLiquidity}

📋 Contract: <code>${data.tokenAddress}</code>`;

    return this.sendMessage({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📊 View Token', url: `https://alphanest-web-9w8.pages.dev/trade?token=${data.tokenAddress}` },
            { text: '👤 View Dev', url: `https://alphanest-web-9w8.pages.dev/devs/profile?address=${data.devAddress}` },
          ],
          [
            { text: '🛡️ Buy Insurance', url: `https://alphanest-web-9w8.pages.dev/insurance?token=${data.tokenAddress}` },
          ],
        ],
      },
    });
  }

  // 价格异动提醒
  async sendPriceAlert(
    chatId: string | number,
    data: {
      tokenName: string;
      tokenSymbol: string;
      tokenAddress: string;
      priceChange: number;
      currentPrice: string;
      timeframe: string;
    }
  ): Promise<boolean> {
    const isPositive = data.priceChange > 0;
    const emoji = isPositive ? '📈🟢' : '📉🔴';
    const direction = isPositive ? 'up' : 'down';

    const text = `${emoji} <b>Price Alert!</b>

<b>${data.tokenName}</b> ($${data.tokenSymbol})

💰 Current Price: $${data.currentPrice}
${isPositive ? '🚀' : '⬇️'} ${Math.abs(data.priceChange).toFixed(2)}% ${direction} in ${data.timeframe}`;

    return this.sendMessage({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📊 View Chart', url: `https://alphanest-web-9w8.pages.dev/trade?token=${data.tokenAddress}` }],
        ],
      },
    });
  }

  // 保险理赔通知
  async sendInsuranceClaimNotification(
    chatId: string | number,
    data: {
      policyId: string;
      tokenName: string;
      tokenSymbol: string;
      position: 'rug' | 'safe';
      outcome: 'win' | 'loss';
      payoutAmount?: string;
    }
  ): Promise<boolean> {
    const isWin = data.outcome === 'win';
    const emoji = isWin ? '🎉💰' : '😔';
    const title = isWin ? 'Insurance Payout!' : 'Insurance Expired';

    let text = `${emoji} <b>${title}</b>

Policy #${data.policyId}
Token: <b>${data.tokenName}</b> ($${data.tokenSymbol})
Position: ${data.position === 'rug' ? 'Betting Rug 🔴' : 'Betting Safe 🟢'}`;

    if (isWin && data.payoutAmount) {
      text += `\n\n💵 Payout: $${data.payoutAmount}`;
    }

    return this.sendMessage({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    });
  }

  // 设置 Webhook (用于接收用户命令)
  async setWebhook(webhookUrl: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl }),
      });

      const result = await response.json();
      return result.ok;
    } catch (error) {
      console.error('Telegram setWebhook error:', error);
      return false;
    }
  }

  // 获取 Bot 信息
  async getMe(): Promise<{ id: number; username: string } | null> {
    try {
      const response = await fetch(`${this.apiUrl}/getMe`);
      const result = await response.json();

      if (result.ok) {
        return { id: result.result.id, username: result.result.username };
      }
      return null;
    } catch (error) {
      console.error('Telegram getMe error:', error);
      return null;
    }
  }
}

// 消息格式化工具
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  }
  return num.toFixed(2);
}
