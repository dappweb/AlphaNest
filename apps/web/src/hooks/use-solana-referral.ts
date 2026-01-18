/**
 * Solana 推荐返佣系统 Hooks
 * 对齐 multi-asset-staking 合约中的 Referral 功能
 */

import { useCallback, useMemo, useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { PUMP_FUN_CONFIG } from '@/config/solana';

// Program ID - 对应 Solana multi-asset-staking 合约
const PROGRAM_ID = new PublicKey('7qpcKQQuDYhN51PTXebV8dpWY8MxqUKeFMwwVQ1eFQ75');

// 默认推荐人（管理员 Solana 地址）
export const DEFAULT_REFERRER_SOLANA = process.env.NEXT_PUBLIC_ADMIN_SOLANA_ADDRESS 
  ? new PublicKey(process.env.NEXT_PUBLIC_ADMIN_SOLANA_ADDRESS)
  : new PublicKey('11111111111111111111111111111111'); // 占位符

// PDAs
const REFERRAL_SEED = 'referral';
const REFERRER_INFO_SEED = 'referrer_info';
const REFERRAL_CONFIG_SEED = 'referral_config';

// 推荐等级配置
export const SOLANA_REFERRAL_TIERS = [
  { tier: 0, minReferrals: 1, rate: 500, name: 'Bronze', icon: '🥉' },
  { tier: 1, minReferrals: 5, rate: 800, name: 'Silver', icon: '🥈' },
  { tier: 2, minReferrals: 10, rate: 1000, name: 'Gold', icon: '🥇' },
  { tier: 3, minReferrals: 25, rate: 1200, name: 'Platinum', icon: '💎' },
  { tier: 4, minReferrals: 50, rate: 1500, name: 'Diamond', icon: '👑' },
];

// Types
export interface SolanaReferralInfo {
  referrer: string;
  registeredAt: number;
}

export interface SolanaReferrerInfo {
  referrer: string;
  totalReferred: number;
  totalEarned: number;
  pendingRewards: number;
  refereeStakedUSD: number;
  currentTier: typeof SOLANA_REFERRAL_TIERS[0];
  currentRate: number;
}

export interface SolanaReferralConfig {
  referralRates: number[];
  referralTiers: number[];
  inviteeBonus: number;
  enabled: boolean;
}

// ============================================
// PDA 辅助函数
// ============================================

function getReferralPDA(userPubkey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(REFERRAL_SEED), userPubkey.toBuffer()],
    PROGRAM_ID
  );
}

function getReferrerInfoPDA(referrerPubkey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(REFERRER_INFO_SEED), referrerPubkey.toBuffer()],
    PROGRAM_ID
  );
}

function getReferralConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(REFERRAL_CONFIG_SEED)],
    PROGRAM_ID
  );
}

function getTierFromReferrals(totalReferred: number): typeof SOLANA_REFERRAL_TIERS[0] {
  for (let i = SOLANA_REFERRAL_TIERS.length - 1; i >= 0; i--) {
    if (totalReferred >= SOLANA_REFERRAL_TIERS[i].minReferrals) {
      return SOLANA_REFERRAL_TIERS[i];
    }
  }
  return SOLANA_REFERRAL_TIERS[0];
}

// ============================================
// Hooks
// ============================================

/**
 * 检查用户是否已绑定推荐人
 */
