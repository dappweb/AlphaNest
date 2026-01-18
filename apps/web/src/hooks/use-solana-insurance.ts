/**
 * Solana CowGuard Insurance Hooks
 * Solana (pump.fun) 保险协议 - Meme 代币风险保护
 * 
 * 使用 @solana/web3.js + @coral-xyz/anchor
 */

import { useCallback, useMemo, useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Program ID - 对应 Solana 合约
const PROGRAM_ID = new PublicKey('212XVhDqD21uFt1DfCuJ7WkVjcZZQCZRHDi3qeXTCqCH');

// PDAs
const PROTOCOL_SEED = 'protocol';
const PRODUCT_SEED = 'product';
const POLICY_SEED = 'policy';
const CLAIM_SEED = 'claim';

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

// 理赔类型枚举
export enum ClaimType {
  RugPull = 0,
  PriceDrop = 1,
  ContractExploit = 2,
  Other = 3,
}

// 理赔状态枚举
export enum ClaimStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

// Types
export interface SolanaProtocolInfo {
  authority: string;
  treasury: string;
  treasuryFee: number;
  totalPolicies: number;
  totalClaims: number;
  totalPayouts: number;
  isPaused: boolean;
}

export interface SolanaProductInfo {
  authority: string;
  productType: InsuranceType;
  premiumRate: number; // 百分比
  coverageRate: number; // 百分比
  minCoverage: number;
  maxCoverage: number;
  durationDays: number;
  totalPolicies: number;
  totalCoverage: number;
  isActive: boolean;
}

export interface SolanaPolicyInfo {
  owner: string;
  product: string;
  coverageAmount: number;
  premiumPaid: number;
  startTime: number;
  endTime: number;
  status: PolicyStatus;
  isExpired: boolean;
}

export interface SolanaClaimInfo {
  policy: string;
  claimant: string;
  claimType: ClaimType;
  claimAmount: number;
  evidenceHash: string;
  status: ClaimStatus;
  submittedAt: number;
  processedAt: number | null;
  payoutAmount: number | null;
}

// ============================================
// Helper Functions
// ============================================

function getProtocolPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(PROTOCOL_SEED)],
    PROGRAM_ID
  );
}

function getProductPDA(productType: InsuranceType): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(PRODUCT_SEED), Buffer.from([productType])],
    PROGRAM_ID
  );
}

function getPolicyPDA(userPubkey: PublicKey, productPubkey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(POLICY_SEED), userPubkey.toBuffer(), productPubkey.toBuffer()],
    PROGRAM_ID
  );
}

function getClaimPDA(policyPubkey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(CLAIM_SEED), policyPubkey.toBuffer()],
    PROGRAM_ID
  );
}

// ============================================
// Hooks
// ============================================

/**
 * 获取协议信息
 */
export function useSolanaProtocolInfo() {
  const { connection } = useConnection();
  const [protocolInfo, setProtocolInfo] = useState<SolanaProtocolInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchProtocolInfo = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [protocolPDA] = getProtocolPDA();
      const accountInfo = await connection.getAccountInfo(protocolPDA);
      
      if (accountInfo) {
        // 解析账户数据 (简化版)
        setProtocolInfo({
          authority: protocolPDA.toBase58(),
          treasury: '',
          treasuryFee: 200, // 2%
          totalPolicies: 0,
          totalClaims: 0,
          totalPayouts: 0,
          isPaused: false,
        });
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [connection]);

  useEffect(() => {
    fetchProtocolInfo();
  }, [fetchProtocolInfo]);

  return { protocolInfo, isLoading, error, refetch: fetchProtocolInfo };
}

/**
 * 获取保险产品信息
 */
