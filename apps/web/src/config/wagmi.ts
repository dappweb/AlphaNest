import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { base, mainnet, bsc, sepolia } from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'AlphaNest',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [sepolia, base, mainnet, bsc],
  transports: {
    [sepolia.id]: http(),
    [base.id]: http(),
    [mainnet.id]: http(),
    [bsc.id]: http(),
  },
  ssr: true,
});

export const supportedChains = [
  { id: sepolia.id, name: 'Sepolia Testnet', icon: '/chains/ethereum.svg', tradeEnabled: false },
  { id: base.id, name: 'Base', icon: '/chains/base.svg', tradeEnabled: false },
  { id: mainnet.id, name: 'Ethereum', icon: '/chains/ethereum.svg', tradeEnabled: false },
  { id: bsc.id, name: 'BNB Chain', icon: '/chains/bnb.svg', tradeEnabled: false },
];

// Solana 作为主要交易链
export const primaryTradeChain = {
  name: 'Solana',
  icon: '/chains/solana.svg',
  tradeEnabled: true,
  isPrimary: true,
};
