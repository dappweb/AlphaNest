/**
 * 交易相关Hooks
 * 提供买卖交易、交易历史、价格计算等功能
 */

import { useState, useCallback, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { tradingService, type TradeParams, type TradeResult, type TransactionHistory } from '@/lib/trading-service';
import { useRealtimeTransaction } from './use-realtime-data';

/**
 * 买卖交易Hook
 */
export function useTrading() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTrade, setLastTrade] = useState<TradeResult | null>(null);

  // 买入
  const buy = useCallback(async (params: TradeParams): Promise<TradeResult> => {
    if (!address) {
      return {
        success: false,
        error: 'Wallet not connected'
      };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await tradingService.buy(params, address);
      setLastTrade(result);
      
      if (!result.success) {
        setError(result.error || 'Trade failed');
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
  }, [address]);

  // 卖出
  const sell = useCallback(async (params: TradeParams): Promise<TradeResult> => {
    if (!address) {
      return {
        success: false,
        error: 'Wallet not connected'
      };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await tradingService.sell(params, address);
      setLastTrade(result);
      
      if (!result.success) {
        setError(result.error || 'Trade failed');
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
  }, [address]);

  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    buy,
    sell,
    isLoading,
    error,
    lastTrade,
    clearError,
  };
}

/**
 * 交易历史Hook
 */
export function useTransactionHistory(limit: number = 50) {
  const { address } = useAccount();
  const [transactions, setTransactions] = useState<TransactionHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      const history = await tradingService.getTransactionHistory(address, limit);
      setTransactions(history);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch transaction history';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [address, limit]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // 刷新交易历史
  const refresh = useCallback(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    isLoading,
    error,
    refresh,
  };
}

/**
 * 交易详情Hook
 */
export function useTransactionDetails(transactionHash: string) {
  const [transaction, setTransaction] = useState<TransactionHistory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 实时更新交易状态
  const { transaction: realtimeTransaction } = useRealtimeTransaction(transactionHash);

  const fetchTransactionDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const details = await tradingService.getTransactionDetails(transactionHash);
      setTransaction(details);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch transaction details';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [transactionHash]);

  useEffect(() => {
    fetchTransactionDetails();
  }, [fetchTransactionDetails]);

  // 优先使用实时数据
  const currentTransaction = realtimeTransaction || transaction;

  return {
    transaction: currentTransaction,
    isLoading,
    error,
    refresh: fetchTransactionDetails,
  };
}

/**
 * 价格计算Hook
 */
export function usePriceCalculation() {
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculatePrice = useCallback(async (
    tokenAddress: string,
    chain: string,
    amount: number,
    amountType: 'base' | 'quote' = 'base'
  ) => {
    setCalculating(true);
    setError(null);

    try {
      const priceInfo = await tradingService.getBestPrice(tokenAddress, chain, amount, amountType);
      
      if (!priceInfo) {
        throw new Error('Failed to calculate price');
      }

      return priceInfo;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Price calculation failed';
      setError(errorMessage);
      throw error;
    } finally {
      setCalculating(false);
    }
  }, []);

  const simulateTrade = useCallback(async (params: TradeParams) => {
    setCalculating(true);
    setError(null);

    try {
      const simulation = await tradingService.simulateTrade(params);
      
      if (!simulation) {
        throw new Error('Failed to simulate trade');
      }

      return simulation;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Trade simulation failed';
      setError(errorMessage);
      throw error;
    } finally {
      setCalculating(false);
    }
  }, []);

  return {
    calculatePrice,
    simulateTrade,
    calculating,
    error,
    clearError: () => setError(null),
  };
}

/**
 * 支持的代币Hook
 */
export function useSupportedTokens(chain?: string) {
  const [tokens, setTokens] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTokens = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supportedTokens = await tradingService.getSupportedTokens(chain);
      setTokens(supportedTokens);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch supported tokens';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [chain]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  return {
    tokens,
    isLoading,
    error,
    refresh: fetchTokens,
  };
}

/**
 * 流动性信息Hook
 */
export function useLiquidityInfo(token0: string, token1: string, chain: string) {
  const [liquidityInfo, setLiquidityInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLiquidityInfo = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const info = await tradingService.getLiquidityInfo(token0, token1, chain);
      setLiquidityInfo(info);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch liquidity info';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [token0, token1, chain]);

  useEffect(() => {
    if (token0 && token1 && chain) {
      fetchLiquidityInfo();
    }
  }, [fetchLiquidityInfo]);

  return {
    liquidityInfo,
    isLoading,
    error,
    refresh: fetchLiquidityInfo,
  };
}

/**
 * 交易对信息Hook
 */
export function usePairInfo(token0: string, token1: string, chain: string) {
  const [pairInfo, setPairInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPairInfo = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const info = await tradingService.getPairInfo(token0, token1, chain);
      setPairInfo(info);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch pair info';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [token0, token1, chain]);

  useEffect(() => {
    if (token0 && token1 && chain) {
      fetchPairInfo();
    }
  }, [fetchPairInfo]);

  return {
    pairInfo,
    isLoading,
    error,
    refresh: fetchPairInfo,
  };
}

/**
 * 交易设置Hook
 */
export function useTradingSettings() {
  const [slippage, setSlippage] = useState(1); // 默认1%滑点
  const [deadline, setDeadline] = useState(300); // 默认5分钟
  const [autoRouter, setAutoRouter] = useState(true);

  // 从localStorage加载设置
  useEffect(() => {
    try {
      const saved = localStorage.getItem('trading-settings');
      if (saved) {
        const settings = JSON.parse(saved);
        setSlippage(settings.slippage || 1);
        setDeadline(settings.deadline || 300);
        setAutoRouter(settings.autoRouter !== false);
      }
    } catch (error) {
      console.error('Error loading trading settings:', error);
    }
  }, []);

  // 保存设置到localStorage
  const saveSettings = useCallback(() => {
    try {
      const settings = {
        slippage,
        deadline,
        autoRouter
      };
      localStorage.setItem('trading-settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving trading settings:', error);
    }
  }, [slippage, deadline, autoRouter]);

  // 更新设置并保存
  const updateSlippage = useCallback((newSlippage: number) => {
    setSlippage(newSlippage);
    saveSettings();
  }, [saveSettings]);

  const updateDeadline = useCallback((newDeadline: number) => {
    setDeadline(newDeadline);
    saveSettings();
  }, [saveSettings]);

  const updateAutoRouter = useCallback((newAutoRouter: boolean) => {
    setAutoRouter(newAutoRouter);
    saveSettings();
  }, [saveSettings]);

  return {
    slippage,
    deadline,
    autoRouter,
    updateSlippage,
    updateDeadline,
    updateAutoRouter,
    saveSettings,
  };
}
