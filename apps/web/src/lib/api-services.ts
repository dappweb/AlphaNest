/**
 * API 服务层
 * 统一管理所有API调用，提供类型安全的接口
 */

// API request helper (temporary implementation)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alphanest-api.dappweb.workers.dev';

interface LocalApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface RequestOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  useCache?: boolean;
  cacheTTL?: number;
}

async function apiRequest<T>(
  endpoint: string,
  options?: RequestOptions
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });

    const data = await response.json();
    // Handle nested API response structure
    if (data && typeof data === 'object' && 'success' in data) {
      return data;
    }
    // Handle direct data response
    return {
      success: true,
      data: data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// API 基础类型定义
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 平台统计数据
export interface PlatformStats {
  totalVolume24h: number;
  totalUsers: number;
  totalTransactions: number;
  activeTokens: number;
  volumeChange24h: number;
  usersChange24h: number;
  transactionsChange24h: number;
}

// 用户统计数据
export interface UserStats {
  portfolioValue: number;
  portfolioChange: number;
  pointsBalance: number;
  activePolicies: number;
  totalTrades: number;
  winRate: number;
}

// 趋势代币数据
export interface TrendingToken {
  contract_address: string;
  chain: string;
  name: string;
  symbol: string;
  logo_url?: string;
  price_usd: string;
  price_change_24h: number;
  volume_24h: string | number;
  market_cap: string | number;
  url?: string;
  liquidity?: number;
  holders?: number;
  created_at?: string;
}

// 开发者排名数据
export interface DeveloperRanking {
  id: number;
  address: string;
  alias: string;
  winRate: number;
  totalLaunches: number;
  rugCount: number;
  verified: boolean;
  rank: number;
  avgReturn: number;
  totalVolume: number;
  reputation: number;
}

// 最近活动数据
export interface RecentActivity {
  id: number;
  type: 'buy' | 'sell' | 'insurance' | 'launch';
  token: string;
  amount: number;
  user: string;
  timestamp: string;
  chain: string;
  tx_hash?: string;
  price?: number;
}

// 链分布数据
export interface ChainDistribution {
  chain: string;
  volume: number;
  percentage: number;
  transactions: number;
  users: number;
}

// 交易对数据
export interface TradingPair {
  token0: string;
  token1: string;
  price: number;
  change24h: number;
  volume24h: number;
  liquidity: number;
}

// API 服务类
export class ApiService {
  // 平台统计
  static async getPlatformStats(): Promise<ApiResponse<PlatformStats>> {
    return apiRequest<ApiResponse<PlatformStats>>('/api/v1/platform/stats', {
      useCache: true,
      cacheTTL: 30000, // 30秒缓存
    });
  }

  // 用户统计
  static async getUserStats(address: string): Promise<ApiResponse<UserStats>> {
    return apiRequest<ApiResponse<UserStats>>(`/api/v1/user/${address}/stats`, {
      useCache: true,
      cacheTTL: 60000, // 1分钟缓存
    });
  }

  // 趋势代币
  static async getTrendingTokens(limit: number = 10, chains?: string[]): Promise<ApiResponse<TrendingToken[]>> {
    const chainParams = chains && chains.length > 0 
      ? `&chains=${chains.join(',')}` 
      : '';
    return apiRequest<ApiResponse<TrendingToken[]>>(`/api/v1/tokens/trending?limit=${limit}${chainParams}`, {
      useCache: true,
      cacheTTL: 30000, // 30秒缓存
    });
  }

  // 代币详情
  static async getTokenDetails(address: string, chain: string): Promise<ApiResponse<TrendingToken>> {
    return apiRequest<ApiResponse<TrendingToken>>(`/api/v1/tokens/${address}?chain=${chain}`, {
      useCache: true,
      cacheTTL: 10000, // 10秒缓存
    });
  }

  // 开发者排名
  static async getDeveloperRankings(limit: number = 10): Promise<ApiResponse<DeveloperRanking[]>> {
    return apiRequest<ApiResponse<DeveloperRanking[]>>(`/api/v1/developers/rankings?limit=${limit}`, {
      useCache: true,
      cacheTTL: 60000, // 1分钟缓存
    });
  }

  // 最近活动
  static async getRecentActivity(limit: number = 20): Promise<ApiResponse<RecentActivity[]>> {
    return apiRequest<ApiResponse<RecentActivity[]>>(`/api/v1/activity/recent?limit=${limit}`, {
      useCache: true,
      cacheTTL: 15000, // 15秒缓存
    });
  }

  // 链分布
  static async getChainDistribution(): Promise<ApiResponse<ChainDistribution[]>> {
    return apiRequest<ApiResponse<ChainDistribution[]>>('/api/v1/platform/chains', {
      useCache: true,
      cacheTTL: 60000, // 1分钟缓存
    });
  }

  // 交易量数据
  static async getVolumeData(period: string = '24h'): Promise<ApiResponse<any[]>> {
    return apiRequest<ApiResponse<any[]>>(`/api/v1/platform/volume?period=${period}`, {
      useCache: true,
      cacheTTL: 30000, // 30秒缓存
    });
  }

  // 热门代币
  static async getTopTokens(limit: number = 10): Promise<ApiResponse<TrendingToken[]>> {
    return apiRequest<ApiResponse<TrendingToken[]>>(`/api/v1/tokens/top?limit=${limit}`, {
      useCache: true,
      cacheTTL: 30000, // 30秒缓存
    });
  }

  // 搜索代币
  static async searchTokens(query: string, limit: number = 10): Promise<ApiResponse<TrendingToken[]>> {
    return apiRequest<ApiResponse<TrendingToken[]>>(`/api/v1/tokens/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
      useCache: true,
      cacheTTL: 30000, // 30秒缓存
    });
  }

  // 获取代币价格历史
  static async getTokenPriceHistory(address: string, chain: string, period: string = '24h'): Promise<ApiResponse<any[]>> {
    return apiRequest<ApiResponse<any[]>>(`/api/v1/tokens/${address}/history?chain=${chain}&period=${period}`, {
      useCache: true,
      cacheTTL: 60000, // 1分钟缓存
    });
  }

  // 获取用户交易历史
  static async getUserTransactionHistory(address: string, limit: number = 50): Promise<ApiResponse<any[]>> {
    return apiRequest<ApiResponse<any[]>>(`/api/v1/user/${address}/transactions?limit=${limit}`, {
      useCache: true,
      cacheTTL: 30000, // 30秒缓存
    });
  }

  // 获取用户持仓
  static async getUserHoldings(address: string): Promise<ApiResponse<any[]>> {
    return apiRequest<ApiResponse<any[]>>(`/api/v1/user/${address}/holdings`, {
      useCache: true,
      cacheTTL: 60000, // 1分钟缓存
    });
  }

  // 获取积分数据
  static async getUserPoints(address: string): Promise<ApiResponse<any>> {
    return apiRequest<ApiResponse<any>>(`/api/v1/user/${address}/points`, {
      useCache: true,
      cacheTTL: 30000, // 30秒缓存
    });
  }

  // 获取积分任务
  static async getPointsTasks(): Promise<ApiResponse<any[]>> {
    return apiRequest<ApiResponse<any[]>>('/api/v1/points/tasks', {
      useCache: true,
      cacheTTL: 300000, // 5分钟缓存
    });
  }

  // 获取积分排行榜
  static async getPointsLeaderboard(limit: number = 50): Promise<ApiResponse<any[]>> {
    return apiRequest<ApiResponse<any[]>>(`/api/v1/points/leaderboard?limit=${limit}`, {
      useCache: true,
      cacheTTL: 60000, // 1分钟缓存
    });
  }

  // 获取保险产品
  static async getInsuranceProducts(): Promise<ApiResponse<any[]>> {
    return apiRequest<ApiResponse<any[]>>('/api/v1/insurance/products', {
      useCache: true,
      cacheTTL: 300000, // 5分钟缓存
    });
  }

  // 获取用户保险
  static async getUserInsurance(address: string): Promise<ApiResponse<any[]>> {
    return apiRequest<ApiResponse<any[]>>(`/api/v1/user/${address}/insurance`, {
      useCache: true,
      cacheTTL: 30000, // 30秒缓存
    });
  }

  // 获取交易机器人
  static async getTradingBots(): Promise<ApiResponse<any[]>> {
    return apiRequest<ApiResponse<any[]>>('/api/v1/bots', {
      useCache: true,
      cacheTTL: 300000, // 5分钟缓存
    });
  }

  // 健康检查
  static async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return apiRequest<ApiResponse<{ status: string; timestamp: string }>>('/api/v1/health', {
      useCache: false,
      timeout: 5000,
    });
  }
}

// 导出默认实例
export default ApiService;
