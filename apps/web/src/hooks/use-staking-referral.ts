/**
 * MultiAssetStaking Referral System Hooks
 * This file has been rewritten as a Solana version wrapper
 * All functionality is implemented through useSolanaReferral
 */

import { useMemo, useCallback } from 'react';
import { 
  useSolanaReferral,
  DEFAULT_REFERRER_SOLANA,
  SOLANA_REFERRAL_TIERS as REFERRAL_TIERS,
  type SolanaReferrerInfo as ReferralInfo,
} from './use-solana-referral';

// Export types for compatibility
export interface ReferralTier {
  tier: number;
  minReferrals: number;
  rate: number; // Commission rate (basis points)
  name: string;
}

// Export constants for compatibility
export { REFERRAL_TIERS };
export const DEFAULT_REFERRER = DEFAULT_REFERRER_SOLANA.toBase58();

/**
 * Get if referral system is enabled
 */
export function useReferralEnabled() {
  const { config } = useSolanaReferral();
  
  return {
    isEnabled: config?.enabled ?? true, // Default enabled
    isLoading: !config,
    refetch: () => {},
  };
}

/**
 * Get if user has bound a referrer
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
 * Get user's referrer address
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
 * Get user's referral information (as a referrer)
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
 * Get invitee's first stake bonus rate
 */
export function useInviteeBonus() {
  const { config } = useSolanaReferral();

  return {
    bonusRate: (config?.inviteeBonus && typeof config.inviteeBonus === 'number') 
      ? config.inviteeBonus 
      : 5, // Default 5%
    isLoading: !config,
  };
}

/**
 * Bind referrer
 * If no referrer is specified, default to admin address
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
      // If no referrer is specified, use default admin address
      if (!referrerAddress) {
        await registerToDefaultReferrer();
      } else {
        await registerReferral(referrerAddress);
      }
    },
    [registerReferral, registerToDefaultReferrer]
  );

  // Bind to default referrer (admin)
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
 * Claim referral rewards
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
 * Combined Hook - Complete referral rewards functionality
 * New users must have a referrer, default referrer is admin
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

  // Add some extra fields for API compatibility
  const defaultReferrerSolana = defaultReferrer;

  return {
    // State
    isConnected,
    isEnabled: config?.enabled ?? true,
    hasReferrer,
    needsReferrer, // New users need to bind a referrer
    myReferrer,
    referralInfo: referrerInfo as ReferralInfo | null,
    isLoading,
    inviteeBonus: config?.inviteeBonus ?? 5, // Default 5%

    // Default referrer (admin)
    defaultReferrer,
    defaultReferrerSolana,

    // Referral link/code
    referralLink,
    referralCode,
    walletAddress,

    // Actions
    bindReferrer: async (referrerAddress?: string) => {
      if (!referrerAddress) {
        // Use default referrer
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
    autoBindReferrer, // Auto bind (URL parameter or default admin)
    isBindingReferrer,
    bindSuccess,

    claimRewards,
    isClaimingRewards,
    claimSuccess,

    // URL utilities
    getReferrerFromUrl,

    // Refresh
    refetch,
  };
}
