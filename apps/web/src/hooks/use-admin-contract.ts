/**
 * Admin Contract Management Hooks
 * 管理员合约管理功能 - 支持 BSC 和 Solana
 */

import { useCallback, useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, parseUnits, formatEther, formatUnits } from 'viem';
import { bsc, bscTestnet } from 'wagmi/chains';

// ============================================
// Contract ABIs (Admin Functions)
// ============================================

// MultiAssetStaking Admin ABI
const STAKING_ADMIN_ABI = [
  // Read functions
  {
    name: 'owner',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    name: 'paused',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'stakeableTokens',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [
      { name: 'tokenName', type: 'string' },
      { name: 'decimals', type: 'uint8' },
      { name: 'baseApy', type: 'uint256' },
      { name: 'rewardMultiplier', type: 'uint256' },
      { name: 'minStakeAmount', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
      { name: 'totalStaked', type: 'uint256' },
      { name: 'totalStakers', type: 'uint256' },
    ],
  },
  // Write functions
  {
    name: 'addStakeableToken',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_token', type: 'address' },
      { name: '_tokenName', type: 'string' },
      { name: '_decimals', type: 'uint8' },
      { name: '_baseApy', type: 'uint256' },
      { name: '_rewardMultiplier', type: 'uint256' },
      { name: '_minStakeAmount', type: 'uint256' },
      { name: '_priceFeed', type: 'address' },
    ],
    outputs: [],
  },
  {
    name: 'updateTokenConfig',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_token', type: 'address' },
      { name: '_baseApy', type: 'uint256' },
      { name: '_rewardMultiplier', type: 'uint256' },
      { name: '_minStakeAmount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'setTokenActive',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_token', type: 'address' },
      { name: '_isActive', type: 'bool' },
    ],
    outputs: [],
  },
  {
    name: 'pause',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'unpause',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'setEarlyBirdDuration',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_duration', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'updateFundAllocation',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_devFundRatio', type: 'uint256' },
      { name: '_liquidityRatio', type: 'uint256' },
      { name: '_rewardRatio', type: 'uint256' },
      { name: '_reserveRatio', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'withdrawTreasury',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_token', type: 'address' },
      { name: '_amount', type: 'uint256' },
    ],
    outputs: [],
  },
] as const;

// CowGuardInsurance Admin ABI
const INSURANCE_ADMIN_ABI = [
  // Read functions
  {
    name: 'owner',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    name: 'paused',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'treasuryFee',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'products',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'productId', type: 'uint256' }],
    outputs: [
      { name: 'productType', type: 'uint8' },
      { name: 'premiumRate', type: 'uint256' },
      { name: 'coverageRate', type: 'uint256' },
      { name: 'minCoverage', type: 'uint256' },
      { name: 'maxCoverage', type: 'uint256' },
      { name: 'durationDays', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
      { name: 'totalPolicies', type: 'uint256' },
      { name: 'totalCoverage', type: 'uint256' },
    ],
  },
  // Write functions
  {
    name: 'createProduct',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_productType', type: 'uint8' },
      { name: '_premiumRate', type: 'uint256' },
      { name: '_coverageRate', type: 'uint256' },
      { name: '_minCoverage', type: 'uint256' },
      { name: '_maxCoverage', type: 'uint256' },
      { name: '_durationDays', type: 'uint256' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'updateProduct',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_productId', type: 'uint256' },
      { name: '_premiumRate', type: 'uint256' },
      { name: '_coverageRate', type: 'uint256' },
      { name: '_minCoverage', type: 'uint256' },
      { name: '_maxCoverage', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'setProductActive',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_productId', type: 'uint256' },
      { name: '_isActive', type: 'bool' },
    ],
    outputs: [],
  },
  {
    name: 'processClaim',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_claimId', type: 'uint256' },
      { name: '_approved', type: 'bool' },
    ],
    outputs: [],
  },
  {
    name: 'setTreasuryFee',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_fee', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'pause',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'unpause',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'withdrawTreasury',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_amount', type: 'uint256' }],
    outputs: [],
  },
] as const;

// ============================================
// Contract Addresses
// ============================================

