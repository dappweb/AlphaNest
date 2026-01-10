/**
 * Cloudflare Workers Scheduled Tasks (Cron Triggers)
 * 
 * 定时任务配置:
 * - 每分钟更新热门代币价格
 * - 每5分钟更新Dev评分
 * - 每小时检测Rug Pull事件
 * - 每天清理过期数据
 */

import { Env } from '../index';

// ============================================
// 价格更新任务 (每分钟)
// ============================================

export async function updateTokenPrices(env: Env): Promise<void> {
  console.log('[Cron] Starting token price update...');
  
  try {
    // 获取需要更新的活跃代币
    const tokens = await env.DB.prepare(`
      SELECT address, chain FROM tokens 
      WHERE status = 'active' 
      ORDER BY volume_24h DESC 
      LIMIT 100
    `).all();

    if (!tokens.results?.length) {
      console.log('[Cron] No active tokens to update');
      return;
    }

    // 批量获取价格 (通过 DexScreener API)
    for (const token of tokens.results) {
      try {
        const response = await fetch(
          `https://api.dexscreener.com/latest/dex/tokens/${token.address}`
        );
        
        if (!response.ok) continue;
        
        const data = await response.json() as any;
        const pair = data.pairs?.[0];
        
        if (!pair) continue;

        // 更新数据库
        await env.DB.prepare(`
          UPDATE tokens SET 
            price_usd = ?,
            price_change_24h = ?,
            volume_24h = ?,
            liquidity = ?,
            updated_at = ?
          WHERE address = ?
        `).bind(
          pair.priceUsd || '0',
          pair.priceChange?.h24 || 0,
          pair.volume?.h24 || '0',
          pair.liquidity?.usd || '0',
          Math.floor(Date.now() / 1000),
          token.address
        ).run();

        // 缓存到 KV (TTL: 10秒)
        await env.CACHE.put(
          `price:${token.address}`,
          JSON.stringify({
            price: pair.priceUsd,
            change24h: pair.priceChange?.h24,
            volume24h: pair.volume?.h24,
            updatedAt: Date.now(),
          }),
          { expirationTtl: 10 }
        );

      } catch (error) {
        console.error(`[Cron] Failed to update price for ${token.address}:`, error);
      }
    }

    console.log(`[Cron] Updated prices for ${tokens.results.length} tokens`);
  } catch (error) {
    console.error('[Cron] Token price update failed:', error);
  }
}

// ============================================
// Dev 评分更新任务 (每5分钟)
// ============================================

export async function updateDevScores(env: Env): Promise<void> {
  console.log('[Cron] Starting dev score update...');
  
  try {
    // 获取需要更新的 Dev
    const devs = await env.DB.prepare(`
      SELECT id, address, chain, total_launches, successful_launches, 
             rug_count, total_volume, last_active_at
      FROM devs 
      WHERE updated_at < ?
      ORDER BY total_volume DESC
      LIMIT 50
    `).bind(Math.floor(Date.now() / 1000) - 300).all(); // 5分钟未更新

    if (!devs.results?.length) {
      console.log('[Cron] No devs to update');
      return;
    }

    for (const dev of devs.results as any[]) {
      try {
        // 计算新评分
        const score = calculateDevScore({
          totalLaunches: dev.total_launches,
          successfulLaunches: dev.successful_launches,
          rugCount: dev.rug_count,
          totalVolume: parseFloat(dev.total_volume || '0'),
          lastActiveAt: dev.last_active_at,
        });

        // 确定等级
        const tier = getDevTier(score);

        // 更新数据库
        await env.DB.prepare(`
          UPDATE devs SET 
            score = ?,
            tier = ?,
            updated_at = ?
          WHERE id = ?
        `).bind(score, tier, Math.floor(Date.now() / 1000), dev.id).run();

        // 缓存到 KV (TTL: 5分钟)
        await env.CACHE.put(
          `dev:${dev.address}`,
          JSON.stringify({
            score,
            tier,
            totalLaunches: dev.total_launches,
            rugCount: dev.rug_count,
            updatedAt: Date.now(),
          }),
          { expirationTtl: 300 }
        );

      } catch (error) {
        console.error(`[Cron] Failed to update score for dev ${dev.address}:`, error);
      }
    }

    console.log(`[Cron] Updated scores for ${devs.results.length} devs`);
  } catch (error) {
    console.error('[Cron] Dev score update failed:', error);
  }
}

