/**
 * 管理员添加自定义代币示例脚本
 * 
 * 演示如何通过后台管理系统添加新的代币作为质押品种
 */

import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import * as anchor from '@coral-xyz/anchor';
import { readFileSync } from 'fs';
import { join } from 'path';

// ============== 配置 ==============

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const connection = new Connection(RPC_URL, 'confirmed');

// 程序 ID
const PROGRAM_ID = new PublicKey('MultiAssetStake1111111111111111111111111111111');

// ============== 示例：添加 BONK 代币 ==============

async function addBonkToken() {
  console.log('🚀 添加 BONK 代币作为质押品种...\n');

  // 1. 加载管理员钱包
  const adminPath = process.env.ADMIN_WALLET || join(process.env.HOME || '', '.config/solana/id.json');
  const adminKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(readFileSync(adminPath, 'utf-8')))
  );

  // 2. 加载程序
  const idl = await anchor.Program.fetchIdl(PROGRAM_ID, new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(adminKeypair),
    { commitment: 'confirmed' }
  ));
  const program = new anchor.Program(idl!, PROGRAM_ID, new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(adminKeypair),
    { commitment: 'confirmed' }
  ));

  // 3. 代币信息
  const bonkMint = new PublicKey('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'); // BONK on Solana
  const tokenName = 'BONK';
  const tokenDecimals = 5; // BONK 有 5 位小数
  const baseApy = 1500; // 15% APY (1500 基点)
  const rewardMultiplier = 150; // 1.5x 奖励倍数
  const minStakeAmount = 1_000_000; // 最小质押 1 BONK (5 decimals)
  const isActive = true;

  // 4. 计算 PDA
  const [poolPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('multi_asset_pool')],
    PROGRAM_ID
  );

  const [tokenConfigPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('token_config'), bonkMint.toBuffer()],
    PROGRAM_ID
  );

  const [vaultPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('token_vault'), bonkMint.toBuffer()],
    PROGRAM_ID
  );

  // 5. 价格预言机（Pyth Network）
  const priceOracle = new PublicKey('H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG'); // 示例地址

  console.log('📝 配置信息:');
  console.log(`  代币: ${tokenName}`);
  console.log(`  Mint: ${bonkMint.toBase58()}`);
  console.log(`  小数位: ${tokenDecimals}`);
  console.log(`  基础 APY: ${baseApy / 100}%`);
  console.log(`  奖励倍数: ${rewardMultiplier / 100}x`);
  console.log(`  最小质押: ${minStakeAmount / 10**tokenDecimals} ${tokenName}`);
  console.log(`  Token Config PDA: ${tokenConfigPDA.toBase58()}`);
  console.log(`  Vault PDA: ${vaultPDA.toBase58()}\n`);

  // 6. 调用添加代币
  try {
    const tx = await program.methods
      .addStakeableToken(
        bonkMint,
        tokenName,
        tokenDecimals,
        new anchor.BN(baseApy),
        rewardMultiplier,
        new anchor.BN(minStakeAmount),
        isActive
      )
      .accounts({
        admin: adminKeypair.publicKey,
        pool: poolPDA,
        tokenConfig: tokenConfigPDA,
        vault: vaultPDA,
        tokenMint: bonkMint,
        priceOracle: priceOracle,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    console.log('✅ BONK 代币添加成功！');
    console.log(`   交易签名: ${tx}`);
    console.log(`   查看交易: https://solscan.io/tx/${tx}?cluster=devnet\n`);
  } catch (error) {
    console.error('❌ 添加失败:', error);
    throw error;
  }
}

// ============== 示例：添加 JUP 代币 ==============

async function addJupToken() {
  console.log('🚀 添加 JUP 代币作为质押品种...\n');

  const adminPath = process.env.ADMIN_WALLET || join(process.env.HOME || '', '.config/solana/id.json');
  const adminKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(readFileSync(adminPath, 'utf-8')))
  );

  const idl = await anchor.Program.fetchIdl(PROGRAM_ID, new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(adminKeypair),
    { commitment: 'confirmed' }
  ));
  const program = new anchor.Program(idl!, PROGRAM_ID, new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(adminKeypair),
    { commitment: 'confirmed' }
  ));

  const jupMint = new PublicKey('JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'); // Jupiter Token
  const tokenName = 'JUP';
  const tokenDecimals = 6;
  const baseApy = 1200; // 12% APY
  const rewardMultiplier = 120; // 1.2x
  const minStakeAmount = 10_000_000; // 10 JUP (6 decimals)
  const isActive = true;

  const [poolPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('multi_asset_pool')],
    PROGRAM_ID
  );

  const [tokenConfigPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('token_config'), jupMint.toBuffer()],
    PROGRAM_ID
  );

  const [vaultPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('token_vault'), jupMint.toBuffer()],
    PROGRAM_ID
  );

  const priceOracle = new PublicKey('H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG');

  try {
    const tx = await program.methods
      .addStakeableToken(
        jupMint,
        tokenName,
        tokenDecimals,
        new anchor.BN(baseApy),
        rewardMultiplier,
        new anchor.BN(minStakeAmount),
        isActive
      )
      .accounts({
        admin: adminKeypair.publicKey,
        pool: poolPDA,
        tokenConfig: tokenConfigPDA,
        vault: vaultPDA,
        tokenMint: jupMint,
        priceOracle: priceOracle,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    console.log('✅ JUP 代币添加成功！');
    console.log(`   交易签名: ${tx}\n`);
  } catch (error) {
    console.error('❌ 添加失败:', error);
    throw error;
  }
}

// ============== 示例：更新代币配置 ==============

async function updateTokenConfig(
  tokenMint: PublicKey,
  newApy?: number,
  newMultiplier?: number,
  newMinStake?: number,
  newActive?: boolean,
) {
  console.log(`🔄 更新代币配置: ${tokenMint.toBase58()}...\n`);

  const adminPath = process.env.ADMIN_WALLET || join(process.env.HOME || '', '.config/solana/id.json');
  const adminKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(readFileSync(adminPath, 'utf-8')))
  );

  const idl = await anchor.Program.fetchIdl(PROGRAM_ID, new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(adminKeypair),
    { commitment: 'confirmed' }
  ));
  const program = new anchor.Program(idl!, PROGRAM_ID, new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(adminKeypair),
    { commitment: 'confirmed' }
  ));

  const [poolPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('multi_asset_pool')],
    PROGRAM_ID
  );

  const [tokenConfigPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('token_config'), tokenMint.toBuffer()],
    PROGRAM_ID
  );

  try {
    const tx = await program.methods
      .updateTokenConfig(
        newApy ? { some: new anchor.BN(newApy) } : null,
        newMultiplier ? { some: newMultiplier } : null,
        newMinStake ? { some: new anchor.BN(newMinStake) } : null,
        newActive !== undefined ? { some: newActive } : null,
      )
      .accounts({
        admin: adminKeypair.publicKey,
        pool: poolPDA,
        tokenConfig: tokenConfigPDA,
      })
      .rpc();

    console.log('✅ 代币配置更新成功！');
    console.log(`   交易签名: ${tx}\n`);
  } catch (error) {
    console.error('❌ 更新失败:', error);
    throw error;
  }
}

