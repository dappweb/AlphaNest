/**
 * Solana Multi-Asset Staking Hooks
 * Solana (pump.fun) 多资产质押 - 支持 SOL 和 pump.fun 代币
 * 
 * 使用 @solana/web3.js + @coral-xyz/anchor + Helius API
 */

import { useCallback, useMemo, useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL, SystemProgram, Connection } from '@solana/web3.js';
import { Program, AnchorProvider, BN, Idl } from '@coral-xyz/anchor';
import { PUMP_FUN_CONFIG, SOLANA_TOKENS } from '@/config/solana';
import { useHeliusTokenBalances, useHeliusTokenPrice, useHeliusPumpFunTokens } from './use-helius';

// Program ID - 对应 Solana 合约
const PROGRAM_ID = new PublicKey('7qpcKQQuDYhN51PTXebV8dpWY8MxqUKeFMwwVQ1eFQ75');

// PDAs
const POOL_SEED = 'multi_asset_pool';
const STAKE_SEED = 'stake';

// 锁定期枚举
export enum LockPeriod {
  Flexible = 0,
  ThirtyDays = 1,
  NinetyDays = 2,
  OneEightyDays = 3,
  ThreeSixtyFiveDays = 4,
}

export const LOCK_PERIOD_LABELS = {
  [LockPeriod.Flexible]: 'Flexible (1x)',
  [LockPeriod.ThirtyDays]: '30 Days (1.5x)',
  [LockPeriod.NinetyDays]: '90 Days (2x)',
  [LockPeriod.OneEightyDays]: '180 Days (3x)',
  [LockPeriod.ThreeSixtyFiveDays]: '365 Days (5x)',
};

// 资产类型
export enum AssetType {
  SOL = 'SOL',
  USDC = 'USDC',
  USDT = 'USDT',
  PumpFun = 'PUMP', // pump.fun 代币
  Custom = 'Custom',
}

// pump.fun 代币配置
export const PUMP_FUN_TOKENS = {
  // 示例 pump.fun 代币 (需要根据实际情况配置)
  platform: PUMP_FUN_CONFIG,
  defaultDecimals: 6,
  minStakeAmount: 100, // 最小质押 100 个代币
};

// Types
export interface SolanaStakeInfo {
  owner: string;
  pool: string;
  assetType: AssetType;
  stakedValueUsd: number;
  lockPeriod: LockPeriod;
  stakeTime: number;
  unlockTime: number;
  pendingRewards: number;
  totalRewardsClaimed: number;
  rewardMultiplier: number;
  earlyBirdBonus: number;
  isLocked: boolean;
}

export interface SolanaPoolInfo {
  authority: string;
  rewardMint: string;
  priceOracle: string;
  totalStakedValueUsd: number;
  rewardRatePerSecond: number;
  isPaused: boolean;
  devFundRatio: number;
  liquidityRatio: number;
  rewardRatio: number;
  reserveRatio: number;
}

export interface SolanaTokenConfig {
  tokenMint: string;
  tokenName: string;
  tokenDecimals: number;
  baseApy: number;
  rewardMultiplier: number;
  minStakeAmount: number;
  isActive: boolean;
  totalStaked: number;
  totalStakers: number;
}

// ============================================
// Helper Functions
// ============================================

function getPoolPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(POOL_SEED)],
    PROGRAM_ID
  );
}

function getStakePDA(userPubkey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(STAKE_SEED), userPubkey.toBuffer()],
    PROGRAM_ID
  );
}

function getRewardMultiplier(lockPeriod: LockPeriod): number {
  switch (lockPeriod) {
    case LockPeriod.Flexible: return 100;
    case LockPeriod.ThirtyDays: return 150;
    case LockPeriod.NinetyDays: return 200;
    case LockPeriod.OneEightyDays: return 300;
    case LockPeriod.ThreeSixtyFiveDays: return 500;
    default: return 100;
  }
}

