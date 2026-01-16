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

// Solana 程序 ID (soldev 网络)
export const SOLANA_PROGRAM_IDS = {
  POPCOW_TOKEN: new PublicKey('GB13aFFGs6G76dSWWNwHfH596npdwFcxkR5x4Ur4uBjS'),
  COWGUARD_INSURANCE: new PublicKey('3vq7cmrWBVQZF11mHCKnDhppSyyBy9xstbz6tzZqDYcg'),
  POPCOW_STAKING: new PublicKey('4pMUmKCTvxCiM6ccGyc851yhyKnaKfJ3q2umLhyZ9Y2d'),
  TOKEN_VESTING: new PublicKey('FKmtGh85bPYWRCyiJc8rHN6kohJWYgrkWvc8CtXAyz8n'),
  YIELD_VAULT: new PublicKey('ECAnyfJmCxVxUSgv4MW7uvAkMophVnG5VTvEAgQt2vrP'),
  MULTI_ASSET_STAKING: new PublicKey('EUN7ptUWascGEbBgFVQTxmFWzMSoN95YG5JGvabNtKYF'),
  REPUTATION_REGISTRY: new PublicKey('6RpDY1sJJyQcTkYqr3myYbLuCA5H9SLeGonyRUBhBbWt'),
  GOVERNANCE: new PublicKey('5QCNr7vD639eE1R3rbts78qYZQEyc3L8XJriHNcLNyLW'),
  POINTS_SYSTEM: new PublicKey('2zv8gpnD7DYogiDb591uceav7Rkxfqz5aCK18hMqPCxH'),
  REFERRAL_SYSTEM: new PublicKey('Cd2NZkSS5K4kqyWQcdaGv8deE8k75JrWjwU3byQRqEju'),
};

// 常用代币地址
export const SOLANA_TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  // PopCow 代币地址 (需要根据实际部署更新)
  POPCOW: '8mrMRf8QwGh5bSrgzKsMmHPTTGqDcENU91SWuXEypump',
};

// 代币小数位
export const SOLANA_TOKEN_DECIMALS: Record<string, number> = {
  [SOLANA_TOKENS.SOL]: 9,
  [SOLANA_TOKENS.USDC]: 6,
  [SOLANA_TOKENS.USDT]: 6,
  [SOLANA_TOKENS.BONK]: 5,
  [SOLANA_TOKENS.WIF]: 6,
  [SOLANA_TOKENS.POPCOW]: 9,
};
