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
