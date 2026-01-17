/**
 * 链配置 - 数据展示与交易分离
 */

// 支持的区块链配置
export const chainConfigs = {
  // 主要交易链 - Solana
  solana: {
    id: 'solana',
    name: 'Solana',
    icon: '/chains/solana.svg',
    tradeEnabled: true,
    isPrimary: true,
    features: {
      trading: true,
      staking: true,
      memeTokens: true,
      smartMoney: true,
    },
    dataSources: [
      'helius',
      'jupiter',
      'pumpfun',
      'dexscreener',
      'gmgn'
    ]
  },
  
  // 数据展示链 - Ethereum
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    icon: '/chains/ethereum.svg',
    tradeEnabled: false,
    isPrimary: false,
    features: {
      trading: false,
      staking: false,
      memeTokens: true,
      smartMoney: true,
    },
    dataSources: [
      'dexscreener',
      'coingecko',
      'moralis'
    ],
    futureFeatures: {
      trading: 'Q2 2025',
      staking: 'Q3 2025',
    }
  },
  
  // 数据展示链 - Base
  base: {
    id: 'base',
    name: 'Base',
    icon: '/chains/base.svg',
    tradeEnabled: false,
    isPrimary: false,
    features: {
      trading: false,
      staking: false,
      memeTokens: true,
      smartMoney: true,
    },
    dataSources: [
      'dexscreener',
      'coingecko',
      'basescan'
    ],
    futureFeatures: {
      trading: 'Q2 2025',
      staking: 'Q3 2025',
    }
  },
  
  // 数据展示链 - BSC
  bsc: {
    id: 'bsc',
    name: 'BNB Chain',
    icon: '/chains/bnb.svg',
    tradeEnabled: false,
    isPrimary: false,
    features: {
      trading: false,
      staking: false,
      memeTokens: true,
      smartMoney: true,
    },
    dataSources: [
      'dexscreener',
      'coingecko',
      'bscscan'
    ],
    futureFeatures: {
      trading: 'Q2 2025',
      staking: 'Q3 2025',
    }
  },
};

// 获取所有支持的链
export const getAllChains = () => Object.values(chainConfigs);

// 获取支持交易的链
export const getTradeEnabledChains = () => 
  getAllChains().filter(chain => chain.tradeEnabled);

// 获取仅数据展示的链
export const getDataOnlyChains = () => 
  getAllChains().filter(chain => !chain.tradeEnabled);

// 获取主要交易链
export const getPrimaryTradeChain = () => 
  getAllChains().find(chain => chain.isPrimary);

// 检查链是否支持交易
export const isTradeEnabled = (chainId: string) => {
  const chain = Object.values(chainConfigs).find(c => c.id === chainId);
  return chain?.tradeEnabled || false;
};

// 检查链是否支持特定功能
export const supportsFeature = (chainId: string, feature: keyof typeof chainConfigs.solana.features) => {
  const chain = Object.values(chainConfigs).find(c => c.id === chainId);
  return chain?.features[feature] || false;
};

// 链类型定义
export type ChainId = keyof typeof chainConfigs;
export type ChainConfig = typeof chainConfigs[ChainId];
export type ChainFeature = keyof typeof chainConfigs.solana.features;
