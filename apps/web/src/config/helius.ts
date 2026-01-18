/**
 * Helius API 配置
 * https://docs.helius.dev/
 */

// Helius API Key
export const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY || '46193d76-9830-41e9-ae1a-69bc2519fa53';

// Helius API 端点
export const HELIUS_CONFIG = {
  // RPC 端点 (比标准 RPC 更快)
  rpc: {
    mainnet: `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
    devnet: `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
  },
  
  // REST API 端点
  api: {
    mainnet: 'https://api.helius.xyz/v0',
    devnet: 'https://api-devnet.helius.xyz/v0',
  },
  
  // DAS API 端点 (Digital Asset Standard)
  das: {
    mainnet: 'https://mainnet.helius-rpc.com/?api-key=' + HELIUS_API_KEY,
    devnet: 'https://devnet.helius-rpc.com/?api-key=' + HELIUS_API_KEY,
  },
  
  // Webhooks 端点
  webhooks: {
    mainnet: 'https://api.helius.xyz/v0/webhooks',
    devnet: 'https://api-devnet.helius.xyz/v0/webhooks',
  },
};

// 获取当前网络配置
export const getHeliusConfig = (network: 'mainnet' | 'devnet' = 'devnet') => ({
  rpcUrl: HELIUS_CONFIG.rpc[network],
  apiUrl: HELIUS_CONFIG.api[network],
  dasUrl: HELIUS_CONFIG.das[network],
  webhooksUrl: HELIUS_CONFIG.webhooks[network],
  apiKey: HELIUS_API_KEY,
});

// Helius API 类型定义
export interface HeliusTokenBalance {
  mint: string;
  amount: number;
  decimals: number;
  tokenAccount: string;
}

export interface HeliusTokenMetadata {
  mint: string;
  name: string;
  symbol: string;
  uri: string;
  image?: string;
  description?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}

export interface HeliusTransaction {
  signature: string;
  slot: number;
  timestamp: number;
  type: string;
  description: string;
  fee: number;
  feePayer: string;
  nativeTransfers?: Array<{
    fromUserAccount: string;
    toUserAccount: string;
    amount: number;
  }>;
  tokenTransfers?: Array<{
    fromUserAccount: string;
    toUserAccount: string;
    fromTokenAccount: string;
    toTokenAccount: string;
    tokenAmount: number;
    mint: string;
    tokenStandard: string;
  }>;
  accountData?: Array<{
    account: string;
    nativeBalanceChange: number;
    tokenBalanceChanges: Array<{
      userAccount: string;
      tokenAccount: string;
      mint: string;
      rawTokenAmount: {
        tokenAmount: string;
        decimals: number;
      };
    }>;
  }>;
  source: string;
}

export interface HeliusAsset {
  id: string;
  content: {
    json_uri: string;
    metadata: {
      name: string;
      symbol: string;
      description?: string;
    };
    links?: {
      image?: string;
      external_url?: string;
    };
  };
  ownership: {
    owner: string;
    frozen: boolean;
  };
  token_info?: {
    balance: number;
    decimals: number;
    supply: number;
    price_info?: {
      price_per_token: number;
      total_price: number;
      currency: string;
    };
  };
}

export interface HeliusPriceData {
  id: string;
  mintSymbol: string;
  vsToken: string;
  vsTokenSymbol: string;
  price: number;
}

// Webhook 类型
export type WebhookType = 
  | 'TRANSACTION'
  | 'NFT_SALE'
  | 'NFT_LISTING'
  | 'NFT_CANCEL_LISTING'
  | 'NFT_BID'
  | 'NFT_CANCEL_BID'
  | 'ACCOUNT_CHANGE';

export interface HeliusWebhook {
  webhookID: string;
  wallet: string;
  webhookURL: string;
  transactionTypes: WebhookType[];
  accountAddresses: string[];
  webhookType: 'enhanced' | 'raw';
}
