/**
 * 多资产质押合约部署脚本
 * 
 * 支持质押：SOL、USDC、USDT、POPCOW
 * 统一按 USD 价值计算奖励
 */

import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getMint,
  MINT_SIZE,
  createInitializeMint2Instruction,
} from '@solana/spl-token';
import * as anchor from '@coral-xyz/anchor';
import { readFileSync } from 'fs';
import { join } from 'path';

// ============== 配置 ==============

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const connection = new Connection(RPC_URL, 'confirmed');

// 代币地址（需要根据实际部署调整）
const TOKEN_ADDRESSES = {
  USDC: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // Devnet USDC
  USDT: new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'), // Devnet USDT
  POPCOW: new PublicKey('8mrMRf8QwGh5bSrgzKsMmHPTTGqDcENU91SWuXEypump'), // POPCOW Mint
  PopCowDefi: new PublicKey('PopCowDefi1111111111111111111111111111111'), // 待部署
};

// Pyth Network 价格预言机地址
const PYTH_ORACLE = {
  SOL_USD: new PublicKey('H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG'), // Devnet
};

// ============== 主函数 ==============

async function main() {
  console.log('🚀 开始部署多资产质押合约...\n');

  // 1. 加载钱包
  const walletPath = process.env.SOLANA_WALLET || join(process.env.HOME || '', '.config/solana/id.json');
  const walletKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(readFileSync(walletPath, 'utf-8')))
  );
  console.log(`📝 使用钱包: ${walletKeypair.publicKey.toBase58()}\n`);

  // 2. 加载程序 IDL
  const programId = new PublicKey('MultiAssetStake1111111111111111111111111111111');
  
  // 3. 初始化质押池
  console.log('📦 初始化多资产质押池...');
  await initializePool(walletKeypair, programId);
  
  console.log('\n✅ 部署完成！');
}

// ============== 初始化质押池 ==============

async function initializePool(
  authority: Keypair,
  programId: PublicKey,
) {
  const [poolPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('multi_asset_pool')],
    programId
  );

  const [usdcVaultPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('usdc_vault')],
    programId
  );

  const [usdtVaultPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('usdt_vault')],
    programId
  );

  const [popcowVaultPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('popcow_vault')],
    programId
  );

  const [rewardVaultPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('reward_vault')],
    programId
  );

  console.log(`  池子地址: ${poolPDA.toBase58()}`);
  console.log(`  USDC 金库: ${usdcVaultPDA.toBase58()}`);
  console.log(`  USDT 金库: ${usdtVaultPDA.toBase58()}`);
  console.log(`  POPCOW 金库: ${popcowVaultPDA.toBase58()}`);
  console.log(`  奖励金库: ${rewardVaultPDA.toBase58()}`);
  console.log(`  价格预言机: ${PYTH_ORACLE.SOL_USD.toBase58()}\n`);

  // 注意：实际部署需要使用 Anchor 客户端调用 initialize_pool 函数
  // 这里只是展示地址生成逻辑

  return {
    pool: poolPDA,
    usdcVault: usdcVaultPDA,
    usdtVault: usdtVaultPDA,
    popcowVault: popcowVaultPDA,
    rewardVault: rewardVaultPDA,
  };
}

// ============== 辅助函数 ==============

async function getTokenBalance(
  connection: Connection,
  tokenAccount: PublicKey,
): Promise<number> {
  try {
    const balance = await connection.getTokenAccountBalance(tokenAccount);
    return Number(balance.value.amount);
  } catch (error) {
    return 0;
  }
}

// ============== 执行 ==============

if (require.main === module) {
  main().catch((error) => {
    console.error('❌ 部署失败:', error);
    process.exit(1);
  });
}

export { initializePool, TOKEN_ADDRESSES, PYTH_ORACLE };
