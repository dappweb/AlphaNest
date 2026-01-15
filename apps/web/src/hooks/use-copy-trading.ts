/**
 * 跟单交易相关Hooks
 * 提供跟单交易员管理、跟单设置、表现分析等功能
 */

import { useState, useCallback, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { copyTradingService, type CopyTrader, type CopyTrade, type CopySettings, type CopyPerformance } from '@/lib/copy-trading-service';

/**
 * 热门跟单交易员Hook
 */
export function useTopCopyTraders(limit: number = 20) {
  const [traders, setTraders] = useState<CopyTrader[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTraders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const topTraders = await copyTradingService.getTopCopyTraders(limit);
      setTraders(topTraders);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch top copy traders';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchTraders();
  }, [fetchTraders]);

  return {
    traders,
    isLoading,
    error,
    refresh: fetchTraders,
  };
}

/**
 * 单个跟单交易员Hook
 */
export function useCopyTrader(traderId: string) {
  const [trader, setTrader] = useState<CopyTrader | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrader = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const traderData = await copyTradingService.getCopyTrader(traderId);
      setTrader(traderData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch copy trader';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [traderId]);

  useEffect(() => {
    if (traderId) {
      fetchTrader();
    }
  }, [fetchTrader, traderId]);

  return {
    trader,
    isLoading,
    error,
    refresh: fetchTrader,
  };
}

/**
 * 跟单交易员搜索Hook
 */
export function useCopyTraderSearch() {
  const [searchResults, setSearchResults] = useState<CopyTrader[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await copyTradingService.searchCopyTraders(searchQuery, 10);
      setSearchResults(results);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      search(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, search]);

  return {
    searchResults,
    isLoading,
    error,
    query,
    setQuery,
    search,
  };
}

/**
 * 跟单设置Hook
 */
export function useCopySettings() {
  const { address } = useAccount();
  const [settings, setSettings] = useState<CopySettings[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      const userSettings = await copyTradingService.getUserCopySettings(address);
      setSettings(userSettings);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch copy settings';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const startCopyTrading = useCallback(async (
    traderId: string,
    copySettings: Omit<CopySettings, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!address) {
      return {
        success: false,
        error: 'Wallet not connected'
      };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await copyTradingService.startCopyTrading({
        ...copySettings,
        userAddress: address,
        traderId
      });

      if (!result.success) {
        setError(result.error || 'Failed to start copy trading');
      } else {
        // 重新获取设置
        await fetchSettings();
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [address, fetchSettings]);

  const stopCopyTrading = useCallback(async (settingsId: string) => {
    if (!address) {
      return {
        success: false,
        error: 'Wallet not connected'
      };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await copyTradingService.stopCopyTrading(settingsId, address);
      
      if (!result.success) {
        setError(result.error || 'Failed to stop copy trading');
      } else {
        // 重新获取设置
        await fetchSettings();
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [address, fetchSettings]);

  const updateSettings = useCallback(async (settingsId: string, updates: Partial<CopySettings>) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await copyTradingService.updateCopySettings(settingsId, updates);
      
      if (!result.success) {
        setError(result.error || 'Failed to update copy settings');
      } else {
        // 重新获取设置
        await fetchSettings();
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [fetchSettings]);

  return {
    settings,
    isLoading,
    error,
    startCopyTrading,
    stopCopyTrading,
    updateSettings,
    refresh: fetchSettings,
  };
}

/**
 * 跟单交易历史Hook
 */
export function useCopyTrades(traderId?: string, userAddress?: string, limit: number = 50) {
  const [trades, setTrades] = useState<CopyTrade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrades = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const copyTrades = await copyTradingService.getCopyTrades(traderId, userAddress, limit);
      setTrades(copyTrades);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch copy trades';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [traderId, userAddress, limit]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  return {
    trades,
    isLoading,
    error,
    refresh: fetchTrades,
  };
}

/**
 * 跟单表现Hook
 */
export function useCopyPerformance(traderId: string, period: 'daily' | 'weekly' | 'monthly' = 'monthly') {
  const { address } = useAccount();
  const [performance, setPerformance] = useState<CopyPerformance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformance = useCallback(async () => {
    if (!traderId || !address) return;

    setIsLoading(true);
    setError(null);

    try {
      const copyPerformance = await copyTradingService.getCopyPerformance(traderId, address, period);
      setPerformance(copyPerformance);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch copy performance';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [traderId, address, period]);

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  return {
    performance,
    isLoading,
    error,
    refresh: fetchPerformance,
  };
}

/**
 * 跟单统计Hook
 */
export function useCopyTradingStats() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const copyStats = await copyTradingService.getCopyTradingStats();
      setStats(copyStats);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch copy trading stats';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refresh: fetchStats,
  };
}

/**
 * 推荐交易员Hook
 */
export function useRecommendedTraders(limit: number = 5) {
  const { address } = useAccount();
  const [traders, setTraders] = useState<CopyTrader[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommended = useCallback(async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      const recommended = await copyTradingService.getRecommendedTraders(address, limit);
      setTraders(recommended);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch recommended traders';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [address, limit]);

  useEffect(() => {
    fetchRecommended();
  }, [fetchRecommended]);

  return {
    traders,
    isLoading,
    error,
    refresh: fetchRecommended,
  };
}

/**
 * 交易员排名Hook
 */
export function useTraderRanking(period: 'daily' | 'weekly' | 'monthly' = 'monthly', limit: number = 50) {
  const [ranking, setRanking] = useState<CopyTrader[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRanking = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const traderRanking = await copyTradingService.getTraderRanking(period, limit);
      setRanking(traderRanking);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch trader ranking';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [period, limit]);

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  return {
    ranking,
    isLoading,
    error,
    refresh: fetchRanking,
  };
}

/**
 * 跟单模拟Hook
 */
export function useCopyTradingSimulation() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const simulateTrade = useCallback(async (
    traderId: string,
    originalTrade: {
      tokenAddress: string;
      amount: number;
      type: 'buy' | 'sell';
    },
    copyRatio: number
  ) => {
    setIsSimulating(true);
    setError(null);

    try {
      const result = await copyTradingService.simulateCopyTrade(traderId, originalTrade, copyRatio);
      
      if (!result.success) {
        setError(result.error || 'Simulation failed');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Simulation failed';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsSimulating(false);
    }
  }, []);

  return {
    isSimulating,
    error,
    simulateTrade,
    clearError: () => setError(null),
  };
}

/**
 * 跟单费用计算Hook
 */
export function useCopyTradingFees() {
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateFees = useCallback((
    tradeAmount: number,
    copyRatio: number,
    platformFeeRate?: number,
    traderFeeRate?: number
  ) => {
    setCalculating(true);
    setError(null);

    try {
      const result = copyTradingService.calculateCopyFees(
        tradeAmount,
        copyRatio,
        platformFeeRate,
        traderFeeRate
      );
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fee calculation failed';
      setError(errorMessage);
      return {
        platformFee: 0,
        traderFee: 0,
        totalFee: 0,
        netAmount: 0
      };
    } finally {
      setCalculating(false);
    }
  }, []);

  const validateSettings = useCallback((settings: Omit<CopySettings, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const result = copyTradingService.validateCopySettings(settings);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      setError(errorMessage);
      return {
        isValid: false,
        errors: [errorMessage],
        warnings: []
      };
    }
  }, []);

  return {
    calculateFees,
    validateSettings,
    calculating,
    error,
    clearError: () => setError(null),
  };
}

/**
 * 交易员验证状态Hook
 */
export function useTraderVerification(traderId: string) {
  const [verification, setVerification] = useState<{
    isVerified: boolean;
    verificationLevel: 'basic' | 'advanced' | 'pro';
    verificationDate?: number;
    verifiedBy?: string;
    documents?: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVerification = useCallback(async () => {
    if (!traderId) return;

    setIsLoading(true);
    setError(null);

    try {
      const verificationStatus = await copyTradingService.getTraderVerificationStatus(traderId);
      setVerification(verificationStatus);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch verification status';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [traderId]);

  useEffect(() => {
    fetchVerification();
  }, [fetchVerification]);

  return {
    verification,
    isLoading,
    error,
    refresh: fetchVerification,
  };
}