export function useSolanaProductInfo(productType: InsuranceType) {
  const { connection } = useConnection();
  const [productInfo, setProductInfo] = useState<SolanaProductInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchProductInfo = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [productPDA] = getProductPDA(productType);
      const accountInfo = await connection.getAccountInfo(productPDA);
      
      if (accountInfo) {
        // 解析账户数据 (简化版)
        // 实际需要根据 IDL 解析
        const defaultProducts: Record<InsuranceType, Partial<SolanaProductInfo>> = {
          [InsuranceType.RugPull]: {
            premiumRate: 5,
            coverageRate: 80,
            minCoverage: 100,
            maxCoverage: 10000,
            durationDays: 30,
          },
          [InsuranceType.PriceDrop]: {
            premiumRate: 8,
            coverageRate: 60,
            minCoverage: 100,
            maxCoverage: 5000,
            durationDays: 14,
          },
          [InsuranceType.SmartContract]: {
            premiumRate: 3,
            coverageRate: 100,
            minCoverage: 500,
            maxCoverage: 50000,
            durationDays: 90,
          },
          [InsuranceType.Comprehensive]: {
            premiumRate: 10,
            coverageRate: 100,
            minCoverage: 200,
            maxCoverage: 20000,
            durationDays: 30,
          },
        };
        
        setProductInfo({
          authority: productPDA.toBase58(),
          productType,
          premiumRate: defaultProducts[productType].premiumRate || 5,
          coverageRate: defaultProducts[productType].coverageRate || 80,
          minCoverage: defaultProducts[productType].minCoverage || 100,
          maxCoverage: defaultProducts[productType].maxCoverage || 10000,
          durationDays: defaultProducts[productType].durationDays || 30,
          totalPolicies: 0,
          totalCoverage: 0,
          isActive: true,
        });
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [connection, productType]);

  useEffect(() => {
    fetchProductInfo();
  }, [fetchProductInfo]);

  return { productInfo, isLoading, error, refetch: fetchProductInfo };
}

/**
 * 获取用户保单列表
 */
export function useSolanaPolicies() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [policies, setPolicies] = useState<SolanaPolicyInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPolicies = useCallback(async () => {
    if (!publicKey) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 查询所有产品类型的保单
      const allPolicies: SolanaPolicyInfo[] = [];
      
      for (const productType of Object.values(InsuranceType).filter(v => typeof v === 'number')) {
        const [productPDA] = getProductPDA(productType as InsuranceType);
        const [policyPDA] = getPolicyPDA(publicKey, productPDA);
        
        const accountInfo = await connection.getAccountInfo(policyPDA);
        
        if (accountInfo) {
          const now = Math.floor(Date.now() / 1000);
          // 解析保单数据 (简化版)
          allPolicies.push({
            owner: publicKey.toBase58(),
            product: productPDA.toBase58(),
            coverageAmount: 0,
            premiumPaid: 0,
            startTime: 0,
            endTime: 0,
            status: PolicyStatus.Active,
            isExpired: false,
          });
        }
      }
      
      setPolicies(allPolicies);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [connection, publicKey]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  return { policies, isLoading, error, refetch: fetchPolicies };
}

/**
 * 计算保费
 */
export function useCalculatePremium(productType: InsuranceType, coverageAmount: number) {
  const { productInfo } = useSolanaProductInfo(productType);
  
  const premium = useMemo(() => {
    if (!productInfo || coverageAmount <= 0) return 0;
    return (coverageAmount * productInfo.premiumRate) / 100;
  }, [productInfo, coverageAmount]);

  return { premium };
}

/**
 * 购买保险
 */
export function useSolanaPurchaseInsurance() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const purchaseInsurance = useCallback(
    async (productType: InsuranceType, coverageAmount: number) => {
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error('Wallet not connected');
      }

      setIsPending(true);
      setIsSuccess(false);
      setError(null);
      setTxHash(null);

      try {
        const [protocolPDA] = getProtocolPDA();
        const [productPDA] = getProductPDA(productType);
        const [policyPDA] = getPolicyPDA(wallet.publicKey, productPDA);

        console.log(`Purchasing insurance: type=${productType}, coverage=${coverageAmount}`);
        
        // 实际实现需要使用 Anchor
        // 模拟成功
        setTxHash('simulated_tx_hash');
        setIsSuccess(true);
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setIsPending(false);
      }
    },
    [connection, wallet]
  );

  return {
    purchaseInsurance,
    isPending,
    isSuccess,
    error,
    txHash,
  };
}

