/**
 * MultiAssetStaking 推荐返佣系统 Hooks
 * 此文件已重写为 Solana 版本的包装器
 * 所有功能都通过 useSolanaReferral 实现
 */

import { useMemo, useCallback } from 'react';
import { 
  useSolanaReferral,
  DEFAULT_REFERRER_SOLANA,
  SOLANA_REFERRAL_TIERS as REFERRAL_TIERS,
  type SolanaReferrerInfo as ReferralInfo,
} from './use-solana-referral';

// 导出类型以保持兼容性
export interface ReferralTier {
  tier: number;
  minReferrals: number;
  rate: number; // 返佣比例 (basis points)
  name: string;
}

// 导出常量以保持兼容性
export { REFERRAL_TIERS };
export const DEFAULT_REFERRER = DEFAULT_REFERRER_SOLANA.toBase58();

/**
 * 获取推荐系统是否启用
 */
export function useReferralEnabled() {
  const { config } = useSolanaReferral();
  
  return {
    isEnabled: config?.enabled ?? true, // 默认启用
    isLoading: !config,
    refetch: () => {},
  };
}

/**
 * 获取用户是否已绑定推荐人
 */
export function useHasReferrer() {
  const { hasReferrer, isLoading } = useSolanaReferral();

  return {
    hasReferrer: hasReferrer ?? false,
    isLoading,
    refetch: () => {},
  };
}

/**
 * 获取用户的推荐人地址
 */
export function useMyReferrer() {
  const { myReferrer, isLoading } = useSolanaReferral();

  return {
    referrer: myReferrer || null,
    isLoading,
    refetch: () => {},
  };
}

/**
 * 获取用户的推荐信息（作为推荐人）
 */
export function useReferralInfo() {
  const { referrerInfo, isLoading, refetch } = useSolanaReferral();

  return {
    referralInfo: referrerInfo as ReferralInfo | null,
    isLoading,
    refetch,
  };
}

/**
 * 获取被推荐人首次质押奖励比例
 */
export function useInviteeBonus() {
  const { config } = useSolanaReferral();

  return {
    bonusRate: (config?.inviteeBonus && typeof config.inviteeBonus === 'number') 
      ? config.inviteeBonus 
      : 5, // 默认 5%
    isLoading: !config,
  };
}

/**
 * 绑定推荐人
 * 如果没有指定推荐人，默认使用管理员地址
 */
export function useBindReferrer() {
  const { 
    registerReferral, 
    registerToDefaultReferrer,
    isRegistering,
    registerSuccess,
    defaultReferrer,
  } = useSolanaReferral();

  const bindReferrer = useCallback(
    async (referrerAddress?: string) => {
      // 如果没有指定推荐人，使用默认管理员地址
      if (!referrerAddress) {
        await registerToDefaultReferrer();
      } else {
        await registerReferral(referrerAddress);
      }
    },
    [registerReferral, registerToDefaultReferrer]
  );

  // 绑定到默认推荐人（管理员）
  const bindToDefaultReferrer = useCallback(async () => {
    await registerToDefaultReferrer();
  }, [registerToDefaultReferrer]);

  return {
    bindReferrer,
    bindToDefaultReferrer,
    defaultReferrer,
    isPending: isRegistering,
    isSuccess: registerSuccess,
    error: null,
    hash: null,
  };
}

/**
 * 领取推荐返佣
 */
export function useClaimReferralRewards() {
  const { claimRewards, isClaiming, claimSuccess } = useSolanaReferral();

  return {
    claimRewards,
    isPending: isClaiming,
    isSuccess: claimSuccess,
    error: null,
    hash: null,
  };
}

/**
 * 组合 Hook - 完整推荐返佣功能
 * 新用户必须有推荐人，默认推荐人是管理员
 */
export function useStakingReferral() {
  const {
    isConnected,
    publicKey: walletAddress,
    config,
    hasReferrer,
    needsReferrer,
    myReferrer,
    referrerInfo,
    isLoading,
    defaultReferrer,
    referralLink,
    referralCode,
    autoBindReferrer,
    isRegistering: isBindingReferrer,
    registerSuccess: bindSuccess,
    claimRewards,
    isClaiming: isClaimingRewards,
    claimSuccess,
    getReferrerFromUrl,
    refetch,
  } = useSolanaReferral();

  // 为了保持 API 兼容性，添加一些额外的字段
  const defaultReferrerSolana = defaultReferrer;

  return {
    // 状态
    isConnected,
    isEnabled: config?.enabled ?? true,
    hasReferrer,
    needsReferrer, // 新用户需要绑定推荐人
    myReferrer,
    referralInfo: referrerInfo as ReferralInfo | null,
    isLoading,
    inviteeBonus: config?.inviteeBonus ?? 5, // 默认 5%

    // 默认推荐人（管理员）
    defaultReferrer,
    defaultReferrerSolana,

    // 推荐链接/码
    referralLink,
    referralCode,
    walletAddress,

    // 操作
    bindReferrer: async (referrerAddress?: string) => {
      if (!referrerAddress) {
        // 使用默认推荐人
        const { registerToDefaultReferrer } = useSolanaReferral();
        await registerToDefaultReferrer();
      } else {
        const { registerReferral } = useSolanaReferral();
        await registerReferral(referrerAddress);
      }
    },
    bindToDefaultReferrer: async () => {
      const { registerToDefaultReferrer } = useSolanaReferral();
      await registerToDefaultReferrer();
    },
    autoBindReferrer, // 自动绑定（URL 参数或默认管理员）
    isBindingReferrer,
    bindSuccess,

    claimRewards,
    isClaimingRewards,
    claimSuccess,

    // URL 工具
    getReferrerFromUrl,

    // 刷新
    refetch,
  };
}
