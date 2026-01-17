'use client';

import { useState, useCallback, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { 
  getAssociatedTokenAddress, 
  createTransferInstruction,
  getAccount,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { SOLANA_TOKENS } from '@/config/solana';

// 代币地址
const POPCOW_MINT = new PublicKey(SOLANA_TOKENS.POPCOW);
const POPCOW_DEFI_MINT = new PublicKey(SOLANA_TOKENS.POPCOW_DEFI);

// 质押金库地址 (用于接收 POPCOW 代币)
const STAKE_VAULT = new PublicKey('11111111111111111111111111111111'); // 需要替换为实际地址

// 兑换比例
const EXCHANGE_RATE = 1;

export interface UpgradeState {
  popcowBalance: number;
  popcowDefiBalance: number;
  stakedAmount: number;
  miningRewards: number;
  todayMined: number;
  clickCount: number;
  comboMultiplier: number;
  isLoading: boolean;
  error: string | null;
}

export interface MiningConfig {
  baseReward: number;
  cooldownMs: number;
  bonusMultiplier: number;
  dailyLimit: number;
}

const DEFAULT_MINING_CONFIG: MiningConfig = {
  baseReward: 0.001,
  cooldownMs: 1000,
  bonusMultiplier: 1.5,
  dailyLimit: 1000,
};

export function usePopcowUpgrade() {
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();
  
  const [state, setState] = useState<UpgradeState>({
    popcowBalance: 0,
    popcowDefiBalance: 0,
    stakedAmount: 0,
    miningRewards: 0,
    todayMined: 0,
    clickCount: 0,
    comboMultiplier: 1,
    isLoading: false,
    error: null,
  });

  const [lastClickTime, setLastClickTime] = useState(0);
  const [canMine, setCanMine] = useState(true);

  // 获取代币余额
  const fetchBalances = useCallback(async () => {
    if (!publicKey || !connected) {
      setState(prev => ({
        ...prev,
        popcowBalance: 0,
        popcowDefiBalance: 0,
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // 获取 POPCOW 余额
      try {
        const popcowAta = await getAssociatedTokenAddress(POPCOW_MINT, publicKey);
        const popcowAccount = await getAccount(connection, popcowAta);
        const popcowBalance = Number(popcowAccount.amount) / Math.pow(10, 9);
        setState(prev => ({ ...prev, popcowBalance }));
      } catch {
        // 账户不存在，余额为 0
        setState(prev => ({ ...prev, popcowBalance: 0 }));
      }

      // 获取 POPCOW DEFI 余额
      try {
        const defiAta = await getAssociatedTokenAddress(POPCOW_DEFI_MINT, publicKey);
        const defiAccount = await getAccount(connection, defiAta);
        const popcowDefiBalance = Number(defiAccount.amount) / Math.pow(10, 6);
        setState(prev => ({ ...prev, popcowDefiBalance }));
      } catch {
        // 账户不存在，余额为 0
        setState(prev => ({ ...prev, popcowDefiBalance: 0 }));
      }

    } catch (error) {
      console.error('Failed to fetch balances:', error);
      setState(prev => ({ ...prev, error: 'Failed to fetch balances' }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [publicKey, connected, connection]);

  // 初始化获取余额
  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // 质押 POPCOW 兑换 POPCOW DEFI
  const stakeAndUpgrade = useCallback(async (amount: number): Promise<boolean> => {
    if (!publicKey || !signTransaction || !connected) {
      setState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return false;
    }

    if (amount <= 0 || amount > state.popcowBalance) {
      setState(prev => ({ ...prev, error: 'Invalid amount' }));
      return false;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // 获取用户的 POPCOW ATA
      const userPopcowAta = await getAssociatedTokenAddress(POPCOW_MINT, publicKey);
      
      // 获取金库的 POPCOW ATA (如果存在)
      // 注意：实际实现需要一个真正的金库地址
      
      // 创建转账交易
      const transaction = new Transaction();
      
      // 这里是模拟逻辑，实际需要调用智能合约
      // transaction.add(
      //   createTransferInstruction(
      //     userPopcowAta,
      //     vaultPopcowAta,
      //     publicKey,
      //     BigInt(amount * Math.pow(10, 9)),
      //     [],
      //     TOKEN_PROGRAM_ID
      //   )
      // );

      // 模拟交易成功
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 更新状态
      setState(prev => ({
        ...prev,
        popcowBalance: prev.popcowBalance - amount,
        popcowDefiBalance: prev.popcowDefiBalance + amount * EXCHANGE_RATE,
        stakedAmount: prev.stakedAmount + amount,
      }));

      return true;
    } catch (error) {
      console.error('Stake and upgrade failed:', error);
      setState(prev => ({ ...prev, error: 'Transaction failed' }));
      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [publicKey, signTransaction, connected, state.popcowBalance]);

  // 点击挖矿
  const mine = useCallback((): number => {
    if (!connected || !canMine) return 0;

    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime;

    // 计算连击加成
    let newCombo = state.comboMultiplier;
    if (timeSinceLastClick < 2000) {
      newCombo = Math.min(state.comboMultiplier + 0.1, 3);
    } else {
      newCombo = 1;
    }

    setLastClickTime(now);

    // 计算奖励
    const stakingBonus = state.stakedAmount > 0 ? DEFAULT_MINING_CONFIG.bonusMultiplier : 1;
    const reward = DEFAULT_MINING_CONFIG.baseReward * newCombo * stakingBonus;

    // 更新状态
    setState(prev => ({
      ...prev,
      miningRewards: prev.miningRewards + reward,
      todayMined: prev.todayMined + reward,
      clickCount: prev.clickCount + 1,
      comboMultiplier: newCombo,
    }));

    // 开始冷却
    setCanMine(false);
    setTimeout(() => setCanMine(true), DEFAULT_MINING_CONFIG.cooldownMs);

    return reward;
  }, [connected, canMine, lastClickTime, state.comboMultiplier, state.stakedAmount]);

  // 领取挖矿奖励
  const claimMiningRewards = useCallback(async (): Promise<boolean> => {
    if (!connected || state.miningRewards <= 0) return false;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // 模拟领取交易
      await new Promise(resolve => setTimeout(resolve, 1500));

      const rewards = state.miningRewards;
      
      setState(prev => ({
        ...prev,
        popcowDefiBalance: prev.popcowDefiBalance + rewards,
        miningRewards: 0,
      }));

      return true;
    } catch (error) {
      console.error('Claim rewards failed:', error);
      setState(prev => ({ ...prev, error: 'Claim failed' }));
      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [connected, state.miningRewards]);

  // 重置每日挖矿统计
  const resetDailyStats = useCallback(() => {
    setState(prev => ({
      ...prev,
      todayMined: 0,
      clickCount: 0,
    }));
  }, []);

  return {
    // 状态
    ...state,
    canMine,
    miningConfig: DEFAULT_MINING_CONFIG,
    
    // 方法
    fetchBalances,
    stakeAndUpgrade,
    mine,
    claimMiningRewards,
    resetDailyStats,
    
    // 计算属性
    exchangeRate: EXCHANGE_RATE,
    stakingBonus: state.stakedAmount > 0 ? DEFAULT_MINING_CONFIG.bonusMultiplier : 1,
  };
}

export default usePopcowUpgrade;
