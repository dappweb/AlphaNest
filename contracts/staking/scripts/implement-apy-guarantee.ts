/**
 * APY 保证机制实现脚本
 * 
 * 此脚本展示了如何实现和监控 APY 保证机制
 */

import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl/token';

// ============== 常量定义 ==============

// APY 范围
const MIN_BASE_APY = 5;      // 基础 5%，实际 10% (1:2)
const MAX_BASE_APY = 50;     // 基础 50%，实际 200% (1:2 × 10x)
const MIN_REWARD_RATE = 1000;  // 对应 5% APY
const MAX_REWARD_RATE = 10000; // 对应 50% APY

// 资金管理
const RESERVE_RATIO = 20;    // 储备比例 20%
const MIN_SUSTAINABLE_DAYS = 30;  // 最小可持续天数
const TARGET_SUSTAINABLE_DAYS = 90; // 目标可持续天数

// 奖励限制
const MAX_DAILY_REWARDS = 1_000_000 * 1e9;  // 100万 PopCowDefi/天
const MAX_USER_DAILY_REWARDS = 100_000 * 1e9; // 10万 PopCowDefi/天/用户

// ============== 接口定义 ==============

interface StakingPoolInfo {
  totalStaked: bigint;
  rewardRatePerSecond: bigint;
  conversionRate: number;
  rewardVaultBalance: bigint;
  lastUpdateTime: number;
  isPaused: boolean;
}

interface APYMonitoring {
  rewardVaultBalance: number;
  rewardVaultBalanceUSD: number;
  sustainableDays: number;
  currentBaseAPY: number;
  currentActualAPY: number;
  minAPY: number;
  maxAPY: number;
  totalStaked: number;
  dailyRewardsDistributed: number;
  dailyRewardsLimit: number;
  alertLevel: 'Normal' | 'Warning' | 'Critical' | 'Emergency';
}

// ============== 核心函数 ==============

/**
 * 计算最小所需余额（保证 30 天奖励）
 */
export function calculateMinRequiredBalance(
  totalStaked: bigint,
  rewardRatePerSecond: bigint,
  conversionRate: number = 2,
): bigint {
  const secondsIn30Days = BigInt(30 * 24 * 60 * 60);
  const maxMultiplier = 10; // 365天锁定期
  
  // 考虑 1:2 兑换比例和最大倍数
  const maxRewardRate = rewardRatePerSecond
    * BigInt(conversionRate)
    * BigInt(maxMultiplier);
  
  const minBalance = (totalStaked * maxRewardRate * secondsIn30Days) / BigInt(1e18);
  
  return minBalance;
}

/**
 * 计算目标余额（90 天储备）
 */
export function calculateTargetBalance(
  totalStaked: bigint,
  rewardRatePerSecond: bigint,
  conversionRate: number = 2,
): bigint {
  const secondsIn90Days = BigInt(90 * 24 * 60 * 60);
  const maxMultiplier = 10;
  
  const maxRewardRate = rewardRatePerSecond
    * BigInt(conversionRate)
    * BigInt(maxMultiplier);
  
  const target = (totalStaked * maxRewardRate * secondsIn90Days) / BigInt(1e18);
  
  return target;
}

/**
 * 计算可持续天数
 */
export function calculateSustainableDays(
  vaultBalance: bigint,
  totalStaked: bigint,
  rewardRatePerSecond: bigint,
  conversionRate: number = 2,
): number {
  if (totalStaked === 0n) {
    return Infinity;
  }
  
  const maxRate = rewardRatePerSecond
    * BigInt(conversionRate)
    * BigInt(10); // 最大倍数
  
  const maxDailyReward = (totalStaked * maxRate * BigInt(86400)) / BigInt(1e18);
  
  if (maxDailyReward === 0n) {
    return Infinity;
  }
  
  const days = Number(vaultBalance / maxDailyReward);
  return days;
}

/**
 * 动态调整奖励率
 */
