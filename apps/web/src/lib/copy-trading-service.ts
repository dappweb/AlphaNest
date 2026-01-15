/**
 * 跟单交易服务
 * 负责跟单交易的管理、执行、排名等功能
 */

export interface CopyTrader {
  id: string;
  address: string;
  alias: string;
  avatar?: string;
  bio?: string;
  stats: {
    totalTrades: number;
    winRate: number;
    totalVolume: number;
    avgReturn: number;
    followers: number;
    copiedTrades: number;
    successRate: number;
    riskScore: number;
  };
  performance: {
    dailyReturn: number;
    weeklyReturn: number;
    monthlyReturn: number;
    yearlyReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
  };
  preferences: {
    minTradeAmount: number;
    maxTradeAmount: number;
    riskLevel: 'low' | 'medium' | 'high';
    copyRatio: number; // 跟单比例，0.1-1.0
    stopLoss: number; // 止损比例，0-1
    takeProfit: number; // 止盈比例，0-1
  };
  isActive: boolean;
  isVerified: boolean;
  tags: string[];
  joinedAt: number;
  lastActiveAt: number;
}

export interface CopyTrade {
  id: string;
  traderId: string;
  originalTxHash: string;
  copyTxHash?: string;
  type: 'buy' | 'sell';
  token: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  amountIn: number;
  amountOut: number;
  price: number;
  copyRatio: number;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled';
  gasUsed?: number;
  gasPrice?: number;
  timestamp: number;
  executedAt?: number;
  error?: string;
}

export interface CopySettings {
  traderId: string;
  userAddress: string;
  isActive: boolean;
  copyRatio: number;
  maxAmount: number;
  minAmount: number;
  stopLoss: number;
  takeProfit: number;
  autoExecute: boolean;
  onlyVerified: boolean;
  maxDailyTrades: number;
  maxDailyVolume: number;
  blacklistTokens: string[];
  createdAt: number;
  updatedAt: number;
}

export interface CopyPerformance {
  traderId: string;
  userAddress: string;
  period: 'daily' | 'weekly' | 'monthly';
  totalTrades: number;
  successfulTrades: number;
  totalVolume: number;
  totalProfit: number;
  totalFees: number;
  netProfit: number;
  roi: number;
  winRate: number;
  avgTradeSize: number;
  sharpeRatio: number;
  maxDrawdown: number;
  startDate: number;
  endDate: number;
}

class CopyTradingService {
  private API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alphanest-api.dappweb.workers.dev';

  /**
   * 获取热门跟单交易员
   */
  async getTopCopyTraders(limit: number = 20): Promise<CopyTrader[]> {
    try {
      const response = await fetch(`${this.API_URL}/api/v1/copy-trading/top-traders?limit=${limit}`);
      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error fetching top copy traders:', error);
      return [];
    }
  }

  /**
   * 获取跟单交易员详情
   */
  async getCopyTrader(traderId: string): Promise<CopyTrader | null> {
    try {
      const response = await fetch(`${this.API_URL}/api/v1/copy-trading/traders/${traderId}`);
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error fetching copy trader:', error);
      return null;
    }
  }

