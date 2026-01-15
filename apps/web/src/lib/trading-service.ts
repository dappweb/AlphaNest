/**
 * 交易服务层
 * 负责处理买卖交易、滑点保护、交易历史等
 */

import { ApiService } from './api-services';

export interface TradeParams {
  tokenAddress: string;
  chain: string;
  amount: number;
  amountType: 'base' | 'quote'; // base: 以代币数量, quote: 以ETH/USDT数量
  slippage: number; // 滑点容忍度，百分比
  deadline: number; // 交易截止时间，秒
}

export interface TradeResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  details?: {
    amountIn: number;
    amountOut: number;
    price: number;
    slippage: number;
    gasUsed?: number;
    gasPrice?: number;
  };
}

export interface TransactionHistory {
  hash: string;
  type: 'buy' | 'sell';
  token: {
    address: string;
    symbol: string;
    name: string;
  };
  amountIn: number;
  amountOut: number;
  price: number;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  gasUsed?: number;
  gasPrice?: number;
  chain: string;
}

export interface LiquidityInfo {
  token0: string;
  token1: string;
  reserve0: number;
  reserve1: number;
  liquidity: number;
  fee: number;
}

export interface PriceImpact {
  percentage: number;
  amountIn: number;
  amountOut: number;
  price: number;
}

class TradingService {
  private API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alphanest-api.dappweb.workers.dev';

  /**
   * 计算滑点
   */
  calculateSlippage(
    amountIn: number,
    reserveIn: number,
    reserveOut: number,
    amountOut: number
  ): number {
    if (reserveIn === 0 || reserveOut === 0) return 0;
    
    const expectedPrice = reserveOut / reserveIn;
    const actualPrice = amountOut / amountIn;
    const slippage = Math.abs((expectedPrice - actualPrice) / expectedPrice) * 100;
    
    return Math.min(slippage, 100); // 限制最大滑点为100%
  }

  /**
   * 计算价格影响
   */
  calculatePriceImpact(
    amountIn: number,
    reserveIn: number,
    reserveOut: number
  ): PriceImpact {
    if (reserveIn === 0 || reserveOut === 0) {
      return {
        percentage: 0,
        amountIn,
        amountOut: 0,
        price: 0
      };
    }

    const k = reserveIn * reserveOut; // 恒定乘积
    const newReserveIn = reserveIn + amountIn;
    const newReserveOut = k / newReserveIn;
    const amountOut = reserveOut - newReserveOut;
    const price = amountOut / amountIn;
    
    // 价格影响 = (新价格 - 原价格) / 原价格 * 100
    const originalPrice = reserveOut / reserveIn;
    const priceImpact = Math.abs((price - originalPrice) / originalPrice) * 100;

    return {
      percentage: priceImpact,
      amountIn,
      amountOut,
      price
    };
  }