function getEarlyBirdBonus(daysSinceLaunch: number): number {
  if (daysSinceLaunch <= 7) return 50;
  if (daysSinceLaunch <= 14) return 30;
  if (daysSinceLaunch <= 30) return 20;
  return 0;
}

// ============================================
// Hooks
// ============================================

/**
 * 获取 Solana 钱包连接状态
 */
export function useSolanaWallet() {
  const { connection } = useConnection();
  const wallet = useWallet();
  
  const isSolanaConnected = useMemo(() => {
    return wallet.connected && wallet.publicKey !== null;
  }, [wallet.connected, wallet.publicKey]);

  return {
    connection,
    wallet,
    publicKey: wallet.publicKey,
    isSolanaConnected,
    signTransaction: wallet.signTransaction,
    signAllTransactions: wallet.signAllTransactions,
  };
}

/**
 * 获取质押池信息
 */
export function useSolanaPoolInfo() {
  const { connection } = useConnection();
  const [poolInfo, setPoolInfo] = useState<SolanaPoolInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPoolInfo = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [poolPDA] = getPoolPDA();
      const accountInfo = await connection.getAccountInfo(poolPDA);
      
      if (accountInfo) {
        // 解析账户数据 (简化版，实际需要 IDL)
        // 这里返回模拟数据，实际部署时需要正确解析
        setPoolInfo({
          authority: poolPDA.toBase58(),
          rewardMint: '',
          priceOracle: '',
          totalStakedValueUsd: 0,
          rewardRatePerSecond: 1000,
          isPaused: false,
          devFundRatio: 4000,
          liquidityRatio: 3000,
          rewardRatio: 2000,
          reserveRatio: 1000,
        });
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [connection]);

  useEffect(() => {
    fetchPoolInfo();
  }, [fetchPoolInfo]);

  return { poolInfo, isLoading, error, refetch: fetchPoolInfo };
}

/**
 * 获取用户质押信息
 */
