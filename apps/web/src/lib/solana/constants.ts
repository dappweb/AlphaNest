import { PublicKey } from '@solana/web3.js';

// popcow 引流代币地址 (Pump.fun 发行)
export const POPCOW_TOKEN_MINT = new PublicKey('8mrMRf8QwGh5bSrgzKsMmHPTTGqDcENU91SWuXEypump');

// PopCowDefi 平台代币地址 (部署后更新)
export const POPCOWDEFI_TOKEN_MINT = new PublicKey('11111111111111111111111111111111'); // TODO: 部署后替换

// 质押合约程序 ID (部署后更新)
export const STAKING_PROGRAM_ID = new PublicKey('11111111111111111111111111111111'); // TODO: 部署后替换

// 股票代币化产品支持
// 导入股票代币配置（可选，需要时启用）
// import { ALL_STOCK_TOKENS } from './stock-tokens';

// 主流代币地址 (Solana Mainnet)
export const MAINSTREAM_TOKENS = {
  SOL: {
    mint: new PublicKey('So11111111111111111111111111111111111111112'), // Wrapped SOL
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    icon: '◎',
    coingeckoId: 'solana',
  },
  USDC: {
    mint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    icon: '$',
    coingeckoId: 'usd-coin',
  },
  USDT: {
    mint: new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'),
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    icon: '$',
    coingeckoId: 'tether',
  },
  BONK: {
    mint: new PublicKey('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'),
    symbol: 'BONK',
    name: 'Bonk',
    decimals: 5,
    icon: '🐕',
    coingeckoId: 'bonk',
  },
  JUP: {
    mint: new PublicKey('JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'),
    symbol: 'JUP',
    name: 'Jupiter',
    decimals: 6,
    icon: '🪐',
    coingeckoId: 'jupiter-exchange-solana',
  },
  RAY: {
    mint: new PublicKey('4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R'),
    symbol: 'RAY',
    name: 'Raydium',
    decimals: 6,
    icon: '☀️',
    coingeckoId: 'raydium',
  },
  POPCOW: {
    mint: POPCOW_TOKEN_MINT,
    symbol: 'POPCOW',
    name: 'PopCow',
    decimals: 6,
    icon: '🐄',
    coingeckoId: null,
  },
};

// 支持质押的代币列表
export const STAKEABLE_TOKENS = [
  {
    ...MAINSTREAM_TOKENS.POPCOW,
    rewardMultiplier: 2.0,  // 2x 奖励加成 (引流代币)
    minStake: 1000,
    featured: true,
  },
  {
    ...MAINSTREAM_TOKENS.SOL,
    rewardMultiplier: 1.0,
    minStake: 0.1,
    featured: true,
  },
  {
    ...MAINSTREAM_TOKENS.USDC,
    rewardMultiplier: 1.0,
    minStake: 10,
    featured: true,
  },
  {
    ...MAINSTREAM_TOKENS.USDT,
    rewardMultiplier: 1.0,
    minStake: 10,
    featured: false,
  },
  {
    ...MAINSTREAM_TOKENS.BONK,
    rewardMultiplier: 1.5,
    minStake: 1000000,
    featured: false,
  },
  {
    ...MAINSTREAM_TOKENS.JUP,
    rewardMultiplier: 1.2,
    minStake: 10,
    featured: false,
  },
  {
    ...MAINSTREAM_TOKENS.RAY,
    rewardMultiplier: 1.2,
    minStake: 1,
    featured: false,
  },
];

// 代币信息
export const TOKEN_INFO = {
  popcow: {
    symbol: 'POPCOW',
    name: 'PopCow',
    decimals: 6,
    mint: POPCOW_TOKEN_MINT,
  },
  popCowDefi: {
    symbol: 'PopCowDefi',
    name: 'PopCow Defi Token',
    decimals: 9,
    mint: POPCOWDEFI_TOKEN_MINT,
    totalSupply: 100_000_000,
  },
};

// 质押池配置
export const STAKING_POOLS = {
  flexible: {
    id: 0,
    name: '灵活质押',
    nameEn: 'Flexible',
    lockPeriod: 0,
    apy: 50,
    multiplier: 1.0,
    earlyWithdrawPenalty: 0,
  },
  locked30: {
    id: 1,
    name: '30天锁仓',
    nameEn: '30 Days Lock',
    lockPeriod: 30 * 24 * 60 * 60,
    apy: 100,
    multiplier: 2.0,
    earlyWithdrawPenalty: 0.1,
  },
  locked90: {
    id: 2,
    name: '90天锁仓',
    nameEn: '90 Days Lock',
    lockPeriod: 90 * 24 * 60 * 60,
    apy: 200,
    multiplier: 4.0,
    earlyWithdrawPenalty: 0.2,
  },
};

// RPC 端点 - 优先使用 Helius RPC
const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY || '';
export const SOLANA_RPC_ENDPOINT = HELIUS_API_KEY
  ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
  : (process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');

// 奖励计算
export const calculateDailyReward = (
  stakedAmount: number,
  poolId: number
): number => {
  const pool = Object.values(STAKING_POOLS).find(p => p.id === poolId);
  if (!pool) return 0;
  return (stakedAmount * pool.apy * pool.multiplier) / 365 / 100;
};

export const calculatePendingReward = (
  stakedAmount: number,
  poolId: number,
  stakingDays: number
): number => {
  return calculateDailyReward(stakedAmount, poolId) * stakingDays;
};
