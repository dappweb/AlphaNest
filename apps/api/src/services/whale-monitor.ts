/**
 * Whale Monitor Service
 * 监控鲸鱼交易并发送警报
 */

export interface WhaleAlert {
  wallet: string;
  token: string;
  tokenSymbol: string;
  type: 'buy' | 'sell' | 'transfer';
  amount: number;
  amountUsd: number;
  timestamp: number;
  txHash: string;
}

export interface WhaleMonitorConfig {
  minAmount: number;        // 最小金额（USD）
  trackedTokens: string[];   // 跟踪的代币列表（空数组表示跟踪所有）
  userId: string;
  subscriptionId: string;
}

/**
 * 检查交易是否为鲸鱼交易
 */
export function isWhaleTransaction(
  amountUsd: number,
  config: WhaleMonitorConfig
): boolean {
  return amountUsd >= config.minAmount;
}

/**
 * 检查代币是否在跟踪列表中
 */
export function shouldTrackToken(
  token: string,
  config: WhaleMonitorConfig
): boolean {
  if (config.trackedTokens.length === 0) {
    return true; // 跟踪所有代币
  }
  return config.trackedTokens.includes(token);
}

/**
 * 处理鲸鱼交易事件
 */
export async function processWhaleTransaction(
  alert: WhaleAlert,
  config: WhaleMonitorConfig,
  env: any
): Promise<void> {
  // 检查是否满足条件
  if (!isWhaleTransaction(alert.amountUsd, config)) {
    return;
  }

  if (!shouldTrackToken(alert.token, config)) {
    return;
  }

  // 保存警报到数据库
  try {
    await env.DB.prepare(`
      INSERT INTO whale_alerts (
        id, user_id, subscription_id, wallet, token, token_symbol,
        type, amount, amount_usd, tx_hash, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      config.userId,
      config.subscriptionId,
      alert.wallet,
      alert.token,
      alert.tokenSymbol,
      alert.type,
      alert.amount,
      alert.amountUsd,
      alert.txHash,
      alert.timestamp
    ).run();

    // 发送通知
    await env.TASK_QUEUE.send({
      type: 'SEND_WHALE_ALERT',
      payload: {
        userId: config.userId,
        alert,
      },
    });
  } catch (error) {
    console.error('Error processing whale transaction:', error);
  }
}