export function adjustRewardRate(
  pool: StakingPoolInfo,
  vaultBalance: bigint,
): bigint {
  const sustainableDays = calculateSustainableDays(
    vaultBalance,
    pool.totalStaked,
    pool.rewardRatePerSecond,
    pool.conversionRate,
  );
  
  // 如果资金不足 30 天，降低奖励率
  if (sustainableDays < MIN_SUSTAINABLE_DAYS) {
    const reductionFactor = Math.floor((sustainableDays * 100) / MIN_SUSTAINABLE_DAYS);
    const newRate = (pool.rewardRatePerSecond * BigInt(reductionFactor)) / 100n;
    
    console.warn(
      `⚠️ 警告: 奖励池余额不足。可持续天数: ${sustainableDays} 天。` +
      `降低奖励率 ${100 - reductionFactor}%`
    );
    
    // 确保不低于最小值
    return newRate < BigInt(MIN_REWARD_RATE) 
      ? BigInt(MIN_REWARD_RATE) 
      : newRate;
  }
  
  // 如果资金充足（> 90 天），可以适当提高（但不超过上限）
  if (sustainableDays > TARGET_SUSTAINABLE_DAYS) {
    const increaseFactor = 105; // 最多提高 5%
    const newRate = (pool.rewardRatePerSecond * BigInt(increaseFactor)) / 100n;
    
    return newRate > BigInt(MAX_REWARD_RATE)
      ? BigInt(MAX_REWARD_RATE)
      : newRate;
  }
  
  return pool.rewardRatePerSecond;
}

/**
 * 检查紧急状态
 */
export function checkEmergencyStatus(
  pool: StakingPoolInfo,
  vaultBalance: bigint,
): { isEmergency: boolean; shouldPause: boolean; reason?: string } {
  const minBalance = calculateMinRequiredBalance(
    pool.totalStaked,
    pool.rewardRatePerSecond,
    pool.conversionRate,
  );
  
  const sustainableDays = calculateSustainableDays(
    vaultBalance,
    pool.totalStaked,
    pool.rewardRatePerSecond,
    pool.conversionRate,
  );
  
  if (vaultBalance < minBalance) {
    return {
      isEmergency: true,
      shouldPause: sustainableDays < 7,
      reason: `奖励池余额不足。当前余额: ${vaultBalance}, 最小需求: ${minBalance}, 可持续天数: ${sustainableDays}`,
    };
  }
  
  return { isEmergency: false, shouldPause: false };
}

/**
 * 获取预警级别
 */
export function getAlertLevel(sustainableDays: number): 'Normal' | 'Warning' | 'Critical' | 'Emergency' {
  if (sustainableDays < 7) {
    return 'Emergency';
  } else if (sustainableDays < 30) {
    return 'Critical';
  } else if (sustainableDays < 60) {
    return 'Warning';
  } else {
    return 'Normal';
  }
}

/**
 * 计算当前 APY
 */
export function calculateCurrentAPY(
  rewardRatePerSecond: bigint,
  totalStaked: bigint,
  conversionRate: number = 2,
): number {
  if (totalStaked === 0n) {
    return 0;
  }
  
  // 基础 APY = (reward_rate_per_second * 365 * 24 * 60 * 60) / total_staked * 100
  const secondsPerYear = BigInt(365 * 24 * 60 * 60);
  const baseAPY = Number(
    (rewardRatePerSecond * secondsPerYear * BigInt(100)) / totalStaked
  ) / 1e18;
  
  // 实际 APY = 基础 APY × 兑换比例
  const actualAPY = baseAPY * conversionRate;
  
  return actualAPY;
}

/**
 * 监控 APY 状态
 */
