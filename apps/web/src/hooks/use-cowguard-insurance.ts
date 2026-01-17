'use client';

import { useCallback, useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { 
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  getAccount,
} from '@solana/spl-token';

// 保险程序 ID (部署后填入)
const INSURANCE_PROGRAM_ID = new PublicKey('212XVhDqD21uFt1DfCuJ7WkVjcZZQCZRHDi3qeXTCqCH');

// USDC 代币地址
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

// 保险类型
export enum InsuranceType {
  RugPull = 0,
  PriceDrop = 1,
  SmartContract = 2,
  Comprehensive = 3,
}

// 保单状态
export enum PolicyStatus {
  Active = 'active',
  Expired = 'expired',
  Claimed = 'claimed',
  Cancelled = 'cancelled',
}

// 理赔状态
export enum ClaimStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

// 保险产品
export interface InsuranceProduct {
  id: number;
  type: InsuranceType;
  name: string;
  premiumRate: number; // 基点
  coverageRate: number; // 基点
  minCoverage: number;
  maxCoverage: number;
  durationDays: number;
  isActive: boolean;
}

// 保单
export interface InsurancePolicy {
  id: string;
  owner: PublicKey;
  product: PublicKey;
  coverageAmount: number;
  premiumPaid: number;
  startTime: number;
  endTime: number;
  status: PolicyStatus;
}

// 理赔
export interface InsuranceClaim {
  id: string;
  policy: PublicKey;
  claimant: PublicKey;
  claimType: InsuranceType;
  claimAmount: number;
  evidenceHash: string;
  status: ClaimStatus;
  submittedAt: number;
  processedAt?: number;
  payoutAmount?: number;
}

export function useCowGuardInsurance() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, connected } = useWallet();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<InsuranceProduct[]>([]);
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [usdcBalance, setUsdcBalance] = useState(0);

  // 获取 USDC 余额
  const fetchUsdcBalance = useCallback(async () => {
    if (!publicKey || !connected) return;

    try {
      const usdcAta = await getAssociatedTokenAddress(USDC_MINT, publicKey);
      const account = await getAccount(connection, usdcAta);
      setUsdcBalance(Number(account.amount) / 1e6);
    } catch {
      setUsdcBalance(0);
    }
  }, [publicKey, connection, connected]);

  // 获取保险产品列表
  const fetchProducts = useCallback(async () => {
    try {
      // TODO: 从链上获取保险产品
      // 目前返回默认产品配置
      const defaultProducts: InsuranceProduct[] = [
        {
          id: 0,
          type: InsuranceType.RugPull,
          name: 'Rug Pull 保险',
          premiumRate: 500,
          coverageRate: 8000,
          minCoverage: 100,
          maxCoverage: 50000,
          durationDays: 30,
          isActive: true,
        },
        {
          id: 1,
          type: InsuranceType.PriceDrop,
          name: '价格下跌保险',
          premiumRate: 300,
          coverageRate: 7000,
          minCoverage: 50,
          maxCoverage: 100000,
          durationDays: 14,
          isActive: true,
        },
        {
          id: 2,
          type: InsuranceType.SmartContract,
          name: '智能合约保险',
          premiumRate: 200,
          coverageRate: 9000,
          minCoverage: 100,
          maxCoverage: 200000,
          durationDays: 90,
          isActive: true,
        },
        {
          id: 3,
          type: InsuranceType.Comprehensive,
          name: '综合保险',
          premiumRate: 800,
          coverageRate: 8500,
          minCoverage: 500,
          maxCoverage: 500000,
          durationDays: 30,
          isActive: true,
        },
      ];
      setProducts(defaultProducts);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  }, []);

  // 获取用户保单
  const fetchPolicies = useCallback(async () => {
    if (!publicKey || !connected) return;

    try {
      // TODO: 从链上获取用户保单
      setPolicies([]);
    } catch (err) {
      console.error('Failed to fetch policies:', err);
    }
  }, [publicKey, connected]);

  // 获取用户理赔记录
  const fetchClaims = useCallback(async () => {
    if (!publicKey || !connected) return;

    try {
      // TODO: 从链上获取理赔记录
      setClaims([]);
    } catch (err) {
      console.error('Failed to fetch claims:', err);
    }
  }, [publicKey, connected]);

  // 购买保险
  const purchaseInsurance = useCallback(async (
    productType: InsuranceType,
    coverageAmount: number,
    durationDays: number
  ) => {
    if (!publicKey || !signTransaction || !connected) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      // 计算保费
      const product = products.find(p => p.type === productType);
      if (!product) throw new Error('Product not found');
      
      const premium = (coverageAmount * product.premiumRate) / 10000;
      
      if (usdcBalance < premium) {
        throw new Error('Insufficient USDC balance');
      }

      // TODO: 构建购买保险交易
      // const program = new Program(IDL, INSURANCE_PROGRAM_ID, provider);
      // const tx = await program.methods
      //   .purchaseInsurance(new BN(coverageAmount * 1e6))
      //   .accounts({...})
      //   .rpc();

      // 模拟交易
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 刷新数据
      await Promise.all([fetchUsdcBalance(), fetchPolicies()]);

      return 'mock-signature';
    } catch (err: any) {
      const errorMessage = err.message || 'Purchase failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, signTransaction, connected, products, usdcBalance, fetchUsdcBalance, fetchPolicies]);

  // 提交理赔
  const submitClaim = useCallback(async (
    policyId: string,
    claimType: InsuranceType,
    claimAmount: number,
    evidenceHash: string
  ) => {
    if (!publicKey || !signTransaction || !connected) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: 构建理赔交易
      // const program = new Program(IDL, INSURANCE_PROGRAM_ID, provider);
      // const tx = await program.methods
      //   .submitClaim(claimType, new BN(claimAmount * 1e6), evidenceHashBytes)
      //   .accounts({...})
      //   .rpc();

      // 模拟交易
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 刷新数据
      await fetchClaims();

      return 'mock-signature';
    } catch (err: any) {
      const errorMessage = err.message || 'Claim submission failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, signTransaction, connected, fetchClaims]);

  // 取消保单
  const cancelPolicy = useCallback(async (policyId: string) => {
    if (!publicKey || !signTransaction || !connected) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: 构建取消保单交易
      // const program = new Program(IDL, INSURANCE_PROGRAM_ID, provider);
      // const tx = await program.methods
      //   .cancelPolicy()
      //   .accounts({...})
      //   .rpc();

      // 模拟交易
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 刷新数据
      await Promise.all([fetchUsdcBalance(), fetchPolicies()]);

      return 'mock-signature';
    } catch (err: any) {
      const errorMessage = err.message || 'Cancel failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, signTransaction, connected, fetchUsdcBalance, fetchPolicies]);

  // 计算保费
  const calculatePremium = useCallback((
    productType: InsuranceType,
    coverageAmount: number
  ) => {
    const product = products.find(p => p.type === productType);
    if (!product) return 0;
    return (coverageAmount * product.premiumRate) / 10000;
  }, [products]);

  // 计算最高赔付
  const calculateMaxPayout = useCallback((
    productType: InsuranceType,
    coverageAmount: number
  ) => {
    const product = products.find(p => p.type === productType);
    if (!product) return 0;
    return (coverageAmount * product.coverageRate) / 10000;
  }, [products]);

  // 初始化
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (connected && publicKey) {
      fetchUsdcBalance();
      fetchPolicies();
      fetchClaims();
    }
  }, [connected, publicKey, fetchUsdcBalance, fetchPolicies, fetchClaims]);

  return {
    // 状态
    isLoading,
    error,
    products,
    policies,
    claims,
    usdcBalance,
    
    // 方法
    purchaseInsurance,
    submitClaim,
    cancelPolicy,
    calculatePremium,
    calculateMaxPayout,
    
    // 刷新
    refetch: () => {
      fetchProducts();
      fetchUsdcBalance();
      fetchPolicies();
      fetchClaims();
    },
  };
}

export default useCowGuardInsurance;