const CONTRACT_ADDRESSES = {
  staking: {
    [bsc.id]: process.env.NEXT_PUBLIC_STAKING_CONTRACT_BSC as `0x${string}`,
    [bscTestnet.id]: process.env.NEXT_PUBLIC_STAKING_CONTRACT_BSC_TESTNET as `0x${string}`,
  },
  insurance: {
    [bsc.id]: process.env.NEXT_PUBLIC_INSURANCE_CONTRACT_BSC as `0x${string}`,
    [bscTestnet.id]: process.env.NEXT_PUBLIC_INSURANCE_CONTRACT_BSC_TESTNET as `0x${string}`,
  },
};

// ============================================
// Types
// ============================================

export interface TokenConfig {
  address: `0x${string}`;
  tokenName: string;
  decimals: number;
  baseApy: number;
  rewardMultiplier: number;
  minStakeAmount: string;
  priceFeed: `0x${string}`;
}

export interface InsuranceProduct {
  productType: number;
  premiumRate: number;
  coverageRate: number;
  minCoverage: string;
  maxCoverage: string;
  durationDays: number;
}

export interface FundAllocation {
  devFundRatio: number;
  liquidityRatio: number;
  rewardRatio: number;
  reserveRatio: number;
}

// ============================================
// Hooks
// ============================================

/**
 * 检查是否是合约 Owner
 */
export function useIsContractOwner(contractType: 'staking' | 'insurance') {
  const { address, chainId } = useAccount();
  
  const contractAddress = chainId 
    ? CONTRACT_ADDRESSES[contractType][chainId as keyof typeof CONTRACT_ADDRESSES['staking']]
    : undefined;

  const { data: owner } = useReadContract({
    address: contractAddress,
    abi: contractType === 'staking' ? STAKING_ADMIN_ABI : INSURANCE_ADMIN_ABI,
    functionName: 'owner',
    query: {
      enabled: !!contractAddress,
    },
  });

  return {
    isOwner: address && owner ? address.toLowerCase() === (owner as string).toLowerCase() : false,
    owner: owner as string | undefined,
  };
}

/**
 * 检查合约是否暂停
 */
export function useContractPaused(contractType: 'staking' | 'insurance') {
  const { chainId } = useAccount();
  
  const contractAddress = chainId 
    ? CONTRACT_ADDRESSES[contractType][chainId as keyof typeof CONTRACT_ADDRESSES['staking']]
    : undefined;

  const { data: paused, refetch } = useReadContract({
    address: contractAddress,
    abi: contractType === 'staking' ? STAKING_ADMIN_ABI : INSURANCE_ADMIN_ABI,
    functionName: 'paused',
    query: {
      enabled: !!contractAddress,
    },
  });

  return {
    paused: paused as boolean | undefined,
    refetch,
  };
}

/**
 * 添加可质押代币
 */
export function useAddStakeableToken() {
  const { chainId } = useAccount();
  const [isPending, setIsPending] = useState(false);
  
  const contractAddress = chainId 
    ? CONTRACT_ADDRESSES.staking[chainId as keyof typeof CONTRACT_ADDRESSES['staking']]
    : undefined;

  const { writeContractAsync } = useWriteContract();

  const addToken = useCallback(
    async (config: TokenConfig) => {
      if (!contractAddress) throw new Error('Contract not found');
      
      setIsPending(true);
      try {
        const hash = await writeContractAsync({
          address: contractAddress,
          abi: STAKING_ADMIN_ABI,
          functionName: 'addStakeableToken',
          args: [
            config.address,
            config.tokenName,
            config.decimals,
            BigInt(config.baseApy),
            BigInt(config.rewardMultiplier),
            parseUnits(config.minStakeAmount, config.decimals),
            config.priceFeed,
          ],
        });
        return hash;
      } finally {
        setIsPending(false);
      }
    },
    [contractAddress, writeContractAsync]
  );

  return { addToken, isPending };
}

/**
 * 更新代币配置
 */
export function useUpdateTokenConfig() {
  const { chainId } = useAccount();
  const [isPending, setIsPending] = useState(false);
  
  const contractAddress = chainId 
    ? CONTRACT_ADDRESSES.staking[chainId as keyof typeof CONTRACT_ADDRESSES['staking']]
    : undefined;

  const { writeContractAsync } = useWriteContract();

  const updateConfig = useCallback(
    async (
      tokenAddress: `0x${string}`,
      baseApy: number,
      rewardMultiplier: number,
      minStakeAmount: string,
      decimals: number
    ) => {
      if (!contractAddress) throw new Error('Contract not found');
      
      setIsPending(true);
      try {
        const hash = await writeContractAsync({
          address: contractAddress,
          abi: STAKING_ADMIN_ABI,
          functionName: 'updateTokenConfig',
          args: [
            tokenAddress,
            BigInt(baseApy),
            BigInt(rewardMultiplier),
            parseUnits(minStakeAmount, decimals),
          ],
        });
        return hash;
      } finally {
        setIsPending(false);
      }
    },
    [contractAddress, writeContractAsync]
  );

  return { updateConfig, isPending };
}