/**
 * 提交理赔
 */
export function useSolanaSubmitClaim() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const submitClaim = useCallback(
    async (
      policyPubkey: string,
      claimType: ClaimType,
      claimAmount: number,
      evidenceHash: string
    ) => {
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error('Wallet not connected');
      }

      setIsPending(true);
      setIsSuccess(false);
      setError(null);
      setTxHash(null);

      try {
        const policyKey = new PublicKey(policyPubkey);
        const [claimPDA] = getClaimPDA(policyKey);

        console.log(`Submitting claim: type=${claimType}, amount=${claimAmount}`);
        
        // 实际实现需要使用 Anchor
        // 模拟成功
        setTxHash('simulated_tx_hash');
        setIsSuccess(true);
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setIsPending(false);
      }
    },
    [connection, wallet]
  );

  return {
    submitClaim,
    isPending,
    isSuccess,
    error,
    txHash,
  };
}

/**
 * 取消保单
 */
export function useSolanaCancelPolicy() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const cancelPolicy = useCallback(
    async (policyPubkey: string) => {
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error('Wallet not connected');
      }

      setIsPending(true);
      setIsSuccess(false);
      setError(null);

      try {
        console.log(`Cancelling policy: ${policyPubkey}`);
        
        // 实际实现需要使用 Anchor
        // 模拟成功
        setIsSuccess(true);
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setIsPending(false);
      }
    },
    [connection, wallet]
  );

  return {
    cancelPolicy,
    isPending,
    isSuccess,
    error,
  };
}

/**
 * 获取 USDC 余额 (Solana)
 */
export function useSolanaUsdcBalance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  // Solana USDC Mint
  const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

  const fetchBalance = useCallback(async () => {
    if (!publicKey) return;
    
    setIsLoading(true);
    try {
      // 获取用户的 USDC ATA
      const { getAssociatedTokenAddress } = await import('@solana/spl-token');
      const ata = await getAssociatedTokenAddress(USDC_MINT, publicKey);
      
      const accountInfo = await connection.getAccountInfo(ata);
      if (accountInfo) {
        // 解析 token account 数据获取余额
        // 简化版，实际需要正确解析
        setBalance(0);
      }
    } catch (err) {
      console.error('Failed to fetch USDC balance:', err);
    } finally {
      setIsLoading(false);
    }
  }, [connection, publicKey]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, isLoading, refetch: fetchBalance };
}

/**
 * 组合 Hook - Solana (pump.fun) 完整保险管理
 */
export function useSolanaInsurance() {
  const { publicKey, connected } = useWallet();
  const { protocolInfo, isLoading: loadingProtocol, refetch: refetchProtocol } = useSolanaProtocolInfo();
  const { policies, isLoading: loadingPolicies, refetch: refetchPolicies } = useSolanaPolicies();
  const { balance: usdcBalance, isLoading: loadingBalance, refetch: refetchBalance } = useSolanaUsdcBalance();

  const purchaseAction = useSolanaPurchaseInsurance();
  const submitClaimAction = useSolanaSubmitClaim();
  const cancelAction = useSolanaCancelPolicy();

  const refetchAll = useCallback(() => {
    refetchProtocol();
    refetchPolicies();
    refetchBalance();
  }, [refetchProtocol, refetchPolicies, refetchBalance]);

  return {
    // User state
    isConnected: connected,
    publicKey: publicKey?.toBase58() || null,
    policies,
    usdcBalance,

    // Protocol state
    protocolInfo,

    // Loading states
    isLoading: loadingProtocol || loadingPolicies || loadingBalance,

    // Actions
    purchase: purchaseAction,
    submitClaim: submitClaimAction,
    cancel: cancelAction,

    // Refresh
    refetch: refetchAll,
  };
}

// Export constants and helpers
export {
  PROGRAM_ID,
  getProtocolPDA,
  getProductPDA,
  getPolicyPDA,
  getClaimPDA,
};