export function useSolanaHasReferrer() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [hasReferrer, setHasReferrer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [referrer, setReferrer] = useState<string | null>(null);

  const checkReferrer = useCallback(async () => {
    if (!publicKey) {
      setHasReferrer(false);
      setReferrer(null);
      return;
    }

    setIsLoading(true);
    try {
      const [referralPDA] = getReferralPDA(publicKey);
      const accountInfo = await connection.getAccountInfo(referralPDA);
      
      if (accountInfo && accountInfo.data.length > 8) {
        // 解析 ReferralAccount 数据
        // 结构: discriminator(8) + user(32) + referrer(32) + registered_at(8) + bump(1)
        const referrerBytes = accountInfo.data.slice(40, 72);
        const referrerPubkey = new PublicKey(referrerBytes);
        setReferrer(referrerPubkey.toBase58());
        setHasReferrer(true);
      } else {
        setHasReferrer(false);
        setReferrer(null);
      }
    } catch (error) {
      console.error('Failed to check referrer:', error);
      setHasReferrer(false);
      setReferrer(null);
    } finally {
      setIsLoading(false);
    }
  }, [connection, publicKey]);

  useEffect(() => {
    checkReferrer();
  }, [checkReferrer]);

  return { hasReferrer, referrer, isLoading, refetch: checkReferrer };
}

/**
 * 获取用户的推荐人信息（作为推荐人）
 */
export function useSolanaReferrerInfo() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [referrerInfo, setReferrerInfo] = useState<SolanaReferrerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReferrerInfo = useCallback(async () => {
    if (!publicKey) {
      setReferrerInfo(null);
      return;
    }

    setIsLoading(true);
    try {
      const [referrerInfoPDA] = getReferrerInfoPDA(publicKey);
      const accountInfo = await connection.getAccountInfo(referrerInfoPDA);
      
      if (accountInfo && accountInfo.data.length > 8) {
        // 解析 ReferrerInfo 数据
        // 结构: discriminator(8) + referrer(32) + total_referred(4) + total_earned(8) + pending_rewards(8) + referee_staked_usd(8) + bump(1)
        const view = new DataView(accountInfo.data.buffer, accountInfo.data.byteOffset);
        
        const totalReferred = view.getUint32(40, true);
        const totalEarned = Number(view.getBigUint64(44, true));
        const pendingRewards = Number(view.getBigUint64(52, true));
        const refereeStakedUSD = Number(view.getBigUint64(60, true));
        
        const currentTier = getTierFromReferrals(totalReferred);
        
        setReferrerInfo({
          referrer: publicKey.toBase58(),
          totalReferred,
          totalEarned: totalEarned / 1e6, // 转换为 USDC
          pendingRewards: pendingRewards / 1e6,
          refereeStakedUSD: refereeStakedUSD / 1e6,
          currentTier,
          currentRate: currentTier.rate / 100, // 转换为百分比
        });
      } else {
        // 用户还没有初始化推荐人信息
        setReferrerInfo({
          referrer: publicKey.toBase58(),
          totalReferred: 0,
          totalEarned: 0,
          pendingRewards: 0,
          refereeStakedUSD: 0,
          currentTier: SOLANA_REFERRAL_TIERS[0],
          currentRate: 5,
        });
      }
    } catch (error) {
      console.error('Failed to fetch referrer info:', error);
      setReferrerInfo(null);
    } finally {
      setIsLoading(false);
    }
  }, [connection, publicKey]);

  useEffect(() => {
    fetchReferrerInfo();
  }, [fetchReferrerInfo]);

  return { referrerInfo, isLoading, refetch: fetchReferrerInfo };
}

/**
 * 注册推荐关系
 */
