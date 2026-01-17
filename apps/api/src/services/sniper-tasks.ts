/**
 * Sniper Bot 任务处理
 */

import { monitorTokenLaunch, executeSnipe } from './sniper-monitor';

export async function startSniperMonitor(payload: any, env: any): Promise<void> {
  const { sniperId, targetToken, buyAmount, slippage, autoSell, takeProfit, stopLoss, userId } = payload;

  // 开始监控代币发布
  // 实际实现中应该使用定时任务或事件监听
  setInterval(async () => {
    await monitorTokenLaunch({
      sniperId,
      targetToken,
      buyAmount,
      slippage,
      autoSell,
      takeProfit,
      stopLoss,
      userId,
    }, env);
  }, 5000); // 每5秒检查一次

  console.log(`Sniper monitor started: ${sniperId}`);
}

export async function stopSniperMonitor(payload: any, env: any): Promise<void> {
  const { sniperId } = payload;
  // 实际实现中应该停止定时任务
  console.log(`Sniper monitor stopped: ${sniperId}`);
}

import { TelegramService } from './telegram';
import { DiscordService } from './discord';

export async function sendSniperNotification(payload: any, env: any): Promise<void> {
  const { userId, sniperId, targetToken, txHash, status, message } = payload;

  // 发送通知到数据库
  await env.DB.prepare(`
    INSERT INTO notifications (
      id, user_id, type, priority, title, message, action_url, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    userId,
    'sniper',
    'high',
    status === 'executed' ? 'Sniper Bot Executed' : 'Sniper Bot Failed',
    message || (status === 'executed' 
      ? `Sniper bot executed successfully. TX: ${txHash}`
      : `Sniper bot failed. TX: ${txHash}`),
    `https://solscan.io/tx/${txHash}`,
    Date.now()
  ).run();

  // 发送通知到各个渠道
  try {
    const user = await env.DB.prepare(`
      SELECT notification_telegram, notification_discord FROM users WHERE id = ?
    `).bind(userId).first() as any;

    // Telegram 通知
    if (user?.notification_telegram) {
      try {
        const telegramService = new TelegramService(env.TELEGRAM_BOT_TOKEN);
        await telegramService.sendSniperNotification(user.notification_telegram, {
          sniperId,
          targetToken,
          txHash,
          status,
          message,
        });
      } catch (error) {
        console.error('Error sending Telegram notification:', error);
      }
    }

    // Discord 通知
    if (user?.notification_discord) {
      try {
        const discordService = new DiscordService(user.notification_discord);
        await discordService.sendSniperNotification({
          sniperId,
          targetToken,
          txHash,
          status,
          message,
        });
      } catch (error) {
        console.error('Error sending Discord notification:', error);
      }
    }
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
}
