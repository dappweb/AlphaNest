/**
 * Dev 信誉评分服务
 * 
 * 评分算法:
 * score = base_score + win_rate_bonus + volume_bonus - rug_penalty - inactive_penalty
 * 
 * 评分范围: 0-100
 * Tier 划分:
 * - Diamond: 90-100
 * - Platinum: 80-89
 * - Gold: 70-79
 * - Silver: 50-69
 * - Bronze: 0-49
 */

// D1Database type from Cloudflare Workers runtime
interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  meta?: object;
}

export interface DevStats {
  totalLaunches: number;
  successfulLaunches: number;
  rugCount: number;
  totalVolume: string;
  avgAthMultiplier: number;
  winRate: number;
  lastActiveAt: number;
}

export interface DevScore {
  score: number;
  tier: DevTier;
  breakdown: ScoreBreakdown;
}

export type DevTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

interface ScoreBreakdown {
  baseScore: number;
  winRateBonus: number;
  volumeBonus: number;
  rugPenalty: number;
  inactivePenalty: number;
  verificationBonus: number;
}

// 评分常量
const SCORING_CONFIG = {
  BASE_SCORE: 50,
  
  // Win Rate 加分 (0-20分)
  WIN_RATE_MULTIPLIER: 20,
  
  // 交易量加分 (0-15分)
  VOLUME_THRESHOLDS: [
    { min: 1000000, bonus: 15 },    // $1M+
    { min: 500000, bonus: 12 },     // $500K+
    { min: 100000, bonus: 8 },      // $100K+
    { min: 10000, bonus: 4 },       // $10K+
    { min: 0, bonus: 0 },
  ],
  
  // Rug 扣分
  RUG_PENALTY_BASE: 15,            // 每次 Rug 扣 15 分
  RUG_PENALTY_CAP: 50,             // 最多扣 50 分
  
  // 不活跃扣分
  INACTIVE_DAYS_THRESHOLD: 30,
  INACTIVE_PENALTY_PER_MONTH: 5,
  INACTIVE_PENALTY_CAP: 20,
  
  // 验证加分
  VERIFICATION_BONUS: 10,
};

/**
 * 计算 Dev 信誉评分
 */
export function calculateDevScore(
  stats: DevStats,
  isVerified: boolean = false
): DevScore {
  const breakdown: ScoreBreakdown = {
    baseScore: SCORING_CONFIG.BASE_SCORE,
    winRateBonus: 0,
    volumeBonus: 0,
    rugPenalty: 0,
    inactivePenalty: 0,
    verificationBonus: 0,
  };

  // 1. Win Rate 加分
  if (stats.totalLaunches > 0) {
    breakdown.winRateBonus = Math.round(
      stats.winRate * SCORING_CONFIG.WIN_RATE_MULTIPLIER
    );
  }

  // 2. 交易量加分
  const totalVolume = parseFloat(stats.totalVolume) || 0;
  for (const threshold of SCORING_CONFIG.VOLUME_THRESHOLDS) {
    if (totalVolume >= threshold.min) {
      breakdown.volumeBonus = threshold.bonus;
      break;
    }
  }

  // 3. Rug 扣分
  breakdown.rugPenalty = Math.min(
    stats.rugCount * SCORING_CONFIG.RUG_PENALTY_BASE,
    SCORING_CONFIG.RUG_PENALTY_CAP
  );

  // 4. 不活跃扣分
  const daysSinceActive = Math.floor(
    (Date.now() - stats.lastActiveAt) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceActive > SCORING_CONFIG.INACTIVE_DAYS_THRESHOLD) {
    const monthsInactive = Math.floor(daysSinceActive / 30);
    breakdown.inactivePenalty = Math.min(
      monthsInactive * SCORING_CONFIG.INACTIVE_PENALTY_PER_MONTH,
      SCORING_CONFIG.INACTIVE_PENALTY_CAP
    );
  }

  // 5. 验证加分
  if (isVerified) {
    breakdown.verificationBonus = SCORING_CONFIG.VERIFICATION_BONUS;
  }

  // 计算总分
  let score =
    breakdown.baseScore +
    breakdown.winRateBonus +
    breakdown.volumeBonus +
    breakdown.verificationBonus -
    breakdown.rugPenalty -
    breakdown.inactivePenalty;

  // 限制在 0-100 范围
  score = Math.max(0, Math.min(100, score));

  return {
    score: Math.round(score),
    tier: getTierFromScore(score),
    breakdown,
  };
}

