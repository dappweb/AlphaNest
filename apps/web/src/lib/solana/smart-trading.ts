/**
 * PopCowDefi 智能交易信号服务
 * 利用 Helius 数据分析 KOL 动态，生成交易信号
 */

import {
    getKOLTrades,
    getKOLHoldings,
    getAllKOLWallets,
    findCommonHoldings,
    KOLTrade,
    KOLHolding,
    KOLWallet,
} from '../helius/kol-tracker';
import { getTokenPrices, KNOWN_TOKENS } from '../helius/price';
import { POPCOW_TOKEN_MINT, POPCOWDEFI_TOKEN_MINT } from './constants';

// ============================================
// 类型定义
// ============================================

export interface AlphaSignal {
    id: string;
    type: 'hot' | 'warm' | 'cold';
    tokenMint: string;
    tokenSymbol: string;
    tokenName: string;

    // 信号详情
    signalStrength: number;  // 0-100
    confidence: 'high' | 'medium' | 'low';
    action: 'buy' | 'sell' | 'watch';

    // KOL 参与
    kolCount: number;
    kolNames: string[];
    totalKolVolume: number;

    // 价格信息
    currentPrice: number | null;
    suggestedEntry: number | null;
    suggestedStopLoss: number | null;
    suggestedTarget: number | null;

    // 时间
    detectedAt: number;
    expiresAt: number;

    // 备注
    reason: string;
    risks: string[];
}

export interface SmartTradeConfig {
    maxPositionSize: number;    // 最大仓位 (USDC)
    stopLossPercent: number;    // 止损百分比
    takeProfitPercent: number;  // 止盈百分比
    followOnlyVerified: boolean; // 仅跟单已验证 KOL
    minKolCount: number;        // 最少 KOL 数量触发
    autoExecute: boolean;       // 自动执行交易
}

export interface UserTier {
    tier: 'free' | 'bronze' | 'silver' | 'gold' | 'diamond';
    popCowDefiBalance: number;
    signalDelay: number;       // 信号延迟 (秒)
    dailySignalLimit: number;  // 每日信号数量限制
    discountRate: number;      // 手续费折扣
    priorityAccess: boolean;   // Alpha 优先访问
}

// ============================================
// 用户等级计算
// ============================================

export function calculateUserTier(popCowDefiBalance: number): UserTier {
    if (popCowDefiBalance >= 100000) {
        return {
            tier: 'diamond',
            popCowDefiBalance,
            signalDelay: 0,
            dailySignalLimit: Infinity,
            discountRate: 0.5,
            priorityAccess: true,
        };
    }

    if (popCowDefiBalance >= 10000) {
        return {
            tier: 'gold',
            popCowDefiBalance,
            signalDelay: 0,
            dailySignalLimit: 50,
            discountRate: 0.4,
            priorityAccess: true,
        };
    }

    if (popCowDefiBalance >= 1000) {
        return {
            tier: 'silver',
            popCowDefiBalance,
            signalDelay: 30 * 60, // 30 分钟
            dailySignalLimit: 20,
            discountRate: 0.25,
            priorityAccess: false,
        };
    }

    if (popCowDefiBalance >= 100) {
        return {
            tier: 'bronze',
            popCowDefiBalance,
            signalDelay: 2 * 60 * 60, // 2 小时
            dailySignalLimit: 10,
            discountRate: 0.1,
            priorityAccess: false,
        };
    }

    return {
        tier: 'free',
        popCowDefiBalance,
        signalDelay: 24 * 60 * 60, // 24 小时
        dailySignalLimit: 3,
        discountRate: 0,
        priorityAccess: false,
    };
}

// ============================================
// Alpha 信号生成
// ============================================

/**
 * 分析 KOL 交易动态，生成 Alpha 信号
 */
