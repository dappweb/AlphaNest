import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { base, mainnet, bsc } from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'AlphaNest',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [base, mainnet, bsc],
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(),
    [bsc.id]: http(),
  },
  ssr: true,
});

export const supportedChains = [
  { id: base.id, name: 'Base', icon: '/chains/base.svg' },
  { id: mainnet.id, name: 'Ethereum', icon: '/chains/ethereum.svg' },
  { id: bsc.id, name: 'BNB Chain', icon: '/chains/bnb.svg' },
];
