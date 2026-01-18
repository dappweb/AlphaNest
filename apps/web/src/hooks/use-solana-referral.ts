/**
 * Solana Referral System Hooks
 * Aligned with Referral functionality in multi-asset-staking contract
 */

import { useCallback, useMemo, useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { PUMP_FUN_CONFIG } from '@/config/solana';
import { POPCOWDEFI_TOKEN_MINT } from '@/lib/solana/constants';
import { getTokenPrice } from '@/lib/helius/price';

// Program ID - corresponds to Solana multi-asset-staking contract
const PROGRAM_ID = new PublicKey('7qpcKQQuDYhN51PTXebV8dpWY8MxqUKeFMwwVQ1eFQ75');

// Default referrer (admin Solana address)
export const DEFAULT_REFERRER_SOLANA = process.env.NEXT_PUBLIC_ADMIN_SOLANA_ADDRESS 
  ? new PublicKey(process.env.NEXT_PUBLIC_ADMIN_SOLANA_ADDRESS)
  : new PublicKey('11111111111111111111111111111111'); // Placeholder

// PDAs
const REFERRAL_SEED = 'referral';
const REFERRER_INFO_SEED = 'referrer_info';
const REFERRAL_CONFIG_SEED = 'referral_config';

// Referral tier configuration
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
  totalEarned: number; // USD amount
  pendingRewards: number; // USD amount
  refereeStakedUSD: number;
  currentTier: typeof SOLANA_REFERRAL_TIERS[0];
  currentRate: number;
  // PopCowDefi token related information
  totalEarnedPopCowDefi?: number; // PopCowDefi token amount
  pendingRewardsPopCowDefi?: number; // PopCowDefi token amount
  popCowDefiPrice?: number; // PopCowDefi token price (USD)
}

export interface SolanaReferralConfig {
  referralRates: number[];
  referralTiers: number[];
  inviteeBonus: number;
  enabled: boolean;
}

// ============================================
// PDA helper functions
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
 * Check if user has bound a referrer
 */
