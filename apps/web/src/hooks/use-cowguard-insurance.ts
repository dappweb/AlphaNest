/**
 * CowGuardInsurance Contract Hooks
 * 对齐 contracts/src/CowGuardInsurance.sol
 */

import { useCallback, useMemo } from 'react';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { parseUnits, formatUnits } from 'viem';

// Contract address
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_COWGUARD_INSURANCE_ADDRESS as `0x${string}` || '0x0000000000000000000000000000000000000000';
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}` || '0x0000000000000000000000000000000000000000';

// Contract ABI - 对齐 CowGuardInsurance.sol
const COWGUARD_INSURANCE_ABI = [
  // 购买保险
  {
    name: 'purchaseInsurance',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'productId', type: 'uint256' },
      { name: 'coverageAmount', type: 'uint256' },
    ],
    outputs: [{ name: 'policyId', type: 'uint256' }],
  },
  // 取消保单
  {
    name: 'cancelPolicy',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'policyId', type: 'uint256' }],
    outputs: [],
  },
  // 提交理赔
  {
    name: 'submitClaim',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'policyId', type: 'uint256' },
      { name: 'claimType', type: 'uint8' },
      { name: 'claimAmount', type: 'uint256' },
      { name: 'evidenceHash', type: 'bytes32' },
    ],
    outputs: [{ name: 'claimId', type: 'uint256' }],
  },
  // 获取产品信息
  {
    name: 'getProductInfo',
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
      { name: 'productTotalPolicies', type: 'uint256' },
      { name: 'productTotalCoverage', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
    ],
  },
  // 获取保单信息
  {
    name: 'getPolicyInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'policyId', type: 'uint256' }],
    outputs: [
      { name: 'productId', type: 'uint256' },
      { name: 'holder', type: 'address' },
      { name: 'coverageAmount', type: 'uint256' },
      { name: 'premiumPaid', type: 'uint256' },
      { name: 'startTime', type: 'uint256' },
      { name: 'endTime', type: 'uint256' },
      { name: 'status', type: 'uint8' },
    ],
  },
  // 获取理赔信息
  {
    name: 'getClaimInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'claimId', type: 'uint256' }],
    outputs: [
      { name: 'policyId', type: 'uint256' },
      { name: 'claimant', type: 'address' },
      { name: 'claimType', type: 'uint8' },
      { name: 'claimAmount', type: 'uint256' },
      { name: 'status', type: 'uint8' },
      { name: 'submittedAt', type: 'uint256' },
      { name: 'processedAt', type: 'uint256' },
      { name: 'payoutAmount', type: 'uint256' },
    ],
  },
  // 获取用户保单列表
  {
    name: 'getUserPolicies',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  // 计算保费
  {
    name: 'calculatePremium',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'productId', type: 'uint256' },
      { name: 'coverageAmount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // 获取协议统计
  {
    name: 'getProtocolStats',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'productCount', type: 'uint256' },
      { name: 'policyCount', type: 'uint256' },
      { name: 'claimCount', type: 'uint256' },
      { name: 'payoutTotal', type: 'uint256' },
    ],
  },
  // 产品计数器
  {
    name: 'productCounter',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// 保险类型枚举
export enum InsuranceType {
  RugPull = 0,
  PriceDrop = 1,
  SmartContract = 2,
  Comprehensive = 3,
}

export const INSURANCE_TYPE_LABELS = {
  [InsuranceType.RugPull]: 'Rug Pull Protection',
  [InsuranceType.PriceDrop]: 'Price Drop Protection',
  [InsuranceType.SmartContract]: 'Smart Contract Coverage',
  [InsuranceType.Comprehensive]: 'Comprehensive Coverage',
};

export const INSURANCE_TYPE_ICONS = {
  [InsuranceType.RugPull]: '🚨',
  [InsuranceType.PriceDrop]: '📉',
  [InsuranceType.SmartContract]: '🔒',
  [InsuranceType.Comprehensive]: '🛡️',
};

// 保单状态枚举
export enum PolicyStatus {
  Active = 0,
  Expired = 1,
  Claimed = 2,
  Cancelled = 3,
}

export const POLICY_STATUS_LABELS = {
  [PolicyStatus.Active]: 'Active',
  [PolicyStatus.Expired]: 'Expired',
  [PolicyStatus.Claimed]: 'Claimed',
  [PolicyStatus.Cancelled]: 'Cancelled',
};

// 理赔状态枚举
export enum ClaimStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

// 理赔类型枚举
export enum ClaimType {
  RugPull = 0,
  PriceDrop = 1,
  ContractExploit = 2,
  Other = 3,
}

// Types
export interface ProductInfo {
  productType: InsuranceType;
  premiumRate: number; // 百分比
  coverageRate: number; // 百分比
  minCoverage: bigint;
  maxCoverage: bigint;
  durationDays: number;
  totalPolicies: bigint;
  totalCoverage: bigint;
  isActive: boolean;
  minCoverageFormatted: string;
  maxCoverageFormatted: string;
}

export interface PolicyInfo {
  productId: bigint;
  holder: string;
  coverageAmount: bigint;
  premiumPaid: bigint;
  startTime: bigint;
  endTime: bigint;
  status: PolicyStatus;
  coverageFormatted: string;
  premiumFormatted: string;
  isExpired: boolean;
}

export interface ClaimInfo {
  policyId: bigint;
  claimant: string;
  claimType: ClaimType;
  claimAmount: bigint;
  status: ClaimStatus;
  submittedAt: bigint;
  processedAt: bigint;
  payoutAmount: bigint;
}

export interface ProtocolStats {
  productCount: bigint;
  policyCount: bigint;
  claimCount: bigint;
  payoutTotal: bigint;
  payoutTotalFormatted: string;
}

// ============================================
// Hooks
// ============================================

/**
 * 获取产品信息
 */
export function useProductInfo(productId: number) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: COWGUARD_INSURANCE_ABI,
    functionName: 'getProductInfo',
    args: [BigInt(productId)],
    query: {
      enabled: !!CONTRACT_ADDRESS,
    },
  });

  const productInfo: ProductInfo | null = useMemo(() => {
    if (!data) return null;

    const [productType, premiumRate, coverageRate, minCoverage, maxCoverage, durationDays, totalPolicies, totalCoverage, isActive] = data;

    return {
      productType: productType as InsuranceType,
      premiumRate: Number(premiumRate) / 100, // basis points to %
      coverageRate: Number(coverageRate) / 100,
      minCoverage,
      maxCoverage,
      durationDays: Number(durationDays),
      totalPolicies,
      totalCoverage,
      isActive,
      minCoverageFormatted: formatUnits(minCoverage, 6),
      maxCoverageFormatted: formatUnits(maxCoverage, 6),
    };
  }, [data]);

  return { productInfo, isLoading, error, refetch };
}

/**
 * 获取保单信息
 */
export function usePolicyInfo(policyId: number) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: COWGUARD_INSURANCE_ABI,
    functionName: 'getPolicyInfo',
    args: [BigInt(policyId)],
    query: {
      enabled: !!CONTRACT_ADDRESS && policyId > 0,
    },
  });

  const policyInfo: PolicyInfo | null = useMemo(() => {
    if (!data) return null;

    const [productId, holder, coverageAmount, premiumPaid, startTime, endTime, status] = data;
    const now = BigInt(Math.floor(Date.now() / 1000));

    return {
      productId,
      holder,
      coverageAmount,
      premiumPaid,
      startTime,
      endTime,
      status: status as PolicyStatus,
      coverageFormatted: formatUnits(coverageAmount, 6),
      premiumFormatted: formatUnits(premiumPaid, 6),
      isExpired: now > endTime,
    };
  }, [data]);

  return { policyInfo, isLoading, error, refetch };
}

/**
 * 获取理赔信息
 */
export function useClaimInfo(claimId: number) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: COWGUARD_INSURANCE_ABI,
    functionName: 'getClaimInfo',
    args: [BigInt(claimId)],
    query: {
      enabled: !!CONTRACT_ADDRESS && claimId > 0,
    },
  });

  const claimInfo: ClaimInfo | null = useMemo(() => {
    if (!data) return null;

    const [policyId, claimant, claimType, claimAmount, status, submittedAt, processedAt, payoutAmount] = data;

    return {
      policyId,
      claimant,
      claimType: claimType as ClaimType,
      claimAmount,
      status: status as ClaimStatus,
      submittedAt,
      processedAt,
      payoutAmount,
    };
  }, [data]);

  return { claimInfo, isLoading, error, refetch };
}

/**
 * 获取用户保单列表
 */
export function useUserPolicies() {
  const { address } = useAccount();

  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: COWGUARD_INSURANCE_ABI,
    functionName: 'getUserPolicies',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!CONTRACT_ADDRESS,
    },
  });

  return {
    policyIds: (data || []) as bigint[],
    isLoading,
    error,
    refetch,
  };
}

/**
 * 计算保费
 */
export function useCalculatePremium(productId: number, coverageAmount: string) {
  const amountWei = coverageAmount ? parseUnits(coverageAmount, 6) : 0n;

  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: COWGUARD_INSURANCE_ABI,
    functionName: 'calculatePremium',
    args: [BigInt(productId), amountWei],
    query: {
      enabled: !!CONTRACT_ADDRESS && !!coverageAmount && Number(coverageAmount) > 0,
    },
  });

  return {
    premium: data ? formatUnits(data, 6) : '0',
    premiumRaw: data || 0n,
    isLoading,
    error,
  };
}

/**
 * 获取协议统计
 */
export function useProtocolStats() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: COWGUARD_INSURANCE_ABI,
    functionName: 'getProtocolStats',
    query: {
      enabled: !!CONTRACT_ADDRESS,
    },
  });

  const stats: ProtocolStats | null = useMemo(() => {
    if (!data) return null;

    const [productCount, policyCount, claimCount, payoutTotal] = data;

    return {
      productCount,
      policyCount,
      claimCount,
      payoutTotal,
      payoutTotalFormatted: formatUnits(payoutTotal, 6),
    };
  }, [data]);

  return { stats, isLoading, error, refetch };
}

/**
 * 获取产品数量
 */
export function useProductCount() {
  const { data, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: COWGUARD_INSURANCE_ABI,
    functionName: 'productCounter',
    query: {
      enabled: !!CONTRACT_ADDRESS,
    },
  });

  return {
    count: data ? Number(data) : 0,
    isLoading,
  };
}

/**
 * 购买保险
 */
export function usePurchaseInsurance() {
  const { address } = useAccount();
  const { writeContract: approve, data: approveHash } = useWriteContract();
  const { writeContract: purchase, data: purchaseHash, isPending, error } = useWriteContract();

  const { isLoading: isApproving, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: purchaseHash,
  });

  // Check allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACT_ADDRESS] : undefined,
    query: {
      enabled: !!address && !!CONTRACT_ADDRESS,
    },
  });

  const purchaseInsurance = useCallback(
    async (productId: number, coverageAmount: string) => {
      if (!address) throw new Error('Wallet not connected');

      const amount = parseUnits(coverageAmount, 6);

      // Check if approval needed (assuming premium < coverage)
      if (!allowance || allowance < amount) {
        approve({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [CONTRACT_ADDRESS, amount * 2n], // Approve extra for premium
        });
        return 'approving';
      }

      purchase({
        address: CONTRACT_ADDRESS,
        abi: COWGUARD_INSURANCE_ABI,
        functionName: 'purchaseInsurance',
        args: [BigInt(productId), amount],
      });
      return 'purchasing';
    },
    [address, allowance, approve, purchase]
  );

  return {
    purchaseInsurance,
    isApproving,
    isPurchasing: isPending || isConfirming,
    isApproveSuccess,
    isSuccess,
    approveHash,
    purchaseHash,
    error,
    refetchAllowance,
  };
}

/**
 * 取消保单
 */
export function useCancelPolicy() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const cancelPolicy = useCallback(
    async (policyId: number) => {
      if (!CONTRACT_ADDRESS) throw new Error('Contract not configured');

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: COWGUARD_INSURANCE_ABI,
        functionName: 'cancelPolicy',
        args: [BigInt(policyId)],
      });
    },
    [writeContract]
  );

  return {
    cancelPolicy,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * 提交理赔
 */
export function useSubmitClaim() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const submitClaim = useCallback(
    async (policyId: number, claimType: ClaimType, claimAmount: string, evidenceHash: `0x${string}`) => {
      if (!CONTRACT_ADDRESS) throw new Error('Contract not configured');

      const amount = parseUnits(claimAmount, 6);

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: COWGUARD_INSURANCE_ABI,
        functionName: 'submitClaim',
        args: [BigInt(policyId), claimType, amount, evidenceHash],
      });
    },
    [writeContract]
  );

  return {
    submitClaim,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * USDC 余额
 */
export function useUsdcBalance() {
  const { address } = useAccount();

  const { data, isLoading, refetch } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!USDC_ADDRESS,
    },
  });

  return {
    balance: data ? formatUnits(data, 6) : '0',
    balanceRaw: data || 0n,
    isLoading,
    refetch,
  };
}

/**
 * 组合 Hook - 完整保险管理
 */
export function useCowGuardInsurance() {
  const { address } = useAccount();
  const { policyIds, isLoading: loadingPolicies, refetch: refetchPolicies } = useUserPolicies();
  const { stats: protocolStats, isLoading: loadingStats, refetch: refetchStats } = useProtocolStats();
  const { count: productCount, isLoading: loadingCount } = useProductCount();
  const { balance: usdcBalance, isLoading: loadingBalance, refetch: refetchBalance } = useUsdcBalance();

  const purchaseAction = usePurchaseInsurance();
  const cancelAction = useCancelPolicy();
  const claimAction = useSubmitClaim();

  const refetchAll = useCallback(() => {
    refetchPolicies();
    refetchStats();
    refetchBalance();
  }, [refetchPolicies, refetchStats, refetchBalance]);

  return {
    // User state
    isConnected: !!address,
    policyIds,
    usdcBalance,

    // Protocol state
    protocolStats,
    productCount,

    // Loading states
    isLoading: loadingPolicies || loadingStats || loadingCount || loadingBalance,

    // Actions
    purchase: purchaseAction,
    cancel: cancelAction,
    submitClaim: claimAction,

    // Refresh
    refetch: refetchAll,
  };
}
