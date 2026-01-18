import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  POPCOW_TOKEN_MINT,
  POPCOWDEFI_TOKEN_MINT,
  STAKING_POOLS,
  SOLANA_RPC_ENDPOINT,
  calculateDailyReward,
  calculatePendingReward,
} from './constants';

export interface StakeInfo {
  owner: PublicKey;
  amount: number;
  poolId: number;
  startTime: number;
  pendingRewards: number;
  lastClaimTime: number;
}

export interface PoolStats {
  totalStaked: number;
  totalStakers: number;
  totalRewardsDistributed: number;
  apy: number;
}

// 获取用户代币余额
export async function getTokenBalance(
  connection: Connection,
  owner: PublicKey,
  mint: PublicKey
): Promise<number> {
  try {
    const ata = await getAssociatedTokenAddress(mint, owner);
    const balance = await connection.getTokenAccountBalance(ata);
    return Number(balance.value.uiAmount) || 0;
  } catch {
    return 0;
  }
}

// 获取用户 PopCowDefi 代币余额
export async function getPopCowTokenBalance(
  connection: Connection,
  owner: PublicKey
): Promise<number> {
  return getTokenBalance(connection, owner, POPCOW_TOKEN_MINT);
}

// 获取用户 PopCowDefi 代币余额
export async function getPopCowDefiBalance(
  connection: Connection,
  owner: PublicKey
): Promise<number> {
  return getTokenBalance(connection, owner, POPCOWDEFI_TOKEN_MINT);
}

// 质押 PopCowDefi 代币
export async function stakePopCowTokens(
  connection: Connection,
  owner: PublicKey,
  amount: number,
  poolId: number,
  signTransaction: (tx: Transaction) => Promise<Transaction>
): Promise<string> {
  const pool = Object.values(STAKING_POOLS).find(p => p.id === poolId);
  if (!pool) throw new Error('Invalid pool');

  // 获取用户代币账户
  const userTokenAccount = await getAssociatedTokenAddress(POPCOW_TOKEN_MINT, owner);

  // TODO: 替换为实际的质押金库地址
  const stakingVault = new PublicKey('11111111111111111111111111111111');

  // 创建转账指令
  const transferIx = createTransferInstruction(
    userTokenAccount,
    stakingVault,
    owner,
    amount * Math.pow(10, 6) // Pump token has 6 decimals
  );

  const transaction = new Transaction().add(transferIx);
  transaction.feePayer = owner;
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  const signedTx = await signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signedTx.serialize());

  await connection.confirmTransaction(signature, 'confirmed');

  return signature;
}

// 解除质押
export async function unstakePumpTokens(
  connection: Connection,
  owner: PublicKey,
  amount: number,
  poolId: number,
  signTransaction: (tx: Transaction) => Promise<Transaction>
): Promise<string> {
  const pool = Object.values(STAKING_POOLS).find(p => p.id === poolId);
  if (!pool) throw new Error('Invalid pool');

  // TODO: 实现解除质押逻辑
  // 需要调用质押合约的 unstake 方法

  throw new Error('Unstaking not yet implemented - pending contract deployment');
}

// 领取奖励
export async function claimRewards(
  connection: Connection,
  owner: PublicKey,
  poolId: number,
  signTransaction: (tx: Transaction) => Promise<Transaction>
): Promise<string> {
  // TODO: 实现领取奖励逻辑
  // 需要调用质押合约的 claim 方法

  throw new Error('Claim rewards not yet implemented - pending contract deployment');
}

// 获取用户质押信息 (模拟数据，待合约部署后替换)
export async function getUserStakeInfo(
  connection: Connection,
  owner: PublicKey
): Promise<StakeInfo[]> {
  // TODO: 从链上获取实际数据
  // 目前返回模拟数据用于 UI 开发
  return [];
}

// 获取质押池统计 (模拟数据，待合约部署后替换)
export async function getPoolStats(
  connection: Connection,
  poolId: number
): Promise<PoolStats> {
  const pool = Object.values(STAKING_POOLS).find(p => p.id === poolId);
  if (!pool) throw new Error('Invalid pool');

  // TODO: 从链上获取实际数据
  return {
    totalStaked: 0,
    totalStakers: 0,
    totalRewardsDistributed: 0,
    apy: pool.apy,
  };
}

// 计算预估奖励
export function estimateRewards(
  amount: number,
  poolId: number,
  days: number
): { daily: number; total: number; apy: number } {
  const pool = Object.values(STAKING_POOLS).find(p => p.id === poolId);
  if (!pool) return { daily: 0, total: 0, apy: 0 };

  const daily = calculateDailyReward(amount, poolId);
  const total = calculatePendingReward(amount, poolId, days);

  return {
    daily,
    total,
    apy: pool.apy * pool.multiplier,
  };
}

// 创建连接
export function createConnection(): Connection {
  return new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
}
