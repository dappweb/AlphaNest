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
import { 
  STAKING_PROGRAM_ID,
  POPCOW_TOKEN_MINT,
  POPCOWDEFI_TOKEN_MINT,
} from '@/lib/solana/constants';
import { SOLANA_PROGRAM_IDS } from '@/config/solana';

export interface StakingPosition {
  poolId: number;
  tokenMint: PublicKey;
  stakedAmount: number;
  pendingRewards: number;
  startTime: number;
  lockEndTime: number | null;
}

export function useSolanaStaking() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, connected } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [positions, setPositions] = useState<StakingPosition[]>([]);
  const [tokenBalances, setTokenBalances] = useState<Record<string, number>>({});

  // 获取代币余额
  const fetchTokenBalances = useCallback(async () => {
    if (!publicKey || !connected) return;

    try {
      const balances: Record<string, number> = {};

      // 获取 POPCOW 代币余额
      try {
        const popcowAta = await getAssociatedTokenAddress(POPCOW_TOKEN_MINT, publicKey);
        const popcowAccount = await getAccount(connection, popcowAta);
        balances.POPCOW = Number(popcowAccount.amount) / Math.pow(10, 6);
      } catch {
        balances.POPCOW = 0;
      }

      // 获取 PopCowDefi 代币余额
      try {
        const popCowDefiAta = await getAssociatedTokenAddress(POPCOWDEFI_TOKEN_MINT, publicKey);
        const popCowDefiAccount = await getAccount(connection, popCowDefiAta);
        balances.PopCowDefi = Number(popCowDefiAccount.amount) / Math.pow(10, 9);
      } catch {
        balances.PopCowDefi = 0;
      }

      // 获取 SOL 余额
      const solBalance = await connection.getBalance(publicKey);
      balances.SOL = solBalance / 1e9;

      setTokenBalances(balances);
    } catch (err) {
      console.error('Failed to fetch token balances:', err);
    }
  }, [publicKey, connection, connected]);

  // 获取质押仓位
  const fetchStakingPositions = useCallback(async () => {
    if (!publicKey || !connected) return;

    try {
      // TODO: 从链上获取实际质押数据
      // 这里需要根据实际的程序结构来获取数据
      // 目前返回空数组，等待程序部署后实现
      setPositions([]);
    } catch (err) {
      console.error('Failed to fetch staking positions:', err);
      setError('Failed to fetch staking positions');
    }
  }, [publicKey, connection, connected]);

  // 质押代币
  const stake = useCallback(async (
    amount: number,
    poolId: number,
    tokenMint: PublicKey = POPCOW_TOKEN_MINT
  ) => {
    if (!publicKey || !signTransaction || !connected) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      // 获取用户代币账户
      const userTokenAccount = await getAssociatedTokenAddress(tokenMint, publicKey);

      // 检查账户是否存在
      let createAtaIx = null;
      try {
        await getAccount(connection, userTokenAccount);
      } catch {
        // 账户不存在，需要创建
        createAtaIx = createAssociatedTokenAccountInstruction(
          publicKey,
          userTokenAccount,
          publicKey,
          tokenMint
        );
      }

      // TODO: 构建实际的质押指令
      // 这里需要根据实际的程序 IDL 来构建交易
      // const program = new Program(IDL, STAKING_PROGRAM_ID, provider);
      // const tx = await program.methods
      //   .stake(new BN(amount * 1e6), new BN(poolId))
      //   .accounts({...})
      //   .rpc();

      // 临时实现：创建基础交易结构
      const transaction = new Transaction();

      if (createAtaIx) {
        transaction.add(createAtaIx);
      }

      // TODO: 添加实际的质押指令
      // transaction.add(stakeInstruction);

      transaction.feePayer = publicKey;
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      const signed = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        maxRetries: 2,
      });

      await connection.confirmTransaction(signature, 'confirmed');

      // 刷新数据
      await Promise.all([fetchTokenBalances(), fetchStakingPositions()]);

      return signature;
    } catch (err: any) {
      const errorMessage = err.message || 'Staking failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, signTransaction, connected, connection, fetchTokenBalances, fetchStakingPositions]);

  // 解除质押
  const unstake = useCallback(async (
    amount: number,
    poolId: number,
    tokenMint: PublicKey = POPCOW_TOKEN_MINT
  ) => {
    if (!publicKey || !signTransaction || !connected) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: 构建实际的解除质押指令
      // const program = new Program(IDL, STAKING_PROGRAM_ID, provider);
      // const tx = await program.methods
      //   .unstake(new BN(amount * 1e6), new BN(poolId))
      //   .accounts({...})
      //   .rpc();

      // 临时返回
      throw new Error('Unstaking not yet implemented - pending contract deployment');
    } catch (err: any) {
      const errorMessage = err.message || 'Unstaking failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, signTransaction, connected]);

  // 领取奖励
  const claimRewards = useCallback(async (poolId: number) => {
    if (!publicKey || !signTransaction || !connected) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: 构建实际的领取奖励指令
      // const program = new Program(IDL, STAKING_PROGRAM_ID, provider);
      // const tx = await program.methods
      //   .claimRewards(new BN(poolId))
      //   .accounts({...})
      //   .rpc();

      // 临时返回
      throw new Error('Claim rewards not yet implemented - pending contract deployment');
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
    if (connected && publicKey) {
      fetchTokenBalances();
      fetchStakingPositions();
    }
  }, [connected, publicKey, fetchTokenBalances, fetchStakingPositions]);

  return {
    stake,
    unstake,
    claimRewards,
    positions,
    tokenBalances,
    isLoading,
    error,
    refetch: () => {
      fetchTokenBalances();
      fetchStakingPositions();
    },
  };
}