export function useSolanaRegisterReferral() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const registerReferral = useCallback(
    async (referrerAddress?: string) => {
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error('Wallet not connected');
      }

      // 使用提供的推荐人或默认管理员
      const referrerPubkey = referrerAddress 
        ? new PublicKey(referrerAddress)
        : DEFAULT_REFERRER_SOLANA;

      // 不能自己推荐自己
      if (referrerPubkey.equals(wallet.publicKey)) {
        throw new Error('Cannot refer yourself');
      }

      setIsPending(true);
      setIsSuccess(false);
      setError(null);
      setTxHash(null);

      try {
        // 获取 PDAs
        const [referralPDA] = getReferralPDA(wallet.publicKey);
        const [referrerInfoPDA] = getReferrerInfoPDA(referrerPubkey);

        // 构建交易（需要 Anchor IDL）
        // 这里展示交易框架
        console.log('Registering referral:', {
          user: wallet.publicKey.toBase58(),
          referrer: referrerPubkey.toBase58(),
          referralPDA: referralPDA.toBase58(),
          referrerInfoPDA: referrerInfoPDA.toBase58(),
        });

        // 实际实现需要使用 Anchor
        // const tx = await program.methods
        //   .registerReferral()
        //   .accounts({
        //     user: wallet.publicKey,
        //     referrer: referrerPubkey,
        //     referralAccount: referralPDA,
        //     referrerInfo: referrerInfoPDA,
        //     systemProgram: SystemProgram.programId,
        //   })
        //   .transaction();
        // 
        // const signature = await wallet.sendTransaction(tx, connection);
        // await connection.confirmTransaction(signature);

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

  // 绑定到默认推荐人（管理员）
  const registerToDefaultReferrer = useCallback(async () => {
    return registerReferral(DEFAULT_REFERRER_SOLANA.toBase58());
  }, [registerReferral]);

  return {
    registerReferral,
    registerToDefaultReferrer,
    defaultReferrer: DEFAULT_REFERRER_SOLANA.toBase58(),
    isPending,
    isSuccess,
    error,
    txHash,
  };
}

/**
 * 初始化推荐人信息账户
 */
export function useSolanaInitializeReferrerInfo() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const initializeReferrerInfo = useCallback(async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected');
    }

    setIsPending(true);
    setIsSuccess(false);
    setError(null);

    try {
      const [referrerInfoPDA] = getReferrerInfoPDA(wallet.publicKey);

      console.log('Initializing referrer info:', {
        user: wallet.publicKey.toBase58(),
        referrerInfoPDA: referrerInfoPDA.toBase58(),
      });

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
    initializeReferrerInfo,
    isPending,
    isSuccess,
    error,
  };
}

/**
 * 领取推荐返佣
 */
export function useSolanaClaimReferralRewards() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const claimRewards = useCallback(async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected');
    }

    setIsPending(true);
    setIsSuccess(false);
    setError(null);
    setTxHash(null);

    try {
      const [referrerInfoPDA] = getReferrerInfoPDA(wallet.publicKey);

      console.log('Claiming referral rewards:', {
        user: wallet.publicKey.toBase58(),
        referrerInfoPDA: referrerInfoPDA.toBase58(),
      });

      // 实际实现需要使用 Anchor
      setTxHash('simulated_tx_hash');
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
    txHash,
  };
}

/**
 * 获取推荐系统配置
 */
