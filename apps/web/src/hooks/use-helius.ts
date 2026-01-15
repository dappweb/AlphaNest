/**
 * Helius 数据 React Hooks
 * 用于在组件中获取链上数据
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    getAsset,
    getAssetsByOwner,
    getTransactionsForAddress,
    HeliusAsset,
    HeliusTransaction,
    isHeliusConfigured,
} from '@/lib/helius/client';
import {
    getTokenPrice,
    getTokenPrices,
    getMainstreamTokenPrices,
    KNOWN_TOKENS,
} from '@/lib/helius/price';
import {
    getKOLHoldings,
    getKOLTrades,
    getKOLStats,
    getAllKOLWallets,
    getAllKOLRecentTrades,
    findCommonHoldings,
    KOLWallet,
    KOLHolding,
    KOLTrade,
    KOLStats,
} from '@/lib/helius/kol-tracker';

// ============================================
// 钱包资产 Hook
// ============================================

export interface WalletAssets {
    tokens: HeliusAsset[];
    nativeBalance: number;
    totalValueUsd: number;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useWalletAssets(walletAddress: string | null): WalletAssets {
    const [tokens, setTokens] = useState<HeliusAsset[]>([]);
    const [nativeBalance, setNativeBalance] = useState(0);
    const [totalValueUsd, setTotalValueUsd] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAssets = useCallback(async () => {
        if (!walletAddress || !isHeliusConfigured()) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await getAssetsByOwner({
                ownerAddress: walletAddress,
                displayOptions: {
                    showFungible: true,
                    showNativeBalance: true,
                },
            });

            setTokens(result.items);

            if (result.nativeBalance) {
                setNativeBalance(result.nativeBalance.lamports / 1e9);
                setTotalValueUsd(result.nativeBalance.total_price || 0);
            }

            // 计算总价值
            const tokenValue = result.items.reduce((sum, asset) => {
                return sum + (asset.token_info?.price_info?.total_price || 0);
            }, 0);

            setTotalValueUsd((prev) => prev + tokenValue);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch assets');
        } finally {
            setLoading(false);
        }
    }, [walletAddress]);

    useEffect(() => {
        fetchAssets();
    }, [fetchAssets]);

    return {
        tokens,
        nativeBalance,
        totalValueUsd,
        loading,
        error,
        refetch: fetchAssets,
    };
}

// ============================================
// 代币详情 Hook
// ============================================

export interface TokenDetails {
    asset: HeliusAsset | null;
    price: number | null;
    loading: boolean;
    error: string | null;
}

export function useTokenDetails(mintAddress: string | null): TokenDetails {
    const [asset, setAsset] = useState<HeliusAsset | null>(null);
    const [price, setPrice] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!mintAddress || !isHeliusConfigured()) {
            return;
        }

        const fetchDetails = async () => {
            setLoading(true);
            setError(null);

            try {
                const [assetData, priceData] = await Promise.all([
                    getAsset(mintAddress),
                    getTokenPrice(mintAddress),
                ]);

                setAsset(assetData);
                setPrice(priceData);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch token details');
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [mintAddress]);

    return { asset, price, loading, error };
}

// ============================================
// 交易历史 Hook
// ============================================

export interface TransactionHistory {
    transactions: HeliusTransaction[];
    loading: boolean;
    error: string | null;
    hasMore: boolean;
    loadMore: () => Promise<void>;
    refetch: () => Promise<void>;
}

export function useTransactionHistory(
    address: string | null,
    limit = 20
): TransactionHistory {
    const [transactions, setTransactions] = useState<HeliusTransaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);

    const fetchTransactions = useCallback(
        async (before?: string) => {
            if (!address || !isHeliusConfigured()) {
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const result = await getTransactionsForAddress(address, {
                    limit,
                    before,
                });

                if (before) {
                    setTransactions((prev) => [...prev, ...result]);
                } else {
                    setTransactions(result);
                }

                setHasMore(result.length === limit);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
            } finally {
                setLoading(false);
            }
        },
        [address, limit]
    );

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const loadMore = useCallback(async () => {
        if (transactions.length > 0 && hasMore) {
            const lastTx = transactions[transactions.length - 1];
            await fetchTransactions(lastTx.signature);
        }
    }, [transactions, hasMore, fetchTransactions]);

    const refetch = useCallback(async () => {
        await fetchTransactions();
    }, [fetchTransactions]);

    return { transactions, loading, error, hasMore, loadMore, refetch };
}

// ============================================
// 代币价格 Hook
// ============================================

export interface TokenPrices {
    prices: Record<string, number>;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useTokenPrices(mintAddresses: string[]): TokenPrices {
    const [prices, setPrices] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const addresses = useMemo(() => mintAddresses.join(','), [mintAddresses]);

    const fetchPrices = useCallback(async () => {
        if (mintAddresses.length === 0) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await getTokenPrices(mintAddresses);
            setPrices(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch prices');
        } finally {
            setLoading(false);
        }
    }, [addresses]);

    useEffect(() => {
        fetchPrices();

        // 每 30 秒刷新价格
        const interval = setInterval(fetchPrices, 30000);
        return () => clearInterval(interval);
    }, [fetchPrices]);

    return { prices, loading, error, refetch: fetchPrices };
}

export function useMainstreamPrices(): TokenPrices {
    const addresses = useMemo(() => Object.values(KNOWN_TOKENS), []);
    return useTokenPrices(addresses);
}

// ============================================
// KOL 追踪 Hooks
// ============================================

export interface KOLData {
    wallets: KOLWallet[];
    recentTrades: Array<{ wallet: KOLWallet; trade: KOLTrade }>;
    commonHoldings: Array<{
        mint: string;
        symbol: string;
        holdersCount: number;
        holders: string[];
    }>;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useKOLData(): KOLData {
    const [wallets, setWallets] = useState<KOLWallet[]>([]);
    const [recentTrades, setRecentTrades] = useState<
        Array<{ wallet: KOLWallet; trade: KOLTrade }>
    >([]);
    const [commonHoldings, setCommonHoldings] = useState<
        Array<{ mint: string; symbol: string; holdersCount: number; holders: string[] }>
    >([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!isHeliusConfigured()) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            setWallets(getAllKOLWallets());

            const [trades, holdings] = await Promise.all([
                getAllKOLRecentTrades(20),
                findCommonHoldings(),
            ]);

            setRecentTrades(trades);
            setCommonHoldings(holdings);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch KOL data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();

        // 每 2 分钟刷新
        const interval = setInterval(fetchData, 120000);
        return () => clearInterval(interval);
    }, [fetchData]);

    return { wallets, recentTrades, commonHoldings, loading, error, refetch: fetchData };
}

export interface SingleKOLData {
    wallet: KOLWallet | null;
    holdings: KOLHolding[];
    trades: KOLTrade[];
    stats: KOLStats | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useKOLWallet(walletAddress: string | null): SingleKOLData {
    const [wallet, setWallet] = useState<KOLWallet | null>(null);
    const [holdings, setHoldings] = useState<KOLHolding[]>([]);
    const [trades, setTrades] = useState<KOLTrade[]>([]);
    const [stats, setStats] = useState<KOLStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!walletAddress || !isHeliusConfigured()) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 查找 KOL 信息
            const kolWallet = getAllKOLWallets().find(
                (w) => w.address === walletAddress
            );
            setWallet(kolWallet || null);

            // 并行获取数据
            const [holdingsData, tradesData, statsData] = await Promise.all([
                getKOLHoldings(walletAddress),
                getKOLTrades(walletAddress, 50),
                getKOLStats(walletAddress),
            ]);

            setHoldings(holdingsData);
            setTrades(tradesData);
            setStats(statsData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch KOL data');
        } finally {
            setLoading(false);
        }
    }, [walletAddress]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { wallet, holdings, trades, stats, loading, error, refetch: fetchData };
}
