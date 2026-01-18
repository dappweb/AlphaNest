import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { bsc, bscTestnet, mainnet, sepolia } from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'PopCowDefi - Four.meme',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [bsc, bscTestnet, mainnet, sepolia],
  transports: {
    [bsc.id]: http('https://bsc-dataseed1.binance.org'),
    [bscTestnet.id]: http('https://data-seed-prebsc-1-s1.binance.org:8545'),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
});

export const supportedChains = [
  { id: bsc.id, name: 'BNB Chain', icon: '/chains/bnb.svg', tradeEnabled: true, isPrimary: true },
  { id: bscTestnet.id, name: 'BSC Testnet', icon: '/chains/bnb.svg', tradeEnabled: true, isPrimary: false },
  { id: mainnet.id, name: 'Ethereum', icon: '/chains/ethereum.svg', tradeEnabled: false, isPrimary: false },
  { id: sepolia.id, name: 'Sepolia Testnet', icon: '/chains/ethereum.svg', tradeEnabled: false, isPrimary: false },
];

// BSC (Four.meme) 作为主要交易链
export const primaryTradeChain = {
  name: 'BNB Chain',
  icon: '/chains/bnb.svg',
  tradeEnabled: true,
  isPrimary: true,
  platform: 'Four.meme',
};

// Four.meme 代币配置
export const FOUR_MEME_TOKEN = {
  address: process.env.NEXT_PUBLIC_FOUR_MEME_TOKEN_ADDRESS as `0x${string}` || '0x0000000000000000000000000000000000000000',
  symbol: 'FOUR',
  name: 'Four.meme',
  decimals: 18,
  chainId: bsc.id,
  logo: '/tokens/four-meme.svg',
};
