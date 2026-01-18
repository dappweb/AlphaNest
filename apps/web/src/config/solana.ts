/**
 * Solana 配置
 */

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl, PublicKey } from '@solana/web3.js';

// 网络配置
export const SOLANA_NETWORK = 
  process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'mainnet-beta'
    ? WalletAdapterNetwork.Mainnet
    : process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'soldev'
    ? WalletAdapterNetwork.Devnet // soldev 使用 devnet 配置
    : WalletAdapterNetwork.Devnet;

// RPC 端点
export const SOLANA_RPC_ENDPOINT = 
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 
  (process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'soldev' 
    ? 'https://api.devnet.solana.com' // 默认 soldev RPC，可通过环境变量覆盖
    : clusterApiUrl(SOLANA_NETWORK));

// Jupiter API 端点
export const JUPITER_API_URL = 'https://quote-api.jup.ag/v6';

// Solana 程序 ID (devnet 网络 - 2026-01-17 部署)
export const SOLANA_PROGRAM_IDS = {
  // ✅ 已部署
  POPCOW_TOKEN: new PublicKey('2hq6UFiL1VhTYULiJGc49wmNb5S62BAQo3y3EcwGBDZX'),
  COWGUARD_INSURANCE: new PublicKey('FBa18v9ZndffTY6fw2H9dUzc2nGcujZuq2tLzQjtRGxi'),
  POPCOW_STAKING: new PublicKey('9tyVCiEHi97uMbzHHt1MUwprn1d7HEwCzDwUVpxdbYuj'),
  TOKEN_VESTING: new PublicKey('DAGphggsL3TBYeAb9VDo7n5mqmKBKerNoTgC3ecPtDYA'),
  YIELD_VAULT: new PublicKey('5Wy1yNUUzioxydA6h3UtT2FESQAVaKNzjnpTBZqwcFAb'),
  REPUTATION_REGISTRY: new PublicKey('GmGeZQQE6nqcLRef7Z9pFkug6Rvm2ExV6BKLozBpvFp7'),
  GOVERNANCE: new PublicKey('DxhG1fNRDzwVrJy8ZyUe3zdZCnUDDFUEToGRhUFCM4Qh'),
  REFERRAL_SYSTEM: new PublicKey('Gk7RGjs6EvYkUEWod6hviDZ2NAYXrgoDBjfrFWkb9DeG'),
  // ⏳ 待部署
  POINTS_SYSTEM: new PublicKey('46iXDwHRE9FZcoeMUPQD8Bc8B55Bz3Gb9mTPrVJhZP9v'), // 待部署
  MULTI_ASSET_STAKING: new PublicKey('7qpcKQQuDYhN51PTXebV8dpWY8MxqUKeFMwwVQ1eFQ75'), // 待部署
};

// 常用代币地址
export const SOLANA_TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  // PopCow 代币地址
  POPCOW: '8mrMRf8QwGh5bSrgzKsMmHPTTGqDcENU91SWuXEypump',
  // PopCow DeFi 代币地址 (已上线 pump.fun)
  POPCOW_DEFI: '4sCGHM2NL1nV6fYfWSoCTMwmJDCjfHub9pSpz128pump',
};

// 代币小数位
export const SOLANA_TOKEN_DECIMALS: Record<string, number> = {
  [SOLANA_TOKENS.SOL]: 9,
  [SOLANA_TOKENS.USDC]: 6,
  [SOLANA_TOKENS.USDT]: 6,
  [SOLANA_TOKENS.BONK]: 5,
  [SOLANA_TOKENS.WIF]: 6,
  [SOLANA_TOKENS.POPCOW]: 9,
  [SOLANA_TOKENS.POPCOW_DEFI]: 6,
};

// ============================================
// Pyth Network 价格预言机配置
// ============================================

// Pyth Program ID
export const PYTH_PROGRAM_ID = new PublicKey(
  SOLANA_NETWORK === WalletAdapterNetwork.Mainnet
    ? 'FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH' // Mainnet
    : 'gSbePebfvPy7tRqimPoVecS2UsBvYv46ynrzWocc92s'  // Devnet
);

// Pyth Price Feed IDs (Mainnet)
// https://pyth.network/developers/price-feed-ids
export const PYTH_PRICE_FEEDS = {
  // Mainnet Price Feed IDs
  mainnet: {
    SOL_USD: 'H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG',
    USDC_USD: 'Gnt27xtC473ZT2Mw5u8wZ68Z3gULkSTb5DuxJy7eJotD',
    USDT_USD: '3vxLXJqLqF3JG5TCbYycbKWRBbCJQLxQmBGCkyqEEefL',
    BONK_USD: '8ihFLu5FimgTQ1Unh4dVyEHUGodJ5gJQCrQf4KUVB9bN',
    WIF_USD: '6ABgrEZk8urs6kJ1JNdC1sspH5zKXRqxy8sg3ZG2cQps',
  },
  // Devnet Price Feed IDs
  devnet: {
    SOL_USD: 'J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix',
    USDC_USD: '5SSkXsEKQepHHAewytPVwdej4epN1nxgLVM84L4KXgy7',
    USDT_USD: '38xoQ4oeJCBrcVvca2cGk7iV1dAfrmTR1kmhSCJQ8Jto',
    BONK_USD: '72jCwWJPnx3SLmswNm5HkLPJ3cYiRqFYLbJtMvUJ2Fep',
    WIF_USD: '6B23K3tkb51vLZA14jcEQVCA1pfHptzEHFA93V5dYwbT',
  },
};

// 获取当前网络的 Price Feed
export const getCurrentPriceFeeds = () => {
  return SOLANA_NETWORK === WalletAdapterNetwork.Mainnet
    ? PYTH_PRICE_FEEDS.mainnet
    : PYTH_PRICE_FEEDS.devnet;
};

// Pyth Price Account 地址
export const PYTH_PRICE_ACCOUNTS = {
  SOL_USD: new PublicKey(getCurrentPriceFeeds().SOL_USD),
  USDC_USD: new PublicKey(getCurrentPriceFeeds().USDC_USD),
  USDT_USD: new PublicKey(getCurrentPriceFeeds().USDT_USD),
};

// ============================================
// pump.fun 配置
// ============================================

export const PUMP_FUN_CONFIG = {
  name: 'pump.fun',
  url: 'https://pump.fun',
  apiUrl: 'https://frontend-api.pump.fun',
  programId: new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P'),
  // pump.fun 代币通常有 6 位小数
  defaultDecimals: 6,
  // 支持的功能
  features: {
    staking: true,
    insurance: true,
    trading: true,
  },
};