/**
 * 根据分数获取 Tier
 */
export function getTierFromScore(score: number): DevTier {
  if (score >= 90) return 'diamond';
  if (score >= 80) return 'platinum';
  if (score >= 70) return 'gold';
  if (score >= 50) return 'silver';
  return 'bronze';
}

/**
 * 判断代币是否成功 (用于计算胜率)
 * 成功定义: ATH 市值达到初始市值的 2 倍以上，且未被标记为 Rug
 */
export function isSuccessfulLaunch(
  athMarketCap: string,
  initialMarketCap: string,
  status: string
): boolean {
  if (status === 'rugged') return false;
  
  const ath = parseFloat(athMarketCap) || 0;
  const initial = parseFloat(initialMarketCap) || 1;
  
  return ath >= initial * 2;
}

/**
 * 更新 Dev 统计数据和评分
 */
export async function updateDevStats(
  db: D1Database,
  devId: string
): Promise<void> {
  // 获取该 Dev 的所有代币
  const tokens = await db.prepare(`
    SELECT 
      status, 
      market_cap, 
      ath_market_cap, 
      created_at
    FROM tokens 
    WHERE creator_dev_id = ?
  `).bind(devId).all();

  if (!tokens.results?.length) return;

  let totalLaunches = tokens.results.length;
  let successfulLaunches = 0;
  let rugCount = 0;
  let totalVolume = 0;
  let athSum = 0;
  let lastActiveAt = 0;

  for (const token of tokens.results as any[]) {
    // 统计 Rug
    if (token.status === 'rugged') {
      rugCount++;
    }

    // 统计成功
    if (isSuccessfulLaunch(token.ath_market_cap, token.market_cap, token.status)) {
      successfulLaunches++;
    }

    // 累计 ATH
    athSum += parseFloat(token.ath_market_cap) || 0;

    // 最后活跃时间
    if (token.created_at > lastActiveAt) {
      lastActiveAt = token.created_at;
    }
  }

  const winRate = totalLaunches > 0 ? successfulLaunches / totalLaunches : 0;
  const avgAthMultiplier = totalLaunches > 0 ? athSum / totalLaunches : 0;

  // 计算评分
  const dev = await db.prepare(
    'SELECT verified FROM devs WHERE id = ?'
  ).bind(devId).first() as any;

  const stats: DevStats = {
    totalLaunches,
    successfulLaunches,
    rugCount,
    totalVolume: totalVolume.toString(),
    avgAthMultiplier,
    winRate,
    lastActiveAt: lastActiveAt * 1000, // 转为毫秒
  };

  const { score, tier } = calculateDevScore(stats, dev?.verified === 1);

  // 更新数据库
  await db.prepare(`
    UPDATE devs SET
      score = ?,
      tier = ?,
      total_launches = ?,
      successful_launches = ?,
      rug_count = ?,
      total_volume = ?,
      avg_ath_multiplier = ?,
      updated_at = ?
    WHERE id = ?
  `).bind(
    score,
    tier,
    totalLaunches,
    successfulLaunches,
    rugCount,
    totalVolume.toString(),
    avgAthMultiplier,
    Math.floor(Date.now() / 1000),
    devId
  ).run();
}

/**
 * 批量更新所有 Dev 评分 (定时任务)
 */
export async function updateAllDevScores(db: D1Database): Promise<void> {
  const devs = await db.prepare('SELECT id FROM devs').all();
  
  for (const dev of devs.results as any[]) {
    try {
      await updateDevStats(db, dev.id);
    } catch (error) {
      console.error(`Failed to update dev ${dev.id}:`, error);
    }
  }
}
