/**
 * POP Vault 质押池初始化脚本
 * 
 * 使用方法:
 * npx ts-node scripts/initialize-staking.ts
 */

import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import * as fs from 'fs';
import * as path from 'path';

// 配置
const NETWORK = process.env.SOLANA_NETWORK || 'devnet';
const RPC_URL = process.env.SOLANA_RPC_URL || clusterApiUrl(NETWORK as any);

// 代币地址
const POPCOW_MINT = new PublicKey('8mrMRf8QwGh5bSrgzKsMmHPTTGqDcENU91SWuXEypump');
const POPCOW_DEFI_MINT = new PublicKey('4sCGHM2NL1nV6fYfWSoCTMwmJDCjfHub9pSpz128pump');

// 质押程序 ID (部署后填入)
const STAKING_PROGRAM_ID = new PublicKey('FMo6ENLsDNzowrzjDJgow7AR7kGci8J2GazuCK9z3SUC');

// 奖励率配置 (每秒奖励的基础单位)
// 计算: 假设总质押 1M POPCOW, 年化 24% 平均
// 年奖励 = 1M * 24% = 240K POPCOW DEFI
// 秒奖励 = 240K / (365 * 24 * 3600) ≈ 7.6 POPCOW DEFI/秒
const REWARD_RATE_PER_SECOND = 7_600_000; // 7.6 * 10^6 (6 decimals)

async function main() {
  console.log('🐄 POP Vault 质押池初始化脚本');
  console.log('================================');
  console.log(`网络: ${NETWORK}`);
  console.log(`RPC: ${RPC_URL}`);
  console.log('');

  // 加载钱包
  const walletPath = process.env.WALLET_PATH || path.join(process.env.HOME!, '.config/solana/id.json');
  if (!fs.existsSync(walletPath)) {
    console.error('❌ 钱包文件不存在:', walletPath);
    console.log('请设置 WALLET_PATH 环境变量或使用默认路径');
    process.exit(1);
  }

  const walletKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, 'utf-8')))
  );
  console.log('📝 钱包地址:', walletKeypair.publicKey.toBase58());

  // 连接
  const connection = new Connection(RPC_URL, 'confirmed');
  const balance = await connection.getBalance(walletKeypair.publicKey);
  console.log('💰 SOL 余额:', balance / 1e9, 'SOL');
  console.log('');

  // 检查程序是否已部署
  const programInfo = await connection.getAccountInfo(STAKING_PROGRAM_ID);
  if (!programInfo) {
    console.error('❌ 质押程序尚未部署');
    console.log('请先运行: anchor deploy');
    process.exit(1);
  }
  console.log('✅ 质押程序已部署');

  // 计算 PDA 地址
  const [poolPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool')],
    STAKING_PROGRAM_ID
  );
  const [stakeVaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('stake_vault')],
    STAKING_PROGRAM_ID
  );
  const [rewardVaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('reward_vault')],
    STAKING_PROGRAM_ID
  );

  console.log('📍 PDA 地址:');
  console.log('   Pool:', poolPda.toBase58());
  console.log('   Stake Vault:', stakeVaultPda.toBase58());
  console.log('   Reward Vault:', rewardVaultPda.toBase58());
  console.log('');

  // 检查池子是否已初始化
  const poolInfo = await connection.getAccountInfo(poolPda);
  if (poolInfo) {
    console.log('⚠️  质押池已经初始化');
    console.log('如需重新初始化，请先关闭现有池子');
    return;
  }

  console.log('🚀 准备初始化质押池...');
  console.log('   质押代币: POPCOW', POPCOW_MINT.toBase58());
  console.log('   奖励代币: POPCOW DEFI', POPCOW_DEFI_MINT.toBase58());
  console.log('   奖励率:', REWARD_RATE_PER_SECOND / 1e6, 'POPCOW DEFI/秒');
  console.log('   兑换比例: 1:2 (1 POPCOW = 2 POPCOW DEFI)');
  console.log('');

  // 构建交易
  // TODO: 使用 Anchor 程序调用 initialize_pool
  console.log('📝 构建初始化交易...');
  console.log('');
  console.log('注意: 实际初始化需要使用 Anchor 框架');
  console.log('请使用以下命令:');
  console.log('');
  console.log('```bash');
  console.log('cd contracts/solana');
  console.log('anchor run initialize-pool');
  console.log('```');
  console.log('');
  console.log('或者在 Anchor 测试中初始化:');
  console.log('');
  console.log('```typescript');
  console.log('await program.methods');
  console.log('  .initializePool(new BN(' + REWARD_RATE_PER_SECOND + '))');
  console.log('  .accounts({');
  console.log('    authority: wallet.publicKey,');
  console.log('    pool: poolPda,');
  console.log('    stakeMint: POPCOW_MINT,');
  console.log('    rewardMint: POPCOW_DEFI_MINT,');
  console.log('    stakeVault: stakeVaultPda,');
  console.log('    rewardVault: rewardVaultPda,');
  console.log('    systemProgram: SystemProgram.programId,');
  console.log('    tokenProgram: TOKEN_PROGRAM_ID,');
  console.log('    rent: SYSVAR_RENT_PUBKEY,');
  console.log('  })');
  console.log('  .rpc();');
  console.log('```');

  console.log('');
  console.log('================================');
  console.log('✅ 脚本执行完成');
}

main().catch(console.error);