// ============================================
// Rug Pull 检测任务 (每小时)
// ============================================

export async function detectRugPulls(env: Env): Promise<void> {
  console.log('[Cron] Starting rug pull detection...');
  
  try {
    // 获取活跃代币
    const tokens = await env.DB.prepare(`
      SELECT id, address, chain, liquidity, price_usd, creator_dev_id
      FROM tokens 
      WHERE status = 'active'
      AND created_at > ?
    `).bind(Math.floor(Date.now() / 1000) - 86400 * 7).all(); // 7天内创建

    if (!tokens.results?.length) {
      console.log('[Cron] No tokens to check');
      return;
    }

    let rugCount = 0;

    for (const token of tokens.results as any[]) {
      try {
        // 获取当前流动性
        const response = await fetch(
          `https://api.dexscreener.com/latest/dex/tokens/${token.address}`
        );
        
        if (!response.ok) continue;
        
        const data = await response.json() as any;
        const pair = data.pairs?.[0];
        
        if (!pair) continue;

        const currentLiquidity = parseFloat(pair.liquidity?.usd || '0');
        const previousLiquidity = parseFloat(token.liquidity || '0');

        // 检测流动性撤走 > 80%
        if (previousLiquidity > 1000 && currentLiquidity < previousLiquidity * 0.2) {
          console.log(`[Cron] Potential rug detected: ${token.address}`);
          
          // 标记为 rugged
          await env.DB.prepare(`
            UPDATE tokens SET 
              status = 'rugged',
              updated_at = ?
            WHERE id = ?
          `).bind(Math.floor(Date.now() / 1000), token.id).run();

          // 更新 Dev rug count
          if (token.creator_dev_id) {
            await env.DB.prepare(`
              UPDATE devs SET 
                rug_count = rug_count + 1,
                updated_at = ?
              WHERE id = ?
            `).bind(Math.floor(Date.now() / 1000), token.creator_dev_id).run();
          }

          rugCount++;
        }

      } catch (error) {
        console.error(`[Cron] Failed to check token ${token.address}:`, error);
      }
    }

    console.log(`[Cron] Detected ${rugCount} potential rug pulls`);
  } catch (error) {
    console.error('[Cron] Rug detection failed:', error);
  }
}

// ============================================
// 热门列表更新 (每分钟)
// ============================================

export async function updateTrendingLists(env: Env): Promise<void> {
  console.log('[Cron] Updating trending lists...');
  
  try {
    // 热门代币 (按24h交易量)
    const trendingTokens = await env.DB.prepare(`
      SELECT id, address, chain, name, symbol, price_usd, price_change_24h, 
             volume_24h, market_cap, liquidity
      FROM tokens 
      WHERE status = 'active'
      ORDER BY CAST(volume_24h AS REAL) DESC
      LIMIT 20
    `).all();

    await env.CACHE.put(
      'trending:tokens',
      JSON.stringify(trendingTokens.results),
      { expirationTtl: 60 }
    );

    // 热门 Dev (按评分)
    const topDevs = await env.DB.prepare(`
      SELECT id, address, chain, alias, score, tier, total_launches, 
             successful_launches, rug_count, verified
      FROM devs 
      ORDER BY score DESC
      LIMIT 20
    `).all();

    await env.CACHE.put(
      'trending:devs',
      JSON.stringify(topDevs.results),
      { expirationTtl: 60 }
    );

    // 最新发币
    const recentLaunches = await env.DB.prepare(`
      SELECT t.id, t.address, t.chain, t.name, t.symbol, t.price_usd, 
             t.created_at, d.address as dev_address, d.score as dev_score
      FROM tokens t
      LEFT JOIN devs d ON t.creator_dev_id = d.id
      WHERE t.status = 'active'
      ORDER BY t.created_at DESC
      LIMIT 20
    `).all();

    await env.CACHE.put(
      'trending:launches',
      JSON.stringify(recentLaunches.results),
      { expirationTtl: 60 }
    );

    console.log('[Cron] Trending lists updated');
  } catch (error) {
    console.error('[Cron] Trending update failed:', error);
  }
}

