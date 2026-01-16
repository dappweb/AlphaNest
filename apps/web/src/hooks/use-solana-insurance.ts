'use client';

import { useCallback, useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { SOLANA_PROGRAM_IDS } from '@/config/solana';

export interface InsurancePolicy {
  policyId: string;
  tokenAddress: string;
  tokenSymbol: string;
  coverageAmount: number;
  premium: number;
  expiryDate: number;
  status: 'active' | 'expired' | 'claimed';
}

export interface InsurancePool {
  tokenAddress: string;
  tokenSymbol: string;
  poolSize: number;
  totalCoverage: number;
  rugOdds: number;
  safeOdds: number;
  expiryDate: number;
}

export function useSolanaInsurance() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, connected } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [pools, setPools] = useState<InsurancePool[]>([]);

  // 获取保险池列表
  const fetchPools = useCallback(async () => {
    try {
      // TODO: 从链上获取实际保险池数据
      // const program = new Program(IDL, SOLANA_PROGRAM_IDS.COWGUARD_INSURANCE, provider);
      // const pools = await program.account.insurancePool.all();
      
      // 临时返回空数组
      setPools([]);
    } catch (err) {
      console.error('Failed to fetch insurance pools:', err);
      setError('Failed to fetch insurance pools');
    }
  }, [connection]);

  // 获取用户保单
  const fetchPolicies = useCallback(async () => {
    if (!publicKey || !connected) return;

    try {
      // TODO: 从链上获取用户保单
      // const program = new Program(IDL, SOLANA_PROGRAM_IDS.COWGUARD_INSURANCE, provider);
      // const policies = await program.account.policy.all([
      //   { memcmp: { offset: 8, bytes: publicKey.toBase58() } }
      // ]);
      
      // 临时返回空数组
      setPolicies([]);
    } catch (err) {
      console.error('Failed to fetch policies:', err);
      setError('Failed to fetch policies');
    }
  }, [publicKey, connection, connected]);

  // 购买保险
  const purchaseInsurance = useCallback(async (
    tokenAddress: string,
    coverageAmount: number,
    premium: number
  ) => {
    if (!publicKey || !signTransaction || !connected) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: 构建购买保险交易
      // const program = new Program(IDL, SOLANA_PROGRAM_IDS.COWGUARD_INSURANCE, provider);
      // const tx = await program.methods
      //   .purchaseInsurance(
      //     new PublicKey(tokenAddress),
      //     new BN(coverageAmount * 1e6),
      //     new BN(premium * 1e6)
      //   )
      //   .accounts({...})
      //   .rpc();

      throw new Error('Purchase insurance not yet implemented - pending contract deployment');
    } catch (err: any) {
      const errorMessage = err.message || 'Purchase insurance failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, signTransaction, connected]);

  // 索赔
  const claimPayout = useCallback(async (policyId: string) => {
    if (!publicKey || !signTransaction || !connected) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: 构建索赔交易
      // const program = new Program(IDL, SOLANA_PROGRAM_IDS.COWGUARD_INSURANCE, provider);
      // const tx = await program.methods
      //   .claimPayout(new PublicKey(policyId))
      //   .accounts({...})
      //   .rpc();

      throw new Error('Claim payout not yet implemented - pending contract deployment');
    } catch (err: any) {
      const errorMessage = err.message || 'Claim failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, signTransaction, connected]);

  // 初始化时获取数据
  useEffect(() => {
    fetchPools();
    if (connected && publicKey) {
      fetchPolicies();
    }
  }, [connected, publicKey, fetchPools, fetchPolicies]);

  return {
    purchaseInsurance,
    claimPayout,
    policies,
    pools,
    isLoading,
    error,
    refetch: () => {
      fetchPools();
      fetchPolicies();
    },
  };
}
