/**
 * Whale Alert 任务处理
 */

import { processWhaleTransaction } from './whale-monitor';
import { TelegramService } from './telegram';
import { DiscordService } from './discord';

export async function startWhaleMonitor(payload: any, env: any): Promise<void> {
  const { subscriptionId, userId, minAmount, trackedTokens } = payload;

  // 实际实现中应该使用 Helius Webhook 或轮询
  // 这里提供一个框架
  console.log(`Whale monitor started: ${subscriptionId}`);

  // TODO: 设置 Helius Webhook 或轮询机制
  // 当检测到鲸鱼交易时，调用 processWhaleTransaction
}

export async function stopWhaleMonitor(payload: any, env: any): Promise<void> {
  const { userId } = payload;
  // 实际实现中应该停止监控
  console.log(`Whale monitor stopped for user: ${userId}`);
}

export async function sendWhaleAlert(payload: any, env: any): Promise<void> {
  const { userId, alert } = payload;

  // 发送通知到数据库
  await env.DB.prepare(`
    INSERT INTO notifications (
      id, user_id, type, priority, title, message, action_url, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    userId,
    'whale_alert',
    'high',
    'Whale Alert',
    `${alert.type.toUpperCase()}: ${alert.amountUsd.toLocaleString()} USD of ${alert.tokenSymbol}`,
    `https://solscan.io/tx/${alert.txHash}`,
    Date.now()
  ).run();

  // 发送通知到各个渠道
  try {
    const subscription = await env.DB.prepare(`
      SELECT channels FROM whale_alert_subscriptions
      WHERE user_id = ?
    `).bind(userId).first() as any;

    if (subscription) {
      const channels = JSON.parse(subscription.channels || '[]');

      // Telegram 通知
      if (channels.includes('telegram')) {
        try {
          const telegramService = new TelegramService(env.TELEGRAM_BOT_TOKEN);
          const user = await env.DB.prepare(`
            SELECT notification_telegram FROM users WHERE id = ?
          `).bind(userId).first() as any;

          if (user?.notification_telegram) {
            await telegramService.sendWhaleAlert(user.notification_telegram, alert);
          }
        } catch (error) {
          console.error('Error sending Telegram alert:', error);
        }
      }

      // Discord 通知
      if (channels.includes('discord')) {
        try {
          const user = await env.DB.prepare(`
            SELECT notification_discord FROM users WHERE id = ?
          `).bind(userId).first() as any;

          if (user?.notification_discord) {
            const discordService = new DiscordService(user.notification_discord);
            await discordService.sendWhaleAlert(alert);
          }
        } catch (error) {
          console.error('Error sending Discord alert:', error);
        }
      }
    }
  } catch (error) {
    console.error('Error sending notifications:', error);
  }

  // 通过 WebSocket 发送实时通知
  // TODO: 获取 WebSocket Durable Object 并广播
}