export async function monitorAPY(
  connection: Connection,
  poolAddress: PublicKey,
  rewardVaultAddress: PublicKey,
  popCowDefiPriceUSD: number = 0.1, // 默认价格
): Promise<APYMonitoring> {
  // 获取池子信息（需要从链上读取）
  // 这里使用模拟数据，实际应该从链上读取
  const pool: StakingPoolInfo = {
    totalStaked: 1000000n * BigInt(1e9), // 100万 POPCOW
    rewardRatePerSecond: 5000n, // 基础奖励率
    conversionRate: 2,
    rewardVaultBalance: 0n, // 将从链上读取
    lastUpdateTime: Date.now() / 1000,
    isPaused: false,
  };
  
  // 获取奖励池余额
  const vaultBalance = await connection.getTokenAccountBalance(rewardVaultAddress);
  pool.rewardVaultBalance = BigInt(vaultBalance.value.amount);
  
  // 计算可持续天数
  const sustainableDays = calculateSustainableDays(
    pool.rewardVaultBalance,
    pool.totalStaked,
    pool.rewardRatePerSecond,
    pool.conversionRate,
  );
  
  // 计算当前 APY
  const currentBaseAPY = calculateCurrentAPY(
    pool.rewardRatePerSecond,
    pool.totalStaked,
    1, // 基础 APY（不考虑兑换比例）
  );
  
  const currentActualAPY = currentBaseAPY * pool.conversionRate;
  
  // 获取预警级别
  const alertLevel = getAlertLevel(sustainableDays);
  
  return {
    rewardVaultBalance: Number(pool.rewardVaultBalance) / 1e9,
    rewardVaultBalanceUSD: (Number(pool.rewardVaultBalance) / 1e9) * popCowDefiPriceUSD,
    sustainableDays,
    currentBaseAPY,
    currentActualAPY,
    minAPY: MIN_BASE_APY * pool.conversionRate, // 10%
    maxAPY: MAX_BASE_APY * pool.conversionRate * 10, // 200%
    totalStaked: Number(pool.totalStaked) / 1e9,
    dailyRewardsDistributed: 0, // 需要从链上读取
    dailyRewardsLimit: MAX_DAILY_REWARDS / 1e9,
    alertLevel,
  };
}

/**
 * 自动补充奖励池
 */
export async function autoRefillRewardVault(
  connection: Connection,
  pool: StakingPoolInfo,
  rewardVaultAddress: PublicKey,
  revenuePoolAddress: PublicKey,
  authority: Keypair,
): Promise<{ refilled: boolean; amount: bigint }> {
  const vaultBalance = await connection.getTokenAccountBalance(rewardVaultAddress);
  const currentBalance = BigInt(vaultBalance.value.amount);
  
  const targetBalance = calculateTargetBalance(
    pool.totalStaked,
    pool.rewardRatePerSecond,
    pool.conversionRate,
  );
  
  if (currentBalance < targetBalance) {
    const refillAmount = targetBalance - currentBalance;
    
    // 这里应该执行转账操作
    // 实际实现需要调用智能合约的 auto_refill 函数
    console.log(`需要补充 ${refillAmount / BigInt(1e9)} PopCowDefi 到奖励池`);
    
    return {
      refilled: true,
      amount: refillAmount,
    };
  }
  
  return {
    refilled: false,
    amount: 0n,
  };
}

// ============== 使用示例 ==============

/**
 * 示例：监控和调整 APY
 */
export async function exampleMonitorAndAdjust(
  connection: Connection,
  poolAddress: PublicKey,
  rewardVaultAddress: PublicKey,
) {
  console.log('开始监控 APY 状态...\n');
  
  // 1. 监控当前状态
  const monitoring = await monitorAPY(connection, poolAddress, rewardVaultAddress);
  
  console.log('当前 APY 状态:');
  console.log(`- 奖励池余额: ${monitoring.rewardVaultBalance.toFixed(2)} PopCowDefi`);
  console.log(`- 可持续天数: ${monitoring.sustainableDays} 天`);
  console.log(`- 当前实际 APY: ${monitoring.currentActualAPY.toFixed(2)}%`);
  console.log(`- APY 范围: ${monitoring.minAPY}% - ${monitoring.maxAPY}%`);
  console.log(`- 预警级别: ${monitoring.alertLevel}\n`);
  
  // 2. 检查是否需要调整
  if (monitoring.alertLevel === 'Emergency' || monitoring.alertLevel === 'Critical') {
    console.log('⚠️ 检测到紧急状态，需要立即处理！');
    // 执行紧急措施
  }
  
  // 3. 检查是否需要补充资金
  if (monitoring.sustainableDays < TARGET_SUSTAINABLE_DAYS) {
    console.log('需要补充奖励池资金...');
    // 执行自动补充
  }
}

// ============== 导出 ==============

export {
  MIN_BASE_APY,
  MAX_BASE_APY,
  MIN_REWARD_RATE,
  MAX_REWARD_RATE,
  MIN_SUSTAINABLE_DAYS,
  TARGET_SUSTAINABLE_DAYS,
  MAX_DAILY_REWARDS,
  MAX_USER_DAILY_REWARDS,
};
