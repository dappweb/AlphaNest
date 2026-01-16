import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor';
import { 
  getAssociatedTokenAddress, 
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { useState, useEffect, useCallback } from 'react';

// 程序 ID（需要替换为实际部署的地址）
const YIELD_VAULT_PROGRAM_ID = new PublicKey('YieldVault1111111111111111111111111111111111');

// 代币 Mint 地址（示例）
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');

export enum VaultType {
  Flexible = 'flexible',
  Stable = 'stable',
  Growth = 'growth',
  Aggressive = 'aggressive',
}

export interface VaultInfo {
  vaultType: VaultType;
  apy: number;
  lockPeriod: number;
  minDeposit: number;
  totalDeposited: number;
  totalEarnings: number;
}

export interface UserPosition {
  depositedAmount: number;
  earnedAmount: number;
  shares: number;
  lastUpdateTime: number;
}

export function useYieldVault() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [vaultInfo, setVaultInfo] = useState<VaultInfo | null>(null);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取金库信息
  const fetchVaultInfo = useCallback(async (vaultType: VaultType) => {
    if (!wallet.publicKey) return;

    setIsLoading(true);
    setError(null);

    try {
      // 这里应该调用程序获取金库信息
      // 简化版示例
      const [vaultPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('vault'),
          Buffer.from(vaultType),
        ],
        YIELD_VAULT_PROGRAM_ID
      );

      // 实际应该从链上账户读取数据
      const info: VaultInfo = {
        vaultType,
        apy: getVaultApy(vaultType),
        lockPeriod: getLockPeriod(vaultType),
        minDeposit: 100 * 1e6, // 100 USDC
        totalDeposited: 0,
        totalEarnings: 0,
      };

      setVaultInfo(info);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch vault info');
    } finally {
      setIsLoading(false);
    }
  }, [wallet.publicKey]);

  // 获取用户持仓
  const fetchUserPosition = useCallback(async (vaultType: VaultType) => {
    if (!wallet.publicKey) return;

    setIsLoading(true);
    setError(null);

    try {
      const [vaultPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('vault'),
          Buffer.from(vaultType),
        ],
        YIELD_VAULT_PROGRAM_ID
      );

      const [positionPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('position'),
          wallet.publicKey.toBuffer(),
          vaultPda.toBuffer(),
        ],
        YIELD_VAULT_PROGRAM_ID
      );

      // 实际应该从链上账户读取数据
      const position: UserPosition = {
        depositedAmount: 0,
        earnedAmount: 0,
        shares: 0,
        lastUpdateTime: Date.now() / 1000,
      };

      setUserPosition(position);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user position');
    } finally {
      setIsLoading(false);
    }
  }, [wallet.publicKey]);

  // 存款
  const deposit = useCallback(async (
    vaultType: VaultType,
    amount: number,
    tokenMint: PublicKey = USDC_MINT
  ) => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: 'confirmed' }
      );

      // 获取 PDA
      const [vaultPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('vault'),
          Buffer.from(vaultType),
        ],
        YIELD_VAULT_PROGRAM_ID
      );

      const [vaultTokenAccount] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('vault_token'),
          vaultPda.toBuffer(),
        ],
        YIELD_VAULT_PROGRAM_ID
      );

      const [userPositionPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('position'),
          wallet.publicKey.toBuffer(),
          vaultPda.toBuffer(),
        ],
        YIELD_VAULT_PROGRAM_ID
      );

      const userTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        wallet.publicKey,
        false,
        TOKEN_PROGRAM_ID
      );

      // 构建交易
      // 这里需要实际的程序 IDL
      // const program = new Program(IDL, YIELD_VAULT_PROGRAM_ID, provider);
      
      // const tx = await program.methods
      //   .deposit(new BN(amount * 1e6))
      //   .accounts({
      //     user: wallet.publicKey,
      //     vault: vaultPda,
      //     userPosition: userPositionPda,
      //     userTokenAccount,
      //     vaultTokenAccount,
      //     tokenProgram: TOKEN_PROGRAM_ID,
      //     systemProgram: SystemProgram.programId,
      //   })
      //   .rpc();

      // return tx;
      
      // 简化版返回
      return 'mock_tx_signature';
    } catch (err: any) {
      setError(err.message || 'Deposit failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [connection, wallet]);

  // 提取
  const withdraw = useCallback(async (
    vaultType: VaultType,
    amount: number,
    tokenMint: PublicKey = USDC_MINT
  ) => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      // 类似存款的实现
      // ...
      return 'mock_tx_signature';
    } catch (err: any) {
      setError(err.message || 'Withdraw failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [connection, wallet]);

  // 领取收益
  const claimEarnings = useCallback(async (
    vaultType: VaultType,
    tokenMint: PublicKey = USDC_MINT
  ) => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      // 类似存款的实现
      // ...
      return 'mock_tx_signature';
    } catch (err: any) {
      setError(err.message || 'Claim earnings failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [connection, wallet]);

  return {
    vaultInfo,
    userPosition,
    isLoading,
    error,
    fetchVaultInfo,
    fetchUserPosition,
    deposit,
    withdraw,
    claimEarnings,
  };
}

// 辅助函数
function getVaultApy(vaultType: VaultType): number {
  switch (vaultType) {
    case VaultType.Flexible:
      return 40;
    case VaultType.Stable:
      return 55;
    case VaultType.Growth:
      return 80;
    case VaultType.Aggressive:
      return 120;
    default:
      return 0;
  }
}

function getLockPeriod(vaultType: VaultType): number {
  switch (vaultType) {
    case VaultType.Flexible:
      return 0;
    case VaultType.Stable:
      return 30;
    case VaultType.Growth:
      return 90;
    case VaultType.Aggressive:
      return 180;
    default:
      return 0;
  }
}
