/**
 * KOL 钱包追踪服务
 * 追踪知名交易者的钱包活动
 */

import {
    getAssetsByOwner,
    getTransactionsForAddress,
    HeliusAsset,
    HeliusTransaction,
} from './client';
import { getTokenPrices, formatPrice, formatMarketCap } from './price';

// ============================================
// 类型定义
// ============================================

export interface KOLWallet {
    address: string;
    label: string;
    tags: string[];
    description?: string;
    twitter?: string;
    addedAt: number;
}

export interface KOLHolding {
    mint: string;
    symbol: string;
    name: string;
    balance: number;
    decimals: number;
    priceUsd: number | null;
    valueUsd: number | null;
    logo?: string;
}

export interface KOLTrade {
    signature: string;
    timestamp: number;
    type: 'buy' | 'sell' | 'transfer' | 'swap' | 'unknown';
    tokenMint: string;
    tokenSymbol: string;
    tokenAmount: number;
    priceUsd?: number;
    valueUsd?: number;
    counterparty?: string;
    description: string;
}

export interface KOLStats {
    totalTrades: number;
    buyTrades: number;
    sellTrades: number;
    totalValue: number;
    recentTokens: string[];
}

// ============================================
// 预设 KOL 钱包列表 (可以后续扩展)
// ============================================

export const DEFAULT_KOL_WALLETS: KOLWallet[] = [
    {
        address: '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
        label: 'Raydium Treasury',
        tags: ['protocol', 'treasury', 'whale'],
        description: 'Raydium Protocol Treasury',
        addedAt: Date.now(),
    },
    {
        address: 'ANULrLMRVxxHqEWYVqD92pKyqGLH4hwGTHqSqKjLRQq6',
        label: 'Alameda Research',
        tags: ['whale', 'historical'],
        description: 'Historical Alameda wallet',
        addedAt: Date.now(),
    },
    {
        address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        label: 'Binance Hot Wallet',
        tags: ['exchange', 'whale'],
        description: 'Binance Exchange Hot Wallet',
        addedAt: Date.now(),
    },
];

// 本地存储的自定义 KOL 列表
let customKOLWallets: KOLWallet[] = [];

// ============================================
// KOL 管理功能
// ============================================

/**
 * 获取所有 KOL 钱包列表
 */
export function getAllKOLWallets(): KOLWallet[] {
    return [...DEFAULT_KOL_WALLETS, ...customKOLWallets];
}

/**
 * 添加自定义 KOL 钱包
 */
export function addKOLWallet(wallet: Omit<KOLWallet, 'addedAt'>): void {
    customKOLWallets.push({
        ...wallet,
        addedAt: Date.now(),
    });
}

/**
 * 移除自定义 KOL 钱包
 */
export function removeKOLWallet(address: string): void {
    customKOLWallets = customKOLWallets.filter((w) => w.address !== address);
}

/**
 * 检查地址是否是 KOL
 */
export function isKOLWallet(address: string): boolean {
    return getAllKOLWallets().some((w) => w.address === address);
}

/**
 * 获取 KOL 信息
 */
export function getKOLInfo(address: string): KOLWallet | undefined {
    return getAllKOLWallets().find((w) => w.address === address);
}

// ============================================
// 数据获取功能
// ============================================

/**
 * 获取 KOL 钱包的持仓
 */
export async function getKOLHoldings(walletAddress: string): Promise<KOLHolding[]> {
    try {
        const result = await getAssetsByOwner({
            ownerAddress: walletAddress,
            displayOptions: {
                showFungible: true,
                showNativeBalance: true,
            },
        });

        // 过滤出 fungible tokens
        const fungibleAssets = result.items.filter(
            (asset) => asset.interface === 'FungibleToken' || asset.interface === 'FungibleAsset'
        );

        // 获取价格
        const mintAddresses = fungibleAssets
            .map((asset) => asset.id)
            .filter((id) => id);

        const prices = await getTokenPrices(mintAddresses);

        // 转换为 KOLHolding 格式
        const holdings: KOLHolding[] = fungibleAssets.map((asset) => {
            const balance = asset.token_info?.balance || 0;
            const decimals = asset.token_info?.decimals || 0;
            const actualBalance = balance / Math.pow(10, decimals);
            const priceUsd = prices[asset.id] || asset.token_info?.price_info?.price_per_token || null;
            const valueUsd = priceUsd ? actualBalance * priceUsd : null;

            return {
                mint: asset.id,
                symbol: asset.content?.metadata?.symbol || asset.token_info?.symbol || 'Unknown',
                name: asset.content?.metadata?.name || 'Unknown Token',
                balance: actualBalance,
                decimals,
                priceUsd,
                valueUsd,
                logo: asset.content?.links?.image || asset.content?.files?.[0]?.uri,
            };
        });

        // 按价值排序
        return holdings.sort((a, b) => (b.valueUsd || 0) - (a.valueUsd || 0));
    } catch (error) {
        console.error('Error fetching KOL holdings:', error);
        return [];
    }
}

/**
 * 获取 KOL 的最近交易
 */