/**
 * 设置代币激活状态
 */
export function useSetTokenActive() {
  const { chainId } = useAccount();
  const [isPending, setIsPending] = useState(false);
  
  const contractAddress = chainId 
    ? CONTRACT_ADDRESSES.staking[chainId as keyof typeof CONTRACT_ADDRESSES['staking']]
    : undefined;

  const { writeContractAsync } = useWriteContract();

  const setActive = useCallback(
    async (tokenAddress: `0x${string}`, isActive: boolean) => {
      if (!contractAddress) throw new Error('Contract not found');
      
      setIsPending(true);
      try {
        const hash = await writeContractAsync({
          address: contractAddress,
          abi: STAKING_ADMIN_ABI,
          functionName: 'setTokenActive',
          args: [tokenAddress, isActive],
        });
        return hash;
      } finally {
        setIsPending(false);
      }
    },
    [contractAddress, writeContractAsync]
  );

  return { setActive, isPending };
}

/**
 * 暂停/恢复合约
 */
export function useTogglePause(contractType: 'staking' | 'insurance') {
  const { chainId } = useAccount();
  const [isPending, setIsPending] = useState(false);
  
  const contractAddress = chainId 
    ? CONTRACT_ADDRESSES[contractType][chainId as keyof typeof CONTRACT_ADDRESSES['staking']]
    : undefined;

  const { writeContractAsync } = useWriteContract();

  const togglePause = useCallback(
    async (shouldPause: boolean) => {
      if (!contractAddress) throw new Error('Contract not found');
      
      setIsPending(true);
      try {
        const hash = await writeContractAsync({
          address: contractAddress,
          abi: contractType === 'staking' ? STAKING_ADMIN_ABI : INSURANCE_ADMIN_ABI,
          functionName: shouldPause ? 'pause' : 'unpause',
        });
        return hash;
      } finally {
        setIsPending(false);
      }
    },
    [contractAddress, contractType, writeContractAsync]
  );

  return { togglePause, isPending };
}

/**
 * 更新资金分配
 */
export function useUpdateFundAllocation() {
  const { chainId } = useAccount();
  const [isPending, setIsPending] = useState(false);
  
  const contractAddress = chainId 
    ? CONTRACT_ADDRESSES.staking[chainId as keyof typeof CONTRACT_ADDRESSES['staking']]
    : undefined;

  const { writeContractAsync } = useWriteContract();

  const updateAllocation = useCallback(
    async (allocation: FundAllocation) => {
      if (!contractAddress) throw new Error('Contract not found');
      
      // 验证总和为 100%
      const total = allocation.devFundRatio + allocation.liquidityRatio + 
                   allocation.rewardRatio + allocation.reserveRatio;
      if (total !== 10000) {
        throw new Error('Allocation must sum to 100% (10000 basis points)');
      }
      
      setIsPending(true);
      try {
        const hash = await writeContractAsync({
          address: contractAddress,
          abi: STAKING_ADMIN_ABI,
          functionName: 'updateFundAllocation',
          args: [
            BigInt(allocation.devFundRatio),
            BigInt(allocation.liquidityRatio),
            BigInt(allocation.rewardRatio),
            BigInt(allocation.reserveRatio),
          ],
        });
        return hash;
      } finally {
        setIsPending(false);
      }
    },
    [contractAddress, writeContractAsync]
  );

  return { updateAllocation, isPending };
}

/**
 * 创建保险产品
 */
