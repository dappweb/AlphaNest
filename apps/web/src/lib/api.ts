/**
 * API Client
 * 提供与后端 API 交互的函数
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alphanest-api.dappweb.workers.dev';

/**
 * Insurance Product 类型定义
 */
export interface InsuranceProduct {
  poolId: number;
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  chain: string;
  totalRugBets: string;
  totalSafeBets: string;
  rugOdds: number;
  safeOdds: number;
  expiresAt: number;
  status: 'active' | 'resolved' | 'cancelled';
  minBet: string;
  maxBet: string;
}

/**
 * 获取保险产品列表
 */
export async function getInsuranceProducts(): Promise<InsuranceProduct[]> {
  try {
    const response = await fetch(`${API_URL}/api/v1/insurance/pools`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.pools || [];
  } catch (error) {
    console.error('Failed to fetch insurance products:', error);
    // 返回模拟数据作为后备
    return getMockInsuranceProducts();
  }
}

/**
 * 获取模拟保险产品数据
 */
function getMockInsuranceProducts(): InsuranceProduct[] {
  return [
    {
      poolId: 1,
      tokenAddress: '0x1234567890abcdef1234567890abcdef12345678',
      tokenName: 'Pepe Token',
      tokenSymbol: 'PEPE',
      chain: 'base',
      totalRugBets: '50000',
      totalSafeBets: '100000',
      rugOdds: 3.0,
      safeOdds: 1.5,
      expiresAt: Date.now() / 1000 + 86400 * 7, // 7 days from now
      status: 'active',
      minBet: '10',
      maxBet: '10000',
    },
    {
      poolId: 2,
      tokenAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
      tokenName: 'Bonk',
      tokenSymbol: 'BONK',
      chain: 'solana',
      totalRugBets: '30000',
      totalSafeBets: '70000',
      rugOdds: 2.33,
      safeOdds: 1.43,
      expiresAt: Date.now() / 1000 + 86400 * 5,
      status: 'active',
      minBet: '10',
      maxBet: '10000',
    },
    {
      poolId: 3,
      tokenAddress: '0x5678901234abcdef5678901234abcdef56789012',
      tokenName: 'Doge Killer',
      tokenSymbol: 'LEASH',
      chain: 'ethereum',
      totalRugBets: '80000',
      totalSafeBets: '120000',
      rugOdds: 2.5,
      safeOdds: 1.67,
      expiresAt: Date.now() / 1000 + 86400 * 3,
      status: 'active',
      minBet: '10',
      maxBet: '10000',
    },
  ];
}

/**
 * 获取单个保险池详情
 */
export async function getInsurancePool(poolId: number): Promise<InsuranceProduct | null> {
  try {
    const response = await fetch(`${API_URL}/api/v1/insurance/pools/${poolId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.pool || null;
  } catch (error) {
    console.error(`Failed to fetch insurance pool ${poolId}:`, error);
    // 从模拟数据中查找
    const mockProducts = getMockInsuranceProducts();
    return mockProducts.find(p => p.poolId === poolId) || null;
  }
}