export function useSolanaHasReferrer() {
  let connection: ReturnType<typeof useConnection>['connection'];
  try {
    const conn = useConnection();
    connection = conn.connection;
  } catch {
    connection = null as any;
  }
  let wallet: ReturnType<typeof useWallet>;
  try {
    wallet = useWallet();
  } catch {
    wallet = { publicKey: null, connected: false } as any;
  }
  const { publicKey } = wallet;
  const [hasReferrer, setHasReferrer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [referrer, setReferrer] = useState<string | null>(null);

  const checkReferrer = useCallback(async () => {
    if (!publicKey || !connection) {
      setHasReferrer(false);
      setReferrer(null);
      return;
    }

    setIsLoading(true);
    try {
      const [referralPDA] = getReferralPDA(publicKey);
      const accountInfo = await connection.getAccountInfo(referralPDA);
      
      if (accountInfo && accountInfo.data.length > 8) {
        // Parse ReferralAccount data
        // Structure: discriminator(8) + user(32) + referrer(32) + registered_at(8) + bump(1)
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
 * Get user's referrer information (as a referrer)
 */
export function useSolanaReferrerInfo() {
  let connection: ReturnType<typeof useConnection>['connection'];
  try {
    const conn = useConnection();
    connection = conn.connection;
  } catch {
    connection = null as any;
  }
  let wallet: ReturnType<typeof useWallet>;
  try {
    wallet = useWallet();
  } catch {
    wallet = { publicKey: null, connected: false } as any;
  }
  const { publicKey } = wallet;
  const [referrerInfo, setReferrerInfo] = useState<SolanaReferrerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReferrerInfo = useCallback(async () => {
    if (!publicKey || !connection) {
      setReferrerInfo(null);
      return;
    }

    setIsLoading(true);
    try {
      const [referrerInfoPDA] = getReferrerInfoPDA(publicKey);
      const accountInfo = await connection.getAccountInfo(referrerInfoPDA);
      
      // Get PopCowDefi token price
      const popCowDefiPrice = await getTokenPrice(POPCOWDEFI_TOKEN_MINT.toBase58());
      
      if (accountInfo && accountInfo.data.length > 8) {
        // Parse ReferrerInfo data
        // Structure: discriminator(8) + referrer(32) + total_referred(4) + total_earned(8) + pending_rewards(8) + referee_staked_usd(8) + bump(1)
        const view = new DataView(accountInfo.data.buffer, accountInfo.data.byteOffset);
        
        const totalReferred = view.getUint32(40, true);
        const totalEarned = Number(view.getBigUint64(44, true));
        const pendingRewards = Number(view.getBigUint64(52, true));
        const refereeStakedUSD = Number(view.getBigUint64(60, true));
        
        const currentTier = getTierFromReferrals(totalReferred);
        
        // Convert to USD (6 decimals)
        const totalEarnedUSD = totalEarned / 1e6;
        const pendingRewardsUSD = pendingRewards / 1e6;
        
        // Calculate equivalent PopCowDefi token amount
        let totalEarnedPopCowDefi = 0;
        let pendingRewardsPopCowDefi = 0;
        
        if (popCowDefiPrice && popCowDefiPrice > 0) {
          // PopCowDefi token has 6 decimals
          totalEarnedPopCowDefi = totalEarnedUSD / popCowDefiPrice;
          pendingRewardsPopCowDefi = pendingRewardsUSD / popCowDefiPrice;
        }
        
        setReferrerInfo({
          referrer: publicKey.toBase58(),
          totalReferred,
          totalEarned: totalEarnedUSD,
          pendingRewards: pendingRewardsUSD,
          refereeStakedUSD: refereeStakedUSD / 1e6,
          currentTier,
          currentRate: currentTier.rate / 100, // Convert to percentage
          totalEarnedPopCowDefi,
          pendingRewardsPopCowDefi,
          popCowDefiPrice: popCowDefiPrice || undefined,
        });
      } else {
        // User hasn't initialized referrer info yet
        setReferrerInfo({
          referrer: publicKey.toBase58(),
          totalReferred: 0,
          totalEarned: 0,
          pendingRewards: 0,
          refereeStakedUSD: 0,
          currentTier: SOLANA_REFERRAL_TIERS[0],
          currentRate: 5,
          totalEarnedPopCowDefi: 0,
          pendingRewardsPopCowDefi: 0,
          popCowDefiPrice: popCowDefiPrice || undefined,
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
 * Register referral relationship
 */
export function useSolanaRegisterReferral() {
  let connection: ReturnType<typeof useConnection>['connection'];
  try {
    const conn = useConnection();
    connection = conn.connection;
  } catch {
    connection = null as any;
  }
  let wallet: ReturnType<typeof useWallet>;
  try {
    wallet = useWallet();
  } catch {
    wallet = { publicKey: null, signTransaction: null, sendTransaction: null } as any;
  }
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const registerReferral = useCallback(
    async (referrerAddress?: string) => {
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error('Wallet not connected');
      }

      // Use provided referrer or default admin
      const referrerPubkey = referrerAddress 
        ? new PublicKey(referrerAddress)
        : DEFAULT_REFERRER_SOLANA;

      // Cannot refer yourself
      if (referrerPubkey.equals(wallet.publicKey)) {
        throw new Error('Cannot refer yourself');
      }

      setIsPending(true);
      setIsSuccess(false);
      setError(null);
      setTxHash(null);

      try {
        // Get PDAs
        const [referralPDA] = getReferralPDA(wallet.publicKey);
        const [referrerInfoPDA] = getReferrerInfoPDA(referrerPubkey);

        // Build transaction (requires Anchor IDL)
        // Transaction framework shown here
        console.log('Registering referral:', {
          user: wallet.publicKey.toBase58(),
          referrer: referrerPubkey.toBase58(),
          referralPDA: referralPDA.toBase58(),
          referrerInfoPDA: referrerInfoPDA.toBase58(),
        });

        // Actual implementation requires Anchor
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

        // Simulate success
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

  // Bind to default referrer (admin)
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
 * Initialize referrer info account
 */
export function useSolanaInitializeReferrerInfo() {
  let connection: ReturnType<typeof useConnection>['connection'];
  try {
    const conn = useConnection();
    connection = conn.connection;
  } catch {
    connection = null as any;
  }
  let wallet: ReturnType<typeof useWallet>;
  try {
    wallet = useWallet();
  } catch {
    wallet = { publicKey: null, signTransaction: null } as any;
  }
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

      // Actual implementation requires Anchor
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
 * Claim referral rewards
 */
export function useSolanaClaimReferralRewards() {
  let connection: ReturnType<typeof useConnection>['connection'];
  try {
    const conn = useConnection();
    connection = conn.connection;
  } catch {
    connection = null as any;
  }
  let wallet: ReturnType<typeof useWallet>;
  try {
    wallet = useWallet();
  } catch {
    wallet = { publicKey: null, signTransaction: null } as any;
  }
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

      // Actual implementation requires Anchor
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
 * Get referral system configuration
 */
export function useSolanaReferralConfig() {
  let connection: ReturnType<typeof useConnection>['connection'];
  try {
    const conn = useConnection();
    connection = conn.connection;
  } catch {
    connection = null as any;
  }
  const [config, setConfig] = useState<SolanaReferralConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchConfig = useCallback(async () => {
    if (!connection) {
      // Use default configuration
      setConfig({
        referralRates: [500, 800, 1000, 1200, 1500],
        referralTiers: [1, 5, 10, 25, 50],
        inviteeBonus: 5,
        enabled: true,
      });
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const [configPDA] = getReferralConfigPDA();
      const accountInfo = await connection.getAccountInfo(configPDA);
      
      if (accountInfo && accountInfo.data.length > 8) {
        // Parse ReferralConfig data
        // Structure: discriminator(8) + referral_rates([u16;5]=10) + referral_tiers([u16;5]=10) + invitee_bonus(2) + enabled(1) + bump(1)
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
          inviteeBonus: inviteeBonus / 100, // Convert to percentage
          enabled,
        });
      } else {
        // Use default configuration
        setConfig({
          referralRates: [500, 800, 1000, 1200, 1500],
          referralTiers: [1, 5, 10, 25, 50],
          inviteeBonus: 5,
          enabled: true,
        });
      }
    } catch (error) {
      console.error('Failed to fetch referral config:', error);
      // Use default configuration
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
 * Combined Hook - Solana complete referral rewards functionality
 */
export function useSolanaReferral() {
  let wallet: ReturnType<typeof useWallet>;
  try {
    wallet = useWallet();
  } catch {
    wallet = { publicKey: null, connected: false } as any;
  }
  const { publicKey, connected } = wallet;
  const { hasReferrer, referrer, isLoading: loadingReferrer, refetch: refetchReferrer } = useSolanaHasReferrer();
  const { referrerInfo, isLoading: loadingInfo, refetch: refetchInfo } = useSolanaReferrerInfo();
  const { config, isLoading: loadingConfig } = useSolanaReferralConfig();
  
  const registerAction = useSolanaRegisterReferral();
  const initAction = useSolanaInitializeReferrerInfo();
  const claimAction = useSolanaClaimReferralRewards();

  // Check if referrer binding is needed
  const needsReferrer = useMemo(() => {
    return connected && !loadingReferrer && !hasReferrer;
  }, [connected, loadingReferrer, hasReferrer]);

  // Generate referral link
  const referralLink = useMemo(() => {
    if (!publicKey) return null;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://app.popcow.xyz';
    return `${baseUrl}/staking?ref=${publicKey.toBase58()}`;
  }, [publicKey]);

  // Generate referral code (short format of wallet address)
  const referralCode = useMemo(() => {
    if (!publicKey) return null;
    const addr = publicKey.toBase58();
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  }, [publicKey]);

  // Get referrer address from URL
  const getReferrerFromUrl = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && ref.length >= 32 && ref.length <= 44) {
      try {
        new PublicKey(ref); // Validate if it's a valid Solana address
        return ref;
      } catch {
        return null;
      }
    }
    return null;
  }, []);

  // Auto bind referrer (prefer URL parameter, otherwise use default admin)
  const autoBindReferrer = useCallback(async () => {
    const urlReferrer = getReferrerFromUrl();
    await registerAction.registerReferral(urlReferrer || undefined);
  }, [getReferrerFromUrl, registerAction]);

  const refetchAll = useCallback(() => {
    refetchReferrer();
    refetchInfo();
  }, [refetchReferrer, refetchInfo]);

  return {
    // State
    isConnected: connected,
    publicKey: publicKey?.toBase58() || null,
    hasReferrer,
    needsReferrer,
    myReferrer: referrer,
    referrerInfo,
    config,
    isLoading: loadingReferrer || loadingInfo || loadingConfig,

    // Default referrer
    defaultReferrer: DEFAULT_REFERRER_SOLANA.toBase58(),

    // Referral link/code
    referralLink,
    referralCode,

    // Actions
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

    // URL utilities
    getReferrerFromUrl,

    // Refresh
    refetch: refetchAll,
  };
}

// Export constants
export { PROGRAM_ID, getReferralPDA, getReferrerInfoPDA, getReferralConfigPDA };