export function useSolanaStakeInfo() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [stakeInfo, setStakeInfo] = useState<SolanaStakeInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchStakeInfo = useCallback(async () => {
    if (!publicKey) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const [stakePDA] = getStakePDA(publicKey);
      const accountInfo = await connection.getAccountInfo(stakePDA);
      
      if (accountInfo) {
        const now = Math.floor(Date.now() / 1000);
        
        // 解析账户数据 (简化版)
        setStakeInfo({
          owner: publicKey.toBase58(),
          pool: '',
          assetType: AssetType.SOL,
          stakedValueUsd: 0,
          lockPeriod: LockPeriod.Flexible,
          stakeTime: 0,
          unlockTime: 0,
          pendingRewards: 0,
          totalRewardsClaimed: 0,
          rewardMultiplier: 100,
          earlyBirdBonus: 0,
          isLocked: false,
        });
      } else {
        setStakeInfo(null);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [connection, publicKey]);

  useEffect(() => {
    fetchStakeInfo();
  }, [fetchStakeInfo]);

  return { stakeInfo, isLoading, error, refetch: fetchStakeInfo };
}

/**
 * 获取 SOL 价格 (通过 Helius/Jupiter API)
 * 优先使用 Helius API, 回退到 Pyth Network
 */
export function useSolPrice() {
  const heliusPrice = useHeliusTokenPrice(SOLANA_TOKENS.SOL);
  const [price, setPrice] = useState<number>(150);
  const [isLoading, setIsLoading] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const { connection } = useConnection();

  // 优先使用 Helius 价格
  useEffect(() => {
    if (heliusPrice.price && heliusPrice.price.price > 0) {
      setPrice(heliusPrice.price.price);
      setIsStale(false);
      return;
    }
    
    // 回退到 Pyth
    fetchPythPrice();
  }, [heliusPrice.price]);

  const fetchPythPrice = useCallback(async () => {
    setIsLoading(true);
    try {
      const { getCurrentPriceFeeds } = await import('@/config/solana');
      const priceFeeds = getCurrentPriceFeeds();
      const priceFeedAccount = new PublicKey(priceFeeds.SOL_USD);
      
      const accountInfo = await connection.getAccountInfo(priceFeedAccount);
      
      if (accountInfo && accountInfo.data.length >= 200) {
        const view = new DataView(accountInfo.data.buffer, accountInfo.data.byteOffset);
        const expo = view.getInt32(20, true);
        const priceRaw = view.getBigInt64(208, true);
        const publishTime = view.getBigInt64(96, true);
        
        const scale = Math.pow(10, expo);
        const priceUsd = Number(priceRaw) * scale;
        
        const now = Date.now() / 1000;
        const isOld = now - Number(publishTime) > 60;
        
        if (priceUsd > 0) {
          setPrice(priceUsd);
          setIsStale(isOld);
          return;
        }
      }
      
      setPrice(150);
      setIsStale(true);
    } catch (err) {
      console.error('Failed to fetch SOL price from Pyth:', err);
      setPrice(150);
      setIsStale(true);
    } finally {
      setIsLoading(false);
    }
  }, [connection]);

  const refetch = useCallback(() => {
    heliusPrice.refetch();
  }, [heliusPrice.refetch]);

  return { 
    price, 
    isLoading: isLoading || heliusPrice.isLoading, 
    isStale, 
    priceChange24h: heliusPrice.price?.priceChange24h,
    refetch 
  };
}

/**
 * 质押 SOL
 */
export function useStakeSol() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const stakeSol = useCallback(
    async (amountSol: number, lockPeriod: LockPeriod) => {
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error('Wallet not connected');
      }

      setIsPending(true);
      setIsSuccess(false);
      setError(null);
      setTxHash(null);

      try {
        // 实际实现需要使用 Anchor
        // 这里展示交易构建框架
        
        const [poolPDA] = getPoolPDA();
        const [stakePDA] = getStakePDA(wallet.publicKey);
        
        const amountLamports = amountSol * LAMPORTS_PER_SOL;
        
        // 创建交易指令 (需要 Anchor IDL)
        // const tx = await program.methods
        //   .stakeSol(new BN(amountLamports), lockPeriod)
        //   .accounts({
        //     user: wallet.publicKey,
        //     pool: poolPDA,
        //     stakeAccount: stakePDA,
        //     solVault: solVaultPDA,
        //     priceOracle: priceOraclePDA,
        //     systemProgram: SystemProgram.programId,
        //   })
        //   .transaction();
        
        // const signature = await wallet.sendTransaction(tx, connection);
        // await connection.confirmTransaction(signature);
        
        // 模拟成功
        console.log(`Staking ${amountSol} SOL with lock period ${lockPeriod}`);
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
    stakeSol,
    isPending,
    isSuccess,
    error,
    txHash,
  };
}

/**
 * 质押 SPL 代币 (pump.fun 等)
 */
export function useStakeToken() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const stakeToken = useCallback(
    async (
      tokenMint: string,
      amount: number,
      decimals: number,
      lockPeriod: LockPeriod
    ) => {
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error('Wallet not connected');
      }

      setIsPending(true);
      setIsSuccess(false);
      setError(null);
      setTxHash(null);

      try {
        const mintPubkey = new PublicKey(tokenMint);
        const amountRaw = amount * Math.pow(10, decimals);
        
        console.log(`Staking ${amount} tokens (${tokenMint}) with lock period ${lockPeriod}`);
        
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
    stakeToken,
    isPending,
    isSuccess,
    error,
    txHash,
  };
}

/**
 * 解除质押
 */
export function useSolanaUnstake() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const unstake = useCallback(
    async (amountUsd: number) => {
      if (!wallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      setIsPending(true);
      setIsSuccess(false);
      setError(null);

      try {
        console.log(`Unstaking $${amountUsd} USD`);
        // 实际实现需要使用 Anchor
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
    unstake,
    isPending,
    isSuccess,
    error,
  };
}

/**
 * 领取奖励
 */
export function useSolanaClaimRewards() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const claimRewards = useCallback(async () => {
    if (!wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    setIsPending(true);
    setIsSuccess(false);
    setError(null);

    try {
      console.log('Claiming rewards');
      // 实际实现需要使用 Anchor
      setIsSuccess(true);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsPending(false);
    }
  }, [connection, wallet]);

  return {
    claimRewards,
    isPending,
    isSuccess,
    error,
  };
}

/**
 * 获取早鸟奖励
 */
export function useSolanaEarlyBirdBonus() {
  const { poolInfo } = useSolanaPoolInfo();
  const [bonus, setBonus] = useState(0);

  useEffect(() => {
    // 计算从启动以来的天数
    // 这里使用模拟值，实际需要从合约读取 launch_time
    const launchTime = Date.now() / 1000 - 10 * 86400; // 假设启动10天
    const daysSinceLaunch = Math.floor((Date.now() / 1000 - launchTime) / 86400);
    setBonus(getEarlyBirdBonus(daysSinceLaunch));
  }, [poolInfo]);

  return { bonus };
}

/**
 * 组合 Hook - Solana (pump.fun) 完整多资产质押管理
 * 集成 Helius API 获取实时余额和价格
 */
export function useSolanaStaking() {
  const { isSolanaConnected, publicKey } = useSolanaWallet();
  const { poolInfo, isLoading: loadingPool, refetch: refetchPool } = useSolanaPoolInfo();
  const { stakeInfo, isLoading: loadingStake, refetch: refetchStake } = useSolanaStakeInfo();
  const { price: solPrice, isLoading: loadingPrice, priceChange24h, refetch: refetchPrice } = useSolPrice();
  const { bonus: earlyBirdBonus } = useSolanaEarlyBirdBonus();

  // Helius API 集成
  const heliusBalances = useHeliusTokenBalances(publicKey?.toBase58());
  const pumpFunTokens = useHeliusPumpFunTokens(publicKey?.toBase58());

  const stakeSolAction = useStakeSol();
  const stakeTokenAction = useStakeToken();
  const unstakeAction = useSolanaUnstake();
  const claimAction = useSolanaClaimRewards();

  const refetchAll = useCallback(() => {
    refetchPool();
    refetchStake();
    refetchPrice();
    heliusBalances.refetch();
    pumpFunTokens.refetch();
  }, [refetchPool, refetchStake, refetchPrice, heliusBalances.refetch, pumpFunTokens.refetch]);

  // 计算总质押价值 (SOL + pump.fun 代币)
  const totalStakedValueUsd = useMemo(() => {
    const solValue = (stakeInfo?.stakedValueUsd || 0);
    return solValue;
  }, [stakeInfo]);

  return {
    // User state
    isConnected: isSolanaConnected,
    publicKey: publicKey?.toBase58() || null,
    stakeInfo,
    
    // Pool state
    poolInfo,
    solPrice,
    solPriceChange24h: priceChange24h,
    earlyBirdBonus,
    totalStakedValueUsd,
    
    // Helius 数据
    balances: heliusBalances.balances,
    solBalance: heliusBalances.solBalance,
    getBalance: heliusBalances.getBalance,
    pumpFunTokens: pumpFunTokens.tokens,
    
    // Loading states
    isLoading: loadingPool || loadingStake || loadingPrice || heliusBalances.isLoading,

    // Actions
    stakeSol: stakeSolAction,
    stakeToken: stakeTokenAction,
    unstake: unstakeAction,
    claimRewards: claimAction,

    // Refresh
    refetch: refetchAll,
  };
}

// Export constants
export { PROGRAM_ID, getPoolPDA, getStakePDA, getRewardMultiplier, getEarlyBirdBonus };