export async function generateAlphaSignals(): Promise<AlphaSignal[]> {
    const signals: AlphaSignal[] = [];
    const kolWallets = getAllKOLWallets();

    // 获取所有 KOL 最近交易
    const allTrades: Array<{ wallet: KOLWallet; trade: KOLTrade }> = [];

    const results = await Promise.allSettled(
        kolWallets.map(async (wallet) => {
            const trades = await getKOLTrades(wallet.address, 10);
            return trades.map(trade => ({ wallet, trade }));
        })
    );

    for (const result of results) {
        if (result.status === 'fulfilled') {
            allTrades.push(...result.value);
        }
    }

    // 按代币分组
    const tokenTradeMap = new Map<string, Array<{ wallet: KOLWallet; trade: KOLTrade }>>();

    for (const item of allTrades) {
        const mint = item.trade.tokenMint;
        if (!tokenTradeMap.has(mint)) {
            tokenTradeMap.set(mint, []);
        }
        tokenTradeMap.get(mint)!.push(item);
    }

    // 分析每个代币
    for (const [mint, trades] of tokenTradeMap) {
        // 过滤掉已知的主流代币
        if (Object.values(KNOWN_TOKENS).includes(mint)) continue;
        if (mint === POPCOW_TOKEN_MINT.toBase58()) continue;

        const buyTrades = trades.filter(t => t.trade.type === 'buy');
        const sellTrades = trades.filter(t => t.trade.type === 'sell');

        const kolBuyers = [...new Set(buyTrades.map(t => t.wallet.label))];
        const kolSellers = [...new Set(sellTrades.map(t => t.wallet.label))];

        // 计算信号强度
        const signalStrength = calculateSignalStrength({
            kolBuyCount: kolBuyers.length,
            kolSellCount: kolSellers.length,
            totalVolume: trades.reduce((sum, t) => sum + (t.trade.valueUsd || 0), 0),
            recency: trades[0]?.trade.timestamp || 0,
        });

        if (signalStrength < 30) continue; // 过滤弱信号

        // 获取当前价格
        const prices = await getTokenPrices([mint]);
        const currentPrice = prices[mint] || null;

        // 确定信号类型
        const action = kolBuyers.length > kolSellers.length * 2 ? 'buy' :
            kolSellers.length > kolBuyers.length * 2 ? 'sell' : 'watch';

        const signal: AlphaSignal = {
            id: `signal-${mint}-${Date.now()}`,
            type: signalStrength >= 70 ? 'hot' : signalStrength >= 50 ? 'warm' : 'cold',
            tokenMint: mint,
            tokenSymbol: trades[0]?.trade.tokenSymbol || 'UNKNOWN',
            tokenName: trades[0]?.trade.tokenSymbol || 'Unknown Token',

            signalStrength,
            confidence: signalStrength >= 70 ? 'high' : signalStrength >= 50 ? 'medium' : 'low',
            action,

            kolCount: kolBuyers.length,
            kolNames: kolBuyers,
            totalKolVolume: trades.reduce((sum, t) => sum + (t.trade.valueUsd || 0), 0),

            currentPrice,
            suggestedEntry: currentPrice,
            suggestedStopLoss: currentPrice ? currentPrice * 0.85 : null,
            suggestedTarget: currentPrice ? currentPrice * 1.5 : null,

            detectedAt: Date.now(),
            expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 小时后过期

            reason: `${kolBuyers.length} KOLs are ${action === 'buy' ? 'accumulating' : 'watching'} this token`,
            risks: generateRiskWarnings(trades),
        };

        signals.push(signal);
    }

    // 按信号强度排序
    return signals.sort((a, b) => b.signalStrength - a.signalStrength);
}

/**
 * 计算信号强度
 */
function calculateSignalStrength(data: {
    kolBuyCount: number;
    kolSellCount: number;
    totalVolume: number;
    recency: number;
}): number {
    let score = 0;

    // KOL 参与度 (最高 40 分)
    score += Math.min(40, data.kolBuyCount * 15);

    // 买卖比例 (最高 20 分)
    if (data.kolSellCount === 0 && data.kolBuyCount > 0) {
        score += 20;
    } else if (data.kolBuyCount > data.kolSellCount) {
        score += 10;
    }

    // 成交量 (最高 20 分)
    if (data.totalVolume > 100000) score += 20;
    else if (data.totalVolume > 10000) score += 15;
    else if (data.totalVolume > 1000) score += 10;

    // 新鲜度 (最高 20 分)
    const hoursSinceDetection = (Date.now() - data.recency * 1000) / (1000 * 60 * 60);
    if (hoursSinceDetection < 1) score += 20;
    else if (hoursSinceDetection < 6) score += 15;
    else if (hoursSinceDetection < 24) score += 10;

    return Math.min(100, score);
}

/**
 * 生成风险警告
 */
function generateRiskWarnings(
    trades: Array<{ wallet: KOLWallet; trade: KOLTrade }>
): string[] {
    const risks: string[] = [];

    // 检查是否有大户抛售
    const sellVolume = trades
        .filter(t => t.trade.type === 'sell')
        .reduce((sum, t) => sum + (t.trade.valueUsd || 0), 0);

    if (sellVolume > 10000) {
        risks.push('Large KOL selling activity detected');
    }

    // 检查代币年龄 (假设可以获取)
    risks.push('Always DYOR - Do Your Own Research');
    risks.push('Never invest more than you can afford to lose');

    return risks;
}

// ============================================
// 跟单策略执行
// ============================================

export interface TradeExecution {
    signalId: string;
    type: 'entry' | 'stop_loss' | 'take_profit';
    tokenMint: string;
    side: 'buy' | 'sell';
    amount: number;
    price: number;
    timestamp: number;
    status: 'pending' | 'executed' | 'failed';
    txSignature?: string;
}

/**
 * 执行智能跟单
 */