  /**
   * 搜索跟单交易员
   */
  async searchCopyTraders(query: string, limit: number = 10): Promise<CopyTrader[]> {
    try {
      const response = await fetch(`${this.API_URL}/api/v1/copy-trading/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error searching copy traders:', error);
      return [];
    }
  }

  /**
   * 开始跟单
   */
  async startCopyTrading(settings: Omit<CopySettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<{
    success: boolean;
    settingsId?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.API_URL}/api/v1/copy-trading/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...settings,
          createdAt: Date.now(),
          updatedAt: Date.now()
        })
      });

      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          settingsId: result.data.settingsId
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to start copy trading'
        };
      }
    } catch (error) {
      console.error('Error starting copy trading:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 停止跟单
   */
  async stopCopyTrading(settingsId: string, userAddress: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.API_URL}/api/v1/copy-trading/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settingsId,
          userAddress
        })
      });

      const result = await response.json();
      
      if (result.success) {
        return { success: true };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to stop copy trading'
        };
      }
    } catch (error) {
      console.error('Error stopping copy trading:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 更新跟单设置
   */
  async updateCopySettings(settingsId: string, updates: Partial<CopySettings>): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.API_URL}/api/v1/copy-trading/settings/${settingsId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updates,
          updatedAt: Date.now()
        })
      });

      const result = await response.json();
      
      if (result.success) {
        return { success: true };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to update copy settings'
        };
      }
    } catch (error) {
      console.error('Error updating copy settings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 获取用户的跟单设置
   */
  async getUserCopySettings(userAddress: string): Promise<CopySettings[]> {
    try {
      const response = await fetch(`${this.API_URL}/api/v1/copy-trading/settings/${userAddress}`);
      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error fetching user copy settings:', error);
      return [];
    }
  }

  /**
   * 获取跟单交易历史
   */
  async getCopyTrades(traderId?: string, userAddress?: string, limit: number = 50): Promise<CopyTrade[]> {
    try {
      let url = `${this.API_URL}/api/v1/copy-trading/trades?limit=${limit}`;
      
      if (traderId) {
        url += `&traderId=${traderId}`;
      }
      if (userAddress) {
        url += `&userAddress=${userAddress}`;
      }

      const response = await fetch(url);
      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error fetching copy trades:', error);
      return [];
    }
  }

  /**
   * 获取跟单表现
   */
  async getCopyPerformance(
    traderId: string,
    userAddress: string,
    period: 'daily' | 'weekly' | 'monthly' = 'monthly'
  ): Promise<CopyPerformance | null> {
    try {
      const response = await fetch(
        `${this.API_URL}/api/v1/copy-trading/performance?traderId=${traderId}&userAddress=${userAddress}&period=${period}`
      );
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error fetching copy performance:', error);
      return null;
    }
  }

  /**
   * 计算跟单费用
   */
  calculateCopyFees(
    tradeAmount: number,
    copyRatio: number,
    platformFeeRate: number = 0.001, // 0.1% 平台费用
    traderFeeRate: number = 0.02 // 2% 交易员费用
  ): {
    platformFee: number;
    traderFee: number;
    totalFee: number;
    netAmount: number;
  } {
    const platformFee = tradeAmount * platformFeeRate;
    const traderFee = tradeAmount * traderFeeRate;
    const totalFee = platformFee + traderFee;
    const netAmount = tradeAmount - totalFee;

    return {
      platformFee,
      traderFee,
      totalFee,
      netAmount
    };
  }

  /**
   * 验证跟单设置
   */
  validateCopySettings(settings: Omit<CopySettings, 'id' | 'createdAt' | 'updatedAt'>): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 验证跟单比例
    if (settings.copyRatio < 0.1 || settings.copyRatio > 1) {
      errors.push('Copy ratio must be between 0.1 and 1.0');
    }

    // 验证交易金额
    if (settings.minAmount < 0) {
      errors.push('Minimum trade amount must be positive');
    }
    if (settings.maxAmount <= settings.minAmount) {
      errors.push('Maximum trade amount must be greater than minimum amount');
    }

    // 验证止损止盈
    if (settings.stopLoss < 0 || settings.stopLoss > 1) {
      errors.push('Stop loss must be between 0 and 1');
    }
    if (settings.takeProfit < 0 || settings.takeProfit > 1) {
      errors.push('Take profit must be between 0 and 1');
    }

    // 验证日限制
    if (settings.maxDailyTrades < 1) {
      warnings.push('Daily trade limit is very low');
    }
    if (settings.maxDailyVolume < 0) {
      errors.push('Daily volume limit must be positive');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 获取跟单统计
   */
  async getCopyTradingStats(): Promise<{
    totalTraders: number;
    activeTraders: number;
    totalCopies: number;
    totalVolume: number;
    avgROI: number;
    topPerformers: CopyTrader[];
  } | null> {
    try {
      const response = await fetch(`${this.API_URL}/api/v1/copy-trading/stats`);
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error fetching copy trading stats:', error);
      return null;
    }
  }

  /**
   * 获取推荐交易员
   */
  async getRecommendedTraders(userAddress: string, limit: number = 5): Promise<CopyTrader[]> {
    try {
      const response = await fetch(`${this.API_URL}/api/v1/copy-trading/recommendations?userAddress=${userAddress}&limit=${limit}`);
      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error fetching recommended traders:', error);
      return [];
    }
  }

  /**
   * 模拟跟单交易
   */
  async simulateCopyTrade(
    traderId: string,
    originalTrade: {
      tokenAddress: string;
      amount: number;
      type: 'buy' | 'sell';
    },
    copyRatio: number
  ): Promise<{
    success: boolean;
    simulatedTrade?: CopyTrade;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.API_URL}/api/v1/copy-trading/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          traderId,
          originalTrade,
          copyRatio
        })
      });

      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          simulatedTrade: result.data
        };
      } else {
        return {
          success: false,
          error: result.error || 'Simulation failed'
        };
      }
    } catch (error) {
      console.error('Error simulating copy trade:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 获取交易员排名
   */
  async getTraderRanking(period: 'daily' | 'weekly' | 'monthly' = 'monthly', limit: number = 50): Promise<CopyTrader[]> {
    try {
      const response = await fetch(`${this.API_URL}/api/v1/copy-trading/ranking?period=${period}&limit=${limit}`);
      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error fetching trader ranking:', error);
      return [];
    }
  }

  /**
   * 跟单交易员验证状态
   */
  async getTraderVerificationStatus(traderId: string): Promise<{
    isVerified: boolean;
    verificationLevel: 'basic' | 'advanced' | 'pro';
    verificationDate?: number;
    verifiedBy?: string;
    documents?: string[];
  } | null> {
    try {
      const response = await fetch(`${this.API_URL}/api/v1/copy-trading/verification/${traderId}`);
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error fetching trader verification status:', error);
      return null;
    }
  }
}

// 创建全局跟单交易服务实例
export const copyTradingService = new CopyTradingService();

// 导出类型和服务
export { CopyTradingService };
export default copyTradingService;
