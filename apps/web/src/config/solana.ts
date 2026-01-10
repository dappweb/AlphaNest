/**
 * Solana 配置
 */

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';

// 网络配置
export const SOLANA_NETWORK = 
  process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'mainnet-beta'
    ? WalletAdapterNetwork.Mainnet
    : WalletAdapterNetwork.Devnet;

// RPC 端点
export const SOLANA_RPC_ENDPOINT = 
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(SOLANA_NETWORK);

// Jupiter API 端点
export const JUPITER_API_URL = 'https://quote-api.jup.ag/v6';

// 常用代币地址
export const SOLANA_TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
};

// 代币小数位
export const SOLANA_TOKEN_DECIMALS: Record<string, number> = {
  [SOLANA_TOKENS.SOL]: 9,
  [SOLANA_TOKENS.USDC]: 6,
  [SOLANA_TOKENS.USDT]: 6,
  [SOLANA_TOKENS.BONK]: 5,
  [SOLANA_TOKENS.WIF]: 6,
};
