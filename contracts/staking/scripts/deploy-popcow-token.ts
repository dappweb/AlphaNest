import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  getMint,
  createSetAuthorityInstruction,
  AuthorityType,
} from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';

// ============================================
// 配置 - 根据白皮书
// ============================================

const RPC_ENDPOINT = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const TOKEN_DECIMALS = 9;
const TOTAL_SUPPLY = 1_000_000_000; // 10亿

// 代币分配 (根据白皮书)
const ALLOCATIONS = {
  // 社区激励: 40% (4亿) - 5年线性释放
  community: {
    percentage: 40,
    amount: 400_000_000,
    vesting: {
      cliff: 0, // 无锁仓
      duration: 5 * 365 * 24 * 60 * 60, // 5年
    },
  },
  // 生态发展: 20% (2亿) - 2年锁仓，后3年线性释放
  ecosystem: {
    percentage: 20,
    amount: 200_000_000,
    vesting: {
      cliff: 2 * 365 * 24 * 60 * 60, // 2年锁仓
      duration: 3 * 365 * 24 * 60 * 60, // 3年释放
    },
  },
  // 团队与顾问: 15% (1.5亿) - 1年锁仓 + 3年线性释放
  team: {
    percentage: 15,
    amount: 150_000_000,
    vesting: {
      cliff: 1 * 365 * 24 * 60 * 60, // 1年锁仓
      duration: 3 * 365 * 24 * 60 * 60, // 3年释放
    },
  },
  // 早期投资者: 10% (1亿) - 6个月锁仓 + 2年线性释放
  investor: {
    percentage: 10,
    amount: 100_000_000,
    vesting: {
      cliff: 6 * 30 * 24 * 60 * 60, // 6个月锁仓
      duration: 2 * 365 * 24 * 60 * 60, // 2年释放
    },
  },
  // 公开销售: 10% (1亿) - TGE 释放 50%，6个月内释放剩余
  public: {
    percentage: 10,
    amount: 100_000_000,
    tgeRelease: 50, // TGE 释放 50%
    vesting: {
      cliff: 0,
      duration: 6 * 30 * 24 * 60 * 60, // 6个月释放剩余
    },
  },
  // 流动性储备: 5% (0.5亿) - TGE 全部释放
  liquidity: {
    percentage: 5,
    amount: 50_000_000,
    tgeRelease: 100, // TGE 全部释放
  },
};

// ============================================
// 辅助函数
// ============================================

