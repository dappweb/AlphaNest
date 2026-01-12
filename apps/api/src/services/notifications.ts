/**
 * Notification Service - 通知发送服务
 */

import { Env } from '../index';

// ============================================
// Types
// ============================================

interface NotificationPayload {
  type: 'whale_alert' | 'dev_launch' | 'price_alert' | 'insurance_update' | 'system';
  recipients: NotificationRecipient[];
  data: any;
}

interface NotificationRecipient {
  userId: string;
  telegramChatId?: string;
  discordWebhook?: string;
  email?: string;
}

interface WhaleAlertData {
  tokenAddress: string;
  tokenSymbol: string;
  chainId: number;
  walletAddress: string;
  action: 'buy' | 'sell';
  amount: string;
  valueUsd: string;
  txHash: string;
}

interface DevLaunchData {
  devAddress: string;
  devAlias: string;
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  chainId: number;
  initialLiquidity: string;
}

interface PriceAlertData {
  tokenAddress: string;
  tokenSymbol: string;
  chainId: number;
  currentPrice: string;
  targetPrice: string;
  direction: 'above' | 'below';
}

interface InsuranceUpdateData {
  policyId: string;
  tokenSymbol: string;
  status: 'purchased' | 'expired' | 'claimed' | 'settled';
  payout?: string;
}

// ============================================
// Main Send Function
// ============================================

export async function sendNotification(
  payload: NotificationPayload,
  env: Env
): Promise<void> {
  const { type, recipients, data } = payload;

  console.log(`Sending ${type} notification to ${recipients.length} recipients`);

  const message = formatNotificationMessage(type, data);

  for (const recipient of recipients) {
    try {
      // Send to Telegram
      if (recipient.telegramChatId) {
        await sendTelegramNotification(recipient.telegramChatId, message, env);
      }

      // Send to Discord
      if (recipient.discordWebhook) {
        await sendDiscordNotification(recipient.discordWebhook, type, data);
      }

      // Store notification in database
      await storeNotification(recipient.userId, type, data, env);
    } catch (error) {
      console.error(`Failed to send notification to ${recipient.userId}:`, error);
    }
  }
}

// ============================================
// Message Formatting
// ============================================

function formatNotificationMessage(type: string, data: any): string {
  switch (type) {
    case 'whale_alert':
      return formatWhaleAlert(data as WhaleAlertData);
    case 'dev_launch':
      return formatDevLaunch(data as DevLaunchData);
    case 'price_alert':
      return formatPriceAlert(data as PriceAlertData);
    case 'insurance_update':
      return formatInsuranceUpdate(data as InsuranceUpdateData);
    default:
      return `📢 AlphaNest Notification\n\n${JSON.stringify(data, null, 2)}`;
  }
}

function formatWhaleAlert(data: WhaleAlertData): string {
  const emoji = data.action === 'buy' ? '🐋💚' : '🐋🔴';
  const action = data.action === 'buy' ? 'BOUGHT' : 'SOLD';
  const chainName = getChainName(data.chainId);

  return `${emoji} **WHALE ALERT**

🪙 Token: **${data.tokenSymbol}**
📊 Chain: ${chainName}
💰 Amount: ${formatAmount(data.amount)}
💵 Value: $${formatUsd(data.valueUsd)}
🔄 Action: ${action}

🔗 [View Transaction](${getTxUrl(data.chainId, data.txHash)})

_via AlphaNest_`;
}

function formatDevLaunch(data: DevLaunchData): string {
  const chainName = getChainName(data.chainId);

  return `🚀 **NEW TOKEN LAUNCH**

👤 Dev: **${data.devAlias || shortenAddress(data.devAddress)}**
🪙 Token: **${data.tokenName}** (${data.tokenSymbol})
📊 Chain: ${chainName}
💧 Initial Liquidity: $${formatUsd(data.initialLiquidity)}

📍 Contract: \`${data.tokenAddress}\`

⚡ This dev is on your watchlist!

_via AlphaNest_`;
}

function formatPriceAlert(data: PriceAlertData): string {
  const emoji = data.direction === 'above' ? '📈' : '📉';
  const chainName = getChainName(data.chainId);

  return `${emoji} **PRICE ALERT**

🪙 Token: **${data.tokenSymbol}**
📊 Chain: ${chainName}
💰 Current Price: $${data.currentPrice}
🎯 Target: $${data.targetPrice} (${data.direction})

_via AlphaNest_`;
}

function formatInsuranceUpdate(data: InsuranceUpdateData): string {
  const statusEmoji: Record<string, string> = {
    purchased: '✅',
    expired: '⏰',
    claimed: '📋',
    settled: '💰',
  };

  let message = `${statusEmoji[data.status] || '📢'} **INSURANCE UPDATE**

📄 Policy ID: ${data.policyId}
🪙 Token: **${data.tokenSymbol}**
📊 Status: ${data.status.toUpperCase()}`;

  if (data.payout) {
    message += `\n💰 Payout: $${formatUsd(data.payout)}`;
  }

  message += '\n\n_via AlphaNest_';

  return message;
}

// ============================================
// Telegram
// ============================================

async function sendTelegramNotification(
  chatId: string,
  message: string,
  env: Env
): Promise<void> {
  const botToken = (env as any).TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.log('Telegram bot token not configured');
    return;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
      disable_web_page_preview: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Telegram API error: ${error}`);
  }
}

// ============================================
// Discord
// ============================================

async function sendDiscordNotification(
  webhookUrl: string,
  type: string,
  data: any
): Promise<void> {
  const embed = createDiscordEmbed(type, data);

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'AlphaNest',
      avatar_url: 'https://alphanest-web-9w8.pages.dev/icons/icon-192x192.png',
      embeds: [embed],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Discord webhook error: ${error}`);
  }
}