export function useSolanaReferralConfig() {
  const { connection } = useConnection();
  const [config, setConfig] = useState<SolanaReferralConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const [configPDA] = getReferralConfigPDA();
      const accountInfo = await connection.getAccountInfo(configPDA);
      
      if (accountInfo && accountInfo.data.length > 8) {
        // 解析 ReferralConfig 数据
        // 结构: discriminator(8) + referral_rates([u16;5]=10) + referral_tiers([u16;5]=10) + invitee_bonus(2) + enabled(1) + bump(1)
        const view = new DataView(accountInfo.data.buffer, accountInfo.data.byteOffset);
        
        const referralRates = [
          view.getUint16(8, true),
          view.getUint16(10, true),
          view.getUint16(12, true),
          view.getUint16(14, true),
          view.getUint16(16, true),
        ];
        
        const referralTiers = [
          view.getUint16(18, true),
          view.getUint16(20, true),
          view.getUint16(22, true),
          view.getUint16(24, true),
          view.getUint16(26, true),
        ];
        
        const inviteeBonus = view.getUint16(28, true);
        const enabled = view.getUint8(30) === 1;
        
        setConfig({
          referralRates,
          referralTiers,
          inviteeBonus: inviteeBonus / 100, // 转换为百分比
          enabled,
        });
      } else {
        // 使用默认配置
        setConfig({
          referralRates: [500, 800, 1000, 1200, 1500],
          referralTiers: [1, 5, 10, 25, 50],
          inviteeBonus: 5,
          enabled: true,
        });
      }
    } catch (error) {
      console.error('Failed to fetch referral config:', error);
      // 使用默认配置
      setConfig({
        referralRates: [500, 800, 1000, 1200, 1500],
        referralTiers: [1, 5, 10, 25, 50],
        inviteeBonus: 5,
        enabled: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [connection]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return { config, isLoading, refetch: fetchConfig };
}

/**
 * 组合 Hook - Solana 完整推荐返佣功能
 */
export function useSolanaReferral() {
  const { publicKey, connected } = useWallet();
  const { hasReferrer, referrer, isLoading: loadingReferrer, refetch: refetchReferrer } = useSolanaHasReferrer();
  const { referrerInfo, isLoading: loadingInfo, refetch: refetchInfo } = useSolanaReferrerInfo();
  const { config, isLoading: loadingConfig } = useSolanaReferralConfig();
  
  const registerAction = useSolanaRegisterReferral();
  const initAction = useSolanaInitializeReferrerInfo();
  const claimAction = useSolanaClaimReferralRewards();

  // 检查是否需要绑定推荐人
  const needsReferrer = useMemo(() => {
    return connected && !loadingReferrer && !hasReferrer;
  }, [connected, loadingReferrer, hasReferrer]);

  // 生成推荐链接
  const referralLink = useMemo(() => {
    if (!publicKey) return null;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://app.popcow.xyz';
    return `${baseUrl}/staking?ref=${publicKey.toBase58()}`;
  }, [publicKey]);

  // 生成推荐码 (钱包地址的短格式)
  const referralCode = useMemo(() => {
    if (!publicKey) return null;
    const addr = publicKey.toBase58();
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  }, [publicKey]);

  // 从 URL 获取推荐人地址
  const getReferrerFromUrl = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && ref.length >= 32 && ref.length <= 44) {
      try {
        new PublicKey(ref); // 验证是否是有效的 Solana 地址
        return ref;
      } catch {
        return null;
      }
    }
    return null;
  }, []);

  // 自动绑定推荐人（优先使用 URL 参数，否则使用默认管理员）
  const autoBindReferrer = useCallback(async () => {
    const urlReferrer = getReferrerFromUrl();
    await registerAction.registerReferral(urlReferrer || undefined);
  }, [getReferrerFromUrl, registerAction]);

  const refetchAll = useCallback(() => {
    refetchReferrer();
    refetchInfo();
  }, [refetchReferrer, refetchInfo]);

  return {
    // 状态
    isConnected: connected,
    publicKey: publicKey?.toBase58() || null,
    hasReferrer,
    needsReferrer,
    myReferrer: referrer,
    referrerInfo,
    config,
    isLoading: loadingReferrer || loadingInfo || loadingConfig,

    // 默认推荐人
    defaultReferrer: DEFAULT_REFERRER_SOLANA.toBase58(),

    // 推荐链接/码
    referralLink,
    referralCode,

    // 操作
    registerReferral: registerAction.registerReferral,
    registerToDefaultReferrer: registerAction.registerToDefaultReferrer,
    autoBindReferrer,
    isRegistering: registerAction.isPending,
    registerSuccess: registerAction.isSuccess,

    initializeReferrerInfo: initAction.initializeReferrerInfo,
    isInitializing: initAction.isPending,
    initSuccess: initAction.isSuccess,

    claimRewards: claimAction.claimRewards,
    isClaiming: claimAction.isPending,
    claimSuccess: claimAction.isSuccess,

    // URL 工具
    getReferrerFromUrl,

    // 刷新
    refetch: refetchAll,
  };
}

// 导出常量
export { PROGRAM_ID, getReferralPDA, getReferrerInfoPDA, getReferralConfigPDA };