// ============================================
// 数据清理任务 (每天)
// ============================================

export async function cleanupOldData(env: Env): Promise<void> {
  console.log('[Cron] Starting data cleanup...');
  
  try {
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 86400 * 30;
    const sevenDaysAgo = Math.floor(Date.now() / 1000) - 86400 * 7;

    // 清理过期会话
    // (KV 自动过期，这里只清理数据库记录)
    
    // 清理旧的审计日志
    await env.DB.prepare(`
      DELETE FROM audit_logs WHERE created_at < ?
    `).bind(thirtyDaysAgo).run();

    // 清理已读通知
    await env.DB.prepare(`
      DELETE FROM notifications 
      WHERE read = 1 AND created_at < ?
    `).bind(sevenDaysAgo).run();

    // 标记长期不活跃的代币为 dead
    await env.DB.prepare(`
      UPDATE tokens SET status = 'dead'
      WHERE status = 'active' 
      AND updated_at < ?
      AND CAST(volume_24h AS REAL) < 100
    `).bind(sevenDaysAgo).run();

    console.log('[Cron] Data cleanup completed');
  } catch (error) {
    console.error('[Cron] Data cleanup failed:', error);
  }
}

// ============================================
// 辅助函数
// ============================================

function calculateDevScore(data: {
  totalLaunches: number;
  successfulLaunches: number;
  rugCount: number;
  totalVolume: number;
  lastActiveAt: number;
}): number {
  const { totalLaunches, successfulLaunches, rugCount, totalVolume, lastActiveAt } = data;
  
  // 基础分 50
  let score = 50;
  
  // 胜率加成 (最高 +30)
  if (totalLaunches > 0) {
    const winRate = successfulLaunches / totalLaunches;
    score += Math.min(30, winRate * 30);
  }
  
  // 交易量加成 (最高 +20)
  if (totalVolume > 0) {
    const volumeBonus = Math.log10(totalVolume + 1) * 2;
    score += Math.min(20, volumeBonus);
  }
  
  // Rug 惩罚 (每次 -15)
  score -= rugCount * 15;
  
  // 不活跃惩罚 (30天以上 -10)
  const daysSinceActive = (Date.now() / 1000 - lastActiveAt) / 86400;
  if (daysSinceActive > 30) {
    score -= 10;
  }
  
  // 限制范围 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getDevTier(score: number): string {
  if (score >= 90) return 'diamond';
  if (score >= 75) return 'platinum';
  if (score >= 60) return 'gold';
  if (score >= 40) return 'silver';
  return 'bronze';
}

// ============================================
// 主调度函数
// ============================================

export async function handleScheduled(
  event: ScheduledEvent,
  env: Env,
  ctx: ExecutionContext
): Promise<void> {
  const cron = event.cron;
  
  console.log(`[Cron] Triggered: ${cron}`);
  
  switch (cron) {
    case '* * * * *': // 每分钟
      await Promise.all([
        updateTokenPrices(env),
        updateTrendingLists(env),
      ]);
      break;
      
    case '*/5 * * * *': // 每5分钟
      await updateDevScores(env);
      break;
      
    case '0 * * * *': // 每小时
      await detectRugPulls(env);
      break;
      
    case '0 0 * * *': // 每天
      await cleanupOldData(env);
      break;
      
    default:
      console.log(`[Cron] Unknown cron pattern: ${cron}`);
  }
}