function createDiscordEmbed(type: string, data: any): any {
  const colors: Record<string, number> = {
    whale_alert: 0x3498db,    // Blue
    dev_launch: 0x2ecc71,     // Green
    price_alert: 0xf39c12,    // Orange
    insurance_update: 0x9b59b6, // Purple
    system: 0x95a5a6,         // Gray
  };

  const titles: Record<string, string> = {
    whale_alert: '🐋 Whale Alert',
    dev_launch: '🚀 New Token Launch',
    price_alert: '📊 Price Alert',
    insurance_update: '🛡️ Insurance Update',
    system: '📢 System Notification',
  };

  const embed: any = {
    title: titles[type] || 'AlphaNest Notification',
    color: colors[type] || 0x3498db,
    timestamp: new Date().toISOString(),
    footer: {
      text: 'AlphaNest',
      icon_url: 'https://alphanest-web-9w8.pages.dev/icons/icon-192x192.png',
    },
  };

  // Add type-specific fields
  switch (type) {
    case 'whale_alert':
      embed.fields = [
        { name: 'Token', value: data.tokenSymbol, inline: true },
        { name: 'Action', value: data.action.toUpperCase(), inline: true },
        { name: 'Value', value: `$${formatUsd(data.valueUsd)}`, inline: true },
        { name: 'Chain', value: getChainName(data.chainId), inline: true },
      ];
      embed.url = getTxUrl(data.chainId, data.txHash);
      break;

    case 'dev_launch':
      embed.fields = [
        { name: 'Token', value: `${data.tokenName} (${data.tokenSymbol})`, inline: true },
        { name: 'Dev', value: data.devAlias || shortenAddress(data.devAddress), inline: true },
        { name: 'Chain', value: getChainName(data.chainId), inline: true },
        { name: 'Liquidity', value: `$${formatUsd(data.initialLiquidity)}`, inline: true },
      ];
      break;

    case 'price_alert':
      embed.fields = [
        { name: 'Token', value: data.tokenSymbol, inline: true },
        { name: 'Current', value: `$${data.currentPrice}`, inline: true },
        { name: 'Target', value: `$${data.targetPrice}`, inline: true },
      ];
      break;
  }

  return embed;
}

// ============================================
// Database Storage
// ============================================

async function storeNotification(
  userId: string,
  type: string,
  data: any,
  env: Env
): Promise<void> {
  try {
    await env.DB.prepare(`
      INSERT INTO notifications (id, user_id, type, data, created_at, read)
      VALUES (?, ?, ?, ?, ?, 0)
    `).bind(
      crypto.randomUUID(),
      userId,
      type,
      JSON.stringify(data),
      Math.floor(Date.now() / 1000)
    ).run();
  } catch (error) {
    // Table might not exist, log and continue
    console.log('Could not store notification:', error);
  }
}

// ============================================
// Helpers
// ============================================

function getChainName(chainId: number): string {
  const chains: Record<number, string> = {
    1: 'Ethereum',
    8453: 'Base',
    56: 'BNB Chain',
    137: 'Polygon',
    42161: 'Arbitrum',
    11155111: 'Sepolia',
  };
  return chains[chainId] || `Chain ${chainId}`;
}

function getTxUrl(chainId: number, txHash: string): string {
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io/tx/',
    8453: 'https://basescan.org/tx/',
    56: 'https://bscscan.com/tx/',
    137: 'https://polygonscan.com/tx/',
    42161: 'https://arbiscan.io/tx/',
    11155111: 'https://sepolia.etherscan.io/tx/',
  };
  return `${explorers[chainId] || 'https://etherscan.io/tx/'}${txHash}`;
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatAmount(amount: string): string {
  const num = parseFloat(amount);
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
}

function formatUsd(value: string): string {
  const num = parseFloat(value);
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ============================================
// Batch Notification Functions
// ============================================

export async function notifyDevSubscribers(
  devAddress: string,
  launchData: DevLaunchData,
  env: Env
): Promise<void> {
  // Get all subscribers for this dev
  const subscribers = await env.DB.prepare(`
    SELECT u.id, u.notification_telegram, u.notification_discord
    FROM dev_subscriptions ds
    JOIN users u ON ds.user_id = u.id
    WHERE ds.dev_id = (SELECT id FROM devs WHERE wallet_address = ?)
    AND (ds.notify_telegram = 1 OR ds.notify_discord = 1)
  `).bind(devAddress).all();

  if (!subscribers.results || subscribers.results.length === 0) {
    console.log(`No subscribers for dev ${devAddress}`);
    return;
  }

  const recipients: NotificationRecipient[] = subscribers.results.map((s: any) => ({
    userId: s.id,
    telegramChatId: s.notification_telegram,
    discordWebhook: s.notification_discord,
  }));

  await sendNotification({
    type: 'dev_launch',
    recipients,
    data: launchData,
  }, env);
}

export async function notifyWhaleWatchers(
  tokenAddress: string,
  alertData: WhaleAlertData,
  env: Env
): Promise<void> {
  // Get users watching this token for whale alerts
  const watchers = await env.DB.prepare(`
    SELECT u.id, u.notification_telegram, u.notification_discord
    FROM token_watchlist tw
    JOIN users u ON tw.user_id = u.id
    WHERE tw.token_address = ? AND tw.whale_alerts = 1
  `).bind(tokenAddress).all();

  if (!watchers.results || watchers.results.length === 0) {
    return;
  }

  const recipients: NotificationRecipient[] = watchers.results.map((w: any) => ({
    userId: w.id,
    telegramChatId: w.notification_telegram,
    discordWebhook: w.notification_discord,
  }));

  await sendNotification({
    type: 'whale_alert',
    recipients,
    data: alertData,
  }, env);
}