export function useCreateInsuranceProduct() {
  const { chainId } = useAccount();
  const [isPending, setIsPending] = useState(false);
  
  const contractAddress = chainId 
    ? CONTRACT_ADDRESSES.insurance[chainId as keyof typeof CONTRACT_ADDRESSES['insurance']]
    : undefined;

  const { writeContractAsync } = useWriteContract();

  const createProduct = useCallback(
    async (product: InsuranceProduct) => {
      if (!contractAddress) throw new Error('Contract not found');
      
      setIsPending(true);
      try {
        const hash = await writeContractAsync({
          address: contractAddress,
          abi: INSURANCE_ADMIN_ABI,
          functionName: 'createProduct',
          args: [
            product.productType,
            BigInt(product.premiumRate),
            BigInt(product.coverageRate),
            parseEther(product.minCoverage),
            parseEther(product.maxCoverage),
            BigInt(product.durationDays),
          ],
        });
        return hash;
      } finally {
        setIsPending(false);
      }
    },
    [contractAddress, writeContractAsync]
  );

  return { createProduct, isPending };
}

/**
 * 更新保险产品
 */
export function useUpdateInsuranceProduct() {
  const { chainId } = useAccount();
  const [isPending, setIsPending] = useState(false);
  
  const contractAddress = chainId 
    ? CONTRACT_ADDRESSES.insurance[chainId as keyof typeof CONTRACT_ADDRESSES['insurance']]
    : undefined;

  const { writeContractAsync } = useWriteContract();

  const updateProduct = useCallback(
    async (
      productId: number,
      premiumRate: number,
      coverageRate: number,
      minCoverage: string,
      maxCoverage: string
    ) => {
      if (!contractAddress) throw new Error('Contract not found');
      
      setIsPending(true);
      try {
        const hash = await writeContractAsync({
          address: contractAddress,
          abi: INSURANCE_ADMIN_ABI,
          functionName: 'updateProduct',
          args: [
            BigInt(productId),
            BigInt(premiumRate),
            BigInt(coverageRate),
            parseEther(minCoverage),
            parseEther(maxCoverage),
          ],
        });
        return hash;
      } finally {
        setIsPending(false);
      }
    },
    [contractAddress, writeContractAsync]
  );

  return { updateProduct, isPending };
}

/**
 * 处理理赔
 */
export function useProcessClaim() {
  const { chainId } = useAccount();
  const [isPending, setIsPending] = useState(false);
  
  const contractAddress = chainId 
    ? CONTRACT_ADDRESSES.insurance[chainId as keyof typeof CONTRACT_ADDRESSES['insurance']]
    : undefined;

  const { writeContractAsync } = useWriteContract();

  const processClaim = useCallback(
    async (claimId: number, approved: boolean) => {
      if (!contractAddress) throw new Error('Contract not found');
      
      setIsPending(true);
      try {
        const hash = await writeContractAsync({
          address: contractAddress,
          abi: INSURANCE_ADMIN_ABI,
          functionName: 'processClaim',
          args: [BigInt(claimId), approved],
        });
        return hash;
      } finally {
        setIsPending(false);
      }
    },
    [contractAddress, writeContractAsync]
  );

  return { processClaim, isPending };
}

/**
 * 组合 Hook - Admin 合约管理
 */
export function useAdminContract() {
  const { address, chainId, isConnected } = useAccount();
  
  const stakingOwner = useIsContractOwner('staking');
  const insuranceOwner = useIsContractOwner('insurance');
  const stakingPaused = useContractPaused('staking');
  const insurancePaused = useContractPaused('insurance');
  
  const addToken = useAddStakeableToken();
  const updateToken = useUpdateTokenConfig();
  const setTokenActive = useSetTokenActive();
  const toggleStakingPause = useTogglePause('staking');
  const toggleInsurancePause = useTogglePause('insurance');
  const updateFunds = useUpdateFundAllocation();
  const createProduct = useCreateInsuranceProduct();
  const updateProduct = useUpdateInsuranceProduct();
  const processClaim = useProcessClaim();

  return {
    // Connection state
    isConnected,
    address,
    chainId,
    
    // Owner checks
    isStakingOwner: stakingOwner.isOwner,
    isInsuranceOwner: insuranceOwner.isOwner,
    isAdmin: stakingOwner.isOwner || insuranceOwner.isOwner,
    
    // Contract states
    stakingPaused: stakingPaused.paused,
    insurancePaused: insurancePaused.paused,
    
    // Token management
    addToken,
    updateToken,
    setTokenActive,
    
    // Insurance management
    createProduct,
    updateProduct,
    processClaim,
    
    // System controls
    toggleStakingPause,
    toggleInsurancePause,
    updateFunds,
    
    // Refresh
    refetch: () => {
      stakingPaused.refetch();
      insurancePaused.refetch();
    },
  };
}

export type { TokenConfig, InsuranceProduct, FundAllocation };