  /**
   * 获取流动性信息
   */
  async getLiquidityInfo(token0: string, token1: string, chain: string): Promise<LiquidityInfo | null> {
    try {
      const response = await fetch(`${this.API_URL}/api/v1/trading/liquidity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token0,
          token1,
          chain
        })
      });

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error fetching liquidity info:', error);
      return null;
    }
  }

  /**
   * 获取最佳价格
   */
  async getBestPrice(
    tokenAddress: string,
    chain: string,
    amount: number,
    amountType: 'base' | 'quote' = 'base'
  ): Promise<{
    amountIn: number;
    amountOut: number;
    price: number;
    priceImpact: number;
    routes: string[];
  } | null> {
    try {
      const response = await fetch(`${this.API_URL}/api/v1/trading/price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenAddress,
          chain,
          amount,
          amountType
        })
      });

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error fetching best price:', error);
      return null;
    }
  }

  /**
   * 执行买入交易
   */
  async buy(params: TradeParams, userAddress: string): Promise<TradeResult> {
    try {
      // 首先获取最佳价格
      const priceInfo = await this.getBestPrice(
        params.tokenAddress,
        params.chain,
        params.amount,
        params.amountType
      );

      if (!priceInfo) {
        return {
          success: false,
          error: 'Failed to get price information'
        };
      }

      // 检查滑点
      if (priceInfo.priceImpact > params.slippage) {
        return {
          success: false,
          error: `Price impact too high: ${priceInfo.priceImpact.toFixed(2)}% > ${params.slippage}%`
        };
      }

      // 执行交易
      const response = await fetch(`${this.API_URL}/api/v1/trading/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress,
          tokenAddress: params.tokenAddress,
          chain: params.chain,
          amountIn: priceInfo.amountIn,
          amountOutMin: priceInfo.amountOut * (1 - params.slippage / 100),
          deadline: Math.floor(Date.now() / 1000) + params.deadline,
          routes: priceInfo.routes
        })
      });

      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          transactionHash: result.data.transactionHash,
          details: {
            amountIn: priceInfo.amountIn,
            amountOut: result.data.amountOut,
            price: result.data.price,
            slippage: priceInfo.priceImpact,
            gasUsed: result.data.gasUsed,
            gasPrice: result.data.gasPrice
          }
        };
      } else {
        return {
          success: false,
          error: result.error || 'Trade failed'
        };
      }
    } catch (error) {
      console.error('Error executing buy trade:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 执行卖出交易
   */
  async sell(params: TradeParams, userAddress: string): Promise<TradeResult> {
    try {
      // 首先获取最佳价格
      const priceInfo = await this.getBestPrice(
        params.tokenAddress,
        params.chain,
        params.amount,
        params.amountType
      );

      if (!priceInfo) {
        return {
          success: false,
          error: 'Failed to get price information'
        };
      }

      // 检查滑点
      if (priceInfo.priceImpact > params.slippage) {
        return {
          success: false,
          error: `Price impact too high: ${priceInfo.priceImpact.toFixed(2)}% > ${params.slippage}%`
        };
      }

      // 执行交易
      const response = await fetch(`${this.API_URL}/api/v1/trading/sell`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress,
          tokenAddress: params.tokenAddress,
          chain: params.chain,
          amountIn: priceInfo.amountIn,
          amountOutMin: priceInfo.amountOut * (1 - params.slippage / 100),
          deadline: Math.floor(Date.now() / 1000) + params.deadline,
          routes: priceInfo.routes
        })
      });

      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          transactionHash: result.data.transactionHash,
          details: {
            amountIn: priceInfo.amountIn,
            amountOut: result.data.amountOut,
            price: result.data.price,
            slippage: priceInfo.priceImpact,
            gasUsed: result.data.gasUsed,
            gasPrice: result.data.gasPrice
          }
        };
      } else {
        return {
          success: false,
          error: result.error || 'Trade failed'
        };
      }
    } catch (error) {
      console.error('Error executing sell trade:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 获取交易历史
   */
  async getTransactionHistory(
    userAddress: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<TransactionHistory[]> {
    try {
      const response = await ApiService.getUserTransactionHistory(userAddress);
      
      if (response.success && response.data) {
        return response.data.slice(offset, offset + limit);
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }

  /**
   * 获取交易详情
   */
  async getTransactionDetails(transactionHash: string): Promise<TransactionHistory | null> {
    try {
      const response = await fetch(`${this.API_URL}/api/v1/trading/transaction/${transactionHash}`);
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      return null;
    }
  }

  /**
   * 模拟交易（用于预览）
   */
  async simulateTrade(params: TradeParams): Promise<{
    amountIn: number;
    amountOut: number;
    price: number;
    priceImpact: number;
    gasEstimate: number;
    routes: string[];
  } | null> {
    try {
      const response = await fetch(`${this.API_URL}/api/v1/trading/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      });

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error simulating trade:', error);
      return null;
    }
  }

  /**
   * 获取支持的代币列表
   */
  async getSupportedTokens(chain?: string): Promise<any[]> {
    try {
      const url = chain 
        ? `${this.API_URL}/api/v1/tokens/supported?chain=${chain}`
        : `${this.API_URL}/api/v1/tokens/supported`;
      
      const response = await fetch(url);
      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error fetching supported tokens:', error);
      return [];
    }
  }

  /**
   * 获取交易对信息
   */
  async getPairInfo(token0: string, token1: string, chain: string): Promise<any | null> {
    try {
      const response = await fetch(`${this.API_URL}/api/v1/trading/pair`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token0,
          token1,
          chain
        })
      });

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error fetching pair info:', error);
      return null;
    }
  }
}

// 创建全局交易服务实例
export const tradingService = new TradingService();

// 导出类型和服务
export { TradingService };
export default tradingService;
