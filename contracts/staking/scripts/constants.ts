import { PublicKey } from '@solana/web3.js';

// Token Vesting Program ID
export const TOKEN_VESTING_PROGRAM_ID = new PublicKey(
  'TokenVest1111111111111111111111111111111111'
);

// PopCow Token Program ID
export const POPCOW_TOKEN_PROGRAM_ID = new PublicKey(
  'PopCow1111111111111111111111111111111111111'
);

// 网络配置
export const NETWORKS = {
  devnet: {
    rpc: 'https://api.devnet.solana.com',
    name: 'devnet',
  },
  mainnet: {
    rpc: 'https://api.mainnet-beta.solana.com',
    name: 'mainnet-beta',
  },
};