// ============== 查询所有可质押代币 ==============

async function getAllStakeableTokens() {
  console.log('📋 查询所有可质押代币...\n');

  const adminPath = process.env.ADMIN_WALLET || join(process.env.HOME || '', '.config/solana/id.json');
  const adminKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(readFileSync(adminPath, 'utf-8')))
  );

  const idl = await anchor.Program.fetchIdl(PROGRAM_ID, new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(adminKeypair),
    { commitment: 'confirmed' }
  ));
  const program = new anchor.Program(idl!, PROGRAM_ID, new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(adminKeypair),
    { commitment: 'confirmed' }
  ));

  try {
    // 查询所有 TokenConfig
    const tokenConfigs = await program.account.tokenConfig.all();

    console.log(`找到 ${tokenConfigs.length} 个代币配置:\n`);

    for (const config of tokenConfigs) {
      const data = config.account;
      console.log(`代币: ${data.tokenName}`);
      console.log(`  Mint: ${data.tokenMint.toBase58()}`);
      console.log(`  基础 APY: ${data.baseApy / 100}%`);
      console.log(`  奖励倍数: ${data.rewardMultiplier / 100}x`);
      console.log(`  最小质押: ${data.minStakeAmount}`);
      console.log(`  总质押量: ${data.totalStaked}`);
      console.log(`  质押用户: ${data.totalStakers}`);
      console.log(`  状态: ${data.isActive ? '✅ 激活' : '❌ 停用'}`);
      console.log('');
    }
  } catch (error) {
    console.error('❌ 查询失败:', error);
    throw error;
  }
}

// ============== 主函数 ==============

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'add-bonk':
      await addBonkToken();
      break;
    case 'add-jup':
      await addJupToken();
      break;
    case 'update':
      const mint = new PublicKey(process.argv[3]);
      const apy = process.argv[4] ? parseInt(process.argv[4]) : undefined;
      const multiplier = process.argv[5] ? parseInt(process.argv[5]) : undefined;
      await updateTokenConfig(mint, apy, multiplier);
      break;
    case 'list':
      await getAllStakeableTokens();
      break;
    default:
      console.log('用法:');
      console.log('  npx ts-node add-custom-token-example.ts add-bonk    # 添加 BONK');
      console.log('  npx ts-node add-custom-token-example.ts add-jup      # 添加 JUP');
      console.log('  npx ts-node add-custom-token-example.ts update <mint> [apy] [multiplier]  # 更新配置');
      console.log('  npx ts-node add-custom-token-example.ts list        # 列出所有代币');
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('❌ 执行失败:', error);
    process.exit(1);
  });
}

export { addBonkToken, addJupToken, updateTokenConfig, getAllStakeableTokens };