export async function executeSmartTrade(
    signal: AlphaSignal,
    config: SmartTradeConfig,
    userTier: UserTier
): Promise<TradeExecution | null> {
    // 检查信号是否有效
    if (Date.now() > signal.expiresAt) {
        console.log('Signal expired');
        return null;
    }

    // 检查用户等级延迟
    if (Date.now() < signal.detectedAt + userTier.signalDelay * 1000) {
        console.log('Signal not yet available for this tier');
        return null;
    }

    // 检查最小 KOL 数量
    if (signal.kolCount < config.minKolCount) {
        console.log('Not enough KOLs following this token');
        return null;
    }

    // 构建交易执行
    const execution: TradeExecution = {
        signalId: signal.id,
        type: 'entry',
        tokenMint: signal.tokenMint,
        side: signal.action === 'buy' ? 'buy' : 'sell',
        amount: Math.min(config.maxPositionSize, signal.totalKolVolume * 0.01),
        price: signal.currentPrice || 0,
        timestamp: Date.now(),
        status: 'pending',
    };

    if (config.autoExecute) {
        // TODO: 集成 Jupiter DEX 执行交易
        console.log('Auto-executing trade:', execution);
        execution.status = 'executed';
    }

    return execution;
}

// ============================================
// 动态 APY 计算
// ============================================

export interface DynamicApyFactors {
    baseApy: number;
    priceMultiplier: number;    // POPCOW 价格影响
    volumeMultiplier: number;   // 交易量影响
    lockMultiplier: number;     // 锁仓时间影响
    tierMultiplier: number;     // 用户等级影响
    earlyBirdBonus: number;     // 早鸟奖励
}

/**
 * 计算动态 APY
 */
export async function calculateDynamicApy(
    poolId: number,
    stakedAmount: number,
    lockDays: number,
    userTier: UserTier
): Promise<DynamicApyFactors> {
    // 获取 POPCOW 当前价格
    const prices = await getTokenPrices([POPCOW_TOKEN_MINT.toBase58()]);
    const popcowPrice = prices[POPCOW_TOKEN_MINT.toBase58()] || 0.001;

    // 基础 APY
    let baseApy = 50;
    if (poolId === 1) baseApy = 100;  // 30 天锁仓
    if (poolId === 2) baseApy = 200;  // 90 天锁仓

    // 价格乘数 (价格越低，APY 越高，鼓励抄底)
    let priceMultiplier = 1.0;
    if (popcowPrice < 0.0001) priceMultiplier = 2.0;
    else if (popcowPrice < 0.001) priceMultiplier = 1.5;
    else if (popcowPrice < 0.01) priceMultiplier = 1.2;

    // 交易量乘数 (TODO: 基于实际交易量计算)
    const volumeMultiplier = 1.0;

    // 锁仓乘数
    let lockMultiplier = 1.0;
    if (lockDays >= 90) lockMultiplier = 2.0;
    else if (lockDays >= 30) lockMultiplier = 1.5;
    else if (lockDays >= 7) lockMultiplier = 1.2;

    // 等级乘数
    let tierMultiplier = 1.0;
    if (userTier.tier === 'diamond') tierMultiplier = 1.5;
    else if (userTier.tier === 'gold') tierMultiplier = 1.3;
    else if (userTier.tier === 'silver') tierMultiplier = 1.2;
    else if (userTier.tier === 'bronze') tierMultiplier = 1.1;

    // 早鸟奖励 (假设项目上线 30 天内)
    const projectStartDate = new Date('2026-01-01').getTime();
    const daysSinceLaunch = (Date.now() - projectStartDate) / (1000 * 60 * 60 * 24);
    const earlyBirdBonus = daysSinceLaunch < 30 ? 1.5 : 1.0;

    return {
        baseApy,
        priceMultiplier,
        volumeMultiplier,
        lockMultiplier,
        tierMultiplier,
        earlyBirdBonus,
    };
}

/**
 * 获取最终 APY
 */
export function getFinalApy(factors: DynamicApyFactors): number {
    return factors.baseApy *
        factors.priceMultiplier *
        factors.volumeMultiplier *
        factors.lockMultiplier *
        factors.tierMultiplier *
        factors.earlyBirdBonus;
}

// ============================================
// 分红计算
// ============================================

export interface DividendInfo {
    totalPlatformRevenue: number;    // 平台总收入
    dividendPool: number;            // 分红池 (40%)
    userShare: number;               // 用户份额
    estimatedDividend: number;       // 预估分红
    lastDistribution: number;        // 上次分红时间
    nextDistribution: number;        // 下次分红时间
}

/**
 * 计算用户分红
 */
export function calculateUserDividend(
    userPopCowDefiBalance: number,
    totalPopCowDefiSupply: number,
    dividendPool: number
): number {
    if (totalPopCowDefiSupply === 0) return 0;

    const userShare = userPopCowDefiBalance / totalPopCowDefiSupply;
    return dividendPool * userShare;
}

// Functions are already exported inline above
