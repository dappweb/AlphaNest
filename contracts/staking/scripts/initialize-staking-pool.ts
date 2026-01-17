import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';
import { Program, AnchorProvider, Wallet, BN } from '@coral-xyz/anchor';

/**
 * 初始化质押池脚本
 * 
 * 配置:
 * - 质押代币: POPCOW
 * - 奖励代币: PopCowDefi
 * - 兑换比例: 1 POPCOW = 2 PopCowDefi
 */

interface StakingConfig {
  popcowMint: string;        // POPCOW 代币 Mint 地址
  popcowDefiMint: string;    // PopCowDefi 代币 Mint 地址
  rewardRatePerSecond: number; // 每秒奖励率（基础）
  rpcUrl?: string;
  walletPath?: string;
}

// 兑换比例（固定）
const CONVERSION_RATE = 2;  // 1 POPCOW = 2 PopCowDefi

async function initializeStakingPool(config: StakingConfig) {
  console.log('🐄 初始化 PopCowDefi 质押池\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('配置信息:');
  console.log(`  质押代币 (POPCOW): ${config.popcowMint}`);
  console.log(`  奖励代币 (PopCowDefi): ${config.popcowDefiMint}`);
  console.log(`  基础奖励率: ${config.rewardRatePerSecond} 基点/秒`);
  console.log(`  兑换比例: 1 POPCOW = ${CONVERSION_RATE} PopCowDefi`);
  console.log(`  实际奖励率: ${config.rewardRatePerSecond * CONVERSION_RATE} 基点/秒`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 连接 Solana
  const rpcUrl = config.rpcUrl || process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  const connection = new Connection(rpcUrl, 'confirmed');
  console.log(`📡 连接到: ${rpcUrl}\n`);

  // 加载钱包
  const walletPath = config.walletPath || process.env.WALLET_PATH || '~/.config/solana/id.json';
  const resolvedPath = walletPath.startsWith('~')
    ? path.join(process.env.HOME || '', walletPath.slice(1))
    : walletPath;
  
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`钱包文件不存在: ${resolvedPath}`);
  }
  
  const walletKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(resolvedPath, 'utf-8')))
  );
  console.log(`💰 钱包地址: ${walletKeypair.publicKey.toBase58()}\n`);

  // 创建 Provider
  const wallet = new Wallet(walletKeypair);
  const provider = new AnchorProvider(connection, wallet, {});

  // 加载程序 IDL（需要先编译）
  // const programId = new PublicKey('PopStake1111111111111111111111111111111111');
  // const idl = await Program.fetchIdl(programId, provider);
  // const program = new Program(idl, programId, provider);

  const popcowMint = new PublicKey(config.popcowMint);
  const popcowDefiMint = new PublicKey(config.popcowDefiMint);

  console.log('📝 初始化步骤:');
  console.log('  1. 创建质押池账户');
  console.log('  2. 创建代币金库 (Stake Vault & Reward Vault)');
  console.log('  3. 设置奖励率');
  console.log('  4. 设置兑换比例 (1:2)');
  console.log('');

  // 计算 PDA
  const [poolPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool')],
    new PublicKey('PopStake1111111111111111111111111111111111')
  );

  const [stakeVaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('stake_vault')],
    new PublicKey('PopStake1111111111111111111111111111111111')
  );

  const [rewardVaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('reward_vault')],
    new PublicKey('PopStake1111111111111111111111111111111111')
  );

  console.log('📍 账户地址:');
  console.log(`  质押池: ${poolPda.toBase58()}`);
  console.log(`  质押金库: ${stakeVaultPda.toBase58()}`);
  console.log(`  奖励金库: ${rewardVaultPda.toBase58()}\n`);

  // 注意: 实际初始化需要使用 Anchor 程序
  // 这里只是展示配置信息
  console.log('⚠️  注意: 实际初始化需要使用 Anchor 程序');
  console.log('');
  console.log('执行命令:');
  console.log('  anchor build');
  console.log('  anchor deploy --provider.cluster devnet');
  console.log('');
  console.log('或使用 Anchor 测试:');
  console.log('  anchor test --skip-local-validator');
  console.log('');

  // 保存配置
  const poolConfig = {
    poolAddress: poolPda.toBase58(),
    stakeVault: stakeVaultPda.toBase58(),
    rewardVault: rewardVaultPda.toBase58(),
    popcowMint: config.popcowMint,
    popcowDefiMint: config.popcowDefiMint,
    rewardRatePerSecond: config.rewardRatePerSecond,
    conversionRate: CONVERSION_RATE,
    actualRewardRate: config.rewardRatePerSecond * CONVERSION_RATE,
    network: rpcUrl.includes('devnet') ? 'devnet' : 'mainnet-beta',
    initializedAt: new Date().toISOString(),
  };

  const configPath = path.join(process.cwd(), 'staking-pool-config.json');
  fs.writeFileSync(configPath, JSON.stringify(poolConfig, null, 2));
  console.log(`✅ 配置已保存到: ${configPath}\n`);

  console.log('🎉 质押池配置完成！');
  console.log('');
  console.log('📊 奖励计算示例:');
  console.log(`  质押 1,000 POPCOW`);
  console.log(`  基础奖励率: ${config.rewardRatePerSecond} 基点/秒`);
  console.log(`  实际奖励率: ${config.rewardRatePerSecond * CONVERSION_RATE} 基点/秒 (应用 1:2 比例)`);
  console.log(`  30天灵活质押: ~${calculateReward(1000, 30, 1).toLocaleString()} PopCowDefi`);
  console.log(`  90天锁定质押: ~${calculateReward(1000, 90, 4).toLocaleString()} PopCowDefi`);
  console.log('');

  return poolConfig;
}

// 计算奖励（简化版）
function calculateReward(
  stakedAmount: number,
  days: number,
  lockMultiplier: number
): number {
  const seconds = days * 24 * 60 * 60;
  const baseRate = 0.001;  // 假设基础奖励率
  const actualRate = baseRate * CONVERSION_RATE;  // 应用 1:2 比例
  
  return stakedAmount * actualRate * seconds * lockMultiplier;
}

// 主函数
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('📖 使用方法:');
    console.log('');
    console.log('  npx ts-node initialize-staking-pool.ts <POPCOW_MINT> <POPCOWDEFI_MINT> [REWARD_RATE]');
    console.log('');
    console.log('参数:');
    console.log('  POPCOW_MINT      - POPCOW 代币 Mint 地址');
    console.log('  POPCOWDEFI_MINT  - PopCowDefi 代币 Mint 地址');
    console.log('  REWARD_RATE      - 每秒奖励率（基点，默认 1000）');
    console.log('');
    console.log('示例:');
    console.log('  npx ts-node initialize-staking-pool.ts \\');
    console.log('    PopCow1111111111111111111111111111111111111 \\');
    console.log('    PopCowDefi1111111111111111111111111111111111 \\');
    console.log('    1000');
    return;
  }

  const config: StakingConfig = {
    popcowMint: args[0],
    popcowDefiMint: args[1],
    rewardRatePerSecond: args[2] ? parseInt(args[2]) : 1000,
  };

  await initializeStakingPool(config);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ 错误:', err);
      process.exit(1);
    });
}

export { initializeStakingPool, CONVERSION_RATE };