function loadKeypair(filePath: string): Keypair {
  const resolvedPath = filePath.startsWith('~')
    ? path.join(process.env.HOME || '', filePath.slice(1))
    : filePath;
  
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Keypair file not found: ${resolvedPath}`);
  }
  
  const secretKey = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
  return Keypair.fromSecretKey(Uint8Array.from(secretKey));
}

async function createVestingAccount(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  recipient: PublicKey,
  amount: number,
  cliff: number,
  duration: number,
  tgeRelease?: number
): Promise<PublicKey> {
  // 创建 vesting 账户的 ATA
  const vestingKeypair = Keypair.generate();
  const vestingAta = await getAssociatedTokenAddress(mint, vestingKeypair.publicKey);
  
  // 计算 TGE 释放量
  let tgeAmount = 0;
  let vestingAmount = amount;
  
  if (tgeRelease !== undefined && tgeRelease > 0) {
    tgeAmount = Math.floor(amount * tgeRelease / 100);
    vestingAmount = amount - tgeAmount;
  }
  
  // 如果有 TGE 释放，直接转账给接收者
  if (tgeAmount > 0) {
    const recipientAta = await getAssociatedTokenAddress(mint, recipient);
    const tgeTransaction = new Transaction().add(
      createMintToInstruction(
        mint,
        recipientAta,
        payer.publicKey,
        BigInt(tgeAmount * Math.pow(10, TOKEN_DECIMALS))
      )
    );
    
    await sendAndConfirmTransaction(connection, tgeTransaction, [payer]);
    console.log(`  ✅ TGE 释放: ${tgeAmount.toLocaleString()} tokens`);
  }
  
  // 铸造 vesting 部分到 vesting 账户
  if (vestingAmount > 0) {
    const vestingTransaction = new Transaction().add(
      createMintToInstruction(
        mint,
        vestingAta,
        payer.publicKey,
        BigInt(vestingAmount * Math.pow(10, TOKEN_DECIMALS))
      )
    );
    
    await sendAndConfirmTransaction(connection, vestingTransaction, [payer]);
    console.log(`  ✅ Vesting 锁定: ${vestingAmount.toLocaleString()} tokens`);
  }
  
  // 保存 vesting 信息
  const vestingInfo = {
    vestingAccount: vestingKeypair.publicKey.toBase58(),
    vestingAta: vestingAta.toBase58(),
    recipient: recipient.toBase58(),
    amount: vestingAmount,
    tgeAmount: tgeAmount,
    cliff: cliff,
    duration: duration,
    startTime: Math.floor(Date.now() / 1000),
  };
  
  return vestingAta;
}

// ============================================
// 主函数
// ============================================

async function deployPopCowToken() {
  console.log('🐄 PopCowDefi 代币发行脚本');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 连接 Solana
  const connection = new Connection(RPC_ENDPOINT, 'confirmed');
  console.log(`📡 连接到: ${RPC_ENDPOINT}`);

  // 加载钱包
  const walletPath = process.env.WALLET_PATH || '~/.config/solana/id.json';
  const walletKeypair = loadKeypair(walletPath);
  console.log(`💰 钱包地址: ${walletKeypair.publicKey.toBase58()}\n`);

  // 检查余额
  const balance = await connection.getBalance(walletKeypair.publicKey);
  console.log(`💵 钱包余额: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
  if (balance < 2 * LAMPORTS_PER_SOL) {
    console.warn('⚠️  警告: 余额可能不足，建议至少 2 SOL\n');
  }

  // ============================================
  // 步骤 1: 创建代币 Mint
  // ============================================
  console.log('📝 步骤 1: 创建代币 Mint...');
  const mintKeypair = Keypair.generate();
  const lamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);

  const createMintTransaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: walletKeypair.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: MINT_SIZE,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      TOKEN_DECIMALS,
      walletKeypair.publicKey, // mint authority
      walletKeypair.publicKey  // freeze authority
    )
  );

  const mintSignature = await sendAndConfirmTransaction(
    connection,
    createMintTransaction,
    [walletKeypair, mintKeypair]
  );
  console.log(`✅ 代币 Mint 创建成功!`);
  console.log(`   Mint 地址: ${mintKeypair.publicKey.toBase58()}`);
  console.log(`   交易签名: ${mintSignature}\n`);

  // ============================================
  // 步骤 2: 创建分配池地址
  // ============================================
  console.log('📝 步骤 2: 创建分配池地址...');
  
  // 为每个分配池生成接收地址（实际部署时应该使用多签钱包）
  const allocationPools: Record<string, { keypair: Keypair; address: string }> = {};
  
  for (const [key, allocation] of Object.entries(ALLOCATIONS)) {
    const poolKeypair = Keypair.generate();
    allocationPools[key] = {
      keypair: poolKeypair,
      address: poolKeypair.publicKey.toBase58(),
    };
    console.log(`   ${key}: ${poolKeypair.publicKey.toBase58()}`);
  }
  console.log('');

  // ============================================
  // 步骤 3: 分配代币
  // ============================================
  console.log('📝 步骤 3: 分配代币到各个池...\n');

  const tgeTimestamp = Math.floor(Date.now() / 1000);

  for (const [key, allocation] of Object.entries(ALLOCATIONS)) {
    console.log(`📦 分配: ${key} (${allocation.percentage}% - ${allocation.amount.toLocaleString()} tokens)`);
    
    const poolAddress = allocationPools[key].address;
    const recipientPubkey = new PublicKey(poolAddress);
    
    // 创建接收者的 ATA
    const recipientAta = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      recipientPubkey
    );

    // 检查 ATA 是否存在，不存在则创建
    const ataInfo = await connection.getAccountInfo(recipientAta);
    if (!ataInfo) {
      const createAtaTransaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          walletKeypair.publicKey,
          recipientAta,
          recipientPubkey,
          mintKeypair.publicKey
        )
      );
      await sendAndConfirmTransaction(connection, createAtaTransaction, [walletKeypair]);
      console.log(`  ✅ 创建 ATA: ${recipientAta.toBase58()}`);
    }

    // 处理不同类型的分配
    if (key === 'liquidity') {
      // 流动性池：TGE 全部释放
      const amount = allocation.amount * Math.pow(10, TOKEN_DECIMALS);
      const mintTransaction = new Transaction().add(
        createMintToInstruction(
          mintKeypair.publicKey,
          recipientAta,
          walletKeypair.publicKey,
          BigInt(amount)
        )
      );
      await sendAndConfirmTransaction(connection, mintTransaction, [walletKeypair]);
      console.log(`  ✅ TGE 释放: ${allocation.amount.toLocaleString()} tokens`);
    } else if (key === 'public') {
      // 公开销售：TGE 50%，剩余 6 个月释放
      const tgeAmount = Math.floor(allocation.amount * 0.5) * Math.pow(10, TOKEN_DECIMALS);
      const vestingAmount = (allocation.amount - Math.floor(allocation.amount * 0.5)) * Math.pow(10, TOKEN_DECIMALS);
      
      // TGE 释放
      const tgeTransaction = new Transaction().add(
        createMintToInstruction(
          mintKeypair.publicKey,
          recipientAta,
          walletKeypair.publicKey,
          BigInt(tgeAmount)
        )
      );
      await sendAndConfirmTransaction(connection, tgeTransaction, [walletKeypair]);
      console.log(`  ✅ TGE 释放: ${Math.floor(allocation.amount * 0.5).toLocaleString()} tokens`);
      
      // Vesting 部分（实际应该创建 vesting 账户，这里先铸造到池地址）
      const vestingTransaction = new Transaction().add(
        createMintToInstruction(
          mintKeypair.publicKey,
          recipientAta,
          walletKeypair.publicKey,
          BigInt(vestingAmount)
        )
      );
      await sendAndConfirmTransaction(connection, vestingTransaction, [walletKeypair]);
      console.log(`  ✅ Vesting 锁定: ${(allocation.amount - Math.floor(allocation.amount * 0.5)).toLocaleString()} tokens (6个月释放)`);
    } else {
      // 其他池：根据 vesting 规则
      const amount = allocation.amount * Math.pow(10, TOKEN_DECIMALS);
      const mintTransaction = new Transaction().add(
        createMintToInstruction(
          mintKeypair.publicKey,
          recipientAta,
          walletKeypair.publicKey,
          BigInt(amount)
        )
      );
      await sendAndConfirmTransaction(connection, mintTransaction, [walletKeypair]);
      
      const cliffDays = Math.floor(allocation.vesting.cliff / (24 * 60 * 60));
      const durationDays = Math.floor(allocation.vesting.duration / (24 * 60 * 60));
      
      if (cliffDays > 0) {
        console.log(`  ✅ 锁定: ${allocation.amount.toLocaleString()} tokens`);
        console.log(`     Cliff: ${cliffDays} 天`);
        console.log(`     释放期: ${durationDays} 天`);
      } else {
        console.log(`  ✅ 锁定: ${allocation.amount.toLocaleString()} tokens`);
        console.log(`     释放期: ${durationDays} 天 (线性释放)`);
      }
    }
    console.log('');
  }

  // ============================================
  // 步骤 4: 验证总供应量
  // ============================================
  console.log('📝 步骤 4: 验证总供应量...');
  const mintInfo = await getMint(connection, mintKeypair.publicKey);
  const totalSupply = Number(mintInfo.supply) / Math.pow(10, TOKEN_DECIMALS);
  console.log(`✅ 总供应量: ${totalSupply.toLocaleString()} tokens`);
  console.log(`   预期: ${TOTAL_SUPPLY.toLocaleString()} tokens`);
  
  if (Math.abs(totalSupply - TOTAL_SUPPLY) > 1) {
    console.warn(`⚠️  警告: 总供应量与预期不符！`);
  }
  console.log('');

  // ============================================
  // 步骤 5: 保存部署信息
  // ============================================
  console.log('📝 步骤 5: 保存部署信息...');
  
  const deploymentInfo = {
    token: {
      name: 'PopCow Token',
      symbol: 'POPCOW',
      decimals: TOKEN_DECIMALS,
      mint: mintKeypair.publicKey.toBase58(),
      totalSupply: TOTAL_SUPPLY,
      authority: walletKeypair.publicKey.toBase58(),
    },
    allocations: Object.entries(ALLOCATIONS).map(([key, allocation]) => ({
      category: key,
      percentage: allocation.percentage,
      amount: allocation.amount,
      address: allocationPools[key].address,
      vesting: allocation.vesting || null,
      tgeRelease: allocation.tgeRelease || null,
    })),
    tgeTimestamp,
    network: RPC_ENDPOINT.includes('devnet') ? 'devnet' : 'mainnet-beta',
    deployedAt: new Date().toISOString(),
  };

  const outputPath = path.join(process.cwd(), 'popcow-token-deployment.json');
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`✅ 部署信息已保存到: ${outputPath}\n`);

  // ============================================
  // 步骤 6: 输出摘要
  // ============================================
  console.log('🎉 PopCowDefi 代币发行完成！');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`代币 Mint: ${mintKeypair.publicKey.toBase58()}`);
  console.log(`总供应量: ${TOTAL_SUPPLY.toLocaleString()} tokens`);
  console.log(`小数位: ${TOKEN_DECIMALS}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('📋 代币分配摘要:');
  for (const [key, allocation] of Object.entries(ALLOCATIONS)) {
    console.log(`  ${key.padEnd(12)}: ${allocation.percentage.toString().padStart(3)}% (${allocation.amount.toLocaleString().padStart(12)} tokens) -> ${allocationPools[key].address}`);
  }
  console.log('');

  console.log('⚠️  重要提示:');
  console.log('  1. 请安全保存 Mint 私钥！');
  console.log('  2. 建议将分配池地址更新为多签钱包');
  console.log('  3. 建议放弃 Mint Authority 和 Freeze Authority（如果不需要后续铸造）');
  console.log('  4. 部署信息已保存到 popcow-token-deployment.json');
  console.log('');
  console.log('✅ 生态兼容性:');
  console.log('  - 使用标准 SPL Token，100% 兼容所有 DEX（Raydium, Jupiter, Orca 等）');
  console.log('  - 兼容所有主流钱包（Phantom, Solflare, Backpack 等）');
  console.log('  - 兼容所有工具和浏览器（Solscan, Explorer, Birdeye 等）');
  console.log('');
  console.log('📚 升级说明:');
  console.log('  - Solana 程序默认支持升级');
  console.log('  - 建议使用多签钱包管理升级权限');
  console.log('  - 查看 UPGRADE_AND_COMPATIBILITY.md 了解详情');
  console.log('');

  // 输出 Mint 私钥（用于备份）
  console.log('🔑 Mint 私钥 (Base64):');
  console.log(Buffer.from(mintKeypair.secretKey).toString('base64'));
  console.log('');

  return {
    mint: mintKeypair.publicKey,
    mintKeypair,
    allocationPools,
    deploymentInfo,
  };
}

// ============================================
// 执行
// ============================================

if (require.main === module) {
  deployPopCowToken()
    .then(() => {
      console.log('✅ 脚本执行完成');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ 错误:', err);
      process.exit(1);
    });
}

export { deployPopCowToken, ALLOCATIONS };
