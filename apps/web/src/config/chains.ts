/**
 * 链配置 - Four.meme (BSC) 和 pump.fun (Solana)
 * 两个平台的代币都支持质押和保险
 */

// Meme 发射平台配置 - 两个平台都支持质押和保险
export const memeLaunchPlatforms = {
  // BSC - Four.meme
  fourMeme: {
    name: 'Four.meme',
    chain: 'bsc',
    chainId: 56,
    type: 'meme-launchpad',
    description: 'BSC Meme Token Launchpad',
    website: 'https://four.meme',
    features: ['fair-launch', 'bonding-curve', 'auto-liquidity', 'anti-rug'],
    // 支持的 DeFi 功能
    defi: {
      staking: true,    // 代币可质押
      insurance: true,  // 代币可购买保险
    },
  },
  // Solana - pump.fun
  pumpFun: {
    name: 'pump.fun',
    chain: 'solana',
    type: 'meme-launchpad',
    description: 'Solana Meme Token Launchpad',
    website: 'https://pump.fun',
    features: ['fair-launch', 'bonding-curve', 'auto-liquidity'],
    // 支持的 DeFi 功能
    defi: {
      staking: true,    // 代币可质押
      insurance: true,  // 代币可购买保险
    },
  },
};

// 获取所有支持质押的平台
export const getStakingPlatforms = () => 
  Object.values(memeLaunchPlatforms).filter(p => p.defi.staking);

// 获取所有支持保险的平台
export const getInsurancePlatforms = () => 
  Object.values(memeLaunchPlatforms).filter(p => p.defi.insurance);

// 支持的区块链配置
export const chainConfigs = {
  // 主要交易链 - BSC (Four.meme)
  bsc: {
    id: 'bsc',
    chainId: 56,
    name: 'BNB Chain',
    icon: '/chains/bnb.svg',
    tradeEnabled: true,
    isPrimary: true,
    platform: 'Four.meme',
    platformType: 'meme-launchpad', // 类似 pump.fun
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    features: {
      trading: true,
      staking: true,
      insurance: true,
      memeTokens: true,
      memeLaunch: true, // Meme 发射
      smartMoney: true,
    },
    dataSources: [
      'four.meme',
      'dexscreener',
      'coingecko',
      'bscscan',
      'pancakeswap'
    ],
    contracts: {
      staking: process.env.NEXT_PUBLIC_MULTI_ASSET_STAKING_ADDRESS,
      insurance: process.env.NEXT_PUBLIC_COWGUARD_INSURANCE_ADDRESS,
      fourMeme: process.env.NEXT_PUBLIC_FOUR_MEME_TOKEN_ADDRESS,
      usdt: process.env.NEXT_PUBLIC_BSC_USDT_ADDRESS || '0x55d398326f99059fF775485246999027B3197955',
    },
    rpcUrls: [
      'https://bsc-dataseed1.binance.org',
      'https://bsc-dataseed2.binance.org',
      'https://bsc-dataseed3.binance.org',
    ],
    blockExplorer: 'https://bscscan.com',
  },
  
  // 测试链 - BSC Testnet
  bscTestnet: {
    id: 'bsc-testnet',
    chainId: 97,
    name: 'BSC Testnet',
    icon: '/chains/bnb.svg',
    tradeEnabled: true,
    isPrimary: false,
    platform: 'Four.meme (Testnet)',
    nativeCurrency: {
      name: 'tBNB',
      symbol: 'tBNB',
      decimals: 18,
    },
    features: {
      trading: true,
      staking: true,
      insurance: true,
      memeTokens: true,
      memeLaunch: true,
      smartMoney: false,
    },
    dataSources: [
      'bscscan'
    ],
    contracts: {
      staking: process.env.NEXT_PUBLIC_TESTNET_STAKING_ADDRESS,
      insurance: process.env.NEXT_PUBLIC_TESTNET_INSURANCE_ADDRESS,
    },
    rpcUrls: [
      'https://data-seed-prebsc-1-s1.binance.org:8545',
    ],
    blockExplorer: 'https://testnet.bscscan.com',
  },
  
  // Solana - pump.fun
  solana: {
    id: 'solana',
    name: 'Solana',
    icon: '/chains/solana.svg',
    tradeEnabled: true,
    isPrimary: false,
    platform: 'pump.fun',
    platformType: 'meme-launchpad',
    features: {
      trading: true,
      staking: true,
      insurance: true,
      memeTokens: true,
      memeLaunch: true, // pump.fun Meme 发射
      smartMoney: true,
    },
    dataSources: [
      'pump.fun',
      'helius',
      'jupiter',
      'dexscreener',
      'gmgn'
    ]
  },
  
  // 数据展示链 - Ethereum
  ethereum: {
    id: 'ethereum',
    chainId: 1,
    name: 'Ethereum',
    icon: '/chains/ethereum.svg',
    tradeEnabled: false,
    isPrimary: false,
    features: {
      trading: false,
      staking: false,
      insurance: false,
      memeTokens: true,
      memeLaunch: false,
      smartMoney: true,
    },
    dataSources: [
      'dexscreener',
      'coingecko',
      'moralis'
    ],
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

// 获取主要交易链 (BSC)
export const getPrimaryTradeChain = () => chainConfigs.bsc;

// 检查链是否支持交易
export const isTradeEnabled = (chainId: string) => {
  const chain = Object.values(chainConfigs).find(c => c.id === chainId);
  return chain?.tradeEnabled || false;
};

// 检查链是否支持特定功能
export const supportsFeature = (chainId: string, feature: keyof typeof chainConfigs.bsc.features) => {
  const chain = Object.values(chainConfigs).find(c => c.id === chainId);
  return chain?.features[feature] || false;
};

// 获取链的合约地址
export const getContractAddress = (chainId: string, contractName: 'staking' | 'insurance' | 'fourMeme' | 'usdt') => {
  const chain = Object.values(chainConfigs).find(c => c.id === chainId);
  if (chain && 'contracts' in chain) {
    return (chain as typeof chainConfigs.bsc).contracts[contractName];
  }
  return undefined;
};

// 获取 BSC 合约地址
export const getBscContracts = () => chainConfigs.bsc.contracts;

// 链类型定义
export type ChainId = keyof typeof chainConfigs;
export type ChainConfig = typeof chainConfigs[ChainId];
export type ChainFeature = keyof typeof chainConfigs.bsc.features;