export async function getKOLTrades(
    walletAddress: string,
    limit = 50
): Promise<KOLTrade[]> {
    try {
        const transactions = await getTransactionsForAddress(walletAddress, { limit });

        const trades: KOLTrade[] = [];

        for (const tx of transactions) {
            // 解析 token transfers
            if (tx.tokenTransfers && tx.tokenTransfers.length > 0) {
                for (const transfer of tx.tokenTransfers) {
                    const isBuy = transfer.toUserAccount === walletAddress;
                    const isSell = transfer.fromUserAccount === walletAddress;

                    if (isBuy || isSell) {
                        trades.push({
                            signature: tx.signature,
                            timestamp: tx.timestamp,
                            type: isBuy ? 'buy' : 'sell',
                            tokenMint: transfer.mint,
                            tokenSymbol: '', // 需要额外查询
                            tokenAmount: transfer.tokenAmount,
                            description: tx.description || `${isBuy ? 'Bought' : 'Sold'} tokens`,
                            counterparty: isBuy ? transfer.fromUserAccount : transfer.toUserAccount,
                        });
                    }
                }
            }

            // 解析 swap 事件
            if (tx.events?.swap) {
                const swap = tx.events.swap;
                trades.push({
                    signature: tx.signature,
                    timestamp: tx.timestamp,
                    type: 'swap',
                    tokenMint: swap.tokenOutputMint || '',
                    tokenSymbol: '',
                    tokenAmount: swap.tokenOutputAmount || 0,
                    description: tx.description || 'Token swap',
                });
            }
        }

        return trades;
    } catch (error) {
        console.error('Error fetching KOL trades:', error);
        return [];
    }
}

/**
 * 获取 KOL 的统计信息
 */
export async function getKOLStats(walletAddress: string): Promise<KOLStats> {
    try {
        const trades = await getKOLTrades(walletAddress, 100);
        const holdings = await getKOLHoldings(walletAddress);

        const buyTrades = trades.filter((t) => t.type === 'buy').length;
        const sellTrades = trades.filter((t) => t.type === 'sell').length;
        const totalValue = holdings.reduce((sum, h) => sum + (h.valueUsd || 0), 0);

        // 获取最近交易的代币
        const recentTokens = [...new Set(trades.slice(0, 10).map((t) => t.tokenMint))];

        return {
            totalTrades: trades.length,
            buyTrades,
            sellTrades,
            totalValue,
            recentTokens,
        };
    } catch (error) {
        console.error('Error fetching KOL stats:', error);
        return {
            totalTrades: 0,
            buyTrades: 0,
            sellTrades: 0,
            totalValue: 0,
            recentTokens: [],
        };
    }
}

/**
 * 获取所有 KOL 的最新交易动态
 */
export async function getAllKOLRecentTrades(limit = 20): Promise<
    Array<{
        wallet: KOLWallet;
        trade: KOLTrade;
    }>
> {
    const wallets = getAllKOLWallets();
    const allTrades: Array<{ wallet: KOLWallet; trade: KOLTrade }> = [];

    // 并行获取所有 KOL 的交易
    const results = await Promise.allSettled(
        wallets.map(async (wallet) => {
            const trades = await getKOLTrades(wallet.address, 5);
            return trades.map((trade) => ({ wallet, trade }));
        })
    );

    for (const result of results) {
        if (result.status === 'fulfilled') {
            allTrades.push(...result.value);
        }
    }

    // 按时间排序，返回最新的
    return allTrades
        .sort((a, b) => b.trade.timestamp - a.trade.timestamp)
        .slice(0, limit);
}

/**
 * 查找多个 KOL 共同持有的代币 (潜在热门代币)
 */
export async function findCommonHoldings(): Promise<
    Array<{
        mint: string;
        symbol: string;
        holdersCount: number;
        holders: string[];
    }>
> {
    const wallets = getAllKOLWallets();
    const holdingsMap = new Map<string, { symbol: string; holders: string[] }>();

    // 获取所有 KOL 的持仓
    const results = await Promise.allSettled(
        wallets.map(async (wallet) => {
            const holdings = await getKOLHoldings(wallet.address);
            return { wallet, holdings };
        })
    );

    for (const result of results) {
        if (result.status === 'fulfilled') {
            const { wallet, holdings } = result.value;
            for (const holding of holdings) {
                if (!holdingsMap.has(holding.mint)) {
                    holdingsMap.set(holding.mint, {
                        symbol: holding.symbol,
                        holders: [],
                    });
                }
                holdingsMap.get(holding.mint)!.holders.push(wallet.address);
            }
        }
    }

    // 转换并按持有人数排序
    const commonHoldings = Array.from(holdingsMap.entries())
        .map(([mint, data]) => ({
            mint,
            symbol: data.symbol,
            holdersCount: data.holders.length,
            holders: data.holders,
        }))
        .filter((h) => h.holdersCount > 1) // 至少 2 个 KOL 持有
        .sort((a, b) => b.holdersCount - a.holdersCount);

    return commonHoldings;
}
