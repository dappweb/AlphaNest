/**
 * 链配置 - 仅支持 Solana pump.fun
 * 本项目仅支持 Solana 链上的 pump.fun 发行的代币
 */

// Meme 发射平台配置 - 仅支持 pump.fun
export const memeLaunchPlatforms = {
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

// 支持的区块链配置 - 仅 Solana
export const chainConfigs = {
  // Solana - pump.fun
  solana: {
    id: 'solana',
    name: 'Solana',
    icon: '/chains/solana.svg',
    tradeEnabled: true,
    isPrimary: true,
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
};

// 获取所有支持的链
export const getAllChains = () => Object.values(chainConfigs);

// 获取支持交易的链
export const getTradeEnabledChains = () => 
  getAllChains().filter(chain => chain.tradeEnabled);

// 获取主要交易链 (Solana)
export const getPrimaryTradeChain = () => chainConfigs.solana;

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
